import { experience, trajectory } from "@/lib/data";
import { list, period, tidy } from "@/lib/text";

// Orbit geometry in a 1000 x 140 viewBox: a quadratic arc, apex mid-way.
const H = 140;
const P0 = 124;
const P1 = -36;
const yAt = (t: number) => (1 - t) ** 2 * P0 + 2 * (1 - t) * t * P1 + t * t * P0;
const NODE_T = trajectory.map((_, i) => 0.03 + i * 0.25);

export function Experience() {
  const current = trajectory.length - 1;
  const cut = NODE_T[current] * 1000;

  return (
    <section id="experience" aria-labelledby="experience-title" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="shell">
        <h2 id="experience-title" className="display max-w-[22ch]">
          From ML experiments to production AI
        </h2>

        {/* orbit: the visual index of the four stages (desktop) */}
        <div className="relative mt-16 hidden lg:block" aria-hidden="true" style={{ height: H }}>
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none">
            <defs>
              <clipPath id="orbit-past">
                <rect x="0" y="-60" width={cut} height={H + 120} />
              </clipPath>
            </defs>
            <path
              d={`M0 ${P0} Q500 ${P1} 1000 ${P0}`}
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth="1.5"
              strokeDasharray="3 6"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M0 ${P0} Q500 ${P1} 1000 ${P0}`}
              fill="none"
              stroke="var(--color-ink-faint)"
              strokeWidth="1.5"
              clipPath="url(#orbit-past)"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {NODE_T.map((t, i) => {
            const now = i === current;
            return (
              <div key={i} className="absolute" style={{ left: `${t * 100}%`, top: yAt(t) }}>
                <span
                  className={`block h-3 w-3 -translate-x-1/2 -translate-y-1/2 border-2 ${
                    now ? "border-accent bg-accent" : "border-ink-faint bg-bg"
                  }`}
                />
                {now && (
                  <span className="detect" style={{ left: -16, top: -16, width: 32, height: 32 }}>
                    <span className="detect-label">now</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:mt-8 lg:grid-cols-4 lg:gap-8">
          {trajectory.map((stage, i) => {
            const now = i === current;
            return (
              <li key={stage.period} className="relative border-l border-line pl-5 lg:border-l-0 lg:pl-0">
                <span
                  aria-hidden="true"
                  className={`absolute -left-[5px] top-1.5 block h-2.5 w-2.5 border-2 lg:hidden ${
                    now ? "border-accent bg-accent" : "border-ink-faint bg-bg"
                  }`}
                />
                <p className={`font-mono text-sm ${now ? "font-bold text-accent" : "text-ink-faint"}`}>
                  {period(stage.period)}
                  {now && <span className="sr-only"> (current)</span>}
                </p>
                <h3 className="mt-2 font-mono text-lg font-bold tracking-tight text-ink">{stage.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{tidy(stage.body)}</p>
                <p className="mt-3 font-mono text-xs text-ink-faint">{list(stage.tags)}</p>
              </li>
            );
          })}
        </ol>

        {/* roles */}
        <h3 className="mt-24 font-mono text-2xl font-bold tracking-tight text-ink md:text-[1.75rem]">Roles</h3>
        <ol className="mt-8 border-t border-line">
          {experience.map((role, i) => {
            const lead = i === 0;
            return (
              <li
                key={`${role.company}-${role.title}`}
                className={`grid grid-cols-1 gap-3 border-b border-line md:grid-cols-[11rem_1fr] md:gap-10 ${lead ? "py-10" : "py-8"}`}
              >
                <p className="pt-1 font-mono text-sm text-ink-faint">{period(role.period)}</p>
                <div>
                  <h4 className={`font-mono font-extrabold tracking-[-0.03em] text-ink ${lead ? "text-2xl md:text-3xl" : "text-xl"}`}>
                    {role.title} <span className="font-bold text-ink-faint">at {role.company}</span>
                  </h4>
                  {role.context && <p className="mt-2 text-sm text-ink-faint">{role.context}</p>}
                  <ul className={`mt-4 max-w-[68ch] space-y-2 text-ink-soft ${lead ? "" : "text-[15px]"}`}>
                    {role.points.map((pt) => (
                      <li key={pt} className="relative pl-5">
                        <span aria-hidden="true" className="absolute left-0 top-[0.75em] h-[3px] w-[3px] bg-ink-faint" />
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
    </section>
  );
}
