import { tokenize } from "./rewrite";

export const BM25_K1 = 1.2;
export const BM25_B = 0.75;
/** raw / (raw + NORM) maps unbounded BM25 into 0..1. Centralized for retuning. */
export const BM25_NORM = 4;

export const STOPWORDS = new Set(
  ("the and for are but not you your yours with what which who whom whose this that these those " +
    "was were has have had his her him its from they them their there here how why when where " +
    "can could would should will did does doing done about into over than then also just more " +
    "most some such only own same very all any each few other tell me show give explain please " +
    "want know like").split(" "),
);

/** `slug` is the canonical project id (e.g. "text2sql") — often absent from prose that says "Text-to-SQL". */
export type Bm25Doc = { id: string; text: string; keywords: string[]; title?: string; slug?: string };
export type Bm25Index = { score(queryTokens: string[], docId: string): number; size: number };

export function bm25Tokens(text: string): string[] {
  return tokenize(text).filter((t) => !STOPWORDS.has(t));
}

const EMPTY: Bm25Index = { score: () => 0, size: 0 };

/** Okapi BM25 over title + slug + keywords + text; returns a normalized 0..1 score. */
export function createBm25Index(docs: Bm25Doc[]): Bm25Index {
  try {
    const tf = new Map<string, Map<string, number>>();
    const len = new Map<string, number>();
    const df = new Map<string, number>();
    for (const d of docs) {
      const toks = bm25Tokens(`${d.title ?? ""} ${d.slug ?? ""} ${(d.keywords ?? []).join(" ")} ${d.text ?? ""}`);
      const counts = new Map<string, number>();
      for (const t of toks) counts.set(t, (counts.get(t) ?? 0) + 1);
      for (const t of counts.keys()) df.set(t, (df.get(t) ?? 0) + 1);
      tf.set(d.id, counts);
      len.set(d.id, toks.length);
    }
    const n = tf.size;
    if (n === 0) return EMPTY;
    const avgdl = [...len.values()].reduce((a, b) => a + b, 0) / n || 1;
    const idf = (t: string) => {
      const f = df.get(t) ?? 0;
      return Math.log(1 + (n - f + 0.5) / (f + 0.5));
    };
    return {
      size: n,
      score(queryTokens, docId) {
        const counts = tf.get(docId);
        if (!counts) return 0;
        const dl = len.get(docId) ?? 0;
        let raw = 0;
        for (const t of new Set(queryTokens)) {
          const f = counts.get(t);
          if (!f) continue;
          raw += (idf(t) * f * (BM25_K1 + 1)) / (f + BM25_K1 * (1 - BM25_B + (BM25_B * dl) / avgdl));
        }
        return raw / (raw + BM25_NORM);
      },
    };
  } catch {
    return EMPTY;
  }
}

let cached: Bm25Index | null = null;

/** Lazily built once per process from the provided docs; fails safe to an empty index. */
export function getBm25Index(load: () => Bm25Doc[]): Bm25Index {
  if (cached) return cached;
  try {
    cached = createBm25Index(load());
  } catch {
    cached = EMPTY;
  }
  return cached;
}

/** Test seam. */
export function __resetBm25Cache(): void {
  cached = null;
}
