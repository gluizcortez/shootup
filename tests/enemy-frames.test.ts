import { describe, expect, it } from 'vitest';
import { pickEnemyFace } from '@/game/rendering/enemyFrames';

const base = { state: 'hover' as const, hurt: 0, shotKick: 0, time: 0.5, seed: 0 };

describe('pickEnemyFace', () => {
  it('dor tem prioridade sobre tiro e mira', () => {
    expect(pickEnemyFace({ ...base, state: 'aim', hurt: 0.1, shotKick: 1 })).toBe('_hurt');
  });

  it('tiro recente ou rajada mostram a boca aberta', () => {
    expect(pickEnemyFace({ ...base, shotKick: 0.8 })).toBe('_shoot');
    expect(pickEnemyFace({ ...base, state: 'burst' })).toBe('_shoot');
  });

  it('estados de aviso mostram a cara de mira', () => {
    for (const state of ['aim', 'spinup', 'buff', 'crouch', 'dash'] as const) {
      expect(pickEnemyFace({ ...base, state })).toBe('_aim');
    }
  });

  it('parado alterna respiração e pisca de vez em quando', () => {
    const seen = new Set<string>();
    for (let t = 0; t < 7; t += 0.02) seen.add(pickEnemyFace({ ...base, time: t }));
    expect([...seen].sort()).toEqual(['', '_b', '_blink']);
  });
});
