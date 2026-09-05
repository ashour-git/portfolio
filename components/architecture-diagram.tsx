"use client";

import { motion } from "framer-motion";
import type { ArchFlow } from "@/lib/data";

// One neutral treatment for every layer — layer identity lives in the
// labels, not the paint. Only the terminal outcome is tinted, brass for
// proven, matching the site's accent discipline (mint = live, brass =
// proven). The step numbers stay: a pipeline is a real sequence.
const LAYER = "border-line bg-surface";
const LAYER_DOT = "bg-ink-faint";
const OUTCOME = "border-brass/50 bg-brass-soft";
const OUTCOME_DOT = "bg-brass";

export function ArchitectureDiagram({ flow }: { flow: ArchFlow }) {
  const { nodes } = flow;
  return (
    <div className="panel rounded-2xl p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" />
        Architecture
      </div>
      <div className="flex flex-col items-stretch gap-0">
        {nodes.map((node, i) => {
          const last = i === nodes.length - 1;
          const outcome = node.kind === "outcome";
          return (
            <div key={`${node.label}-${i}`} className="flex flex-col items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${outcome ? OUTCOME : LAYER}`}
              >
                <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${outcome ? OUTCOME_DOT : LAYER_DOT}`} />
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
                <span className="ml-auto font-mono text-xs uppercase tracking-wide text-ink-faint">
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