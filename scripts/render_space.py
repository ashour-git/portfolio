"""Render the site's dithered space art into public/space/.

Reuses the profile README renderer (../../assets/src/space.py: Atkinson
dithering, noise-textured planets, starfields) so the site and the GitHub
profile share one visual system. Every image is written twice, once per
theme: "dark" (starlight ink on void) and "light" (a negative plate: ink
stars on paper). The outputs are committed; this only needs re-running when
the art changes.

    python scripts/render_space.py            # everything
    python scripts/render_space.py plates     # one job

Writes lib/space-art.ts with the detection-box geometry for each plate.
"""

from __future__ import annotations

import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image  # noqa: F401

SITE = Path(__file__).resolve().parents[1]
PROFILE_SRC = SITE.parent / "assets" / "src"
if not (PROFILE_SRC / "space.py").exists():
    sys.exit(f"Profile renderer not found at {PROFILE_SRC}; clone the profile repo next to site/.")
sys.path.insert(0, str(PROFILE_SRC))

import space  # noqa: E402  (profile renderer)
from space import atkinson, fbm, render_planet  # noqa: E402

OUT = SITE / "public" / "space"
OUT.mkdir(parents=True, exist_ok=True)

THEMES = {
    #        transparent, body shadow, ink,       accent
    "dark": [None, "#0d1117", "#e6edf3", "#f0643c"],
    "light": [None, "#f2f4f7", "#0d1117", "#c93c14"],
}
rng = np.random.default_rng(11)


def save(name: str, idx: np.ndarray, scale: int = 2) -> tuple[int, int]:
    big = np.kron(idx, np.ones((scale, scale), np.uint8)) if scale > 1 else idx
    for theme, pal in THEMES.items():
        (OUT / f"{name}-{theme}.png").write_bytes(space.to_png(big, pal))
    return big.shape[1], big.shape[0]


def sky(h, w, density):
    """Sparse 1-bit stars (index 2 = ink) with an occasional 2x2 bright star."""
    s = rng.random((h, w)) < density
    return s


def compose(gray, inside, city=None, stars=None):
    bits = atkinson(gray)
    idx = np.where(bits, 2, 0).astype(np.uint8)
    idx[inside & ~bits] = 1
    if city is not None:
        idx[city] = 3
    if stars is not None:
        idx[stars & ~inside & (idx == 0)] = 2
    return idx


def box(cx, cy, half_w, half_h, w, h, pad=1.18):
    """Detection box as percentages of the plate."""
    bw, bh = half_w * 2 * pad, half_h * 2 * pad
    return {
        "x": round((cx - bw / 2) / w * 100, 2),
        "y": round((cy - bh / 2) / h * 100, 2),
        "w": round(bw / w * 100, 2),
        "h": round(bh / h * 100, 2),
    }


# --------------------------------------------------------------- plates
def planet_plate(w, h, cx, cy, r, light, seed, cities=True, craters=False, moon=None):
    gray, inside, city = render_planet(w, h, cx, cy, r, light, seed_off=seed, cities=cities, craters=craters)
    if moon:
        mg, mi, _ = render_planet(w, h, *moon, craters=True, cities=False)
        gray = np.where(mi, mg, gray)
        inside = inside | mi
    return compose(gray, inside, city if cities else None, sky(h, w, 0.006))


def cluster_plate(w, h, cx, cy, n=7000):
    """A globular cluster: 7,000 points, one per indexed book."""
    pts = rng.normal(0, 1, (n, 2)) * np.array([w * 0.11, h * 0.2])
    pts *= (rng.random((n, 1)) ** 0.9)  # concentrate toward the core
    pts += np.array([cx, cy])
    gray = np.zeros((h, w))
    xi, yi = pts[:, 0].astype(int), pts[:, 1].astype(int)
    ok = (xi >= 0) & (xi < w) & (yi >= 0) & (yi < h)
    np.add.at(gray, (yi[ok], xi[ok]), rng.uniform(0.12, 0.5, ok.sum()))
    yy, xx = np.mgrid[0:h, 0:w]
    core = np.exp(-(((xx - cx) / (w * 0.05)) ** 2 + ((yy - cy) / (h * 0.09)) ** 2))
    gray = np.clip(gray + 0.55 * core, 0, 1)
    idx = np.where(atkinson(gray), 2, 0).astype(np.uint8)
    idx[sky(h, w, 0.004) & (idx == 0)] = 2
    return idx


