import { principles } from "@/lib/data";
import { tidy } from "@/lib/text";

export function Principles() {
  return (
    <section id="principles" aria-labelledby="principles-title" className="relative scroll-mt-20 py-24 md:py-32">
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
              <h3 className="font-mono text-2xl font-extrabold tracking-[-0.03em] text-ink">{p.title}</h3>
              <p className="mt-3 max-w-[56ch] text-ink-soft">{tidy(p.body)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
