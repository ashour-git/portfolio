"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/*
  Holds an engraved background diagram and marks it once it scrolls into
  view, which lets CSS draw its lines in. Without JS the diagram is simply
  drawn (see .ambient in globals.css).
*/
export function Ambient({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`ambient ${className}`} data-on={on || undefined} aria-hidden="true">
      {children}
    </div>
  );
}
