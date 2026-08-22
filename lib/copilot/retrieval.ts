import { loadIndex, loadCentroids } from "./index";
import { retrieveTopK } from "./scoring";
import { rewriteQuery } from "./rewrite";
import { classifyMessage } from "./intent";
import { buildPlan } from "./planner";
import type { CopilotMode, Lang, RetrievalResult, Plan, IntentResult } from "./types";

export const RETRIEVE_K = 5;
export const RELAXED_K = RETRIEVE_K + 2;
export const PRIMARY_MIN_SCORE = 0.25;
export const RELAXED_MIN_SCORE = 0.12;
export const RELAX_CONFIDENCE_THRESHOLD = 0.35;

/** Caps per-chunk text and total budget to stay under TPM. */
export function capContext<T extends { text: string }>(results: T[], budget = 6000, perChunk = 1200): T[] {
  let total = 0;
  return results
    .map((r) => {
      let t = r.text.length > perChunk ? r.text.slice(0, perChunk) : r.text;
      if (total + t.length > budget) t = t.slice(0, Math.max(0, budget - total));
      total += t.length;
      return { ...r, text: t };
    })
    .filter((r) => r.text.length > 0);
}

export type RetrieveAndPlanOpts = {
  message: string;
  mode: string;
  lang: string;
  getEmbedder?: () => Promise<(t: string) => Promise<Float32Array>>;
  classifyIntent?: (message: string) => IntentResult | Promise<IntentResult>;
  cacheHits?: Map<string, { results: RetrievalResult[]; retrievalMs: number; strategy?: "primary" | "relaxed" }>;
};

export type RetrieveAndPlanResult = {
  results: RetrievalResult[];
  plan: Plan;
  retrievalMs: number;
  strategy: "primary" | "relaxed";
  intent: IntentResult;
  cache: "hit" | "build" | "miss";
};

export async function retrieveAndPlan(opts: {
  message: string;
  mode: string;
  lang: string;
  getEmbedder?: any;
  classifyIntent?: any;
  cacheHits?: any;
}): Promise<{ results: RetrievalResult[]; plan: Plan; retrievalMs: number; strategy: "primary" | "relaxed"; intent: IntentResult; cache: "hit" | "build" | "miss" }> {
  const { message, mode, lang } = opts;
  const { chunks, embeddings } = loadIndex();
  const centroids = loadCentroids();

  const getEmbedder = async () =>
    opts.getEmbedder ? opts.getEmbedder() : (await import("./index")).getEmbedder();

  const intent: IntentResult = opts.classifyIntent
    ? await Promise.resolve(opts.classifyIntent(message))
    : await classifyMessage({
        message,
        embedder: async (t) => (await getEmbedder())(t),
        centroids,
      });

  const cache: Map<string, { results: RetrievalResult[]; retrievalMs: number; strategy?: "primary" | "relaxed" }> =
    opts.cacheHits ?? new Map();

  const cacheKey = `${message.trim().toLowerCase()}:${mode}`;
  let results: RetrievalResult[];
  let retrievalMs: number;
  let strategy: "primary" | "relaxed" = "primary";
  let cacheStatus: "hit" | "build" | "miss";

  const compute = async (): Promise<RetrievalResult[]> => {
    const embedder = await getEmbedder();
    const queryVec = await embedder(message);
    const tokens = rewriteQuery(message, intent.primary);
    const primary = retrieveTopK(queryVec, tokens, chunks, {
      k: RETRIEVE_K,
      minScore: PRIMARY_MIN_SCORE,
      mode: mode as CopilotMode,
      intent: intent.primary,
      embeddings,
    });
    const top = primary[0]?.score ?? 0;
    if (primary.length > 0 && top >= RELAX_CONFIDENCE_THRESHOLD) return primary;
    strategy = "relaxed";
    return retrieveTopK(queryVec, tokens, chunks, {
      k: RELAXED_K,
      minScore: RELAXED_MIN_SCORE,
      mode: mode as CopilotMode,
      intent: intent.primary,
      embeddings,
    });
  };

  const retrievalStart = Date.now();
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    results = entry.results;
    retrievalMs = entry.retrievalMs;
    strategy = entry.strategy ?? "primary";
    cacheStatus = "hit";
  } else {
    results = await compute();
    retrievalMs = Date.now() - retrievalStart;
    cacheStatus = cache.size === 0 ? "build" : "miss";
    cache.set(cacheKey, { results, retrievalMs, strategy });
  }

  // Language-aware filtering: prefer chunks whose text language matches the query
  const chunkTextById = new Map(chunks.map((c) => [c.id, c.text]));
  const isArText = (t: string) => /[\u0600-\u06FF]/.test(t);
  const matching = results.filter((r) => {
    const t = chunkTextById.get(r.id) ?? "";
    return lang === "ar" ? isArText(t) : !isArText(t);
  });
  if (matching.length >= 2) results = matching;

  const plan = buildPlan({ intent, results });

  return { results, plan, retrievalMs, strategy, intent, cache: cacheStatus };
}
