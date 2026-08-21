import type { CopilotMode, ErrorKind, Lang, Plan, PlanTemplate, RetrievalResult, SourceKind } from "@/lib/copilot/types";

const EN_MODE: Record<CopilotMode, string> = {
  general: "General",
  recruiter: "Recruiter",
  interview: "Interview",
  architecture: "Architecture",
  explore: "Explore",
};

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
  return lang === "ar" ? AR_MODE[mode] : EN_MODE[mode];
}

const EN_SOURCE: Partial<Record<SourceKind, string>> = {
  resume: "Resume",
  experience: "Experience",
  skill: "Skills",
  stats: "Stats",
  hire: "Hire",
  about: "About",
  project: "Projects",
  linkedin: "LinkedIn",
};

export function sourceLabel(kind: SourceKind, display: string, lang: Lang): string {
  if (lang === "ar") return AR_SOURCE[kind] ?? display;
  return EN_SOURCE[kind] ?? display;
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

/* ---------- polished failure states (spec §20) — raw provider errors never
   reach the user; each typed kind maps to a calm, localized message. ---------- */

const ERROR_MESSAGES: Record<ErrorKind, { en: string; ar: string }> = {
  model_unavailable: {
    en: "Copilot is temporarily unavailable.",
    ar: "المساعد الهندسي غير متاح مؤقتًا.",
  },
  rate_limited: {
    en: "Copilot is a little busy. Please wait a moment, then try again.",
    ar: "المساعد الهندسي مشغول قليلًا. انتظر لحظات ثم حاول مرة أخرى.",
  },
  network: {
    en: "Copilot is temporarily unavailable.",
    ar: "المساعد الهندسي غير متاح مؤقتًا.",
  },
  retrieval: {
    en: "I couldn't find a grounded answer for that yet.",
    ar: "لم أعثر على إجابة مدعومة لهذا السؤال بعد.",
  },
  config: {
    en: "Copilot is temporarily unavailable.",
    ar: "المساعد الهندسي غير متاح مؤقتًا.",
  },
  aborted: {
    en: "Stopped.",
    ar: "تم الإيقاف.",
  },
  unknown: {
    en: "Copilot is temporarily unavailable.",
    ar: "المساعد الهندسي غير متاح مؤقتًا.",
  },
};

export function errorMessage(kind: ErrorKind, lang: Lang): string {
  return ERROR_MESSAGES[kind][lang];
}

export const RETRY_LABEL: Record<Lang, string> = { en: "Try again", ar: "حاول مرة أخرى" };
export const CLOSE_LABEL: Record<Lang, string> = { en: "Close copilot", ar: "إغلاق المساعد" };

export const STREAM_PHASE: Record<Lang, { retrieving: string; writing: string }> = {
  en: { retrieving: "retrieving", writing: "writing" },
  ar: { retrieving: "استرجاع", writing: "كتابة" },
};

/* ---------- Explain Why (spec §18) — plain-language reasoning, no scores. ---------- */

export function explainWhyLabel(lang: Lang): string {
  return lang === "ar" ? "لماذا هذه الإجابة؟" : "Why this answer?";
}

export function explainWhyBody(plan: Plan | null, labels: string[], lang: Lang): string[] {
  const list = labels.length > 0 ? labels : [lang === "ar" ? "السياق المفهرس" : "indexed portfolio context"];
  if (plan?.template === "casual") {
    return [
      lang === "ar"
        ? "ردّ قصير محادثي — لا يتطلب استرجاعًا من قاعدة المعرفة."
        : "A short conversational reply — no knowledge-base retrieval needed.",
    ];
  }
  return [
    lang === "ar"
      ? "بناءً على سؤالك، استخدمت هذه المصادر من ملف محمد:"
      : "Based on your question, I used these sources from Mohamed's portfolio:",
    ...list.map((l) => `• ${l}`),
  ];
}

/* ---------- contextual follow-ups (spec §24) — actions match the answer's
   plan so nothing irrelevant appears. ---------- */

export type FollowUp =
  | { kind: "run"; prompt: { en: string; ar: string } }
  | { kind: "nav"; href: string; label: { en: string; ar: string } };

export const FOLLOWUPS: Partial<Record<PlanTemplate, { en: string; ar: string; action: FollowUp }[]>> = {
  recruiter: [
    {
      en: "Experience",
      ar: "الخبرة",
      action: { kind: "run", prompt: { en: "Show Mohamed's experience and timeline", ar: "اعرض خبرة محمد الزمنية" } },
    },
    {
      en: "Projects",
      ar: "المشاريع",
      action: { kind: "run", prompt: { en: "What are Mohamed's strongest projects?", ar: "ما هي أقوى مشاريع محمد؟" } },
    },
    {
      en: "Resume",
      ar: "السيرة الذاتية",
      action: { kind: "nav", href: "/resume.pdf", label: { en: "Resume", ar: "السيرة الذاتية" } },
    },
  ],
  project: [
    {
      en: "Architecture",
      ar: "المعمارية",
      action: { kind: "run", prompt: { en: "Show the architecture of that project", ar: "اعرض معمارية هذا المشروع" } },
    },
    {
      en: "Decisions",
      ar: "القرارات",
      action: { kind: "run", prompt: { en: "What engineering decisions were made?", ar: "ما القرارات الهندسية التي اتُّخذت؟" } },
    },
    {
      en: "Trade-offs",
      ar: "المقايضات",
      action: { kind: "run", prompt: { en: "What were the trade-offs?", ar: "ما المقايضات؟" } },
    },
    {
      en: "Implementation",
      ar: "التنفيذ",
      action: { kind: "run", prompt: { en: "How was it implemented?", ar: "كيف تم تنفيذها؟" } },
    },
  ],
  decision: [
    {
      en: "Why this choice?",
      ar: "لماذا هذا الاختيار؟",
      action: { kind: "run", prompt: { en: "Explain why that choice was made", ar: "اشرح سبب هذا الاختيار" } },
    },
  ],
  skills: [
    {
      en: "Projects using this",
      ar: "مشاريع تستخدمها",
      action: { kind: "run", prompt: { en: "Which projects use these skills?", ar: "أي مشاريع تستخدم هذه المهارات؟" } },
    },
  ],
  general: [],
};

export const EMPTY_STATE: Record<Lang, { title: string; subtitle: string }> = {
  en: {
    title: "Engineering Copilot",
    subtitle: "Explore Mohamed's work through natural language — projects, architecture, decisions, and evidence.",
  },
  ar: {
    title: "المساعد الهندسي",
    subtitle: "استكشف عمل محمد بلغة طبيعية — المشاريع، المعمارية، القرارات، والأدلة.",
  },
};

/* ---------- source links (spec §17) — sources are clickable, not raw indexes. ---------- */

export function sourceHref(kind: SourceKind, source?: { slug?: string; url?: string }): string | undefined {
  if (source?.url) return source.url;
  if (kind === "resume") return "/resume.pdf";
  if (kind === "project" && source?.slug) return `/case-studies/${source.slug}`;
  if (kind === "linkedin") return "https://www.linkedin.com";
  return undefined;
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
