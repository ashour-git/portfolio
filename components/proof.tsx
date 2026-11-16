import { projects } from "@/lib/data";

const byTitle = (t: string) => projects.find((p) => p.title === t);

// The headline numbers, each tied to the repo that produces it.
const readout = [
  { value: "162", label: "automated tests", source: byTitle("RestAI") },
  { value: "18/18", label: "security tests passed", source: byTitle("Text-to-SQL Generator") },
  { value: "~67 ms", label: "average retrieval", source: byTitle("RestAI") },
  { value: "7,000+", label: "books in a semantic index", source: byTitle("Semantic Book Recommender") },
];

export function Proof() {
  return (
    <section aria-label="Measured results" className="relative">
      <div className="shell">
        <ul className="grid grid-cols-2 border-y border-line md:grid-cols-4">
          {readout.map((s, i) => (
            <li
              key={s.label}
              className={`py-7 md:py-9 ${i % 2 ? "pl-5 md:pl-8" : "pr-5 md:pr-8"} ${i > 0 ? "md:border-l md:border-line md:pl-8" : ""} ${i === 1 ? "border-l border-line md:border-l" : ""} ${i === 3 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line md:border-t-0" : ""}`}
            >
              <p className="font-mono text-3xl font-extrabold tracking-tight text-ink md:text-[2.5rem]">{s.value}</p>
              <p className="mt-1 text-[15px] text-ink-soft">{s.label}</p>
              {s.source && (
                <a
                  href={`#project-${s.source.index}`}
                  className="mt-2 inline-block font-mono text-xs text-ink-faint underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
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
