"""Bangun dua atlas maskot (arah kepala dan ekspresi) dari satu gambar: public/maskot.png.

    python3 scripts/build-mascot.py

Wajah (mata, alis, hidung, mulut, pipi) dipisahkan dari badan. Sheet arah menggeser wajah
di dalam kepala, sheet ekspresi menggambar ulang mata dan mulut. Badan sama persis di
semua sel, jadi maskot tidak melompat saat atlas berganti.
Hasil: public/mascots/mindo-directions.webp dan mindo-reactions.webp
"""
import math
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SRC = "public/maskot.png"
DEST = "public/mascots"
TILE = 360
CANVAS = 560
SS = 4

OUT = (4, 88, 122, 255)
WHITE = (255, 255, 255, 255)
BLUSH = (245, 130, 155, 255)
HATCH = (214, 84, 116, 255)
HOT = (255, 92, 130, 255)
YEL = (255, 208, 51, 255)
FILLS = np.array([[40, 196, 255], [31, 175, 229]], dtype=float)

CX = 249
EYE_L, EYE_R = (187.5, 207.5), (307.5, 207.5)

src = Image.open(SRC).convert("RGBA")
W, H = src.size
rgb = np.array(src)[..., :3].astype(float)
alpha = np.array(src)[..., 3]

# ---- 1. cari fitur wajah -------------------------------------------------
yy, xx = np.mgrid[0:H, 0:W]
inside = ((xx - 249) / 158.0) ** 2 + ((yy - 221) / 126.0) ** 2 < 1
dist = np.min(np.linalg.norm(rgb[..., None, :] - FILLS, axis=3), axis=2)
feature = inside & (alpha > 128) & (dist > 40) & (yy > 150) & (yy < 325)
feature = ndimage.binary_opening(feature, iterations=1) | (feature & (dist > 120))
labels, n = ndimage.label(feature, structure=np.ones((3, 3)))

parts = {}
for i in range(1, n + 1):
    m = labels == i
    if m.sum() < 60:
        continue
    ys, xs = np.where(m)
    cx, cy = xs.mean(), ys.mean()
    if cy < 192:
        key = "browL" if cx < CX else "browR"
    elif cy < 235 and abs(cx - CX) > 40:
        key = "eyeL" if cx < CX else "eyeR"
    elif abs(cx - CX) < 70:
        key = "nosemouth"
    else:
        key = "cheekL" if cx < CX else "cheekR"
    parts[key] = parts.get(key, np.zeros_like(m)) | m
missing = {"browL", "browR", "eyeL", "eyeR", "nosemouth", "cheekL", "cheekR"} - set(parts)
assert not missing, f"fitur tidak ditemukan: {missing}"

# ---- 2. badan tanpa wajah ------------------------------------------------
all_feat = np.zeros((H, W), bool)
for m in parts.values():
    all_feat |= m
hole = ndimage.binary_dilation(all_feat, iterations=6)

# Kulit kepala: dua warna datar dengan batas bayangan melengkung. Batasnya dibaca dari
# piksel di luar lubang, lalu diinterpolasi melintasi lubang.
nearest = np.argmin(np.linalg.norm(rgb[..., None, :] - FILLS, axis=3), axis=2)
skin = ((xx - 249) / 163.0) ** 2 + ((yy - 221) / 131.0) ** 2 < 1
edge = np.full(W, np.nan)
for x in range(W):
    col = np.where(skin[:, x] & ~hole[:, x] & (nearest[:, x] == 1) & (dist[:, x] < 25) & (yy[:, x] > 225))[0]
    if len(col):
        edge[x] = col.min()
ok = ~np.isnan(edge)
edge = np.interp(np.arange(W), np.where(ok)[0], edge[ok])
edge = ndimage.median_filter(edge, size=9)
shade = yy >= edge[None, :]
patch = np.where(shade[..., None], FILLS[1], FILLS[0]).astype(np.uint8)
base_arr = np.array(src)
base_arr[hole, :3] = patch[hole]
base = Image.fromarray(base_arr, "RGBA")


def sprite(mask, y0=None, y1=None):
    """Potong satu fitur dari gambar asli, alpha dari jaraknya ke warna kulit."""
    m = mask.copy()
    if y0 is not None:
        m[:y0] = False
    if y1 is not None:
        m[y1:] = False
    zone = ndimage.binary_dilation(m, iterations=3)
    a = np.clip((dist - 15) / 55.0, 0, 1) * zone
    a = np.maximum(a, ndimage.binary_erosion(m, iterations=1))
    ys, xs = np.where(zone & (a > 0))
    x0, x1, y0b, y1b = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    out = np.dstack([np.array(src)[..., :3], (a * 255).astype(np.uint8)])
    img = Image.fromarray(out, "RGBA").crop((x0, y0b, x1, y1b))
    return img, ((x0 + x1) / 2, (y0b + y1b) / 2)


