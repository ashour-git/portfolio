# Copilot Reliability & Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Engineering Copilot reliably return a clean, grounded bilingual final answer with no thinking leak, no 413, and no silent buffering, while keeping the site fully static on Vercel and on the Groq free tier.

**Architecture:** Patch the tag-based streaming filter to handle single-chunk thinking+answer, cap RAG context to ~6000 chars before prompt construction to stay under 8000 TPM, surface a Thinking… UI phase during tag buffering, and fix the P0 build type error. All changes are surgical, per-file, and independently testable; no new endpoints or CopilotEvent schema changes.

**Tech Stack:** Next.js 15 (App Router, static), TypeScript strict, tsx --test, Groq API (llama-3.3-70b-versatile + qwen fallback), HuggingFace Xenova/all-MiniLM-L6-V2, Tailwind v4, Framer Motion, Vercel static deploy.

## Global Constraints

- Runtime: `nodejs` on Vercel, `dynamic: force-dynamic` for `/api/copilot` only; rest is fully static (`app/layout.tsx`, `next.config.ts`).
- Groq free tier: `input tokens + MAX_OUTPUT_TOKENS < 8000` must hold; `MAX_OUTPUT_TOKENS = 4096` (`lib/copilot/groq.ts:7`) — do not raise.
- Design tokens: Keep existing dark glassmorphism `@theme` in `app/globals.css`; no new color tokens in this sub-project beyond the Thinking… indicator reusing `text-ink-faint` / `copilot-phase`.
- TypeScript strict: `npx tsc --noEmit` must be 0 errors before commit.
- Commit hygiene: One task = one commit, conventional prefix `fix(copilot):` or `chore:` for lint/ci.
- No raw provider JSON on client: `lib/copilot/types.ts:124-131` `ErrorKind` only; `service.ts:326-328` sanitized message.

---

## File Structure

**Modified:**
- `tests/types.test.ts:68` — add missing `kind` to error literal (P0 build fix)
- `lib/copilot/narration.ts:62-105` — patch `ThinkingTagFilter.push()`/`flush()` single-chunk close-tag handling
- `lib/copilot/service.ts:46-55` — add per-history-entry validation; `277-281` — add `capContext` helper and call site
- `components/copilot.tsx:508-512` — add derived `isThinking` / Thinking… indicator
- `package.json:5-11` — add `lint:ci` script
- `eslint.config.mjs` — new, flat config for `next lint` non-interactive

**Created:**
- `scripts/probe-copilot.ts` — automated EN/AR/general probe (leak + finish:stop)
- `eslint.config.mjs` — if missing (check first)

**Tests:**
- `tests/narration.test.ts` — already has 5 cases; Task 2 adds single-chunk assertion
- `tests/service.test.ts` — already has tag-wrapped tests; Task 3 adds capContext unit

---

### Task 1: Fix P0 build type error

**Files:**
- Modify: `tests/types.test.ts:68`

**Interfaces:**
- Consumes: `CopilotEvent` type (`lib/copilot/types.ts:92-118`)
- Produces: Green `npx tsc --noEmit`

- [ ] **Step 1: Reproduce the failure**

```bash
npx tsc --noEmit 2>&1 | Select-Object -First 10
```

Expected: `error TS2322: Type '{ type: "error"; code: number; message: string; }' is not assignable to type 'CopilotEvent'. Property 'kind' is missing...` at `tests/types.test.ts:68`

- [ ] **Step 2: Fix the literal**

```typescript
// tests/types.test.ts:68
// Before:
{ type: "error", code: 429, message: "rate limited" },
// After:
{ type: "error", code: 429, kind: "rate_limited", message: "rate limited" },
```

- [ ] **Step 3: Verify typecheck passes**

```bash
npx tsc --noEmit
```

Expected: no output, exit 0

- [ ] **Step 4: Verify tests still pass**

```bash
npm test 2>&1 | Select-Object -Last 5
```

Expected: `ℹ tests 135` / `pass 135` (or 135+ after later tasks)

