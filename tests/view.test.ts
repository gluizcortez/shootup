import { describe, expect, it } from 'vitest';
import { VIEW_HEIGHT, VIEW_WIDTH } from '@/game/data/arena';
import { computeView, MAX_ASPECT, MIN_ASPECT, VIEW_MARGIN } from '@/game/data/view';

describe('computeView', () => {
  for (const aspect of [MIN_ASPECT, 16 / 9, 2, VIEW_WIDTH / VIEW_HEIGHT, 21 / 9, MAX_ASPECT, 4, 0.5]) {
    it(`mostra a arena inteira e preenche a janela em ${aspect.toFixed(2)}:1`, () => {
      const v = computeView(aspect);
      expect(v.left).toBeLessThanOrEqual(0);
      expect(v.top).toBeLessThanOrEqual(0);
      expect(v.left + v.width).toBeGreaterThanOrEqual(VIEW_WIDTH - 1e-9);
      expect(v.top + v.height).toBeGreaterThanOrEqual(VIEW_HEIGHT - 1e-9);
      const clamped = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, aspect));
      expect(v.width / v.height).toBeCloseTo(clamped, 6);
      expect(v.canvasW / v.canvasH).toBeCloseTo(clamped, 2);
      // O cenário assado cobre qualquer sobra possível.
      expect(-v.left).toBeLessThanOrEqual(VIEW_MARGIN.side + 1e-9);
      expect(-v.top).toBeLessThanOrEqual(VIEW_MARGIN.top + 1e-9);
      expect(v.top + v.height - VIEW_HEIGHT).toBeLessThanOrEqual(VIEW_MARGIN.bottom + 1e-9);
    });
  }

  it('sobra horizontal vira coxias simétricas', () => {
    const v = computeView(MAX_ASPECT);
    expect(v.top).toBeCloseTo(0);
    expect(v.left).toBeCloseTo(-(v.width - VIEW_WIDTH) / 2);
  });
});
