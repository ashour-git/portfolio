import { test } from "node:test";
import assert from "node:assert/strict";
import { runCopilot, __resetModelCache, DEFAULT_MODEL } from "../lib/copilot/service";
import { modelParams, pickModel, KNOWN_CHAT_FALLBACKS } from "../lib/copilot/groq";
import { loadIndex } from "../lib/copilot/index";

const fastEmbed = async () => loadIndex().embeddings["project-restai"];

/** Per-model scripted provider: status per model id, 200 streams `answer`. */
function scriptedGroq(statusFor: Record<string, number>, requested: string[], bodies: any[] = []): typeof fetch {
  return (async (_url: string, init?: any) => {
    const body = JSON.parse(init?.body ?? "{}");
    requested.push(body.model);
    bodies.push(body);
    const status = statusFor[body.model] ?? 200;
    if (status !== 200) {
      const message =
        status === 400
          ? `The model \`${body.model}\` has been decommissioned and is no longer supported.`
          : status === 404
            ? `The model \`${body.model}\` does not exist or you do not have access to it.`
            : `Rate limit reached for model \`${body.model}\` on tokens per minute (TPM): Limit 8000`;
      return {
        ok: false,
        status,
        text: async () => JSON.stringify({ error: { message } }),
        headers: { get: () => undefined },
      } as unknown as Response;
    }
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: `answer from ${body.model}` } }] })}\n\n`));
        c.enqueue(enc.encode("data: [DONE]\n\n"));
        c.close();
      },
    });
    return { ok: true, status: 200, body: stream } as unknown as Response;
  }) as typeof fetch;
}

async function collect(model: string, fetchImpl: typeof fetch) {
  const events: any[] = [];
  for await (const ev of runCopilot(
    { message: "Tell me about RestAI", mode: "general", history: [] },
    { apiKey: "k", model, fetchImpl, listModels: async () => ({ ids: [] }), getEmbedder: async () => fastEmbed },
  )) events.push(ev);
  return {
    events,
    text: events.filter((e) => e.type === "delta").map((e) => e.text).join(""),
    error: events.find((e) => e.type === "error"),
  };
}

test("default model is a currently served Groq chat model, not the retired llama-3.3", () => {
  assert.equal(DEFAULT_MODEL, "openai/gpt-oss-120b");
  assert.equal(KNOWN_CHAT_FALLBACKS[0], "openai/gpt-oss-120b");
});

test("a rate-limited model spills over to the next model instead of failing the visitor", async () => {
  __resetModelCache();
  const requested: string[] = [];
  const { text, error } = await collect("openai/gpt-oss-120b", scriptedGroq({ "openai/gpt-oss-120b": 429 }, requested));
  assert.equal(error, undefined);
  assert.equal(requested[0], "openai/gpt-oss-120b");
  assert.equal(text, `answer from ${requested[1]}`);
});

test("every model rate-limited yields one calm, retryable rate_limited error", async () => {
  __resetModelCache();
  const requested: string[] = [];
  const all = Object.fromEntries(KNOWN_CHAT_FALLBACKS.map((m) => [m, 429]));
  const { events, error } = await collect("openai/gpt-oss-120b", scriptedGroq(all, requested));
  assert.equal(error?.kind, "rate_limited");
  assert.equal(error?.code, 429);
  assert.ok(!events.some((e) => e.type === "delta"));
  // A rate limit is transient: the next request must try models again, not be denied.
  const again = await collect("openai/gpt-oss-120b", scriptedGroq({}, []));
  assert.equal(again.error, undefined);
});

test("a decommissioned configured model (400) falls through to a served model", async () => {
  __resetModelCache();
  const requested: string[] = [];
  const { text, error } = await collect(
    "llama-3.3-70b-versatile",
    scriptedGroq({ "llama-3.3-70b-versatile": 400 }, requested),
  );
  assert.equal(error, undefined);
  assert.equal(requested[0], "llama-3.3-70b-versatile");
  assert.equal(text, "answer from openai/gpt-oss-120b");
});

test("after a dead model is skipped once, cached requests go straight to the winner", async () => {
  __resetModelCache();
  await collect("llama-3.3-70b-versatile", scriptedGroq({ "llama-3.3-70b-versatile": 404 }, []));
  const requested: string[] = [];
  await collect("llama-3.3-70b-versatile", scriptedGroq({ "llama-3.3-70b-versatile": 404 }, requested));
  assert.deepEqual(requested, ["openai/gpt-oss-120b"]);
});

test("reasoning models get a low/none reasoning budget; others get no extra params", async () => {
  assert.deepEqual(modelParams("openai/gpt-oss-120b"), { reasoning_effort: "low" });
  assert.deepEqual(modelParams("qwen/qwen3.8-27b"), { reasoning_effort: "none" });
  assert.deepEqual(modelParams("llama-3.3-70b-versatile"), {});
  __resetModelCache();
  const bodies: any[] = [];
  await collect("openai/gpt-oss-120b", scriptedGroq({}, [], bodies));
  assert.equal(bodies[0].reasoning_effort, "low");
  assert.ok(bodies[0].max_tokens <= 2048, "completion budget sized for an 8K TPM tier");
});

test("pickModel recognises gpt-oss and skips safeguard classifiers", () => {
  assert.equal(pickModel("gone", ["openai/gpt-oss-safeguard-20b", "openai/gpt-oss-120b"]), "openai/gpt-oss-120b");
  assert.equal(pickModel("gone", ["openai/gpt-oss-safeguard-20b"]), null);
});
