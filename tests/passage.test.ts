import { test } from "node:test";
import assert from "node:assert/strict";
import { splitPassages, selectPassage, safeSlice } from "../lib/copilot/passage";
import { capContext } from "../lib/copilot/retrieval";

const filler = (w: string, n: number) => Array.from({ length: n }, () => w).join(" ");
const LONG =
  `Project: RestAI. Domain: LLM. Summary: ${filler("summary", 40)}. ` +
  `Problem: ${filler("problem", 60)}. Decisions: RAG over live data | Optuna-tuned LightGBM. ` +
  `Architecture: ${filler("layers", 60)}. Tradeoffs: pgvector inside PostgreSQL over a standalone vector DB. ` +
  `Lessons: ${filler("lesson", 40)}.`;

test("splitPassages splits on allowlisted labels and keeps | lists in their block", () => {
  const parts = splitPassages(LONG);
  assert.ok(parts[0].startsWith("Project: RestAI. Domain: LLM."), "Domain is not a label, stays with Project");
  const decisions = parts.find((p) => p.startsWith("Decisions:"));
  assert.ok(decisions?.includes("| Optuna-tuned LightGBM"));
  assert.ok(parts.some((p) => p.startsWith("Tradeoffs:")));
  assert.ok(parts.some((p) => p.startsWith("Lessons:")));
});

test("splitPassages falls back to sentences when no label exists", () => {
  assert.deepEqual(splitPassages("One thing. Two things. Three."), ["One thing.", "Two things.", "Three."]);
  assert.deepEqual(splitPassages(""), []);
});

test("text under the cap is returned unchanged", () => {
  assert.equal(selectPassage("Project: X. Summary: short.", ["x"], { maxChars: 500 }), "Project: X. Summary: short.");
});

test("tail segments matching the query survive instead of being head-truncated", () => {
  const out = selectPassage(LONG, ["pgvector", "tradeoffs"], { maxChars: 400 });
  assert.ok(out.length <= 400);
  assert.ok(out.startsWith("Project: RestAI."), "first segment is always kept");
  assert.ok(out.includes("Tradeoffs: pgvector"), "query-relevant tail segment selected");
  assert.ok(!LONG.slice(0, 400).includes("Tradeoffs"), "head truncation would have lost it");
});

test("selected segments are emitted in document order", () => {
  const out = selectPassage(LONG, ["lesson", "pgvector"], { maxChars: 700 });
  const t = out.indexOf("Tradeoffs:");
  const l = out.indexOf("Lessons:");
  assert.ok(t > 0 && l > t);
});

test("safeSlice never splits a surrogate pair", () => {
  assert.equal(safeSlice("ab😀", 3), "ab");
  assert.equal(safeSlice("ab😀", 4), "ab😀");
  assert.equal(safeSlice("abc", 0), "");
});

test("capContext uses passage selection only when query tokens are given", () => {
  const rows = [{ id: "a", text: LONG }];
  const head = capContext(rows, 6000, 400);
  assert.equal(head[0].text, LONG.slice(0, 400), "default stays head truncation");
  const picked = capContext(rows, 6000, 400, { queryTokens: ["pgvector", "tradeoffs"] });
  assert.ok(picked[0].text.includes("Tradeoffs: pgvector"));
  assert.ok(picked[0].text.length <= 400);
});

test("capContext keeps the total budget", () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({ id: String(i), text: LONG }));
  const out = capContext(rows, 1000, 400, { queryTokens: ["rag"] });
  assert.ok(out.reduce((n, r) => n + r.text.length, 0) <= 1000);
});

test("LruCache evicts the least recently used entry past its cap", async () => {
  const { LruCache } = await import("../lib/copilot/retrieval");
  const c = new LruCache<string, number>(2);
  c.set("a", 1).set("b", 2);
  assert.equal(c.get("a"), 1); // a is now most recent
  c.set("c", 3);
  assert.deepEqual([...c.keys()], ["a", "c"]);
  assert.equal(c.has("b"), false);
  for (let i = 0; i < 500; i++) c.set(`k${i}`, i);
  assert.equal(c.size, 2);
});
