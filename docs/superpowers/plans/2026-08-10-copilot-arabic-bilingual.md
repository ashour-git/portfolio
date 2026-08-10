# Engineering Copilot — Bilingual Arabic Response System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Arabic a first-class, premium experience in the Engineering Copilot — automatic language detection, real RTL rendering with Unicode bidi isolation, natural professional MSA responses, structured output, source chips instead of `[N]` citations, localized UI chrome, and a data-driven metrics strip — without changing the English behavior or the RAG core.

**Architecture:** Additive layer. A deterministic `detectLanguage` (shared by server and client) selects the response language; the server threads it into the `meta` event and the Arabic prompt strategy; bilingual Arabic chunks + Arabic intent rules + an Arabic→English rewrite bridge make Arabic queries retrieve the existing English index; the client renders with `dir`/`lang`, isolates LTR tokens via `unicode-bidi: isolate`, and localizes all chrome through an `i18n.ts` label map.

**Tech Stack:** TypeScript, Next.js 15, React 19, react-markdown v10, remark-gfm, node:test (tsx), CSS vars in `app/globals.css`. Embedding model stays `Xenova/all-MiniLM-L6-V2` (384-dim, committed).

## Global Constraints

- Test command is exactly `npm test` → `tsx --test "tests/**/*.test.ts"`; typecheck `npx tsc --noEmit` must exit 0; production build `npm run build` must succeed. No ESLint.
- Test files use relative imports (`../lib/copilot/...`); library files use the `@/` alias.
- Existing chunk ids stay stable; new Arabic chunk ids are prefixed `ar-` and are unique. Dim of all vectors stays 384. Centroids remain the 8 English non-general intents (unchanged).
- `meta` event gains `lang: "ar" | "en"` (additive). `RequestBody` and the event order `meta → plan → sources → card → delta* → stats → done` are unchanged.
- English path must remain byte-identical: existing prompt tests keep their assertions for the `en` path; `en` UI labels unchanged.
- No switching the embedding model; no new Google-font downloads (Arabic uses a curated system stack via a CSS variable).
- Arabic prose uses Modern Standard Arabic only; no colloquial Egyptian Arabic.
- Technical terms (RAG, pgvector, FastAPI, PyTorch, MLflow, LightGBM, PostgreSQL, Docker, LLM, MLOps, …) are never translated and render as isolated LTR tokens.
- No raw URLs and no `[N]` citation markers in Arabic output.
- The pipeline core (intent → rewrite → retrieval → planner → streaming) is not restructured.

---

### Task 1: Language detection module

**Files:**
- Modify: `lib/copilot/types.ts` (add `Lang` type)
- Create: `lib/copilot/language.ts`
- Test: `tests/language.test.ts`

**Interfaces:**
- Produces: `Lang = "ar" | "en"` (exported from `lib/copilot/types.ts`), and from `lib/copilot/language.ts`: `export function detectLanguage(message: string): Lang` — pure, deterministic, no dependencies.

- [ ] **Step 1: Write the failing test**

Create `tests/language.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { detectLanguage } from "../lib/copilot/language";

const ARABIC_CASES = [
  "بالعربي",
  "عرفني بنفسك",
  "لماذا يجب أن أوظف محمد؟",
  "ما أهم مهاراتك؟",
  "اشرح لي مشروع RestAI",
  "ما المعمارية المستخدمة في RestAI؟",
  "ما الفرق بين مشاريعك؟",
  "ما خبرتك في RAG؟",
  "ما خبرتك في تعلم الآلة؟",
  "ما التقنيات التي تستخدمها؟",
  "اعرض لي السيرة الذاتية",
  "أين أجد GitHub؟",
  "اشرح لي RAG architecture في RestAI",
  "ما استخدام FastAPI في المشروع؟",
  "ما سرعة الاسترجاع؟",
];

const ENGLISH_CASES = [
  "What did you build?",
  "Show RestAI architecture",
  "Explain your RAG",
  "Why those tradeoffs?",
  "Interview me",
  "Resume summary",
  "Why should I hire you?",
];

test("detectLanguage returns ar for pure Arabic messages", () => {
  for (const q of ARABIC_CASES) {
    assert.equal(detectLanguage(q), "ar", `expected ar for ${q}`);
  }
});

test("detectLanguage returns en for English messages", () => {
  for (const q of ENGLISH_CASES) {
    assert.equal(detectLanguage(q), "en", `expected en for ${q}`);
  }
});

test("detectLanguage uses the dominant script for mixed messages", () => {
  assert.equal(detectLanguage("اشرح لي RAG architecture في RestAI"), "ar");
  assert.equal(detectLanguage("Explain RAG بالعربي"), "en");
});

test("detectLanguage returns en for script-neutral or empty input", () => {
  assert.equal(detectLanguage(""), "en");
  assert.equal(detectLanguage("12345"), "en");
  assert.equal(detectLanguage("!! ??"), "en");
  assert.equal(detectLanguage("18/18"), "en");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/language.test.ts`
Expected: FAIL — module `../lib/copilot/language` cannot be resolved (or `detectLanguage` not defined).

- [ ] **Step 3: Add the `Lang` type**

In `lib/copilot/types.ts`, add next to `CopilotMode`:

```ts
export type Lang = "ar" | "en";
```

- [ ] **Step 4: Implement detection**

Create `lib/copilot/language.ts`:

```ts
import type { Lang } from "@/lib/copilot/types";

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_RE = /[A-Za-z\u00C0-\u024F]/;

export function detectLanguage(message: string): Lang {
  let ar = 0;
  let en = 0;
  for (const ch of message) {
    if (ARABIC_RE.test(ch)) ar++;
    else if (LATIN_RE.test(ch)) en++;
  }
  if (ar === 0 && en === 0) return "en";
  return ar > en ? "ar" : "en";
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx --test tests/language.test.ts`
Expected: PASS (4/4).

- [ ] **Step 6: Run full suite and typecheck**

Run: `npm test`
Expected: all existing tests pass (67 → 71).
Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add lib/copilot/types.ts lib/copilot/language.ts tests/language.test.ts
git commit -m "feat(copilot): deterministic Arabic/English language detection"
```

---

### Task 2: Bidi token isolation

**Files:**
- Modify: `lib/copilot/language.ts`
- Test: `tests/bidi.test.ts`

**Interfaces:**
- Produces from `lib/copilot/language.ts`:
  - `export const TECH_TERMS: string[]` — curated canonical-capitalization list.
  - `export type BidiSegment = { text: string; ltr: boolean };`
  - `export function isolateLtrTokens(text: string): BidiSegment[]` — pure; splits text into runs; LTR runs are URLs, emails, numbers/metrics, and technical terms.

- [ ] **Step 1: Write the failing test**

Create `tests/bidi.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { isolateLtrTokens, TECH_TERMS } from "../lib/copilot/language";

function ltrRuns(text: string): string[] {
  return isolateLtrTokens(text).filter((s) => s.ltr).map((s) => s.text);
}

function join(text: string): string {
  return isolateLtrTokens(text).map((s) => s.text).join("");
}

test("URLs and emails are isolated as LTR runs", () => {
  const runs = ltrRuns("انظر https://github.com/ashour-git واكتب muhamed.3ashour@gmail.com");
  assert.ok(runs.some((r) => r.includes("github.com/ashour-git")));
  assert.ok(runs.some((r) => r.includes("muhamed.3ashour@gmail.com")));
});

test("numbers and metrics stay single LTR runs", () => {
  for (const m of ["18/18", "7,000+", "~67 ms", "162", "0.85"]) {
    const runs = ltrRuns(`النتيجة ${m} نعم`);
    assert.ok(runs.includes(m), `expected ${m} isolated`);
  }
});

test("technical terms are isolated and preserved verbatim", () => {
  const runs = ltrRuns("استخدمت RAG مع pgvector و FastAPI و PostgreSQL و Docker و MLflow و LLM");
  for (const t of ["RAG", "pgvector", "FastAPI", "PostgreSQL", "Docker", "MLflow", "LLM"]) {
    assert.ok(runs.includes(t), `expected ${t} isolated`);
  }
});

test("TECH_TERMS contains the mandated canonical names", () => {
  for (const t of ["RAG", "pgvector", "FastAPI", "PyTorch", "MLflow", "LightGBM", "PostgreSQL", "Docker", "LLM", "MLOps"]) {
    assert.ok(TECH_TERMS.includes(t), `missing ${t}`);
  }
});

test("isolation preserves the original text exactly", () => {
  const original = "استخدمت RAG مع pgvector و 18/18 اختبارًا والسرعة ~67 ms.";
  assert.equal(join(original), original);
});

