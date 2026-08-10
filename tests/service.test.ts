import { test } from "node:test";
import assert from "node:assert/strict";
import { runCopilot, validateInput } from "../lib/copilot/service";
import type { RequestBody, RetrievalResult } from "../lib/copilot/types";
import { loadIndex } from "../lib/copilot/index";

function fakeGroq(parts: string[]): typeof fetch {
  return (async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        for (const p of parts) c.enqueue(encoder.encode(p));
        c.close();
      },
    });
    return { ok: true, status: 200, body } as unknown as Response;
  }) as typeof fetch;
}

const fastEmbed = async () => loadIndex().embeddings["project-restai"];

test("validateInput enforces message cap", () => {
  assert.equal(validateInput({ message: "x".repeat(601) }).ok, false);
  assert.equal(validateInput({ message: "ok" }).ok, true);
  assert.equal(validateInput({ message: 123 }).ok, false);
});

test("regression probe: 'Why should I hire you?' is grounded and planned", async () => {
  const events: any[] = [];
  for await (const ev of runCopilot(
    { message: "Why should I hire you?", mode: "general", history: [] },
    { apiKey: "k", model: "m", fetchImpl: fakeGroq(["data: [DONE]\n\n"]), getEmbedder: async () => fastEmbed },
  )) {
    events.push(ev);
  }
  const sources = events.find((e) => e.type === "sources");
  assert.ok(sources.sources.length >= 1, "must not regress to zero sources");
  assert.ok(sources.sources[0].reasons.length >= 1);
  const plan = events.find((e) => e.type === "plan");
  assert.equal(plan.plan.template, "recruiter");
  assert.equal(plan.plan.stance, "high");
  assert.equal(plan.plan.card, "resume");
  const stats = events.find((e) => e.type === "stats");
  assert.equal(stats.intent, "recruiter");
});

test("runCopilot emits canonical meta → plan → sources → card → delta → stats → done", async () => {
  const events: string[] = [];
  const fetchImpl = fakeGroq([
    "data: {\"choices\":[{\"delta\":{\"content\":\"Yes.\"}}]}\n\n",
    "data: {\"choices\":[{\"delta\":{}}],\"usage\":{\"prompt_tokens\":9,\"completion_tokens\":2}}\n\n",
    "data: [DONE]\n\n",
  ]);
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number; strategy: "primary" | "relaxed" }>();

  for await (const ev of runCopilot(
    { message: "Interview me about RestAI", mode: "architecture", history: [] },
    { apiKey: "k", model: "llama-3.3-70b-versatile", fetchImpl, getEmbedder: async () => fastEmbed, cacheHits },
  )) {
    events.push(ev.type);
    if (ev.type === "delta") assert.equal(ev.text, "Yes.");
    if (ev.type === "stats") {
      assert.equal(ev.tokens.in, 9);
      assert.equal(ev.tokens.out, 2);
      assert.ok(typeof ev.intent === "string");
      assert.ok(typeof ev.confidence === "number");
      assert.ok(["primary", "relaxed"].includes(ev.strategy));
    }
  }
  assert.deepEqual(events, ["meta", "plan", "sources", "card", "delta", "stats", "done"]);
});

test("rate limit produces an error event and closes", async () => {
  const events: string[] = [];
  let t = 0;
  for await (const ev of runCopilot(
    { message: "hi" },
    {
      apiKey: "k",
      model: "m",
      limiter: new (await import("../lib/copilot/rate-limit")).RateLimiter({
        limitPerMinute: 0,
        limitPerHour: 0,
        now: () => t,
      }),
      ip: "1.2.3.4",
      getEmbedder: async () => fastEmbed,
    },
  )) {
    events.push(ev.type);
    if (ev.type === "error") assert.equal(ev.code, 429);
  }
  assert.deepEqual(events, ["error"]);
});

test("cache hit skips embedding and strategy is preserved", async () => {
  const events: any[] = [];
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number; strategy: "primary" | "relaxed" }>([
    [
      "what did you build?:architecture",
      {
        results: [
          {
            id: "project-restai",
            label: "RestAI",
            title: "RestAI — Backend & Agentic AI",
            source: { kind: "project", slug: "restai" },
            score: 0.9,
            parts: { cosine: 0.9 },
            reasons: ["cached"],
            breakdown: [{ signal: "cosine", value: 0.9, weight: 0.45 }],
          },
        ],
        retrievalMs: 0,
        strategy: "primary",
      },
    ],
  ]);
  let embedded = 0;
  for await (const ev of runCopilot(
    { message: "What did you build?", mode: "architecture" },
    {
      apiKey: "k",
      model: "m",
      fetchImpl: fakeGroq(["data: [DONE]\n\n"]),
      getEmbedder: async () => {
        embedded++;
        return fastEmbed;
      },
      cacheHits,
    },
  )) {
    events.push(ev);
  }
  assert.equal(embedded, 0);
  assert.equal(events.find((e) => e.type === "stats").cache, "hit");
  assert.equal(events.find((e) => e.type === "stats").strategy, "primary");
  assert.equal(events.find((e) => e.type === "sources").sources[0].id, "project-restai");
});

test("degraded retrieval falls back to the relaxed pass and returns a fallback plan", async () => {
  const events: any[] = [];
  const zeroEmbed = async () => new Float32Array(384);
  for await (const ev of runCopilot(
    { message: "blah blah uninformed", mode: "general" },
    {
      apiKey: "k",
      model: "m",
      fetchImpl: fakeGroq(["data: [DONE]\n\n"]),
      getEmbedder: async () => zeroEmbed,
      classifyIntent: async () => ({ primary: "general", confidence: 0.2 }),
    },
  )) {
    events.push(ev);
  }
  const plan = events.find((e) => e.type === "plan");
  assert.equal(plan.plan.stance, "fallback");
  assert.ok(plan.plan.suggestions.length >= 1);
  const stats = events.find((e) => e.type === "stats");
  assert.equal(stats.strategy, "relaxed");
});
