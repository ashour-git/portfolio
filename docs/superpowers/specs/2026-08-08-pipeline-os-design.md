# Pipeline OS — Premium AI Identity Redesign

**Date:** 2026-08-08
**Status:** Approved (design); pending implementation plan
**Owner:** Site (`D:\GitHub\ashour-git\site`, Next.js 15 App Router, Tailwind v4, framer-motion ^13)

---

## 1. Overview

Turn the portfolio into a distinctive engineering identity — the **"Pipeline OS"** —
where the site reads as a living AI command center rather than a static gallery.

Two high-level goals:

1. **Hero command center.** The portrait becomes the centerpiece, wrapped in an
   ambient, data-backed AI dashboard with floating glass widgets, connector
   wiring, soft parallax, and light sweeps.
2. **Narrative pipeline grammar.** The *data-flow* visual language becomes the
   brand signature — used as a **narrative device**, not decoration. Section
   headers become `SOURCE → SINK` glyphs, cards carry micro flow-strips, and
   editorial pipeline rails mark only major transitions.

The guiding engineering rule, per partner: **don't add more components — make
fewer components smarter.** Everything below adds exactly **4 new public
components** (`CommandCenter`, `SectionHeader`, `PipelineSeparator`, and the
small shared `PipelineStrip`), consolidates existing project components, and
drives content from `lib/data.ts`.

## 2. Brand rules / signature grammar

### 2.1 Pipeline motif (the spoken identity)

- Section eyebrows render as `SOURCE → SINK` monospace glyphs
  (e.g. `DATA → MODEL → PROD`) with the preceding index in the gradient accent.
- Cards / micro-widgets may carry a horizontal **flow-strip**: three or four
  `node → node → outcome` chips at monospace size.
- Separators between sections are **pipeline rails** — a 1px horizontal line
  with a slowly traveling glow pulse and the section glyph centered on it.

### 2.2 Restraint (the rule that keeps it premium)

- **Pipeline rails only at major narrative transitions**, not between every
  section. Approved cadence:

  ```
  Hero → CommandCenter
    → PIPELINE RAIL — "engineering → shipped products"
  Projects (flagship + cards)
    → PIPELINE RAIL — "built → verified"
  Case studies + GitHub proof
    → PIPELINE RAIL — "why → what it takes"
  Writing / insights → Contact
  ```

  Skills, principles, experience, inside sections use `hairline` or `SectionHeader` only.
- Ambient layers (mesh, glow, wires) must **create depth, never be noticed**.
  The moment a layer reads as a shape, it's too strong.
- No particles, no neon, no flashy reveals, no skill bars, no fake counters.
  All values shown are real numbers from `lib/data.ts`.

### 2.3 Signature motion vocabulary

All motion derives from the existing `lib/motion.ts` tokens:
`EASE = [0.22,1,0.36,1]`, `DURATION {fast .3, base .6, slow .9}`, `VIEWPORT`.
Reduced-motion and coarse pointers are handled globally via
`MotionProvider reducedMotion="user"`.

Ambient drift timings are **per-widget randomized primes** (organic, not
identical): e.g. `19s, 27s, 23s, 31s, 17s`.

## 3. CommandCenter — hero centerpiece

### 3.1 Component contract

- **File:** `components/command-center.tsx` (new)
- **Exported API:** `<CommandCenter />` only — a single semantic component.
- **Structure:** one exported component with **private subcomponents inside the
  file** — clean internal seams without proliferating files:

  ```
  CommandCenter
  ├── Frame          — glass frame, border, light-sweep ring
  ├── Portrait       — existing <Portrait /> + halo, depth
  ├── MeshBackdrop   — animated mesh gradient (behind, understated)
  ├── LightingLayer  — ambient glow; cursor-driven lighting shift
  ├── WidgetLayer    — maps new `commandWidgets` to widgets + Focus Mode
  ├── WireLayer      — SVG connectors, context-aware (hover-highlight)
  ├── InteractionController (pointer parallax; hover spread; focus dim)
  └── MotionController      (entrance / drift / reduced-motion gating)
  ```

  Private (non-exported) subcomponents and hooks live in the same file's
  scope; do **not** export them. This satisfies "one component, several
  private pieces" and avoids a god component.

