# Spec: Portfolio site (mohamed-ashour.vercel.app)

Status: draft, awaiting review · Owner: Mohamed Ashour · Updated: 2026-11-16

The site-wide source of truth. Copilot internals have their own specs in this
folder (`*-copilot-*`); this spec only fixes the contract the site relies on.

## Assumptions (correct these first)

1. The audience is hiring managers and technical interviewers for AI Engineer
   roles (Egypt and remote). The site is judged in about 30 seconds on desktop
   and on mobile.
2. Visual direction is fixed: cassette-futurism (phosphor green, amber, CRT
   panels, HUD labels) with **one** space element, the black hole. No new
   space imagery per project; each project gets an AI mechanism visual.
3. Hosting stays on Vercel with static pages plus one serverless route
   (`/api/copilot`). No database, no CMS.
4. English is the page language. Arabic is supported only inside the copilot.
5. No analytics or third-party scripts.

## Objective

Show, in one page, that Mohamed builds production AI systems (LLM/RAG, NLP,
CV, forecasting) and ships them. The page should prove this itself:

- a live, grounded RAG copilot that answers from his own docs and cites them;
- a WebGL black hole rendered live in the browser;
- per-project "mechanism screens" (attention, landmarks, embeddings, RAG flow);
- the copilot's memory drawn as a constellation lit by real retrievals.

**User stories**

- As a recruiter, I can see name, role, fields and a resume download in the
  first viewport, and reach contact in one click.
- As an interviewer, I can open a case study per project with architecture,
  decisions and real numbers.
- As a technical visitor, I can ask the copilot a question and see which
  documents it used (sources list, memory map).

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 15.5 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (`@theme` tokens) + `app/globals.css` |
| Fonts | JetBrains Mono (display/UI), Atkinson Hyperlegible Next (prose) via `next/font` |
| Motion | framer-motion `LazyMotion` + `m` components, async `domMax` |
| Graphics | WebGL2 fragment shader (black hole); inline SVG everywhere else |
| Copilot | Groq (`GROQ_MODEL`), vendored MiniLM (`models/`), prebuilt index (`lib/index/`) |
| Offline tooling | `tsx` scripts; Python 3 + scikit-learn for the memory-map layout |

## Commands

```bash
npm run dev                         # http://localhost:3000
npm run build                       # production build; must pass
npx next start -p 3124              # serve the build for QA
npx tsc --noEmit -p .               # typecheck; must be clean
npm test                            # node:test via tsx, tests/**/*.test.ts
npm run eval                        # offline copilot behaviour evals (no key needed)
npm run build:kb                    # rebuild copilot index after lib/data.ts changes
npx tsx scripts/memory-demo.ts      # re-run example retrievals -> lib/memory-demo.json
python scripts/memory_map.py        # re-project embeddings -> lib/memory-map.json
```

`build:kb` invalidates the two memory files: run both memory scripts after it.

## Project structure

```
app/                     routes: page.tsx (home), case-studies/[slug], api/copilot,
                         icon.svg, apple-icon.png, robots, sitemap, globals.css
components/              one file per section or widget
  hero, black-hole(+shader), neural-web     first viewport
  proof, copilot-memory, memory-map         evidence + copilot memory
  projects, viz                             project cards + mechanism screens
  experience, skills, principles, insights, contact, nav, footer
  copilot*, ask-prompt, command-palette     copilot UI (see ownership below)
lib/
  data.ts                content source of truth AND copilot corpus
  index/                 generated embedding index (build:kb)
  memory-map.json, memory-demo.json         generated (scripts above)
  copilot/               retrieval, planning, Groq client
scripts/                 offline generators
tests/                   unit tests (copilot + text utils)
eval/                    behaviour eval cases + runner
models/                  vendored MiniLM
public/                  resume.pdf, og.png, project images, black-hole poster
docs/superpowers/        specs and plans
```

Home section order: Hero, Proof, CopilotMemory, Projects, Experience, Skills,
Principles, Contact. Projects shows five; Kepler Vision is hidden on the home
page (no measured result yet) but keeps its case-study route.

## Code style

