# Mohamed Ashour — Portfolio

Personal landing page for **Mohamed Ashour**, AI / Machine Learning Engineer.

A premium, dark **glassmorphism** portfolio centered on production AI — RAG systems,
LLM apps, recommendation engines, computer vision, forecasting, and MLOps.

## Stack

- [Next.js 15](https://nextjs.org) (App Router, fully static output)
- [Tailwind CSS v4](https://tailwindcss.com) with a custom `@theme` design token set
- [Framer Motion](https://www.framer.com/motion/) for restrained motion
- TypeScript (strict)
- Geist + Geist Mono (via `next/font`)

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

## Production

```bash
npm run build
npm run start
```

## Deploy

Deploys to Vercel. The build is fully static and prerendered — no server runtime.

## Structure

```
app/          # layout, metadata, page composition
components/   # hero, portrait, projects, experience, skills, insights, contact, nav, footer
lib/data.ts   # all content in one place
public/       # resume.pdf (download CTA)
```

## Adding your real media

Images load automatically the moment you place the files — until then the site
shows a designed cover (no broken paths, no empty placeholders).

**Hero portrait** — drop your professional photo here (replaces the shipped
designed cover automatically):

```
public/portrait.jpg
```

**Project screenshots** — drop cover images here (aspect ~16:10 landscape works best):

```
public/projects/restai.svg
public/projects/storefy.svg
public/projects/text2sql.svg
public/projects/hand-gesture.svg
public/projects/book-recommender.svg
public/projects/kepler.svg
```

Use `.jpg`/`.png` if preferred and update the `image` field for that project in
`lib/data.ts`.
