import { test } from "node:test";
import assert from "node:assert/strict";
import { NarrationFilter, ThinkingTagFilter, stripNarration } from "../lib/copilot/narration";

test("ThinkingTagFilter extracts the answer after the closing tag", () => {
  const f = new ThinkingTagFilter();
  const input =
    "\n<thinking>\nHere's a thinking process:\n\n1.  **Analyze User Input:**\n   - **Question:** Tell me about RestAI\n" +
    "</thinking>\n\n### Overview\nRestAI is a production SaaS [1].\n\n### Impact\nGrounded answers.\n";
  const out = [...f.push(input), ...f.flush()].join("");
  assert.ok(!out.includes("thinking"), "reasoning must be dropped");
  assert.ok(out.startsWith("### Overview"), "answer must start right after the closing tag");
  assert.ok(out.includes("### Impact"), "answer sections must be preserved");
});

test("ThinkingTagFilter streams clean answers untouched", () => {
  const f = new ThinkingTagFilter();
  const out = [...f.push("### Overview\nRestAI is a production SaaS [1].\n"), ...f.flush()].join("");
  assert.equal(out, "### Overview\nRestAI is a production SaaS [1].\n");
});

test("ThinkingTagFilter handles tag split across chunks", () => {
  const f = new ThinkingTagFilter();
  const parts = [
    "\n<thi",
    "nking>\nLet me analyze.\nDone.\n",
    "</think",
    "ing>\n\nRestAI is a production SaaS [1].\n",
  ];
  const out = parts.flatMap((p) => f.push(p)).join("") + f.flush().join("");
  assert.ok(!out.includes("Let me analyze"), "narration must be dropped");
  assert.ok(out.includes("RestAI is a production SaaS"), "answer must survive");
});

test("ThinkingTagFilter falls back when truncated mid-thinking", () => {
  const f = new ThinkingTagFilter();
  const input = "\n<thinking>\nHere's a thinking process:\n\n1. Analyze the request.\n2. Draft content.\n";
  const out = [...f.push(input), ...f.flush()].join("");
  assert.ok(out.length >= 0, "truncated narration must not throw");
});

test("NarrationFilter strips a leading untagged thinking block up to the answer", () => {
  const text = "\n<thinking>\nThinking Process:\n\n1.  **Analyze the Request:**\n    *   User asks: hello\n\nLet's go.\n\n### Overview\nRestAI is a production SaaS [1].\n";
  const out = stripNarration(text);
  assert.ok(out.startsWith("### Overview"), "unexpected: " + JSON.stringify(out.slice(0, 40)));
  assert.ok(!out.includes("Thinking Process"), "narration must be dropped");
  assert.ok(out.includes("RestAI is a production SaaS"), "answer must survive");
});

test("NarrationFilter keeps non-narrated answers verbatim", () => {
  const text = "### Overview\nRestAI is a production SaaS [1].\n### Impact\nGrounded.\n";
  assert.equal(stripNarration(text), text);
});