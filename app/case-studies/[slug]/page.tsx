import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/lib/data";
import { PipelineStrip } from "@/components/pipeline-strip";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { Monitoring } from "@/components/monitoring";
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line py-10 first:border-t-0 md:py-12">
      <p className="eyebrow">{label}</p>
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
            <p className="eyebrow mb-3">Case study · {p.domain}</p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
              {p.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {p.tagline}
            </p>
            <p className="mt-6 font-mono text-xs text-ink-faint">
              {p.stack.join("  ·  ")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                View source on GitHub
                <ArrowIcon className="h-4 w-4" />
              </a>
              {p.demo && (
                <a
                  href={p.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  Live demo
                </a>
              )}
            </div>
            <div className="mt-6">
              <PipelineStrip flow={p.architecture} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              <span>source <span className="text-ink-soft">/</span> {p.domain}</span>
              <span>tests <span className="text-ink-soft">/</span> {p.performance.find((m) => m.label.includes("test"))?.value ?? "CI"}</span>
            </div>
          </header>

          {/* screenshot */}
          <div className="mt-12 overflow-hidden rounded-[2rem] border border-line">
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
            <Section label="Problem">
              <p className="text-lg leading-relaxed text-ink-soft">{p.problem}</p>
            </Section>

            {/* solution */}
            <Section label="Solution">
              <p className="text-lg leading-relaxed text-ink-soft">{p.solution}</p>
            </Section>

            {/* requirements */}
            <Section label="Requirements">
              <ul className="space-y-3">
                {s.requirements.map((r) => (
                  <li key={r} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                    <span aria-hidden="true" className="select-none text-ink-faint">—</span>
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
            <Section label="Why this model">
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
                  <div key={t.choice} className="panel rounded-2xl p-5">
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
                    <span aria-hidden="true" className="select-none text-ink-faint">—</span>
                    {c}
                  </li>
                ))}
              </ul>
            </Section>

            {/* performance */}
            <Section label="Results">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {p.performance.map((m) => (
                  <div key={m.label} className="panel rounded-2xl p-5 text-center">
                    <p className="text-xl font-semibold tracking-tight text-ink">
                      {m.value}
                    </p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
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

            {/* monitoring */}
            <Section label="Monitoring & observability">
              <Monitoring observability={s.observability} />
            </Section>

            {/* write-up */}
            <Section label="Engineering write-up">
                <div className="panel-strong flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    How this was built, start to finish
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    Full design narrative, code, and test results live in the
                    repository — trace architecture, decisions, and commits
                    directly.
                  </p>
                </div>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-bg"
                >
                  Read the write-up
                  <ArrowIcon className="h-4 w-4" />
                </a>
              </div>
            </Section>

            {/* lessons */}
            <Section label="Lessons learned">
              <ul className="space-y-3">
                {s.lessons.map((l) => (
                  <li key={l} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                    <span aria-hidden="true" className="select-none text-ink-faint">—</span>
                    {l}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* next project */}
          <nav className="mt-14 border-t border-line pt-10" aria-label="Next project">
            {(() => {
              const studies = projects.filter((pr) => pr.study);
              const idx = studies.findIndex((pr) => pr.study!.slug === slug);
              const next = studies[(idx + 1) % studies.length];
              if (!next) return null;
              return (
                <Link
                  href={`/case-studies/${next.study!.slug}`}
                  className="panel-strong group flex flex-col gap-2 rounded-2xl p-6 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between"
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