"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CopilotCard, CopilotEvent, CopilotMode, Plan, RetrievalResult } from "@/lib/copilot/types";
import { COPILOT_MODES } from "@/lib/copilot/types";
import { EASE, DURATION } from "@/lib/motion";
import { CopilotMarkdown } from "@/components/copilot-markdown";
import { CopilotCardPanel } from "@/components/copilot-card";

type Message = { id: string; role: "user" | "assistant"; text: string };
type RunStats = {
  tokens: { in: number; out: number };
  retrievalMs: number;
  totalMs: number;
  cache: string;
  intent: string;
  confidence: number;
  strategy: string;
};
type Run = {
  id: string;
  mode: CopilotMode;
  sources: RetrievalResult[];
  card: CopilotCard | null;
  stats: RunStats | null;
  plan: Plan | null;
  done: boolean;
};

const QUICK_ACTIONS = [
  "What did you build?",
  "Show RestAI architecture",
  "Explain your RAG",
  "Why those tradeoffs?",
  "Interview me",
  "Resume summary",
];

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CopilotMode>("general");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [runs, setRuns] = useState<Record<string, Run>>({});
  const [streaming, setStreaming] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setOpen(false);
  }, []);

  const openModal = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        openModal();
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpenEvent = () => openModal();
    window.addEventListener("keydown", onKey);
    window.addEventListener("ma:open-copilot", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ma:open-copilot", onOpenEvent);
    };
  }, [openModal]);

  useEffect(() => {
    if (!streaming) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, runs, streaming]);

  const run = useCallback(async (text: string) => {
    if (streaming) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text };
    const runId = `a-${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: runId, role: "assistant", text: "" }]);
    setRuns((r) => ({ ...r, [runId]: { id: runId, mode, sources: [], card: null, stats: null, plan: null, done: false } }));
    setStreaming(true);
    setInput("");
    if (lang !== "en") setLang("en");

    const update = (fn: (r: Run) => Run) =>
      setRuns((prev) => ({ ...prev, [runId]: fn(prev[runId]) }));

    try {
      const history = messagesRef.current
        .map((m) => ({ role: m.role, content: m.text }))
        .filter((m) => m.content.trim().length > 0)
        .slice(-6);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, mode, history }),
        signal: controller.signal,
      });
      if (!res.body) throw new Error("no body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl = buffer.indexOf("\n");
        while (nl !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (!line.trim()) { nl = buffer.indexOf("\n"); continue; }
          const ev = JSON.parse(line) as CopilotEvent;
          if (ev.type === "delta") {
            setMessages((prev) =>
              prev.map((m) => (m.id === runId ? { ...m, text: m.text + ev.text } : m)),
            );
          } else if (ev.type === "plan") {
            update((r) => ({ ...r, plan: ev.plan }));
          } else if (ev.type === "sources") {
            update((r) => ({ ...r, sources: ev.sources }));
          } else if (ev.type === "card") {
            update((r) => ({ ...r, card: ev.card }));
          } else if (ev.type === "stats") {
            update((r) => ({
              ...r,
              stats: {
                tokens: ev.tokens,
                retrievalMs: ev.retrievalMs,
                totalMs: ev.totalMs,
                cache: ev.cache,
                intent: ev.intent,
                confidence: ev.confidence,
                strategy: ev.strategy,
              },
            }));
          } else if (ev.type === "error") {
            setMessages((prev) =>
              prev.map((m) => (m.id === runId ? { ...m, text: `⚠ ${ev.message}` } : m)),
            );
          } else if (ev.type === "meta") {
            if (ev.lang === "ar") setLang("ar");
          } else if (ev.type === "done") {
            update((r) => ({ ...r, done: true }));
          }
          nl = buffer.indexOf("\n");
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setMessages((prev) =>
          prev.map((m) => (m.id === runId ? { ...m, text: "⚠ Failed to reach the copilot." } : m)),
        );
      }
    } finally {
      update((r) => ({ ...r, done: true }));
      setStreaming(false);
    }
  }, [mode, streaming]);

  const send = () => {
    const text = input.trim();
    if (!text || streaming) return;
    void run(text);
  };

  const lastRunId = messages.filter((m) => m.role === "assistant").at(-1)?.id;
  const lastRun = lastRunId ? runs[lastRunId] : undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm md:p-6"
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Engineering Copilot"
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  COPILOT → GROUNDED RAG → STREAM
                </p>
                <h2 className="font-serif text-lg italic text-ink">Engineering Copilot</h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close copilot"
                className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ink-soft transition-colors hover:text-ink"
              >
                Esc
              </button>
            </div>

            {/* mode pills */}
            <div className="flex flex-wrap gap-2 border-b border-line px-5 py-2.5">
              {COPILOT_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-full border px-3 py-1 font-mono text-xs capitalize transition-colors ${
                    mode === m
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line text-ink-soft hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* body */}
            <div className="grid flex-1 gap-0 overflow-hidden md:grid-cols-[1fr_320px]">
              <div className="flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                      <div>
                        <h3 className="font-serif text-2xl italic text-ink">
                          Ask me anything about my work
                        </h3>
                        <p className="mt-2 text-sm text-ink-soft">
                          Grounded in the real projects, decisions, and numbers on this site.
                        </p>
                      </div>
                      <div className="flex max-w-md flex-wrap justify-center gap-2">
                        {QUICK_ACTIONS.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => void run(q)}
                            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-ink"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {messages.map((m) => (
                        <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                          <div
                            className={
                              m.role === "user"
                                ? "ml-auto inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-left text-sm text-bg"
                                : "max-w-[92%]"
                            }
                          >
                            {m.role === "assistant" ? (
                              <CopilotMarkdown text={m.text} lang={lang} />
                            ) : (
                              m.text
                            )}
                          </div>
                        </div>
                      ))}
                      {streaming && (
                        <span className="font-mono text-sm text-ink-faint">▍</span>
                      )}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {/* footer stats */}
                {lastRun?.sources && (
                  <div className="flex items-center gap-3 border-t border-line px-5 py-2 font-mono text-[10px] text-ink-faint">
                    <span>
                      {lastRun.sources.length <= 3
                        ? `Grounded in ${lastRun.sources.map((s) => s.label).join(", ")}`
                        : `Verified from ${lastRun.sources.length} indexed sources`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDevMode((d) => !d)}
                      className="ml-auto text-accent transition-colors hover:underline"
                    >
                      {devMode ? "dev on" : "dev off"}
                    </button>
                  </div>
                )}

                {devMode && lastRun && (
                  <div className="border-t border-line bg-bg/40 px-5 py-3 font-mono text-[10px] text-ink-faint">
                    <p className="mb-1 uppercase tracking-[0.18em]">
                      intent={lastRun.stats?.intent} · confidence={lastRun.stats?.confidence?.toFixed(2)} · strategy={lastRun.stats?.strategy}
                    </p>
                    <p className="mb-2">
                      plan={lastRun.plan?.template} / {lastRun.plan?.stance} · card={lastRun.plan?.card} · cache={lastRun.stats?.cache} · {lastRun.stats?.retrievalMs}ms · {lastRun.stats?.tokens.out} tokens
                    </p>
                    <ul className="flex flex-col gap-1">
                      {lastRun.sources.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 text-[11px] text-ink-soft">
                          <span className="rounded bg-surface-2 px-1.5 py-0.5">{s.score.toFixed(2)}</span>
                          <span className="truncate">{s.title}</span>
                          <span className="ml-auto hidden truncate text-ink-faint sm:block">{s.reasons.join(" · ")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lastRun?.plan?.suggestions && (
                  <div className="border-t border-line bg-bg/40 px-5 py-3 text-sm text-ink-soft">
                    Related: {lastRun.plan.suggestions.join(", ")}
                  </div>
                )}

                {/* input */}
                <div className="flex items-center gap-2 border-t border-line px-5 py-3">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask about projects, architecture, decisions…"
                    className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={streaming || !input.trim()}
                    className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-85 disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* card rail */}
              <div className="hidden overflow-y-auto border-l border-line bg-bg/20 p-4 md:block">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                  Context · {mode}
                </p>
                <CopilotCardPanel card={lastRun?.card ?? null} planCard={lastRun?.plan?.card} sources={lastRun?.sources} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}