# Engineering Copilot — Bilingual Arabic Response System (Design)

**Date:** 2026-08-10
**Status:** Approved
**Scope:** Additive presentation/localization layer. No Copilot redesign, no RAG core replacement.

## Problem

Arabic queries currently produce machine-translated English responses with broken
bidirectional rendering: Arabic runs inside LTR containers, English technical terms
reorder Arabic sentences, raw URLs and `[N]` citations leak into prose, numbers flip,
and the surrounding UI chrome (context panel, footer, mode pills) stays English.

## Goal

Make Arabic a first-class, premium experience: automatic language detection, real RTL
rendering with Unicode bidi isolation, natural professional Modern Standard Arabic
writing, structured responses, source chips instead of `[N]` citations, isolated LTR
technical tokens, localized UI chrome, and a data-driven metrics strip — while leaving
the English experience byte-for-byte as-is today.

## Architecture (unchanged core, added layer)

```
User Query
  ↓  Language Detection (deterministic, shared lib)
  ↓  Intent Classification          (unchanged + Arabic rules)
  ↓  Hybrid Retrieval               (unchanged + Arabic chunks + Arabic→EN rewrite bridge)
  ↓  Answer Planner                 (unchanged)
  ↓  Arabic/English Response Strategy (prompt layer, lang-aware)
  ↓  Groq Streaming                 (unchanged)
  ↓  Structured Markdown / UI Events (unchanged + meta.lang)
  ↓  Bidi Renderer                  (client, unicode-bidi: isolate)
  ↓  Localized Copilot UI           (i18n chrome)
```

## 1. Language detection — `lib/copilot/language.ts` (new, pure, shared)

- `detectLanguage(message: string): "ar" | "en"` — deterministic, no LLM hop.
- Algorithm: count Arabic script letters (U+0600–U+06FF, U+0750–U+077F, U+08A0–U+08FF)
  vs Latin letters (A–Z, a–z, plus accented Latin). Exclude whitespace, punctuation,
  digits, emoji, and symbols. If Arabic letter count > 0 and Arabic share of
  letter-total > 0.5 → `"ar"`, else `"en"`. Mixed messages use the dominant script.
  Script-neutral (numbers-only / symbols-only) → `"en"`.
- Server: `runCopilot` detects from `body.message`, adds `lang` to the `meta` event.
- Client: `Copilot` detects synchronously on each message (same module) for instant
  RTL layout before any event arrives. Both use the same pure function → always agree.
- Types: `meta` event gains `lang: "ar" | "en"`. `RequestBody` unchanged.

## 2. Bidi isolation — `lib/copilot/language.ts` (pure) + `components/copilot-markdown.tsx` + CSS

- `isolateLtrTokens(text: string): Segment[]` where `Segment = { text; ltr: boolean }`.
  Splits a string into RTL-native (Arabic/neutral) runs and LTR-only runs. LTR runs are:
  - URLs (`https://…`, `http://…`, bare domains), email addresses
  - Numbers and metrics: `18/18`, `162`, `~67 ms`, `7,000+`, percentages, decimals,
    ISO dates, version strings (`v2.1.0`)
  - Code spans and backtick content
  - Curated technical-term list (see §3)
  - Runs of Latin letters/digits already bounded by non-letter characters are returned
    intact (the bidi algorithm handles them); the tokenizer mainly isolates compound
    tokens and known terms that otherwise corrupt ordering.
- Rendering: LTR segments render as `<span dir="ltr" lang="en" class="ltr-token">`
  with CSS `unicode-bidi: isolate` (+ `direction: ltr`). URL/email/code/tech-term
  matches also get chip styling (`rounded`, mono for code) where appropriate.
- `CopilotMarkdown` gains a `lang` prop:
  - Root container: `dir={lang === "ar" ? "rtl" : "ltr"}` and `lang={lang}`.
  - `a` override: keep accent styling, add `dir="ltr"` + `unicode-bidi: isolate`.
  - `code` inline override: already mono/bg chip; add `dir="ltr"` + isolate.
  - Text inside `p`, `li`, `td`, `th`, `h1..h3`: run through `isolateLtrTokens` and
    render segments as inline spans (LTR segments isolated, RTL segments plain).
