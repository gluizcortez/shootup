"""
Maromba Miami Vice (id maromba_vice): fisiculturista de bronzeado de spray
laranja e óleo, tronco em V absurdo, bíceps do tamanho da cabeça,
perninhas de palito, shortinho rosa, bandana de bolinha e topinho loiro.
Peças separadas para o esqueleto (MarombaView).
"""
import engine as E
from cast import (GOLD, HAIR_BLOND, HOTPINK, INK, LIME, OUTLINE_TINT, RED, RIM, CYAN, WHITE, sparkle)
from engine import Part, capsule, ellipse, pattern, poly, ramp, render, rrect, union

TAN = ramp('#5a1a14', '#a4401c', '#e8742e', '#ffa25a', '#ffd6a0')
NEONLIME = ramp('#1a4a10', '#3a8a10', '#7ae020', '#a8ff4a', '#e4ffb0')


def oil(x, y):
    """Brilho de óleo: traço branco com miolo."""
    return [(x, y, (255, 255, 255)), (x + 1, y, (255, 236, 200))]


def torso():
    """Quadril em (24, 38); ombros em (24 ± 17, 8); pescoço em (24, 4)."""
    E.init(48, 40)
    shorts = Part(rrect(13, 29, 22, 10, 3), HOTPINK, group='shorts', R=2.4, bias=0.4)
    waist = Part(rrect(13, 29, 22, 2.4, 0), NEONLIME, group='shorts', R=1, lines=False, light=shorts.mask)
    v = Part(poly([(3, 8), (45, 8), (34.4, 32.4), (13.6, 32.4)]), TAN, group='v', R=5, bias=0.3, grad=(0.15, 0.25))
    delt_l = Part(ellipse((7, 10), 6.6, 6.6), TAN, group='dl', R=3.4, bias=0.6)
    delt_r = Part(ellipse((41, 10), 6.6, 6.6), TAN, group='dr', R=3.4, bias=0.6)
    pec_l = Part(ellipse((17, 14.5), 7.6, 5.4), TAN, group='pl', R=3.4, bias=0.6)
    pec_r = Part(ellipse((31, 14.5), 7.6, 5.4), TAN, group='pr', R=3.4, bias=0.6)
    parts = [shorts, waist, v, delt_l, delt_r, pec_l, pec_r]
    for r in range(3):
        for c in range(2):
            parts.append(Part(rrect(19.2 + c * 5.2, 21 + r * 3.4, 4.4, 2.8, 1.2), TAN, group=f'ab{r}{c}', R=1.2,
                              bias=0.6))
    decals = []
    for x, y in ((8, 6.6), (39, 6.6), (14, 11), (28, 11), (20, 21.6), (25, 25), (10, 12)):
        decals += oil(x, y)
    decals += pattern([
        'g.....g',
        '.g...g.',
        '..g.g..',
        '...G...',
    ], (20.6, 7.6), {'g': GOLD[3], 'G': GOLD[4]})
    decals += [(23.6, 11.6, GOLD[2]), (24.6, 11.6, GOLD[4]), (24, 12.6, GOLD[2])]
    decals += [(16, 33, (255, 200, 230)), (17, 33, (255, 200, 230)), (18, 33, (255, 200, 230))]
    decals += sparkle(42, 6)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def head(face):
    """Pescoço (pivô) em (11, 23); nó da bandana em (3.5, 6)."""
    def draw():
        E.init(24, 25)
        trap = Part(poly([(2.4, 24), (20.6, 24), (16.2, 14.6), (6.8, 14.6)]), TAN, group='trap', R=3, bias=0.4)
        skull = Part(rrect(6, 3, 12, 14, 4), TAN, group='head', R=3.4, bias=0.6)
        ear = Part(ellipse((6.6, 10.6), 2, 2.2), TAN, group='ear', R=1.2, shift=-1)
        nose = Part(poly([(17.4, 10.4), (20.6, 13), (17.4, 13.6)]), TAN, group='nose', R=1, bias=0.6, lines=False)
        tuft = Part(rrect(7, 1, 10, 3, 1.4), HAIR_BLOND, group='tuft', R=1, bias=0.6)
        band = Part(rrect(5.4, 4.4, 13.6, 3.6, 0.6), HOTPINK, group='band', R=1.4, bias=0.6)
        decals = [(8, 6, (255, 255, 255)), (11, 5.4, (255, 255, 255)), (15, 6.2, (255, 255, 255))]
        decals += [(x, 9, INK) for x in range(12, 18)]
        if face == 'kiss':
            decals += [(x, 11, INK) for x in range(13, 17)]
            decals += pattern(['.kk.', 'kppk', 'kppk', '.kk.'], (16.6, 13.6), {'k': INK, 'p': (255, 80, 140)})
            decals += [(12, 12.6, (255, 120, 150)), (11, 12.6, (255, 120, 150))]
        else:
            decals += pattern(['ww.', 'wkk', '.k.'], (14, 10.4), {'w': (255, 255, 255), 'k': INK})
            if face == 'grr':
                decals += pattern(['kkkkkkk', 'kwkwkwk', 'kkkkkkk'], (12, 13.6), {'k': INK, 'w': (255, 255, 255)})
                decals += pattern(['v.', '.v', 'v.'], (10, 1.6), {'v': (122, 46, 138)})
                decals += [(9, 13, RED[3]), (8, 13, RED[2])]
            else:
                decals += pattern(['kkkkkkkk', 'kwwwwwwk', '.kwwwwk.', '..kkkk..'], (11.6, 13),
                                  {'k': INK, 'w': (255, 255, 255)})
                decals += sparkle(20, 12)
        decals += oil(9, 4)
        return render([trap, ear, skull, nose, tuft, band], decals, outline_tint=OUTLINE_TINT, rim=RIM)
    return draw


