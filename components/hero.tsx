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
      className="relative overflow-hidden pt-32 md:pt-40"
    >
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
           {/* headline */}
           <motion.div
             initial={{ opacity: 0, y: 16 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.7, ease }}
           >
              <p className="eyebrow mb-6">Mohamed Ashour · Cairo</p>
              <h1 className="display-xl">
                I build
                <br />
                production AI systems,
                <br />
                <span className="serif-accent text-ink-soft">not just demos.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
                LLMs, RAG, ML pipelines, and computer vision — engineered as
                products, shipped end to end, and measured in production. The work
                is real, and it is verifiable on GitHub.
              </p>
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
                {stackRow.join("  ·  ")}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Magnetic>
                  <a
                    href={profile.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Resume
                  </a>
                </Magnetic>
               <a
                 href={profile.github}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="py-2 text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
               >
                 GitHub
               </a>
               <a
                 href="#work"
                 className="py-2 text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
               >
                 Projects
               </a>
               <a
                 href={profile.linkedin}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="py-2 text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
               >
                 LinkedIn
               </a>
             </div>
           </motion.div>

          {/* portrait composition */}
          <CommandCenter />
        </div>
      </div>
    </section>
  );
}