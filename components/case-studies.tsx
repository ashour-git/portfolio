import { projects, githubStats, profile } from "@/lib/data";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";
import { SectionHeader } from "./section-header";

export function CaseStudies() {
  return (
    <section id="case-studies" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <SectionHeader
          variant="statement"
          title="Decisions,"
          accent="not just tools."
          pull="Recruiters hire engineers for the choices they make under constraints. Each project below is a record of the architecture, the tradeoffs, and the proof that it works."
        />

        <ul className="mt-14 border-t border-line">
          {projects.map((p, i) => (
            <Reveal key={p.index} delay={(i % 3) * 50} as="li">
              <li className="border-b border-line">
                <a
                  href={p.study ? `/case-studies/${p.study.slug}` : p.href}
                  target={p.study ? undefined : "_blank"}
                  rel={p.study ? undefined : "noopener noreferrer"}
                  className="group grid gap-3 py-7 transition-colors hover:bg-surface/40 md:grid-cols-[4rem_10rem_1fr_auto] md:items-baseline md:gap-8"
                >
                  <span className="eyebrow">{p.index}</span>
                  <span className="eyebrow text-ink-soft">{p.domain}</span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-ink md:text-xl">
                      {p.title}
                    </h3>
                    <p className="lead mt-2 max-w-2xl text-[15px]">
                      {p.decisions[0].title}: {p.decisions[0].body}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors group-hover:text-accent">
                    Case study
                    <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              </li>
            </Reveal>
          ))}
        </ul>

        {/* GitHub proof strip */}
        <Reveal as="div" delay={120}>
          <div className="mt-14 overflow-hidden rounded-[2rem] border border-line bg-bg/40">
            <div className="grid gap-8 p-8 md:grid-cols-[1fr_1.4fr] md:items-center md:p-10">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-ink">
                  Verified on{" "}
                  <span className="serif-accent text-ink">GitHub.</span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Every project runs tests in CI and documents its architecture
                  in the repo — the proof is public and reproducible.
                </p>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-bg"
                >
                  github.com/ashour-git
                  <ArrowIcon className="h-4 w-4" />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {githubStats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-semibold tracking-tight text-ink">
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-ink-soft">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
