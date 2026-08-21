"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import type { CopilotCard, CopilotEvent, CopilotMode, ErrorKind, Lang, Plan, RetrievalResult } from "@/lib/copilot/types";
import { COPILOT_MODES } from "@/lib/copilot/types";
import { EASE, DURATION } from "@/lib/motion";
import { detectLanguage } from "@/lib/copilot/language";
import {
  modeLabel,
  sourceLabel,
  QUICK_ACTIONS,
  PLACEHOLDER,
  DIALOG_LABEL,
  groundedIn,
  verifiedFrom,
  contextLabel,
  contextTopic,
  RELATED,
  STAT_LABEL_AR,
  showMetricsStrip,
  errorMessage,
  RETRY_LABEL,
  CLOSE_LABEL,
  STREAM_PHASE,
  explainWhyLabel,
  explainWhyBody,
  FOLLOWUPS,
  EMPTY_STATE,
  sourceHref,
} from "@/lib/copilot/i18n";
import { stats, githubStats } from "@/lib/data";
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
type RunError = { kind: ErrorKind; message?: string; requestId?: string };
type Run = {
  id: string;
  mode: CopilotMode;
  lang: Lang;
  sources: RetrievalResult[];
  card: CopilotCard | null;
  stats: RunStats | null;
  plan: Plan | null;
  done: boolean;
  error?: RunError;
  prompt: string;
};

