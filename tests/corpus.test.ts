import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChunks } from "../lib/copilot/corpus";
import { profile, projects } from "../lib/data";
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

test("v2: each chunk carries label, authority, and a normalized priority", () => {
  const chunks = buildChunks();
  for (const c of chunks) {
    assert.ok(typeof c.label === "string" && c.label.length > 0, `label missing for ${c.id}`);
    assert.ok(["first-party", "metrics", "external"].includes(c.authority), `authority missing for ${c.id}`);
    assert.ok(c.priority > 0 && c.priority <= 1, `priority out of range for ${c.id}`);
  }
});

test("v2: hire, about, linkedin chunks are derived from site data", () => {
  const byId = new Map(buildChunks().map((c) => [c.id, c]));
  for (const id of ["hire", "about", "linkedin"]) {
    assert.ok(byId.has(id), `missing chunk ${id}`);
    const c = byId.get(id)!;
    assert.ok(c.text.length > 40, `${id} text too short`);
  }
  const hire = byId.get("hire")!;
  assert.ok(hire.text.includes(profile.name), "hire chunk must name the profile");
  assert.equal(hire.authority, "metrics");
  const linkedin = byId.get("linkedin")!;
  assert.equal(linkedin.authority, "external");
  assert.ok(
    linkedin.text.includes(profile.linkedin) || linkedin.text.includes(profile.github),
    "linkedin chunk must carry profile links",
  );
  assert.ok(hire.keywords.includes("hire"), "hire chunk must keyword 'hire'");
});

test("bilingual Arabic chunks exist with Arabic and English portions", () => {
  const byId = new Map(buildChunks().map((c) => [c.id, c]));
  for (const id of ["ar-hire", "ar-about", "ar-resume", "ar-skills", "ar-experience", "ar-linkedin", "ar-stats"]) {
    const c = byId.get(id);
    assert.ok(c, `missing chunk ${id}`);
    assert.ok(c.text.length > 40, `${id} text too short`);
    assert.ok(/[؀-ٿݐ-ݿࢠ-ࣿ]/.test(c.text), `${id} must contain Arabic`);
    assert.ok(c.text.includes("English:"), `${id} must contain an English anchor line`);
  }
  const hire = byId.get("ar-hire")!;
  assert.equal(hire.source.kind, "hire");
  assert.equal(hire.authority, "metrics");
  assert.ok(hire.keywords.includes("hire"), "ar-hire must keyword 'hire'");
});