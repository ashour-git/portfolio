import type { ArchFlow } from "@/lib/data";
import { tidy } from "@/lib/text";

/**
 * Vertical pipeline. Every layer gets one neutral treatment; only the
 * terminal outcome is tinted with the accent. Step numbers stay because a
 * pipeline is a real sequence.
 */
export function ArchitectureDiagram({ flow, compact = false }: { flow: ArchFlow; compact?: boolean }) {
  const { nodes } = flow;
  return (
    <figure className={compact ? "" : "hud p-5 sm:p-7"}>
      {!compact && <figcaption className="mb-5 font-mono text-sm font-bold text-ink">Architecture</figcaption>}
      <ol className="flex flex-col">
        {nodes.map((node, i) => {
          const last = i === nodes.length - 1;
          const outcome = node.kind === "outcome";
          return (
            <li key={`${node.label}-${i}`} className="flex flex-col">
              <div
                className={`flex items-center gap-3 rounded-xl border px-4 ${compact ? "py-2.5" : "py-3"} ${
                  outcome ? "border-accent/40 bg-accent-soft" : "border-line bg-surface"
                }`}
              >
                <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-ink-faint">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold leading-tight text-ink">{node.label}</p>
                  {node.sub && <p className="truncate font-mono text-xs text-ink-soft">{node.sub}</p>}
                </div>
              </div>
              {!last && <span aria-hidden="true" className="ml-[1.6rem] h-4 w-px bg-border-strong" />}
            </li>
          );
        })}
      </ol>
      {flow.caption && !compact && (
        <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">{tidy(flow.caption)}</p>
      )}
    </figure>
  );
}
