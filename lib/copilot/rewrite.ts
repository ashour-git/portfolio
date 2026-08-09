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

export function rewriteQuery(message: string, intent: Intent): string[] {
  const base = tokenize(message);
  if (intent === "general") return base;
  const extra = [
    ...new Set(INTENT_EXPANSIONS[intent].flatMap((p) => tokenize(p))),
  ]
    .filter((t) => !base.includes(t))
    .slice(0, MAX_EXPANSION_TOKENS);
  return [...base, ...extra];
}