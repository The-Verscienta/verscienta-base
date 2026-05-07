/**
 * Dark Mode Toggle — React island.
 * Cycles: light → dark → system.
 *
 * Reads the persisted choice synchronously on mount so the icon/label
 * agrees with what the inline pre-paint script in RootLayout did.
 * Listens for OS theme changes while in "system" mode.
 */
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "verscienta_theme";

function readStored(): Theme {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    window.localStorage.removeItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    window.localStorage.setItem(STORAGE_KEY, theme);
    root.classList.toggle("dark", theme === "dark");
  }
}

export default function DarkModeToggle() {
  // Lazy initializer so first render matches what the inline script applied.
  const [theme, setTheme] = useState<Theme>(readStored);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Track OS preference changes — only takes effect while in "system" mode.
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  const cycle = () =>
    setTheme((prev) => (prev === "light" ? "dark" : prev === "dark" ? "system" : "light"));

  const icons: Record<Theme, string> = { light: "☀️", dark: "🌙", system: "💻" };
  const labels: Record<Theme, string> = {
    light: "Light theme",
    dark: "Dark theme",
    system: "System theme",
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-focus"
      aria-label={`${labels[theme]}. Click to change.`}
      title={labels[theme]}
    >
      <span className="text-lg" aria-hidden="true">{icons[theme]}</span>
    </button>
  );
}
