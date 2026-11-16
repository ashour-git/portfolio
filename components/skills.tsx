import { skills } from "@/lib/data";
import { list } from "@/lib/text";

export function Skills() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="relative scroll-mt-20 py-24 md:py-32">
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
            <span>{skills.reduce((n, g) => n + g.items.length, 0)} tools</span>
          </p>
          <dl className="grid grid-cols-1 gap-x-12 gap-y-6 p-6 md:grid-cols-2 md:p-8">
            {skills.map((group) => (
              <div key={group.title}>
                <dt className="text-[13px] font-bold uppercase tracking-[0.06em] text-[color:var(--phosphor)]">{group.title}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-[#d7dfd2]">{list(group.items)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
