import { describe, expect, it } from 'vitest';
import type { GameEvent } from '@/core/run/events';
import type { EnemyKind } from '@/core/enemies/types';
import { World } from '@/core/run/world';
import type { SimInput } from '@/core/run/world';
import { generateWave, scaleForWave } from '@/core/run/waves';
import { Rng } from '@/core/math/rng';
import { SIM_STEP } from '@/game/data/arena';
import { BREAKER_BOOMBOX, DJ_NEON, ENEMIES, LUTADOR_MAMUTE, MAGICO_VEGAS, MAROMBA_VICE, VENDEDOR_TV } from '@/game/data/enemies';
import { WAVES } from '@/game/data/waves';
import { WORLD_CONFIG } from '@/game/data/world';

const idle = (w: World): SimInput => ({
  moveX: 0,
  jumpPressed: false,
  jumpHeld: false,
  fireHeld: false,
  aimX: w.player.motor.x + 100,
  aimY: w.player.motor.y,
});

function run(w: World, seconds: number, onStep?: (w: World) => void): GameEvent[] {
  const all: GameEvent[] = [];
  for (let i = 0; i < Math.round(seconds / SIM_STEP); i++) {
    w.step(idle(w), SIM_STEP);
    onStep?.(w);
    all.push(...w.events);
    w.events.length = 0;
  }
  return all;
}

function freshWorld(seed = 11): World {
  const w = new World(WORLD_CONFIG, seed);
  w.wavesEnabled = false;
  w.player.invuln = 1e9;
  return w;
}

const shotsOf = (events: GameEvent[], uid: number) => events.filter((ev) => ev.type === 'enemyShot' && ev.uid === uid);

describe('Cinco vilões novos', () => {
  it('Breakdancer persegue andando e depois sai de headspin', () => {
    expect(BREAKER_BOOMBOX.role).toBe('melee');
    const w = freshWorld();
    const e = w.spawnEnemy('breaker_boombox', 0.95);
    run(w, BREAKER_BOOMBOX.warnTime + 1);
    const d0 = Math.abs(e.x - w.player.motor.x);
    let spun = false;
    run(w, 5, () => {
      if (e.state === 'spin') spun = true;
    });
    expect(spun).toBe(true);
    expect(Math.abs(e.x - w.player.motor.x)).toBeLessThan(d0);
  });

  it('Lutador salta até o jogador e a barrigada solta onda de choque para os dois lados', () => {
    expect(LUTADOR_MAMUTE.role).toBe('melee');
    const w = freshWorld();
    const e = w.spawnEnemy('lutador_mamute', 0.85);
    let leaped = false;
    let maxShocks = 0;
    let shockDirs = new Set<number>();
    const events = run(w, 6, (ww) => {
      if (e.state === 'leap') leaped = true;
      const shocks = ww.projectiles.items.filter((p) => p.active && p.sourceId === 'lutador_mamute');
      maxShocks = Math.max(maxShocks, shocks.length);
      if (shocks.length === 2) shockDirs = new Set(shocks.map((p) => Math.sign(p.vx)));
    });
    expect(leaped).toBe(true);
    expect(events.some((ev) => ev.type === 'enemyShout' && ev.uid === e.uid)).toBe(true);
    expect(maxShocks).toBeGreaterThanOrEqual(2);
    expect(shockDirs).toEqual(new Set([-1, 1]));
  });

  it('DJ solta leques de notas em duas batidas, sempre no alto', () => {
    const w = freshWorld();
    const e = w.spawnEnemy('dj_neon', 0.2);
    let maxY = -Infinity;
    const events = run(w, 6, () => {
      if (e.state !== 'incoming' && e.state !== 'descend') maxY = Math.max(maxY, e.y);
    });
    expect(shotsOf(events, e.uid).length).toBeGreaterThanOrEqual(DJ_NEON.ringCount * DJ_NEON.beats);
    expect(maxY).toBeLessThanOrEqual(DJ_NEON.hoverMaxY + 12);
  });

  it('Mágico some, reaparece em outro ponto e joga o leque de cartas', () => {
    const w = freshWorld();
    const e = w.spawnEnemy('magico_vegas', 0.5);
    let maxY = -Infinity;
    const events = run(w, 6, () => {
      if (e.state !== 'incoming' && e.state !== 'descend') maxY = Math.max(maxY, e.y);
    });
    expect(events.filter((ev) => ev.type === 'enemyPoof' && ev.uid === e.uid).length).toBeGreaterThanOrEqual(2);
    expect(shotsOf(events, e.uid).length).toBeGreaterThanOrEqual(MAGICO_VEGAS.cardCount);
    expect(maxY).toBeLessThanOrEqual(MAGICO_VEGAS.hoverMaxY + 12);
  });

  it('Vendedor chama capangas pelo telefone, até o limite', () => {
    const w = freshWorld();
    const e = w.spawnEnemy('vendedor_tv', 0.5);
    run(w, 40);
    const helpers = w.enemies.filter((o) => o.alive && o.def.id === VENDEDOR_TV.summonKind).length;
    expect(helpers).toBeGreaterThan(0);
    expect(helpers).toBeLessThanOrEqual(VENDEDOR_TV.summonMax);
    expect(e.y).toBeLessThanOrEqual(VENDEDOR_TV.hoverMaxY + 12);
  });

  it('Maromba tem sempre 1 de vida, em qualquer onda', () => {
    for (const wave of [1, 10, 50]) expect(scaleForWave(MAROMBA_VICE, wave, WAVES.growth).maxHp).toBe(1);
  });
});

describe('Mapa de estreias', () => {
  it('todo vilão (menos o chefe) está no elenco, com uma estreia por onda de 1 a 14 (10 é o chefe)', () => {
    const kinds = (Object.keys(ENEMIES) as EnemyKind[]).filter((k) => !ENEMIES[k].boss);
    expect(new Set(WAVES.roster.map((r) => r.kind))).toEqual(new Set(kinds));
    const froms = WAVES.roster.map((r) => r.from).sort((a, b) => a - b);
    expect(froms).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14]);
    expect(WAVES.bossWaves?.[10]).toBeDefined();
  });

  it('o estreante vem garantido na onda dele', () => {
    for (const r of WAVES.roster) {
      expect(generateWave(r.from, WAVES, new Rng(r.from)).spawns.some((s) => s.kind === r.kind)).toBe(true);
    }
  });
});
