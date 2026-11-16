"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { EASE, DURATION } from "@/lib/motion";
import { profile } from "@/lib/data";
import { ArrowRight, ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "./theme-toggle";
import { PaletteTrigger } from "./palette-trigger";
import { Mark } from "./nn-icons";

const links = [
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Stack", href: "#stack" },
  { label: "Principles", href: "#principles" },
  { label: "Contact", href: "#contact" },
];

const sectionIds = links.map((l) => l.href.slice(1));

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null);

  // elevated state: watch a sentinel at the top of the hero instead of
  // listening to every scroll frame
  useEffect(() => {
    const sentinel = document.getElementById("nav-sentinel");
    if (!sentinel) {
      setScrolled(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
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
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${
        open ? "border-line bg-bg" : scrolled ? "border-line bg-bg" : "on-dark border-transparent bg-transparent"
      }`}
    >
      <div className="relative z-10">
        <nav aria-label="Primary" className="shell flex h-16 items-center justify-between gap-2">
          <a
            href="#top"
            aria-label="Mohamed Ashour, back to top"
            className="flex shrink-0 items-center gap-2.5 font-mono text-[15px] font-extrabold tracking-tight text-ink transition-colors hover:text-accent"
          >
            <Mark className="h-6 w-7" />
            <span>
              <span className="hidden sm:inline">Mohamed </span>Ashour
            </span>
          </a>

          {/* desktop links — xl+: the full row needs ~1150px, it overflows at lg */}
          <div className="hidden shrink-0 items-center gap-0.5 xl:flex">
            {links.map((l) => {
              const isActive = active === l.href.slice(1);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  aria-current={isActive ? "location" : undefined}
                  className={`relative whitespace-nowrap px-3 py-2 font-mono text-[13px] transition-colors duration-300 focus-visible:bg-surface-hover ${
                    isActive ? "text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {l.label}
                  {isActive && (
                    <m.span
                      layoutId="nav-underline"
                      transition={{ duration: DURATION.fast, ease: EASE }}
                      className="absolute inset-x-3 -bottom-px h-0.5 bg-accent"
                    />
                  )}
                </a>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <PaletteTrigger />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("ma:open-copilot"))}
              title="Ask the portfolio copilot (Ctrl J)"
              className="flex min-h-11 items-center gap-2 whitespace-nowrap border border-border-strong px-3 font-mono text-[13px] font-bold text-ink transition-colors hover:border-accent hover:text-accent focus-visible:border-accent"
            >
              <ChatCircleText aria-hidden="true" size={18} className="text-accent" />
              Ask AI
            </button>
            <a
              href="#contact"
              className="ml-1 hidden min-h-11 items-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[13px] font-bold text-bg transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink sm:inline-flex"
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
              className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center border border-border-strong transition-colors hover:border-ink xl:hidden"
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
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="fixed inset-0 z-0 xl:hidden"
          >
            <div
              className="absolute inset-0 bg-bg"
              aria-hidden="true"
            />
            <div className="relative flex h-full flex-col overflow-y-auto px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-24">
              <nav aria-label="Mobile primary" className="mx-auto w-full max-w-6xl">
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
                          className={`group flex min-h-[3.5rem] items-center gap-4 rounded-lg py-5 focus-visible:bg-surface-hover ${
                            isActive ? "text-ink" : "text-ink-soft"
                          }`}
                        >
                          <span className="font-mono text-2xl font-extrabold tracking-tight transition-colors group-hover:text-ink">
                            {l.label}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`ml-auto transition-transform duration-300 group-hover:translate-x-1 ${
                              isActive ? "text-accent" : "text-ink-faint"
                            }`}
                          >
                            <ArrowRight size={20} />
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
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}