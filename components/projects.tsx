import { projects } from "@/lib/data";
import { Section } from "./section";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";

export function Projects() {
  return (
    <Section
      id="work"
      eyebrow="Selected Work"
      title={
        <>
          Projects that shipped,
          <br />
          not just prototypes.
        </>
      }
    >
      <ul className="divide-y divide-line border-y border-line">
        {projects.map((p, i) => (
          <Reveal as="li" key={p.index} delay={i * 60}>
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid gap-4 py-10 transition-colors md:grid-cols-[92px_1fr_auto] md:gap-8 md:py-12"
            >
              <span className="font-mono text-sm text-ink-faint">{p.index}</span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-2xl font-semibold tracking-tight text-ink">
                    {p.title}
                  </h3>
                  {p.note && (
                    <span className="font-mono text-xs uppercase tracking-wide text-accent-ink">
                      {p.note}
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                  {p.tagline}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.stack.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-line bg-white/60 px-3 py-1 font-mono text-xs text-ink-soft"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <span className="hidden items-center gap-1 self-center font-medium text-ink transition-colors group-hover:text-accent-ink md:flex">
                View
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}