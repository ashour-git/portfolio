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
      className="relative flex h-7 w-12 shrink-0 items-center rounded-full border border-line bg-surface px-1"
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-accent-2 text-[10px] leading-none text-bg transition-transform duration-300 ${
          theme === "light" ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {theme === "light" ? "☀" : "☾"}
      </span>
    </button>
  );
}