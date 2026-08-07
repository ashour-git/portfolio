import { skills } from "@/lib/data";
import { Reveal } from "./reveal";

export function Skills() {
  return (
    <section id="stack" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Core Stack
          </p>
          <h2 className="mb-14 max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
            A working stack, grouped by discipline.
          </h2>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((group, i) => (
            <Reveal key={group.title} delay={(i % 3) * 60}>
              <div className="glass h-full rounded-3xl p-7">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                  {group.title}
                </h3>
                <ul className="mt-5 space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-baseline gap-3">
                      <span aria-hidden="true" className="h-px w-3 shrink-0 bg-border-strong" />
                      <span className="text-[15px] text-ink">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}