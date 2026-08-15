import type { CopilotMode, Lang, Plan, RetrievalResult, SourceKind } from "@/lib/copilot/types";

const AR_MODE: Record<CopilotMode, string> = {
  general: "عام",
  recruiter: "توظيف",
  interview: "مقابلة",
  architecture: "معمارية",
  explore: "استكشاف",
};

const AR_SOURCE: Partial<Record<SourceKind, string>> = {
  resume: "السيرة الذاتية",
  experience: "الخبرة",
  skill: "المهارات",
  stats: "الأرقام",
  hire: "لماذا محمد؟",
  about: "نبذة عني",
  linkedin: "LinkedIn",
};

export function modeLabel(mode: CopilotMode, lang: Lang): string {
  return lang === "ar" ? AR_MODE[mode] : mode;
}

export function sourceLabel(kind: SourceKind, display: string, lang: Lang): string {
  if (lang !== "ar") return display;
  return AR_SOURCE[kind] ?? display;
}

export const QUICK_ACTIONS: Record<Lang, string[]> = {
  en: [
    "What did you build?",
    "Show RestAI architecture",
    "Explain your RAG",
    "Why those tradeoffs?",
    "Interview me",
    "Resume summary",
  ],
  ar: [
    "ماذا بنيت؟",
    "اعرض معمارية RestAI",
    "اشرح نظام RAG",
    "لماذا استخدمت هذه القرارات؟",
    "قابِلني",
    "ملخص السيرة الذاتية",
  ],
};

export const PLACEHOLDER: Record<Lang, string> = {
  en: "Ask about projects, architecture, decisions…",
  ar: "اسأل عن المشاريع، المعمارية، القرارات…",
};

export const DIALOG_LABEL: Record<Lang, string> = {
  en: "Engineering Copilot",
  ar: "المساعد الهندسي",
};

export function groundedIn(labels: string[], lang: Lang): string {
  return lang === "ar"
    ? `مُسنَد إلى ${labels.join("، ")}`
    : `Grounded in ${labels.join(", ")}`;
}

export function verifiedFrom(count: number, lang: Lang): string {
  return lang === "ar"
    ? `تم التحقق من ${count} مصدرًا`
    : `Verified from ${count} indexed sources`;
}

export type ContextTopic =
  | "general"
  | "recruiter"
  | "restai"
  | "storefy"
  | "kepler"
  | "text2sql"
  | "semantic-book"
  | "architecture"
  | "skills"
  | "experience";

const AR_TOPIC: Record<ContextTopic, string> = {
  general: "عام",
  recruiter: "توظيف",
  restai: "RestAI",
  storefy: "Storefy",
  kepler: "Kepler",
  "text2sql": "Text2SQL",
  "semantic-book": "Semantic Book",
  architecture: "معمارية",
  skills: "المهارات",
  experience: "الخبرة",
};

const PROJECT_TOPICS: ContextTopic[] = [
  "restai",
  "storefy",
  "kepler",
  "text2sql",
  "semantic-book",
];

/**
 * Derives the right-panel context topic from the run's plan + retrieved
 * sources. Casual chit-chat collapses to GENERAL; a portfolio query about a
 * known project surfaces that project (CONTEXT · RESTAI), and a recruiter
 * query surfaces RECRUITER. See spec §13.
 */
export function contextTopic(plan: Plan | null, sources: RetrievalResult[] | undefined): ContextTopic {
  if (plan?.template === "casual") return "general";
  const project = sources?.find((s) => s.source.kind === "project");
  const slug = project?.source.slug as ContextTopic | undefined;
  if (slug && PROJECT_TOPICS.includes(slug)) return slug;
  if (plan?.template === "recruiter") return "recruiter";
  if (plan?.card === "skills") return "skills";
  if (plan?.card === "timeline") return "experience";
  return "general";
}

export function contextLabel(topic: ContextTopic, lang: Lang): string {
  const t = lang === "ar" ? AR_TOPIC[topic] : topic.toUpperCase();
  return lang === "ar" ? `السياق · ${t}` : `CONTEXT · ${t}`;
}

export const RELATED: Record<Lang, string> = {
  en: "Related:",
  ar: "ذات صلة:",
};

export const STAT_LABEL_AR: Record<string, string> = {
  "security tests passing": "اختبارات أمان ناجحة",
  "automated tests written": "اختبارات آلية",
  "books in the semantic index": "كتب في الفهرس الدلالي",
  "average retrieval latency": "متوسط زمن الاسترجاع",
};

export function showMetricsStrip(plan: Plan | null | undefined): boolean {
  return plan?.template === "recruiter" || plan?.card === "stats";
}

export const PANEL_TITLES: Record<Lang, { skills: string; timeline: string; stats: string; links: string; resume: string; tech: string; architecture: string; caseStudy: string; github: string }> = {
  en: {
    skills: "Skills",
    timeline: "Timeline",
    stats: "Stats",
    links: "Links",
    resume: "Resume",
    tech: "Stack",
    architecture: "Architecture",
    caseStudy: "Case study",
    github: "GitHub",
  },
  ar: {
    skills: "المهارات",
    timeline: "الخبرة",
    stats: "الأرقام",
    links: "الروابط",
    resume: "السيرة الذاتية",
    tech: "التقنيات",
    architecture: "المعمارية",
    caseStudy: "دراسة الحالة",
    github: "GitHub",
  },
};
