"use client";

import { useState, type ReactNode } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, TreeStructure } from "@phosphor-icons/react/dist/ssr";
import { projects, projectFilters, type Project } from "@/lib/data";
import { list, tidy } from "@/lib/text";
import { ArchitectureDiagram } from "./architecture-diagram";
import { ArrowIcon, ExternalIcon } from "./icons";
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

function studyHref(p: Project) {
  return p.study ? `/case-studies/${p.study.slug}` : p.href;
}

export function Projects() {
  const [filter, setFilter] = useState("All");
  const featured = projects.find((p) => p.featured)!;
  const rest = projects.filter((p) => !p.featured);
  const visibleRest = rest.filter((p) => filter === "All" || p.domain.includes(filter));

  return (
    <section id="work" aria-labelledby="work-title" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="shell">
        <h2 id="work-title" className="display max-w-[20ch]">
          Systems that run in production
        </h2>
        <p className="lead mt-5 max-w-[56ch]">
          Six projects, each shown as the mechanism it runs on, with its tradeoffs and the tests that prove it works.
        </p>

        <Flagship p={featured} />

        {/* `case-studies` anchor kept so older links and the palette still land here */}
        <div id="case-studies" className="mt-24 scroll-mt-24 md:mt-32">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <h3 className="font-mono text-2xl font-bold tracking-tight text-ink md:text-[1.75rem]">More observations</h3>
            <div
              className="no-scrollbar -mx-1 flex max-w-full flex-nowrap items-center gap-1.5 overflow-x-auto px-1 py-1"
              role="group"
              aria-label="Filter projects by domain"
            >
              {projectFilters.map((f) => {
                const selected = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={selected}
                    className={`inline-flex min-h-10 shrink-0 items-center border px-3.5 font-mono text-[13px] transition-colors focus-visible:border-accent ${
                      selected
                        ? "border-ink bg-ink font-bold text-bg"
                        : "border-line text-ink-soft hover:border-border-strong hover:text-ink"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" role="status" className="sr-only">
              {filter === "All" ? `Showing all ${rest.length} projects` : `${visibleRest.length} projects in ${filter}`}
            </p>
          </div>

          {visibleRest.length > 0 ? (
            <m.div layout className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {visibleRest.map((p, i) => (
                  <ObservationCard
                    key={p.index}
                    p={p}
                    // an odd final card spans the row instead of leaving an empty cell
                    wide={i === visibleRest.length - 1 && visibleRest.length % 2 === 1}
                  />
                ))}
              </AnimatePresence>
            </m.div>
          ) : (
            <div className="hud mt-10 px-6 py-14 text-center">
              <p className="font-mono text-base text-ink">No observations in {filter} beyond the flagship yet.</p>
              <button
                type="button"
                onClick={() => setFilter("All")}
                className="mt-4 inline-flex min-h-11 items-center px-4 font-mono text-sm font-bold text-accent underline underline-offset-4"
              >
                Show all projects
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="font-mono text-sm font-bold text-ink">{label}</h4>
      <div className="mt-2.5">{children}</div>
    </div>
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
          <p className="font-mono text-sm text-accent">Flagship, {p.domain}</p>
          <h3 id="flagship-title" className="mt-2 font-mono text-5xl font-extrabold tracking-[-0.04em] text-ink md:text-6xl">
            {p.title}
          </h3>
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

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="space-y-9">
          <Block label="Problem">
            <p className="max-w-[62ch] text-ink-soft">{tidy(p.problem)}</p>
          </Block>
          <Block label="Approach">
            <p className="max-w-[62ch] text-ink-soft">{tidy(p.solution)}</p>
          </Block>
          <Block label="Key decisions">
            <ul className="space-y-5">
              {p.decisions.map((d) => (
                <li key={d.title} className="border-l-2 border-accent pl-4">
                  <p className="font-bold text-ink">{d.title}</p>
                  <p className="mt-1 max-w-[62ch] text-[15px] text-ink-soft">{tidy(d.body)}</p>
                </li>
              ))}
            </ul>
          </Block>
        </div>
        <ArchitectureDiagram flow={p.architecture} />
      </div>

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
    <m.article
      id={`project-${p.index}`}
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease } }}
      transition={{ duration: 0.4, ease }}
      className={`observe flex scroll-mt-24 flex-col ${wide ? "md:col-span-2 md:grid md:grid-cols-[1.15fr_1fr] md:gap-10" : ""}`}
    >
      {screen?.()}

      <div className={`flex flex-1 flex-col ${wide ? "pt-6 md:pt-2" : "pt-6"}`}>
        <p className="font-mono text-[13px] text-accent">{p.domain}</p>
        <h4 className="mt-1.5 font-mono text-2xl font-extrabold tracking-[-0.03em] text-ink">{p.title}</h4>
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
            className="flex min-h-11 w-full items-center justify-between gap-3 font-mono text-[13px] font-bold text-ink-soft transition-colors hover:text-ink"
          >
            <span className="inline-flex items-center gap-2">
              <TreeStructure aria-hidden="true" size={16} className="text-accent" />
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
            className="inline-flex min-h-11 items-center gap-1.5 font-mono text-sm font-bold text-ink transition-colors hover:text-accent"
          >
            Case study
            <ArrowIcon className="h-4 w-4" />
          </a>
          <a
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 font-mono text-sm text-ink-soft transition-colors hover:text-accent"
          >
            Source
            <ExternalIcon className="h-4 w-4" />
          </a>
          {p.demo && (
            <a
              href={p.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 font-mono text-sm text-ink-soft transition-colors hover:text-accent"
            >
              Live demo
              <ExternalIcon className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </m.article>
  );
}
