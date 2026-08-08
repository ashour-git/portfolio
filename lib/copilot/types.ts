export type CopilotMode =
  | "general"
  | "recruiter"
  | "interview"
  | "architecture"
  | "explore";

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
  | "stats";

export type Chunk = {
  id: string;
  title: string;
  text: string;
  source: { kind: SourceKind; slug?: string; url?: string };
  keywords: string[];
};

export type RetrievalResult = {
  id: string;
  title: string;
  source: { kind: SourceKind; slug?: string; url?: string };
  score: number;
  parts: { cosine?: number; keyword?: number; boost?: number };
  reasons: string[];
};

export type CopilotCard =
  | { kind: "project"; slug: string; title: string }
  | { kind: "resume"; title: string };

export type CopilotEvent =
  | { type: "meta"; id: string; mode: CopilotMode; model: string; startedAt: number }
  | { type: "delta"; text: string }
  | { type: "sources"; sources: RetrievalResult[] }
  | { type: "card"; card: CopilotCard | null }
  | {
      type: "stats";
      tokens: { in: number; out: number };
      retrievalMs: number;
      totalMs: number;
      cache: "hit" | "build" | "miss";
    }
  | { type: "done"; finish: "stop" | "length" }
  | { type: "error"; code: number; message: string };

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type RequestBody = {
  message: string;
  mode?: CopilotMode;
  history?: { role: "user" | "assistant"; content: string }[];
};