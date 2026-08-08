import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline, env } from "@huggingface/transformers";
import { buildChunks } from "../lib/copilot/corpus";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const modelsDir = path.join(root, "models");
const indexDir = path.join(root, "lib", "index");

env.cacheDir = modelsDir;
env.localModelPath = modelsDir;

async function main() {
  const chunks = buildChunks();

  // Allow a download in dev so the model lands in models/ (then it is committed).
  env.allowRemoteModels = true;
  env.allowLocalModels = true;

  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-V2", {
    dtype: "q8",
  });

  const ids: string[] = [];
  const data: number[][] = [];
  for (const chunk of chunks) {
    const out = await extractor(chunk.text, { pooling: "mean", normalize: true });
    const arr = Array.from(out.data as Float32Array);
    ids.push(chunk.id);
    data.push(arr);
  }
  const dim = data[0].length;

  mkdirSync(indexDir, { recursive: true });
  writeFileSync(path.join(indexDir, "meta.json"), JSON.stringify({ chunks }, null, 2));
  writeFileSync(path.join(indexDir, "vectors.json"), JSON.stringify({ ids, dim, data }));
  console.log(`wrote ${chunks.length} chunks, dim ${dim}, to ${indexDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});