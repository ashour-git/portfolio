"use client";

import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { commandWidgets, stats, type CommandWidget } from "@/lib/data";
import { Portrait } from "./portrait";
import { Reveal } from "./reveal";

const ANIMATION_SPRING = { stiffness: 160, damping: 20, mass: 1 };

// Row-wise order for the 2-column instrument panel: MODEL, RETRIEVAL /
// EXPERIMENTS, API / AZURE (spanning). Side rails were tried and removed:
// a ~454px column cannot host a 384px portrait plus five chips beside it.
const PANEL_ORDER = ["model", "latency", "mlflow", "api", "registry"];
const panelChips = PANEL_ORDER.map((id) => commandWidgets.find((w) => w.id === id)!).filter(Boolean);

// Compact system card shown below lg (spec §8): 2–3 widgets max,
// no floating layers, no connector lines.
const MOBILE_STATS = [
  { value: "18/18", label: "security tests" },
  { value: "162", label: "automated tests" },
  { value: "~67ms", label: "retrieval p95" },
];

function statusColor(status: CommandWidget["status"]) {
  return status === "ready" ? "bg-accent"
    : status === "busy" ? "bg-amber-400"
    : "bg-rose-400";
}

// A status readout, not a control: it navigates nowhere and toggles nothing,
// so it is static text rather than a button that performs no action.
function StatusChip({ w }: { w: CommandWidget }) {
  return (
    <div className="glass h-full rounded-xl px-4 py-3">
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className={`h-1 w-1 rounded-full ${statusColor(w.status)}`} />
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">{w.label}</span>
      </span>
      <span className="mt-1 block text-sm font-semibold tracking-tight text-ink">{w.value}</span>
      {w.meta && <span className="mt-0.5 block font-mono text-[11px] text-ink-faint">{w.meta}</span>}
    </div>
  );
}

function TrackRecord() {
  // In-flow strip below the panel — never overlaid, so it can never collide
  // with another element. Static by design.
  return (
    <div className="surface mt-4 hidden rounded-xl px-5 py-4 lg:block">
      <div className="flex items-center justify-between gap-6">
        <p className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Track record</p>
        <div className="flex gap-6">
          {stats.slice(0, 2).map((s) => (
            <div key={s.label} className="text-right">
              <p className="text-2xl font-semibold text-ink">{s.value}</p>
              <p className="text-xs text-ink-soft">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommandCenter() {
  // pointer parallax — springs, ≤2° rotation (spec §3.4)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, ANIMATION_SPRING);
  const sy = useSpring(my, ANIMATION_SPRING);
  const rotateY = useTransform(sx, [-0.5, 0.5], ["-2deg", "2deg"]);
  const rotateX = useTransform(sy, [-0.5, 0.5], ["2deg", "-2deg"]);

  const handleMove = (e: React.PointerEvent) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-none" role="group" aria-label="System status">
      {/* ambient mesh (motion budget #1) */}
      <div aria-hidden="true" className="mesh-bg rounded-[3rem]" />

      <motion.div
        onPointerMove={handleMove}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-full"
      >
        <div className="relative">
          <Portrait />
        </div>
      </motion.div>

      {/* instrument panel (lg+): one staggered entrance, then stillness */}
      <div className="mt-4 hidden lg:grid lg:grid-cols-2 lg:gap-4">
        {panelChips.map((w, i) => (
          <Reveal key={w.id} delay={i * 60} className={w.id === "registry" ? "col-span-2" : undefined}>
            <StatusChip w={w} />
          </Reveal>
        ))}
      </div>

      {/* track record strip (lg+) and compact system card (<lg) live in flow,
          below the portrait */}
      <TrackRecord />

      {/* mobile: focused compact system card — no floating widgets, no wires */}
      <div className="mt-4 lg:hidden">
        <div className="panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              Pipeline OS · runtime
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-accent">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
              ready
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {MOBILE_STATS.map((s) => (
              <div key={s.label}>
                <p className="text-lg font-semibold tracking-tight text-ink">{s.value}</p>
                <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed text-ink-faint">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
