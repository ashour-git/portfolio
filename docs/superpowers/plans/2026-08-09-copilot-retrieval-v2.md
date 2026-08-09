# Engineering Copilot v2 — Retrieval & Response Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Copilot's single-recipe retrieval+response flow into a production-style pipeline: deterministic intent classification (nine intents, primary+secondary+confidence), intent-aware query rewriting, five-signal hybrid retrieval with document authority and structured reasons + breakdowns, a confidence-gated secondary retrieval pass, an Answer Planner that drives per-intent structured response templates, and a client that shows human-readable "Grounded in …" sources with raw diagnostics behind a Developer Mode toggle.

**Architecture:** A deterministic decision core (`classify → rewrite → retrieve → plan`) runs before the LLM and produces new typed events (`plan`) and enriched retrieval results, all streamed over the existing NDJSON contract as `meta → plan → sources → card → delta* → stats → done`. The corpus grows three derived chunks (`hire`, `about`, `linkedin`) with `authority`/`priority` metadata, and `scripts/build-kb.ts` regenerates chunk embeddings **and** per-intent centroid vectors into committed `lib/index/*` artifacts.

**Tech Stack:** TypeScript, node:test (`tsx --test "tests/**/*.test.ts"`), Next.js 15 App Router, local q8 MiniLM embeddings (`@huggingface/transformers`), framer-motion, react-markdown + remark-gfm.

## Global Constraints

- Test command is `npm test` → `tsx --test "tests/**/*.test.ts"` (Node 24). Do not regress the developer console to a bare `tests/` dir form.
- Typecheck `npx tsc --noEmit` must be clean after every task. There is no `npm run lint` in this repo.
- Production build via `npm run build` stays green (checked after client tasks).
- **No extra LLM hop** — classification, rewriting, planning are all deterministic; the Groq stream remains the only LLM call.
- The embedding is computed from the **original user query only**; query rewriting expands only the keyword-token phase. Never embed rewritten text.
- Must stay fully offline at runtime: committed `models/` and `lib/index/*`; `env.allowRemoteModels = false`; unchanged provider (`GROQ_API_KEY`, `llama-3.3-70b-versatile`, plain fetch NDJSON stream).
- All new corpus text is **derived** from `lib/data.ts` exports — never hand-duplicated prose.
- `SourceKind` gains three derived kinds — `hire`, `about`, `linkedin` — so intent boost, authority, and mode maps stay type-safe. Recency metadata is explicitly deferred (spec assumption; no signal consumes it).
- `retrieveTopK` retains its top-level signature semantics; opts gain `intent` and `weights`; results keep `reasons: string[]` in text and add `breakdown: { signal; value; weight }[]` for machine reading (Dev Mode only).
- The `plan` event is emitted **immediately after `meta`** and before `sources`.
- Developer Mode is **off by default**; raw counts/scores/breakdowns render only when the user toggles it.
- Spec of record: `docs/superpowers/specs/2026-08-09-copilot-retrieval-v2-design.md` (Approved).

---

### Task 1: Protocol types — intent, authority, plan, breakdown

**Files:**
- Modify: `lib/copilot/types.ts`
- Test: `tests/types.test.ts`

**Interfaces:**
- Produces (consumed by every later task):
  - `export type Intent = "recruiter" | "project" | "architecture" | "interview" | "resume" | "skills" | "experience" | "decision" | "general"`
  - `export type IntentResult = { primary: Intent; secondary?: Intent; confidence: number }`
  - `export type DocAuthority = "first-party" | "metrics" | "external"`
  - `export type RetrievalSignal = "cosine" | "keyword" | "intent" | "mode" | "priority" | "authority"`
  - `export type SignalBreakdown = { signal: RetrievalSignal; value: number; weight: number }`
  - `export type PlanTemplate = "recruiter" | "project" | "interview" | "resume" | "skills" | "experience" | "decision" | "general"`
  - `export type PlanStance = "high" | "medium" | "fallback"`
  - `export type PlanCard = "project" | "resume" | "skills" | "timeline" | "stats" | "links" | "none"`
  - `export type Plan = { template: PlanTemplate; stance: PlanStance; card: PlanCard; suggestions?: string[] }`
  - `Chunk` gains `label: string`, `authority: DocAuthority`, `priority: number`
  - `RetrievalResult` gains `label: string`, `breakdown: SignalBreakdown[]`
  - `CopilotEvent` gains `{ type: "plan"; plan: Plan }`; the `stats` member gains `intent: Intent`, `confidence: number`, `strategy: "primary" | "relaxed"`.
- Consumes: existing `CopilotMode`, `SourceKind`, `Chunk`, `RetrievalResult`, `CopilotEvent`, `ChatMessage`, `RequestBody`.

- [ ] **Step 1: Write the failing test**

Replace `tests/types.test.ts` with:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type {
  CopilotEvent,
  CopilotMode,
  Intent,
  IntentResult,
  Plan,
  RetrievalResult,
  RequestBody,
} from "../lib/copilot/types";

const modes: CopilotMode[] = ["general", "recruiter", "interview", "architecture", "explore"];

test("modes are the five approved values", () => {
  assert.deepEqual(modes.sort(), ["architecture", "explore", "general", "interview", "recruiter"]);
});

test("v2 RetrievalResult carries label and machine-readable breakdown", () => {
  const r: RetrievalResult = {
    id: "hire",
    title: "Why hire Mohamed",
    label: "Hire",
    source: { kind: "resume" },
    score: 0.81,
    parts: { cosine: 0.81, keyword: 0.4, boost: 0.1 },
    reasons: ["cosine 0.81", "intent: recruiter"],
    breakdown: [
      { signal: "cosine", value: 0.81, weight: 0.4 },
      { signal: "intent", value: 0.2, weight: 0.12 },
    ],
  };
  assert.equal(r.label, "Hire");
  assert.ok(r.breakdown.some((b) => b.signal === "cosine"));
});

test("plan event and enriched stats satisfy the union", () => {
  const ir: IntentResult = { primary: "recruiter", confidence: 0.9 };
  const plan: Plan = { template: "recruiter", stance: "high", card: "resume" };
  const events: CopilotEvent[] = [
    { type: "plan", plan },
    {
      type: "stats",
      tokens: { in: 10, out: 5 },
      retrievalMs: 12,
      totalMs: 50,
      cache: "miss",
      intent: ir.primary,
      confidence: ir.confidence,
      strategy: "primary",
    },
  ];
  assert.equal(events[0].type, "plan");
  assert.equal(events[0].plan.stance, "high");
  assert.equal(events[1].type, "stats");
  assert.equal(events[1].intent, "recruiter");
  assert.equal(events[1].strategy, "primary");
});

test("every CopilotEvent literal satisfies the union discriminator", () => {
  const all: CopilotEvent[] = [
    { type: "meta", id: "req-1", mode: "general", model: "llama-3.3-70b-versatile", startedAt: 1 },
    { type: "plan", plan: { template: "general", stance: "medium", card: "none" } },
    { type: "delta", text: "hi" },
    { type: "sources", sources: [] },
    { type: "card", card: { kind: "project", slug: "restai", title: "RestAI" } },
    { type: "done", finish: "stop" },
    { type: "error", code: 429, message: "rate limited" },
    {
      type: "stats",
      tokens: { in: 10, out: 5 },
      retrievalMs: 12,
      totalMs: 50,
      cache: "build",
      intent: "general",
      confidence: 0,
      strategy: "primary",
    },
  ];
  for (const e of all) assert.ok("type" in e);
});

test("RequestBody shape matches the wire contract", () => {
  const body: RequestBody = { message: "What did you build?", mode: "recruiter", history: [] };
  assert.equal(body.message.length > 0, true);
});

