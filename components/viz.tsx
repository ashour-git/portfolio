import type { ReactNode } from "react";

/*
  Project screens: each one draws the mechanism the project is built on
  (attention, embeddings, landmarks, feature maps, routing, retrieval) as an
  engraved plate: white linework, blue for the data a model attends to, red
  for computer-vision detections. Deterministic, so server and client render
  the same markup.
*/

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
}
const r1 = (n: number) => Math.round(n * 10) / 10;

export function Screen({ title, meta, children, label }: { title: string; meta?: string; children: ReactNode; label: string }) {
  return (
    <figure className="crt">
      <figcaption className="crt-bar" aria-hidden="true">
        <span>
          <b className="fig" /> {title}
        </span>
        {meta && <span>{meta}</span>}
      </figcaption>
      <div role="img" aria-label={label}>
        {children}
      </div>
    </figure>
  );
}

function Viewfinder({ w, h, s = 18 }: { w: number; h: number; s?: number }) {
  const m = 12;
  const d = `M${m} ${m + s}V${m}H${m + s} M${w - m - s} ${m}H${w - m}V${m + s} M${w - m} ${h - m - s}V${h - m}H${w - m - s} M${m + s} ${h - m}H${m}V${h - m - s}`;
  return <path d={d} className="v-stroke-dim" strokeWidth="1.5" />;
}

/* ------------------------------------------------ Text-to-SQL: attention */
const NL = ["total", "sales", "last", "30", "days", "by", "country"];
const SQL = ["SELECT", "SUM", "amount", "FROM", "orders", "WHERE", "date", "-30d", "GROUP BY", "country"];
const PEAKS: Record<number, Record<number, number>> = {
  0: { 0: 0.25, 1: 0.92, 2: 0.45 },
  1: { 1: 0.45, 2: 0.86, 4: 0.55 },
  2: { 5: 0.45, 6: 0.55, 7: 0.72 },
  3: { 7: 0.95, 6: 0.3 },
  4: { 7: 0.8, 6: 0.55 },
  5: { 8: 0.9, 9: 0.3 },
  6: { 8: 0.45, 9: 0.95 },
};
export function AttentionViz() {
  const r = rng(7);
  const x0 = 150, y0 = 122, cw = 45, ch = 29;
  return (
    <svg viewBox="0 0 640 380" aria-hidden="true">
      <text x="24" y="40" className="v-faint v-case" fontSize="16">softmax(QKᵀ / √d): English tokens to SQL tokens</text>
      {SQL.map((t, j) => (
        <text key={t} x={x0 + j * cw + cw / 2} y={y0 - 10} className="v-faint" fontSize="15" transform={`rotate(-40 ${x0 + j * cw + cw / 2} ${y0 - 10})`}>
          {t}
        </text>
      ))}
      {NL.map((t, i) => {
        const row = SQL.map((_, j) => PEAKS[i][j] ?? 0.04 + r() * 0.1);
        const max = row.indexOf(Math.max(...row));
        return (
          <g key={t}>
            <text x={x0 - 14} y={y0 + i * ch + ch / 2 + 5} textAnchor="end" className="v-text" fontSize="17">{t}</text>
            {row.map((w, j) => (
              <rect
                key={j}
                x={x0 + j * cw}
                y={y0 + i * ch}
                width={cw - 3}
                height={ch - 3}
                fill={j === max ? "var(--blue)" : "var(--plate-ink)"}
                opacity={j === max ? Math.max(w, 0.7) : r1(w)}
              />
            ))}
          </g>
        );
      })}
      <text x="24" y="352" className="v-faint" fontSize="16">validate</text>
      <text x="120" y="352" className="v-text" fontSize="16">syntax ok   read-only ok   schema ok</text>
      <text x="616" y="352" textAnchor="end" className="v-key" fontSize="16">18/18 security</text>
    </svg>
  );
}

