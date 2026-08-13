import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteQuery, tokenize, MAX_EXPANSION_TOKENS, ARABIC_BRIDGE } from "../lib/copilot/rewrite";

test("tokenize keeps meaningful tokens and drops noise", () => {
  assert.deepEqual(tokenize("What did you build?"), ["what", "did", "you", "build"]);
  assert.equal(tokenize("a bc def").some((t) => t.length < 3), false);
});

test("recruiter probes expand with fit/skills/experience vocabulary", () => {
  const tokens = rewriteQuery("Why should I hire you?", "recruiter");
  assert.ok(tokens.includes("hire"));
  assert.ok(tokens.includes("experience"), "expansion should add experience");
});

test("general intent is a pure tokenization no-op", () => {
  assert.deepEqual(rewriteQuery("hello world", "general"), tokenize("hello world"));
});

test("expansion is capped and never duplicates base tokens", () => {
  const tokens = rewriteQuery("hire skills engineer", "recruiter");
  const base = tokenize("hire skills engineer");
  const extra = tokens.filter((t) => !base.includes(t));
  assert.ok(extra.length <= MAX_EXPANSION_TOKENS);
  assert.equal(new Set(tokens).size, tokens.length);
});

test("architecture intent pulls flow and decisions vocabulary", () => {
  const tokens = rewriteQuery("show RestAI", "architecture");
  for (const w of ["architecture", "flow", "decisions"]) {
    assert.ok(tokens.includes(w), `missing ${w}`);
  }
});

test("Arabic bridge maps common Arabic stems to English tokens", () => {
  const en = new Set(ARABIC_BRIDGE.flatMap(([, t]) => t));
  for (const t of ["experience", "project", "skills", "architecture", "retrieval", "latency", "resume"]) {
    assert.ok(en.has(t), `missing bridge token ${t}`);
  }
});

test("rewriteQuery adds English bridge tokens for Arabic queries", () => {
  const tokens = rewriteQuery("ما خبرتك في RAG؟", "experience");
  assert.ok(tokens.includes("experience"), "expected experience token");
  assert.ok(tokens.includes("rag"), "expected rag token from the query itself");
});

test("Arabic query tokens and English names both survive rewriting", () => {
  const tokens = rewriteQuery("ما المعمارية المستخدمة في RestAI؟", "architecture");
  assert.ok(tokens.includes("architecture"));
  assert.ok(tokens.includes("restai"));
});