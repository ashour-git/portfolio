"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects } from "@/lib/data";

type Item = { id: string; label: string; hint: string; action: () => void };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const items: Item[] = [
    { id: "top", label: "Home", hint: "Go to hero", action: () => { document.querySelector("#top")?.scrollIntoView({ behavior: "smooth" }); close(); } },
    { id: "work", label: "Featured AI products", hint: "View product showcases", action: () => { document.querySelector("#work")?.scrollIntoView({ behavior: "smooth" }); close(); } },
    { id: "case-studies", label: "Engineering case studies", hint: "Decisions & tradeoffs", action: () => { document.querySelector("#case-studies")?.scrollIntoView({ behavior: "smooth" }); close(); } },
    { id: "experience", label: "Experience", hint: "AI engineering timeline", action: () => { document.querySelector("#experience")?.scrollIntoView({ behavior: "smooth" }); close(); } },
    { id: "stack", label: "Tech stack", hint: "Skills grouped by discipline", action: () => { document.querySelector("#stack")?.scrollIntoView({ behavior: "smooth" }); close(); } },
    { id: "principles", label: "Engineering principles", hint: "How I decide", action: () => { document.querySelector("#principles")?.scrollIntoView({ behavior: "smooth" }); close(); } },
    { id: "notes", label: "Writing & research", hint: "Write-ups & case studies", action: () => { document.querySelector("#notes")?.scrollIntoView({ behavior: "smooth" }); close(); } },
    { id: "contact", label: "Contact", hint: "Email & links", action: () => { document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }); close(); } },
    ...projects.map((p) => ({
      id: `p-${p.index}`,
      label: `Project · ${p.title}`,
      hint: `${p.domain} · open GitHub`,
      action: () => { window.open(p.href, "_blank", "noopener,noreferrer"); close(); },
    })),
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") close();
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ma:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ma:open-palette", onOpen);
    };
  }, []);

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 p-6 pt-24 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="glass-strong w-full max-w-lg overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Command palette"
            >
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <span className="font-mono text-sm text-ink-faint">⌘</span>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") close();
                  }}
                  placeholder="Type to filter…"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
                  aria-label="Filter commands"
                />
                <kbd className="rounded border border-line px-1.5 font-mono text-[10px] text-ink-faint">
                  esc
                </kbd>
              </div>
              <ul className="max-h-80 overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <li className="px-3 py-4 text-sm text-ink-faint">
                    No matches.
                  </li>
                )}
                {filtered.map((i) => (
                  <li key={i.id}>
                    <button
                      onClick={i.action}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-2"
                    >
                      <span>{i.label}</span>
                      <span className="font-mono text-xs text-ink-faint">
                        {i.hint}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}