```tsx
// Server component by default; "use client" only for state, effects, or WebGL.
// Deterministic visuals: seeded rng, never Math.random() in render.
// Theme via tokens, never raw hex in components (exception: always-dark panels).
export function NeuralWeb() {
  return (
    <svg className="neural-web" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      {edges.map(({ a, b, w }, i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="nw-edge" style={{ opacity: 0.18 + w * 0.5 }} />
      ))}
    </svg>
  );
}
```

- kebab-case files, PascalCase components, CSS classes short and prefixed per
  widget (`.bh-*`, `.mm-*`, `.nw-*`, `.v-*`).
- Copy: plain words, no em-dashes on the page, real numbers only
  (162 tests, 18/18 security, ~67 ms, 7,000+). Text tidying happens at render
  (`tidy()`, `period()`), never by editing `lib/data.ts` for style.
- Decorative graphics are `aria-hidden`; informative ones use
  `role="img"` + `aria-label` on a non-`figure` element.
- Every animation has a `prefers-reduced-motion` path; every JS-only element
  has a no-JS fallback (`.js-only`, black-hole poster).
- The hero is always dark: tokens are re-pinned on `.hero-window` / `.on-dark`.
- Identity: the brand mark is three inputs converging on the event horizon
  (`components/nn-icons.tsx` `Mark`). Custom glyphs use one grammar: filled
  nodes plus 1.5px edges on a 24px grid (`Glyph`). Brand logos (GitHub,
  LinkedIn), files and arrows stay conventional (Phosphor) for recognition.
- Recruiter scan order: name, current role + employer + city, live copilot,
  resume. Keep these in the first viewport.

## Testing strategy

| Level | What | Where |
|---|---|---|
| Unit | copilot retrieval, BM25, bidi, language, intent, text utils | `tests/*.test.ts` (`npm test`) |
| Behaviour | 33 copilot checks through the real pipeline, offline | `eval/` (`npm run eval`) |
| Build | types + static generation | `tsc`, `npm run build` |
| Runtime QA | desktop 1440, light theme, mobile 390, no-JS; console errors, horizontal overflow, screenshots | puppeteer script against `next start` |
| Audit | Lighthouse desktop and mobile | chrome-devtools MCP |

New logic in `lib/` gets a unit test. Visual components are covered by runtime
QA, not snapshot tests.

## Boundaries

- **Always:** run tsc, tests, eval and build before a push; QA all four modes
  after visual changes; work on a branch (`redesign/*`) and merge via PR;
  keep generated JSON in sync with `lib/data.ts`.
- **Ask first:** editing `lib/data.ts` text (it changes copilot answers);
  touching copilot files (`components/copilot*.tsx`, `lib/copilot/**`,
  `app/api/copilot/route.ts`, `tests/`, `eval/`) while another session owns
  them; adding a dependency; changing section order; pushing or committing.
- **Never:** commit `.env` or keys; push straight to `main`; invent metrics;
  add per-project space imagery; ship a visual without a reduced-motion path.

## Success criteria

1. `tsc` clean; `npm test` all pass; `npm run eval` 33/33; build passes.
2. Home first-load JS ≤ 160 kB (now 154 kB).
3. Lighthouse desktop 100 in Accessibility, Best Practices, SEO, Agentic
   Browsing; LCP < 2.0 s desktop; CLS < 0.1.
4. Zero console errors and no horizontal overflow at 1440 and 390, in dark,
   light and no-JS.
5. All six case-study routes return 200; unknown routes return 404.
6. Hero text contrast ≥ 4.5:1 over the black hole; reduced motion shows a
   still frame with no animation.
7. On production, a copilot answer streams sources and lights the memory map.

## Open questions

1. `README.md` is out of date (describes glassmorphism and Geist). Rewrite it
   from this spec?
2. Should success criterion 7 get an automated smoke test against production
   (needs the Groq key in CI), or stay a manual post-deploy check?
3. Should the runtime QA script move from the session scratchpad into the repo
   (`scripts/qa.cjs`, with puppeteer-core as a dev dependency)?
4. Mobile Lighthouse target: hold it to 100 too, or accept ≥ 95 because of the
   WebGL hero?
