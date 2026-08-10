import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndex, loadCentroids } from "../lib/copilot/index";

test("committed index loads with matching meta and vectors", () => {
  const { chunks, embeddings } = loadIndex();
  assert.ok(chunks.length >= 16, `expected >= 16 chunks, got ${chunks.length}`);
  for (const c of chunks) {
    const vec = embeddings[c.id];
    assert.ok(vec, `missing vector for ${c.id}`);
    assert.equal(vec.length, 384);
  }
});

test("centroids cover the eight non-general intents", () => {
  const centroids = loadCentroids();
  const want = ["recruiter", "project", "architecture", "interview", "resume", "skills", "experience", "decision"];
  for (const w of want) {
    assert.ok(centroids[w], `missing centroid ${w}`);
  }
  assert.equal(Object.keys(centroids).length, 8);
});
