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
components/   # hero, projects, experience, skills, insights, contact, nav, footer
lib/data.ts   # all content in one place
public/       # resume.pdf (download CTA)
```