test("Intent covers the nine approved values", () => {
  const i: Intent[] = ["general", "recruiter", "project", "architecture", "interview", "resume", "skills", "experience", "decision"];
  assert.equal(new Set(i).size, 9);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/types.test.ts`
Expected: FAIL — new types and `stats`/`plan` fields do not exist yet.

- [ ] **Step 3: Implement**

Edit `lib/copilot/types.ts`:

1. After the `COPILOT_MODES` block add:

```ts
export type Intent =
  | "recruiter"
  | "project"
  | "architecture"
  | "interview"
  | "resume"
  | "skills"
  | "experience"
  | "decision"
  | "general";

export type IntentResult = { primary: Intent; secondary?: Intent; confidence: number };

export type DocAuthority = "first-party" | "metrics" | "external";

export type RetrievalSignal = "cosine" | "keyword" | "intent" | "mode" | "priority" | "authority";

export type SignalBreakdown = { signal: RetrievalSignal; value: number; weight: number };

export type PlanTemplate =
  | "recruiter"
  | "project"
  | "interview"
  | "resume"
  | "skills"
  | "experience"
  | "decision"
  | "general";

export type PlanStance = "high" | "medium" | "fallback";

export type PlanCard = "project" | "resume" | "skills" | "timeline" | "stats" | "links" | "none";

export type Plan = { template: PlanTemplate; stance: PlanStance; card: PlanCard; suggestions?: string[] };
```

2. Extend `Chunk` — add three fields:

```ts
export type Chunk = {
  id: string;
  title: string;
  label: string;
  text: string;
  source: { kind: SourceKind; slug?: string; url?: string };
  keywords: string[];
  authority: DocAuthority;
  priority: number;
};
```

3. Extend `RetrievalResult`:

```ts
export type RetrievalResult = {
  id: string;
  label: string;
  title: string;
  source: { kind: SourceKind; slug?: string; url?: string };
  score: number;
  parts: { cosine?: number; keyword?: number; boost?: number };
  reasons: string[];
  breakdown: SignalBreakdown[];
};
```

4. Extend `CopilotEvent` — insert the `plan` member right after `meta`, and add the three new `stats` fields:

```ts
export type CopilotEvent =
  | { type: "meta"; id: string; mode: CopilotMode; model: string; startedAt: number }
  | { type: "plan"; plan: Plan }
  | { type: "delta"; text: string }
  | { type: "sources"; sources: RetrievalResult[] }
  | { type: "card"; card: CopilotCard | null }
  | {
      type: "stats";
      tokens: { in: number; out: number };
      retrievalMs: number;
      totalMs: number;
      cache: "hit" | "build" | "miss";
      intent: Intent;
      confidence: number;
      strategy: "primary" | "relaxed";
    }
  | { type: "done"; finish: "stop" | "length" }
  | { type: "error"; code: number; message: string };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Keep the suite green**

Run `npx tsc --noEmit`. Fix now-stale literal shapes (re-verified against current sources). Each edit is a minimal placeholder; the owning tasks rewrite these files wholesale:

- `tests/scoring.test.ts` — the three `Chunk` literals gain `label: "a"`, `authority: "metrics"`, `priority: 0.15`. (Task 5 replaces the file.)
- `tests/prompt.test.ts` — the two `RetrievalResult` literals gain `label: "RestAI"`, `breakdown: []`. (Prompt signatures change in Task 7.)
- `tests/service.test.ts` — the cached `RetrievalResult` literal gains `label: "RestAI"`, `breakdown: []`. (Task 9 rewrites the file.)
- `lib/copilot/corpus.ts` — add `label`, `authority: AUTHORITY[kind]`-style metadata to the two literal pushes (the `push` helper object and the project-chunk object). Placeholder values are fine; Task 2 owns the real maps. Minimal shape:

```ts
// project chunk push: add the three fields and a placeholder priority
priority: 0.4,
label: p.title,
authority: "metrics",
// push() helper object: add
label,
authority: "first-party",
priority: 0.1,
```

- `lib/copilot/scoring.ts` — the `retrieveTopK` map return gains `label: chunk.label` and `breakdown: []`. (Task 5 rewrites the file.)
- `lib/copilot/service.ts` — the `stats` event literal gains `intent: "general", confidence: 0, strategy: "primary"` so the union stays satisfied before Task 9 rebuilds the pipeline.

Resolve conflicts in this task only to keep tsc green; the later owning tasks rewrite these files.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/types.ts tests/types.test.ts
git commit -m "feat(copilot): v2 protocol types — intent, plan, authority, breakdown"
```

---

### Task 2: Corpus v2 — new derived chunks + metadata

**Files:**
- Modify: `lib/copilot/corpus.ts`
- Test: `tests/corpus.test.ts`

**Interfaces:**
- Consumes: `Chunk`, `DocAuthority`, `SourceKind`, `lib/data` exports (`profile`, `stats`, `projects`, `experience`, `skills`, `principles`, `insights`, `trajectory`, `githubStats`).
- Produces: `buildChunks()` — v1 ids plus `hire`, `about`, `linkedin` (all derived; no canned prose). All chunks carry `label`, `authority`, `priority`. `hire` → `metrics`; `linkedin` → `external`; project/resume/stats → `metrics`; skills/principles → `first-party`; experience/insight → `external`.

- [ ] **Step 1: Write the failing test**

Append to `tests/corpus.test.ts`:

```ts
test("v2: each chunk carries label, authority, and a normalized priority", () => {
  const chunks = buildChunks();
  for (const c of chunks) {
    assert.ok(typeof c.label === "string" && c.label.length > 0, `label missing for ${c.id}`);
    assert.ok(["first-party", "metrics", "external"].includes(c.authority), `authority missing for ${c.id}`);
    assert.ok(c.priority > 0 && c.priority <= 1, `priority out of range for ${c.id}`);
  }
});

test("v2: hire, about, linkedin chunks are derived from site data", () => {
  const byId = new Map(buildChunks().map((c) => [c.id, c]));
  for (const id of ["hire", "about", "linkedin"]) {
    assert.ok(byId.has(id), `missing chunk ${id}`);
    const c = byId.get(id)!;
    assert.ok(c.text.length > 40, `${id} text too short`);
  }
  const hire = byId.get("hire")!;
  assert.ok(hire.text.includes(profile.name), "hire chunk must name the profile");
  assert.equal(hire.authority, "metrics");
  const linkedin = byId.get("linkedin")!;
  assert.equal(linkedin.authority, "external");
  assert.ok(
    linkedin.text.includes(profile.linkedin) || linkedin.text.includes(profile.github),
    "linkedin chunk must carry profile links",
  );
  assert.ok(hire.keywords.includes("hire"), "hire chunk must keyword 'hire'");
});
```

Update the file's import line to include `profile`:

```ts
import { profile } from "../lib/data";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/corpus.test.ts`
Expected: FAIL — missing chunks/metadata.

- [ ] **Step 3: Implement**

First, extend `SourceKind` in `lib/copilot/types.ts` with the three derived kinds (keeps intent-boost, authority, and mode maps type-safe):

```ts
export type SourceKind =
  | "project"
  | "skill"
  | "principle"
  | "experience"
  | "insight"
  | "resume"
  | "stats"
  | "hire"
  | "about"
  | "linkedin";
```

Then rewrite `lib/copilot/corpus.ts` in full:

```ts
import type { Chunk, DocAuthority, SourceKind } from "@/lib/copilot/types";
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

const AUTHORITY: Record<SourceKind, DocAuthority> = {
  project: "metrics",
  skill: "first-party",
  principle: "first-party",
  experience: "external",
  insight: "external",
  resume: "metrics",
  stats: "metrics",
  hire: "metrics",
  about: "first-party",
  linkedin: "external",
};

const BASE_PRIORITY: Record<SourceKind, number> = {
  project: 0.4,
  skill: 0.2,
  principle: 0.15,
  experience: 0.3,
  insight: 0.1,
  resume: 0.5,
  stats: 0.25,
  hire: 0.6,
  about: 0.3,
  linkedin: 0.2,
};

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
      label: p.title,
      text,
      source: {
        kind: "project",
        slug: p.study?.slug ?? slugify(p.title),
        url: p.href,
      },
      keywords: keywordsFrom(p.title, p.domain, p.tagline, p.stack.join(" ")),
      authority: AUTHORITY.project,
      priority: BASE_PRIORITY.project,
    });
  }

  const push = (
    id: string,
    kind: SourceKind,
    label: string,
    title: string,
    text: string,
    kw: string[],
  ) =>
    chunks.push({
      id,
      label,
      title,
      text,
      source: { kind },
      keywords: kw,
      authority: AUTHORITY[kind],
      priority: BASE_PRIORITY[kind],
    });

  push(
    "resume",
    "resume",
    "Resume",
    "Resume summary",
    `Name: ${profile.name}. Roles: ${profile.roles.join(", ")}. Location: ${profile.location}. Email: ${profile.email}. LinkedIn: ${profile.linkedin}. GitHub: ${profile.github}. Resume PDF: ${profile.resume}.`,
    keywordsFrom(profile.name, ...profile.roles, "resume"),
  );

  push(
    "stats",
    "stats",
    "Stats",
    "Key statistics",
    `Stats: ${stats.map((s) => `${s.value} ${s.label}`).join(". ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join(". ")}.`,
    keywordsFrom("stats", "tests", "latency", "books", "repositories"),
  );

  push(
    "skills",
    "skill",
    "Skills",
    "Skills by discipline",
    skills.map((g) => `${g.title}: ${g.items.join(", ")}`).join(". "),
    keywordsFrom(skills.map((g) => g.items.join(" ")).join(" "), "skills"),
  );

  push(
    "principles",
    "principle",
    "Principles",
    "Engineering principles",
    principles.map((p) => `${p.index} ${p.title}: ${p.body}`).join(". "),
    keywordsFrom(principles.map((p) => `${p.title} ${p.body}`).join(" ")),
  );

  push(
    "experience",
    "experience",
    "Experience",
    "Work experience",
    experience
      .map((r) => `${r.title} at ${r.company} (${r.period}): ${r.points.join(" ")}`)
      .join(". "),
    keywordsFrom(experience.map((r) => `${r.title} ${r.company} ${r.points.join(" ")}`).join(" ")),
  );

  push(
    "trajectory",
    "experience",
    "Trajectory",
    "Career trajectory",
    trajectory.map((t) => `${t.period} ${t.title}: ${t.body} [${t.tags.join(", ")}]`).join(". "),
    keywordsFrom(trajectory.map((t) => `${t.title} ${t.tags.join(" ")}`).join(" ")),
  );

  push(
    "insights",
    "insight",
    "Insights",
    "Writing and research",
    insights.map((i) => `${i.index} ${i.title}: ${i.body} (${i.href}, ${i.tag})`).join(". "),
    keywordsFrom(insights.map((i) => `${i.title} ${i.body} ${i.tag}`).join(" ")),
  );

  const hireText = [
    `Why hire ${profile.name}: ${profile.roles.join(", ")} based in ${profile.location}.`,
    `Track record: ${stats.map((s) => `${s.value} ${s.label}`).join("; ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join("; ")}.`,
    `Production AI experience: ${experience.map((r) => `${r.title} at ${r.company} (${r.period})`).join("; ")}.`,
    `Skills: ${skills.map((g) => g.items.join(", ")).join("; ")}.`,
    `Principles: ${principles.map((p) => `${p.index} ${p.title}`).join("; ")}.`,
  ].join(" ");

  push(
    "hire",
    "hire",
    "Hire",
    "Why hire Mohamed",
    hireText,
    keywordsFrom(
      "hire",
      ...profile.roles,
      stats.map((s) => s.label).join(" "),
      experience.map((r) => r.company).join(" "),
      "production",
      "evidence",
      "tests",
    ),
  );

  const aboutText = [
    `About ${profile.name}: ${profile.roles.join(", ")} based in ${profile.location}.`,
    `Career trajectory: ${trajectory.map((t) => `${t.period} ${t.title}: ${t.body}`).join(". ")}.`,
    `Principles: ${principles.map((p) => `${p.title}: ${p.body}`).join(". ")}.`,
    `Writing: ${insights.map((i) => `${i.title}: ${i.body}`).join(". ")}.`,
  ].join(" ");

  push(
    "about",
    "about",
    "About",
    "About Mohamed",
    aboutText,
    keywordsFrom("about", ...profile.roles, trajectory.map((t) => t.title).join(" "), principles.map((p) => p.title).join(" ")),
  );

  push(
    "linkedin",
    "linkedin",
    "LinkedIn",
    "LinkedIn and links",
    `Contact ${profile.name}: email ${profile.email}, LinkedIn ${profile.linkedin}, GitHub ${profile.github}, resume ${profile.resume}.`,
    keywordsFrom("linkedin", "contact", "email", "github", "resume"),
  );

  return chunks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/corpus.test.ts`
Expected: PASS — all v1 tests plus the three v2 assertions (metadata on every chunk; `hire`/`about`/`linkedin` present with derived text and correct authorities).

- [ ] **Step 5: Keep the suite green**

Run `npx tsc --noEmit`. Because `buildChunks()` is the single source of chunks, every `Chunk` literal in tests already gained `label`/`authority`/`priority` in Task 1. `SourceKind` is only typed (never constructed directly), so the three new kinds cannot break a literal. The committed `lib/index/meta.json` is now stale (13 v1 chunks without metadata) — that is expected and is regenerated in Task 8.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/types.ts lib/copilot/corpus.ts tests/corpus.test.ts
git commit -m "feat(copilot): corpus v2 — hire/about/linkedin chunks, authority + priority metadata"
```

