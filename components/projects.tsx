"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects, projectFilters, type Project } from "@/lib/data";
import { ArchitectureDiagram } from "./architecture-diagram";
import { PipelineStrip } from "./pipeline-strip";
import { ArrowIcon } from "./icons";
import { SectionHeader } from "./section-header";

function Cover({ p, className = "" }: { p: Project; className?: string }) {
  if (p.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.image}
        alt={`${p.title} interface`}
        className={`object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${p.gradient} ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
    </div>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

function studyHref(p: Project) {
  return p.study ? `/case-studies/${p.study.slug}` : p.href;
}

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
        <div className="mb-12 md:mb-16">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <div
              className="ml-auto flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filter projects by domain"
            >
              {projectFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${
                    filter === f
                      ? "border-transparent bg-gradient-to-r from-accent to-accent-2 text-bg"
                      : "border-line bg-surface text-ink-soft hover:text-ink"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <SectionHeader eyebrow="FEATURED AI PRODUCTS" title="Built as systems," accent="shipped as products." />
          </div>
        </div>

        <ProjectCard p={featured} prominence="flagship" />
        <span className="hairline my-16 block" aria-hidden="true" />

        <div className="grid gap-8 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visibleRest.map((p, i) => (
              <ProjectCard key={p.index} p={p} prominence="showcase" index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function SectionLabel({
  children,
  tone = "accent",
}: {
  children: string;
  tone?: "accent" | "rose" | "emerald" | "amber";
}) {
  const tones: Record<string, string> = {
    accent: "text-accent",
    rose: "text-rose-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
  };
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${tones[tone]}`}>
      {children}
    </p>
  );
}

function ProjectCard({
  p,
  prominence,
  index = 0,
}: {
  p: Project;
  prominence: "flagship" | "showcase";
  index?: number;
}) {
  if (prominence === "flagship") return <FlagshipCard p={p} />;
  return <ShowcaseCard p={p} index={index} />;
}

function FlagshipCard({ p }: { p: Project }) {
  return (
    <motion.div
      id={`project-${p.index}`}
      className="scroll-mt-28"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease }}
    >
      {/* hero image */}
      <div className="glass group relative overflow-hidden rounded-[2rem]">
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[16/8]">
          <Cover
            p={p}
            className="h-full w-full transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border border-border bg-black/30 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-white backdrop-blur">
            {p.domain}
          </span>
        </div>
      </div>

      {/* tagline + links */}
      <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
            Flagship product
          </p>
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
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <a
            href={studyHref(p)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
          >
            Case study
            <ArrowIcon className="h-4 w-4" />
          </a>
          <a
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:text-white"
          >
            GitHub
          </a>
        </div>
      </div>

      {/* problem / solution */}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="glass rounded-3xl p-7">
          <SectionLabel tone="rose">Problem</SectionLabel>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            {p.problem}
          </p>
        </div>
        <div className="glass rounded-3xl p-7">
          <SectionLabel tone="emerald">Solution</SectionLabel>
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
            <SectionLabel>Why this architecture</SectionLabel>
            <div className="mt-4 space-y-5">
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

      <div className="mt-6">
        <PipelineStrip flow={p.architecture} />
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
    </motion.div>
  );
}

function ShowcaseCard({ p, index = 0 }: { p: Project; index?: number }) {
  const [showArch, setShowArch] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3, ease } }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.55,
        delay: (index % 2) * 0.08,
        ease,
      }}
      whileHover={{ y: -4 }}
      className="glass flex flex-col overflow-hidden rounded-3xl transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/30"
    >
      <div className="group relative aspect-[16/9] overflow-hidden">
        <Cover
          p={p}
          className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
          <span className="rounded-full border border-border bg-black/30 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-white backdrop-blur">
            {p.domain}
          </span>
          <span className="font-mono text-sm text-white/80">{p.index}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl font-semibold tracking-tight text-ink">
            {p.title}
          </h3>
        </div>
        <p className="mt-2 text-sm font-medium text-ink">{p.tagline}</p>

        <PipelineStrip flow={p.architecture} className="mt-4" />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <SectionLabel tone="rose">Problem</SectionLabel>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              {p.problem}
            </p>
          </div>
          <div>
            <SectionLabel tone="emerald">Solution</SectionLabel>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              {p.solution}
            </p>
          </div>
        </div>

        {/* performance */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-border rounded-xl border border-line">
          {p.performance.map((m) => (
            <div key={m.label} className="px-3 py-3 text-center">
              <p className="text-sm font-semibold tracking-tight text-ink">
                {m.value}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                {m.label}
              </p>
            </div>
          ))}
        </div>

        {/* expandable architecture — the one standout interaction */}
        <div className="mt-5">
          <button
            onClick={() => setShowArch((o) => !o)}
            aria-expanded={showArch}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-border-strong"
          >
            <span className="inline-flex items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                className="h-4 w-4 text-accent"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
                <path d="M6 2.5v11M10 2.5v11M2.5 6h11M2.5 10h11" />
              </svg>
              Architecture
            </span>
            <motion.span
              animate={{ rotate: showArch ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-lg leading-none text-ink-soft"
              aria-hidden="true"
            >
              +
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {showArch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <ArchitectureDiagram flow={p.architecture} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* stack */}
        <div className="mt-5 flex flex-wrap gap-2">
          {p.stack.slice(0, 5).map((t) => (
            <span
              key={t}
              className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[11px] text-ink-soft"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
          <a
            href={studyHref(p)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-accent"
          >
            Case study
            <ArrowIcon className="h-3.5 w-3.5" />
          </a>
          <a
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent"
          >
            GitHub
            <ArrowIcon className="h-3.5 w-3.5" />
          </a>
          {p.demo && (
            <a
              href={p.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent"
            >
              Live demo
              <ArrowIcon className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}