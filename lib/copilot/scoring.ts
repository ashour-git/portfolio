import type {
  Chunk,
  CopilotMode,
  DocAuthority,
  Intent,
  RetrievalResult,
  RetrievalSignal,
  SignalBreakdown,
  SourceKind,
} from "@/lib/copilot/types";

export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function keywordOverlap(queryTokens: string[], keywords: string[]): number {
  if (queryTokens.length === 0) return 0;
  const kw = new Set(keywords);
  let hits = 0;
  for (const t of queryTokens) if (kw.has(t)) hits++;
  return hits / queryTokens.length;
}

export const MODE_BOOST: Record<CopilotMode, Partial<Record<SourceKind, number>>> = {
  general: {},
  recruiter: { experience: 0.15, resume: 0.1, skill: 0.08, stats: 0.05 },
  interview: { project: 0.1, principle: 0.05 },
  architecture: { project: 0.15 },
  explore: { principle: 0.08, insight: 0.08, project: 0.03 },
};

export const INTENT_BOOST: Record<Intent, Partial<Record<SourceKind, number>>> = {
  recruiter: { hire: 0.22, resume: 0.12, experience: 0.1, skill: 0.06, stats: 0.04 },
  project: { project: 0.15 },
  architecture: { project: 0.2 },
  interview: { project: 0.1, principle: 0.08, insight: 0.05 },
  resume: { resume: 0.2 },
  skills: { skill: 0.2 },
  experience: { experience: 0.2 },
  decision: { project: 0.12, principle: 0.06, insight: 0.05 },
  general: {},
};

export const AUTHORITY_REASON: Record<DocAuthority, string> = {
  "first-party": "authority: first-party",
  metrics: "authority: metrics",
  external: "authority: external",
};

export const DEFAULT_WEIGHTS = { cosine: 0.45, keyword: 0.2, intent: 0.15, mode: 0.1, priority: 0.1 };

export type RetrieveOpts = {
  k?: number;
  minScore?: number;
  weights?: Partial<typeof DEFAULT_WEIGHTS>;
  mode?: CopilotMode;
  intent?: Intent;
  embeddings: Record<string, Float32Array>;
};

export function retrieveTopK(
  queryVec: Float32Array,
  queryTokens: string[],
  chunks: Chunk[],
  opts: RetrieveOpts,
): RetrievalResult[] {
  const k = opts.k ?? 5;
  const minScore = opts.minScore ?? 0.25;
  const weights = { ...DEFAULT_WEIGHTS, ...opts.weights };
  const mode = opts.mode ?? "general";
  const intent = opts.intent ?? "general";
  const modeBoost = MODE_BOOST[mode];
  const intentBoost = INTENT_BOOST[intent];

  const scored = chunks
    .map((chunk): RetrievalResult => {
      const vec = opts.embeddings[chunk.id];
      const cosineScore = vec ? cosine(queryVec, vec) : 0;
      const keywordScore = keywordOverlap(queryTokens, chunk.keywords);
      const intentScore = intentBoost[chunk.source.kind] ?? 0;
      const modeScore = modeBoost[chunk.source.kind] ?? 0;
      const priorityScore = chunk.priority ?? 0;
      const score =
        weights.cosine * cosineScore +
        weights.keyword * keywordScore +
        weights.intent * intentScore +
        weights.mode * modeScore +
        weights.priority * priorityScore;

      const breakdown: SignalBreakdown[] = [
        { signal: "cosine", value: cosineScore, weight: weights.cosine },
        { signal: "keyword", value: keywordScore, weight: weights.keyword },
      ];
      if (intentScore > 0) breakdown.push({ signal: "intent", value: intentScore, weight: weights.intent });
      if (modeScore > 0) breakdown.push({ signal: "mode", value: modeScore, weight: weights.mode });
      breakdown.push({ signal: "priority", value: priorityScore, weight: weights.priority });

      const reasons: string[] = [];
      if (vec) reasons.push(`cosine ${cosineScore.toFixed(2)}`);
      if (keywordScore > 0) reasons.push(`keyword '${queryTokens.join(" ")}'`);
      if (intentScore > 0) reasons.push(`intent: ${intent} boost`);
      if (modeScore > 0) reasons.push(`mode: ${mode} boost`);
      reasons.push(AUTHORITY_REASON[chunk.authority]);
      if (reasons.length === 0) reasons.push("index match");

      return {
        id: chunk.id,
        label: chunk.label,
        title: chunk.title,
        source: chunk.source,
        score,
        parts: {
          cosine: vec ? cosineScore : undefined,
          keyword: keywordScore > 0 ? keywordScore : undefined,
          boost: intentScore + modeScore > 0 ? intentScore + modeScore : undefined,
        },
        reasons,
        breakdown,
      };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return scored.slice(0, k);
}