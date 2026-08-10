import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline, env } from "@huggingface/transformers";
import { buildChunks } from "../lib/copilot/corpus";
import { INTENT_CENTROIDS, INTENTS } from "../lib/copilot/intent";

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

  const centroidIds: string[] = [];
  const centroidData: number[][] = [];
  for (const intent of INTENTS) {
    if (intent === "general") continue;
    const phrases = INTENT_CENTROIDS[intent];
    const vecs: number[][] = [];
    for (const phrase of phrases) {
      const out = await extractor(phrase, { pooling: "mean", normalize: true });
      vecs.push(Array.from(out.data as Float32Array));
    }
    const cdim = vecs[0].length;
    const centroid = new Array(cdim).fill(0);
    for (const v of vecs) for (let i = 0; i < cdim; i++) centroid[i] += v[i];
    for (let i = 0; i < cdim; i++) centroid[i] /= vecs.length;
    centroidIds.push(intent);
    centroidData.push(centroid);
  }

  mkdirSync(indexDir, { recursive: true });
  writeFileSync(path.join(indexDir, "meta.json"), JSON.stringify({ chunks }, null, 2));
  writeFileSync(path.join(indexDir, "vectors.json"), JSON.stringify({ ids, dim, data }));
  writeFileSync(path.join(indexDir, "centroids.json"), JSON.stringify({ ids: centroidIds, dim, data: centroidData }));
  console.log(`wrote ${chunks.length} chunks, ${centroidIds.length} centroids, dim ${dim}, to ${indexDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});