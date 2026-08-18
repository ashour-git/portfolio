import { test } from "node:test";
import assert from "node:assert/strict";
import {
  modeLabel,
  sourceLabel,
  QUICK_ACTIONS,
  PLACEHOLDER,
  groundedIn,
  verifiedFrom,
  contextLabel,
  PANEL_TITLES,
  showMetricsStrip,
} from "../lib/copilot/i18n";

test("English labels fall through to the canonical English values", () => {
  assert.equal(modeLabel("recruiter", "en"), "Recruiter");
  assert.equal(sourceLabel("resume", "Resume", "en"), "Resume");
  assert.equal(groundedIn(["Resume", "LinkedIn"], "en"), "Grounded in Resume, LinkedIn");
  assert.equal(contextLabel("architecture", "en"), "CONTEXT · ARCHITECTURE");
});

test("Arabic mode labels are professional and distinct", () => {
  assert.equal(modeLabel("general", "ar"), "عام");
  assert.equal(modeLabel("recruiter", "ar"), "توظيف");
  assert.equal(modeLabel("interview", "ar"), "مقابلة");
  assert.equal(modeLabel("architecture", "ar"), "معمارية");
  assert.equal(modeLabel("explore", "ar"), "استكشاف");
});

test("Arabic source labels localize where appropriate, keep display names for projects", () => {
  assert.equal(sourceLabel("resume", "Resume", "ar"), "السيرة الذاتية");
  assert.equal(sourceLabel("linkedin", "LinkedIn", "ar"), "LinkedIn");
  assert.equal(sourceLabel("experience", "Experience", "ar"), "الخبرة");
  assert.equal(sourceLabel("project", "RestAI", "ar"), "RestAI");
});

test("Arabic chrome strings are present and non-empty", () => {
  assert.equal(QUICK_ACTIONS.ar.length, 6);
  assert.ok(PLACEHOLDER.ar.length > 0);
  assert.ok(PANEL_TITLES.ar.skills.length > 0);
  assert.equal(contextLabel("architecture", "ar"), "السياق · معمارية");
  assert.equal(groundedIn(["السيرة الذاتية", "LinkedIn"], "ar"), "مُسنَد إلى السيرة الذاتية، LinkedIn");
  assert.equal(verifiedFrom(3, "ar"), "تم التحقق من 3 مصدرًا");
  assert.equal(verifiedFrom(3, "en"), "Verified from 3 indexed sources");
});

test("showMetricsStrip gates the metrics strip to recruiter/stats plans", () => {
  assert.equal(showMetricsStrip({ template: "recruiter", stance: "high", card: "resume" }), true);
  assert.equal(showMetricsStrip({ template: "general", stance: "high", card: "stats" }), true);
  assert.equal(showMetricsStrip({ template: "general", stance: "high", card: "none" }), false);
  assert.equal(showMetricsStrip(null), false);
});
