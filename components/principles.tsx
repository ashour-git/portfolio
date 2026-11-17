import { principles } from "@/lib/data";
import { tidy } from "@/lib/text";
import { AttractorDiagram } from "./diagrams";

export function Principles() {
  return (
    <section id="principles" aria-labelledby="principles-title" className="relative isolate scroll-mt-20 overflow-x-clip py-20 md:py-24">
      <AttractorDiagram className="bottom-6 left-[max(0rem,calc(50%-38rem))] w-[30rem]" />
      <div className="shell grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
        {/* the heading stays pinned while the rules scroll past it */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="principles-title" className="display">
            How I decide
          </h2>
          <p className="lead mt-5 max-w-[34ch]">Four rules behind every system on this page.</p>
        </div>

        <ul>
          {principles.map((p) => (
            <li key={p.index} className="border-t border-line py-8 first:border-t-0 first:pt-0 lg:first:pt-2">
              <h3 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-ink">{p.title}</h3>
              <p className="mt-3 max-w-[56ch] text-ink-soft">{tidy(p.body)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
