# Engineering Copilot — Groq-Grounded AI Assistant for the Portfolio

**Date:** 2026-08-08
**Status:** Implemented
**Owner:** Site (`D:\GitHub\ashour-git\site`, Next.js 15 App Router, Tailwind v4, framer-motion ^13)

---

## 1. Overview

The Engineering Copilot is the portfolio's signature interactive experience: a
full-screen glass modal you can open from anywhere and ask questions about
Mohamed's work, projects, architecture, and decisions. It is not a generic
chatbot — it is an **AI product** that demonstrates the exact engineering it
talks about: retrieval, grounding, streaming, typed protocols, observability,
and careful sys-prompt scope.

It answers **only** about content in this repo, cites what it used, and explains
*why* it chose each source. Everything is grounded: **no hallucinations, no
fabrication, no exaggeration** (mission rule).

> The single success test: a recruiter opens the site, asks "What did Mohamed
> build?" and walks away thinking *"an AI engineer who built an AI product"* —
> not "a template with a chat widget."

### 1.1 Goals and non-goals

**Goals**

- Grounded Q&A over the real corpus: `lib/data.ts` (profile, stats, all 6
  projects incl. `study` blocks, skills, experience, principles, insights).
- Streaming answers rendered progressively with citations, structured
  "architecture cards", and an explainable retrieval layer.
- Zero new content maintenance: everything derives from the corpus already in
  the repo. No scraping of READMEs, LinkedIn, or resume at runtime.
- A premium, quiet UI that matches the Pipeline OS design language.

**Non-goals**

- No external embedding API, no hosted vector DB — embeddings are computed
  locally ("local embeddings at build").
- No auth/session storage — conversation history is ephemeral, sent per request.
- No off-topic answers (system: decline politely).
- No generic ChatGPT answers; personality: crisp, engineering-first, precise.

## 2. Decisions (approved in design review)

| # | Question | Decision |
|---|----------|----------|
| D1 | Embedding strategy | Local embeddings computed at **build time** (transformers.js / all-MiniLM-L6-v2, ONNX). Corpus vectors committed to the repo; runtime only embeds the one user query. No external embedding endpoint. |
| D2 | Copilot surface | **Full-screen glass modal** (`Cmd/Ctrl+J` + navbar "Copilot" trigger + "Ask Copilot" entry inside the existing ⌘K palette). The ⌘K navigation palette itself is unchanged. |
| D3 | Knowledge base scope v1 | **Repo data only** — synthesized Markdown generated from `lib/data.ts` + case-study sections, committed as the index. Deterministic; zero new content maintenance. |
| D4 | Abuse guardrail | **In-memory per-IP rate limit** in the API route (5/min, 30/hr sliding window). Per-serverless-instance tradeoff accepted. |
| D5 | Special modes | **Explicit mode selector** pills: `Recruiter · Interview · Architecture · Explore`. Architecture mode renders a structured project flow. |
| D6 | Groq provider | Server-side, streaming, OpenAI-compatible `chat/completions` via plain `fetch`. Key only ever in `GROQ_API_KEY` (`.env*` ignored). Model `llama-3.3-70b-versatile` fallback `llama-3.1-8b-instant`. |

## 3. Wire protocol: `CopilotEvent` (typed, extensible)

Server sends one strictly typed NDJSON stream; each line is a self-contained,
versioned event. The event union is the contract — the client reduces events
into render state and ignores unknown event types (forward compat).

```ts
type CopilotEvent =
  | { type: "meta"; id: string; mode: CopilotMode; model: string; startedAt: number }
  | { type: "delta"; text: string }                        // streamed answer token (markdown)
  | { type: "sources"; sources: RetrievalResult[] }         // citations used, in order
  | { type: "card"; card: CopilotCard | null }              // structured UI (project/architecture)
  | { type: "stats"; tokens: { in: number; out: number }; retrievalMs: number; totalMs: number; cache: "hit" | "build" | "miss" }
  | { type: "done"; finish: "stop" | "length" }
  | { type: "error"; code: number; message: string };
```

