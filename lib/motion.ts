import type { Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export type Duration = { fast: number; base: number; slow: number };

export const DURATION: Duration = { fast: 0.3, base: 0.6, slow: 0.9 };

export const VIEWPORT = { once: true, margin: "-60px" } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE },
  },
};

export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0 },
  },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE },
  },
};

export const navUnderline: Variants = {
  hidden: { opacity: 0, scaleX: 0.4 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: DURATION.fast, ease: EASE },
  },
};