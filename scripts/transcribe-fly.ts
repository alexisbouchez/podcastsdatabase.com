import { parseArgs } from "util";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, basename } from "path";

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

const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
const HF_TOKEN = process.env.HF_TOKEN || process.env.PYANNOTE_API_KEY;
const FLY_APP = process.env.FLY_APP || "pdb-transcriber";

if (!FLY_API_TOKEN) {
  console.error("Error: FLY_API_TOKEN must be set in .env.local");
  process.exit(1);
}
if (!HF_TOKEN) {
  console.error("Error: HF_TOKEN must be set in .env.local");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fly Machines API
// ---------------------------------------------------------------------------

const FLY_API = "https://api.machines.dev/v1";

async function flyApi(path: string, init?: RequestInit): Promise<Response> {
  const url = `${FLY_API}/apps/${FLY_APP}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${FLY_API_TOKEN}`);
  headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers });
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
    "poll-interval": { type: "string", default: "10" },
    batch: { type: "boolean", short: "b", default: false },
    "max-concurrent": { type: "string", default: "3" },
  },
  allowPositionals: true,
});

if (positionals.length < 1) {
  console.error(
    "Usage: bun run scripts/transcribe-fly.ts <url> [url2 url3 ...] [options]",
  );
  console.error("");
  console.error("Options:");
  console.error(
    "  -m, --model <model>          Whisper model (default: medium.en)",
  );
  console.error(
    "  -l, --language <lang>        Language code (default: en)",
  );
  console.error(
    "  -n, --num-speakers <n>       Number of speakers (default: 2)",
  );
  console.error(
    "  -o, --output-dir <dir>       Output directory (default: current dir)",
  );
  console.error(
    "  --poll-interval <seconds>    Poll interval (default: 10)",
  );
  console.error(
    "  --max-concurrent <n>         Max concurrent machines (default: 3)",
  );
  process.exit(1);
}

const urls = positionals;
const model = values.model!;
const language = values.language!;
const numSpeakers = parseInt(values["num-speakers"]!);
const pollInterval = parseInt(values["poll-interval"]!) * 1000;
const maxConcurrent = parseInt(values["max-concurrent"]!);
const outputDir = values["output-dir"]
  ? resolve(values["output-dir"])
  : process.cwd();

// ---------------------------------------------------------------------------
// Machine management
// ---------------------------------------------------------------------------

interface MachineJob {
  url: string;
  machineId: string;
  machineIp: string;
  startedAt: number;
  status: string;
  title?: string;
}

const FLY_IMAGE = process.env.FLY_IMAGE || `registry.fly.io/${FLY_APP}:deployment-01KK9EK6SM1A4PBSDQMP13W8Q9`;

