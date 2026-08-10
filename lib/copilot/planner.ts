import type {
  Intent,
  IntentResult,
  Plan,
  PlanCard,
  RetrievalResult,
} from "@/lib/copilot/types";

export const HIGH_MIN = 0.3;
export const MEDIUM_MIN = 0.15;
export const FALLBACK_SUGGESTIONS = ["Skills", "Projects", "Experience"];

function pickCard(intent: Intent, results: RetrievalResult[]): PlanCard {
  const has = (kind: string) => results.some((r) => r.source.kind === kind);
  switch (intent) {
    case "recruiter":
      return "resume";
    case "project":
    case "architecture":
      return has("project") ? "project" : "links";
    case "interview":
      return has("project") ? "project" : has("experience") ? "timeline" : "none";
    case "resume":
      return "resume";
    case "skills":
      return has("skill") ? "skills" : "none";
    case "experience":
      return has("experience") ? "timeline" : "none";
    case "decision":
      return has("project") ? "project" : "none";
    default:
      return has("stats") ? "stats" : "none";
  }
}

export function buildPlan(input: {
  intent: IntentResult;
  results: RetrievalResult[];
  suggestions?: string[];
}): Plan {
  const { intent, results } = input;
  const top = results[0]?.score ?? 0;
  let stance: Plan["stance"];
  if (results.length === 0 || top < MEDIUM_MIN) stance = "fallback";
  else if (top >= HIGH_MIN) stance = "high";
  else stance = "medium";

  const template = (intent.primary === "general" ? "general" : intent.primary) as Plan["template"];
  const card = pickCard(intent.primary, results);
  const suggestions =
    stance === "fallback" ? input.suggestions ?? FALLBACK_SUGGESTIONS : undefined;
  return { template, stance, card, suggestions };
}