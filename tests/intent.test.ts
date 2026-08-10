import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyByRules,
  classifyByCentroid,
  INTENT_RULES,
} from "../lib/copilot/intent";
import type { Intent } from "../lib/copilot/types";

// Synthetic 2-dim centroids keep this test index-independent.
const syntheticCentroids: Partial<Record<Intent, Float32Array>> = {
  recruiter: new Float32Array([1, 0]),
  architecture: new Float32Array([0, 1]),
};

test("the nine intents are covered and general is the fallback", () => {
  const want = ["recruiter", "project", "architecture", "interview", "resume", "skills", "experience", "decision"];
  for (const w of want) {
    assert.ok(INTENT_RULES[w as keyof typeof INTENT_RULES].length > 0, `missing rules for ${w}`);
  }
  assert.equal(classifyByRules("what is the capital of france").primary, "general");
});

test("recruiter probe maps to recruiter with high confidence", () => {
  const r = classifyByRules("Why should I hire you?");
  assert.equal(r.primary, "recruiter");
  assert.ok(r.confidence >= 0.85);
});

test("architecture probe maps to architecture", () => {
  assert.equal(classifyByRules("Explain the RestAI architecture").primary, "architecture");
});

test("interview probe maps to interview", () => {
  assert.equal(classifyByRules("Interview me about RestAI").primary, "interview");
});

test("skills probe maps to skills", () => {
  assert.equal(classifyByRules("What are your skills?").primary, "skills");
});

test("experience probe maps to experience", () => {
  assert.equal(classifyByRules("Where have you worked?").primary, "experience");
});

test("resume probe maps to resume", () => {
  assert.equal(classifyByRules("Give me a resume summary").primary, "resume");
});

test("project probe maps to project", () => {
  assert.equal(classifyByRules("What did you build?").primary, "project");
});

test("decision probe maps to decision", () => {
  const r = classifyByRules("Why did you pick pgvector?");
  assert.equal(r.primary, "decision");
});

test("ambiguous probes receive a secondary intent", () => {
  const r = classifyByRules("Interview me about your resume");
  assert.ok(r.secondary !== undefined);
});

test("centroid fallback recovers the nearest intent without rules", () => {
  const r = classifyByCentroid(syntheticCentroids["recruiter"]!, syntheticCentroids);
  assert.equal(r.primary, "recruiter");
  assert.ok(r.confidence >= 0.7);
});

test("centroid fallback returns general for an unrelated vector", () => {
  const r = classifyByCentroid(new Float32Array(2), syntheticCentroids);
  assert.equal(r.primary, "general");
});