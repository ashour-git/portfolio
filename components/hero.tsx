import { FileArrowDown } from "@phosphor-icons/react/dist/ssr";
import { profile } from "@/lib/data";
import { AskPrompt } from "./ask-prompt";
import { BlackHole } from "./black-hole";

/**
 * The profile banner, made live: a terminal identity on the left, a
 * ray-traced black hole behind it. The name paints immediately; the black
 * hole develops in like an exposure once WebGL is ready.
 */
export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate lg:flex lg:min-h-[100svh] lg:items-center">
      <div id="nav-sentinel" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-8" />
      <BlackHole />

      <div className="shell relative pb-16 pt-4 lg:py-28">
        <div className="max-w-[35rem]">
          <p className="prompt-line">
            ashour@event-horizon:~<b>$</b> whoami
          </p>
          <h1 id="hero-title" className="hero-name mt-5">
            <span>Mohamed</span>
            <span>Ashour</span>
          </h1>
          <p className="mt-7 max-w-[36ch] text-lg leading-relaxed text-ink-soft md:text-xl">
            AI engineer. I build LLM, NLP and computer-vision systems and ship them as production services.
          </p>

          <AskPrompt className="mt-9 max-w-[32rem]" />

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href={profile.resume} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <FileArrowDown aria-hidden="true" size={18} weight="bold" />
              Download resume
            </a>
            <span className="flex items-center gap-x-6">
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-mono text-sm text-ink-soft underline decoration-border-strong underline-offset-[6px] transition-colors hover:text-accent hover:decoration-accent"
            >
              GitHub
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-mono text-sm text-ink-soft underline decoration-border-strong underline-offset-[6px] transition-colors hover:text-accent hover:decoration-accent"
            >
              LinkedIn
            </a>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
