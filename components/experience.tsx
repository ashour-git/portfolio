import { experience } from "@/lib/data";
import { Section } from "./section";
import { Reveal } from "./reveal";

export function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title={
        <>
          Owning AI products
          <br />
          end to end.
        </>
      }
    >
      <ol className="relative space-y-14 border-l border-line pl-8 md:pl-12">
        {experience.map((role, i) => (
          <Reveal as="li" key={`${role.company}-${role.title}`} delay={i * 60} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[41px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-accent md:-left-[57px]"
            />
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
                  <span aria-hidden="true" className="mt-[11px] h-px w-4 shrink-0 bg-line" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}