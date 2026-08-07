"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function Portrait() {
  const [src, setSrc] = useState("/portrait.jpg");
  const [fallback, setFallback] = useState(false);

  return (
    <div className="relative">
      <div className="glass-strong overflow-hidden rounded-[2.5rem] p-2">
        {fallback ? (
          <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-900 via-[#15151c] to-zinc-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.25),transparent_55%)]" />
            <svg
              viewBox="0 0 120 120"
              className="relative h-24 w-24 opacity-80"
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="20" cy="20" r="6" />
              <circle cx="100" cy="20" r="6" />
              <circle cx="60" cy="60" r="6" />
              <circle cx="20" cy="100" r="6" />
              <circle cx="100" cy="100" r="6" />
              <circle cx="60" cy="22" r="3" />
              <circle cx="22" cy="60" r="3" />
              <circle cx="100" cy="62" r="3" />
              <path d="M20 20 L60 60 M100 20 L60 60 M60 60 L20 100 M60 60 L100 100" />
            </svg>
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.24em] text-ink-soft">
              Mohamed Ashour
            </p>
          </div>
        ) : (
          <motion.img
            src={src}
            alt="Portrait of Mohamed Ashour"
            width={600}
            height={800}
            loading="eager"
            onError={() => setFallback(true)}
            className="w-full rounded-[2rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
        )}
        <p className="sr-only">
          Drop your professional photo into <code>site/public/portrait.jpg</code>{" "}
          to replace this placeholder.
        </p>
      </div>
    </div>
  );
}