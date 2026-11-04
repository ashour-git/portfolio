# Copilot Intelligence v3 - Design

**Date:** 2026-11-04
**Status:** Draft - pending review
**Sub-project:** Agent intelligence and retrieval (follows 2026-08-22 agent behavior v2)
**Scope:** Add deterministic conversation memory, BM25 lexical scoring, and passage selection to the Copilot retrieval pipeline, before any new model or provider work.

## Context

The agent behavior v2 work shipped the deterministic eval harness, the reranker seam, and the language and intent fixes. Retrieval now flows through embed -> rewrite -> retrieve -> language filter -> rerank -> plan.

Three deterministic gaps still limit the "super intelligent" quality bar, all fixable without touching the model, the provider, or the index:

1. Follow-ups lose context. A second turn such as "why did you choose it over Pinecone?" retrieves only from the new words. The anchor "pgvector" from the prior turn is never seen, so the answer is anchored to nothing.
2. Cosine-only scoring discards literal term overlap. A precise technical term (pgvector, latency, RAG) often deserves a lexical signal that plain cosine cannot express.
3. `capContext` head-truncates each chunk, so long project chunks lose the Impact, Tradeoffs, and Lessons segments at the tail before the model ever reads them.

The approved direction is a deterministic intelligence layer: conversation memory + BM25 + passage selection, kept light and free-tier friendly.

## Goals

- Conversation memory: when a user sends a short follow-up, build the retrieval query from the last substantive user turn plus the follow-up, and use that query for retrieval only.
- BM25: add a normalized lexical score that coexists with the existing cosine signal in the weighted retrieval score.
- Passage selection: select the most relevant labeled segments of a chunk up to the per-chunk budget instead of blind head truncation.

## Non-Goals

- No new model files, no new embeddings, no new provider calls, no new dependencies.
- No index rebuild or section re-chunking.
- No LLM query rewriting.
- No client component changes, no HTTP contract change, no CopilotEvent schema change.

## Architecture and Contracts

### New modules

`lib/copilot/memory.ts`
- `buildRetrievalQuery(input: { message: string; history?: ChatMessage[]; lang?: Lang }): { query: string; expanded: boolean }`
- History is expected to be already user/assistant-only and length-capped (the validated request shape); the function filters defensively.
- Pure function, no IO, no provider cost, never throws on malformed input.
- Gates for expansion, all must hold:
  1. History contains at least one eligible user turn.
  2. Anchor = last eligible user turn, truncated to 300 chars.
  3. Current message has at most 8 words.
  4. Current message contains a follow-up marker (English or Arabic) or is a bare deictic pronoun.
- Expansion only when a substantive anchor exists; final retrieval query is `anchor + " " + message`, capped at 300 chars total, `expanded: true`.
- Follow-up markers are language-keyed: an English marker set and an Arabic marker set; bare deictics cover both scripts.

`lib/copilot/bm25.ts`
- `createBm25Index(docs: { id: string; text: string; keywords: string[] }[]): { score(queryTokens: string[], docId: string): number }`
- Document text = title + keywords + text.
- Tokenization reuses the same lowercasing and length-3 minimum as the existing rewrite tokenizer; an English stopword set is applied.
- Parameters: k1 = 1.2, b = 0.75. Normalized score = raw / (raw + 4), yielding a bounded 0..1 value.
- Module-level lazy cache; failure-safe to an empty index.

`lib/copilot/passage.ts`
- `splitPassages(text: string): string[]`
- Label allowlist: Project, Tagline, Summary, Problem, Solution, Decisions, Architecture, Performance, Stack, Impact, Study, Model choice, Tradeoffs, Challenges, Deployment, Lessons, Observability.
- A labeled block runs from its label to the next label; lists separated by ` | ` keep their label.
- Fallback when no allowlisted label exists: sentence segmentation on periods.
- `selectPassage(text: string, queryTokens: string[], opts?: { maxChars?: number }): string`
- Text at or under the cap is returned unchanged.
- Otherwise the first segment is always kept, remaining segments are ranked by query overlap plus a small label weight, added in document order while the combined text fits the cap.

### Existing seam changes

`lib/copilot/types.ts`
- `RetrievalSignal` gains `"bm25"`.
- `RetrievalResult.parts` gains an optional `bm25` field; `breakdown` gains an optional `bm25` signal.

`lib/copilot/scoring.ts`
- `DEFAULT_WEIGHTS = { cosine: 0.45, bm25: 0.15, keyword: 0.05, intent: 0.15, mode: 0.1, priority: 0.1 }`.
- `retrieveTopK` accepts an optional BM25 index bound to the current retrieval query tokens and adds the normalized score into the weighted sum and breakdown.

`lib/copilot/retrieval.ts`
- `retrieveAndPlan` builds the retrieval query via `buildRetrievalQuery` and uses it as the retrieval message.
- `retrieveAndPlan` returns `query` and `expanded` on its result so callers can log and assert.
- Cache key is derived from the retrieval query, so anchored follow-ups hit the same cache entry.

`lib/copilot/service.ts`, `lib/copilot/prompt.ts`
- Retrieval consumes the expanded query; the provider prompt keeps the raw `body.message`.
- Context payload goes through `capContext` with the retrieval query tokens; `capContext` accepts an optional query-token list and uses passage selection when present, otherwise it head-truncates (backward-compatible default).

## Data Flow

1. `POST /api/copilot` -> `validateInput` -> `runCopilot`.
2. `lang = detectLanguage(body.message)`, `conv = classifyConversation(body.message)`.
3. `retrievalQuery = buildRetrievalQuery({ message, history, lang })`.
4. `retrieveAndPlan({ message: retrievalQuery.query, ... })` returns results plus `query` and `expanded`.
5. BM25 score against the retrieval query tokens, weighted into `retrieveTopK`.
6. `capContext(results, budget, perChunk, { queryTokens })` -> `buildMessages({ message: body.message, ... })` -> stream.

## Error Handling and Safety

- `buildRetrievalQuery` has no throw path on bad history; it degrades to the raw message.
- `createBm25Index` fails safe to an empty index; BM25 then contributes zero.
- `selectPassage` degrades gracefully; `capContext` keeps the 6000 total and 1200 per-chunk budget.
- All new truncation paths avoid splitting UTF-16 surrogate pairs.
- No new environment variables, no new dependencies, no new network calls, no change to provider spend shape.

## Testing and Evals

- Unit suites: new `tests/memory.test.ts`, `tests/bm25.test.ts`, `tests/passage.test.ts`; extend `tests/scoring.test.ts` (BM25 signal weight sum, default weight sum equals 1.0).
- Eval harness: extend `eval/run.ts` with history and anchor expectations; add 3 multi-turn cases to `eval/cases.json` (the suite grows from 25 checks to 28: 27 cases plus the narration-leak check).
- Multi-turn eval cases:
  1. English deictic follow-up expands against the prior user anchor and retrieves the anchored source.
  2. Arabic deictic follow-up expands against the prior user anchor, stays Arabic-isolated.
  3. Assistant-only history does not expand.

## Risks

- Follow-up marker sets may be incomplete for newer slang; unit tests lock current behavior and the harness is cheap to extend.
- BM25 normalization constant (4) may need retuning after evals; it is centralized in one module.

## Out of Scope

- Section-level re-chunking, cross-encoder model, LLM query rewriting, paid Groq tier, UI redesign.