SP = {k: sprite(v) for k, v in parts.items() if k != "nosemouth"}
SP["nose"] = sprite(parts["nosemouth"], None, 252)
SP["mouth"] = sprite(parts["nosemouth"], 252, None)


def place(canvas, key, dx=0.0, dy=0.0, sx=1.0, sy=1.0, around=CX):
    img, (cx, cy) = SP[key]
    if sx != 1.0 or sy != 1.0:
        img = img.resize((max(1, round(img.width * sx)), max(1, round(img.height * sy))), Image.LANCZOS)
    nx = around + (cx - around) * (1.0 if key.startswith("cheek") else sx) + dx
    ny = cy + dy
    canvas.alpha_composite(img, (round(nx - img.width / 2), round(ny - img.height / 2)))


def overlay(fn):
    big = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    fn(d)
    return big.resize((W, H), Image.LANCZOS)


def P(*pts):
    return [(x * SS, y * SS) for x, y in pts]


def line(d, pts, w, fill=OUT):
    d.line(P(*pts), fill=fill, width=round(w * SS), joint="curve")
    for x, y in (pts[0], pts[-1]):
        r = w / 2
        d.ellipse(P((x - r, y - r), (x + r, y + r)), fill=fill)


def arc_eye(d, c, up):
    """Mata tertutup: busur cembung ke atas (senang) atau ke bawah (tidur/kedip)."""
    pts = []
    for t in np.linspace(0, 1, 24):
        x = c[0] - 26 + 52 * t
        bend = 18 * math.sin(math.pi * t)
        pts.append((x, c[1] + 8 - bend if up else c[1] - 8 + bend))
    line(d, pts, 9)


def heart_pts(cx, cy, size):
    pts = []
    for t in np.linspace(0, 2 * math.pi, 80):
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * size / 34, cy + y * size / 34))
    return pts


def heart(d, cx, cy, size):
    d.polygon(P(*heart_pts(cx, cy, size + 7)), fill=OUT)
    d.polygon(P(*heart_pts(cx, cy, size)), fill=HOT)


def star_pts(cx, cy, r):
    pts = []
    for i in range(8):
        rad = r if i % 2 == 0 else r * 0.32
        a = math.pi / 4 * i - math.pi / 2
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return pts


def star(d, cx, cy, r, fill=YEL, outline=True):
    if outline:
        d.polygon(P(*star_pts(cx, cy, r + 5)), fill=OUT)
    d.polygon(P(*star_pts(cx, cy, r)), fill=fill)


def zed(d, x, y, s):
    line(d, [(x - s, y - s), (x + s, y - s), (x - s, y + s), (x + s, y + s)], max(5, s / 3))


def spiral_eye(d, c):
    d.ellipse(P((c[0] - 29, c[1] - 29), (c[0] + 29, c[1] + 29)), fill=OUT)
    d.ellipse(P((c[0] - 23, c[1] - 23), (c[0] + 23, c[1] + 23)), fill=WHITE)
    pts = []
    for t in np.linspace(0, 1, 90):
        a = t * 2.6 * 2 * math.pi
        r = 3 + 19 * t
        pts.append((c[0] + r * math.cos(a), c[1] + r * math.sin(a)))
    line(d, pts, 4.5)


def open_mouth(d, rx=32, ry=34, top=268, teeth=True):
    cy = top
    d.pieslice(P((CX - rx, cy - ry), (CX + rx, cy + ry)), 0, 180, fill=OUT)
    d.ellipse(P((CX - 15, cy + 15), (CX + 15, cy + 33)), fill=(247, 172, 176, 255))
    d.rectangle(P((CX - rx, cy - ry), (CX + rx, cy - 1)), fill=(0, 0, 0, 0))
    d.rectangle(P((CX - 3, 250), (CX + 3, top + 4)), fill=OUT)
    if teeth:
        d.polygon(P((CX - 24, cy + 1), (CX - 12, cy + 1), (CX - 18, cy + 14)), fill=WHITE)
        d.polygon(P((CX + 12, cy + 1), (CX + 24, cy + 1), (CX + 18, cy + 14)), fill=WHITE)


def round_mouth(d):
    d.rectangle(P((CX - 3, 250), (CX + 3, 270)), fill=OUT)
    d.ellipse(P((CX - 17, 266), (CX + 17, 312)), fill=OUT)
    d.ellipse(P((CX - 10, 290), (CX + 10, 304)), fill=(247, 172, 176, 255))


