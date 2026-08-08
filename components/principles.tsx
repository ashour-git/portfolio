import { principles } from "@/lib/data";
import { Reveal } from "./reveal";

export function Principles() {
  return (
    <section id="principles" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Engineering Principles
          </p>
          <h2 className="mb-14 max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
            How I{" "}
            <span className="font-serif italic font-normal text-ink">
              decide.
            </span>
          </h2>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {principles.map((p, i) => (
            <Reveal key={p.index} delay={(i % 2) * 60} as="div">
              <div className="glass group flex h-full flex-col gap-4 rounded-3xl p-7 transition-all hover:-translate-y-1 hover:border-border-strong hover:shadow-xl hover:shadow-black/30">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-accent-2">
                    {p.index}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    {p.title}
                  </h3>
                </div>
                <p className="text-[15px] leading-relaxed text-ink-soft">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}