import { experience, trajectory } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function Experience() {
  return (
    <section id="experience" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <SectionHeader variant="statement" title="Owning AI products" accent="end to end." />

        {/* roles — recent role carries the most weight, older roles quiet down */}
        <div className="mt-14 border-t border-line">
          {experience.map((role, i) => {
            const lead = i === 0;
            return (
              <Reveal key={`${role.company}-${role.title}`} delay={i * 50} as="div">
                <div
                  className={`grid gap-4 border-b border-line md:grid-cols-[10rem_1fr] md:gap-10 ${
                    lead ? "py-10 md:py-12" : "py-8"
                  }`}
                >
                  <span className="eyebrow pt-1">{role.period}</span>
                  <div>
                    <h3
                      className={`font-semibold tracking-tight text-ink ${
                        lead ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
                      }`}
                    >
                      {role.title}
                      <span className="text-ink-soft"> — {role.company}</span>
                    </h3>
                    {role.context && (
                      <p className="mt-2 font-mono text-sm text-ink-faint">
                        {role.context}
                      </p>
                    )}
                    <ul
                      className={`mt-4 max-w-3xl space-y-2.5 ${
                        lead ? "text-[15px] text-ink-soft" : "text-sm text-ink-faint"
                      }`}
                    >
                      {role.points.map((pt) => (
                        <li key={pt} className="flex gap-3 leading-relaxed">
                          <span
                            aria-hidden="true"
                            className="mt-[0.65em] h-px w-4 shrink-0 bg-border-strong"
                          />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* progression: ML experiments → production AI systems */}
        <div className="mt-20 md:mt-24">
          <Reveal>
            <h3 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              From ML{" "}
              <span className="serif-accent text-ink-soft">experiments</span> to
              production{" "}
              <span className="serif-accent text-ink-soft">AI systems.</span>
            </h3>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {trajectory.map((stage, i) => (
              <Reveal key={stage.period} delay={i * 60} as="div">
                <div className="h-full border-t border-line pt-5">
                  <span className="eyebrow">{stage.period}</span>
                  <h4 className="mt-3 text-lg font-semibold tracking-tight text-ink">
                    {stage.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {stage.body}
                  </p>
                  <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                    {stage.tags.join("  ·  ")}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