/* ------------------------------------------- Hand gesture: 21 landmarks */
// MediaPipe hand topology (21 landmarks), posed as an open palm
const HAND: [number, number][] = [
  [318, 334],
  [284, 312], [258, 284], [240, 258], [225, 232],
  [288, 236], [280, 196], [275, 170], [271, 144],
  [316, 228], [316, 184], [316, 156], [316, 128],
  [344, 234], [350, 194], [354, 168], [357, 144],
  [368, 248], [381, 218], [389, 197], [396, 176],
];
const HAND_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];
const TIPS = [4, 8, 12, 16, 20];
export function HandViz() {
  const pts = HAND;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const bx = Math.min(...xs) - 22, by = Math.min(...ys) - 22;
  const bw = Math.max(...xs) - Math.min(...xs) + 44, bh = Math.max(...ys) - Math.min(...ys) + 38;
  const palm = [0, 1, 5, 9, 13, 17].map((i) => pts[i].join(",")).join(" ");
  const classes = ["open_palm", "thumbs_up", "fist", "peace", "point"];
  return (
    <svg viewBox="0 0 640 380" aria-hidden="true">
      <Viewfinder w={640} h={380} />
      <polygon points={palm} fill="var(--plate-ink)" opacity="0.1" />
      {HAND_EDGES.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} className="v-stroke" strokeWidth="2" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={TIPS.includes(i) ? 5 : 3.5} fill={TIPS.includes(i) ? "var(--red)" : "var(--plate-ink)"} />
      ))}
      <rect x={bx} y={by} width={bw} height={bh} className="v-stroke-cv" strokeWidth="1.5" />
      <rect x={bx - 0.75} y={by - 22} width="104" height="22" fill="var(--red)" />
      <text x={bx + 6} y={by - 6} fontSize="16" fontWeight="700" fill="#050505" style={{ fontFamily: "var(--font-mono)" }}>OPEN_PALM</text>
      <text x="460" y="110" className="v-faint" fontSize="16">classes</text>
      {classes.map((c, i) => (
        <text key={c} x="460" y={142 + i * 30} className={i === 0 ? "v-cv" : "v-faint"} fontSize="18">
          {i === 0 ? "> " : "  "}{c}
        </text>
      ))}
      <text x="460" y="318" className="v-faint" fontSize="15">21 landmarks</text>
      <text x="460" y="340" className="v-faint" fontSize="15">real-time</text>
    </svg>
  );
}

/* ------------------------------------ Book recommender: embedding space */
const CLUSTERS = [
  { x: 130, y: 150, s: 30 }, { x: 300, y: 112, s: 34 }, { x: 330, y: 250, s: 32 }, { x: 150, y: 262, s: 28 },
];
const TITLES = ["The Sea, The Sea", "To the Lighthouse", "Gilead"];
export function EmbeddingViz() {
  const r = rng(11);
  const pts: [number, number][] = [];
  CLUSTERS.forEach((c) => {
    for (let i = 0; i < 46; i++) pts.push([r1(c.x + gauss(r) * c.s), r1(c.y + gauss(r) * c.s * 0.8)]);
  });
  const q: [number, number] = [146, 172];
  const near = pts
    .map((p, i) => ({ i, d: Math.hypot(p[0] - q[0], p[1] - q[1]) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5);
  return (
    <svg viewBox="0 0 640 380" aria-hidden="true">
      <text x="24" y="40" className="v-faint" fontSize="16">query</text>
      <text x="90" y="40" className="v-key" fontSize="16">&quot;a calm novel about grief and the sea&quot;</text>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="var(--plate-ink)" opacity="0.45" />
      ))}
      {near.map(({ i }) => (
        <line key={`l${i}`} x1={q[0]} y1={q[1]} x2={pts[i][0]} y2={pts[i][1]} className="v-stroke-key" strokeWidth="1.2" />
      ))}
      {near.map(({ i }) => (
        <g key={`n${i}`}>
          <circle cx={pts[i][0]} cy={pts[i][1]} r="4" fill="var(--plate-ink)" />
        </g>
      ))}
      <circle cx={q[0]} cy={q[1]} r="6" fill="var(--blue)" />
      <circle cx={q[0]} cy={q[1]} r="12" className="v-stroke-key" strokeWidth="1" />
      <text x="440" y="150" className="v-faint" fontSize="16">nearest</text>
      {TITLES.map((t, k) => (
        <text key={t} x="440" y={180 + k * 28} className="v-text" fontSize="16">{k + 1}  {t}</text>
      ))}
      <text x="24" y="352" className="v-faint" fontSize="16">2d projection of book embeddings</text>
    </svg>
  );
}

