"""
Patinador Assassino (id patinador_assassino): patins a jato, polainas
listradas, joelheira, shortinho roxo, regata neon com raio, sorrisão
"RADICAL!" de aparelho, viseira de plástico e uma juba de permanente loira
com mecha rosa. Uzi rosa-choque.
"""
import engine as E
from cast import (EYE, MOUTH, face_part, frames_of, sweat, BLACK, CYAN, GUNMETAL, HAIR_BLOND, HOTPINK, INK, OUTLINE_TINT, PURPLE, RED, RIM, SKIN, WHITE,
                  YELLOW, sparkle)
from engine import Part, ellipse, pattern, poly, render, rrect, union


def body(face='idle'):
    """Pés (centro das rodinhas) em (18, 53)."""
    E.init(36, 54)
    parts, decals = [], []
    for x, sh in ((9, -1), (19, 0)):
        g = f's{x}'
        parts.append(Part(ellipse((x + 1.6, 52), 1.6, 1.6), CYAN, group=g + 'w', R=1, shift=sh, bias=0.6))
        parts.append(Part(ellipse((x + 7, 52), 1.6, 1.6), YELLOW, group=g + 'w', R=1, shift=sh, bias=0.6))
        parts.append(Part(rrect(x, 45, 9, 5, 1.6), WHITE, group=g, R=1.6, shift=sh, bias=0.6))
        parts.append(Part(rrect(x - 0.4, 49.4, 10, 1.4, 0), BLACK, group=g, R=1, shift=sh, lines=False))
        decals += [(xx, 46.6, HOTPINK[2] if sh == 0 else HOTPINK[1]) for xx in range(x + 1, x + 9)]
    for x, sh in ((10.2, -1), (20.2, 0)):
        g = f'l{x}'
        parts.append(Part(rrect(x + 1, 31, 4.6, 7, 1.6), SKIN, group=g + 'k', R=1.2, shift=sh))
        warmer = Part(rrect(x, 37, 6.4, 9, 2), HOTPINK, group=g, R=2, shift=sh, bias=0.4)
        parts.append(warmer)
        parts.append(Part(rrect(x, 39.6, 6.4, 1.6, 0), CYAN, group=g, R=2, shift=sh, lines=False, light=warmer.mask))
        parts.append(Part(rrect(x, 42.4, 6.4, 1.6, 0), YELLOW, group=g, R=2, shift=sh, lines=False,
                          light=warmer.mask))
        parts.append(Part(rrect(x - 0.4, 33.2, 7.2, 4.6, 2), BLACK, group=g + 'p', R=1.6, shift=sh, bias=0.8))
        decals += [(x + 3.2, 35.4, RED[3])]
    shorts = Part(rrect(10, 25, 17, 8, 3), PURPLE, group='shorts', R=2.4, bias=0.5)
    stripe = Part(rrect(10, 27.4, 17, 1.2, 0), CYAN, group='shorts', R=1, lines=False, light=shorts.mask)
    tank = Part(rrect(11, 14, 15, 13, 4), YELLOW, group='tank', R=3.4, bias=0.4, grad=(0.2, 0.1))
    bolt = Part(poly([(19, 15), (15, 21), (18.6, 21), (16, 26), (22, 19), (18.6, 19), (21, 15)]), HOTPINK,
                group='tank', R=3.4, lines=False, light=tank.mask)
    neck = Part(rrect(17.6, 11, 4.4, 4, 1.2), SKIN, group='neck', R=1, shift=-1)
    headp = Part(ellipse((21, 7.5), 6.6, 6.6), SKIN, group='head', R=3.4, bias=0.7)
    nose = Part(ellipse((27.4, 8.6), 1.4, 1.4), SKIN, group='nose', R=1, bias=0.6, lines=False)
    parts += [shorts, stripe, tank, bolt, neck, headp, nose]
    # olho arregalado de quem tomou 4 latas de refrigerante
    decals += face_part(face, EYE, ['.kk.', 'kwwk', 'kwKk', '.kk.'], (22, 5.4), {'k': INK, 'w': (255, 255, 255), 'K': INK},
                        SKIN[3])
    # sorrisão com aparelho
    decals += face_part(face, MOUTH, [
        'kkkkkkk',
        'kwmwmwk',
        'kwwwwwk',
        '.kkkkk.',
    ], (20.4, 10), {'k': INK, 'w': (255, 255, 255), 'm': (150, 160, 190)}, SKIN[2])
    if face == 'hurt':
        decals += sweat(17, 3)
    decals += [(19, 10, (255, 122, 168)), (18, 10, (255, 122, 168)), (28, 6, INK)]
    decals += sparkle(14, 17)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def hair():
    """Juba de permanente gigante, loira com mecha rosa."""
    E.init(32, 28)
    puffs = [(16, 10, 9), (8, 13, 7), (24, 9, 7.5), (6, 20, 6), (12, 22, 6), (20, 18, 6.5), (27, 14, 5), (9, 6, 5.5)]
    mask = union(*[ellipse((x, y), r + 0.4, r + 0.4) for x, y, r in puffs])
    blond = Part(mask, HAIR_BLOND, group='h', R=4, bias=0.4, grad=(0.2, 0.2))
    pink = Part(union(ellipse((10, 21), 3.6, 3.6), ellipse((6, 15), 2.8, 2.8)), HOTPINK, group='h', R=4,
                lines=False, light=mask)
    decals = []
    # cachos: arquinhos escuros e claros
    for x, y, r in puffs:
        decals += [(x - r * 0.5, y - r * 0.2, HAIR_BLOND[1]), (x - r * 0.5 + 1, y - r * 0.5, HAIR_BLOND[1]),
                   (x - r * 0.3, y - r * 0.6, HAIR_BLOND[4]), (x + r * 0.3, y + r * 0.3, HAIR_BLOND[1])]
    decals += sparkle(14, 4)
    return render([blond, pink], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def visor():
    E.init(18, 8)
    v = Part(poly([(0.6, 2.6), (12, 1.6), (17.4, 4.6), (12, 6), (0.6, 5.6)]), CYAN, group='v', R=1.4, bias=0.6)
    tint = Part(poly([(8, 2.4), (12, 2.2), (16.4, 4.6), (12, 5.6)]), HOTPINK, group='v', R=1.4, lines=False,
                light=v.mask)
    decals = [(x, 3, (255, 255, 255)) for x in range(3, 8)]
    return render([v, tint], decals, outline_tint=OUTLINE_TINT, rim=None)


def gun():
    E.init(28, 11)
    arm = Part(rrect(0.5, 3.5, 9, 4, 2), SKIN, group='a', R=1.4, bias=0.5)
    cuff = Part(rrect(6.5, 3.4, 2.4, 4.2, 0.4), RED, group='c', R=1, bias=0.6, lines=False)
    glove = Part(ellipse((10.5, 5.5), 2.6, 2.6), BLACK, group='g', R=1.4, bias=0.8)
    uzi = Part(rrect(11, 2, 13, 5, 1), HOTPINK, group='u', R=1.6, bias=0.6, k=3)
    grip = Part(rrect(13, 5.6, 3.4, 5, 1), GUNMETAL, group='gr', R=1, shift=-1)
    mag = Part(rrect(17.6, 5.4, 2.4, 4.6, 0.8), GUNMETAL, group='m', R=1, shift=-1)
    muzzle = Part(rrect(23.4, 3, 4, 2.6, 0.6), GUNMETAL, group='mz', R=1, bias=0.4)
    decals = [(x, 2.6, (255, 220, 240)) for x in range(12, 22)]
    return render([grip, mag, arm, cuff, uzi, muzzle, glove], decals, outline_tint=OUTLINE_TINT, rim=RIM)


TEXTURES = {**{'patinador_body' + k: v for k, v in frames_of(body, 33).items()}, 'patinador_hair': hair, 'patinador_visor': visor, 'patinador_gun': gun}
