# Engineering Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Groq-powered, fact-grounded RAG assistant — the Engineering Copilot — as a full-screen glass modal on the portfolio, with a typed streaming event protocol, explainable retrieval, and observable stats.

**Architecture:** A build-time script derives a Markdown corpus from `lib/data.ts`, embeds it locally (all-MiniLM-L6-v2, quantized ONNX), and commits a JSON vector index. A Node.js API route (`app/api/copilot/route.ts`) rate-limits, embeds the one incoming query, scores chunks (cosine + keyword + mode boost), builds a mode-scoped system prompt, streams Groq deltas as typed NDJSON `CopilotEvent`s, and reports tokens/latency/cache stats. A lazy-loaded full-screen glass modal client reduces those events into streamed markdown, citation chips, a structured architecture card, and an "explain why" sources panel.

**Tech Stack:** Next.js 15 (App Router, Node runtime route), React 19, Tailwind v4, framer-motion ^13, `@huggingface/transformers` (local ONNX embeddings), plain `fetch` to Groq's OpenAI-compatible API, `react-markdown` + `remark-gfm` + `react-syntax-highlighter`, `node:test` via `tsx`.

## Global Constraints

- **Env:** Groq key in `GROQ_API_KEY` only, from `.env.local`. `.gitignore` already ignores `.env*`; add `!.env.example` so a committed example is allowed.
- **Model (Groq):** `llama-3.3-70b-versatile`. Base URL `https://api.groq.com/openai/v1/chat/completions`.
- **Embeddings:** all-MiniLM-L6-V2 quantized (`dtype: "q8"`). Local only: model files committed under `models/`, corpus vectors committed under `lib/index/`. **No runtime model downloads** (`env.allowRemoteModels = false`).
- **Wire protocol:** exact `CopilotEvent` union from spec §3; NDJSON (one JSON per line). Canonical event order per run: `meta → sources → card → delta* → stats → done`. Errors: single `error` event then close.
- **Retrieval:** top-k `k=5`, min-score `0.25`, weights `0.6 cosine / 0.3 keyword / 0.1 boost`; `RetrievalResult` carries `parts` + `reasons[]` (spec §4.1).
- **Limits:** message ≤ 600 chars; history ≤ 6 turns; rate limit 5/min + 30/hr per IP (spec D4).
- **No content duplication:** corpus is derived from `lib/data.ts` exports; never re-typed.
- **Design:** use existing tokens/classes (`glass`, `glass-strong`, `border-line`, `bg-bg`, `text-ink*`, `bg-accent`, serif/mono fonts), motion tokens from `lib/motion.ts`, respect `MotionProvider reducedMotion="user"`. No new color system, no particles.
- **Gates:** `npm test` (all pass) and `npm run build` (green) are required. `next lint` is unavailable in this repo (no ESLint config) — do not run it.
- **Runtime deps to add (exact):** `@huggingface/transformers`, `react-markdown`, `remark-gfm`, `react-syntax-highlighter`. Dev deps: `tsx`, `@types/react-syntax-highlighter`. No other new packages.
- **next.config.ts:** add `serverExternalPackages: ["@huggingface/transformers"]` so the route stays Node-runtime friendly.

---

### Task 1: Dependencies, scripts, and config

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`
- Modify: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` script, `npm run build:kb` script, `serverExternalPackages` in Next config, committed `.env.example` documenting `GROQ_API_KEY`.

- [ ] **Step 1: Install runtime dependencies**

Run:
```bash
npm install @huggingface/transformers react-markdown remark-gfm react-syntax-highlighter
npm install -D tsx @types/react-syntax-highlighter
```

- [ ] **Step 2: Add scripts to `package.json`**

In `package.json`, set `scripts` to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "build:kb": "tsx scripts/build-kb.ts",
  "start": "next start",
  "lint": "next lint",
  "test": "tsx --test tests/"
}
```

- [ ] **Step 3: Update `next.config.ts`**

Replace the file contents with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@huggingface/transformers"],
};

export default nextConfig;
```

- [ ] **Step 4: Update `.gitignore`**

Append the exception line so the example env file can be committed:

```gitignore
.env*
!.env.example
```

- [ ] **Step 5: Create `.env.example`**

```bash
# Groq API key for the Engineering Copilot route (server-side only).
GROQ_API_KEY=your_key_here
```

- [ ] **Step 6: Verify install**

Run:
```bash
npm ls @huggingface/transformers react-markdown remark-gfm react-syntax-highlighter tsx
```
Expected: all five listed at the expected top-level versions.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json next.config.ts .gitignore .env.example
git commit -m "chore(copilot): add RAG + streaming deps, test script, server externals"
```

---

### Task 2: Copilot type contracts

**Files:**
- Create: `lib/copilot/types.ts`
- Test: `tests/types.test.ts`

**Interfaces:**
- Consumes: nothing (pure types).
- Produces: the canonical types every later task imports:
  - `CopilotMode = "general" | "recruiter" | "interview" | "architecture" | "explore"`
  - `SourceKind = "project" | "skill" | "principle" | "experience" | "insight" | "resume" | "stats"`
  - `Chunk` (indexed unit), `RetrievalResult` (spec §4.1), `CopilotCard`
  - `CopilotEvent` union (spec §3), `ChatMessage`, `RequestBody`

- [ ] **Step 1: Write the failing test**

Create `tests/types.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type {
  CopilotEvent,
  CopilotMode,
  RetrievalResult,
  RequestBody,
} from "../lib/copilot/types";

const modes: CopilotMode[] = ["general", "recruiter", "interview", "architecture", "explore"];

test("modes are the five approved values", () => {
  assert.deepEqual(modes.sort(), ["architecture", "explore", "general", "interview", "recruiter"]);
});

test("a RetrievalResult carries decomposed parts and reasons", () => {
  const r: RetrievalResult = {
    id: "chunk-restai-1",
    title: "RestAI — study",
    source: { kind: "project", slug: "restai" },
    score: 0.81,
    parts: { cosine: 0.81, keyword: 0.4, boost: 0.1 },
    reasons: ["cosine 0.81", "keyword 'restai'"],
  };
  assert.equal(r.parts.cosine, 0.81);
  assert.ok(r.reasons.length >= 1);
});

test("every CopilotEvent literal satisfies the union discriminator", () => {
  const events: CopilotEvent[] = [
    { type: "meta", id: "req-1", mode: "general", model: "llama-3.3-70b-versatile", startedAt: 1 },
    { type: "delta", text: "hi" },
    { type: "sources", sources: [] },
    { type: "card", card: { kind: "project", slug: "restai", title: "RestAI" } },
    { type: "stats", tokens: { in: 10, out: 5 }, retrievalMs: 12, totalMs: 50, cache: "miss" },
    { type: "done", finish: "stop" },
    { type: "error", code: 429, message: "rate limited" },
  ];
  for (const e of events) assert.ok("type" in e);
});