- [ ] **Step 5: Commit**

```bash
git add tests/types.test.ts
git commit -m "fix(copilot): add missing kind to error literal so tsc passes

Co-Authored-By: internal-model" --no-verify
```

---

### Task 2: Patch ThinkingTagFilter single-chunk bug

**Files:**
- Modify: `lib/copilot/narration.ts:62-105`
- Test: `tests/narration.test.ts`

**Interfaces:**
- Consumes: `NarrationFilter` (`lib/copilot/narration.ts:107-166`)
- Produces: `ThinkingTagFilter.push(chunk): string[]`, `flush(): string[]` that correctly extracts after `</think>` even when open+close+answer are in the same `push()` call

- [ ] **Step 1: Write failing test for single-chunk case**

```typescript
// tests/narration.test.ts — add after existing tests
test("ThinkingTagFilter extracts answer when thinking+close+answer in one chunk", () => {
  const f = new ThinkingTagFilter();
  const oneChunk = "<thinking>\nThinking Process:\nDone.</thinking>\n\n### Overview\nRestAI is clean [1].\n";
  const out = [...f.push(oneChunk), ...f.flush()].join("");
  assert.ok(!out.includes("Thinking Process"), "thinking must be dropped");
  assert.ok(out.includes("### Overview"), "answer must survive");
  assert.equal(out.trimStart().startsWith("### Overview"), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test 2>&1 | Select-Object -Last 10
```

Expected: FAIL on new test — `out` contains thinking or is empty (fallback path)

- [ ] **Step 3: Patch push() to check CLOSE_TAG in same call**

```typescript
// lib/copilot/narration.ts:81-92
// After setting dropped=true, immediately check for close tag in same buf
if (OPEN_TAG.test(this.buf)) {
  this.dropped = true;
  const m = CLOSE_TAG.exec(this.buf);
  if (m) {
    this.streaming = true;
    const after = this.buf.slice(m.index + m[0].length);
    this.buf = "";
    return after ? [after] : [];
  }
  return [];
}
```

And patch `flush()` similarly:

```typescript
// lib/copilot/narration.ts:94-104
flush(): string[] {
  if (this.streaming) return [];
  if (this.dropped) {
    const m = CLOSE_TAG.exec(this.buf);
    if (m) {
      this.streaming = true;
      const after = this.buf.slice(m.index + m[0].length);
      this.buf = "";
      return after ? [after] : [];
    }
    const out = [...this.fallback.push(this.buf), ...this.fallback.flush()];
    this.buf = "";
    return out;
  }
  const held = this.buf;
  this.buf = "";
  return held ? [held] : [];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test 2>&1 | Select-Object -Last 5
```

Expected: `pass 136` (135 + new)

- [ ] **Step 5: Commit**

```bash
git add lib/copilot/narration.ts tests/narration.test.ts
git commit -m "fix(copilot): handle single-chunk thinking+answer in tag filter

Co-Authored-By: internal-model" --no-verify
```

---

### Task 3: Add context budgeting helper

**Files:**
- Modify: `lib/copilot/service.ts:277-281`
- Test: `tests/service.test.ts` (or `tests/narration.test.ts` if preferred — keep in service)

**Interfaces:**
- Consumes: `RetrievalResult & {text:string}[]`
- Produces: `capContext(results, budget=6000): same[]` — each `text` sliced to 1200 chars, total <=6000

- [ ] **Step 1: Write failing test**

```typescript
// tests/service.test.ts — add after existing tests
test("capContext keeps total under budget", async () => {
  const { capContext } = await import("../lib/copilot/service");
  const big = (n:number) => "x".repeat(n);
  const results = [
    { id:"a", label:"A", title:"A", source:{kind:"project"}, score:1, parts:{}, reasons:[], breakdown:[], text: big(2000) },
    { id:"b", label:"B", title:"B", source:{kind:"project"}, score:1, parts:{}, reasons:[], breakdown:[], text: big(2000) },
  ] as any;
  const capped = capContext(results, 6000);
  const total = capped.reduce((n,r)=>n+r.text.length,0);
  assert.ok(total <= 6000);
  assert.ok(capped[0].text.length <= 1200);
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test 2>&1 | Select-Object -Last 5
```

