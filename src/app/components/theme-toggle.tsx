"use client";

import { useIntlayer } from 'next-intlayer';
import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

function getTheme(): Theme {
  const stored = localStorage.getItem("theme") as Theme | null;
  return stored && ["system", "light", "dark"].includes(stored) ? stored : "system";
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function ThemeToggle() {
  const content = useIntlayer('theme-toggle');
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system" as Theme);

  const labels: Record<Theme, string> = {
    system: content.system.value,
    light: content.light.value,
    dark: content.dark.value,
  };

  function cycle() {
    const order: Theme[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new StorageEvent("storage"));
  }

  return (
    <button
      onClick={cycle}
      className="text-sm text-foreground/40 hover:text-foreground/60"
      aria-label={`Theme: ${labels[theme]}`}
    >
      [{labels[theme]}]
    </button>
  );
}
