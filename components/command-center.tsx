"use client";

import { useState } from "react";
import { motion, useSpring, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { commandWidgets, stats, type CommandWidget } from "@/lib/data";
import { Portrait } from "./portrait";

const ease = [0.22, 1, 0.36, 1] as const;

const ANIMATION_SPRING = { stiffness: 160, damping: 20, mass: 1 };

// Anchor → static Tailwind positioning (no translate utilities, to avoid
// clashing with inline motion x/y). `left-1/2` + fixed negative margin centers
// the bottom widget without a translate class.
const ANCHOR_CLASS: Record<CommandWidget["anchor"], string> = {
  "top-left": "left-0 top-8",
  "top-right": "right-0 top-12",
  "mid-left": "left-0 top-[54%]",
  "mid-right": "right-0 top-[58%]",
  "bottom": "bottom-6 left-1/2 -ml-[4.75rem]",
};

// Hover spread direction: active widget moves AWAY from the portrait center.
const HOVER_DIR: Record<CommandWidget["anchor"], number> = {
  "top-left": 1,
  "top-right": -1,
  "mid-left": 1,
  "mid-right": -1,
  "bottom": 0,
};

function statusColor(status: CommandWidget["status"]) {
  return status === "ready" ? "bg-accent"
    : status === "busy" ? "bg-amber-400"
    : "bg-rose-400";
}

function Widget({
  w,
  active,
  setActive,
  activeId,
}: {
  w: CommandWidget;
  active: boolean;
  setActive: (id: string | null) => void;
  activeId: string | null;
}) {
  const dim = activeId !== null && !active;
  const dir = HOVER_DIR[w.anchor];
  const hoverY = w.drift % 2 === 0 ? [0, 3, 2, 0] : [0, -2, -3, 0];

  return (
    <div className={`absolute ${ANCHOR_CLASS[w.anchor]} hidden md:block`}>
      <motion.div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setActive(w.id);
          }
        }}
        onFocus={() => setActive(w.id)}
        onBlur={() => setActive(null)}
        onMouseEnter={() => setActive(w.id)}
        onMouseLeave={() => setActive(null)}
        animate={{
          opacity: dim ? 0.94 : 1,
          x: dir !== 0 && active ? dir * 8 : 0,
          y: active ? 0 : hoverY,
        }}
        transition={{
          y: active
            ? { duration: 0.2, ease }
            : { duration: w.drift, ease, repeat: Infinity },
          x: { duration: 0.2, ease },
          opacity: { duration: 0.25, ease },
        }}
        className="glass cursor-pointer rounded-xl px-4 py-3 text-left outline-none transition-colors hover:border-accent/30 focus-visible:border-accent/30 focus-visible:ring-1 focus-visible:ring-accent/30"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${statusColor(w.status)}`} />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{w.label}</span>
        </span>
        <span className="mt-1 block text-sm font-semibold tracking-tight text-ink">{w.value}</span>
        {w.meta && <span className="mt-0.5 block font-mono text-[10px] text-ink-faint">{w.meta}</span>}
      </motion.div>

      <AnimatePresence>
        {active && w.flow && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease }}
            className="absolute left-0 top-full mt-2 hidden md:block"
            aria-hidden="true"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/90 px-3 py-1.5 font-mono text-[10px] text-ink-soft backdrop-blur">
              {w.flow.map((step, i) => (
                <span key={step} className="inline-flex items-center gap-1.5">
                  {i > 0 && <span className="text-ink-faint">→</span>}
                  {step}
                </span>
              ))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrackRecord() {
  return (
    <div className="glass absolute -left-2 bottom-2 hidden rounded-2xl px-5 py-4 md:block">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Track record</p>
      <div className="mt-3 flex gap-6">
        {stats.slice(0, 2).map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-xs text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WireLayer({ activeId }: { activeId: string | null }) {
  const edges: Record<CommandWidget["anchor"], [number, number]> = {
    "top-left": [64, 140],
    "top-right": [416, 160],
    "mid-left": [60, 430],
    "mid-right": [420, 420],
    "bottom": [240, 560],
  };
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
      viewBox="0 0 480 640"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <linearGradient id="wire-active" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2ee6a3" />
          <stop offset="1" stopColor="#0ea5c9" />
        </linearGradient>
      </defs>
      {commandWidgets.map((w, i) => {
        const [x, y] = edges[w.anchor];
        const active = activeId === w.id;
        const cx = 240 + (i % 2 === 0 ? -60 : 60);
        const cy = 260 + i * 46;
        return (
          <path
            key={w.id}
            d={`M ${x} ${y} C ${cx} ${cy}, ${cx} ${cy + 40}, ${240} ${330}`}
            stroke={active ? "url(#wire-active)" : "var(--color-border)"}
            strokeWidth={active ? 1.2 : 0.8}
            strokeOpacity={active ? 1 : 0.35}
            strokeDasharray="3 4"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function CommandCenter() {
  const [activeId, setActive] = useState<string | null>(null);

  // pointer parallax — springs, ≤2° rotation (spec §3.4)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, ANIMATION_SPRING);
  const sy = useSpring(my, ANIMATION_SPRING);
  const rotateY = useTransform(sx, [-0.5, 0.5], ["-2deg", "2deg"]);
  const rotateX = useTransform(sy, [-0.5, 0.5], ["2deg", "-2deg"]);

  const handleMove = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-none" aria-label="Portrait">
      {/* ambient mesh (motion budget #1) */}
      <div aria-hidden="true" className="mesh-bg rounded-[3rem]" />

      <motion.div
        onPointerMove={handleMove}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* frame + portrait */}
        <div className="relative">
          <div aria-hidden="true" className="frame-sweep rounded-[2.5rem]" />
          <div className="glass-strong overflow-hidden rounded-[2.5rem] p-2">
            <Portrait />
          </div>
        </div>

        {/* wires */}
        <WireLayer activeId={activeId} />

        {/* widgets + track record (motion budget #2: per-widget drift) */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div className="pointer-events-auto relative h-full w-full">
            {commandWidgets.map((w) => (
              <Widget key={w.id} w={w} active={activeId === w.id} setActive={setActive} activeId={activeId} />
            ))}
          </motion.div>
        </div>
        <TrackRecord />
      </motion.div>
    </div>
  );
}