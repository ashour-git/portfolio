import path from "node:path";
import type { Chunk } from "@/lib/copilot/types";
import meta from "@/lib/index/meta.json";
import vectors from "@/lib/index/vectors.json";

type Meta = { chunks: Chunk[] };
type Vectors = { ids: string[]; dim: number; data: number[][] };

let loaded: { chunks: Chunk[]; embeddings: Record<string, Float32Array> } | null = null;

export function loadIndex() {
  if (loaded) return loaded;
  const { chunks } = meta as Meta;
  const { ids, data } = vectors as Vectors;
  const embeddings: Record<string, Float32Array> = {};
  for (let i = 0; i < ids.length; i++) {
    embeddings[ids[i]] = Float32Array.from(data[i]);
  }
  loaded = { chunks, embeddings };
  return loaded;
}

type Embedder = (text: string) => Promise<Float32Array>;

let embedderPromise: Promise<Embedder> | null = null;

async function createEmbedder(): Promise<Embedder> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.cacheDir = path.join(process.cwd(), "models");
  env.localModelPath = path.join(process.cwd(), "models");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-V2", {
    dtype: "q8",
  });
  return async (text: string) => {
    const out = await extractor(text, { pooling: "mean", normalize: true });
    return out.data as Float32Array;
  };
}

export function getEmbedder(): Promise<Embedder> {
  if (!embedderPromise) {
    embedderPromise = createEmbedder();
  }
  return embedderPromise;
}