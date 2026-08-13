import type { Intent } from "@/lib/copilot/types";

export const MAX_EXPANSION_TOKENS = 8;

export const INTENT_EXPANSIONS: Record<Intent, string[]> = {
  recruiter: ["AI engineer", "ML engineer", "LLM engineer", "shipped products", "skills", "experience", "hire", "evidence"],
  project: ["built", "stack", "impact", "RAG", "forecasting", "architecture"],
  architecture: ["architecture", "flow", "layers", "decisions", "tradeoffs", "data flow"],
  interview: ["project", "decision", "reasoning", "challenge", "tradeoff"],
  resume: ["roles", "summary", "profile", "location"],
  skills: ["tools", "stack", "technologies", "frameworks"],
  experience: ["roles", "companies", "career", "period"],
  decision: ["tradeoff", "reasoning", "chose", "why", "constraint"],
  general: [],
};

export function tokenize(q: string): string[] {
  return q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
}

export const ARABIC_BRIDGE: Array<[stem: string, english: string[]]> = [
  ["مهاراتك", ["skills", "tools"]],
  ["المعمارية", ["architecture", "design"]],
  ["استرجاع", ["retrieval", "search", "rag"]],
  ["السيرة", ["resume", "summary"]],
  ["مشاريع", ["projects", "built"]],
  ["مشروع", ["project", "built"]],
  ["مهارات", ["skills", "tools"]],
  ["معمارية", ["architecture", "design"]],
  ["تقنيات", ["technologies", "stack", "tools"]],
  ["سرعة", ["latency", "speed"]],
  ["خبرتك", ["experience", "career"]],
  ["خبرة", ["experience", "career"]],
  ["قرارات", ["decisions", "tradeoffs"]],
  ["الفرق", ["difference", "compare"]],
  ["عرفني", ["about", "yourself"]],
  ["أوظف", ["hire"]],
  ["بنيت", ["built", "created"]],
];

const AR_WORD_RE = /[؀-ٿݐ-ݿࢠ-ࣿ]+/g;

function arabicBridgeTokens(message: string): string[] {
  const out: string[] = [];
  for (const m of message.matchAll(AR_WORD_RE)) {
    const word = m[0];
    for (const [stem, english] of ARABIC_BRIDGE) {
      if (word.includes(stem)) out.push(...english);
    }
  }
  return [...new Set(out)];
}

export function rewriteQuery(message: string, intent: Intent): string[] {
  const base = tokenize(message);
  const bridge = arabicBridgeTokens(message);
  const all = [...base, ...bridge];
  if (intent === "general") return all;
  const extra = [
    ...new Set(INTENT_EXPANSIONS[intent].flatMap((p) => tokenize(p))),
  ]
    .filter((t) => !all.includes(t))
    .slice(0, MAX_EXPANSION_TOKENS);
  return [...all, ...extra];
}
