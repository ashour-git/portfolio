import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export function Section({
  id,
  eyebrow,
  title,
  children,
  className = "",
}: {
  id: string;
  eyebrow?: string;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative scroll-mt-24 border-t border-line py-24 md:py-32 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal as="div">
          {eyebrow && (
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="mb-14 max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
              {title}
            </h2>
          )}
        </Reveal>
        {children}
      </div>
    </section>
  );
}