test("LTR terms inside an Arabic sentence are not double-wrapped", () => {
  const runs = isolateLtrTokens("النظام RAG").filter((s) => s.ltr);
  assert.equal(runs.length, 1);
  assert.equal(runs[0].text, "RAG");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/bidi.test.ts`
Expected: FAIL — `isolateLtrTokens` / `TECH_TERMS` not exported.

- [ ] **Step 3: Implement isolation**

Append to `lib/copilot/language.ts`:

```ts
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
      "[~≈±]?\\d[\\d,]*(?:\\.\\d+)?(?:\\s*(?:ms|MB|GB|KB|s|%))?(?:\\s*[/+]\\s*\\d+)?\\s*\\+?",
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/bidi.test.ts`
Expected: PASS (6/6). If `"~67 ms"` fails to isolate, confirm the metric alternative order matches the input exactly (`~67 ms` — the `\s*` before `ms` requires the space).

- [ ] **Step 5: Run full suite and typecheck**

Run: `npm test`
Expected: all pass.
Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/language.ts tests/bidi.test.ts
git commit -m "feat(copilot): unicode bidi isolation for URLs, metrics, and technical terms"
```

---

### Task 3: Wire protocol — `meta.lang`

**Files:**
- Modify: `lib/copilot/types.ts` (meta event)
- Modify: `lib/copilot/service.ts`
- Test: `tests/types.test.ts`, `tests/service.test.ts`

**Interfaces:**
- Consumes: `detectLanguage` from `lib/copilot/language.ts`; `Lang` from `lib/copilot/types.ts`.
- Produces: `meta` event is `{ type: "meta"; id: string; mode: CopilotMode; model: string; startedAt: number; lang: Lang }`.

- [ ] **Step 1: Update types**

In `lib/copilot/types.ts`, change the meta event union member:

```ts
  | { type: "meta"; id: string; mode: CopilotMode; model: string; startedAt: number; lang: Lang }
```

- [ ] **Step 2: Add failing assertions**

In `tests/types.test.ts`, update the meta literal in the "every CopilotEvent literal satisfies the union discriminator" test to include `lang: "en"`:

```ts
    { type: "meta", id: "req-1", mode: "general", model: "llama-3.3-70b-versatile", startedAt: 1, lang: "en" },
```

Add a new test:

```ts
test("meta event carries the detected language", () => {
  const e: CopilotEvent = { type: "meta", id: "req-1", mode: "recruiter", model: "m", startedAt: 1, lang: "ar" };
  assert.equal(e.lang, "ar");
});
```

In `tests/service.test.ts`, add a new test (reuse the existing `fakeGroq` and `fastEmbed` helpers):

```ts
test("meta.lang follows the message language", async () => {
  const events: any[] = [];
  for await (const ev of runCopilot(
    { message: "لماذا يجب أن أوظف محمد؟", mode: "recruiter", history: [] },
    { apiKey: "k", model: "m", fetchImpl: fakeGroq(["data: [DONE]\n\n"]), getEmbedder: async () => fastEmbed },
  )) {
    events.push(ev);
  }
  assert.equal(events.find((e) => e.type === "meta").lang, "ar");
  const en: any[] = [];
  for await (const ev of runCopilot(
    { message: "Why should I hire you?", mode: "general", history: [] },
    { apiKey: "k", model: "m", fetchImpl: fakeGroq(["data: [DONE]\n\n"]), getEmbedder: async () => fastEmbed },
  )) {
    en.push(ev);
  }
  assert.equal(en.find((e) => e.type === "meta").lang, "en");
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx tsx --test tests/types.test.ts tests/service.test.ts`
Expected: FAIL — `lang` missing on the emitted meta object (TS error in typecheck; runtime assertion failure).

- [ ] **Step 4: Emit lang in the service**

In `lib/copilot/service.ts`:
- Add import: `import { detectLanguage } from "@/lib/copilot/language";`
- Inside `runCopilot`, after `const mode: CopilotMode = body.mode ?? "general";` add:
  `const lang = detectLanguage(body.message);`
- Change the meta yield to: `yield { type: "meta", id, mode, model, startedAt, lang };`

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test`
Expected: all pass.
Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/types.ts lib/copilot/service.ts tests/types.test.ts tests/service.test.ts
git commit -m "feat(copilot): emit detected language in the meta event"
```

---

### Task 4: Localization label maps

**Files:**
- Create: `lib/copilot/i18n.ts`
- Test: `tests/i18n.test.ts`

**Interfaces:**
- Consumes: `Lang`, `CopilotMode`, `SourceKind` from `lib/copilot/types.ts`.
- Produces from `lib/copilot/i18n.ts` (all client-safe, no Node deps):
  - `export function modeLabel(mode: CopilotMode, lang: Lang): string`
  - `export function sourceLabel(kind: SourceKind, display: string, lang: Lang): string`
  - `export const QUICK_ACTIONS: Record<Lang, string[]>`
  - `export const PLACEHOLDER: Record<Lang, string>`
  - `export const DIALOG_LABEL: Record<Lang, string>`
  - `export function groundedIn(labels: string[], lang: Lang): string`
  - `export function verifiedFrom(count: number, lang: Lang): string`
  - `export function contextLabel(mode: CopilotMode, lang: Lang): string`
  - `export const RELATED: Record<Lang, string>`
  - `export const STAT_LABEL_AR: Record<string, string>`
  - `export function showMetricsStrip(plan: Plan | null | undefined): boolean`
  - `export const PANEL_TITLES: Record<Lang, { skills: string; timeline: string; stats: string; links: string; resume: string; tech: string; architecture: string; caseStudy: string; github: string }>`

- [ ] **Step 1: Write the failing test**

Create `tests/i18n.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  modeLabel,
  sourceLabel,
  QUICK_ACTIONS,
  PLACEHOLDER,
  groundedIn,
  verifiedFrom,
  contextLabel,
  PANEL_TITLES,
} from "../lib/copilot/i18n";

test("English labels fall through to the canonical English values", () => {
  assert.equal(modeLabel("recruiter", "en"), "recruiter");
  assert.equal(sourceLabel("resume", "Resume", "en"), "Resume");
  assert.equal(groundedIn(["Resume", "LinkedIn"], "en"), "Grounded in Resume, LinkedIn");
  assert.equal(contextLabel("interview", "en"), "Context · interview");
});

test("Arabic mode labels are professional and distinct", () => {
  assert.equal(modeLabel("general", "ar"), "عام");
  assert.equal(modeLabel("recruiter", "ar"), "توظيف");
  assert.equal(modeLabel("interview", "ar"), "مقابلة");
  assert.equal(modeLabel("architecture", "ar"), "معمارية");
  assert.equal(modeLabel("explore", "ar"), "استكشاف");
});

test("Arabic source labels localize where appropriate, keep display names for projects", () => {
  assert.equal(sourceLabel("resume", "Resume", "ar"), "السيرة الذاتية");
  assert.equal(sourceLabel("linkedin", "LinkedIn", "ar"), "LinkedIn");
  assert.equal(sourceLabel("experience", "Experience", "ar"), "الخبرة");
  assert.equal(sourceLabel("project", "RestAI", "ar"), "RestAI");
});

test("Arabic chrome strings are present and non-empty", () => {
  assert.equal(QUICK_ACTIONS.ar.length, 6);
  assert.ok(PLACEHOLDER.ar.length > 0);
  assert.ok(PANEL_TITLES.ar.skills.length > 0);
  assert.equal(contextLabel("interview", "ar"), "السياق · مقابلة");
  assert.equal(groundedIn(["السيرة الذاتية", "LinkedIn"], "ar"), "مُسنَد إلى السيرة الذاتية، LinkedIn");
  assert.equal(verifiedFrom(3, "ar"), "تم التحقق من 3 مصدرًا");
  assert.equal(verifiedFrom(3, "en"), "Verified from 3 indexed sources");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/i18n.test.ts`
Expected: FAIL — module not resolved.

- [ ] **Step 3: Implement the label maps**

Create `lib/copilot/i18n.ts`:

```ts
import type { CopilotMode, Lang, Plan, SourceKind } from "@/lib/copilot/types";

const AR_MODE: Record<CopilotMode, string> = {
  general: "عام",
  recruiter: "توظيف",
  interview: "مقابلة",
  architecture: "معمارية",
  explore: "استكشاف",
};

const AR_SOURCE: Partial<Record<SourceKind, string>> = {
  resume: "السيرة الذاتية",
  experience: "الخبرة",
  skill: "المهارات",
  stats: "الأرقام",
  hire: "لماذا محمد؟",
  about: "نبذة عني",
  linkedin: "LinkedIn",
};

export function modeLabel(mode: CopilotMode, lang: Lang): string {
  return lang === "ar" ? AR_MODE[mode] : mode;
}

export function sourceLabel(kind: SourceKind, display: string, lang: Lang): string {
  if (lang !== "ar") return display;
  return AR_SOURCE[kind] ?? display;
}

export const QUICK_ACTIONS: Record<Lang, string[]> = {
  en: [
    "What did you build?",
    "Show RestAI architecture",
    "Explain your RAG",
    "Why those tradeoffs?",
    "Interview me",
    "Resume summary",
  ],
  ar: [
    "ماذا بنيت؟",
    "اعرض معمارية RestAI",
    "اشرح نظام RAG",
    "لماذا هذه القرارات؟",
    "قابِلني",
    "ملخص السيرة الذاتية",
  ],
};

export const PLACEHOLDER: Record<Lang, string> = {
  en: "Ask about projects, architecture, decisions…",
  ar: "اسأل عن المشاريع، المعمارية، القرارات…",
};

export const DIALOG_LABEL: Record<Lang, string> = {
  en: "Engineering Copilot",
  ar: "المساعد الهندسي",
};

export function groundedIn(labels: string[], lang: Lang): string {
  return lang === "ar"
    ? `مُسنَد إلى ${labels.join("، ")}`
    : `Grounded in ${labels.join(", ")}`;
}

export function verifiedFrom(count: number, lang: Lang): string {
  return lang === "ar"
    ? `تم التحقق من ${count} مصدرًا`
    : `Verified from ${count} indexed sources`;
}

export function contextLabel(mode: CopilotMode, lang: Lang): string {
  return lang === "ar"
    ? `السياق · ${modeLabel(mode, "ar")}`
    : `Context · ${mode}`;
}

export const RELATED: Record<Lang, string> = {
  en: "Related:",
  ar: "ذات صلة:",
};

export const STAT_LABEL_AR: Record<string, string> = {
  "security tests passing": "اختبارات أمان ناجحة",
  "automated tests written": "اختبارات آلية",
  "books in the semantic index": "كتب في الفهرس الدلالي",
  "average retrieval latency": "متوسط زمن الاسترجاع",
};

export function showMetricsStrip(plan: Plan | null | undefined): boolean {
  return plan?.template === "recruiter" || plan?.card === "stats";
}

export const PANEL_TITLES: Record<Lang, { skills: string; timeline: string; stats: string; links: string; resume: string; tech: string; architecture: string; caseStudy: string; github: string }> = {
  en: {
    skills: "Skills",
    timeline: "Timeline",
    stats: "Stats",
    links: "Links",
    resume: "Resume",
    tech: "Stack",
    architecture: "Architecture",
    caseStudy: "Case study",
    github: "GitHub",
  },
  ar: {
    skills: "المهارات",
    timeline: "الخبرة",
    stats: "الأرقام",
    links: "الروابط",
    resume: "السيرة الذاتية",
    tech: "التقنيات",
    architecture: "المعمارية",
    caseStudy: "دراسة الحالة",
    github: "GitHub",
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/i18n.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Run full suite and typecheck**

Run: `npm test`
Expected: all pass.
Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/i18n.ts tests/i18n.test.ts
git commit -m "feat(copilot): localized chrome label maps"
```

---

### Task 5: Arabic intent rules

**Files:**
- Modify: `lib/copilot/intent.ts`
- Test: `tests/intent.test.ts`

**Interfaces:**
- Consumes: existing `INTENT_RULES`, `classifyByRules`, `classifyMessage` shapes (signatures unchanged).
- Produces: `INTENT_RULES` extended with Arabic phrase patterns (deterministic; no new exports).

- [ ] **Step 1: Write the failing test**

Append to `tests/intent.test.ts` (create the file if it does not exist, then add these tests):

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyByRules } from "../lib/copilot/intent";

test("Arabic queries classify to the right intents by rules", () => {
  const cases: [string, string][] = [
    ["لماذا يجب أن أوظف محمد؟", "recruiter"],
    ["عرفني بنفسك", "resume"],
    ["ما أهم مهاراتك؟", "skills"],
    ["ما التقنيات التي تستخدمها؟", "skills"],
    ["اشرح لي مشروع RestAI", "architecture"],
    ["ما المعمارية المستخدمة في RestAI؟", "architecture"],
    ["ما الفرق بين مشاريعك؟", "decision"],
    ["ما خبرتك في RAG؟", "experience"],
    ["ما خبرتك في تعلم الآلة؟", "experience"],
    ["اعرض لي السيرة الذاتية", "resume"],
    ["ما سرعة الاسترجاع؟", "experience"],
  ];
  for (const [q, want] of cases) {
    const r = classifyByRules(q);
    assert.equal(r.primary, want, `expected ${want} for ${q}, got ${r.primary}`);
    assert.ok(r.confidence > 0.5, `rule confidence for ${q}`);
  }
});

test("English messages still classify to their intended intents", () => {
  for (const q of ["What did you build?", "Show RestAI architecture", "Why those tradeoffs?", "Interview me", "Resume summary"]) {
    const r = classifyByRules(q);
    assert.notEqual(r.primary, "general", `expected non-general for ${q}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/intent.test.ts`
Expected: FAIL — Arabic queries fall through to `general`.

- [ ] **Step 3: Extend the rules**

In `lib/copilot/intent.ts`, append Arabic phrases to the end of each existing rule array (keep all existing English entries untouched):

- `recruiter`: add `"لماذا يجب"`, `"أوظف"`, `"وظفني"`, `"مرشح"`
- `project`: add `"ماذا بنيت"`, `"مشاريعك"`, `"مشروع"`, `"بنيت"`
- `architecture`: add `"اشرح لي"`, `"المعمارية"`, `"معمارية"`, `"كيف يعمل"`, `"تدفق"`, `"طبقات"`
- `interview`: add `"قابلني"`, `"مقابلة"`, `"اسألني"`
- `resume`: add `"السيرة الذاتية"`, `"سيرة ذاتية"`, `"عرفني"`, `"من أنت"`
- `skills`: add `"مهارات"`, `"مهاراتك"`, `"تقنيات"`, `"أدوات"`, `"لغات"`
- `experience`: add `"خبرة"`, `"خبرتك"`, `"مسيرتي"`, `"عملت"`, `"سرعة"`
- `decision`: add `"الفرق"`, `"قرارات"`, `"لماذا اخترت"`, `"مقايضات"`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/intent.test.ts`
Expected: PASS. If a case still returns `general`, add the missing phrase to the appropriate rule.

- [ ] **Step 5: Run full suite and typecheck**

Run: `npm test`
Expected: all pass (existing intent tests unaffected).
Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/intent.ts tests/intent.test.ts
git commit -m "feat(copilot): Arabic phrase rules for deterministic intent classification"
```

---

### Task 6: Arabic→English rewrite bridge

**Files:**
- Modify: `lib/copilot/rewrite.ts`
- Test: `tests/rewrite.test.ts`

**Interfaces:**
- Consumes: `rewriteQuery(message, intent)` (existing signature).
- Produces: `rewriteQuery` now also appends English bridge tokens for Arabic words found in the message; `ARABIC_BRIDGE` exported (array of `[stem, englishTokens[]]`) for testing.

- [ ] **Step 1: Write the failing test**

Append to `tests/rewrite.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteQuery, ARABIC_BRIDGE } from "../lib/copilot/rewrite";

test("Arabic bridge maps common Arabic stems to English tokens", () => {
  const en = new Set(ARABIC_BRIDGE.flatMap(([, t]) => t));
  for (const t of ["experience", "project", "skills", "architecture", "retrieval", "latency", "resume"]) {
    assert.ok(en.has(t), `missing bridge token ${t}`);
  }
});

test("rewriteQuery adds English bridge tokens for Arabic queries", () => {
  const tokens = rewriteQuery("ما خبرتك في RAG؟", "experience");
  assert.ok(tokens.includes("experience"), "expected experience token");
  assert.ok(tokens.includes("rag"), "expected rag token from the query itself");
});

test("Arabic query tokens and English names both survive rewriting", () => {
  const tokens = rewriteQuery("ما المعمارية المستخدمة في RestAI؟", "architecture");
  assert.ok(tokens.includes("architecture"));
  assert.ok(tokens.includes("restai"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/rewrite.test.ts`
Expected: FAIL — `ARABIC_BRIDGE` not exported; `experience` token missing.

- [ ] **Step 3: Implement the bridge**

In `lib/copilot/rewrite.ts`, add:

```ts
export const ARABIC_BRIDGE: Array<[stem: string, english: string[]]> = [
  ["مهاراتك", ["skills", "tools"]],
  ["المعمارية", ["architecture", "design"]],
  ["استرجاع", ["retrieval", "search", "rag"]],
  ["السيرة", ["resume", "summary"]],
  ["مشاريع", ["projects", "built"]],
  ["مشروع", ["project", "built"]],
  ["مهارات", ["skills", "tools"]],
  ["معمارية", ["architecture", "design"]],
  ["تقنيات", ["technologies", "stack", "tools"]],
  ["سرعة", ["latency", "speed"]],
  ["خبرتك", ["experience", "career"]],
  ["خبرة", ["experience", "career"]],
  ["قرارات", ["decisions", "tradeoffs"]],
  ["الفرق", ["difference", "compare"]],
  ["عرفني", ["about", "yourself"]],
  ["أوظف", ["hire"]],
  ["بنيت", ["built", "created"]],
];

const AR_WORD_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g;

function arabicBridgeTokens(message: string): string[] {
  const out: string[] = [];
  for (const m of message.matchAll(AR_WORD_RE)) {
    const word = m[0];
    for (const [stem, english] of ARABIC_BRIDGE) {
      if (word.includes(stem)) out.push(...english);
    }
  }
  return [...new Set(out)];
}
```

Modify `rewriteQuery` to append bridge tokens before the intent-expansion slice:

```ts
export function rewriteQuery(message: string, intent: Intent): string[] {
  const base = tokenize(message);
  const bridge = arabicBridgeTokens(message);
  const all = [...base, ...bridge];
  if (intent === "general") return all;
  const extra = [
    ...new Set(INTENT_EXPANSIONS[intent].flatMap((p) => tokenize(p))),
  ]
    .filter((t) => !all.includes(t))
    .slice(0, MAX_EXPANSION_TOKENS);
  return [...all, ...extra];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/rewrite.test.ts`
Expected: PASS. Confirm existing rewrite tests still pass (base tokens for English queries unchanged).

- [ ] **Step 5: Run full suite and typecheck**

Run: `npm test`
Expected: all pass.
Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/rewrite.ts tests/rewrite.test.ts
git commit -m "feat(copilot): Arabic-to-English query bridge for retrieval"
```

---

### Task 7: Bilingual Arabic corpus chunks

**Files:**
- Modify: `lib/copilot/corpus.ts`
- Test: `tests/corpus.test.ts`

**Interfaces:**
- Consumes: `buildChunks()` (existing), `profile`, `stats`, `experience`, `skills`, `trajectory`, `principles`, `insights`, `githubStats` from `lib/data`.
- Produces: 7 new chunk ids `ar-hire`, `ar-about`, `ar-resume`, `ar-skills`, `ar-experience`, `ar-linkedin`, `ar-stats`, each with `text` = Arabic prose + `\nEnglish: …` anchor line (the English line anchors the English-only embedding), same `SourceKind` as their English counterparts, and English keywords.

- [ ] **Step 1: Write the failing test**

Append to `tests/corpus.test.ts`:

```ts
test("bilingual Arabic chunks exist with Arabic and English portions", () => {
  const byId = new Map(buildChunks().map((c) => [c.id, c]));
  for (const id of ["ar-hire", "ar-about", "ar-resume", "ar-skills", "ar-experience", "ar-linkedin", "ar-stats"]) {
    const c = byId.get(id);
    assert.ok(c, `missing chunk ${id}`);
    assert.ok(c.text.length > 40, `${id} text too short`);
    assert.ok(/[\u0600-\u06FF]/.test(c.text), `${id} must contain Arabic`);
    assert.ok(c.text.includes("English:"), `${id} must contain an English anchor line`);
  }
  const hire = byId.get("ar-hire")!;
  assert.equal(hire.source.kind, "hire");
  assert.equal(hire.authority, "metrics");
  assert.ok(hire.keywords.includes("hire"), "ar-hire must keyword 'hire'");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/corpus.test.ts`
Expected: FAIL — missing `ar-*` chunks.

- [ ] **Step 3: Add the Arabic chunks**

In `lib/copilot/corpus.ts`, after the existing `push("linkedin", …)` block (before `return chunks;`), add:

```ts
  const arHire = [
    `لماذا توظف ${profile.name}: ${profile.roles.join("، ")} ومقيم في ${profile.location}.`,
    `السجل: ${stats.map((s) => `${s.value} ${s.label}`).join("؛ ")}.`,
    `خبرة إنتاجية: ${experience.map((r) => `${r.title} في ${r.company} (${r.period})`).join("؛ ")}.`,
    `المهارات: ${skills.map((g) => g.items.join("، ")).join("؛ ")}.`,
    `المبادئ: ${principles.map((p) => `${p.index} ${p.title}`).join("؛ ")}.`,
  ].join(" ");
  push(
    "ar-hire",
    "hire",
    "لماذا محمد؟",
    "لماذا توظف محمد",
    `${arHire}\nEnglish: Why hire ${profile.name}: ${profile.roles.join(", ")}. Track record: ${stats.map((s) => `${s.value} ${s.label}`).join("; ")}.`,
    keywordsFrom("hire", ...profile.roles, stats.map((s) => s.label).join(" "), experience.map((r) => r.company).join(" ")),
  );

  const arAbout = [
    `نبذة عن ${profile.name}: ${profile.roles.join("، ")} ومقيم في ${profile.location}.`,
    `المسار المهني: ${trajectory.map((t) => `${t.period} ${t.title}: ${t.body}`).join(". ")}.`,
    `المبادئ: ${principles.map((p) => `${p.title}: ${p.body}`).join(". ")}.`,
    `الكتابات: ${insights.map((i) => `${i.title}: ${i.body}`).join(". ")}.`,
  ].join(" ");
  push(
    "ar-about",
    "about",
    "نبذة عني",
    "نبذة عن محمد",
    `${arAbout}\nEnglish: About ${profile.name}: ${profile.roles.join(", ")} based in ${profile.location}.`,
    keywordsFrom("about", ...profile.roles, trajectory.map((t) => t.title).join(" ")),
  );

  push(
    "ar-resume",
    "resume",
    "السيرة الذاتية",
    "ملخص السيرة الذاتية",
    `الاسم: ${profile.name}. الأدوار: ${profile.roles.join("، ")}. الموقع: ${profile.location}. البريد: ${profile.email}. LinkedIn: ${profile.linkedin}. GitHub: ${profile.github}.\nEnglish: Name: ${profile.name}. Roles: ${profile.roles.join(", ")}. Location: ${profile.location}.`,
    keywordsFrom(profile.name, ...profile.roles, "resume"),
  );

  const arSkills = skills
    .map((g) => `${g.title}: ${g.items.join("، ")}`)
    .join(". ");
  push(
    "ar-skills",
    "skill",
    "المهارات",
    "المهارات حسب التخصص",
    `${arSkills}\nEnglish: ${skills.map((g) => `${g.title}: ${g.items.join(", ")}`).join(". ")}`,
    keywordsFrom(skills.map((g) => g.items.join(" ")).join(" "), "skills"),
  );

  const arExperience = experience
    .map((r) => `${r.title} في ${r.company} (${r.period}): ${r.points.join(" ")}`)
    .join(". ");
  push(
    "ar-experience",
    "experience",
    "الخبرة",
    "الخبرة العملية",
    `${arExperience}\nEnglish: ${experience.map((r) => `${r.title} at ${r.company} (${r.period})`).join("; ")}`,
    keywordsFrom(experience.map((r) => `${r.title} ${r.company}`).join(" "), "experience"),
  );

  push(
    "ar-linkedin",
    "linkedin",
    "LinkedIn",
    "التواصل والروابط",
    `تواصل مع ${profile.name}: البريد ${profile.email}، LinkedIn ${profile.linkedin}، GitHub ${profile.github}.\nEnglish: Contact ${profile.name}: email ${profile.email}, LinkedIn ${profile.linkedin}, GitHub ${profile.github}.`,
    keywordsFrom("linkedin", "contact", "email", "github", "resume"),
  );

  const arStats = `${stats.map((s) => `${s.value} ${s.label}`).join(". ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join(". ")}`;
  push(
    "ar-stats",
    "stats",
    "الأرقام",
    "الأرقام الرئيسية",
    `الأرقام: ${arStats}.\nEnglish: Stats: ${stats.map((s) => `${s.value} ${s.label}`).join(". ")}. GitHub: ${githubStats.map((g) => `${g.value} ${g.label}`).join(". ")}.`,
    keywordsFrom("stats", "tests", "latency", "books", "repositories"),
  );
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/corpus.test.ts`
Expected: PASS (all existing + new). Note: chunk count goes from 16 to 23.

- [ ] **Step 5: Run full suite and typecheck**

Run: `npm test`
Expected: all pass. `tests/index.test.ts` still asserts `>= 16` — this stays green but is tightened in Task 9.
Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/copilot/corpus.ts tests/corpus.test.ts
git commit -m "feat(copilot): bilingual Arabic corpus chunks for retrieval"
```

---

### Task 8: Arabic response strategy in the prompt layer

**Files:**
- Modify: `lib/copilot/prompt.ts`
- Modify: `lib/copilot/service.ts` (pass `lang` into `buildMessages`)
- Test: `tests/prompt.test.ts`

**Interfaces:**
- Consumes: `Lang` from `lib/copilot/types.ts`.
- Produces:
  - `buildSystemPrompt(mode: CopilotMode, plan?: Plan, lang: Lang = "en"): string`
  - `buildMessages(input: { message: string; mode?: CopilotMode; history?: ChatMessage[]; results: RetrievalResult[]; plan?: Plan; lang?: Lang }): ChatMessage[]`
  - Export `AR_TEMPLATE_HINTS: Record<Plan["template"], string>` for tests.
  - The `en` path output must remain byte-identical to today (existing tests keep passing without edits).

- [ ] **Step 1: Write the failing test**

Append to `tests/prompt.test.ts` (add `Lang`/`AR_TEMPLATE_HINTS` to the existing import):

```ts
import { buildSystemPrompt, buildMessages, AR_TEMPLATE_HINTS, TEMPLATE_HINTS } from "../lib/copilot/prompt";

test("English prompts are unchanged when lang is en or omitted", () => {
  assert.equal(buildSystemPrompt("recruiter"), buildSystemPrompt("recruiter", undefined, "en"));
  assert.ok(buildSystemPrompt("recruiter").includes(TEMPLATE_HINTS.recruiter));
});

test("Arabic prompts contain MSA rules, tech-term preservation, and no raw URLs/citations", () => {
  const p = buildSystemPrompt("recruiter", undefined, "ar");
  assert.ok(p.includes("Mohamed Ashour"));
  assert.ok(/اللغة العربية الفصحى|Modern Standard Arabic/.test(p));
  assert.ok(p.includes("RAG"), "tech terms must be mentioned");
  assert.ok(p.includes("نقاط القوة"), "Arabic sections expected");
  assert.ok(!/https?:\/\/\S+/.test(p), "no raw URLs in Arabic system prompt");
  assert.ok(p.includes("مصدر"), "sources-by-name rule expected");
});

test("every Arabic template hint maps to an Arabic heading", () => {
  for (const t of ["recruiter", "project", "interview", "resume", "skills", "experience", "decision", "general"] as const) {
    const hint = AR_TEMPLATE_HINTS[t];
    assert.ok(hint && hint.length > 5, `missing Arabic hint for ${t}`);
    assert.ok(/[\u0600-\u06FF]/.test(hint), `hint for ${t} must be Arabic`);
  }
});

test("Arabic mode strategies differ per mode", () => {
  const recruiter = buildSystemPrompt("recruiter", undefined, "ar");
  const architecture = buildSystemPrompt("architecture", undefined, "ar");
  const interview = buildSystemPrompt("interview", undefined, "ar");
  assert.notEqual(recruiter, architecture);
  assert.notEqual(recruiter, interview);
  assert.notEqual(architecture, interview);
});

test("Arabic context message asks for names instead of [N] citations", () => {
  const plan = { template: "general" as const, stance: "high" as const, card: "none" as const };
  const results: RetrievalResult[] = [
    { id: "hire", label: "Hire", title: "Why hire Mohamed", source: { kind: "hire" }, score: 0.9, parts: {}, reasons: [], breakdown: [] },
  ];
  const msgs = buildMessages({ message: "لماذا يجب أن أوظف محمد؟", lang: "ar", results, plan });
  const sys = msgs[0].content;
  assert.ok(/عربي|بالعربية/.test(sys), "system prompt must demand Arabic output");
  const context = msgs.find((m) => m.content.startsWith("السياق"));
  assert.ok(context, "Arabic context message expected");
  assert.ok(!context.content.includes("[1]"), "no [N] citation instruction in Arabic context");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/prompt.test.ts`
Expected: FAIL — `buildSystemPrompt` does not accept `lang`; `AR_TEMPLATE_HINTS` not exported; Arabic context message missing.

- [ ] **Step 3: Add Arabic prompt content**

In `lib/copilot/prompt.ts`, update the type import to include `Lang`:

```ts
import type { ChatMessage, CopilotMode, Lang, Plan, RetrievalResult } from "@/lib/copilot/types";
```

Add after the existing `MODE_INSTRUCTIONS` block:

```ts
const AR_IDENTITY = `أنت المساعد الهندسي لمحمد عاشور، مهندس ذكاء اصطناعي وتعلّم آلي ونماذج LLM مقيم في ${profile.location}. تشرح عمله ومشاريعه ومعمارياته وقراراته ومهاراته وخبرته. اكتب باللغة العربية الفصحى (Modern Standard Arabic) بأسلوب احترافي وموجز وواضح، بلغة مهندس تقني قوي — وليس بترجمة حرفية من الإنجليزية. تجنّب التسويق المبالغ فيه والعبارات التحفيزية والتكرار والإنجليزية غير الضرورية. حافظ على المصطلحات التقنية وأسماء التقنيات بالإنجليزية كما هي (RAG، pgvector، FastAPI، PyTorch، MLflow، LightGBM، PostgreSQL، Docker، LLM، MLOps) ولا تترجمها أبدًا. لا تدّعِ أي شيء غير موجود في السياق المقدَّم ولا تخترع حقائق أو أرقامًا أو مصادر. إذا كان السؤال خارج نطاق عمله أو المصادر، اعتذر بلطف في جملة واحدة. استخدم فقرات قصيرة وقوائم نقطية ولا تُرجع جدارًا نصيًا طويلًا. لا تضع روابط URL خام في النص — اذكر أسماء الروابط كنصوص قابلة للنقر. لا تستخدم أرقام استشهاد مثل [1] — اذكر المصادر بأسمائها فقط.`;

const AR_MODE_INSTRUCTIONS: Record<CopilotMode, string> = {
  general: "أجب عن السؤال بالعربية بناءً على السياق أدناه، بأسلوب احترافي طبيعي.",
  recruiter:
    "لخّص الخبرة ونقاط القوة والمهارات والمشاريع ذات الصلة بأسلوب مختصر وقوي مدعوم بالأدلة: منتجات منشورة، اختبارات، زمن استجابة، وأرقام حقيقية من السياق. نظّم الإجابة في أقسام: لماذا محمد؟، أبرز نقاط القوة، الخبرة، أبرز المشاريع، التقنيات، لماذا هذه الخبرة مهمة؟",
  interview:
    "أجب وكأنك محمد في مقابلة: أجب عن السؤال مباشرة وباختصار، ثم قدّم الدليل، ثم المشروع ذي الصلة.",
  architecture:
    "لأكثر مشروعٍ صلةً، اشرح تدفق المعمارية من السياق بأسلوب تقني منظّم: الطبقات، تدفق البيانات، القرارات الرئيسية، المقايضات، وما الذي تعلّمته.",
  explore:
    "قارن واربط بين المشاريع بأسلوب حواري احترافي: اقترح مشروعًا بناءً على السؤال مع ذكر الفئة والتقنيات وعلاقتها.",
};
```

Add after the existing `TEMPLATE_HINTS` block:

```ts
export const AR_TEMPLATE_HINTS: Record<Plan["template"], string> = {
  recruiter:
    "نظّم الإجابة بأقسام بعناوين عربية واضحة: «لماذا محمد؟» ثم «أبرز نقاط القوة» ثم «الخبرة» ثم «أبرز المشاريع» ثم «التقنيات» ثم «لماذا هذه الخبرة مهمة؟». استخدم نقاطًا قصيرة وفقرات من 2-3 أسطر.",
  project:
    "نظّم الإجابة بأقسام: «لمحة عامة»، «المعمارية»، «القرارات الرئيسية»، «المقايضات»، «الأثر». استخدم قائمة نقطية للتقنيات.",
  interview:
    "أجب بصيغة المتكلم المباشرة بفقرات قصيرة، واشرح منطق كل قرار، مع الإشارة إلى المشروع المعني.",
  resume:
    "قدّم ملفًا موجزًا: الأدوار، الموقع، أبرز النقاط، الروابط. استخدم نقاطًا قصيرة دون نثر مطوّل.",
  skills:
    "جمّع المهارات حسب التخصص في قائمة أو جدول موجز بعمودي «المجال» و«الأدوات».",
  experience:
    "قائمة زمنية: الدور، الشركة، الفترة، مع 2-3 نقاط أدلة لكل دور.",
  decision:
    "لكل قرار: السياق ← الاختيار ← المقايضة. استخدم جدولًا بعناوين «القرار»، «الاختيار»، «الكلفة».",
  general:
    "أجب بإيجاز مع البقاء في إطار السياق. استخدم فقرات قصيرة وقائمة نقطية عند الحاجة.",
};
```

- [ ] **Step 4: Make prompt functions lang-aware**

Replace `buildSystemPrompt`:

```ts
export function buildSystemPrompt(mode: CopilotMode, plan?: Plan, lang: Lang = "en"): string {
  const identity = lang === "ar" ? AR_IDENTITY : IDENTITY;
  const modeInstruction = lang === "ar" ? AR_MODE_INSTRUCTIONS[mode] : MODE_INSTRUCTIONS[mode];
  const parts = [identity, modeInstruction];
  if (plan) {
    const hint = lang === "ar" ? AR_TEMPLATE_HINTS[plan.template] : TEMPLATE_HINTS[plan.template];
    parts.push(hint);
    if (plan.stance === "fallback") {
      parts.push(
        lang === "ar"
          ? "لا يوجد سياق مفهرس يدعم الإجابة. قل في جملة واحدة أنه لا توجد إجابة مدعومة، ثم اعرض الموضوعات المقترحة كنقاط."
          : "No supporting indexed context exists. Say in one sentence that you lack a grounded answer, then present the suggested related topics as bullet points.",
      );
    }
  }
  return parts.join("\n\n");
}
```

Replace the context-message construction inside `buildMessages` with lang-aware branches (keep the return statement):

```ts
export function buildMessages(input: {
  message: string;
  mode?: CopilotMode;
  history?: ChatMessage[];
  results: RetrievalResult[];
  plan?: Plan;
  lang?: Lang;
}): ChatMessage[] {
  const mode = input.mode ?? "general";
  const lang = input.lang ?? "en";
  const plan = input.plan;
  const history = (input.history ?? []).slice(-6).map((m) => ({ role: m.role, content: m.content }));
  const context = serializeContext(input.results);
  let contextMsg: ChatMessage;
  if (context.length > 0) {
    contextMsg =
      lang === "ar"
        ? {
            role: "user",
            content: `السياق:\n${context}\n\nأجب بالعربية من هذا السياق فقط، واذكر المصادر بأسمائها دون أرقام مثل [1].`,
          }
        : {
            role: "user",
            content: `Relevant context:\n${context}\n\nAnswer only from this context, citing source numbers like [1].`,
          };
  } else if (plan?.suggestions?.length) {
    contextMsg =
      lang === "ar"
        ? {
            role: "user",
            content: `لم يُسترجع سياق يدعم الإجابة. لا تخترع. قل إنه لا يمكنك تقديم إجابة مدعومة، ثم اقترح هذه الموضوعات: ${plan.suggestions.join("، ")}.`,
          }
        : {
            role: "user",
            content: `No supporting context was retrieved. Do not fabricate. Say you cannot give a grounded answer, then suggest these related topics: ${plan.suggestions.join(", ")}.`,
          };
  } else {
    contextMsg =
      lang === "ar"
        ? { role: "user", content: "لم يُسترجع سياق ذو صلة. قل إنه لا توجد إجابة مدعومة ثم اعرض موضوعات قريبة." }
        : { role: "user", content: "No relevant context was retrieved. Say you have no grounded answer, then offer nearby topics." };
  }

  return [{ role: "system", content: buildSystemPrompt(mode, plan, lang) }, ...history, contextMsg, { role: "user", content: input.message }];
}
```

- [ ] **Step 5: Thread lang through the service**

In `lib/copilot/service.ts`, change the `buildMessages` call to pass the detected language:

```ts
  const messages = buildMessages({ message: body.message, mode, history, results: contextResults, plan, lang });
```

(`lang` is already in scope from Task 3.)

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test`
Expected: all pass — existing English prompt tests unchanged, new Arabic tests green.
Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add lib/copilot/prompt.ts lib/copilot/service.ts tests/prompt.test.ts
git commit -m "feat(copilot): mode-aware Arabic response strategy in the prompt layer"
```

---

### Task 9: Regenerate the index with Arabic chunks

**Files:**
- Modify: `tests/index.test.ts`
- Modify (generated): `lib/index/meta.json`, `lib/index/vectors.json` (via script)
- Tool: `scripts/build-kb.ts` (no source change needed)

**Interfaces:**
- Consumes: `buildChunks()` (now includes `ar-*` chunks), `INTENT_CENTROIDS`, committed model `Xenova/all-MiniLM-L6-V2` in `models/`.
- Produces: regenerated `lib/index/meta.json` (23 chunks), `vectors.json` (dim 384), `centroids.json` (8 intents, dim 384).

- [ ] **Step 1: Update the index test**

In `tests/index.test.ts`, raise the chunk floor and assert Arabic chunks are indexed:

```ts
test("committed index loads with matching meta and vectors", () => {
  const { chunks, embeddings } = loadIndex();
  assert.equal(chunks.length, 23, `expected 23 chunks, got ${chunks.length}`);
  for (const c of chunks) {
    const vec = embeddings[c.id];
    assert.ok(vec, `missing vector for ${c.id}`);
    assert.equal(vec.length, 384);
  }
  const ids = new Set(chunks.map((c) => c.id));
  for (const id of ["ar-hire", "ar-about", "ar-resume", "ar-skills", "ar-experience", "ar-linkedin", "ar-stats"]) {
    assert.ok(ids.has(id), `missing Arabic chunk ${id}`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test tests/index.test.ts`
Expected: FAIL — index still has 16 chunks.

- [ ] **Step 3: Verify the embedding model is present**

Run: `Get-ChildItem models -Recurse | Select-Object -First 5`
Expected: model files exist (committed). If missing, the script will attempt a download (allowed in dev via `env.allowRemoteModels = true`).

- [ ] **Step 4: Regenerate the index**

Run: `npx tsx scripts/build-kb.ts`
Expected: console prints `wrote 23 chunks, 8 centroids, dim 384, to ...`. If dim is not 384, stop and investigate (the model must remain `all-MiniLM-L6-V2`).

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx tsx --test tests/index.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full suite, typecheck, and build**

Run: `npm test`
Expected: all pass.
Run: `npx tsc --noEmit`
Expected: exit 0.
Run: `npm run build`
Expected: success.

- [ ] **Step 7: Commit**

```bash
git add lib/index/meta.json lib/index/vectors.json tests/index.test.ts
git commit -m "feat(copilot): regenerate index with bilingual Arabic chunks"
```

Note: `centroids.json` should be unchanged (8 English centroids); include it only if the script rewrote it identically.

---

### Task 10: Bidi renderer in the markdown component

**Files:**
- Modify: `components/copilot-markdown.tsx`
- Modify: `app/globals.css`
- Test: `tests/bidi-render.test.ts` (props-contract documentation; the pure isolation is covered in Task 2)

**Interfaces:**
- Consumes: `isolateLtrTokens` from `lib/copilot/language.ts`; `Lang` from `lib/copilot/types.ts`.
- Produces: `CopilotMarkdown({ text: string; lang: Lang })` — sets `dir`/`lang` on the container; isolates text runs inside block-level elements; `a` and inline `code` get LTR isolation; container gains `data-copilot-lang` for CSS hooks.

- [ ] **Step 1: Write the documentation test**

Create `tests/bidi-render.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

test("CopilotMarkdown props contract: text + lang", () => {
  const contract: { text: string; lang: "ar" | "en" } = { text: "مرحبًا", lang: "ar" };
  assert.ok(contract.lang === "ar" || contract.lang === "en");
});
```

- [ ] **Step 2: Run the test (expected pass — contract is compile-checked)**

Run: `npx tsx --test tests/bidi-render.test.ts`
Expected: PASS (documentation-level). The real gate is `npx tsc --noEmit` in Step 5.

- [ ] **Step 3: Rewrite the markdown component**

Rewrite `components/copilot-markdown.tsx`:

```tsx
"use client";

import React, { Children, cloneElement, isValidElement } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Lang } from "@/lib/copilot/types";
import { isolateLtrTokens } from "@/lib/copilot/language";

function CodeBlock({ language, value }: { language: string; value: string }) {
  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-line bg-bg/60" dir="ltr">
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

function BidiRuns({ text }: { text: string }) {
  const segments = isolateLtrTokens(text);
  return (
    <>
      {segments.map((s, i) =>
        s.ltr ? (
          <span key={i} dir="ltr" lang="en" className="ltr-token">
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

function isolateChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") return <BidiRuns text={child} />;
    if (isValidElement(child) && typeof child.props.children === "string") {
      return cloneElement(child, {}, <BidiRuns text={child.props.children} />);
    }
    return child;
  });
}

const ISOLATE_BLOCKS = ["p", "li", "td", "th", "h1", "h2", "h3"];

export function CopilotMarkdown({ text, lang }: { text: string; lang: Lang }) {
  const blockOverrides: Record<string, (props: any) => ReactNode> = {};
  for (const tag of ISOLATE_BLOCKS) {
    blockOverrides[tag] = ({ node: _node, ...props }: any) =>
      React.createElement(tag, props, isolateChildren(props.children));
  }
  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      data-copilot-lang={lang}
      className="prose-copilot text-sm leading-relaxed text-ink"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...blockOverrides,
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? "");
            if (!match) {
              return (
                <code dir="ltr" lang="en" className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
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
                dir="ltr"
                lang="en"
                className="ltr-token text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
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

Note: use `React.createElement` with the named `React` import above (the project uses `"jsx": "react-jsx"`). If `React.ComponentProps` typing is awkward, type the overrides as `(props: any) => ReactNode` — acceptable here since react-markdown props are stable.

- [ ] **Step 4: Add the CSS hooks**

Append to `app/globals.css`:

```css
/* ---------- copilot bidi isolation (bilingual spec §2, §9) ---------- */
.ltr-token {
  direction: ltr;
  unicode-bidi: isolate;
}
.prose-copilot :where(code) {
  direction: ltr;
  unicode-bidi: isolate;
}
.prose-copilot[dir="rtl"] {
  font-family: var(--font-arabic), var(--font-sans);
  text-align: start;
}
.prose-copilot[dir="rtl"] :where(ul, ol) {
  padding-inline-start: 1.25rem;
}
.prose-copilot[dir="rtl"] :where(th, td) {
  text-align: start;
}
```

Add the `--font-arabic` variable to the `:root` block (next to the other font variables):

```css
  --font-arabic: "Noto Sans Arabic", "IBM Plex Sans Arabic", "Segoe UI", "Tahoma", system-ui, sans-serif;
```

- [ ] **Step 5: Verify types and tests**

Run: `npx tsc --noEmit`
Expected: exit 0. Fix any `React.createElement` import issue per Step 3 note.
Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add components/copilot-markdown.tsx app/globals.css tests/bidi-render.test.ts
git commit -m "feat(copilot): bidi-aware markdown renderer with LTR token isolation"
```

---

### Task 11: Localized Copilot client chrome

**Files:**
- Modify: `components/copilot.tsx`
- Modify: `components/copilot-card.tsx`

**Interfaces:**
- Consumes: `detectLanguage`/`isolateLtrTokens` from `lib/copilot/language.ts`; i18n helpers from `lib/copilot/i18n.ts`; `Lang` from `lib/copilot/types.ts`.
- Produces:
  - `Run` type gains `lang: Lang`.
  - The assistant message container passes `lang` into `CopilotMarkdown`.
  - Mode pills, quick actions, placeholder, footer, context header, dev labels, and Related block localize via i18n.
  - Metrics strip (`KeyNumbers`) rendered when `showMetricsStrip(lastRun?.plan)` is true.
  - Footer `Grounded in …` labels become clickable source chips (URL when available).
  - `CopilotCardPanel` gains a `lang` prop (default `"en"`).

- [ ] **Step 1: Write the failing test**

Append to `tests/i18n.test.ts` (uses the real `showMetricsStrip` export):

```ts
import { showMetricsStrip } from "../lib/copilot/i18n";

test("showMetricsStrip gates the metrics strip to recruiter/stats plans", () => {
  assert.equal(showMetricsStrip({ template: "recruiter", stance: "high", card: "resume" }), true);
  assert.equal(showMetricsStrip({ template: "general", stance: "high", card: "stats" }), true);
  assert.equal(showMetricsStrip({ template: "general", stance: "high", card: "none" }), false);
  assert.equal(showMetricsStrip(null), false);
});
```

(Note: the metrics-strip gate is intentionally a pure helper in `i18n.ts` — the UI condition and its test use the same exported function.)

- [ ] **Step 2: Run the test**

Run: `npx tsx --test tests/i18n.test.ts`
Expected: PASS.

- [ ] **Step 3: Wire lang through the Copilot component**

In `components/copilot.tsx`:

1. Update imports:

```tsx
import type { CopilotCard, CopilotEvent, CopilotMode, Lang, Plan, RetrievalResult } from "@/lib/copilot/types";
import { detectLanguage } from "@/lib/copilot/language";
import {
  modeLabel,
  sourceLabel,
  QUICK_ACTIONS,
  PLACEHOLDER,
  DIALOG_LABEL,
  groundedIn,
  verifiedFrom,
  contextLabel,
  RELATED,
  PANEL_TITLES,
  STAT_LABEL_AR,
  showMetricsStrip,
} from "@/lib/copilot/i18n";
import { stats, githubStats } from "@/lib/data";
```

2. Extend the `Run` type with `lang: Lang`:

```tsx
type Run = {
  id: string;
  mode: CopilotMode;
  lang: Lang;
  sources: RetrievalResult[];
  card: CopilotCard | null;
  stats: RunStats | null;
  plan: Plan | null;
  done: boolean;
};
```

3. In `run`, set the run's lang from the message:

```tsx
    const lang = detectLanguage(text);
    setRuns((r) => ({ ...r, [runId]: { id: runId, mode, lang, sources: [], card: null, stats: null, plan: null, done: false } }));
```

4. Derive the active chrome language — the last run's lang, falling back to the current input's language, then `"en"`:

```tsx
  const chromeLang: Lang = lastRun?.lang ?? detectLanguage(input) ?? "en";
```

5. Replace the static English chrome:
   - Dialog `aria-label`: `aria-label={DIALOG_LABEL[chromeLang]}`
   - Header `h2`: `{DIALOG_LABEL[chromeLang]}`
   - Mode pills: render `modeLabel(m, chromeLang)` and keep the raw mode in `key`/state.
   - Quick actions: `QUICK_ACTIONS[chromeLang]`.
   - Input placeholder: `placeholder={PLACEHOLDER[chromeLang]}`; give the input `dir={chromeLang === "ar" ? "rtl" : "ltr"}` and `lang={chromeLang}`.
   - Footer source line: replace the inline template with

```tsx
{lastRun.sources.length <= 3
  ? groundedIn(lastRun.sources.map((s) => sourceLabel(s.source.kind, s.label, lastRun.lang)), lastRun.lang)
  : verifiedFrom(lastRun.sources.length, lastRun.lang)}
```

   - Context panel header (right rail):

```tsx
<p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint" dir={chromeLang === "ar" ? "rtl" : "ltr"}>
  {contextLabel(mode, chromeLang)}
</p>
```

   - Related block: `{RELATED[lastRun.lang]} {lastRun.plan.suggestions.join(", ")}`.

6. Pass `lang` into the assistant message rendering. Find the message map and pass the run's lang:

```tsx
{m.role === "assistant" ? (
  <CopilotMarkdown text={m.text} lang={runs[m.id]?.lang ?? "en"} />
) : (
  <span dir={detectLanguage(m.text)} lang={detectLanguage(m.text)}>{m.text}</span>
)}
```

7. Render the metrics strip between the dev panel and the Related block:

```tsx
{showMetricsStrip(lastRun?.plan) && (
  <div className="flex flex-wrap items-center gap-2 border-t border-line bg-bg/40 px-5 py-2.5">
    {[...stats, ...githubStats].map((s) => (
      <span key={s.label} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[10px] text-ink-soft">
        <bdi dir="ltr" lang="en" className="ltr-token text-ink">{s.value}</bdi>
        <span>{lastRun.lang === "ar" ? (STAT_LABEL_AR[s.label] ?? s.label) : s.label}</span>
      </span>
    ))}
  </div>
)}
```

8. Pass `lang` to the card panel: `<CopilotCardPanel card={lastRun?.card ?? null} planCard={lastRun?.plan?.card} sources={lastRun?.sources} lang={lastRun?.lang ?? "en"} />`.

- [ ] **Step 4: Localize the card panel labels**

In `components/copilot-card.tsx`:

1. Import `Lang` and `PANEL_TITLES`:

```tsx
import type { CopilotCard, Lang, PlanCard, RetrievalResult } from "@/lib/copilot/types";
import { PANEL_TITLES } from "@/lib/copilot/i18n";
```

2. Add the `lang` prop to `CopilotCardPanel` (default `"en"`):

```tsx
export function CopilotCardPanel({
  card,
  planCard,
  sources,
  lang = "en",
}: {
  card: CopilotCard | null;
  planCard?: PlanCard;
  sources?: RetrievalResult[];
  lang?: Lang;
}) {
  if (!card && (!planCard || planCard === "none")) return null;
  if (card?.kind === "resume") return <ResumePanel lang={lang} />;
  if (card?.kind === "project") return <ProjectPanel card={card} lang={lang} />;
  if (planCard === "skills") return <SkillsPanel lang={lang} />;
  if (planCard === "timeline") return <TimelinePanel lang={lang} />;
  if (planCard === "stats") return <StatsPanel lang={lang} />;
  if (planCard === "links") return <LinksPanel lang={lang} />;
  return null;
}
```

3. Each panel accepts `lang` and uses `PANEL_TITLES[lang].xxx` for its heading; project links use `PANEL_TITLES[lang].github` / `.caseStudy`; add `dir`/`lang` to each panel root based on `lang`. Example for `ResumePanel`:

```tsx
function ResumePanel({ lang }: { lang: Lang }) {
  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-5" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">{PANEL_TITLES[lang].resume}</p>
      <p className="mt-2 text-sm text-ink-soft">
        {lang === "ar"
          ? "السيرة الذاتية الكاملة في رأس الموقع — أو اطلب ملخصًا في المحادثة."
          : "The full resume is in the site header — or ask for a summary in the chat."}
      </p>
    </div>
  );
}
```

Apply the same pattern to `SkillsPanel` (heading `PANEL_TITLES[lang].skills`), `TimelinePanel` (`timeline`), `StatsPanel` (`stats`), `LinksPanel` (`links`), and `ProjectPanel` (headings `PANEL_TITLES[lang].tech` for the stack section, `.architecture` is already the diagram, `.caseStudy`/`.github` for links).

- [ ] **Step 5: Verify types and tests**

Run: `npx tsc --noEmit`
Expected: exit 0.
Run: `npm test`
Expected: all pass.
Run: `npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add components/copilot.tsx components/copilot-card.tsx tests/i18n.test.ts
git commit -m "feat(copilot): localized chrome, source chips, and metrics strip"
```

---

### Task 12: Full verification and visual inspection

**Files:**
- Modify: `docs/superpowers/plans/2026-08-10-copilot-arabic-bilingual.md` (tick all checkboxes)
- Possibly: regression fixes to files from Tasks 1–11

**Interfaces:**
- Consumes: everything from Tasks 1–11.
- Produces: a green suite with the Arabic/bidi tests, a clean typecheck, a successful production build, and a documented visual-inspection pass (with the `GROQ_API_KEY` limitation flagged).

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all pass. Count the tests — baseline was 67; Tasks 1, 2, 4, 5, 6, 7, 8, 10, 11 add new tests. Record the final count.

- [ ] **Step 2: Run the typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0. Run this alone (do not run in parallel with `npm run build` — the `.next/types/**/*.ts` regeneration can race).

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Visual inspection (Arabic + English)**

Run: `npm run dev`
Manually verify in the browser:

1. English: ask "Why should I hire you?" → LTR layout, English labels unchanged, footer `Grounded in …`, dev panel English.
2. Arabic: ask `لماذا يجب أن أوظف محمد؟` → the input flips to RTL immediately (client-side detection), the response container renders `dir="rtl" lang="ar"`, Arabic headings appear, technical terms (RAG, pgvector, FastAPI) render as isolated LTR tokens, no raw URLs in prose, source chips appear in the footer (`مُسنَد إلى …`), mode pills/quick actions/placeholder are Arabic, context panel header shows `السياق · توظيف`.
3. Arabic metric values (`18/18`, `~67 ms`, `7,000+`) stay LTR and un-reversed in prose; the metrics strip renders isolated chips.
4. Mixed: `اشرح لي RAG architecture في RestAI` → Arabic-dominant response, English terms preserved.
5. Mobile viewport (320px, 375px): RTL messages wrap without horizontal overflow.
6. Screen-reader smoke: response container exposes `lang="ar" dir="rtl"`.

Note: real Arabic LLM output requires `GROQ_API_KEY`. Without it, the API returns a 500 error event — the layout/detection paths still render; document this limitation in the plan notes. The deterministic path is covered by the `tests/service.test.ts` regression probes.

- [ ] **Step 5: Fix any regressions found**

If the build, tests, or visual pass reveals issues, fix them in the owning file and re-run Steps 1–3.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs(plan): mark bilingual Arabic response plan tasks complete"
```

---

## Self-Review

Run this checklist with fresh eyes before execution:

1. **Spec coverage** — every spec section maps to a task:
   - §1 detection → Task 1, Task 3
   - §2 RTL/bidi → Task 2, Task 10
   - §3 writing quality → Task 8 (AR_IDENTITY/AR_MODE_INSTRUCTIONS)
   - §4 structure → Task 8 (AR_TEMPLATE_HINTS)
   - §5 hire example → grounded via `ar-hire` chunk (Task 7) + recruiter template (Task 8)
   - §6 numbers → Task 2 metric pattern, Task 11 metrics strip
   - §7 citations → Task 8 (no `[N]`), Task 11 source chips
   - §8 links → Task 8 (no raw URLs), Task 10 `a` isolation, Task 11 chips
   - §9 tech terms → Task 2 TECH_TERMS, Task 10 rendering
   - §10 headings → Task 8 AR_TEMPLATE_HINTS
   - §11 context panel → Task 11 contextLabel + CopilotCardPanel lang
   - §12 mode-aware → Task 8 AR_MODE_INSTRUCTIONS
   - §13 guardrails → Task 8 (prompt-level rules), Task 12 visual gate
   - §14 architecture preserved → all tasks additive; pipeline untouched
   - §15 streaming → Task 10 (isolation is per-render on accumulated text; no buffering needed since incomplete tokens are left neutral)
   - §16 mobile → Task 12 visual check
   - §17 a11y → Task 10 (dir/lang), Task 11 (input/dialog), Task 12 smoke
   - §18 design philosophy → no layout/color changes; CSS only adds bidi/font hooks
   - §19 test cases → tests/language.test.ts probe set + Task 12 visual pass
2. **Placeholder scan** — no TBD/TODO; every code step has real code. The `...existing...` placeholder in Task 5 is explicitly resolved by the instruction text (append to each array).
3. **Type consistency** — `Lang` defined in `types.ts` (Task 1) and imported everywhere; `CopilotMarkdown({ text, lang })` matches its call site in Task 11; `CopilotCardPanel({ ..., lang = "en" })` matches its call site; `buildSystemPrompt(mode, plan, lang)` signature matches its calls in Task 8. `AR_TEMPLATE_HINTS` exported in Task 8 and consumed by tests in the same task.

**Decision notes for the executor:**
- Task 3's `runCopilot` must compute `lang` before the cacheKey so cached Arabic/English hits never reuse the wrong meta lang; the cache key already includes the message so this is safe.
- Task 9 regenerates vectors for ALL chunks (Arabic chunks change the file). Expect `meta.json`/`vectors.json` diffs only; `centroids.json` should be identical (8 English centroids).
- The bilingual chunk `text` layout (`Arabic…\nEnglish: …`) means the English anchor is part of the embedded text; keyword matching uses `chunk.keywords` which stay English — the Arabic→English bridge in Task 6 supplies the matching tokens.
- If `npx tsx scripts/build-kb.ts` needs the model and it is absent, it downloads into `models/` (allowed in dev). The model is committed, so this should be a no-op.
- The `"~67 ms"` metric pattern relies on the space before `ms`; keep `"~67 ms"` (with space) in the test to match the corpus value `~67ms` variance — the corpus uses `~67ms` (no space) in `lib/data.ts` but the test uses the spec's `~67 ms`. Both must isolate; if the no-space form fails, add `(?:ms)` with optional space handled by the existing `\s*`.



