import { experience } from "@/lib/data";
import { list, period, tidy } from "@/lib/text";
import { OrbitDiagram } from "./diagrams";

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="relative isolate scroll-mt-20 overflow-x-clip py-20 md:py-24">
      <OrbitDiagram className="right-[-6rem] top-24 w-[36rem]" />
      <div className="shell">
        <h2 id="experience-title" className="display max-w-[22ch]">
          From ML experiments to production AI
        </h2>

        <div className="mt-12 max-w-4xl">
          <ol className="gitlog">
            {experience.map((role, i) => {
              const head = i === 0;
              return (
                <li key={`${role.company}-${role.title}`} className="gitlog-row" data-head={head ? "" : undefined}>
                  <div className="gitlog-rail" aria-hidden="true">
                    <span className="gitlog-node" />
                  </div>
                  <div className={head ? "pb-12" : "pb-10"}>
                    <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-[13px]">
                      {head && <span className="font-bold text-accent">now</span>}
                      <span className="text-ink-soft">{period(role.period)}</span>
                    </p>
                    <h3 className={`mt-1.5 font-display font-semibold tracking-[-0.01em] text-ink ${head ? "text-3xl md:text-[2.25rem]" : "text-2xl"}`}>
                      {role.title} <span className="font-normal italic text-ink-soft">at {role.company}</span>
                    </h3>
                    {role.context && <p className="mt-2 text-sm text-ink-faint">{role.context}</p>}
                    <ul className={`mt-3 max-w-[68ch] space-y-1.5 text-ink-soft ${head ? "" : "text-[15px]"}`}>
                      {role.points.map((pt) => (
                        <li key={pt} className="relative pl-5">
                          <span aria-hidden="true" className="absolute left-0 top-[0.7em] h-px w-2.5 bg-ink-faint" />
                          {tidy(pt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

      </div>
    </section>
  );
}
