import { profile, heroStats } from "@/lib/data";
import { ArrowIcon } from "./icons";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-36 md:pt-44"
    >
      {/* subtle accent wash — restrained, no gimmicks */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] h-[480px] w-[480px] rounded-full bg-accent-soft blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <p
              className="animate-fade mb-8 font-mono text-xs uppercase tracking-[0.24em] text-ink-faint"
              style={{ animationDelay: "60ms" }}
            >
              AI Engineer — Cairo, Egypt
            </p>
            <h1 className="animate-rise text-[2.7rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl md:text-7xl">
              Production AI for
              <br />
              <span className="text-accent-ink">governance</span>-grade
              <br />
              systems.
            </h1>
            <p
              className="animate-rise mt-8 max-w-xl text-lg leading-relaxed text-ink-soft"
              style={{ animationDelay: "140ms" }}
            >
              I build LLM applications, RAG systems, and MLOps pipelines that
              operate under real constraints — multi-tenant architecture,
              audit-grade data integrity, and EU AI Act alignment.
            </p>
            <div
              className="animate-rise mt-10 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "220ms" }}
            >
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-all hover:bg-accent-ink"
              >
                Resume
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                GitHub
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                LinkedIn
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                Contact
              </a>
            </div>
          </div>

          {/* status panel — editorial spec-card */}
          <aside
            className="animate-rise self-center"
            style={{ animationDelay: "300ms" }}
            aria-label="Profile snapshot"
          >
            <div className="rounded-2xl border border-line bg-white/70 p-8 shadow-[0_1px_2px_rgba(16,16,18,0.04),0_12px_40px_-20px_rgba(16,16,18,0.18)]">
              <dl className="space-y-6">
                {heroStats.map((s) => (
                  <div key={s.label} className="grid grid-cols-[92px_1fr] gap-4">
                    <dt className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint pt-0.5">
                      {s.label}
                    </dt>
                    <dd className="text-sm leading-snug text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 border-t border-line pt-6">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
                  Currently
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  AI Engineer @ SustainGRC
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}