"use client";

import { useIntlayer } from 'next-intlayer';
import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
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

function segmentId(index: number): string {
  return `seg-${index}`;
}

export function Transcript({
  segments,
  speakerMap,
}: {
  segments: EpisodeSegment[];
  speakerMap: Record<string, string>;
}) {
  const content = useIntlayer('transcript');

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith("seg-")) return parseInt(hash.replace("seg-", ""), 10);
    }
    return null;
  });
  const lower = query.toLowerCase();

  useEffect(() => {
    if (activeIndex === null) return;
    const id = segmentId(activeIndex);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const indexed = segments.map((seg, i) => ({ seg, originalIndex: i }));
  const filtered = lower
    ? indexed.filter(
        ({ seg }) =>
          seg.text.toLowerCase().includes(lower) ||
          (speakerMap[seg.speaker] ?? seg.speaker)
            .toLowerCase()
            .includes(lower),
      )
    : indexed;

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
          placeholder={content.searchTranscript.value}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered.length > 0) {
              e.preventDefault();
              const idx = filtered[0].originalIndex;
              flushSync(() => {
                setActiveIndex(idx);
                setQuery("");
              });
              const el = document.getElementById(segmentId(idx));
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                history.replaceState(null, "", `#${segmentId(idx)}`);
              }
            }
          }}
          className="w-full bg-background border border-foreground/10 px-3 py-2 text-sm placeholder:text-foreground/60 focus:outline-none focus:border-foreground/60"
        />
      </search>

      {lower && (
        <p className="mt-2 text-xs text-foreground/40">
          {filtered.length} of {segments.length} segments
        </p>
      )}

      <ol className="mt-4 border-t border-foreground/10">
        {filtered.map(({ seg, originalIndex }) => (
          <li
            key={originalIndex}
            id={segmentId(originalIndex)}
            className={`py-3 border-b border-foreground/5 scroll-mt-4 target:bg-link/10${activeIndex === originalIndex ? " bg-link/10" : ""}`}
          >
            <div className="flex items-baseline gap-3">
              <a
                href={`#${segmentId(originalIndex)}`}
                className="text-xs text-foreground/60 tabular-nums select-none shrink-0 hover:text-foreground no-underline"
              >
                <time>{formatTime(seg.start)}</time>
              </a>
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
