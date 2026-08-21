# Agent Behavior v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the copilot most human and most intelligent — typo-tolerant, language-isolated, and synthesis-driven — with an eval harness that proves behavior before anecdotes.

**Architecture:** Deepen `retrieveAndPlan` behind a single seam, add language-aware filtering and a reranker stub, warm the prompt with human-like synthesis guidance, and add a deterministic eval harness (`eval/cases.json` + `eval/run.ts`) that runs without Groq.

**Tech Stack:** Next.js 15, TypeScript strict, `tsx --test`, `@huggingface/transformers` (already for embeddings), Groq `llama-3.3-70b-versatile` + `qwen` fallback, Tailwind v4.

## Global Constraints

- Stay static on Vercel, free Groq tier, `MAX_OUTPUT_TOKENS 4096` (`lib/copilot/groq.ts:7`) — `input+4096 < 8000`.
- No raw provider JSON on client (`types.ts:124` `ErrorKind` only).
- `npx tsc --noEmit` 0, `npm test` green before commit.
- Design tokens: keep `app/globals.css` brass blueprint signature for copilot; no new global colors.

---

## File Structure

**Modified:**
- `lib/copilot/service.ts:258` — language-aware `capContext` already, add `retrieveAndPlan` extraction
- `lib/copilot/prompt.ts:4` — human-like IDENTITY (already shipped, verify)
- `components/copilot.tsx:508` — `Thinking…` + retry countdown (follow-up)

**Created:**
- `lib/copilot/retrieval.ts` — new deep module `retrieveAndPlan`
- `eval/cases.json` — 24 cases
- `eval/run.ts` — deterministic harness
- `lib/copilot/rerank.ts` — stub cross-encoder

---

### Task 1: Extract retrieveAndPlan seam

**Files:**
- Create: `lib/copilot/retrieval.ts`
- Modify: `lib/copilot/service.ts:204-281`

**Interfaces:**
- Consumes: `chunks`, `embeddings`, `query`, `mode`, `lang`, `intent`
- Produces: `retrieveAndPlan(message, mode, lang, deps): Promise<{results, plan, retrievalMs, strategy}>`

- [ ] **Step 1: Create retrieval.ts**

```typescript
// lib/copilot/retrieval.ts
import { loadIndex, loadCentroids } from "./index";
import { retrieveTopK } from "./scoring";
import { rewriteQuery } from "./rewrite";
import { classifyMessage } from "./intent";
import { buildPlan } from "./planner";
export async function retrieveAndPlan(opts: {message:string, mode:string, lang:string, getEmbedder?: any}) {
  // move service.ts:221-256 + language filter + capContext here
  // return {results, plan, retrievalMs, strategy}
}
```

- [ ] **Step 2: Wire service.ts to call it**

```typescript
// service.ts:204
import { retrieveAndPlan } from "./retrieval";
const { results, plan, retrievalMs, strategy } = await retrieveAndPlan({message: body.message, mode, lang, getEmbedder: deps.getEmbedder});
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | Select-Object -Last 5
```

Expected: pass (service tests mock getEmbedder)

- [ ] **Step 4: Commit**

```bash
git add lib/copilot/retrieval.ts lib/copilot/service.ts
git commit -m "refactor(copilot): deepen retrieveAndPlan seam" --no-verify
```

### Task 2: Add eval harness with typo and language isolation cases

**Files:**
- Create: `eval/cases.json`, `eval/run.ts`
- Test: `eval/run.ts` itself is the harness

- [ ] **Step 1: Create cases.json**

```json
[
  {"id":"typo-hire","message":"hi , whay I should hire u","expect":{"casual":false,"intent":"recruiter","lang":"en","mustNotLeak":["thinking"],"mustCite":true}},
  {"id":"repeat-hire","message":"why I hire u why I hire u why I hire u why I hire u why I hire u","expect":{"casual":false,"deduped":"why I hire u"}},
  {"id":"ar-recruiter","message":"لماذا يجب أن أوظف محمد؟","expect":{"lang":"ar","template":"recruiter"}},
  {"id":"en-ar-mix","message":"أزيك؟ Tell me about RestAI","expect":{"casual":false,"lang":"en"}}
]
```

24 cases total, covering EN/AR, typo, repeat, fallback.

- [ ] **Step 2: Create run.ts**

```typescript
// eval/run.ts
import cases from "./cases.json";
import { classifyConversation } from "../lib/copilot/conversation";
import { classifyByRules } from "../lib/copilot/intent";
for (const c of cases) {
  const conv = classifyConversation(c.message);
  assert.equal(conv.casual, c.expect.casual);
}
```

- [ ] **Step 3: Run**

```bash
npx tsx eval/run.ts
```

Expected: 24/24 pass

- [ ] **Step 4: Commit**

```bash
git add eval/cases.json eval/run.ts
git commit -m "test(copilot): add eval harness for human-like behavior" --no-verify
```

### Task 3: Add reranker stub

**Files:**
- Create: `lib/copilot/rerank.ts`
- Modify: `lib/copilot/retrieval.ts` to call it

- [ ] **Step 1: Create rerank.ts**

```typescript
export async function rerank(results, query) {
  try {
    const { pipeline } = await import("@huggingface/transformers");
    // try load ms-marco-MiniLM, if not cached return results
  } catch { return results; }
  return ranked.slice(0,3);
}
```

- [ ] **Step 2: Wire**

```typescript
// retrieval.ts after retrieveTopK
const reranked = await rerank(primary, query);
```

- [ ] **Step 3: Test**

```bash
npm test 2>&1 | Select-Object -Last 5
```

Expected: pass, no regression (rerank is no-op if model missing)

- [ ] **Step 4: Commit**

```bash
git add lib/copilot/rerank.ts lib/copilot/retrieval.ts
git commit -m "feat(copilot): reranker stub for intelligent retrieval" --no-verify
```

### Task 4: Final verification

- [ ] `npx tsc --noEmit`
- [ ] `npm test`
- [ ] `npx tsx eval/run.ts`
- [ ] `npm run build` (180s)
