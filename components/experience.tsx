import { experience } from "@/lib/data";
import { Reveal } from "./reveal";

export function Experience() {
  return (
    <section id="experience" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Experience
          </p>
          <h2 className="mb-14 max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
            Owning AI products end to end.
          </h2>
        </Reveal>

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
      </div>
    </section>
  );
}