/* ---------------------------------- Kepler Vision: CNN feature maps */
function FeatureTile({ x, y, s, n, seed }: { x: number; y: number; s: number; n: number; seed: number }) {
  const r = rng(seed);
  const a = 0.6 + r() * 1.6, b = 0.6 + r() * 1.6, ph = r() * 6, kind = seed % 3;
  const c = s / n;
  const cells = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let v: number;
      if (kind === 0) v = 0.5 + 0.5 * Math.sin(i * a + j * b + ph); // oriented edges
      else if (kind === 1) v = Math.exp(-((i - n * r()) ** 2 + (j - n / 2) ** 2) / (n * 1.2)); // blob
      else v = (Math.sin(i * a + ph) * Math.cos(j * b)) ** 2; // texture
      cells.push(<rect key={`${i}-${j}`} x={r1(x + j * c)} y={r1(y + i * c)} width={r1(c - 0.6)} height={r1(c - 0.6)} fill="var(--plate-ink)" opacity={r1(0.08 + v * 0.85)} />);
    }
  }
  return (
    <g>
      {cells}
      <rect x={x} y={y} width={s} height={s} className="v-stroke-dim" strokeWidth="1" />
    </g>
  );
}
function Scene({ x, y, w, h, boxes }: { x: number; y: number; w: number; h: number; boxes?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="v-stroke" strokeWidth="1.5" />
      <line x1={x} y1={y + h * 0.72} x2={x + w} y2={y + h * 0.72} className="v-stroke-dim" />
      <circle cx={x + w * 0.38} cy={y + h * 0.3} r={h * 0.09} fill="var(--plate-ink)" opacity="0.7" />
      <rect x={x + w * 0.31} y={y + h * 0.4} width={w * 0.14} height={h * 0.42} fill="var(--plate-ink)" opacity="0.7" />
      <rect x={x + w * 0.45} y={y + h * 0.44} width={w * 0.07} height={h * 0.2} fill="var(--plate-ink)" opacity="0.45" />
      <path d={`M${x + w * 0.66} ${y + h * 0.82}V${y + h * 0.58}H${x + w * 0.82}V${y + h * 0.82} M${x + w * 0.66} ${y + h * 0.68}H${x + w * 0.82}`} className="v-stroke-dim" strokeWidth="2" />
      {boxes && (
        <>
          <rect x={x + w * 0.27} y={y + h * 0.17} width={w * 0.22} height={h * 0.7} className="v-stroke-cv" strokeWidth="1.5" />
          <text x={x + w * 0.27} y={y + h * 0.14} className="v-cv" fontSize="13">person</text>
          <rect x={x + w * 0.62} y={y + h * 0.52} width={w * 0.24} height={h * 0.34} className="v-stroke" strokeWidth="1.2" />
          <text x={x + w * 0.62} y={y + h * 0.49} className="v-text" fontSize="13">chair</text>
        </>
      )}
    </g>
  );
}
export function FeatureMapViz() {
  const stages = [
    { x: 200, cols: 2, rows: 4, s: 38, n: 6, label: "conv 1" },
    { x: 300, cols: 2, rows: 3, s: 32, n: 5, label: "conv 2" },
    { x: 388, cols: 1, rows: 3, s: 30, n: 4, label: "conv 3" },
  ];
  let seed = 3;
  return (
    <svg viewBox="0 0 640 380" aria-hidden="true">
      <Scene x={24} y={130} w={150} h={112} />
      <text x="24" y="270" className="v-faint" fontSize="15">input frame</text>
      {stages.map((st) => {
        const top = 190 - (st.rows * (st.s + 6)) / 2;
        const tiles = [];
        for (let rr = 0; rr < st.rows; rr++)
          for (let cc = 0; cc < st.cols; cc++)
            tiles.push(<FeatureTile key={`${rr}-${cc}`} x={st.x + cc * (st.s + 6)} y={r1(top + rr * (st.s + 6))} s={st.s} n={st.n} seed={seed++} />);
        return (
          <g key={st.label}>
            {tiles}
            <text x={st.x} y={r1(top + st.rows * (st.s + 6) + 18)} className="v-faint" fontSize="15">{st.label}</text>
          </g>
        );
      })}
      {[180, 288, 376, 432].map((x) => (
        <path key={x} d={`M${x} 186h12l-4 -4 m4 4l-4 4`} className="v-stroke" strokeWidth="1.5" />
      ))}
      <Scene x={466} y={130} w={150} h={112} boxes />
      <text x="466" y="270" className="v-key" fontSize="15">detections</text>
      <text x="24" y="352" className="v-faint" fontSize="16">pytorch   preprocess, detect, deterministic postprocess</text>
    </svg>
  );
}

