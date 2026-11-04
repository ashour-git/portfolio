/**
 * Deterministic behavior harness for the Engineering Copilot.
 *
 * Runs WITHOUT Groq: it exercises the real, offline pipeline — conversation
 * routing, input validation, intent classification, retrieval, language
 * filtering, planning, prompt grounding, and narration stripping. The local
 * MiniLM embedder is vendored under `models/`, so results are reproducible.
 *
 * Usage: npm run eval
 */
import cases from "./cases.json";
import { classifyConversation } from "../lib/copilot/conversation";
import { detectLanguage } from "../lib/copilot/language";
import { validateInput } from "../lib/copilot/service";
import { retrieveAndPlan } from "../lib/copilot/retrieval";
import { buildMessages } from "../lib/copilot/prompt";
import { ThinkingTagFilter } from "../lib/copilot/narration";
import { getEmbedder, loadIndex } from "../lib/copilot/index";
import type { Lang, Plan } from "../lib/copilot/types";

type Expect = {
  casual: boolean;
  lang?: Lang;
  intent?: string;
  template?: Plan["template"];
  stance?: Plan["stance"];
  isolation?: Lang;
  mustCite?: boolean;
  deduped?: string;
  maxResults?: number;
};

type EvalCase = { id: string; message: string; expect: Expect };

const ARABIC_RE = /[\u0600-\u06FF]/;
const chunkText = new Map(loadIndex().chunks.map((c) => [c.id, c.text]));

function textLang(id: string): Lang | "missing" {
  const text = chunkText.get(id);
  if (text === undefined) return "missing";
  return ARABIC_RE.test(text) ? "ar" : "en";
}

function contextMessage(messages: { role: string; content: string }[], lang: Lang): string {
  const prefix = lang === "ar" ? "السياق:" : "Relevant context:";
  return messages.find((m) => m.role === "user" && m.content.startsWith(prefix))?.content ?? "";
}

async function runCase(c: EvalCase): Promise<string[]> {
  const failures: string[] = [];
  const fail = (msg: string) => failures.push(msg);
  const { expect } = c;

  let message = c.message;
  const validation = validateInput({ message });
  if (!validation.ok) {
    fail(`input rejected: ${validation.error}`);
    return failures;
  }
  message = validation.data.message;

  if (expect.deduped !== undefined && message !== expect.deduped) {
    fail(`dedupe: expected "${expect.deduped}", got "${message}"`);
  }

  const conv = classifyConversation(message);
  if (conv.casual !== expect.casual) {
    fail(`casual: expected ${expect.casual}, got ${conv.casual}`);
  }

  const lang = detectLanguage(message);
  if (expect.lang !== undefined && lang !== expect.lang) {
    fail(`lang: expected ${expect.lang}, got ${lang}`);
  }

  // Casual turns must never reach retrieval.
  if (expect.casual) return failures;

  const { results, plan, intent } = await retrieveAndPlan({
    message,
    mode: "general",
    lang,
    getEmbedder,
  });

  if (expect.intent !== undefined && intent.primary !== expect.intent) {
    fail(`intent: expected ${expect.intent}, got ${intent.primary} (confidence ${intent.confidence.toFixed(2)})`);
  }
  if (expect.template !== undefined && plan.template !== expect.template) {
    fail(`template: expected ${expect.template}, got ${plan.template}`);
  }
  if (expect.stance !== undefined && plan.stance !== expect.stance) {
    fail(`stance: expected ${expect.stance}, got ${plan.stance}`);
  }
  if (expect.maxResults !== undefined && results.length > expect.maxResults) {
    fail(`results: expected <= ${expect.maxResults}, got ${results.length}`);
  }

  if (expect.isolation !== undefined) {
    if (results.length === 0) {
      fail("isolation: no grounded sources retrieved");
    }
    const wrong = results.filter((r) => textLang(r.id) !== expect.isolation);
    if (wrong.length > 0) {
      fail(
        `isolation: expected ${expect.isolation}-only sources, mixed in ${wrong
          .map((r) => `${r.id}(${textLang(r.id)})`)
          .join(", ")}`,
      );
    }
  }

  if (expect.mustCite !== undefined) {
    const messages = buildMessages({ message, results, plan, lang });
    const ctx = contextMessage(messages, lang);
    if (!ctx) {
      fail("citation: grounded context message missing");
    } else if (expect.mustCite) {
      if (!ctx.includes("[1]")) fail("citation: English context must instruct numbered citations ([1])");
      if (!/citing source numbers/i.test(ctx)) fail("citation: English context must ask for source numbers");
    } else {
      if (ctx.includes("[1]")) fail("citation: Arabic context must not request [1] citations");
      if (!ctx.includes("دون أرقام")) fail("citation: Arabic context must forbid numeric citations");
    }
  }

  return failures;
}

/** Reasoning must never leak into the streamed answer, in any chunking. */
function checkNarrationLeak(): string[] {
  const failures: string[] = [];
  const reply =
    "<thinking>\nThinking Process:\n1. The user asked about RestAI.\n2. Check word count.\n</thinking>\n\n### Overview\nRestAI is a RAG assistant [1].\n";
  const chunkings: string[][] = [
    [reply],
    reply.split(/(?<=\n)/),
    ["<thinking>\nThinking Process:\n", "1. Analyze.\n2. Draft.\n", "</thinking>\n", "### Overview\nRestAI is a RAG assistant [1].\n"],
  ];
  for (const [i, chunks] of chunkings.entries()) {
    const filter = new ThinkingTagFilter();
    const out: string[] = [];
    for (const chunk of chunks) out.push(...filter.push(chunk));
    out.push(...filter.flush());
    const text = out.join("");
    if (!text.includes("### Overview")) failures.push(`leak[${i}]: answer heading was dropped`);
    if (!text.includes("RestAI is a RAG assistant")) failures.push(`leak[${i}]: answer body was dropped`);
    if (/thinking/i.test(text)) failures.push(`leak[${i}]: reasoning text survived`);
    if (/<\/?think/i.test(text)) failures.push(`leak[${i}]: reasoning tag survived`);
  }
  return failures;
}

async function main(): Promise<void> {
  let passed = 0;
  const failures: string[] = [];

  for (const c of cases as EvalCase[]) {
    const problems = await runCase(c);
    if (problems.length === 0) {
      passed++;
      console.log(`PASS  ${c.id}`);
    } else {
      console.log(`FAIL  ${c.id}`);
      for (const p of problems) console.log(`      ${p}`);
      failures.push(c.id);
    }
  }

  const leakProblems = checkNarrationLeak();
  if (leakProblems.length === 0) {
    console.log("PASS  narration-leak");
    passed++;
  } else {
    console.log("FAIL  narration-leak");
    for (const p of leakProblems) console.log(`      ${p}`);
    failures.push("narration-leak");
  }

  const total = cases.length + 1;
  console.log("");
  console.log(`${passed}/${total} checks passed`);
  if (failures.length > 0) {
    console.log(`failed: ${failures.join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("eval crashed:", err);
  process.exitCode = 1;
});
