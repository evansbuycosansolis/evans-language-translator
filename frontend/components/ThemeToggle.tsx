"use client";

import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "evans-theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(STORAGE_KEY) as Theme | null)
        : null;
    const nextTheme: Theme = storedTheme === "dark" ? "dark" : "light";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-200"
    >
      {mounted && theme === "dark" ? (
        <>
          <SunMedium className="h-4 w-4" />
          Light Mode
        </>
      ) : (
        <>
          <MoonStar className="h-4 w-4" />
          Dark Mode
        </>
      )}
    </button>
  );
}
