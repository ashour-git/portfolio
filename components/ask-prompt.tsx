"use client";

import { useState, type FormEvent } from "react";

/**
 * A terminal-style prompt that sends its question straight to the portfolio
 * copilot (contract: CustomEvent "ma:open-copilot" with detail.question).
 */
export function AskPrompt({ className = "" }: { className?: string }) {
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const question = q.trim();
    window.dispatchEvent(
      question ? new CustomEvent("ma:open-copilot", { detail: { question } }) : new Event("ma:open-copilot"),
    );
    setQ("");
  };

  return (
    <div className={`js-only ${className}`}>
      <form className="ask" onSubmit={submit}>
        <label htmlFor="hero-ask" className="sr-only">
          Ask the portfolio copilot a question
        </label>
        <span className="ask-prefix" aria-hidden="true">
          <b>$</b> ask
        </span>
        <input
          id="hero-ask"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="How is RestAI grounded?"
          autoComplete="off"
          enterKeyHint="send"
          maxLength={600}
        />
        <button type="submit">Ask</button>
      </form>
      <p className="mt-2.5 text-sm text-ink-faint">
        A RAG copilot answers from my project docs and cites them.{" "}
        <span className="hidden sm:inline">Ctrl J opens it anywhere.</span>
      </p>
    </div>
  );
}
