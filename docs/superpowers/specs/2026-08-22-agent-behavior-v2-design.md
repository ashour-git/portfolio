# Agent Behavior v2 — Design

**Date:** 2026-08-22
**Status:** Draft — pending review
**Sub-project:** Agent intelligence & human-like behavior (follows 2026-08-21 copilot reliability)
**Scope:** Make the Engineering Copilot most human and most intelligent while keeping the agent-friendly architecture (explicit boundaries, stable contracts, deterministic tests) on Vercel static + Groq free tier.

## Context

The copilot now correctly strips ` thinking ...  response `, handles 413 as `rate_limited`, and fixes language mixing for `السيرة الذاتية`. Remaining gaps are behavioral: `hi , whay I should hire u` was misclassified as casual (generic `I'm doing well...` reply), repeated `why I hire u x5` hit `5/min` limiter, and recruiter answers were templated not synthesized. Success in 2 weeks: typo-tolerant intent, no mixed-language chips, warmer human tone, and an eval harness that proves it.

## Goals

- Human-like: handle typos/slang (`whay`→`why`, `u`→`you`) without calling them out, mirror register, vary rhythm.
- Most intelligent: synthesize across sources, quantify impact, trade-offs as `context → choice → cost`, precise citations `[1], [2]`.
- Agent-friendly: explicit seams, typed contracts, deterministic evals before anecdotes.

## Architecture & Contracts

**Seam to deepen:** `lib/copilot/retrieval.ts` — new module `retrieveAndPlan(message, mode, lang): Promise<{results: RetrievalResult[], plan: Plan, retrievalMs, strategy}>` owns `loadIndex`, `retrieveTopK:70`, `capContext`, language filter, and `buildPlan`. `service.ts:123` `runCopilot` shrinks to `validate → retrieveAndPlan → buildMessages → stream → filter`. Interface is `body + {apiKey, model, signal}` only; all other deps are internal seams.

**Stable contracts (unchanged):**
- `CopilotEvent:types.ts:92` union (`meta`, `plan`, `delta`, `sources`, `card`, `stats`, `done`, `error` with `kind: ErrorKind`)
- `RunDeps` after: `{apiKey, model, signal, fetchImpl?}` (test seam only)
- `capContext` typed `budget: {total:6000, perChunk:1200}`

**Deterministic tests:** `eval/cases.json` + `eval/run.ts` run without Groq (classify + retrieve + filter only).

## Components

- `lib/copilot/conversation.ts:167` — keep substantive-length check (already shipped: greeting + >2 words → not casual). No new interface.
- `lib/copilot/intent.ts:17` — add typo variants to `INTENT_RULES[recruiter]` (`hire u`, `whay`, `why i should hire`, `whay i should hire`) for fast rule path; centroid remains fallback.
- `lib/copilot/prompt.ts:4` — `IDENTITY` adds human-like block: “handle typos gracefully, infer intent, vary sentence rhythm, empathetic bridge for recruiter”. `MODE_INSTRUCTIONS` recruiter adds `connect claim→source→why it matters`. Keep all test-required phrases (`fabricat`, `Modern Standard Arabic`, `RAG`).
- `lib/copilot/scoring.ts:70` — add `rerank(results, query)` stub: if `Xenova/ms-marco-MiniLM` cached, cross-encode top-7 → top-3, else no-op. Deterministic, behind same seam.
- `service.ts:46` — `dedupeRepeatedPhrase` already shipped for `why I hire u x5`; keep. `validateInput` history already capped.

## Data Flow

1. `POST /api/copilot` `route.ts:17` → `validateInput` (dedupe) → `runCopilot({ip, limiter})` NDJSON.
2. `service.ts:128` `lang = detectLanguage(message)` (first-char tie-breaker, 0.3 ratio handled).
3. `retrieveAndPlan` → `embed → rewriteQuery → retrieveTopK` → language filter (`isArText` on `chunkTextById`, keep matching lang if ≥2 else fallback) → `rerank` → `buildPlan`.
4. `buildMessages:prompt.ts:153` with `capContext` (6000 total) → `streamGroq:groq.ts:132` → `ThinkingTagFilter:62` → `delta`.
5. Client `copilot.tsx:215` batches deltas 60ms; `Thinking…` shows while `streaming && !plan`.

## Error Handling & Safety

- `groq.ts:25` `413/429 → rate_limited` sanitized, `route.ts:53` never forwards raw `org_…`.
- `service.ts:131` limiter `10/min 60/hr` per IP, `Retry-After` surfaced as countdown in `copilot.tsx:508` (human behavior, not static busy wall).
- Prompt injection guard: `if (/ignore previous instructions/i.test(message)) return fallback` before `buildMessages`.

## Testing & Evals

- **Unit:** `tests/conversation.test.ts` typoed greeting cases, `tests/intent.test.ts` typo variants, `tests/narration.test.ts` single-chunk.
- **Integration:** `tests/service.test.ts` with `fakeGroq` 413 → `rate_limited`.
- **Eval harness:** `eval/cases.json` 24 cases: EN recruiter, AR recruiter, typo `whay`, repetition `why I hire u x5`, `السيرة الذاتية` isolation, fallback no context, architecture. `eval/run.ts` asserts `intent:recruiter`, `lang` isolation, `LEAK:false`, `mustCite`.
- **Build:** `npx tsc --noEmit` 0, `npm test` 137+, `eval/run.ts` 24/24, `scripts/probe-copilot.ts` 3/3 `finish:stop`.

## Risks

- Reranker model not cached → no-op, no regression.
- Context cap may truncate long project answers; mitigated by per-template `LENGTH_GUIDE` and rerank keeping top relevance.

## Out of Scope

- Paid Groq tier, shared rate-limit store, full portfolio redesign (sub-project 2/3).
