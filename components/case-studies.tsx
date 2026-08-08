import { projects, githubStats, profile } from "@/lib/data";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";

export function CaseStudies() {
  return (
    <section id="case-studies" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Engineering Case Studies
          </p>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
            Decisions,{" "}
            <span className="font-serif italic font-normal text-ink">
              not just tools.
            </span>
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            Recruiters hire engineers for the choices they make under
            constraints. Each project below is a record of the architecture,
            the tradeoffs, and the proof that it works.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal key={p.index} delay={(i % 3) * 60} as="div">
              <a
                href={p.study ? `/case-studies/${p.study.slug}` : p.href}
                target={p.study ? undefined : "_blank"}
                rel={p.study ? undefined : "noopener noreferrer"}
                className="glass group flex h-full flex-col rounded-3xl p-7 transition-all hover:-translate-y-1 hover:border-border-strong hover:shadow-xl hover:shadow-black/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-faint">
                    {p.index}
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                    {p.domain}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">
                  {p.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                  {p.decisions[0].title}: {p.decisions[0].body}
                </p>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {p.performance.slice(0, 3).map((m) => (
                    <span
                      key={m.label}
                      className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[11px] text-ink-soft"
                    >
                      {m.value} {m.label}
                    </span>
                  ))}
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 border-t border-line pt-4 text-sm font-medium text-ink transition-colors group-hover:text-accent">
                  Read the case study
                  <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        {/* GitHub proof strip */}
        <Reveal as="div" delay={120}>
          <div className="mt-14 overflow-hidden rounded-[2rem] border border-line bg-bg/40">
            <div className="grid gap-8 p-8 md:grid-cols-[1fr_1.4fr] md:items-center md:p-10">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-ink">
                  Verified on{" "}
                  <span className="text-gradient">GitHub.</span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Every project runs tests in CI and documents its architecture
                  in the repo — the proof is public and reproducible.
                </p>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-bg"
                >
                  github.com/ashour-git
                  <ArrowIcon className="h-4 w-4" />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {githubStats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-semibold tracking-tight text-ink">
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-ink-soft">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}