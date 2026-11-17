"use client";

import { useState, type ReactNode } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { projects, type Project } from "@/lib/data";
import { list, tidy } from "@/lib/text";
import { ArchitectureDiagram } from "./architecture-diagram";
import { ArrowIcon, ExternalIcon } from "./icons";
import { Glyph, type GlyphName } from "./nn-icons";
import { AttentionViz, EmbeddingViz, FeatureMapViz, ForecastViz, HandViz, RagViz, Screen, TenantViz } from "./viz";

const ease = [0.22, 1, 0.36, 1] as const;

// Each project is shown as the mechanism it is built on, on a CRT screen.
const SCREENS: Record<string, () => ReactNode> = {
  Storefy: () => (
    <Screen title="storefy / tenant routing" meta="multi-tenant" label="Diagram: requests to three store subdomains resolve to a tenant, then read only that tenant's rows; a Groq agent generates storefronts.">
      <TenantViz />
    </Screen>
  ),
  "Text-to-SQL Generator": () => (
    <Screen title="text2sql / attention" meta="gpt-4o" label="Attention map: each word of 'total sales last 30 days by country' attends most strongly to its SQL token, then three validators pass.">
      <AttentionViz />
    </Screen>
  ),
  "Hand Gesture Recognition": () => (
    <Screen title="gesture / landmarks" meta="real-time" label="A 21-point hand skeleton, an open palm, inside a detection box labelled open_palm; fingertips are highlighted.">
      <HandViz />
    </Screen>
  ),
  "Semantic Book Recommender": () => (
    <Screen title="books / embedding space" meta="chromadb" label="Embedding map: a query point linked to its five nearest books, led by The Sea, The Sea.">
      <EmbeddingViz />
    </Screen>
  ),
  "Kepler Vision": () => (
    <Screen title="kepler / feature maps" meta="pytorch" label="An input frame passes through three layers of convolutional feature maps to detections labelled person and chair.">
      <FeatureMapViz />
    </Screen>
  ),
};

// each project's mechanism, as a glyph in the site's node-and-edge language
const GLYPH: Record<string, GlyphName> = {
  RestAI: "retrieval",
  Storefy: "tenants",
  "Text-to-SQL Generator": "attention",
  "Hand Gesture Recognition": "vision",
  "Semantic Book Recommender": "neighbours",
  "Kepler Vision": "vision",
};

// Home page shows the strongest five. Kepler Vision has no measured result
// yet; its case study stays live at /case-studies/kepler-vision.
const HIDDEN = new Set(["Kepler Vision"]);

function studyHref(p: Project) {
  return p.study ? `/case-studies/${p.study.slug}` : p.href;
}

