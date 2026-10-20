"""
Cenário de Ocean Drive em pixel art desenhado à mão (por código), no mesmo
nível de detalhe do elenco.

Gera o fundo estático inteiro (céu, sol, nuvens, mar, praia, prédios art
déco, palmeiras, postes e a mureta) numa textura de 1296×800 que cobre a
maior janela suportada: x da textura = x do mundo + 48, y = y do mundo + 78.
O chão em grade e o neon do relevo continuam no jogo (dependem do terreno).

Regras de leitura: a metade de cima (onde os vilões descem) fica escura e
calma; o contraste forte mora perto do horizonte, longe da ação.
"""
import math

import numpy as np
from PIL import Image, ImageDraw

W, H = 1296, 800
OX, OY = 48, 78           # deslocamento mundo -> textura
HORIZON = 352 + OY        # 430
WALL = 434 + OY           # 512: topo da mureta do calçadão
SUN = (600 + OX, 372 + OY, 152)
SEA_L, SEA_R = 432, 864   # faixa de mar visível entre os quarteirões

B4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def hx(c):
    if isinstance(c, tuple):
        return c
    return ((c >> 16) & 255, (c >> 8) & 255, c & 255)


def mix(a, b, t):
    a, b = hx(a), hx(b)
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def ramp(*cs):
    return [hx(c) for c in cs]


def bay(x, y):
    return B4[y % 4, x % 4]


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.a = np.zeros((h, w, 4), np.uint8)

    def pset(self, x, y, c, alpha=1.0):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            c = hx(c)
            if alpha >= 1:
                self.a[y, x] = (*c, 255)
            else:
                old = self.a[y, x, :3].astype(float)
                self.a[y, x, :3] = (old + (np.array(c) - old) * alpha).astype(np.uint8)
                self.a[y, x, 3] = max(self.a[y, x, 3], int(255 * alpha))

    def rect(self, x, y, w, h, c):
        x0, y0 = max(0, int(round(x))), max(0, int(round(y)))
        x1, y1 = min(self.w, int(round(x + w))), min(self.h, int(round(y + h)))
        if x1 > x0 and y1 > y0:
            self.a[y0:y1, x0:x1] = (*hx(c), 255)

    def hline(self, x0, x1, y, c):
        self.rect(x0, y, x1 - x0, 1, c)

    def vline(self, x, y0, y1, c):
        self.rect(x, y0, 1, y1 - y0, c)

    def fill(self, mask, c):
        self.a[mask] = (*hx(c), 255)

    def poly_mask(self, pts):
        img = Image.new('L', (self.w, self.h), 0)
        ImageDraw.Draw(img).polygon([(float(x), float(y)) for x, y in pts], fill=255)
        return np.array(img) > 0

    def line(self, x0, y0, x1, y1, c, thick=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / max(1, n)
            x = x0 + (x1 - x0) * t
            y = y0 + (y1 - y0) * t
            if thick == 1:
                self.pset(x, y, c)
            else:
                self.rect(round(x - thick / 2), round(y - thick / 2), thick, thick, c)

    def ellipse_mask(self, cx, cy, rx, ry):
        yy, xx = np.mgrid[0:self.h, 0:self.w]
        return ((xx + 0.5 - cx) / rx) ** 2 + ((yy + 0.5 - cy) / ry) ** 2 <= 1

    def vgrad(self, x, y, w, h, cols):
        """Degradê vertical em faixas com transição pontilhada (Bayer 4×4)."""
        n = len(cols) - 1
        for yy in range(int(y), int(y + h)):
            t = (yy - y) / max(1, h - 1) * n
            i = min(n - 1, int(t))
            f = t - i
            for xx in range(max(0, int(x)), min(self.w, int(x + w))):
                self.a[yy, xx] = (*hx(cols[i + 1] if bay(xx, yy) < f else cols[i]), 255)

    def save(self, path):
        Image.fromarray(self.a, 'RGBA').save(path)


# ---------------------------------------------------------------- fonte 3×5
FONT = {
    'A': ['.#.', '#.#', '###', '#.#', '#.#'], 'B': ['##.', '#.#', '##.', '#.#', '##.'],
    'C': ['.##', '#..', '#..', '#..', '.##'], 'D': ['##.', '#.#', '#.#', '#.#', '##.'],
    'E': ['###', '#..', '##.', '#..', '###'], 'F': ['###', '#..', '##.', '#..', '#..'],
    'G': ['.##', '#..', '#.#', '#.#', '.##'], 'H': ['#.#', '#.#', '###', '#.#', '#.#'],
    'I': ['###', '.#.', '.#.', '.#.', '###'], 'K': ['#.#', '#.#', '##.', '#.#', '#.#'],
    'L': ['#..', '#..', '#..', '#..', '###'], 'M': ['#.#', '###', '###', '#.#', '#.#'],
    'N': ['##.', '#.#', '#.#', '#.#', '#.#'], 'O': ['.#.', '#.#', '#.#', '#.#', '.#.'],
    'P': ['##.', '#.#', '##.', '#..', '#..'], 'R': ['##.', '#.#', '##.', '#.#', '#.#'],
    'S': ['.##', '#..', '.#.', '..#', '##.'], 'T': ['###', '.#.', '.#.', '.#.', '.#.'],
    'U': ['#.#', '#.#', '#.#', '#.#', '###'], 'V': ['#.#', '#.#', '#.#', '#.#', '.#.'],
    'W': ['#.#', '#.#', '###', '###', '#.#'], 'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
    'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'], 'Z': ['###', '..#', '.#.', '#..', '###'],
    '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['##.', '..#', '.#.', '#..', '###'], '4': ['#.#', '#.#', '###', '..#', '..#'],
    '!': ['.#.', '.#.', '.#.', '...', '.#.'], ' ': ['...', '...', '...', '...', '...'],
    '$': ['.##', '##.', '.#.', '.##', '##.'], '.': ['...', '...', '...', '...', '.#.'],
    '-': ['...', '...', '###', '...', '...'], '&': ['.#.', '#.#', '.#.', '#.#', '.##'],
}


