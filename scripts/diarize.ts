import { parseArgs } from "util";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { basename, dirname, join } from "path";

const API_BASE = "https://api.pyannote.ai/v1";

function getApiKey(): string {
  const key = process.env.PYANNOTE_API_KEY;
  if (!key) {
    console.error("Error: PYANNOTE_API_KEY environment variable is not set.");
    process.exit(1);
  }
  return key;
}

interface Segment {
  start: number;
  end: number;
  text: string;
}

interface DiarizationTurn {
  start: number;
  end: number;
  speaker: string;
}

interface DiarizedSegment {
  start: number;
  end: number;
  speaker: string;
  text: string;
}

function loadTranscription(path: string): Segment[] {
  const data = JSON.parse(readFileSync(path, "utf-8"));
  return data.segments ?? [];
}

async function uploadMedia(
  filePath: string,
  apiKey: string,
): Promise<string> {
  const mediaKey = `media://${basename(filePath)}`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Request a presigned upload URL
  const resp = await fetch(`${API_BASE}/media/input`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: mediaKey }),
  });

  if (resp.status !== 201) {
    console.error(`Error requesting upload URL: ${resp.status} ${await resp.text()}`);
    process.exit(1);
  }

  const { url: presignedUrl } = await resp.json();

  // Upload the file via PUT
  const fileBuffer = readFileSync(filePath);
  const putResp = await fetch(presignedUrl, {
    method: "PUT",
    body: fileBuffer,
  });

  if (!putResp.ok) {
    console.error(`Error uploading file: ${putResp.status} ${await putResp.text()}`);
    process.exit(1);
  }

  console.log(`Uploaded ${basename(filePath)} to pyannote media storage`);
  return mediaKey;
}

async function resolveAudioUrl(
  audioInput: string,
  apiKey: string,
): Promise<string> {
  if (audioInput.startsWith("http://") || audioInput.startsWith("https://")) {
    return audioInput;
  }
  if (existsSync(audioInput)) {
    return await uploadMedia(audioInput, apiKey);
  }
  console.error(`Error: "${audioInput}" is not a valid URL or local file`);
  process.exit(1);
}

async function submitDiarization(
  audioUrl: string,
  apiKey: string,
  numSpeakers?: number,
): Promise<string> {
  const payload: Record<string, unknown> = { url: audioUrl };
  if (numSpeakers) payload.numSpeakers = numSpeakers;

  const resp = await fetch(`${API_BASE}/diarize`, {
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
  return data.jobId;
}

async function pollJob(
  jobId: string,
  apiKey: string,
  interval = 5000,
): Promise<Record<string, unknown>> {
  const url = `${API_BASE}/jobs/${jobId}`;
  const headers = { Authorization: `Bearer ${apiKey}` };

  while (true) {
    const resp = await fetch(url, { headers });
    if (resp.status !== 200) {
      console.error(`Error polling job: ${resp.status} ${await resp.text()}`);
      process.exit(1);
    }

    const data = await resp.json();
    const status = data.status as string;

    if (status === "succeeded") return data;
    if (status === "failed" || status === "canceled") {
      console.error(`Job ${status}:`, JSON.stringify(data));
      process.exit(1);
    }

    console.log(`Status: ${status} — waiting ${interval / 1000}s...`);
    await new Promise((r) => setTimeout(r, interval));
  }
}

function assignSpeakers(
  segments: Segment[],
  diarization: DiarizationTurn[],
): DiarizedSegment[] {
  return segments.map((seg) => {
    let bestSpeaker = "UNKNOWN";
    let bestOverlap = 0;
    for (const turn of diarization) {
      const overlap = Math.max(
        0,
        Math.min(seg.end, turn.end) - Math.max(seg.start, turn.start),
      );
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestSpeaker = turn.speaker;
      }
    }
    return {
      start: seg.start,
      end: seg.end,
      speaker: bestSpeaker,
      text: seg.text.trim(),
    };
  });
}

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "num-speakers": { type: "string", short: "n" },
    "output-dir": { type: "string", short: "o" },
  },
  allowPositionals: true,
});

if (positionals.length < 2) {
  console.error(
    "Usage: bun run diarize.ts <audio_file_or_url> <transcription.json> [-n num_speakers] [-o output_dir]",
  );
  process.exit(1);
}

const [audioInput, transcriptionPath] = positionals;
const numSpeakers = values["num-speakers"]
  ? parseInt(values["num-speakers"])
  : undefined;
const apiKey = getApiKey();
const segments = loadTranscription(transcriptionPath);

const audioUrl = await resolveAudioUrl(audioInput, apiKey);
console.log(`Submitting diarization job for: ${audioUrl}`);
const jobId = await submitDiarization(audioUrl, apiKey, numSpeakers);
console.log(`Job created: ${jobId}`);

const result = await pollJob(jobId, apiKey);
const diarization = (result.output as { diarization: DiarizationTurn[] })
  .diarization;
const diarizedSegments = assignSpeakers(segments, diarization);

const stem = basename(transcriptionPath, ".json").replace("_transcription", "");
const outDir = values["output-dir"] ?? dirname(transcriptionPath);
mkdirSync(outDir, { recursive: true });

const jsonPath = join(outDir, `${stem}_diarized.json`);
writeFileSync(jsonPath, JSON.stringify(diarizedSegments, null, 2));
console.log(`Diarized JSON saved to: ${jsonPath}`);

const txtPath = join(outDir, `${stem}_diarized.txt`);
const txtContent = diarizedSegments
  .map(
    (s) =>
      `[${s.start.toFixed(2)} -> ${s.end.toFixed(2)}] ${s.speaker}: ${s.text}`,
  )
  .join("\n");
writeFileSync(txtPath, txtContent + "\n");
console.log(`Diarized text saved to: ${txtPath}`);
