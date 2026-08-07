"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects, projectFilters, type Project } from "@/lib/data";
import { ArchitectureDiagram } from "./architecture-diagram";
import { ArrowIcon } from "./icons";

function ProjectImage({ p, className = "" }: { p: Project; className?: string }) {
  const [errored, setErrored] = useState(false);
  const showImage = p.image && !errored;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.image}
        alt={`${p.title} interface`}
        className={`object-cover ${className}`}
        loading="lazy"
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${p.gradient} ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
      <svg
        viewBox="0 0 120 120"
        className="relative h-16 w-16 opacity-80"
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="2"
      >
        <circle cx="20" cy="20" r="6" />
        <circle cx="100" cy="24" r="6" />
        <circle cx="60" cy="60" r="6" />
        <circle cx="30" cy="98" r="6" />
        <circle cx="95" cy="96" r="6" />
        <path d="M20 20 L60 60 M100 24 L60 60 M60 60 L30 98 M60 60 L95 96" />
      </svg>
    </div>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

export function Projects() {
  const [filter, setFilter] = useState("All");
  const featured = projects.find((p) => p.featured)!;
  const rest = projects.filter((p) => !p.featured);

  const visibleRest = rest.filter(
    (p) => filter === "All" || p.domain.includes(filter),
  );

  return (
    <section id="work" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="mb-12 flex flex-col gap-8 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
              Featured AI Products
            </p>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
              Built as systems,{" "}
              <span className="font-serif italic font-normal text-ink">
                shipped as products.
              </span>
            </h2>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter projects by domain"
          >
            {projectFilters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${
                  filter === f
                    ? "border-transparent bg-gradient-to-r from-accent to-accent-2 text-white"
                    : "border-line bg-surface text-ink-soft hover:text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <Flagship p={featured} />
        <span className="hairline my-14 block" aria-hidden="true" />

        <div className="grid gap-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visibleRest.map((p) => (
              <ProductCard key={p.index} p={p} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Flagship({ p }: { p: Project }) {
  return (
    <div id={`project-${p.index}`} className="scroll-mt-28">
      {/* hero image */}
      <div className="glass group relative overflow-hidden rounded-[2rem]">
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[16/8]">
          <ProjectImage p={p} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border border-border bg-black/30 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-white backdrop-blur">
            {p.domain}
          </span>
        </div>
      </div>

      {/* tagline + links */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {p.title}
            </h3>
            <span className="font-mono text-sm text-ink-faint">{p.index}</span>
          </div>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
            {p.tagline}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3 lg:justify-end">
          <a
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            View on GitHub
            <ArrowIcon className="h-4 w-4" />
          </a>
          {p.caseStudy && (
            <a
              href={p.caseStudy}
              target="_blank"
              rel="noopener noreferrer"
              className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:text-white"
            >
              Case study
            </a>
          )}
        </div>
      </div>

      {/* problem / solution */}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="glass rounded-3xl p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rose-300">
            Problem
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            {p.problem}
          </p>
        </div>
        <div className="glass rounded-3xl p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
            Solution
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            {p.solution}
          </p>
        </div>
      </div>

      {/* architecture + decisions */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <ArchitectureDiagram flow={p.architecture} />
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-line bg-bg/40 p-5 sm:p-7">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
              Engineering decisions
            </p>
            <div className="space-y-5">
              {p.decisions.map((d) => (
                <div key={d.title} className="border-l border-border-strong pl-4">
                  <p className="text-sm font-semibold text-ink">{d.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass grid grid-cols-3 divide-x divide-border rounded-2xl">
            {p.performance.map((m) => (
              <div key={m.label} className="px-4 py-5 text-center sm:px-6">
                <p className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
                  {m.value}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* stack */}
      <div className="mt-6 flex flex-wrap gap-2">
        {p.stack.map((t) => (
          <span
            key={t}
            className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink-soft"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: Project }) {
  return (
    <motion.a
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease }}
      href={p.href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass group flex flex-col overflow-hidden rounded-3xl transition-all hover:-translate-y-1 hover:border-border-strong"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <ProjectImage p={p} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]" />
        <span className="absolute right-4 top-4 rounded-full border border-border bg-black/30 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-white backdrop-blur">
          {p.domain}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl font-semibold tracking-tight text-ink">
            {p.title}
          </h3>
          <span className="font-mono text-sm text-ink-faint">{p.index}</span>
        </div>
        <p className="mt-2 text-sm font-medium text-ink">{p.tagline}</p>
        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-soft">
          {p.solution}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {p.stack.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[11px] text-ink-soft"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-accent">
            GitHub
            <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
          {p.caseStudy && (
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors group-hover:text-accent">
              Case study
            </span>
          )}
        </div>
      </div>
    </motion.a>
  );
}