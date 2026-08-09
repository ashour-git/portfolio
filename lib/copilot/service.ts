import type {
  ChatMessage,
  CopilotEvent,
  CopilotMode,
  RetrievalResult,
  RequestBody,
} from "@/lib/copilot/types";
import { loadIndex } from "@/lib/copilot/index";
import { retrieveTopK } from "@/lib/copilot/scoring";
import { buildMessages } from "@/lib/copilot/prompt";
import { streamGroq } from "@/lib/copilot/groq";
import { RateLimiter } from "@/lib/copilot/rate-limit";

export const MODEL = "llama-3.3-70b-versatile";
export const MAX_MESSAGE = 600;
export const MAX_HISTORY = 6;

export function validateInput(body: unknown):
  | { ok: true; data: RequestBody }
  | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid body" };
  const b = body as Partial<RequestBody>;
  if (typeof b.message !== "string" || b.message.trim().length === 0)
    return { ok: false, error: "message is required" };
  if (b.message.length > MAX_MESSAGE) return { ok: false, error: "message too long" };
  if (b.mode !== undefined && !["general", "recruiter", "interview", "architecture", "explore"].includes(b.mode))
    return { ok: false, error: "unknown mode" };
  if (b.history !== undefined && (!Array.isArray(b.history) || b.history.length > MAX_HISTORY))
    return { ok: false, error: "history too long" };
  return { ok: true, data: { message: b.message, mode: b.mode, history: b.history } };
}

export type RunDeps = {
  apiKey?: string;
  model?: string;
  now?: () => number;
  limiter?: RateLimiter;
  ip?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  getEmbedder?: () => Promise<(t: string) => Promise<Float32Array>>;
  cacheHits?: Map<string, { results: RetrievalResult[]; retrievalMs: number }>;
};

function tokenize(q: string): string[] {
  return q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
}

export async function* runCopilot(
  body: RequestBody,
  deps: RunDeps = {},
): AsyncGenerator<CopilotEvent> {
  const startedAt = Date.now();
  const apiKey = deps.apiKey ?? process.env.GROQ_API_KEY;
  const model = deps.model ?? MODEL;
  const mode: CopilotMode = body.mode ?? "general";
  const id = `req-${startedAt}-${Math.random().toString(36).slice(2, 8)}`;
  const limiter = deps.limiter ?? new RateLimiter({ limitPerMinute: 5, limitPerHour: 30 });
  const ip = deps.ip ?? "local";
  const cache = deps.cacheHits ?? new Map<string, { results: RetrievalResult[]; retrievalMs: number }>();

  if (!apiKey) {
    yield { type: "error", code: 500, message: "Copilot is not configured (missing GROQ_API_KEY)." };
    return;
  }

  const allowed = limiter.check(ip);
  if (!allowed.ok) {
    yield { type: "error", code: 429, message: `Rate limited. Retry in ${allowed.retryAfterSec}s.` };
    return;
  }

  const { chunks, embeddings } = loadIndex();

  const cacheKey = `${body.message.trim().toLowerCase()}:${mode}`;
  let results: RetrievalResult[];
  let cacheStatus: "hit" | "build" | "miss";
  let retrievalMs: number;

  const compute = async (): Promise<RetrievalResult[]> => {
    const embedder = deps.getEmbedder
      ? await deps.getEmbedder()
      : await (await import("@/lib/copilot/index")).getEmbedder();
    const vec = await embedder(body.message);
    return retrieveTopK(vec, tokenize(body.message), chunks, { k: 5, minScore: 0.25, mode, embeddings });
  };

  const retrievalStart = Date.now();
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    results = entry.results;
    retrievalMs = entry.retrievalMs;
    cacheStatus = "hit";
  } else {
    results = await compute();
    retrievalMs = Date.now() - retrievalStart;
    cacheStatus = cache.size === 0 ? "build" : "miss";
    cache.set(cacheKey, { results, retrievalMs });
  }

  const metaEvent: CopilotEvent = { type: "meta", id, mode, model, startedAt };
  yield metaEvent;

  const sourcesEvent: CopilotEvent = { type: "sources", sources: results };
  yield sourcesEvent;

  const project = results.find((r) => r.source.kind === "project");
  const cardEvent: CopilotEvent = {
    type: "card",
    card: project
      ? { kind: "project", slug: project.source.slug!, title: project.title }
      : { kind: "resume", title: "Resume summary" },
  };
  yield cardEvent;

  const textById = new Map(chunks.map((c) => [c.id, c.text]));
  const contextResults = results.map((r) => ({ ...r, text: textById.get(r.id) ?? "" }));
  const history: ChatMessage[] = (body.history ?? []).map((h) => ({ role: h.role, content: h.content }));
  const messages = buildMessages({ message: body.message, mode, history, results: contextResults });

  let tokensIn = 0;
  let tokensOut = 0;
  let finish: "stop" | "length" = "stop";

  try {
    for await (const ev of streamGroq({
      apiKey,
      model,
      messages,
      signal: deps.signal,
      fetchImpl: deps.fetchImpl,
    })) {
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
  yield { type: "stats", tokens: { in: tokensIn, out: tokensOut }, retrievalMs, totalMs, cache: cacheStatus, intent: "general", confidence: 0, strategy: "primary" };
  yield { type: "done", finish };
}