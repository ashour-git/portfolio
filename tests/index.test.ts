import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndex } from "../lib/copilot/index";

test("committed index loads with matching meta and vectors", () => {
  const { chunks, embeddings } = loadIndex();
  assert.ok(chunks.length >= 6, `expected >= 6 chunks, got ${chunks.length}`);
  for (const c of chunks) {
    const vec = embeddings[c.id];
    assert.ok(vec, `missing vector for ${c.id}`);
    assert.equal(vec.length, 384);
  }
});