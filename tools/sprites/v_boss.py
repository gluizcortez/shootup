"""
Tony Mantega (id don_pombone): o chefão de terno branco.
Terno branco de lapela larga, camisa vermelha aberta no peito cabeludo,
correntão de ouro com medalhão, cravo neon, sapato bicolor, mochila-
helicóptero, cabeção com cabelo engomado (peça separada), pálpebra pesada,
cicatriz, barba por fazer, charuto e o fuzil de ouro com lança-granadas.
"""
import numpy as np

import engine as E
from cast import (BLACK, CREAM, GOLD, GREY, GUNMETAL, HOTPINK, INK, OUTLINE_TINT, PINK, RED, RIM, SKIN_TAN, frames_of,
                  STEEL, WHITE, sparkle)
from engine import Part, capsule, ellipse, pattern, poly, ramp, render, rrect, union

SUIT = ramp('#5c5070', '#a49aa8', '#ddd6cc', '#f4efe6', '#ffffff')
CIGAR = ramp('#20100a', '#40200e', '#6a3a1a', '#8e5a2a', '#b88048')
POMADE = ramp('#05030a', '#100c20', '#1e1840', '#34307a', '#6c74d8')
DARKGOLD = ramp('#4a2a04', '#8a5a0a', '#d4a017', '#f0c840', '#fff0a0')


def body(face='idle'):
    """`face`: idle, blink, aim, shoot, hurt ou dead (troca rosto e charuto)."""
    E.init(96, 92)
    parts, decals = [], []
    # pernas e sapato bicolor
    for x0, sh in ((34, -1), (50, 0)):
        parts.append(Part(rrect(x0, 74, 10, 15, 3), SUIT, group=f'leg{x0}', R=3, shift=sh, bias=0.4))
    for x0, sh in ((31.4, -1), (47.4, 0)):
        parts.append(Part(rrect(x0, 85.6, 15, 6, 2.6), BLACK, group=f'shoe{x0}', R=2, shift=sh, k=3, bias=0.5))
        parts.append(Part(rrect(x0 + 2.6, 86.2, 6.4, 3.4, 1), CREAM, group=f'shoe{x0}', R=1, shift=sh, lines=False))
    # mochila-helicóptero e mastro do rotor
    mast = Part(rrect(17, 5, 5, 28, 1), GUNMETAL, group='mast', R=1.6, bias=0.6, shift=-1)
    pack = Part(rrect(11, 29, 18, 34, 5), GREY, group='pack', R=4, bias=0.4, k=3)
    strap = Part(rrect(11, 40, 18, 3.4, 0), HOTPINK, group='pack', R=4, lines=False, light=pack.mask)
    parts += [mast, pack, strap]
    # terno branco (barrigão)
    suit = Part(ellipse((46, 58), 31.6, 23.6), SUIT, group='suit', R=10, bias=0.1, grad=(0.35, 0.3))
    shirt = Part(poly([(45, 34.6), (67, 34.6), (56, 64)]), RED, group='shirt', R=3, bias=0.4)
    chest = Part(poly([(48.6, 34.6), (63.4, 34.6), (56, 52)]), SKIN_TAN, group='chest', R=3, bias=0.4)
    lapel_l = Part(poly([(43, 34), (50, 34), (49.4, 60), (44, 48)]), SUIT, group='lapel', R=2, bias=1.2, lines=False)
    lapel_r = Part(poly([(69, 34), (62, 34), (62.6, 60), (68, 48)]), SUIT, group='lapel2', R=2, bias=1.2,
                   lines=False)
    medal = Part(ellipse((56, 55), 4, 4), GOLD, group='medal', R=2, bias=0.7, k=3)
    flower = Part(ellipse((40, 44), 4.4, 4.2), HOTPINK, group='flower', R=2, bias=0.6)
    parts += [suit, shirt, chest, lapel_l, lapel_r, medal, flower]
    # cabeção
    ear = Part(ellipse((41.6, 22.4), 4.2, 5), SKIN_TAN, group='ear', R=2.4, shift=-1)
    neck = Part(rrect(48, 32, 18, 6, 2), SKIN_TAN, group='neck', R=2, shift=-1)
    head = Part(union(ellipse((58, 21.6), 18.4, 18.6), ellipse((63, 33), 12, 5)), SKIN_TAN, group='head', R=7,
                bias=0.7, grad=(0.15, 0.1))
    nose = Part(ellipse((75.2, 22.4), 4, 4.6), SKIN_TAN, group='nose', R=2.4, bias=0.6)
    cigar = Part(rrect(72, 30.4, 16.4, 4.2, 2), CIGAR, group='cigar', R=1.6, bias=0.6)
    parts += [neck, ear, head, nose] + ([] if face == 'dead' else [cigar])
    # correntão em V (duas voltas)
    for (a, b, w) in (((47, 37.6), (56, 54), 1.2), ((56, 54), (65, 37.6), 1.2), ((49.4, 37.6), (56, 49), 0.8),
                      ((56, 49), (62.6, 37.6), 0.8)):
        n = 22
        for i in range(n + 1):
            x = a[0] + (b[0] - a[0]) * i / n
            y = a[1] + (b[1] - a[1]) * i / n
            decals.append((x, y, GOLD[4] if i % 3 == 0 else GOLD[3]))
            if w > 1:
                decals.append((x + 1, y, GOLD[1]))
    decals += pattern(['.$.', '$$$', '.$.'], (55, 54), {'$': GOLD[1]})
    # pelos no peito
    for x, y in ((54, 40), (58, 42), (55, 45), (57, 38), (52, 37), (60, 38), (56, 48)):
        decals += [(x, y, (60, 30, 24)), (x + 1, y + 1, (60, 30, 24))]
    # pétalas do cravo
    decals += pattern(['.p.p.', 'pPwPp', '.pPp.', '..g..'], (38, 42), {'p': HOTPINK[3], 'P': HOTPINK[4],
                                                                      'w': (255, 255, 255), 'g': (60, 200, 120)})
    # barba por fazer
    rng = np.random.default_rng(5)
    for y in range(24, 39):
        for x in range(50, 76):
            if head.mask[y, x] and rng.random() < 0.3 and (x - 60) ** 2 / 300 + (y - 33) ** 2 / 90 < 1:
                decals.append((x, y, SKIN_TAN[1] if rng.random() < 0.6 else SKIN_TAN[0]))
    decals += boss_face(face)
    # cicatriz
    decals += pattern(['r.....', '.r....', '..r.r.', '...r..', '....r.', '.....r', '......'], (66, 23),
                      {'r': (200, 70, 80)})
    if face != 'dead':
        # brasa e fumaça do charuto
        decals += pattern(['oO', 'Oy', 'oO'], (86.6, 31), {'o': (255, 90, 42), 'O': (255, 140, 60),
                                                          'y': (255, 230, 120)})
        puff = ['..ss', '.s..', 's...', '.s..', '..s.'] if face != 'blink' else ['.ss.', 's..s', '.ss.', '....', '....']
        decals += pattern(puff, (88, 21), {'s': (200, 200, 220)})
        decals += [(76, 31.6, GOLD[3]), (76, 32.6, GOLD[2]), (76, 33.6, GOLD[3])]
    # dobras do terno e botões
    decals += pattern(['f....', '.ff..', '...ff', '.....'], (30, 66), {'f': SUIT[1]})
    decals += pattern(['f....', '.ff..', '...ff'], (52, 72), {'f': SUIT[1]})
    decals += [(48, 64, GOLD[3]), (48, 70, GOLD[3])]
    # brilho na careca e anel no mastro
    decals += sparkle(48, 8) + sparkle(28, 54)
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)


