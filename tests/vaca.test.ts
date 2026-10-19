import { describe, expect, it } from 'vitest';
import type { GameEvent } from '@/core/run/events';
import { World } from '@/core/run/world';
import type { SimInput } from '@/core/run/world';
import { SIM_STEP } from '@/game/data/arena';
import { VACA_LOCA } from '@/game/data/enemies';
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

function freshWorld(seed = 5): World {
  const w = new World(WORLD_CONFIG, seed);
  w.wavesEnabled = false;
  w.player.invuln = 1e9;
  return w;
}

describe('Vaca Loca (melee)', () => {
  it('é corpo a corpo: cai do topo e pousa no chão, seguindo o relevo', () => {
    expect(VACA_LOCA.role).toBe('melee');
    const w = freshWorld();
    const e = w.spawnEnemy('vaca_loca', 0.7);
    expect(e.y + e.def.hh).toBeLessThan(0);
    const events = run(w, VACA_LOCA.warnTime + 1.2);
    expect(events.some((ev) => ev.type === 'enemyLanded' && ev.uid === e.uid)).toBe(true);
    expect(e.grounded).toBe(true);
    expect(e.y + e.def.hh).toBeCloseTo(w.terrain.groundUnder(e.x, e.def.hw * 0.6), 0);
  });

  it('bate o casco (aviso) antes de investir, e investe na direção do jogador', () => {
    const w = freshWorld();
    const e = w.spawnEnemy('vaca_loca', 0.85);
    let telegraphAt = -1;
    let chargeAt = -1;
    let dir = 0;
    const events = run(w, 4, (ww) => {
      if (telegraphAt < 0 && e.state === 'stomp') telegraphAt = ww.stats.time;
      if (chargeAt < 0 && e.state === 'charge') {
        chargeAt = ww.stats.time;
        dir = e.chargeDir;
      }
    });
    expect(events.some((ev) => ev.type === 'enemyTelegraph' && ev.uid === e.uid)).toBe(true);
    expect(telegraphAt).toBeGreaterThan(0);
    expect(chargeAt - telegraphAt).toBeGreaterThanOrEqual(VACA_LOCA.stompTime - 0.02);
    expect(dir).toBe(-1); // jogador está no centro, à esquerda dela
    expect(events.some((ev) => ev.type === 'enemyCharge')).toBe(true);
  });

  it('não muda de direção no meio da investida (dá para pular por cima)', () => {
    const w = freshWorld();
    const e = w.spawnEnemy('vaca_loca', 0.85);
    let charged = false;
    let turnedMidCharge = false;
    run(w, 4, (ww) => {
      if (e.state !== 'charge') return;
      charged = true;
      ww.player.motor.x = 900; // jogador "troca de lado" por cima dela
      if (e.chargeDir !== -1 || e.vx > 0) turnedMidCharge = true;
    });
    expect(charged).toBe(true);
    expect(turnedMidCharge).toBe(false);
  });

  it('bate na parede, fica tonta e leva dano extra', () => {
    const w = freshWorld();
    w.player.motor.x = 120; // perto da parede esquerda
    const e = w.spawnEnemy('vaca_loca', 0.6);
    let stunned = false;
    run(w, 6, (ww) => {
      ww.player.motor.x = 120;
      if (e.state === 'dizzy') stunned = true;
    });
    expect(stunned).toBe(true);

    // Tonta: tiro causa dano × dizzyDamageMult.
    const w2 = freshWorld();
    w2.player.motor.x = 120;
    const v = w2.spawnEnemy('vaca_loca', 0.6);
    run(w2, 6, () => {
      w2.player.motor.x = 120;
    });
    let guard = 0;
    while (v.state !== 'dizzy' && guard++ < 2000) run(w2, SIM_STEP);
    expect(v.state).toBe('dizzy');
    const hp0 = v.hp;
    w2.projectiles.spawn('player', v.x, v.y - 60, 0, 600, 4, 10, false, 0, 1, 'pistol');
    const hits = run(w2, 0.2).filter((ev) => ev.type === 'enemyHit');
    expect(hits[0]).toMatchObject({ damage: 10 * VACA_LOCA.dizzyDamageMult });
    expect(v.hp).toBeCloseTo(hp0 - 10 * VACA_LOCA.dizzyDamageMult);
  });

  it('causa dano por contato (é o único tipo que encosta no jogador)', () => {
    const w = new World(WORLD_CONFIG, 8);
    w.wavesEnabled = false;
    w.spawnEnemy('vaca_loca', 0.8);
    const events = run(w, 5);
    expect(events.some((ev) => ev.type === 'playerHurt')).toBe(true);
    expect(w.player.hp).toBeLessThan(WORLD_CONFIG.player.maxHp);
  });

  it('o tiro não levanta a vaca do chão', () => {
    const w = freshWorld();
    const e = w.spawnEnemy('vaca_loca', 0.5);
    run(w, VACA_LOCA.warnTime + 1.2);
    expect(e.grounded).toBe(true);
    w.projectiles.spawn('player', e.x - 80, e.y + 10, 880, -300, 4, 10, false, 2000, 1, 'pistol');
    run(w, 0.15);
    expect(e.grounded).toBe(true);
  });
});
