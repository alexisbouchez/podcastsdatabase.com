"use client";

import { useState } from "react";
interface EpisodeSegment {
  start: number;
  end: number;
  speaker: string;
  text: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Transcript({
  segments,
  speakerMap,
}: {
  segments: EpisodeSegment[];
  speakerMap: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const lower = query.toLowerCase();

  const filtered = lower
    ? segments.filter(
        (seg) =>
          seg.text.toLowerCase().includes(lower) ||
          (speakerMap[seg.speaker] ?? seg.speaker)
            .toLowerCase()
            .includes(lower),
      )
    : segments;

  return (
    <details open>
      <summary className="text-lg font-semibold cursor-pointer">
        Transcript
        <span className="text-foreground font-normal ml-2">
          ({segments.length} segments)
        </span>
      </summary>

      <search className="mt-4">
        <input
          type="search"
          placeholder="Search transcript..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-background border border-foreground/10 px-3 py-2 text-sm placeholder:text-foreground/60 focus:outline-none focus:border-foreground/60"
        />
      </search>

      {lower && (
        <p className="mt-2 text-xs text-foreground/40">
          {filtered.length} of {segments.length} segments
        </p>
      )}

      <ol className="mt-4 border-t border-foreground/10">
        {filtered.map((seg, i) => (
          <li key={i} className="py-3 border-b border-foreground/5">
            <div className="flex items-baseline gap-3">
              <time className="text-xs text-foreground/60 tabular-nums select-none shrink-0">
                {formatTime(seg.start)}
              </time>
              <cite className="text-xs font-semibold not-italic shrink-0">
                {speakerMap[seg.speaker] ?? seg.speaker}
              </cite>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
              {lower ? highlightMatches(seg.text, lower) : seg.text}
            </p>
          </li>
        ))}
      </ol>
    </details>
  );
}

function highlightMatches(text: string, query: string) {
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query ? (
      <mark key={i} className="bg-link/20 text-inherit rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
