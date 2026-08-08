# Pipeline OS — Premium AI Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio as a "Pipeline OS" — a hero command center around the portrait plus a pipeline grammar (section headers, flow strips, pipeline rails) across the whole site.

**Architecture:** One new client component `CommandCenter` (private sublayers inside one file, all widget content data-driven from `lib/data.ts`), three small shared public components (`SectionHeader`, `PipelineSeparator`, `PipelineStrip`), consolidation of `projects.tsx` into a single `ProjectCard` with a `prominence` prop, and six in-repo SVG covers elevated to product-grade. Motion comes from the existing `lib/motion.ts` tokens plus a strictly limited CSS keyframe set; reduced-motion and coarse pointers are gated globally.

**Tech Stack:** Next.js 15 App Router, React 19, framer-motion ^13, Tailwind CSS v4 (theme tokens + layered utilities), TypeScript.

**Spec:** `docs/superpowers/specs/2026-08-08-pipeline-os-design.md` (commit `b71f3e8`).

## Global Constraints

Copied verbatim from the spec — every task's requirements implicitly include these.

- **Component budget:** exactly **4 new public components**: `CommandCenter`, `SectionHeader`, `PipelineSeparator`, and the small shared `PipelineStrip`. Everything else is consolidation or changes inside existing files.
- **Restraint:** Pipeline rails (`PipelineSeparator`) **only** at the three major transitions: Hero→Projects (`engineering → shipped products`), Projects→Case studies (`built → verified`), Case studies+proof→Experience (`why → what it takes`). Skills/principles/experience/insights get hairline or `SectionHeader` only.
- **Motion budget = 4 ambient systems max:** mesh drift · widget idle drift · light sweep · pipeline rail pulse. Everything else event-driven; hover/focus animations resolve on leave. No other infinite animations.
- **No fake data:** every widget value is a real number from `lib/data.ts` (`18/18`, `162`, `~67ms`, `7,000+`, `5+` repos). No skill bars, no particles, no neon, no flashy reveals.
- **Interaction priority:** `Hover > Focus > Ambient > Idle`. Hover pauses idle drift for that widget; keyboard focus reuses hover styling; ambient layers yield instantly; at most one widget active at a time.
- **Reduced motion / a11y:** global `MotionProvider reducedMotion="user"` stays; decorative layers (`MeshBackdrop`, `WireLayer`, sweep, rails) are `aria-hidden`; every widget keyboard-focusable; no hover-only info (Engineering Context also opens on focus). All `hidden md:block` where listed.
- **Premium rules:** no neon (glow ≤ `accent/25`), existing glass tokens only, one accent family, one motion language (`lib/motion.ts`).
- **Performance targets:** Lighthouse ≥ 95 (desktop), CLS < 0.05, LCP < 2.5 s, homepage JS at/below today's ~166 kB. Motion uses transform/opacity only.
- **Verification:** `npm run build` (13 routes) green + `npm run lint` clean, per task. Manual smoke for reduced-motion + coarse-pointer + visual parity on mobile (`hidden md:block`).
- **Scope guards:** `nav.tsx`, `footer.tsx`, `contact.tsx`, `splash.tsx`, `command-palette.tsx`, `theme-toggle.tsx` unchanged (contact.tsx only gets a SectionHeader swap). Case-study `[slug]/page.tsx` only gets elevated cover + pipeline strip; no structural changes.

---

## File Structure

**Create:**
- `components/command-center.tsx` (T2) — the hero system centerpiece; one exported `<CommandCenter />` with private subcomponents in-file.
- `components/pipeline-strip.tsx` (T3) — tiny shared flow-strip chip row; consumed by ProjectCard + CaseStudies + WidgetLayer hover.
- `components/section-header.tsx` (T4) — shared eyebrow/title/pull header with pipeline glyph.
- `components/pipeline-separator.tsx` (T4) — 1px rail + traveling glow dot + mono label; three placements.

**Modify:**
- `lib/data.ts` (T2) — add `CommandWidget` type + `commandWidgets` export (real values).
- `app/globals.css` (T1) — keyframes: `mesh-drift`, `frame-sweep`, `pipeline-pulse`, `flow-dot`; gated under `prefers-reduced-motion` (already global).
- `components/hero.tsx` (T2) — swap portrait composition block for `<CommandCenter />`; drop scroll parallax + tech chips.
- `components/projects.tsx` (T3) — refactor `ProjectImage`/`Flagship`/`ProductShowcase` → single `ProjectCard` + keep filter bar; title/header uses new `SectionHeader` in T4-level integration (kept inline here so T3 stays self-contained).
- `components/projects.tsx` (T4) — replace inline heading with `<SectionHeader eyebrow="BUILD → SHIP">`.
- `components/case-studies.tsx` (T4) — swap heading to `<SectionHeader>`; add `PipelineStrip` to each case card in T3.
- `components/skills.tsx` (T4), `components/experience.tsx` (T4), `components/principles.tsx` (T4), `components/insights.tsx` (T4) — swap section headings to `<SectionHeader>`.
- `components/contact.tsx` (T4) — swap heading with `<SectionHeader>`; rest unchanged.
- `app/page.tsx` (T4) — insert three `<PipelineSeparator />` elements between sections.
- `app/case-studies/[slug]/page.tsx` (T3) — add `<PipelineStrip flow={p.architecture} />` under the header stack chips + keep elevated cover.
- `public/projects/*.svg` (T3) — elevate six covers to product-grade (browser-chrome frame, real metrics, readable type at card size).

