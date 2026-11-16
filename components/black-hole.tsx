"use client";

import { useEffect, useRef } from "react";
import { FRAG, INKS, LAYOUT, VERT } from "./black-hole-shader";

const TILT = (7 * Math.PI) / 180;
const ROLL = (-5 * Math.PI) / 180;
const DEVELOP_MS = 1900;

function hexToVec(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log ?? "shader compile failed");
  }
  return sh;
}

/**
 * Live, ray-traced black hole behind the hero. Falls back to a static poster
 * (rendered from this same shader) when WebGL2 is unavailable or fails, and
 * renders a single still frame for prefers-reduced-motion.
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
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) return fail();

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.bindAttribLocation(prog, 0, "aPos");
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link failed");
    } catch {
      return fail();
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = {
      center: u("uCenter"), f: u("uF"), time: u("uTime"), tilt: u("uTilt"), roll: u("uRoll"),
      yaw: u("uYaw"), exposure: u("uExposure"), low: u("uLow"), high: u("uHigh"), shadow: u("uShadow"),
      star: u("uStar"),
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wideMq = window.matchMedia("(min-width: 1024px)");
    // CSS px per simulated pixel; the small mobile disk needs finer pixels.
    // Either way it coarsens itself if the GPU cannot keep up.
    let px = wideMq.matches ? 2 : 1;
    let w = 0;
    let h = 0;

    const setColors = () => {
      const cs = getComputedStyle(document.documentElement);
      const ink = INKS[document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"];
      const color = (v: string) => hexToVec(cs.getPropertyValue(v) || "#808080");
      gl.uniform3fv(U.low, color(ink.low));
      gl.uniform3fv(U.high, color(ink.high));
      gl.uniform3fv(U.star, color(ink.star));
      gl.uniform4fv(U.shadow, ink.shadow ? [...color(ink.shadow), 1] : [0, 0, 0, 0]);
    };

    const resize = () => {
      const rect = el.getBoundingClientRect();
      w = Math.max(1, Math.ceil(rect.width / px));
      h = Math.max(1, Math.ceil(rect.height / px));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w * px}px`;
      canvas.style.height = `${h * px}px`;
      gl.viewport(0, 0, w, h);
      const L = wideMq.matches ? LAYOUT.wide : LAYOUT.narrow;
      const fCss = Math.min(L.fH * rect.height, L.fW * rect.width);
      gl.uniform2f(U.center, L.cx * rect.width / px, (1 - L.cy) * rect.height / px);
      gl.uniform1f(U.f, fCss / px);
      dirty = true;
    };

    // pointer steers the camera a few degrees; eased every frame
    let yaw = 0;
    let tilt = TILT;
    let yawT = 0;
    let tiltT = TILT;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      yawT = (e.clientX / window.innerWidth - 0.5) * 0.22;
      tiltT = TILT + (e.clientY / window.innerHeight - 0.5) * 0.09;
    };

    let dirty = true;
    let visible = true;
    let raf = 0;
    let last = 0;
    let slow = 0;
    const t0 = performance.now();
    let ready = false;

    const draw = (now: number) => {
      const exposure = reduce ? 1 : Math.min(1, (now - t0) / DEVELOP_MS);
      const eased = 1 - Math.pow(1 - exposure, 3);
      yaw += (yawT - yaw) * 0.05;
      tilt += (tiltT - tilt) * 0.05;
      gl.uniform1f(U.time, reduce ? 0 : (now - t0) / 1000);
      gl.uniform1f(U.exposure, eased);
      gl.uniform1f(U.yaw, yaw);
      gl.uniform1f(U.tilt, tilt);
      gl.uniform1f(U.roll, ROLL);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      dirty = false;
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
        // adaptive resolution: coarser pixels if the GPU can't keep ~24fps
        slow = dt > 55 ? slow + 1 : Math.max(0, slow - 1);
        if (slow > 20 && px < 4) {
          px += 1;
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

    setColors();
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

    const mo = new MutationObserver(() => {
      setColors();
      if (reduce || dirty) draw(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

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
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="bh"
      role="img"
      aria-label="A black hole, ray traced live in your browser: its accretion disk bends over the event horizon."
    >
      {/* static render of this same shader: shown without JS or WebGL2 */}
      <div className="bh-still">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bh-poster theme-dark-only" src="/space/blackhole-dark.png" alt="" width={800} height={340} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bh-poster theme-light-only" src="/space/blackhole-light.png" alt="" width={800} height={340} />
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
