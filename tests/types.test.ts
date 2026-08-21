import { test } from "node:test";
import assert from "node:assert/strict";
import type {
  CopilotEvent,
  CopilotMode,
  Intent,
  IntentResult,
  Plan,
  RetrievalResult,
  RequestBody,
} from "../lib/copilot/types";

const modes: CopilotMode[] = ["general", "recruiter", "interview", "architecture", "explore"];

test("modes are the five approved values", () => {
  assert.deepEqual(modes.sort(), ["architecture", "explore", "general", "interview", "recruiter"]);
});

test("v2 RetrievalResult carries label and machine-readable breakdown", () => {
  const r: RetrievalResult = {
    id: "hire",
    title: "Why hire Mohamed",
    label: "Hire",
    source: { kind: "resume" },
    score: 0.81,
    parts: { cosine: 0.81, keyword: 0.4, boost: 0.1 },
    reasons: ["cosine 0.81", "intent: recruiter"],
    breakdown: [
      { signal: "cosine", value: 0.81, weight: 0.4 },
      { signal: "intent", value: 0.2, weight: 0.12 },
    ],
  };
  assert.equal(r.label, "Hire");
  assert.ok(r.breakdown.some((b) => b.signal === "cosine"));
});

test("plan event and enriched stats satisfy the union", () => {
  const ir: IntentResult = { primary: "recruiter", confidence: 0.9 };
  const plan: Plan = { template: "recruiter", stance: "high", card: "resume" };
  const events: CopilotEvent[] = [
    { type: "plan", plan },
    {
      type: "stats",
      tokens: { in: 10, out: 5 },
      retrievalMs: 12,
      totalMs: 50,
      cache: "miss",
      intent: ir.primary,
      confidence: ir.confidence,
      strategy: "primary",
    },
  ];
  assert.equal(events[0].type, "plan");
  assert.equal(events[0].plan.stance, "high");
  assert.equal(events[1].type, "stats");
  assert.equal(events[1].intent, "recruiter");
  assert.equal(events[1].strategy, "primary");
});

test("every CopilotEvent literal satisfies the union discriminator", () => {
  const all: CopilotEvent[] = [
    { type: "meta", id: "req-1", mode: "general", model: "llama-3.3-70b-versatile", startedAt: 1, lang: "en" },
    { type: "plan", plan: { template: "general", stance: "medium", card: "none" } },
    { type: "delta", text: "hi" },
    { type: "sources", sources: [] },
    { type: "card", card: { kind: "project", slug: "restai", title: "RestAI" } },
    { type: "done", finish: "stop" },
    { type: "error", code: 429, kind: "rate_limited", message: "rate limited" },
    {
      type: "stats",
      tokens: { in: 10, out: 5 },
      retrievalMs: 12,
      totalMs: 50,
      cache: "build",
      intent: "general",
      confidence: 0,
      strategy: "primary",
    },
  ];
  for (const e of all) assert.ok("type" in e);
});

test("RequestBody shape matches the wire contract", () => {
  const body: RequestBody = { message: "What did you build?", mode: "recruiter", history: [] };
  assert.equal(body.message.length > 0, true);
});

test("Intent covers the nine approved values", () => {
  const i: Intent[] = ["general", "recruiter", "project", "architecture", "interview", "resume", "skills", "experience", "decision"];
  assert.equal(new Set(i).size, 9);
});

test("meta event carries the detected language", () => {
  const e: CopilotEvent = { type: "meta", id: "req-1", mode: "recruiter", model: "m", startedAt: 1, lang: "ar" };
  assert.equal(e.lang, "ar");
});