import type { Chunk, SourceKind } from "@/lib/copilot/types";
import {
  profile,
  stats,
  projects,
  experience,
  skills,
  principles,
  insights,
  trajectory,
  githubStats,
} from "@/lib/data";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function keywordsFrom(...parts: string[]): string[] {
  const set = new Set<string>();
  for (const part of parts) {
    for (const w of part.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length >= 3) set.add(w);
    }
  }
  return [...set];
}

export function buildChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  for (const p of projects) {
    const study = p.study;
    const text = [
      `Project: ${p.title}. Domain: ${p.domain}.`,
      `Tagline: ${p.tagline}`,
      `Summary: ${p.summary ?? ""}`,
      `Problem: ${p.problem}`,
      `Solution: ${p.solution}`,
      `Decisions: ${p.decisions.map((d) => `${d.title}: ${d.body}`).join(" | ")}`,
      `Architecture: ${p.architecture.nodes.map((n) => n.label + (n.sub ? ` (${n.sub})` : "")).join(" → ")}${p.architecture.caption ? ` — ${p.architecture.caption}` : ""}`,
      `Performance: ${p.performance.map((x) => `${x.value} ${x.label}`).join(", ")}`,
      `Stack: ${p.stack.join(", ")}`,
      `Impact: ${p.impact ? p.impact.join(", ") : ""}`,
      study
        ? [
            `Study: Requirements: ${study.requirements.join(" | ")}`,
            `Model choice: ${study.modelChoice}`,
            `Tradeoffs: ${study.tradeoffs.map((t) => `${t.choice} → ${t.cost}`).join(" | ")}`,
            `Challenges: ${study.challenges.join(" | ")}`,
            `Deployment: ${study.deployment}`,
            `Lessons: ${study.lessons.join(" | ")}`,
            `Observability: ${study.observability.tools.join(", ")}`,
          ].join(" ")
        : "",
    ].join(" ");

    chunks.push({
      id: `project-${p.study?.slug ?? slugify(p.title)}`,
      title: `${p.title} — ${p.domain}`,
      label: p.title,
      text,
      source: {
        kind: "project",
        slug: p.study?.slug ?? slugify(p.title),
        url: p.href,
      },
      keywords: keywordsFrom(p.title, p.domain, p.tagline, p.stack.join(" ")),
      authority: "metrics",
      priority: 0.4,
    });
  }

  const push = (id: string, kind: SourceKind, title: string, text: string, kw: string[]) =>
    chunks.push({
      id,
      title,
      label: title,
      text,
      source: { kind },
      keywords: kw,
      authority: "first-party",
      priority: 0.1,
    });

  push(
    "resume",
    "resume",
    "Resume summary",
    `Name: ${profile.name}. Roles: ${profile.roles.join(", ")}. Location: ${profile.location}. Email: ${profile.email}. LinkedIn: ${profile.linkedin}. GitHub: ${profile.github}. Resume PDF: ${profile.resume}.`,
    keywordsFrom(profile.name, ...profile.roles),
  );

  push(
    "stats",
    "stats",
    "Key statistics",
    `Stats: ${stats.map((s) => `${s.value} ${s.label}`).join(". ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join(". ")}.`,
    keywordsFrom("stats", "tests", "latency", "books", "repositories"),
  );

  push(
    "skills",
    "skill",
    "Skills by discipline",
    skills.map((g) => `${g.title}: ${g.items.join(", ")}`).join(". "),
    keywordsFrom(skills.map((g) => g.items.join(" ")).join(" ")),
  );

  push(
    "principles",
    "principle",
    "Engineering principles",
    principles.map((p) => `${p.index} ${p.title}: ${p.body}`).join(". "),
    keywordsFrom(principles.map((p) => `${p.title} ${p.body}`).join(" ")),
  );

  push(
    "experience",
    "experience",
    "Work experience",
    experience
      .map((r) => `${r.title} at ${r.company} (${r.period}): ${r.points.join(" ")}`)
      .join(". "),
    keywordsFrom(experience.map((r) => `${r.title} ${r.company} ${r.points.join(" ")}`).join(" ")),
  );

  push(
    "trajectory",
    "experience",
    "Career trajectory",
    trajectory.map((t) => `${t.period} ${t.title}: ${t.body} [${t.tags.join(", ")}]`).join(". "),
    keywordsFrom(trajectory.map((t) => `${t.title} ${t.tags.join(" ")}`).join(" ")),
  );

  push(
    "insights",
    "insight",
    "Writing and research",
    insights.map((i) => `${i.index} ${i.title}: ${i.body} (${i.href}, ${i.tag})`).join(". "),
    keywordsFrom(insights.map((i) => `${i.title} ${i.body} ${i.tag}`).join(" ")),
  );

  return chunks;
}