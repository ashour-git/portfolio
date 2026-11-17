# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters and hiring managers filling AI Engineer roles in Egypt and remote
(confirmed 2026-11-17). They open the site from a CV, LinkedIn or GitHub link
and decide in about a minute whether to read further. Their job: confirm name,
current role, real shipped work, and get the resume or a contact.

## Product Purpose

The personal site of Mohamed Ashour, AI engineer at SustainGRC (Cairo). It
proves he builds LLM, NLP and computer-vision systems and ships them as
production services. Success is a recruiter opening the resume, trying the
copilot, or making contact.

## Positioning

The site demonstrates instead of claiming: a live grounded RAG copilot that
answers from his own documents and cites them, a black hole ray traced live in
the browser, and project screens that show each system's actual mechanism.

## Capabilities and Constraints

- Next.js 15 App Router, static pages plus one route (`/api/copilot`, Groq).
- `lib/data.ts` is both page content and the copilot corpus: style changes
  happen at render time, never by editing its text.
- Copilot UI and pipeline files are owned by a separate workstream.
- English page; Arabic only inside the copilot.
- No analytics, no third-party scripts.

## Brand Commitments

- Name: Mohamed Ashour. Domain: mohamed-ashour.vercel.app.
- Brand mark: three network inputs converging on an event horizon.
- The black hole stays as the hero object; its styling may change
  (confirmed 2026-11-17).
- Visual references supplied by the user (2026-11-17): black-and-white
  space-science collage (engraved instrument drawings, orbit charts with
  labels, chaos-theory attractor, wireframe wormholes and spacetime funnels),
  computer-vision tracking overlays (red boxes, x/y coordinate labels, dashed
  trajectories), neon blue and magenta wireframe grids, a black hole
  swallowing streams of code. Colour is assigned by role (confirmed).
- No em dashes in page copy.

## Evidence on Hand

Real, citable numbers only: 162 automated tests and ~67 ms average retrieval
(RestAI), 18/18 security tests (Text-to-SQL Generator), 7,000+ books indexed
(Semantic Book Recommender). Six projects with case studies under
`/case-studies/*`; resume at `public/resume.pdf`; portrait at
`public/portrait.jpg`. No testimonials, client logos or traffic figures exist;
none may be invented.

## Product Principles

1. Prove, don't claim: every visual either is the mechanism or shows it.
2. Recruiter scan first: name, role and employer, proof, resume, in the first
   viewport.
3. Real numbers or none.
4. Performance and accessibility are part of the proof (Lighthouse 100 is the
   current bar).

## Accessibility & Inclusion

WCAG AA contrast, full keyboard use, a reduced-motion path for every
animation, no-JS fallback for the hero.
