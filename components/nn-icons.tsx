/*
  One visual grammar for every custom glyph on the site: nodes (filled dots)
  joined by edges (1.5px strokes), the same language as the hero network and
  the memory map. Brand logos (GitHub, LinkedIn) and UI arrows stay
  conventional, because recognition matters more there than identity.
*/

type Props = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

const N = ({ x, y, r = 1.8 }: { x: number; y: number; r?: number }) => (
  <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" />
);

// The brand mark: three inputs converge on the event horizon.
// Network in phosphor, horizon in amber, the same story the hero tells.
export function Mark({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 28 24" className={className} aria-hidden="true" focusable="false">
      <g stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M4 5 L13.2 10.4" />
        <path d="M3 12 H12.5" />
        <path d="M4 19 L13.2 13.6" />
      </g>
      <g fill="var(--color-accent)">
        <circle cx="4" cy="5" r="2" />
        <circle cx="3" cy="12" r="2" />
        <circle cx="4" cy="19" r="2" />
      </g>
      <circle cx="19" cy="12" r="6.2" fill="#070908" stroke="var(--amber)" strokeWidth="2" />
      <circle cx="19" cy="12" r="2.6" fill="none" stroke="var(--amber)" strokeOpacity="0.45" strokeWidth="1" />
    </svg>
  );
}

const glyphs = {
  // attention: tokens on a baseline, arcs where one attends to another
  attention: (
    <>
      <path d="M4 18 Q12 4 20 18" />
      <path d="M12 18 Q16 10 20 18" />
      <N x={4} y={18} />
      <N x={12} y={18} />
      <N x={20} y={18} />
    </>
  ),
  // retrieval: a query pulls three ranked documents
  retrieval: (
    <>
      <path d="M5 12 L13 6 M5 12 H13 M5 12 L13 18" />
      <path d="M16 6 H21 M16 12 H20 M16 18 H19" />
      <N x={5} y={12} r={2.2} />
      <N x={13} y={6} r={1.4} />
      <N x={13} y={12} r={1.4} />
      <N x={13} y={18} r={1.4} />
    </>
  ),
  // forecasting: observed points, then a dashed prediction
  forecast: (
    <>
      <path d="M3 21 H21" strokeOpacity="0.5" />
      <path d="M3 16 L8 12 L12.5 14 L16.5 9" />
      <path d="M16.5 9 L21 4.5" strokeDasharray="1.6 2.2" />
      <N x={3} y={16} r={1.5} />
      <N x={8} y={12} r={1.5} />
      <N x={12.5} y={14} r={1.5} />
      <N x={16.5} y={9} r={1.9} />
    </>
  ),
  // backend: service layers with the calls between them
  layers: (
    <>
      <path d="M4 5 H20 M4 12 H20 M4 19 H20" />
      <path d="M8 5 V12 M16 12 V19" />
      <N x={8} y={5} />
      <N x={8} y={12} />
      <N x={16} y={12} />
      <N x={16} y={19} />
    </>
  ),
  // data pipeline: a small DAG
  dag: (
    <>
      <path d="M4 12 L12 5.5 L20 12 L12 18.5 Z" />
      <path d="M12 5.5 V18.5" strokeOpacity="0.5" />
      <N x={4} y={12} />
      <N x={12} y={5.5} />
      <N x={12} y={18.5} />
      <N x={20} y={12} r={2.2} />
    </>
  ),
  // computer vision: a detection box around a landmark skeleton
  vision: (
    <>
      <path d="M3 8 V3 H8 M16 3 H21 V8 M21 16 V21 H16 M8 21 H3 V16" />
      <path d="M12 7.5 L8.5 14 H15.5 Z" />
      <N x={12} y={7.5} />
      <N x={8.5} y={14} />
      <N x={15.5} y={14} />
    </>
  ),
  // nearest neighbours: a query linked to the three closest items
  neighbours: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M9.6 10.4 L5 7 M14.8 11 L19.5 9 M10.2 14.4 L8 19.5" />
      <N x={5} y={7} />
      <N x={19.5} y={9} />
      <N x={8} y={19.5} />
      <N x={18.5} y={19} r={1.2} />
    </>
  ),
  // multi-tenant: one router, three isolated stores
  tenants: (
    <>
      <path d="M12 5 L5 14 M12 5 V14 M12 5 L19 14" />
      <rect x="2.5" y="15.5" width="5" height="5" rx="0.6" />
      <rect x="9.5" y="15.5" width="5" height="5" rx="0.6" />
      <rect x="16.5" y="15.5" width="5" height="5" rx="0.6" />
      <N x={12} y={5} r={2.2} />
    </>
  ),
  // operations: a deploy-observe-retrain loop
  loop: (
    <>
      <path d="M18.5 8.5 A7 7 0 1 0 19 13.5" />
      <path d="M19.5 4.5 V8.8 H15.2" />
      <N x={5} y={12} />
      <N x={12} y={19} />
      <N x={12} y={5} />
    </>
  ),
};

export type GlyphName = keyof typeof glyphs;

export function Glyph({ name, className = "" }: Props & { name: GlyphName }) {
  return (
    <svg {...base} className={`glyph ${className}`}>
      {glyphs[name]}
    </svg>
  );
}
