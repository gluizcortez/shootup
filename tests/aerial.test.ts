import { describe, expect, it } from 'vitest';
import type { GameEvent } from '@/core/run/events';
import { createWaveState, beginWave } from '@/core/run/waves';
import { Rng } from '@/core/math/rng';
import { World } from '@/core/run/world';
import type { SimInput } from '@/core/run/world';
import { SIM_STEP } from '@/game/data/arena';
import { DON_POMBONE, POMBO_MAFIOSO, PORCO_EXECUTIVO } from '@/game/data/enemies';
import { WORLD_CONFIG } from '@/game/data/world';

const idle = (w: World): SimInput => ({
  moveX: 0,
  jumpPressed: false,
  jumpHeld: false,
  fireHeld: false,
  aimX: w.player.motor.x + 100,
  aimY: w.player.motor.y,
});

function run(w: World, seconds: number, onStep?: (w: World, evs: GameEvent[]) => void): GameEvent[] {
  const all: GameEvent[] = [];
  for (let i = 0; i < Math.round(seconds / SIM_STEP); i++) {
    w.step(idle(w), SIM_STEP);
    onStep?.(w, w.events);
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

describe('Pombo Mafioso', () => {
  it('entra em esquadrilha de 3 com o mesmo bando', () => {
    const w = freshWorld();
    w.spawnEnemy('pombo_mafioso', 0.5);
    expect(w.enemies).toHaveLength(POMBO_MAFIOSO.squadSize);
    const squads = new Set(w.enemies.map((e) => e.squadId));
    expect(squads.size).toBe(1);
    expect([...squads][0]).toBeGreaterThan(0);
  });

  it('o bando assobia e atira junto (salva sincronizada)', () => {
    const w = freshWorld();
    w.spawnEnemy('pombo_mafioso', 0.5);
    const aimStarts: number[] = [];
    let step = 0;
    run(w, 8, (ww) => {
      step++;
      for (const e of ww.enemies) if (e.state === 'aim' && e.stateTimer > POMBO_MAFIOSO.aimTime - SIM_STEP * 1.5) aimStarts.push(step);
    });
    // Primeira salva: os 3 entram no aviso no mesmo passo.
    expect(aimStarts.length).toBeGreaterThanOrEqual(3);
    expect(aimStarts.slice(0, 3).every((s) => s === aimStarts[0])).toBe(true);
  });

  it('se o líder cai, outro assume e o bando continua atirando', () => {
    const w = freshWorld();
    const leader = w.spawnEnemy('pombo_mafioso', 0.5);
    run(w, 2);
    leader.hp = 1;
    w.projectiles.spawn('player', leader.x, leader.y + 40, 0, -900, 4, 10, false, 0, 1, 'pistol');
    run(w, 0.2);
    expect(w.enemies.includes(leader)).toBe(false);
    const shots = run(w, 8).filter((ev) => ev.type === 'enemyShot');
    expect(shots.length).toBeGreaterThan(0);
  });
});

describe('Porco Executivo', () => {
  it('convoca reunião (aviso) e dá escudo aos aliados próximos', () => {
    const w = freshWorld();
    w.spawnEnemy('porco_executivo', 0.5);
    w.spawnEnemy('pato_pistoleiro', 0.55);
    const events = run(w, 10);
    const buff = events.find((e) => e.type === 'enemyBuffed');
    expect(buff).toBeDefined();
    const tele = events.findIndex((e) => e.type === 'enemyTelegraph' && e.state === 'buff');
    expect(tele).toBeGreaterThanOrEqual(0);
    expect(tele).toBeLessThan(events.indexOf(buff as GameEvent));
    const pato = w.enemies.find((e) => e.def.id === 'pato_pistoleiro');
    expect(pato?.shield ?? 0).toBeGreaterThan(0);
    expect(pato?.shield ?? 0).toBeLessThanOrEqual(PORCO_EXECUTIVO.shieldMax);
  });

  it('o escudo absorve dano antes da vida e avisa quando quebra', () => {
    const w = freshWorld();
    const pato = w.spawnEnemy('pato_pistoleiro', 0.5);
    run(w, 3);
    pato.shield = 15;
    const hp0 = pato.hp;
    w.projectiles.spawn('player', pato.x, pato.y + 60, 0, -900, 4, 10, false, 0, 1, 'pistol');
    run(w, 0.15);
    expect(pato.hp).toBe(hp0);
    expect(pato.shield).toBe(5);
    w.projectiles.spawn('player', pato.x, pato.y + 60, 0, -900, 4, 10, false, 0, 1, 'pistol');
    const evs = run(w, 0.15);
    expect(evs.some((e) => e.type === 'shieldBroken')).toBe(true);
    expect(pato.hp).toBe(hp0 - 5);
  });

  it('joga um leque de moedas', () => {
    const w = freshWorld();
    w.spawnEnemy('porco_executivo', 0.5);
    const shots = run(w, 4).filter((e) => e.type === 'enemyShot');
    expect(shots.length).toBeGreaterThanOrEqual(PORCO_EXECUTIVO.coinCount);
  });
});

describe('Don Pombone (chefe)', () => {
  it('é o chefe da onda 10', () => {
    const s = createWaveState(WORLD_CONFIG.waves);
    s.wave = 9;
    beginWave(s, WORLD_CONFIG.waves, new Rng(1));
    expect(s.queue.some((q) => q.kind === 'don_pombone')).toBe(true);
    expect(DON_POMBONE.boss).toBe(true);
  });

  it('anuncia todo ataque batendo as asas antes de atirar ou convocar', () => {
    const w = freshWorld();
    const boss = w.spawnEnemy('don_pombone', 0.5);
    const events = run(w, 25);
    const own = events.filter((e) => 'uid' in e && e.uid === boss.uid);
    const tele = own.filter((e) => e.type === 'enemyTelegraph').length;
    expect(tele).toBeGreaterThanOrEqual(5);
    // Cada rajada é precedida por um aviso.
    let armed = false;
    for (const e of own) {
      if (e.type === 'enemyTelegraph') armed = true;
      if (e.type === 'enemyShot') expect(armed).toBe(true);
      if (e.type === 'enemyIncoming' || e.type === 'enemyTelegraph') continue;
    }
  });

  it('rajada em V: várias balas no mesmo instante, as de fora mais lentas', () => {
    const w = freshWorld(3);
    const boss = w.spawnEnemy('don_pombone', 0.5);
    let volley: number[] | null = null;
    run(w, 25, (ww) => {
      if (volley) return;
      const shots = ww.events.filter((e) => e.type === 'enemyShot' && e.uid === boss.uid);
      if (shots.length === DON_POMBONE.vCount) {
        volley = ww.projectiles.items.filter((p) => p.active && p.sourceId === 'don_pombone' && p.life > DON_POMBONE.bulletLifetime - SIM_STEP * 1.5).map((p) => Math.hypot(p.vx, p.vy));
      }
    });
    expect(volley).not.toBeNull();
    const speeds = (volley as unknown as number[]).sort((a, b) => b - a);
    expect(speeds[0]).toBeCloseTo(DON_POMBONE.bulletSpeed);
    expect(speeds[speeds.length - 1]).toBeLessThan(DON_POMBONE.bulletSpeed * 0.8);
  });

  it('convoca esquadrilhas de pombos', () => {
    const w = freshWorld(5);
    w.spawnEnemy('don_pombone', 0.5);
    run(w, 30);
    expect(w.enemies.some((e) => e.def.id === 'pombo_mafioso')).toBe(true);
  });

  it('fica bravo abaixo da metade da vida', () => {
    const w = freshWorld();
    const boss = w.spawnEnemy('don_pombone', 0.5);
    run(w, 4);
    boss.hp = DON_POMBONE.maxHp * 0.45;
    const evs = run(w, 0.1);
    expect(evs.some((e) => e.type === 'bossEnraged')).toBe(true);
    expect(boss.enraged).toBe(true);
  });
});
