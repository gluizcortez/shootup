"""
Rent-a-Terminator (id galinha_rambo): ciborgue de academia de aluguel.
Flat-top, queixo de bigorna, meia cara cromada, jaqueta de couro sem manga,
regata cinza, bíceps com tatuagem neon "MOM", cinto de balas e coturno.
Voa com um jetpack de dois extintores presos com fita rosa.
"""
import engine as E
from cast import (BLACK, BRASS, CHROME, CYAN, GREY, GUNMETAL, HAIR_BROWN, HOTPINK, INK, LEATHER, OUTLINE_TINT, RED,
                  RIM, SKIN_TAN, STEEL, sparkle, noise_tex)
from engine import Part, capsule, ellipse, pattern, poly, render, rrect, union


def body():
    E.init(48, 56)
    parts, decals = [], []
    # coturnos
    for x0, sh in ((13.4, -1), (24.6, 0)):
        parts.append(Part(rrect(x0, 46, 9, 9, 1.6), BLACK, group=f'boot{x0}', R=2, shift=sh, k=3))
    # jaqueta de couro (costas) + regata
    vest = Part(ellipse((23, 36.4), 17.2, 14.4), LEATHER, group='vest', R=4.5, bias=0.6, grad=(0.2, 0.1))
    tank = Part(ellipse((27.4, 37.4), 8.2, 9.6) & ~rrect(0, 46, 48, 10, 0), GREY, group='tank', R=3, bias=0.4,
                tex=noise_tex(7, 0.05, 0.05))
    belt = Part(rrect(9.6, 46.4, 28.6, 3.6, 1), BLACK, group='belt', R=1.2)
    parts += [vest, tank, belt]
    # pescoço de touro
    parts.append(Part(rrect(21, 24, 13, 6, 2), SKIN_TAN, group='neck', R=2, shift=-1))
    # cabeça quadrada
    head = Part(union(rrect(17.4, 6, 19.4, 21.4, 4), rrect(23, 19, 14, 9, 3)), SKIN_TAN, group='head', R=4,
                bias=0.6, grad=(0.15, 0.1))
    ear = Part(ellipse((17.4, 16), 2.4, 2.8), SKIN_TAN, group='ear', R=1.4, shift=-1)
    flat = Part(rrect(16.4, 3, 21.4, 6.2, 1), HAIR_BROWN, group='hair', R=1.6, bias=0.6,
                tex=noise_tex(11, 0.18, 0.12))
    metal = Part(poly([(31, 8.6), (37.2, 8.6), (37.2, 22.4), (32, 19.4), (30.4, 14)]), CHROME, group='metal', R=2.4,
                 bias=0.4, k=3.4)
    parts += [ear, head, flat, metal]
    # bíceps gigante na frente
    bicep = Part(ellipse((14.4, 34.2), 8.2, 7.2), SKIN_TAN, group='bicep', R=4, bias=0.6, grad=(0.2, 0.1))
    parts.append(bicep)
    # costura de metal e parafusos
    decals += pattern([
        '.s....',
        'b.s...',
        '...s..',
        '.b..s.',
        '.....s',
    ], (30.6, 10), {'s': INK, 'b': STEEL[4]})
    decals += [(35.4, 18.6, STEEL[1]), (35, 20, STEEL[1])]
    # boca reta, queixo marcado e barba por fazer
    decals += pattern(['mmmmmmmm'], (27.8, 23.4), {'m': INK})
    decals += pattern(['.dddd.', 'd....d'], (28.6, 26.2), {'d': SKIN_TAN[1]})
    for y in range(20, 28):
        for x in range(23, 31):
            if head.mask[y, x] and (x * 3 + y * 2) % 5 == 0:
                decals.append((x, y, SKIN_TAN[1]))
    # nariz quebrado
    decals += pattern(['.n', 'nn', 'nN'], (35.6, 15), {'n': SKIN_TAN[1], 'N': SKIN_TAN[3]})
    # sobrancelha de quem não ri desde 1984
    decals += pattern(['bbbbbb'], (24.6, 11.4), {'b': HAIR_BROWN[1]})
    # tatuagem neon "MOM" num coração
    decals += pattern([
        '.pp.pp.',
        'pcccccp',
        'pc.c.cp',
        '.pcccp.',
        '..ppp..',
    ], (10.6, 33.4), {'p': HOTPINK[2], 'c': CYAN[3]})
    # veias e brilho do bíceps
    decals += [(11, 30.6, SKIN_TAN[4]), (12, 30, SKIN_TAN[4]), (13, 29.8, SKIN_TAN[4])]
    decals += pattern(['v..', '.v.', '..v'], (16.6, 30.6), {'v': SKIN_TAN[1]})
    # zíper e tachinhas da jaqueta
    for y in (28, 32, 36, 40, 44):
        decals.append((19.6, y, STEEL[4]))
    # cinto de balas
    for x in range(11, 37, 3):
        decals += [(x, 47.2, BRASS[4]), (x, 48.2, BRASS[3]), (x, 49.2, BRASS[1])]
    decals += sparkle(33.6, 11.6, core=(255, 255, 255), glow=STEEL[3])
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