---

### Task 3: Deterministic intent classification

**Files:**
- Create: `lib/copilot/intent.ts`
- Test: `tests/intent.test.ts`

**Interfaces:**
- Produces:
  - `INTENTS: Intent[]` (all nine, `general` last)
  - `INTENT_RULES: Record<Exclude<Intent, "general">, string[]>` — phrase triggers for the rule phase
  - `INTENT_CENTROIDS: Record<Exclude<Intent, "general">, string[]>` — representative phrases used by `scripts/build-kb.ts` to build centroid vectors (consumed by Task 8)
  - `normalizeIntent(text): string`
  - `classifyByRules(message): IntentResult` — rule phase (pure, synchronous)
  - `classifyByCentroid(vec, centroids): IntentResult` — centroid fallback (synchronous)
  - `classifyMessage({ message, embedder, centroids }): Promise<IntentResult>` — rule first, centroid second, `general` last
- Consumes: `Intent`, `IntentResult` (Task 1), `cosine` from `lib/copilot/scoring.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/intent.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyByRules,
  classifyByCentroid,
  INTENT_RULES,
} from "../lib/copilot/intent";
import type { Intent } from "../lib/copilot/types";

// Synthetic 2-dim centroids keep this test index-independent.
const syntheticCentroids: Partial<Record<Intent, Float32Array>> = {
  recruiter: new Float32Array([1, 0]),
  architecture: new Float32Array([0, 1]),
};

test("the nine intents are covered and general is the fallback", () => {
  const want = ["recruiter", "project", "architecture", "interview", "resume", "skills", "experience", "decision"];
  for (const w of want) {
    assert.ok(INTENT_RULES[w as keyof typeof INTENT_RULES].length > 0, `missing rules for ${w}`);
  }
  assert.equal(classifyByRules("what is the capital of france").primary, "general");
});

test("recruiter probe maps to recruiter with high confidence", () => {
  const r = classifyByRules("Why should I hire you?");
  assert.equal(r.primary, "recruiter");
  assert.ok(r.confidence >= 0.85);
});

test("architecture probe maps to architecture", () => {
  assert.equal(classifyByRules("Explain the RestAI architecture").primary, "architecture");
});

test("interview probe maps to interview", () => {
  assert.equal(classifyByRules("Interview me about RestAI").primary, "interview");
});

test("skills probe maps to skills", () => {
  assert.equal(classifyByRules("What are your skills?").primary, "skills");
});

test("experience probe maps to experience", () => {
  assert.equal(classifyByRules("Where have you worked?").primary, "experience");
});

test("resume probe maps to resume", () => {
  assert.equal(classifyByRules("Give me a resume summary").primary, "resume");
});

test("project probe maps to project", () => {
  assert.equal(classifyByRules("What did you build?").primary, "project");
});

test("decision probe maps to decision", () => {
  const r = classifyByRules("Why did you pick pgvector?");
  assert.equal(r.primary, "decision");
});

test("ambiguous probes receive a secondary intent", () => {
  const r = classifyByRules("Interview me about your resume");
  assert.ok(r.secondary !== undefined);
});

test("centroid fallback recovers the nearest intent without rules", () => {
  const r = classifyByCentroid(syntheticCentroids["recruiter"]!, syntheticCentroids);
  assert.equal(r.primary, "recruiter");
  assert.ok(r.confidence >= 0.7);
});

test("centroid fallback returns general for an unrelated vector", () => {
  const r = classifyByCentroid(new Float32Array(2), syntheticCentroids);
  assert.equal(r.primary, "general");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/intent.test.ts`
Expected: FAIL — `../lib/copilot/intent` does not exist, and the test references helpers not yet written.

- [ ] **Step 3: Implement**

Create `lib/copilot/intent.ts`:

```ts
import type { Intent, IntentResult } from "@/lib/copilot/types";
import { cosine } from "@/lib/copilot/scoring";

export const INTENTS: Intent[] = [
  "recruiter",
  "project",
  "architecture",
  "interview",
  "resume",
  "skills",
  "experience",
  "decision",
  "general",
];

export const INTENT_RULES: Record<Exclude<Intent, "general">, string[]> = {
  recruiter: [
    "why hire",
    "why should i",
    "hire you",
    "hire me",
    "recruit",
    "hiring",
    "strong candidate",
    "fit for",
  ],
  project: [
    "what did you build",
    "what have you built",
    "tell me about your projects",
    "your projects",
    "project work",
    "built",
    "created",
  ],
  architecture: [
    "architecture",
    "how does it work",
    "how is it built",
    "data flow",
    "flow through",
    "layers",
    "diagram",
    "under the hood",
    "system design",
    "pipeline",
  ],
  interview: [
    "interview me",
    "interview",
    "ask me",
    "quiz me",
    "question me",
  ],
  resume: [
    "resume summary",
    "resume",
    "cv",
    "summary about you",
    "about you",
    "who are you",
    "tell me about yourself",
  ],
  skills: [
    "skills",
    "technologies",
    "tech stack",
    "stack",
    "frameworks",
    "what do you know",
    "languages",
    "tools you use",
  ],
  experience: [
    "work experience",
    "experience",
    "career",
    "where have you worked",
    "companies",
    "roles you held",
    "job history",
  ],
  decision: [
    "tradeoffs",
    "trade-off",
    "why did you",
    "why that",
    "why choose",
    "why not",
    "key decisions",
    "decision",
  ],
};

export const INTENT_CENTROIDS: Record<Exclude<Intent, "general">, string[]> = {
  recruiter: [
    "Why should I hire you?",
    "What makes you a strong candidate?",
    "Your experience and strengths for this role",
    "How do you add value to a team?",
  ],
  project: [
    "What did you build?",
    "Tell me about your projects",
    "Your project work and its impact",
    "RestAI RAG assistant and forecasting engine",
  ],
  architecture: [
    "Explain the architecture of RestAI",
    "How does the data flow through the system?",
    "Walk me through the pipeline layers",
    "Design decisions and system architecture",
  ],
  interview: [
    "Interview me about your work",
    "Ask me questions about my projects",
    "Mock technical interview",
  ],
  resume: [
    "Give me your resume summary",
    "About you and your background",
    "Who are you and what do you do?",
  ],
  skills: [
    "What skills and technologies do you have?",
    "Your tech stack and tools",
    "List your technical skills",
  ],
  experience: [
    "Where have you worked?",
    "Your work experience and career",
    "Companies and roles you have held",
  ],
  decision: [
    "Why did you choose that approach?",
    "What tradeoffs did you make?",
    "Key decisions and their reasoning",
  ],
};

const RULE_CONFIDENCE = 0.9;
const GENERAL_CONFIDENCE = 0.2;
export const CENTROID_MIN = 0.35;
export const CENTROID_MAX = 0.82;

export function normalizeIntent(text: string): string {
  return text.toLowerCase().replace(/[?!.,;:]+/g, " ").replace(/\s+/g, " ").trim();
}

export function classifyByRules(message: string): IntentResult {
  const q = normalizeIntent(message);
  const hits: Intent[] = [];
  for (const intent of INTENTS) {
    if (intent === "general") continue;
    if (INTENT_RULES[intent].some((p) => q.includes(p))) hits.push(intent);
  }
  if (hits.length > 0) {
    return { primary: hits[0], secondary: hits[1], confidence: RULE_CONFIDENCE };
  }
  return { primary: "general", confidence: GENERAL_CONFIDENCE };
}

export function classifyByCentroid(
  vec: Float32Array,
  centroids: Partial<Record<Intent, Float32Array>>,
): IntentResult {
  let best: Intent = "general";
  let bestScore = 0;
  for (const intent of INTENTS) {
    if (intent === "general") continue;
    const c = centroids[intent];
    if (!c) continue;
    const score = cosine(vec, c);
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }
  if (bestScore >= CENTROID_MIN) {
    const confidence = Math.min(CENTROID_MAX, 0.4 + (bestScore - CENTROID_MIN) * 1.6);
    return { primary: best, confidence };
  }
  return { primary: "general", confidence: GENERAL_CONFIDENCE };
}

export async function classifyMessage(input: {
  message: string;
  embedder: (text: string) => Promise<Float32Array>;
  centroids: Partial<Record<Intent, Float32Array>>;
}): Promise<IntentResult> {
  const byRule = classifyByRules(input.message);
  if (byRule.primary !== "general") return byRule;
  const vec = await input.embedder(input.message);
  return classifyByCentroid(vec, input.centroids);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/intent.test.ts`
Expected: PASS — all nine intents rule-mapped, centroid fallback hits the nearest intent, noise vector degrades to `general`.

- [ ] **Step 5: Keep the suite green**

Run `npx tsc --noEmit`. `intent.ts` imports `cosine` from `scoring.ts` — existing exports are unchanged, so no other file needs edits here.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/intent.ts tests/intent.test.ts
git commit -m "feat(copilot): deterministic intent classifier with centroid fallback"
```

---

### Task 4: Intent-aware query rewriting

**Files:**
- Create: `lib/copilot/rewrite.ts`
- Test: `tests/rewrite.test.ts`

**Interfaces:**
- Produces: `INTENT_EXPANSIONS: Record<Intent, string[]>`, `tokenize(query): string[]`, `rewriteQuery(message, intent): string[]` (token sets only — the embedding still runs on the original message in Task 9).
- Consumes: `Intent`.

- [ ] **Step 1: Write the failing test**

Create `tests/rewrite.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteQuery, tokenize, MAX_EXPANSION_TOKENS } from "../lib/copilot/rewrite";

