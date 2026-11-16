"use client";

import { Command } from "@phosphor-icons/react/dist/ssr";

export function PaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("ma:open-palette"))}
      aria-label="Open command palette (Ctrl or Cmd + K)"
      title="Command palette (Ctrl K)"
      className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink focus-visible:bg-surface-hover lg:flex"
    >
      <Command aria-hidden="true" size={18} />
    </button>
  );
}
