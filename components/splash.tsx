"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Splash() {
  const [done, setDone] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("ma:splash-seen") === "1";
      sessionStorage.setItem("ma:splash-seen", "1");
    } catch {
      /* storage unavailable — skip splash entirely */
      return;
    }
    if (seen) return;
    setDone(false);
    const t = setTimeout(() => setDone(true), 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-bg"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-10 w-10">
              <motion.span
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent to-accent-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              <motion.span
                className="absolute inset-0 rounded-full border border-accent"
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            </div>
            <p className="font-mono text-sm uppercase tracking-[0.24em] text-ink-faint">
              Loading
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}