# ---- 3. sheet arah -------------------------------------------------------
DIRS = [(-1, -1), (0, -1), (1, -1), (-1, 0), (0, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


def direction_frame(fx, fy):
    f = base.copy()
    sq = 1 - 0.07 * abs(fx)
    k = {"eyeL": 1.0, "eyeR": 1.0, "browL": 1.0, "browR": 1.0,
         "nose": 1.15, "mouth": 1.0, "cheekL": 0.7, "cheekR": 0.7}
    for key, p in k.items():
        place(f, key, dx=fx * 26 * p, dy=fy * 18 * p, sx=sq)
    return f


# ---- 4. sheet ekspresi ---------------------------------------------------
def frame_with(eyes, brows=(0, 0), mouth="normal", extra=None, cheeks="normal"):
    f = base.copy()
    for key in ("browL", "browR"):
        place(f, key, dy=brows[0] if key == "browL" else brows[1])
    place(f, "nose")
    if mouth == "normal":
        place(f, "mouth")
    if cheeks == "normal":
        place(f, "cheekL")
        place(f, "cheekR")
    if eyes == "open":
        place(f, "eyeL")
        place(f, "eyeR")
    elif eyes == "big":
        place(f, "eyeL", sx=1.22, sy=1.22)
        place(f, "eyeR", sx=1.22, sy=1.22)
    elif eyes == "down":
        place(f, "eyeL", dy=9)
        place(f, "eyeR", dy=9)
    elif eyes == "wink":
        place(f, "eyeL")
    elif eyes == "shine":
        place(f, "eyeL")
        place(f, "eyeR")

    def layer(d):
        if eyes in ("closed",):
            arc_eye(d, EYE_L, False)
            arc_eye(d, EYE_R, False)
        elif eyes == "happy":
            arc_eye(d, EYE_L, True)
            arc_eye(d, EYE_R, True)
        elif eyes == "wink":
            arc_eye(d, EYE_R, False)
        elif eyes == "hearts":
            heart(d, EYE_L[0], EYE_L[1] + 2, 52)
            heart(d, EYE_R[0], EYE_R[1] + 2, 52)
        elif eyes == "spiral":
            spiral_eye(d, EYE_L)
            spiral_eye(d, EYE_R)
        elif eyes == "shine":
            for c in (EYE_L, EYE_R):
                star(d, c[0] + 9, c[1] - 9, 11, fill=WHITE, outline=False)
        if mouth == "open":
            open_mouth(d)
        elif mouth == "round":
            round_mouth(d)
        if cheeks == "deep":
            for cx in (133, 365):
                d.ellipse(P((cx - 21, 233), (cx + 21, 270)), fill=BLUSH)
                for i in range(3):
                    x = cx - 12 + i * 11
                    line(d, [(x + 3, 242), (x - 3, 262)], 2.6, HATCH)
        if extra:
            extra(d)

    f.alpha_composite(overlay(layer))
    return f


def sparkles(d):
    star(d, 232, 52, 17)
    star(d, 282, 30, 12)
    star(d, 276, 66, 8)


def hearts_up(d):
    heart(d, 249, 46, 36)


def zzz(d):
    zed(d, 268, 62, 11)
    zed(d, 302, 30, 14)


FRAMES = [
    frame_with("closed"),
    frame_with("hearts", extra=hearts_up),
    frame_with("shine", extra=sparkles),
    frame_with("big", brows=(-14, -14), mouth="round"),
    frame_with("wink"),
    frame_with("down", brows=(5, 5), cheeks="deep"),
    frame_with("closed", brows=(6, 6), extra=zzz),
    frame_with("spiral"),
    frame_with("happy", mouth="open"),
]

# ---- 5. tulis atlas ------------------------------------------------------
ox, oy = (CANVAS - W) // 2, 14


def to_tile(frame):
    c = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    c.alpha_composite(frame, (ox, oy))
    return c.resize((TILE, TILE), Image.LANCZOS)


os.makedirs(DEST, exist_ok=True)
for name, frames in (("directions", [direction_frame(*d) for d in DIRS]), ("reactions", FRAMES)):
    atlas = Image.new("RGBA", (TILE * 3, TILE * 3), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        atlas.paste(to_tile(fr), ((i % 3) * TILE, (i // 3) * TILE))
    path = os.path.join(DEST, f"mindo-{name}.webp")
    atlas.save(path, quality=92, method=6)
    atlas.save(os.path.join("scripts", f"_preview-{name}.png"))
    print(path, os.path.getsize(path) // 1024, "KB")
