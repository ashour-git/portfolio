import { test } from "node:test";
import assert from "node:assert/strict";
import { namedProjectChunks } from "../lib/copilot/retrieval";
import { loadIndex } from "../lib/copilot/index";

const ids = (m: string) => namedProjectChunks(m, loadIndex().chunks).map((c) => c.id);

test("Arabic turn naming a project resolves to that project chunk", () => {
  assert.deepEqual(ids("احكيلي عن RestAI"), ["project-restai"]);
  assert.deepEqual(ids("اشرح معمارية Rest AI"), ["project-restai"]);
  assert.deepEqual(ids("إزاي عملت مشروع text2sql؟"), ["project-text2sql"]);
  assert.deepEqual(ids("ايه هو Text-to-SQL"), ["project-text2sql"]);
  assert.deepEqual(ids("Kepler Vision ده ايه"), ["project-kepler-vision"]);
});

test("no project name means no bridge", () => {
  assert.deepEqual(ids("احكيلي عن خبرتك"), []);
  assert.deepEqual(ids("ما هي عاصمة فرنسا؟"), []);
  assert.deepEqual(ids("restaurant forecasting"), []);
  assert.deepEqual(ids(""), []);
});
