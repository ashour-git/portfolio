/**
 * GLSL port of the profile banner's Schwarzschild ray tracer
 * (assets/src/space.py: render_blackhole). Units: r_s = 1.
 *
 * Null geodesics are integrated with x'' = -1.5 h^2 x / r^5 (velocity
 * Verlet), tested against a thin accretion disk in the y = 0 plane with
 * Doppler beaming, and escaped rays sample a lensed starfield. The disk
 * turns with Keplerian shear (inner rings orbit faster). Output is dithered
 * on the GPU to three inks: transparent void, accent, starlight.
 *
 * scripts/render-poster.md describes how the static posters are captured
 * from this same shader.
 */

export const DIST = 18;

/** Ink roles per theme: dark is starlight on void; light is a print on paper. */
export const INKS = {
  dark: { low: "--color-accent", high: "--color-ink", shadow: null, star: "--color-ink" },
  light: { low: "--color-ink", high: "--color-accent", shadow: "--color-ink", star: "--color-ink" },
} as const;

/** Composition shared by the shader, the poster and the CSS (.bh in globals.css). */
export const LAYOUT = {
  wide: { cx: 0.7, cy: 0.47, fH: 0.6, fW: 0.44 },
  narrow: { cx: 0.5, cy: 0.56, fH: 0.58, fW: 0.56 },
} as const;

export const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;     // hole centre, backing px, origin bottom-left
uniform float uF;         // focal length, backing px
uniform float uTime;      // seconds
uniform float uTilt;      // camera elevation above the disk, radians
uniform float uRoll;
uniform float uYaw;
uniform float uExposure;  // 0..1, the plate "developing"
uniform vec3 uLow;        // ink for warm gas
uniform vec3 uHigh;       // ink for the hottest gas
uniform vec4 uShadow;     // fill for rays that fall in (alpha 0 = see-through)
uniform vec3 uStar;

out vec4 outColor;

const float DIST = 18.0;
const float R_IN = 3.0;
const float R_OUT = 11.5;

float hash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x);
  float b = mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x);
  float c = mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x);
  float d = mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}

float fbm(vec3 p, int oct) {
  float amp = 0.5, sum = 0.0, norm = 0.0;
  for (int i = 0; i < 5; i++) {
    if (i >= oct) break;
    sum += amp * vnoise(p);
    norm += amp;
    p = p * 2.03 + 17.1;
    amp *= 0.5;
  }
  return sum / norm;
}

void main() {
  vec2 s = (gl_FragCoord.xy - uCenter) / uF;
  float cr = cos(uRoll), sr = sin(uRoll);
  s = vec2(s.x * cr - s.y * sr, s.x * sr + s.y * cr);

  vec3 cam = vec3(0.0, DIST * sin(uTilt), -DIST * cos(uTilt));
  float cy = cos(uYaw), sy = sin(uYaw);
  cam = vec3(cam.x * cy - cam.z * sy, cam.y, cam.x * sy + cam.z * cy);
  vec3 fwd = normalize(-cam);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);

  vec3 x = cam;
  vec3 v = normalize(fwd + s.x * right + s.y * up);
  vec3 hv = cross(x, v);
  float h2 = dot(hv, hv);

  float col = 0.0;
  float alpha = 0.0;
  bool escaped = false;

  for (int i = 0; i < 360; i++) {
    float r = length(x);
    float dt = clamp(0.06 * r * r / (1.0 + r), 0.015, 0.8);
    vec3 a0 = -1.5 * h2 * x / pow(r, 5.0);
    vec3 x1 = x + v * dt + 0.5 * a0 * dt * dt;
    float r1 = length(x1);
    vec3 v1 = v + 0.5 * (a0 - 1.5 * h2 * x1 / pow(r1, 5.0)) * dt;

    if (x.y * x1.y < 0.0) {
      vec3 pc = mix(x, x1, x.y / (x.y - x1.y));
      float rc = length(pc);
      if (rc > R_IN && rc < R_OUT) {
        float prof = pow(rc, -3.0) * (1.0 - sqrt(R_IN / rc)) / (pow(4.08, -3.0) * (1.0 - sqrt(3.0 / 4.08)));
        float phi = atan(pc.z, pc.x) - uTime * 1.6 * pow(rc, -1.5);
        vec2 cs = vec2(cos(phi), sin(phi));
        float tex = fbm(vec3(rc * 3.2, cs * 0.9), 4);
        float streak = fbm(vec3(rc * 9.0, cs * 2.6) + 11.0, 3);
        tex = 0.45 + 1.1 * (tex - 0.5) + 0.5 * (streak - 0.5);
        float beta = clamp(sqrt(0.5 / rc), 0.0, 0.6);
        vec3 vel = vec3(-pc.z, 0.0, pc.x) / rc * beta;
        float gam = 1.0 / sqrt(1.0 - beta * beta);
        float dop = 1.0 / (gam * (1.0 - dot(vel, -normalize(v))));
        float edge = clamp((R_OUT - rc) / 3.0, 0.0, 1.0) * clamp((rc - R_IN) / 0.25, 0.0, 1.0);
        col += (1.0 - alpha) * max(prof * tex, 0.0) * dop * dop * dop * edge;
        alpha += (1.0 - alpha) * 0.92 * edge;
      }
    }

    x = x1;
    v = v1;
    if (r1 < 1.0) break;
    if (r1 > DIST * 1.6 && dot(x1, v1) > 0.0) { escaped = true; break; }
    if (alpha > 0.985) break;
  }

  // ordered dither (interleaved gradient noise) to three inks
  float gray = 1.0 - exp(-2.6 * col * uExposure);
  float th = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  int idx = gray < 0.38 ? (gray / 0.38 > th ? 1 : 0) : ((gray - 0.38) / 0.62 > th ? 2 : 1);

  vec4 c = vec4(0.0);
  if (idx == 1) {
    c = vec4(uLow, 1.0);
  } else if (idx == 2) {
    c = vec4(uHigh, 1.0);
  } else if (escaped && alpha < 0.5) {
    // point stars hashed on the escaped direction, so they are lensed by the
    // same geodesics; the on-axis pile-up is hidden
    vec3 fd = normalize(v);
    vec3 q = fd * 110.0;
    vec3 fr = fract(q) - 0.5;
    if (hash3(floor(q)) > 0.972 && dot(fr, fr) < 0.07 && dot(fd, fwd) < 0.9945) {
      float g = clamp(uExposure * 1.4, 0.0, 1.0);
      c = vec4(uStar * g, g);
    }
  } else if (!escaped && alpha < 0.5) {
    float g = uShadow.a * clamp(uExposure * 1.6, 0.0, 1.0);
    c = vec4(uShadow.rgb * g, g);
  }
  outColor = c;
}
`;