/* ------------------------------------------- Storefy: tenant routing */
const TENANTS = ["nile-coffee", "souk-ceramics", "luxor-books"];
export function TenantViz() {
  return (
    <svg viewBox="0 0 640 380" aria-hidden="true">
      <text x="24" y="40" className="v-faint" fontSize="16">wildcard subdomains to tenant-scoped rows</text>
      {TENANTS.map((t, i) => {
        const y = 110 + i * 82;
        const key = i === 0;
        return (
          <g key={t}>
            <text x="24" y={y + 5} className={key ? "v-key" : "v-text"} fontSize="16">{t}.storefy</text>
            <path d={`M218 ${y} C 244 ${y}, 240 192, 262 192`} className={key ? "v-stroke-key" : "v-stroke-dim"} strokeWidth="1.5" />
            <path d={`M380 192 C 410 192, 404 ${y}, 434 ${y}`} className={key ? "v-stroke-key" : "v-stroke-dim"} strokeWidth="1.5" />
            <rect x="434" y={y - 26} width="182" height="52" className={key ? "v-stroke-key" : "v-stroke"} strokeWidth="1.3" />
            <text x="446" y={y - 6} className={key ? "v-key" : "v-text"} fontSize="15">tenant_id = {t.split("-")[0]}</text>
            {[0, 1, 2].map((k) => (
              <rect key={k} x={446 + k * 52} y={y + 6} width="44" height="8" fill="var(--plate-ink)" opacity={key ? 0.8 : 0.35} />
            ))}
          </g>
        );
      })}
      <rect x="262" y="160" width="118" height="64" className="v-stroke" strokeWidth="1.5" />
      <text x="321" y="188" textAnchor="middle" className="v-text" fontSize="16">resolve</text>
      <text x="321" y="208" textAnchor="middle" className="v-text" fontSize="16">tenant</text>
      <path d="M321 224V300" className="v-stroke-dim" strokeWidth="1.2" strokeDasharray="4 4" />
      <rect x="250" y="300" width="142" height="40" className="v-stroke-dim" strokeWidth="1.2" />
      <text x="321" y="325" textAnchor="middle" className="v-faint" fontSize="15">groq agent</text>
    </svg>
  );
}

