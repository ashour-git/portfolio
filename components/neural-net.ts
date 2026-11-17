/*
  The hero's neural network, as geometry: input layer on the left, two hidden
  layers, and every path converges on the black hole (the sink sits on the
  event horizon's left edge). Deterministic (seeded), so every visit draws
  the same network. Drawn by the hero canvas (infall.tsx), desktop only.
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

export const NET_W = 300;
export const NET_H = 500;
const SINK = [300, 250] as const;
const LAYERS = [
  { x: 14, n: 7 },
  { x: 108, n: 6 },
  { x: 200, n: 4 },
];

type Pt = readonly [number, number];

const r = rng(618);
export const NET_NODES: Pt[][] = LAYERS.map(({ x, n }, l) =>
  Array.from({ length: n }, (_, i) => {
    const span = NET_H * (0.86 - l * 0.16);
    const y = NET_H / 2 - span / 2 + (span * i) / (n - 1) + (r() - 0.5) * 18;
    return [Math.round(x + (r() - 0.5) * 14), Math.round(y)] as const;
  }),
);
const all = [...NET_NODES, [SINK]];
export const NET_EDGES: { a: Pt; b: Pt; w: number }[] = [];
for (let l = 0; l < all.length - 1; l++) for (const a of all[l]) for (const b of all[l + 1]) NET_EDGES.push({ a, b, w: r() });

// four forward passes: one node per layer, ending in the hole. Each node a
// pass goes through fires the moment the signal reaches it.
const ROUTES = [
  [0, 1, 0],
  [2, 2, 1],
  [4, 3, 2],
  [6, 5, 3],
];
export const NET_PULSES = ROUTES.map((route, k) => {
  const pts: Pt[] = [...route.map((idx, l) => NET_NODES[l][idx]), SINK];
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const delay = k * 1.3;
  const dur = 4.2 + k * 0.5;
  let run = 0;
  const fires = pts.slice(0, -1).map((p, i) => {
    const at = delay + (run / total) * dur;
    run += seg[i];
    return { x: p[0], y: p[1], at };
  });
  return { pts, seg, total, delay, dur, fires };
});
