/**
 * Optional cross-encoder reranking seam.
 *
 * The site ships only the MiniLM bi-encoder, so production calls this without a
 * scorer and it is an identity function. Vendoring a cross-encoder (or passing a
 * scorer from a future caller) activates reranking without touching call sites.
 *
 * Failure is never fatal: a missing model, a timeout, or malformed scores must
 * degrade to the cosine ranking rather than break the answer.
 */
export type RerankScorer = (query: string, documents: string[]) => Promise<number[]>;

export const RERANK_TOP_K = 3;

export async function rerank<T extends { id: string }>(input: {
  results: T[];
  query: string;
  textOf: (result: T) => string;
  scorer?: RerankScorer;
  topK?: number;
}): Promise<T[]> {
  const { results, query, textOf, scorer, topK = RERANK_TOP_K } = input;
  if (!scorer || results.length <= 1) return results;

  let scores: number[];
  try {
    scores = await scorer(query, results.map(textOf));
  } catch {
    return results;
  }
  if (!Array.isArray(scores) || scores.length !== results.length) return results;
  if (scores.some((s) => !Number.isFinite(s))) return results;

  return results
    .map((result, i) => ({ result, score: scores[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, topK))
    .map((x) => x.result);
}
