import { projects } from "@/lib/data";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";

const featured = projects.find((p) => p.featured);
const rest = projects.filter((p) => !p.featured);

export function Projects() {
  return (
    <section id="work" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Selected Work
          </p>
          <h2 className="mb-14 max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
            Shipping AI,{" "}
            <span className="font-serif italic font-normal text-ink">
              not demos.
            </span>
          </h2>
        </Reveal>

        {/* featured project — editorial, asymmetric */}
        {featured && (
          <Reveal className="mb-6">
            <a
              href={featured.href}
              target="_blank"
              rel="noopener noreferrer"
              className="glass group grid gap-8 overflow-hidden rounded-[2rem] p-8 transition-all hover:-translate-y-1 hover:border-border-strong md:grid-cols-[1.15fr_0.85fr] md:p-12"
            >
              <div>
                <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                  Featured · {featured.domain}
                </span>
                <h3 className="mt-6 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                  {featured.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                  {featured.summary}
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {featured.impact?.map((im) => (
                    <span
                      key={im}
                      className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-ink-soft"
                    >
                      {im}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-6 border-t border-border pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
                    Architecture
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {featured.stack.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-ink-soft"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-accent">
                    View on GitHub
                    <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="font-mono text-xs text-ink-faint">
                    {featured.note}
                  </span>
                </div>
              </div>
            </a>
          </Reveal>
        )}

        {/* remaining projects — grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {rest.map((p, i) => (
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
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                    {p.tagline}
                  </p>
                </div>

                <div className="mt-7">
                  <div className="flex flex-wrap gap-2">
                    {p.stack.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-ink-soft"
                      >
                        {t}
                      </span>
                    ))}
                    {p.stack.length > 4 && (
                      <span className="rounded-full border border-border px-3 py-1 font-mono text-xs text-ink-faint">
                        +{p.stack.length - 4}
                      </span>
                    )}
                  </div>
                  {p.note && (
                    <p className="mt-4 font-mono text-xs uppercase tracking-wide text-accent-2">
                      {p.note}
                    </p>
                  )}
                  <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-accent">
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