import { projects } from "@/lib/data";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";

export function Projects() {
  return (
    <section id="work" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Selected Work
          </p>
          <h2 className="mb-14 max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
            Shipping AI, not demos.
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.index} delay={(i % 2) * 60}>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass group flex h-full flex-col justify-between rounded-3xl p-8 transition-all hover:-translate-y-1 hover:border-border-strong"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm text-ink-faint">
                      {p.index}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                      {p.domain}
                    </span>
                  </div>
                  <div className="mt-6 flex items-baseline gap-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-ink">
                      {p.title}
                    </h3>
                    {p.note && (
                      <span className="font-mono text-xs uppercase tracking-wide text-accent-2">
                        {p.note}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                    {p.tagline}
                  </p>
                </div>

                <div className="mt-7">
                  <div className="flex flex-wrap gap-2">
                    {p.stack.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-ink-soft"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-accent">
                    View on GitHub
                    <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}