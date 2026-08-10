import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlan } from "../lib/copilot/planner";
import type { IntentResult, RetrievalResult } from "../lib/copilot/types";

const result = (id: string, kind: string, score: number): RetrievalResult => ({
  id,
  label: id,
  title: id,
  source: { kind: kind as never },
  score,
  parts: {},
  reasons: ["cosine 0.5"],
  breakdown: [{ signal: "cosine", value: 0.5, weight: 0.45 }],
});

test("recruiter planner picks the resume card at high stance", () => {
  const plan = buildPlan({
    intent: { primary: "recruiter", confidence: 0.9 },
    results: [result("hire", "hire", 0.6), result("resume", "resume", 0.4)],
  });
  assert.equal(plan.template, "recruiter");
  assert.equal(plan.stance, "high");
  assert.equal(plan.card, "resume");
});

test("empty retrieval produces fallback stance with suggestions", () => {
  const plan = buildPlan({ intent: { primary: "general", confidence: 0.2 }, results: [] });
  assert.equal(plan.stance, "fallback");
  assert.ok(plan.suggestions !== undefined && plan.suggestions.length > 0);
});

test("project intent with a project doc drives a project card", () => {
  const plan = buildPlan({
    intent: { primary: "project", confidence: 0.9 },
    results: [result("project-restai", "project", 0.7)],
  });
  assert.equal(plan.card, "project");
  assert.equal(plan.stance, "high");
});

test("skills intent drives a skills card when a skill doc present", () => {
  const plan = buildPlan({
    intent: { primary: "skills", confidence: 0.9 },
    results: [result("skills", "skill", 0.5)],
  });
  assert.equal(plan.card, "skills");
});

test("experience intent drives a timeline card", () => {
  const plan = buildPlan({
    intent: { primary: "experience", confidence: 0.9 },
    results: [result("experience", "experience", 0.5)],
  });
  assert.equal(plan.card, "timeline");
});

test("general intent stays general and derives stats card from stats docs", () => {
  const plan = buildPlan({
    intent: { primary: "general", confidence: 0.2 },
    results: [result("stats", "stats", 0.5)],
  });
  assert.equal(plan.template, "general");
  assert.equal(plan.card, "stats");
});