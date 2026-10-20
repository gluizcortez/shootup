import type Phaser from 'phaser';

/**
 * Folhas de sprites pintadas offline (tools/sprites/build.py) em public/sprites.
 * Cada personagem tem um atlas do Phaser e um .meta.json com as âncoras.
 */
export const JOHNNY_ATLAS = 'johnny';
export const JOHNNY_META = 'johnny_meta';
/** Elenco (vilões e chefe): cada quadro vira a textura de mesmo nome. */
const CAST_ATLAS = 'cast';

export interface SpriteMeta {
  /** Quadro do corpo: origem = ponto entre os pés, na sola. */
  body: { w: number; h: number; originX: number; originY: number };
  /** Braço da arma: quadro quadrado com o pivô da mira no centro, um quadro a cada `stepDeg` de -90° a +90°. */
  arm: { w: number; h: number; pivot: number; stepDeg: number; count: number };
  anchors: Record<string, { shoulder?: [number, number] } | undefined>;
}

export function preloadSprites(scene: Phaser.Scene): void {
  scene.load.setPath(`${import.meta.env.BASE_URL}sprites/`);
  scene.load.atlas(JOHNNY_ATLAS, 'johnny.png', 'johnny.json');
  scene.load.json(JOHNNY_META, 'johnny.meta.json');
  scene.load.atlas(CAST_ATLAS, 'cast.png', 'cast.json');
  scene.load.setPath('');
}

/**
 * Separa a folha do elenco em texturas soltas com as chaves que as views já
 * usam (pato_body, vaca_head…). Roda antes de gerar as texturas em código:
 * `make` pula as chaves que já existem, então o desenho em código só vale de
 * reserva para o que não tiver quadro pintado.
 */
export function installCast(scene: Phaser.Scene): void {
  if (!scene.textures.exists(CAST_ATLAS)) return;
  const atlas = scene.textures.get(CAST_ATLAS);
  const src = atlas.getSourceImage() as HTMLImageElement;
  for (const name of atlas.getFrameNames()) {
    const f = atlas.get(name);
    const canvas = document.createElement('canvas');
    canvas.width = f.cutWidth;
    canvas.height = f.cutHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
    if (scene.textures.exists(name)) scene.textures.remove(name);
    scene.textures.addCanvas(name, canvas);
  }
  scene.textures.remove(CAST_ATLAS);
}
