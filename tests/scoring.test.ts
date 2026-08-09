import { test } from "node:test";
import assert from "node:assert/strict";
import { cosine, keywordOverlap, retrieveTopK, INTENT_BOOST, MODE_BOOST } from "../lib/copilot/scoring";
import type { Chunk } from "../lib/copilot/types";

const chunk = (id: string, kind: Chunk["source"]["kind"], priority: number, keywords: string[] = []): Chunk => ({
  id,
  title: id,
  label: id,
  text: id,
  source: { kind },
  keywords,
  authority: kind === "project" ? "metrics" : "first-party",
  priority,
});

test("cosine of identical vectors is 1, orthogonal is 0", () => {
  assert.ok(Math.abs(cosine(new Float32Array([1, 0]), new Float32Array([1, 0])) - 1) < 1e-6);
  assert.ok(Math.abs(cosine(new Float32Array([1, 0]), new Float32Array([0, 1]))) < 1e-6);
});

test("keywordOverlap returns matched fraction of query tokens", () => {
  assert.equal(keywordOverlap(["rag", "vector", "zzz"], ["rag", "retrieval", "vector"]), 2 / 3);
  assert.equal(keywordOverlap(["nope"], ["rag"]), 0);
});

test("retrieveTopK ranks and caps results", () => {
  const emb = {
    a: new Float32Array([1, 0]),
    b: new Float32Array([0.9, 0.1]),
    c: new Float32Array([0, 1]),
  };
  const chunks = [chunk("a", "project", 0.4, ["rag"]), chunk("b", "project", 0.4, ["rag"]), chunk("c", "skill", 0.2, ["cv"])];
  const out = retrieveTopK(new Float32Array([1, 0]), ["rag"], chunks, {
    k: 2,
    minScore: 0,
    embeddings: emb,
    weights: { cosine: 1, keyword: 0, intent: 0, mode: 0, priority: 0 },
  });
  assert.equal(out.length, 2);
  assert.equal(out[0].id, "a");
  assert.ok(out[0].reasons.some((r) => r.startsWith("cosine")));
});

test("priority signal lets a strong document win ties", () => {
  const chunks = [
    chunk("low", "project", 0.2),
    chunk("high", "project", 0.6),
  ];
  const embeddings = {
    low: new Float32Array([1, 0]),
    high: new Float32Array([0.99, 0.01]),
  };
  const out = retrieveTopK(new Float32Array([1, 0]), [], chunks, {
    k: 5,
    minScore: 0,
    embeddings,
    weights: { cosine: 0.2, keyword: 0.2, intent: 0.2, mode: 0.2, priority: 0.2 },
  });
  assert.equal(out[0].id, "high");
});

test("intent boost reorders recruiter results toward hire/resume", () => {
  const chunks = [
    chunk("proj", "project", 0.4),
    chunk("hire", "hire", 0.6, ["hire"]),
  ];
  const embeddings = {
    proj: new Float32Array([1, 0]),
    hire: new Float32Array([0.98, 0.02]),
  };
  const out = retrieveTopK(new Float32Array([0.98, 0.02]), ["hire"], chunks, {
    k: 5,
    minScore: 0,
    embeddings,
    intent: "recruiter",
    mode: "general",
  });
  assert.equal(out[0].id, "hire");
  assert.ok((INTENT_BOOST.recruiter.hire ?? 0) > 0);
});

test("every result carries reasons and a machine breakdown", () => {
  const chunks = [chunk("a", "project", 0.4, ["rag"])];
  const embeddings = { a: new Float32Array([1, 0]) };
  const out = retrieveTopK(new Float32Array([1, 0]), ["rag"], chunks, {
    k: 5,
    minScore: 0,
    embeddings,
    intent: "project",
  });
  assert.ok(out[0].breakdown.length >= 2, "breakdown should at least carry cosine and keyword");
  assert.ok(out[0].breakdown.some((b) => b.signal === "cosine"));
  assert.ok(out[0].reasons.some((r) => r.includes("authority")));
});

test("minScore filters weak matches", () => {
  const chunks = [chunk("a", "project", 0.1), chunk("b", "project", 0.1)];
  const embeddings = {
    a: new Float32Array([1, 0]),
    b: new Float32Array([0.5, 0.5]),
  };
  const out = retrieveTopK(new Float32Array([1, 0]), [], chunks, {
    k: 5,
    minScore: 0.99,
    embeddings,
    weights: { cosine: 1, keyword: 0, intent: 0, mode: 0, priority: 0 },
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "a");
});

test("mode boost still reorders toward the selected mode", () => {
  assert.ok((MODE_BOOST.recruiter.experience ?? 0) > (MODE_BOOST.recruiter.project ?? 0));
});