EYE_W = (250, 246, 236)
FACE_CMAP = {'b': INK, 's': SKIN_TAN[1], 'S': SKIN_TAN[2], 'w': EYE_W, 'k': INK, 'r': (220, 40, 60),
             'm': (120, 20, 40), 't': (255, 110, 140), 'v': (150, 40, 90)}


def boss_face(face):
    """Olho (pálpebra pesada) e boca do Tony para cada momento."""
    eyes = {
        'idle': [
            'bbbbbbbbbbbbbbbbbbb.',
            '..bbbbbbbbbbbbbbbbbb',
            '.....ssssssssss.....',
            '....sSSSSSSSSSSs....',
            '....wwwwwkkkkwww....',
            '....wwwwkkkkkkww....',
            '.....wwwkkkkkww.....',
            '.......wwwwww.......',
        ],
        'blink': [
            'bbbbbbbbbbbbbbbbbbb.',
            '..bbbbbbbbbbbbbbbbbb',
            '.....ssssssssss.....',
            '....sSSSSSSSSSSs....',
            '....sSSSSSSSSSSs....',
            '....kkkkkkkkkkkk....',
            '.....ssssssssss.....',
            '....................',
        ],
        'aim': [
            'bb..................',
            '.bbbbbb.............',
            '...bbbbbbbbbbbbb....',
            '....sSSSbbbbbbbbbb..',
            '....wwwwwkkrkwww....',
            '....wwwwkkrrkkww....',
            '.....wwwkkkkkww.....',
            '.......wwwwww.......',
        ],
        'shoot': [
            '.bbbbbbbbbbbbbbbbb..',
            'bb...............bb.',
            '....wwwwwwwwwww.....',
            '...wwwwwwkkkkwww....',
            '...wwwwwkkkkkkww....',
            '...wwwwwkkkkkkww....',
            '....wwwwwkkkkww.....',
            '......wwwwwww.......',
        ],
        'hurt': [
            '..bb.........bb.....',
            '....bbb...bbb.......',
            '.......bbb..........',
            '....kk.......kk.....',
            '......kk...kk.......',
            '........kkk.........',
            '......kk...kk.......',
            '....kk.......kk.....',
        ],
        'dead': [
            '....................',
            '.bbbbbbbbbbbbbbbbb..',
            '....................',
            '.....kk.....kk......',
            '.......kk.kk........',
            '.........k..........',
            '.......kk.kk........',
            '.....kk.....kk......',
        ],
    }
    mouths = {
        'idle': ['kkkkkkkkkkkkk', 'kwwwwwwwwkkkk', '.kkkkkkkkkkk.'],
        'blink': ['kkkkkkkkkkkkk', 'kwwwwwwwwkkkk', '.kkkkkkkkkkk.'],
        'aim': ['kkkkkkkkkkkkk', 'kwkwkwkwkwkwk', 'kkkkkkkkkkkkk'],
        'shoot': ['.kkkkkkkkkkk.', 'kwwwwwwwwwwwk', 'kmmmmmmmmmmmk', 'kmmmmttmmmmmk', 'kmmmtttttmmk.',
                  '.kkkkkkkkkk..'],
        'hurt': ['..kkkkkkkk...', '.k........k..', 'k..........k.'],
        'dead': ['kkkkkkkkkkkk.', '.kktttkk.....', '..ktttk......', '...kkk.......'],
    }
    out = pattern(eyes[face], (55, 9.6), FACE_CMAP)
    if face in ('idle', 'aim'):
        out += [(65, 14.6, (255, 255, 255))]
    if face == 'aim':
        # veia saltando na testa
        out += pattern(['.v.v', 'v.v.', '.v..'], (49, 5), FACE_CMAP)
    if face == 'hurt':
        out += [(73, 14, (120, 220, 255)), (73, 15, (120, 220, 255)), (72, 16, (200, 240, 255))]
    out += pattern(mouths[face], (63, 30.4 if face != 'shoot' else 29.4), FACE_CMAP)
    return out