async function createMachine(audioUrl: string): Promise<MachineJob> {
  const image = FLY_IMAGE;
  const resp = await flyApi("/machines", {
    method: "POST",
    body: JSON.stringify({
      config: {
        image,
        env: {
          AUDIO_URL: audioUrl,
          NUM_SPEAKERS: String(numSpeakers),
          LANGUAGE: language,
          WHISPER_MODEL: model,
          HF_TOKEN: HF_TOKEN,
          OUTPUT_PORT: "8080",
        },
        guest: {
          cpus: 8,
          cpu_kind: "performance",
          memory_mb: 32768,
          gpu_kind: "a10",
          gpus: 1,
        },
        auto_destroy: true,
        services: [
          {
            ports: [{ port: 443, handlers: ["tls", "http"] }],
            protocol: "tcp",
            internal_port: 8080,
          },
        ],
      },
      region: "ord",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to create machine: ${resp.status} ${text}`);
  }

  const data = (await resp.json()) as Record<string, string>;
  return {
    url: audioUrl,
    machineId: data.id,
    machineIp: data.private_ip || "",
    startedAt: Date.now(),
    status: "starting",
  };
}

async function getMachineStatus(
  job: MachineJob,
): Promise<{ step: string; message: string; percent: number; done: boolean; error: string } | null> {
  try {
    // Use Fly proxy to reach the machine's HTTP service
    // Can't reach internal IPs from outside — use the app's public domain with machine ID header
    const resp = await fetch(
      `https://${FLY_APP}.fly.dev/status`,
      {
        headers: {
          "fly-force-instance-id": job.machineId,
        },
      },
    );
    if (!resp.ok) return null;
    return (await resp.json()) as { step: string; message: string; percent: number; done: boolean; error: string };
  } catch {
    return null;
  }
}

async function getResult(
  job: MachineJob,
): Promise<{ segments: { start: number; end: number; speaker: string; text: string }[]; title: string; speakers: string[] } | null> {
  try {
    const resp = await fetch(
      `https://${FLY_APP}.fly.dev/result`,
      {
        headers: {
          "fly-force-instance-id": job.machineId,
        },
      },
    );
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

async function destroyMachine(machineId: string) {
  try {
    // Stop first
    await flyApi(`/machines/${machineId}/stop`, { method: "POST" });
    await new Promise((r) => setTimeout(r, 2000));
    await flyApi(`/machines/${machineId}?force=true`, { method: "DELETE" });
  } catch {
    // Ignore cleanup errors
  }
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function fmtDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0
    ? `${m}m${String(s).padStart(2, "0")}s`
    : `${s}s`;
}

function urlLabel(url: string): string {
  const m = url.match(/friends[/-](\d+)/);
  if (m) return `ep${m[1]}`;
  // For anchor.fm / cloudfront URLs, extract the unique filename part
  const cfMatch = url.match(/\/(\d+-\d+-\d+-[a-f0-9]+)\.\w+/);
  if (cfMatch) return cfMatch[1];
  // For other encoded URLs, try decoding first
  try {
    const decoded = decodeURIComponent(url);
    const decodedBase = basename(decoded);
    if (decodedBase.length > 5) return decodedBase.replace(/\.\w+$/, "").slice(0, 40);
  } catch {}
  return basename(url).slice(0, 40);
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function processAll() {
  const pending = [...urls];
  const active: MachineJob[] = [];
  const completed: string[] = [];
  const failed: string[] = [];

  console.log(
    `\nStarting ${urls.length} transcription jobs on Fly.io (max ${maxConcurrent} concurrent)`,
  );
  console.log(`Model: ${model}, Language: ${language}, Speakers: ${numSpeakers}\n`);

  while (pending.length > 0 || active.length > 0) {
    // Launch new machines up to max
    while (pending.length > 0 && active.length < maxConcurrent) {
      const url = pending.shift()!;
      const label = urlLabel(url);
      try {
        console.log(`[${label}] Creating machine...`);
        const job = await createMachine(url);
        console.log(`[${label}] Machine ${job.machineId} created`);
        active.push(job);
      } catch (err: unknown) {
        console.error(`[${label}] Failed to create: ${err instanceof Error ? err.message : err}`);
        failed.push(url);
      }
    }

    // Poll active machines
    await new Promise((r) => setTimeout(r, pollInterval));

    for (let i = active.length - 1; i >= 0; i--) {
      const job = active[i];
      const label = urlLabel(job.url);
      const elapsed = fmtDuration(Date.now() - job.startedAt);

      const status = await getMachineStatus(job);
      if (!status) {
        // Machine might still be starting
        if (Date.now() - job.startedAt > 600_000) {
          console.error(`[${label}] Timeout after ${elapsed}, destroying`);
          await destroyMachine(job.machineId);
          active.splice(i, 1);
          failed.push(job.url);
        }
        continue;
      }

      const pct = status.percent ? ` ${status.percent}%` : "";
      process.stdout.write(
        `\r\x1b[K[${label}] ${elapsed} ${status.step}${pct} ${status.message || ""}`,
      );

      if (status.done) {
        console.log(""); // newline after progress

        if (status.error) {
          console.error(`[${label}] FAILED: ${status.error}`);
          await destroyMachine(job.machineId);
          active.splice(i, 1);
          failed.push(job.url);
          continue;
        }

        // Download result
        const result = await getResult(job);
        if (result) {
          const stem = urlLabel(job.url);
          const jsonPath = resolve(outputDir, `${stem}_diarized.json`);
          writeFileSync(jsonPath, JSON.stringify(result.segments, null, 2));
          console.log(`[${label}] Saved: ${jsonPath}`);

          // Save readable text
          const txtPath = resolve(outputDir, `${stem}_diarized.txt`);
          const txt = result.segments
            .map(
              (s: { start: number; end: number; speaker: string; text: string }) =>
                `[${s.start.toFixed(2)} -> ${s.end.toFixed(2)}] ${s.speaker}: ${s.text}`,
            )
            .join("\n");
          writeFileSync(txtPath, txt + "\n");

          // Save full episode JSON
          const epPath = resolve(outputDir, `${stem}_episode.json`);
          writeFileSync(epPath, JSON.stringify(result, null, 2));
          console.log(`[${label}] Episode JSON: ${epPath}`);

          completed.push(job.url);
        } else {
          console.error(`[${label}] Could not fetch result`);
          failed.push(job.url);
        }

        await destroyMachine(job.machineId);
        active.splice(i, 1);
      }
    }

    // Status summary
    if (active.length > 0) {
      const summary = active
        .map((j) => {
          const l = urlLabel(j.url);
          const e = fmtDuration(Date.now() - j.startedAt);
          return `${l}(${e})`;
        })
        .join(" ");
      process.stdout.write(
        `\r\x1b[K⚡ Active: ${active.length} | Pending: ${pending.length} | Done: ${completed.length} | Failed: ${failed.length} | ${summary}`,
      );
    }
  }

  console.log(`\n\n✓ Complete: ${completed.length} succeeded, ${failed.length} failed`);
  if (failed.length > 0) {
    console.log("Failed URLs:");
    failed.forEach((u) => console.log(`  - ${u}`));
  }
}

processAll().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
