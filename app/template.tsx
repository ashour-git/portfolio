"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { EASE, DURATION } from "@/lib/motion";

const initialPathname = typeof window === "undefined" ? "" : window.location.pathname;

let booted = false;

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    booted = true;
  }, []);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isFirstPage = pathname === initialPathname && !booted;

  useEffect(() => {
    if (!isFirstPage) setAnimate(true);
  }, [isFirstPage]);

  if (reduced || !animate) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}