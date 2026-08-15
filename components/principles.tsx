import { principles } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function Principles() {
  return (
    <section id="principles" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <SectionHeader variant="statement" title="How I decide." />

        <div className="mt-14 border-t border-line">
          {principles.map((p, i) => (
            <Reveal key={p.index} delay={i * 50} as="div">
              <div className="grid gap-4 border-b border-line py-9 md:grid-cols-[8rem_1fr] md:gap-12">
                <span className="font-mono text-sm text-ink-faint">{p.index}</span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
                    {p.title}
                  </h3>
                  <p className="lead mt-3 max-w-2xl text-[15px] md:text-base">
                    {p.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
