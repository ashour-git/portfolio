import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt, serializeContext, buildMessages, TEMPLATE_HINTS } from "../lib/copilot/prompt";
import type { RetrievalResult } from "../lib/copilot/types";

test("every mode prompt contains the scope gate and identity", () => {
  for (const mode of ["general", "recruiter", "interview", "architecture", "explore"]) {
    const p = buildSystemPrompt(mode as never);
    assert.ok(p.includes("Mohamed Ashour"));
    assert.ok(p.toLowerCase().includes("decline"));
    assert.ok(p.includes("fabricat"));
  }
});

test("recruiter and architecture prompts are distinct", () => {
  assert.notEqual(buildSystemPrompt("recruiter"), buildSystemPrompt("architecture"));
});

test("serializeContext numbers sources with titles", () => {
  const results: RetrievalResult[] = [
    { id: "x", label: "RestAI", title: "RestAI", source: { kind: "project", slug: "restai" }, score: 0.9, parts: {}, reasons: [], breakdown: [] },
    { id: "y", label: "RestAI", title: "Experience", source: { kind: "experience" }, score: 0.5, parts: {}, reasons: [], breakdown: [] },
  ];
  const s = serializeContext(results);
  assert.ok(s.includes("[1] RestAI"));
  assert.ok(s.includes("[2] Experience"));
});

test("history is capped at 6 turns and system is first", () => {
  const history = Array.from({ length: 10 }, (_, i) => ({ role: "user" as const, content: `m${i}` }));
  const msgs = buildMessages({ message: "hi", results: [], history });
  assert.equal(msgs[0].role, "system");
  assert.equal(msgs[msgs.length - 1].content, "hi");
  // system + ≤6 history + retrieval context + final user message
  assert.ok(msgs.length <= 9);
  const historyRoles = msgs.filter((m) => m.role === "user" || m.role === "assistant").length;
  assert.ok(historyRoles <= 8); // ≤6 history + context + final
});

test("plan-driven prompts embed section hints and fallback language", () => {
  const p = buildSystemPrompt("general", { template: "recruiter", stance: "high", card: "resume" });
  assert.ok(p.includes(TEMPLATE_HINTS.recruiter));
  const fb = buildSystemPrompt("general", { template: "general", stance: "fallback", card: "none", suggestions: ["Skills"] });
  assert.ok(fb.toLowerCase().includes("related topics"));
});

test("fallback plan routes suggestions into the context message", () => {
  const plan = { template: "general" as const, stance: "fallback" as const, card: "none" as const, suggestions: ["Skills", "Projects"] };
  const msgs = buildMessages({ message: "hi", plan, results: [] });
  const context = msgs.find((m) => m.content.startsWith("No supporting context"));
  assert.ok(context, "fallback context message expected");
  assert.ok(context.content.includes("Skills"));
});

test("recruiter template hints mention skills or experience sections", () => {
  const hint = TEMPLATE_HINTS.recruiter.toLowerCase();
  assert.ok(hint.includes("skills") || hint.includes("experience"));
});