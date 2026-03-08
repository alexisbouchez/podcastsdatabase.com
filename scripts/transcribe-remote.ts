import { parseArgs } from "util";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { basename, resolve } from "path";
import { createHmac } from "crypto";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

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

const PIPELINE_URL = process.env.PIPELINE_URL;
const PIPELINE_PASSWORD = process.env.PIPELINE_PASSWORD;

if (!PIPELINE_URL || !PIPELINE_PASSWORD) {
  console.error(
    "Error: PIPELINE_URL and PIPELINE_PASSWORD must be set (in .env.local or environment)",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Auth — replicate the Go HMAC cookie logic
// ---------------------------------------------------------------------------

function makeSessionCookie(password: string): string {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const sig = createHmac("sha256", password).update(day).digest("hex");
  return `pipeline_session=${day}:${sig}`;
}

const cookie = makeSessionCookie(PIPELINE_PASSWORD);

async function api(
  path: string,
  init?: RequestInit & { raw?: boolean },
): Promise<Response> {
  const url = `${PIPELINE_URL}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Cookie", cookie);
  if (!init?.raw) headers.set("Accept", "application/json");
  const resp = await fetch(url, { ...init, headers, redirect: "manual" });
  if (resp.status === 401 || resp.status === 303) {
    console.error("Error: authentication failed — check PIPELINE_PASSWORD");
    process.exit(1);
  }
  return resp;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    model: { type: "string", short: "m", default: "medium.en" },
    language: { type: "string", short: "l", default: "en" },
    "num-speakers": { type: "string", short: "n", default: "2" },
    "output-dir": { type: "string", short: "o" },
    "poll-interval": { type: "string", default: "5" },
  },
  allowPositionals: true,
});

if (positionals.length < 1) {
  console.error(
    "Usage: bun run scripts/transcribe-remote.ts <audio_file> [options]",
  );
  console.error("");
  console.error("Options:");
  console.error("  -m, --model <model>          Whisper model (default: medium.en)");
  console.error("  -l, --language <lang>        Language code (default: en)");
  console.error("  -n, --num-speakers <n>       Number of speakers (default: 2)");
  console.error("  -o, --output-dir <dir>       Output directory (default: same as audio)");
  console.error("  --poll-interval <seconds>    Poll interval (default: 5)");
  process.exit(1);
}

const audioPath = resolve(positionals[0]);
if (!existsSync(audioPath)) {
  console.error(`Error: file not found: ${audioPath}`);
  process.exit(1);
}

const model = values.model!;
const language = values.language!;
const numSpeakers = parseInt(values["num-speakers"]!);
const pollInterval = parseInt(values["poll-interval"]!) * 1000;
const outputDir = values["output-dir"]
  ? resolve(values["output-dir"])
  : resolve(audioPath, "..");

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

console.log(`Uploading ${basename(audioPath)} to ${PIPELINE_URL}...`);

const audioFile = Bun.file(audioPath);
const formData = new FormData();
formData.append("audio", audioFile, basename(audioPath));
formData.append("model", model);
formData.append("language", language);
formData.append("num_speakers", String(numSpeakers));

const createResp = await api("/jobs", { method: "POST", body: formData });
if (!createResp.ok) {
  console.error(`Error creating job: ${createResp.status} ${await createResp.text()}`);
  process.exit(1);
}

const { id: jobId } = (await createResp.json()) as { id: string };
console.log(`Job created: ${jobId}`);
console.log(`View at: ${PIPELINE_URL}/jobs/${jobId}`);

// ---------------------------------------------------------------------------
// Poll until done
// ---------------------------------------------------------------------------

type StatusResp = {
  id: string;
  status: string;
  progress: string;
  percent: number;
  elapsed_seconds: number;
  error: string;
};

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m${String(s).padStart(2, "0")}s` : `${s}s`;
}

const doneStatuses = new Set(["merged", "exported"]);
let lastLine = "";

while (true) {
  const resp = await api(`/jobs/${jobId}/status`);
  const data = (await resp.json()) as StatusResp;

  const elapsed = data.elapsed_seconds ? fmtDuration(data.elapsed_seconds) : "";
  const pct = data.percent ? ` ${data.percent}%` : "";
  const prog = data.progress ? ` ${data.progress}` : "";
  const eta =
    data.percent > 0 && data.percent < 100 && data.elapsed_seconds > 0
      ? ` (eta ~${fmtDuration(Math.round((data.elapsed_seconds / data.percent) * (100 - data.percent)))})`
      : "";

  const line = `[${elapsed}] ${data.status}${pct}${prog}${eta}`;
  if (line !== lastLine) {
    process.stdout.write(`\r\x1b[K${line}`);
    lastLine = line;
  }

  if (data.status === "failed") {
    console.error(`\nPipeline failed: ${data.error}`);
    process.exit(1);
  }

  if (doneStatuses.has(data.status)) {
    console.log("");
    break;
  }

  await new Promise((r) => setTimeout(r, pollInterval));
}

// ---------------------------------------------------------------------------
// Download export
// ---------------------------------------------------------------------------

console.log("Downloading segments...");

const exportResp = await api(`/jobs/${jobId}/export`);
if (!exportResp.ok) {
  console.error(`Error exporting: ${exportResp.status} ${await exportResp.text()}`);
  process.exit(1);
}

const exportData = (await exportResp.json()) as {
  segments: { start: number; end: number; speaker: string; text: string }[];
  speakers: string[];
};

const stem = basename(audioPath).replace(/\.[^.]+$/, "");

// Save diarized JSON (same format as local diarize.ts output)
const jsonPath = resolve(outputDir, `${stem}_diarized.json`);
writeFileSync(jsonPath, JSON.stringify(exportData.segments, null, 2));
console.log(`Diarized JSON saved to: ${jsonPath}`);

// Save readable text
const txtPath = resolve(outputDir, `${stem}_diarized.txt`);
const txtContent = exportData.segments
  .map(
    (s) =>
      `[${s.start.toFixed(2)} -> ${s.end.toFixed(2)}] ${s.speaker}: ${s.text}`,
  )
  .join("\n");
writeFileSync(txtPath, txtContent + "\n");
console.log(`Diarized text saved to: ${txtPath}`);

// Save full episode JSON (for podcastsdatabase.com)
const episodePath = resolve(outputDir, `${stem}_episode.json`);
writeFileSync(episodePath, JSON.stringify(exportData, null, 2));
console.log(`Episode JSON saved to: ${episodePath}`);

console.log("Done!");
