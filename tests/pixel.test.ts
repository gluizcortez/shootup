import { describe, expect, it } from 'vitest';
import { downsample, pixelize } from '@/game/rendering/pixel/pixelize';
import { pixelZoom } from '@/game/data/view';

function solid(w: number, h: number, rgb: [number, number, number]): { width: number; height: number; data: Uint8ClampedArray } {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([...rgb, 255], i * 4);
  return { width: w, height: h, data };
}

describe('pixelize', () => {
  it('reduz cada bloco F×F a um pixel com a cor dominante, sem misturar', () => {
    const src = solid(8, 4, [200, 50, 50]);
    // Metade direita azul: o pixel de saída da direita é azul puro, não roxo.
    for (let y = 0; y < 4; y++) for (let x = 4; x < 8; x++) src.data.set([40, 60, 220, 255], (y * 8 + x) * 4);
    const out = downsample(src, 4, 2, 1, 'sprite');
    expect([...out.data.slice(0, 4)]).toEqual([200, 50, 50, 255]);
    expect([...out.data.slice(4, 8)]).toEqual([40, 60, 220, 255]);
  });

  it('bloco quase vazio vira transparente (borda dura, sem antialias)', () => {
    const src = { width: 4, height: 4, data: new Uint8ClampedArray(64) };
    src.data.set([255, 255, 255, 255], 0);
    const out = downsample(src, 4, 1, 1, 'sprite');
    expect(out.data[3]).toBe(0);
  });

  it('dá volume: borda de cima mais clara que a de baixo', () => {
    const out = pixelize(solid(64, 64, [120, 120, 200]), 4, 16, 16, 'sprite');
    const lum = (x: number, y: number) => {
      const i = (y * 16 + x) * 4;
      return (out.data[i] as number) + (out.data[i + 1] as number) + (out.data[i + 2] as number);
    };
    expect(lum(4, 0)).toBeGreaterThan(lum(11, 15));
  });
});

describe('pixelZoom', () => {
  it('escolhe o zoom inteiro mais próximo da janela, entre 1 e 3', () => {
    expect(pixelZoom(1200, 1920)).toBe(2);
    expect(pixelZoom(1200, 1366)).toBe(1);
    expect(pixelZoom(1200, 3840)).toBe(3);
    expect(pixelZoom(1200, 0)).toBe(2);
  });
});
