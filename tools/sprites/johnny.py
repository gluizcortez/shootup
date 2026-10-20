"""
Johnny Replay: dancarino dos anos 80 que so anda de moonwalk.
Fedora preto com faixa branca, cachinho na testa, jaqueta de lantejoulas
prateadas com ombreira e braçadeira rosa, luva brilhante na mao livre,
calca pega-frango, meia branca cintilante, mocassim envernizado.

Quadros do corpo (sem o braco da arma) + braco com o revolver em varios
angulos (o jogo escolhe o quadro pela mira).
"""
import math
import random

import numpy as np

import engine as E
from engine import Part, add, capsule, ellipse, ik, pattern, polar, poly, ramp, render, rot, union

BODY_W, BODY_H = 72, 84
G = 80          # chao (sola do sapato)
X0 = 32         # quadril no eixo x
HIP_Y = 59

SKIN = ramp('#6a3438', '#b4685a', '#e09a78', '#f6c49c', '#ffe2c4')
SILVER = ramp('#2c2844', '#5b5878', '#9493b4', '#c9c9e2', '#f4f4ff')
BLACK = ramp('#0d0a16', '#1f1a2e', '#342c4a', '#4e4670', '#7a72a8')
PANTS = ramp('#0b0912', '#191526', '#2a2440', '#3f3860', '#5d5690')
WHITE = ramp('#5c5878', '#a3a1c0', '#d8d7ea', '#f2f2fb', '#ffffff')
PINK = ramp('#5a0f3c', '#a01a64', '#e0328e', '#ff6ec0', '#ffb4e4')
HAIR = ramp('#06040c', '#15102a', '#2a2050', '#463a80', '#6a5cb0')
CHROME = ramp('#26243a', '#56567a', '#9a9cc0', '#d6daf2', '#ffffff')
WOOD = ramp('#2e160c', '#5a2e16', '#8a5a2b', '#b07a42', '#dca86a')
GOLD = ramp('#5a3a08', '#a0700e', '#e0b020', '#ffe060', '#fff6b0')
HAT = ramp('#06040c', '#130f20', '#241c38', '#3a3054', '#5a4c80')

SPARK = (255, 255, 255)
LASH = (20, 10, 28)
OUTLINE_TINT = (20, 6, 34)
RIM = ((255, 70, 190), 0.3)


