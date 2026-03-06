# /// script
# requires-python = ">=3.11"
# dependencies = ["mlx-whisper"]
# ///
"""Transcribe audio using mlx-whisper, optimized for Apple Silicon."""

import argparse
import json
import sys
from pathlib import Path

import mlx_whisper


def transcribe(audio_path: str, model: str, language: str | None, output_dir: str | None):
  path = Path(audio_path)
  if not path.exists():
    print(f"Error: file not found: {audio_path}", file=sys.stderr)
    sys.exit(1)

  print(f"Transcribing: {path.name} (model: {model})")

  result = mlx_whisper.transcribe(
    str(path),
    path_or_hf_repo=model,
    language=language,
    word_timestamps=True,
  )

  out_dir = Path(output_dir) if output_dir else path.parent
  out_dir.mkdir(parents=True, exist_ok=True)

  json_path = out_dir / f"{path.stem}_transcription.json"
  with open(json_path, "w") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
  print(f"Full result saved to: {json_path}")

  txt_path = out_dir / f"{path.stem}_transcription.txt"
  with open(txt_path, "w") as f:
    for segment in result.get("segments", []):
      start = segment["start"]
      end = segment["end"]
      text = segment["text"].strip()
      f.write(f"[{start:.2f} -> {end:.2f}] {text}\n")
  print(f"Text saved to: {txt_path}")


if __name__ == "__main__":
  parser = argparse.ArgumentParser(description="Transcribe audio with mlx-whisper (Apple Silicon optimized)")
  parser.add_argument("audio", help="Path to audio file")
  parser.add_argument("-m", "--model", default="mlx-community/whisper-large-v3-turbo", help="Model repo (default: mlx-community/whisper-large-v3-turbo)")
  parser.add_argument("-l", "--language", default=None, help="Language code (e.g. en, es). Auto-detected if omitted.")
  parser.add_argument("-o", "--output-dir", default=None, help="Output directory (default: same as audio file)")
  args = parser.parse_args()

  transcribe(args.audio, args.model, args.language, args.output_dir)
