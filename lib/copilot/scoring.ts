import type { Chunk, CopilotMode, RetrievalResult, SourceKind } from "@/lib/copilot/types";

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

export type RetrieveOpts = {
  k?: number;
  minScore?: number;
  weights?: { cosine: number; keyword: number; boost: number };
  mode?: CopilotMode;
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
  const weights = opts.weights ?? { cosine: 0.6, keyword: 0.3, boost: 0.1 };
  const mode = opts.mode ?? "general";
  const boostMap = MODE_BOOST[mode];

  const scored = chunks
    .map((chunk): RetrievalResult => {
      const vec = opts.embeddings[chunk.id];
      const cosineScore = vec ? cosine(queryVec, vec) : 0;
      const keywordScore = keywordOverlap(queryTokens, chunk.keywords);
      const boost = boostMap[chunk.source.kind] ?? 0;
      const score = weights.cosine * cosineScore + weights.keyword * keywordScore + weights.boost * boost;

      const reasons: string[] = [];
      if (vec) reasons.push(`cosine ${cosineScore.toFixed(2)}`);
      if (keywordScore > 0) reasons.push(`keyword '${queryTokens.join(" ")}'`);
      if (boost > 0) reasons.push(`mode: ${mode} boost`);
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
          boost: boost > 0 ? boost : undefined,
        },
        reasons,
        breakdown: [],
      };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return scored.slice(0, k);
}