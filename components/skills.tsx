import { skills } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function Skills() {
  return (
    <section id="stack" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <SectionHeader
          variant="quiet"
          eyebrow="CAPABILITIES"
          title="Capabilities, not tool lists."
          pull="Every capability below is exercised in a shipped project on GitHub — each one has a case study, tests, and an architecture diagram."
        />

        <div className="mt-12 grid gap-x-12 gap-y-px sm:grid-cols-2">
          {skills.map((group, i) => (
            <Reveal key={group.title} delay={(i % 2) * 50} as="div">
              <div className="border-t border-line py-7">
                <div className="flex items-baseline gap-3">
                  <span className="eyebrow w-7 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    {group.title}
                  </h3>
                </div>
                <p className="lead mt-2.5 text-[15px]">{group.statement}</p>
                <p className="mt-3 font-mono text-xs text-ink-faint">
                  {group.items.join("  ·  ")}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
