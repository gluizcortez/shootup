"""
King of the Quiff (id vaca_loca): imitador do Rei do rock que atropela.
Macacão branco de Las Vegas cravejado de strass, gola alta, capa com forro
vermelho, cinturão de campeão, boca de sino, bota branca de salto dourado,
costeletas, óculos dourados, topete monumental e microfone cromado.
Peças separadas para o esqueleto com IK (VacaView).
"""
import engine as E
from cast import (CHROME, CYAN, GOLD, HAIR_BLACK, INK, OUTLINE_TINT, RED, RIM, SKIN, WHITE, sparkle)
from engine import Part, capsule, ellipse, pattern, poly, ramp, render, rrect, union

SUIT = ramp('#5a5480', '#9c98c4', '#dcdaf0', '#f6f4ff', '#ffffff')
POMADE = ramp('#05030a', '#100c20', '#1e1840', '#34307a', '#6c74d8')


def gem(x, y, core=RED):
    """Strass: aro dourado, pedra e um ponto de brilho."""
    return [(x, y, core[3]), (x - 1, y, GOLD[2]), (x + 1, y, GOLD[2]), (x, y - 1, GOLD[3]), (x, y + 1, GOLD[1])]


def cape():
    E.init(30, 32)
    lining = Part(poly([(9.4, 0.4), (20.6, 0.4), (29, 31), (1, 31)]), RED, group='lining', R=2, bias=0.4)
    outer = Part(poly([(11, 0.6), (20, 0.6), (25.4, 30.6), (5.6, 30.6)]), SUIT, group='cape', R=4, bias=0.5,
                 grad=(0.3, 0.1))
    hem = Part(rrect(5.4, 27.6, 20.2, 2.8, 0.4), GOLD, group='cape', R=1, lines=False, light=outer.mask)
    eagle = Part(poly([(10.4, 16.6), (15.6, 14.4), (20.8, 16.6), (17.4, 18.2), (15.6, 21.4), (13.8, 18.2)]), GOLD,
                 group='eagle', R=1.2, bias=0.6, lines=False)
    decals = []
    for x, y in ((15, 6), (12.6, 11), (19, 10.6), (16, 24.6), (21, 22.4), (10.6, 24)):
        decals += gem(x, y, CYAN)
    # dobras da capa
    decals += pattern(['f', 'f', '.f', '.f', '.f', '..f'], (12.4, 2), {'f': SUIT[1]})
    decals += sparkle(19.6, 4)
    return render([lining, outer, hem, eagle], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def torso():
    """Quadril em (15, 30); gola alta e decote até o umbigo."""
    E.init(30, 32)
    body = Part(rrect(4.8, 5.6, 20.4, 25.4, 7), SUIT, group='t', R=4, bias=0.5, grad=(0.25, 0.1))
    chest = Part(poly([(12.4, 6), (20.6, 6), (16.5, 19)]), SKIN, group='chest', R=2, bias=0.4)
    collar_l = Part(rrect(6.2, 0.4, 7, 8.6, 2), SUIT, group='col', R=2, bias=0.8)
    collar_r = Part(rrect(18.8, 0.4, 7, 8.6, 2), SUIT, group='col2', R=2, bias=0.8)
    belt = Part(rrect(4.4, 21, 21.4, 5, 1.6), GOLD, group='belt', R=1.8, bias=0.5)
    buckle = Part(rrect(12, 19.6, 9, 7.6, 2.4), GOLD, group='buckle', R=2, bias=0.8, k=3)
    decals = []
    # pelos do peito e correntinha com medalha
    decals += pattern(['h.h', '.h.', 'h..', '..h'], (15, 8), {'h': (90, 50, 50)})
    decals += pattern(['g', 'g', 'g', 'g', 'G'], (16.4, 9.4), {'g': GOLD[3], 'G': GOLD[4]})
    decals += [(15.4, 14, GOLD[2]), (17.4, 14, GOLD[2]), (16.4, 15, GOLD[2])]
    # rubi do cinturão
    decals += pattern(['.rr.', 'rRWr', 'rRRr', '.rr.'], (14.6, 21.6), {'r': RED[1], 'R': RED[2], 'W': (255, 220, 220)})
    for x, y in ((8, 12), (24, 12), (8.6, 18), (23.6, 18), (9.6, 3.6), (22.4, 3.6)):
        decals += gem(x, y, CYAN if (x + y) % 2 else RED)
    for x in (7, 9.6, 23.4, 26):
        decals += [(x, 26.4, GOLD[3]), (x, 27.4, GOLD[2]), (x, 28.4, GOLD[3])]
    decals += sparkle(21.6, 9)
    return render([body, chest, collar_l, collar_r, belt, buckle], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def head(uh):
    """Pescoço em (10, 21); o topete é peça separada."""
    def draw():
        E.init(25, 22)
        face = Part(union(rrect(3.4, 3, 17.2, 17, 7), ellipse((14, 16.4), 6.4, 3.8)), SKIN, group='f', R=4, bias=0.7)
        nose = Part(ellipse((22.2, 12.6), 1.9, 1.9), SKIN, group='nose', R=1.2, bias=0.6, lines=False)
        back_hair = Part(poly([(3, 3), (10, 1.4), (14.4, 3.4), (7.2, 5.6), (6.6, 12.8), (3.2, 12.4)]), POMADE,
                         group='hair', R=2, bias=0.4)
        burn = Part(union(rrect(5, 7.6, 3.8, 11, 1.6), poly([(5, 18.2), (8.8, 18.2), (7.4, 20.6)])), POMADE,
                    group='burn', R=1.4, bias=0.4)
        decals = []
        # óculos dourados de aviador
        decals += pattern([
            '.kkkkk.kkkkk.',
            'kgGyyg kgGyyg',
            'kggggk.kggggk',
            '.kggk...kggk.',
        ], (10.6, 7.6), {'k': INK, 'g': GOLD[2], 'G': GOLD[4], 'y': (255, 246, 190)})
        decals += pattern(['bbbbbb'], (14.2, 6.2), {'b': INK})
        decals += pattern(['cc', 'c.'], (7.6, 14.6), {'c': SKIN[1]})
        decals += [(8.6, 15.6, (240, 140, 140)), (9.6, 15.6, (240, 140, 140))]
        if uh:
            # "Uh-huh!": lábio torto lá em cima, boca aberta
            decals += pattern([
                '....kk',
                '.kkkwk',
                'kwwwmk',
                'kmmmmk',
                '.kkkk.',
            ], (15.6, 13.6), {'k': INK, 'w': (255, 255, 255), 'm': (150, 30, 60)})
        else:
            decals += pattern(['.....k', '.kkkk.', 'kppp..'], (15.6, 15), {'k': INK, 'p': (214, 90, 122)})
        return render([back_hair, face, nose, burn], decals, outline_tint=OUTLINE_TINT, rim=RIM)
    return draw


def pomp():
    """Topete com brilhantina; base em (8, 13) assenta na testa."""
    E.init(32, 16)
    p = Part(poly([(2.2, 14), (2.4, 6.4), (8, 1.4), (19, 0.4), (28, 1.6), (30.6, 5.4), (26.4, 8.4), (20, 6.8),
                   (13, 10), (10, 14.6)]), POMADE, group='p', R=3, k=3.4, bias=0.8, grad=(0.3, 0.2))
    lock = Part(poly([(26, 6.4), (29.6, 9.4), (27.8, 11.8), (27.2, 8.6)]), POMADE, group='l', R=1, bias=0.4)
    decals = pattern([
        '.....bbbbbbbb...',
        '...bb........bb.',
        '..b...BBBBB.....',
        '.b...B..........',
    ], (6, 1.6), {'b': POMADE[4], 'B': POMADE[3]})
    decals += sparkle(12, 3, glow=(150, 170, 255))
    return render([lock, p], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def thigh():
    E.init(9, 10)
    t = Part(rrect(1, 0, 7, 10, 3), SUIT, group='t', R=2.4, bias=0.5)
    stripe = Part(rrect(5.4, 0.6, 1.2, 8.8, 0), GOLD, group='t', R=1, lines=False, light=t.mask)
    return render([t, stripe], gem(3.4, 4, CYAN), outline_tint=OUTLINE_TINT, rim=RIM)


def shin():
    """Boca de sino que abre em leque, com gomo vermelho e strass."""
    E.init(12, 13)
    bell = Part(poly([(2.6, 0), (9.4, 0), (11.6, 12), (0.4, 12)]), SUIT, group='s', R=3, bias=0.5)
    gusset = Part(poly([(5.4, 5), (6.6, 5), (8, 11.8), (4, 11.8)]), RED, group='s', R=3, lines=False, light=bell.mask)
    hem = Part(rrect(0.6, 10.8, 10.8, 1.2, 0), GOLD, group='s', R=1, lines=False, light=bell.mask)
    decals = gem(6, 2.6, CYAN) + gem(2.6, 8.6) + gem(9.4, 8.6)
    return render([bell, gusset, hem], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def boot():
    """Bota branca de bico fino e salto dourado; tornozelo em (3.5, 2)."""
    E.init(12, 6)
    b = Part(poly([(0.4, 0.8), (5, 0.4), (9, 2.2), (11.6, 4.2), (11, 5.6), (0.4, 5.6)]), SUIT, group='b', R=1.6,
             bias=0.6, k=3)
    heel = Part(rrect(0.4, 4.2, 3.2, 1.6, 0), GOLD, group='h', R=1, lines=False)
    return render([b, heel], [(6, 1.6, (255, 255, 255)), (7, 2, (255, 255, 255))], outline_tint=OUTLINE_TINT, rim=RIM)


def uparm():
    E.init(8, 10)
    a = Part(union(ellipse((4, 3.2), 3.4, 3.0), rrect(1, 1, 6, 8.6, 2.6)), SUIT, group='a', R=2.4, bias=0.5)
    return render([a], gem(4, 5, CYAN), outline_tint=OUTLINE_TINT, rim=RIM)


def forearm():
    """Manga boca de sino com franja dourada; mão com anelzão."""
    E.init(11, 13)
    sleeve = Part(poly([(3, 0), (8, 0), (10.6, 7.8), (0.4, 7.8)]), SUIT, group='s', R=2.4, bias=0.5)
    hand = Part(union(ellipse((5.5, 10), 2.6, 2.4), rrect(4.6, 10.6, 2, 2.4, 0.8)), SKIN, group='h', R=1.6, bias=0.5)
    decals = []
    for x in (1, 3, 5, 7, 9):
        decals += [(x, 8, GOLD[3]), (x, 9, GOLD[2])]
    decals += gem(4, 10, RED)
    return render([sleeve, hand], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def mic():
    """Microfone cromado retrô; pega em (4, 10), cabeça para cima."""
    E.init(8, 14)
    handle = Part(rrect(2.6, 6, 2.8, 7.6, 1), CHROME, group='h', R=1, bias=0.2)
    head_ = Part(rrect(0.6, 0.4, 6.8, 7, 3), CHROME, group='m', R=2.4, bias=0.6, k=3)
    decals = []
    for y in (2, 4):
        for x in range(1, 7):
            decals.append((x, y, CHROME[1] if x % 2 else CHROME[2]))
    decals += [(2, 1, (255, 255, 255)), (2, 3, (255, 255, 255))]
    return render([handle, head_], decals, outline_tint=OUTLINE_TINT, rim=RIM)


def bell():
    """Lenço de seda vermelho no pescoço (pronto para jogar na plateia)."""
    E.init(12, 13)
    s = Part(poly([(2, 0), (10, 0), (8, 6), (9.5, 12.4), (6, 9), (2.5, 12.4), (4, 6)]), RED, group='s', R=2,
             bias=0.6, grad=(0.3, 0.2))
    return render([s], [(4, 1, RED[4]), (5, 1, RED[4]), (6, 1, RED[4])], outline_tint=OUTLINE_TINT, rim=RIM)


TEXTURES = {'vaca_cape': cape, 'vaca_torso': torso, 'vaca_head': head(False), 'vaca_head_uh': head(True),
            'vaca_pomp': pomp, 'vaca_thigh': thigh, 'vaca_shin': shin, 'vaca_boot': boot, 'vaca_uparm': uparm,
            'vaca_forearm': forearm, 'vaca_mic': mic, 'vaca_bell': bell}