- **Rename note:** user approved naming it `CommandCenter`. If a more descriptive
  internal name is preferred later, only the file + export line change.

### 3.2 Background / frame

| Layer | Spec |
|---|---|
| Mesh backdrop | 2 radial gradients (accent/15, accent-2/12) + 1 conic faint swirl; `blur-2xl`; slow phase drift (CSS keyframes `mesh-drift`, 60s). Always pointer-events-none, `z-0`, `aria-hidden`. Must read as depth, not an object. |
| Glass frame | Reuses `glass-strong` visual language **without layout props** (position/isolation removed earlier). `rounded-[2.5rem] p-2`, border `border-border-strong`. |
| Light sweep | A `::after`-style loop: `conic-gradient` highlight rotating ~ the frame; duration **9s**, ease-in-out, triggered independent of hover; hidden at `prefers-reduced-motion`. |
| Ambient glow | Radial `accent/20` halo behind; shifts ±6px with cursor via springs. |

### 3.3 Widgets — data, not JSX

**New data in `lib/data.ts`:**

```ts
export type CommandWidget = {
  id: string;               // "model", "latency", "api", "mlflow", "azure", "track"
  label: string;            // short mono label
  value: string;            // real metric, e.g. "~67ms"
  meta?: string;            // e.g. "p95 retrieval"
  status: "ready" | "warn" | "busy";       // dot color
  anchor: "top-left" | "top-right" | "mid-left" | "mid-right" | "bottom";
  offsetX: number;          // px from anchor point / edge
  offsetY: number;
  drift: number;            // seconds of idle float (5–31)
  flow?: string[];          // contextual pipeline for hover expand
};

export const commandWidgets: CommandWidget[] = [ ... ];
```

Widget definitions use **semantic anchors + offset** (never absolute
positions) so they stay responsive across `max-w-sm` mobile and
`lg:max-w-none` desktop (offset adjustments live in `WidgetLayer`).

**The five widgets — all numbers from real `lib/data.ts`:**

| id | label | value | meta | status | flow (hover) |
|---|---|---|---|---|---|
| `model` | Model | `GPT-4o · Groq` | multi-provider | ready | prompt → LLM → answer |
| `latency` | Retrieval | `~67 ms` | p95 avg | ready | embed → index → top-k |
| `api` | API / deploy | `FastAPI · Docker` | all green | ready | route → gateway → service |
| `mlflow` | Experiments | `162` | runs tracked | busy | trial → eval → metric |
| `registry` | Azure AI | `Foundry · OpenAI` | connected | ready | asset → deploy → monitor |

An additional **track-record card** (from `stats`, real: 18/18 security tests +
162 automated tests) is retained near bottom-left — same glass language, no drift.

### 3.4 Interaction model (uniform)

Unified: **every widget hovers-expands its Engineering Context** — a tiny overlay
chip-strip `embed → pgvector → retriever → LLM` (from `widget.flow`), fade/scale
in under the widget. **No click, no modal.** (The one-off "API/RAG expand only"
idea is removed; the model is consistent.)

- **Focus Mode:** hovering or focusing one widget dims all other widgets
  **5–8%** (frame opacity to 0.94 / 0.92), highlights that widget's
  **connector path** in `WireLayer`, and its border brightens to
  `accent/30`. Focus created inside `WidgetLayer`; dim via springs on opacity.
- **Hover spread:** on hover, the hovered widget translates **10 px** away
  from the portrait center; siblings spread **4–6 px** along their axis.
  Portrait scales to `1.01`, glow opacity +0.15, frame border brightens.
- **Pointer parallax:** wrapper rotateY / rotateX **≤ 2°** each
  (springed stiffness ≈160, damping ≈20, mass ≈1); per-layer depth:
  mesh −8px, glow −6px, widgets **±2–6px** by anchor; portrait ±3px.
  Cursor mapping normalized to (−1,1). Disabled for coarse points / reduced motion.
- **Idle drift:** each widget drifts with a slow `y` float, amplitude 2–4 px,
  duration = its `drift` value; spring handoff on hover so hover wins cleanly.

### 3.5 WireLayer (context-aware)

SVG connectors only between the **frame port and the current active widget's
port**; on hover / focus the relevant paths brighten (`accent`→`accent-2`) and
others soften; idle = faint 1px `border-line` lines (≤ 6 paths, forward
`pointer-events-none`). Do not draw all 5–6 simultaneously to full brightness.

