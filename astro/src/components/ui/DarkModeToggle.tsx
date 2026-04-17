/**
 * Dark Mode Toggle — React island.
 * Ported from frontend/components/ui/DarkModeToggle.tsx.
 * Cycles: light → dark → system.
 */
import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("verscienta_theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      localStorage.removeItem("verscienta_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      localStorage.setItem("verscienta_theme", theme);
      root.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  const cycle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : prev === "dark" ? "system" : "light"));
  };

  const icons: Record<Theme, string> = {
    light: "☀️",
    dark: "🌙",
    system: "💻",
  };

  return (
    <button
      onClick={cycle}
      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-sage-100 dark:hover:bg-earth-800 transition"
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
    >
      <span className="text-lg">{icons[theme]}</span>
    </button>
  );
}
