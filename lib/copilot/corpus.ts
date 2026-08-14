import type { Chunk, DocAuthority, SourceKind } from "@/lib/copilot/types";
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

const AUTHORITY: Record<SourceKind, DocAuthority> = {
  project: "metrics",
  skill: "first-party",
  principle: "first-party",
  experience: "external",
  insight: "external",
  resume: "metrics",
  stats: "metrics",
  hire: "metrics",
  about: "first-party",
  linkedin: "external",
};

const BASE_PRIORITY: Record<SourceKind, number> = {
  project: 0.4,
  skill: 0.2,
  principle: 0.15,
  experience: 0.3,
  insight: 0.1,
  resume: 0.5,
  stats: 0.25,
  hire: 0.6,
  about: 0.3,
  linkedin: 0.2,
};

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
      authority: AUTHORITY.project,
      priority: BASE_PRIORITY.project,
    });
  }

  const push = (
    id: string,
    kind: SourceKind,
    label: string,
    title: string,
    text: string,
    kw: string[],
  ) =>
    chunks.push({
      id,
      label,
      title,
      text,
      source: { kind },
      keywords: kw,
      authority: AUTHORITY[kind],
      priority: BASE_PRIORITY[kind],
    });

  push(
    "resume",
    "resume",
    "Resume",
    "Resume summary",
    `Name: ${profile.name}. Roles: ${profile.roles.join(", ")}. Location: ${profile.location}. Email: ${profile.email}. LinkedIn: ${profile.linkedin}. GitHub: ${profile.github}. Resume PDF: ${profile.resume}.`,
    keywordsFrom(profile.name, ...profile.roles, "resume"),
  );

  push(
    "stats",
    "stats",
    "Stats",
    "Key statistics",
    `Stats: ${stats.map((s) => `${s.value} ${s.label}`).join(". ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join(". ")}.`,
    keywordsFrom("stats", "tests", "latency", "books", "repositories"),
  );

  push(
    "skills",
    "skill",
    "Skills",
    "Skills by discipline",
    skills.map((g) => `${g.title}: ${g.items.join(", ")}`).join(". "),
    keywordsFrom(skills.map((g) => g.items.join(" ")).join(" "), "skills"),
  );

  push(
    "principles",
    "principle",
    "Principles",
    "Engineering principles",
    principles.map((p) => `${p.index} ${p.title}: ${p.body}`).join(". "),
    keywordsFrom(principles.map((p) => `${p.title} ${p.body}`).join(" ")),
  );

  push(
    "experience",
    "experience",
    "Experience",
    "Work experience",
    experience
      .map((r) => `${r.title} at ${r.company} (${r.period}): ${r.points.join(" ")}`)
      .join(". "),
    keywordsFrom(experience.map((r) => `${r.title} ${r.company} ${r.points.join(" ")}`).join(" ")),
  );

  push(
    "trajectory",
    "experience",
    "Trajectory",
    "Career trajectory",
    trajectory.map((t) => `${t.period} ${t.title}: ${t.body} [${t.tags.join(", ")}]`).join(". "),
    keywordsFrom(trajectory.map((t) => `${t.title} ${t.tags.join(" ")}`).join(" ")),
  );

  push(
    "insights",
    "insight",
    "Insights",
    "Writing and research",
    insights.map((i) => `${i.index} ${i.title}: ${i.body} (${i.href}, ${i.tag})`).join(". "),
    keywordsFrom(insights.map((i) => `${i.title} ${i.body} ${i.tag}`).join(" ")),
  );

  const hireText = [
    `Why hire ${profile.name}: ${profile.roles.join(", ")} based in ${profile.location}.`,
    `Track record: ${stats.map((s) => `${s.value} ${s.label}`).join("; ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join("; ")}.`,
    `Production AI experience: ${experience.map((r) => `${r.title} at ${r.company} (${r.period})`).join("; ")}.`,
    `Skills: ${skills.map((g) => g.items.join(", ")).join("; ")}.`,
    `Principles: ${principles.map((p) => `${p.index} ${p.title}`).join("; ")}.`,
  ].join(" ");

  push(
    "hire",
    "hire",
    "Hire",
    "Why hire Mohamed",
    hireText,
    keywordsFrom(
      "hire",
      ...profile.roles,
      stats.map((s) => s.label).join(" "),
      experience.map((r) => r.company).join(" "),
      "production",
      "evidence",
      "tests",
    ),
  );

  const aboutText = [
    `About ${profile.name}: ${profile.roles.join(", ")} based in ${profile.location}.`,
    `Career trajectory: ${trajectory.map((t) => `${t.period} ${t.title}: ${t.body}`).join(". ")}.`,
    `Principles: ${principles.map((p) => `${p.title}: ${p.body}`).join(". ")}.`,
    `Writing: ${insights.map((i) => `${i.title}: ${i.body}`).join(". ")}.`,
  ].join(" ");

  push(
    "about",
    "about",
    "About",
    "About Mohamed",
    aboutText,
    keywordsFrom("about", ...profile.roles, trajectory.map((t) => t.title).join(" "), principles.map((p) => p.title).join(" ")),
  );

  push(
    "linkedin",
    "linkedin",
    "LinkedIn",
    "LinkedIn and links",
    `Contact ${profile.name}: email ${profile.email}, LinkedIn ${profile.linkedin}, GitHub ${profile.github}, resume ${profile.resume}.`,
    keywordsFrom("linkedin", "contact", "email", "github", "resume"),
  );

  const arHire = [
    `لماذا توظف ${profile.name}: ${profile.roles.join("، ")} ومقيم في ${profile.location}.`,
    `السجل: ${stats.map((s) => `${s.value} ${s.label}`).join("؛ ")}.`,
    `خبرة إنتاجية: ${experience.map((r) => `${r.title} في ${r.company} (${r.period})`).join("؛ ")}.`,
    `المهارات: ${skills.map((g) => g.items.join("، ")).join("؛ ")}.`,
    `المبادئ: ${principles.map((p) => `${p.index} ${p.title}`).join("؛ ")}.`,
  ].join(" ");
  push(
    "ar-hire",
    "hire",
    "لماذا محمد؟",
    "لماذا توظف محمد",
    `${arHire}\nEnglish: Why hire ${profile.name}: ${profile.roles.join(", ")}. Track record: ${stats.map((s) => `${s.value} ${s.label}`).join("; ")}.`,
    keywordsFrom("hire", ...profile.roles, stats.map((s) => s.label).join(" "), experience.map((r) => r.company).join(" ")),
  );

  const arAbout = [
    `نبذة عن ${profile.name}: ${profile.roles.join("، ")} ومقيم في ${profile.location}.`,
    `المسار المهني: ${trajectory.map((t) => `${t.period} ${t.title}: ${t.body}`).join(". ")}.`,
    `المبادئ: ${principles.map((p) => `${p.title}: ${p.body}`).join(". ")}.`,
    `الكتابات: ${insights.map((i) => `${i.title}: ${i.body}`).join(". ")}.`,
  ].join(" ");
  push(
    "ar-about",
    "about",
    "نبذة عني",
    "نبذة عن محمد",
    `${arAbout}\nEnglish: About ${profile.name}: ${profile.roles.join(", ")} based in ${profile.location}.`,
    keywordsFrom("about", ...profile.roles, trajectory.map((t) => t.title).join(" ")),
  );

  push(
    "ar-resume",
    "resume",
    "السيرة الذاتية",
    "ملخص السيرة الذاتية",
    `الاسم: ${profile.name}. الأدوار: ${profile.roles.join("، ")}. الموقع: ${profile.location}. البريد: ${profile.email}. LinkedIn: ${profile.linkedin}. GitHub: ${profile.github}.\nEnglish: Name: ${profile.name}. Roles: ${profile.roles.join(", ")}. Location: ${profile.location}.`,
    keywordsFrom(profile.name, ...profile.roles, "resume"),
  );

  const arSkills = skills
    .map((g) => `${g.title}: ${g.items.join("، ")}`)
    .join(". ");
  push(
    "ar-skills",
    "skill",
    "المهارات",
    "المهارات حسب التخصص",
    `${arSkills}\nEnglish: ${skills.map((g) => `${g.title}: ${g.items.join(", ")}`).join(". ")}`,
    keywordsFrom(skills.map((g) => g.items.join(" ")).join(" "), "skills"),
  );

  const arExperience = experience
    .map((r) => `${r.title} في ${r.company} (${r.period}): ${r.points.join(" ")}`)
    .join(". ");
  push(
    "ar-experience",
    "experience",
    "الخبرة",
    "الخبرة العملية",
    `${arExperience}\nEnglish: ${experience.map((r) => `${r.title} at ${r.company} (${r.period})`).join("; ")}`,
    keywordsFrom(experience.map((r) => `${r.title} ${r.company}`).join(" "), "experience"),
  );

  push(
    "ar-linkedin",
    "linkedin",
    "LinkedIn",
    "التواصل والروابط",
    `تواصل مع ${profile.name}: البريد ${profile.email}، LinkedIn ${profile.linkedin}، GitHub ${profile.github}.\nEnglish: Contact ${profile.name}: email ${profile.email}, LinkedIn ${profile.linkedin}, GitHub ${profile.github}.`,
    keywordsFrom("linkedin", "contact", "email", "github", "resume"),
  );

  const arStats = `${stats.map((s) => `${s.value} ${s.label}`).join(". ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join(". ")}`;
  push(
    "ar-stats",
    "stats",
    "الأرقام",
    "الأرقام الرئيسية",
    `الأرقام: ${arStats}.\nEnglish: Stats: ${stats.map((s) => `${s.value} ${s.label}`).join(". ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join(". ")}.`,
    keywordsFrom("stats", "tests", "latency", "books", "repositories"),
  );

  return chunks;
}