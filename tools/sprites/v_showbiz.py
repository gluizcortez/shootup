"""
DJ Laser Bass (id dj_neon), The Great Vegasini (id magico_vegas) e
Mr. But-Wait (id vendedor_tv).

DJ: hi-top de 30 cm, óculos de persiana, regata de tela, agasalho preto de
listras neon, fones gigantes, pick-up voador e caixinha de som de mão.
Vegasini: fraque de lantejoula roxa, capa de forro vermelho, cartola,
bigode enrolado, cavanhaque, Ás de copas voador e leque de cartas.
But-Wait: vendedor de infomercial de paletó xadrez, gravata larga, sorrisão
de comercial, gota de suor, headset, peruca, TV de tubo voadora e
celular-tijolo.
"""
import engine as E
from cast import (BLACK, BROWN, CHROME, CREAM, CYAN, GREEN, GUNMETAL, HAIR_BLACK, HOTPINK, INK, ORANGE, OUTLINE_TINT,
                  PURPLE, RED, RIM, SKIN, SKIN_TAN, TEAL, WHITE, YELLOW, BLUE_TRACK, sequin_tex, sparkle)
from engine import Part, capsule, ellipse, pattern, poly, ramp, render, rrect, union

SKIN_B = ramp('#3a1a20', '#6a3a30', '#a4684a', '#c98a5e', '#eab88a')
TRACK_BLACK = ramp('#06040c', '#130f20', '#241c38', '#3a3054', '#5a4c80')
MESH = ramp('#5a3a10', '#a07a10', '#e0c020', '#ffe870', '#fffbd0')
VEGAS = ramp('#1a0838', '#3a1478', '#7b2cbf', '#b37cff', '#e4ccff')
TAN_PANTS = ramp('#2a1810', '#4a3020', '#6a4a30', '#8a6a4a', '#b09070')
WOOD = ramp('#2a1608', '#4a2c14', '#6b4a2c', '#8a6a4a', '#b09070')


def sneaker(x, y, color, sh, g):
    p = [Part(rrect(x, y, 9, 5, 2), WHITE, group=g, R=1.6, shift=sh, bias=0.6, k=3)]
    d = [(xx, y + 1.4, color) for xx in range(int(x) + 1, int(x) + 7)]
    d += [(xx, y + 4, (154, 163, 181)) for xx in range(int(x), int(x) + 9)]
    return p, d