- CSS in `app/globals.css` (`.prose-copilot` scope):
  - `.ltr-token { direction: ltr; unicode-bidi: isolate; }`
  - `.prose-copilot[dir="rtl"]` adjustments: heading alignment, list padding flipped
    (use `padding-inline-start` instead of `padding-left`), table alignment.
  - Arabic font stack via a new CSS variable `--font-arabic` (system stack:
    "Noto Sans Arabic", "Segoe UI", "Tahoma", "IBM Plex Sans Arabic", sans-serif),
    applied to RTL containers. Zero build risk, no new downloads.

## 3. Technical terms (preserved in English, isolated)

- Curated `TECH_TERMS` list in `language.ts`:
  `RAG, pgvector, FastAPI, PyTorch, MLflow, LightGBM, PostgreSQL, Docker, LLM, LLMs,
  MLOps, API, APIs, GitHub, LinkedIn, Redis, MongoDB, Kubernetes, TensorFlow, LangChain,
  Transformers, Qdrant, Milvus, ONNX, OpenCV, scikit-learn, XGBoost, Kafka, Airflow,
  FastAPI, Vercel, Next.js, React, TypeScript, Python, Jupyter` (+ any canonical names
  present in `lib/data.ts` tech lists).
- These are **never translated** in Arabic output. They render as isolated LTR tokens
  (and inline chips where the prose is Arabic).

## 4. Arabic retrieval support

- **Bilingual Arabic chunks** added to `lib/copilot/corpus.ts` (new ids, no renumbering
  of existing ids): Arabic versions of the profile-supporting content —
  `ar-hire`, `ar-about`, `ar-resume`, `ar-skills`, `ar-experience`, `ar-linkedin`,
  `ar-projects` (one overview + per-major-project summary: RestAI, others).
  Each chunk `text` = Arabic prose + `\n` + English translation/keywords on separate
  lines. Rationale: the committed embedding model `all-MiniLM-L6-V2` is English-only;
  the English portion anchors the vector so cosine retrieval still ranks correctly
  (dim stays 384, no model change). The Arabic portion is what the LLM reads as
  source text for Arabic answers.
- Metadata: same `SourceKind` values (`hire`, `about`, `resume`, `skills`, `experience`,
  `linkedin`, `project`), `authority` from the existing `AUTHORITY` map, `label`
  follows the existing scheme, `priority` from `BASE_PRIORITY`.
- **Intent rules**: `INTENT_RULES` in `intent.ts` gains Arabic phrase patterns →
  existing intents (e.g. `لماذا يجب`→recruiter, `عرفني`→recruiter, `ما أهم مهاراتك`/`مهارات`→skills,
  `اشرح لي`/`ما المعمارية`→architecture, `ما خبرتك`→experience, `ما الفرق`→decision,
  `اعرض لي السيرة الذاتية`→resume, `أين أجد GitHub`→links/resume, `ما سرعة`→stats).
  Detection stays deterministic; no extra LLM hop.
- **Rewrite bridge**: `rewrite.ts` gains an Arabic→English term dictionary
  (e.g. `خبرة`→`experience`, `مشروع`→`project`, `مهارات`→`skills`, `معمارية`→`architecture`,
  `استرجاع`→`retrieval`, `سرعة`→`latency`, `سيرة`→`resume`, `تقنيات`→`technologies`).
  `rewriteQuery` merges these English expansions into the token stream so keyword
  overlap can match English chunks. Cosine still embeds the original Arabic query.
- **Regenerate index**: `scripts/build-kb.ts` re-runs to emit updated
  `lib/index/{meta,vectors,centroids}.json`. Dim stays 384. Tests:
  `tests/index.test.ts` count assertions updated (was `>= 16`).

## 5. Response strategy layer — `lib/copilot/prompt.ts` (extend)

