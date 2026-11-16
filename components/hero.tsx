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
    <section id="top" aria-labelledby="hero-title" className="hero-window relative isolate lg:flex lg:min-h-[100svh] lg:items-center">
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
      {/* observatory-plate annotations around the object (wide screens only) */}
      <div className="hud-notes" aria-hidden="true">
        <dl className="hud-block" style={{ left: "76%", top: "12%" }}>
          <dt>object</dt>
          <dd>event horizon</dd>
          <dt>metric</dt>
          <dd>schwarzschild</dd>
          <dt>radius</dt>
          <dd className="case">rₛ = 2GM / c²</dd>
          <dt>render</dt>
          <dd>live, in your browser</dd>
        </dl>
        <dl className="hud-block" style={{ left: "76%", top: "71%" }}>
          <dt>operator</dt>
          <dd>mohamed ashour</dd>
          <dt>class</dt>
          <dd>ai engineer</dd>
          <dt>fields</dt>
          <dd>llm / nlp / cv</dd>
          <dt>base</dt>
          <dd>cairo, eg</dd>
        </dl>
        <p className="hud-eq" style={{ left: "47%", top: "19%" }}>Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V</p>
        <p className="hud-eq" style={{ left: "47%", top: "80%" }}>θ ← θ − η ∇θ L(θ)</p>
        <p className="hud-eq" style={{ left: "57%", top: "89%" }}>ds² = −(1 − rₛ/r) c²dt² + dr² / (1 − rₛ/r) + r² dΩ²</p>
        <p className="hud-eq" style={{ left: "52%", top: "29%" }}>x'' = −1.5 h² x / r⁵</p>
      </div>
    </section>
  );
}
