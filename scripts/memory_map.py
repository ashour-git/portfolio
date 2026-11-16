"""Project the copilot's memory (lib/index/vectors.json) to 2D for the site.

The copilot retrieves from 23 documents, each embedded by MiniLM into 384
numbers. This lays them out with t-SNE (cosine distance) so similar
documents sit near each other, and links every document to its two nearest
neighbours in the original 384-d space. Re-run after `npm run build:kb`:

    python scripts/memory_map.py

Writes lib/memory-map.json.
"""

import json
from pathlib import Path

import numpy as np
from sklearn.manifold import TSNE

ROOT = Path(__file__).resolve().parents[1]
vec = json.loads((ROOT / "lib/index/vectors.json").read_text(encoding="utf-8"))
meta = {c["id"]: c for c in json.loads((ROOT / "lib/index/meta.json").read_text(encoding="utf-8"))["chunks"]}

ids = vec["ids"]
X = np.asarray(vec["data"], dtype=np.float64)
X /= np.linalg.norm(X, axis=1, keepdims=True)
sim = X @ X.T

xy = TSNE(n_components=2, perplexity=5, metric="cosine", init="pca", random_state=7, max_iter=3000).fit_transform(X)
lo, hi = xy.min(0), xy.max(0)
lin = (xy - lo) / (hi - lo)
# blend with rank order so one far cluster (the Arabic docs) can't squeeze the rest
rank = np.argsort(np.argsort(xy, axis=0), axis=0) / (len(ids) - 1)
xy = 0.08 + 0.84 * (0.4 * lin + 0.6 * rank)

edges = set()
for i in range(len(ids)):
    order = np.argsort(-sim[i])
    for j in [int(k) for k in order if k != i][:2]:
        edges.add((min(i, j), max(i, j)))


def group(cid: str) -> str:
    if cid.startswith("project-"):
        return "project"
    if cid.startswith("ar-"):
        return "arabic"
    return "profile"


# label placement: greedy, projects first, avoid other labels and stars
W, H, CH = 600, 440, 7.9  # viewBox and approx mono glyph width at 13px


def box(x, y, side, text):
    w = len(text) * CH
    if side == "r": return (x + 8, y - 9, x + 9 + w, y + 6)
    if side == "l": return (x - 9 - w, y - 9, x - 8, y + 6)
    if side == "t": return (x - w / 2, y - 22, x + w / 2, y - 8)
    return (x - w / 2, y + 7, x + w / 2, y + 21)


def hit(a, b):
    return not (a[2] < b[0] or b[2] < a[0] or a[3] < b[1] or b[3] < a[1])


pts = [(xy[i, 0] * W, xy[i, 1] * H) for i in range(len(ids))]
labels = [(meta.get(c, {}).get("label") or c) for c in ids]
order = sorted(range(len(ids)), key=lambda i: (not ids[i].startswith("project-"), i))
placed, sides = [], {}
for i in order:
    x, y = pts[i]
    best, bestcost = "r", 1e9
    for side in ("r", "l", "t", "b"):
        b = box(x, y, side, labels[i])
        cost = sum(hit(b, o) for o in placed) * 10
        cost += sum(1 for j, (px, py) in enumerate(pts) if j != i and b[0] - 3 < px < b[2] + 3 and b[1] - 3 < py < b[3] + 3)
        cost += 20 * (b[0] < 0 or b[2] > W or b[1] < 0 or b[3] > H)
        if cost < bestcost:
            best, bestcost = side, cost
    sides[i] = best
    placed.append(box(x, y, best, labels[i]))

nodes = []
for i, cid in enumerate(ids):
    m = meta.get(cid, {})
    nodes.append({
        "id": cid,
        "label": m.get("label") or cid,
        "title": m.get("title") or cid,
        "group": group(cid),
        "side": sides[i],
        "x": round(float(xy[i, 0]), 4),
        "y": round(float(xy[i, 1]), 4),
    })

out = {
    "model": "all-MiniLM-L6-v2",
    "dim": int(X.shape[1]),
    "nodes": nodes,
    "edges": [[i, j, round(float(sim[i, j]), 3)] for i, j in sorted(edges)],
}
(ROOT / "lib/memory-map.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(len(nodes), "nodes,", len(out["edges"]), "edges")
