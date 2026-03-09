#!/usr/bin/env python3
"""
Transcription worker for Fly.io Machines.
Downloads audio via yt-dlp, transcribes with faster-whisper,
diarizes via pyannote API, merges segments, outputs JSON.

Environment variables:
  AUDIO_URL       - URL to download (yt-dlp compatible)
  NUM_SPEAKERS    - Number of speakers (default: 2)
  LANGUAGE        - Language code (default: en)
  WHISPER_MODEL   - Whisper model name (default: medium.en)
  PYANNOTE_API_KEY - pyannote.ai API key
  OUTPUT_PORT     - Port to serve results on (default: 8080)
"""

import json
import os
import subprocess
import sys
import time
import glob
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from threading import Thread

WORK_DIR = Path("/work")
WORK_DIR.mkdir(exist_ok=True)

status = {"step": "init", "message": "Starting...", "percent": 0, "done": False, "error": ""}
result_data = None


def log(msg):
    print(f"[worker] {msg}", flush=True)


def update(step, message, percent=0):
    global status
    status = {**status, "step": step, "message": message, "percent": percent}
    log(f"{step}: {message}")


# ── Step 0: Download ──────────────────────────────────────────────

def download(url):
    update("downloading", f"Downloading {url}...")
    audio_path = str(WORK_DIR / "audio.mp3")
    cmd = [
        "yt-dlp", "-x", "--audio-format", "mp3",
        "--audio-quality", "0",
        "-o", audio_path,
        "--no-playlist", "--no-progress",
        url,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"yt-dlp failed: {proc.stderr}")

    # yt-dlp may produce different filename
    if not os.path.exists(audio_path):
        candidates = glob.glob(str(WORK_DIR / "audio.*"))
        if candidates:
            os.rename(candidates[0], audio_path)

    # Get title
    title_proc = subprocess.run(
        ["yt-dlp", "--get-title", "--no-playlist", url],
        capture_output=True, text=True
    )
    title = title_proc.stdout.strip() if title_proc.returncode == 0 else url
    update("downloading", f"Downloaded: {title}")
    return audio_path, title


# ── Step 1: Transcribe ────────────────────────────────────────────

def transcribe(audio_path, model_name, language):
    update("transcribing", f"Loading {model_name} model...")

    from faster_whisper import WhisperModel

    # Use GPU if available, else CPU
    try:
        import ctranslate2
        ctranslate2.get_supported_compute_types("cuda")
        device, compute = "cuda", "float16"
    except Exception:
        device, compute = "cpu", "int8"
    log(f"Using device={device}, compute_type={compute}")

    model_dir = f"/models/faster-whisper-{model_name}"
    if os.path.isdir(model_dir):
        model = WhisperModel(model_dir, device=device, compute_type=compute)
    else:
        model = WhisperModel(model_name, device=device, compute_type=compute)

    update("transcribing", "Transcribing...")

    segments_iter, info = model.transcribe(
        audio_path,
        language=language if language != "auto" else None,
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
    )

    duration = info.duration
    segments = []
    for seg in segments_iter:
        segments.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        })
        pct = min(int((seg.end / duration) * 100), 99) if duration > 0 else 0
        update("transcribing", f"Transcribing... {pct}% ({len(segments)} segments)", pct)

    update("transcribing", f"Transcription complete: {len(segments)} segments", 100)

    transcription = {"segments": segments, "language": info.language, "duration": duration}
    out_path = WORK_DIR / "transcription.json"
    out_path.write_text(json.dumps(transcription, indent=2))
    return transcription


# ── Step 2: Diarize ───────────────────────────────────────────────

