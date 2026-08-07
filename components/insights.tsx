import { insights } from "@/lib/data";
import { Section } from "./section";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";

export function Insights() {
  return (
    <Section
      id="notes"
      eyebrow="Field Notes"
      title={
        <>
          Selected notes &amp;
          <br />
          engineering write-ups.
        </>
      }
    >
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
        {insights.map((note, i) => (
          <Reveal key={note.index} delay={i * 60} as="div">
            <a
              href={note.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col justify-between gap-10 bg-paper p-8 transition-colors hover:bg-white"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-faint">
                    {note.index}
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
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
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-accent-ink">
                Read
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}