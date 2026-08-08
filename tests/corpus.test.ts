import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChunks } from "../lib/copilot/corpus";
import { projects } from "../lib/data";
import type { SourceKind } from "../lib/copilot/types";

test("corpus has one project chunk per project", () => {
  const chunks = buildChunks();
  const projectChunks = chunks.filter((c) => c.source.kind === "project");
  assert.equal(projectChunks.length, projects.length);
});

test("every project chunk id is unique and stable", () => {
  const chunks = buildChunks();
  const ids = chunks.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("project chunks carry source slug, url, keywords and rich text", () => {
  const chunks = buildChunks();
  const restai = chunks.find((c) => c.source.slug === "restai");
  assert.ok(restai);
  assert.equal(restai.source.kind, "project");
  assert.ok(restai.source.url);
  assert.ok(restai.keywords.includes("restai"));
  assert.ok(restai.text.length > 200);
  const lower = restai.text.toLowerCase();
  assert.ok(lower.includes("study") || lower.includes("architecture"));
});

test("support sections are present", () => {
  const kinds = buildChunks().map((c) => c.source.kind);
  for (const k of ["skill", "principle", "experience", "insight", "resume", "stats"] satisfies SourceKind[]) {
    assert.ok(kinds.includes(k), `missing ${k}`);
  }
});

test("buildChunks is deterministic", () => {
  assert.deepEqual(buildChunks(), buildChunks());
});