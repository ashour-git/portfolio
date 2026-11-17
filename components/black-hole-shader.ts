/**
 * GLSL port of the profile banner's Schwarzschild ray tracer
 * (assets/src/space.py: render_blackhole), in physically based colour.
 * Units: r_s = 1.
 *
 * - Null geodesics: x'' = -1.5 h^2 x / r^5, velocity Verlet.
 * - Thin accretion disk (y = 0): emission r^-3 (1 - sqrt(r_in/r)), temperature
 *   T ~ r^-3/4 (1 - sqrt(r_in/r))^1/4, shifted by Doppler and gravitational
 *   redshift, coloured through the Planckian locus. The approaching side is
 *   bluer and brighter; the disk turns with Keplerian shear.
 * - Photon ring glow at the critical impact parameter b = 3 sqrt(3) / 2.
 * - Escaped rays sample analytic stars, so the starfield is lensed too.
 * - A thin haze above the disk adds the glow seen in Interstellar / TON 618 art.
 *
 * The static fallback posters are captured from this same shader.
 */

/** Composition shared by the shader, the poster and the CSS (.bh in globals.css). */
export const LAYOUT = {
  wide: { cx: 0.7, cy: 0.47, fH: 0.6, fW: 0.44 },
  narrow: { cx: 0.5, cy: 0.56, fH: 0.58, fW: 0.56 },
} as const;

export const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const NOISE = `
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
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    sum += amp * vnoise(p);
    norm += amp;
    p = p * 2.03 + 17.1;
    amp *= 0.5;
  }
  return sum / norm;
}
`;

export const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;     // hole centre, backing px, origin bottom-left
uniform float uF;         // focal length, backing px
uniform float uTime;      // seconds
uniform float uTilt;      // camera elevation above the disk, radians
uniform float uRoll;
uniform float uYaw;
uniform float uExposure;  // 0..1, the image "developing"
uniform vec2 uDim;        // backing-px x range where the sky fades in (text side)
uniform vec3 uFeather;    // core layer: centre (backing px) and radius; z <= 0 = opaque
uniform float uStars;     // 1 = draw lensed stars (core); the field gets crisp stars from the hero canvas

out vec4 outColor;

const float DIST = 18.0;
const float R_IN = 3.0;
const float R_OUT = 11.5;
const float B_CRIT = 2.598076;
// nothing emits beyond this radius (disk < R_OUT, haze < R_OUT + 1.5), so
// rays are only integrated inside it; outside, weak-field bending is analytic
const float R_SKIP = R_OUT + 3.0;

// weak-field deflection (rs = 1) accumulated along a straight segment,
// from cosine c0 to c1 of the angle between the ray and the radius
vec3 bend(vec3 x, vec3 v, float b, float c0, float c1) {
  if (b < 1e-3) return v;
  float delta = (c1 - c0) / b;
  vec3 p = x - dot(x, v) * v;
  return normalize(v * cos(delta) - normalize(p) * sin(delta));
}

${NOISE}

vec3 blackbody(float T) {
  // Planckian locus in CIE 1960 UCS (Krystek 1985), valid ~1000-15000 K
  T = clamp(T, 1000.0, 15000.0);
  float u = (0.860117757 + 1.54118254e-4 * T + 1.28641212e-7 * T * T) / (1.0 + 8.42420235e-4 * T + 7.08145163e-7 * T * T);
  float v = (0.317398726 + 4.22806245e-5 * T + 4.20481691e-8 * T * T) / (1.0 - 2.89741816e-5 * T + 1.61456053e-7 * T * T);
  float x = 3.0 * u / (2.0 * u - 8.0 * v + 4.0);
  float y = 2.0 * v / (2.0 * u - 8.0 * v + 4.0);
  vec3 xyz = vec3(x / y, 1.0, (1.0 - x - y) / y);
  vec3 c = mat3(3.2404542, -0.9692660, 0.0556434, -1.5371385, 1.8760108, -0.2040259, -0.4985314, 0.0415560, 1.0572252) * xyz;
  c = max(c, 0.0);
  return c / max(max(c.r, c.g), c.b);
}

