import { test } from "node:test";
import assert from "node:assert/strict";
import { isolateLtrTokens, TECH_TERMS } from "../lib/copilot/language";

function ltrRuns(text: string): string[] {
  return isolateLtrTokens(text).filter((s) => s.ltr).map((s) => s.text);
}

function join(text: string): string {
  return isolateLtrTokens(text).map((s) => s.text).join("");
}

test("URLs and emails are isolated as LTR runs", () => {
  const runs = ltrRuns("انظر https://github.com/ashour-git واكتب muhamed.3ashour@gmail.com");
  assert.ok(runs.some((r) => r.includes("github.com/ashour-git")));
  assert.ok(runs.some((r) => r.includes("muhamed.3ashour@gmail.com")));
});

test("numbers and metrics stay single LTR runs", () => {
  for (const m of ["18/18", "7,000+", "~67 ms", "162", "0.85"]) {
    const runs = ltrRuns(`النتيجة ${m} نعم`);
    assert.ok(runs.includes(m), `expected ${m} isolated`);
  }
});

test("technical terms are isolated and preserved verbatim", () => {
  const runs = ltrRuns("استخدمت RAG مع pgvector و FastAPI و PostgreSQL و Docker و MLflow و LLM");
  for (const t of ["RAG", "pgvector", "FastAPI", "PostgreSQL", "Docker", "MLflow", "LLM"]) {
    assert.ok(runs.includes(t), `expected ${t} isolated`);
  }
});

test("TECH_TERMS contains the mandated canonical names", () => {
  for (const t of ["RAG", "pgvector", "FastAPI", "PyTorch", "MLflow", "LightGBM", "PostgreSQL", "Docker", "LLM", "MLOps"]) {
    assert.ok(TECH_TERMS.includes(t), `missing ${t}`);
  }
});

test("isolation preserves the original text exactly", () => {
  const original = "استخدمت RAG مع pgvector و 18/18 اختبارًا والسرعة ~67 ms.";
  assert.equal(join(original), original);
});

test("LTR terms inside an Arabic sentence are not double-wrapped", () => {
  const runs = isolateLtrTokens("النظام RAG").filter((s) => s.ltr);
  assert.equal(runs.length, 1);
  assert.equal(runs[0].text, "RAG");
});