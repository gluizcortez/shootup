"""
Vice Goon (id pato_pistoleiro): capanga de Miami de blazer pastel com a manga
arregaçada, camiseta rosa, Ray-Ban, barba por fazer, topete de gel e
mocassim sem meia. Desce de paraquedas listrado em neon.
"""
import engine as E
from cast import (BROWN, CHROME, GOLD, GUNMETAL, HAIR_BROWN, HOTPINK, INK, OUTLINE_TINT, PINK, RIM, SKIN, TEAL, FACE_CMAP, MOUTH, frames_of, sweat,
                  WHITE, YELLOW, CYAN, CREAM, noise_tex, sparkle)
from engine import Part, capsule, ellipse, pattern, poly, render, rrect, union


def body(face='idle'):
    E.init(44, 40)
    parts, decals = [], []
    # mocassins sem meia (tornozelo à mostra)
    for x0, sh in ((14.2, -1), (23.4, 0)):
        parts.append(Part(capsule((x0 + 2.6, 34.4), (x0 + 3.2, 34.6), 1.6), SKIN, group=f'ank{x0}', R=1, shift=sh,
                          lines=False))
        parts.append(Part(poly([(x0, 35.2), (x0 + 4.5, 34.6), (x0 + 7.8, 35.8), (x0 + 8.2, 38.2), (x0, 38.2)]),
                          BROWN, group=f'shoe{x0}', R=1.6, shift=sh, k=3, bias=0.4))
    # calça de linho branca com vinco
    for x0, sh in ((15.6, -1), (23.8, 0)):
        parts.append(Part(rrect(x0, 26, 6.4, 9.2, 1.6), CREAM, group=f'leg{x0}', R=2.2, shift=sh, bias=0.4))
    # braço livre: mão no bolso
    parts.append(Part(capsule((13.4, 18.5), (12.8, 26.5), 3.0, 2.6), TEAL, group='farm', R=2.2, shift=-1))
    # blazer turquesa pastel
    jacket = Part(union(rrect(11.6, 15, 22.4, 14.4, 5), rrect(13, 25, 20, 5.6, 2)), TEAL, group='torso', R=3.6,
                  grad=(0.2, 0.15), bias=0.2)
    shirt = Part(poly([(18.6, 15.2), (28.4, 15.2), (23.6, 27.0)]), HOTPINK, group='shirt', R=2, bias=0.3)
    lapel_l = Part(poly([(17.2, 15), (19.6, 15), (22.4, 25.4), (21.4, 25.6)]), TEAL, group='lapel', R=1.2, bias=1.2,
                   lines=False)
    lapel_r = Part(poly([(30.2, 15), (27.6, 15), (24.8, 25.4), (25.8, 25.6)]), TEAL, group='lapel', R=1.2, bias=1.2,
                   lines=False)
    # manga arregaçada (cotovelo à mostra) do braço da frente fica na textura da arma
    parts += [jacket, shirt, lapel_l, lapel_r]
    # cabeça careca brilhante (o topete é peça separada que balança)
    ear = Part(ellipse((20.6, 11.4), 2.2, 2.8), SKIN, group='ear', R=1.5, shift=-1)
    head = Part(union(ellipse((27.4, 9.6), 8.2, 8.4), ellipse((29.6, 14.4), 6.0, 3.6)), SKIN, group='head', R=4,
                bias=0.7, tex=noise_tex(3, 0.0, 0.0))
    nose = Part(ellipse((35.2, 11.2), 1.8, 1.6), SKIN, group='nose', R=1, bias=0.6, lines=False)
    neck = Part(rrect(23, 14, 6, 4, 1), SKIN, group='neck', R=1, shift=-1)
    parts += [neck, ear, head, nose]
    # barba por fazer: pontilhado na metade de baixo do rosto
    for y in range(13, 19):
        for x in range(25, 36):
            if head.mask[y, x] and (x * 2 + y * 3) % 5 == 0 and not (y < 14 and x < 28):
                decals.append((x, y, (196, 128, 112)))
    # Ray-Ban com reflexo neon (o brilho corre na piscada; torto quando apanha)
    glint = 'w' if face != 'blink' else 'c'
    gy = 6.6 + (1 if face == 'dead' else 0)
    decals += pattern([
        'kkkkkkkkkkk.',
        f'kcc{glint}kkkcc{glint}kk',
        'kcbbk.kcbbk.',
        '.kkk...kkk..',
    ], (24.6, gy), {'k': INK, 'c': CYAN[3], 'w': (255, 255, 255), 'b': CYAN[1]})
    if face == 'blink':
        decals += [(26, 7.6, (255, 255, 255)), (31, 7.6, (255, 255, 255))]
    if face == 'aim':
        decals += pattern(['bb.....bb', '..b...b..'], (25, 4.6), FACE_CMAP)
    if face in ('hurt', 'dead'):
        decals += pattern(['w.', '.w', 'w.'], (27, 7.6), {'w': (255, 255, 255)})  # lente trincada
    if face == 'hurt':
        decals += sweat(23, 4)
    # boca: sorrisinho de lado com covinha, ou a expressão do momento
    if face in MOUTH:
        decals += pattern(MOUTH[face], (29.4, 14.6), FACE_CMAP)
    else:
        decals += pattern(['....mm', 'mmmm..'], (29.4, 15.2), {'m': (90, 30, 44)})
    # brinco de ouro + corrente
    decals += [(20.6, 14.4, GOLD[3]), (20.6, 15.2, GOLD[2])]
    decals += pattern(['g....g', '.g..g.', '..gg..'], (20.6, 15.6), {'g': GOLD[3]})
    decals += [(23.6, 18.2, GOLD[4])]
    # brilho da careca
    decals += [(24, 3.6, (255, 240, 220)), (25, 3.2, (255, 240, 220)), (23.2, 4.6, (255, 226, 200))]
    # bolso com lencinho rosa
    decals += pattern(['pp', 'tt'], (14.4, 20), {'p': PINK[3], 't': TEAL[1]})
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def hat():
    """Topete engomado de gel (assenta pela base, rente ao cocuruto)."""
    E.init(36, 18)
    pomp = Part(poly([(6, 16), (7.4, 9), (12, 4.6), (19, 2.4), (27, 2), (32.6, 4.6), (33.2, 7.2), (29.6, 9.4),
                      (25, 8.6), (24.6, 12), (25.6, 16)]), HAIR_BROWN, group='p', R=3, k=3.2, bias=0.5,
                grad=(0.25, 0.1))
    curl = Part(poly([(29, 8.6), (33, 7.4), (34, 10.4), (31.6, 12.2), (31.2, 10)]), HAIR_BROWN, group='c', R=1.2,
                bias=0.3)
    decals = []
    # mechas brilhando de gel
    decals += pattern([
        '......hhhhhhh....',
        '...hhh.......hh..',
        '..h....ggggg...h.',
        '......g.....g....',
    ], (10, 3.6), {'h': HAIR_BROWN[4], 'g': HAIR_BROWN[3]})
    decals += sparkle(15, 5)
    return render([curl, pomp], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def gun():
    """Braço da arma: manga arregaçada, pistolinha cromada. Pivô do ombro em x=4."""
    E.init(22, 10)
    sleeve = Part(rrect(0.6, 2.6, 6.4, 4.8, 2), TEAL, group='s', R=1.6, bias=0.4)
    cuff = Part(rrect(5.2, 2.8, 1.6, 4.4, 0.6), TEAL, group='c', R=1, bias=1.4, lines=False)
    hand = Part(ellipse((8, 5.2), 2.4, 2.2), SKIN, group='h', R=1.4, bias=0.5)
    slide = Part(rrect(8.4, 1.4, 11.6, 3.4, 0.8), CHROME, group='g', R=1.2, bias=0.6, k=3)
    grip = Part(poly([(8.8, 4.2), (11.6, 4.2), (11.2, 8.6), (8.2, 8.2)]), GUNMETAL, group='gr', R=1)
    decals = pattern(['wwwwwwwww'], (10, 2), {'w': (255, 255, 255)})
    decals += [(19.4, 2.6, INK), (19.4, 3.4, INK)]
    return render([sleeve, cuff, grip, slide, hand], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def balloons():
    """Paraquedas listrado em neon; os cordões se juntam em (22, 46)."""
    E.init(44, 48)
    canopy_pts = [(1.4, 18), (3, 10), (9, 4.2), (17, 1.6), (27, 1.6), (35, 4.2), (41, 10), (42.6, 18),
                  (38, 16.4), (33, 18.6), (27.6, 17), (22, 19), (16.4, 17), (11, 18.6), (6, 16.4)]
    canopy = poly(canopy_pts)
    cols = [HOTPINK, YELLOW, CYAN, HOTPINK, YELLOW, CYAN]
    parts = []
    for i, c in enumerate(cols):
        x0 = 1.4 + i * 6.87
        x1 = x0 + 6.87
        gore = poly([(x0, 20), (22 + (x0 - 22) * 0.55, 0), (22 + (x1 - 22) * 0.55, 0), (x1, 20)]) & canopy
        parts.append(Part(gore, c, group='canopy', R=5, bias=0.5, grad=(0.1, 0.5), lines=False, light=canopy))
    parts.append(Part(rrect(19, 44, 6, 3, 1), GUNMETAL, group='ring', R=1))
    decals = []
    # costuras escuras entre os gomos
    for i in range(1, 6):
        x0 = 1.4 + i * 6.87
        for t in range(0, 18):
            y = 18 - t
            x = x0 + (22 - x0) * (t / 18) * 0.45
            if canopy[int(y), int(round(x))]:
                decals.append((x, y, (60, 20, 70)))
    decals += sparkle(12, 6) + sparkle(30, 5)
    img = render(parts, decals, outline_tint=OUTLINE_TINT, rim=None)
    # cordões finos (1 px) por cima, do bordo do paraquedas até a argola
    px = img.load()
    for x in (3.4, 11, 16.4, 27.6, 33, 40.6):
        for (lx, ly) in line_px(x, 19.5, 22, 44):
            if px[lx, ly][3] == 0:
                px[lx, ly] = (200, 190, 230, 255)
    return img


def line_px(x0, y0, x1, y1):
    n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    return {(int(round(x0 + (x1 - x0) * i / n)), int(round(y0 + (y1 - y0) * i / n))) for i in range(n + 1)}


TEXTURES = {'pato_body' + k: v for k, v in frames_of(body, 30).items()}
TEXTURES.update({'pato_hat': hat, 'pato_gun': gun, 'pato_balloons': balloons})
