import { loadIndex, loadCentroids } from "./index";
import { retrieveTopK } from "./scoring";
import { rewriteQuery } from "./rewrite";
import { classifyMessage } from "./intent";
import { buildPlan } from "./planner";
import { rerank } from "./rerank";
import { getBm25Index, STOPWORDS } from "./bm25";
import { buildRetrievalQuery } from "./memory";
import { safeSlice, selectPassage } from "./passage";
import type { Chunk, CopilotMode, Lang, RetrievalResult, Plan, IntentResult } from "./types";

export const RETRIEVE_K = 5;
export const RELAXED_K = RETRIEVE_K + 2;
export const PRIMARY_MIN_SCORE = 0.25;
export const RELAXED_MIN_SCORE = 0.12;
export const RELAX_CONFIDENCE_THRESHOLD = 0.35;

/**
 * Caps per-chunk text and total budget to stay under TPM. With query tokens,
 * over-long chunks keep their most relevant labeled segments (passage
 * selection) instead of losing Impact/Tradeoffs/Lessons to head truncation.
 */
export function capContext<T extends { text: string }>(
  results: T[],
  budget = 6000,
  perChunk = 1200,
  opts: { queryTokens?: string[] } = {},
): T[] {
  let total = 0;
  const tokens = opts.queryTokens?.length ? opts.queryTokens : undefined;
  return results
    .map((r) => {
      let t =
        r.text.length <= perChunk
          ? r.text
          : tokens
            ? selectPassage(r.text, tokens, { maxChars: perChunk })
            : safeSlice(r.text, perChunk);
      if (total + t.length > budget) t = safeSlice(t, Math.max(0, budget - total));
      total += t.length;
      return { ...r, text: t };
    })
    .filter((r) => r.text.length > 0);
}

/** Map with least-recently-used eviction; a drop-in for the retrieval cache. */
export class LruCache<K, V> extends Map<K, V> {
  constructor(readonly max = 200) {
    super();
  }
  override get(key: K): V | undefined {
    if (!super.has(key)) return undefined;
    const v = super.get(key) as V;
    super.delete(key);
    super.set(key, v);
    return v;
  }
  override set(key: K, value: V): this {
    if (super.has(key)) super.delete(key);
    super.set(key, value);
    while (this.size > this.max) super.delete(super.keys().next().value as K);
    return this;
  }
}

const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Name variants a visitor may type for a project: slug, title head, compact forms. */
function projectNames(c: Chunk): string[] {
  const head = c.title.split(/\s+[—–-]\s+/)[0];
  const slug = c.source.slug ?? "";
  // `slug.replace(/2/g, "to")` covers "text2sql" ↔ "Text-to-SQL".
  const names = [slug, head, c.label, slug.replace(/2/g, "to")].map(normName).filter((n) => n.length >= 4);
  return [...new Set(names)];
}

/**
 * Project chunks whose name appears literally in the message (case- and
 * punctuation-insensitive: "RestAI", "rest ai", "text2sql", "Text-to-SQL").
 * Deterministic; used to bridge Arabic turns to English-only project chunks.
 */
export function namedProjectChunks(message: string, chunks: Chunk[]): Chunk[] {
  const compact = normName(message);
  if (!compact) return [];
  return chunks.filter((c) => c.source.kind === "project" && projectNames(c).some((n) => compact.includes(n)));
}

function chunkToResult(c: Chunk, reason: string): RetrievalResult {
  return {
    id: c.id,
    label: c.label,
    title: c.title,
    source: c.source,
    score: PRIMARY_MIN_SCORE,
    parts: {},
    reasons: [reason],
    breakdown: [],
  };
}

/** Lexical tokens for BM25: literal query words (plus the Arabic bridge), no intent expansions. */
export function bm25QueryTokens(query: string): string[] {
  return [...new Set(rewriteQuery(query, "general"))].filter((t) => !STOPWORDS.has(t));
}

export type RetrieveAndPlanOpts = {
  message: string;
  /** Prior turns; a short follow-up is anchored to the last substantive user turn. */
  history?: unknown;
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
  /** The retrieval query actually used (anchored follow-up and/or Arabizi gloss). */
  query: string;
  expanded: boolean;
  /** Query tokens for passage selection in capContext. */
  queryTokens: string[];
};

export async function retrieveAndPlan(opts: RetrieveAndPlanOpts): Promise<RetrieveAndPlanResult> {
  const { mode, lang } = opts;
  const { query, expanded } = buildRetrievalQuery({ message: opts.message, history: opts.history, lang: lang as Lang });
  const message = query || opts.message;
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
  const queryTokens = rewriteQuery(message, intent.primary);
  let results: RetrievalResult[];
  let retrievalMs: number;
  let strategy: "primary" | "relaxed" = "primary";
  let cacheStatus: "hit" | "build" | "miss";

  const compute = async (): Promise<RetrievalResult[]> => {
    const embedder = await getEmbedder();
    const queryVec = await embedder(message);
    const tokens = queryTokens;
    const lexical = bm25QueryTokens(message);
    const index = getBm25Index(() => chunks.map((c) => ({ id: c.id, title: c.title, slug: c.source.slug, keywords: c.keywords, text: c.text })));
    const bm25 = lexical.length > 0 && index.size > 0 ? (id: string) => index.score(lexical, id) : undefined;
    const primary = retrieveTopK(queryVec, tokens, chunks, {
      k: RETRIEVE_K,
      minScore: PRIMARY_MIN_SCORE,
      mode: mode as CopilotMode,
      intent: intent.primary,
      embeddings,
      bm25,
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
      bm25,
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

  // Arabic bridge for named projects. Project write-ups exist only in English,
  // so the Arabic-only filter above would answer "احكيلي عن RestAI" from the
  // Arabic bio with zero RestAI facts. When an Arabic turn names a project,
  // ground it in that project's chunk (the Arabic prompt still governs the
  // reply language) and keep the Arabic chunks behind it.
  if (lang === "ar") {
    const named = namedProjectChunks(message, chunks);
    if (named.length > 0) {
      const namedIds = new Set(named.map((c) => c.id));
      const byId = new Map(results.map((r) => [r.id, r]));
      const pinned = named.map((c) => byId.get(c.id) ?? chunkToResult(c, "named project (ar bridge)"));
      results = [...pinned, ...results.filter((r) => !namedIds.has(r.id))].slice(0, RELAXED_K);
    }
  }

  // Optional cross-encoder pass. No scorer is configured today (only the
  // MiniLM bi-encoder is vendored), so this is an identity function; it exists
  // as a seam and degrades to cosine order on any failure.
  results = await rerank({
    results,
    query: message,
    textOf: (r) => chunkTextById.get(r.id) ?? "",
  });

  const plan = buildPlan({ intent, results });

  return { results, plan, retrievalMs, strategy, intent, cache: cacheStatus, query: message, expanded, queryTokens };
}
