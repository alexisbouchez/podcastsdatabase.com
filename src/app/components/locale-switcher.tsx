"use client";

import type { FC } from "react";
import { Locales, getLocaleName } from "intlayer";
import { useLocale } from "next-intlayer";
import { usePathname } from "next/navigation";

export const LocaleSwitcher: FC = () => {
  const { locale, availableLocales } = useLocale();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    if (newLocale === locale) return;
    // Hard navigation to ensure server components re-render with new locale
    const url = new URL(pathname, window.location.origin);
    url.searchParams.set("locale", newLocale);
    window.location.href = url.toString();
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
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
