"use client";

import { useIntlayer } from 'next-intlayer';
import { useState, useMemo } from "react";

export function ListFilter({
  placeholder,
  items,
}: {
  placeholder: string;
  items: { key: string; searchText: string; node: React.ReactNode }[];
}) {
  const content = useIntlayer('list-filter');

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    return items.filter((item) =>
      words.every((w) => item.searchText.includes(w))
    );
  }, [query, items]);

  return (
    <>
      <div className="mt-4 relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent border border-foreground/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground/40 placeholder:text-foreground/30"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 no-underline text-xs"
          >
            clear
          </button>
        )}
      </div>
      {query.trim() && (
        <p className="mt-2 text-xs text-foreground/40">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
      <div className="mt-3 grid gap-3">
        {filtered.map((item) => (
          <div key={item.key}>{item.node}</div>
        ))}
        {query.trim() && filtered.length === 0 && (
          <p className="text-sm text-foreground/40 py-4">{content.noMatchesForQuery({ query: query })}</p>
        )}
      </div>
    </>
  );
}