def sequins(seed):
    def tex(idx, m):
        rng = np.random.default_rng(seed)
        grid = ((E.XX + (E.YY // 2) % 2) % 2 == 0) & (E.YY % 2 == 0)
        out = idx.copy()
        out[grid & m] += 1
        out[grid & m & (rng.random((E.H, E.W)) < 0.12)] = 4
        out[(~grid) & m & (rng.random((E.H, E.W)) < 0.12)] -= 1
        return out
    return tex


def curls_tex(idx, m):
    out = idx.copy()
    out[((E.XX * 2 + E.YY * 3) % 5 == 0) & m] -= 1
    out[((E.XX + E.YY * 2) % 7 == 0) & m] += 1
    return out


def lerp(a, b, t):
    return a + (b - a) * t


# ---------------------------------------------------------------- poses
# Cada pose: quadril (dx, dy), inclinacao do tronco, pes (x relativo ao
# quadril, altura, rotacao do pe), alvo da mao livre (relativo ao quadril),
# rosto e inclinacao da cabeca.
def pose(hip=(0, 0), lean=0.0, near=(3, 0, 0), far=(-3, 0, 0), hand=(-12, -2), face='cool',
         tilt=0.0, hand_front=False, hat_dy=0.0):
    return dict(hip=hip, lean=lean, near=near, far=far, hand=hand, face=face, tilt=tilt,
                hand_front=hand_front, hat_dy=hat_dy)


def moon_foot(u, base):
    """Metade do ciclo desliza chapado para tras; a outra fica na ponta do pe."""
    u %= 1.0
    s = 4.5
    if u < 0.5:
        return (base + s - 4 * s * u, 0, 0.0)
    v = (u - 0.5) * 2
    toe = v / 0.15 if v < 0.15 else (1 - v) / 0.15 if v > 0.85 else 1.0
    return (base - s + 2 * s * v, 0, 0.85 * toe)


def poses():
    out = {}
    # Parado: joelhos dobram na batida; mao livre aponta pro ceu ou pro chao.
    for hand_name, hand in (('up', (-1, -45)), ('down', (-12, 1))):
        out[f'idle_{hand_name}_0'] = pose(hip=(0, 1.5), hand=hand, near=(3.5, 0, 0), far=(-3, 0, 0))
        out[f'idle_{hand_name}_1'] = pose(hip=(0, 0), hand=hand, near=(3.5, 0, 0), far=(-3, 0, 0))
        out[f'tiptoe_{hand_name}'] = pose(hip=(0, -2.5), hand=hand, near=(3.5, 0, 0.9), far=(-3, 0, 0.9),
                                          face='hoo', hat_dy=-1)
    # Moonwalk: corpo tomba pra tras, mao segurando a aba do chapeu.
    for i in range(8):
        u = i / 8
        bob = 0.6 + abs(math.sin(u * 2 * math.pi)) * 0.6
        out[f'moon_{i}'] = pose(hip=(0, bob), lean=-0.12, near=moon_foot(u + 0.5, 3), far=moon_foot(u, -3),
                                hand=(7, -38), tilt=-0.05)
    out['jump'] = pose(hip=(0, 0), near=(6, 7, 1.0), far=(-5, 1, 0.8), hand=(-1, -46), face='hoo')
    out['fall'] = pose(hip=(0, 0), near=(6, 4, 1.0), far=(-5, -0.5, 0.8), hand=(-1, -46))
    # Critico: mao na virilha, joelho da frente la em cima, cabeca pra tras.
    out['crit'] = pose(hip=(0, 1), lean=-0.16, near=(4, 7, 1.25), far=(-3, 0, 0.15), hand=(4, 1),
                       face='hoo', tilt=-0.35, hand_front=True, hat_dy=-3)
    out['hurt'] = pose(hip=(0, 2), lean=-0.25, near=(5, 0, 0.3), far=(-4, 0, 0.6), hand=(-14, -20),
                       face='hoo', tilt=-0.3, hat_dy=-2)
    return out


# ---------------------------------------------------------------- corpo
def body_frame(p, seed):
    E.init(BODY_W, BODY_H)
    hx, hy = X0 + p['hip'][0], HIP_Y + p['hip'][1]
    hip = (hx, hy)
    lean = p['lean']
    tr = lambda pt: add(hip, rot(pt, lean))  # ponto no tronco (relativo ao quadril)
    parts, decals = [], []

    # pernas
    legs = {}
    for name, off in (('near', 1.5), ('far', -1.5)):
        fx, fy, pitch = p[name]
        ax = hx + fx
        c, s = math.cos(pitch), math.sin(pitch)
        low = max(5.0 * s + 3.0 * c, -2.4 * s + 3.0 * c)
        ay = G - low - fy
        hj = (hx + off, hy + 1)
        knee = ik(hj, (ax, ay), 10.6, 10.2, bend=1)
        legs[name] = (hj, knee, (ax, ay), pitch)

    def shoe(ank, pitch):
        pts = [(-2.0, -1.0), (1.5, -1.2), (4.0, 1.0), (6.0, 1.7), (6.2, 3.0), (-2.6, 3.0), (-2.7, 1.2)]
        return poly([add(ank, rot(q, pitch)) for q in pts])

    def leg_parts(name, shift):
        hj, knee, ank, pitch = legs[name]
        g = 'leg_' + name
        cuff = (lerp(knee[0], ank[0], 0.55), lerp(knee[1], ank[1], 0.55))
        sock = Part(capsule(cuff, ank, 1.9, 1.8), WHITE, group=g + 's', R=2, shift=shift, lines=False,
                    shadow=False, bias=0.5)
        pants = Part(union(capsule(hj, knee, 3.5, 2.9), capsule(knee, cuff, 2.9, 2.7)), PANTS, group=g, R=3,
                     shift=shift, dither=0.6)
        sh = Part(shoe(ank, pitch), BLACK, group=g + 'f', R=2, shift=shift, k=3)
        return [sock, pants, sh], ank, pitch

    # braco livre (luva brilhante): IK do ombro ate o alvo
    Sf = tr((-3, -18))
    hand_t = add(hip, p['hand'])
    elbow_f = ik(Sf, hand_t, 7.5, 7.0, bend=-1)
    d = math.hypot(hand_t[0] - elbow_f[0], hand_t[1] - elbow_f[1]) or 1
    hand_f = (elbow_f[0] + (hand_t[0] - elbow_f[0]) / d * 7.0, elbow_f[1] + (hand_t[1] - elbow_f[1]) / d * 7.0)
    arm_shift = 0 if p['hand_front'] else -1
    far_arm = Part(union(capsule(Sf, elbow_f, 2.6, 2.3), capsule(elbow_f, hand_f, 2.3, 2.0)), SILVER,
                   group='farm', R=2.2, shift=arm_shift, tex=sequins(seed + 7))
    band = Part(capsule(polar(Sf, 2.2, math.atan2(elbow_f[0] - Sf[0], elbow_f[1] - Sf[1])),
                        polar(Sf, 3.6, math.atan2(elbow_f[0] - Sf[0], elbow_f[1] - Sf[1])), 2.8),
                PINK, group='farband', R=1.2, shift=arm_shift, lines=False)
    ga = math.atan2(hand_f[0] - elbow_f[0], hand_f[1] - elbow_f[1])
    glove = Part(union(ellipse(polar(hand_f, 1.0, ga), 2.2, 2.4, -ga), capsule(polar(hand_f, 2, ga), polar(hand_f, 4.2, ga), 0.8)),
                 WHITE, group='glove', R=1.6, shift=arm_shift, tex=sequins(seed + 11))

    # cabelo (cachos atras da cabeca)
    neck_base = tr((2, -19))
    Hd = add(tr((2, -27)), (0, 0))
    ht = p['tilt']
    hd = lambda pt: add(Hd, rot(pt, ht))
    hair_back = Part(poly([hd(q) for q in [(-6, -6), (2, -8), (3, -3), (-1, 2), (-1, 7), (-3, 10),
                                           (-8, 11), (-10, 7), (-10, 1), (-9, -4)]]),
                     HAIR, group='hairb', R=2.5, tex=curls_tex)

    # tronco: jaqueta aberta com camisa preta, cinto dourado
    jacket = Part(poly([tr(q) for q in [(-6, -20), (4, -20.5), (7, -16), (7.5, -9), (6, -3), (6.5, 1),
                                         (1.5, 2), (-5.5, 1.2), (-6.5, -6), (-7, -15)]]),
                  SILVER, group='torso', R=3.2, tex=sequins(seed), grad=(0.25, 0.1))
    shirt = Part(poly([tr(q) for q in [(1.2, -20.5), (5.5, -20), (6.2, -15.5), (5, -8), (3.8, -8), (2.4, -15)]]),
                 BLACK, group='shirt', R=1.8, bias=0.3)
    collar = Part(poly([tr(q) for q in [(0.2, -21), (2.2, -21), (3.2, -15), (4, -8), (3.2, -8), (1.4, -15)]]),
                  WHITE, group='lapel', R=1, lines=False, bias=0.6)
    hem = Part(poly([tr(q) for q in [(-5.6, -0.6), (6.3, -1.0), (6.5, 1.0), (1.5, 2), (-5.5, 1.2)]]), PINK,
               group='hem', R=1, lines=False)
    belt = Part(poly([tr(q) for q in [(-5.8, -1.8), (6.6, -2.2), (6.7, -0.4), (-5.7, 0)]]), BLACK,
                group='belt', R=1.2)
    pelvis = Part(ellipse((hx + 0.5, hy + 1), 5.6, 3.6), PANTS, group='leg_near', R=3)

    # cabeca grande de desenho animado
    neck = Part(capsule(neck_base, hd((0.5, 6)), 2.2), SKIN, group='neck', R=2, shift=-1)
    head = Part(poly([hd(q) for q in [(-6, -6), (2, -8), (6, -5.5), (6.8, -2), (8.6, 0.6), (7.0, 1.8),
                                      (7.0, 4.0), (5.2, 6.4), (1.5, 8.2), (-2.5, 7.6), (-5.6, 3.6), (-6.8, -1)]]),
                SKIN, group='head', R=3.5, grad=(0.1, 0.05), bias=1.0)
    ear = Part(ellipse(hd((-2.6, 1.2)), 1.6, 2.2, ht), SKIN, group='ear', R=1.5, shift=-1)
    hair_front = Part(poly([hd(q) for q in [(-6.6, -5.5), (3, -8), (4, -5.6), (-1, -4.6), (-3.6, -3),
                                            (-4, 3), (-6.6, 3)]]),
                      HAIR, group='hairf', R=2, lines=False, tex=curls_tex)
    # fedora inclinado pra frente
    hat_tilt = ht + 0.14
    hy_off = p['hat_dy']
    th = lambda pts: [add(add(Hd, (0, hy_off)), rot(q, hat_tilt)) for q in pts]
    crown = [(-7, -5.5), (-6.8, -10), (-4.6, -12.6), (-1, -13.2), (1, -12.4), (3.6, -13.4), (6.4, -12.2),
             (7.6, -9.5), (7.6, -5.5)]
    brim = [(-11, -5.8), (-7, -8), (7.6, -8.2), (12.4, -6.8), (13.2, -5.0), (8.6, -4.3), (-6.6, -4.2), (-11.2, -4.5)]
    bandp = [(-7.1, -9.0), (7.6, -9.2), (7.6, -7.0), (-7.1, -6.8)]
    hat_crown = Part(poly(th(crown)), HAT, group='hatc', R=3, grad=(0.2, 0.0), bias=0.6)
    hat_band = Part(poly(th(bandp)), WHITE, group='hatb', R=1.2, lines=False, bias=0.4)
    hat_brim = Part(poly(th(brim)), HAT, group='hatbr', R=1.5, k=3, bias=0.5)

    far_legs, _, _ = leg_parts('far', -1)
    near_legs, ank_n, pitch_n = leg_parts('near', 0)
    arm_parts = [far_arm, band, glove]
    if not p['hand_front']:
        parts += arm_parts
    parts += far_legs + [pelvis] + near_legs
    parts += [jacket, shirt, collar, hem, belt, hair_back, neck, ear, head, hair_front, hat_crown, hat_band, hat_brim]
    if p['hand_front']:
        parts += arm_parts

    # rosto
    fx, fy = hd((0, 0))
    fx, fy = int(round(fx)), int(round(fy))
    skin_d = (176, 96, 80)
    if p['face'] == 'hoo':
        decals += pattern([
            '..bbbb.',
            '.......',
            '..e..e.',
            '...ee..',
            '.......',
            '.......',
            '..ooooo',
            '..owwwo',
            '..orrro',
            '...ooo.',
        ], (fx - 1, fy - 5), {'b': LASH, 'e': LASH, 'o': (40, 10, 30), 'w': (255, 255, 255),
                              'r': (200, 50, 90)})
    else:
        decals += pattern([
            '...bbb.',
            '..b...b',
            '..bbbbb',
            '..wwke.',
            '...ww..',
            '.......',
            '....n..',
            '.......',
            '..mmmmm',
            '......m',
        ], (fx - 1, fy - 5), {'b': LASH, 'k': (40, 24, 60), 'e': LASH, 'w': (255, 255, 255),
                              'n': skin_d, 'm': (110, 30, 50)})
    decals += pattern(['pp.', 'ppp'], (fx - 1, fy + 2), {'p': (255, 120, 170)})
    # cachinho: o "6" famoso na testa, por cima da aba
    hx2, hy2 = hd((2.5, -5.0))
    decals += pattern(['.hh.', 'h..h', '...h', '..h.', '.h..'], (round(hx2), round(hy2 + hy_off * 0.3)),
                      {'h': (24, 16, 40)})
    bx, by = tr((1, -1.4))
    decals += pattern(['gGg', 'GgG'], (round(bx), round(by)), {'g': GOLD[2], 'G': GOLD[4]})
    # brilhos piscando na jaqueta
    rng = random.Random(seed * 7 + 3)
    pts = list(zip(*np.nonzero(jacket.mask)))
    for _ in range(2):
        y, x = rng.choice(pts)
        decals += [(x, y, SPARK), (x - 1, y, SILVER[3]), (x + 1, y, SILVER[3]), (x, y - 1, SILVER[3]),
                   (x, y + 1, SILVER[3])]
    img = render(parts, decals, outline_tint=OUTLINE_TINT, rim=RIM)
    shoulder = tr((3, -20.4))
    return img, {'shoulder': [round(shoulder[0], 2), round(shoulder[1], 2)]}


# ---------------------------------------------------------------- braco com revolver
ARM_SIZE = 64
ARM_C = 32  # pivo da mira no centro do quadro


def arm_frame(angle, seed):
    """Braco esticado para a mira (angulo local: 0 = frente, + = para baixo)."""
    E.init(ARM_SIZE, ARM_SIZE)
    S = (ARM_C, ARM_C)
    a = angle
    L = lambda pt: add(S, rot(pt, a))
    # Referencial do braco: x ao longo da mira; o eixo do cano passa pelo
    # pivo (o tiro sai dali), o ombro fica um pouco abaixo.
    sh = L((0, 2.6))
    elbow = L((6.2, 4.6))
    shoulder_pad = Part(ellipse(L((0.2, 2.0)), 4.2, 3.2, a + 0.15), SILVER, group='arm', R=2.4,
                        tex=sequins(seed + 3))
    upper = Part(union(capsule(sh, elbow, 3.0, 2.6), capsule(elbow, L((10.4, 3.0)), 2.6, 2.3)), SILVER,
                 group='arm', R=2.4, tex=sequins(seed + 5))
    cuff = Part(capsule(L((9.8, 3.0)), L((10.8, 2.9)), 2.5), PINK, group='cuff', R=1.2, lines=False)
    # revolver cromado: cano 2 px abaixo/acima do eixo, boca em x = 28
    frame_pts = [(9.6, -2.6), (17.0, -2.4), (17.6, 2.0), (14.0, 3.4), (10.2, 2.4)]
    barrel_pts = [(16.0, -2.2), (28.0, -2.0), (28.3, 1.2), (16.0, 1.4)]
    gun = Part(union(poly([L(q) for q in frame_pts]), poly([L(q) for q in barrel_pts]),
                     ellipse(L((14.2, -0.2)), 3.1, 2.6, a)), CHROME, group='gun', R=1.6, k=3.2, bias=0.3)
    sight = Part(poly([L(q) for q in [(25.8, -3.6), (27.6, -3.6), (27.6, -2.0), (25.8, -2.0)]]), CHROME,
                 group='gun', R=1)
    hammer = Part(poly([L(q) for q in [(9.0, -3.8), (11.0, -3.8), (11.6, -2.0), (9.6, -1.8)]]), CHROME,
                  group='gun', R=1)
    grip = Part(poly([L(q) for q in [(9.8, 1.6), (13.4, 1.6), (12.8, 8.0), (9.0, 7.4)]]), WOOD,
                group='grip', R=1.6)
    stripe = Part(poly([L(q) for q in [(17.6, 0.0), (27.0, 0.0), (27.0, 0.8), (17.6, 0.8)]]), PINK,
                  group='stripe', R=1, lines=False)
    fist = Part(ellipse(L((11.4, 3.0)), 2.4, 2.2, a), SKIN, group='fist', R=1.6, bias=0.5)
    parts = [upper, cuff, grip, gun, sight, hammer, stripe, fist, shoulder_pad]
    img = render(parts, outline_tint=OUTLINE_TINT, rim=RIM)
    muzzle = L((28.5, -0.4))
    return img, {'muzzle': [round(muzzle[0] - ARM_C, 2), round(muzzle[1] - ARM_C, 2)]}


ARM_STEP_DEG = 7.5


def frames():
    """{nome: (imagem, ancoras)} de todos os quadros do Johnny."""
    out = {}
    for i, (name, p) in enumerate(poses().items()):
        out[name] = body_frame(p, seed=i + 1)
    n = int(180 / ARM_STEP_DEG)
    for k in range(n + 1):
        deg = -90 + k * ARM_STEP_DEG
        out[f'arm_{k}'] = arm_frame(math.radians(deg), seed=k)
    return out


META = {
    'body': {'w': BODY_W, 'h': BODY_H, 'originX': X0, 'originY': G},
    'arm': {'w': ARM_SIZE, 'h': ARM_SIZE, 'pivot': ARM_C, 'stepDeg': ARM_STEP_DEG, 'count': int(180 / ARM_STEP_DEG) + 1},
}
