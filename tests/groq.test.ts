import { test } from "node:test";
import assert from "node:assert/strict";
import { streamGroq } from "../lib/copilot/groq";

function fakeFetch(chunks: string[]): typeof fetch {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return (async () =>
    ({
      ok: true,
      status: 200,
      body: stream,
    }) as unknown as Response) as typeof fetch;
}

test("streams deltas then final usage", async () => {
  const f = fakeFetch([
    "data: {\"choices\":[{\"delta\":{\"content\":\"Hel\"}}]}\n\n",
    "data: {\"choices\":[{\"delta\":{\"content\":\"lo\"}}]}\n\n",
    "data: {\"choices\":[{\"delta\":{}}],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":2}}\n\n",
    "data: [DONE]\n\n",
  ]);
  const out: string[] = [];
  let usage: { prompt_tokens: number; completion_tokens: number } | undefined;
  for await (const ev of streamGroq({
    apiKey: "k",
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "hi" }],
    fetchImpl: f,
  })) {
    if (ev.delta) out.push(ev.delta);
    if (ev.usage) usage = ev.usage;
  }
  assert.deepEqual(out, ["Hel", "lo"]);
  assert.equal(usage?.prompt_tokens, 10);
});

test("surfaces non-ok responses as errors", async () => {
  const bad = (async () => ({ ok: false, status: 429, text: async () => "rate limited" })) as unknown as typeof fetch;
  await assert.rejects(
    async () => {
      for await (const _ of streamGroq({
        apiKey: "k",
        model: "m",
        messages: [],
        fetchImpl: bad,
      })) {
        // consume
      }
    },
    /rate limited/,
  );
});