"use client";

import { motion } from "framer-motion";
import { profile, stats } from "@/lib/data";
import { Portrait } from "@/components/portrait";

const ease = [0.22, 1, 0.36, 1] as const;

const techChips = [
  { label: "FastAPI", x: "-14%", y: "12%", delay: 0.7 },
  { label: "PyTorch", x: "6%", y: "-10%", delay: 0.8 },
  { label: "Docker", x: "18%", y: "8%", delay: 0.9 },
  { label: "PostgreSQL", x: "-20%", y: "52%", delay: 1.0 },
  { label: "LLM", x: "22%", y: "58%", delay: 1.1 },
  { label: "RAG", x: "2%", y: "72%", delay: 1.2 },
  { label: "MLflow", x: "-24%", y: "86%", delay: 1.3 },
  { label: "Azure AI", x: "16%", y: "94%", delay: 1.4 },
];

const stackRow = ["LLM", "RAG", "MLOps", "Computer Vision", "Forecasting"];

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
              Production AI Engineer · Cairo
            </p>
            <h1 className="text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-7xl">
              I build
              <br />
              production
              <br />
              <span className="text-gradient">AI systems,</span>
              <br />
              not just
              <br />
              demos.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
              LLMs, RAG, computer vision, forecasting — engineered as systems
              and shipped end to end. Built, tested, deployed, and measured.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              {stackRow.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink-soft"
                >
                  {s}
                </span>
              ))}
            </div>
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
              className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-accent/25 to-accent-2/25 blur-3xl"
            />
            {/* ring */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 -z-10 rounded-[2.9rem] border border-border-strong"
            />
            <div className="glass-strong overflow-hidden rounded-[2.5rem] p-2">
              <Portrait />
            </div>

            {/* floating stat panel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease }}
              className="glass absolute -left-4 top-8 hidden rounded-2xl px-5 py-4 md:block"
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
                Building at SustainGRC · Cairo
              </span>
            </motion.div>

            {/* floating tech chips */}
            {techChips.map((c) => (
              <motion.span
                key={c.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: c.delay, duration: 0.5, ease }}
                className="glass absolute hidden rounded-full px-3 py-1.5 font-mono text-xs text-ink shadow-lg shadow-black/20 md:block"
                style={{ left: c.x, top: c.y }}
              >
                {c.label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}