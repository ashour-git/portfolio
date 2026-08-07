import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/lib/data";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { ArrowIcon } from "@/components/icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects
    .filter((p) => p.study)
    .map((p) => ({ slug: p.study!.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((pr) => pr.study?.slug === slug);
  if (!p) return { title: "Not Found" };
  return {
    title: `${p.title} — Engineering Case Study`,
    description: p.solution,
    openGraph: {
      title: `${p.title} — Engineering Case Study · Mohamed Ashour`,
      description: p.solution,
    },
  };
}

function Section({
  label,
  tone = "accent",
  children,
}: {
  label: string;
  tone?: "accent" | "rose" | "emerald" | "amber";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    accent: "text-accent",
    rose: "text-rose-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
  };
  return (
    <section className="border-t border-line py-10 first:border-t-0 md:py-12">
      <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${tones[tone]}`}>
        {label}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = projects.find((pr) => pr.study?.slug === slug);
  if (!p || !p.study) notFound();
  const s = p.study;

  return (
    <>
      <article className="relative overflow-hidden pb-24 pt-32 md:pt-36">
        <div className="mx-auto w-full max-w-4xl px-6 md:px-10">
          {/* breadcrumb */}
          <Link
            href="/#work"
            className="mb-8 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink"
          >
            <span aria-hidden="true" className="inline-block rotate-180">
              <ArrowIcon className="h-3 w-3" />
            </span>
            All products
          </Link>

          {/* header */}
          <header>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-ink-faint">
              Case study · {p.domain}
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
              {p.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {p.tagline}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {p.stack.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink-soft"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                View source on GitHub
                <ArrowIcon className="h-4 w-4" />
              </a>
              {p.demo && (
                <a
                  href={p.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:text-white"
                >
                  Live demo
                </a>
              )}
            </div>
          </header>

          {/* screenshot */}
          <div className="glass mt-12 overflow-hidden rounded-[2rem]">
            <div className="relative aspect-[16/9] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt={`${p.title} interface`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-12">
            {/* problem */}
            <Section label="Problem" tone="rose">
              <p className="text-lg leading-relaxed text-ink-soft">{p.problem}</p>
            </Section>

            {/* solution */}
            <Section label="Solution" tone="emerald">
              <p className="text-lg leading-relaxed text-ink-soft">{p.solution}</p>
            </Section>

            {/* requirements */}
            <Section label="Requirements">
              <ul className="space-y-3">
                {s.requirements.map((r) => (
                  <li key={r} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </Section>

            {/* architecture */}
            <Section label="Architecture">
              <ArchitectureDiagram flow={p.architecture} />
            </Section>

            {/* model choice */}
            <Section label="Why this model" tone="amber">
              <p className="text-[15px] leading-relaxed text-ink-soft">
                {s.modelChoice}
              </p>
            </Section>

            {/* engineering decisions */}
            <Section label="Engineering decisions">
              <div className="space-y-5">
                {p.decisions.map((d) => (
                  <div key={d.title} className="border-l border-border-strong pl-4">
                    <p className="text-sm font-semibold text-ink">{d.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      {d.body}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* tradeoffs */}
            <Section label="Tradeoffs">
              <div className="grid gap-4 sm:grid-cols-2">
                {s.tradeoffs.map((t) => (
                  <div key={t.choice} className="glass rounded-2xl p-5">
                    <p className="text-sm font-semibold text-ink">{t.choice}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                      {t.cost}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* challenges */}
            <Section label="Challenges">
              <ul className="space-y-3">
                {s.challenges.map((c) => (
                  <li key={c} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-2"
                    />
                    {c}
                  </li>
                ))}
              </ul>
            </Section>

            {/* performance */}
            <Section label="Results">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {p.performance.map((m) => (
                  <div key={m.label} className="glass rounded-2xl p-5 text-center">
                    <p className="text-xl font-semibold tracking-tight text-ink">
                      {m.value}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* deployment */}
            <Section label="Deployment">
              <p className="text-[15px] leading-relaxed text-ink-soft">
                {s.deployment}
              </p>
            </Section>

            {/* lessons */}
            <Section label="Lessons learned">
              <ul className="space-y-3">
                {s.lessons.map((l) => (
                  <li key={l} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {l}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* next project */}
          <nav className="mt-14 border-t border-line pt-10" aria-label="Next project">
            {(() => {
              const next = projects.find((pr) => pr.study?.slug !== slug);
              if (!next) return null;
              return (
                <Link
                  href={`/case-studies/${next.study!.slug}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                      Next case study
                    </p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {next.title}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-accent">
                    Read
                    <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })()}
          </nav>
        </div>
      </article>
    </>
  );
}