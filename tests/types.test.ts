import { test } from "node:test";
import assert from "node:assert/strict";
import type {
  CopilotEvent,
  CopilotMode,
  RetrievalResult,
  RequestBody,
} from "../lib/copilot/types";

const modes: CopilotMode[] = ["general", "recruiter", "interview", "architecture", "explore"];

test("modes are the five approved values", () => {
  assert.deepEqual(modes.sort(), ["architecture", "explore", "general", "interview", "recruiter"]);
});

test("a RetrievalResult carries decomposed parts and reasons", () => {
  const r: RetrievalResult = {
    id: "chunk-restai-1",
    title: "RestAI — study",
    source: { kind: "project", slug: "restai" },
    score: 0.81,
    parts: { cosine: 0.81, keyword: 0.4, boost: 0.1 },
    reasons: ["cosine 0.81", "keyword 'restai'"],
  };
  assert.equal(r.parts.cosine, 0.81);
  assert.ok(r.reasons.length >= 1);
});

test("every CopilotEvent literal satisfies the union discriminator", () => {
  const events: CopilotEvent[] = [
    { type: "meta", id: "req-1", mode: "general", model: "llama-3.3-70b-versatile", startedAt: 1 },
    { type: "delta", text: "hi" },
    { type: "sources", sources: [] },
    { type: "card", card: { kind: "project", slug: "restai", title: "RestAI" } },
    { type: "stats", tokens: { in: 10, out: 5 }, retrievalMs: 12, totalMs: 50, cache: "miss" },
    { type: "done", finish: "stop" },
    { type: "error", code: 429, message: "rate limited" },
  ];
  for (const e of events) assert.ok("type" in e);
});

test("RequestBody shape matches the wire contract", () => {
  const body: RequestBody = { message: "What did you build?", mode: "recruiter", history: [] };
  assert.equal(body.message.length > 0, true);
});