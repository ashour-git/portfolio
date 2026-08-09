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

const fastEmbed = async (t: string) => loadIndex().embeddings["project-restai"];

test("validateInput enforces message cap", () => {
  assert.equal(validateInput({ message: "x".repeat(601) }).ok, false);
  assert.equal(validateInput({ message: "ok" }).ok, true);
  assert.equal(validateInput({ message: 123 }).ok, false);
});

test("runCopilot emits the canonical event order and streams deltas", async () => {
  const events: string[] = [];
  const fetchImpl = fakeGroq([
    "data: {\"choices\":[{\"delta\":{\"content\":\"Yes.\"}}]}\n\n",
    "data: {\"choices\":[{\"delta\":{}}],\"usage\":{\"prompt_tokens\":9,\"completion_tokens\":2}}\n\n",
    "data: [DONE]\n\n",
  ]);
  const body: RequestBody = { message: "What did you build?", mode: "architecture", history: [] };
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number }>();

  for await (const ev of runCopilot(body, {
    apiKey: "k",
    model: "llama-3.3-70b-versatile",
    fetchImpl,
    getEmbedder: async () => fastEmbed,
    cacheHits,
  })) {
    events.push(ev.type);
    if (ev.type === "delta") assert.equal(ev.text, "Yes.");
    if (ev.type === "sources") {
      assert.ok(ev.sources.length > 0, "sources must be non-empty for a real query");
      assert.ok(ev.sources[0].reasons.length >= 1);
    }
    if (ev.type === "card") assert.ok(ev.card === null || ev.card.kind === "project" || ev.card.kind === "resume");
    if (ev.type === "stats") {
      assert.equal(ev.tokens.in, 9);
      assert.equal(ev.tokens.out, 2);
    }
  }

  assert.deepEqual(events, ["meta", "sources", "card", "delta", "stats", "done"]);
});

test("rate limit produces an error event and closes", async () => {
  const events: string[] = [];
  let t = 0;
  for await (const ev of runCopilot({ message: "hi" }, {
    apiKey: "k",
    model: "m",
    limiter: new (await import("../lib/copilot/rate-limit")).RateLimiter({
      limitPerMinute: 0,
      limitPerHour: 0,
      now: () => t,
    }),
    ip: "1.2.3.4",
    getEmbedder: async () => fastEmbed,
  })) {
    events.push(ev.type);
    if (ev.type === "error") assert.equal(ev.code, 429);
  }
  assert.deepEqual(events, ["error"]);
});

test("cache hit skips embedding and reports cache status", async () => {
  const events: any[] = [];
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number }>([
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
            breakdown: [],
          },
        ],
        retrievalMs: 0,
      },
    ],
  ]);
  let embedded = 0;
  for await (const ev of runCopilot({ message: "What did you build?", mode: "architecture" }, {
    apiKey: "k",
    model: "m",
    fetchImpl: fakeGroq(["data: [DONE]\n\n"]),
    getEmbedder: async () => {
      embedded++;
      return fastEmbed;
    },
    cacheHits,
  })) {
    events.push(ev);
  }
  assert.equal(embedded, 0);
  const stats = events.find((e) => e.type === "stats");
  assert.equal(stats.cache, "hit");
  const sources = events.find((e) => e.type === "sources");
  assert.equal(sources.sources[0].id, "project-restai");
});

test("first computation reports cache build, repeat reports hit", async () => {
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number }>();
  const body: RequestBody = { message: "Explain your RAG", mode: "explore" };
  const deps = {
    apiKey: "k",
    model: "m",
    fetchImpl: fakeGroq(["data: [DONE]\n\n"]),
    getEmbedder: async () => fastEmbed,
    cacheHits,
  };
  const first: any[] = [];
  for await (const ev of runCopilot(body, deps)) first.push(ev);
  assert.equal(first.find((e) => e.type === "stats").cache, "build");
  const second: any[] = [];
  for await (const ev of runCopilot(body, deps)) second.push(ev);
  assert.equal(second.find((e) => e.type === "stats").cache, "hit");
});