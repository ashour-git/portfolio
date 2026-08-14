import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndex, loadCentroids } from "../lib/copilot/index";

test("committed index loads with matching meta and vectors", () => {
  const { chunks, embeddings } = loadIndex();
  assert.equal(chunks.length, 23, `expected 23 chunks, got ${chunks.length}`);
  for (const c of chunks) {
    const vec = embeddings[c.id];
    assert.ok(vec, `missing vector for ${c.id}`);
    assert.equal(vec.length, 384);
  }
  const ids = new Set(chunks.map((c) => c.id));
  for (const id of ["ar-hire", "ar-about", "ar-resume", "ar-skills", "ar-experience", "ar-linkedin", "ar-stats"]) {
    assert.ok(ids.has(id), `missing Arabic chunk ${id}`);
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
