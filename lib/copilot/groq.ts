import type { ChatMessage } from "@/lib/copilot/types";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";

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
  if (status === 429) return "rate_limited";
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
 * the key can actually access. Different Groq keys/projects are served
 * different model sets (org restrictions, regional routing, model retirement),
 * so a hard-coded default like llama-3.3-70b-versatile may simply not exist
 * for a given key. Preference order:
 *   1. the configured model, if the key has access
 *   2. known broadly-served chat models (70b before 8b, latest before older)
 *   3. any remaining chat-capable model id, deterministic pick
 * Returns null when the key has no usable chat model at all.
 */
const KNOWN_CHAT_FALLBACKS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "llama-3.2-3b-preview",
];
const CHAT_RE = /llama|mistral|gemma|qwen|deepseek/;

export function pickModel(configured: string, ids: string[]): string | null {
  if (ids.includes(configured)) return configured;
  for (const candidate of KNOWN_CHAT_FALLBACKS) {
    if (ids.includes(candidate)) return candidate;
  }
  const chat = ids.filter((id) => CHAT_RE.test(id));
  if (chat.length) return [...chat].sort()[0];
  return null;
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