"use client";

import { useEffect, useMemo, useState } from "react";
import map from "@/lib/memory-map.json";
import demo from "@/lib/memory-demo.json";

/*
  The copilot's memory, drawn as a constellation. Each star is one of the
  documents the RAG copilot retrieves from, placed by t-SNE over its real
  MiniLM embedding (scripts/memory_map.py); lines join nearest neighbours.
  Asking a question lights up what retrieval actually returned: the example
  questions are precomputed with the copilot's own pipeline
  (scripts/memory-demo.ts), and live answers arrive via "ma:retrieval".
*/

type Hit = { id: string; score: number };
type Run = { question: string; hits: Hit[]; retrievalMs?: number; live?: boolean };

const W = 600;
const H = 440;
const byId = new Map(map.nodes.map((n, i) => [n.id, i]));
const P = map.nodes.map((n) => [Math.round(n.x * W * 10) / 10, Math.round(n.y * H * 10) / 10] as const);

export function MemoryMap() {
  const [run, setRun] = useState<Run>(demo[0]);
  const [hover, setHover] = useState<number | null>(null);

  // live answers from the copilot light up the map too
  useEffect(() => {
    const onRetrieval = (e: Event) => {
      const d = (e as CustomEvent<{ question?: string; hits?: Hit[] }>).detail;
      if (d?.hits?.length) setRun({ question: d.question ?? "Your question", hits: d.hits.slice(0, 5), live: true });
    };
    window.addEventListener("ma:retrieval", onRetrieval);
    return () => window.removeEventListener("ma:retrieval", onRetrieval);
  }, []);

  const hits = useMemo(() => run.hits.filter((h) => byId.has(h.id)), [run]);
  const lit = useMemo(() => new Set(hits.map((h) => byId.get(h.id)!)), [hits]);

  // the question lands at the score-weighted centre of what it retrieved
  const q = useMemo(() => {
    const ws = hits.map((h) => Math.max(h.score, 0.05));
    const sum = ws.reduce((a, b) => a + b, 0) || 1;
    const x = hits.reduce((a, h, k) => a + P[byId.get(h.id)!][0] * ws[k], 0) / sum;
    const y = hits.reduce((a, h, k) => a + P[byId.get(h.id)!][1] * ws[k], 0) / sum;
    return [Math.round(x), Math.round(y)] as const;
  }, [hits]);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
      <div>
        <p className="font-mono text-sm text-ink-faint">Pick a question to see what the copilot retrieves.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {demo.map((d) => {
            const active = !run.live && run.question === d.question;
            return (
              <button
                key={d.question}
                type="button"
                aria-pressed={active}
                onClick={() => setRun(d)}
                className={`min-h-11 border px-3 py-2 text-left font-mono text-[13px] transition-colors ${
                  active ? "border-accent bg-accent text-accent-ink" : "border-border-strong text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {d.question}
              </button>
            );
          })}
        </div>

        <div className="mt-8" aria-live="polite">
          <p className="font-mono text-[13px] text-ink-faint">
            {run.live ? "Your last question" : "Retrieved for"}: <span className="text-ink">&ldquo;{run.question}&rdquo;</span>
          </p>
          <ol className="mt-3 space-y-1.5">
            {hits.map((h, k) => {
              const n = map.nodes[byId.get(h.id)!];
              return (
                <li key={h.id} className="flex items-baseline gap-3 font-mono text-sm">
                  <span className="w-4 text-ink-faint">{k + 1}</span>
                  <span className="flex-1 truncate text-ink" dir="auto">{n.label}</span>
                  <span className="tabular-nums text-ink-faint">{h.score.toFixed(2)}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-sm text-ink-faint">
            Scores blend cosine similarity with keyword match. Same pipeline the copilot uses, run offline.
          </p>
        </div>
      </div>

      <figure className="memory-sky">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Constellation of the copilot's ${map.nodes.length} memory documents; ${hits.length} are lit for the selected question.`}>
          {map.edges.map(([i, j]) => (
            <line key={`${i}-${j}`} x1={P[i][0]} y1={P[i][1]} x2={P[j][0]} y2={P[j][1]} className="mm-edge" />
          ))}
          {hits.map((h, k) => {
            const i = byId.get(h.id)!;
            return (
              <line
                key={`${run.question}-${h.id}`}
                x1={q[0]}
                y1={q[1]}
                x2={P[i][0]}
                y2={P[i][1]}
                className="mm-ray"
                style={{ animationDelay: `${k * 90}ms`, opacity: 0.35 + Math.min(h.score, 1) * 0.65 }}
              />
            );
          })}
          {map.nodes.map((n, i) => {
            const on = lit.has(i);
            const big = n.group === "project";
            return (
              <g key={n.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <circle cx={P[i][0]} cy={P[i][1]} r={14} fill="transparent" />
                <circle cx={P[i][0]} cy={P[i][1]} r={on ? 5.5 : big ? 3.6 : 2.6} className={on ? "mm-star mm-on" : `mm-star mm-${n.group}`} />
                {(big || on || hover === i) && (
                  <text
                    x={n.side === "r" ? P[i][0] + 9 : n.side === "l" ? P[i][0] - 9 : P[i][0]}
                    y={n.side === "t" ? P[i][1] - 11 : n.side === "b" ? P[i][1] + 18 : P[i][1] + 4}
                    textAnchor={n.side === "r" ? "start" : n.side === "l" ? "end" : "middle"}
                    className={on ? "mm-label mm-label-on" : "mm-label"}
                    direction={n.group === "arabic" ? "rtl" : undefined}
                  >
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
          <circle key={run.question} cx={q[0]} cy={q[1]} r={7} className="mm-query" />
        </svg>
        <figcaption className="mt-3 font-mono text-xs text-ink-faint">
          {map.nodes.length} documents, {map.dim}-d {map.model} embeddings, t-SNE layout. Lines join nearest neighbours.
        </figcaption>
      </figure>
    </div>
  );
}
