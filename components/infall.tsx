"use client";

import { useEffect, useRef } from "react";
import { NET_EDGES, NET_H, NET_NODES, NET_PULSES, NET_W } from "./neural-net";

/*
  Everything falling into the hole, on one canvas:
  - the neural network feeding it from the left (blue = networks): weights
    and neurons cached once, signals and firing neurons drawn per frame;
  - the spacetime funnel under it (magenta = wireframe): rings fall inward
    along the funnel forever, meridians trace the same curve;
  - code falling in: each lane is a real line from this site (the copilot's
    retrieval pipeline, the shader's geodesic step), spiralling inward in the
    disk plane, stretching near the horizon and heating from white to gold,
    erased at the shadow.
  Glyphs are drawn from a pre-rendered sprite sheet: stamping images under a
  rotation is cheap, while re-rasterising rotated text every frame was the
  page's frame-rate bottleneck. Decorative (aria-hidden), paused offscreen,
  one still frame under reduced motion.
*/

const LINES = [
  "const queryVec = await embedder(message);",
  "const primary = retrieveTopK(queryVec, tokens, chunks, {",
  "const lexical = bm25QueryTokens(message);",
  "const { chunks, embeddings } = loadIndex();",
  "vec3 a0 = -1.5 * h2 * x / pow(r, 5.0);",
  "const top = primary[0]?.score ?? 0;",
  "const embedder = await getEmbedder();",
  "const queryTokens = rewriteQuery(message, intent.primary);",
  "const retrievalStart = Date.now();",
  "float h2 = dot(hv, hv);",
  "const centroids = loadCentroids();",
  "let strategy: \"primary\" | \"relaxed\" = \"primary\";",
];

// funnel fall, as stops: progress -> (ring scale, drop below the disk), in
// units of a 1000-wide plate whose ring centre sits at the hole
const STOPS: [number, number, number][] = [
  [0, 1, 0],
  [0.25, 0.46, 30],
  [0.5, 0.23, 82],
  [0.75, 0.115, 175],
  [1, 0.05, 300],
];
const RINGS = 9;
const RING_S = 10; // seconds for a ring to fall the whole funnel
const RX = 480;
const RY = 82;

function along(p: number): [number, number] {
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, s1, d1] = STOPS[i];
    const [p0, s0, d0] = STOPS[i - 1];
    if (p <= p1) {
      const u = (p - p0) / (p1 - p0);
      return [s0 + (s1 - s0) * u, d0 + (d1 - d0) * u];
    }
  }
  return [STOPS[4][1], STOPS[4][2]];
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Lane = { text: string; theta0: number; elev: number; speed: number; phase: number; count: number };

function lanes(n: number, count: number): Lane[] {
  return Array.from({ length: n }, (_, i) => {
    const text = (LINES[i % LINES.length] + "    ").repeat(2);
    const u = n === 1 ? 0.5 : i / (n - 1);
    return {
      text,
      theta0: -0.55 + u * 1.1,
      elev: (u - 0.5) * 2 * (0.55 + (0.25 * ((i * 7) % 3)) / 2),
      speed: 0.018 + (((i * 37) % 11) / 11) * 0.012,
      phase: (i * 0.618) % 1,
      count,
    };
  });
}

// sprite sheet: every character once per heat tint, white -> warm -> gold
const TINTS = ["#ecebe6", "#f7d9a8", "#ffbf5e"];
const ATLAS_PX = 28;

