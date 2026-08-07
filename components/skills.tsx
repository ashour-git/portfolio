import { skills } from "@/lib/data";
import { Reveal } from "./reveal";

export function Skills() {
  return (
    <section id="stack" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Engineering Capabilities
          </p>
          <h2 className="mb-4 max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
            Capabilities,{" "}
            <span className="font-serif italic font-normal text-ink">
              not tool lists.
            </span>
          </h2>
          <p className="mb-14 max-w-2xl text-base leading-relaxed text-ink-soft">
            Every capability below is exercised in a shipped project on GitHub —
            each one has a case study, tests, and an architecture diagram.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {skills.map((group, i) => (
            <Reveal key={group.title} delay={(i % 2) * 60} as="div">
              <div className="glass flex h-full flex-col rounded-3xl p-7 transition-all hover:-translate-y-1 hover:border-border-strong">
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