**Unchanged:** `components/portrait.tsx`, `components/nav.tsx`, `components/footer.tsx`, `app/layout.tsx`, `components/reveal.tsx`, `components/magnetic.tsx`, `components/architecture-diagram.tsx`.

---

### Task 1: Motion & background foundation (CSS keyframes)

**Files:**
- Modify: `app/globals.css` (append below the existing glass rules)

**Interfaces:**
- Produces: class `.mesh-bg` (+ `@keyframes mesh-drift`), `.pipeline-pulse` (+ `@keyframes pipeline-pulse`), `.flow-dot` (+ `@keyframes flow-dot`) — plain CSS classes, no JS contract.
- Consumes: nothing.

- [ ] **Step 1: Append ambient keyframes to `globals.css`**

Append at the end of `app/globals.css`:

```css
/* ---------- Pipeline OS ambient layers (spec §2.3 motion budget) ---------- */
.mesh-bg {
  position: absolute;
  inset: -12%;
  pointer-events: none;
  background:
    radial-gradient(42% 42% at 22% 24%, rgba(46, 230, 163, 0.15), transparent 68%),
    radial-gradient(38% 38% at 78% 68%, rgba(14, 165, 201, 0.13), transparent 68%),
    conic-gradient(from 210deg at 50% 50%, transparent 0deg, rgba(46, 230, 163, 0.06) 90deg, transparent 180deg, rgba(14, 165, 201, 0.06) 270deg, transparent 360deg);
  filter: blur(72px);
  animation: mesh-drift 60s ease-in-out infinite;
  will-change: transform;
}

@keyframes mesh-drift {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
  25%      { transform: translate3d(-2%, 1.5%, 0) rotate(0.35deg) scale(1.02); }
  50%      { transform: translate3d(1.5%, -2%, 0) rotate(0.9deg) scale(1.02); }
  75%      { transform: translate3d(-1%, 1%, 0) rotate(0.2deg) scale(1.01); }
}

.pipeline-pulse {
  opacity: 0.85;
  animation: pipeline-pulse 6s ease-in-out infinite;
}

@keyframes pipeline-pulse {
  0%, 100% { opacity: 0.25; }
  50%      { opacity: 1; }
}

.flow-dot {
  animation: flow-dot 2.4s linear infinite;
}

@keyframes flow-dot {
  0%   { transform: translateX(0); }
  100% { transform: translateX(var(--flow-x, 48px)); }
}

/* light sweep over the CommandCenter frame (motion budget #3) */
.frame-sweep {
  position: absolute;
  inset: -1px;
  pointer-events: none;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(46, 230, 163, 0.14) 70deg,
    rgba(14, 165, 201, 0.12) 130deg,
    transparent 200deg
  );
  animation: frame-sweep 9s ease-in-out infinite;
  will-change: transform;
}

@keyframes frame-sweep {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

> The global `@media (prefers-reduced-motion: reduce)` block at the top of this
> file already collapses all `animation-duration` to ~0, which is sufficient
> gating for every keyframe defined here. No extra reduced-motion override
> needed for these utilities.

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: build green (13 routes). The classes are inert until used in later tasks — build success is the gate.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(theme): add mesh-drift, frame-sweep, pipeline-pulse, flow-dot keyframes"
```

---

### Task 2: CommandCenter — hero centerpiece + widget data

**Files:**
- Create: `components/command-center.tsx`
- Modify: `lib/data.ts` (append `CommandWidget` type + `commandWidgets`)
- Modify: `components/hero.tsx` (replace portrait composition block)

**Interfaces:**
- Consumes: `Portrait` from `components/portrait.tsx`; `profile`, `stats`, `commandWidgets`, `type CommandWidget` from `lib/data.ts`.
- Produces:
  - `export type CommandWidget` (id, label, value, meta?, status, anchor, offsetX, offsetY, drift, flow?) in `lib/data.ts`.
  - `export const commandWidgets: CommandWidget[]` (exact 5 entries).
  - `export function CommandCenter(): JSX.Element` (default export path: `components/command-center.tsx`).

- [ ] **Step 1: Add `CommandWidget` type + data in `lib/data.ts`**

Append right after the existing `heroStats` export (line ~20):