def wing():
    """Pá do rotor (gira via scaleX na view)."""
    E.init(60, 28)
    blade = Part(rrect(1, 11, 58, 6, 3), WHITE, group='b', R=2, bias=0.6, k=3)
    tip_l = Part(rrect(1.5, 11.6, 6, 4.8, 0), HOTPINK, group='b', R=2, lines=False, light=blade.mask)
    tip_r = Part(rrect(52.5, 11.6, 6, 4.8, 0), HOTPINK, group='b', R=2, lines=False, light=blade.mask)
    hub = Part(ellipse((30, 14), 4, 4), GOLD, group='h', R=2, bias=0.7, k=3)
    decals = [(x, 12, (255, 255, 255)) for x in range(9, 51) if x % 6]
    return render([blade, tip_l, tip_r, hub], decals, outline_tint=OUTLINE_TINT, rim=None)


def hat():
    """Cabelo engomado preto-azulado brilhando de gel."""
    E.init(52, 24)
    hair = Part(poly([(5.6, 22), (7.4, 12.4), (16.6, 5), (32, 1.8), (45.4, 4.8), (48.4, 10.8), (41, 9.6),
                      (30, 8), (19.4, 12), (15, 22)]), POMADE, group='h', R=4, k=3.4, bias=0.8, grad=(0.3, 0.2))
    decals = pattern([
        '......bbbbbbbbbbb.....',
        '...bbb...........bbb..',
        '.bb....BBBBBBBB.......',
        'b....BB...............',
        '...BB.................',
    ], (12, 3.4), {'b': POMADE[4], 'B': POMADE[3]})
    decals += sparkle(24, 4, glow=(150, 170, 255))
    return render([hair], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def gun():
    """Fuzil de ouro com lança-granadas ("meu amiguinho"); pivô em x=8."""
    E.init(64, 22)
    fist = Part(ellipse((7, 11), 5.4, 5.4), SKIN_TAN, group='f', R=2.4, bias=0.5)
    body_ = Part(rrect(12, 5, 34, 9, 2), GOLD, group='g', R=2.6, bias=0.6, k=3.2)
    mag = Part(poly([(22, 13), (28, 13), (29, 21), (23.4, 21.6)]), DARKGOLD, group='mag', R=1.6, bias=0.4, shift=-1)
    launcher = Part(rrect(30, 13, 16, 5, 2), GUNMETAL, group='l', R=1.6, bias=0.6)
    barrel = Part(rrect(45, 7, 17, 4.6, 1.5), DARKGOLD, group='b', R=1.4, bias=0.6)
    decals = [(x, 6.6, (255, 246, 190)) for x in range(14, 44)]
    decals += [(x, 8.8, INK) for x in range(48, 60)]
    decals += pattern(['GGGG', 'gggg'], (5, 12), {'G': GOLD[4], 'g': GOLD[2]})
    decals += pattern(['.rr.', 'rRRr'], (31, 14), {'r': RED[2], 'R': RED[3]})
    decals += sparkle(20, 7) + sparkle(54, 8)
    return render([mag, launcher, body_, barrel, fist], decals, outline_tint=OUTLINE_TINT, rim=RIM)


TEXTURES = {'pombone' + '_body' + k: v for k, v in frames_of(body, 64).items()}
TEXTURES.update({'pombone_wing': wing, 'pombone_hat': hat, 'pombone_gun': gun})
