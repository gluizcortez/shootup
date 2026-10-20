"""
Hang-Glider Ninja (id pombo_mafioso): esquadrilha de ninjas de fita VHS.
Gi preto com faixa verde-neon, capuz com fresta dos olhos, sobrancelhas
bravas, asa-delta de brinquedo nas costas, pontas da bandana tremulando e
uma Uzi.
"""
import engine as E
from cast import (frames_of, sweat, BLACK, GREEN, GUNMETAL, HOTPINK, INK, OUTLINE_TINT, RIM, SKIN, YELLOW, sparkle)
from engine import Part, ellipse, pattern, poly, ramp, render, rrect

GI = ramp('#06040c', '#14102a', '#241e40', '#3a3264', '#5e5498')


def body(face='idle'):
    E.init(34, 30)
    parts = []
    for x0, sh in ((10.6, -1), (17.6, 0)):
        parts.append(Part(rrect(x0, 22.4, 4.6, 6.4, 1.4), GI, group=f'leg{x0}', R=1.4, shift=sh))
    torso = Part(ellipse((16, 18), 10.4, 7.8), GI, group='torso', R=4, bias=0.7, grad=(0.2, 0.1))
    sash = Part(rrect(6.4, 18.6, 19.4, 2.6, 0.6), GREEN, group='torso', R=1, lines=False, light=torso.mask)
    hood = Part(ellipse((21, 8.2), 6.8, 6.6), GI, group='hood', R=3.4, bias=0.8)
    slit = Part(rrect(18, 5.8, 9.6, 3.8, 1.4), SKIN, group='slit', R=1.2, bias=0.6, lines=False)
    parts += [torso, sash, hood, slit]
    eyes = {
        'idle': ['bbb.bbb.', '.kk..kk.', '.kw..kw.'],
        'blink': ['bbb.bbb.', '........', '.kk..kk.'],
        'aim': ['bb...bb.', '..b.b...', '.kk..kk.'],
        'shoot': ['.bb..bb.', 'kwk.kwk.', 'kkk.kkk.'],
        'hurt': ['........', 'k.k.k.k.', '.k...k..'],
        'dead': ['........', 'k.k.k.k.', '.k...k..'],
    }
    decals = pattern(eyes[face], (19.2, 5.2), {'b': INK, 'k': INK, 'w': (255, 255, 255)})
    if face == 'hurt':
        decals += sweat(27, 3)
    # nó da faixa e dobras do gi
    decals += pattern(['gg', 'Gg', '.g'], (7, 19.4), {'g': GREEN[3], 'G': GREEN[4]})
    decals += pattern(['f..', '.f.', '..f'], (13, 13), {'f': GI[3]})
    decals += [(16.6, 2.4, GI[4]), (17.6, 2, GI[4])]
    return render(parts, decals, outline_tint=OUTLINE_TINT, rim=((120, 255, 170), 0.3))


def wing():
    """Asa-delta de brinquedo em neon (presa nas costas)."""
    E.init(24, 12)
    sail = Part(poly([(1, 6), (23, 0.6), (21, 6), (23, 11.4)]), HOTPINK, group='s', R=2.6, bias=0.6, grad=(0.3, 0.2))
    nose = Part(poly([(1.6, 6), (12, 3.6), (12, 8.4)]), YELLOW, group='s', R=2.6, lines=False, light=sail.mask)
    decals = [(x, 6, INK) for x in range(3, 21)]
    decals += sparkle(16, 3)
    return render([sail, nose], decals, outline_tint=OUTLINE_TINT, rim=None)


def hat():
    """Pontas da bandana tremulando para trás."""
    E.init(18, 9)
    a = Part(poly([(16.4, 3), (1, 0.6), (3, 3.8), (16.4, 5)]), HOTPINK, group='a', R=1, bias=0.6)
    b = Part(poly([(16.4, 4.6), (2, 7.4), (5, 8.6), (16.4, 6)]), HOTPINK, group='b', R=1, bias=0.2, shift=-1)
    return render([b, a], [], outline_tint=OUTLINE_TINT, rim=None)


def gun():
    E.init(24, 9)
    glove = Part(ellipse((3, 4.6), 2.6, 2.4), GI, group='g', R=1.4, bias=0.8)
    uzi = Part(rrect(5, 1.4, 13, 4.6, 1), GUNMETAL, group='u', R=1.4, bias=0.6, k=3)
    mag = Part(rrect(9, 4.4, 3.4, 4.4, 0.8), BLACK, group='m', R=1, shift=0)
    barrel = Part(rrect(17, 2.4, 6.2, 2.4, 0.6), GUNMETAL, group='b', R=1, bias=0.4)
    decals = [(x, 2.2, GREEN[3]) for x in range(6, 9)] + [(x, 2, GUNMETAL[4]) for x in range(10, 17)]
    return render([mag, uzi, barrel, glove], decals, outline_tint=OUTLINE_TINT, rim=RIM)


TEXTURES = {**{'pombo_body' + k: v for k, v in frames_of(body, 21).items()}, 'pombo_wing': wing, 'pombo_hat': hat, 'pombo_gun': gun}
