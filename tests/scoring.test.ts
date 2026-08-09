import { test } from "node:test";
import assert from "node:assert/strict";
import { cosine, keywordOverlap, retrieveTopK, MODE_BOOST } from "../lib/copilot/scoring";
import type { Chunk } from "../lib/copilot/types";

test("cosine of identical vectors is 1, orthogonal is 0", () => {
  assert.ok(Math.abs(cosine(new Float32Array([1, 0]), new Float32Array([1, 0])) - 1) < 1e-6);
  assert.ok(Math.abs(cosine(new Float32Array([1, 0]), new Float32Array([0, 1]))) < 1e-6);
});

test("keywordOverlap returns matched fraction of query tokens", () => {
  const kw = ["rag", "retrieval", "vector"];
  assert.equal(keywordOverlap(["rag", "vector", "zzz"], kw), 2 / 3);
  assert.equal(keywordOverlap(["nope"], kw), 0);
});

test("retrieveTopK scores, ranks, and caps results", () => {
  const emb = {
    a: new Float32Array([1, 0]),
    b: new Float32Array([0.9, 0.1]),
    c: new Float32Array([0, 1]),
  };
  const chunks: Chunk[] = [
    { id: "a", title: "A", label: "a", text: "a", source: { kind: "project" }, keywords: ["rag"], authority: "metrics", priority: 0.15 },
    { id: "b", title: "B", label: "b", text: "b", source: { kind: "project" }, keywords: ["rag", "retrieval"], authority: "metrics", priority: 0.15 },
    { id: "c", title: "C", label: "c", text: "c", source: { kind: "skill" }, keywords: ["cv"], authority: "metrics", priority: 0.15 },
  ];
  const out = retrieveTopK(new Float32Array([1, 0]), ["rag"], chunks, {
    k: 2,
    minScore: 0,
    embeddings: emb,
    weights: { cosine: 1, keyword: 0, boost: 0 },
  });
  assert.equal(out.length, 2);
  assert.equal(out[0].id, "a");
  assert.ok(out[0].parts.cosine !== undefined);
  assert.ok(out[0].reasons.some((r) => r.startsWith("cosine")));
});

test("minScore filters weak matches", () => {
  const chunks: Chunk[] = [
    { id: "a", title: "A", label: "a", text: "a", source: { kind: "project" }, keywords: [], authority: "metrics", priority: 0.15 },
    { id: "b", title: "B", label: "b", text: "b", source: { kind: "project" }, keywords: [], authority: "metrics", priority: 0.15 },
  ];
  const out = retrieveTopK(new Float32Array([1, 0]), [], chunks, {
    k: 5,
    minScore: 0.99,
    embeddings: {
      a: new Float32Array([1, 0]),
      b: new Float32Array([0.8, 0.2]),
    },
    weights: { cosine: 1, keyword: 0, boost: 0 },
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "a");
});

test("mode boost reorders recruiter results toward experience/skills", () => {
  const query = new Float32Array([1, 0]);
  const chunks: Chunk[] = [
    { id: "proj", title: "P", label: "P", text: "p", source: { kind: "project" }, keywords: [], authority: "metrics", priority: 0.15 },
    { id: "exp", title: "E", label: "E", text: "e", source: { kind: "experience" }, keywords: [], authority: "metrics", priority: 0.15 },
  ];
  const embeddings = {
    proj: new Float32Array([1, 0]),
    exp: new Float32Array([0.95, 0.05]),
  };
  const weights = { cosine: 1, keyword: 0, boost: 0.05 };
  const out = retrieveTopK(query, [], chunks, { k: 5, minScore: 0, embeddings, weights, mode: "recruiter" });
  assert.equal(out[0].id, "exp");
  assert.ok((MODE_BOOST.recruiter.experience ?? 0) > (MODE_BOOST.recruiter.project ?? 0));
});