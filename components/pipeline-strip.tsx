import type { ArchFlow } from "@/lib/data";

export function PipelineStrip({ flow, className = "" }: { flow: ArchFlow; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[11px] ${className}`}>
      {flow.nodes.map((n, i) => (
        <span key={`${n.label}-${i}`} className="inline-flex items-center gap-2">
          <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-ink-soft">{n.label}</span>
          {i < flow.nodes.length - 1 && <span className="text-ink-faint" aria-hidden="true">→</span>}
        </span>
      ))}
    </div>
  );
}