def tails():
    E.init(13, 8)
    a = Part(poly([(0.6, 2.2), (12.4, 0.4), (9, 3.6), (0.6, 5)]), HOTPINK, group='a', R=1.2, bias=0.6)
    b = Part(poly([(0.6, 3.6), (11, 7.4), (7, 4.4)]), HOTPINK, group='b', R=1, bias=0.2, shift=-1)
    return render([b, a], [(5, 3, (255, 255, 255)), (8, 2, (255, 255, 255))], outline_tint=OUTLINE_TINT, rim=None)


def uparm():
    """Bíceps do tamanho da cabeça (apontando para baixo)."""
    E.init(18, 17)
    b = Part(ellipse((9, 9), 7.4, 7.4), TAN, group='b', R=4, bias=0.5, grad=(0.2, 0.0))
    decals = pattern(['v..', 'v..', '.v.', '.v.', '.v.', 'v..', 'v..'], (8, 5), {'v': TAN[1]})
    decals += oil(11, 5) + oil(12, 6)
    return render([b], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def forearm():
    E.init(13, 18)
    fa = Part(rrect(2.5, 0.5, 8, 12, 3.4), TAN, group='f', R=2.4, bias=0.5)
    band = Part(rrect(2.2, 9, 8.6, 3, 0.6), NEONLIME, group='band', R=1.2, bias=0.6)
    fist = Part(ellipse((6.5, 14), 3.6, 3.4), TAN, group='fist', R=2, bias=0.6)
    decals = [(x, 13.6, TAN[1]) for x in range(5, 9)] + oil(8, 4)
    return render([fa, band, fist], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def leg():
    """Perninha de palito: o maromba pulou todos os dias de perna."""
    E.init(9, 24)
    shin = Part(rrect(2.6, 0, 2.4, 15, 1.1), TAN, group='l', R=1, bias=0.5)
    sock = Part(rrect(2, 13, 3.4, 6, 0.8), WHITE, group='s', R=1.2, bias=0.6)
    shoe = Part(rrect(1, 18.6, 7.4, 4.6, 1.8), WHITE, group='sh', R=1.6, bias=0.6, k=3)
    decals = [(2, 14, RED[2]), (3, 14, RED[2]), (4, 14, RED[2]), (2, 15.4, CYAN[2]), (3, 15.4, CYAN[2]),
              (4, 15.4, CYAN[2])]
    decals += [(x, 19.6, HOTPINK[2]) for x in range(3, 7)] + [(x, 22.4, (142, 149, 166)) for x in range(1, 8)]
    return render([shin, sock, shoe], decals, outline_tint=OUTLINE_TINT, rim=RIM)


TEXTURES = {'maromba_torso': torso, 'maromba_head': head('grin'), 'maromba_head_grr': head('grr'),
            'maromba_head_kiss': head('kiss'), 'maromba_tails': tails, 'maromba_uparm': uparm,
            'maromba_forearm': forearm, 'maromba_leg': leg}