export function Projects() {
  const featured = projects.find((p) => p.featured)!;
  const rest = projects.filter((p) => !p.featured && !HIDDEN.has(p.title));

  return (
    <section id="work" aria-labelledby="work-title" className="relative scroll-mt-20 py-20 md:py-24">
      <div className="shell">
        <h2 id="work-title" className="display max-w-[20ch]">
          Systems that run in production
        </h2>
        <p className="lead mt-5 max-w-[56ch]">
          Five projects, each shown as the mechanism it runs on. The case studies cover the tradeoffs and the tests.
        </p>

        <Flagship p={featured} />

        {/* `case-studies` anchor kept so older links and the palette still land here */}
        <div id="case-studies" className="mt-20 scroll-mt-24 md:mt-24">
          <h3 className="font-display text-3xl font-semibold tracking-[-0.01em] text-ink md:text-[2.25rem]">More projects</h3>
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
            {rest.map((p, i) => (
              // an odd final card spans the row instead of leaving an empty cell
              <ObservationCard key={p.index} p={p} wide={i === rest.length - 1 && rest.length % 2 === 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Flagship({ p }: { p: Project }) {
  return (
    <article id={`project-${p.index}`} aria-labelledby="flagship-title" className="observe mt-14 scroll-mt-24 md:mt-20">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Screen title="restai / retrieval" meta="pgvector" label="Retrieval: the question 'how many salmon portions tonight?' pulls three sources (menu, orders, inventory) and the answer cites them.">
          <RagViz />
        </Screen>
        <Screen title="restai / forecast" meta="lightgbm" label="Demand forecast for tonight: history until now, a dashed forecast with a confidence band, peaking at 19:00.">
          <ForecastViz />
        </Screen>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-14 gap-y-6 lg:grid-cols-[1fr_1.2fr] lg:items-end">
        <div>
          <h3 id="flagship-title" className="font-display text-5xl font-bold tracking-[-0.01em] text-ink md:text-[4.5rem] md:leading-none">
            {p.title}
          </h3>
          <p className="mt-3 flex items-center gap-2 text-[15px] text-ink-soft">
            <Glyph name={GLYPH[p.title] ?? "attention"} className="h-[18px] w-[18px] shrink-0" />
            Flagship, {p.domain}
          </p>
        </div>
        <p className="lead max-w-[54ch]">{tidy(p.tagline)}</p>
      </div>

      <dl className="mt-10 grid grid-cols-3 border-y border-line">
        {p.performance.map((m, i) => (
          <div key={m.label} className={`py-6 ${i > 0 ? "border-l border-line pl-4 sm:pl-8" : "pr-4"}`}>
            <dt className="sr-only">{m.label}</dt>
            <dd className="font-mono text-2xl font-extrabold tracking-tight text-ink md:text-3xl">{m.value}</dd>
            <dd className="mt-1 text-sm text-ink-soft">{m.label}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
        <a href={studyHref(p)} className="btn btn-primary">
          Read the case study
          <ArrowIcon className="h-4 w-4" />
        </a>
        <a href={p.href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          Source
          <ExternalIcon className="h-4 w-4" />
        </a>
        <p className="w-full pt-2 font-mono text-xs text-ink-faint sm:w-auto sm:pl-3 sm:pt-0">{list(p.stack)}</p>
      </div>
    </article>
  );
}

function ObservationCard({ p, wide }: { p: Project; wide: boolean }) {
  const [showArch, setShowArch] = useState(false);
  const reduce = useReducedMotion();
  const archId = `arch-${p.index}`;
  const screen = SCREENS[p.title];

  return (
    <article
      id={`project-${p.index}`}
      className={`observe flex scroll-mt-24 flex-col ${wide ? "md:col-span-2 md:grid md:grid-cols-[1.15fr_1fr] md:gap-10" : ""}`}
    >
      {screen?.()}

      <div className={`flex flex-1 flex-col ${wide ? "pt-6 md:pt-2" : "pt-6"}`}>
        <h4 className="font-display text-[1.9rem] font-semibold leading-tight tracking-[-0.01em] text-ink">{p.title}</h4>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-soft">
          <Glyph name={GLYPH[p.title] ?? "attention"} className="h-4 w-4 shrink-0" />
          {p.domain}
        </p>
        <p className="mt-2.5 text-ink-soft">{tidy(p.tagline)}</p>

        <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
          {p.performance.map((m) => (
            <div key={m.label}>
              <dt className="sr-only">{m.label}</dt>
              <dd className="font-mono text-[15px] font-bold text-ink">{m.value}</dd>
              <dd className="mt-0.5 text-xs leading-snug text-ink-faint">{m.label}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 border-t border-line">
          <button
            type="button"
            onClick={() => setShowArch((v) => !v)}
            aria-expanded={showArch}
            aria-controls={archId}
            className="flex min-h-11 w-full items-center justify-between gap-3 text-[14px] font-bold text-ink-soft transition-colors hover:text-ink"
          >
            <span className="inline-flex items-center gap-2">
              <Glyph name="dag" className="h-4 w-4 text-accent" />
              Architecture
            </span>
            <Plus aria-hidden="true" size={16} className={`transition-transform duration-200 ${showArch ? "rotate-45" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {showArch && (
              <m.div
                id={archId}
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduce ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease }}
                className="overflow-hidden"
              >
                <div className="pb-3 pt-1">
                  <ArchitectureDiagram flow={p.architecture} compact />
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-1 font-mono text-xs leading-relaxed text-ink-faint">{list(p.stack.slice(0, 5))}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-5 pt-4">
          <a
            href={studyHref(p)}
            className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-ink transition-colors hover:text-accent"
          >
            Case study
            <ArrowIcon className="h-4 w-4" />
          </a>
          <a
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-[15px] text-ink-soft transition-colors hover:text-accent"
          >
            Source
            <ExternalIcon className="h-4 w-4" />
          </a>
          {p.demo && (
            <a
              href={p.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-[15px] text-ink-soft transition-colors hover:text-accent"
            >
              Live demo
              <ExternalIcon className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
