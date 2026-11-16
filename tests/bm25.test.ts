import { test } from "node:test";
import assert from "node:assert/strict";
import { createBm25Index, bm25Tokens, getBm25Index, __resetBm25Cache } from "../lib/copilot/bm25";
import { loadIndex } from "../lib/copilot/index";

const docs = [
  { id: "restai", title: "RestAI", keywords: ["restai", "rag"], text: "RestAI is a RAG assistant over pgvector with LightGBM forecasting." },
  { id: "storefy", title: "Storefy", keywords: ["storefy"], text: "Storefy is an agentic commerce backend with wildcard subdomains." },
  { id: "skills", title: "Skills", keywords: ["rag"], text: "Skills: RAG, embeddings, FastAPI, PyTorch, Docker." },
];

test("tokens drop stopwords and short tokens", () => {
  assert.deepEqual(bm25Tokens("What is the RestAI architecture?"), ["restai", "architecture"]);
});

test("rare literal term ranks its document first", () => {
  const idx = createBm25Index(docs);
  const q = bm25Tokens("what is RestAI?");
  const scores = docs.map((d) => idx.score(q, d.id));
  assert.ok(scores[0] > 0);
  assert.equal(scores[1], 0);
  assert.equal(scores[2], 0);
});

test("scores are normalized into [0, 1)", () => {
  const idx = createBm25Index(docs);
  for (const d of docs) {
    const s = idx.score(["restai", "rag", "pgvector", "storefy", "fastapi"], d.id);
    assert.ok(s >= 0 && s < 1, `${d.id}: ${s}`);
  }
});

test("slug is indexed so 'text2sql' matches prose that says Text-to-SQL", () => {
  const idx = createBm25Index([
    { id: "t", slug: "text2sql", title: "Text-to-SQL Generator", keywords: [], text: "Natural language to SQL." },
    { id: "o", title: "Other", keywords: [], text: "Unrelated." },
  ]);
  assert.ok(idx.score(["text2sql"], "t") > 0);
  assert.equal(idx.score(["text2sql"], "o"), 0);
});

test("unknown doc, empty query, and empty corpus score zero; bad input fails safe", () => {
  const idx = createBm25Index(docs);
  assert.equal(idx.score(["restai"], "missing"), 0);
  assert.equal(idx.score([], "restai"), 0);
  assert.equal(createBm25Index([]).score(["restai"], "x"), 0);
  assert.equal(createBm25Index(null as never).size, 0);
});

test("lazy cache builds once and survives a throwing loader", () => {
  __resetBm25Cache();
  let calls = 0;
  const a = getBm25Index(() => (calls++, docs));
  const b = getBm25Index(() => (calls++, docs));
  assert.equal(a, b);
  assert.equal(calls, 1);
  __resetBm25Cache();
  const broken = getBm25Index(() => {
    throw new Error("boom");
  });
  assert.equal(broken.score(["restai"], "restai"), 0);
  __resetBm25Cache();
});

test("on the real index, 'restai' lifts project-restai above every other chunk", () => {
  const { chunks } = loadIndex();
  const idx = createBm25Index(chunks.map((c) => ({ id: c.id, title: c.title, slug: c.source.slug, keywords: c.keywords, text: c.text })));
  const q = bm25Tokens("what is RestAI?");
  const ranked = chunks.map((c) => ({ id: c.id, s: idx.score(q, c.id) })).sort((x, y) => y.s - x.s);
  assert.equal(ranked[0].id, "project-restai");
});
