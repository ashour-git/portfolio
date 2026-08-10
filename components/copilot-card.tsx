"use client";

import type { CopilotCard, PlanCard, RetrievalResult } from "@/lib/copilot/types";
import { skills, stats, githubStats, experience, profile, projects } from "@/lib/data";
import { ArchitectureDiagram } from "@/components/architecture-diagram";

export function CopilotCardPanel({
  card,
  planCard,
  sources,
}: {
  card: CopilotCard | null;
  planCard?: PlanCard;
  sources?: RetrievalResult[];
}) {
  if (!card && (!planCard || planCard === "none")) return null;
  if (card?.kind === "resume") return <ResumePanel />;
  if (card?.kind === "project") return <ProjectPanel card={card} />;
  if (planCard === "skills") return <SkillsPanel />;
  if (planCard === "timeline") return <TimelinePanel />;
  if (planCard === "stats") return <StatsPanel />;
  if (planCard === "links") return <LinksPanel />;
  return null;
}

function ResumePanel() {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Resume</p>
      <p className="mt-2 text-sm text-ink-soft">
        The full resume is in the site header — or ask for a summary in the chat.
      </p>
    </div>
  );
}

function ProjectPanel({ card }: { card: Extract<CopilotCard, { kind: "project" }> }) {
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

function SkillsPanel() {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Skills</p>
      <div className="mt-2 flex flex-col gap-2">
        {skills.map((g) => (
          <div key={g.title}>
            <p className="text-sm text-ink">{g.title}</p>
            <p className="text-xs text-ink-soft">{g.items.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelinePanel() {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Timeline</p>
      <ol className="mt-2 flex flex-col gap-2">
        {experience.map((r) => (
          <li key={r.company} className="text-sm">
            <span className="text-ink">{r.title}</span>
            <span className="text-ink-faint"> — {r.company} ({r.period})</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatsPanel() {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Stats</p>
      <dl className="mt-2 flex flex-col gap-1.5">
        {[...stats, ...githubStats].map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-2">
            <dt className="text-xs text-ink-soft">{s.label}</dt>
            <dd className="font-mono text-sm text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LinksPanel() {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Links</p>
      <div className="mt-2 flex flex-col gap-1.5 text-sm">
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">LinkedIn</a>
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">GitHub</a>
        <a href={profile.resume} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Resume</a>
      </div>
    </div>
  );
}