def glasses():
    """Óculos escuros com a lente da direita estourada: atrás, o olho vermelho."""
    E.init(22, 8)
    lens_l = Part(rrect(1, 1, 9, 6, 2), BLACK, group='l', R=1.6, bias=0.8)
    lens_r = Part(rrect(11.4, 1, 9, 6, 2), BLACK, group='r', R=1.6, bias=0.8)
    bridge = Part(rrect(8, 1.6, 5, 1.6, 0.4), BLACK, group='b', R=1, lines=False)
    decals = pattern(['www', '.w.'], (2.6, 2), {'w': (150, 170, 220)})
    decals += pattern([
        '..rrr.',
        '.rRWr.',
        '.rRRr.',
        '..rr..',
    ], (13.4, 1.6), {'r': RED[2], 'R': RED[3], 'W': (255, 230, 230)})
    decals += [(12, 1, STEEL[3]), (13, 2, STEEL[3]), (19.6, 6, STEEL[3]), (18.6, 5, STEEL[3])]
    return render([lens_l, lens_r, bridge], decals, outline_tint=OUTLINE_TINT, rim=None)


def gun(offset):
    """Minigun de academia; pivô do ombro em x=10. `offset` gira o feixe de canos."""
    def draw():
        E.init(56, 18)
        fist = Part(rrect(2, 5.6, 10, 8.4, 3), SKIN_TAN, group='fist', R=2.2, bias=0.5)
        housing = Part(rrect(8, 3, 24, 12, 3), GUNMETAL, group='body', R=3, bias=0.5, k=3)
        tape1 = Part(rrect(12, 3.4, 4, 11.2, 0), HOTPINK, group='body', R=3, lines=False, light=housing.mask)
        tape2 = Part(rrect(16, 3.4, 2, 11.2, 0), CYAN, group='body', R=3, lines=False, light=housing.mask)
        barrels = Part(rrect(31, 4, 21, 10, 2), BLACK, group='barrels', R=2.6, bias=0.6)
        muzzle = Part(rrect(50, 3, 5, 12, 1.5), GUNMETAL, group='muzzle', R=1.6, bias=0.6)
        ammo = Part(rrect(13.6, 12.6, 8.6, 4.8, 1.4), BRASS, group='ammo', R=1.4)
        decals = []
        for i in range(3):
            y = 5.2 + ((i * 3 + offset) % 9)
            for x in range(32, 50):
                decals.append((x, y, STEEL[3] if x % 4 else STEEL[4]))
                decals.append((x, y + 1, GUNMETAL[1]))
        decals += pattern(['k.....', 'kkkkkk', '......', 'kkkkkk'], (4, 7.6), {'k': SKIN_TAN[1]})
        decals += sparkle(24, 6)
        return render([ammo, barrels, muzzle, housing, tape1, tape2, fist], decals, outline_tint=OUTLINE_TINT,
                      rim=RIM)
    return draw


def jetpack():
    E.init(22, 30)
    parts = []
    for x0 in (1, 11.4):
        parts.append(Part(rrect(x0, 2, 9, 22, 4), RED, group=f't{x0}', R=3, bias=0.6, k=3))
        parts.append(Part(rrect(x0 + 1.4, 23, 6.2, 5.4, 1), GUNMETAL, group=f'n{x0}', R=1.4, shift=-1))
    tape = Part(rrect(0.8, 10, 20.6, 3.2, 0.6), HOTPINK, group='tape', R=1.2, bias=0.6)
    decals = pattern(['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'], (3, 4), {'w': (255, 200, 200)})
    decals += pattern(['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'], (13.4, 4), {'w': (255, 200, 200)})
    decals += pattern(['xx', 'xx'], (9.4, 10.6), {'x': HOTPINK[4]})
    return render(parts + [tape], decals, outline_tint=OUTLINE_TINT, rim=RIM)


TEXTURES = {'galinha_body': body, 'galinha_glasses': glasses, 'galinha_gun_a': gun(0), 'galinha_gun_b': gun(2),
            'galinha_jetpack': jetpack}
