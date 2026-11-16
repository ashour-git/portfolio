import { projects } from "@/lib/data";

const byTitle = (t: string) => projects.find((p) => p.title === t);

// The headline numbers, each tied to the repo that produces it.
const readout = [
  { value: "162", label: "automated tests", source: byTitle("RestAI") },
  { value: "18/18", label: "security tests passed", source: byTitle("Text-to-SQL Generator") },
  { value: "7,000+", label: "books in a semantic index", source: byTitle("Semantic Book Recommender") },
];

export function Proof() {
  return (
    <section aria-label="Measured results" className="relative">
      <div className="shell">
        <ul className="grid grid-cols-3 border-y border-line">
          {readout.map((s, i) => (
            <li
              key={s.label}
              className={`min-w-0 py-7 md:py-9 ${i > 0 ? "border-l border-line pl-3 sm:pl-8" : "pr-3 sm:pr-8"}`}
            >
              <p className="font-mono text-2xl font-extrabold tracking-tight text-ink sm:text-3xl md:text-[2.5rem]">{s.value}</p>
              <p className="mt-1 text-[13px] text-ink-soft sm:text-[15px]">{s.label}</p>
              {s.source && (
                <a
                  href={`#project-${s.source.index}`}
                  className="mt-2 inline-flex items-center gap-2 font-mono text-xs text-ink-faint underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent"
                >
                  {s.source.title}
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-faint">Every number on this page comes from a public repository with tests in CI.</p>
      </div>
    </section>
  );
}
