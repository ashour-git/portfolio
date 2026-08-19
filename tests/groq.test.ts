import { test } from "node:test";
import assert from "node:assert/strict";
import { streamGroq, listGroqModels, GroqError, pickModel } from "../lib/copilot/groq";

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

test("classifies 404 as model_unavailable with the provider request id", async () => {
  const bad = (async () => ({
    ok: false,
    status: 404,
    text: async () => JSON.stringify({ error: { message: "model does not exist or you do not have access to it", code: "model_not_found" } }),
    headers: new Headers({ "x-request-id": "req-abc" }),
  })) as unknown as typeof fetch;
  try {
    for await (const _ of streamGroq({ apiKey: "k", model: "gone", messages: [], fetchImpl: bad })) {
      // consume
    }
    assert.fail("expected rejection");
  } catch (err) {
    assert.ok(err instanceof GroqError);
    assert.equal(err.kind, "model_unavailable");
    assert.equal(err.status, 404);
    assert.equal(err.requestId, "req-abc");
    assert.match(err.message, /model does not exist/);
    assert.ok(!err.message.includes("{"), "no raw JSON in the surfaced message");
  }
});

test("classifies 401 as an auth/config error", async () => {
  const bad = (async () => ({
    ok: false,
    status: 401,
    text: async () => "invalid api key",
  })) as unknown as typeof fetch;
  try {
    for await (const _ of streamGroq({ apiKey: "bad", model: "m", messages: [], fetchImpl: bad })) {
      // consume
    }
    assert.fail("expected rejection");
  } catch (err) {
    assert.ok(err instanceof GroqError);
    assert.equal(err.kind, "auth");
  }
});

test("listGroqModels parses the model ids and request id", async () => {
  const f = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: [{ id: "llama-3.3-70b-versatile" }, { id: "llama-3.1-8b-instant" }] }),
    headers: new Headers({ "x-request-id": "req-xyz" }),
  })) as unknown as typeof fetch;
  const { ids, requestId } = await listGroqModels({ apiKey: "k", fetchImpl: f });
  assert.deepEqual(ids, ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]);
  assert.equal(requestId, "req-xyz");
});

test("listGroqModels throws a typed GroqError on failure", async () => {
  const f = (async () => ({
    ok: false,
    status: 401,
    text: async () => "bad key",
  })) as unknown as typeof fetch;
  await assert.rejects(() => listGroqModels({ apiKey: "bad", fetchImpl: f }), (err: unknown) => {
    assert.ok(err instanceof GroqError);
    assert.equal(err.kind, "auth");
    return true;
  });
});

test("pickModel prefers the configured model when the key has access", () => {
  assert.equal(pickModel("llama-3.3-70b-versatile", ["llama-3.3-70b-versatile", "whisper-large-v3"]), "llama-3.3-70b-versatile");
  assert.equal(pickModel("custom-model", ["custom-model"]), "custom-model");
});

test("pickModel falls back to a known chat model when the configured one is absent", () => {
  assert.equal(pickModel("llama-3.3-70b-versatile", ["llama-3.1-8b-instant", "whisper-large-v3"]), "llama-3.1-8b-instant");
  assert.equal(pickModel("gone-model", ["llama3-70b-8192", "mixtral-8x7b-32768"]), "llama3-70b-8192");
});

test("pickModel picks a deterministic chat model from an unknown set", () => {
  assert.equal(pickModel("gone", ["deepseek-r1-distill-qwen-32b", "whisper-large-v3"]), "deepseek-r1-distill-qwen-32b");
});

test("pickModel returns null when the key has no chat model at all", () => {
  assert.equal(pickModel("llama-3.3-70b-versatile", ["whisper-large-v3", "whisper-large-v3-turbo"]), null);
  assert.equal(pickModel("anything", []), null);
});