import type { ChatMessage, CopilotMode, Plan, RetrievalResult } from "@/lib/copilot/types";
import { profile } from "@/lib/data";

const IDENTITY = `You are the Engineering Copilot for ${profile.name}, an AI/ML/LLM engineer based in ${profile.location}. You explain his work, projects, architecture, decisions, skills, and experience. Be professional, technical, precise, and concise. Prefer engineering language over marketing language. Never claim anything not present in the provided context, and never fabricate facts, numbers, or sources. If a question is outside his work or the provided sources, decline politely in one sentence. Cite the [N] source numbers from the context when you use them.`;

const MODE_INSTRUCTIONS: Record<CopilotMode, string> = {
  general: "Answer the question grounded in the context below.",
  recruiter:
    "Summarize experience, strengths, skills, and relevant projects. Emphasize evidence: shipped products, tests, latency, and real numbers from the context.",
  interview:
    "Answer as if you were Mohamed being interviewed. Give the reasoning behind decisions using the project context.",
  architecture:
    "For the most relevant project, walk through the architecture flow from the context: layers, data flow, key decisions, tradeoffs, and what was learned.",
  explore:
    "Compare and connect projects: recommend one based on the question, note category, stack, and how they relate.",
};

export const TEMPLATE_HINTS: Record<Plan["template"], string> = {
  recruiter:
    "Structure the answer with H3 sections: 'Why hire Mohamed', 'Track record', 'Where he fits'. Use markdown tables for key metrics and skills.",
  project:
    "Structure with H3 sections: 'Overview', 'Architecture', 'Key decisions', 'Tradeoffs', 'Impact'. Use a markdown table for stack or performance.",
  interview:
    "Answer in a direct first-person tone with short paragraphs; show reasoning per decision and use a table for tradeoffs.",
  resume:
    "Give a compact profile: roles, location, highlights, links. Use bullet points, no verbose prose.",
  skills:
    "Group by discipline in a markdown table with columns 'Area' and 'Tools'. Keep it scannable.",
  experience:
    "Chronological list: role, company, period, and 2–3 evidence bullets each. Use a markdown table for the overview.",
  decision:
    "For each decision, give context → choice → tradeoff. Use a markdown table with columns 'Decision', 'Choice', 'Cost'.",
  general:
    "Answer concisely and stay grounded in the context. Use short paragraphs or a small markdown table where it aids scanning.",
};

export function buildSystemPrompt(mode: CopilotMode, plan?: Plan): string {
  const parts = [IDENTITY, MODE_INSTRUCTIONS[mode]];
  if (plan) {
    parts.push(TEMPLATE_HINTS[plan.template]);
    if (plan.stance === "fallback") {
      parts.push(
        "No supporting indexed context exists. Say in one sentence that you lack a grounded answer, then present the suggested related topics as bullet points.",
      );
    }
  }
  return parts.join("\n\n");
}

export function serializeContext(results: (RetrievalResult & { text?: string })[]): string {
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.text ? r.text : ""}`)
    .join("\n\n");
}

export function buildMessages(input: {
  message: string;
  mode?: CopilotMode;
  history?: ChatMessage[];
  results: RetrievalResult[];
  plan?: Plan;
}): ChatMessage[] {
  const mode = input.mode ?? "general";
  const plan = input.plan;
  const history = (input.history ?? []).slice(-6).map((m) => ({ role: m.role, content: m.content }));
  const context = serializeContext(input.results);
  let contextMsg: ChatMessage;
  if (context.length > 0) {
    contextMsg = {
      role: "user",
      content: `Relevant context:\n${context}\n\nAnswer only from this context, citing source numbers like [1].`,
    };
  } else if (plan?.suggestions?.length) {
    contextMsg = {
      role: "user",
      content: `No supporting context was retrieved. Do not fabricate. Say you cannot give a grounded answer, then suggest these related topics: ${plan.suggestions.join(", ")}.`,
    };
  } else {
    contextMsg = {
      role: "user",
      content: "No relevant context was retrieved. Say you have no grounded answer, then offer nearby topics.",
    };
  }

  return [{ role: "system", content: buildSystemPrompt(mode, plan) }, ...history, contextMsg, { role: "user", content: input.message }];
}