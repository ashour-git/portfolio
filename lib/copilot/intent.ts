import type { Intent, IntentResult } from "@/lib/copilot/types";
import { cosine } from "@/lib/copilot/scoring";

export const INTENTS: Intent[] = [
  "recruiter",
  "project",
  "architecture",
  "interview",
  "resume",
  "skills",
  "experience",
  "decision",
  "general",
];

export const INTENT_RULES: Record<Exclude<Intent, "general">, string[]> = {
  recruiter: [
    "why hire",
    "why should i",
    "hire you",
    "hire me",
    "hire u",
    "whay",
    "whyy",
    "why i should hire",
    "whay i should hire",
    "why hire you",
    "whay hire",
    "recruit",
    "hiring",
    "strong candidate",
    "fit for",
    "لماذا يجب",
    "أوظف",
    "وظفني",
    "مرشح",
  ],
  project: [
    "what did you build",
    "what have you built",
    "tell me about your projects",
    "your projects",
    "project work",
    "built",
    "created",
    "ماذا بنيت",
    "مشروعك",
    "بنيت",
  ],
  architecture: [
    "architecture",
    "how does it work",
    "how is it built",
    "data flow",
    "flow through",
    "layers",
    "diagram",
    "under the hood",
    "system design",
    "pipeline",
    "اشرح لي",
    "المعمارية",
    "معمارية",
    "كيف يعمل",
    "تدفق",
    "طبقات",
  ],
  interview: [
    "interview me",
    "interview",
    "ask me",
    "quiz me",
    "question me",
    "قابلني",
    "مقابلة",
    "اسألني",
  ],
  resume: [
    "resume summary",
    "resume",
    "cv",
    "summary about you",
    "about you",
    "who are you",
    "tell me about yourself",
    "السيرة الذاتية",
    "سيرة ذاتية",
    "عرفني",
    "من أنت",
  ],
  skills: [
    "skills",
    "technologies",
    "tech stack",
    "stack",
    "frameworks",
    "what do you know",
    "languages",
    "tools you use",
    "مهارات",
    "مهاراتك",
    "تقنيات",
    "أدوات",
    "لغات",
  ],
  experience: [
    "work experience",
    "experience",
    "career",
    "where have you worked",
    "companies",
    "roles you held",
    "job history",
    "خبرة",
    "خبرتك",
    "مسيرتي",
    "عملت",
    "سرعة",
  ],
  decision: [
    "tradeoffs",
    "trade-off",
    "why did you",
    "why that",
    "why choose",
    "why not",
    "key decisions",
    "decision",
    "الفرق",
    "قرارات",
    "لماذا اخترت",
    "مقايضات",
  ],
};

export const INTENT_CENTROIDS: Record<Exclude<Intent, "general">, string[]> = {
  recruiter: [
    "Why should I hire you?",
    "What makes you a strong candidate?",
    "Your experience and strengths for this role",
    "How do you add value to a team?",
  ],
  project: [
    "What did you build?",
    "Tell me about your projects",
    "Your project work and its impact",
    "RestAI RAG assistant and forecasting engine",
  ],
  architecture: [
    "Explain the architecture of RestAI",
    "How does the data flow through the system?",
    "Walk me through the pipeline layers",
    "Design decisions and system architecture",
  ],
  interview: [
    "Interview me about your work",
    "Ask me questions about my projects",
    "Mock technical interview",
  ],
  resume: [
    "Give me your resume summary",
    "About you and your background",
    "Who are you and what do you do?",
  ],
  skills: [
    "What skills and technologies do you have?",
    "Your tech stack and tools",
    "List your technical skills",
  ],
  experience: [
    "Where have you worked?",
    "Your work experience and career",
    "Companies and roles you have held",
  ],
  decision: [
    "Why did you choose that approach?",
    "What tradeoffs did you make?",
    "Key decisions and their reasoning",
  ],
};

const RULE_CONFIDENCE = 0.9;
const GENERAL_CONFIDENCE = 0.2;
export const CENTROID_MIN = 0.35;
export const CENTROID_MAX = 0.82;

export function normalizeIntent(text: string): string {
  return text.toLowerCase().replace(/[?!.,;:]+/g, " ").replace(/\s+/g, " ").trim();
}

export function classifyByRules(message: string): IntentResult {
  const q = normalizeIntent(message);
  const hits: Intent[] = [];
  for (const intent of INTENTS) {
    if (intent === "general") continue;
    if (INTENT_RULES[intent].some((p) => q.includes(p))) hits.push(intent);
  }
  if (hits.length > 0) {
    return { primary: hits[0], secondary: hits[1], confidence: RULE_CONFIDENCE };
  }
  return { primary: "general", confidence: GENERAL_CONFIDENCE };
}

export function classifyByCentroid(
  vec: Float32Array,
  centroids: Partial<Record<Intent, Float32Array>>,
): IntentResult {
  let best: Intent = "general";
  let bestScore = 0;
  for (const intent of INTENTS) {
    if (intent === "general") continue;
    const c = centroids[intent];
    if (!c) continue;
    const score = cosine(vec, c);
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }
  if (bestScore >= CENTROID_MIN) {
    const confidence = Math.min(CENTROID_MAX, 0.4 + (bestScore - CENTROID_MIN) * 1.6);
    return { primary: best, confidence };
  }
  return { primary: "general", confidence: GENERAL_CONFIDENCE };
}

export async function classifyMessage(input: {
  message: string;
  embedder: (text: string) => Promise<Float32Array>;
  centroids: Partial<Record<Intent, Float32Array>>;
}): Promise<IntentResult> {
  const byRule = classifyByRules(input.message);
  if (byRule.primary !== "general") return byRule;
  const vec = await input.embedder(input.message);
  return classifyByCentroid(vec, input.centroids);
}