def dj_body():
    """Pés em (18, 51)."""
    E.init(36, 52)
    parts, decals = [], []
    for x, sh in ((8, -1), (18, 0)):
        p, d = sneaker(x, 46, CYAN[2], sh, f'sn{x}')
        parts += p
        decals += d
    for x, sh in ((10, -1), (18, 0)):
        parts.append(Part(rrect(x, 31, 7, 16, 2.4), TRACK_BLACK, group=f'l{x}', R=2.2, shift=sh, bias=0.6))
    decals += [(11, y, HOTPINK[2]) for y in range(32, 46)] + [(12.4, y, CYAN[2]) for y in range(32, 46)]
    decals += [(23.4, y, HOTPINK[3]) for y in range(32, 46)] + [(22.2, y, CYAN[3]) for y in range(32, 46)]
    tank = Part(rrect(10, 18, 16, 15, 4), MESH, group='tank', R=3.4, bias=0.4,
                tex=lambda idx, m: idx - (((E.XX % 3) == 0) & ((E.YY % 3) == 0) & m))
    neck = Part(rrect(17, 15, 5, 5, 1.4), SKIN_B, group='neck', R=1, shift=-1)
    head = Part(ellipse((20, 12.4), 7, 7), SKIN_B, group='head', R=3.6, bias=0.8)
    hitop = Part(rrect(13, 0.4, 14.2, 8.4, 1.6), HAIR_BLACK, group='hair', R=2.4, bias=-0.2,
                 tex=lambda idx, m: idx + ((((E.XX + E.YY) % 3) == 0) & m))
    nose = Part(ellipse((27.4, 13.2), 1.4, 1.4), SKIN_B, group='nose', R=1, bias=0.4, lines=False)
    parts += [tank, neck, head, hitop, nose]
    decals += [(x, 2.6, HOTPINK[3]) for x in range(14, 27)]
    decals += pattern(['kkkkkkkkkk', 'kyyyyyyyyk', 'kkkkkkkkkk', 'kyyyyyyyyk', 'kkkkkkkkkk'], (18.6, 9.4),
                      {'k': INK, 'y': YELLOW[3]})
    decals += pattern(['kkkkkk', 'kwwwwk', '.kkkk.'], (20.4, 15.2), {'k': INK, 'w': (255, 255, 255)})
    decals += pattern(['g.......g', '.g.....g.', '..g...g..', '...g.g...', '....G....'], (13.6, 18.6),
                      {'g': (160, 100, 14), 'G': (255, 250, 200)})
    decals += pattern(['.oo.', 'o$$o', '.oo.'], (16.6, 27.4), {'o': (160, 100, 14), '$': (255, 250, 200)})
    decals += sparkle(15, 4)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def dj_deck():
    E.init(46, 14)
    deck = Part(rrect(1, 3, 44, 9, 2), GUNMETAL, group='d', R=2, bias=0.5, k=3)
    glow = Part(rrect(2, 10, 42, 1, 0), CYAN, group='d', R=1, lines=False, light=deck.mask)
    rec_l = Part(ellipse((12, 5), 8.4, 2.6), BLACK, group='r1', R=1.4, bias=0.6)
    rec_r = Part(ellipse((34, 5), 8.4, 2.6), BLACK, group='r2', R=1.4, bias=0.6)
    decals = [(x, 5, HOTPINK[3]) for x in range(10, 15)] + [(x, 5, YELLOW[3]) for x in range(32, 37)]
    decals += [(x, y, CHROME[3]) for x in range(21, 25) for y in range(5, 8)]
    decals += [(22, 9, RED[3]), (24.4, 9, GREEN[3])]
    decals += [(8, 4, (255, 255, 255)), (30, 4, (255, 255, 255))]
    return render([deck, glow, rec_l, rec_r], decals, outline_tint=OUTLINE_TINT, rim=None)


