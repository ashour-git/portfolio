import type { ChatMessage } from "@/lib/copilot/types";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
/** Output budget per reply. Kept modest because free Groq tiers bill tokens per
 *  minute (input + max output); 8192 pushes a typical request over an 8000-TPM
 *  tier. The reasoning strip + final-answer directive keep real answers short. */
const MAX_OUTPUT_TOKENS = 1800;

/** Free tiers count the requested completion budget against an 8K TPM cap,
 *  so it is sized to real answers (~600-900 tokens, Arabic included) plus a
 *  little reasoning headroom; 4096 allowed ~1 request/minute per model. */
export function modelParams(model: string): Record<string, string> {
  // gpt-oss reasons into a separate `reasoning` field (ignored by the parser
  // below) but those tokens still spend the completion budget — keep it low.
  if (/gpt-oss/.test(model)) return { reasoning_effort: "low" };
  // Qwen 3.x can reason inline in <think> tags; the answer never needs it.
  if (/qwen3/.test(model)) return { reasoning_effort: "none" };
  return {};
}

export type GroqErrorKind = "auth" | "model_unavailable" | "rate_limited" | "network" | "unknown";

export class GroqError extends Error {
  kind: GroqErrorKind;
  status?: number;
  requestId?: string;

  constructor(message: string, kind: GroqErrorKind, opts: { status?: number; requestId?: string } = {}) {
    super(message);
    this.name = "GroqError";
    this.kind = kind;
    this.status = opts.status;
    this.requestId = opts.requestId;
  }
}

function classifyStatus(status: number): GroqErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "model_unavailable";
  if (status === 429 || status === 413) return "rate_limited";
  if (status >= 500) return "unknown";
  return "unknown";
}

/** Best-effort extraction of the provider's human-readable reason, without raw JSON dumps. */
function reasonFromDetail(detail: string): string {
  if (!detail) return "";
  try {
    const json = JSON.parse(detail) as { error?: { message?: string; code?: string } };
    return json?.error?.message || json?.error?.code || detail.slice(0, 200);
  } catch {
    return detail.replace(/\s+/g, " ").trim().slice(0, 200);
  }
}

/**
 * Queries the Groq Models API for the models available to the configured key.
 * Used to distinguish "model retired / no access" from a transient upstream
 * failure before we ever mark a model unavailable.
 */
export async function listGroqModels(input: {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ids: string[]; requestId?: string }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const res = await fetchImpl(`${input.baseUrl ?? DEFAULT_BASE_URL}/models`, {
    method: "GET",
    headers: { Authorization: `Bearer ${input.apiKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  const requestId = (res.headers as Headers)?.get?.("x-request-id") ?? undefined;
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const reason = reasonFromDetail(detail) || res.statusText;
    throw new GroqError(`Groq models request failed (${res.status}): ${reason}`, classifyStatus(res.status), {
      status: res.status,
      requestId,
    });
  }
  const json = (await res.json()) as { data?: { id: string }[] };
  return { ids: (json.data ?? []).map((m) => m.id), requestId };
}

/**
 * Resolves which model to stream with, given the configured model and the ids
 * the key can list. Different Groq keys/projects are served different model
 * sets (org restrictions, regional routing, model retirement), so a hard-coded
 * default like llama-3.3-70b-versatile may simply not exist for a given key.
 *
 * NOTE: /v1/models under-reports chat access for some keys (a model can stream
 * even when absent from the list), so pickModel is only used to CHOOSE a
 * fallback candidate — never to deny a request. Preference order:
 *   1. the configured model (bare or `meta-llama/`-prefixed)
 *   2. known broadly-served chat models (70b before 8b, latest before older)
 *   3. any remaining chat-capable model id, deterministic pick
 * Returns null when no chat-capable model is listed at all.
 */
export const KNOWN_CHAT_FALLBACKS = [
  // Served on Groq free/dev tiers as of 2026-11 (each has its own TPM bucket).
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  // Enterprise-only since 2026-08-16; kept last for keys that still have it.
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

/** Classifier / audio / embedding ids are listed on /v1/models but cannot serve chat. */
const NON_CHAT_RE = /guard|safeguard|whisper|tts|stt|asr|embedding|rerank/;
const CHAT_FAMILY_RE = /llama|mistral|gemma|qwen|deepseek|gpt-oss/;

export function isChatModelId(id: string): boolean {
  return CHAT_FAMILY_RE.test(id) && !NON_CHAT_RE.test(id);
}

/** True when id is exactly `name` or a namespaced form like `meta-llama/<name>`. */
function idMatches(id: string, name: string): boolean {
  return id === name || id.endsWith(`/${name}`);
}

export function pickModel(configured: string, ids: string[]): string | null {
  if (ids.some((id) => idMatches(id, configured))) return configured;
  for (const candidate of KNOWN_CHAT_FALLBACKS) {
    const match = ids.find((id) => idMatches(id, candidate));
    if (match) return match;
  }
  const chat = ids.filter(isChatModelId).sort();
  return chat.length ? chat[0] : null;
}

export type GroqStreamEvent = {
  delta?: string;
  finish?: "stop" | "length";
  usage?: { prompt_tokens: number; completion_tokens: number };
};

export async function* streamGroq(input: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  baseUrl?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}): AsyncGenerator<GroqStreamEvent> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const res = await fetchImpl(`${input.baseUrl ?? DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: MAX_OUTPUT_TOKENS,
      ...modelParams(input.model),
    }),
    signal: input.signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const reason = reasonFromDetail(detail) || res.statusText;
    const requestId = (res.headers as Headers)?.get?.("x-request-id") ?? undefined;
    throw new GroqError(`Groq error ${res.status}: ${reason}`, classifyStatus(res.status), {
      status: res.status,
      requestId,
    });
  }
  if (!res.body) throw new Error("Groq stream had no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processLine = (line: string): GroqStreamEvent | null => {
    if (!line.startsWith("data:")) return null;
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") return null;
    const json = JSON.parse(payload) as {
      choices?: { delta?: { content?: string }; finish_reason?: string }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const event: GroqStreamEvent = {};
    const choice = json.choices?.[0];
    if (choice?.delta?.content) event.delta = choice.delta.content;
    if (choice?.finish_reason === "stop") event.finish = "stop";
    if (choice?.finish_reason === "length") event.finish = "length";
    if (json.usage) event.usage = json.usage;
    return Object.keys(event).length ? event : null;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf("\n");
    while (nl !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) {
        const event = processLine(line);
        if (event) yield event;
      }
      nl = buffer.indexOf("\n");
    }
  }
  const remaining = buffer.trim();
  if (remaining) {
    const event = processLine(remaining);
    if (event) yield event;
  }
}