# Engineering Copilot v2 — Retrieval & Response Redesign

**Status:** Approved (design); pending implementation plan

**Date:** 2026-08-09
**Scope:** `lib/copilot/` pipeline, `scripts/build-kb.ts`, corpus, `app/api/copilot/route.ts`, client components, tests.

## Problem

The Copilot answers high-stakes probes incorrectly:

- "Why should I hire you?" retrieves **zero** sources: the query tokenizes to `["why","should","hire","you"]`, none overlap corpus keywords, and every cosine score falls below `minScore 0.25`. The model receives an empty context and replies "no information about skills or experience."
- Root causes: (1) **a content gap** — the corpus has no dedicated value-proposition document; (2) **a retrieval gap** — a single generic recipe (cosine + keyword + mode boost, one fixed threshold) serves all query types; (3) **a presentation gap** — raw diagnostics ("0 sources") leak in front of visitors; (4) **a response gap** — no structured layouts per query type.

## Goals

A compact, production-style retrieval system. A recruiter should leave believing they explored a production AI product, not a generic LLM.

## 1. Intent Classification — `lib/copilot/intent.ts`

Deterministic, no extra LLM hop, fully testable.

- Output: `{ primary: Intent; secondary?: Intent; confidence: number }` where `Intent` is one of the nine: `general | recruiter | project | architecture | interview | resume | skills | experience | decision`.
- Two phases:
  1. **Rule match:** per-intent trigger phrase sets. A phrase hit assigns the intent with high confidence. Covers recruiter/architecture/interview/resume/skills/experience/project/decision probes.
  2. **Centroid match:** no rule hit → embed the query and cosine-match against per-intent centroid vectors (built at index time from representative phrases); nearest intent with soft confidence.
- Nothing matches → `general` at low confidence; **no secondary** emitted for `general`.
- Confidence: rule hit = high (e.g. ≥ 0.85); centroid = scaled cosine; thresholded.

## 2. Query Rewriting — `lib/copilot/rewrite.ts`

- Lightweight, deterministic, intent-aware expansion **before** retrieval.
- Each intent carries expansion phrases (recruiter → `"AI engineer"`, `"shipped products"`, `"skills"`, `"experience"`; architecture → `"flow"`, `"layers"`, `"decisions"`, `"tradeoffs"`, …).
- Token keyword phase runs against the expanded token set; the **embedding still uses the original query** (no distortion).
- Length-capped: expansion must never push past `MAX_MESSAGE`; `general` gets no expansion.

## 3. Retrieval v2 — `lib/copilot/scoring.ts`, `lib/copilot/types.ts`

Hybrid ranking with five signals (per-intent strategy):
- `cosine` (query↔chunk embedding)
- `keyword` overlap (expanded tokens)
- `intentBoost` (per-intent doc-kind priority dock: recruiter → resume/experience/skills/stats/hire; architecture → project; interview → project/principle/insight; …)
- `modeBoost` (existing `MODE_BOOST`, user-selected mode)
- `docPriority` (static per-kind base priority; projects weigh higher than stats)

`retrieveTopK(queryVec, tokens, chunks, { k, intent, mode, embeddings, weights })` returns `RetrievalResult[]` sorted by weighted score.

**Confidence + fallback:** if top-1 or top-k aggregate < threshold → **secondary relaxed pass** (lower `minScore`, broader doc set, `k+2`), guaranteeing grounded material. If even that is empty, the model receives the fallback template («supporting info not found — here are related topics»).

**Retrieval reasons (structured):** each result carries `reasons: string[]` (human-readable) **and** `breakdown: { signal; value; weight }[]` (machine-readable, Dev Mode only).

## 4. Document Authority — `lib/copilot/types.ts` + corpus

- Every chunk gets an `authority` field: `first-party` | `metrics` | `external`.
- Ranking signal + presentation branding ("Verified from N first-party sources").

## 5. Answer Planner — `lib/copilot/planner.ts`

Deterministic plan (no extra LLM hop). Takes classifier + retrieval confidence + doc-kind mix → `Plan`:

- `template`: `recruiter` | `project` | `interview` | `resume` | `skills` | `experience` | `decision` | `general`
- `stance`: `high` | `medium` | `fallback`
- `card`: `project` | `resume` | `skills` | `timeline` | `stats` | `links` | `none`
- `suggestions`: related indexed topics (only for `fallback`)

## 6. Pipeline — `lib/copilot/service.ts`, `scripts/build-kb.ts`

- `runCopilot`: validate → rate-limit → load index → (new) classify intent → (new) rewrite query → retrieve → plan → build context → stream Groq → typed CopilotEvent.
- Event sequence: `meta → plan → sources → card → delta* → stats → done` (or `error`).
- `build-kb` regenerates corpus **with** new chunks + per-intent centroid vectors + `authority` metadata; re-commits `lib/index/*`.

## 7. Corpus Additions — `lib/copilot/corpus.ts` (+ derived)

New derived chunks (all text derived from `lib/data.ts`, regenerated + committed):

- `hire` — "Why hire Mohamed": headline, stats (18/18 security tests, 162 tests, 7k books, ~67ms), production-AI experience, skills, principles.
- `about` — positioning/ story / philosophy.
- `linkedin` — profile + LinkedIn/GitHub/resume links chunk.

Plus per-chunk `priority` + optional `recency` metadata for tailoring.

## 8. Client / UI — `components/copilot.tsx`, `copilot-card.tsx`, `copilot-markdown.tsx`, new `copilot-feedback.tsx`

- **Sources footer (Requirement 7):** normal → "Grounded in Resume, RestAI, LinkedIn" or "Verified from 4 indexed sources." Raw counts/scores only **in Dev Mode** (footer toggle).
- **Contextual panel (Requirement 6):** driven by `plan.card` — Project (Overview/Architecture/Tech/Challenges/Decisions/GitHub/Case study + ArchitectureDiagram), Resume, Skills summary, Timeline, Stats, Links. The `plan.card` selects the card *type*; the existing `card` CopilotEvent continues to carry the project/resume *payload*; skills/timeline/stats/links cards are derived client-side from the retrieved `sources` (they are whole corpus chunks), so no new card payloads are needed.
- **Markdown structure (Requirement 4):** templates for recruiter/project/interview render H3 sections + tables; `CopilotMarkdown` renders; one new utility CSS class for tables.
- **Protocol:** CopilotEvent extended with a `plan` event (carries intent, confidence, template, stance, card) emitted early; the client reducer branches on it; unknown plans ignored (forward-compat).
- **Developer Mode:** footer toggle reveals per-signal breakdowns, cache state, retrievalMs, tokens, intent/confidence, plan template/stance.

## 9. Verification — Tests

- `intent.test.ts` — 9 intents, majority, ambiguous→general, secondary-intent coverage.
- `rewrite.test.ts` — expansion correctness + caps; general no-op.
- `scoring.test.ts` — hybrid weights/ordering + docBoost/authority effects.
- `planner.test.ts` — template/stance/card per (intent × confidence × docs).
- `service.test.ts` — new event sequence incl. plan; fallback path; stats carries confidence/intent.
- **regression-ad probe:** "Why should I hire you?" → ≥ 1 grounded source, plan.stance == `high` (asserts the exact v1 bug).
- Gates: `npm test`, `npx tsc --noEmit`, `npm run build`.

## Open Inputs / Assumptions

- Intent centroid vectors built from static trigger phrase lists (no new model).
- Recency: available metadata but not active by default.
- No new CSS system; one utility class added.

## Out of Scope

- Switching embedding models / re-encoding 7k book index.
- Multi-turn RAG memory beyond last-6 message history (already present).