- Wire format: `fetch` `POST` → `ReadableStream`; one JSON object per line.
- The endpoint validates input (`message ≤ 600 chars`, `history ≤ 6 turns`).

### 3.1 Mode selector (`CopilotMode`, D5)

```ts
type CopilotMode = "general" | "recruiter" | "interview" | "architecture" | "explore";
```

| Mode | Retrieval bias | System focus | Renders |
|------|----------------|--------------|---------|
| `general` (default) | none | grounded answer + citations | text + sources |
| `recruiter` | resume/experience | experience, strengths, skills, contact summary | text + resume card |
| `interview` | projects + study | answer as Mohamed, technical depth | quoted answers |
| `architecture` | architecture/study | structured project flow | **scaffold card (project graph)** |
| `explore` | cross-project | compare / recommend / journey | comparison text |

## 4. Runtime: API route (`app/api/copilot/route.ts`)

`POST` body `{ message, mode, history? }` → NDJSON stream. Node.js runtime.

Pipeline (each stage observable):

```
rate-limit → embed query → retrieve top-k → build prompt → groq stream → NDJSON out
```

### 4.1 Retrieval: `RetrievalResult` (scoring + reasons = "Explain why" for free)

The index is built at compile time (`lib/index`); runtime retrieval returns
***scored* results with decomposed signal** so the client can show not only
*what* was used but *why*:

```ts
type RetrievalResult = {
  id: string;                  // chunk id
  title: string;               // e.g. "RestAI — study"
  source: { kind: "project" | "skill" | "principle" | "experience" | "insight" | "resume" | "stats"; slug?: string; url?: string };
  score: number;               // composite 0..1
  parts: { cosine?: number; keyword?: number; boost?: number };   // decomposition
  reasons: string[];           // explainable, e.g. "cosine 0.81", "keyword 'restai'", "mode: architecture"
};
```

- **Scoring**: composite = `w₁·cosine + w₂·keywordOverlap + w₃·modeBoost`
  (weights `0.6 / 0.3 / 0.1`; modeBoost per CopilotMode).
- top-k `k = 5`, min-score `0.25`; tie-break by source-kind priority.
- Keyword overlap is computed from query tokens (no embedding gate) → retrieval
  still behaves if the embedding model ever fails.
- Query embedding: one call at runtime, warm `globalThis` singleton.
- **"Explain why"** = the client renders `retrieval.reasons` — zero extra work.

### 4.2 Prompt construction

- **System**: identity + scope gate (§1.1 persona) + mode-specific instructions +
  "prefer repo facts, cite source titles, decline when outside scope, no
  fabrication".
- **Context**: top-k retrieval docs serialized (title + excerpt + id) so
  citations map back to the `sources` event.
- **History**: last 6 messages (client-owned state), never persisted.
- Sent to Groq; deltas forwarded as `{type:"delta"}`.

### 4.3 Security & rate limiting (D4)

- `GROQ_API_KEY` only in the route handler (server-side); `.env*` already git-ignored.
- In-memory sliding window per `x-forwarded-for`: `5/min` + `30/hour`;
  limit → `{type:"error", code:429}` then close stream.
- Request caps: message ≤ 600 chars; history ≤ 6 turns.
- No PII logged. No external network at runtime for embeddings (index committed).

## 5. UI design (full-screen glass modal)

### 5.1 Structure

- `components/copilot.tsx` — mounted once in `app/layout.tsx`, client component,
  loaded via `next/dynamic` (lazy), rendered on demand.
- Opening triggers: global `Cmd/Ctrl+J`, "Copilot" button in `components/nav.tsx`,
  "Ask Copilot" item appended to `components/command-palette.tsx` item list.
