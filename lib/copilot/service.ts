import type {
  ChatMessage,
  CopilotEvent,
  CopilotMode,
  Intent,
  IntentResult,
  RetrievalResult,
  RequestBody,
} from "@/lib/copilot/types";
import { loadIndex, loadCentroids } from "@/lib/copilot/index";
import { retrieveTopK } from "@/lib/copilot/scoring";
import { classifyMessage } from "@/lib/copilot/intent";
import { detectLanguage } from "@/lib/copilot/language";
import { classifyConversation, casualReply } from "@/lib/copilot/conversation";
import { rewriteQuery } from "@/lib/copilot/rewrite";
import { buildPlan } from "@/lib/copilot/planner";
import { buildMessages } from "@/lib/copilot/prompt";
import { streamGroq } from "@/lib/copilot/groq";
import { RateLimiter } from "@/lib/copilot/rate-limit";

export const MODEL = "llama-3.3-70b-versatile";
export const MAX_MESSAGE = 600;
export const MAX_HISTORY = 6;
export const RETRIEVE_K = 5;
export const RELAXED_K = RETRIEVE_K + 2;
export const PRIMARY_MIN_SCORE = 0.25;
export const RELAXED_MIN_SCORE = 0.12;
export const RELAX_CONFIDENCE_THRESHOLD = 0.35;

export function validateInput(body: unknown): { ok: true; data: RequestBody } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid body" };
  const b = body as Partial<RequestBody>;
  if (typeof b.message !== "string" || b.message.trim().length === 0) return { ok: false, error: "message is required" };
  if (b.message.length > MAX_MESSAGE) return { ok: false, error: "message too long" };
  if (b.mode !== undefined && !["general", "recruiter", "interview", "architecture", "explore"].includes(b.mode))
    return { ok: false, error: "unknown mode" };
  if (b.history !== undefined && (!Array.isArray(b.history) || b.history.length > MAX_HISTORY))
    return { ok: false, error: "history too long" };
  return { ok: true, data: { message: b.message, mode: b.mode, history: b.history } };
}

export type CacheEntry = { results: RetrievalResult[]; retrievalMs: number; strategy?: "primary" | "relaxed" };

export type RunDeps = {
  apiKey?: string;
  model?: string;
  now?: () => number;
  limiter?: RateLimiter;
  ip?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  getEmbedder?: () => Promise<(t: string) => Promise<Float32Array>>;
  classifyIntent?: (message: string) => IntentResult | Promise<IntentResult>;
  cacheHits?: Map<string, CacheEntry>;
};

