"""
Motor de pixel art do ShootUp!: formas analíticas -> sprite sombreado e contornado.

Cada parte (capsula, poligono, elipse) vira uma mascara; o volume vem de um
mapa de altura (distancia ate a borda) iluminado do alto a esquerda e
quantizado numa rampa de cores da paleta. Depois: sombra projetada entre
partes, linha interna na parte de tras, contorno externo tingido.
Uso: init(w, h) antes de desenhar um quadro.
"""
import math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

BAYER = np.array([[0.0, 0.5], [0.75, 0.25]])
W = H = 0
YY = XX = PX = PY = BAY = None


def init(w, h):
    """Define o tamanho do quadro (todas as funcoes usam estes globais)."""
    global W, H, YY, XX, PX, PY, BAY
    W, H = w, h
    YY, XX = np.mgrid[0:H, 0:W]
    PX = XX + 0.5
    PY = YY + 0.5
    BAY = BAYER[YY % 2, XX % 2]

LIGHT = np.array([-0.55, -0.7, 0.55])
LIGHT = LIGHT / np.linalg.norm(LIGHT)


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def ramp(*hs):
    return [hexc(h) for h in hs]


# ---------- shapes ----------
def capsule(a, b, ra, rb=None):
    rb = ra if rb is None else rb
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    l2 = dx * dx + dy * dy or 1e-6
    t = np.clip(((PX - ax) * dx + (PY - ay) * dy) / l2, 0, 1)
    cx = ax + t * dx
    cy = ay + t * dy
    r = ra + (rb - ra) * t
    return (PX - cx) ** 2 + (PY - cy) ** 2 <= r * r


def poly(pts):
    img = Image.new('L', (W, H), 0)
    ImageDraw.Draw(img).polygon([(float(x), float(y)) for x, y in pts], fill=255)
    return np.array(img) > 0


def ellipse(c, rx, ry, ang=0.0):
    cx, cy = c
    ca, sa = math.cos(ang), math.sin(ang)
    x = PX - cx
    y = PY - cy
    u = x * ca + y * sa
    v = -x * sa + y * ca
    return (u / rx) ** 2 + (v / ry) ** 2 <= 1.0


def union(*ms):
    out = np.zeros((H, W), bool)
    for m in ms:
        out |= m
    return out


def rot(p, ang, origin=(0, 0)):
    x, y = p[0] - origin[0], p[1] - origin[1]
    c, s = math.cos(ang), math.sin(ang)
    return (origin[0] + x * c - y * s, origin[1] + x * s + y * c)


def add(p, d, k=1.0):
    return (p[0] + d[0] * k, p[1] + d[1] * k)


def polar(p, length, ang):
    """ang measured from straight down, positive = toward +x (forward)."""
    return (p[0] + length * math.sin(ang), p[1] + length * math.cos(ang))


def ik(hip, ankle, l1, l2, bend=1):
    dx, dy = ankle[0] - hip[0], ankle[1] - hip[1]
    d = math.hypot(dx, dy)
    d = min(max(d, 1e-3), l1 + l2 - 0.05)
    base = math.atan2(dy, dx)
    c = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
    a = math.acos(max(-1, min(1, c)))
    k1 = (hip[0] + l1 * math.cos(base + a), hip[1] + l1 * math.sin(base + a))
    k2 = (hip[0] + l1 * math.cos(base - a), hip[1] + l1 * math.sin(base - a))
    return k1 if (k1[0] - k2[0]) * bend > 0 else k2


# ---------- parts ----------
class Part:
    def __init__(self, mask, rmp, group=None, R=3.0, bias=0.0, dither=0.0,
                 grad=(0.0, 0.0), shift=0, tex=None, lines=True, k=2.4, shadow=True):
        self.mask = mask
        self.ramp = rmp
        self.group = group
        self.R = R
        self.bias = bias
        self.dither = dither
        self.grad = grad
        self.shift = shift
        self.tex = tex
        self.lines = lines
        self.k = k
        self.shadow = shadow