- **Landing state** (zero messages):
  - Eyebrow: `COPILOT → GROUNDED RAG → STREAM`
  - Title: "Engineering Copilot — ask me anything about my work"
  - Topic pills (quick questions): `What did you build?` · `Show RestAI architecture` ·
    `Explain your RAG` · `Why those tradeoffs?` · `Interview me` · `Resume summary`.
- **Conversation view**: left = streamed markdown answer (with citation chips),
  right = card panel; mobile collapses cards below the answer.

### 5.2 Architecture card (from `card` event)

When retrieval hits project docs (esp. `architecture` mode), the client renders a
structured scaffold reusing `components/architecture-diagram.tsx`:

`Architecture → Tech Stack → Engineering Decisions → Challenges → Lessons → GitHub → Case study`

The card content is authored from retrieval data (project graph), never from the
LLM's prose — the `card` event carries the block type, the client fills each
block from the selected project.

### 5.3 Premium style

- Existing tokens only: `glass-strong`, gradients, `Instrument_Serif` headers,
  monospace glyphs, motion tokens from `lib/motion.ts`.
- Motion honors `MotionProvider reducedMotion="user"`.
- Paced cursor, kbd hints (`⌘J` · `Esc`), `role="dialog"`, Escape closes, focus trap.
- Mobile-first scrolling; no Lighthouse regression (lazy-loaded, chunk-split,
  no layout shift).

## 6. Build-time knowledge generation (D1, D3)

`scripts/build-kb.ts` (dev-only, `npm run build:kb`):

1. **Corpus**: derive Markdown directly from `lib/data.ts` exports (no
   duplication) — per project (all fields + `study`), plus sections for skills,
   principles, experience, insights, stats.
2. **Chunking**: per-section and per-field text blocks; each chunk carries
   metadata (kind, slug, title).
3. **Embedding**: `all-MiniLM-L6-v2` via `@huggingface/transformers` (LOCAL
   ONNX, single model download on dev machine).
4. **Index artifact** (committed): `lib/index/info.json` (vector + meta),
   `lib/index/index.bin` (float32 embeddings). Runtime imports this; Vercel
   build never downloads the model.

Index scale ≈ 100–150 chunks (6 projects + ~10 support sections).

## 7. Observability

- `stats` event per run: `tokens {in,out}`, `cache: hit|build|miss`,
  `retrievalMs`, `totalMs`.
- Server-side (dev): structured log lines — mode, sources used, key latencies.
- Client footer: `⌁ 4 sources · 312 tokens · 312 ms` (subtle, inspectable).
- In-memory LRU cache for identical normalized query + mode (per instance);
  `cache` field demonstrates this cheaply.

## 8. Dependencies (delta)

- `@huggingface/transformers` (build-time embedding; runtime query embed only).
- No Groq SDK — plain `fetch` to OpenAI-compatible endpoint.
- No new state library — React state + `AnimatePresence` (already in use).
- No vector DB — flat array + cosine (index ≤ 150 chunks).

## 9. Testing / verification

- `npm run build` green (typecheck gate; `next lint` unavailable in this repo —
  build + `tsc` are the gate).
- Unit: scoring (parts/reasons correctness), chunk determinism, rate-limit
  window behavior.
- Integration: route handler test — POST → NDJSON event order, `error` on
  429/capped input, stream closes with `done`.
- Manual: all modes, decline path, "Explain why" panel, reduced-motion, mobile.

## 10. Out of scope (parked)

- Multi-turn memory beyond the 6-message window.
- Analytics dashboard, A/B of scoring weights, authenticated rate-limit pool.

## 11. Rejected approaches (record)

- **Runtime embedding via serverless model download** — cold-start/network risk;
  D1 commits the index instead.
- **Hosted embedding API (OpenAI etc.)** — external dependency + key; D1 keeps
  it self-hosted and free.
- **Replacing ⌘K** — palette stays for navigation; Copilot is a separate surface.
- **Auto-detected modes** — user chose explicit pills (D5).