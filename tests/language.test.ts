import { test } from "node:test";
import assert from "node:assert/strict";
import { detectLanguage } from "../lib/copilot/language";

const ARABIC_CASES = [
  "بالعربي",
  "عرفني بنفسك",
  "لماذا يجب أن أوظف محمد؟",
  "ما أهم مهاراتك؟",
  "اشرح لي مشروع RestAI",
  "ما المعمارية المستخدمة في RestAI؟",
  "ما الفرق بين مشاريعك؟",
  "ما خبرتك في RAG؟",
  "ما خبرتك في تعلم الآلة؟",
  "ما التقنيات التي تستخدمها؟",
  "اعرض لي السيرة الذاتية",
  "أين أجد GitHub؟",
  "اشرح لي RAG architecture في RestAI",
  "ما استخدام FastAPI في المشروع؟",
  "ما سرعة الاسترجاع؟",
];

const ENGLISH_CASES = [
  "What did you build?",
  "Show RestAI architecture",
  "Explain your RAG",
  "Why those tradeoffs?",
  "Interview me",
  "Resume summary",
  "Why should I hire you?",
];

test("detectLanguage returns ar for pure Arabic messages", () => {
  for (const q of ARABIC_CASES) {
    assert.equal(detectLanguage(q), "ar", `expected ar for ${q}`);
  }
});

test("detectLanguage returns en for English messages", () => {
  for (const q of ENGLISH_CASES) {
    assert.equal(detectLanguage(q), "en", `expected en for ${q}`);
  }
});

test("detectLanguage uses the dominant script for mixed messages", () => {
  assert.equal(detectLanguage("اشرح لي RAG architecture في RestAI"), "ar");
  assert.equal(detectLanguage("Explain RAG بالعربي"), "en");
});

test("detectLanguage returns en for script-neutral or empty input", () => {
  assert.equal(detectLanguage(""), "en");
  assert.equal(detectLanguage("12345"), "en");
  assert.equal(detectLanguage("!! ??"), "en");
  assert.equal(detectLanguage("18/18"), "en");
});