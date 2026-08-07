"use client";

import { motion } from "framer-motion";
import { profile, heroStats } from "@/lib/data";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-36 md:pt-44">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          {/* headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              AI Engineer · Cairo, Egypt
            </p>
            <h1 className="text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-7xl">
              I build production AI.
              <br />
              <span className="text-gradient">Real systems.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
              I'm Mohamed Ashour — an AI, ML, and LLM engineer shipping
              RAG systems, recommendation engines, computer vision, and MLOps
              pipelines end to end.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={profile.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40"
              >
                Resume
              </a>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
              >
                GitHub
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
              >
                LinkedIn
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="glass rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
              >
                Contact
              </a>
            </div>
          </motion.div>

          {/* glass spec-card cluster */}
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative self-center"
            aria-label="Profile snapshot"
          >
            <div className="relative ml-auto max-w-sm md:ml-0">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/20 to-accent-2/20 blur-2xl" />
              <div className="glass-strong rounded-3xl p-8">
                <dl className="space-y-6">
                  {heroStats.map((s) => (
                    <div
                      key={s.label}
                      className="grid grid-cols-[92px_1fr] gap-4 border-b border-border pb-5 last:border-0 last:pb-0"
                    >
                      <dt className="pt-0.5 font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
                        {s.label}
                      </dt>
                      <dd className="text-sm leading-snug text-ink">{s.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 border-t border-border pt-5">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
                    Currently
                  </p>
                  <p className="mt-2 text-sm text-ink">Building at SustainGRC</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}