test("RequestBody shape matches the wire contract", () => {
  const body: RequestBody = { message: "What did you build?", mode: "recruiter", history: [] };
  assert.equal(body.message.length > 0, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../lib/copilot/types'".

- [ ] **Step 3: Write the types module**

Create `lib/copilot/types.ts`:

```ts
export type CopilotMode =
  | "general"
  | "recruiter"
  | "interview"
  | "architecture"
  | "explore";

export const COPILOT_MODES: CopilotMode[] = [
  "general",
  "recruiter",
  "interview",
  "architecture",
  "explore",
];

export type SourceKind =
  | "project"
  | "skill"
  | "principle"
  | "experience"
  | "insight"
  | "resume"
  | "stats";

export type Chunk = {
  id: string;
  title: string;
  text: string;
  source: { kind: SourceKind; slug?: string; url?: string };
  keywords: string[];
};

export type RetrievalResult = {
  id: string;
  title: string;
  source: { kind: SourceKind; slug?: string; url?: string };
  score: number;
  parts: { cosine?: number; keyword?: number; boost?: number };
  reasons: string[];
};

export type CopilotCard =
  | { kind: "project"; slug: string; title: string }
  | { kind: "resume"; title: string };

export type CopilotEvent =
  | { type: "meta"; id: string; mode: CopilotMode; model: string; startedAt: number }
  | { type: "delta"; text: string }
  | { type: "sources"; sources: RetrievalResult[] }
  | { type: "card"; card: CopilotCard | null }
  | {
      type: "stats";
      tokens: { in: number; out: number };
      retrievalMs: number;
      totalMs: number;
      cache: "hit" | "build" | "miss";
    }
  | { type: "done"; finish: "stop" | "length" }
  | { type: "error"; code: number; message: string };

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type RequestBody = {
  message: string;
  mode?: CopilotMode;
  history?: { role: "user" | "assistant"; content: string }[];
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (types module resolves).

- [ ] **Step 5: Commit**

```bash
git add lib/copilot/types.ts tests/types.test.ts
git commit -m "feat(copilot): typed CopilotEvent protocol and retrieval contracts"
```

---

### Task 3: Corpus builder (derived from `lib/data.ts`)

**Files:**
- Create: `lib/copilot/corpus.ts`
- Test: `tests/corpus.test.ts`

**Interfaces:**
- Consumes: `Chunk`, `SourceKind` from `lib/copilot/types`; exports of `lib/data.ts` (`profile`, `stats`, `projects`, `experience`, `skills`, `principles`, `insights`, `trajectory`, `githubStats`).
- Produces: `buildChunks(): Chunk[]` — deterministic, one chunk per project (all fields + study), plus one chunk each for skills/principles/experience/insights/resume/stats/trajectory. Chunk ids stable and unique.

- [ ] **Step 1: Write the failing test**

Create `tests/corpus.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChunks } from "../lib/copilot/corpus";
import { projects } from "../lib/data";

test("corpus has one project chunk per project", () => {
  const chunks = buildChunks();
  const projectChunks = chunks.filter((c) => c.source.kind === "project");
  assert.equal(projectChunks.length, projects.length);
});

test("every project chunk id is unique and stable", () => {
  const chunks = buildChunks();
  const ids = chunks.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("project chunks carry source slug, url, keywords and rich text", () => {
  const chunks = buildChunks();
  const restai = chunks.find((c) => c.source.slug === "restai");
  assert.ok(restai);
  assert.equal(restai.source.kind, "project");
  assert.ok(restai.source.url);
  assert.ok(restai.keywords.includes("restai"));
  assert.ok(restai.text.length > 200);
  assert.ok(restai.text.includes("study") || restai.text.includes("architecture"));
});

test("support sections are present", () => {
  const kinds = buildChunks().map((c) => c.source.kind);
  for (const k of ["skill", "principle", "experience", "insight", "resume", "stats"]) {
    assert.ok(kinds.includes(k), `missing ${k}`);
  }
});

test("buildChunks is deterministic", () => {
  assert.deepEqual(buildChunks(), buildChunks());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../lib/copilot/corpus'".

- [ ] **Step 3: Write the corpus module**

Create `lib/copilot/corpus.ts`:

```ts
import type { Chunk, SourceKind } from "@/lib/copilot/types";
import {
  profile,
  stats,
  projects,
  experience,
  skills,
  principles,
  insights,
  trajectory,
  githubStats,
} from "@/lib/data";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function keywordsFrom(...parts: string[]): string[] {
  const set = new Set<string>();
  for (const part of parts) {
    for (const w of part.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length >= 3) set.add(w);
    }
  }
  return [...set];
}

export function buildChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  for (const p of projects) {
    const study = p.study;
    const text = [
      `Project: ${p.title}. Domain: ${p.domain}.`,
      `Tagline: ${p.tagline}`,
      `Summary: ${p.summary ?? ""}`,
      `Problem: ${p.problem}`,
      `Solution: ${p.solution}`,
      `Decisions: ${p.decisions.map((d) => `${d.title}: ${d.body}`).join(" | ")}`,
      `Architecture: ${p.architecture.nodes.map((n) => n.label + (n.sub ? ` (${n.sub})` : "")).join(" → ")}${p.architecture.caption ? ` — ${p.architecture.caption}` : ""}`,
      `Performance: ${p.performance.map((x) => `${x.value} ${x.label}`).join(", ")}`,
      `Stack: ${p.stack.join(", ")}`,
      `Impact: ${p.impact ? p.impact.join(", ") : ""}`,
      study
        ? [
            `Study: Requirements: ${study.requirements.join(" | ")}`,
            `Model choice: ${study.modelChoice}`,
            `Tradeoffs: ${study.tradeoffs.map((t) => `${t.choice} → ${t.cost}`).join(" | ")}`,
            `Challenges: ${study.challenges.join(" | ")}`,
            `Deployment: ${study.deployment}`,
            `Lessons: ${study.lessons.join(" | ")}`,
            `Observability: ${study.observability.tools.join(", ")}`,
          ].join(" ")
        : "",
    ].join(" ");

    chunks.push({
      id: `project-${p.study?.slug ?? slugify(p.title)}`,
      title: `${p.title} — ${p.domain}`,
      text,
      source: {
        kind: "project",
        slug: p.study?.slug ?? slugify(p.title),
        url: p.href,
      },
      keywords: keywordsFrom(p.title, p.domain, p.tagline, p.stack.join(" ")),
    });
  }

  const push = (id: string, kind: SourceKind, title: string, text: string, kw: string[]) =>
    chunks.push({ id, title, text, source: { kind }, keywords: kw });

  push(
    "resume",
    "resume",
    "Resume summary",
    `Name: ${profile.name}. Roles: ${profile.roles.join(", ")}. Location: ${profile.location}. Email: ${profile.email}. LinkedIn: ${profile.linkedin}. GitHub: ${profile.github}. Resume PDF: ${profile.resume}.`,
    keywordsFrom(profile.name, ...profile.roles),
  );

  push(
    "stats",
    "stats",
    "Key statistics",
    `Stats: ${stats.map((s) => `${s.value} ${s.label}`).join(". ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join(". ")}.`,
    keywordsFrom("stats", "tests", "latency", "books", "repositories"),
  );

  push(
    "skills",
    "skill",
    "Skills by discipline",
    skills.map((g) => `${g.title}: ${g.items.join(", ")}`).join(". "),
    keywordsFrom(skills.map((g) => g.items.join(" ")).join(" ")),
  );

  push(
    "principles",
    "principle",
    "Engineering principles",
    principles.map((p) => `${p.index} ${p.title}: ${p.body}`).join(". "),
    keywordsFrom(principles.map((p) => `${p.title} ${p.body}`).join(" ")),
  );

  push(
    "experience",
    "experience",
    "Work experience",
    experience
      .map((r) => `${r.title} at ${r.company} (${r.period}): ${r.points.join(" ")}`)
      .join(". "),
    keywordsFrom(experience.map((r) => `${r.title} ${r.company} ${r.points.join(" ")}`).join(" ")),
  );

  push(
    "trajectory",
    "experience",
    "Career trajectory",
    trajectory.map((t) => `${t.period} ${t.title}: ${t.body} [${t.tags.join(", ")}]`).join(". "),
    keywordsFrom(trajectory.map((t) => `${t.title} ${t.tags.join(" ")}`).join(" ")),
  );

  push(
    "insights",
    "insight",
    "Writing and research",
    insights.map((i) => `${i.index} ${i.title}: ${i.body} (${i.href}, ${i.tag})`).join(". "),
    keywordsFrom(insights.map((i) => `${i.title} ${i.body} ${i.tag}`).join(" ")),
  );

  return chunks;
}
```

Note: `@/` alias works in app code (tsconfig paths). For the `tsx`-based tests this module is imported transitively by tests via `../lib/copilot/corpus` — `tsx` resolves tsconfig paths, so `@/lib/data` resolves.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all five corpus assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/copilot/corpus.ts tests/corpus.test.ts
git commit -m "feat(copilot): derive knowledge corpus from lib/data.ts"
```

---

### Task 4: Retrieval scoring (cosine + keyword + mode boost)

**Files:**
- Create: `lib/copilot/scoring.ts`
- Test: `tests/scoring.test.ts`

**Interfaces:**
- Consumes: `Chunk`, `RetrievalResult`, `CopilotMode` from `lib/copilot/types`.
- Produces:
  - `cosine(a: Float32Array, b: Float32Array): number`
  - `keywordOverlap(queryTokens: string[], keywords: string[]): number`
  - `retrieveTopK(queryVec: Float32Array, queryTokens: string[], chunks: Chunk[], opts: { k?: number; minScore?: number; weights?: { cosine: number; keyword: number; boost: number }; mode?: CopilotMode; embeddings: Record<string, Float32Array> }): RetrievalResult[]`
  - `MODE_BOOST: Record<CopilotMode, Partial<Record<SourceKind, number>>>` — recruiter boosts experience/skills/resume/stats; interview boosts project; architecture boosts project; explore boosts principle/insight.

- [ ] **Step 1: Write the failing test**

Create `tests/scoring.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { cosine, keywordOverlap, retrieveTopK, MODE_BOOST } from "../lib/copilot/scoring";
import type { Chunk } from "../lib/copilot/types";

test("cosine of identical vectors is 1, orthogonal is 0", () => {
  assert.ok(Math.abs(cosine(new Float32Array([1, 0]), new Float32Array([1, 0])) - 1) < 1e-6);
  assert.ok(Math.abs(cosine(new Float32Array([1, 0]), new Float32Array([0, 1]))) < 1e-6);
});

test("keywordOverlap returns matched fraction of query tokens", () => {
  const kw = ["rag", "retrieval", "vector"];
  assert.equal(keywordOverlap(["rag", "vector", "zzz"], kw), 2 / 3);
  assert.equal(keywordOverlap(["nope"], kw), 0);
});

test("retrieveTopK scores, ranks, and caps results", () => {
  const emb = {
    a: new Float32Array([1, 0]),
    b: new Float32Array([0.9, 0.1]),
    c: new Float32Array([0, 1]),
  };
  const chunks: Chunk[] = [
    { id: "a", title: "A", text: "a", source: { kind: "project" }, keywords: ["rag"] },
    { id: "b", title: "B", text: "b", source: { kind: "project" }, keywords: ["rag", "retrieval"] },
    { id: "c", title: "C", text: "c", source: { kind: "skill" }, keywords: ["cv"] },
  ];
  const out = retrieveTopK(new Float32Array([1, 0]), ["rag"], chunks, {
    k: 2,
    minScore: 0,
    embeddings: emb,
    weights: { cosine: 1, keyword: 0, boost: 0 },
  });
  assert.equal(out.length, 2);
  assert.equal(out[0].id, "a");
  assert.ok(out[0].parts.cosine !== undefined);
  assert.ok(out[0].reasons.some((r) => r.startsWith("cosine")));
});

test("minScore filters weak matches", () => {
  const chunks: Chunk[] = [
    { id: "a", title: "A", text: "a", source: { kind: "project" }, keywords: [] },
    { id: "b", title: "B", text: "b", source: { kind: "project" }, keywords: [] },
  ];
  const out = retrieveTopK(new Float32Array([1, 0]), [], chunks, {
    k: 5,
    minScore: 0.99,
    embeddings: {
      a: new Float32Array([1, 0]),
      b: new Float32Array([0.8, 0.2]),
    },
    weights: { cosine: 1, keyword: 0, boost: 0 },
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "a");
});

test("mode boost reorders recruiter results toward experience/skills", () => {
  const query = new Float32Array([1, 0]);
  const chunks: Chunk[] = [
    { id: "proj", title: "P", text: "p", source: { kind: "project" }, keywords: [] },
    { id: "exp", title: "E", text: "e", source: { kind: "experience" }, keywords: [] },
  ];
  const embeddings = {
    proj: new Float32Array([1, 0]),
    exp: new Float32Array([0.95, 0.05]),
  };
  const weights = { cosine: 1, keyword: 0, boost: 0.05 };
  const out = retrieveTopK(query, [], chunks, { k: 5, minScore: 0, embeddings, weights, mode: "recruiter" });
  assert.equal(out[0].id, "exp");
  assert.ok(MODE_BOOST.recruiter.experience! > MODE_BOOST.recruiter.project!);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../lib/copilot/scoring'".

- [ ] **Step 3: Write the scoring module**

Create `lib/copilot/scoring.ts`:

```ts
import type { Chunk, CopilotMode, RetrievalResult, SourceKind } from "@/lib/copilot/types";

export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function keywordOverlap(queryTokens: string[], keywords: string[]): number {
  if (queryTokens.length === 0) return 0;
  const kw = new Set(keywords);
  let hits = 0;
  for (const t of queryTokens) if (kw.has(t)) hits++;
  return hits / queryTokens.length;
}

export const MODE_BOOST: Record<CopilotMode, Partial<Record<SourceKind, number>>> = {
  general: {},
  recruiter: { experience: 0.15, resume: 0.1, skill: 0.08, stats: 0.05 },
  interview: { project: 0.1, principle: 0.05 },
  architecture: { project: 0.15 },
  explore: { principle: 0.08, insight: 0.08, project: 0.03 },
};

export type RetrieveOpts = {
  k?: number;
  minScore?: number;
  weights?: { cosine: number; keyword: number; boost: number };
  mode?: CopilotMode;
  embeddings: Record<string, Float32Array>;
};

export function retrieveTopK(
  queryVec: Float32Array,
  queryTokens: string[],
  chunks: Chunk[],
  opts: RetrieveOpts,
): RetrievalResult[] {
  const k = opts.k ?? 5;
  const minScore = opts.minScore ?? 0.25;
  const weights = opts.weights ?? { cosine: 0.6, keyword: 0.3, boost: 0.1 };
  const mode = opts.mode ?? "general";
  const boostMap = MODE_BOOST[mode];

  const scored = chunks
    .map((chunk): RetrievalResult => {
      const vec = opts.embeddings[chunk.id];
      const cosineScore = vec ? cosine(queryVec, vec) : 0;
      const keywordScore = keywordOverlap(queryTokens, chunk.keywords);
      const boost = boostMap[chunk.source.kind] ?? 0;
      const score = weights.cosine * cosineScore + weights.keyword * keywordScore + weights.boost * boost;

      const reasons: string[] = [];
      if (vec) reasons.push(`cosine ${cosineScore.toFixed(2)}`);
      if (keywordScore > 0) reasons.push(`keyword '${queryTokens.join(" ")}'`);
      if (boost > 0) reasons.push(`mode: ${mode} boost`);
      if (reasons.length === 0) reasons.push("index match");

      return {
        id: chunk.id,
        title: chunk.title,
        source: chunk.source,
        score,
        parts: {
          cosine: vec ? cosineScore : undefined,
          keyword: keywordScore > 0 ? keywordScore : undefined,
          boost: boost > 0 ? boost : undefined,
        },
        reasons,
      };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return scored.slice(0, k);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all scoring assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/copilot/scoring.ts tests/scoring.test.ts
git commit -m "feat(copilot): explainable retrieval scoring with mode boosts"
```

---

### Task 5: In-memory per-IP rate limiter

**Files:**
- Create: `lib/copilot/rate-limit.ts`
- Test: `tests/rate-limit.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `class RateLimiter` with `constructor(opts: { limitPerMinute: number; limitPerHour: number; now?: () => number })` and `check(ip: string): { ok: true } | { ok: false; retryAfterSec: number }`. Sliding windows via timestamps. `clear()` for tests.

- [ ] **Step 1: Write the failing test**

Create `tests/rate-limit.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { RateLimiter } from "../lib/copilot/rate-limit";

test("allows up to the per-minute limit then blocks", () => {
  let t = 0;
  const rl = new RateLimiter({ limitPerMinute: 5, limitPerHour: 30, now: () => t });
  for (let i = 0; i < 5; i++) assert.equal(rl.check("1.2.3.4").ok, true);
  const blocked = rl.check("1.2.3.4");
  assert.equal(blocked.ok, false);
  assert.ok((blocked as { retryAfterSec: number }).retryAfterSec > 0);
});

test("window slides: old minute requests expire", () => {
  let t = 0;
  const rl = new RateLimiter({ limitPerMinute: 1, limitPerHour: 30, now: () => t });
  assert.equal(rl.check("ip").ok, true);
  t += 60_000;
  assert.equal(rl.check("ip").ok, true);
});

test("hourly limit is independent and stricter over time", () => {
  let t = 0;
  const rl = new RateLimiter({ limitPerMinute: 100, limitPerHour: 3, now: () => t });
  for (let i = 0; i < 3; i++) {
    assert.equal(rl.check("ip").ok, true);
    t += 30_000; // each request a fresh minute window
  }
  assert.equal(rl.check("ip").ok, false);
});

test("different IPs are isolated", () => {
  const rl = new RateLimiter({ limitPerMinute: 1, limitPerHour: 30, now: () => 0 });
  assert.equal(rl.check("a").ok, true);
  assert.equal(rl.check("b").ok, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../lib/copilot/rate-limit'".

- [ ] **Step 3: Write the limiter**

Create `lib/copilot/rate-limit.ts`:

```ts
type Result = { ok: true } | { ok: false; retryAfterSec: number };

export class RateLimiter {
  private minute: Map<string, number[]> = new Map();
  private hour: Map<string, number[]> = new Map();
  private readonly now: () => number;

  constructor(
    private readonly opts: {
      limitPerMinute: number;
      limitPerHour: number;
      now?: () => number;
    },
  ) {
    this.now = opts.now ?? Date.now;
  }

  check(ip: string): Result {
    const t = this.now();
    const minWindow = this.minute.get(ip)?.filter((ts) => t - ts < 60_000) ?? [];
    const hourWindow = this.hour.get(ip)?.filter((ts) => t - ts < 3_600_000) ?? [];

    if (minWindow.length >= this.opts.limitPerMinute || hourWindow.length >= this.opts.limitPerHour) {
      this.minute.set(ip, minWindow);
      this.hour.set(ip, hourWindow);
      const oldest = hourWindow[0] ?? minWindow[0] ?? t;
      return { ok: false, retryAfterSec: Math.ceil((oldest + 60_000 - t) / 1000) };
    }

    minWindow.push(t);
    hourWindow.push(t);
    this.minute.set(ip, minWindow);
    this.hour.set(ip, hourWindow);
    return { ok: true };
  }

  clear(): void {
    this.minute.clear();
    this.hour.clear();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/copilot/rate-limit.ts tests/rate-limit.test.ts
git commit -m "feat(copilot): per-IP sliding window rate limiter"
```

---

### Task 6: Embedding build script + committed index

**Files:**
- Create: `scripts/build-kb.ts`
- Create: `lib/copilot/index.ts`
- Create (generated, committed): `lib/index/meta.json`, `lib/index/vectors.json`
- Modify: `package.json` (script `build:kb` already added in Task 1)

**Interfaces:**
- Consumes: `buildChunks()` from `lib/copilot/corpus`; `@huggingface/transformers` `pipeline`.
- Produces:
  - `lib/index/meta.json` — `{ chunks: Chunk[] }` (committed).
  - `lib/index/vectors.json` — `{ ids: string[]; dim: number; data: number[][] }` (committed).
  - `loadIndex(): { chunks: Chunk[]; embeddings: Record<string, Float32Array> }` — sync, reads the committed JSON modules (bundled by Next).
  - `embedText(text: string): Promise<Float32Array>` — runtime query embedding via a `globalThis`-cached transformers pipeline using the local `models/` directory only.
  - `ensureModel(): Promise<void>` — downloads/verifies the quantized model into `models/` (dev only; never at build on Vercel).

- [ ] **Step 1: Write the failing test**

Create `tests/index.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndex } from "../lib/copilot/index";

test("committed index loads with matching meta and vectors", () => {
  const { chunks, embeddings } = loadIndex();
  assert.ok(chunks.length >= 6, `expected >= 6 chunks, got ${chunks.length}`);
  for (const c of chunks) {
    const vec = embeddings[c.id];
    assert.ok(vec, `missing vector for ${c.id}`);
    assert.equal(vec.length, 384);
  }
});
```

- [ ] **Step 2: Run the build script (creates the committed index)**

First create `scripts/build-kb.ts`:

```ts
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
```

Run:
```bash
npm run build:kb
```
Expected: `wrote 13 chunks, dim 384, to .../lib/index` (exact count may differ; must be ≥ 6) and a `models/` directory populated with `Xenova/all-MiniLM-L6-V2` quantized files.

If the run fails on a missing network (model download blocked), set `HUGGINGFACE_HUB_OFFLINE=1` after committing `models/` — but for the initial generation a one-time download is required (dev machine only).

- [ ] **Step 3: Write the runtime index module**

Create `lib/copilot/index.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (index loads; every chunk has a 384-dim vector).

- [ ] **Step 5: Commit index and model**

```bash
git add lib/copilot/index.ts lib/index tests/index.test.ts scripts/build-kb.ts models
git commit -m "feat(copilot): build-time local embeddings + committed vector index"
```

Verify the model files were staged (e.g. `models/Xenova/all-MiniLM-L6-V2/...`). If the commit is large, confirm the quantized ONNX file is the only heavy artifact.

---

### Task 7: Prompt builder (mode-scoped system prompt)

**Files:**
- Create: `lib/copilot/prompt.ts`
- Test: `tests/prompt.test.ts`

**Interfaces:**
- Consumes: `CopilotMode`, `ChatMessage`, `RetrievalResult` from `lib/copilot/types`; `profile` from `lib/data`.
- Produces:
  - `buildSystemPrompt(mode: CopilotMode): string` — persona + scope gate + mode instructions.
  - `serializeContext(results: (RetrievalResult & { text?: string })[]): string` — numbered source excerpts.
  - `buildMessages(input: { message: string; mode?: CopilotMode; history?: ChatMessage[]; results: RetrievalResult[] }): ChatMessage[]` — returns `[system, ...history(sliced), context user msg, final user msg]`.

- [ ] **Step 1: Write the failing test**

Create `tests/prompt.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt, serializeContext, buildMessages } from "../lib/copilot/prompt";
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
    { id: "x", title: "RestAI", source: { kind: "project", slug: "restai" }, score: 0.9, parts: {}, reasons: [] },
    { id: "y", title: "Experience", source: { kind: "experience" }, score: 0.5, parts: {}, reasons: [] },
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../lib/copilot/prompt'".

- [ ] **Step 3: Write the prompt module**

Create `lib/copilot/prompt.ts`:

```ts
import type { ChatMessage, CopilotMode, RetrievalResult } from "@/lib/copilot/types";
import { profile } from "@/lib/data";

const IDENTITY = `You are the Engineering Copilot for ${profile.name}, an AI/ML/LLM engineer based in ${profile.location}. You explain his work, projects, architecture, decisions, skills, and experience. Be professional, technical, precise, and concise. Prefer engineering language over marketing language. Never claim anything not present in the provided context. If a question is outside his work or the provided sources, decline politely in one sentence. Cite the [N] source numbers from the context when you use them.`;

const MODE_INSTRUCTIONS: Record<CopilotMode, string> = {
  general: "Answer the question grounded in the context below.",
  recruiter:
    "Summarize experience, strengths, skills, and relevant projects. Emphasize evidence: shipped products, tests, latency, and real numbers from the context.",
  interview:
    "Answer as if you were Mohamed being interviewed. Give the reasoning behind decisions using the project context.",
  architecture:
    "For the most relevant project, walk through the architecture flow from the context: layers, data flow, key decisions, tradeoffs, and what was learned.",
  explore:
    "Compare and connect projects: recommend one based on the question, note category, stack, and how they relate.",
};

export function buildSystemPrompt(mode: CopilotMode): string {
  return [IDENTITY, MODE_INSTRUCTIONS[mode]].join("\n\n");
}

export function serializeContext(results: RetrievalResult[]): string {
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.text ? r.text : ""}`)
    .join("\n\n");
}

export function buildMessages(input: {
  message: string;
  mode?: CopilotMode;
  history?: ChatMessage[];
  results: RetrievalResult[];
}): ChatMessage[] {
  const mode = input.mode ?? "general";
  const history = (input.history ?? []).slice(-6).map((m) => ({ role: m.role, content: m.content }));
  const context = serializeContext(input.results);
  const contextMsg: ChatMessage =
    context.length > 0
      ? {
          role: "user",
          content: `Relevant context:\n${context}\n\nAnswer only from this context, citing source numbers like [1].`,
        }
      : { role: "user", content: "No relevant context was retrieved. Say you have no grounded answer, then offer nearby topics." };

  return [ { role: "system", content: buildSystemPrompt(mode) }, ...history, contextMsg, { role: "user", content: input.message } ];
}
```

Note: `RetrievalResult` has no `text` field by design — `serializeContext` pulls full text from the committed meta at the service layer (Task 9) before calling `buildMessages`; the type is extended there (see Task 9's `toContext`). Keep `RetrievalResult` as-is per spec; `r.text` is undefined at this point and the service injects text.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/copilot/prompt.ts tests/prompt.test.ts
git commit -m "feat(copilot): mode-scoped system prompts with scope gate"
```

---

### Task 8: Groq streaming client (plain fetch, OpenAI-compatible)

**Files:**
- Create: `lib/copilot/groq.ts`
- Test: `tests/groq.test.ts`

**Interfaces:**
- Consumes: `ChatMessage` from `lib/copilot/types`; `process.env.GROQ_API_KEY`.
- Produces:
  - `streamGroq(input: { apiKey: string; model: string; messages: ChatMessage[]; signal?: AbortSignal; fetchImpl?: typeof fetch }): AsyncGenerator<{ delta?: string; finish?: "stop" | "length"; usage?: { prompt_tokens: number; completion_tokens: number } }>` — reads SSE `data:` lines from `chat/completions` with `stream: true` and `stream_options: { include_usage: true }`.

- [ ] **Step 1: Write the failing test**

Create `tests/groq.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { streamGroq } from "../lib/copilot/groq";

function fakeFetch(chunks: string[]): typeof fetch {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return (async () =>
    ({
      ok: true,
      status: 200,
      body: stream,
    }) as unknown as Response) as typeof fetch;
}

test("streams deltas then final usage", async () => {
  const f = fakeFetch([
    "data: {\"choices\":[{\"delta\":{\"content\":\"Hel\"}}]}\n\n",
    "data: {\"choices\":[{\"delta\":{\"content\":\"lo\"}}]}\n\n",
    "data: {\"choices\":[{\"delta\":{}}],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":2}}\n\n",
    "data: [DONE]\n\n",
  ]);
  const out: string[] = [];
  let usage: { prompt_tokens: number; completion_tokens: number } | undefined;
  for await (const ev of streamGroq({
    apiKey: "k",
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "hi" }],
    fetchImpl: f,
  })) {
    if (ev.delta) out.push(ev.delta);
    if (ev.usage) usage = ev.usage;
  }
  assert.deepEqual(out, ["Hel", "lo"]);
  assert.equal(usage?.prompt_tokens, 10);
});

test("surfaces non-ok responses as errors", async () => {
  const bad = (async () => ({ ok: false, status: 429, text: async () => "rate limited" })) as typeof fetch;
  await assert.rejects(
    async () => {
      for await (const _ of streamGroq({
        apiKey: "k",
        model: "m",
        messages: [],
        fetchImpl: bad,
      })) {
        // consume
      }
    },
    /rate limited/,
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../lib/copilot/groq'".

- [ ] **Step 3: Write the Groq client**

Create `lib/copilot/groq.ts`:

```ts
import type { ChatMessage } from "@/lib/copilot/types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqStreamEvent = {
  delta?: string;
  finish?: "stop" | "length";
  usage?: { prompt_tokens: number; completion_tokens: number };
};

export async function* streamGroq(input: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}): AsyncGenerator<GroqStreamEvent> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const res = await fetchImpl(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal: input.signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq error ${res.status}: ${detail || res.statusText}`);
  }
  if (!res.body) throw new Error("Groq stream had no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processLine = (line: string): GroqStreamEvent | null => {
    if (!line.startsWith("data:")) return null;
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") return null;
    const json = JSON.parse(payload) as {
      choices?: { delta?: { content?: string }; finish_reason?: string }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const event: GroqStreamEvent = {};
    const choice = json.choices?.[0];
    if (choice?.delta?.content) event.delta = choice.delta.content;
    if (choice?.finish_reason === "stop") event.finish = "stop";
    if (choice?.finish_reason === "length") event.finish = "length";
    if (json.usage) event.usage = json.usage;
    return Object.keys(event).length ? event : null;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf("\n");
    while (nl !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) {
        const event = processLine(line);
        if (event) yield event;
      }
      nl = buffer.indexOf("\n");
    }
  }
  const remaining = buffer.trim();
  if (remaining) {
    const event = processLine(remaining);
    if (event) yield event;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/copilot/groq.ts tests/groq.test.ts
git commit -m "feat(copilot): streaming Groq client with usage reporting"
```

---

### Task 9: Copilot service pipeline (event generator)

**Files:**
- Create: `lib/copilot/service.ts`
- Test: `tests/service.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–8: `CopilotEvent`, `RequestBody`, `RetrievalResult`, `Chunk`; `loadIndex`, `getEmbedder`; `retrieveTopK`; `buildMessages`; `streamGroq`; `RateLimiter`.
- Produces:
  - `validateInput(body: unknown): { ok: true; data: RequestBody } | { ok: false; error: string }`
  - `toContext(results: RetrievalResult[]): { title: string; text: string; ... }[]` — joins full chunk text from the index by id.
  - `runCopilot(body: RequestBody, deps?: Partial<{ apiKey: string; model: string; now: () => number; limiter: RateLimiter; ip: string; fetchImpl: typeof fetch; getEmbedder: () => Promise<(t: string) => Promise<Float32Array>>; cacheHits: Map<string, { results: RetrievalResult[]; retrievalMs: number }> }>): AsyncGenerator<CopilotEvent>` — the whole pipeline; emits `meta → sources → card → delta* → stats → done` (or `error`).

- [ ] **Step 1: Write the failing test**

Create `tests/service.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { runCopilot, validateInput } from "../lib/copilot/service";
import type { RequestBody, RetrievalResult } from "../lib/copilot/types";

function fakeGroq(parts: string[]): typeof fetch {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const p of parts) c.enqueue(encoder.encode(p));
      c.close();
    },
  });
  return (async () => ({ ok: true, status: 200, body }) as unknown as Response) as typeof fetch;
}

const fastEmbed = async (t: string) => new Float32Array(384).fill(0.01);

test("validateInput enforces message cap", () => {
  assert.equal(validateInput({ message: "x".repeat(601) }).ok, false);
  assert.equal(validateInput({ message: "ok" }).ok, true);
  assert.equal(validateInput({ message: 123 }).ok, false);
});

test("runCopilot emits the canonical event order and streams deltas", async () => {
  const events: string[] = [];
  const fetchImpl = fakeGroq([
    "data: {\"choices\":[{\"delta\":{\"content\":\"Yes.\"}}]}\n\n",
    "data: {\"choices\":[{\"delta\":{}}],\"usage\":{\"prompt_tokens\":9,\"completion_tokens\":2}}\n\n",
    "data: [DONE]\n\n",
  ]);
  const body: RequestBody = { message: "What did you build?", mode: "architecture", history: [] };
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number }>();

  for await (const ev of runCopilot(body, {
    apiKey: "k",
    model: "llama-3.3-70b-versatile",
    fetchImpl,
    getEmbedder: async () => fastEmbed,
    cacheHits,
  })) {
    events.push(ev.type);
    if (ev.type === "delta") assert.equal(ev.text, "Yes.");
    if (ev.type === "sources") {
      assert.ok(ev.sources.length > 0, "sources must be non-empty for a real query");
      assert.ok(ev.sources[0].reasons.length >= 1);
    }
    if (ev.type === "card") assert.ok(ev.card === null || ev.card.kind === "project" || ev.card.kind === "resume");
    if (ev.type === "stats") {
      assert.equal(ev.tokens.in, 9);
      assert.equal(ev.tokens.out, 2);
    }
  }

  assert.deepEqual(events, ["meta", "sources", "card", "delta", "stats", "done"]);
});

test("rate limit produces an error event and closes", async () => {
  const events: string[] = [];
  let t = 0;
  for await (const ev of runCopilot({ message: "hi" }, {
    apiKey: "k",
    model: "m",
    limiter: new (await import("../lib/copilot/rate-limit")).RateLimiter({
      limitPerMinute: 0,
      limitPerHour: 0,
      now: () => t,
    }),
    ip: "1.2.3.4",
    getEmbedder: async () => fastEmbed,
  })) {
    events.push(ev.type);
    if (ev.type === "error") assert.equal(ev.code, 429);
  }
  assert.deepEqual(events, ["error"]);
});

test("cache hit skips embedding and reports cache status", async () => {
  const events: any[] = [];
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number }>([
    [
      "what did you build?:architecture",
      {
        results: [
          {
            id: "project-restai",
            title: "RestAI — Backend & Agentic AI",
            source: { kind: "project", slug: "restai" },
            score: 0.9,
            parts: { cosine: 0.9 },
            reasons: ["cached"],
          },
        ],
        retrievalMs: 0,
      },
    ],
  ]);
  let embedded = 0;
  for await (const ev of runCopilot({ message: "What did you build?", mode: "architecture" }, {
    apiKey: "k",
    model: "m",
    fetchImpl: fakeGroq(["data: [DONE]\n\n"]),
    getEmbedder: async () => {
      embedded++;
      return fastEmbed;
    },
    cacheHits,
  })) {
    events.push(ev);
  }
  assert.equal(embedded, 0);
  const stats = events.find((e) => e.type === "stats");
  assert.equal(stats.cache, "hit");
  const sources = events.find((e) => e.type === "sources");
  assert.equal(sources.sources[0].id, "project-restai");
});

test("first computation reports cache build, repeat reports hit", async () => {
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number }>();
  const body: RequestBody = { message: "Explain your RAG", mode: "explore" };
  const deps = {
    apiKey: "k",
    model: "m",
    fetchImpl: fakeGroq(["data: [DONE]\n\n"]),
    getEmbedder: async () => fastEmbed,
    cacheHits,
  };
  const first: any[] = [];
  for await (const ev of runCopilot(body, deps)) first.push(ev);
  assert.equal(first.find((e) => e.type === "stats").cache, "build");
  const second: any[] = [];
  for await (const ev of runCopilot(body, deps)) second.push(ev);
  assert.equal(second.find((e) => e.type === "stats").cache, "hit");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../lib/copilot/service'".

- [ ] **Step 3: Write the service**

Create `lib/copilot/service.ts`:

```ts
import type {
  ChatMessage,
  CopilotEvent,
  CopilotMode,
  RetrievalResult,
  RequestBody,
} from "@/lib/copilot/types";
import { loadIndex } from "@/lib/copilot/index";
import { retrieveTopK } from "@/lib/copilot/scoring";
import { buildMessages } from "@/lib/copilot/prompt";
import { streamGroq } from "@/lib/copilot/groq";
import { RateLimiter } from "@/lib/copilot/rate-limit";

export const MODEL = "llama-3.3-70b-versatile";
export const MAX_MESSAGE = 600;
export const MAX_HISTORY = 6;

export function validateInput(body: unknown):
  | { ok: true; data: RequestBody }
  | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid body" };
  const b = body as Partial<RequestBody>;
  if (typeof b.message !== "string" || b.message.trim().length === 0)
    return { ok: false, error: "message is required" };
  if (b.message.length > MAX_MESSAGE) return { ok: false, error: "message too long" };
  if (b.mode !== undefined && !["general", "recruiter", "interview", "architecture", "explore"].includes(b.mode))
    return { ok: false, error: "unknown mode" };
  if (b.history !== undefined && (!Array.isArray(b.history) || b.history.length > MAX_HISTORY))
    return { ok: false, error: "history too long" };
  return { ok: true, data: { message: b.message, mode: b.mode, history: b.history } };
}

export type RunDeps = {
  apiKey?: string;
  model?: string;
  now?: () => number;
  limiter?: RateLimiter;
  ip?: string;
  fetchImpl?: typeof fetch;
  getEmbedder?: () => Promise<(t: string) => Promise<Float32Array>>;
  cacheHits?: Map<string, { results: RetrievalResult[]; retrievalMs: number }>;
};

function tokenize(q: string): string[] {
  return q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
}

export async function* runCopilot(
  body: RequestBody,
  deps: RunDeps = {},
): AsyncGenerator<CopilotEvent> {
  const startedAt = Date.now();
  const apiKey = deps.apiKey ?? process.env.GROQ_API_KEY;
  const model = deps.model ?? MODEL;
  const mode: CopilotMode = body.mode ?? "general";
  const id = `req-${startedAt}-${Math.random().toString(36).slice(2, 8)}`;
  const limiter = deps.limiter ?? new RateLimiter({ limitPerMinute: 5, limitPerHour: 30 });
  const ip = deps.ip ?? "local";
  const cache = deps.cacheHits ?? new Map<string, { results: RetrievalResult[]; retrievalMs: number }>();

  if (!apiKey) {
    yield { type: "error", code: 500, message: "Copilot is not configured (missing GROQ_API_KEY)." };
    return;
  }

  const allowed = limiter.check(ip);
  if (!allowed.ok) {
    yield { type: "error", code: 429, message: `Rate limited. Retry in ${allowed.retryAfterSec}s.` };
    return;
  }

  const { chunks, embeddings } = loadIndex();

  const cacheKey = `${body.message.trim().toLowerCase()}:${mode}`;
  let results: RetrievalResult[];
  let cacheStatus: "hit" | "build" | "miss";
  let retrievalMs: number;

  const compute = async (): Promise<RetrievalResult[]> => {
    const embedder = deps.getEmbedder
      ? await deps.getEmbedder()
      : await (await import("@/lib/copilot/index")).getEmbedder();
    const vec = await embedder(body.message);
    return retrieveTopK(vec, tokenize(body.message), chunks, { k: 5, minScore: 0.25, mode, embeddings });
  };

  const retrievalStart = Date.now();
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    results = entry.results;
    retrievalMs = entry.retrievalMs;
    cacheStatus = "hit";
  } else {
    results = await compute();
    retrievalMs = Date.now() - retrievalStart;
    cacheStatus = cache.size === 0 ? "build" : "miss";
    cache.set(cacheKey, { results, retrievalMs });
  }

  const metaEvent: CopilotEvent = { type: "meta", id, mode, model, startedAt };
  yield metaEvent;

  const sourcesEvent: CopilotEvent = { type: "sources", sources: results };
  yield sourcesEvent;

  const project = results.find((r) => r.source.kind === "project");
  const cardEvent: CopilotEvent = {
    type: "card",
    card: project
      ? { kind: "project", slug: project.source.slug!, title: project.title }
      : { kind: "resume", title: "Resume summary" },
  };
  yield cardEvent;

  const textById = new Map(chunks.map((c) => [c.id, c.text]));
  const contextResults = results.map((r) => ({ ...r, text: textById.get(r.id) ?? "" }));
  const history: ChatMessage[] = (body.history ?? []).map((h) => ({ role: h.role, content: h.content }));
  const messages = buildMessages({ message: body.message, mode, history, results: contextResults });

  let tokensIn = 0;
  let tokensOut = 0;
  let finish: "stop" | "length" = "stop";

  try {
    for await (const ev of streamGroq({
      apiKey,
      model,
      messages,
      fetchImpl: deps.fetchImpl,
    })) {
      if (ev.delta) yield { type: "delta", text: ev.delta };
      if (ev.finish) finish = ev.finish;
      if (ev.usage) {
        tokensIn = ev.usage.prompt_tokens;
        tokensOut = ev.usage.completion_tokens;
      }
    }
  } catch (err) {
    yield { type: "error", code: 502, message: err instanceof Error ? err.message : "upstream error" };
    return;
  }

  const totalMs = Date.now() - startedAt;
  yield { type: "stats", tokens: { in: tokensIn, out: tokensOut }, retrievalMs, totalMs, cache: cacheStatus };
  yield { type: "done", finish };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all service assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/copilot/service.ts tests/service.test.ts
git commit -m "feat(copilot): RAG pipeline emitting typed NDJSON events"
```

---

### Task 10: API route (NDJSON streaming endpoint)

**Files:**
- Create: `app/api/copilot/route.ts`

**Interfaces:**
- Consumes: `runCopilot`, `validateInput` from `lib/copilot/service`.
- Produces: `POST` route — `runtime = "nodejs"`, validates input, streams NDJSON (`Content-Type: application/x-ndjson; charset=utf-8`), 429/400/500 as single `error` events. Exports `config` with `runtime` and `dynamic`.

- [ ] **Step 1: Write the route**

Create `app/api/copilot/route.ts`:

```ts
import type { CopilotEvent } from "@/lib/copilot/types";
import { runCopilot, validateInput } from "@/lib/copilot/service";
import { RateLimiter } from "@/lib/copilot/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = new RateLimiter({ limitPerMinute: 5, limitPerHour: 30 });

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json\n", { status: 400, headers: { "content-type": "application/x-ndjson" } });
  }

  const parsed = validateInput(body);
  if (!parsed.ok) {
    return new Response(JSON.stringify({ type: "error", code: 400, message: parsed.error }) + "\n", {
      status: 400,
      headers: { "content-type": "application/x-ndjson" },
    });
  }

  const ip = clientIp(req);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of runCopilot(parsed.data, { ip, limiter })) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
      } catch (err) {
        const fallback: CopilotEvent = {
          type: "error",
          code: 500,
          message: err instanceof Error ? err.message : "internal error",
        };
        controller.enqueue(encoder.encode(JSON.stringify(fallback) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify route compiles into the app**

Run: `npm run build`
Expected: green; route listed among build output as `/api/copilot`.

- [ ] **Step 4: Manual smoke test (dev)**

Run: `npm run dev`, then:

```powershell
$body = @{ message = "What did you build?"; mode = "architecture" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/api/copilot" -Method Post -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content
```
Expected: NDJSON lines `meta`, `sources`, `card`, `delta`…, `stats`, `done`. (Requires `GROQ_API_KEY` in `.env.local`.)

- [ ] **Step 5: Commit**

```bash
git add app/api/copilot/route.ts
git commit -m "feat(copilot): NDJSON streaming API route with rate limiting"
```

---

### Task 11: Copilot modal UI

**Files:**
- Create: `components/copilot.tsx`
- Create: `components/copilot-card.tsx`
- Create: `components/copilot-markdown.tsx`

**Interfaces:**
- Consumes: `CopilotEvent`, `CopilotMode`, `RetrievalResult` from `lib/copilot/types`; `COPILOT_MODES`; `projects` from `lib/data` (for card data); `@/lib/motion` tokens.
- Produces: `Copilot` component (full-screen glass modal, `next/dynamic`-loaded in Task 12). Props: none. Dispatches nothing; listens for `ma:open-copilot` custom event + `Cmd/Ctrl+J` + `Esc`. Renders: landing state (topic pills + mode pills), conversation list, streamed markdown with citations, card panel, "explain why" sources panel, stats footer.

- [ ] **Step 1: Write the markdown renderer**

Create `components/copilot-markdown.tsx`:

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock({ language, value }: { language: string; value: string }) {
  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-line bg-bg/60">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-ink-soft transition-colors hover:text-ink"
        >
          copy
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{ margin: 0, background: "transparent", fontSize: "0.8rem" }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export function CopilotMarkdown({ text }: { text: string }) {
  return (
    <div className="prose-copilot text-sm leading-relaxed text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children }) {
            const match = /language-(\w+)/.exec(className ?? "");
            if (inline || !match) {
              return (
                <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match[1]} value={String(children)} />;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: Write the card renderer**

Create `components/copilot-card.tsx`:

```tsx
"use client";

import type { CopilotCard } from "@/lib/copilot/types";
import { projects } from "@/lib/data";
import { ArchitectureDiagram } from "@/components/architecture-diagram";

export function CopilotCardPanel({ card }: { card: CopilotCard | null }) {
  if (!card) return null;
  if (card.kind === "resume") {
    return (
      <div className="rounded-2xl border border-line bg-bg/40 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Resume</p>
        <p className="mt-2 text-sm text-ink-soft">
          The full resume is in the site header — or ask for a summary in the chat.
        </p>
      </div>
    );
  }
  const project = projects.find((p) => p.study?.slug === card.slug || p.title === card.title);
  if (!project) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-bg/40 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          {project.index} · {project.domain}
        </p>
        <h3 className="mt-1 font-serif text-lg italic text-ink">{project.title}</h3>
        <p className="mt-1 text-sm text-ink-soft">{project.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <span key={s} className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-ink-soft">
              {s}
            </span>
          ))}
        </div>
      </div>
      <ArchitectureDiagram flow={project.architecture} />
      <div className="rounded-2xl border border-line bg-bg/40 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Links</p>
        <div className="mt-2 flex gap-3 text-sm">
          {project.href && (
            <a href={project.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              GitHub
            </a>
          )}
          {project.study && (
            <a href={`/case-studies/${project.study.slug}`} className="text-accent hover:underline">
              Case study
            </a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Demo
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write the modal**

Create `components/copilot.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CopilotCard, CopilotEvent, CopilotMode, RetrievalResult } from "@/lib/copilot/types";
import { COPILOT_MODES } from "@/lib/copilot/types";
import { EASE, DURATION } from "@/lib/motion";
import { CopilotMarkdown } from "@/components/copilot-markdown";
import { CopilotCardPanel } from "@/components/copilot-card";

type Message = { id: string; role: "user" | "assistant"; text: string };
type Run = {
  id: string;
  mode: CopilotMode;
  sources: RetrievalResult[];
  card: CopilotCard | null;
  stats: { tokens: { in: number; out: number }; retrievalMs: number; totalMs: number; cache: string } | null;
  done: boolean;
};

const QUICK_ACTIONS = [
  "What did you build?",
  "Show RestAI architecture",
  "Explain your RAG",
  "Why those tradeoffs?",
  "Interview me",
  "Resume summary",
];

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CopilotMode>("general");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [runs, setRuns] = useState<Record<string, Run>>({});
  const [streaming, setStreaming] = useState(false);
  const [explain, setExplain] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const openModal = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        openModal();
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpenEvent = () => openModal();
    window.addEventListener("keydown", onKey);
    window.addEventListener("ma:open-copilot", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ma:open-copilot", onOpenEvent);
    };
  }, [openModal]);

  useEffect(() => {
    if (!streaming) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, runs, streaming]);

  const run = useCallback(async (text: string) => {
    if (streaming) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text };
    const runId = `a-${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: runId, role: "assistant", text: "" }]);
    setRuns((r) => ({ ...r, [runId]: { id: runId, mode, sources: [], card: null, stats: null, done: false } }));
    setStreaming(true);
    setInput("");

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, mode }),
      });
      if (!res.body) throw new Error("no body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const update = (fn: (r: Run) => Run) =>
        setRuns((prev) => ({ ...prev, [runId]: fn(prev[runId]) }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl = buffer.indexOf("\n");
        while (nl !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (!line.trim()) { nl = buffer.indexOf("\n"); continue; }
          const ev = JSON.parse(line) as CopilotEvent;
          if (ev.type === "delta") {
            setMessages((prev) =>
              prev.map((m) => (m.id === runId ? { ...m, text: m.text + ev.text } : m)),
            );
          } else if (ev.type === "sources") {
            update((r) => ({ ...r, sources: ev.sources }));
          } else if (ev.type === "card") {
            update((r) => ({ ...r, card: ev.card }));
          } else if (ev.type === "stats") {
            update((r) => ({ ...r, stats: ev.stats }));
          } else if (ev.type === "error") {
            setMessages((prev) =>
              prev.map((m) => (m.id === runId ? { ...m, text: `⚠ ${ev.message}` } : m)),
            );
          } else if (ev.type === "done") {
            update((r) => ({ ...r, done: true }));
          }
          nl = buffer.indexOf("\n");
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === runId ? { ...m, text: "⚠ Failed to reach the copilot." } : m)),
      );
    } finally {
      update((r) => ({ ...r, done: true }));
      setStreaming(false);
    }
  }, [mode, streaming]);

  const send = () => {
    const text = input.trim();
    if (!text || streaming) return;
    void run(text);
  };

  const lastRunId = messages.filter((m) => m.role === "assistant").at(-1)?.id;
  const lastRun = lastRunId ? runs[lastRunId] : undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm md:p-6"
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Engineering Copilot"
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  COPILOT → GROUNDED RAG → STREAM
                </p>
                <h2 className="font-serif text-lg italic text-ink">Engineering Copilot</h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close copilot"
                className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ink-soft transition-colors hover:text-ink"
              >
                Esc
              </button>
            </div>

            {/* mode pills */}
            <div className="flex flex-wrap gap-2 border-b border-line px-5 py-2.5">
              {COPILOT_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-full border px-3 py-1 font-mono text-xs capitalize transition-colors ${
                    mode === m
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line text-ink-soft hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* body */}
            <div className="grid flex-1 gap-0 overflow-hidden md:grid-cols-[1fr_320px]">
              <div className="flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                      <div>
                        <h3 className="font-serif text-2xl italic text-ink">
                          Ask me anything about my work
                        </h3>
                        <p className="mt-2 text-sm text-ink-soft">
                          Grounded in the real projects, decisions, and numbers on this site.
                        </p>
                      </div>
                      <div className="flex max-w-md flex-wrap justify-center gap-2">
                        {QUICK_ACTIONS.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => void run(q)}
                            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-ink"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {messages.map((m) => (
                        <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                          <div
                            className={
                              m.role === "user"
                                ? "ml-auto inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-left text-sm text-bg"
                                : "max-w-[92%]"
                            }
                          >
                            {m.role === "assistant" ? (
                              <CopilotMarkdown text={m.text} />
                            ) : (
                              m.text
                            )}
                          </div>
                        </div>
                      ))}
                      {streaming && (
                        <span className="font-mono text-sm text-ink-faint">▍</span>
                      )}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {/* footer stats */}
                {lastRun?.stats && (
                  <div className="flex items-center gap-3 border-t border-line px-5 py-2 font-mono text-[10px] text-ink-faint">
                    <span>⌁ {lastRun.sources.length} sources</span>
                    <span>{lastRun.stats.tokens.out} tokens</span>
                    <span>{lastRun.stats.retrievalMs} ms retrieval</span>
                    <span>{lastRun.stats.totalMs} ms total</span>
                    <span className="uppercase">cache:{lastRun.stats.cache}</span>
                    <button
                      type="button"
                      onClick={() => setExplain((e) => !e)}
                      className="ml-auto text-accent transition-colors hover:underline"
                    >
                      {explain ? "hide why" : "explain why"}
                    </button>
                  </div>
                )}

                {explain && lastRun && (
                  <div className="border-t border-line bg-bg/40 px-5 py-3">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                      Retrieval — why these sources
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {lastRun.sources.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 font-mono text-[11px] text-ink-soft">
                          <span className="rounded bg-surface-2 px-1.5 py-0.5">{s.score.toFixed(2)}</span>
                          <span className="truncate">{s.title}</span>
                          <span className="ml-auto hidden truncate text-ink-faint sm:block">
                            {s.reasons.join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* input */}
                <div className="flex items-center gap-2 border-t border-line px-5 py-3">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask about projects, architecture, decisions…"
                    className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={streaming || !input.trim()}
                    className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-85 disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* card rail */}
              <div className="hidden overflow-y-auto border-l border-line bg-bg/20 p-4 md:block">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                  Context · {mode}
                </p>
                <CopilotCardPanel card={lastRun?.card ?? null} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

The `message` mapping spreads `{ ...ev } consumes the whole event union`; unknown future event types are ignored because the reducer only branches on known `type` values (extensibility contract from spec §3).

- [ ] **Step 4: Verify it typechecks and builds**

Run: `npx tsc --noEmit` then `npm run build`
Expected: no errors; build green.

- [ ] **Step 5: Commit**

```bash
git add components/copilot.tsx components/copilot-card.tsx components/copilot-markdown.tsx
git commit -m "feat(copilot): full-screen glass modal with streamed markdown and cards"
```

---

### Task 12: Wiring — layout mount, nav trigger, palette entry

**Files:**
- Modify: `app/layout.tsx`
- Modify: `components/nav.tsx`
- Modify: `components/command-palette.tsx`

**Interfaces:**
- Consumes: `Copilot` from `components/copilot` (dynamic import, `ssr: false`).
- Produces: global availability of the modal; `ma:open-copilot` dispatch from nav button and palette entry; `⌘J` still bound in the modal itself.

- [ ] **Step 1: Mount the modal lazily in the layout**

In `app/layout.tsx`, add a dynamic import and render it next to `CommandPalette`:

```tsx
import dynamic from "next/dynamic";

const Copilot = dynamic(() => import("@/components/copilot"), {
  loading: () => null,
});
```

And in the body, after `<CommandPalette />`:

```tsx
<Copilot />
```

- [ ] **Step 2: Add the nav trigger**

In `components/nav.tsx`, next to the `<PaletteTrigger />`, add:

```tsx
<button
  type="button"
  onClick={() => window.dispatchEvent(new Event("ma:open-copilot"))}
  className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-faint transition-colors hover:text-ink md:flex"
>
  <span className="text-ink-soft">⌘J</span>
  copilot
</button>
```

- [ ] **Step 3: Add the palette entry**

In `components/command-palette.tsx`, inside the `items` array (after the `contact` item, before the project spreads), add:

```ts
{
  id: "copilot",
  label: "Engineering Copilot",
  hint: "Ask anything · ⌘J",
  action: () => { window.dispatchEvent(new Event("ma:open-copilot")); close(); },
},
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit` then `npm run build`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx components/nav.tsx components/command-palette.tsx
git commit -m "feat(copilot): wire modal into layout, nav, and command palette"
```

---

### Task 13: Final verification pass

**Files:**
- Read-only verification; no new files unless a fix is needed.

**Interfaces:**
- Consumes: the full feature.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass (types, corpus, scoring, rate-limit, prompt, groq, service, index).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: green; `/api/copilot` route and the modal chunk listed.

- [ ] **Step 3: Manual acceptance checklist**

With `npm run dev` and a valid `GROQ_API_KEY` in `.env.local`:

- [ ] `⌘J` opens the modal; `Esc` closes; focus lands in the input.
- [ ] Landing state shows topic pills and all five mode pills.
- [ ] Quick action "Show RestAI architecture" streams deltas, shows an architecture card, and lists sources.
- [ ] "Explain why" panel shows per-source scores and reasons.
- [ ] `stats` footer shows sources, tokens, retrieval ms, total ms, cache status.
- [ ] Reduced motion (`prefers-reduced-motion: reduce`) renders the modal without drift.
- [ ] On mobile the card rail collapses; conversation scrolls.
- [ ] A 6th+ request within a minute shows the 429 error event.
- [ ] `⌘K` still opens the navigation palette; the new "Engineering Copilot" entry opens the modal.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(copilot): final verification adjustments"
```

- [ ] **Step 5: Update the design spec status**

In `docs/superpowers/specs/2026-08-08-engineering-copilot-design.md`, change:

```markdown
**Status:** Approved (design); pending implementation plan
```

to:

```markdown
**Status:** Implemented
```

and commit:

```bash
git add docs/superpowers/specs/2026-08-08-engineering-copilot-design.md
git commit -m "docs(spec): mark Engineering Copilot implemented"
```