def diarize(audio_path, num_speakers, api_key):
    update("diarizing", "Loading pyannote model on GPU...")

    from pyannote.audio import Pipeline
    import torch
    import torchaudio

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    hf_token = os.environ.get("HF_TOKEN", api_key)

    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token,
    )
    pipeline.to(device)

    update("diarizing", "Loading audio and running diarization on GPU...")
    start_time = time.time()

    # Load audio as waveform to bypass TorchCodec/AudioDecoder issues
    waveform, sample_rate = torchaudio.load(audio_path)

    params = {}
    if num_speakers > 0:
        params["num_speakers"] = num_speakers

    diarization = pipeline({"waveform": waveform, "sample_rate": sample_rate}, **params)

    elapsed = int(time.time() - start_time)
    update("diarizing", f"Diarization complete ({elapsed}s)")

    # Convert to same format as pyannote API response
    turns = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        turns.append({
            "start": round(turn.start, 3),
            "end": round(turn.end, 3),
            "speaker": speaker,
        })

    return {"output": {"diarization": turns}}


# ── Step 3: Merge ─────────────────────────────────────────────────

def merge_segments(transcription, diarization):
    update("merging", "Assigning speakers and merging...")

    turns = diarization["output"]["diarization"]

    def find_speaker(start, end):
        best, best_overlap = "UNKNOWN", 0.0
        for turn in turns:
            overlap = min(end, turn["end"]) - max(start, turn["start"])
            if overlap > best_overlap:
                best_overlap = overlap
                best = turn["speaker"]
        return best

    # Assign speakers
    segments = []
    for seg in transcription["segments"]:
        speaker = find_speaker(seg["start"], seg["end"])
        segments.append({
            "start": seg["start"],
            "end": seg["end"],
            "speaker": speaker,
            "text": seg["text"],
        })

    # Merge consecutive same-speaker
    merged = []
    for seg in segments:
        if merged and merged[-1]["speaker"] == seg["speaker"]:
            merged[-1]["end"] = seg["end"]
            merged[-1]["text"] += " " + seg["text"]
        else:
            merged.append(dict(seg))

    update("merging", f"Merged into {len(merged)} segments")
    return merged


# ── HTTP server to serve results ──────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(status).encode())
        elif self.path == "/result" and result_data is not None:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result_data).encode())
        elif self.path == "/result":
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error":"not ready"}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # suppress request logs


def start_server(port):
    server = HTTPServer(("0.0.0.0", port), Handler)
    server.serve_forever()


# ── Main ──────────────────────────────────────────────────────────

def main():
    global result_data, status

    url = os.environ.get("AUDIO_URL", "")
    num_speakers = int(os.environ.get("NUM_SPEAKERS", "2"))
    language = os.environ.get("LANGUAGE", "en")
    model_name = os.environ.get("WHISPER_MODEL", "medium.en")
    api_key = os.environ.get("HF_TOKEN", os.environ.get("PYANNOTE_API_KEY", ""))
    port = int(os.environ.get("OUTPUT_PORT", "8080"))

    if not url:
        log("ERROR: AUDIO_URL not set")
        status = {**status, "done": True, "error": "AUDIO_URL not set"}
        return

    # Start HTTP server in background
    Thread(target=start_server, args=(port,), daemon=True).start()
    log(f"Status server on :{port}")

    try:
        audio_path, title = download(url)
        transcription = transcribe(audio_path, model_name, language)
        diarization = diarize(audio_path, num_speakers, api_key)
        segments = merge_segments(transcription, diarization)

        # Build unique speakers list
        seen = set()
        speakers = []
        for seg in segments:
            if seg["speaker"] not in seen:
                seen.add(seg["speaker"])
                speakers.append(seg["speaker"])

        result_data = {
            "title": title,
            "speakers": speakers,
            "segments": segments,
        }

        status = {"step": "done", "message": f"Complete: {len(segments)} segments", "percent": 100, "done": True, "error": ""}
        log(f"Done! {len(segments)} segments, {len(speakers)} speakers")

        # Keep server alive for result pickup
        while True:
            time.sleep(60)

    except Exception as e:
        log(f"ERROR: {e}")
        status = {**status, "done": True, "error": str(e)}
        # Keep alive briefly for error pickup
        time.sleep(300)


if __name__ == "__main__":
    main()