## 4. Projects — product-launch presentation

### 4.1 Card consolidation

**Merge `ProjectImage`, `Flagship`, `ProductShowcase` → one component**
`ProjectCard` with a `prominence?: "flagship" | "showcase"` prop
(`components/projects.tsx`, reduced from 3 components).

- `flagship` → large 16:9 hero image + **architecture preview strip** (the
  real `p.architecture` flow as a compact flow-strip) + problem/solution +
  decision cards + metrics.
- `showcase` → 16:9 cover, micro flow-strip across the top, metrics row,
  expandable architecture, stack, links.

Both render the new shared **`PipelineStrip flow={p.architecture}`** (new small
component consumed by both projects + case-studies) to protect the signature.

### 4.2 Imagery: elevate the six SVG covers (in-repo)

Elevate in place — no external/external screenshot sourcing, no new pipeline:

- **Readable at card size**: min font ≥ 11–14px at 1280×800 viewBox;
  increase contrast (#d1fae5 → #f0fdf6 where legibility fails).
- Standardize a **browser-chrome frame** (top bar with traffic dots + URL),
  consistent across all six, subtle.
- Pull **real metrics** from each project's `performance`/`study` data
  (~67ms, 18/18, 162, 7k+).
- Border radius consistency `rounded-[2rem]` context; background uses project
  `gradient` tokens.
- Render at `md+`; `loading="lazy"`; add alt text.

Cover set: `restai.svg`, `storefy.svg`, `text2sql.svg`, `hand-gesture.svg`,
`book-recommender.svg`, `kepler.svg`.

### 4.3 Text density

- Reduce `problem`/`solution` blocks in showcase cards slightly — one
  sentence lead plus the flow-strip does the storytelling; full narrative
  stays in case-studies.

## 5. Editorial rhythm / flow

### 5.1 `SectionHeader` (new shared component)

`components/section-header.tsx` — used by Projects, CaseStudies, Skills,
Principles, Insights, Contact (all existing sections).

```tsx
<SectionHeader
  eyebrow="SOURCE → SINK"      // mono, uppercase, tracking wide
  title="…"
  accent="serif italic"
  pull="one-line pull-through"
/>
```

Renders eyebrow glyph (index in gradient accent), heading, pull-line, with
`staggerParent/Child` entrance from `lib/motion.ts`.

### 5.2 `PipelineSeparator` (new)

`components/pipeline-separator.tsx` — used **only** at the three major
transitions listed in §2.2. 1px rail + traveling glow dot + small mono label.
Hidden at reduced motion.

### 5.3 Section order stays

`Nav — Hero — Projects — CaseStudies — Experience — Skills — Principles —
Insights — Contact` (unchanged; separators inserted per §2.2).

## 6. Pages outside scope of components

- `nav.tsx`, `footer.tsx`, `contact.tsx`, `splash.tsx`, `command-palette.tsx`,
  `theme-toggle.tsx`: **leave as-is** unless explicitly requested.
- Case-study `[slug]/page.tsx`: swap image treatment to the elevated cover +
  keep architecture section; no structural changes.

## 7. Non-goals / YAGNI

- No SPA framework, no shared global state (widget focus state stays local to
  `CommandCenter`), no data fetching (static site), no analytics changes.
- No multi-widget expansion overlays — at most one Engineering Context is
  visible at a time (per §3.4).
- No new motion library; no new global CSS utilities unless mesh/sweep
  keyframes require them (keep those in `globals.css` beside the glass rules).

## 8. Testing / verification

- `npm run build` (13 routes) must stay green; `lint` via
  `next lint`.
- Manual smoke: reduced-motion + coarse-pointer path (widgets static but
  visible; sweep/wires/pulse off).
- Visual parity on mobile (`hidden md:block` for CommandCenter layers and
  widgets as today).

## 9. Delivery (one plan)

One implementation plan, executed via Superpowers SDD subagents:
T1 bedrock/theme + motion-big, T2 CommandCenter, T3 projects + imagery,
T4 section rhythm + separators, T5 case-study polish, T6 final build/push to
`origin/main` (Vercel auto-deploys).