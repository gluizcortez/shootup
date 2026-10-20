import type Phaser from 'phaser';

/**
 * Folhas de sprites pintadas offline (tools/sprites/build.py) em public/sprites.
 * Cada personagem tem um atlas do Phaser e um .meta.json com as âncoras.
 */
export const JOHNNY_ATLAS = 'johnny';
export const JOHNNY_META = 'johnny_meta';

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
  scene.load.setPath('');
}
