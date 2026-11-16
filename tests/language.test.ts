import { test } from "node:test";
import assert from "node:assert/strict";
import { detectLanguage, isArabizi, arabiziToEnglish, detectDialect, detectReplyLanguage } from "../lib/copilot/language";

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

test("detectLanguage follows the prose language, not isolated technical terms", () => {
  // An English question that names an Arabic document should stay English.
  assert.equal(detectLanguage("Tell me about السيرة الذاتية"), "en");
  // An Arabic greeting followed by an English question should answer in English.
  assert.equal(detectLanguage("أزيك؟ Tell me about RestAI"), "en");
});

test("detectLanguage returns en for script-neutral or empty input", () => {
  assert.equal(detectLanguage(""), "en");
  assert.equal(detectLanguage("12345"), "en");
  assert.equal(detectLanguage("!! ??"), "en");
  assert.equal(detectLanguage("18/18"), "en");
});
const ARABIZI = [
  "ezayak",
  "3ayez a3raf eh a7san project 3amalto?",
  "momken t2oly 3n el experience bta3o",
  "ana mesh fahem",
  "e7kili 3n RestAI",
  "eh a7san mashro3 3amalto",
];

const NOT_ARABIZI = [
  "what is RAG",
  "top 3 projects",
  "B2B",
  "gpt4o",
  "k8s",
  "I want 3 examples",
  "text2sql architecture",
  "word2vec vs seq2seq",
  "llama3b vs qwen2vl",
  "Tell me about El Gouna",
  "mesh network",
  "web3 and ec2",
  "Why should I hire you?",
];

test("Franco-Arabic (Arabizi) is detected and answered in Arabic", () => {
  for (const q of ARABIZI) {
    assert.ok(isArabizi(q), `expected Arabizi: ${q}`);
    assert.equal(detectLanguage(q), "ar", `expected ar for ${q}`);
  }
});

test("English with digits, tech ids, or stray Arabizi-like words stays English", () => {
  for (const q of NOT_ARABIZI) {
    assert.equal(isArabizi(q), false, `false positive: ${q}`);
    assert.equal(detectLanguage(q), "en", `expected en for ${q}`);
  }
});

test("Arabizi gloss keeps English/tech words and translates content words", () => {
  assert.equal(arabiziToEnglish("3ayez a3raf eh a7san project 3amalto?"), "want know what best project built");
  assert.equal(arabiziToEnglish("e7kili 3n RestAI"), "tell about RestAI");
});

test("detectDialect: Egyptian colloquial vs MSA vs non-Arabic", () => {
  assert.equal(detectDialect("عايز اعرف ايه احسن مشروع"), "egyptian");
  assert.equal(detectDialect("احكيلي عن RestAI"), "egyptian");
  assert.equal(detectDialect("وإيه أهم مهاراتك؟"), "egyptian");
  assert.equal(detectDialect("3ayez a3raf eh a7san project 3amalto?"), "egyptian");
  assert.equal(detectDialect("ما هي أهم مهاراتك التقنية؟"), "msa");
  assert.equal(detectDialect("لماذا يجب أن أوظف محمد؟"), "msa");
  assert.equal(detectDialect("What is RestAI?"), null);
});

test("detectReplyLanguage recognizes common Latin-script languages", () => {
  const cases: [string, string][] = [
    ["Quel est le meilleur projet de Mohamed ?", "fr"],
    ["Pourquoi devrais-je embaucher Mohamed ? Parle-moi de son expérience", "fr"],
    ["¿Cuál es el mejor proyecto de Mohamed?", "es"],
    ["Háblame sobre la experiencia de Mohamed con RAG", "es"],
    ["Was ist das beste Projekt von Mohamed?", "de"],
    ["Qual é o melhor projeto do Mohamed?", "pt"],
    ["Você pode falar sobre a experiência dele?", "pt"],
    ["Qual è il miglior progetto di Mohamed?", "it"],
    ["Mohamed'in en iyi projesi nedir?", "tr"],
  ];
  for (const [q, l] of cases) assert.equal(detectReplyLanguage(q), l, q);
});

test("detectReplyLanguage stays null for English, Arabic, and Arabizi", () => {
  for (const q of [
    "What is the best project?",
    "Why should I hire you?",
    "Tell me about RestAI architecture and the tradeoffs",
    "Is the model good for production use?",
    "Explain the RAG pipeline con and pro",
    "ما هو أفضل مشروع؟",
    "3ayez a3raf eh a7san project",
    "RestAI",
  ]) {
    assert.equal(detectReplyLanguage(q), null, q);
  }
});
