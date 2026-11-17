"use client";

import { useEffect, useRef, useState } from "react";

/*
  The signature moment: a vision model acquiring its targets. Two red boxes
  hunt and lock onto the event horizon and the name, confidence climbing and
  coordinates settling on the real pixel centres; a dashed trajectory joins
  them. Runs once per load (red is reserved for detection). Decorative and
  aria-hidden; reduced motion shows the locked state at once.
*/

type Box = { x: number; y: number; w: number; h: number };
type Frame = { hole: Box; name: Box; W: number; H: number };

const LOCK_MS = 1150;

function boxIn(section: DOMRect, r: DOMRect, pad = 0): Box {
  return { x: r.left - section.left - pad, y: r.top - section.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
}

export function HeroLockOn() {
  const [f, setF] = useState<Frame | null>(null);
  const tags = useRef<(HTMLSpanElement | null)[]>([]);
  const xys = useRef<(HTMLSpanElement | null)[]>([]);
  const played = useRef(false);

  useEffect(() => {
    const section = document.getElementById("top");
    const holeEl = section?.querySelector(".bh-detect");
    const nameEl = document.getElementById("hero-title");
    if (!section || !holeEl || !nameEl) return;

    const measure = () => {
      const s = section.getBoundingClientRect();
      // the name's own ink, not its block boxes: union the text runs' rects
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      const walk = document.createTreeWalker(nameEl, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        range.selectNodeContents(n);
        for (const q of Array.from(range.getClientRects())) {
          l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
        }
      }
      const ink = new DOMRect(l, t, r - l, b - t);
      setF({ hole: boxIn(s, holeEl.getBoundingClientRect()), name: boxIn(s, ink, 10), W: s.width, H: s.height });
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    return () => ro.disconnect();
  }, []);

  // confidence climbs and coordinates settle while the boxes hunt
  useEffect(() => {
    if (!f) return;
    const targets = [
      { label: "event_horizon", conf: 0.99, cx: f.hole.x + f.hole.w / 2, cy: f.hole.y + f.hole.h / 2, delay: 150 },
      { label: "ai_engineer", conf: 0.97, cx: f.name.x + f.name.w / 2, cy: f.name.y + f.name.h / 2, delay: 520 },
    ];
    const write = (k: number, p: number) => {
      const t = targets[k];
      const e = 1 - Math.pow(1 - p, 3);
      const jitter = (1 - e) * 40;
      const conf = 0.31 + (t.conf - 0.31) * e;
      const tag = tags.current[k];
      const xy = xys.current[k];
      if (tag) tag.textContent = `${t.label} ${conf.toFixed(2)}`;
      if (xy) xy.textContent = `x: ${Math.round(t.cx + jitter * Math.sin(p * 23))}  y: ${Math.round(t.cy + jitter * Math.cos(p * 19))}`;
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || played.current) {
      targets.forEach((_, k) => write(k, 1));
      return;
    }
    played.current = true;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      let done = true;
      targets.forEach((t, k) => {
        const p = Math.min(1, Math.max(0, (now - t0 - t.delay) / LOCK_MS));
        if (p < 1) done = false;
        write(k, p);
      });
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [f]);

  if (!f) return null;
  const { hole, name } = f;
  // trajectory: from the name's right edge, arcing up and over into the horizon
  const ax = name.x + name.w, ay = name.y + name.h * 0.35;
  const bx = hole.x, by = hole.y + hole.h * 0.5;
  const wide = f.W >= 1024;
  const d = wide
    ? `M${ax} ${ay} C ${ax + (bx - ax) * 0.45} ${ay - 120}, ${bx - 140} ${by - 90}, ${bx} ${by}`
    : `M${name.x + name.w * 0.5} ${name.y} C ${name.x + name.w * 0.5} ${name.y - 60}, ${hole.x + hole.w * 0.5} ${hole.y + hole.h + 60}, ${hole.x + hole.w * 0.5} ${hole.y + hole.h}`;
  const mid = wide ? { x: ax + (bx - ax) * 0.5, y: Math.min(ay, by) - 78 } : null;

  return (
    <div className="lockon" aria-hidden="true">
      <svg className="lk-path" width={f.W} height={f.H} viewBox={`0 0 ${f.W} ${f.H}`}>
        <path d={d} />
        {mid && (
          <g className="lk-mark" transform={`translate(${mid.x} ${mid.y})`}>
            <path d="M-6 0H6M0 -6V6" />
            <text x="10" y="-8">{`x: ${Math.round(mid.x)}  y: ${Math.round(mid.y)}`}</text>
          </g>
        )}
      </svg>
      {[hole, name].map((b, k) => (
        <div
          key={k}
          className="lk-box"
          style={{ left: b.x, top: b.y, width: b.w, height: b.h, animationDelay: `${k === 0 ? 150 : 520}ms` }}
        >
          <span className="lk-tag" ref={(el) => { tags.current[k] = el; }} />
          <span className={k === 1 ? "lk-xy lk-xy-top" : "lk-xy"} ref={(el) => { xys.current[k] = el; }} />
        </div>
      ))}
    </div>
  );
}
