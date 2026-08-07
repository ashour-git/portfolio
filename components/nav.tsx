"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { PaletteTrigger } from "./palette-trigger";

const links = [
  { label: "Products", href: "#work" },
  { label: "Case Studies", href: "#case-studies" },
  { label: "Experience", href: "#experience" },
  { label: "Stack", href: "#stack" },
  { label: "Principles", href: "#principles" },
  { label: "Writing", href: "#notes" },
  { label: "Contact", href: "#contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
      <nav
        aria-label="Primary"
        className="glass mx-auto flex h-14 w-full max-w-6xl items-center justify-between rounded-2xl px-5"
      >
        <a
          href="#top"
          className="font-mono text-sm font-semibold tracking-tight text-ink"
        >
          m.ashour<span className="text-accent">.</span>
        </a>

        {/* desktop links */}
        <div className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <PaletteTrigger />
          <ThemeToggle />
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-bg sm:block"
          >
            Resume
          </a>
          <a
            href="#contact"
            className="hidden rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:opacity-85 sm:block"
          >
            Hire me
          </a>

          {/* mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface lg:hidden"
          >
            <span
              aria-hidden="true"
              className="relative block h-3 w-4"
            >
              <span
                className={`absolute left-0 top-0 h-px w-4 bg-ink transition-transform duration-300 ${
                  open ? "translate-y-[5.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[5.5px] h-px w-4 bg-ink transition-opacity duration-200 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[11px] h-px w-4 bg-ink transition-transform duration-300 ${
                  open ? "-translate-y-[5.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* mobile menu panel */}
      {open && (
        <div
          id="mobile-menu"
          className="glass-strong mx-auto mt-2 w-full max-w-6xl rounded-2xl p-3 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                >
                  {l.label}
                  <span aria-hidden="true" className="font-mono text-xs text-ink-faint">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2 border-t border-line pt-3">
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-center text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              Resume
            </a>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl bg-ink px-4 py-2.5 text-center text-sm font-medium text-bg transition-colors hover:opacity-85"
            >
              Hire me
            </a>
          </div>
        </div>
      )}
    </header>
  );
}