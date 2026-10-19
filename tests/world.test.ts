import { describe, expect, it } from 'vitest';
import type { GameEvent } from '@/core/run/events';
import { World } from '@/core/run/world';
import type { SimInput } from '@/core/run/world';
import { SIM_STEP } from '@/game/data/arena';
import { GALINHA_RAMBO, PATO_PISTOLEIRO } from '@/game/data/enemies';
import { WORLD_CONFIG } from '@/game/data/world';

function collect(world: World, seconds: number, input: (w: World) => SimInput): GameEvent[] {
  const all: GameEvent[] = [];
  const n = Math.round(seconds / SIM_STEP);
  for (let i = 0; i < n; i++) {
    world.step(input(world), SIM_STEP);
    all.push(...world.events);
    world.events.length = 0;
  }
  return all;
}

const passive = (w: World): SimInput => ({
  moveX: 0,
  jumpPressed: false,
  jumpHeld: false,
  fireHeld: false,
  aimX: w.player.motor.x + 100,
  aimY: w.player.motor.y,
});

function aimAtFirstEnemy(w: World): SimInput {
  const e = w.enemies[0];
  return {
    moveX: 0,
    jumpPressed: false,
    jumpHeld: false,
    fireHeld: !!e && e.state !== 'enter',
    aimX: e ? e.x : 0,
    aimY: e ? e.y : 0,
  };
}

function invulnerable(w: World): void {
  w.player.invuln = 1e9;
}

describe('World — Pato Pistoleiro', () => {
  it('sempre faz a pose dramática antes de atirar', () => {
    const w = new World(WORLD_CONFIG, 11);
    w.wavesEnabled = false;
    w.spawnEnemy('pato_pistoleiro', 1);
    invulnerable(w);
    const events = collect(w, 8, passive);
    const shots = events.filter((e) => e.type === 'enemyShot');
    expect(shots.length).toBeGreaterThan(0);
    let lastTelegraph = -1;
    let t = 0;
    let checked = 0;
    for (const ev of events) {
      if (ev.type === 'enemyTelegraph') lastTelegraph = t;
      if (ev.type === 'enemyShot') {
        expect(lastTelegraph).toBeGreaterThanOrEqual(0);
        checked++;
      }
      t++;
    }
    expect(checked).toBe(shots.length);
  });

  it('a pistola mata o pato e gera pontos', () => {
    const w = new World(WORLD_CONFIG, 5);
    w.wavesEnabled = false;
    w.spawnEnemy('pato_pistoleiro', 1);
    invulnerable(w);
    const events = collect(w, 6, aimAtFirstEnemy);
    const kill = events.find((e) => e.type === 'enemyKilled');
    expect(kill).toBeDefined();
    expect(w.score).toBeGreaterThanOrEqual(PATO_PISTOLEIRO.score);
    expect(w.enemies.length).toBe(0);
    expect(w.stats.shotsHit).toBeGreaterThanOrEqual(PATO_PISTOLEIRO.maxHp / 20);
  });
});

describe('World — Galinha Rambo', () => {
  it('gira o cano e solta rajada horizontal, sendo empurrada para trás', () => {
    const w = new World(WORLD_CONFIG, 3);
    w.wavesEnabled = false;
    const g = w.spawnEnemy('galinha_rambo', 1);
    invulnerable(w);
    const events: GameEvent[] = [];
    let xAtBurstStart: number | null = null;
    let facingAtBurst = 0;
    for (let i = 0; i < 8 / SIM_STEP; i++) {
      w.step(passive(w), SIM_STEP);
      for (const ev of w.events) {
        events.push(ev);
        if (ev.type === 'enemyShot' && xAtBurstStart === null) {
          xAtBurstStart = g.x;
          facingAtBurst = g.facing;
        }
      }
      w.events.length = 0;
      if (xAtBurstStart !== null && g.state === 'cooldown') break;
    }
    const shots = events.filter((e): e is Extract<GameEvent, { type: 'enemyShot' }> => e.type === 'enemyShot');
    expect(shots.length).toBe(GALINHA_RAMBO.burstCount);
    expect(events.some((e) => e.type === 'enemyTelegraph')).toBe(true);
    for (const s of shots) {
      const horizontal = Math.min(Math.abs(s.angle), Math.abs(Math.abs(s.angle) - Math.PI));
      expect(horizontal).toBeLessThan(0.1);
    }
    expect(xAtBurstStart).not.toBeNull();
    // Recuo: andou no sentido oposto ao que mira.
    expect((g.x - (xAtBurstStart as number)) * facingAtBurst).toBeLessThan(0);
  });

  it('a rajada passa por baixo de um jogador pulando', () => {
    const w = new World(WORLD_CONFIG, 3);
    w.wavesEnabled = false;
    w.spawnEnemy('galinha_rambo', 1);
    const gunY = WORLD_CONFIG.bounds.floorY - GALINHA_RAMBO.hh + GALINHA_RAMBO.muzzle.y;
    const playerTopWhenStanding = WORLD_CONFIG.bounds.floorY - WORLD_CONFIG.player.hh * 2;
    expect(gunY).toBeGreaterThan(playerTopWhenStanding); // acerta quem fica parado
    expect(gunY).toBeLessThan(WORLD_CONFIG.bounds.floorY - 4);
  });
});

