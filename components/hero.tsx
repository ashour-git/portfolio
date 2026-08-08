"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { profile, stats } from "@/lib/data";
import { Portrait } from "@/components/portrait";
import { Magnetic } from "@/components/magnetic";

const ease = [0.22, 1, 0.36, 1] as const;

const techChips = [
  { label: "FastAPI", x: "-12%", y: "34%", delay: 0.7 },
  { label: "PyTorch", x: "6%", y: "-3%", delay: 0.8 },
  { label: "Docker", x: "94%", y: "24%", delay: 0.9 },
  { label: "PostgreSQL", x: "-12%", y: "52%", delay: 1.0 },
  { label: "LLM", x: "94%", y: "46%", delay: 1.1 },
  { label: "RAG", x: "-12%", y: "70%", delay: 1.2 },
  { label: "MLflow", x: "94%", y: "66%", delay: 1.3 },
  { label: "Azure AI", x: "62%", y: "-3%", delay: 1.4 },
];

const stackRow = ["LLM", "RAG", "MLOps", "Computer Vision", "Forecasting"];

export function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, -36]);
  const haloY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const haloOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
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
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
            className="relative mx-auto w-full max-w-sm lg:max-w-none"
            aria-label="Portrait"
            style={{ y: portraitY }}
          >
            {/* halo */}
            <motion.div
              aria-hidden="true"
              style={{ y: haloY, opacity: haloOpacity }}
              className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-accent/25 to-accent-2/25 blur-3xl"
            />
            {/* ring */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 -z-10 rounded-[2.9rem] border border-border-strong"
            />
            <Portrait />

            {/* floating stat panel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease }}
              className="glass absolute -left-4 bottom-6 hidden rounded-2xl px-5 py-4 md:block"
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
              className="glass absolute -bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2"
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
                className="glass absolute z-0 hidden rounded-full px-3 py-1.5 font-mono text-xs text-ink shadow-lg shadow-black/20 md:block"
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