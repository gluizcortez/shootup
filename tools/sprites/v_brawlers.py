"""
Boombox Breaker (id breaker_boombox) e Macho Mammoth (id lutador_mamute).

Breaker: agasalho azul de listras, calça vermelha, tênis branco, Kangol
rosa, dente de ouro, corrente grossa e boombox no ombro; quadro extra de
cabeça para baixo (headspin).
Mammoth: lutador de luta-livre com tronco de geladeira, regata rasgada,
sunga amarela, cinturão de campeão, bandana e bigode loiro em ferradura;
quadro extra da barrigada no ar.
"""
import engine as E
from cast import (BLUE_TRACK, CHROME, CYAN, GOLD, GUNMETAL, HAIR_BLOND, HOTPINK, INK, OUTLINE_TINT, RED, RIM,
                  SKIN_DARK, WHITE, YELLOW, sparkle)
from engine import Part, capsule, ellipse, pattern, poly, ramp, render, rrect, union

TAN = ramp('#5a1e14', '#a0481e', '#e08b4a', '#ffb070', '#ffdcb0')


def sneaker(x, y, color, sh, g):
    p = [Part(rrect(x, y, 9, 5, 2), WHITE, group=g, R=1.6, shift=sh, bias=0.6, k=3)]
    d = [(xx, y + 1.4, color) for xx in range(int(x) + 1, int(x) + 7)]
    d += [(xx, y + 4, (154, 163, 181)) for xx in range(int(x), int(x) + 9)]
    return p, d


