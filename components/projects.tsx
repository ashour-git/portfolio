"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects, projectFilters, type Project } from "@/lib/data";
import { ArrowIcon } from "./icons";

function ProjectImage({ p }: { p: Project }) {
  const [errored, setErrored] = useState(false);
  const showImage = p.image && !errored;

  if (showImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.image}
        alt={`${p.title} interface`}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${p.gradient} opacity-90`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,rgba(0,0,0,0.3),transparent_50%)]" />
      <svg
        viewBox="0 0 120 120"
        className="relative h-20 w-20 opacity-80"
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

export function Projects() {
  const [filter, setFilter] = useState("All");

  const visible = projects.filter(
    (p) => filter === "All" || p.domain.includes(filter),
  );

  return (
    <section id="work" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="mb-12 flex flex-col gap-8 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
              Selected Work
            </p>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
              Shipping AI,{" "}
              <span className="font-serif italic font-normal text-ink">
                not demos.
              </span>
            </h2>
          </div>

          {/* filtering */}
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

        {/* featured editorial card */}
        <motion.div layout className="mb-8">
          <AnimatePresence mode="popLayout">
            {visible.some((p) => p.featured) && (
              <FeaturedCard p={projects.find((p) => p.featured)!} />
            )}
          </AnimatePresence>
        </motion.div>

        {/* grid — alternating compositions */}
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visible
              .filter((p) => !p.featured)
              .map((p) => (
                <motion.a
                  key={p.index}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass group flex flex-col overflow-hidden rounded-3xl transition-all hover:-translate-y-1 hover:border-border-strong"
                >
                  <div className="relative h-44 overflow-hidden sm:h-52">
                    <ProjectImage p={p} />
                    <span className="absolute right-4 top-4 rounded-full border border-border bg-black/30 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-white backdrop-blur">
                      {p.domain}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-xl font-semibold tracking-tight text-ink">
                        {p.title}
                      </h3>
                      <span className="font-mono text-sm text-ink-faint">
                        {p.index}
                      </span>
                    </div>
                    <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-soft">
                      {p.summary ?? p.tagline}
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
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
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
                      {p.note && (
                        <span className="font-mono text-[11px] uppercase tracking-wide text-accent-2">
                          {p.note}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.a>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ p }: { p: Project }) {
  return (
    <motion.a
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      href={p.href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass group grid overflow-hidden rounded-[2rem] transition-all hover:-translate-y-1 hover:border-border-strong md:grid-cols-[1fr_0.95fr]"
    >
      <div className="relative min-h-56 md:min-h-full">
        <ProjectImage p={p} />
        <span className="absolute left-4 top-4 rounded-full border border-border bg-black/30 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-white backdrop-blur">
          Featured
        </span>
      </div>
      <div className="flex flex-col p-8 md:p-10">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            {p.title}
          </h3>
          <span className="font-mono text-sm text-ink-faint">{p.domain}</span>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          {p.summary ?? p.tagline}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {p.impact?.map((im) => (
            <span
              key={im}
              className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink-soft"
            >
              {im}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {p.stack.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[11px] text-ink-soft"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-accent">
            View on GitHub
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
          {p.demo && (
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors group-hover:text-accent">
              Live demo
              <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
          {p.caseStudy && (
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors group-hover:text-accent">
              Case study
              <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
          <span className="ml-auto font-mono text-xs uppercase tracking-wide text-accent-2">
            {p.note}
          </span>
        </div>
      </div>
    </motion.a>
  );
}