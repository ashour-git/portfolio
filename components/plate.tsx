import type { CSSProperties } from "react";
import art from "@/lib/space-art.json";

export type PlateId = keyof typeof art.plates;

/**
 * A dithered observation plate (see scripts/render_space.py). Shown at an
 * exact 1x (desktop) or 1/2x (mobile) scale and cropped, never resampled,
 * so the 1-bit pixels stay crisp. The detection box marks the subject.
 */
export function Plate({
  id,
  label,
  alt,
  anchor = "50%",
  className = "",
}: {
  id: PlateId;
  label: string;
  alt: string;
  anchor?: string;
  className?: string;
}) {
  const p = art.plates[id];
  const [w, h] = p.size;
  const b = p.box;
  return (
    <div className={`plate ${className}`} style={{ "--w": w, "--h": h } as CSSProperties}>
      <div className="plate-film" style={{ "--ax": anchor } as CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="theme-dark-only" src={`/space/${p.src}-dark.png`} alt={alt} width={w} height={h} loading="lazy" decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="theme-light-only" src={`/space/${p.src}-light.png`} alt={alt} width={w} height={h} loading="lazy" decoding="async" />
        <div className="detect" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }} aria-hidden="true">
          <span className="detect-label">{label}</span>
        </div>
      </div>
      <span aria-hidden="true" className="hud pointer-events-none absolute inset-0" />
    </div>
  );
}
