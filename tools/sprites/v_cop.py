"""
Policial de Miami Corrupto (id policial_corrupto): blazer rosa pastel de
ombreira com manga arregaçada, camisa turquesa aberta no peito cabeludo,
calça de linho, mocassim sem meia, mullet engomado, bigodão, distintivo no
cinto, dinheiro sujo no bolso, Ray-Ban espelhado, giroflex nas costas e
pistolona cromada com mira laser.
"""
import engine as E
from cast import (BLACK, BROWN, CHROME, CREAM, GOLD, GREEN, GUNMETAL, HAIR_BROWN, HOTPINK, INK, OUTLINE_TINT,
                  PURPLE, RED, RIM, SKIN, TEAL, WHITE, sparkle)
from engine import Part, ellipse, pattern, poly, ramp, render, rrect, union

BLAZER = ramp('#6a2a50', '#b0607e', '#f29abb', '#ffbcd4', '#ffe4ee')
TAN_SHOE = ramp('#3a2010', '#6a4220', '#a87a44', '#c8a46a', '#ecd29c')
BLUE = ramp('#0a1050', '#1430a0', '#2d6bff', '#70a0ff', '#c0d8ff')
DONUT = ramp('#4a2010', '#8a5228', '#d9a35e', '#f0c88a', '#fff0c8')


def body():
    """Pés em (20, 53)."""
    E.init(40, 54)
    parts, decals = [], []
    for x0, sh in ((14, -1), (22, 0)):
        parts.append(Part(rrect(x0, 47, 8, 4.6, 1.8), TAN_SHOE, group=f'sh{x0}', R=1.4, shift=sh, k=3, bias=0.4))
    for x0, sh in ((15, -1), (22, 0)):
        parts.append(Part(rrect(x0, 32, 6.4, 16, 2), CREAM, group=f'leg{x0}', R=2.2, shift=sh, bias=0.4))
    belt = Part(rrect(14, 31, 15, 2.6, 0.4), BLACK, group='belt', R=1)
    badge = Part(rrect(23, 30.4, 5, 3.8, 1), GOLD, group='badge', R=1.2, bias=0.8, k=3)
    blazer = Part(rrect(11, 15, 21, 18, 5), BLAZER, group='blazer', R=4, bias=0.4, grad=(0.2, 0.15))
    shirt = Part(poly([(18, 15.4), (27, 15.4), (22.5, 28)]), TEAL, group='shirt', R=2, bias=0.4)
    chest = Part(poly([(19.6, 15.4), (25.4, 15.4), (22.5, 25)]), SKIN, group='chest', R=1.6, bias=0.4, lines=False)
    lapel_l = Part(poly([(16, 15), (19, 15), (20.4, 25)]), BLAZER, group='lapel', R=1, bias=1.4, lines=False)
    lapel_r = Part(poly([(29, 15), (26, 15), (24.8, 25)]), BLAZER, group='lapel2', R=1, bias=1.4, lines=False)
    cash = Part(rrect(12.6, 23, 5, 3, 0.6), GREEN, group='cash', R=1, bias=0.4)
    parts += [belt, badge, blazer, shirt, chest, lapel_l, lapel_r, cash]
    neck = Part(rrect(20, 11, 6, 5, 1.6), SKIN, group='neck', R=1.4, shift=-1)
    head = Part(ellipse((24, 8.5), 7.4, 7.4), SKIN, group='head', R=3.6, bias=0.7)
    mullet = Part(poly([(16.6, 6.4), (19.4, 1), (26.8, 0.6), (30.6, 4.2), (24, 2.8), (20.4, 6.6), (20.6, 13.4),
                        (17.4, 11.6)]), HAIR_BROWN, group='hair', R=2, bias=0.6)
    ear = Part(ellipse((19.6, 9.4), 2.2, 2.2), SKIN, group='ear', R=1.2, bias=0.4)
    stache = Part(poly([(23.6, 11), (31, 10.6), (31.6, 13.4), (29, 12.4), (26.6, 13.4), (23.4, 13)]), HAIR_BROWN, shift=-1,
                  group='stache', R=1.2, bias=0.6)
    nose = Part(ellipse((31, 9.4), 1.7, 1.7), SKIN, group='nose', R=1, bias=0.6, lines=False)
    parts += [neck, head, mullet, ear, stache, nose]
    # pelos e corrente
    decals += [(21.4, 18.6, BROWN[1]), (23.4, 19.6, BROWN[1]), (22.2, 21.6, BROWN[1]), (23, 17.4, BROWN[1])]
    decals += pattern(['g.....g', '.g...g.', '..g.g..', '...G...'], (19.6, 15.6), {'g': GOLD[3], 'G': GOLD[4]})
    # barba por fazer e sorrisinho torto
    for x, y in ((25, 12), (27, 13), (29, 14), (26, 14), (24, 13), (28, 15)):
        decals.append((x, y, SKIN[1]))
    decals += [(26.6, 14.6, INK), (27.6, 14.6, INK), (28.6, 14.2, INK)]
    decals += [(25.5, 32.3, (255, 243, 176))]
    decals += [(14, 24, GREEN[4]), (15, 24, GREEN[4]), (16, 24, GREEN[4])]
    decals += sparkle(26, 31)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def shades():
    E.init(15, 6)
    l = Part(rrect(0.6, 0.6, 6.4, 5, 1.6), PURPLE, group='l', R=1.4, bias=0.8)
    r = Part(rrect(7.6, 0.6, 6.4, 5, 1.6), PURPLE, group='r', R=1.4, bias=0.8)
    decals = [(x, 4, HOTPINK[3]) for x in (2, 3, 4, 5, 9, 10, 11, 12)]
    decals += [(2.4, 1.8, (255, 255, 255)), (3.4, 1.8, (255, 255, 255)), (9.4, 1.8, (255, 255, 255)),
               (10.4, 1.8, (255, 255, 255)), (6, 1, INK), (7, 1, INK)]
    return render([l, r], decals, outline_tint=OUTLINE_TINT, rim=None)


