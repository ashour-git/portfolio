"use client";

import type { CopilotCard } from "@/lib/copilot/types";
import { projects } from "@/lib/data";
import { ArchitectureDiagram } from "@/components/architecture-diagram";

export function CopilotCardPanel({ card }: { card: CopilotCard | null }) {
  if (!card) return null;
  if (card.kind === "resume") {
    return (
      <div className="rounded-2xl border border-line bg-bg/40 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Resume</p>
        <p className="mt-2 text-sm text-ink-soft">
          The full resume is in the site header — or ask for a summary in the chat.
        </p>
      </div>
    );
  }
  const project = projects.find((p) => p.study?.slug === card.slug || p.title === card.title);
  if (!project) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-bg/40 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          {project.index} · {project.domain}
        </p>
        <h3 className="mt-1 font-serif text-lg italic text-ink">{project.title}</h3>
        <p className="mt-1 text-sm text-ink-soft">{project.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <span key={s} className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-ink-soft">
              {s}
            </span>
          ))}
        </div>
      </div>
      <ArchitectureDiagram flow={project.architecture} />
      <div className="rounded-2xl border border-line bg-bg/40 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Links</p>
        <div className="mt-2 flex gap-3 text-sm">
          {project.href && (
            <a href={project.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              GitHub
            </a>
          )}
          {project.study && (
            <a href={`/case-studies/${project.study.slug}`} className="text-accent hover:underline">
              Case study
            </a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Demo
            </a>
          )}
        </div>
      </div>
    </div>
  );
}