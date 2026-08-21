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
import { streamGroq, listGroqModels, GroqError, pickModel, KNOWN_CHAT_FALLBACKS } from "@/lib/copilot/groq";
import { ThinkingTagFilter } from "@/lib/copilot/narration";
import { RateLimiter } from "@/lib/copilot/rate-limit";
import type { ErrorKind } from "@/lib/copilot/types";

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";
/** Configurable via GROQ_MODEL — never hardcode the model across the app. */
export const MODEL = process.env.GROQ_MODEL || DEFAULT_MODEL;

const MODEL_CHECK_TTL = 5 * 60_000;
let modelCheckCache: { at: number; ok: boolean; detail?: string; model?: string; available: string[] } = {
  at: 0,
  ok: true,
  available: [],
};

/** Test seam — clears the module-level model-resolution cache between cases. */
export function __resetModelCache(): void {
  modelCheckCache = { at: 0, ok: true, available: [] };
}
export const MAX_MESSAGE = 600;
export const MAX_HISTORY = 6;
export const RETRIEVE_K = 5;
export const RELAXED_K = RETRIEVE_K + 2;
export const PRIMARY_MIN_SCORE = 0.25;
export const RELAXED_MIN_SCORE = 0.12;
export const RELAX_CONFIDENCE_THRESHOLD = 0.35;

function dedupeRepeatedPhrase(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  // "why I hire u why I hire u ..." → keep one occurrence
  const m = t.match(/^(.{6,}?)(?:\s+\1){2,}\s*$/i);
  if (m) return m[1].trim();
  // also handle without strict repetition: split and check if 3+ identical segments
  const words = t.split(" ");
  if (words.length >= 12) {
    const segLen = Math.floor(words.length / 3);
    if (segLen >= 3) {
      const a = words.slice(0, segLen).join(" ");
      const b = words.slice(segLen, segLen * 2).join(" ");
      const c = words.slice(segLen * 2, segLen * 3).join(" ");
      if (a.toLowerCase() === b.toLowerCase() && b.toLowerCase() === c.toLowerCase()) return a;
    }
  }
  return text;
}

export function validateInput(body: unknown): { ok: true; data: RequestBody } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid body" };
  const b = body as Partial<RequestBody>;
  if (typeof b.message !== "string" || b.message.trim().length === 0) return { ok: false, error: "message is required" };
  const deduped = dedupeRepeatedPhrase(b.message);
  if (deduped.length > MAX_MESSAGE) return { ok: false, error: "message too long" };
  if (b.mode !== undefined && !["general", "recruiter", "interview", "architecture", "explore"].includes(b.mode))
    return { ok: false, error: "unknown mode" };
  if (b.history !== undefined && (!Array.isArray(b.history) || b.history.length > MAX_HISTORY))
    return { ok: false, error: "history too long" };
  return { ok: true, data: { message: deduped, mode: b.mode, history: b.history } };
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
  listModels?: (o: { apiKey: string; fetchImpl?: typeof fetch }) => Promise<{ ids: string[] }>;
  getEmbedder?: () => Promise<(t: string) => Promise<Float32Array>>;
  classifyIntent?: (message: string) => IntentResult | Promise<IntentResult>;
  cacheHits?: Map<string, CacheEntry>;
};

/**
 * Returns the ordered list of models to attempt streaming with. /v1/models
 * under-reports chat access for some keys — a model can stream even when absent
 * from the list — so the list is used only to PICK candidates, never to deny.
 *
 * Order: configured model first (it usually works), then the best chat model the
 * key lists, then known broadly-served chat models. Each candidate is tried in
 * turn; the first stream that does not 404 wins. The outcome is cached so the
 * /models call happens at most once per instance.
 */
async function resolveModelCandidates(input: {
  apiKey: string;
  configured: string;
  fetchImpl?: typeof fetch;
  listModels?: (o: { apiKey: string; fetchImpl?: typeof fetch }) => Promise<{ ids: string[] }>;
}): Promise<string[]> {
  const configured = input.configured;
  const knowns = KNOWN_CHAT_FALLBACKS.filter((k) => k !== configured);

  // An injected test transport speaks only the chat contract — skip the list
  // unless the test injects a list seam too.
  if (input.fetchImpl && !input.listModels) return [configured, ...knowns];

  try {
    const { ids } = await (input.listModels ?? listGroqModels)({
      apiKey: input.apiKey,
      fetchImpl: input.fetchImpl,
    });
    const pick = pickModel(configured, ids);
    const fromList = pick && pick !== configured ? [pick] : [];
    return [...new Set([configured, ...fromList, ...knowns])];
  } catch {
    // list unavailable — rely on the configured model then known chat models
    return [configured, ...knowns];
  }
}

function toErrorKind(kind: GroqError["kind"]): ErrorKind {
  if (kind === "auth") return "config";
  if (kind === "model_unavailable") return "model_unavailable";
  if (kind === "rate_limited") return "rate_limited";
  if (kind === "network") return "network";
  return "unknown";
}

function isAbort(signal?: AbortSignal): boolean {
  return !!signal?.aborted;
}