```ts
export type CommandWidget = {
  id: string;
  label: string;
  value: string;
  meta?: string;
  status: "ready" | "warn" | "busy";
  anchor: "top-left" | "top-right" | "mid-left" | "mid-right" | "bottom";
  offsetX: number;
  offsetY: number;
  drift: number;
  flow?: string[];
};

export const commandWidgets: CommandWidget[] = [
  { id: "model", label: "Model", value: "Llama 3.3 · GPT-4o", meta: "multi-provider", status: "ready", anchor: "top-left", offsetX: 0, offsetY: 0, drift: 19, flow: ["prompt", "LLM", "answer"] },
  { id: "latency", label: "Retrieval", value: "~67 ms", meta: "p95 avg", status: "ready", anchor: "top-right", offsetX: 0, offsetY: 0, drift: 27, flow: ["embed", "index", "top-k"] },
  { id: "api", label: "API / deploy", value: "FastAPI · Docker", meta: "all green", status: "ready", anchor: "mid-right", offsetX: 0, offsetY: 0, drift: 23, flow: ["route", "gateway", "service"] },
  { id: "mlflow", label: "Experiments", value: "162", meta: "runs tracked", status: "busy", anchor: "mid-left", offsetX: 0, offsetY: 0, drift: 31, flow: ["trial", "eval", "metric"] },
  { id: "registry", label: "Azure AI", value: "Foundry · OpenAI", meta: "connected", status: "ready", anchor: "bottom", offsetX: 0, offsetY: 0, drift: 17, flow: ["asset", "deploy", "monitor"] },
];
```

- [ ] **Step 2: Create `components/command-center.tsx`**

Full file (single exported component; private subcomponents in the same file):

