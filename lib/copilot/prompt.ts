import type { ChatMessage, CopilotMode, RetrievalResult } from "@/lib/copilot/types";
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

export function buildSystemPrompt(mode: CopilotMode): string {
  return [IDENTITY, MODE_INSTRUCTIONS[mode]].join("\n\n");
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
}): ChatMessage[] {
  const mode = input.mode ?? "general";
  const history = (input.history ?? []).slice(-6).map((m) => ({ role: m.role, content: m.content }));
  const context = serializeContext(input.results);
  const contextMsg: ChatMessage =
    context.length > 0
      ? {
          role: "user",
          content: `Relevant context:\n${context}\n\nAnswer only from this context, citing source numbers like [1].`,
        }
      : { role: "user", content: "No relevant context was retrieved. Say you have no grounded answer, then offer nearby topics." };

  return [ { role: "system", content: buildSystemPrompt(mode) }, ...history, contextMsg, { role: "user", content: input.message } ];
}