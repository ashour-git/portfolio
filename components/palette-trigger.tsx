"use client";

export function PaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("ma:open-palette"))}
      aria-label="Open command palette (Ctrl/⌘ + K)"
      className="hidden min-h-[2.75rem] items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-faint transition-colors hover:border-border-strong hover:text-ink focus-visible:border-accent lg:flex"
    >
      <span aria-hidden="true" className="text-ink-soft">Ctrl K</span>
      menu
    </button>
  );
}