"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE, DURATION } from "@/lib/motion";
import { profile } from "@/lib/data";
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

const sectionIds = links.map((l) => l.href.slice(1));

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        } else {
          const anyInside = entries.some(
            (e) => e.boundingClientRect.top < 0 && e.boundingClientRect.bottom > 0,
          );
          if (!anyInside) setActive(null);
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.2, 0.6, 1] },
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // lock page scroll while the full-screen mobile menu is open
  // + move focus into the menu on open, restore it to the toggle on close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstMobileLinkRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
      toggleRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="relative z-10 px-4 pt-4 md:px-6">
        <nav
          aria-label="Primary"
          className={`mx-auto flex h-14 w-full max-w-6xl items-center justify-between rounded-2xl border px-5 backdrop-blur-xl transition-colors duration-300 ${
            open
              ? "border-border-strong bg-surface-2/90 shadow-xl shadow-black/10"
              : scrolled
                ? "surface-strong shadow-lg shadow-black/10"
                : "surface shadow-md shadow-black/5"
          }`}
        >
          <a
            href="#top"
            className="font-mono text-sm font-semibold tracking-tight text-ink transition-colors hover:text-accent"
          >
            m.ashour<span className="text-accent">.</span>
          </a>

          {/* desktop links */}
          <div className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const isActive = active === l.href.slice(1);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  aria-current={isActive ? "location" : undefined}
                  className={`relative whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors duration-300 focus-visible:bg-surface-hover ${
                    isActive ? "text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {l.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      transition={{ duration: DURATION.fast, ease: EASE }}
                      className="absolute inset-x-3 -bottom-0.5 h-px bg-ink"
                    />
                  )}
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <PaletteTrigger />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("ma:open-copilot"))}
              className="hidden min-h-[2.75rem] items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-faint transition-colors hover:border-border-strong hover:text-ink focus-visible:border-accent md:flex"
            >
              <span aria-hidden="true" className="whitespace-nowrap text-ink-soft">Ctrl J</span>
              copilot
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("ma:open-copilot"))}
              className="flex min-h-[2.75rem] items-center rounded-xl border border-line bg-surface px-3.5 font-mono text-xs text-ink-faint transition-colors hover:text-ink md:hidden"
            >
              copilot
            </button>
            <ThemeToggle />
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-[2.75rem] items-center whitespace-nowrap rounded-lg border border-line px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-bg sm:inline-flex"
            >
              Resume
            </a>
            <a
              href="#contact"
              className="hidden min-h-[2.75rem] items-center whitespace-nowrap rounded-lg bg-ink px-4 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-85 sm:inline-flex"
            >
              Hire me
            </a>

            {/* mobile menu toggle */}
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface transition-colors hover:border-border-strong lg:hidden"
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
      </div>

      {/* full-screen mobile menu — a dedicated composition, not a shrunken bar */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="fixed inset-0 z-0 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-bg/95 backdrop-blur-xl"
              aria-hidden="true"
            />
            <div className="relative flex h-full flex-col overflow-y-auto px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-24">
              <nav aria-label="Mobile primary" className="mx-auto w-full max-w-6xl">
                <p className="eyebrow mb-2">Navigate</p>
                <ul className="flex flex-col">
                  {links.map((l, i) => {
                    const isActive = active === l.href.slice(1);
                    return (
                      <li key={l.href} className="border-b border-line">
                        <a
                          ref={i === 0 ? firstMobileLinkRef : undefined}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          aria-current={isActive ? "location" : undefined}
                          className={`group flex min-h-[3.5rem] items-baseline gap-4 rounded-lg py-5 focus-visible:bg-surface-hover ${
                            isActive ? "text-ink" : "text-ink-soft"
                          }`}
                        >
                          <span
                            className={`font-mono text-xs ${
                              isActive ? "text-accent" : "text-ink-faint"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-2xl font-semibold tracking-tight transition-colors group-hover:text-ink">
                            {l.label}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`ml-auto transition-transform duration-300 group-hover:translate-x-1 ${
                              isActive ? "text-accent" : "text-ink-faint"
                            }`}
                          >
                            →
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-3 sm:flex-row">
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost flex-1 justify-center"
                >
                  Resume
                </a>
                <a
                  href="#contact"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary flex-1 justify-center"
                >
                  Hire me
                </a>
              </div>

              <p className="mx-auto mt-6 w-full max-w-6xl font-mono text-xs text-ink-faint">
                {profile.email}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}