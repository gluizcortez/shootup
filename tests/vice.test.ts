import { describe, expect, it } from 'vitest';
import type { GameEvent } from '@/core/run/events';
import { World } from '@/core/run/world';
import type { SimInput } from '@/core/run/world';
import { generateWave } from '@/core/run/waves';
import { Rng } from '@/core/math/rng';
import { SIM_STEP } from '@/game/data/arena';
import { MAROMBA_VICE, PATINADOR_ASSASSINO, POLICIAL_CORRUPTO } from '@/game/data/enemies';
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

function freshWorld(seed = 7): World {
  const w = new World(WORLD_CONFIG, seed);
  w.wavesEnabled = false;
  w.player.invuln = 1e9;
  return w;
}

describe('Maromba Miami Vice (melee)', () => {
  it('cai do topo, pousa e fica plantado trocando de pose', () => {
    expect(MAROMBA_VICE.role).toBe('melee');
    const w = freshWorld();
    const e = w.spawnEnemy('maromba_vice', 0.8);
    const events = run(w, MAROMBA_VICE.warnTime + 1.2);
    expect(events.some((ev) => ev.type === 'enemyLanded' && ev.uid === e.uid)).toBe(true);
    expect(e.state).toBe('flex');
    const x = e.x;
    const pose = e.attack;
    run(w, 6);
    expect(e.state).toBe('flex');
    expect(e.x).toBeCloseTo(x, 1);
    expect(e.grounded).toBe(true);
    expect(e.attack).toBeGreaterThan(pose);
  });

  it('não persegue, mas machuca quem encosta nele', () => {
    const w = freshWorld();
    const e = w.spawnEnemy('maromba_vice', 0.85);
    run(w, MAROMBA_VICE.warnTime + 1.2);
    expect(Math.abs(e.x - w.player.motor.x)).toBeGreaterThan(100);
    w.player.invuln = 0;
    const hp = w.player.hp;
    // Jogador anda até ele.
    let hurt = false;
    for (let i = 0; i < Math.round(4 / SIM_STEP) && !hurt; i++) {
      w.step({ ...idle(w), moveX: Math.sign(e.x - w.player.motor.x) }, SIM_STEP);
      hurt = w.events.some((ev) => ev.type === 'playerHurt');
      w.events.length = 0;
    }
    expect(hurt).toBe(true);
    expect(w.player.hp).toBe(hp - MAROMBA_VICE.contactDamage);
  });
});

describe('Atiradores novos ficam no alto', () => {
  it('Patinador Assassino: agacha (aviso) e atravessa no alto atirando no drive-by', () => {
    expect(PATINADOR_ASSASSINO.role).toBe('ranged');
    const w = freshWorld();
    const e = w.spawnEnemy('patinador_assassino', 0.1);
    let maxY = -Infinity;
    let crouched = false;
    let dashSpeed = 0;
    const events = run(w, 8, () => {
      if (e.state !== 'incoming' && e.state !== 'descend') maxY = Math.max(maxY, e.y);
      if (e.state === 'crouch') crouched = true;
      if (e.state === 'dash') dashSpeed = Math.max(dashSpeed, Math.abs(e.vx));
    });
    expect(crouched).toBe(true);
    expect(dashSpeed).toBeGreaterThan(PATINADOR_ASSASSINO.flySpeed);
    expect(events.some((ev) => ev.type === 'enemyTelegraph' && ev.uid === e.uid && ev.state === 'crouch')).toBe(true);
    expect(events.filter((ev) => ev.type === 'enemyShot' && ev.uid === e.uid).length).toBeGreaterThanOrEqual(PATINADOR_ASSASSINO.dashShots);
    expect(maxY).toBeLessThanOrEqual(PATINADOR_ASSASSINO.hoverMaxY + 12);
  });

  it('Policial Corrupto: mira laser que trava e dá dois tiros na mesma linha', () => {
    expect(POLICIAL_CORRUPTO.role).toBe('ranged');
    const w = freshWorld();
    const e = w.spawnEnemy('policial_corrupto', 0.9);
    let maxY = -Infinity;
    const events = run(w, 6, () => {
      if (e.state !== 'incoming' && e.state !== 'descend') maxY = Math.max(maxY, e.y);
    });
    expect(events.some((ev) => ev.type === 'enemyTelegraph' && ev.uid === e.uid && ev.state === 'aim')).toBe(true);
    const shots = events.filter((ev): ev is Extract<GameEvent, { type: 'enemyShot' }> => ev.type === 'enemyShot' && ev.uid === e.uid);
    expect(shots.length).toBeGreaterThanOrEqual(2);
    expect((shots[1] as { angle: number }).angle).toBeCloseTo((shots[0] as { angle: number }).angle, 5);
    expect(maxY).toBeLessThanOrEqual(POLICIAL_CORRUPTO.hoverMaxY + 12);
  });
});

describe('Ritmo de estreia nas ondas', () => {
  const debut = (kind: string): number => WAVES.roster.find((r) => r.kind === kind)?.from ?? -1;
  it('Patinador na 2, Maromba na 5 e Policial na 7, garantidos na estreia', () => {
    expect(debut('patinador_assassino')).toBe(2);
    expect(debut('maromba_vice')).toBe(5);
    expect(debut('policial_corrupto')).toBe(7);
    for (const kind of ['patinador_assassino', 'maromba_vice', 'policial_corrupto']) {
      const w = generateWave(debut(kind), WAVES, new Rng(9));
      expect(w.spawns.some((s) => s.kind === kind)).toBe(true);
    }
  });

  it('ondas avançadas seguem podendo trazer os três', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed < 20; seed++) for (const s of generateWave(12, WAVES, new Rng(seed)).spawns) seen.add(s.kind);
    for (const kind of ['patinador_assassino', 'maromba_vice', 'policial_corrupto']) expect(seen.has(kind)).toBe(true);
  });
});