export async function* runCopilot(body: RequestBody, deps: RunDeps = {}): AsyncGenerator<CopilotEvent> {
  const startedAt = Date.now();
  const apiKey = deps.apiKey ?? process.env.GROQ_API_KEY;
  const model = deps.model ?? MODEL;
  const mode: CopilotMode = body.mode ?? "general";
  const lang = detectLanguage(body.message);
  const conv = classifyConversation(body.message);
  const id = `req-${startedAt}-${Math.random().toString(36).slice(2, 8)}`;
  const limiter = deps.limiter ?? new RateLimiter({ limitPerMinute: 5, limitPerHour: 30 });
  const ip = deps.ip ?? "local";
  const cache = deps.cacheHits ?? new Map<string, CacheEntry>();

  const allowed = limiter.check(ip);
  if (!allowed.ok) {
    yield { type: "error", code: 429, message: `Rate limited. Retry in ${allowed.retryAfterSec}s.` };
    return;
  }

  // Casual conversation is answered deterministically and NEVER enters the RAG
  // pipeline — no retrieval, no grounding, no knowledge-base language.
  if (conv.casual) {
    yield { type: "meta", id, mode, model, startedAt, lang };
    yield { type: "plan", plan: { template: "casual", stance: "high", card: "none" } };
    yield { type: "card", card: null };
    yield { type: "delta", text: casualReply(conv.subtype, lang) };
    yield {
      type: "stats",
      tokens: { in: 0, out: 0 },
      retrievalMs: 0,
      totalMs: Date.now() - startedAt,
      cache: "miss",
      intent: "casual",
      confidence: 1,
      strategy: "primary",
    };
    yield { type: "done", finish: "stop" };
    return;
  }

  if (!apiKey) {
    yield { type: "error", code: 500, message: "Copilot is not configured (missing GROQ_API_KEY)." };
    return;
  }

  const { chunks, embeddings } = loadIndex();

  const getEmbedder = async () =>
    deps.getEmbedder ? deps.getEmbedder() : (await import("@/lib/copilot/index")).getEmbedder();

  const intent: IntentResult = deps.classifyIntent
    ? await Promise.resolve(deps.classifyIntent(body.message))
    : /* deterministic, no extra LLM hop */
      await classifyMessage({
        message: body.message,
        embedder: async (t) => (await getEmbedder())(t),
        centroids: loadCentroids(),
      });

  const cacheKey = `${body.message.trim().toLowerCase()}:${mode}`;
  let results: RetrievalResult[];
  let cacheStatus: "hit" | "build" | "miss";
  let retrievalMs: number;
  let strategy: "primary" | "relaxed" = "primary";

  const compute = async (): Promise<RetrievalResult[]> => {
    const embedder = await getEmbedder();
    const queryVec = await embedder(body.message); // original query only
    const tokens = rewriteQuery(body.message, intent.primary);
    const primary = retrieveTopK(queryVec, tokens, chunks, {
      k: RETRIEVE_K,
      minScore: PRIMARY_MIN_SCORE,
      mode,
      intent: intent.primary,
      embeddings,
    });
    const top = primary[0]?.score ?? 0;
    if (primary.length > 0 && top >= RELAX_CONFIDENCE_THRESHOLD) return primary;
    strategy = "relaxed";
    return retrieveTopK(queryVec, tokens, chunks, {
      k: RELAXED_K,
      minScore: RELAXED_MIN_SCORE,
      mode,
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

  const plan = buildPlan({ intent, results });

  yield { type: "meta", id, mode, model, startedAt, lang };
  yield { type: "plan", plan };

  const sourcesEvent: CopilotEvent = { type: "sources", sources: results };
  yield sourcesEvent;

  const project = results.find((r) => r.source.kind === "project");
  const cardEvent: CopilotEvent = {
    type: "card",
    card:
      plan.card === "project" && project
        ? { kind: "project", slug: project.source.slug!, title: project.title }
        : plan.card === "resume"
          ? { kind: "resume", title: "Resume summary" }
          : null,
  };
  yield cardEvent;

  const textById = new Map(chunks.map((c) => [c.id, c.text]));
  const contextResults = results.map((r) => ({ ...r, text: textById.get(r.id) ?? "" }));
  const history: ChatMessage[] = (body.history ?? []).map((h) => ({ role: h.role, content: h.content }));
  const messages = buildMessages({ message: body.message, mode, history, results: contextResults, plan, lang });

  let tokensIn = 0;
  let tokensOut = 0;
  let finish: "stop" | "length" = "stop";

  try {
    for await (const ev of streamGroq({ apiKey, model, messages, signal: deps.signal, fetchImpl: deps.fetchImpl })) {
      if (ev.delta) yield { type: "delta", text: ev.delta };
      if (ev.finish) finish = ev.finish;
      if (ev.usage) {
        tokensIn = ev.usage.prompt_tokens;
        tokensOut = ev.usage.completion_tokens;
      }
    }
  } catch (err) {
    yield { type: "error", code: 502, message: err instanceof Error ? err.message : "upstream error" };
    return;
  }

  const totalMs = Date.now() - startedAt;
  yield {
    type: "stats",
    tokens: { in: tokensIn, out: tokensOut },
    retrievalMs,
    totalMs,
    cache: cacheStatus,
    intent: intent.primary,
    confidence: intent.confidence,
    strategy,
  };
  yield { type: "done", finish };
}