def dj_phones():
    E.init(22, 18)
    band = Part(union(capsule((4, 9), (6, 2), 1.1), capsule((6, 2), (16, 2), 1.1), capsule((16, 2), (18, 9), 1.1)),
                CHROME, group='b', R=1, bias=0.6)
    cups = [Part(rrect(x, 8, 7, 9, 3), HOTPINK, group=f'c{x}', R=2.4, bias=0.6, k=3) for x in (0.5, 14.5)]
    decals = [(2, y, (255, 200, 236)) for y in range(10, 14)] + [(16, y, (255, 200, 236)) for y in range(10, 14)]
    return render([band] + cups, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def dj_gun():
    E.init(30, 16)
    arm = Part(rrect(0.5, 5, 9, 5, 2.2), SKIN_B, group='a', R=1.6, bias=0.5)
    fist = Part(ellipse((10, 7.6), 2.6, 2.6), SKIN_B, group='f', R=1.4, bias=0.6)
    box = Part(rrect(10, 1, 18, 14, 2.4), GUNMETAL, group='box', R=3, bias=0.5, k=3)
    cone = Part(ellipse((22, 8), 5, 5), BLACK, group='cone', R=2, bias=0.6)
    tw = Part(ellipse((14, 5), 2, 2), BLACK, group='tw', R=1, bias=0.6)
    decals = []
    for y in range(4, 13):
        for x in range(18, 27):
            r2 = (x - 21.5) ** 2 + (y - 7.5) ** 2
            if 1.6 ** 2 < r2 <= 3.4 ** 2:
                decals.append((x, y, CYAN[3] if r2 < 7 else CYAN[2]))
    decals += [(14, 5, HOTPINK[3])] + [(x, 11.6, HOTPINK[3]) for x in range(12, 17)]
    return render([arm, box, cone, tw, fist], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def magico_body():
    """Pés em (18, 51)."""
    E.init(36, 52)
    parts, decals = [], []
    cape = Part(poly([(5.4, 17.6), (16, 16.6), (12, 46.4), (2.6, 43.6)]), RED, group='cape', R=2.4, bias=0.3,
                shift=-1)
    parts.append(cape)
    for x, sh in ((9, -1), (18, 0)):
        parts.append(Part(rrect(x, 46, 9, 5, 2), BLACK, group=f'sh{x}', R=1.4, shift=sh, bias=0.8, k=3))
    for x, sh in ((11, -1), (18.4, 0)):
        parts.append(Part(rrect(x, 33, 6.6, 14, 2), VEGAS, group=f'l{x}', R=2, shift=sh, bias=0.3))
    coat = Part(rrect(10, 18, 17, 17, 4), VEGAS, group='coat', R=3.6, bias=0.3, tex=sequin_tex(4))
    shirt = Part(poly([(16, 18.6), (22, 18.6), (19, 28)]), WHITE, group='shirt', R=1.4, bias=0.6)
    bow = Part(poly([(16.6, 19), (19, 20.4), (21.4, 19), (21.4, 22), (19, 20.8), (16.6, 22)]), RED, group='bow',
               R=1, bias=0.6)
    neck = Part(rrect(17, 14.4, 5, 5, 1.4), SKIN, group='neck', R=1, shift=-1)
    head = Part(ellipse((20, 11), 7, 7), SKIN, group='head', R=3.6, bias=0.8)
    hair = Part(poly([(13, 9), (14, 4.6), (19, 3.6), (24.6, 4.6), (26, 7), (21, 6.4), (16, 8), (15.6, 12)]),
                HAIR_BLACK, group='hair', R=1.6, bias=-0.4)
    nose = Part(ellipse((27, 10.6), 1.4, 1.4), SKIN, group='nose', R=1, bias=0.4, lines=False)
    parts += [coat, shirt, bow, neck, head, hair, nose]
    decals += pattern(['.kk.', 'kwKk', '.kk.'], (22.4, 8.6), {'k': INK, 'w': (255, 255, 255), 'K': INK})
    decals += [(21.6, 7.4, INK), (22.6, 7, INK), (23.6, 6.8, INK), (24.6, 6.6, INK)]
    decals += pattern([
        'k........k',
        '.kkkkkkkk.',
        '...kkkk...',
        '....kk....',
        '....k.....',
    ], (19.4, 12.4), {'k': INK})
    decals += [(12, 22, (255, 255, 255)), (24.6, 27, (255, 255, 255))]
    decals += sparkle(25, 22)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def magico_hat():
    E.init(18, 17)
    crown = Part(rrect(3, 0.5, 12, 13, 1.4), TRACK_BLACK, group='c', R=2.4, bias=0.6)
    band = Part(rrect(3, 9, 12, 2.4, 0), VEGAS, group='c', R=2, lines=False, light=crown.mask)
    brim = Part(rrect(0.5, 13, 17, 3, 1.2), TRACK_BLACK, group='b', R=1, bias=0.6)
    decals = [(5, y, TRACK_BLACK[4]) for y in range(2, 8)] + sparkle(12, 4)
    return render([crown, band, brim], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def magico_card():
    """Ás de copas gigante como tapete voador."""
    E.init(36, 12)
    card = Part(poly([(4.6, 1.6), (35.4, 1.6), (31.6, 10.4), (0.6, 10.4)]), WHITE, group='c', R=2, bias=0.7)
    heart = Part(union(ellipse((16.6, 5.2), 1.8, 1.8), ellipse((19.4, 5.2), 1.8, 1.8),
                       poly([(14.8, 5.8), (21.2, 5.8), (18, 9)])), RED, group='h', R=1.4, bias=0.6, lines=False)
    decals = [(6.6, 3, RED[2]), (6.6, 4, RED[2]), (7.6, 3, RED[2]), (28.6, 7, RED[2]), (28.6, 8, RED[2]),
              (29.6, 8, RED[2])]
    decals += sparkle(10, 3)
    return render([card, heart], decals, outline_tint=OUTLINE_TINT, rim=None)


def magico_gun():
    E.init(26, 14)
    sleeve = Part(rrect(0.5, 4.6, 9, 5, 2.2), VEGAS, group='s', R=1.6, bias=0.4, tex=sequin_tex(9))
    glove = Part(ellipse((11, 7), 3, 3), WHITE, group='g', R=1.6, bias=0.6)
    parts = [sleeve]
    decals = []
    for i in range(4):
        y = 1 + i * 2.6
        parts.append(Part(rrect(13, y + 0.2, 11.6, 4, 0.8), WHITE, group=f'c{i}', R=1, bias=0.8))
        decals += [(22, y + 2.2, RED[2] if i % 2 == 0 else INK)]
    parts.append(glove)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def vendor_body():
    """Pés em (19, 51)."""
    E.init(38, 52)
    parts, decals = [], []
    for x, sh in ((10, -1), (19, 0)):
        parts.append(Part(rrect(x, 46, 9, 5, 2), BROWN, group=f'sh{x}', R=1.4, shift=sh, bias=0.5, k=3))
    for x, sh in ((11, -1), (19, 0)):
        parts.append(Part(rrect(x, 33, 7, 14, 2), TAN_PANTS, group=f'l{x}', R=2, shift=sh, bias=0.4))
    coat = Part(rrect(9, 17, 20, 18, 4), ORANGE, group='coat', R=3.6, bias=0.3, grad=(0.2, 0.1))
    shirt = Part(poly([(16, 17.6), (23, 17.6), (19.5, 28.6)]), WHITE, group='shirt', R=1.4, bias=0.6)
    tie = Part(poly([(18.6, 18.6), (20.4, 18.6), (21.6, 29), (19.5, 31), (17.4, 29)]), HOTPINK, group='tie', R=1,
               bias=0.6)
    neck = Part(rrect(18, 14, 5, 5, 1.4), SKIN, group='neck', R=1, shift=-1)
    head = Part(ellipse((21, 10.6), 7.4, 7.4), SKIN, group='head', R=3.6, bias=0.8)
    hair = Part(poly([(14, 8), (16, 4.4), (23, 3.2), (27, 5), (20, 5.6), (16, 9)]), WOOD, group='hair', R=1,
                bias=0.6, lines=False)
    nose = Part(ellipse((28.4, 9.6), 1.6, 1.6), SKIN, group='nose', R=1, bias=0.4, lines=False)
    phone = Part(ellipse((14.6, 10.4), 2.2, 2.2), GUNMETAL, group='hs', R=1, bias=0.6)
    parts += [coat, shirt, tie, neck, head, hair, nose, phone]
    # xadrez turquesa sobre o paletó
    for y in range(18, 35):
        for x in range(10, 29):
            if coat.mask[y, x] and not shirt.mask[y, x] and (x % 4 == 3 or y % 4 == 3):
                decals.append((x, y, TEAL[3] if (x + y) % 2 else TEAL[2]))
    decals += [(18.4, 22, YELLOW[3]), (19.4, 22, YELLOW[3]), (20.4, 22, YELLOW[3]), (18.4, 25.6, YELLOW[3]),
               (19.4, 25.6, YELLOW[3]), (20.4, 25.6, YELLOW[3])]
    decals += pattern(['.kk.', 'kwKk', '.kk.'], (23, 7.6), {'k': INK, 'w': (255, 255, 255), 'K': INK})
    decals += [(x, 6, INK) for x in range(22, 26)]
    decals += pattern([
        'kkkkkkkkkk',
        'kwwgwwgwwk',
        '.kwwwwwwk.',
        '..kkkkkk..',
    ], (18.6, 11.8), {'k': INK, 'w': (255, 255, 255), 'g': (196, 202, 214)})
    decals += pattern(['.c.', 'ccc', 'cwc', '.c.'], (14.6, 2.8), {'c': CYAN[3], 'w': (255, 255, 255)})
    decals += [(15, 11, INK), (15, 12, INK), (15, 13, INK), (16, 13.4, INK), (18, 14, INK), (20, 14.6, INK),
               (22, 15, GUNMETAL[3])]
    decals += sparkle(27, 13)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def vendor_tv():
    """TV de tubo voadora com "CALL NOW!" piscando na tela."""
    E.init(38, 30)
    cab = Part(rrect(1, 6, 36, 22, 3), WOOD, group='cab', R=3, bias=0.5, k=3)
    panel = Part(rrect(30, 9, 5, 16, 0.6), TAN_PANTS, group='panel', R=1, bias=0.6, lines=False)
    screen = Part(rrect(4, 8.6, 25, 17, 3), BLUE_TRACK, group='scr', R=4, bias=0.6)
    parts = [cab, panel, screen]
    decals = [(x, y, YELLOW[3]) for x in range(6, 27) for y in range(11, 15)]
    for x in (7, 10, 13, 16, 19, 22):
        decals += [(x, 12, RED[2]), (x + 1, 12, RED[2]), (x, 13, RED[2]), (x + 1, 13, RED[2])]
    decals += [(x, 17, WHITE[4]) for x in range(7, 26)] + [(x, 20, WHITE[4]) for x in range(7, 21)]
    decals += [(32.4, 12, BLACK[1]), (32.4, 16, BLACK[1])]
    decals += [(5, y, (200, 220, 255)) for y in range(10, 15)]
    img = render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)
    px = img.load()
    for (a, b) in (((14, 6), (9, 0.6)), ((24, 6), (29, 0.6))):
        n = 8
        for i in range(n + 1):
            x = round(a[0] + (b[0] - a[0]) * i / n)
            y = round(a[1] + (b[1] - a[1]) * i / n)
            if 0 <= y < 30 and px[x, y][3] == 0:
                px[x, y] = (200, 200, 230, 255)
    return img


def vendor_toupee():
    E.init(16, 8)
    t = Part(ellipse((8, 4.6), 7, 2.8), WOOD, group='t', R=1.6, bias=0.6,
             tex=lambda idx, m: idx + ((E.XX % 3 == 0) & m))
    return render([t], [], outline_tint=OUTLINE_TINT, rim=None)


def vendor_gun():
    E.init(26, 14)
    sleeve = Part(rrect(0.5, 4.6, 9, 5, 2.2), ORANGE, group='s', R=1.6, bias=0.4)
    fist = Part(ellipse((10.6, 7), 2.8, 2.8), SKIN, group='f', R=1.4, bias=0.6)
    brick = Part(rrect(11, 3.6, 12, 7, 1.4), GUNMETAL, group='p', R=1.6, bias=0.6, k=3)
    decals = [(x, y, GREEN[3]) for x in range(13, 17) for y in (5, 6)]
    decals += [(18, 5, CHROME[3]), (20, 5, CHROME[3]), (18, 7.6, CHROME[3]), (20, 7.6, CHROME[3])]
    decals += [(23, 5, INK), (24, 5, INK), (25, 5, RED[3])]
    return render([sleeve, brick, fist], decals, outline_tint=OUTLINE_TINT, rim=RIM)


TEXTURES = {'dj_body': dj_body, 'dj_deck': dj_deck, 'dj_phones': dj_phones, 'dj_gun': dj_gun,
            'magico_body': magico_body, 'magico_hat': magico_hat, 'magico_card': magico_card,
            'magico_gun': magico_gun, 'vendedor_body': vendor_body, 'vendedor_tv': vendor_tv,
            'vendedor_toupee': vendor_toupee, 'vendedor_gun': vendor_gun}
