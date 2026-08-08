"use client";

import { motion } from "framer-motion";
import { profile } from "@/lib/data";
import { ArrowIcon } from "./icons";
import { SectionHeader } from "./section-header";

export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong relative overflow-hidden rounded-[2.5rem] p-10 md:p-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-2/20 blur-3xl"
          />
          <div className="relative">
            <SectionHeader eyebrow="OPEN → BUILD" title="Let's build something intelligent." />
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Open to AI engineering, LLM, MLOps, and applied ML roles — and to
              building production systems that actually ship.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${profile.email}`}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
              >
                {profile.email}
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
                href={profile.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
              >
                Resume (PDF)
              </a>
            </div>
            <p className="mt-6 font-mono text-xs leading-relaxed text-ink-faint">
              References from internships and collaborators available on request
              via LinkedIn — verified by the teams I've shipped with.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}