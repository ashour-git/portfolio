import type { Observability } from "@/lib/data";

export function Monitoring({ observability }: { observability: Observability }) {
  return (
    <div className="terminal overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-7">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          Production monitoring
        </div>
        <div className="flex flex-wrap gap-1.5">
          {observability.tools.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[11px] text-ink-soft"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
        <div className="border-b border-line p-5 sm:p-7 md:border-b-0 md:border-r">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            What we watch
          </p>
          <ul className="space-y-3">
            {observability.watch.map((w) => (
              <li key={w} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent"
                />
                {w}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 sm:p-7">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            log stream
          </p>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-accent/80">
            {observability.logs.map((line, i) => (
              <span key={i} className="block whitespace-pre">
                {line}
              </span>
            ))}
          </pre>
        </div>
      </div>

      <p className="border-t border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint sm:px-7">
        Representative traces · same metrics cited in Results
      </p>
    </div>
  );
}