"use client";

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

/**
 * Live, ray-traced black hole behind the hero. Falls back to a static poster
 * (rendered from this same shader) without WebGL2, and renders one still
 * frame for prefers-reduced-motion.
 */
export function BlackHole() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const fail = () => el.setAttribute("data-fallback", "");
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) return fail();

    let main: WebGLProgram;
    try {
      main = program(gl, FRAG);
    } catch {
      return fail();
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(main);
    const u = (n: string) => gl.getUniformLocation(main, n);
    const U = {
      center: u("uCenter"), f: u("uF"), time: u("uTime"), tilt: u("uTilt"), roll: u("uRoll"),
      yaw: u("uYaw"), exposure: u("uExposure"), dim: u("uDim"),
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wideMq = window.matchMedia("(min-width: 1024px)");
    // CSS px per rendered pixel; the image is smooth-scaled, and coarsens
    // itself if the GPU cannot keep up.
    // CSS px per rendered pixel: full resolution (a little supersampling on
    // high-DPI screens); coarsens in 1.5x steps if the GPU cannot keep up
    const dpr = window.devicePixelRatio || 1;
    let px = wideMq.matches ? 1 / Math.min(dpr, 1.25) : 1 / Math.min(dpr, 1.5);
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = el.getBoundingClientRect();
      w = Math.max(1, Math.ceil(rect.width / px));
      h = Math.max(1, Math.ceil(rect.height / px));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w * px}px`;
      canvas.style.height = `${h * px}px`;
      gl.viewport(0, 0, w, h);
      const wide = wideMq.matches;
      const L = wide ? LAYOUT.wide : LAYOUT.narrow;
      const fCss = Math.min(L.fH * rect.height, L.fW * rect.width);
      gl.uniform2f(U.center, (L.cx * rect.width) / px, ((1 - L.cy) * rect.height) / px);
      gl.uniform1f(U.f, fCss / px);
      // fade the sky in to the right of the hero text on wide screens
      gl.uniform2f(U.dim, wide ? (0.3 * rect.width) / px : -2, wide ? (0.56 * rect.width) / px : -1);
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

    let visible = true;
    let raf = 0;
    let last = 0;
    let slow = 0;
    let ready = false;
    const t0 = performance.now();

    const draw = (now: number) => {
      const k = reduce ? 1 : Math.min(1, (now - t0) / DEVELOP_MS);
      yaw += (yawT - yaw) * 0.05;
      tilt += (tiltT - tilt) * 0.05;
      gl.uniform1f(U.time, reduce ? 0 : (now - t0) / 1000);
      gl.uniform1f(U.exposure, 1 - Math.pow(1 - k, 3));
      gl.uniform1f(U.yaw, yaw);
      gl.uniform1f(U.tilt, tilt);
      gl.uniform1f(U.roll, ROLL);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!ready) {
        ready = true;
        el.setAttribute("data-ready", "");
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = now - last;
      if (dt >= 33) {
        slow = dt > 55 ? slow + 1 : Math.max(0, slow - 1);
        if (slow > 20 && px < 3) {
          px *= 1.5;
          slow = 0;
          resize();
        }
        last = now;
        draw(now);
      }
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduce) draw(performance.now());

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(performance.now());
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

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      fail();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(main);
      gl.deleteBuffer(buf);
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
      <div className="bh-detect" aria-hidden="true">
        <div className="detect">
          <span className="detect-label">event_horizon 0.99</span>
        </div>
      </div>
    </div>
  );
}