def transit_plate(w, h, cx, cy, R, px, py, pr):
    """A star with a planet crossing its face: how Kepler found exoplanets."""
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / R
    inside = d < 1
    mu = np.sqrt(np.clip(1 - d ** 2, 0, 1))
    limb = 1 - 0.62 * (1 - mu) - 0.18 * (1 - mu) ** 2      # quadratic limb darkening
    gran = fbm(np.stack([xx / 9.0, yy / 9.0, np.full_like(xx, 3.1)], -1), 3)
    gray = np.where(inside, limb * (0.82 + 0.3 * (gran - 0.5)), 0)
    corona = np.clip(1 - (d - 1) / 0.1, 0, 1) * (d >= 1) * 0.35
    gray = gray + corona
    planet = np.sqrt((xx - px) ** 2 + (yy - py) ** 2) < pr
    gray[planet] = 0
    bits = atkinson(np.clip(gray, 0, 1))
    idx = np.where(bits, 2, 0).astype(np.uint8)
    idx[(inside | planet) & ~bits] = 1
    idx[sky(h, w, 0.005) & ~inside & (idx == 0)] = 2
    return idx


def plates():
    meta = {}
    # flagship: wide
    W, H = 600, 250
    cx, cy, r = W * 0.68, H * 0.52, 96
    meta["restai"] = {
        "src": "plate-restai",
        "size": save("plate-restai", planet_plate(W, H, cx, cy, r, (-0.85, 0.35, 0.45), 1.7, cities=True)),
        "box": box(cx, cy, r, r, W, H, pad=1.12),
    }
    W, H = 320, 170
    jobs = {
        "storefy": dict(kind="planet", cx=W * 0.40, cy=H * 0.56, r=50, light=(0.75, 0.55, 0.45), seed=6.3,
                        moon=(W * 0.80, H * 0.28, 15, (0.75, 0.55, 0.45))),
        "text2sql": dict(kind="planet", cx=W * 0.52, cy=H * 0.55, r=56, light=(0.95, 0.15, 0.1), seed=2.2,
                         craters=True),
        "gesture": dict(kind="planet", cx=W * 0.58, cy=H * 0.5, r=48, light=(-0.3, 0.9, 0.45), seed=9.4),
        "books": dict(kind="cluster", cx=W * 0.5, cy=H * 0.52),
        "kepler": dict(kind="transit", cx=W * 0.5, cy=H * 0.55, R=58, px=W * 0.5 + 22, py=H * 0.55 - 9, pr=8),
    }
    for slug, j in jobs.items():
        k = j.pop("kind")
        if k == "planet":
            idx = planet_plate(W, H, j["cx"], j["cy"], j["r"], j["light"], j["seed"],
                               cities=False, craters=j.get("craters", False), moon=j.get("moon"))
            b = box(j["cx"], j["cy"], j["r"], j["r"], W, H)
        elif k == "cluster":
            idx = cluster_plate(W, H, j["cx"], j["cy"])
            b = box(j["cx"], j["cy"], W * 0.17, H * 0.3, W, H, pad=1.0)
        else:
            idx = transit_plate(W, H, j["cx"], j["cy"], j["R"], j["px"], j["py"], j["pr"])
            b = box(j["px"], j["py"], j["pr"], j["pr"], W, H, pad=1.9)
        meta[slug] = {"src": f"plate-{slug}", "size": save(f"plate-{slug}", idx), "box": b}
        print("plate", slug)
    return meta


# ------------------------------------------------------------ backdrop
def stars_tile():
    """Background tile: sparse 2px stars with a few 4px bright ones. Kept thin
    so it never competes with text."""
    w = h = 300
    idx = np.where(rng.random((h, w)) < 0.0012, 2, 0).astype(np.uint8)
    idx = np.kron(idx, np.ones((2, 2), np.uint8))
    for y, x in zip(*np.where(rng.random((h // 2, w // 2)) < 0.00035)):
        idx[4 * y: 4 * y + 4, 4 * x: 4 * x + 4] = 2
    return save("stars", idx, scale=1)


def horizon():
    W, H = 800, 170
    ex, ey, er = W * 0.76, 54, 22
    moon, minside, _ = render_planet(W, H, cx=W * 0.5, cy=H + 2010, r=2080, light=(0.35, 0.9, 0.25),
                                     craters=True, cities=False)
    earth, einside, _ = render_planet(W, H, cx=ex, cy=ey, r=er, light=(-0.9, 0.25, 0.4), seed_off=4.2,
                                      cities=False)
    gray = np.where(minside, moon, earth)
    inside = minside | einside
    idx = compose(gray, inside, stars=sky(H, W, 0.004))
    size = save("horizon", idx)
    return {"size": size, "box": box(ex, ey, er, er, W, H, pad=1.45)}


if __name__ == "__main__":
    jobs = sys.argv[1:] or ["plates", "stars", "horizon"]
    art = {}
    meta_file = SITE / "lib" / "space-art.json"
    if meta_file.exists():
        art = json.loads(meta_file.read_text())
    for j in jobs:
        if j == "plates":
            art["plates"] = plates()
        elif j == "stars":
            art["stars"] = {"size": stars_tile()}
        elif j == "horizon":
            art["horizon"] = horizon()
        print("done", j)
    meta_file.write_text(json.dumps(art, indent=2) + "\n")
