"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const load = () => import("@/components/copilot");
const Copilot = dynamic(() => load().then((m) => m.Copilot), { ssr: false, loading: () => null });

/** Mirrors `questionFromEvent` in copilot.tsx; duplicated so this tiny loader
 *  never imports the heavy copilot module eagerly. */
function questionFrom(e: Event): string | undefined {
  const q = (e as CustomEvent<{ question?: unknown } | null>).detail?.question;
  if (typeof q !== "string") return undefined;
  const t = q.trim();
  return t ? t.slice(0, 600) : undefined;
}

/**
 * Keeps the copilot (markdown, syntax highlighting, motion) off the critical
 * path. Only the open triggers live here; the real component is fetched on
 * first intent and pre-warmed once the browser is idle, so opening stays
 * instant without competing with the hero for bandwidth.
 *
 * Contract: `window.dispatchEvent(new CustomEvent("ma:open-copilot",
 * { detail: { question } }))` opens the copilot and asks `question`; a plain
 * `new Event("ma:open-copilot")` just opens it.
 */
export function CopilotLoader() {
  const [state, setState] = useState<{ loaded: boolean; question?: string }>({ loaded: false });

  useEffect(() => {
    if (state.loaded) return;
    const open = (e?: Event) => setState({ loaded: true, question: e ? questionFrom(e) : undefined });
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("ma:open-copilot", open);

    const prewarm = () => void load();
    // Safari has no requestIdleCallback.
    const hasIdle = "requestIdleCallback" in window;
    const handle = hasIdle
      ? window.requestIdleCallback(prewarm, { timeout: 8000 })
      : window.setTimeout(prewarm, 4000);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ma:open-copilot", open);
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [state.loaded]);

  return state.loaded ? <Copilot defaultOpen initialQuestion={state.question} /> : null;
}
