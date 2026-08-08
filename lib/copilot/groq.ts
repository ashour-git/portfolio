import type { ChatMessage } from "@/lib/copilot/types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqStreamEvent = {
  delta?: string;
  finish?: "stop" | "length";
  usage?: { prompt_tokens: number; completion_tokens: number };
};

export async function* streamGroq(input: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}): AsyncGenerator<GroqStreamEvent> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const res = await fetchImpl(GROQ_URL, {
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
    throw new Error(`Groq error ${res.status}: ${detail || res.statusText}`);
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