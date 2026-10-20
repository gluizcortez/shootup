"""
Paleta e utilidades comuns do elenco (vilões e chefe).

Rampas de 5 tons: [sombra funda, sombra, base, luz, brilho]. O motor põe a
face voltada para a câmera no tom 2 e as bordas viradas para a luz (alto à
esquerda) nos tons 3 e 4. Sombras puxam para o roxo da Miami neon.
"""
import numpy as np

import engine as E
from engine import ramp

SKIN = ramp('#6a3438', '#b4685a', '#e09a78', '#f6c49c', '#ffe2c4')
SKIN_TAN = ramp('#4e2430', '#8e4a46', '#c47a5a', '#e4a47a', '#ffd0a4')
SKIN_DARK = ramp('#2a1426', '#55283a', '#7e4440', '#a4664e', '#cc8e68')
WHITE = ramp('#5c5878', '#a3a1c0', '#d8d7ea', '#f2f2fb', '#ffffff')
CREAM = ramp('#6a5a70', '#b0a2a8', '#e2d8cc', '#f7f1e8', '#ffffff')
BLACK = ramp('#0d0a16', '#1f1a2e', '#342c4a', '#4e4670', '#7a72a8')
LEATHER = ramp('#0c0a14', '#1c1828', '#2e2840', '#463e5e', '#6a6090')
CHROME = ramp('#26243a', '#56567a', '#9a9cc0', '#d6daf2', '#ffffff')
GUNMETAL = ramp('#121220', '#24263a', '#3b4252', '#5d6680', '#8e98b8')
GOLD = ramp('#5a3a08', '#a0700e', '#e0b020', '#ffe060', '#fff6b0')
BRASS = ramp('#4a2a10', '#8a5a1c', '#d09040', '#f0c060', '#fff0a8')
WOOD = ramp('#2e160c', '#5a2e16', '#8a5a2b', '#b07a42', '#dca86a')
BROWN = ramp('#1e0e10', '#3e1e18', '#6a3a22', '#8e5a32', '#b8844a')
TEAL = ramp('#1a3a5a', '#2a7a8a', '#4cc0b8', '#7fe6d8', '#c8fff4')
PINK = ramp('#5a0f3c', '#a01a64', '#e0328e', '#ff6ec0', '#ffb4e4')
HOTPINK = ramp('#4a0838', '#90105e', '#ff2fa8', '#ff7ac8', '#ffc4ea')
CYAN = ramp('#0a2a5a', '#1060a0', '#22b8e6', '#6af0ff', '#d0ffff')
YELLOW = ramp('#5a3a10', '#b07a10', '#ffcc20', '#ffe870', '#fffbd0')
RED = ramp('#3a0820', '#80122c', '#d02a3a', '#ff5a5a', '#ffa8a0')
GREEN = ramp('#0a3a2a', '#108a4a', '#20d070', '#70ff9a', '#d0ffe0')
LIME = ramp('#1a3a10', '#4a7a14', '#80c020', '#a8e840', '#e0ff98')
PURPLE = ramp('#1a0a3a', '#3a1a7a', '#6a3ac0', '#9a6af0', '#d0b0ff')
GREY = ramp('#22243a', '#4a4e66', '#7a8096', '#a6acc0', '#dce0ee')
STEEL = ramp('#20243a', '#4a5470', '#8a96b0', '#bcc6dc', '#f0f4ff')
DENIM = ramp('#0a1440', '#1a2a70', '#2a48a8', '#4a70d8', '#90b0ff')
ORANGE = ramp('#4a1410', '#902e10', '#e06a18', '#ffa040', '#ffd890')
HAIR_BLACK = ramp('#06040c', '#15102a', '#2a2050', '#463a80', '#6a5cb0')
HAIR_BROWN = ramp('#140808', '#2e1410', '#4e2a1a', '#7a4a2a', '#a8703c')
HAIR_BLOND = ramp('#5a3a18', '#a0702a', '#e0b040', '#ffe070', '#fff8c0')

INK = (20, 10, 28)
EYE_W = (255, 255, 255)
MOUTH = (110, 30, 50)
OUTLINE_TINT = (20, 6, 34)
RIM = ((255, 70, 190), 0.3)
SPARK = (255, 255, 255)