test("tokenize keeps meaningful tokens and drops noise", () => {
  assert.deepEqual(tokenize("What did you build?"), ["what", "did", "you", "build"]);
  assert.equal(tokenize("a bc def").some((t) => t.length < 3), false);
});

test("recruiter probes expand with fit/skills/experience vocabulary", () => {
  const tokens = rewriteQuery("Why should I hire you?", "recruiter");
  assert.ok(tokens.includes("hire"));
  assert.ok(tokens.includes("experience"), "expansion should add experience");
});

test("general intent is a pure tokenization no-op", () => {
  assert.deepEqual(rewriteQuery("hello world", "general"), tokenize("hello world"));
});

test("expansion is capped and never duplicates base tokens", () => {
  const tokens = rewriteQuery("hire skills engineer", "recruiter");
  const base = tokenize("hire skills engineer");
  const extra = tokens.filter((t) => !base.includes(t));
  assert.ok(extra.length <= MAX_EXPANSION_TOKENS);
  assert.equal(new Set(tokens).size, tokens.length);
});

test("architecture intent pulls flow and decisions vocabulary", () => {
  const tokens = rewriteQuery("show RestAI", "architecture");
  for (const w of ["architecture", "flow", "decisions"]) {
    assert.ok(tokens.includes(w), `missing ${w}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/rewrite.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

Create `lib/copilot/rewrite.ts`:

```ts
import type { Intent } from "@/lib/copilot/types";

export const MAX_EXPANSION_TOKENS = 8;

export const INTENT_EXPANSIONS: Record<Intent, string[]> = {
  recruiter: ["AI engineer", "ML engineer", "LLM engineer", "shipped products", "skills", "experience", "hire", "evidence"],
  project: ["built", "stack", "impact", "RAG", "forecasting", "architecture"],
  architecture: ["architecture", "flow", "layers", "decisions", "tradeoffs", "data flow"],
  interview: ["project", "decision", "reasoning", "challenge", "tradeoff"],
  resume: ["roles", "summary", "profile", "location"],
  skills: ["tools", "stack", "technologies", "frameworks"],
  experience: ["roles", "companies", "career", "period"],
  decision: ["tradeoff", "reasoning", "chose", "why", "constraint"],
  general: [],
};

export function tokenize(q: string): string[] {
  return q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
}

export function rewriteQuery(message: string, intent: Intent): string[] {
  const base = tokenize(message);
  if (intent === "general") return base;
  const extra = [
    ...new Set(INTENT_EXPANSIONS[intent].flatMap((p) => tokenize(p))),
  ]
    .filter((t) => !base.includes(t))
    .slice(0, MAX_EXPANSION_TOKENS);
  return [...base, ...extra];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/rewrite.test.ts`
Expected: PASS.

- [ ] **Step 5: Keep the suite green**

Run `npx tsc --noEmit`. No consumer changes yet; the service wiring lands in Task 9.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/rewrite.ts tests/rewrite.test.ts
git commit -m "feat(copilot): intent-aware deterministic query rewriting"
```

---

### Task 5: Hybrid retrieval v2 — five signals + breakdown

**Files:**
- Modify: `lib/copilot/scoring.ts`
- Test: `tests/scoring.test.ts` (rewritten)

**Interfaces:**
- Produces: `INTENT_BOOST`, `AUTHORITY_REASON`, `DEFAULT_WEIGHTS`, `RetrieveOpts` gains `intent` and extended `weights`; `retrieveTopK` unchanged in signature semantics, scoring now blends cosine + keyword + intent + mode + priority and emits `reasons` plus `breakdown`.
- Consumes: `Chunk`, `CopilotMode`, `Intent`, `RetrievalResult`, `SignalBreakdown`, `DocAuthority`.

- [ ] **Step 1: Write the failing test**

Replace `tests/scoring.test.ts` in full:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { cosine, keywordOverlap, retrieveTopK, INTENT_BOOST, MODE_BOOST } from "../lib/copilot/scoring";
import type { Chunk } from "../lib/copilot/types";

const chunk = (id: string, kind: Chunk["source"]["kind"], priority: number, keywords: string[] = []): Chunk => ({
  id,
  title: id,
  label: id,
  text: id,
  source: { kind },
  keywords,
  authority: kind === "project" ? "metrics" : "first-party",
  priority,
});

test("cosine of identical vectors is 1, orthogonal is 0", () => {
  assert.ok(Math.abs(cosine(new Float32Array([1, 0]), new Float32Array([1, 0])) - 1) < 1e-6);
  assert.ok(Math.abs(cosine(new Float32Array([1, 0]), new Float32Array([0, 1]))) < 1e-6);
});

test("keywordOverlap returns matched fraction of query tokens", () => {
  assert.equal(keywordOverlap(["rag", "vector", "zzz"], ["rag", "retrieval", "vector"]), 2 / 3);
  assert.equal(keywordOverlap(["nope"], ["rag"]), 0);
});

test("retrieveTopK ranks and caps results", () => {
  const emb = {
    a: new Float32Array([1, 0]),
    b: new Float32Array([0.9, 0.1]),
    c: new Float32Array([0, 1]),
  };
  const chunks = [chunk("a", "project", 0.4, ["rag"]), chunk("b", "project", 0.4, ["rag"]), chunk("c", "skill", 0.2, ["cv"])];
  const out = retrieveTopK(new Float32Array([1, 0]), ["rag"], chunks, {
    k: 2,
    minScore: 0,
    embeddings: emb,
    weights: { cosine: 1, keyword: 0, intent: 0, mode: 0, priority: 0 },
  });
  assert.equal(out.length, 2);
  assert.equal(out[0].id, "a");
  assert.ok(out[0].reasons.some((r) => r.startsWith("cosine")));
});

test("priority signal lets a strong document win ties", () => {
  const chunks = [
    chunk("low", "project", 0.2),
    chunk("high", "project", 0.6),
  ];
  const embeddings = {
    low: new Float32Array([1, 0]),
    high: new Float32Array([0.99, 0.01]),
  };
  const out = retrieveTopK(new Float32Array([1, 0]), [], chunks, {
    k: 5,
    minScore: 0,
    embeddings,
    weights: { cosine: 0.2, keyword: 0.2, intent: 0.2, mode: 0.2, priority: 0.2 },
  });
  assert.equal(out[0].id, "high");
});

test("intent boost reorders recruiter results toward hire/resume", () => {
  const chunks = [
    chunk("proj", "project", 0.4),
    chunk("hire", "hire", 0.6, ["hire"]),
  ];
  const embeddings = {
    proj: new Float32Array([1, 0]),
    hire: new Float32Array([0.98, 0.02]),
  };
  const out = retrieveTopK(new Float32Array([0.98, 0.02]), ["hire"], chunks, {
    k: 5,
    minScore: 0,
    embeddings,
    intent: "recruiter",
    mode: "general",
  });
  assert.equal(out[0].id, "hire");
  assert.ok((INTENT_BOOST.recruiter.hire ?? 0) > 0);
});

test("every result carries reasons and a machine breakdown", () => {
  const chunks = [chunk("a", "project", 0.4, ["rag"])];
  const embeddings = { a: new Float32Array([1, 0]) };
  const out = retrieveTopK(new Float32Array([1, 0]), ["rag"], chunks, {
    k: 5,
    minScore: 0,
    embeddings,
    intent: "project",
  });
  assert.ok(out[0].breakdown.length >= 2, "breakdown should at least carry cosine and keyword");
  assert.ok(out[0].breakdown.some((b) => b.signal === "cosine"));
  assert.ok(out[0].reasons.some((r) => r.includes("authority")));
});

test("minScore filters weak matches", () => {
  const chunks = [chunk("a", "project", 0.1), chunk("b", "project", 0.1)];
  const embeddings = {
    a: new Float32Array([1, 0]),
    b: new Float32Array([0.5, 0.5]),
  };
  const out = retrieveTopK(new Float32Array([1, 0]), [], chunks, {
    k: 5,
    minScore: 0.99,
    embeddings,
    weights: { cosine: 1, keyword: 0, intent: 0, mode: 0, priority: 0 },
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "a");
});

test("mode boost still reorders toward the selected mode", () => {
  assert.ok((MODE_BOOST.recruiter.experience ?? 0) > (MODE_BOOST.recruiter.project ?? 0));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/scoring.test.ts`
Expected: FAIL — new weights keys, `INTENT_BOOST`, and `breakdown`/`label` are not implemented yet.

- [ ] **Step 3: Implement**

Rewrite `lib/copilot/scoring.ts` in full:

```ts
import type {
  Chunk,
  CopilotMode,
  DocAuthority,
  Intent,
  RetrievalResult,
  RetrievalSignal,
  SignalBreakdown,
  SourceKind,
} from "@/lib/copilot/types";

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

export const INTENT_BOOST: Record<Intent, Partial<Record<SourceKind, number>>> = {
  recruiter: { hire: 0.22, resume: 0.12, experience: 0.1, skill: 0.06, stats: 0.04 },
  project: { project: 0.15 },
  architecture: { project: 0.2 },
  interview: { project: 0.1, principle: 0.08, insight: 0.05 },
  resume: { resume: 0.2 },
  skills: { skill: 0.2 },
  experience: { experience: 0.2 },
  decision: { project: 0.12, principle: 0.06, insight: 0.05 },
  general: {},
};

export const AUTHORITY_REASON: Record<DocAuthority, string> = {
  "first-party": "authority: first-party",
  metrics: "authority: metrics",
  external: "authority: external",
};

export const DEFAULT_WEIGHTS = { cosine: 0.45, keyword: 0.2, intent: 0.15, mode: 0.1, priority: 0.1 };

export type RetrieveOpts = {
  k?: number;
  minScore?: number;
  weights?: Partial<typeof DEFAULT_WEIGHTS>;
  mode?: CopilotMode;
  intent?: Intent;
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
  const weights = { ...DEFAULT_WEIGHTS, ...opts.weights };
  const mode = opts.mode ?? "general";
  const intent = opts.intent ?? "general";
  const modeBoost = MODE_BOOST[mode];
  const intentBoost = INTENT_BOOST[intent];

  const scored = chunks
    .map((chunk): RetrievalResult => {
      const vec = opts.embeddings[chunk.id];
      const cosineScore = vec ? cosine(queryVec, vec) : 0;
      const keywordScore = keywordOverlap(queryTokens, chunk.keywords);
      const intentScore = intentBoost[chunk.source.kind] ?? 0;
      const modeScore = modeBoost[chunk.source.kind] ?? 0;
      const priorityScore = chunk.priority;
      const score =
        weights.cosine * cosineScore +
        weights.keyword * keywordScore +
        weights.intent * intentScore +
        weights.mode * modeScore +
        weights.priority * priorityScore;

      const breakdown: SignalBreakdown[] = [
        { signal: "cosine", value: cosineScore, weight: weights.cosine },
        { signal: "keyword", value: keywordScore, weight: weights.keyword },
      ];
      if (intentScore > 0) breakdown.push({ signal: "intent", value: intentScore, weight: weights.intent });
      if (modeScore > 0) breakdown.push({ signal: "mode", value: modeScore, weight: weights.mode });
      breakdown.push({ signal: "priority", value: priorityScore, weight: weights.priority });

      const reasons: string[] = [];
      if (vec) reasons.push(`cosine ${cosineScore.toFixed(2)}`);
      if (keywordScore > 0) reasons.push(`keyword '${queryTokens.join(" ")}'`);
      if (intentScore > 0) reasons.push(`intent: ${intent} boost`);
      if (modeScore > 0) reasons.push(`mode: ${mode} boost`);
      reasons.push(AUTHORITY_REASON[chunk.authority]);
      if (reasons.length === 0) reasons.push("index match");

      return {
        id: chunk.id,
        label: chunk.label,
        title: chunk.title,
        source: chunk.source,
        score,
        parts: {
          cosine: vec ? cosineScore : undefined,
          keyword: keywordScore > 0 ? keywordScore : undefined,
          boost: intentScore + modeScore > 0 ? intentScore + modeScore : undefined,
        },
        reasons,
        breakdown,
      };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return scored.slice(0, k);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/scoring.test.ts`
Expected: PASS — including the recruiter→`hire` reorder and the ≥2-signal `breakdown` assertion.

- [ ] **Step 5: Keep the suite green**

Run `npx tsc --noEmit`. The scoring change is contained here; `service.ts` still calls `retrieveTopK` with the old opts shape (it passes `weights` for cosine/keyword/boost only) — `Partial` accepts it, and untouched `mode`/`embeddings` remain. No other edits needed.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/scoring.ts tests/scoring.test.ts
git commit -m "feat(copilot): five-signal hybrid retrieval with structured breakdown"
```

---

### Task 6: Answer Planner

**Files:**
- Create: `lib/copilot/planner.ts`
- Test: `tests/planner.test.ts`

**Interfaces:**
- Produces: `buildPlan({ intent, results }): Plan` — deterministic mapping of intent + retrieval health to template/stance/card/suggestions.
- Consumes: `IntentResult`, `Plan`, `RetrievalResult`.

- [ ] **Step 1: Write the failing test**

Create `tests/planner.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlan } from "../lib/copilot/planner";
import type { IntentResult, RetrievalResult } from "../lib/copilot/types";

const result = (id: string, kind: string, score: number): RetrievalResult => ({
  id,
  label: id,
  title: id,
  source: { kind: kind as never },
  score,
  parts: {},
  reasons: ["cosine 0.5"],
  breakdown: [{ signal: "cosine", value: 0.5, weight: 0.45 }],
});

test("recruiter planner picks the resume card at high stance", () => {
  const plan = buildPlan({
    intent: { primary: "recruiter", confidence: 0.9 },
    results: [result("hire", "hire", 0.6), result("resume", "resume", 0.4)],
  });
  assert.equal(plan.template, "recruiter");
  assert.equal(plan.stance, "high");
  assert.equal(plan.card, "resume");
});

test("empty retrieval produces fallback stance with suggestions", () => {
  const plan = buildPlan({ intent: { primary: "general", confidence: 0.2 }, results: [] });
  assert.equal(plan.stance, "fallback");
  assert.ok(plan.suggestions !== undefined && plan.suggestions.length > 0);
});

test("project intent with a project doc drives a project card", () => {
  const plan = buildPlan({
    intent: { primary: "project", confidence: 0.9 },
    results: [result("project-restai", "project", 0.7)],
  });
  assert.equal(plan.card, "project");
  assert.equal(plan.stance, "high");
});

test("skills intent drives a skills card when a skill doc present", () => {
  const plan = buildPlan({
    intent: { primary: "skills", confidence: 0.9 },
    results: [result("skills", "skill", 0.5)],
  });
  assert.equal(plan.card, "skills");
});

test("experience intent drives a timeline card", () => {
  const plan = buildPlan({
    intent: { primary: "experience", confidence: 0.9 },
    results: [result("experience", "experience", 0.5)],
  });
  assert.equal(plan.card, "timeline");
});

test("general intent stays general and derives stats card from stats docs", () => {
  const plan = buildPlan({
    intent: { primary: "general", confidence: 0.2 },
    results: [result("stats", "stats", 0.5)],
  });
  assert.equal(plan.template, "general");
  assert.equal(plan.card, "stats");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/planner.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

Create `lib/copilot/planner.ts`:

```ts
import type {
  Intent,
  IntentResult,
  Plan,
  PlanCard,
  RetrievalResult,
} from "@/lib/copilot/types";

export const HIGH_MIN = 0.3;
export const MEDIUM_MIN = 0.15;
export const FALLBACK_SUGGESTIONS = ["Skills", "Projects", "Experience"];

function pickCard(intent: Intent, results: RetrievalResult[]): PlanCard {
  const has = (kind: string) => results.some((r) => r.source.kind === kind);
  switch (intent) {
    case "recruiter":
      return "resume";
    case "project":
    case "architecture":
      return has("project") ? "project" : "links";
    case "interview":
      return has("project") ? "project" : has("experience") ? "timeline" : "none";
    case "resume":
      return "resume";
    case "skills":
      return has("skill") ? "skills" : "none";
    case "experience":
      return has("experience") ? "timeline" : "none";
    case "decision":
      return has("project") ? "project" : "none";
    default:
      return has("stats") ? "stats" : "none";
  }
}

export function buildPlan(input: {
  intent: IntentResult;
  results: RetrievalResult[];
  suggestions?: string[];
}): Plan {
  const { intent, results } = input;
  const top = results[0]?.score ?? 0;
  let stance: Plan["stance"];
  if (results.length === 0 || top < MEDIUM_MIN) stance = "fallback";
  else if (top >= HIGH_MIN) stance = "high";
  else stance = "medium";

  const template = (intent.primary === "general" ? "general" : intent.primary) as Plan["template"];
  const card = pickCard(intent.primary, results);
  const suggestions =
    stance === "fallback" ? input.suggestions ?? FALLBACK_SUGGESTIONS : undefined;
  return { template, stance, card, suggestions };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/planner.test.ts`
Expected: PASS.

- [ ] **Step 5: Keep the suite green**

Run `npx tsc --noEmit`.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/planner.ts tests/planner.test.ts
git commit -m "feat(copilot): deterministic answer planner (template/stance/card)"
```

---

### Task 7: Prompt templates v2

**Files:**
- Modify: `lib/copilot/prompt.ts`
- Test: `tests/prompt.test.ts`

**Interfaces:**
- Produces: `TEMPLATE_HINTS: Record<Plan["template"], string>` (per-intent H3-section + table hints), `buildSystemPrompt(mode, plan?)`, `buildMessages({ message, mode?, history?, results, plan? })`.
- Consumes: `Plan`, `RetrievalResult`, `ChatMessage`, `CopilotMode`.

- [ ] **Step 1: Write the failing test**

Merge `TEMPLATE_HINTS` into the existing import line at the top of `tests/prompt.test.ts`:

```ts
import { buildSystemPrompt, serializeContext, buildMessages, TEMPLATE_HINTS } from "../lib/copilot/prompt";
```

Then append the new tests to the end of the file:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/prompt.test.ts`
Expected: FAIL — `TEMPLATE_HINTS` missing and `buildSystemPrompt` has no `plan` branch.

- [ ] **Step 3: Implement**

Rewrite `lib/copilot/prompt.ts` in full:

```ts
import type { ChatMessage, CopilotMode, Plan, RetrievalResult } from "@/lib/copilot/types";
import { profile } from "@/lib/data";

const IDENTITY = `You are the Engineering Copilot for ${profile.name}, an AI/ML/LLM engineer based in ${profile.location}. You explain his work, projects, architecture, decisions, skills, and experience. Be professional, technical, precise, and concise. Prefer engineering language over marketing language. Never claim anything not present in the provided context, and never fabricate facts, numbers, or sources. If a question is outside his work or the provided sources, decline politely in one sentence. Cite the [N] source numbers from the context when you use them.`;

const MODE_INSTRUCTIONS: Record<CopilotMode, string> = {
  general: "Answer the question grounded in the context below.",
  recruiter:
    "Summarize experience, strengths, skills, and relevant projects. Emphasize evidence: shipped products, tests, latency, and real numbers from the context.",
  interview:
    "Answer as if you are Mohamed being interviewed. Show the reasoning behind decisions using the real project context.",
  architecture:
    "For the most relevant project, walk through the architecture flow from the context: layers, data flow, key decisions, tradeoffs, and what was learned.",
  explore:
    "Compare and connect projects: recommend one based on the question, note category, stack, and how they relate.",
};

export const TEMPLATE_HINTS: Record<Plan["template"], string> = {
  recruiter:
    "Structure the answer with H3 sections: 'Why hire Mohamed', 'Track record', 'Where he fits'. Use markdown tables for key metrics and skills.",
  project:
    "Structure with H3 sections: 'Overview', 'Architecture', 'Key decisions', 'Tradeoffs', 'Impact'. Use a markdown table for stack or performance.",
  interview:
    "Answer in a direct first-person tone with short paragraphs; show reasoning per decision and use a table for tradeoffs.",
  resume:
    "Give a compact profile: roles, location, highlights, links. Use bullet points, no verbose prose.",
  skills:
    "Group by discipline in a markdown table with columns 'Area' and 'Tools'. Keep it scannable.",
  experience:
    "Chronological list: role, company, period, and 2–3 evidence bullets each. Use a markdown table for the overview.",
  decision:
    "For each decision, give context → choice → tradeoff. Use a markdown table with columns 'Decision', 'Choice', 'Cost'.",
  general:
    "Answer concisely and stay grounded in the context. Use short paragraphs or a small markdown table where it aids scanning.",
};

export function buildSystemPrompt(mode: CopilotMode, plan?: Plan): string {
  const parts = [IDENTITY, MODE_INSTRUCTIONS[mode]];
  if (plan) {
    parts.push(TEMPLATE_HINTS[plan.template]);
    if (plan.stance === "fallback") {
      parts.push(
        "No supporting indexed context exists. Say in one sentence that you lack a grounded answer, then present the suggested related topics as bullet points.",
      );
    }
  }
  return parts.join("\n\n");
}

export function serializeContext(results: (RetrievalResult & { text?: string })[]): string {
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.text ? r.text : ""}`)
    .join("\n\n");
}

export function buildMessages(input: {
  message: string;
  mode?: CopilotMode;
  history?: ChatMessage[];
  results: RetrievalResult[];
  plan?: Plan;
}): ChatMessage[] {
  const mode = input.mode ?? "general";
  const plan = input.plan;
  const history = (input.history ?? []).slice(-6).map((m) => ({ role: m.role, content: m.content }));
  const context = serializeContext(input.results);
  let contextMsg: ChatMessage;
  if (context.length > 0) {
    contextMsg = {
      role: "user",
      content: `Relevant context:\n${context}\n\nAnswer only from this context, citing source numbers like [1].`,
    };
  } else if (plan?.suggestions?.length) {
    contextMsg = {
      role: "user",
      content: `No supporting context was retrieved. Do not fabricate. Say you cannot give a grounded answer, then suggest these related topics: ${plan.suggestions.join(", ")}.`,
    };
  } else {
    contextMsg = {
      role: "user",
      content: "No relevant context was retrieved. Say you have no grounded answer, then offer nearby topics.",
    };
  }

  return [{ role: "system", content: buildSystemPrompt(mode, plan) }, ...history, contextMsg, { role: "user", content: input.message }];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/prompt.test.ts` and `npx tsc --noEmit`.
Expected: PASS — the two original tests still pass (they call `buildSystemPrompt(mode)` without a plan and `buildMessages` without a plan), plus the three new ones.

- [ ] **Step 5: Keep the suite green**

Run: `npm test` (full). The new `plan` parameter is optional, so `service.ts` still compiles; the service wiring updates in Task 9.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/prompt.ts tests/prompt.test.ts
git commit -m "feat(copilot): plan-driven structured response templates"
```

---

### Task 8: Index v2 — centroids + regenerated artifacts

**Files:**
- Modify: `scripts/build-kb.ts`
- Modify: `lib/copilot/index.ts`
- Test: `tests/index.test.ts`
- Regenerate + commit: `lib/index/meta.json`, `lib/index/vectors.json`, **new** `lib/index/centroids.json`

**Interfaces:**
- Produces: `build-kb` emits per-intent centroid vectors; `loadCentroids()` returns `Record<string, Float32Array>` from the committed JSON.
- Consumes: `buildChunks()`, `INTENT_CENTROIDS` + `INTENTS` from `lib/copilot/intent.ts`.

- [ ] **Step 1: Write the failing test**

Replace `tests/index.test.ts` in full:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadIndex, loadCentroids } from "../lib/copilot/index";

test("committed index loads with matching meta and vectors", () => {
  const { chunks, embeddings } = loadIndex();
  assert.ok(chunks.length >= 16, `expected >= 16 chunks, got ${chunks.length}`);
  for (const c of chunks) {
    const vec = embeddings[c.id];
    assert.ok(vec, `missing vector for ${c.id}`);
    assert.equal(vec.length, 384);
  }
});

test("centroids cover the eight non-general intents", () => {
  const centroids = loadCentroids();
  const want = ["recruiter", "project", "architecture", "interview", "resume", "skills", "experience", "decision"];
  for (const w of want) {
    assert.ok(centroids[w], `missing centroid ${w}`);
  }
  assert.equal(Object.keys(centroids).length, 8);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/index.test.ts`
Expected: FAIL — `lib/index/centroids.json` does not exist; committed `meta.json` still has 13 legacy chunks.

- [ ] **Step 3: Implement**

Update `lib/copilot/index.ts` — add a centroid loader:

```ts
import centroids from "@/lib/index/centroids.json";
// existing meta/vectors imports unchanged

type Centroids = { ids: string[]; dim: number; data: number[][] };

let loadedCentroids: Record<string, Float32Array> | null = null;

export function loadCentroids(): Record<string, Float32Array> {
  if (loadedCentroids) return loadedCentroids;
  const { ids, data } = centroids as Centroids;
  const map: Record<string, Float32Array> = {};
  for (let i = 0; i < ids.length; i++) {
    map[ids[i]] = Float32Array.from(data[i]);
  }
  loadedCentroids = map;
  return loadedCentroids;
}
```

Update `scripts/build-kb.ts` to also emit per-intent centroids after the chunk loop:

```ts
import { INTENT_CENTROIDS, INTENTS } from "../lib/copilot/intent";
// existing imports unchanged

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
```

and after the existing writes:

```ts
  writeFileSync(path.join(indexDir, "centroids.json"), JSON.stringify({ ids: centroidIds, dim, data: centroidData }));
  console.log(`wrote ${chunks.length} chunks, ${centroidIds.length} centroids, dim ${dim}, to ${indexDir}`);
```

- [ ] **Step 4: Regenerate and verify**

Run: `npm run build:kb`
If the model is not yet in `models/`, the script downloads it once in dev (`allowRemoteModels = true`) and commits it with the artifacts. Re-run `npm test -- tests/index.test.ts`. Expected: PASS — 16 chunks (6 projects + 10 support chunks), centroid keys for 8 intents.

- [ ] **Step 5: Keep the suite green**

Run `npx tsc --noEmit` and `npm test`. The regenerated `meta.json`/`vectors.json` now carry the new corpus and metadata; `RetrievalResult` consumers from earlier tasks already use `label`/`breakdown`.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-kb.ts lib/copilot/index.ts tests/index.test.ts lib/index/
git commit -m "feat(copilot): regenerate index with centroids and v2 corpus metadata"
```

---

### Task 9: Service pipeline — classify → rewrite → retrieve → plan → stream

**Files:**
- Modify: `lib/copilot/service.ts`
- Test: `tests/service.test.ts` (rewritten)

**Interfaces:**
- Produces: `runCopilot` now emits `meta → plan → sources → card → delta* → stats → done`; `stats` gains `intent`, `confidence`, `strategy`; a confidence-gated relaxed pass backs up weak primary retrieval; `RunDeps` gains `classifyIntent`.
- Consumes: `classifyMessage`, `rewriteQuery`, `buildPlan`, `loadCentroids`, `retrieveTopK` (5-signal), `buildMessages` (plan-aware).

- [ ] **Step 1: Write the failing test**

Rewrite `tests/service.test.ts` in full:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { runCopilot, validateInput } from "../lib/copilot/service";
import type { RequestBody, RetrievalResult } from "../lib/copilot/types";
import { loadIndex } from "../lib/copilot/index";

function fakeGroq(parts: string[]): typeof fetch {
  return (async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        for (const p of parts) c.enqueue(encoder.encode(p));
        c.close();
      },
    });
    return { ok: true, status: 200, body } as unknown as Response;
  }) as typeof fetch;
}

const fastEmbed = async () => loadIndex().embeddings["project-restai"];

test("validateInput enforces message cap", () => {
  assert.equal(validateInput({ message: "x".repeat(601) }).ok, false);
  assert.equal(validateInput({ message: "ok" }).ok, true);
  assert.equal(validateInput({ message: 123 }).ok, false);
});

test("regression probe: 'Why should I hire you?' is grounded and planned", async () => {
  const events: any[] = [];
  for await (const ev of runCopilot(
    { message: "Why should I hire you?", mode: "general", history: [] },
    { apiKey: "k", model: "m", fetchImpl: fakeGroq(["data: [DONE]\n\n"]), getEmbedder: async () => fastEmbed },
  )) {
    events.push(ev);
  }
  const sources = events.find((e) => e.type === "sources");
  assert.ok(sources.sources.length >= 1, "must not regress to zero sources");
  assert.ok(sources.sources[0].reasons.length >= 1);
  const plan = events.find((e) => e.type === "plan");
  assert.equal(plan.plan.template, "recruiter");
  assert.equal(plan.plan.stance, "high");
  assert.equal(plan.plan.card, "resume");
  const stats = events.find((e) => e.type === "stats");
  assert.equal(stats.intent, "recruiter");
});

test("runCopilot emits canonical meta → plan → sources → card → delta → stats → done", async () => {
  const events: string[] = [];
  const fetchImpl = fakeGroq([
    "data: {\"choices\":[{\"delta\":{\"content\":\"Yes.\"}}]}\n\n",
    "data: {\"choices\":[{\"delta\":{}}],\"usage\":{\"prompt_tokens\":9,\"completion_tokens\":2}}\n\n",
    "data: [DONE]\n\n",
  ]);
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number; strategy: "primary" | "relaxed" }>();

  for await (const ev of runCopilot(
    { message: "Interview me about RestAI", mode: "architecture", history: [] },
    { apiKey: "k", model: "llama-3.3-70b-versatile", fetchImpl, getEmbedder: async () => fastEmbed, cacheHits },
  )) {
    events.push(ev.type);
    if (ev.type === "delta") assert.equal(ev.text, "Yes.");
    if (ev.type === "stats") {
      assert.equal(ev.tokens.in, 9);
      assert.equal(ev.tokens.out, 2);
      assert.ok(typeof ev.intent === "string");
      assert.ok(typeof ev.confidence === "number");
      assert.ok(["primary", "relaxed"].includes(ev.strategy));
    }
  }
  assert.deepEqual(events, ["meta", "plan", "sources", "card", "delta", "stats", "done"]);
});

test("rate limit produces an error event and closes", async () => {
  const events: string[] = [];
  let t = 0;
  for await (const ev of runCopilot(
    { message: "hi" },
    {
      apiKey: "k",
      model: "m",
      limiter: new (await import("../lib/copilot/rate-limit")).RateLimiter({
        limitPerMinute: 0,
        limitPerHour: 0,
        now: () => t,
      }),
      ip: "1.2.3.4",
      getEmbedder: async () => fastEmbed,
    },
  )) {
    events.push(ev.type);
    if (ev.type === "error") assert.equal(ev.code, 429);
  }
  assert.deepEqual(events, ["error"]);
});

test("cache hit skips embedding and strategy is preserved", async () => {
  const events: any[] = [];
  const cacheHits = new Map<string, { results: RetrievalResult[]; retrievalMs: number; strategy: "primary" | "relaxed" }>([
    [
      "what did you build?:architecture",
      {
        results: [
          {
            id: "project-restai",
            label: "RestAI",
            title: "RestAI — Backend & Agentic AI",
            source: { kind: "project", slug: "restai" },
            score: 0.9,
            parts: { cosine: 0.9 },
            reasons: ["cached"],
            breakdown: [{ signal: "cosine", value: 0.9, weight: 0.45 }],
          },
        ],
        retrievalMs: 0,
        strategy: "primary",
      },
    ],
  ]);
  let embedded = 0;
  for await (const ev of runCopilot(
    { message: "What did you build?", mode: "architecture" },
    {
      apiKey: "k",
      model: "m",
      fetchImpl: fakeGroq(["data: [DONE]\n\n"]),
      getEmbedder: async () => {
        embedded++;
        return fastEmbed;
      },
      cacheHits,
    },
  )) {
    events.push(ev);
  }
  assert.equal(embedded, 0);
  assert.equal(events.find((e) => e.type === "stats").cache, "hit");
  assert.equal(events.find((e) => e.type === "stats").strategy, "primary");
  assert.equal(events.find((e) => e.type === "sources").sources[0].id, "project-restai");
});

test("degraded retrieval falls back to the relaxed pass and returns a fallback plan", async () => {
  const events: any[] = [];
  const zeroEmbed = async () => new Float32Array(384);
  for await (const ev of runCopilot(
    { message: "blah blah uninformed", mode: "general" },
    {
      apiKey: "k",
      model: "m",
      fetchImpl: fakeGroq(["data: [DONE]\n\n"]),
      getEmbedder: async () => zeroEmbed,
      classifyIntent: async () => ({ primary: "general", confidence: 0.2 }),
    },
  )) {
    events.push(ev);
  }
  const plan = events.find((e) => e.type === "plan");
  assert.equal(plan.plan.stance, "fallback");
  assert.ok(plan.plan.suggestions.length >= 1);
  const stats = events.find((e) => e.type === "stats");
  assert.equal(stats.strategy, "relaxed");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/service.test.ts`
Expected: FAIL — old event order, missing `plan`, stats fields.

- [ ] **Step 3: Implement**

Rewrite `lib/copilot/service.ts` in full:

```ts
import type {
  ChatMessage,
  CopilotEvent,
  CopilotMode,
  Intent,
  IntentResult,
  RetrievalResult,
  RequestBody,
} from "@/lib/copilot/types";
import { loadIndex, loadCentroids } from "@/lib/copilot/index";
import { retrieveTopK } from "@/lib/copilot/scoring";
import { classifyMessage } from "@/lib/copilot/intent";
import { rewriteQuery } from "@/lib/copilot/rewrite";
import { buildPlan } from "@/lib/copilot/planner";
import { buildMessages } from "@/lib/copilot/prompt";
import { streamGroq } from "@/lib/copilot/groq";
import { RateLimiter } from "@/lib/copilot/rate-limit";

export const MODEL = "llama-3.3-70b-versatile";
export const MAX_MESSAGE = 600;
export const MAX_HISTORY = 6;
export const RETRIEVE_K = 5;
export const RELAXED_K = RETRIEVE_K + 2;
export const PRIMARY_MIN_SCORE = 0.25;
export const RELAXED_MIN_SCORE = 0.12;
export const RELAX_CONFIDENCE_THRESHOLD = 0.35;

export function validateInput(body: unknown): { ok: true; data: RequestBody } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid body" };
  const b = body as Partial<RequestBody>;
  if (typeof b.message !== "string" || b.message.trim().length === 0) return { ok: false, error: "message is required" };
  if (b.message.length > MAX_MESSAGE) return { ok: false, error: "message too long" };
  if (b.mode !== undefined && !["general", "recruiter", "interview", "architecture", "explore"].includes(b.mode))
    return { ok: false, error: "unknown mode" };
  if (b.history !== undefined && (!Array.isArray(b.history) || b.history.length > MAX_HISTORY))
    return { ok: false, error: "history too long" };
  return { ok: true, data: { message: b.message, mode: b.mode, history: b.history } };
}

export type CacheEntry = { results: RetrievalResult[]; retrievalMs: number; strategy: "primary" | "relaxed" };

export type RunDeps = {
  apiKey?: string;
  model?: string;
  now?: () => number;
  limiter?: RateLimiter;
  ip?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  getEmbedder?: () => Promise<(t: string) => Promise<Float32Array>>;
  classifyIntent?: (message: string) => IntentResult | Promise<IntentResult>;
  cacheHits?: Map<string, CacheEntry>;
};

export async function* runCopilot(body: RequestBody, deps: RunDeps = {}): AsyncGenerator<CopilotEvent> {
  const startedAt = Date.now();
  const apiKey = deps.apiKey ?? process.env.GROQ_API_KEY;
  const model = deps.model ?? MODEL;
  const mode: CopilotMode = body.mode ?? "general";
  const id = `req-${startedAt}-${Math.random().toString(36).slice(2, 8)}`;
  const limiter = deps.limiter ?? new RateLimiter({ limitPerMinute: 5, limitPerHour: 30 });
  const ip = deps.ip ?? "local";
  const cache = deps.cacheHits ?? new Map<string, CacheEntry>();

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

  const getEmbedder = () =>
    deps.getEmbedder ? deps.getEmbedder() : (await import("@/lib/copilot/index")).getEmbedder();

  const intent: IntentResult = deps.classifyIntent
    ? await Promise.resolve(deps.classifyIntent(body.message))
    : /* deterministic, no extra LLM hop */
      await classifyMessage({
        message: body.message,
        embedder: getEmbedder,
        centroids: loadCentroids(),
      });

  const cacheKey = `${body.message.trim().toLowerCase()}:${mode}`;
  let results: RetrievalResult[];
  let cacheStatus: "hit" | "build" | "miss";
  let retrievalMs: number;
  let strategy: "primary" | "relaxed" = "primary";

  const compute = async (): Promise<RetrievalResult[]> => {
    const embedder = await getEmbedder();
    const queryVec = await embedder(body.message); // original query only
    const tokens = rewriteQuery(body.message, intent.primary);
    const primary = retrieveTopK(queryVec, tokens, chunks, {
      k: RETRIEVE_K,
      minScore: PRIMARY_MIN_SCORE,
      mode,
      intent: intent.primary,
      embeddings,
    });
    const top = primary[0]?.score ?? 0;
    if (primary.length > 0 && top >= RELAX_CONFIDENCE_THRESHOLD) return primary;
    strategy = "relaxed";
    return retrieveTopK(queryVec, tokens, chunks, {
      k: RELAXED_K,
      minScore: RELAXED_MIN_SCORE,
      mode,
      intent: intent.primary,
      embeddings,
    });
  };

  const retrievalStart = Date.now();
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    results = entry.results;
    retrievalMs = entry.retrievalMs;
    strategy = entry.strategy;
    cacheStatus = "hit";
  } else {
    results = await compute();
    retrievalMs = Date.now() - retrievalStart;
    cacheStatus = cache.size === 0 ? "build" : "miss";
    cache.set(cacheKey, { results, retrievalMs, strategy });
  }

  const plan = buildPlan({ intent, results });

  yield { type: "meta", id, mode, model, startedAt };
  yield { type: "plan", plan };

  const sourcesEvent: CopilotEvent = { type: "sources", sources: results };
  yield sourcesEvent;

  const project = results.find((r) => r.source.kind === "project");
  const cardEvent: CopilotEvent = {
    type: "card",
    card:
      plan.card === "project" && project
        ? { kind: "project", slug: project.source.slug!, title: project.title }
        : plan.card === "resume"
          ? { kind: "resume", title: "Resume summary" }
          : null,
  };
  yield cardEvent;

  const textById = new Map(chunks.map((c) => [c.id, c.text]));
  const contextResults = results.map((r) => ({ ...r, text: textById.get(r.id) ?? "" }));
  const history: ChatMessage[] = (body.history ?? []).map((h) => ({ role: h.role, content: h.content }));
  const messages = buildMessages({ message: body.message, mode, history, results: contextResults, plan });

  let tokensIn = 0;
  let tokensOut = 0;
  let finish: "stop" | "length" = "stop";

  try {
    for await (const ev of streamGroq({ apiKey, model, messages, signal: deps.signal, fetchImpl: deps.fetchImpl })) {
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
  yield {
    type: "stats",
    tokens: { in: tokensIn, out: tokensOut },
    retrievalMs,
    totalMs,
    cache: cacheStatus,
    intent: intent.primary,
    confidence: intent.confidence,
    strategy,
  };
  yield { type: "done", finish };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/service.test.ts`
Expected: PASS — regression probe now yields a recruiter plan with ≥1 grounded source, a high stance (top-1 ≥ 0.30 with the fake query-vector against the committed embeddings), canonical event order incl. `plan`, and a deterministic fallback on the zero-vector path.

Note: in the degraded test the zero vector makes every cosine and keyword score 0, so the primary pass is empty and the code always takes the relaxed branch — the `strategy === "relaxed"` assertion holds by construction.

- [ ] **Step 5: Keep the suite green**

Run `npx tsc --noEmit` and `npm test`.
Expected: all suites green; `prompt`/`scoring` tests unchanged still pass.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/service.ts tests/service.test.ts
git commit -m "feat(copilot): plan-first pipeline with relaxed fallback and regression probe"
```

---

### Task 10: Client — plan event, human source footer, Dev Mode

**Files:**
- Modify: `components/copilot.tsx`

**Interfaces:**
- Consumes: `Plan`, `SignalBreakdown` from protocol; `plan` CopilotEvent; `stats.intent/confidence/strategy`.
- Produces: human-readable "Grounded in …" source label; Dev Mode toggle revealing intent, confidence, strategy, plan template/stance, per-signal breakdowns, cache, ms, tokens.

- [ ] **Step 1: Extend the run reducer**

Add `plan: Plan | null` to the `Run` type and handle the event:

```ts
type Run = {
  ...
  plan: Plan | null;
  ...
};

// in the NDJSON loop, before the `sources` branch:
} else if (ev.type === "plan") {
  update((r) => ({ ...r, plan: ev.plan }));
}
```

- [ ] **Step 2: Extend stats**

```ts
type RunStats = {
  tokens: { in: number; out: number };
  retrievalMs: number;
  totalMs: number;
  cache: string;
  intent: string;
  confidence: number;
  strategy: string;
};
// stats branch (explicit fields only — matches the existing wire shape):
update((r) => ({
  ...r,
  stats: {
    tokens: ev.tokens,
    retrievalMs: ev.retrievalMs,
    totalMs: ev.totalMs,
    cache: ev.cache,
    intent: ev.intent,
    confidence: ev.confidence,
    strategy: ev.strategy,
  },
}));
```

- [ ] **Step 3: Human source footer**

Replace the raw footer line with:

```tsx
{lastRun?.sources && (
  <div className="flex items-center gap-3 border-t border-line px-5 py-2 font-mono text-[10px] text-ink-faint">
    <span>
      {lastRun.sources.length <= 3
        ? `Grounded in ${lastRun.sources.map((s) => s.label).join(", ")}`
        : `Verified from ${lastRun.sources.length} indexed sources`}
    </span>
    <button
      type="button"
      onClick={() => setDevMode((d) => !d)}
      className="ml-auto text-accent transition-colors hover:underline"
    >
      {devMode ? "dev on" : "dev off"}
    </button>
  </div>
)}
```

- [ ] **Step 4: Dev Mode panel**

Add `const [devMode, setDevMode] = useState(false);` to the component state (replacing the old `explain` toggle), and render the raw-diagnostics panel only when `devMode` is on:

```tsx
{devMode && lastRun && (
  <div className="border-t border-line bg-bg/40 px-5 py-3 font-mono text-[10px] text-ink-faint">
    <p className="mb-1 uppercase tracking-[0.18em]">
      intent={lastRun.stats?.intent} · confidence={lastRun.stats?.confidence?.toFixed(2)} · strategy={lastRun.stats?.strategy}
    </p>
    <p className="mb-2">
      plan={lastRun.plan?.template} / {lastRun.plan?.stance} · card={lastRun.plan?.card} · cache={lastRun.stats?.cache} · {lastRun.stats?.retrievalMs}ms · {lastRun.stats?.tokens.out} tokens
    </p>
    <ul className="flex flex-col gap-1">
      {lastRun.sources.map((s) => (
        <li key={s.id} className="flex items-center gap-2 text-[11px] text-ink-soft">
          <span className="rounded bg-surface-2 px-1.5 py-0.5">{s.score.toFixed(2)}</span>
          <span className="truncate">{s.title}</span>
          <span className="ml-auto hidden truncate text-ink-faint sm:block">{s.reasons.join(" · ")}</span>
        </li>
      ))}
    </ul>
  </div>
)}
{lastRun?.plan?.suggestions && (
  <div className="border-t border-line bg-bg/40 px-5 py-3 text-sm text-ink-soft">
    Related: {lastRun.plan.suggestions.join(", ")}
  </div>
)}
```

- [ ] **Step 5: Verify**

Run `npx tsc --noEmit` and `npm run build`. The modal shows a human footer by default; `dev off/on` toggles the raw diagnostics panel.

- [ ] **Step 6: Commit**

```bash
git add components/copilot.tsx
git commit -m "feat(copilot): plan-aware client with human source footer and Dev Mode"
```

---

### Task 11: Route passthrough + smoke test

**Files:**
- Test: `tests/route.test.ts` (new)

**Interfaces:**
- No route changes required: `app/api/copilot/route.ts` already streams every `CopilotEvent` over NDJSON, so the `plan` event passes through untouched. This task locks that behavior in with a test and verifies the 400 path.

- [ ] **Step 1: Write the test**

Create `tests/route.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/copilot/route";

test("invalid JSON returns 400 with an NDJSON contract", async () => {
  const res = await POST(
    new Request("http://localhost/api/copilot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    }),
  );
  assert.equal(res.status, 400);
  assert.equal(res.headers.get("content-type"), "application/x-ndjson");
});

test("missing GROQ_API_KEY streams a stranded error event", async () => {
  const prev = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const res = await POST(
      new Request("http://localhost/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "What did you build?" }),
      }),
    );
    assert.equal(res.status, 200);
    const first = JSON.parse((await res.text()).trim().split("\n")[0]);
    assert.equal(first.type, "error");
    assert.equal(first.code, 500);
  } finally {
    if (prev) process.env.GROQ_API_KEY = prev;
  }
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- tests/route.test.ts`
Expected: PASS. If the route import fails under `tsx` due to the `@/` alias, verify `tsconfig.json` paths are honored by `tsx` (they already are — every lib file uses `@/` and the existing suite passes).

- [ ] **Step 3: Keep the suite green**

Run `npx tsc --noEmit`.

- [ ] **Step 4: Commit**

```bash
git add tests/route.test.ts
git commit -m "test(copilot): route passthrough smoke test"
```

---

### Task 12: Markdown table utility + derived contextual cards

**Files:**
- Modify: `app/globals.css`
- Modify: `components/copilot-card.tsx` (and its call site in `components/copilot.tsx`)

**Interfaces:**
- Produces: `.prose-copilot` table styling; `CopilotCardPanel` now accepts `planCard?: PlanCard` and `sources?: RetrievalResult[]` to render derived Skills/Timeline/Stats/Links panels from the retrieved chunks.

- [ ] **Step 1: Table CSS**

Append to `app/globals.css`:

```css
/* ---------- copilot markdown tables (spec §8) ---------- */
.prose-copilot :where(table) {
  width: 100%;
  margin: 0.75rem 0;
  border-collapse: collapse;
  font-size: 0.85em;
}
.prose-copilot :where(th, td) {
  border: 1px solid var(--color-line);
  padding: 0.4rem 0.6rem;
  text-align: left;
  vertical-align: top;
}
.prose-copilot :where(th) {
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: 0.72em;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.prose-copilot :where(td) {
  color: var(--color-ink-soft);
}
```

- [ ] **Step 2: Extend the card panel**

Update `components/copilot-card.tsx` to accept the plan-driven card type and sources; keep the existing project/resume payload panels untouched for `card.kind`, then branch on `planCard`:

```tsx
import type { CopilotCard, PlanCard, RetrievalResult } from "@/lib/copilot/types";
import { skills, stats, githubStats, experience, profile } from "@/lib/data";

export function CopilotCardPanel({
  card,
  planCard,
  sources,
}: {
  card: CopilotCard | null;
  planCard?: PlanCard;
  sources?: RetrievalResult[];
}) {
  if (!card && (!planCard || planCard === "none")) return null;
  if (card?.kind === "resume") return <ResumePanel />;
  if (card?.kind === "project") return <ProjectPanel card={card} />;
  if (planCard === "skills") return <SkillsPanel />;
  if (planCard === "timeline") return <TimelinePanel />;
  if (planCard === "stats") return <StatsPanel />;
  if (planCard === "links") return <LinksPanel />;
  return null;
}
```

Provide the derived panels (keep each compact; they read structured data from `lib/data`, thumbed by the retrieved sources):

```tsx
function SkillsPanel() {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Skills</p>
      <div className="mt-2 flex flex-col gap-2">
        {skills.map((g) => (
          <div key={g.title}>
            <p className="text-sm text-ink">{g.title}</p>
            <p className="text-xs text-ink-soft">{g.items.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelinePanel() {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Timeline</p>
      <ol className="mt-2 flex flex-col gap-2">
        {experience.map((r) => (
          <li key={r.company} className="text-sm">
            <span className="text-ink">{r.title}</span>
            <span className="text-ink-faint"> — {r.company} ({r.period})</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatsPanel() {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Stats</p>
      <dl className="mt-2 flex flex-col gap-1.5">
        {[...stats, ...githubStats].map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-2">
            <dt className="text-xs text-ink-soft">{s.label}</dt>
            <dd className="font-mono text-sm text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LinksPanel() {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Links</p>
      <div className="mt-2 flex flex-col gap-1.5 text-sm">
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">LinkedIn</a>
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">GitHub</a>
        <a href={profile.resume} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Resume</a>
      </div>
    </div>
  );
}
```

In `components/copilot.tsx`, pass the new props:

```tsx
<CopilotCardPanel card={lastRun?.card ?? null} planCard={lastRun?.plan?.card} sources={lastRun?.sources} />
```

- [ ] **Step 3: Run the build**

Run `npx tsc --noEmit` and `npm run build`. The markdown table styling is a pure CSS addition; the plan-driven card kinds render for skills/timeline/stats/links messages.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css components/copilot-card.tsx components/copilot.tsx
git commit -m "feat(copilot): markdown table styling and plan-driven contextual cards"
```

---

### Task 13: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run all gates**

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: every suite green, typecheck clean, production build succeeds.

- [ ] **Step 2: Live regression probe**

Start `npm run dev` and ask:

> Why should I hire you?

Expected:
- At least one source in the footer — the human "Grounded in …" string (never "0 sources").
- The answer is grounded, structured with H3 sections thanks to the recruiter template.
- Dev Mode (footer toggle) reveals `intent=recruiter`, `strategy`, `confidence`, and the per-signal breakdown of the `hire` chunk.

Also probe `Show RestAI architecture`, `What are your skills?`, `Why those tradeoffs?`, and `Interview me` — each should land in the correct plan card kind.

- [ ] **Step 3: Mark the plan checkboxes + close out**

Tick every `- [ ]` in this file to `- [x]`, then:

```bash
git add docs/superpowers/plans/2026-08-09-copilot-retrieval-v2.md
git commit -m "docs(plan): mark Engineering Copilot v2 plan tasks complete"
```

**Definition of Done:** the regression probe returns ≥1 grounded source with a `high` stance and a recruiter template; the event stream is `meta → plan → sources → card → delta → stats → done`; normal users see human source labels; Dev Mode exposes intent/confidence/strategy and breakdowns; `npm test`, `npx tsc --noEmit`, and `npm run build` all green.