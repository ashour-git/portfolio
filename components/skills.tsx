import { skills } from "@/lib/data";

// Constellation shapes (normalised 0..1), one per skill group. Stars are the
// group's tools in order; edges join them like a star chart's stick figure.
type Shape = { pts: [number, number][]; edges: [number, number][] };
const SHAPES: Shape[] = [
  // a "W", like Cassiopeia
  { pts: [[0, 0.3], [0.26, 0.82], [0.5, 0.42], [0.74, 0.88], [1, 0.25]], edges: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  // a cross, like Cygnus
  { pts: [[0.5, 0], [0.5, 0.45], [0.5, 1], [0.06, 0.34], [0.94, 0.58]], edges: [[0, 1], [1, 2], [3, 1], [1, 4]] },
  // a dipper
  { pts: [[0, 0.12], [0.24, 0.24], [0.46, 0.3], [0.64, 0.48], [0.7, 0.92], [1, 0.84]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 3]] },
  // a kite, like Bootes
  { pts: [[0.48, 0], [0.16, 0.42], [0.42, 1], [0.8, 0.5], [1, 0.86]], edges: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4]] },
  // a zigzag, like Draco's tail
  { pts: [[0, 0.62], [0.25, 0.16], [0.5, 0.58], [0.75, 0.08], [1, 0.5]], edges: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  // an arc, like Corona Borealis
  { pts: [[0, 0.22], [0.16, 0.66], [0.4, 0.94], [0.64, 0.88], [0.86, 0.56], [1, 0.12]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  // a triangle with a tail
  { pts: [[0, 0.92], [0.3, 0.18], [0.58, 0.84], [0.82, 0.46], [1, 0.04]], edges: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4]] },
  // an arrow, like Sagitta
  { pts: [[0, 0.58], [0.42, 0.53], [1, 0.48], [0.78, 0.1], [0.8, 0.88]], edges: [[0, 1], [1, 2], [3, 2], [4, 2]] },
];

const VW = 240;
const VH = 120;
const PAD = 14;

export function Skills() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="shell">
        <h2 id="stack-title" className="display max-w-[22ch]">
          The stack, charted
        </h2>
        <p className="lead mt-5 max-w-[58ch]">
          Eight disciplines drawn as constellations. Every star is a tool I have used in a shipped project; point at a
          name to find its star.
        </p>

        <ul className="sky mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-4">
          {skills.map((group, gi) => {
            const shape = SHAPES[gi % SHAPES.length];
            const n = Math.min(group.items.length, shape.pts.length);
            const pts = shape.pts.slice(0, n).map(([x, y]) => [PAD + x * (VW - 2 * PAD), PAD + y * (VH - 2 * PAD)]);
            const edges = shape.edges.filter(([a, b]) => a < n && b < n);
            return (
              <li key={group.title} className="constellation grid grid-cols-[7.5rem_1fr] items-start gap-x-5 sm:block">
                <svg viewBox={`0 0 ${VW} ${VH}`} className="mt-1 w-full overflow-visible sm:mt-0" role="img" aria-label={`${group.title} drawn as a constellation`}>
                  {edges.map(([a, b]) => (
                    <line
                      key={`${a}-${b}`}
                      x1={pts[a][0]}
                      y1={pts[a][1]}
                      x2={pts[b][0]}
                      y2={pts[b][1]}
                      className="c-edge"
                    />
                  ))}
                  {pts.map(([x, y], i) => {
                    const s = i === 0 ? 7 : i < 3 ? 5 : 4; // the lead tool is the brightest star
                    return <rect key={i} x={x - s / 2} y={y - s / 2} width={s} height={s} className={`c-star c-star-${i}`} />;
                  })}
                </svg>
                <div>
                <h3 className="font-mono text-[15px] font-bold text-ink sm:mt-5">{group.title}</h3>
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[13px] leading-relaxed text-ink-soft">
                  {group.items.map((item, i) => (
                    <li key={item} className={`c-tool c-tool-${i}`}>
                      {item}
                    </li>
                  ))}
                </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
