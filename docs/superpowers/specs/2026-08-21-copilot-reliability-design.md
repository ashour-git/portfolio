# Copilot Reliability & Quality — Design

**Date:** 2026-08-21
**Status:** Draft — pending review
**Sub-project:** 1 of 3 in the portfolio enhancement program (Approach A: Balanced 3-Track Polish)
**Scope:** Fix P0 build + harden copilot reliability/bilingual quality while staying static on Vercel and on the Groq free tier. Design refresh and observability are sub-projects 2/3.

## Context

Recent copilot work fixed model fallback (`service.ts:289-349`) and thinking leaks via a tag-based filter. Live verification shows EN and AR answers are now clean after ` thinking ...  response ` stripping, but three gaps remain: a `tsc` failure blocks builds, a single-chunk tag edge leaks, and context size (~10.8k chars worst-case) pushes `input + 4096` over the 8000-TPM free tier (413). This sub-project closes those gaps and adds the missing UI/CI surface.

Success in 2 weeks: zero leaked thinking in EN/AR, zero 413s on fallback models, `tsc --noEmit` 0 errors, `npm run build` completes, probe script shows `finish: stop` and `LEAK: false` for EN project / AR / general.

## Architecture & Scope

**Purpose:** The copilot must return a clean, grounded, bilingual final answer every time with no thinking, no 413s, and no silent buffering.

**In scope:**

- Fix `tests/types.test.ts:68` (add `kind` to error literal) so `tsc --noEmit` passes.
- Patch `lib/copilot/narration.ts:81-104` — `ThinkingTagFilter` single-chunk bug: check `CLOSE_TAG` in the same `push()` call after detecting `OPEN_TAG`, and in `flush()` before falling back to `NarrationFilter`.
- Add context budgeting in `lib/copilot/service.ts:277-281` — new `capContext(results, budget=6000)` slices each `text` to 1200 chars and total to 6000 chars before `buildMessages`. Keeps input < 2500 tokens so `input + 4096 < 8000` even on `qwen/qwen3.6-27b`.
- Add `Thinking…` UI phase in `components/copilot.tsx:508-512` — derived `isThinking` when `streaming && !plan` and tag filter is in `dropped` state (forwarded via existing `plan`/`meta` events, no new event type).
- Add `eslint.config.mjs` + `npm run lint:ci` (non-interactive) and `scripts/probe-copilot.ts` (automated EN/AR/general leak + `finish:stop` check).

**Out of scope (deferred):** Full portfolio redesign (sub-project 2), paid Groq tier / semantic cache / shared rate-limit store (sub-project 3). The in-memory `cacheHits` (`route.ts:9`) and `modelCheckCache` (`service.ts:27`) limitations are documented, not re-architected here.

**Boundaries:** `narration.ts` is pure streaming filters (no I/O). `service.ts` orchestrates retrieval → prompt → stream → filter. `route.ts` is the NDJSON stream boundary. Each is independently testable.

## Components & Interfaces

- `ThinkingTagFilter` (`lib/copilot/narration.ts:62-105`) — `push(chunk: string): string[]`, `flush(): string[]`. Pure, no deps except `NarrationFilter` for fallback. Fix: after `OPEN_TAG.test(buf)` sets `dropped=true`, immediately `CLOSE_TAG.exec(buf)` in same call. Per-candidate instance in `service.ts` loop. Handles ` think ` (no slash) vs ` response ` (slash) via `/<think(?:ing)?>/i` and `/<\/think(?:ing)?>/i`.

- `NarrationFilter` (`lib/copilot/narration.ts:107-166`) — unchanged fallback for untagged preambles or truncated `dropped && !streaming` flush. Exposes `stripNarration(text: string): string` for tests.

- `capContext` (`lib/copilot/service.ts:277-281` new) — `(RetrievalResult & {text:string})[] -> same[]` with per-text 1200-char slice and total 6000-char cap. Depends only on `loadIndex`; pure function, called before `buildMessages`.

- `runCopilot` (`lib/copilot/service.ts:123-383`) — wiring only: per-candidate `tagFilter`, context cap. No API shape change to `CopilotEvent`.

- `Copilot` UI (`components/copilot.tsx:508-512`) — new derived `isThinking` state; no new props or events.

Each unit is small, single-purpose, and its contract is visible from its signature without reading internals.

