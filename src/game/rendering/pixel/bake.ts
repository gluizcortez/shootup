import type Phaser from 'phaser';
import { pixelize, type PixelMode } from './pixelize';

/** Texturas que não ganham volume: brilhos, mira, balas, ícones. */
const GLOW = new Set(['px_soft', 'fx_glow', 'shadow', 'fx_shield', 'fx_flame', 'beam', 'edge_glow']);
const FLAT = new Set([
  'px_dot',
  'px_star',
  'px_feather',
  'px_shell',
  'fx_muzzle',
  'fx_ring',
  'fx_excl',
  'fx_drop',
  'crosshair',
  'hitmarker',
  'heart',
]);

export function pixelModeFor(key: string): PixelMode {
  if (GLOW.has(key)) return 'glow';
  if (FLAT.has(key) || key.startsWith('b_')) return 'flat';
  return 'sprite';
}

/**
 * Rasteriza `g` em `scale`× e guarda como pixel art 1× sob `key`.
 * O tamanho final é `ceil(w) × ceil(h)` texels.
 */
export function bakePixel(
  scene: Phaser.Scene,
  key: string,
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
  scale: number,
  mode: PixelMode = pixelModeFor(key),
): void {
  const W = Math.ceil(w);
  const H = Math.ceil(h);
  // Desenha direto num canvas solto: sem criar (e subir para a GPU) uma textura temporária.
  const hi = document.createElement('canvas');
  hi.width = W * scale;
  hi.height = H * scale;
  g.generateTexture(hi, hi.width, hi.height);
  const hctx = hi.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  const data = hctx.getImageData(0, 0, hi.width, hi.height);
  const px = pixelize({ width: data.width, height: data.height, data: data.data }, scale, W, H, mode);
  addPixelTexture(scene, key, px.width, px.height, px.data);
}

export function addPixelTexture(scene: Phaser.Scene, key: string, w: number, h: number, data: Uint8ClampedArray): void {
  const out = document.createElement('canvas');
  out.width = Math.max(1, w);
  out.height = Math.max(1, h);
  const ctx = out.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  if (w > 0 && h > 0) ctx.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, out);
}
