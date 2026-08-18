import { insights } from "@/lib/data";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";
import { SectionHeader } from "./section-header";

export function Insights() {
  return (
    <section id="notes" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <SectionHeader
          variant="quiet"
          eyebrow="WRITING & RESEARCH"
          title="Notes & engineering write-ups."
        />

        <ul className="mt-12 border-t border-line">
          {insights.map((note, i) => (
            <Reveal key={note.index} delay={i * 40} as="li">
              <li className="border-b border-line">
                <a
                  href={note.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid gap-3 py-7 transition-colors hover:bg-surface-hover md:grid-cols-[4rem_9rem_1fr_auto] md:items-baseline md:gap-8"
                >
                  <span className="eyebrow">{note.index}</span>
                  <span className="eyebrow text-ink-soft">{note.tag}</span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-ink md:text-xl">
                      {note.title}
                    </h3>
                    <p className="lead mt-2 max-w-2xl text-[15px]">{note.body}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors group-hover:text-accent">
                    Read
                    <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
