"use client";

import { useState } from "react";

/**
 * Hero portrait.
 *
 * Defaults to the designed cover at /portrait.svg (ships with the repo and
 * always loads). To use a real professional photo, drop it at
 * /public/portrait.jpg — this component will load it automatically and only
 * switch to the cover if the photo is missing or fails to decode.
 */
export function Portrait() {
  const [src, setSrc] = useState("/portrait.jpg");

  return (
    <div className="relative">
      <div className="glass-strong overflow-hidden rounded-[2.5rem] p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Portrait of Mohamed Ashour"
          width={600}
          height={800}
          loading="eager"
          onError={() => {
            if (src !== "/portrait.svg") setSrc("/portrait.svg");
          }}
          className="h-auto w-full rounded-[2rem]"
        />
      </div>
    </div>
  );
}