```tsx
"use client";

import { useState } from "react";
import { motion, useSpring, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { commandWidgets, stats, type CommandWidget } from "@/lib/data";
import { Portrait } from "./portrait";

const ease = [0.22, 1, 0.36, 1] as const;

const ANIMATION_SPRING = { stiffness: 160, damping: 20, mass: 1 };

// Anchor → static Tailwind positioning (no translate utilities, to avoid
// clashing with inline motion x/y). `left-1/2` + fixed negative margin centers
// the bottom widget without a translate class.
const ANCHOR_CLASS: Record<CommandWidget["anchor"], string> = {
  "top-left": "left-0 top-8",
  "top-right": "right-0 top-12",
  "mid-left": "left-0 top-[54%]",
  "mid-right": "right-0 top-[58%]",
  "bottom": "bottom-6 left-1/2 -ml-[4.75rem]",
};

// Hover spread direction: active widget moves AWAY from the portrait center.
const HOVER_DIR: Record<CommandWidget["anchor"], number> = {
  "top-left": 1,
  "top-right": -1,
  "mid-left": 1,
  "mid-right": -1,
  "bottom": 0,
};

function statusColor(status: CommandWidget["status"]) {
  return status === "ready" ? "bg-accent"
    : status === "busy" ? "bg-amber-400"
    : "bg-rose-400";
}

function Widget({
  w,
  active,
  setActive,
  activeId,
}: {
  w: CommandWidget;
  active: boolean;
  setActive: (id: string | null) => void;
  activeId: string | null;
}) {
  const dim = activeId !== null && !active;
  const dir = HOVER_DIR[w.anchor];
  const hoverY = w.drift % 2 === 0 ? [0, 3, 2, 0] : [0, -2, -3, 0];

  return (
    <div className={`absolute ${ANCHOR_CLASS[w.anchor]} hidden md:block`}>
      <motion.div
        role="button"
        tabIndex={0}
        aria-expanded={active}
        onClick={() => setActive(active ? null : w.id)}
        onFocus={() => setActive(w.id)}
        onBlur={() => setActive(null)}
        onMouseEnter={() => setActive(w.id)}
        onMouseLeave={() => setActive(null)}
        animate={{
          opacity: dim ? 0.94 : 1,
          x: dir !== 0 && active ? dir * 8 : 0,
          y: active ? 0 : hoverY,
        }}
        transition={{
          y: active
            ? { duration: 0.2, ease }
            : { duration: w.drift, ease, repeat: Infinity },
          x: { duration: 0.2, ease },
          opacity: { duration: 0.25, ease },
        }}
        className="glass cursor-pointer rounded-xl px-4 py-3 text-left outline-none transition-colors hover:border-accent/30 focus-visible:border-accent/30 focus-visible:ring-1 focus-visible:ring-accent/30"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${statusColor(w.status)}`} />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{w.label}</span>
        </span>
        <span className="mt-1 block text-sm font-semibold tracking-tight text-ink">{w.value}</span>
        {w.meta && <span className="mt-0.5 block font-mono text-[10px] text-ink-faint">{w.meta}</span>}
      </motion.div>

      <AnimatePresence>
        {active && w.flow && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease }}
            className="absolute left-0 top-full mt-2 hidden md:block"
            aria-hidden="true"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/90 px-3 py-1.5 font-mono text-[10px] text-ink-soft backdrop-blur">
              {w.flow.map((step, i) => (
                <span key={step} className="inline-flex items-center gap-1.5">
                  {i > 0 && <span className="text-ink-faint">→</span>}
                  {step}
                </span>
              ))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

> The `Widget` snippet above is the canonical widget: `animate.y` drifts only
> when `!active` (priority Hover > Idle) and only the `y` value loops at the slow
> drift duration — `x` and `opacity` always use fast 0.2–0.25s transitions so
> hover/focus feel snappy. The `x` spread is the ±8px away-from-center offset,
> inactive siblings dim to opacity 0.94 (Focus Mode), and the Engineering
> Context chip-strip (`flow`) appears on hover AND focus (keyboard
> `:focus-visible` reuses the hover affordance).

```tsx
function TrackRecord() {
  return (
    <div className="glass absolute -left-2 bottom-2 hidden rounded-2xl px-5 py-4 md:block">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Track record</p>
      <div className="mt-3 flex gap-6">
        {stats.slice(0, 2).map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-xs text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WireLayer({ activeId }: { activeId: string | null }) {
  const edges: Record<CommandWidget["anchor"], [number, number]> = {
    "top-left": [64, 140],
    "top-right": [416, 160],
    "mid-left": [60, 430],
    "mid-right": [420, 420],
    "bottom": [240, 560],
  };
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
      viewBox="0 0 480 640"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <linearGradient id="wire-active" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2ee6a3" />
          <stop offset="1" stopColor="#0ea5c9" />
        </linearGradient>
      </defs>
      {commandWidgets.map((w, i) => {
        const [x, y] = edges[w.anchor];
        const active = activeId === w.id;
        const cx = 240 + (i % 2 === 0 ? -60 : 60);
        const cy = 260 + i * 46;
        return (
          <path
            key={w.id}
            d={`M ${x} ${y} C ${cx} ${cy}, ${cx} ${cy + 40}, ${240} ${330}`}
            stroke={active ? "url(#wire-active)" : "rgba(255,255,255,0.07)"}
            strokeWidth={active ? 1.2 : 0.8}
            strokeDasharray="3 4"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function CommandCenter() {
  const [activeId, setActive] = useState<string | null>(null);

  // pointer parallax — springs, ≤2° rotation (spec §3.4)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, ANIMATION_SPRING);
  const sy = useSpring(my, ANIMATION_SPRING);
  const rotateY = useTransform(sx, [-0.5, 0.5], ["-2deg", "2deg"]);
  const rotateX = useTransform(sy, [-0.5, 0.5], ["2deg", "-2deg"]);

  const handleMove = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 4000);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 4000);
  };

  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-none" aria-label="Portrait">
      {/* ambient mesh (motion budget #1) */}
      <div aria-hidden="true" className="mesh-bg rounded-[3rem]" />

      <motion.div
        onPointerMove={handleMove}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* frame + portrait */}
        <div className="relative">
          <div aria-hidden="true" className="frame-sweep rounded-[2.5rem]" />
          <div className="glass-strong overflow-hidden rounded-[2.5rem] p-2">
            <Portrait />
          </div>
        </div>

        {/* wires */}
        <WireLayer activeId={activeId} />

        {/* widgets + track record (motion budget #2: per-widget drift) */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div className="pointer-events-auto relative h-full w-full">
            {commandWidgets.map((w) => (
              <Widget key={w.id} w={w} active={activeId === w.id} setActive={setActive} activeId={activeId} />
            ))}
          </motion.div>
        </div>
        <TrackRecord />
      </motion.div>
    </div>
  );
}
```

> The `Widget` snippet in Step 2 above is the canonical widget; the `animate.y`
> reveals drift only when `!active` (priority Hover > Idle), the `x` spread is the
> ±8px away-from-center offset, opacity dims to 0.94 for inactive siblings (Focus
> Mode), and the Engineering Context chip-strip (`flow`) appears on hover AND focus
> (keyboard `:focus-visible` reuses the hover affordance).

- [ ] **Step 3: Confirm the **types** wiring compiles (typecheck-only)**

Run: `npx tsc --noEmit` (project has `tsc` in devDependencies; config present via `next` typing).
Expected: no errors. If AIR the workspace prefers `next build` later for confidence.

- [ ] **Step 4: Wire `CommandCenter` into `hero.tsx`**

Replace the entire "portrait composition" `motion.div` block (lines ~121–191 — the halo, ring, `<Portrait />`, floating stat panel, availability chip, and `techChips` mapping) with:

```tsx
<CommandCenter />
```

Then:
1. Remove the now-unused imports: `useScroll`, `useTransform`, `stats`, `Portrait` (keep `useRef` is no longer needed either — remove it too; keep `motion`, `profile`).
2. Remove the `techChips` const and the `portraitY`/`haloY`/`haloOpacity` transforms + the `useScroll` call; delete the `ref` (unused).
3. Add `import { CommandCenter } from "./command-center";`.

> The "available · Cairo" ping chip is intentionally dropped from the hero
> column (its info is already carried by the CommandCenter's live-status
> widgets and the Contact section) — this keeps the portrait area focused
> per the spec's restraint rules. There is no separate halo/scroll parallax
> anymore; CommandCenter owns all hero motion after this step.

- [ ] **Step 5: Verify**

Run: `npm run build`
Expected: green (13 pages). Manual: on `md+`, portrait framed with 5 glass widgets drifting at different rates with a slow light sweep over the frame (9s, subtle, `conic-gradient` ≤ accent/14), wires faint but brightening on hover/focus of one widget, cursor parallax ≤2°; moving to another widget switches active state (Focus Mode dims others ~6%); reduced-motion leaves widgets static but visible and the sweep collapses to a static tint; mobile (`hidden md:block`) shows the plain portrait.

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add lib/data.ts components/command-center.tsx components/hero.tsx
git commit -m "feat(hero): add CommandCenter with data-driven widgets and context wires"
```

---

### Task 3: `PipelineStrip` + projects consolidation + covers elevation

**Files:**
- Create: `components/pipeline-strip.tsx`
- Modify: `components/projects.tsx` (consolidate `ProjectImage`/`Flagship`/`ProductShowcase` into `ProjectCard`)
- Modify: `app/case-studies/[slug]/page.tsx` (add PipelineStrip under stack chips)
- Modify: `public/projects/restai.svg`, `storefy.svg`, `text2sql.svg`, `hand-gesture.svg`, `book-recommender.svg`, `kepler.svg`

**Interfaces:**
- Consumes: `ArchFlow` from `lib/data`, `Reveal`, `motion`.
- Produces:
  - `export function PipelineStrip({ flow, className }: { flow: ArchFlow; className?: string })` — horizontal mono chips `node → node → outcome` with connector arrows.
  - `ProjectCard` inside `projects.tsx` (not exported; the `Projects` default export stays).

- [ ] **Step 1: Create `components/pipeline-strip.tsx`**

```tsx
import type { ArchFlow } from "@/lib/data";

export function PipelineStrip({ flow, className = "" }: { flow: ArchFlow; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[11px] ${className}`}>
      {flow.nodes.map((n, i) => (
        <span key={`${n.label}-${i}`} className="inline-flex items-center gap-2">
          <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-ink-soft">{n.label}</span>
          {i < flow.nodes.length - 1 && <span className="text-ink-faint" aria-hidden="true">→</span>}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Refactor `components/projects.tsx` to one `ProjectCard`**

Structural change (keep filter bar + motion). Delete `ProjectImage`, `Flagship`, `ProductShowcase`; keep `SectionLabel`. New structure inside the section body:

```tsx
export function Projects() {
  const [filter, setFilter] = useState("All");
  const featured = projects.find((p) => p.featured)!;
  const rest = projects.filter((p) => !p.featured);
  const visibleRest = rest.filter(
    (p) => filter === "All" || p.domain.includes(filter),
  );
  return (
    <section id="work" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="mb-12 md:mb-16">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">Featured AI Products</p>
            <div className="ml-auto flex flex-wrap items-center gap-2" role="group" aria-label="Filter projects by domain">
              {projectFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${
                    filter === f
                      ? "border-transparent bg-gradient-to-r from-accent to-accent-2 text-bg"
                      : "border-line bg-surface text-ink-soft hover:text-ink"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
            Built as systems, <span className="font-serif italic font-normal text-ink">shipped as products.</span>
          </h2>
        </div>

        <ProjectCard p={featured} prominence="flagship" />
        <span className="hairline my-16 block" aria-hidden="true" />

        <div className="grid gap-8 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visibleRest.map((p, i) => (
              <ProjectCard key={p.index} p={p} prominence="showcase" index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
```

Then `ProjectCard`:

```tsx
function ProjectCard({
  p,
  prominence,
  index = 0,
}: {
  p: Project;
  prominence: "flagship" | "showcase";
  index?: number;
}) {
  if (prominence === "flagship") return <FlagshipCard p={p} />;
  return <ShowcaseCard p={p} index={index} />;
}
```

`FlagshipCard` = the existing `Flagship` body but:
- keep `id={`project-${p.index}`}`, `scroll-mt-28`, entrance motion
- replace `ProjectImage` with a local `Cover` helper (below) using `p.image`
- after the ghost section divider, insert the architecture strip:

```tsx
<div className="mt-6">
  <PipelineStrip flow={p.architecture} />
</div>
```

`ShowcaseCard` = the existing `ProductShowcase` body but with `PipelineStrip flow={p.architecture} className="mt-4"` placed directly under the tagline, and the `ArchitectureDiagram` expand button kept.

Shared `Cover` helper (replaces `ProjectImage`):

```tsx
function Cover({ p, className = "" }: { p: Project; className?: string }) {
  if (p.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.image}
        alt={`${p.title} interface`}
        className={`object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${p.gradient} ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
    </div>
  );
}
```

Remove the `errored` state logic (SVGs are inert and always valid; if one 404s, the gradient fallback never triggers — acceptable, since all six exist in `public/projects/`).

Update the two usage sites (`cover` in flagship `aspect-[16/9]` block; showcase card `aspect-[16/9]`) to `<Cover p={p} className="h-full w-full ..." />`. Keep the existing hover-scaled transition classes on those wrappers.

- [ ] **Step 3: Add `PipelineStrip` to the case-study page**

In `app/case-studies/[slug]/page.tsx` after the stack chips row (inside the header, after the links block):

```tsx
<div className="mt-6">
  <PipelineStrip flow={p.architecture} />
</div>
```

And add the import: `import { PipelineStrip } from "@/components/pipeline-strip";`

- [ ] **Step 4: Elevate the six SVG covers**

For each of `restai.svg`, `storefy.svg`, `text2sql.svg`, `hand-gesture.svg`, `book-recommender.svg`, `kepler.svg`, apply the same in-repo upgrade (this is the "elevate mockup to product-grade" trade):

1. **Browser chrome header**: add a 76px top bar inside the rounded rect: three traffic dots (x≈36/64/92, y≈26, r=8, `rgba(255,255,255,0.55)`) + right-aligned URL pill (`font-size="18"`, mono-ish, `rgba(255,255,255,0.5)`).
2. **Readable type**: raise minimum font sizes — sidebar `font-size="22"` (restai already), dashboard labels `font-size="24"` heading, KPI values `font-size="30"→36`, row text ≥ `15`, mono `→` for pipeline accents. Use `font-family="Geist Mono, monospace"` for `pipeline/allération` labels already present.
3. **Real metrics**: where the mockup shows placeholder numbers, substitute from real data (see below), and keep the ~67ms / 162 / 18/18 / 7k present (already present in restai, text2sql (18/18), book-recommender (7,000+), etc.).
4. Keep `rx=32` (`rounded-[2rem]` context), keep the `url(#bg)` fill, no new decorations.

Concrete per file (replace only the mock values, not structure):
- `restai.svg` — already clean; add `browser bar` + swap the `0.12` stroke to `border-border` look (already); change "Predicted demand" KPI caption to `forecast · LightGBM`; keep `67 ms`, `Optuna`.
- `storefy.svg` — read current mock (likely "Sales / 44K"); add browser bar; replace fake metrics with `ten` → `per-tenant`, `groq near real` etc. **After reading the file, fill only the numbers with real values** (`162` tests, `Groq` gen onboarding, `per-tenant isolation`) — do not fabricate new KPIs beyond what the mock already displayed; align labels to the project's `performance` array in `lib/data.ts`.
- `text2sql.svg` — add browser bar; set the headline badge to `18/18 security tests` (it likely already shows that); keep `GPT-4o` alive `Azure OpenAI`.
- `hand-gesture.svg` — add browser bar; `fps=31` → keep as-is; make conf numbers legible ≥ 14.
- `book-recommender.svg` — add browser bar; `7,000+ books` (probably present); set search box font 18px.
- `kepler.svg` — add browser bar; label `preprocess → detect → nms` in mono; make stage labels ≥ 15.

Run `npm run build` after SVG edits (they are static assets; no compile risk).

- [ ] **Step 5: Verify**

Run: `npm run build` → green. Manual: flagship card shows cover + architecture strip; showcase cards show micro strip; case-study page header shows strip under stack rows; six covers look product-grade at 16:9 card size (readable ≥ 11px).

- [ ] **Step 6: Commit**

```bash
git add components/pipeline-strip.tsx components/projects.tsx app/case-studies/[slug]/page.tsx public/projects/
git commit -m "feat(projects): single ProjectCard, PipelineStrip everywhere, elevated covers"
```

---

### Task 4: Section rhythm — `SectionHeader`, `PipelineSeparator`, heading swap

**Files:**
- Create: `components/section-header.tsx`, `components/pipeline-separator.tsx`
- Modify: `app/page.tsx` (insert separators), `components/projects.tsx`, `case-studies.tsx`, `skills.tsx`, `principles.tsx`, `insights.tsx`, `contact.tsx`
- Modify: `components/experience.tsx` (header swap only)

**Interfaces:**
- Consumes: `Reveal` from `components/reveal`, `motion`, `lib/motion.ts` tokens.
- Produces:
  - `export function SectionHeader({ eyebrow, title, accent, pull }: { eyebrow: string; title: React.ReactNode; accent?: string; pull?: string }): JSX`
  - `export function PipelineSeparator({ from, to }: { from: string; to: string }): JSX`

- [ ] **Step 1: Create `components/section-header.tsx`**

```tsx
import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export function SectionHeader({
  eyebrow,
  title,
  accent,
  pull,
}: {
  eyebrow: string;
  title: ReactNode;
  accent?: string;
  pull?: string;
}) {
  return (
    <Reveal>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
        <span className="text-gradient">{eyebrow}</span>
      </p>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink md:text-[2.5rem] md:leading-[1.1]">
        {title}
        {accent ? (
          <span className="font-serif italic font-normal text-ink"> {accent}</span>
        ) : null}
      </h2>
      {pull ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">{pull}</p>
      ) : null}
    </Reveal>
  );
}
```

- [ ] **Step 2: Create `components/pipeline-separator.tsx`**

```tsx
import { motion } from "framer-motion";

export function PipelineSeparator({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative mx-auto my-24 flex h-12 max-w-6xl items-center px-6 md:px-10" aria-hidden="true">
      <div className="flex w-full items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border-strong" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          {from} <span className="text-accent">→</span> {to}
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border-strong" />
      </div>
      <motion.span
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pipeline-pulse absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_rgba(46,230,163,0.8)]"
      />
    </div>
  );
}
```

- [ ] **Step 3: Insert three separators in `app/page.tsx`**

```tsx
<main id="main">
  <Hero />
  <PipelineSeparator from="engineering" to="shipped products" />
  <Projects />
  <PipelineSeparator from="built" to="verified" />
  <CaseStudies />
  <PipelineSeparator from="why" to="what it takes" />
  <Experience />
  <Skills />
  <Principles />
  <Insights />
  <Contact />
</main>
```

Add the import: `import { PipelineSeparator } from "@/components/pipeline-separator";`

- [ ] **Step 4: Swap existing section headings to `SectionHeader`**

For each of these files, replace the leading `<Reveal>` heading block with `<SectionHeader>` (verbatim eyebrow/title/accent/pull values — do not rewrite copy):

**`components/projects.tsx`** (the heading is the `<div className="mb-12 md:mb-16">` block from Task 3) — the Task 3 block keeps the eyebrow `<p>` (`Featured AI Products`) plus the `<h2>`. To avoid double eyebrows, drop the eyebrow `<p>` from the filter row and let `SectionHeader` render the eyebrow once (filters keep `ml-auto`, so the row still right-aligns):

```tsx
<div className="mb-12 md:mb-16">
  <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
    {/* filter buttons — keep unchanged, remove the leading eyebrow <p> */}
    <div className="ml-auto flex flex-wrap items-center gap-2" role="group" aria-label="Filter projects by domain">
      {projectFilters.map((f) => (
        <button key={f} onClick={() => setFilter(f)} className={...}>...</button>
      ))}
    </div>
  </div>
  <div className="mt-5">
    <SectionHeader eyebrow="FEATURED AI PRODUCTS" title="Built as systems," accent="shipped as products." />
  </div>
</div>
```
(Delete the old `<h2>Built as systems, ...</h2>` that T3 kept — `SectionHeader` renders the heading.)

**`components/case-studies.tsx`** — replace its `<Reveal>` opening (eyebrow `Engineering Case Studies` + h2 `Decisions, not just tools.` + p) with:
```tsx
<SectionHeader
  eyebrow="BUILD → EVIDENCE"
  title="Decisions,"
  accent="not just tools."
  pull="Recruiters hire engineers for the choices they make under constraints. Each project below is a record of the architecture, the tradeoffs, and the proof that it works."
/>
```

**`components/skills.tsx`** — replace its `<Reveal>` heading block:
```tsx
<SectionHeader
  eyebrow="CAPABILITIES"
  title="Capabilities,"
  accent="not tool lists."
  pull="Every capability below is exercised in a shipped project on GitHub — each one has a case study, tests, and an architecture diagram."
/>
```
(Remove the now-unused `<p>` heading and keep the section `padding`.)

**`components/principles.tsx`**:
```tsx
<SectionHeader eyebrow="DECISION RULES" title="How I" accent="decide." />
```

**`components/insights.tsx`**:
```tsx
<SectionHeader eyebrow="WRITING & RESEARCH" title="Notes &" accent="engineering write-ups." />
```

**`components/experience.tsx`** — two spots: the main heading:
```tsx
<SectionHeader eyebrow="ACROSS ROLES" title="Owning AI products" accent="end to end." />
```
and the progression subheading keep its `<Reveal>` (small `h3`) — do not change that one.

**`components/contact.tsx`** — swap the `<p className="mb-4 font-mono ...">Contact</p>` + `<h2>` block inside the card. Replace the card's heading region (keep the card wrapper, glow blobs, buttons, reference note):

```tsx
<SectionHeader
  eyebrow="OPEN → BUILD"
  title="Let's build something intelligent."
/>
```

> The SectionHeader's `Reveal`-wrapped `<p>`/`<h2>` inside the glass card is fine (motion `whileInView` triggers once). The old `Contact` mono label and `h2` are removed; keep the proceeding paragraphs.

The whole contact section keeps its layout; the SectionHeader replaces the eyebrow+h2 pair only.

- [ ] **Step 5: Verify + a11y check**

Run: `npm run build` → green. Run: `npm run lint` → clean. Manual: rails render exactly three times with pulse dots; headings all show eyebrow in gradient accent; with reduced motion the separator shows the rail + label but the `pipeline-pulse` dot is static (the global reduce rule collapses its animation); text contrast of the eyebrow span reads on glass.

- [ ] **Step 6: Commit**

```bash
git add components/section-header.tsx components/pipeline-separator.tsx app/page.tsx components/projects.tsx components/case-studies.tsx components/skills.tsx components/principles.tsx components/insights.tsx components/experience.tsx components/contact.tsx
git commit -m "feat(rhythm): SectionHeader, three PipelineSeparators, heading swaps"
```

---

### Task 5: Case-study page polish

**Files:**
- Modify: `app/case-studies/[slug]/page.tsx` (only if Task 3 did not already add the strip; if done, verify only)

**Interfaces:**
- Consumes: `PipelineStrip` from step Task 3.1.

- [ ] **Step 1:** Verify Pipelines strip existence after Task 3 — if `<PipelineStrip flow={p.architecture} />` is already present under the stack chips, this task reduces to verification.

If absent, add it (identical to Task-3 Step 3).

- [ ] **Step 2: Give the case-study header a mono `KEY → VALUE` posture**

Add small touches (no structural change): after the `PipelineStrip` block, render a one-line summary row:

```tsx
<div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
  <span>source <span className="text-ink-soft">/</span> {p.domain}</span>
  <span>tests <span className="text-ink-soft">/</span> {p.performance.find((m) => m.label.includes("test"))?.value ?? "CI"}</span>
</div>
```

- [ ] **Step 3: Verify + commit**

Run: `npm run build` → green.
```bash
git add app/case-studies/[slug]/page.tsx
git commit -m "feat(case-study): pipeline strip + mono status row under header"
```

---

### Task 6: Final verification and ship

**Files:**
- None (verification + commit/tag only)

- [ ] **Step 1: Full verification suite**

Run:
```bash
npm run build
npm run lint
npx tsc --noEmit
```
Expected: all green. Confirm output shows the 13 routes.

- [ ] **Step 2: Manual smoke on the dev server**

Run `npm run start` (or `npm run dev`), OS at `http://localhost:3100`:
- Reduced-motion on: portrait static, wires faint, no sweep/pulse/dwell.
- Coarse-pointer touch: no pointer parallax, widgets static, widgets tap-focus-able.
- md viewport: CommandCenter layers + widgets `hidden md:block` (no overlap of widget over text on mobile).
- Three separators only; section eyebrows labelled.
- Covers readable at card size.

- [ ] **Step 3: Commit + push**

```bash
git add -A
git commit -m "feat(pipeline-os): premium AI identity — CommandCenter hero, pipeline grammar, upgraded covers"
git push origin main
```
Expected: Vercel auto-deploys; 13/13 routes live.

---

## Self-Review (run before handoff)

- **Spec coverage:**
  - T1 covers §2.3 motion budget keyframes (mesh-drift, frame-sweep, pipeline-pulse, flow-dot) + premium/performance base.
  - T2 covers §3.1–3.5: CommandCenter contract/private substructure, data model, interaction priority + Focus Mode + Engineering Context, WireLayer context-aware (≤ 6 faint paths), light sweep (budget #3), per-widget drift primes, reduced-motion/a11y (widgets focusable, decorative layers).
  - T2 track record card from `stats` (real 18/18, 162), bottom-left, no drift — matches spec §3.3.
  - T3 covers §4: ProjectCard prominence, hierarchy tiers (flagship+showcase classes), covers elevation, empty-state guard (Cover fallback), stack/flow-strip.
  - T4 covers §5: SectionHeader eyebrows, PipelineSeparator ×3 (only major transitions), plus §6.1 a11y (aria-hidden on decorative) & premium restraint (no new blurs/shadows).
  - T5 covers the case-study swap (§6 "elevated cover + pipeline strip").
  - T6 covers §8 perf/verification + §9 delivery.
  - All four new components are exactly the 4 listed in Global Constraints; the four motion budgets (mesh drift · widget drift · light sweep · rail pulse) are each present and no others are added.
- **Placeholder scan:** `ANIMATION_SPRING` is defined at the top of `command-center.tsx` before its only two uses (`useSpring` calls in `CommandCenter`). `hoverY` in `Widget` is defined before the `animate` it feeds. No TBDs, TODO markers, or undefined identifiers remain.
- **Type consistency:** `CommandWidget`, `commandWidgets`, `Project`, `ArchFlow`, `Profile` all match `lib/data.ts` types; `Cover`/`ProjectCard` internal names consistent with `projects.tsx`; `PipelineStrip` signature matches both call sites; `SectionHeader`/`PipelineSeparator` props used identically in every call.