vec3 stars(vec3 d, float pix) {
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float sc = k == 0 ? 70.0 : 190.0;
    vec3 q = d * sc;
    vec3 id = floor(q);
    float h = hash3(id + float(k) * 17.0);
    if (h > (k == 0 ? 0.993 : 0.9985)) {
      vec3 off = vec3(hash3(id + 1.3), hash3(id + 2.7), hash3(id + 4.1)) - 0.5;
      float ang = length(fract(q) - 0.5 - off * 0.6) / sc;
      float t = hash3(id + 9.1);
      vec3 c = mix(vec3(1.0, 0.6, 0.38), vec3(0.62, 0.74, 1.0), t);
      c = mix(c, vec3(1.0), 0.45);
      float w = pix * (k == 0 ? 0.75 : 0.55);
      float b = (k == 0 ? 0.9 : 0.45) * (0.3 + 0.7 * fract(h * 37.0));
      col += c * b * exp(-(ang * ang) / (w * w));
    }
  }
  return col;
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
  float b0 = sqrt(h2);

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float haze = 0.0;
  bool escaped = false;

  float sx = dot(x, v);
  float c0 = sx / length(x);
  if (b0 >= R_SKIP) {
    // never reaches anything that glows: bend it all the way out at once
    v = bend(x, v, b0, c0, 1.0);
    escaped = true;
  } else {
    // fly straight to the emitting region, bending on the way in
    float t = -sx - sqrt(max(sx * sx - (dot(x, x) - R_SKIP * R_SKIP), 0.0));
    vec3 xe = x + v * max(t, 0.0);
    v = bend(x, v, b0, c0, dot(xe, v) / length(xe));
    x = xe;
    hv = cross(x, v);
    h2 = dot(hv, hv);
  }

  for (int i = 0; i < 300; i++) {
    if (escaped) break;
    float r = length(x);
    float dt = clamp(0.07 * r * r / (1.0 + r), 0.015, 0.8);
    float r2 = r * r;
    vec3 a0 = -1.5 * h2 * x / (r2 * r2 * r);
    vec3 x1 = x + v * dt + 0.5 * a0 * dt * dt;
    float r1 = length(x1);
    float r12 = r1 * r1;
    vec3 v1 = v + 0.5 * (a0 - 1.5 * h2 * x1 / (r12 * r12 * r1)) * dt;

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
        float g = dop * sqrt(1.0 - 1.0 / rc);
        float tn = pow(R_IN / rc, 0.75) * pow(max(1.0 - sqrt(R_IN / rc), 0.0), 0.25) / 0.488;
        vec3 bb = blackbody((2300.0 + 5600.0 * tn) * g);
        bb = clamp(mix(vec3(dot(bb, vec3(0.2126, 0.7152, 0.0722))), bb, 1.05), 0.0, 1.0);
        float edge = clamp((R_OUT - rc) / 3.0, 0.0, 1.0) * clamp((rc - R_IN) / 0.25, 0.0, 1.0);
        float I = max(prof * tex, 0.0) * dop * dop * dop * edge;
        col += (1.0 - alpha) * bb * I * 1.15;
        alpha += (1.0 - alpha) * 0.92 * edge;
      }
    }

    // thin glowing haze hugging the disk (cheap volumetric bloom); it is
    // negligible more than ~1.2 above the plane, so most steps skip it
    float ay = abs(x1.y);
    if (ay < 1.2) {
      float hw = smoothstep(R_OUT + 1.5, R_OUT - 3.0, r1) * smoothstep(R_IN * 0.7, R_IN, r1);
      haze += hw * exp(-ay * 4.5) * min(dt, 0.25) * pow(r1, -2.2) * (1.0 - alpha);
    }

    x = x1;
    v = v1;
    // inside the photon sphere and falling: it is captured, and nothing
    // emits in there (the disk starts at R_IN)
    if (r1 < 1.0 || (r1 < 1.5 && dot(x1, v1) < 0.0)) break;
    if (r1 > R_SKIP && dot(x1, v1) > 0.0) {
      // leaving the emitting region: the rest of the bend is analytic
      vec3 vn = normalize(v1);
      v = bend(x1, vn, length(cross(x1, vn)), dot(x1, vn) / r1, 1.0);
      escaped = true;
      break;
    }
    if (alpha > 0.985) break;
  }

  float pix = 1.0 / uF;
  float dim = mix(0.18, 1.0, smoothstep(uDim.x, uDim.y, gl_FragCoord.x));
  vec3 sky = vec3(0.0);
  if (escaped && alpha < 0.985) {
    sky = stars(normalize(v), pix) * dim * uStars;
  }
  // photon ring: light that skims the critical orbit
  float b = sqrt(h2);
  vec3 ring = vec3(1.0, 0.88, 0.68) * exp(-abs(b - B_CRIT) * 10.0) * 0.75;

  vec3 glow = vec3(1.0, 0.76, 0.46) * haze * 1.25;
  vec3 c = col + glow + sky * (1.0 - alpha) + ring * (1.0 - alpha * 0.6);
  c *= uExposure;
  // tone map on luminance (keeps hot gas gold, not clipped white), blended
  // with a per-channel curve so only the hottest rim burns to white
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 hue = c * (1.0 - exp(-lum * 1.5)) / max(lum, 1e-4);
  c = mix(hue, 1.0 - exp(-c * 1.5), 0.3);
  c = pow(c, vec3(1.0 / 2.2));
  vec3 voidc = vec3(0.0196, 0.0196, 0.0196);
  float a = uFeather.z > 0.0 ? 1.0 - smoothstep(uFeather.z * 0.62, uFeather.z, length(gl_FragCoord.xy - uFeather.xy)) : 1.0;
  outColor = vec4((voidc + c * (1.0 - voidc)) * a, a);
}
`;
