import { insights } from "@/lib/data";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";

export function Insights() {
  return (
    <section id="notes" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Writing &amp; Research
          </p>
          <h2 className="mb-14 max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
            Notes &amp;{" "}
            <span className="font-serif italic font-normal text-ink">
              engineering write-ups.
            </span>
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {insights.map((note, i) => (
            <Reveal key={note.index} delay={i * 60} as="div">
              <a
                href={note.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass group flex h-full flex-col justify-between gap-10 rounded-3xl p-7 transition-all hover:-translate-y-1 hover:border-border-strong"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-ink-faint">
                      {note.index}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                      {note.tag}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold leading-snug tracking-tight text-ink">
                    {note.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {note.body}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-accent">
                  Read
                  <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}