def checker_tex(step=2, amount=1):
    """Textura de xadrez (terno do cassino, lantejoulas)."""
    def tex(idx, m):
        out = idx.copy()
        g = ((E.XX // step + E.YY // step) % 2 == 0) & m
        out[g] += amount
        return out
    return tex


def stripes_tex(period=3, amount=-1, vertical=True):
    def tex(idx, m):
        out = idx.copy()
        g = (((E.XX if vertical else E.YY) % period) == 0) & m
        out[g] += amount
        return out
    return tex


def noise_tex(seed, p_up=0.1, p_down=0.1):
    def tex(idx, m):
        rng = np.random.default_rng(seed)
        r = rng.random((E.H, E.W))
        out = idx.copy()
        out[(r < p_up) & m] += 1
        out[(r > 1 - p_down) & m] -= 1
        return out
    return tex


def sequin_tex(seed):
    def tex(idx, m):
        rng = np.random.default_rng(seed)
        grid = ((E.XX + (E.YY // 2) % 2) % 2 == 0) & (E.YY % 2 == 0)
        out = idx.copy()
        out[grid & m] += 1
        out[grid & m & (rng.random((E.H, E.W)) < 0.12)] = 4
        out[(~grid) & m & (rng.random((E.H, E.W)) < 0.12)] -= 1
        return out
    return tex


def sparkle(x, y, core=SPARK, glow=(200, 220, 255)):
    """Estrelinha de 5 pixels."""
    return [(x, y, core), (x - 1, y, glow), (x + 1, y, glow), (x, y - 1, glow), (x, y + 1, glow)]
BLUE_TRACK = ramp('#0a1050', '#1430a0', '#2d6bff', '#70a0ff', '#c0d8ff')


def breathe(img, cut, dy=1):
    """Respiração: as linhas acima de `cut` descem `dy` pixels (pernas ficam onde estão)."""
    import numpy as _np
    from PIL import Image as _Image
    a = _np.array(img)
    out = a.copy()
    out[dy:cut + dy] = a[0:cut]
    out[0:dy] = 0
    return _Image.fromarray(out, 'RGBA')


def frames_of(fn, cut, faces=('blink', 'aim', 'shoot', 'hurt', 'dead')):
    """Quadros de um corpo com rosto variável: base, respiração (_b) e um por rosto."""
    out = {'': lambda: fn('idle'), '_b': lambda: breathe(fn('idle'), cut)}
    for f in faces:
        out['_' + f] = (lambda f=f: fn(f))
    return out


# Bocas e olhos de reserva para rostos pequenos (k contorno, w dente/branco,
# m boca, t língua). O '.' não pinta.
FACE_CMAP = {'k': INK, 'w': (255, 255, 255), 'm': (150, 30, 60), 't': (255, 110, 140), 'b': INK,
             's': (120, 220, 255), 'r': (255, 60, 70)}
MOUTH = {
    'aim': ['kkkkkk'],
    'shoot': ['.kkkk.', 'kwwwwk', 'kmmtmk', '.kkkk.'],
    'hurt': ['..kk..', '.k..k.', 'k....k'],
    'dead': ['kkkkkk', '..ktk.', '...t..'],
}
EYE = {
    'blink': ['...', 'kkk', '...'],
    'aim': ['kk.', '.kk', 'wkk'],
    'hurt': ['k..', '.k.', 'k..'],
    'dead': ['k.k', '.k.', 'k.k'],
}


def sweat(x, y):
    return [(x, y, (200, 240, 255)), (x, y + 1, (120, 220, 255)), (x - 1, y + 1, (120, 220, 255))]


def face_part(face, table, default, pos, cmap, skin):
    """Troca um pedaço do rosto (olho ou boca) pela expressão do momento.

    `default` é o desenho normal; se `face` tem versão em `table`, a área do
    desenho normal é coberta de pele e a expressão é carimbada centralizada.
    """
    from engine import pattern as _pattern
    if face not in table:
        return _pattern(default, pos, cmap)
    h, w = len(default), max(len(r) for r in default)
    out = [(pos[0] + i, pos[1] + j, skin) for j in range(h) for i in range(w)]
    alt = table[face]
    ah, aw = len(alt), max(len(r) for r in alt)
    ox = pos[0] + (w - aw) // 2
    oy = pos[1] + (h - ah) // 2
    return out + _pattern(alt, (ox, oy), FACE_CMAP)
