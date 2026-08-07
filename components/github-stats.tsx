import { githubStats } from "@/lib/data";
import { profile } from "@/lib/data";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";

export function GithubStats() {
  return (
    <section id="github" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Open Source
          </p>
        </Reveal>
        <div className="glass overflow-hidden rounded-[2rem]">
          <div className="flex flex-col gap-10 p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div className="max-w-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                Code, tested and shipped on{" "}
                <span className="text-gradient">GitHub.</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Every project below runs its tests in CI and documents its
                architecture.
              </p>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                github.com/ashour-git
                <ArrowIcon className="h-4 w-4" />
              </a>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-4">
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
      </div>
    </section>
  );
}