import { skills } from "@/lib/data";
import { Section } from "./section";
import { Reveal } from "./reveal";

export function Skills() {
  return (
    <Section
      id="stack"
      eyebrow="Core Stack"
      title="A working stack, grouped by discipline."
    >
      <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((group, i) => (
          <Reveal key={group.title} delay={(i % 3) * 60}>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
              {group.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {group.items.map((item) => (
                <li key={item} className="flex items-baseline gap-3">
                  <span aria-hidden="true" className="h-px w-3 shrink-0 bg-line" />
                  <span className="text-[15px] text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}