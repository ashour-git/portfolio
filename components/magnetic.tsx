"use client";

import {
  useRef,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Magnetic wrapper for CTAs and interactive chips.
 *
 * Pulls the element toward the cursor within a small radius using springs,
 * then eases it back on leave. Disabled for coarse pointers and users who
 * prefer reduced motion. Subtle by default (strength is a fraction of the
 * offset, ~0.2), so the effect reads as "alive" rather than "gimmicky".
 */
export function Magnetic({
  children,
  strength = 0.2,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduced) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x: sx, y: sy, display: "inline-block" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}