import { experience } from "@/lib/data";
import { list, period, tidy } from "@/lib/text";

// a short, stable "commit hash" per role (decorative, derived from the text)
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="relative scroll-mt-20 py-20 md:py-24">
      <div className="shell">
        <h2 id="experience-title" className="display max-w-[22ch]">
          From ML experiments to production AI
        </h2>

        <div className="mt-12 max-w-4xl">
          <p className="font-mono text-sm text-ink-faint" aria-hidden="true">
            <span className="text-accent">$</span> git log --graph career
          </p>
          <ol className="gitlog mt-6">
            {experience.map((role, i) => {
              const head = i === 0;
              return (
                <li key={`${role.company}-${role.title}`} className="gitlog-row" data-head={head ? "" : undefined}>
                  <div className="gitlog-rail" aria-hidden="true">
                    <span className="gitlog-node" />
                  </div>
                  <div className={head ? "pb-12" : "pb-10"}>
                    <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-[13px]">
                      <span className="text-ink-faint" aria-hidden="true">{hash(role.title + role.company)}</span>
                      {head && <span className="font-bold text-accent">(HEAD)</span>}
                      <span className="text-ink-soft">{period(role.period)}</span>
                    </p>
                    <h3 className={`mt-1.5 font-mono font-extrabold tracking-[-0.03em] text-ink ${head ? "text-2xl md:text-3xl" : "text-xl"}`}>
                      {role.title} <span className="font-bold text-ink-faint">at {role.company}</span>
                    </h3>
                    {role.context && <p className="mt-2 text-sm text-ink-faint">{role.context}</p>}
                    <ul className={`mt-3 max-w-[68ch] space-y-1.5 text-ink-soft ${head ? "" : "text-[15px]"}`}>
                      {role.points.map((pt) => (
                        <li key={pt} className="relative pl-5">
                          <span aria-hidden="true" className="absolute left-0 top-0 font-mono text-accent">+</span>
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
