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
    fireHeld: !!e && e.state !== 'incoming',
    aimX: e ? e.x : 0,
    aimY: e ? e.y : 0,
  };
}

function invulnerable(w: World): void {
  w.player.invuln = 1e9;
}

describe('World — entrada pelo topo', () => {
  it('anuncia no topo, espera o aviso parado e depois desce até a altitude de patrulha', () => {
    const w = new World(WORLD_CONFIG, 21);
    w.wavesEnabled = false;
    invulnerable(w);
    const e = w.spawnEnemy('galinha_rambo', 0.5);
    expect(e.y + e.def.hh).toBeLessThan(WORLD_CONFIG.bounds.ceilingY);
    expect(w.events.some((ev) => ev.type === 'enemyIncoming')).toBe(true);
    const y0 = e.y;
    collect(w, GALINHA_RAMBO.warnTime * 0.9, passive);
    expect(e.y).toBe(y0);
    collect(w, 3, passive);
    expect(e.state).not.toBe('descend');
    expect(e.y).toBeGreaterThanOrEqual(GALINHA_RAMBO.hoverMinY - 20);
  });

  it('não pode ser atingido durante o aviso', () => {
    const w = new World(WORLD_CONFIG, 1);
    w.wavesEnabled = false;
    const e = w.spawnEnemy('pato_pistoleiro', 0.5);
    w.projectiles.spawn('player', e.x, e.y + 30, 0, -2000, 4, 999, false, 0, 1, 'pistol');
    w.step(passive(w), SIM_STEP);
    expect(e.hp).toBe(PATO_PISTOLEIRO.maxHp);
  });
});

describe('World — atiradores ficam no alto (Seraph-like)', () => {
  // O jogador corre de um lado para o outro e pula, tentando "puxar" os inimigos.
  const restless = (w: World): SimInput => {
    const t = w.stats.time;
    return {
      moveX: Math.sin(t * 0.9) > 0 ? 1 : -1,
      jumpPressed: Math.floor(t * 2) % 3 === 0,
      jumpHeld: true,
      fireHeld: false,
      aimX: w.player.motor.x,
      aimY: 0,
    };
  };

  for (const kind of ['pato_pistoleiro', 'galinha_rambo', 'pombo_mafioso', 'porco_executivo', 'don_pombone'] as const) {
    it(`${kind} nunca desce até o jogador nem encosta nele`, () => {
      const w = new World(WORLD_CONFIG, 99);
      w.wavesEnabled = false;
      invulnerable(w);
      const def = WORLD_CONFIG.enemies[kind];
      if (def.role !== 'ranged') throw new Error('esperado atirador');
      const enemies = [w.spawnEnemy(kind, 0.2), w.spawnEnemy(kind, 0.5), w.spawnEnemy(kind, 0.8)];
      const playerTop = WORLD_CONFIG.bounds.floorY - WORLD_CONFIG.player.hh * 2;
      let maxY = -Infinity;
      for (let i = 0; i < 30 / SIM_STEP; i++) {
        w.step(restless(w), SIM_STEP);
        w.events.length = 0;
        for (const e of enemies) if (e.state !== 'incoming' && e.state !== 'descend') maxY = Math.max(maxY, e.y + e.def.hh);
      }
      expect(maxY).toBeLessThanOrEqual(def.hoverMaxY + 12 + def.hh);
      expect(maxY).toBeLessThan(playerTop - 120);
      expect(w.stats.damageTaken).toBe(0); // invulnerável aqui; dano só viria de contato, que não existe para atiradores
    });
  }

  it('atiradores não causam dano por contato', () => {
    expect(PATO_PISTOLEIRO.role).toBe('ranged');
    expect(GALINHA_RAMBO.role).toBe('ranged');
  });
});