export async function* runCopilot(body: RequestBody, deps: RunDeps = {}): AsyncGenerator<CopilotEvent> {
  const startedAt = Date.now();
  const apiKey = deps.apiKey ?? process.env.GROQ_API_KEY;
  const model = deps.model ?? MODEL;
  const mode: CopilotMode = body.mode ?? "general";
  const lang = detectLanguage(body.message);
  const conv = classifyConversation(body.message);
  const id = `req-${startedAt}-${Math.random().toString(36).slice(2, 8)}`;
  const limiter = deps.limiter ?? new RateLimiter({ limitPerMinute: 10, limitPerHour: 60 });
  const ip = deps.ip ?? "local";
  const cache = deps.cacheHits ?? new Map<string, CacheEntry>();

  const allowed = limiter.check(ip);
  if (!allowed.ok) {
    yield { type: "error", code: 429, kind: "rate_limited", message: `Rate limited. Retry in ${allowed.retryAfterSec}s.` };
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
    yield {
      type: "error",
      code: 500,
      kind: "config",
      message: "Copilot is not configured (missing GROQ_API_KEY).",
    };
    return;
  }

  // Decide which models to attempt BEFORE any retrieval work, so a key without
  // the configured model falls back to a served chat model instead of failing
  // every request. Only a key whose streams all fail with 404 is denied.
  const now = Date.now();
  let candidates: string[];
  if (now - modelCheckCache.at < MODEL_CHECK_TTL) {
    if (!modelCheckCache.ok) {
      yield {
        type: "error",
        code: 503,
        kind: "model_unavailable",
        message: modelCheckCache.detail ?? "No usable chat model for this Groq key.",
        provider: "groq",
        model,
        requestId: id,
      };
      return;
    }
    candidates = [modelCheckCache.model ?? model];
  } else {
    candidates = await resolveModelCandidates({
      apiKey,
      configured: model,
      fetchImpl: deps.fetchImpl,
      listModels: deps.listModels,
    });
  }
  const primaryModel = candidates[0];

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

  // Language-aware filtering: prefer chunks whose text language matches the query
  // Prevents EN answers from grounding in AR chunks and vice versa (fixes mixed chips).
  // We keep the highest-scoring chunks per language, falling back if not enough.
  const chunkTextById = new Map(chunks.map((c) => [c.id, c.text]));
  const isArText = (t: string) => /[\u0600-\u06FF]/.test(t);
  const matching = results.filter((r) => {
    const t = chunkTextById.get(r.id) ?? "";
    return lang === "ar" ? isArText(t) : !isArText(t);
  });
  // Use matching if we have at least 2, otherwise keep original (avoids empty context)
  if (matching.length >= 2) results = matching;

  const plan = buildPlan({ intent, results });

  yield { type: "meta", id, mode, model: primaryModel, startedAt, lang };
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

  let activeModel: string | null = null;
  let lastModelErr: GroqError | null = null;
  for (const candidate of candidates) {
    const tagFilter = new ThinkingTagFilter();
    try {
      for await (const ev of streamGroq({ apiKey, model: candidate, messages, signal: deps.signal, fetchImpl: deps.fetchImpl })) {
        if (ev.delta) {
          for (const out of tagFilter.push(ev.delta)) {
            yield { type: "delta", text: out };
          }
        }
        if (ev.finish) finish = ev.finish;
        if (ev.usage) {
          tokensIn = ev.usage.prompt_tokens;
          tokensOut = ev.usage.completion_tokens;
        }
      }
      for (const out of tagFilter.flush()) {
        yield { type: "delta", text: out };
      }
    } catch (err) {
      if (isAbort(deps.signal)) return;
      if (err instanceof GroqError) {
        // A 404 means this key cannot use this model — try the next candidate.
        // A 400 "reduce the length of the messages or completion" is the
        // signature of a non-chat model (e.g. llama-prompt-guard) whose max
        // output tokens are tiny — treat it as unusable too.
        const unusable =
          err.kind === "model_unavailable" ||
          (err.status === 400 && /reduce the length of the messages or completion/i.test(err.message));
        if (unusable) {
          lastModelErr = err;
          continue;
        }
        yield {
          type: "error",
          code: err.kind === "rate_limited" ? 429 : 502,
          kind: toErrorKind(err.kind),
          message:
            err.kind === "rate_limited"
              ? "The model provider is rate-limited right now. Wait a few seconds and try again."
              : err.message,
          requestId: err.requestId,
          provider: "groq",
          model: candidate,
        };
        return;
      }
      if (err instanceof DOMException && err.name === "AbortError") return;
      yield {
        type: "error",
        code: 502,
        kind: "network",
        message: "Network error reaching the model provider.",
        provider: "groq",
        model: candidate,
      };
      return;
    }
    // The generator completed without throwing — this model answered.
    activeModel = candidate;
    break;
  }

  if (!activeModel) {
    // Every candidate streamed a model-unavailable-class failure — the key has
    // no usable chat model. Cache the denial so repeats fail fast.
    const denyDetail = lastModelErr
      ? `No chat model available to this Groq project can answer (last: ${lastModelErr.message}). Set GROQ_MODEL to a model this key can use.`
      : "No chat model available to this Groq project.";
    modelCheckCache = { at: Date.now(), ok: false, detail: denyDetail, available: [] };
    yield {
      type: "error",
      code: 503,
      kind: "model_unavailable",
      message: denyDetail,
      provider: "groq",
      model: candidates[0],
      requestId: lastModelErr?.requestId ?? id,
    };
    return;
  }
  modelCheckCache = { at: Date.now(), ok: true, model: activeModel, available: [] };

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
