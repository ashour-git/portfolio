import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyConversation, casualReply } from "../lib/copilot/conversation";

const AR_CASUAL = [
  "أزيك؟",
  "عامل إيه؟",
  "قول أزيك",
  "شكراً",
  "تمام",
  "هاي",
  "السلام عليكم",
  "مساء الخير",
  "باي",
  "مع السلامة",
  "ممكن تساعدني",
  "مش فاهم",
];

const AR_PORTFOLIO = [
  "مين محمد؟",
  "عرفني بمحمد",
  "ما خبرته في RAG؟",
  "احكيلي عن RestAI",
  "اشرح معمارية RestAI",
  "فين GitHub؟",
  "إيه أهم مشاريعه؟",
  "ليه أوظف محمد؟",
  "خبرة محمد في RAG",
];

const EN_CASUAL = [
  "Hi",
  "How are you?",
  "Thanks",
  "Good morning",
  "bye",
  "you're welcome",
  "what can you do",
];

const EN_PORTFOLIO = [
  "Who is Mohamed?",
  "Tell me about Mohamed",
  "What is his RAG experience?",
  "Tell me about RestAI",
  "Explain RestAI architecture",
  "Where is his GitHub?",
  "Why should I hire Mohamed?",
];

const MIXED_PORTFOLIO = [
  "أزيك؟ Tell me about RestAI",
  "اشرحلي RAG architecture",
  "فين GitHub بتاع محمد؟",
];

test("Arabic casual messages are detected as casual", () => {
  for (const m of AR_CASUAL) {
    const r = classifyConversation(m);
    assert.equal(r.casual, true, `expected casual: ${m}`);
  }
});

test("Arabic portfolio messages are NOT casual", () => {
  for (const m of AR_PORTFOLIO) {
    const r = classifyConversation(m);
    assert.equal(r.casual, false, `expected portfolio: ${m}`);
  }
});

test("English casual messages are detected as casual", () => {
  for (const m of EN_CASUAL) {
    const r = classifyConversation(m);
    assert.equal(r.casual, true, `expected casual: ${m}`);
  }
});

test("English portfolio messages are NOT casual", () => {
  for (const m of EN_PORTFOLIO) {
    const r = classifyConversation(m);
    assert.equal(r.casual, false, `expected portfolio: ${m}`);
  }
});

test("mixed Arabic/English messages route to portfolio (substantive query wins)", () => {
  for (const m of MIXED_PORTFOLIO) {
    const r = classifyConversation(m);
    assert.equal(r.casual, false, `expected portfolio: ${m}`);
  }
});

test("casual greeting returns the expected deterministic reply", () => {
  const ar = casualReply("greeting", "ar");
  const en = casualReply("greeting", "en");
  assert.match(ar, /المساعد الهندسي لمحمد/);
  assert.match(en, /Engineering Copilot/);
  assert.doesNotMatch(ar, /لا توجد معلومات/);
  assert.doesNotMatch(en, /no information/);
});

test("'أزيك يا محمد' is casual even though it mentions the name", () => {
  assert.equal(classifyConversation("أزيك يا محمد").casual, true);
});

test("casual messages carry shouldRetrieve=false", () => {
  const r = classifyConversation("شكراً");
  assert.equal(r.casual, true);
  if (r.casual) assert.equal(r.shouldRetrieve, false);
});

test("typoed recruiter queries with greeting prefix are NOT casual (human-like typo tolerance)", () => {
  const cases = [
    "hi , whay I should hire u",
    "hi, whay I should hire u",
    "whay I should hire u",
    "hire u why????",
    "why I should hire u",
    "hi whay should i hire you",
  ];
  for (const m of cases) {
    const r = classifyConversation(m);
    assert.equal(r.casual, false, `expected portfolio (typo-tolerant): ${m} got casual=${r.casual}`);
  }
});