describe('World — Pato Pistoleiro', () => {
  it('sempre faz a pose dramática antes de atirar, e atira para baixo', () => {
    const w = new World(WORLD_CONFIG, 11);
    w.wavesEnabled = false;
    w.spawnEnemy('pato_pistoleiro', 0.85);
    invulnerable(w);
    const events = collect(w, 10, passive);
    const shots = events.filter((e): e is Extract<GameEvent, { type: 'enemyShot' }> => e.type === 'enemyShot');
    expect(shots.length).toBeGreaterThan(1);
    let telegraphs = 0;
    let shotsSeen = 0;
    for (const ev of events) {
      if (ev.type === 'enemyTelegraph') telegraphs++;
      if (ev.type === 'enemyShot') {
        shotsSeen++;
        expect(telegraphs).toBeGreaterThanOrEqual(shotsSeen);
      }
    }
    for (const s of shots) expect(Math.sin(s.angle)).toBeGreaterThan(0.2); // para baixo
  });

  it('a pistola derruba o pato lá em cima e gera pontos', () => {
    const w = new World(WORLD_CONFIG, 5);
    w.wavesEnabled = false;
    w.spawnEnemy('pato_pistoleiro', 0.7);
    invulnerable(w);
    const events = collect(w, 8, aimAtFirstEnemy);
    expect(events.find((e) => e.type === 'enemyKilled')).toBeDefined();
    expect(w.score).toBeGreaterThanOrEqual(PATO_PISTOLEIRO.score);
    expect(w.enemies.length).toBe(0);
  });
});

describe('World — Galinha Rambo', () => {
  it('gira o cano, trava a mira e solta a rajada naquela direção, sendo empurrada para trás', () => {
    const w = new World(WORLD_CONFIG, 3);
    w.wavesEnabled = false;
    const g = w.spawnEnemy('galinha_rambo', 0.9);
    invulnerable(w);
    const events: GameEvent[] = [];
    let lockedAngle: number | null = null;
    let xAtBurst: number | null = null;
    let xAfter: number | null = null;
    for (let i = 0; i < 10 / SIM_STEP; i++) {
      w.step(passive(w), SIM_STEP);
      for (const ev of w.events) {
        events.push(ev);
        if (ev.type === 'enemyShot' && xAtBurst === null) {
          xAtBurst = g.x;
          lockedAngle = g.aimAngle;
        }
      }
      w.events.length = 0;
      if (xAtBurst !== null && g.state === 'cooldown') {
        xAfter = g.x;
        break;
      }
    }
    const shots = events.filter((e): e is Extract<GameEvent, { type: 'enemyShot' }> => e.type === 'enemyShot');
    expect(shots.length).toBe(GALINHA_RAMBO.burstCount);
    expect(events.some((e) => e.type === 'enemyTelegraph')).toBe(true);
    const spread = (GALINHA_RAMBO.burstSpreadDeg * Math.PI) / 180;
    for (const s of shots) expect(Math.abs(s.angle - (lockedAngle as number))).toBeLessThanOrEqual(spread + 1e-9);
    // Mira para baixo, na direção do jogador.
    expect(Math.sin(lockedAngle as number)).toBeGreaterThan(0.2);
    // Recuo: deslocou-se no sentido oposto ao horizontal do disparo.
    const dirX = Math.cos(lockedAngle as number);
    expect(((xAfter as number) - (xAtBurst as number)) * dirX).toBeLessThan(0);
  });
});

describe('World — jogador', () => {
  it('morre depois de perder toda a vida e para de ser controlável', () => {
    const w = new World(WORLD_CONFIG, 9);
    w.wavesEnabled = false;
    for (let i = 0; i < 4; i++) w.spawnEnemy('pato_pistoleiro', 0.1 + i * 0.25);
    const events = collect(w, 60, passive);
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
    w.upgradesEnabled = false;
    invulnerable(w);
    const events = collect(w, 30, aimAtFirstEnemy);
    expect(events.find((e) => e.type === 'waveStarted')).toMatchObject({ wave: 1 });
    expect(events.find((e) => e.type === 'waveCleared')).toMatchObject({ wave: 1 });
  });

  it('ao limpar a onda, os projéteis inimigos ainda no ar somem', () => {
    const w = new World(WORLD_CONFIG, 77);
    w.upgradesEnabled = false;
    invulnerable(w);
    const n = Math.round(30 / SIM_STEP);
    let cleared = false;
    for (let i = 0; i < n && !cleared; i++) {
      // Bala inimiga parada lá no alto, garantindo que há algo no ar na hora da limpeza.
      w.projectiles.spawn('enemy', 600, 120, 0, 0, 4, 1, false, 0, 100, 'teste');
      w.step(aimAtFirstEnemy(w), SIM_STEP);
      cleared = w.events.some((e) => e.type === 'waveCleared');
      w.events.length = 0;
    }
    expect(cleared).toBe(true);
    expect(w.projectiles.items.some((p) => p.active && p.team === 'enemy')).toBe(false);
  });

  it('mesma seed + mesmas entradas = mesma run', () => {
    const play = (seed: number) => {
      const w = new World(WORLD_CONFIG, seed);
      w.upgradesEnabled = false;
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
