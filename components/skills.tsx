import { skills } from "@/lib/data";
import { list } from "@/lib/text";
import { Glyph, type GlyphName } from "./nn-icons";

// lib/data.ts feeds the copilot, so groups are merged here, at render time.
// Overlapping pairs become one row; a tool listed twice is shown once.
const MERGE: Record<string, string> = {
  "Retrieval-Augmented Generation": "LLM Engineering",
  "Cloud & Deployment": "MLOps",
};
const RENAME: Record<string, string> = { "LLM Engineering": "LLMs & retrieval", MLOps: "MLOps & cloud" };

const GLYPH: Record<string, GlyphName> = {
  "LLMs & retrieval": "retrieval",
  "Machine Learning": "forecast",
  "Backend APIs": "layers",
  "Data Engineering": "dag",
  "Computer Vision": "vision",
  "MLOps & cloud": "loop",
};

const groups = skills.reduce<{ title: string; items: string[] }[]>((acc, g) => {
  const key = MERGE[g.title] ?? g.title;
  let row = acc.find((r) => r.title === key);
  if (!row) acc.push((row = { title: key, items: [] }));
  for (const item of g.items) {
    const dup = row.items.some((x) => x.toLowerCase() === item.toLowerCase() || x.toLowerCase().includes(item.toLowerCase()));
    if (!dup) row.items.push(item);
  }
  return acc;
}, []).map((g) => ({ ...g, title: RENAME[g.title] ?? g.title }));

export function Skills() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="relative scroll-mt-20 py-20 md:py-24">
      <div className="shell">
        <h2 id="stack-title" className="display max-w-[22ch]">
          The stack
        </h2>
        <p className="lead mt-5 max-w-[56ch]">Every tool here is used in a shipped project on GitHub.</p>

        <div className="crt mt-12">
          <p className="crt-bar" aria-hidden="true">
            <span>
              <b>&gt;</b> ashour --stack
            </span>
            <span>{groups.reduce((n, g) => n + g.items.length, 0)} tools</span>
          </p>
          <dl className="grid grid-cols-1 gap-x-12 gap-y-6 p-6 md:grid-cols-2 md:p-8">
            {groups.map((group) => (
              <div key={group.title}>
                <dt className="flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[color:var(--phosphor)]">
                  <Glyph name={GLYPH[group.title] ?? "dag"} className="h-[18px] w-[18px] shrink-0" />
                  {group.title}
                </dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-[#d7dfd2]">{list(group.items)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
