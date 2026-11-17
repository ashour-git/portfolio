"use client";

import { Infall } from "./infall";
import { useEffect, useRef } from "react";
import { FRAG, LAYOUT, VERT } from "./black-hole-shader";

const TILT = (7 * Math.PI) / 180;
const ROLL = (-5 * Math.PI) / 180;
const DEVELOP_MS = 2000;

function program(gl: WebGL2RenderingContext, frag: string) {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "compile failed");
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link failed");
  return p;
}

type Layer = {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  buf: WebGLBuffer | null;
  U: Record<string, WebGLUniformLocation | null>;
};

type Geo = { scale: number; cx: number; cy: number; f: number; dim: [number, number]; r: number };

function layer(canvas: HTMLCanvasElement, opaque: boolean): Layer | null {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: !opaque,
    premultipliedAlpha: true,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  let prog: WebGLProgram;
  try {
    prog = program(gl, FRAG);
  } catch {
    return null;
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(prog);
  const U: Layer["U"] = {};
  for (const n of ["uCenter", "uF", "uTime", "uTilt", "uRoll", "uYaw", "uExposure", "uDim", "uFeather", "uStars"]) {
    U[n] = gl.getUniformLocation(prog, n);
  }
  return { gl, prog, buf, U };
}

/**
 * Live, ray-traced black hole behind the hero, drawn in two layers: the wide
 * field (outer disk, haze, stars) at reduced resolution, and a sharp core
 * (shadow, photon ring, inner disk) at screen resolution, feathered over it
 * in the shader. Resolution adapts both ways to hold a steady frame rate and
 * never drops to a blocky image. Falls back to a static poster (rendered
 * from this same shader) without WebGL2, and renders one still frame for
 * prefers-reduced-motion.
 */
export function BlackHole() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coreRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const canvas = canvasRef.current;
    const coreCanvas = coreRef.current;
    if (!el || !canvas || !coreCanvas) return;

    const fail = () => el.setAttribute("data-fallback", "");
    const field = layer(canvas, true);
    if (!field) return fail();
    const core = layer(coreCanvas, false);
    if (!core) coreCanvas.style.display = "none";

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wideMq = window.matchMedia("(min-width: 1024px)");
    const dpr = window.devicePixelRatio || 1;
    // quality ladder: [field, core] backing px per CSS px. The core stays at
    // or near screen resolution; the soft field gives way first.
    const LEVELS: [number, number][] = [
      [0.62, Math.min(dpr, 1.5)],
      [0.5, Math.min(dpr, 1.25)],
      [0.42, 1],
      [0.36, 0.9],
    ];
    let level = 2;
    let best = 0; // the sharpest level this device has shown it can hold
    let climbed = false;

    const geoField: Geo = { scale: 1, cx: 0, cy: 0, f: 0, dim: [-2, -1], r: 0 };
    const geoCore: Geo = { scale: 1, cx: 0, cy: 0, f: 0, dim: [-2, -1], r: 0 };

    const resize = () => {
      const rect = el.getBoundingClientRect();
      const wide = wideMq.matches;
      const L = wide ? LAYOUT.wide : LAYOUT.narrow;
      const fCss = Math.min(L.fH * rect.height, L.fW * rect.width);
      const cxCss = L.cx * rect.width;
      const cyCss = L.cy * rect.height;
      const [fs, cs] = LEVELS[level];
      const dim: [number, number] = wide ? [0.3 * rect.width, 0.56 * rect.width] : [-2, -1];

      // wide field: the whole hero, smooth-scaled up by the compositor
      const fw = Math.max(1, Math.ceil(rect.width * fs));
      const fh = Math.max(1, Math.ceil(rect.height * fs));
      canvas.width = fw;
      canvas.height = fh;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      field.gl.viewport(0, 0, fw, fh);
      Object.assign(geoField, { scale: fw / rect.width, cx: cxCss, cy: rect.height - cyCss, f: fCss, dim, r: 0 });

      // sharp core: a square around the hole
      if (core) {
        const side = fCss * 0.72;
        const left = cxCss - side / 2;
        const n = Math.max(1, Math.ceil(side * cs));
        coreCanvas.width = n;
        coreCanvas.height = n;
        coreCanvas.style.width = `${side}px`;
        coreCanvas.style.height = `${side}px`;
        coreCanvas.style.left = `${left}px`;
        coreCanvas.style.top = `${cyCss - side / 2}px`;
        core.gl.viewport(0, 0, n, n);
        Object.assign(geoCore, {
          scale: n / side,
          cx: side / 2,
          cy: side / 2,
          f: fCss,
          dim: wide ? [dim[0] - left, dim[1] - left] : dim,
          r: side / 2,
        });
      }
    };

    let yaw = 0;
    let tilt = TILT;
    let yawT = 0;
    let tiltT = TILT;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      yawT = (e.clientX / window.innerWidth - 0.5) * 0.22;
      tiltT = TILT + (e.clientY / window.innerHeight - 0.5) * 0.09;
    };

    const t0 = performance.now();
    const paint = (L: Layer, g: Geo, now: number, k: number) => {
      const { gl, U } = L;
      const s = g.scale;
      gl.uniform2f(U.uCenter, g.cx * s, g.cy * s);
      gl.uniform1f(U.uF, g.f * s);
      gl.uniform2f(U.uDim, g.dim[0] * s, g.dim[1] * s);
      gl.uniform3f(U.uFeather, g.cx * s, g.cy * s, g.r * s);
      gl.uniform1f(U.uStars, g.r > 0 ? 1 : 0);
      gl.uniform1f(U.uTime, reduce ? 0 : (now - t0) / 1000);
      gl.uniform1f(U.uExposure, 1 - Math.pow(1 - k, 3));
      gl.uniform1f(U.uYaw, yaw);
      gl.uniform1f(U.uTilt, tilt);
      gl.uniform1f(U.uRoll, ROLL);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let ready = false;
    const draw = (now: number, dt: number) => {
      const k = reduce ? 1 : Math.min(1, (now - t0) / DEVELOP_MS);
      // the camera eases toward the pointer at the same pace on any frame rate
      const e = 1 - Math.exp(-Math.min(dt, 100) / 260);
      yaw += (yawT - yaw) * e;
      tilt += (tiltT - tilt) * e;
      paint(field, geoField, now, k);
      if (core) paint(core, geoCore, now, k);
      if (!ready) {
        ready = true;
        el.setAttribute("data-ready", "");
      }
    };

    // frame-time controller: lowers resolution when frames run long, raises
    // it again with headroom; halves the frame rate only at the floor, so
    // pacing stays even instead of stuttering
    let visible = true;
    let raf = 0;
    let last = 0;
    let ema = 16.7;
    let frames = 0;
    let sinceChange = 0;
    let half = false;
    let odd = false;
    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = last ? now - last : 16.7;
      last = now;
      frames++;
      // ignore start-up frames (shader compile, page load), then track
      if (frames === 45) ema = 16.7;
      if (frames > 45 && dt < 250) ema += (dt - ema) * 0.06;
      sinceChange++;
      if (frames > 90 && sinceChange > 45) {
        if (ema > 22 && level < LEVELS.length - 1) {
          // if the level we just climbed to is too much, never retry it
          if (climbed && sinceChange < 240) best = level + 1;
          climbed = false;
          level++;
          sinceChange = 0;
          resize();
        } else if (ema > 27 && level === LEVELS.length - 1 && !half) {
          half = true;
          sinceChange = 0;
        } else if (ema < 18.2 && sinceChange > 180 && (half || level > best)) {
          // holding vsync with room to spare: sharpen one step
          if (half) half = false;
          else {
            level--;
            climbed = true;
            resize();
          }
          sinceChange = 0;
        }
      }
      odd = !odd;
      if (!half || odd) draw(now, half ? dt * 2 : dt);
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    if (reduce) draw(performance.now(), 16.7);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(performance.now(), 16.7);
      else kick();
    });
    ro.observe(el);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduce) kick();
    });
    io.observe(el);

    const onVis = () => {
      if (!document.hidden && !reduce) kick();
    };
    document.addEventListener("visibilitychange", onVis);
    if (!reduce) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      kick();
    }

    const onLost = (ev: Event) => {
      ev.preventDefault();
      cancelAnimationFrame(raf);
      fail();
    };
    const onCoreLost = (ev: Event) => {
      ev.preventDefault();
      coreCanvas.style.display = "none";
    };
    canvas.addEventListener("webglcontextlost", onLost);
    coreCanvas.addEventListener("webglcontextlost", onCoreLost);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      coreCanvas.removeEventListener("webglcontextlost", onCoreLost);
      for (const L of [field, core]) {
        if (!L) continue;
        L.gl.deleteProgram(L.prog);
        L.gl.deleteBuffer(L.buf);
      }
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="bh"
      role="img"
      aria-label="A black hole, ray traced live in your browser: its glowing accretion disk bends over the event horizon."
    >
      {/* static render of this same shader: shown without JS or WebGL2 */}
      <div className="bh-still">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bh-poster" src="/space/blackhole.webp" alt="" width={1600} height={680} />
      </div>
      <canvas ref={canvasRef} className="bh-canvas" />
      <canvas ref={coreRef} className="bh-canvas bh-core" />
      <Infall />
      <div className="bh-detect" aria-hidden="true">
        <div className="detect">
          <span className="detect-label">event_horizon 0.99</span>
        </div>
      </div>
    </div>
  );
}
