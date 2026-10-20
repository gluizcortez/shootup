"""
Gera as folhas de sprites do jogo em public/sprites/.

  python3 tools/sprites/build.py

Dependencias (so para gerar a arte, nao para rodar o jogo):
numpy, scipy, pillow. A saida (PNG + JSON) fica versionada no repositorio.

Para cada personagem: <id>.png + <id>.json (atlas no formato JSON Hash do
Phaser) e <id>.meta.json (ancoras por quadro e medidas do esqueleto).
"""
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT = os.path.join(HERE, '..', '..', 'public', 'sprites')

import johnny  # noqa: E402
import v_boss  # noqa: E402
import v_brawlers  # noqa: E402
import v_casino  # noqa: E402
import v_cop  # noqa: E402
import v_goon  # noqa: E402
import v_king  # noqa: E402
import v_maromba  # noqa: E402
import v_ninja  # noqa: E402
import v_roller  # noqa: E402
import v_showbiz  # noqa: E402
import v_terminator  # noqa: E402

CHARACTERS = {'johnny': johnny}
# Elenco: cada quadro substitui a textura de mesmo nome desenhada em código.
CAST = [v_goon, v_terminator, v_king, v_ninja, v_casino, v_maromba, v_roller, v_cop, v_brawlers, v_showbiz, v_boss]


def pack(frames, cols=10, group_sizes=True):
    """Linhas simples; com group_sizes, cada tamanho de quadro abre linha nova."""
    items = list(frames.items())
    x = y = row_h = 0
    width = 0
    rects = {}
    col = 0
    last_size = None
    for name, (img, _) in items:
        w, h = img.size
        if (group_sizes and last_size and (w, h) != last_size) or col == cols:
            x, y, col = 0, y + row_h, 0
            row_h = 0
        rects[name] = (x, y, w, h)
        x += w + 1
        col += 1
        width = max(width, x)
        row_h = max(row_h, h + 1)
        last_size = (w, h)
    height = y + row_h
    sheet = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    for name, (img, _) in items:
        rx, ry, _, _ = rects[name]
        sheet.alpha_composite(img, (rx, ry))
    return sheet, rects


def build(cid, mod):
    frames = mod.frames()
    write_atlas(cid, frames)
    meta = dict(mod.META)
    meta['anchors'] = {n: a for n, (_, a) in frames.items() if a}
    with open(os.path.join(OUT, f'{cid}.meta.json'), 'w') as f:
        json.dump(meta, f, separators=(',', ':'))
    print(f'{cid}: {len(frames)} quadros')


def build_cast():
    frames = {}
    for mod in CAST:
        for key, fn in mod.TEXTURES.items():
            frames[key] = (fn(), None)
    # agrupa por altura para a folha ficar compacta
    frames = dict(sorted(frames.items(), key=lambda kv: (kv[1][0].height, kv[1][0].width)))
    write_atlas('cast', frames, cols=12, group_sizes=False)
    print(f'cast: {len(frames)} texturas')


def write_atlas(cid, frames, cols=10, group_sizes=True):
    sheet, rects = pack(frames, cols, group_sizes)
    os.makedirs(OUT, exist_ok=True)
    sheet.save(os.path.join(OUT, f'{cid}.png'), optimize=True)
    atlas = {
        'frames': {
            n: {'frame': {'x': x, 'y': y, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
                'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h}}
            for n, (x, y, w, h) in rects.items()
        },
        'meta': {'image': f'{cid}.png', 'format': 'RGBA8888', 'size': {'w': sheet.width, 'h': sheet.height},
                 'scale': '1'},
    }
    with open(os.path.join(OUT, f'{cid}.json'), 'w') as f:
        json.dump(atlas, f, separators=(',', ':'))


if __name__ == '__main__':
    only = sys.argv[1:]
    for cid, mod in CHARACTERS.items():
        if not only or cid in only:
            build(cid, mod)
    if not only or 'cast' in only:
        build_cast()
