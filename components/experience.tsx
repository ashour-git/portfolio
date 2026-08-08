import { experience, trajectory } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function Experience() {
  return (
    <section id="experience" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <SectionHeader eyebrow="ACROSS ROLES" title="Owning AI products" accent="end to end." />

        <div className="relative space-y-8 border-l border-border pl-8 md:pl-12">
          {experience.map((role, i) => (
            <Reveal key={`${role.company}-${role.title}`} delay={i * 60} as="div">
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[41px] top-2 h-3 w-3 rounded-full bg-gradient-to-br from-accent to-accent-2 shadow-lg shadow-accent/30 md:-left-[57px]"
                />
                <div className="glass rounded-3xl p-7">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-xl font-semibold tracking-tight text-ink">
                      {role.title}
                    </h3>
                    <span className="text-base text-ink-soft">— {role.company}</span>
                    <span className="ml-auto font-mono text-sm text-ink-faint">
                      {role.period}
                    </span>
                  </div>
                  {role.context && (
                    <p className="mt-1.5 font-mono text-sm text-ink-faint">
                      {role.context}
                    </p>
                  )}
                  <ul className="mt-4 max-w-3xl space-y-2.5">
                    {role.points.map((pt) => (
                      <li
                        key={pt}
                        className="flex gap-3 text-[15px] leading-relaxed text-ink-soft"
                      >
                        <span aria-hidden="true" className="mt-[11px] h-px w-4 shrink-0 bg-border-strong" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* progression timeline: ML projects → production AI */}
        <div className="mt-20 md:mt-24">
          <Reveal>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
              Progression
            </p>
            <h3 className="mb-12 max-w-xl text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              From ML{" "}
              <span className="font-serif italic font-normal text-ink">
                experiments
              </span>{" "}
              to production{" "}
              <span className="font-serif italic font-normal text-ink">
                AI systems.
              </span>
            </h3>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {trajectory.map((stage, i) => (
              <Reveal key={stage.period} delay={i * 70} as="div">
                <div className="glass flex h-full flex-col rounded-3xl p-6">
                  <span className="font-mono text-xs tracking-wide text-ink-faint">
                    {stage.period}
                  </span>
                  <h4 className="mt-3 text-lg font-semibold tracking-tight text-ink">
                    {stage.title}
                  </h4>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                    {stage.body}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {stage.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[11px] text-ink-soft"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}