/* ---------------------------------------------- RestAI: RAG + forecast */
export function RagViz() {
  const r = rng(5);
  const pts: [number, number][] = [];
  for (let i = 0; i < 90; i++) pts.push([r1(60 + r() * 300), r1(110 + r() * 200)]);
  const q: [number, number] = [190, 205];
  const hits: [number, number][] = [[150, 170], [236, 182], [214, 250]];
  const docs = ["menu / grilled_salmon", "orders / last_7_days", "inventory / fish"];
  return (
    <svg viewBox="0 0 600 380" aria-hidden="true">
      <text x="24" y="40" className="v-faint" fontSize="16">ask</text>
      <text x="70" y="40" className="v-key" fontSize="16">&quot;how many salmon portions tonight?&quot;</text>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="var(--plate-ink)" opacity="0.4" />
      ))}
      {hits.map(([x, y], k) => (
        <g key={k}>
          <line x1={q[0]} y1={q[1]} x2={x} y2={y} className="v-stroke-key" strokeWidth="1.3" />
          <circle cx={x} cy={y} r="4.5" fill="var(--plate-ink)" />
          <text x={x + 8} y={y - 6} className="v-text" fontSize="15">{k + 1}</text>
        </g>
      ))}
      <circle cx={q[0]} cy={q[1]} r="6" fill="var(--blue)" />
      <text x="390" y="150" className="v-faint" fontSize="16">retrieved</text>
      {docs.map((d, k) => (
        <text key={d} x="390" y={180 + k * 28} className="v-text" fontSize="15">{k + 1} {d}</text>
      ))}
      <text x="24" y="352" className="v-text" fontSize="16">answer cites 3 sources</text>
    </svg>
  );
}

export function ForecastViz() {
  const hist = [0.22, 0.3, 0.27, 0.34, 0.42, 0.5];
  const fc = [0.5, 0.68, 0.88, 0.8, 0.64, 0.5, 0.36];
  const X = (i: number) => 50 + i * 42;
  const Y = (v: number) => 300 - v * 220;
  const histD = hist.map((v, i) => `${i ? "L" : "M"}${X(i)} ${r1(Y(v))}`).join(" ");
  const fcD = fc.map((v, i) => `${i ? "L" : "M"}${X(i + 5)} ${r1(Y(v))}`).join(" ");
  const band =
    fc.map((v, i) => `${X(i + 5)},${r1(Y(v + 0.05 + i * 0.012))}`).join(" ") +
    " " +
    fc.map((v, i) => `${X(i + 5)},${r1(Y(Math.max(0, v - 0.05 - i * 0.012)))}`).reverse().join(" ");
  const peak = 2 + 5; // 19:00
  return (
    <svg viewBox="0 0 600 380" aria-hidden="true">
      <text x="24" y="40" className="v-faint" fontSize="16">demand forecast, tonight</text>
      <line x1="50" y1="300" x2="560" y2="300" className="v-stroke-dim" />
      {[0, 3, 6, 9, 11].map((i) => (
        <text key={i} x={X(i)} y="324" textAnchor="middle" className="v-faint" fontSize="14">{12 + i}:00</text>
      ))}
      <line x1={X(5)} y1="70" x2={X(5)} y2="300" className="v-stroke-dim" strokeDasharray="3 5" />
      <text x={X(5) + 6} y="84" className="v-faint" fontSize="14">now</text>
      <polygon points={band} fill="var(--plate-ink)" opacity="0.13" />
      <path d={histD} className="v-stroke" strokeWidth="2.2" />
      <path d={fcD} className="v-stroke-key" strokeWidth="2.2" strokeDasharray="6 5" />
      <circle cx={X(peak)} cy={r1(Y(fc[2]))} r="5" fill="var(--blue)" />
      <text x={X(peak) + 10} y={r1(Y(fc[2])) - 8} className="v-key" fontSize="15">peak 19:00</text>
      <text x="24" y="352" className="v-text" fontSize="16">lightgbm, optuna-tuned</text>
    </svg>
  );
}