`buildSystemPrompt(mode, plan?, lang?)` and `buildMessages(..., lang?)` gain optional
`lang`. When `"ar"`, the system prompt uses:

- **Arabic IDENTITY**: professional Modern Standard Arabic; technically strong Egyptian
  AI engineer voice; concise; no marketing/motivational tone; no fabrication; answer
  only from provided context; decline politely if outside scope. Explicitly instruct:
  "Do not use colloquial Egyptian Arabic; use Modern Standard Arabic."
- **Per-mode Arabic strategy** (from spec §12):
  - recruiter → مختصر + قوي + evidence-based: لماذا محمد؟، نقاط القوة، الخبرة، أبرز
    المشاريع، التقنيات، لماذا هذه الخبرة مهمة؟
  - architecture → تقني + structured + architecture-first: لمحة، المعمارية، تدفق
    البيانات، القرارات، المقايضات
  - interview → question → concise answer → evidence → project
  - explore → conversational but professional
  - general → natural professional explanation
- **Arabic template hints** mapping every `PlanTemplate` to Arabic headings per spec §10
  (نبذة عني، الخبرة، المهارات الأساسية، أبرز المشاريع، القرارات الهندسية، المعمارية،
  المصادر، لماذا محمد؟).
- **Hard rules in Arabic prompts**:
  - Technical terms stay in English (never translate: RAG, pgvector, FastAPI, …).
  - Never emit raw URLs — instruct the model to describe links as named buttons/chips.
  - Never emit `[N]` citation markers — reference sources by name only.
  - Structure with bullets + short paragraphs; no walls of text.
  - Keep numbers/metrics exact (`18/18`, `~67 ms`, `7,000+`).
- `lang === "en"`: output is byte-identical to today (existing tests must not change
  their assertions for the `en` path).

## 6. Localized chrome — `lib/copilot/i18n.ts` (new) + `copilot.tsx` + `copilot-card.tsx`

`i18n.ts` (client-safe, no Node deps) exports per-`lang` label maps:

- Modes: `general→عام`, `recruiter→توظيف`, `interview→مقابلة`, `architecture→معمارية`,
  `explore→استكشاف` (English stays as-is).
- Quick actions: Arabic equivalents of the 6 existing English prompts
  (ماذا بنيت؟ / اعرض معمارية RestAI / اشرح نظام RAG / لماذا هذه القرارات؟ / قابِلني /
  ملخص السيرة الذاتية).
- Placeholder: "اسأل عن المشاريع، المعمارية، القرارات…"
- Footer: `Grounded in …` → `مُسنَد إلى …`; `Verified from N indexed sources` →
  `تم التحقق من N مصدرًا`.
- Context panel header: `Context · <mode>` → `السياق · <mode-ar>`.
- `Related:` → `ذات صلة:`.
- Dev panel labels: `intent=`, `confidence=`, `strategy=`, `plan=`, `cache=`,
  `tokens` → Arabic equivalents (values stay English codes).
- Source-kind labels: `resume→السيرة الذاتية`, `linkedin→LinkedIn`, `github→GitHub`,
  `project→RestAI` etc. via a `sourceLabel(kind, label, lang)` helper (project kinds
  keep their display name).
- Panel section labels in `copilot-card.tsx`: Skills→المهارات، Timeline→الخبرة،
  Stats→الأرقام، Links→الروابط، Resume→السيرة الذاتية، ProjectPanel labels
  (التقنيات، المعمارية، دراسة الحالة، GitHub).
- `CopilotCardPanel` gains `lang` prop (default `"en"`).

`components/copilot.tsx`:

- Run gains `lang: "ar" | "en"` (from client `detectLanguage(message)`).
- User bubble + assistant container get `dir`/`lang` per run.
- When any active run is Arabic (or the current input is Arabic), mode pills, quick
  actions, placeholder, footer, context header, dev labels, and "Related" switch to
  Arabic (full chrome localization, per decision).
