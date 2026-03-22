/**
 * Full transcription + diarization using pyannote.ai's /v1/transcribe endpoint.
 * Usage: bun run scripts/transcribe-pyannote.ts <audio_url_or_file> [-n num_speakers] [-l language] [-o output_dir]
 */
import { parseArgs } from "util";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, basename } from "path";

function loadEnv() {
  const envPath = resolve(import.meta.dir, "../.env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^(\w+)=["']?(.+?)["']?$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

loadEnv();

const API_BASE = "https://api.pyannote.ai/v1";
const apiKey = process.env.PYANNOTE_API_KEY;
if (!apiKey) {
  console.error("Error: PYANNOTE_API_KEY is not set in .env.local");
  process.exit(1);
}

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "num-speakers": { type: "string", short: "n" },
    language: { type: "string", short: "l" },
    "output-dir": { type: "string", short: "o" },
    "poll-interval": { type: "string", default: "10" },
  },
  allowPositionals: true,
});

if (positionals.length < 1) {
  console.error(
    "Usage: bun run scripts/transcribe-pyannote.ts <audio_url_or_file> [-n num_speakers] [-l language] [-o output_dir]",
  );
  process.exit(1);
}

const audioInput = positionals[0];
const numSpeakers = values["num-speakers"] ? parseInt(values["num-speakers"]) : undefined;
const language = values["language"];
const pollInterval = parseInt(values["poll-interval"]!) * 1000;
const outputDir = values["output-dir"] ? resolve(values["output-dir"]) : process.cwd();
mkdirSync(outputDir, { recursive: true });

// ---------------------------------------------------------------------------
// Upload local file to pyannote media storage (if not a URL)
// ---------------------------------------------------------------------------

async function uploadMedia(filePath: string): Promise<string> {
  const mediaKey = `media://${basename(filePath)}`;
  const resp = await fetch(`${API_BASE}/media/input`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: mediaKey }),
  });

  if (resp.status !== 201) {
    console.error(`Error requesting upload URL: ${resp.status} ${await resp.text()}`);
    process.exit(1);
  }

  const { url: presignedUrl } = await resp.json();
  const fileBuffer = readFileSync(filePath);
  const putResp = await fetch(presignedUrl, { method: "PUT", body: fileBuffer });
  if (!putResp.ok) {
    console.error(`Error uploading file: ${putResp.status} ${await putResp.text()}`);
    process.exit(1);
  }
  console.log(`Uploaded ${basename(filePath)} to pyannote media storage`);
  return mediaKey;
}

async function resolveAudioUrl(input: string): Promise<string> {
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  if (existsSync(input)) return await uploadMedia(input);
  console.error(`Error: "${input}" is not a valid URL or local file`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Submit transcription job
// ---------------------------------------------------------------------------

async function submitTranscription(audioUrl: string): Promise<string> {
  const payload: Record<string, unknown> = { url: audioUrl };
  if (numSpeakers) payload.numSpeakers = numSpeakers;
  if (language) payload.language = language;

  console.log(`Submitting transcription job to pyannote.ai...`);
  console.log(`  URL: ${audioUrl}`);
  if (numSpeakers) console.log(`  Speakers: ${numSpeakers}`);
  if (language) console.log(`  Language: ${language}`);

  const resp = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    console.error(`Error submitting job: ${resp.status} ${await resp.text()}`);
    process.exit(1);
  }

  const data = await resp.json();
  console.log(`Job created: ${data.jobId}`);
  return data.jobId;
}

// ---------------------------------------------------------------------------
// Poll job
// ---------------------------------------------------------------------------

async function pollJob(jobId: string): Promise<Record<string, unknown>> {
  const url = `${API_BASE}/jobs/${jobId}`;
  const headers = { Authorization: `Bearer ${apiKey}` };
  let attempts = 0;

  while (true) {
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      console.error(`Error polling job: ${resp.status} ${await resp.text()}`);
      process.exit(1);
    }

    const data = await resp.json();
    const status = data.status as string;
    attempts++;

    process.stdout.write(`\r[${attempts * (pollInterval / 1000)}s] Status: ${status}    `);

    if (status === "succeeded") {
      console.log("");
      return data;
    }
    if (status === "failed" || status === "canceled") {
      console.error(`\nJob ${status}:`, JSON.stringify(data, null, 2));
      process.exit(1);
    }

    await new Promise((r) => setTimeout(r, pollInterval));
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const audioUrl = await resolveAudioUrl(audioInput);
const jobId = await submitTranscription(audioUrl);
const result = await pollJob(jobId);

console.log("\nJob succeeded. Processing output...");

// pyannote's /v1/transcribe returns output with `transcription` array
// Each item: { start, end, speaker, text }
const output = result.output as Record<string, unknown>;
console.log("Output keys:", Object.keys(output));

// The transcription field contains speaker-attributed segments
const transcription = (output.transcription ?? output.segments ?? []) as Array<{
  start: number;
  end: number;
  speaker?: string;
  text?: string;
  words?: Array<{ start: number; end: number; text: string; speaker?: string }>;
}>;

// Normalize to our segment format
interface DiarizedSegment {
  start: number;
  end: number;
  speaker: string;
  text: string;
}

let segments: DiarizedSegment[];

if (transcription.length > 0 && "text" in transcription[0]) {
  // Already has text per segment
  segments = transcription.map((s) => ({
    start: s.start,
    end: s.end,
    speaker: s.speaker ?? "UNKNOWN",
    text: (s.text ?? "").trim(),
  }));
} else {
  // May need to reconstruct from words
  console.log("Unexpected output format, saving raw output for inspection.");
  const rawPath = resolve(outputDir, "pyannote_raw_output.json");
  writeFileSync(rawPath, JSON.stringify(result, null, 2));
  console.log(`Raw output saved to: ${rawPath}`);
  process.exit(0);
}

// Merge consecutive same-speaker segments
const merged: DiarizedSegment[] = [];
for (const seg of segments) {
  const prev = merged[merged.length - 1];
  if (prev && prev.speaker === seg.speaker && seg.start - prev.end < 1.0) {
    prev.end = seg.end;
    prev.text = prev.text + " " + seg.text;
  } else {
    merged.push({ ...seg });
  }
}

const stem = basename(audioInput).replace(/\?.*$/, "").replace(/\.\w+$/, "") || "pyannote_transcription";
const jsonPath = resolve(outputDir, `${stem}_pyannote_diarized.json`);
writeFileSync(jsonPath, JSON.stringify(merged, null, 2));
console.log(`\nDiarized segments (${merged.length}): ${jsonPath}`);

const txtPath = resolve(outputDir, `${stem}_pyannote_diarized.txt`);
const txt = merged
  .map((s) => `[${s.start.toFixed(2)} -> ${s.end.toFixed(2)}] ${s.speaker}: ${s.text}`)
  .join("\n");
writeFileSync(txtPath, txt + "\n");
console.log(`Readable text: ${txtPath}`);

// Also save the raw result for reference
const rawPath = resolve(outputDir, `${stem}_pyannote_raw.json`);
writeFileSync(rawPath, JSON.stringify(result, null, 2));
console.log(`Raw pyannote output: ${rawPath}`);
