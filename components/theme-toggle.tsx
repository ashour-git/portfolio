"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial = stored === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggle = () => {
    const next: "dark" | "light" = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={theme === "light"}
      aria-label="Toggle dark mode"
      className="flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl px-1 transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover"
    >
      <span className="relative flex h-7 w-12 items-center rounded-full border border-line bg-surface px-1">
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-accent-2 text-bg transition-transform duration-300 ${
            theme === "light" ? "translate-x-5" : "translate-x-0"
          }`}
        >
          {theme === "light" ? (
            <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="2.5" />
              <path d="M6 0.8v1.4M6 9.8v1.4M0.8 6h1.4M9.8 6h1.4M2.3 2.3l1 1M8.7 8.7l1 1M9.7 2.3l-1 1M3.3 8.7l-1 1" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 7.2A4.2 4.2 0 0 1 4.8 2 4.2 4.2 0 1 0 10 7.2Z" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}