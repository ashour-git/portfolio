export type CopilotMode =
  | "general"
  | "recruiter"
  | "interview"
  | "architecture"
  | "explore";

export type Lang = "ar" | "en";

export const COPILOT_MODES: CopilotMode[] = [
  "general",
  "recruiter",
  "interview",
  "architecture",
  "explore",
];

export type SourceKind =
  | "project"
  | "skill"
  | "principle"
  | "experience"
  | "insight"
  | "resume"
  | "stats"
  | "hire"
  | "about"
  | "linkedin";

export type Intent =
  | "recruiter"
  | "project"
  | "architecture"
  | "interview"
  | "resume"
  | "skills"
  | "experience"
  | "decision"
  | "general";

export type IntentResult = { primary: Intent; secondary?: Intent; confidence: number };

export type DocAuthority = "first-party" | "metrics" | "external";

export type RetrievalSignal = "cosine" | "keyword" | "intent" | "mode" | "priority" | "authority";

export type SignalBreakdown = { signal: RetrievalSignal; value: number; weight: number };

export type PlanTemplate =
  | "recruiter"
  | "project"
  | "interview"
  | "resume"
  | "skills"
  | "experience"
  | "decision"
  | "general"
  | "casual";

export type PlanStance = "high" | "medium" | "fallback";

export type PlanCard = "project" | "resume" | "skills" | "timeline" | "stats" | "links" | "none";

export type Plan = { template: PlanTemplate; stance: PlanStance; card: PlanCard; suggestions?: string[] };

export type Chunk = {
  id: string;
  title: string;
  label: string;
  text: string;
  source: { kind: SourceKind; slug?: string; url?: string };
  keywords: string[];
  authority: DocAuthority;
  priority: number;
};

export type RetrievalResult = {
  id: string;
  label: string;
  title: string;
  source: { kind: SourceKind; slug?: string; url?: string };
  score: number;
  parts: { cosine?: number; keyword?: number; boost?: number };
  reasons: string[];
  breakdown: SignalBreakdown[];
};

export type CopilotCard =
  | { kind: "project"; slug: string; title: string }
  | { kind: "resume"; title: string };

export type CopilotEvent =
  | { type: "meta"; id: string; mode: CopilotMode; model: string; startedAt: number; lang: Lang }
  | { type: "plan"; plan: Plan }
  | { type: "delta"; text: string }
  | { type: "sources"; sources: RetrievalResult[] }
  | { type: "card"; card: CopilotCard | null }
  | {
      type: "stats";
      tokens: { in: number; out: number };
      retrievalMs: number;
      totalMs: number;
      cache: "hit" | "build" | "miss";
      intent: Intent | "casual";
      confidence: number;
      strategy: "primary" | "relaxed";
    }
  | { type: "done"; finish: "stop" | "length" }
  | { type: "error"; code: number; message: string };

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type RequestBody = {
  message: string;
  mode?: CopilotMode;
  history?: { role: "user" | "assistant"; content: string }[];
};