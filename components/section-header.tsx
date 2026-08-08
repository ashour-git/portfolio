import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export function SectionHeader({
  eyebrow,
  title,
  accent,
  pull,
}: {
  eyebrow: string;
  title: ReactNode;
  accent?: string;
  pull?: string;
}) {
  return (
    <Reveal>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
        <span className="text-gradient">{eyebrow}</span>
      </p>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
        {title}
        {accent ? (
          <span className="font-serif italic font-normal text-ink"> {accent}</span>
        ) : null}
      </h2>
      {pull ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">{pull}</p>
      ) : null}
    </Reveal>
  );
}