def siren():
    """Mochila a jato improvisada com giroflex de viatura no topo."""
    E.init(20, 28)
    pack = Part(rrect(3, 9, 14, 16, 3), WHITE, group='p', R=3, bias=0.4)
    stripe = Part(rrect(3, 15, 14, 4, 0), BLACK, group='p', R=3, lines=False, light=pack.mask)
    nozzle = Part(rrect(5, 24, 10, 3.4, 1), GUNMETAL, group='n', R=1.2, shift=-1)
    base = Part(rrect(1.5, 4.6, 17, 4.6, 1.6), GUNMETAL, group='b', R=1.4, bias=0.6)
    red = Part(rrect(2.6, 1, 7, 5, 2), RED, group='r', R=1.8, bias=0.8)
    blue = Part(rrect(10.4, 1, 7, 5, 2), BLUE, group='bl', R=1.8, bias=0.8)
    decals = [(x, 16.8, WHITE[4]) for x in range(6, 14)]
    decals += [(7, 16.8, INK), (9, 16.8, INK), (11.4, 16.8, INK)]
    decals += [(4, 2, (255, 230, 230)), (5, 2, (255, 230, 230)), (12, 2, (230, 240, 255)), (13, 2, (230, 240, 255))]
    return render([nozzle, pack, stripe, base, red, blue], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def gun():
    E.init(32, 13)
    sleeve = Part(rrect(0.5, 3.5, 9, 5, 2.2), BLAZER, group='s', R=1.6, bias=0.5)
    wrist = Part(rrect(8, 4, 4, 4, 1.6), SKIN, group='w', R=1, bias=0.4)
    fist = Part(ellipse((13, 6.6), 2.8, 2.8), SKIN, group='f', R=1.6, bias=0.6)
    slide = Part(rrect(12, 2, 17, 5, 1), CHROME, group='g', R=1.6, bias=0.6, k=3)
    grip = Part(rrect(13.6, 5.6, 4, 6, 1), GUNMETAL, group='gr', R=1, shift=-1)
    laser = Part(rrect(22, 6.6, 6, 2.6, 0.8), BLACK, group='l', R=1, bias=0.6)
    decals = [(x, 2.6, (255, 255, 255)) for x in range(13, 27)]
    decals += [(28, 7.4, RED[3]), (28, 8.4, RED[2]), (29, 7.9, (255, 200, 200))]
    return render([grip, sleeve, wrist, slide, laser, fist], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def donut():
    E.init(14, 14)
    d = Part(ellipse((7, 7), 6, 6) & ~ellipse((7, 7), 1.8, 1.8), DONUT, group='d', R=2.6, bias=0.5)
    icing = Part(ellipse((7, 6.6), 4.8, 4.6) & ~ellipse((7, 7), 2.4, 2.4), HOTPINK, group='i', R=2, bias=0.6,
                 lines=False)
    decals = [(4, 4.6, (255, 225, 77)), (5, 4.6, (255, 225, 77)), (8.6, 3.8, (120, 230, 255)),
              (9.4, 8.6, (255, 225, 77)), (10.4, 8.6, (255, 225, 77)), (4.6, 9, (120, 230, 255)),
              (4.6, 10, (120, 230, 255))]
    return render([d, icing], decals, outline_tint=OUTLINE_TINT, rim=None)


TEXTURES = {'policial_body': body, 'policial_shades': shades, 'policial_siren': siren, 'policial_gun': gun,
            'policial_donut': donut}