- **Metrics strip**: `KeyNumbers` row in the footer shown when
  `lastRun.plan.template === "recruiter"` or `lastRun.plan.card === "stats"` (exact
  trigger: `plan.template === "recruiter" || plan.card === "stats"`). Data from
  `lib/data` `stats` + `githubStats` (18/18, 162, ~67 ms, 7,000+); each value
  rendered as an isolated LTR chip (`dir="ltr" lang="en"`, `unicode-bidi: isolate`),
  label localized.
- Source chips: footer's `Grounded in …` labels become clickable chips linking to
  `source.source.url` when present (localized labels, LTR URLs).

## 7. Accessibility & mobile

- `lang` + `dir` set on: assistant response container, user bubble, copilot dialog
  chrome, input element (`dir` follows current lang). Screen readers get correct
  language/direction.
- Keyboard navigation and reduced-motion behavior unchanged.
- Mobile: RTL layout verified at 320/375/768/1440+. Long tokens `truncate`/wrap;
  chips flex-wrap; no horizontal overflow. Flex/grid gap directions use logical
  properties where the RTL flip requires it.

## 8. Testing

New:
- `tests/language.test.ts` — `detectLanguage` over: pure Arabic, pure English, mixed
  Arabic-dominant, mixed English-dominant, numbers-only (→en), spec probe set
  ("بالعربي", "عرفني بنفسك", "لماذا يجب أن أوظف محمد؟", "ما أهم مهاراتك؟",
  "اشرح لي مشروع RestAI", "ما المعمارية المستخدمة في RestAI؟", "ما الفرق بين
  مشاريعك؟", "ما خبرتك في RAG؟", "ما خبرتك في تعلم الآلة؟", "ما التقنيات التي
  تستخدمها؟", "اعرض لي السيرة الذاتية", "أين أجد GitHub؟", "اشرح لي RAG
  architecture في RestAI", "ما استخدام FastAPI في المشروع؟", "ما سرعة الاسترجاع؟").
- `tests/bidi.test.ts` — `isolateLtrTokens`: URL/email isolation, numbers/metrics
  (`18/18`, `7,000+`, `~67 ms`), tech-term isolation, Arabic sentence with embedded
  terms yields ordered segments, no double-wrapping of already-LTR runs.
- Extended:
  - `tests/prompt.test.ts` — Arabic system prompt: contains MSA rules, per-mode
    Arabic strategy, Arabic headings, no `[N]` instruction, no URL instruction,
    tech-term preservation; Arabic vs English prompts differ; `en` prompts unchanged.
  - `tests/service.test.ts` — `meta.lang === "ar"` for an Arabic message,
    `"en"` for English; event order unchanged.
  - `tests/types.test.ts` — meta union accepts `lang`.
  - `tests/corpus.test.ts` — bilingual `ar-*` chunks exist with Arabic + English
    portions; existing chunk ids stable.
  - `tests/index.test.ts` — new chunk/centroid counts (dim 384 preserved).

Gates:
- `npm test` (node:test via tsx), `npx tsc --noEmit`, `npm run build`.
- Visual inspection in dev (Arabic + English); real Arabic LLM output requires
  `GROQ_API_KEY` (key-gated pass, flagged separately).

## Out of scope

- No layout/visual redesign, no glassmorphism/color/font-family changes for English.
- No changes to classifier/retrieval/planner/streaming internals beyond the additive
  Arabic rules, expansion dictionary, and corpus additions.
- No switching of the embedding model (stays `all-MiniLM-L6-V2`, 384-dim).
- English user-facing behavior and English prompt output remain identical.

## Decisions recorded

1. Full chrome localization when Arabic active (mode pills, quick actions, footer,
   context panel, dev labels) — user approved.
2. Arabic typography via curated system font stack (`--font-arabic`), no new
   Google-font download — user approved.
3. Metrics strip (KeyNumbers) added to footer for recruiter/stats plans, values
   isolated LTR — user approved.
4. Arabic retrieval via bilingual Arabic chunks in the corpus (embedding model kept
   English-only, dim 384) — user approved.