def text(cv, x, y, s, c, scale=1, glow=None):
    cx = x
    for ch in s:
        g = FONT.get(ch, FONT[' '])
        for j, row in enumerate(g):
            for i, v in enumerate(row):
                if v == '#':
                    if glow:
                        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                            px, py = cx + i * scale + dx, y + j * scale + dy
                            if 0 <= px < cv.w and 0 <= py < cv.h and cv.a[py, px, 3] and \
                                    tuple(cv.a[py, px, :3]) != hx(c):
                                cv.pset(px, py, glow, 0.6)
                    cv.rect(cx + i * scale, y + j * scale, scale, scale, c)
        cx += 4 * scale
    return cx - x


def vtext(cv, x, y, s, c, glow=None):
    for k, ch in enumerate(s):
        text(cv, x, y + k * 6, ch, c, 1, glow)


# ---------------------------------------------------------------- céu
SKY = [0x0b0322, 0x100428, 0x150632, 0x1c073c, 0x260a4a, 0x320d58, 0x441264, 0x5c166e, 0x7a1b76, 0x9c2380,
       0xc02e7c, 0xe24474, 0xf6646a]


def sky(cv):
    cv.vgrad(0, 0, W, HORIZON, SKY)
    rng = np.random.default_rng(7)
    for _ in range(170):
        x, y = int(rng.integers(0, W)), int(rng.integers(0, 250))
        k = rng.random()
        cv.pset(x, y, 0xfff0fa if k > 0.92 else 0xb59ae8 if k > 0.6 else 0x6c58b0)
    for x, y in ((90, 40), (350, 90), (700, 30), (1010, 70), (1230, 140), (520, 160), (160, 190)):
        cv.pset(x, y, 0xffffff)
        for d in (1, 2):
            a = 0xc8b0ff if d == 1 else 0x6a4ab0
            for dx, dy in ((d, 0), (-d, 0), (0, d), (0, -d)):
                cv.pset(x + dx, y + dy, a)


