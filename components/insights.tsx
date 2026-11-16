import { insights } from "@/lib/data";
import { tidy } from "@/lib/text";
import { ExternalIcon } from "./icons";

export function Insights() {
  return (
    <section id="notes" aria-labelledby="notes-title" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="shell">
        <h2 id="notes-title" className="display">
          Engineering notes
        </h2>
        <p className="lead mt-5 max-w-[56ch]">The reasoning behind each build, written up in its repository.</p>

        <ul className="mt-12 grid grid-cols-1 gap-x-12 md:grid-cols-2">
          {insights.map((note) => (
            <li key={note.index}>
              <a
                href={note.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full gap-6 border-t border-line py-7"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[13px] text-ink-faint">{note.tag}</p>
                  <h3 className="mt-1.5 font-mono text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
                    {note.title}
                  </h3>
                  <p className="mt-2 text-[15px] text-ink-soft">{tidy(note.body)}</p>
                </div>
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center border border-line text-ink-soft transition-colors group-hover:border-accent group-hover:text-accent">
                  <ExternalIcon className="h-4 w-4" />
                  <span className="sr-only">Open the repository on GitHub</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
