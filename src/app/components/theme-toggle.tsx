"use client";

import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const LABELS: Record<Theme, string> = {
  system: "system",
  light: "light",
  dark: "dark",
};

function getTheme(): Theme {
  const stored = localStorage.getItem("theme") as Theme | null;
  return stored && LABELS[stored] ? stored : "system";
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system");

  function cycle() {
    const order: Theme[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <button
      onClick={cycle}
      className="text-sm text-foreground/40 hover:text-foreground/60"
      aria-label={`Theme: ${LABELS[theme]}. Click to change.`}
    >
      [{LABELS[theme]}]
    </button>
  );
}
