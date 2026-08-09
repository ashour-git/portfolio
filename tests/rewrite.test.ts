import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteQuery, tokenize, MAX_EXPANSION_TOKENS } from "../lib/copilot/rewrite";

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