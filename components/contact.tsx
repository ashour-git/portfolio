import { profile } from "@/lib/data";
import { Reveal } from "./reveal";
import { ArrowIcon } from "./icons";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 border-t border-line py-28 md:py-36">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Contact
          </p>
          <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-ink md:text-6xl">
            Let's build AI systems
            <br />
            that are trusted.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Open to AI engineering, LLM, MLOps, and compliance-adjacent roles —
            and to conversations about governed, production-grade systems.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent-ink"
            >
              {profile.email}
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              GitHub
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              LinkedIn
            </a>
            <a
              href={profile.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Resume (PDF)
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}