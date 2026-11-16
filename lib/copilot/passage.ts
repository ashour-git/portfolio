import { tokenize } from "./rewrite";

/** Slice to at most `n` UTF-16 units without splitting a surrogate pair. */
export function safeSlice(s: string, n: number): string {
  if (n <= 0) return "";
  if (s.length <= n) return s;
  const code = s.charCodeAt(n - 1);
  return s.slice(0, code >= 0xd800 && code <= 0xdbff ? n - 1 : n);
}

export const PASSAGE_LABELS = [
  "Project", "Tagline", "Summary", "Problem", "Solution", "Decisions", "Architecture",
  "Performance", "Stack", "Impact", "Study", "Model choice", "Tradeoffs", "Challenges",
  "Deployment", "Lessons", "Observability",
] as const;

/** Small tie-breaking prior: segments that carry outcomes and reasoning win ties. */
const LABEL_WEIGHT: Record<string, number> = {
  Summary: 0.3, Impact: 0.3, Tradeoffs: 0.25, Decisions: 0.25, Architecture: 0.2,
  Performance: 0.2, Lessons: 0.15, "Model choice": 0.15, Solution: 0.1, Stack: 0.1,
};

const LABEL_RE = new RegExp(`(?<=^|\\s)(?:${PASSAGE_LABELS.join("|")}):\\s`, "g");

function labelOf(segment: string): string | undefined {
  const m = segment.match(new RegExp(`^(${PASSAGE_LABELS.join("|")}):`));
  return m?.[1];
}

/**
 * Splits a chunk into labeled blocks ("Impact: ..." runs until the next
 * allowlisted label; ` | ` lists stay inside their block). Text with no
 * allowlisted label falls back to sentence segmentation on periods.
 */
export function splitPassages(text: string): string[] {
  if (typeof text !== "string" || text.length === 0) return [];
  const starts = [...text.matchAll(LABEL_RE)].map((m) => m.index ?? 0);
  if (starts.length === 0) {
    return text.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
  }
  const out: string[] = [];
  if (starts[0] > 0) out.push(text.slice(0, starts[0]).trim());
  for (let i = 0; i < starts.length; i++) out.push(text.slice(starts[i], starts[i + 1] ?? text.length).trim());
  return out.filter(Boolean);
}

/**
 * Picks the most query-relevant segments up to `maxChars` instead of blind
 * head truncation. The first segment (identity: project name, domain) is
 * always kept; the rest are ranked by query overlap + label weight and
 * emitted in document order.
 */
export function selectPassage(text: string, queryTokens: string[], opts: { maxChars?: number } = {}): string {
  const max = opts.maxChars ?? 1200;
  if (typeof text !== "string") return "";
  if (text.length <= max) return text;
  const segments = splitPassages(text);
  if (segments.length <= 1) return safeSlice(text, max);

  const q = new Set((queryTokens ?? []).map((t) => t.toLowerCase()));
  const first = safeSlice(segments[0], max);
  const ranked = segments
    .slice(1)
    .map((seg, i) => {
      const toks = new Set(tokenize(seg));
      let overlap = 0;
      for (const t of q) if (toks.has(t)) overlap++;
      return { i: i + 1, seg, score: overlap + (LABEL_WEIGHT[labelOf(seg) ?? ""] ?? 0) };
    })
    .sort((a, b) => b.score - a.score || a.i - b.i);

  const picked = new Set<number>([0]);
  let used = first.length;
  for (const r of ranked) {
    const cost = r.seg.length + 1;
    if (used + cost <= max) {
      picked.add(r.i);
      used += cost;
    }
  }
  return [first, ...segments.slice(1).filter((_, i) => picked.has(i + 1))].join(" ");
}