/** VisualViewport-driven height — keeps the input visible above the mobile keyboard. */
function useViewportHeight() {
  const [vh, setVh] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setVh(vv.height);
    onResize();
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);
  return vh;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return isMobile;
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function ErrorState({ error, lang, onRetry }: { error: RunError; lang: Lang; onRetry: () => void }) {
  return (
    <div role="alert" className="panel max-w-[92%] rounded-xl p-4" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <p className="text-sm font-medium text-ink">{errorMessage(error.kind, lang)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="copilot-chip mt-3"
      >
        {RETRY_LABEL[lang]}
      </button>
    </div>
  );
}

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CopilotMode>("general");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [runs, setRuns] = useState<Record<string, Run>>({});
  const [streaming, setStreaming] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [explainId, setExplainId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const vh = useViewportHeight();
  const isMobile = useIsMobile();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setContextOpen(false);
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

  // keep the latest message in view; re-run when the keyboard resizes the viewport
  useEffect(() => {
    if (!streaming) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, runs, streaming]);
  useEffect(() => {
    if (open && vh && isMobile) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [vh, open, isMobile]);

  const run = useCallback(
    async (text: string, opts?: { mode?: CopilotMode }) => {
      if (streaming) return;
      const runMode = opts?.mode ?? mode;
      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text };
      const runId = `a-${Date.now()}`;
      const lang = detectLanguage(text);
      setMessages((m) => [...m, userMsg, { id: runId, role: "assistant", text: "" }]);
      setRuns((r) => ({
        ...r,
        [runId]: { id: runId, mode: runMode, lang, sources: [], card: null, stats: null, plan: null, done: false, prompt: text },
      }));
      setStreaming(true);
      setInput("");

      const update = (fn: (r: Run) => Run) =>
        setRuns((prev) => ({ ...prev, [runId]: fn(prev[runId]) }));

      // batch deltas — flush at most once per ~60ms instead of once per token
      let pending = "";
      const flush = () => {
        if (!pending) return;
        const chunk = pending;
        pending = "";
        setMessages((prev) => prev.map((m) => (m.id === runId ? { ...m, text: m.text + chunk } : m)));
      };
      const timer = setInterval(flush, 60);

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
          body: JSON.stringify({ message: text, mode: runMode, history }),
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
            if (!line.trim()) {
              nl = buffer.indexOf("\n");
              continue;
            }
            const ev = JSON.parse(line) as CopilotEvent;
            if (ev.type === "delta") {
              pending += ev.text;
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
              update((r) => ({
                ...r,
                error: { kind: ev.kind, message: ev.message, requestId: ev.requestId },
              }));
            } else if (ev.type === "done") {
              update((r) => ({ ...r, done: true }));
            }
            nl = buffer.indexOf("\n");
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          update((r) => ({ ...r, error: { kind: "network", message: "Network error reaching the copilot." } }));
        }
      } finally {
        flush();
        clearInterval(timer);
        update((r) => ({ ...r, done: true }));
        setStreaming(false);
      }
    },
    [mode, streaming],
  );

  const send = () => {
    const text = input.trim();
    if (!text || streaming) return;
    void run(text);
  };

  const retry = (runId: string) => {
    const r = runs[runId];
    if (!r) return;
    setMessages((prev) => prev.filter((m) => m.id !== runId));
    setRuns((prev) => {
      const { [runId]: _dropped, ...rest } = prev;
      return rest;
    });
    void run(r.prompt, { mode: r.mode });
  };

  const lastRunId = messages.filter((m) => m.role === "assistant").at(-1)?.id;
  const lastRun = lastRunId ? runs[lastRunId] : undefined;
  const chromeLang: Lang = lastRun?.lang ?? (detectLanguage(input) || "en");
  const dir = chromeLang === "ar" ? "rtl" : "ltr";
  const phase: "retrieving" | "writing" | null = streaming ? (lastRun?.plan ? "writing" : "retrieving") : null;
  const explainOpen = explainId === lastRunId;

  const toggleExplain = () => setExplainId(explainOpen ? null : (lastRunId ?? null));

  const followups = lastRun?.plan ? (FOLLOWUPS[lastRun.plan.template] ?? []) : [];

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm md:p-6"
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={DIALOG_LABEL[chromeLang]}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            style={isMobile && vh ? { height: vh } : undefined}
            className="glass-strong copilot-shell relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none md:h-[92vh] md:rounded-3xl"
          >
            {/* header — compact single intent: identity + close (spec §4) */}
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-4">
              <div className="min-w-0">
                <p className="label truncate text-accent">{chromeLang === "ar" ? "مساعد · راج مُسنَد" : "COPILOT · GROUNDED RAG"}</p>
                <h2 className="mt-0.5 truncate font-serif text-lg italic text-ink md:text-xl">{DIALOG_LABEL[chromeLang]}</h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={CLOSE_LABEL[chromeLang]}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-xl leading-none text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {/* mode rail — scrollable on mobile, wraps on desktop (spec §5) */}
            <div className="border-b border-line" dir={dir}>
              <div className="mode-rail px-4 py-2.5 md:px-6">
                {COPILOT_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${
                      mode === m
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line text-ink-soft hover:border-border-strong hover:text-ink"
                    }`}
                  >
                    {modeLabel(m, chromeLang)}
                  </button>
                ))}
              </div>
            </div>

            {/* body */}
            <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[1fr_320px]">
              <div className="flex min-h-0 flex-col overflow-hidden">
                {/* conversation — near-solid ambient surface */}
                <div className="copilot-ambient min-h-0 flex-1 overflow-y-auto" dir={dir} aria-live="polite">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
                      <div>
                        <h3 className="font-serif text-2xl italic text-ink">{EMPTY_STATE[chromeLang].title}</h3>
                        <p className="mt-2 max-w-sm text-sm text-ink-soft">{EMPTY_STATE[chromeLang].subtitle}</p>
                      </div>
                      <div className="flex max-w-md flex-wrap justify-center gap-2">
                        {QUICK_ACTIONS[chromeLang].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => void run(q)}
                            className="copilot-chip"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 px-4 py-5 md:px-6">
                      {messages.map((m) => {
                        if (m.role === "user") {
                          return (
                            <div key={m.id} className="w-fit max-w-full">
                              <div className="copilot-bubble-user me-auto whitespace-pre-wrap">
                                {m.text}
                              </div>
                            </div>
                          );
                        }
                        const runState = runs[m.id];
                        const failedEmpty = runState?.error && !m.text;
                        return (
                          <div key={m.id} className="max-w-full" dir={dir}>
                            {failedEmpty ? (
                              <ErrorState
                                error={runState.error!}
                                lang={runState?.lang ?? "en"}
                                onRetry={() => retry(m.id)}
                              />
                            ) : (
                              <>
                                <CopilotMarkdown text={m.text} lang={runState?.lang ?? detectLanguage(m.text)} />
                                {runState?.error && m.text && (
                                  <p className="mt-2 text-xs text-ink-faint">
                                    {chromeLang === "ar" ? "اكتملت الإجابة جزئيًا." : "Answer completed partially."}
                                  </p>
                                )}
                                {/* sources — clickable, human labels (spec §17) */}
                                {runState && runState.sources.length > 0 && !runState.error && (
                                  <div className="mt-3 flex flex-wrap items-center gap-2" dir={dir}>
                                    <span className="label">{runState.lang === "ar" ? "مُسنَد إلى" : "Grounded in"}</span>
                                    {runState.sources
                                      .filter((s, i, arr) => arr.findIndex((x) => x.source.kind === s.source.kind) === i)
                                      .slice(0, 3)
                                      .map((s) => {
                                      const href = sourceHref(s.source.kind, s.source);
                                      const label = sourceLabel(s.source.kind, s.label, runState.lang);
                                      return href ? (
                                        <a
                                          key={s.id}
                                          href={href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="copilot-chip !min-h-8 !px-2.5 !py-1 text-xs"
                                        >
                                          {label}
                                        </a>
                                      ) : (
                                        <span key={s.id} className="label">{label}</span>
                                      );
                                    })}
                                  </div>
                                )}
                                {/* Explain Why — plain-language, no scores (spec §18) */}
                                {runState && runState.done && !runState.error && (
                                  <button
                                    type="button"
                                    onClick={toggleExplain}
                                    aria-expanded={explainOpen && explainId === m.id}
                                    className="label mt-2.5 text-accent transition-colors hover:underline"
                                  >
                                    {explainWhyLabel(runState.lang)}
                                  </button>
                                )}
                                {explainOpen && explainId === m.id && runState && (
                                  <div className="panel mt-2 rounded-xl p-3" dir={dir} lang={runState.lang}>
                                    {explainWhyBody(runState.plan, runState.sources.map((s) => sourceLabel(s.source.kind, s.label, runState.lang)), runState.lang).map((line, i) => (
                                      <p key={i} className="text-sm leading-relaxed text-ink-soft">{line}</p>
                                    ))}
                                  </div>
                                )}
                                {/* contextual follow-ups (spec §24) */}
                                {runState && runState.done && !runState.error && followups.length > 0 && explainId !== m.id && (
                                  <div className="mt-3 flex flex-wrap gap-2" dir={dir}>
                                    {followups.map((f) => {
                                      const action = f.action;
                                      const text = f[runState.lang];
                                      if (action.kind === "run") {
                                        return (
                                          <button
                                            key={f.en}
                                            type="button"
                                            onClick={() => void run(action.prompt[runState.lang])}
                                            className="copilot-chip"
                                          >
                                            {text}
                                          </button>
                                        );
                                      }
                                      return (
                                        <a
                                          key={f.en}
                                          href={action.href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="copilot-chip"
                                        >
                                          {text}
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                                {runState?.plan?.suggestions && runState.done && !runState.error && (
                                  <div className="mt-3 flex flex-wrap items-center gap-2" dir={dir}>
                                    <span className="label">{RELATED[runState.lang]}</span>
                                    {runState.plan.suggestions.map((s) => (
                                      <button key={s} type="button" onClick={() => void run(s)} className="copilot-chip">
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                      {streaming && (
                        <span className="copilot-phase">
                          {STREAM_PHASE[chromeLang][phase === "writing" ? "writing" : "retrieving"]}
                        </span>
                      )}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {/* metrics strip (recruiter / stats plans) */}
                {lastRun && showMetricsStrip(lastRun.plan) && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-line bg-panel px-4 py-2.5">
                    {[...stats, ...githubStats].map((s) => (
                      <span
                        key={s.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-ink-soft"
                      >
                        <bdi dir="ltr" lang="en" className="ltr-token text-ink">{s.value}</bdi>
                        <span>{lastRun.lang === "ar" ? (STAT_LABEL_AR[s.label] ?? s.label) : s.label}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* mobile context bar — compact, tap to expand (spec §10 OPTION A) */}
                {lastRun && (lastRun.sources.length > 0 || lastRun.card) && (
                  <div className="border-t border-line bg-panel md:hidden">
                    <button
                      type="button"
                      onClick={() => setContextOpen((o) => !o)}
                      aria-expanded={contextOpen}
                      className="flex w-full items-center justify-between gap-2 px-4 py-2.5"
                    >
                      <span className="label truncate">
                        {contextLabel(contextTopic(lastRun.plan ?? null, lastRun.sources), lastRun.lang)}
                      </span>
                      <span className="label max-w-[50%] truncate text-ink-soft">
                        {lastRun.sources.slice(0, 3).map((s) => sourceLabel(s.source.kind, s.label, lastRun.lang)).join(" · ")}
                      </span>
                      <span aria-hidden="true" className="text-xs text-ink-faint">{contextOpen ? "⌃" : "⌄"}</span>
                    </button>
                  </div>
                )}

                {/* input — solid elevated surface, safe-area aware (spec §8) */}
                <div
                  className="border-t border-line bg-panel-2 px-4 pt-3"
                  style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
                >
                  <div className="flex items-end gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder={PLACEHOLDER[chromeLang]}
                      dir={dir}
                      lang={chromeLang}
                      aria-label={PLACEHOLDER[chromeLang]}
                      disabled={streaming}
                      className="h-12 flex-1 rounded-xl border border-line bg-panel px-4 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={send}
                      disabled={streaming || !input.trim()}
                      aria-label={chromeLang === "ar" ? "إرسال" : "Send"}
                      className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-ink text-bg transition-opacity hover:opacity-85 disabled:opacity-35"
                    >
                      <SendIcon />
                    </button>
                  </div>
                  {/* dev mode — diagnostics only, never for normal users */}
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDevMode((d) => !d)}
                      className="label transition-colors hover:text-ink-faint"
                    >
                      {devMode ? (chromeLang === "ar" ? "مطوّر: مفعّل" : "developer: on") : (chromeLang === "ar" ? "مطوّر: متوقف" : "developer: off")}
                    </button>
                    {devMode && lastRun && (
                      <span className="label truncate">
                        {lastRun.stats ? `${lastRun.stats.intent} · ${lastRun.stats.confidence.toFixed(2)} · ${lastRun.stats.totalMs}ms` : lastRun.plan?.template}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* card rail (desktop) — calmer surfaces (spec §11) */}
              <div className="hidden overflow-y-auto border-l border-line bg-panel-2/60 p-4 md:block">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint" dir={dir}>
                  {contextLabel(contextTopic(lastRun?.plan ?? null, lastRun?.sources), chromeLang)}
                </p>
                <CopilotCardPanel card={lastRun?.card ?? null} planCard={lastRun?.plan?.card} sources={lastRun?.sources} lang={lastRun?.lang ?? "en"} />
                {lastRun?.error && devMode && (
                  <div className="panel mt-4 rounded-xl p-3 font-mono text-[11px] text-ink-faint">
                    <p className="uppercase tracking-[0.16em]">diagnostic</p>
                    <p className="mt-1 break-words">kind={lastRun.error.kind}</p>
                    <p className="break-words">detail={lastRun.error.message}</p>
                    {lastRun.error.requestId && <p className="break-words">requestId={lastRun.error.requestId}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* mobile context bottom sheet */}
            <AnimatePresence>
              {contextOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    onClick={() => setContextOpen(false)}
                    className="absolute inset-0 z-20 bg-black/60 md:hidden"
                    aria-hidden="true"
                  />
                  <motion.div
                    initial={{ y: 48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 48, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    dir={dir}
                    className="absolute inset-x-0 bottom-0 z-30 max-h-[70%] overflow-y-auto rounded-t-2xl border-t border-line bg-panel-2 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                        {contextLabel(contextTopic(lastRun?.plan ?? null, lastRun?.sources), chromeLang)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setContextOpen(false)}
                        className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-ink-soft transition-colors hover:text-ink"
                      >
                        {chromeLang === "ar" ? "إغلاق" : "Close"}
                      </button>
                    </div>
                    <CopilotCardPanel card={lastRun?.card ?? null} planCard={lastRun?.plan?.card} sources={lastRun?.sources} lang={lastRun?.lang ?? "en"} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </MotionConfig>
  );
}