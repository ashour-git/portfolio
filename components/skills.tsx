import { skills } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function Skills() {
  return (
    <section id="stack" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <SectionHeader
          eyebrow="CAPABILITIES"
          title="Capabilities,"
          accent="not tool lists."
          pull="Every capability below is exercised in a shipped project on GitHub — each one has a case study, tests, and an architecture diagram."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {skills.map((group, i) => (
            <Reveal key={group.title} delay={(i % 2) * 60} as="div">
              <div className="glass flex h-full flex-col rounded-3xl p-7 transition-all hover:-translate-y-1 hover:border-border-strong hover:shadow-xl hover:shadow-black/30">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    {group.title}
                  </h3>
                  <span className="font-mono text-xs text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-xs text-ink-soft"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}