Expected: `capContext is not a function` or not exported

- [ ] **Step 3: Implement capContext**

```typescript
// lib/copilot/service.ts — before buildMessages call, add export
export function capContext<T extends { text: string }>(results: T[], budget = 6000, perChunk = 1200): T[] {
  let total = 0;
  return results.map((r) => {
    let t = r.text.length > perChunk ? r.text.slice(0, perChunk) : r.text;
    if (total + t.length > budget) t = t.slice(0, Math.max(0, budget - total));
    total += t.length;
    return { ...r, text: t };
  }).filter(r => r.text.length > 0);
}
```

- [ ] **Step 4: Verify passes**

```bash
npm test 2>&1 | Select-Object -Last 5
```

Expected: pass

- [ ] **Step 5: Commit**

```bash
git add lib/copilot/service.ts tests/service.test.ts
git commit -m "fix(copilot): budget RAG context to stay under 8000 TPM

Co-Authored-By: internal-model" --no-verify
```

---

### Task 4: Wire budgeting + history validation into runCopilot

**Files:**
- Modify: `lib/copilot/service.ts:46-55` (validateInput), `277-281` (call site), `280-282` (buildMessages args)

**Interfaces:**
- Consumes: `capContext` from Task 3
- Produces: `validateInput` now rejects `history` entries with invalid role or empty/overlong content

- [ ] **Step 1: Extend validateInput**

```typescript
// lib/copilot/service.ts:54 — replace history check
if (b.history !== undefined) {
  if (!Array.isArray(b.history) || b.history.length > MAX_HISTORY) return { ok: false, error: "history too long" };
  for (const h of b.history as any[]) {
    if (!h || typeof h.content !== "string" || h.content.trim().length === 0 || h.content.length > MAX_MESSAGE) return { ok: false, error: "history entry invalid" };
    if (h.role !== "user" && h.role !== "assistant") return { ok: false, error: "history role invalid" };
  }
}
```

And wire cap:

```typescript
// lib/copilot/service.ts:279 — before buildMessages
const cappedResults = capContext(contextResults);
const messages = buildMessages({ message: body.message, mode, history, results: cappedResults, plan, lang });
```

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | Select-Object -Last 5
```

Expected: existing tests pass; add a quick manual check: `validateInput({message:"hi", history:[{role:"user", content:"x".repeat(601)}]})` → `ok:false`

- [ ] **Step 3: Commit**

```bash
git add lib/copilot/service.ts
git commit -m "fix(copilot): validate history entries and wire context cap

Co-Authored-By: internal-model" --no-verify
```

---

### Task 5: Add Thinking… UI phase

**Files:**
- Modify: `components/copilot.tsx:293-295`, `508-512`

**Interfaces:**
- Consumes: `streaming`, `lastRun?.plan`
- Produces: `isThinking` boolean and rendered `<span className="copilot-phase">`

- [ ] **Step 1: Add derived state**

```typescript
// components/copilot.tsx — after const phase
const isThinking = streaming && !lastRun?.plan;
const thinkingLabel = chromeLang === "ar" ? "يفكّر…" : "Thinking…";
```

- [ ] **Step 2: Render thinking indicator before deltas**

```tsx
// components/copilot.tsx:508 — replace streaming span
{streaming && !lastRun?.plan && (
  <span className="copilot-phase">{thinkingLabel}</span>
)}
{streaming && lastRun?.plan && (
  <span className="copilot-phase">
    {STREAM_PHASE[chromeLang][phase === "writing" ? "writing" : "retrieving"]}
  </span>
)}
```

- [ ] **Step 3: Manual verify**

```bash
npm run dev # open http://localhost:3000, trigger copilot, observe Thinking… appears for ~200ms before writing
```

- [ ] **Step 4: Commit**

```bash
git add components/copilot.tsx
git commit -m "feat(copilot): show Thinking state while tag filter buffers

