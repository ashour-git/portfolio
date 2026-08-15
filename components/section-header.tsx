import type { ReactNode } from "react";
import { Reveal } from "./reveal";

type Variant = "standard" | "statement" | "quiet";

export function SectionHeader({
  eyebrow,
  title,
  accent,
  pull,
  variant = "standard",
}: {
  eyebrow?: string;
  title: ReactNode;
  accent?: string;
  pull?: string;
  variant?: Variant;
}) {
  if (variant === "statement") {
    return (
      <Reveal>
        <h2 className="display max-w-3xl">
          {title}
          {accent ? <span className="serif-accent text-ink-soft"> {accent}</span> : null}
        </h2>
        {pull ? <p className="lead mt-5 max-w-2xl">{pull}</p> : null}
      </Reveal>
    );
  }

  if (variant === "quiet") {
    return (
      <Reveal>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h2 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            {title}
          </h2>
        </div>
        {pull ? <p className="lead mt-3 max-w-xl">{pull}</p> : null}
      </Reveal>
    );
  }

  return (
    <Reveal>
      {eyebrow ? (
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-6 bg-border-strong" />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
        {title}
        {accent ? <span className="serif-accent text-ink"> {accent}</span> : null}
      </h2>
      {pull ? <p className="lead mt-4 max-w-2xl">{pull}</p> : null}
    </Reveal>
  );
}
