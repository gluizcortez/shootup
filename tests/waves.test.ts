import { describe, expect, it } from 'vitest';
import { Rng } from '@/core/math/rng';
import { createWaveState, generateWave, tickWaves, waveSize } from '@/core/run/waves';
import type { EnemyKind } from '@/core/enemies/types';
import { WAVES } from '@/game/data/waves';

describe('Ondas com X vilões entrando juntos', () => {
  it('X cresce com as ondas e para no teto', () => {
    const sizes = Array.from({ length: 20 }, (_, i) => waveSize(i + 1, WAVES.size));
    expect(sizes[0]).toBe(2);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1] as number);
    expect(sizes[19]).toBe(WAVES.size.max);
    expect(sizes[8]).toBeGreaterThan(sizes[0] as number);
  });

  it('cada onda comum tem exatamente X vilões, todos com delay 0 e só do elenco liberado', () => {
    for (let n = 1; n <= 20; n++) {
      const w = generateWave(n, WAVES, new Rng(n * 7));
      expect(w.spawns.length).toBe(waveSize(n, WAVES.size));
      for (const s of w.spawns) {
        expect(s.delay).toBe(0);
        const r = WAVES.roster.find((e) => e.kind === s.kind);
        expect(r && r.from <= n).toBe(true);
      }
      for (const r of WAVES.roster) {
        if (r.maxPerWave === undefined) continue;
        expect(w.spawns.filter((s) => s.kind === r.kind).length).toBeLessThanOrEqual(r.maxPerWave);
      }
    }
  });

  it('todos surgem no mesmo passo, mesmo acima do limite de vivos', () => {
    const s = createWaveState(WAVES);
    const rng = new Rng(3);
    s.wave = 14; // a próxima é a 15: X = 12 > maxAlive
    s.timer = 0;
    const spawned: EnemyKind[] = [];
    tickWaves(s, WAVES, rng, 0, 0.01, () => undefined);
    tickWaves(s, WAVES, rng, 0, 0.01, (k) => spawned.push(k));
    expect(spawned.length).toBe(waveSize(15, WAVES.size));
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