def clouds(cv):
    """Estratos de nuvem iluminados por baixo pelo sol (rosa/laranja na base)."""
    banks = [
        # (x, y, comprimento, espessura, semente)
        (-40, 236, 420, 10, 1), (900, 222, 460, 12, 2), (330, 282, 260, 7, 3), (760, 296, 300, 8, 4),
        (40, 330, 300, 9, 5), (980, 340, 360, 9, 6), (470, 388, 190, 5, 7), (660, 398, 170, 4, 8),
    ]
    yy, xx = np.mgrid[0:H, 0:W]
    for x0, y0, length, th, seed in banks:
        rng = np.random.default_rng(seed)
        m = np.zeros((H, W), bool)
        n = max(4, length // 22)
        for i in range(n):
            cx = x0 + (i + 0.5) * length / n + rng.uniform(-8, 8)
            cy = y0 + rng.uniform(-th * 0.3, th * 0.2)
            rx = length / n * rng.uniform(0.9, 1.4)
            ry = th * rng.uniform(0.9, 1.4)
            m |= ((xx + 0.5 - cx) / rx) ** 2 + ((yy + 0.5 - cy) / ry) ** 2 <= 1
            # bolotas por cima (cúmulos)
            if rng.random() < 0.6:
                bx = cx + rng.uniform(-rx * 0.4, rx * 0.4)
                br = th * rng.uniform(0.8, 1.5)
                m |= ((xx + 0.5 - bx) / (br * 1.5)) ** 2 + ((yy + 0.5 - (cy - th * 0.5)) / br) ** 2 <= 1
        m[:, :] &= ((yy + 0.5) < y0 + th * 0.7)  # base reta, como estrato
        m &= yy < HORIZON
        ys, xs = np.nonzero(m)
        if len(ys) == 0:
            continue
        top = ys.min()
        bot = ys.max()
        near = 1 - min(1, abs(y0 - (HORIZON - 40)) / 220)  # perto do sol = mais quente
        dark = mix(0x2a0c4a, 0x5a1a64, near)
        mid = mix(0x4a1462, 0xa03478, near)
        lit = mix(0x8a2a7a, 0xff7a6a, near)
        hot = mix(0xc04a8a, 0xffc070, near)
        for y, x in zip(ys, xs):
            # luz vem de baixo: compara com a borda inferior local
            below = not m[min(H - 1, y + 2), x]
            below1 = not m[min(H - 1, y + 1), x]
            above = not m[max(0, y - 1), x]
            t = (y - top) / max(1, bot - top)
            below3 = not m[min(H - 1, y + 3), x]
            if below1:
                c = hot
            elif below:
                c = lit
            elif below3:
                c = lit if bay(x, y) < 0.5 else mid
            elif above:
                c = mix(dark, mid, 0.5)
            else:
                c = mid if bay(x, y) < t * 1.1 + 0.15 else dark
            cv.pset(x, y, c)


def sun(cv):
    cx, cy, r = SUN
    rampc = [0xfff0a0, 0xffd070, 0xffac5c, 0xff8460, 0xff5a76, 0xff3a90]
    for y in range(int(cy - r - 14), HORIZON):
        for x in range(int(cx - r - 14), int(cx + r + 15)):
            d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
            if d > r:
                if d < r + 5 and bay(x, y) < 0.45:
                    cv.pset(x, y, 0xff5aa0, 0.35)
                elif d < r + 13 and bay(x, y) < 0.18:
                    cv.pset(x, y, 0xff5aa0, 0.25)
                continue
            below = y - (cy - r * 0.3)
            if below > 0 and below % 13 < 2 + below / 14:
                continue
            t = (y - (cy - r)) / (r * 1.6) * (len(rampc) - 1)
            i = min(len(rampc) - 2, max(0, int(t)))
            f = min(1, t - i)
            c = rampc[i + 1] if bay(x, y) < f else rampc[i]
            # brilho no alto à esquerda
            if d > r - 4 and (x - cx) + (y - cy) < -r * 0.9 and bay(x, y) < 0.6:
                c = 0xfff8d8
            cv.pset(x, y, c)


def skyline(cv):
    """Silhuetas distantes nas frestas entre o sol e os quarteirões."""
    rng = np.random.default_rng(11)
    x = 0
    while x < W:
        w = int(rng.integers(14, 36))
        h = int(rng.integers(16, 64))
        if abs(x + w / 2 - SUN[0]) > SUN[2] + 6:
            cv.rect(x, HORIZON - h, w, h, 0x3a0f58)
            cv.hline(x, x + w, HORIZON - h, 0x5c1a6c)
            cv.vline(x + w - 1, HORIZON - h, HORIZON, 0x2c0a48)
            for wy in range(HORIZON - h + 4, HORIZON - 2, 5):
                for wx in range(x + 2, x + w - 2, 4):
                    if rng.random() < 0.18:
                        cv.pset(wx, wy, 0xffc070 if rng.random() < 0.7 else 0x6af0ff)
            if rng.random() < 0.35:
                ax = x + w // 2
                cv.vline(ax, HORIZON - h - 10, HORIZON - h, 0x3a0f58)
                cv.pset(ax, HORIZON - h - 11, 0xff4060)
        x += w + int(rng.integers(0, 6))


# ---------------------------------------------------------------- mar e praia
def sea(cv):
    cv.vgrad(0, HORIZON, W, WALL - HORIZON, [0x4a1678, 0x3a1070, 0x2c0c5e, 0x220a4c, 0x1a0840])
    cx = SUN[0]
    rng = np.random.default_rng(3)
    # reflexo do sol em traços quebrados
    for i in range(13):
        y = HORIZON + 3 + i * 5
        half = 132 - i * 8 + (i % 2) * 12
        col = 0xfff0a0 if i < 2 else 0xffb060 if i < 5 else 0xff70b0 if i < 9 else 0xb84898
        x = cx - half
        while x < cx + half:
            seg = int(rng.integers(3, 14))
            gap = int(rng.integers(2, 7))
            cv.hline(x, x + seg, y, col)
            if i < 6 and seg > 6:
                cv.hline(x + 1, x + seg - 1, y - 1, mix(col, 0x4a1678, 0.55))
            x += seg + gap
    # ondinhas espalhadas
    for _ in range(260):
        x = int(rng.integers(0, W))
        y = int(rng.integers(HORIZON + 4, WALL - 18))
        d = (y - HORIZON) / (WALL - HORIZON)
        ln = int(2 + d * 7)
        cv.hline(x, x + ln, y, mix(0x6a2aa0, 0xa04aa8, rng.random() * 0.6))
    cv.hline(0, W, HORIZON, 0xffb8dc)
    cv.hline(0, W, HORIZON + 1, 0xb02a88)


def sailboat(cv, x, y, s=1.0):
    sail = cv.poly_mask([(x, y - 30 * s), (x, y - 2), (x + 18 * s, y - 2)])
    sail2 = cv.poly_mask([(x - 2, y - 24 * s), (x - 2, y - 2), (x - 12 * s, y - 2)])
    cv.fill(sail, 0x2a0a40)
    cv.fill(sail2, 0x220836)
    cv.vline(x, y - 31 * s, y, 0x14041f)
    hull = cv.poly_mask([(x - 14 * s, y - 2), (x + 20 * s, y - 2), (x + 15 * s, y + 3), (x - 10 * s, y + 3)])
    cv.fill(hull, 0x14041f)
    # contraluz no lado do sol
    for yy in range(int(y - 29 * s), int(y - 2)):
        t = (yy - (y - 30 * s)) / (28 * s)
        cv.pset(x + int(18 * s * t) - 1, yy, 0xff8a9a)
    cv.hline(x - 13 * s, x + 20 * s, y - 2, 0xff8a9a)
    cv.hline(x - 18, x + 26, y + 4, 0x7a3aa8)


def yacht(cv, x, y):
    hull = cv.poly_mask([(x, y), (x + 64, y), (x + 70, y - 6), (x - 4, y - 6)])
    cv.fill(hull, 0xe8d8f0)
    cv.hline(x - 3, x + 69, y - 6, 0xffffff)
    cv.hline(x + 2, x + 64, y - 2, 0xff3aa0)
    cv.hline(x + 2, x + 64, y - 1, 0x6af0ff)
    cab = cv.poly_mask([(x + 12, y - 6), (x + 50, y - 6), (x + 44, y - 13), (x + 20, y - 13)])
    cv.fill(cab, 0xc8b8dc)
    cv.hline(x + 22, x + 44, y - 13, 0xffffff)
    for wx in range(x + 18, x + 46, 5):
        cv.rect(wx, y - 10, 3, 2, 0x2a1050)
        cv.pset(wx, y - 10, 0x6af0ff)
    cv.vline(x + 32, y - 22, y - 13, 0x9a8ab8)
    cv.pset(x + 32, y - 23, 0xff3a5a)
    cv.rect(x + 30, y - 16, 5, 3, 0xff3aa0)
    # sombra roxa e esteira
    cv.hline(x - 2, x + 66, y + 1, 0x2a0a4a)
    for i in range(6):
        cv.hline(x + 66 + i * 6, x + 70 + i * 6, y - 1 + (i % 2), 0xc0a0ff)
        cv.hline(x - 10 - i * 7, x - 5 - i * 7, y + (i % 2), 0x9a7ad8)


def beach(cv):
    top = WALL - 16
    cv.vgrad(SEA_L - 20, top, SEA_R - SEA_L + 40, WALL - top, [0x8a3a6a, 0xa44a6a, 0xc0606a])
    rng = np.random.default_rng(9)
    for _ in range(160):
        x = int(rng.integers(SEA_L - 20, SEA_R + 20))
        y = int(rng.integers(top + 1, WALL))
        cv.pset(x, y, 0xd87a78 if rng.random() < 0.6 else 0x7a2e5e)
    # espuma da arrebentação
    for x in range(SEA_L - 20, SEA_R + 20):
        if bay(x, 0) < 0.8:
            cv.pset(x, top, 0xffd8f0)
        if bay(x, 1) < 0.4:
            cv.pset(x, top - 1, 0xc8a0e8)


def lifeguard(cv, x):
    """Guarita de salva-vidas pastel, ícone de South Beach."""
    base = WALL - 6
    for lx in (x + 3, x + 25):
        cv.rect(lx, base - 20, 2, 22, 0x6a2a50)
        cv.pset(lx, base - 20, 0xa04a70)
    cv.line(x + 4, base - 18, x + 25, base - 4, 0x5a2048)
    cv.line(x + 25, base - 18, x + 4, base - 4, 0x5a2048)
    # rampa
    cv.line(x + 30, base - 18, x + 46, base + 2, 0x7a3a5e, 2)
    # cabine
    cv.rect(x - 2, base - 40, 34, 20, 0x40c8c0)
    cv.rect(x - 2, base - 40, 34, 2, 0x8af0e0)
    cv.rect(x + 26, base - 40, 6, 20, 0x2a8a96)
    for i in range(3):
        cv.rect(x - 2, base - 33 + i * 4, 28, 1, 0xff7ab8)
    cv.rect(x + 6, base - 37, 12, 8, 0xffd27a)
    cv.rect(x + 6, base - 37, 12, 1, 0xfff0c0)
    cv.rect(x + 11, base - 37, 1, 8, 0xc8883a)
    # telhado e bandeira
    roof = cv.poly_mask([(x - 6, base - 40), (x + 36, base - 40), (x + 26, base - 50), (x + 4, base - 50)])
    cv.fill(roof, 0xff5aa8)
    cv.hline(x + 4, x + 26, base - 50, 0xffa8d8)
    for rx in range(x - 4, x + 34, 4):
        cv.vline(rx, base - 44, base - 40, 0xc8307a)
    cv.vline(x + 15, base - 62, base - 50, 0x3a1040)
    cv.rect(x + 16, base - 62, 7, 4, 0xffd020)
    cv.rect(x + 16, base - 60, 7, 1, 0xff3a5a)
    # placa de "SURF" e boia
    cv.rect(x + 32, base - 30, 3, 10, 0xfff0e0)
    cv.ellipse_mask  # noqa: B018 (marcador)
    for a in range(0, 360, 30):
        r = math.radians(a)
        cv.pset(x - 7 + 3 * math.cos(r), base - 28 + 3 * math.sin(r), 0xff3a5a if (a // 90) % 2 else 0xffffff)


def umbrella(cv, x, c1, c2):
    base = WALL - 4
    cv.vline(x, base - 18, base, 0xe0d0e8)
    for i in range(-11, 12):
        t = abs(i) / 11
        y = base - 19 + int(t * t * 5)
        cv.vline(x + i, y - 1, y + 1, c1 if (i + 11) // 4 % 2 else c2)
    cv.pset(x, base - 21, 0xffffff)
    cv.rect(x + 4, base - 2, 12, 2, 0xff7ab8)  # toalha


# ---------------------------------------------------------------- prédios
PINKB = ramp(0x260a30, 0x421444, 0x66205a, 0x903674, 0xc05a92)
TEALB = ramp(0x0a1a32, 0x10304a, 0x18485e, 0x266c7c, 0x4a9aa0)
YELB = ramp(0x2a1430, 0x46263e, 0x6c4248, 0x9a6a58, 0xcc9c6c)
LAVB = ramp(0x160e3a, 0x241852, 0x382a70, 0x544496, 0x7c68c0)
MINTB = ramp(0x0c2034, 0x143a4a, 0x1e5660, 0x327a74, 0x58a894)
NIGHTB = ramp(0x10061e, 0x1a0a30, 0x260e44, 0x36145a, 0x4e2276)

NEON_PINK = 0xff2fa8
NEON_CYAN = 0x22e6ff
NEON_YEL = 0xffd23a


def window(cv, x, y, w, h, rng, frame, wall_c=0x1a0a30):
    # quanto mais alto, mais apagado: o alto da tela é dos vilões
    up = max(0.0, min(1.0, (WALL - 60 - y) / 240))
    k = rng.random()
    if k < 0.45 + up * 0.3:
        cv.rect(x, y, w, h, 0x120626)
        cv.pset(x + w - 2, y + 1, 0x3a2266)  # reflexo
        if rng.random() < 0.3:
            cv.hline(x, x + w, y + h // 2, 0x2a1450)
    else:
        if k < 0.7:
            lit, hi, lo = 0xffd27a, 0xfff0c0, 0xc8883a
        elif k < 0.84:
            lit, hi, lo = 0x6af0ff, 0xd0ffff, 0x2a9ac0
        elif k < 0.94:
            lit, hi, lo = 0xff8ad0, 0xffd0f0, 0xc0408a
        else:
            lit, hi, lo = 0x9a8aff, 0xe0d8ff, 0x5a48c0  # TV ligada
        dim = up * 0.55
        lit, hi, lo = mix(lit, wall_c, dim), mix(hi, wall_c, dim), mix(lo, wall_c, dim)
        cv.rect(x, y, w, h, lit)
        cv.hline(x, x + w, y, hi)
        cv.hline(x, x + w, y + h - 1, lo)
        r = rng.random()
        if r < 0.25:  # persiana
            for yy in range(y + 1, y + h - 1, 2):
                cv.hline(x, x + w, yy, lo)
        elif r < 0.4:  # cortina
            cv.rect(x, y + 1, 2, h - 1, lo)
            cv.rect(x + w - 2, y + 1, 2, h - 1, lo)
        elif r < 0.5 and w >= 5:  # silhueta dançando
            sx = x + 1 + int(rng.integers(0, max(1, w - 3)))
            cv.pset(sx + 1, y + 2, 0x2a1040)
            cv.rect(sx, y + 3, 3, h - 3, 0x2a1040)
            cv.pset(sx - 1 if rng.random() < 0.5 else sx + 3, y + 2, 0x2a1040)
        else:
            cv.vline(x + w // 2, y + 1, y + h - 1, lo)
    cv.hline(x - 1, x + w + 1, y + h, frame)


def ac_unit(cv, x, y):
    cv.rect(x, y, 6, 4, 0x8a86a8)
    cv.hline(x, x + 6, y, 0xc8c4e0)
    cv.hline(x + 1, x + 5, y + 2, 0x4a4668)
    cv.pset(x + 2, y + 5, 0x6af0ff, 0.5)


def facade(cv, x, top, w, base, R, side, side_w, rng, floor_h=16, win=(6, 8), eyebrows=True, portholes=False,
           speed=None, rounded=False):
    """Bloco com face frontal na sombra e face lateral voltada ao sol (contraluz quente)."""
    cv.rect(x, top, w, base - top, R[1])
    # textura de reboco: pontilhado leve
    for yy in range(top, base):
        for xx in range(x, x + w):
            if bay(xx, yy) < 0.12 and (xx * 7 + yy * 3) % 5 == 0:
                cv.pset(xx, yy, R[0])
    # face lateral
    sx = x + w if side > 0 else x - side_w
    if rounded:
        tones = [R[2], R[3], R[4], R[3], R[2]]
        for i in range(side_w):
            t = i / max(1, side_w - 1)
            c = tones[min(len(tones) - 1, int(t * len(tones)))] if side > 0 else tones[::-1][
                min(len(tones) - 1, int(t * len(tones)))]
            cv.rect(sx + i, top, 1, base - top, mix(c, 0xff7a6a, 0.25))
    else:
        cv.rect(sx, top, side_w, base - top, mix(R[3], 0xff8a6a, 0.3))
        edge = sx + side_w - 1 if side > 0 else sx
        cv.vline(edge, top, base, mix(R[4], 0xffb080, 0.4))
        inner = sx if side > 0 else sx + side_w - 1
        cv.vline(inner, top, base, R[2])
    # quina da frente pega um fio de luz do céu
    cv.vline(x if side > 0 else x + w - 1, top, base, R[2])
    # topo (platibanda) com friso
    cv.rect(x - 1, top - 3, w + 2, 3, R[2])
    cv.hline(x - 1, x + w + 1, top - 3, R[4])
    cv.hline(x - 1, x + w + 1, top, R[0])
    # andares
    ww, wh = win
    floors = list(range(top + 8, base - floor_h + 2, floor_h))
    cols = list(range(x + 6, x + w - ww - 3, ww + 6))
    for fy in floors:
        if eyebrows:  # "sobrancelhas": marquises finas sobre as janelas
            cv.hline(x + 2, x + w - 2, fy - 2, R[3])
            cv.hline(x + 2, x + w - 2, fy - 1, R[0])
        for cx in cols:
            if portholes and (fy // floor_h) % 2 == 0:
                m = cv.ellipse_mask(cx + ww / 2, fy + wh / 2, ww / 2, ww / 2)
                lit = rng.random() < 0.5
                cv.fill(m, 0xffd27a if lit else 0x120626)
                cv.pset(cx + 1, fy + 2, 0xfff0c0 if lit else 0x3a2266)
            else:
                window(cv, cx, fy, ww, wh, rng, R[0], R[1])
            if rng.random() < 0.08:
                ac_unit(cv, cx, fy + wh + 1)
        # janelas da face lateral (estreitas, refletindo o pôr do sol)
        if side_w >= 8 and not rounded:
            wx = sx + 2
            cv.rect(wx, fy, side_w - 4, wh, mix(0xffb060, R[3], 0.45 if rng.random() < 0.6 else 0.8))
            cv.hline(wx, wx + side_w - 4, fy, 0xffe0b0)
    # listras "speed lines" do streamline moderne
    if speed:
        for i in range(3):
            y = top + 10 + i * 4
            x0 = x + w - 26 if side > 0 else x
            cv.hline(x0, x0 + 26, y, speed)
            cv.hline(x0, x0 + 26, y + 1, mix(speed, R[1], 0.6))
            cv.hline(sx, sx + side_w, y, mix(speed, 0xffffff, 0.3))
    return sx


def storefront(cv, x, w, base, awning, glow, sign, rng):
    """Térreo: vitrine acesa, toldo listrado e letreiro."""
    top = base - 26
    cv.rect(x, top, w, 26, 0x1a0a2a)
    cv.rect(x + 3, top + 9, w - 6, 15, glow)
    cv.hline(x + 3, x + w - 3, top + 9, mix(glow, 0xffffff, 0.6))
    for gx in range(x + 3, x + w - 3, 12):
        cv.vline(gx, top + 9, top + 24, 0x2a1440)
    # gente na vitrine
    for _ in range(int(w // 30)):
        px = x + 6 + int(rng.integers(0, max(1, w - 14)))
        cv.rect(px, top + 15, 3, 9, 0x2a1040)
        cv.rect(px, top + 12, 3, 3, 0x2a1040)
    # toldo
    for i in range(w + 4):
        stripe = (i // 4) % 2
        c = awning if stripe else 0xf0e0f0
        cv.vline(x - 2 + i, top + 2, top + 8, mix(c, 0x1a0a2a, 0.25))
        cv.pset(x - 2 + i, top + 8, c)
        if i % 4 == 0:
            cv.pset(x - 2 + i, top + 9, mix(c, 0x1a0a2a, 0.4))
    cv.hline(x - 2, x + w + 2, top + 1, 0xffffff)
    if sign:
        tw = len(sign) * 4 - 1
        sx0 = x + (w - tw) // 2
        cv.rect(sx0 - 2, top - 9, tw + 4, 9, 0x10061e)
        text(cv, sx0, top - 7, sign, NEON_PINK if rng.random() < 0.5 else NEON_CYAN)


def neon_border(cv, x0, y0, x1, y1, c):
    glow = mix(c, 0x1a0630, 0.55)
    cv.hline(x0, x1, y0, c)
    cv.hline(x0, x1, y0 + 1, glow)
    cv.vline(x0, y0, y1, c)
    cv.vline(x0 + 1, y0 + 1, y1, glow)


def fin_sign(cv, x, top, base_y, word, c):
    """Pilar central art déco com letreiro vertical de neon."""
    w = 11
    cv.rect(x, top, w, base_y - top, 0x1c0a30)
    cv.vline(x, top, base_y, 0x3a1a5a)
    cv.vline(x + w - 1, top, base_y, 0x10061e)
    cap = cv.poly_mask([(x - 2, top), (x + w + 2, top), (x + w // 2 + 0.5, top - 12)])
    cv.fill(cap, 0x1c0a30)
    cv.pset(x + w // 2, top - 13, c)
    vtext(cv, x + 4, top + 4, word, c, glow=mix(c, 0x1c0a30, 0.5))


def water_tower(cv, x, y):
    for lx in (x + 1, x + 13):
        cv.vline(lx, y, y + 14, 0x241038)
    cv.line(x + 1, y + 4, x + 13, y + 12, 0x241038)
    cv.line(x + 13, y + 4, x + 1, y + 12, 0x241038)
    cv.rect(x - 1, y - 14, 17, 14, 0x3a1a50)
    cv.vline(x - 1, y - 14, y, 0x5a2a6a)
    cv.vline(x + 15, y - 14, y, 0x1c0a2c)
    for yy in range(y - 12, y, 4):
        cv.hline(x - 1, x + 16, yy, 0x2a1240)
    roof = cv.poly_mask([(x - 2, y - 14), (x + 17, y - 14), (x + 7.5, y - 21)])
    cv.fill(roof, 0x2a1240)
    cv.line(x - 2, y - 14, x + 7, y - 21, 0xff7a9a)


def antenna(cv, x, y, h):
    cv.vline(x, y - h, y, 0x3a1a50)
    for i in range(3):
        cv.hline(x - 3 + i, x + 4 - i, y - h + 4 + i * 5, 0x3a1a50)
    cv.pset(x, y - h - 1, 0xff3a5a)
    for d in ((1, 0), (-1, 0), (0, -1)):
        cv.pset(x + d[0], y - h - 1 + d[1], 0x8a1a3a)


def dish(cv, x, y):
    m = cv.ellipse_mask(x, y - 5, 6, 4)
    cv.fill(m, 0x9a94b8)
    cv.line(x - 4, y - 7, x + 3, y - 3, 0xe0dcf0)
    cv.vline(x, y - 3, y, 0x4a4668)


def billboard(cv, x, y, w, h):
    """Outdoor de VHS: "BE KIND REWIND" com fita cassete."""
    for lx in (x + 8, x + w - 10):
        cv.rect(lx, y + h, 3, 14, 0x241038)
    cv.rect(x, y, w, h, 0x1a0a2a)
    cv.vgrad(x + 2, y + 2, w - 4, h - 4, [0x2a0a5a, 0x5a1478, 0xa02a7a])
    # fita cassete
    cx, cy = x + 10, y + 7
    cv.rect(cx, cy, 22, 13, 0x101018)
    cv.rect(cx + 2, cy + 2, 18, 5, 0xffd23a)
    cv.rect(cx + 2, cy + 4, 18, 1, NEON_PINK)
    for rx in (cx + 6, cx + 15):
        m = cv.ellipse_mask(rx + 0.5, cy + 9.5, 2.2, 2.2)
        cv.fill(m, 0xe8e0f0)
        cv.pset(rx, cy + 9, 0x101018)
    text(cv, x + 38, y + 6, 'BE KIND', 0xfff0fa)
    text(cv, x + 38, y + 13, 'REWIND!', NEON_CYAN)
    neon_border(cv, x, y, x + w, y + h, NEON_PINK)
    cv.hline(x, x + w, y + h - 1, NEON_PINK)
    cv.vline(x + w - 1, y, y + h, NEON_PINK)
    # lâmpadas iluminando de baixo
    for lx in range(x + 6, x + w - 4, 14):
        cv.rect(lx, y + h + 1, 3, 2, 0xfff0c0)


def buildings(cv):
    rng = np.random.default_rng(42)
    base = WALL
    # --- esquerda (face lateral voltada ao centro: side=+1)
    facade(cv, -10, 250, 76, base, NIGHTB, +1, 8, rng, eyebrows=False)
    antenna(cv, 26, 247, 36)
    # Hotel Ocean Drive: rosa, pilar central com letreiro
    facade(cv, 72, 214, 128, base, PINKB, +1, 12, rng, speed=NEON_CYAN)
    fin_sign(cv, 130, 188, 300, 'HOTEL', NEON_PINK)
    water_tower(cv, 88, 211)
    storefront(cv, 76, 120, base, 0xff5aa8, 0xffc070, 'CAFE', rng)
    # Streamline teal com quina arredondada
    facade(cv, 212, 282, 92, base, TEALB, +1, 14, rng, rounded=True, speed=0xffd0e8)
    dish(cv, 236, 279)
    storefront(cv, 216, 86, base, 0x22c8e0, 0x6af0ff, 'VHS', rng)
    # Amarelo baixinho com escotilhas e outdoor
    facade(cv, 318, 340, 92, base, YELB, +1, 10, rng, portholes=True)
    billboard(cv, 314, 296, 84, 26)
    storefront(cv, 322, 84, base, NEON_YEL, 0xff8ad0, 'BAR', rng)
    # --- direita (face lateral voltada ao centro: side=-1)
    facade(cv, 892, 330, 86, base, LAVB, -1, 10, rng)
    antenna(cv, 940, 327, 24)
    storefront(cv, 896, 78, base, 0x9a6aff, 0xffd27a, 'PIZZA', rng)
    # Torre da locadora Video Replay
    facade(cv, 990, 236, 150, base, PINKB, -1, 12, rng, speed=NEON_YEL)
    water_tower(cv, 1110, 233)
    storefront(cv, 994, 142, base, 0xff2fa8, 0x6af0ff, 'OPEN 24H', rng)
    # Torre menta indo além da borda
    facade(cv, 1158, 268, 150, base, MINTB, -1, 14, rng, rounded=True, speed=NEON_PINK)
    antenna(cv, 1200, 265, 40)
    dish(cv, 1250, 265)
    storefront(cv, 1162, 140, base, 0x40e0b0, 0xffc070, 'ARCADE', rng)


# ---------------------------------------------------------------- palmeiras
PALM_D = 0x12041f
PALM_M = 0x220a36
PALM_L = 0x3a1250
PALM_RIM = 0xff6aa0


def palm(cv, x, base, h, lean, seed):
    rng = np.random.default_rng(seed)
    to_sun = 1 if x < SUN[0] else -1
    pts = []
    for i in range(int(h) + 1):
        t = i / h
        cx = x + math.sin(t * 1.5) * lean * h
        cy = base - t * h
        half = (6.5 - t * 3) / 1
        pts.append((cx, cy))
        ring = (i % 6) < 1
        for dx in range(int(-half), int(half) + 1):
            u = dx / max(1, half) * to_sun
            c = PALM_L if u > 0.45 else PALM_M if u > -0.3 else PALM_D
            if ring:
                c = PALM_D if u < 0.6 else PALM_M
            cv.pset(cx + dx, cy, c)
        cv.pset(cx + to_sun * (half + 1), cy, PALM_RIM if not ring else PALM_L)
    tx, ty = pts[-1]
    # folhas: lâmina cheia (polígono) caindo da espinha, com franja serrilhada
    fronds = [(-1, 0.6, 1.0), (1, 0.6, 1.0), (-1, 1.4, 0.85), (1, 1.35, 0.85), (-0.5, -0.3, 0.62),
              (0.55, -0.2, 0.66), (-0.8, 2.3, 0.6), (0.85, 2.2, 0.6), (-0.1, -0.6, 0.38)]
    dark_f, mid_f, lit_f = 0x14041f, 0x2a0b3e, 0x48185a
    order = sorted(fronds, key=lambda f: -f[1])  # as caídas ficam atrás
    for dirx, droop, ln in order:
        L = 80 * ln
        lit = dirx * to_sun > 0
        n = 40
        spine = []
        for j in range(n + 1):
            t = j / n
            spine.append((tx + dirx * t * L, ty - 7 + (t * t * droop * 52 - t * 14), t))
        upper, lower = [], []
        for fx, fy, t in spine:
            wv = 2.2 * math.sin(math.pi * min(1, t * 1.15)) + 0.4
            hang = (11 - 7 * t) * math.sin(math.pi * min(1, t * 1.1)) + 1
            upper.append((fx, fy - wv * 0.6))
            lower.append((fx + dirx * 2, fy + hang))
        cv.fill(cv.poly_mask(upper + lower[::-1]), lit_f if lit else mid_f)
        # metade de baixo da lâmina na sombra
        mid_line = [((u[0] + l[0]) / 2, (u[1] + l[1]) / 2 + 1) for u, l in zip(upper, lower)]
        cv.fill(cv.poly_mask(mid_line + lower[::-1]), mid_f if lit else dark_f)
        # franja: folíolos pontudos pendurados na borda de baixo
        for k in range(2, n, 2):
            lx, ly = lower[k]
            t = k / n
            tip = (4 + 5 * (1 - t)) * (0.7 + rng.random() * 0.6)
            cv.line(lx, ly - 1, lx + dirx * 2.5, ly + tip, mid_f if lit else dark_f)
            if lit and rng.random() < 0.4:
                cv.pset(lx + dirx * 2.5, ly + tip, PALM_RIM)
        # espinha e brilho do contraluz na borda de cima
        for k, (fx, fy, t) in enumerate(spine):
            th = 2 if t < 0.5 else 1
            cv.rect(round(fx), round(fy), th, th, dark_f)
            if lit and k % 2 == 0:
                cv.pset(upper[k][0], upper[k][1], PALM_RIM)
    # cocos
    for ox, oy, c in ((-4, 3, PALM_M), (3, 4, PALM_D), (0, 1, PALM_L), (5, 0, PALM_M)):
        m = cv.ellipse_mask(tx + ox, ty + oy, 3, 3)
        cv.fill(m, c)
        cv.pset(tx + ox - to_sun, ty + oy - 1, 0x6a2a6a)


# ---------------------------------------------------------------- calçadão
def lamp(cv, x):
    base = WALL
    cv.rect(x - 1, base - 46, 3, 46, 0x2a0e44)
    cv.vline(x - 1, base - 46, base, 0x4a1e6a)
    cv.rect(x - 3, base - 6, 7, 6, 0x2a0e44)
    cv.rect(x - 3, base - 48, 7, 3, 0x3a1658)
    # globo com halo pontilhado
    for r, a in ((12, 0.12), (8, 0.22), (5, 0.4)):
        for yy in range(-r, r + 1):
            for xx in range(-r, r + 1):
                if xx * xx + yy * yy <= r * r and bay(x + xx, base - 54 + yy) < 0.5:
                    cv.pset(x + xx, base - 54 + yy, 0xffb0e0, a)
    m = cv.ellipse_mask(x + 0.5, base - 53.5, 4, 4)
    cv.fill(m, 0xffe8f6)
    cv.pset(x - 1, base - 56, 0xffffff)
    cv.hline(x - 2, x + 3, base - 50, 0xff8ad0)


def wall(cv):
    top = WALL
    cv.rect(0, top, W, 44, 0x3a1262)
    # coping
    cv.rect(0, top, W, 4, 0xe066a8)
    cv.hline(0, W, top, 0xffb0dc)
    cv.hline(0, W, top + 3, 0x8a2a78)
    cv.rect(0, top + 4, W, 2, 0x26083e)
    # balaustrada
    for x in range(2, W, 8):
        cv.rect(x + 1, top + 6, 4, 16, 0x5a1e86)
        cv.rect(x, top + 9, 6, 5, 0x5a1e86)
        cv.vline(x + 1, top + 6, top + 22, 0x7a34a8)
        cv.vline(x + 4, top + 6, top + 22, 0x3a1262)
        cv.pset(x, top + 9, 0x7a34a8)
    cv.rect(0, top + 22, W, 3, 0xc04a98)
    cv.hline(0, W, top + 22, 0xff8ad0)
    cv.rect(0, top + 25, W, 19, 0x2c0c4c)
    for x in range(0, W, 40):
        cv.rect(x + 3, top + 28, 34, 2, 0x4a1a74)
        cv.vline(x + 20, top + 31, top + 44, 0x3a1262)
    # tubo de neon rosa em cima da mureta
    cv.hline(0, W, top - 1, NEON_PINK)
    cv.hline(0, W, top - 2, 0xffb0e0)
    for x in range(W):
        if bay(x, top - 3) < 0.5:
            cv.pset(x, top - 3, NEON_PINK, 0.35)


# ---------------------------------------------------------------- dirigível
def blimp():
    cv = Canvas(120, 46)
    body = cv.ellipse_mask(56, 18, 50, 15)
    yy, xx = np.mgrid[0:46, 0:120]
    t = (yy - 3) / 30
    cv.fill(body, 0x4a3a7a)
    cv.fill(body & (t < 0.62), 0x6a5aa0)
    cv.fill(body & (t < 0.35), 0x8a7ac8)
    cv.fill(body & (t < 0.18) & (xx < 60), 0xb8a8f0)
    cv.fill(body & (t > 0.86), 0x2a1e50)
    fin = cv.poly_mask([(6, 18), (0, 4), (14, 12)])
    fin2 = cv.poly_mask([(6, 18), (0, 32), (14, 24)])
    cv.fill(fin, 0x6a5aa0)
    cv.fill(fin2, 0x3a2e66)
    # painel de LED
    cv.rect(26, 12, 62, 11, 0x0e0820)
    text(cv, 29, 15, 'SHOOT', NEON_PINK)
    text(cv, 50, 15, 'UP!', NEON_CYAN)
    text(cv, 63, 15, ' ', NEON_CYAN)
    cv.hline(26, 88, 12, 0x2a1e50)
    cv.hline(26, 88, 22, 0x2a1e50)
    # gôndola
    cv.rect(48, 33, 18, 6, 0x2a1e50)
    cv.hline(48, 66, 33, 0x6a5aa0)
    for gx in range(50, 64, 4):
        cv.rect(gx, 35, 2, 2, 0xffd27a)
    cv.pset(104, 18, 0xff3a5a)
    # contorno
    a = cv.a
    solid = a[..., 3] > 0
    edge = np.zeros_like(solid)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        edge |= np.roll(np.roll(solid, dy, 0), dx, 1)
    edge &= ~solid
    a[edge] = (20, 6, 34, 255)
    return Image.fromarray(a, 'RGBA')


def backdrop():
    cv = Canvas(W, H)
    sky(cv)
    clouds(cv)
    sun(cv)
    skyline(cv)
    sea(cv)
    sailboat(cv, 790, HORIZON + 12, 1.0)
    sailboat(cv, 470, HORIZON + 6, 0.6)
    yacht(cv, 640, HORIZON + 46)
    beach(cv)
    umbrella(cv, 600, 0xff3aa0, 0xffffff)
    umbrella(cv, 760, 0x22c8e0, 0xffd23a)
    lifeguard(cv, 486)
    buildings(cv)
    palm(cv, 118, WALL + 4, 214, -0.12, 1)
    palm(cv, 428, WALL + 4, 176, 0.1, 2)
    palm(cv, 860, WALL + 4, 168, -0.09, 3)
    palm(cv, 1186, WALL + 4, 220, 0.13, 4)
    for lx in (60, 270, 560, 740, 1030, 1260):
        lamp(cv, lx)
    wall(cv)
    # abaixo da mureta o jogo desenha o chão; deixa um fundo neutro
    cv.rect(0, WALL + 44, W, H - WALL - 44, 0x16052c)
    return Image.fromarray(cv.a, 'RGBA')


if __name__ == '__main__':
    import sys
    backdrop().save(sys.argv[1] if len(sys.argv) > 1 else '/tmp/stage.png')
