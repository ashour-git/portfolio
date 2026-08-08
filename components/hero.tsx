"use client";

import { motion } from "framer-motion";
import { profile } from "@/lib/data";
import { Magnetic } from "@/components/magnetic";
import { CommandCenter } from "./command-center";

const ease = [0.22, 1, 0.36, 1] as const;

const stackRow = ["LLM", "RAG", "MLOps", "Computer Vision", "Forecasting"];

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-36 md:pt-40"
    >
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
              LLMs, RAG, ML pipelines, and computer vision — engineered as
              products, shipped end to end, and measured in production. I ship
              real engineering work you can verify on GitHub.
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
              <Magnetic>
                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-sm font-semibold text-bg shadow-lg shadow-accent/25 transition-transform active:scale-[0.97]"
                >
                  Resume
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass inline-block rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
                >
                  GitHub
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#work"
                  className="glass inline-block rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
                >
                  Projects
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass inline-block rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
                >
                  LinkedIn
                </a>
              </Magnetic>
            </div>
          </motion.div>

          {/* portrait composition */}
          <CommandCenter />
        </div>
      </div>
    </section>
  );
}