def breaker_body():
    """Pés em (17, 49)."""
    E.init(34, 50)
    parts, decals = [], []
    for x, sh in ((8, -1), (17, 0)):
        p, d = sneaker(x, 44, RED[2], sh, f'sn{x}')
        parts += p
        decals += d
    for x, sh in ((9, -1), (17, 0)):
        leg = Part(rrect(x, 29, 7, 16, 2.4), RED, group=f'leg{x}', R=2.4, shift=sh, bias=0.4)
        parts.append(leg)
    decals += [(10.4, y, WHITE[3]) for y in range(30, 44)] + [(22, y, WHITE[4]) for y in range(30, 44)]
    jacket = Part(rrect(8, 16, 18, 15, 4), BLUE_TRACK, group='j', R=3.4, bias=0.4, grad=(0.2, 0.1))
    s1 = Part(rrect(8.6, 19, 17, 1.2, 0), WHITE, group='j', R=3, lines=False, light=jacket.mask)
    s2 = Part(rrect(8.6, 21, 17, 1.2, 0), RED, group='j', R=3, lines=False, light=jacket.mask)
    neck = Part(rrect(15, 13, 5, 4, 1.4), SKIN_DARK, group='neck', R=1, shift=-1)
    head = Part(ellipse((19, 9.5), 7, 7), SKIN_DARK, group='head', R=3.6, bias=0.8)
    nose = Part(ellipse((25.6, 11), 1.4, 1.4), SKIN_DARK, group='nose', R=1, bias=0.4, lines=False)
    hat = Part(rrect(11.2, 1.8, 15.8, 5.4, 2.6), HOTPINK, group='hat', R=2, bias=0.6)
    brim = Part(rrect(9.6, 5.8, 19.8, 2, 0.8), HOTPINK, group='brim', R=1, bias=0.3)
    box = Part(rrect(1, 9, 14, 8, 1.6), CHROME, group='box', R=2, bias=0.4, k=3)
    spk_l = Part(ellipse((4.4, 13), 2.6, 2.6), GUNMETAL, group='box', R=1.4, lines=False, light=box.mask)
    spk_r = Part(ellipse((11.4, 13), 2.6, 2.6), GUNMETAL, group='box', R=1.4, lines=False, light=box.mask)
    hand = Part(ellipse((13.6, 17.4), 2.4, 2.4), SKIN_DARK, group='hand', R=1.4, bias=0.6)
    parts += [jacket, s1, s2, neck, head, nose, hat, brim, box, spk_l, spk_r, hand]
    decals += [(17, y, CHROME[3]) for y in range(17, 30)]
    decals += pattern(['g.......g', '.g.....g.', '..g...g..', '...g.g...', '....G....'], (13, 16.6),
                      {'g': GOLD[3], 'G': GOLD[4]})
    decals += pattern(['.GG.', 'G$$G', '.GG.'], (15.6, 22.6), {'G': GOLD[3], '$': GOLD[1]})
    decals += pattern(['.kk.', 'kwkk', '.kk.'], (21.4, 8.6), {'k': INK, 'w': (255, 255, 255)})
    decals += pattern(['kkkkkk', 'kwwGwk', '.kkkk.'], (19.4, 12.6), {'k': INK, 'w': (255, 255, 255),
                                                                   'G': GOLD[4]})
    decals += [(4.4, 13, CYAN[3]), (11.4, 13, CYAN[3]), (7, 10.4, HOTPINK[3]), (8, 10.4, HOTPINK[3]),
               (9, 10.4, HOTPINK[3])]
    decals += [(3, 8, INK), (4, 7, INK), (5, 6.4, INK)] + [(x, 6.4, INK) for x in range(6, 11)] + [(12, 7, INK),
                                                                                                (13, 8, INK)]
    decals += sparkle(3, 10)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def breaker_spin():
    """Headspin: topo da cabeça (apoio do giro) em (20, 49)."""
    E.init(40, 50)
    parts = []
    for x, sh in ((5, -1), (29, 0)):
        parts.append(Part(rrect(x, 1, 6, 16, 2.4), RED, group=f'l{x}', R=2, shift=sh, bias=0.4))
        parts.append(Part(rrect(x - 2, 0, 9, 5, 2), WHITE, group=f's{x}', R=1.4, shift=sh, bias=0.6))
    hips = Part(rrect(9, 12, 22, 9, 3), RED, group='hips', R=2.4, bias=0.4)
    jacket = Part(rrect(12, 19, 16, 16, 4), BLUE_TRACK, group='j', R=3.4, bias=0.4)
    stripe = Part(rrect(12.6, 24, 15, 1.2, 0), WHITE, group='j', R=3, lines=False, light=jacket.mask)
    hands = [Part(rrect(x, 30, 7, 5, 2), SKIN_DARK, group=f'h{x}', R=1.4, bias=0.6) for x in (4, 29)]
    head = Part(ellipse((20, 39), 6.6, 6.6), SKIN_DARK, group='head', R=3.4, bias=0.6)
    hat = Part(rrect(12.6, 43.6, 14.8, 5, 2), HOTPINK, group='hat', R=1.6, bias=0.6)
    parts += [hips, jacket, stripe] + hands + [head, hat]
    decals = pattern(['.kk..kk.', 'kwkkkwkk', '.kk..kk.'], (16, 39), {'k': INK, 'w': (255, 255, 255)})
    decals += pattern(['.kkkk.', 'kwwwwk', '.kkkk.'], (17, 34.4), {'k': INK, 'w': (255, 255, 255)})
    decals += [(6, y, WHITE[3]) for y in range(2, 16)] + [(33, y, WHITE[3]) for y in range(2, 16)]
    decals += sparkle(20, 46)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def mammoth_body():
    """Pés em (25, 63)."""
    E.init(50, 64)
    parts, decals = [], []
    for x, sh in ((12, -1), (27, 0)):
        parts.append(Part(rrect(x, 50, 11, 13, 3), RED, group=f'b{x}', R=2.6, shift=sh, bias=0.4, k=3))
        parts.append(Part(rrect(x + 0.6, 50.6, 9.8, 4, 1.6), YELLOW, group=f'b{x}', R=1.4, shift=sh, lines=False))
    for x, sh in ((13, -1), (28, 0)):
        parts.append(Part(rrect(x, 40, 9, 12, 3), TAN, group=f't{x}', R=2.6, shift=sh, bias=0.5))
    trunks = Part(rrect(11, 35, 28, 9, 3), YELLOW, group='trunks', R=2.4, bias=0.5)
    tstripe = Part(rrect(11.6, 38.6, 26.8, 1.6, 0), RED, group='trunks', R=1, lines=False, light=trunks.mask)
    torso = Part(rrect(7, 14, 36, 24, 8), TAN, group='torso', R=6, bias=0.5, grad=(0.2, 0.15))
    tank = Part(poly([(12, 16), (38, 16), (36, 24), (32, 21), (28, 27), (24, 22), (20, 28), (16, 22), (13, 26)]),
                RED, group='torso', R=5, lines=False, light=torso.mask)
    tstr = Part(rrect(15, 18, 20, 1.6, 0), YELLOW, group='torso', R=5, lines=False, light=torso.mask)
    belt = Part(rrect(11, 32, 28, 6, 2), ramp('#06040c', '#130f20', '#241c38', '#3a3054', '#5a4c80'), group='belt',
                R=1.6, bias=0.5)
    plate = Part(rrect(20, 30.4, 10, 9, 3), GOLD, group='plate', R=2.4, bias=0.7, k=3)
    arm_l = Part(ellipse((6, 23), 5.6, 8.2), TAN, group='al', R=4, bias=0.6)
    arm_r = Part(ellipse((44, 23), 5.6, 8.2), TAN, group='ar', R=4, bias=0.4, shift=-1)
    fore = Part(rrect(40, 8, 7, 14, 3), TAN, group='fr', R=2.6, bias=0.6)
    fist = Part(ellipse((42.6, 7), 3.6, 3.6), TAN, group='fist', R=2, bias=0.6)
    head = Part(rrect(20, 1, 13, 15, 5), TAN, group='head', R=3.6, bias=0.7)
    band = Part(rrect(19.6, 1.2, 14, 4.4, 0.8), RED, group='band', R=1.4, bias=0.6)
    stache = Part(poly([(24.8, 11.6), (32.2, 11.4), (32.2, 15.4), (31.4, 15.4), (31.2, 12.6), (25.8, 12.6),
                        (25.6, 15.4), (24.8, 15.4)]), HAIR_BLOND, group='stache', R=1, bias=0.6)
    nose = Part(ellipse((33, 9.6), 1.6, 1.6), TAN, group='nose', R=1, bias=0.4)
    parts += [trunks, tstripe, arm_r, torso, tank, tstr, belt, plate, arm_l, fore, fist, head, band, stache, nose]
    decals += [(23, 3.4, YELLOW[4]), (28, 3, YELLOW[4]), (31, 3.6, YELLOW[4])]
    decals += pattern(['ww.', 'wkk', '.k.'], (28.4, 7.4), {'w': (255, 255, 255), 'k': INK})
    decals += [(x, 6, INK) for x in range(27, 32)]
    decals += pattern(['.rr.', 'rRWr', 'rRRr', '.rr.'], (23.6, 33.4), {'r': RED[1], 'R': RED[2], 'W': (255, 220, 220)})
    decals += [(x, 30, TAN[4]) for x in range(16, 22)] + [(x, 30, TAN[4]) for x in range(28, 34)]
    decals += sparkle(22.4, 31.6)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def mammoth_flop():
    """Barrigada no ar: centro do corpo em (32, 20)."""
    E.init(64, 40)
    parts = []
    arm_f = Part(rrect(1, 8, 14, 9, 3), TAN, group='af', R=2.4, bias=0.6, shift=-1)
    leg1 = Part(rrect(49, 8, 14, 9, 3), RED, group='l1', R=2.4, bias=0.4, shift=-1)
    leg2 = Part(rrect(44, 22, 18, 8, 3), RED, group='l2', R=2.4, bias=0.4)
    belly = Part(ellipse((32, 20), 20, 13), TAN, group='belly', R=7, bias=0.5, grad=(0.15, 0.2))
    tank = Part(poly([(16, 10), (40, 9), (44, 18), (38, 16), (32, 22), (26, 15), (20, 20)]), RED, group='belly', R=6,
                lines=False, light=belly.mask)
    trunks = Part(rrect(36, 16, 12, 10, 3), YELLOW, group='tr', R=2.4, bias=0.5)
    belt = Part(rrect(22, 22, 12, 7, 2), GOLD, group='belt', R=2, bias=0.6, k=3)
    arm_b = Part(rrect(3, 22, 14, 8, 3), TAN, group='ab', R=2.4, bias=0.6)
    head = Part(ellipse((11, 13), 7, 7), TAN, group='head', R=3.4, bias=0.7)
    band = Part(rrect(5, 7.4, 12, 3.4, 0.4), RED, group='band', R=1, bias=0.6)
    parts += [arm_f, leg1, leg2, belly, tank, trunks, belt, arm_b, head, band]
    decals = pattern(['.kkkk.', 'kmmmmk', 'kmMMmk', 'kmmmmk', '.kkkk.'], (5, 14), {'k': INK, 'm': (184, 50, 82),
                                                                              'M': (255, 120, 140)})
    decals += [(x, 14, HAIR_BLOND[3]) for x in range(4, 12)]
    decals += [(45, y, YELLOW[3]) for y in range(9, 16)] + [(45, y, YELLOW[3]) for y in range(23, 29)]
    decals += pattern(['k.k', '.k.', 'k.k'], (10, 9.4), {'k': INK})
    decals += sparkle(27, 24)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


TEXTURES = {'breaker_body': breaker_body, 'breaker_spin': breaker_spin, 'lutador_body': mammoth_body,
            'lutador_flop': mammoth_flop}