def shade(p):
    m = p.mask
    n = len(p.ramp)
    if not m.any():
        return np.zeros((H, W), int)
    d = ndimage.distance_transform_edt(np.pad(m, 1))[1:-1, 1:-1]
    h = np.sqrt(np.minimum(d, p.R) / p.R)
    h = ndimage.gaussian_filter(h, 0.7)
    gy, gx = np.gradient(h)
    nx, ny, nz = -gx * p.k, -gy * p.k, np.ones_like(h)
    ln = np.sqrt(nx * nx + ny * ny + nz * nz)
    I = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / ln
    ys, xs = np.nonzero(m)
    cx, cy = xs.mean(), ys.mean()
    w = max(xs.max() - xs.min(), 1)
    hh = max(ys.max() - ys.min(), 1)
    I = I - p.grad[0] * (PX - cx) / w - p.grad[1] * (PY - cy) / hh
    lv = I / 0.92 * (n - 1) + p.bias
    lv = lv + (BAY - 0.375) * p.dither
    idx = np.floor(lv + 0.5).astype(int) + p.shift
    idx = np.clip(idx, 0, n - 1)
    if p.tex is not None:
        idx = p.tex(idx, m)
        idx = np.clip(idx, 0, n - 1)
    return idx


def render(parts, decals=(), outline_tint=(18, 8, 30), outline_k=0.35, rim=None):
    pid = -np.ones((H, W), int)
    idx = np.zeros((H, W), int)
    for i, p in enumerate(parts):
        si = shade(p)
        pid[p.mask] = i
        idx[p.mask] = si[p.mask]
    grp = [p.group if p.group is not None else i for i, p in enumerate(parts)]

    # cast shadow from parts in front (light from upper left)
    sh = np.roll(np.roll(pid, 1, 0), 1, 1)
    sh2 = np.roll(pid, 2, 0)
    out = idx.copy()
    for src in (sh, sh2):
        cond = (pid >= 0) & (src > pid)
        for y, x in zip(*np.nonzero(cond)):
            a, b = pid[y, x], src[y, x]
            if grp[a] != grp[b] and parts[a].shadow:
                out[y, x] = idx[y, x] - 1
    idx = np.maximum(out, 0)
    # interior lines: edge of the part behind
    lined = idx.copy()
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        nb = np.roll(np.roll(pid, dy, 0), dx, 1)
        cond = (pid >= 0) & (nb > pid)
        for y, x in zip(*np.nonzero(cond)):
            a, b = pid[y, x], nb[y, x]
            if grp[a] != grp[b] and parts[a].lines:
                lined[y, x] = 0
    idx = lined

    img = np.zeros((H, W, 4), np.uint8)
    for i, p in enumerate(parts):
        sel = pid == i
        if not sel.any():
            continue
        r = np.array(p.ramp)
        img[sel, :3] = r[idx[sel]]
        img[sel, 3] = 255
    for (x, y, c) in decals:
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H:
            img[y, x, :3] = c
            img[y, x, 3] = 255
    opaque = img[:, :, 3] > 0
    if rim is not None:
        col, alpha = rim
        edge = opaque & ~np.roll(opaque, 1, 1)
        edge &= np.roll(opaque, -1, 1)
        img[edge, :3] = (img[edge, :3] * (1 - alpha) + np.array(col) * alpha).astype(np.uint8)
    # outer outline, tinted by neighbour colour
    ol = np.zeros((H, W, 3), float)
    cnt = np.zeros((H, W))
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        nb_o = np.roll(np.roll(opaque, dy, 0), dx, 1)
        nb_c = np.roll(np.roll(img[:, :, :3], dy, 0), dx, 1)
        sel = ~opaque & nb_o
        ol[sel] += nb_c[sel]
        cnt[sel] += 1
    sel = cnt > 0
    col = ol[sel] / cnt[sel][:, None]
    col = col * outline_k + np.array(outline_tint) * (1 - outline_k)
    img[sel, :3] = col.astype(np.uint8)
    img[sel, 3] = 255
    return Image.fromarray(img, 'RGBA')


def pattern(rows, origin, cmap):
    """Stamp a small hand-drawn pixel grid. '.' = skip."""
    ox, oy = int(round(origin[0])), int(round(origin[1]))
    out = []
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch in cmap:
                out.append((ox + i, oy + j, cmap[ch]))
    return out
