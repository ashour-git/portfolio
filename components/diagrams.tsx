import { Ambient } from "./ambient";

/*
  Engraved background diagrams, after the science plates in the brief:
  an orbit chart, the Lorenz attractor (the butterfly of chaos theory) and
  a wormhole embedding diagram. Geometry, not illustration: every line is
  computed. White hairlines; the wormhole is magenta because magenta means
  spacetime wireframe. All decorative.
*/

// ---------- Lorenz attractor, integrated once at build time ----------
function lorenz() {
  const s = 10, r = 28, b = 8 / 3, dt = 0.006;
  let x = 0.1, y = 0, z = 0;
  const pts: [number, number][] = [];
  for (let i = 0; i < 6400; i++) {
    const dx = s * (y - x), dy = x * (r - z) - y, dz = x * y - b * z;
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;
    if (i > 200 && i % 2 === 0) pts.push([x, z]);
  }
  // x in about [-20, 20], z in about [0, 50] -> a 600 x 600 plate
  return "M" + pts.map(([px, pz]) => `${(300 + px * 13).toFixed(1)} ${(560 - pz * 10.5).toFixed(1)}`).join("L");
}
const LORENZ = lorenz();

// The same attractor as the principles section's own figure: in the column
// under the heading, at engraving strength, tracing itself in once.
export function AttractorFigure({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <Ambient className="ambient-figure">
        <svg viewBox="40 40 520 530">
          <path d="M60 560H540M300 560V60" className="ad-axis" />
          <path d={LORENZ} pathLength={1} data-draw className="ad-line" />
        </svg>
      </Ambient>
      <figcaption className="mt-4 max-w-[34ch] text-sm leading-relaxed text-ink-faint">
        The Lorenz system. Move the starting point by a hair and the path ends somewhere else, which is why every rule
        here ends in a measurement.
      </figcaption>
    </figure>
  );
}

// ---------- orbit chart ----------
const ORBITS = [
  { r: 70, body: "LightGBM", a: 210, dur: 90 },
  { r: 120, body: "pgvector", a: 330, dur: 150 },
  { r: 175, body: "RAG", a: 40, dur: 220 },
  { r: 235, body: "Text-to-SQL", a: 120, dur: 300 },
  { r: 290, body: "ResNet-50", a: 255, dur: 380 },
];

export function OrbitDiagram({ className = "" }: { className?: string }) {
  return (
    <Ambient className={className}>
      <svg viewBox="-320 -320 640 640">
        {ORBITS.map((o) => (
          <circle key={o.r} r={o.r} pathLength={1} data-draw className="ad-line" />
        ))}
        <circle r="16" className="ad-line" />
        <path d="M-310 0H310M0 -310V310" className="ad-axis" />
        {ORBITS.map((o) => {
          const rad = (o.a * Math.PI) / 180;
          return (
            <g key={o.body} className="ad-orbit" style={{ animationDuration: `${o.dur}s` }}>
              <circle cx={o.r * Math.cos(rad)} cy={o.r * Math.sin(rad)} r="4.5" className="ad-body" />
            </g>
          );
        })}
        {ORBITS.map((o) => (
          <text key={o.body} x={-o.r * 0.71 - 6} y={-o.r * 0.71 - 4} textAnchor="end" className="ad-label">
            {o.body}
          </text>
        ))}
      </svg>
    </Ambient>
  );
}

// ---------- wormhole embedding diagram ----------
function wormhole() {
  const rings: string[] = [];
  const merid: string[] = [];
  // radius as a function of height: a catenoid throat, r = a cosh(y / a)
  const a = 46;
  const ys = Array.from({ length: 15 }, (_, i) => -210 + i * 30);
  const R = (y: number) => Math.min(300, a * Math.cosh(y / (a * 1.9)));
  for (const y of ys) rings.push(`M${(-R(y)).toFixed(1)} ${y} A ${R(y).toFixed(1)} ${(R(y) * 0.18).toFixed(1)} 0 1 0 ${R(y).toFixed(1)} ${y} A ${R(y).toFixed(1)} ${(R(y) * 0.18).toFixed(1)} 0 1 0 ${(-R(y)).toFixed(1)} ${y}`);
  for (let k = 0; k < 16; k++) {
    const th = (k / 16) * Math.PI * 2;
    const pts = [];
    for (let y = -210; y <= 210; y += 10) pts.push(`${(R(y) * Math.cos(th)).toFixed(1)} ${(y + R(y) * 0.18 * Math.sin(th)).toFixed(1)}`);
    merid.push("M" + pts.join("L"));
  }
  return { rings, merid };
}
const WORM = wormhole();

export function WormholeDiagram({ className = "" }: { className?: string }) {
  return (
    <Ambient className={`ambient-magenta ${className}`}>
      <svg viewBox="-320 -240 640 480">
        {WORM.merid.map((d, i) => (
          <path key={`m${i}`} d={d} pathLength={1} data-draw className="ad-line" />
        ))}
        {WORM.rings.map((d, i) => (
          <path key={`r${i}`} d={d} pathLength={1} data-draw className="ad-line" />
        ))}
      </svg>
    </Ambient>
  );
}