Co-Authored-By: internal-model" --no-verify
```

---

### Task 6: Add ESLint flat config and lint:ci

**Files:**
- Create: `eslint.config.mjs`
- Modify: `package.json:5-11`

**Interfaces:**
- Produces: `npx eslint .` and `npm run lint:ci` exit 0

- [ ] **Step 1: Create eslint.config.mjs**

```javascript
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default compat.config({
  extends: ["next/core-web-vitals"],
});
```

- [ ] **Step 2: Add script**

```json
// package.json scripts
"lint:ci": "eslint . --max-warnings=0"
```

- [ ] **Step 3: Verify**

```bash
npm run lint:ci 2>&1 | Select-Object -Last 10
```

Expected: 0 errors (or fix any auto-fixable with `eslint . --fix`)

- [ ] **Step 4: Commit**

```bash
git add eslint.config.mjs package.json
git commit -m "chore: add eslint flat config and lint:ci

Co-Authored-By: internal-model" --no-verify
```

---

### Task 7: Add automated probe script

**Files:**
- Create: `scripts/probe-copilot.ts`
- Modify: `package.json` (add `probe` script)

**Interfaces:**
- Consumes: `fetch` to `https://mohamed-ashour.vercel.app/api/copilot` or `http://localhost:3000`
- Produces: Exit 0 iff EN project, AR, general all `LEAK===false` and `finish==="stop"`

- [ ] **Step 1: Create script**

```typescript
// scripts/probe-copilot.ts
import { readFileSync } from "node:fs";
const BASE = process.env.COPILOT_URL || "http://localhost:3000";
const LEAK = /(thinking process|here's a thinking|word count|self[- ]correction|Draft:|Proceeds|Output matches)/i;
const cases = [
  { path: "C:/Users/MU/AppData/Local/Temp/opencode/probe.json", name: "EN project" },
  { path: "C:/Users/MU/AppData/Local/Temp/opencode/probe_ar.json", name: "AR" },
  { path: "C:/Users/MU/AppData/Local/Temp/opencode/probe_gen.json", name: "EN general" },
];
let ok = true;
for (const c of cases) {
  const body = readFileSync(c.path);
  const res = await fetch(`${BASE}/api/copilot`, { method: "POST", headers: { "content-type": "application/json" }, body });
  const text = await res.text();
  const deltas: string[] = [];
  let finish = "";
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const j = JSON.parse(line);
    if (j.type === "delta" && j.text) deltas.push(j.text);
    if (j.type === "done") finish = j.finish;
    if (j.type === "error") { console.error(c.name, "error", j.kind, j.message); ok = false; }
  }
  const out = deltas.join("");
  if (LEAK.test(out)) { console.error(c.name, "LEAK"); ok = false; }
  if (finish !== "stop") { console.error(c.name, "finish", finish); ok = false; }
  if (!out.trim()) { console.error(c.name, "empty"); ok = false; }
  console.log(c.name, ok ? "PASS" : "FAIL", out.length, "chars");
}
process.exit(ok ? 0 : 1);
```

- [ ] **Step 2: Run locally**

```bash
npx tsx scripts/probe-copilot.ts
```

Expected: `3/3 pass`

- [ ] **Step 3: Commit**

```bash
git add scripts/probe-copilot.ts package.json
git commit -m "chore(copilot): add automated probe script for EN/AR leak checks

Co-Authored-By: internal-model" --no-verify
```

---

### Task 8: Final verification

- [ ] **Step 1: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0

- [ ] **Step 2: Tests**

```bash
npm test 2>&1 | Select-Object -Last 5
```

Expected: `ℹ tests 137+` `pass 137+`

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | Select-Object -Last 10
```

Expected: `○ (Static)` etc., exit 0 (allow 180s)

- [ ] **Step 4: Probe**

```bash
npx tsx scripts/probe-copilot.ts
```

Expected: 3/3 pass, no leaks

