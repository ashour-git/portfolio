"use client";

import { useEffect, useState } from "react";
import { MoonStars, Sun } from "@phosphor-icons/react/dist/ssr";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // ThemeInit already resolved stored vs system preference before paint
    setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage blocked: theme still applies for this visit */
    }
  };

  const Icon = theme === "light" ? MoonStars : Sun;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "Dark theme" : "Light theme"}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink focus-visible:bg-surface-hover"
    >
      <Icon aria-hidden="true" size={18} weight="regular" />
    </button>
  );
}
