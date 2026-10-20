"""
Tio do Cassino (id porco_executivo): mafioso de cassino decadente.
Terno verde-limão xadrez rosa, camisa de oncinha estourando os botões,
barrigão de fora, três correntes de ouro, óculos rosados, bigodão de
vassoura, dente de ouro, charuto aceso, porkpie com hélice de baralho e um
caça-níquel que cospe moedas.
"""
from scipy import ndimage

import engine as E
from cast import (BROWN, CREAM, CYAN, GOLD, GREEN, GREY, GUNMETAL, HOTPINK, INK, LIME, OUTLINE_TINT, PINK, RED,
                  RIM, SKIN, WHITE, YELLOW, checker_tex, sparkle)
from engine import Part, capsule, ellipse, pattern, poly, ramp, render, rrect, union

LEOPARD = ramp('#5a3010', '#a0661a', '#e0a830', '#ffd060', '#fff0b0')
CIGAR = ramp('#20100a', '#40200e', '#6a3a1a', '#8e5a2a', '#b88048')


def plaid(idx, m):
    """Trama do tecido: quadradinhos alternando meio tom."""
    out = idx.copy()
    out[(((E.XX // 5) + (E.YY // 5)) % 2 == 0) & m] -= 1
    return out


def body():
    E.init(46, 46)
    parts, decals = [], []
    # sapato bicolor de malandro
    for x0, sh in ((12.6, -1), (24.6, 0)):
        parts.append(Part(rrect(x0, 40, 8.6, 5, 1.8), CREAM, group=f'shoe{x0}', R=1.4, shift=sh, k=3))
        parts.append(Part(rrect(x0 + 4, 40.6, 3.6, 3.8, 0), BROWN, group=f'shoe{x0}', R=1, lines=False, shift=sh))
    for x0, sh in ((15, -1), (25, 0)):
        parts.append(Part(rrect(x0, 32, 6, 9, 1.5), LIME, group=f'leg{x0}', R=2, shift=sh, tex=plaid))
    coat = Part(ellipse((22, 27), 17.4, 11.8), LIME, group='coat', R=4.5, bias=0.5, grad=(0.2, 0.1), tex=plaid)
    shirt = Part(poly([(18.2, 17.2), (29.4, 17.2), (35, 29.6), (30.4, 38), (21.6, 38), (19, 28)]), LEOPARD,
                 group='shirt', R=3, bias=0.5)
    belly = Part(ellipse((26, 34.4), 10.6, 6.2), SKIN, group='belly', R=3.4, bias=0.6)
    chest = Part(poly([(21, 16.4), (28.6, 16.4), (25, 21.6)]), SKIN, group='chest', R=1.4, bias=0.4, lines=False)
    lapel = Part(poly([(16, 16.5), (20.6, 16.5), (19.6, 27), (15.6, 21)]), LIME, group='lapel', R=1.4, bias=1.2,
                 lines=False)
    parts += [coat, shirt, belly, chest, lapel]
    # cabeção careca com papada
    jowl = Part(ellipse((24, 18), 8, 3.4), SKIN, group='jowl', R=2, bias=0.4, shift=-1)
    head = Part(ellipse((25, 10), 10, 9.8), SKIN, group='head', R=4.5, bias=0.8)
    side = Part(poly([(14.6, 7), (17.6, 5.4), (17, 13.6), (14.8, 12.6)]), GREY, group='head', R=1.4, lines=False,
                light=head.mask)
    nose = Part(ellipse((35, 11), 2.6, 2.4), ramp('#6a2030', '#a0404a', '#e07a7a', '#ff9e94', '#ffd0c4'),
                group='nose', R=1.6, bias=0.6)
    stache = Part(poly([(26, 13), (36, 12.4), (37, 15.4), (31, 14.6), (26, 16)]), BROWN, group='stache', R=1.4,
                  bias=0.6, lines=False)
    cigar = Part(rrect(34, 14.6, 9, 2.6, 1.2), CIGAR, group='cigar', R=1, bias=0.6)
    parts += [jowl, head, side, stache, nose, cigar]
    # xadrez rosa no terno, só onde o terno aparece
    front = shirt.mask | belly.mask | chest.mask | jowl.mask | head.mask
    suit = (coat.mask | parts[4].mask | parts[5].mask) & ~front
    grid = ((E.XX % 5 == 0) | (E.YY % 5 == 0)) & ndimage.binary_erosion(suit)
    for y, x in zip(*grid.nonzero()):
        decals.append((x, y, HOTPINK[3] if x + y < 40 else HOTPINK[2]))
    # oncinha
    for x, y in ((21, 20), (26, 19.6), (23.6, 24), (28.4, 23.4), (31.4, 27), (21.6, 28.4), (32, 31)):
        decals += pattern(['.b', 'b.'], (x, y), {'b': BROWN[1]})
    # umbigo, pelos, botões
    decals += [(26.4, 34.4, SKIN[0]), (26.4, 35.4, SKIN[1])]
    decals += [(23.4, 17.6, BROWN[1]), (25.6, 18.4, BROWN[1]), (24.6, 19.8, BROWN[1])]
    decals += [(22.4, 30.4, WHITE[4]), (24, 27, WHITE[4]), (38.5, 25, WHITE[4])]
    # três correntes e medalhão de cifrão
    decals += pattern([
        'g......g',
        '.g....g.',
        'G.g..g.G',
        '.G.gg.G.',
        '..G..G..',
        '...GG...',
    ], (21, 17), {'g': GOLD[3], 'G': GOLD[4]})
    decals += pattern(['.ooo.', 'oo$oo', 'oo$oo', '.ooo.'], (22.6, 22.6), {'o': GOLD[2], '$': INK})
    # óculos rosados
    decals += pattern([
        'kkkkkkkkkkkk',
        'kpwpkkkpwpkk',
        'kpppk.kpppk.',
        '.kkk...kkk..',
    ], (23.6, 6.2), {'k': INK, 'p': PINK[3], 'w': (255, 255, 255)})
    # boca com dente de ouro
    decals += pattern(['kkkkk', 'kGkkk'], (30, 15.6), {'k': INK, 'G': GOLD[4]})
    # pente-e-vem na careca
    decals += pattern(['..gggggggggg', 'gg..........'], (17, 1.4), {'g': GREY[1]})
    decals += [(22, 3, (255, 255, 240)), (23, 3, (255, 255, 240)), (24, 2.6, (255, 240, 220))]
    # brasa e fumaça do charuto, lenço no bolso
    decals += [(43, 15, (255, 90, 42)), (43, 16, (255, 225, 77)), (42.6, 15.6, (255, 140, 60))]
    decals += [(36.4, 15, GOLD[3]), (36.4, 16, GOLD[2])]
    decals += pattern(['.ss', 's..', '.s.'], (42.6, 8.6), {'s': (200, 200, 220)})
    decals += pattern(['pp.', 'ppp'], (9.6, 18.6), {'p': HOTPINK[3]})
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def hat():
    """Porkpie apertado na careca, com pena e mastro da hélice."""
    E.init(20, 16)
    brim = Part(rrect(1, 11, 18, 3.4, 1.6), ramp('#06040c', '#140f24', '#2a1f3a', '#44345c', '#6a5490'), group='b',
                R=1.2, bias=0.6)
    crown = Part(rrect(5, 5.6, 10, 6.6, 1.6), ramp('#06040c', '#140f24', '#2a1f3a', '#44345c', '#6a5490'),
                 group='c', R=2, bias=0.6)
    band = Part(rrect(5, 9.6, 10, 1.6, 0), HOTPINK, group='c', R=1, lines=False, light=crown.mask)
    feather = Part(poly([(13, 10), (18, 3), (16, 9.4)]), CYAN, group='f', R=1, bias=0.6)
    mast = Part(rrect(9, 0, 2, 6, 0.4), GUNMETAL, group='m', R=1, bias=0.6, shift=-1)
    return render([mast, brim, crown, band, feather], [], outline_tint=OUTLINE_TINT, rim=RIM)


def heli():
    """Hélice de duas cartas de baralho (um ás e um coringa)."""
    E.init(40, 6)
    a = Part(rrect(1, 0.8, 18, 4.4, 1), CREAM, group='a', R=1.2, bias=0.8)
    b = Part(rrect(21, 0.8, 18, 4.4, 1), CREAM, group='b', R=1.2, bias=0.8)
    hub = Part(ellipse((20, 3), 2, 2), GOLD, group='h', R=1, bias=0.6)
    decals = pattern(['.k.', 'kkk'], (7, 2), {'k': INK}) + [(30, 2, RED[2]), (29, 3, RED[2]), (31, 3, RED[2]),
                                                          (30, 3, RED[3]), (2, 1.4, RED[2]), (37, 3.6, RED[2])]
    return render([a, b, hub], decals, outline_tint=OUTLINE_TINT, rim=None)


def case():
    """Caça-níquel na mão cheia de anéis (pivô em x=4); cospe moedas pela bandeja."""
    E.init(31, 21)
    cab = Part(rrect(8, 3, 19, 17, 3), RED, group='cab', R=3.4, bias=0.6, k=3)
    sign = Part(rrect(9.6, 0.6, 16, 4.4, 2), GOLD, group='sign', R=1.4, bias=0.6)
    window = Part(rrect(10, 6, 15, 6.6, 1), CREAM, group='win', R=1.4, bias=0.4)
    tray = Part(rrect(24, 14, 6, 4, 1), GOLD, group='tray', R=1.2, bias=0.6)
    lever = Part(capsule((27, 6), (29, 1.6), 0.7), GUNMETAL, group='lev', R=0.8, shift=-1)
    knob = Part(ellipse((29, 1.6), 1.6, 1.6), RED, group='knob', R=1, bias=0.8)
    cuff = Part(rrect(0, 3.6, 5, 4.6, 2), LIME, group='cuff', R=1.4, tex=plaid)
    hand = Part(rrect(1, 7, 8, 7, 3), SKIN, group='hand', R=2, bias=0.5)
    decals = []
    decals += pattern(['rrr', '..r', '.r.', '.r.'], (11.4, 7.2), {'r': RED[2]})
    decals += pattern(['rrr', '..r', '.r.', '.r.'], (15.8, 7.2), {'r': RED[2]})
    decals += pattern(['.g.', 'c.c', 'cc.'], (20.4, 7.4), {'g': GREEN[3], 'c': HOTPINK[2]})
    for x in (11.4, 16.4, 21.4):
        decals += [(x, 2, YELLOW[4]), (x + 1, 2, RED[3])]
    decals += pattern(['kkkkk'], (25, 15.4), {'k': INK})
    decals += [(27.4, 13.6, GOLD[4])]
    decals += [(3, y, GOLD[3]) for y in range(8, 14)] + [(5.4, y, GOLD[3]) for y in range(8, 14)]
    decals += [(3.6, 8.4, CYAN[3]), (5.8, 12.4, RED[3])]
    decals += sparkle(14, 4.6)
    return render([lever, cab, sign, window, tray, knob, cuff, hand], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def coin():
    E.init(14, 14)
    c = Part(ellipse((7, 7), 5.8, 5.8), GOLD, group='c', R=2.6, bias=0.7, k=3)
    decals = pattern(['.$$$.', '$....', '.$$$.', '....$', '.$$$.'], (4.6, 4.4), {'$': GOLD[1]})
    decals += [(7, 3.4, GOLD[1]), (7, 10.6, GOLD[1])]
    decals += sparkle(4, 4)
    return render([c], decals, outline_tint=OUTLINE_TINT, rim=None)


TEXTURES = {'porco_body': body, 'porco_hat': hat, 'porco_heli': heli, 'porco_case': case, 'b_coin': coin}