describe('World — jogador', () => {
  it('morre depois de perder toda a vida e para de ser controlável', () => {
    const w = new World(WORLD_CONFIG, 9);
    w.wavesEnabled = false;
    for (let i = 0; i < 4; i++) w.spawnEnemy('pato_pistoleiro', i % 2 ? 1 : -1);
    const events = collect(w, 40, passive);
    const hurts = events.filter((e) => e.type === 'playerHurt');
    expect(hurts.length).toBe(WORLD_CONFIG.player.maxHp);
    expect(events.some((e) => e.type === 'playerDied')).toBe(true);
    expect(w.player.alive).toBe(false);
  });

  it('i-frames impedem dano em sequência', () => {
    const w = new World(WORLD_CONFIG, 2);
    w.wavesEnabled = false;
    w.projectiles.spawn('enemy', w.player.motor.x - 30, w.player.motor.y, 600, 0, 6, 1, false, 0, 2, 'x');
    w.projectiles.spawn('enemy', w.player.motor.x - 40, w.player.motor.y, 600, 0, 6, 1, false, 0, 2, 'x');
    collect(w, 0.2, passive);
    expect(w.player.hp).toBe(WORLD_CONFIG.player.maxHp - 1);
  });

  it('o tiro sai na direção da mira', () => {
    const w = new World(WORLD_CONFIG, 1);
    w.wavesEnabled = false;
    const m = w.player.motor;
    const events = collect(w, SIM_STEP, () => ({
      moveX: 0,
      jumpPressed: false,
      jumpHeld: false,
      fireHeld: true,
      aimX: m.x,
      aimY: m.y - 300,
    }));
    const shot = events.find((e) => e.type === 'shot');
    expect(shot).toBeDefined();
    if (shot?.type === 'shot') expect(shot.angle).toBeCloseTo(-Math.PI / 2, 1);
  });
});

describe('World — ondas e determinismo', () => {
  it('a primeira onda começa sozinha e é limpa ao matar todos', () => {
    const w = new World(WORLD_CONFIG, 77);
    invulnerable(w);
    const events = collect(w, 30, aimAtFirstEnemy);
    expect(events.find((e) => e.type === 'waveStarted')).toMatchObject({ wave: 1 });
    expect(events.find((e) => e.type === 'waveCleared')).toMatchObject({ wave: 1 });
  });

  it('mesma seed + mesmas entradas = mesma run', () => {
    const play = (seed: number) => {
      const w = new World(WORLD_CONFIG, seed);
      invulnerable(w);
      collect(w, 20, aimAtFirstEnemy);
      return { score: w.score, kills: w.stats.kills, x: w.player.motor.x, wave: w.waves.wave };
    };
    expect(play(123)).toEqual(play(123));
  });

  it('aguenta 300+ projéteis simultâneos sem estourar o pool', () => {
    const w = new World(WORLD_CONFIG, 4);
    w.wavesEnabled = false;
    invulnerable(w);
    for (let i = 0; i < 350; i++) {
      w.projectiles.spawn('enemy', 100 + (i % 50) * 15, 50 + Math.floor(i / 50) * 20, 10, 5, 5, 1, false, 0, 5, 'x');
    }
    expect(w.projectiles.activeCount).toBe(350);
    const t0 = performance.now();
    collect(w, 1, passive);
    expect(performance.now() - t0).toBeLessThan(500);
  });
});
