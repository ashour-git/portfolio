/**
 * Precompute real retrievals for the memory map's example questions.
 * Uses the copilot's own offline pipeline (vendored MiniLM, no Groq), so
 * the lit-up documents are exactly what the copilot would retrieve.
 *
 *   npx tsx scripts/memory-demo.ts   ->  lib/memory-demo.json
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { retrieveAndPlan } from "../lib/copilot/retrieval";
import { getEmbedder } from "../lib/copilot/index";

const QUESTIONS = [
  "How does RestAI ground its answers?",
  "Which projects use computer vision?",
  "What did you work on at SustainGRC?",
  "How is Text-to-SQL kept safe?",
];

async function main() {
  const out = [];
  for (const q of QUESTIONS) {
    const { results, retrievalMs } = await retrieveAndPlan({ message: q, mode: "general", lang: "en", getEmbedder });
    out.push({
      question: q,
      retrievalMs: Math.round(retrievalMs),
      hits: results.slice(0, 5).map((r) => ({ id: r.id, score: Math.round(r.score * 1000) / 1000 })),
    });
    console.log(q, "->", results.slice(0, 5).map((r) => r.id).join(", "));
  }
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  writeFileSync(path.join(root, "lib/memory-demo.json"), JSON.stringify(out, null, 1) + "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
