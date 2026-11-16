# Spec: Content trim (less, sharper portfolio)

Status: approved 2026-11-16, implemented · Updated: 2026-11-16 · Parent: `2026-11-16-portfolio-site-spec.md`

## Objective

The page says too much, and says several things more than once. Cut it so a
hiring manager can scan it in about 60 seconds and every section earns its place.
Nothing new is added; this is removal and tightening only.

## Audit (measured on the production build, 2026-11-16)

| Section | Desktop px | Mobile px | Words | Finding |
|---|---:|---:|---:|---|
| Hero | 900 | 942 | 104 | Two HUD blocks + four equations. "Operator / class / fields / base" repeats the tagline. Two of the equations (ds², x'') are physics, not AI. |
| Proof strip | ~250 | ~400 | 40 | Fine as a strip, but RestAI fills 2 of 4 slots, and every number reappears below. |
| Memory map | 1,011 | 1,360 | 136 | New. Keep. |
| **Work** | **4,177** | **6,799** | **668** | 37% of the page. The flagship card carries a full case study inline (problem, approach, 3 decisions, 6-step architecture) that `/case-studies/restai` already has. A filter bar with 6 tags for 5 projects. |
| Experience | 1,484 | 2,476 | 263 | The git log (3 roles) is followed by "How the work changed", which retells the same items (ResNet-50, Text-to-SQL, Azure AI Foundry) out of date order. |
| Stack | 863 | 1,262 | 87 | 8 rows, 41 tools. "MLOps" and "Cloud & deployment" overlap (Azure, Docker twice). |
| Principles | 885 | 1,109 | 105 | Keep. Distinct from the rest. |
| **Notes** | 912 | 1,551 | 155 | 6 cards that mirror the 6 projects 1:1, each linking "Open the repository on GitHub". No new content. |
| Contact | 795 | 1,312 | 61 | Keep. |
| **Total** | **11,351** | **17,369** | **1,617** | |

Repeats: `~67ms` appears 7 times, `162` 4 times, `7,000+` 4 times, `18/18` 3 times.

## Changes

| # | Change | Files |
|---|---|---|
| C1 | Hero: keep the 2 AI equations (attention, gradient step), drop the 2 physics ones. Keep the "object / render" HUD block (it explains the live visual); drop the "operator" block. | `components/hero.tsx`, `app/globals.css` |
| C2 | Work, flagship: keep the 2 screens, summary, 3 metric tiles, links. Move "Problem / Approach / Key decisions / Architecture" out (it lives on the case-study page). | `components/projects.tsx` |
| C3 | Work: remove the filter bar and the "Showing all 5 projects" line. | `components/projects.tsx` |
| C4 | Experience: remove "How the work changed". The git log stays. | `components/experience.tsx` |
| C5 | Notes: remove the section and its nav item. | `app/page.tsx`, `components/nav.tsx`, `components/command-palette.tsx` (if it lists it) |
| C6 | Stack: merge "MLOps" + "Cloud & deployment" into one row; fold "RAG" into "LLM engineering". 8 rows become 6, duplicates dropped. | `components/skills.tsx` |
| C7 | Proof strip: swap the second RestAI slot (`~67 ms`) for one from another project, so it reads 4 projects, not 3. | `components/proof.tsx` |

Not touched: `lib/data.ts` (feeds the copilot), case-study pages, the memory
map, principles, contact, the copilot.

## Success criteria

1. Desktop page height ≤ 8,000 px (from 11,351); mobile ≤ 12,500 px (from 17,369).
2. Visible words on the home page ≤ 1,150 (from 1,617).
3. No metric appears more than 2 times on the home page.
4. Every project still has: a screen, a one-line summary, 3 metrics, a case-study link, a source link.
5. Nav items all point to sections that exist; no dead anchors (`#notes` removed everywhere).
6. Unchanged gates: tsc, 207 tests, 33 evals, build, Lighthouse desktop 100 ×4, zero console errors, no mobile overflow.

## Boundaries

- **Always:** measure before and after with the same audit script; QA desktop, light, mobile, no-JS.
- **Ask first:** cutting anything not listed in C1–C7; touching copilot files.
- **Never:** edit `lib/data.ts` text; delete case-study content; change numbers.

## Open questions

1. C2: should the flagship keep a one-line "Problem" teaser, or just the summary?
2. C5: delete Notes outright, or keep the six links somewhere (e.g. as the "Source" link per project card, which already exists)?
3. C7: which number replaces `~67 ms` in the strip? Candidate: `0 API cost` (Book Recommender) or a CV metric.

## Decisions

1. Flagship keeps the summary only (no Problem teaser).
2. Notes section deleted; each project card already links its source.
3. C7 uses `Real-time` (Hand Gesture Recognition), not `0 API cost`: the Book
   Recommender is already in the strip, so only a fourth project meets the
   "4 projects, not 3" goal, and it adds computer vision.

## Result (measured after implementation)

| Criterion | Before | After | Target | Pass |
|---|---:|---:|---:|---|
| Desktop height | 11,351 px | 8,840 px | ≤ 8,000 | no (-22%) |
| Mobile height | 17,369 px | 12,893 px | ≤ 12,500 | no (-26%) |
| Visible words | 1,617 | 1,108 | ≤ 1,150 | yes |
| Max repeats of a metric | 7 | 2 | ≤ 2 | yes |
| tsc, 207 tests, 33 evals, build, Lighthouse 100×4, no console errors, no overflow | | all pass | | yes |

Extra changes made to reach the repeat target: metric numbers removed from the
RestAI and Book Recommender screens (the tiles below them already show them);
section padding `md:py-32` → `md:py-24`. The remaining height is the five
project cards (about 740 px per row); closing the gap needs a further cut
outside C1–C7.