function atlas(family: string) {
  const chars = Array.from(new Set(LINES.join("").split(""))).filter((c) => c !== " ");
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = `500 ${ATLAS_PX}px ${family}`;
  const cw = Math.ceil(probe.measureText("M").width) + 4;
  const ch = Math.ceil(ATLAS_PX * 1.3);
  const sheet = document.createElement("canvas");
  sheet.width = cw * chars.length;
  sheet.height = ch * TINTS.length;
  const g = sheet.getContext("2d")!;
  g.font = `500 ${ATLAS_PX}px ${family}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  TINTS.forEach((tint, row) => {
    g.fillStyle = tint;
    chars.forEach((c, i) => g.fillText(c, i * cw + cw / 2, row * ch + ch / 2));
  });
  const index = new Map(chars.map((c, i) => [c, i]));
  return { sheet, cw, ch, index };
}

export function Infall() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wideMq = window.matchMedia("(min-width: 1024px)");
    let A = atlas(getComputedStyle(canvas).fontFamily);
    let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R0 = 0, rH = 0, rS = 0, f = 0;
    let wide = true;
    let L: Lane[] = [];
    let meridians: [number, number, number][][] = [];
    let net: { k: number; ox: number; oy: number; bx: number; bw: number } | null = null;

    const size = () => {
      const r = host.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      wide = wideMq.matches;
      cx = W * (wide ? 0.7 : 0.5);
      cy = H * (wide ? 0.47 : 0.56);
      f = wide ? Math.min(0.6 * H, 0.44 * W) : Math.min(0.58 * H, 0.56 * W);
      rH = f * 0.2;
      rS = f * 0.2; // on-screen shadow radius: half the detection box (0.4 f)
      R0 = wide ? (W - cx) * 1.3 : Math.max(W - cx, cx * 0.6) * 1.18;
      L = lanes(wide ? 13 : 6, wide ? 78 : 46);
      // the network occupies the band between the text and the hole (desktop only)
      if (wide) {
        const bx = cx - 0.21 * W, by = 0.12 * H, bw = 0.21 * W, bh = 0.7 * H;
        const k = Math.min(bw / NET_W, bh / NET_H);
        net = { k, ox: bx + (bw - NET_W * k) / 2, oy: by + (bh - NET_H * k) / 2, bx, bw };
      } else net = null;
      // funnel meridians: the fall curve at 18 bearings (static per size)
      const k = (2.05 * f) / 1000;
      meridians = Array.from({ length: 18 }, (_, j) => {
        const a = (j / 18) * Math.PI * 2;
        const pts: [number, number, number][] = [];
        for (let p = 0; p <= 1.0001; p += 0.05) {
          const [s, d] = along(p);
          pts.push([cx + RX * s * k * Math.cos(a), cy + d * k + RY * s * k * Math.sin(a), s]);
        }
        return pts;
      });
    };

    // the funnel's soft edge: big outer rings fade out, as the old mask did
    const edge = (s: number) => 1 - smooth(0.42, 0.98, s);

    // network placement: a 300x500 plate in the band left of the hole,
    // fitted and centred, faded in from the text side and out at the hole
    const netAt = (p: readonly [number, number]): [number, number] => [net!.ox + p[0] * net!.k, net!.oy + p[1] * net!.k];
    const netFade = (x: number) => {
      const u = (x - net!.bx) / net!.bw;
      if (u <= 0 || u >= 0.97) return 0;
      return u < 0.28 ? u / 0.28 : u <= 0.74 ? 1 : 1 - (u - 0.74) / 0.23;
    };
    const pointOn = (p: (typeof NET_PULSES)[number], u: number): [number, number] => {
      let d = u * p.total;
      for (let i = 0; i < p.seg.length; i++) {
        if (d <= p.seg[i] || i === p.seg.length - 1) {
          const t = Math.min(1, d / p.seg[i]);
          const a = p.pts[i], b = p.pts[i + 1];
          return netAt([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
        d -= p.seg[i];
      }
      return netAt(p.pts[p.pts.length - 1]);
    };

    // meridians never move: draw them once per size, stamp them every frame
    const still = document.createElement("canvas");
    const paintMeridians = () => {
      still.width = canvas.width;
      still.height = canvas.height;
      const g = still.getContext("2d");
      if (!g) return;
      // the starfield, crisp at screen resolution (the ray tracer draws the
      // lensed stars inside its sharp core, so leave that disc to it)
      let seed = 4242;
      const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
      const n = Math.round((W * H) / 5200);
      for (let i = 0; i < n; i++) {
        const x = rnd() * W, y = rnd() * H, m = rnd(), t = rnd();
        if (Math.hypot(x - cx, y - cy) < f * 0.36) continue;
        const dim = wide ? 0.18 + 0.82 * smooth(0.3 * W, 0.56 * W, x) : 1;
        const big = m > 0.93;
        g.globalAlpha = (big ? 0.85 : 0.25 + 0.45 * m) * dim;
        g.fillStyle = t < 0.2 ? "#ffd9b0" : t > 0.85 ? "#cfdcff" : "#f2f1ec";
        g.beginPath();
        g.arc(x * dpr, y * dpr, (big ? 1.1 : 0.55 + 0.35 * m) * dpr, 0, Math.PI * 2);
        g.fill();
      }
      g.lineWidth = dpr;
      g.strokeStyle = "#ff3fa4";
      for (const m of meridians) {
        for (let i = 1; i < m.length; i++) {
          g.globalAlpha = 0.26 * edge(m[i][2]);
          g.beginPath();
          g.moveTo(m[i - 1][0] * dpr, m[i - 1][1] * dpr);
          g.lineTo(m[i][0] * dpr, m[i][1] * dpr);
          g.stroke();
        }
      }
      // the network's weights and neurons: static, so they live here too
      if (net) {
        g.strokeStyle = "rgb(91,149,255)";
        g.lineWidth = 0.7 * net.k * dpr;
        for (const e of NET_EDGES) {
          const [ax, ay] = netAt(e.a);
          const [bx, by] = netAt(e.b);
          g.globalAlpha = 0.3 * (0.18 + e.w * 0.5) * netFade((ax + bx) / 2);
          g.beginPath();
          g.moveTo(ax * dpr, ay * dpr);
          g.lineTo(bx * dpr, by * dpr);
          g.stroke();
        }
        g.lineWidth = dpr;
        for (const p of NET_NODES.flat()) {
          const [x, y] = netAt(p);
          g.globalAlpha = netFade(x);
          g.beginPath();
          g.arc(x * dpr, y * dpr, 2.2 * net.k * dpr, 0, Math.PI * 2);
          g.fillStyle = "#050505";
          g.fill();
          g.strokeStyle = "rgba(91,149,255,0.9)";
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    };

    // signals flowing forward through the network, and neurons firing
    const network = (time: number) => {
      if (!net || reduce) return;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.6 * net.k * dpr;
      ctx.strokeStyle = "#d6e4ff";
      ctx.fillStyle = "#d6e4ff";
      for (const p of NET_PULSES) {
        if (time < p.delay) continue;
        const u = ((time - p.delay) / p.dur) % 1;
        // a 3%-long dash travelling the route, like the old stroke-dash pulse
        const a = pointOn(p, u), b = pointOn(p, Math.min(1, u + 0.03));
        ctx.globalAlpha = netFade(a[0]);
        ctx.beginPath();
        ctx.moveTo(a[0] * dpr, a[1] * dpr);
        ctx.lineTo(b[0] * dpr, b[1] * dpr);
        ctx.stroke();
        for (const fire of p.fires) {
          if (time < fire.at) continue;
          const age = ((time - fire.at) % p.dur) / p.dur;
          if (age > 0.12) continue;
          const [x, y] = netAt([fire.x, fire.y]);
          ctx.globalAlpha = (1 - age / 0.12) * netFade(x);
          ctx.beginPath();
          ctx.arc(x * dpr, y * dpr, 3.4 * net.k * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const funnel = (time: number) => {
      const k = (2.05 * f) / 1000;
      ctx.drawImage(still, 0, 0);
      ctx.lineWidth = dpr;
      ctx.strokeStyle = "#ff3fa4";
      for (let i = 0; i < RINGS; i++) {
        const p = (((time / RING_S + i / RINGS) % 1) + 1) % 1;
        const [s, d] = along(p);
        const life = p < 0.08 ? p / 0.08 : p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1;
        ctx.globalAlpha = 0.5 * life * edge(s);
        if (ctx.globalAlpha < 0.01) continue;
        ctx.beginPath();
        ctx.ellipse(cx * dpr, (cy + d * k) * dpr, RX * s * k * dpr, RY * s * k * dpr, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    // a point on lane l at progress t (0 = right edge, 1 = horizon)
    const at = (l: Lane, t: number) => {
      const kk = Math.pow(1 - t, 1.35);
      const r = rH + (R0 - rH) * kk;
      const th = l.theta0 - 2.1 * t;
      return { x: cx + r * Math.cos(th), y: cy + r * 0.2 * Math.sin(th) + l.elev * r * 0.32 * kk, r };
    };

    const code = (time: number) => {
      const { sheet, cw, ch, index } = A;
      const k = 14 / ATLAS_PX; // atlas glyphs are drawn at twice the 14px base
      const fadeL = wide ? W * 0.38 : -1, fadeR = wide ? W * 0.52 : 0;
      const spacing = (wide ? 0.58 : 0.92) / (L[0]?.count || 1);
      for (const l of L) {
        for (let i = 0; i < l.count; i++) {
          const c = l.text[i % l.text.length];
          const gi = index.get(c);
          if (gi === undefined) continue;
          const t = (((l.phase + time * l.speed - i * spacing) % 1) + 1) % 1;
          const p = at(l, t);
          const q = at(l, Math.min(t + 0.004, 1));
          let ang = Math.atan2(q.y - p.y, q.x - p.x);
          if (Math.cos(ang) < 0) ang += Math.PI; // keep glyphs upright
          const near = 1 - (p.r - rH) / (R0 - rH);
          const a = 0.62 * Math.min(1, t / 0.08) * Math.min(1, (1 - t) / 0.18) * (wide ? smooth(fadeL, fadeR, p.x) : 1);
          if (a < 0.02) continue;
          const s = (0.3 + 0.75 * Math.pow(1 - near, 0.8)) * k * dpr;
          const st = 1 + near * 0.9, sq = 1 - near * 0.45; // spaghettification
          const cs = Math.cos(ang) * s, sn = Math.sin(ang) * s;
          const heat = Math.pow(near, 2.2);
          const row = heat < 0.3 ? 0 : heat < 0.65 ? 1 : 2;
          ctx.globalAlpha = a;
          ctx.setTransform(cs * st, sn * st, -sn * sq, cs * sq, p.x * dpr, p.y * dpr);
          ctx.drawImage(sheet, gi * cw, row * ch, cw, ch, -cw / 2, -ch / 2, cw, ch);
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      // the horizon swallows it: erase everything inside the lensed shadow
      ctx.globalCompositeOperation = "destination-out";
      const g = ctx.createRadialGradient(cx * dpr, cy * dpr, rS * 0.78 * dpr, cx * dpr, cy * dpr, rS * 1.08 * dpr);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx * dpr, cy * dpr, rS * 1.08 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    };

    const draw = (time: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      funnel(time);
      network(time);
      code(time);
    };

    size();
    paintMeridians();
    let raf = 0;
    let visible = true;
    const start = performance.now();
    const loop = (now: number) => {
      draw((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      cancelAnimationFrame(raf);
      if (reduce || !visible || document.hidden) {
        draw(reduce ? 7 : (performance.now() - start) / 1000);
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(() => {
      size();
      paintMeridians();
      play();
    });
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      play();
    });
    io.observe(host);
    const onVis = () => play();
    document.addEventListener("visibilitychange", onVis);
    // rebuild the sprite sheet once the real mono face has loaded
    document.fonts?.ready.then(() => {
      A = atlas(getComputedStyle(canvas).fontFamily);
      play();
    });
    play();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="infall font-mono" aria-hidden="true" />;
}
