"use client";

import { motion } from "framer-motion";
import { profile, stats } from "@/lib/data";
import { Portrait } from "@/components/portrait";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-36 md:pt-40">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          {/* headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              AI Engineer · Cairo, Egypt
            </p>
            <h1 className="text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-7xl">
              Building production
              <br />
              AI systems with
              <br />
              <span className="text-gradient">Machine Learning,</span>
              <br />
              LLMs, and scalable
              <br />
              software engineering.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
              I build production AI systems, not just demos. Mohamed Ashour —
              AI, ML &amp; LLM engineer shipping RAG systems, recommendation
              engines, computer vision, and forecasting into real products.
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
                href="#work"
                className="glass rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
              >
                Projects
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
              >
                LinkedIn
              </a>
            </div>
          </motion.div>

          {/* portrait composition */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
            className="relative mx-auto w-full max-w-sm lg:max-w-none"
            aria-label="Portrait"
          >
            {/* halo */}
            <div
              aria-hidden="true"
              className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-accent/25 to-accent-2/25 blur-3xl"
            />
            <div className="glass-strong overflow-hidden rounded-[2.5rem] p-2">
              <Portrait />
            </div>

            {/* floating stat panel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease }}
              className="glass absolute -left-6 top-10 hidden rounded-2xl px-5 py-4 md:block"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Track record
              </p>
              <div className="mt-3 flex gap-6">
                {stats.slice(0, 2).map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-semibold text-ink">{s.value}</p>
                    <p className="text-xs text-ink-soft">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* floating availability chip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6, ease }}
              className="glass absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-sm text-ink">
                Currently building at SustainGRC
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}