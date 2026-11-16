/*
  The cosmic web in the hero is a neural network: input layer on the left,
  two hidden layers, and every path converges on the black hole (the "sink"
  node sits on the event horizon's left edge). Deterministic, server-rendered,
  desktop only; a few signals flow forward. Decorative, so aria-hidden.
*/

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 300;
const H = 500;
const SINK = [300, 250] as const;
const LAYERS = [
  { x: 14, n: 7 },
  { x: 108, n: 6 },
  { x: 200, n: 4 },
];

const r = rng(618);
const nodes = LAYERS.map(({ x, n }, l) =>
  Array.from({ length: n }, (_, i) => {
    const span = H * (0.86 - l * 0.16);
    const y = H / 2 - span / 2 + (span * i) / (n - 1) + (r() - 0.5) * 18;
    return [Math.round(x + (r() - 0.5) * 14), Math.round(y)] as const;
  }),
);
const all = [...nodes, [SINK]];
const edges: { a: readonly [number, number]; b: readonly [number, number]; w: number }[] = [];
for (let l = 0; l < all.length - 1; l++)
  for (const a of all[l]) for (const b of all[l + 1]) edges.push({ a, b, w: r() });

// a few forward passes: one node per layer, ending in the hole
const pulses = [0, 2, 4, 6].map((start, k) => {
  const pts = [nodes[0][start], nodes[1][(start + k) % 6], nodes[2][(start + 1) % 4], SINK];
  return { d: "M" + pts.map((p) => p.join(" ")).join("L"), delay: k * 1.3, dur: 4.2 + k * 0.5 };
});

export function NeuralWeb() {
  return (
    <svg className="neural-web" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      {edges.map(({ a, b, w }, i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="nw-edge" style={{ opacity: 0.18 + w * 0.5 }} />
      ))}
      {pulses.map((p, i) => (
        <path
          key={i}
          d={p.d}
          pathLength={100}
          className="nw-pulse"
          style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}
        />
      ))}
      {nodes.flat().map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.2} className="nw-node" />
      ))}
    </svg>
  );
}
