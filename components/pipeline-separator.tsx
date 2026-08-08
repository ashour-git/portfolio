"use client";

import { motion } from "framer-motion";

export function PipelineSeparator({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative mx-auto my-24 flex h-12 max-w-6xl items-center px-6 md:px-10" aria-hidden="true">
      <div className="flex w-full items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border-strong" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          {from} <span className="text-accent">→</span> {to}
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border-strong" />
      </div>
      <motion.span
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pipeline-pulse absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_rgba(46,230,163,0.8)]"
      />
    </div>
  );
}