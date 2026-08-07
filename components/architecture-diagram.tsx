"use client";

import { motion } from "framer-motion";
import type { ArchFlow } from "@/lib/data";

const kindColor: Record<string, string> = {
  client: "text-sky-300 border-sky-400/30 bg-sky-400/10",
  api: "text-indigo-300 border-indigo-400/30 bg-indigo-400/10",
  model: "text-violet-300 border-violet-400/30 bg-violet-400/10",
  gate: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  db: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  outcome: "text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-400/10",
};

const kindDot: Record<string, string> = {
  client: "bg-sky-400",
  api: "bg-indigo-400",
  model: "bg-violet-400",
  gate: "bg-emerald-400",
  db: "bg-amber-400",
  outcome: "bg-fuchsia-400",
};

export function ArchitectureDiagram({ flow }: { flow: ArchFlow }) {
  const { nodes } = flow;
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Architecture
      </div>
      <div className="flex flex-col items-stretch gap-0">
        {nodes.map((node, i) => {
          const c = kindColor[node.kind ?? "api"] ?? kindColor.api;
          const d = kindDot[node.kind ?? "api"] ?? kindDot.api;
          const last = i === nodes.length - 1;
          return (
            <div key={`${node.label}-${i}`} className="flex flex-col items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-transform hover:-translate-y-0.5 ${c}`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${d}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight text-ink">
                    {node.label}
                  </p>
                  {node.sub && (
                    <p className="truncate font-mono text-xs text-ink-soft">
                      {node.sub}
                    </p>
                  )}
                </div>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {i + 1}
                </span>
              </motion.div>
              {!last && (
                <div className="mx-auto my-1 flex h-6 w-px items-center justify-center">
                  <span className="h-full w-px bg-gradient-to-b from-border-strong to-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {flow.caption && (
        <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
          {flow.caption}
        </p>
      )}
    </div>
  );
}