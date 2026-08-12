import type { Lang } from "@/lib/copilot/types";

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_RE = /[A-Za-z\u00C0-\u024F]/;

export function detectLanguage(message: string): Lang {
  let ar = 0;
  let en = 0;
  let first: "ar" | "en" | null = null;
  for (const ch of message) {
    if (ARABIC_RE.test(ch)) {
      if (first === null) first = "ar";
      ar++;
    } else if (LATIN_RE.test(ch)) {
      if (first === null) first = "en";
      en++;
    }
  }
  if (ar === 0 && en === 0) return "en";
  if (first === "ar") return "ar";
  return ar > en ? "ar" : "en";
}

export const TECH_TERMS: string[] = [
  "Next.js", "scikit-learn", "TensorFlow", "LangChain", "Transformers", "TypeScript",
  "PostgreSQL", "Kubernetes", "LightGBM", "XGBoost", "Redis", "MongoDB", "Qdrant",
  "Milvus", "Airflow", "Python", "Jupyter", "React", "Vercel", "pgvector", "FastAPI",
  "PyTorch", "MLflow", "MLOps", "GitHub", "LinkedIn", "Docker", "OpenCV", "Kafka",
  "LLMs", "LLM", "RAG", "API", "APIs",
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildTokenPattern(terms: string[]): RegExp {
  const sorted = [...terms].sort((a, b) => b.length - a.length).map(escapeRe);
  const termAlt = sorted.map((t) => `(?<![A-Za-z0-9])${t}(?![A-Za-z0-9])`).join("|");
  return new RegExp(
    [
      "(?:https?://|www\\.)[^\\s<>()\\[\\]]+",
      "[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+",
      "[~≈±]?\\d[\\d,]*(?:\\.\\d+)?(?:\\s*(?:ms|MB|GB|KB|s|%))?(?:\\s*[/+]\\s*\\d+)?(?:\\s*\\+)?",
      termAlt,
    ].join("|"),
    "giu",
  );
}

export type BidiSegment = { text: string; ltr: boolean };

export function isolateLtrTokens(text: string): BidiSegment[] {
  const pattern = buildTokenPattern(TECH_TERMS);
  const segments: BidiSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const start = m.index ?? 0;
    if (start > last) segments.push({ text: text.slice(last, start), ltr: false });
    segments.push({ text: m[0], ltr: true });
    last = start + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), ltr: false });
  return segments;
}