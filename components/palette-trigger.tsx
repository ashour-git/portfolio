"use client";

export function PaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("ma:open-palette"))}
      aria-label="Open command palette (Ctrl/⌘ + K)"
      className="hidden min-h-[2.75rem] items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-faint transition-colors hover:border-border-strong hover:text-ink focus-visible:border-accent md:flex"
    >
      <span className="text-ink-soft">⌘K</span>
      menu
    </button>
  );
}