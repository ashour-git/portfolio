"use client";

import { motion } from "framer-motion";
import { profile } from "@/lib/data";
import { ArrowIcon } from "./icons";
import { Reveal } from "./reveal";

export function Contact() {
  const links = [
    { label: "Email", href: `mailto:${profile.email}`, value: profile.email },
    { label: "GitHub", href: profile.github, value: "github.com/ashour-git" },
    { label: "LinkedIn", href: profile.linkedin, value: "in/mohamedashour-ai" },
    { label: "Resume", href: profile.resume, value: "Download PDF" },
  ];

  return (
    <section id="contact" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto w-full max-w-4xl px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Reveal>
            <p className="eyebrow mb-5">Open → Build</p>
            <h2 className="display max-w-2xl">Have an AI system worth building?</h2>
            <p className="lead mt-6 max-w-xl">
              I design and ship production AI — RAG, LLM systems, ML pipelines,
              and computer vision — measured in production and verifiable on
              GitHub. If the problem is real, I&rsquo;m glad to talk.
            </p>
          </Reveal>

          <ul className="mt-12 border-t border-line">
            {links.map((l) => (
              <li key={l.label} className="border-b border-line">
                <a
                  href={l.href}
                  target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-surface-hover"
                >
                  <span className="eyebrow w-24 shrink-0">{l.label}</span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-2 break-words text-base font-medium text-ink transition-colors group-hover:text-accent">
                    {l.value}
                    <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-8 font-mono text-xs leading-relaxed text-ink-faint">
            References from internships and collaborators available on request via
            LinkedIn — verified by the teams I&rsquo;ve shipped with.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