## Data Flow

1. `POST /api/copilot` (`route.ts:17-50`) → `validateInput` → `clientIp` → `runCopilot({ip, limiter, cacheHits, signal})` as NDJSON.
2. `service.ts:135-139` rate-limit check (in-memory `Map`, single-instance, documented). On `429`, emit `error:rate_limited` and return.
3. `service.ts:175-198` candidate resolution (cached 5min); `service.ts:204-256` retrieval: `embed → rewriteQuery → retrieveTopK` (primary 5 @0.25 else relaxed 7 @0.12), `cacheHits` keyed by `message:mode`.
4. `service.ts:258-281` plan built, then **new** `capContext(results)` before `buildMessages` to bound input.
5. `service.ts:289-306` per-candidate streaming: `streamGroq` → `tagFilter.push(delta)` → `yield delta`. For ` thinking ...  response `, buffers thinking, discards at `</think>`, streams answer. Clean answers stream after 200-char hold. On `flush()`, truncated thinking falls back to `NarrationFilter`.
6. Client `copilot.tsx:215-259` batches deltas every 60ms into `messages[runId]`; new `Thinking…` indicator shows while `streaming && !plan` (covers tag-buffered gap).

No new endpoints or `CopilotEvent` schema changes (`types.ts:92-118` unchanged).

## Error Handling

- `groq.ts:25-31` — `classifyStatus` maps 401/403→`auth`, 404→`model_unavailable`, **413/429→`rate_limited`**, 5xx→`unknown`. 413 now calm, no `org_…`/billing URL leak.
- `service.ts:314-328` — `unusable` is `model_unavailable` OR `400 + /reduce the length/` (non-chat model). `rate_limited` (incl. 413) is surfaced as `error 429 rate_limited` with fixed message `"The model provider is rate-limited right now. Wait a few seconds and try again."` (`groq.ts:39-42` extracts detail but not forwarded).
- `service.ts:308` — `isAbort(signal)` early return, no error event.
- `service.ts:351-368` — all candidates 404 → `modelCheckCache:{ok:false}` 5min, then `503 model_unavailable` with `Set GROQ_MODEL…` detail.
- `route.ts:53-64` — outer `try/catch` safety net; `runCopilot` already emits typed errors, so raw `err` is never forwarded (`void err` + fixed `500 unknown`).
- `narration.ts:94-104` — single-chunk fix; `MAX_DROP_LINES 400` prevents infinite buffering.
- `service.ts:46-55` — add per-history-entry validation (`role` allowlist, 600-char cap) to reduce injection surface.

All errors map to `ErrorKind:124-131` and `errorMessage()` in `i18n` for localized UI.

## Testing

- **Unit:** `tests/narration.test.ts` — tag extraction after `</think>`, clean passthrough, chunk-split tag (`<thi`+`nking>`), truncated fallback. `tests/service.test.ts` — `thinking wrapped in tags` uses `<thinking>…</thinking>` format, `oversized-request 413 → rate_limited`, `tests/types.test.ts:68` fix. `capContext` tested via `buildMessages` length assertion (pure function).
- **Integration:** `tests/service.test.ts` 12 service tests with mocked `fetchImpl`/`listModels` stay green.
- **Live verification:** `scripts/probe-copilot.ts` — three `curl.exe --data-binary` POSTs (EN project, AR, general) assert `LEAK===false`, `finish==="stop"`, `delta chars>0`. Manual now, Vercel post-deploy check later.
- **Build/type:** `npx tsc --noEmit` 0 errors, `npm run build` (180s timeout, Next 15.5 is slow), `npm run lint:ci` 0 warnings.

## Risks & Mitigations

- Tag format drift (model changes ` think` → `#thinking`): `NarrationFilter` fallback still strips untagged preambles. Probe script catches drift.
- Context cap hurts long project answers: 1200/chunk keeps `project-restai` (3763 chars) truncated but retains lead facts; full redesign can revisit per-template budgets.
- In-memory cache divergence across serverless instances: documented, acceptable for 5-min candidate cache and retrieval cache; sub-project 3 can add shared store if traffic grows.

## Out of Scope for This Sub-Project

- Visual redesign beyond `Thinking…` indicator.
- Paid tier, semantic cache, shared rate-limit.
- Load testing for TPM (verified by char count, not token encoder).
