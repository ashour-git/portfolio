import { test } from "node:test";
import assert from "node:assert/strict";
import { rerank } from "../lib/copilot/rerank";

type Item = { id: string };

const items: Item[] = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
const textOf = (r: Item) => r.id;

test("rerank orders results by injected relevance and keeps the top K", async () => {
  const out = await rerank({
    results: items,
    query: "query",
    textOf,
    scorer: async () => [0.1, 0.9, 0.5, 0.2],
    topK: 3,
  });
  assert.deepEqual(
    out.map((r) => r.id),
    ["b", "c", "d"],
  );
});

test("rerank is a no-op without a scorer", async () => {
  const out = await rerank({ results: items, query: "query", textOf });
  assert.deepEqual(out, items);
});

test("rerank returns the original order when the scorer throws", async () => {
  const out = await rerank({
    results: items,
    query: "query",
    textOf,
    scorer: async () => {
      throw new Error("model not cached");
    },
  });
  assert.deepEqual(out, items);
});

test("rerank returns the original order when scores do not cover every result", async () => {
  const out = await rerank({
    results: items,
    query: "query",
    textOf,
    scorer: async () => [0.1, 0.2],
  });
  assert.deepEqual(out, items);
});
