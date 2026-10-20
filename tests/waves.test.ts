import { describe, expect, it } from 'vitest';
import { Rng } from '@/core/math/rng';
import { createWaveState, generateWave, maxCount, tickWaves, waveSize } from '@/core/run/waves';
import type { EnemyKind } from '@/core/enemies/types';
import { WAVES } from '@/game/data/waves';

describe('Ondas com X vilões entrando juntos', () => {
  it('X cresce com as ondas e para no teto', () => {
    const sizes = Array.from({ length: 100 }, (_, i) => waveSize(i + 1, WAVES.size));
    expect(sizes.slice(0, 9)).toEqual([2, 2, 2, 3, 3, 3, 4, 4, 4]);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1] as number);
    expect(Math.max(...sizes)).toBe(30);
    expect(sizes[99]).toBe(30);
  });

  it('cada onda comum tem exatamente X vilões, todos com delay 0 e só do elenco liberado', () => {
    for (let n = 1; n <= 100; n += 3) {
      const w = generateWave(n, WAVES, new Rng(n * 7));
      expect(w.spawns.length).toBe(waveSize(n, WAVES.size));
      for (const s of w.spawns) {
        expect(s.delay).toBe(0);
        const r = WAVES.roster.find((e) => e.kind === s.kind);
        expect(r && r.from <= n).toBe(true);
      }
      for (const r of WAVES.roster) {
        expect(w.spawns.filter((s) => s.kind === r.kind).length).toBeLessThanOrEqual(maxCount(r, w.spawns.length));
      }
    }
  });

  it('todos surgem no mesmo passo, mesmo acima do limite de vivos', () => {
    const s = createWaveState(WAVES);
    const rng = new Rng(3);
    s.wave = 29; // a próxima é a 30: X = 11 > maxAlive
    s.timer = 0;
    const spawned: EnemyKind[] = [];
    tickWaves(s, WAVES, rng, 0, 0.01, () => undefined);
    tickWaves(s, WAVES, rng, 0, 0.01, (k) => spawned.push(k));
    expect(spawned.length).toBe(waveSize(30, WAVES.size));
    expect(spawned.length).toBeGreaterThan(WAVES.maxAlive);
  });

  it('a onda de chefe continua cronometrada (exceção)', () => {
    const s = createWaveState(WAVES);
    const rng = new Rng(3);
    s.wave = 9;
    s.timer = 0;
    const spawned: EnemyKind[] = [];
    tickWaves(s, WAVES, rng, 0, 0.01, () => undefined);
    tickWaves(s, WAVES, rng, 0, 0.01, (k) => spawned.push(k));
    expect(s.boss).toBe(true);
    expect(spawned).toEqual(['don_pombone']);
  });
});
