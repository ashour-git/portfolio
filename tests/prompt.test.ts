import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt, serializeContext, buildMessages, TEMPLATE_HINTS, AR_TEMPLATE_HINTS } from "../lib/copilot/prompt";
import type { RetrievalResult } from "../lib/copilot/types";

test("every mode prompt contains the scope gate and identity", () => {
  for (const mode of ["general", "recruiter", "interview", "architecture", "explore"]) {
    const p = buildSystemPrompt(mode as never);
    assert.ok(p.includes("Mohamed Ashour"));
    assert.ok(p.toLowerCase().includes("decline"));
    assert.ok(p.includes("fabricat"));
  }
});

test("recruiter and architecture prompts are distinct", () => {
  assert.notEqual(buildSystemPrompt("recruiter"), buildSystemPrompt("architecture"));
});

test("serializeContext numbers sources with titles", () => {
  const results: RetrievalResult[] = [
    { id: "x", label: "RestAI", title: "RestAI", source: { kind: "project", slug: "restai" }, score: 0.9, parts: {}, reasons: [], breakdown: [] },
    { id: "y", label: "RestAI", title: "Experience", source: { kind: "experience" }, score: 0.5, parts: {}, reasons: [], breakdown: [] },
  ];
  const s = serializeContext(results);
  assert.ok(s.includes("[1] RestAI"));
  assert.ok(s.includes("[2] Experience"));
});

test("history is capped at 6 turns and system is first", () => {
  const history = Array.from({ length: 10 }, (_, i) => ({ role: "user" as const, content: `m${i}` }));
  const msgs = buildMessages({ message: "hi", results: [], history });
  assert.equal(msgs[0].role, "system");
  assert.equal(msgs[msgs.length - 1].content, "hi");
  // system + ≤6 history + retrieval context + final user message
  assert.ok(msgs.length <= 9);
  const historyRoles = msgs.filter((m) => m.role === "user" || m.role === "assistant").length;
  assert.ok(historyRoles <= 8); // ≤6 history + context + final
});

test("plan-driven prompts embed section hints and fallback language", () => {
  const p = buildSystemPrompt("general", { template: "recruiter", stance: "high", card: "resume" });
  assert.ok(p.includes(TEMPLATE_HINTS.recruiter));
  const fb = buildSystemPrompt("general", { template: "general", stance: "fallback", card: "none", suggestions: ["Skills"] });
  assert.ok(fb.toLowerCase().includes("related topics"));
});

test("fallback plan routes suggestions into the context message", () => {
  const plan = { template: "general" as const, stance: "fallback" as const, card: "none" as const, suggestions: ["Skills", "Projects"] };
  const msgs = buildMessages({ message: "hi", plan, results: [] });
  const context = msgs.find((m) => m.content.startsWith("No supporting context"));
  assert.ok(context, "fallback context message expected");
  assert.ok(context.content.includes("Skills"));
});

test("recruiter template hints mention skills or experience sections", () => {
  const hint = TEMPLATE_HINTS.recruiter.toLowerCase();
  assert.ok(hint.includes("skills") || hint.includes("experience"));
});

test("English prompts are unchanged when lang is en or omitted", () => {
  assert.equal(buildSystemPrompt("recruiter"), buildSystemPrompt("recruiter", undefined, "en"));
  assert.ok(
    buildSystemPrompt("recruiter", { template: "recruiter", stance: "high", card: "none" }).includes(
      TEMPLATE_HINTS.recruiter,
    ),
  );
});

test("Arabic prompts contain MSA rules, tech-term preservation, and no raw URLs/citations", () => {
  const p = buildSystemPrompt("recruiter", undefined, "ar");
  assert.ok(p.includes("Mohamed Ashour"));
  assert.ok(/اللغة العربية الفصحى|Modern Standard Arabic/.test(p));
  assert.ok(p.includes("RAG"), "tech terms must be mentioned");
  assert.ok(p.includes("نقاط القوة"), "Arabic sections expected");
  assert.ok(!/https?:\/\/\S+/.test(p), "no raw URLs in Arabic system prompt");
  assert.ok(p.includes("مصدر"), "sources-by-name rule expected");
});

test("every Arabic template hint maps to an Arabic heading", () => {
  for (const t of ["recruiter", "project", "interview", "resume", "skills", "experience", "decision", "general"] as const) {
    const hint = AR_TEMPLATE_HINTS[t];
    assert.ok(hint && hint.length > 5, `missing Arabic hint for ${t}`);
    assert.ok(/[؀-ٿݐ-ݿࢠ-ࣿ]/.test(hint), `hint for ${t} must be Arabic`);
  }
});

test("Arabic mode strategies differ per mode", () => {
  const recruiter = buildSystemPrompt("recruiter", undefined, "ar");
  const architecture = buildSystemPrompt("architecture", undefined, "ar");
  const interview = buildSystemPrompt("interview", undefined, "ar");
  assert.notEqual(recruiter, architecture);
  assert.notEqual(recruiter, interview);
  assert.notEqual(architecture, interview);
});

test("Arabic context message asks for names instead of [N] citations", () => {
  const plan = { template: "general" as const, stance: "high" as const, card: "none" as const };
  const results: RetrievalResult[] = [
    { id: "hire", label: "Hire", title: "Why hire Mohamed", source: { kind: "hire" }, score: 0.9, parts: {}, reasons: [], breakdown: [] },
  ];
  const msgs = buildMessages({ message: "لماذا يجب أن أوظف محمد؟", lang: "ar", results, plan });
  const sys = msgs[0].content;
  assert.ok(/عربي|بالعربية/.test(sys), "system prompt must demand Arabic output");
  const context = msgs.find((m) => m.content.startsWith("السياق"));
  assert.ok(context, "Arabic context message expected");
  assert.ok(!context.content.includes("[1]"), "no [N] citation instruction in Arabic context");
});

