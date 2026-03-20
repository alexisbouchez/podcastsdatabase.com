"use client";

import { useState, useEffect } from "react";
import { Breadcrumbs } from "../components/breadcrumbs";

// ─── types ────────────────────────────────────────────────────────────────────

interface DiarizationTurn {
  start: number;
  end: number;
  speaker: string;
}

type JobStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "polling"; jobId: string; step?: string }
  | { kind: "done"; turns: DiarizationTurn[] }
  | { kind: "error"; message: string };

// ─── constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 4000;

const SPEAKER_COLORS: string[] = [
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#10b981", // emerald
  "#a855f7", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
];

function speakerColor(speaker: string, speakers: string[]): string {
  return SPEAKER_COLORS[speakers.indexOf(speaker) % SPEAKER_COLORS.length];
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDuration(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

function uniqueSpeakers(turns: DiarizationTurn[]): string[] {
  return Array.from(new Set(turns.map((t) => t.speaker))).sort();
}

function talkTime(speaker: string, turns: DiarizationTurn[]): number {
  return turns
    .filter((t) => t.speaker === speaker)
    .reduce((acc, t) => acc + (t.end - t.start), 0);
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SpeakerTimeline({
  turns,
  speakers,
}: {
  turns: DiarizationTurn[];
  speakers: string[];
}) {
  const total = Math.max(...turns.map((t) => t.end), 1);

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">
        Timeline
      </h2>
      <div className="space-y-2">
        {speakers.map((spk) => {
          const color = speakerColor(spk, speakers);
          return (
            <div key={spk} className="flex items-center gap-3">
              <span
                className="text-xs font-semibold w-28 shrink-0 truncate"
                style={{ color }}
              >
                {spk}
              </span>
              <div className="relative h-5 flex-1 bg-foreground/5 rounded overflow-hidden">
                {turns
                  .filter((t) => t.speaker === spk)
                  .map((t, i) => (
                    <div
                      key={i}
                      className="absolute inset-y-0 rounded-sm"
                      style={{
                        left: `${(t.start / total) * 100}%`,
                        width: `${Math.max(0.3, ((t.end - t.start) / total) * 100)}%`,
                        backgroundColor: color,
                        opacity: 0.85,
                      }}
                      title={`${spk}: ${formatTime(t.start)} → ${formatTime(t.end)}`}
                    />
                  ))}
              </div>
              <span className="text-xs text-foreground/40 w-16 text-right shrink-0">
                {formatDuration(talkTime(spk, turns))}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-xs text-foreground/30">
        <span>0:00</span>
        <span>{formatTime(total / 2)}</span>
        <span>{formatTime(total)}</span>
      </div>
    </div>
  );
}

function TurnList({
  turns,
  speakers,
}: {
  turns: DiarizationTurn[];
  speakers: string[];
}) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">
        Speaker turns
        <span className="ml-2 font-normal normal-case">
          ({turns.length} segments)
        </span>
      </h2>
      <ol className="border-t border-foreground/10 divide-y divide-foreground/5">
        {turns.map((t, i) => {
          const color = speakerColor(t.speaker, speakers);
          return (
            <li key={i} className="py-2 flex items-center gap-3 text-sm">
              <span className="tabular-nums text-xs text-foreground/40 w-24 shrink-0">
                {formatTime(t.start)} → {formatTime(t.end)}
              </span>
              <span
                className="text-xs font-semibold w-28 shrink-0 truncate"
                style={{ color }}
              >
                {t.speaker}
              </span>
              <span className="text-xs text-foreground/40">
                {formatDuration(t.end - t.start)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<JobStatus>({ kind: "idle" });

  // Active job ID to drive polling effect
  const activeJobId =
    status.kind === "polling" ? status.jobId : null;

  useEffect(() => {
    if (!activeJobId) return;

    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/submit/${activeJobId}`);
        if (cancelled) return;

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setStatus({ kind: "error", message: body.error ?? `HTTP ${res.status}` });
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        if (data.status === "succeeded" && data.output?.diarization) {
          setStatus({ kind: "done", turns: data.output.diarization });
          return;
        }

        if (data.status === "failed" || data.status === "canceled") {
          setStatus({ kind: "error", message: data.error ?? `Job ${data.status}` });
          return;
        }

        // still running
        setStatus({ kind: "polling", jobId: activeJobId!, step: data.status });
        timer = setTimeout(tick, POLL_INTERVAL_MS);
      } catch (err) {
        if (!cancelled) {
          setStatus({
            kind: "error",
            message: err instanceof Error ? err.message : "Network error",
          });
        }
      }
    }

    let timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeJobId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ kind: "error", message: data.error ?? `HTTP ${res.status}` });
        return;
      }

      setStatus({ kind: "polling", jobId: data.jobId });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  const isRunning = status.kind === "submitting" || status.kind === "polling";

  return (
    <>
      <Breadcrumbs segments={[{ label: "Submit" }]} />
      <h1 className="text-2xl font-semibold mt-6">Speaker diarization</h1>
      <p className="mt-2 text-sm text-foreground/60 leading-relaxed">
        Paste a direct audio URL and pyannote.ai will identify who speaks when.
        Supports mp3, m4a, wav, ogg, and most podcast feed audio URLs.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="audio-url"
            className="block text-xs font-semibold text-foreground/60 mb-1.5"
          >
            Audio URL
          </label>
          <input
            id="audio-url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/episode.mp3"
            disabled={isRunning}
            className="w-full bg-background border border-foreground/20 px-3 py-2 text-sm placeholder:text-foreground/30 focus:outline-none focus:border-foreground/60 disabled:opacity-50"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isRunning || !url.trim()}
            className="px-5 py-2 text-sm font-semibold bg-foreground text-background disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            {isRunning ? "Running…" : "Diarize"}
          </button>

          {status.kind !== "idle" && !isRunning && (
            <button
              type="button"
              onClick={() => setStatus({ kind: "idle" })}
              className="px-3 py-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Status */}
      {status.kind === "submitting" && (
        <p className="mt-6 text-sm text-foreground/60 animate-pulse">
          Submitting to pyannote.ai…
        </p>
      )}

      {status.kind === "polling" && (
        <div className="mt-6">
          <p className="text-sm text-foreground/60 animate-pulse">
            Processing
            {status.step ? ` · ${status.step}` : ""}
            {" "}— polling every {POLL_INTERVAL_MS / 1000}s
          </p>
          <p className="mt-1 text-xs text-foreground/30">
            Job ID: {status.jobId}
          </p>
        </div>
      )}

      {status.kind === "error" && (
        <div className="mt-6 border border-red-400/30 bg-red-400/5 px-4 py-3">
          <p className="text-sm font-semibold text-red-400">Error</p>
          <p className="mt-1 text-sm text-foreground/70">{status.message}</p>
        </div>
      )}

      {/* Results */}
      {status.kind === "done" && (() => {
        const speakers = uniqueSpeakers(status.turns);
        const totalDuration = Math.max(...status.turns.map((t) => t.end));
        return (
          <div className="mt-8">
            <div className="flex items-baseline gap-4 flex-wrap">
              <h2 className="text-lg font-semibold">Results</h2>
              <span className="text-sm text-foreground/40">
                {speakers.length} speaker{speakers.length !== 1 ? "s" : ""} ·{" "}
                {formatDuration(totalDuration)} total ·{" "}
                {status.turns.length} turns
              </span>
            </div>

            {/* per-speaker summary badges */}
            <div className="mt-4 flex flex-wrap gap-3">
              {speakers.map((spk) => {
                const color = speakerColor(spk, speakers);
                const pct = Math.round(
                  (talkTime(spk, status.turns) / totalDuration) * 100
                );
                return (
                  <div
                    key={spk}
                    className="flex items-center gap-2 text-xs border border-foreground/10 px-3 py-1.5 rounded"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold" style={{ color }}>
                      {spk}
                    </span>
                    <span className="text-foreground/40">
                      {formatDuration(talkTime(spk, status.turns))} · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>

            <SpeakerTimeline turns={status.turns} speakers={speakers} />
            <TurnList turns={status.turns} speakers={speakers} />
          </div>
        );
      })()}
    </>
  );
}
