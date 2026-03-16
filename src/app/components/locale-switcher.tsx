"use client";

import type { FC } from "react";
import { getLocaleName } from "intlayer";
import { useLocale } from "next-intlayer";

export const LocaleSwitcher: FC = () => {
  const { locale, availableLocales, setLocale } = useLocale();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as typeof locale)}
      className="bg-transparent border border-foreground/15 rounded px-1.5 py-0.5 text-xs text-foreground/60 hover:text-foreground/80 focus:outline-none focus:border-foreground/40 cursor-pointer"
    >
      {availableLocales.map((loc) => (
        <option key={loc} value={loc}>
          {getLocaleName(loc, locale)}
        </option>
      ))}
    </select>
  );
};