test("answer budgets are adaptive per template and localized without numeric triggers", () => {
  const short = buildSystemPrompt("general", { template: "resume", stance: "high", card: "resume" });
  const long = buildSystemPrompt("general", { template: "recruiter", stance: "high", card: "resume" });
  assert.ok(/bullets only/i.test(short), "resume answers must stay short and scannable");
  assert.ok(/lead with evidence and numbers/i.test(long), "recruiter answers lead with evidence");
  assert.notEqual(short, long, "budgets must differ per template");
  const arShort = buildSystemPrompt("general", { template: "skills", stance: "high", card: "skills" }, "ar");
  assert.ok(/سهلة المسح/.test(arShort), "Arabic skills answers must stay scannable");
  const arRecruiter = buildSystemPrompt("general", { template: "recruiter", stance: "high", card: "resume" }, "ar");
  assert.ok(/ابدأ بالأدلة والأرقام/.test(arRecruiter), "Arabic recruiter answers lead with evidence");
  assert.ok(!/\d+\s*[-–]\s*\d+\s*words?/.test(long), "no numeric word budgets in English prompt");
  assert.ok(!/\d+\s*[-–]\s*\d+\s*كلمة/.test(arRecruiter), "no numeric word budgets in Arabic prompt");
});

test("system prompt demands a final-answer-only reply and forbids process narration", () => {
  const plain = buildSystemPrompt("general");
  assert.ok(/final-answer-only rule/i.test(plain), "answer-only directive must apply to every prompt");
  const p = buildSystemPrompt("recruiter", { template: "recruiter", stance: "high", card: "resume" });
  assert.ok(/never write that reasoning down/i.test(p), "must forbid writing reasoning down");
  assert.ok(/word-count checks/.test(p), "must explicitly forbid word-count checks that leaked into answers");
  assert.ok(
    p.toLowerCase().indexOf("final-answer-only") > p.toLowerCase().indexOf(TEMPLATE_HINTS.recruiter.toLowerCase()),
    "answer-only directive must be the final block so it carries the most weight",
  );
  const ar = buildSystemPrompt("recruiter", { template: "recruiter", stance: "high", card: "resume" }, "ar");
  assert.ok(/الرد النهائي فقط/.test(ar), "Arabic prompt must demand a final-answer-only reply");
  assert.ok(/لا تكتب هذا التفكير أبدًا/.test(ar), "Arabic prompt must forbid process narration");
  assert.ok(
    ar.indexOf("الرد النهائي فقط") > ar.indexOf(AR_TEMPLATE_HINTS.recruiter),
    "Arabic answer-only directive must be the final block",
  );
});
const ctxResults: RetrievalResult[] = [
  { id: "project-restai", label: "RestAI", title: "RestAI", source: { kind: "project" }, score: 0.9, parts: {}, reasons: [], breakdown: [] },
];
const OUTPUT_ONLY_RE = /^Final-answer-only rule/;
const AR_OUTPUT_ONLY_RE = /^قاعدة الرد النهائي فقط/;
const lastBlock = (p: string) => p.split("\n\n").at(-1) ?? "";

test("English prompt forbids talking about 'the context' and keeps OUTPUT_ONLY last", () => {
  const p = buildSystemPrompt("general", { template: "general", stance: "high", card: "none" });
  assert.ok(/never mention "the context"/i.test(p));
  assert.ok(/suggest a related question/i.test(p));
  assert.ok(OUTPUT_ONLY_RE.test(lastBlock(p)));
  const msgs = buildMessages({ message: "What is RestAI?", results: ctxResults });
  const ctx = msgs.find((m) => m.content.startsWith("Relevant context:"))!;
  assert.ok(/citing source numbers like \[1\]/.test(ctx.content));
  assert.ok(/do not refer to "the context"/i.test(ctx.content));
  assert.ok(!/Answer only from this context/.test(ctx.content));
});

test("Egyptian colloquial input switches the Arabic style to Egyptian; MSA otherwise", () => {
  const eg = buildMessages({ message: "عايز اعرف ايه احسن مشروع", lang: "ar", results: ctxResults })[0].content;
  assert.ok(eg.includes("بالعامية المصرية"));
  assert.ok(!eg.includes("اللغة العربية الفصحى"));
  assert.ok(AR_OUTPUT_ONLY_RE.test(lastBlock(eg)));
  const franco = buildMessages({ message: "3ayez a3raf eh a7san project 3amalto?", lang: "ar", results: ctxResults })[0].content;
  assert.ok(franco.includes("بالعامية المصرية"));
  const msa = buildMessages({ message: "ما هي أهم مهاراتك التقنية؟", lang: "ar", results: ctxResults })[0].content;
  assert.ok(msa.includes("اللغة العربية الفصحى"));
  assert.ok(!msa.includes("بالعامية المصرية"));
});

test("Latin-script non-English turns get a fluent reply-language directive", () => {
  const fr = buildMessages({ message: "Quel est le meilleur projet de Mohamed ?", results: ctxResults })[0].content;
  assert.ok(fr.includes("Answer fully and fluently in natural, idiomatic French"));
  assert.ok(fr.includes("[N] source citations"));
  assert.ok(/Never mention "the context"/.test(fr));
  assert.ok(OUTPUT_ONLY_RE.test(lastBlock(fr)), "OUTPUT_ONLY stays last");
  const es = buildMessages({ message: "¿Cuál es el mejor proyecto de Mohamed?", results: ctxResults })[0].content;
  assert.ok(es.includes("idiomatic Spanish"));
  const en = buildMessages({ message: "What is the best project?", results: ctxResults })[0].content;
  assert.ok(!en.includes("The visitor wrote in"));
});
