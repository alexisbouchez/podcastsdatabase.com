"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchEntry {
  type: "podcast" | "person" | "episode" | "transcript";
  title: string;
  url: string;
  context?: string;
}

const TYPE_LABELS: Record<string, string> = {
  podcast: "podcast",
  person: "person",
  episode: "episode",
  transcript: "transcript",
};

export function Search() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !index) {
      fetch("/search-index.json")
        .then((r) => r.json())
        .then((data) => setIndex(data));
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, index]);

  const results = useMemo(() => {
    if (!index || !query.trim()) return [];
    const lower = query.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);

    const scored: { entry: SearchEntry; score: number }[] = [];
    for (const entry of index) {
      const text = `${entry.title} ${entry.context ?? ""}`.toLowerCase();
      if (!words.every((w) => text.includes(w))) continue;

      let score = 0;
      if (entry.type === "podcast") score = 40;
      else if (entry.type === "person") score = 30;
      else if (entry.type === "episode") score = 20;
      else score = 10;

      if (entry.title.toLowerCase().includes(lower)) score += 5;
      scored.push({ entry, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 50).map((s) => s.entry);
  }, [query, index]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter" && results[selected]) {
        setOpen(false);
        setQuery("");
        router.push(results[selected].url);
      }
    },
    [results, selected],
  );

  useEffect(() => {
    const el = resultsRef.current?.children[selected] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-foreground/40 hover:text-foreground/60 no-underline"
      >
        [search: /]
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => {
        setOpen(false);
        setQuery("");
      }}
    >
      <div
        className="bg-background border border-foreground/20 w-full max-w-2xl max-h-[60vh] flex flex-col shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-foreground/10 px-4">
          <span className="text-foreground/40 text-sm mr-2">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search podcasts, people, episodes, transcripts..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent py-3 text-sm focus:outline-none placeholder:text-foreground/40"
          />
          <kbd className="text-xs text-foreground/30 border border-foreground/10 px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        {query.trim() && (
          <div ref={resultsRef} className="overflow-y-auto">
            {results.length === 0 && index && (
              <p className="px-4 py-3 text-sm text-foreground/40">No results</p>
            )}
            {!index && (
              <p className="px-4 py-3 text-sm text-foreground/40">Loading...</p>
            )}
            {results.map((r, i) => (
              <Link
                key={`${r.url}-${i}`}
                href={r.url}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className={`block px-4 py-2 text-sm no-underline ${
                  i === selected
                    ? "bg-foreground/5"
                    : "hover:bg-foreground/5"
                }`}
              >
                <span className="text-foreground/30 text-xs mr-2">
                  {TYPE_LABELS[r.type]}
                </span>
                <span className="text-foreground">
                  {r.title.length > 120
                    ? r.title.slice(0, 120) + "…"
                    : r.title}
                </span>
                {r.context && (
                  <span className="text-foreground/40 ml-2 text-xs">
                    {r.context}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
