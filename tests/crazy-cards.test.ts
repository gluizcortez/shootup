import { describe, expect, it } from 'vitest';
import { World } from '@/core/run/world';
import type { SimInput } from '@/core/run/world';
import type { UpgradeDef } from '@/core/upgrades/types';
import { SIM_STEP } from '@/game/data/arena';
import { UPGRADE_POOL } from '@/game/data/upgrades';
import { WORLD_CONFIG } from '@/game/data/world';

const idle = (w: World): SimInput => ({
  moveX: 0,
  jumpPressed: false,
  jumpHeld: false,
  fireHeld: false,
  aimX: w.player.motor.x + 100,
  aimY: w.player.motor.y - 200,
});

function world(cards: Record<string, number>, seed = 1): World {
  const w = new World(WORLD_CONFIG, seed);
  w.wavesEnabled = false;
  w.upgradesEnabled = false;
  w.player.invuln = 1e9;
  for (const [id, n] of Object.entries(cards)) {
    const def = UPGRADE_POOL.find((c) => c.id === id) as UpgradeDef;
    expect(def).toBeDefined();
    for (let i = 0; i < n; i++) {
      w.offer = [def];
      expect(w.pickUpgrade(id)).toBe(true);
    }
  }
  w.events.length = 0;
  return w;
}

function pato(w: World, x: number, y: number) {
  const e = w.spawnEnemy('pato_pistoleiro', 0.5);
  e.state = 'hover';
  e.stateTimer = 99;
  e.shotCooldown = 99;
  e.x = e.px = x;
  e.y = e.py = y;
  return e;
}

function run(w: World, seconds: number, input?: Partial<SimInput>): void {
  for (let i = 0; i < Math.round(seconds / SIM_STEP); i++) w.step({ ...idle(w), ...input }, SIM_STEP);
}

const active = (w: World, source?: string) =>
  w.projectiles.items.filter((p) => p.active && p.team === 'player' && (!source || p.sourceId === source));

describe('cartas loucas', () => {
  it('há 3 comuns, 3 incomuns, 3 raras e 1 épica novas', () => {
    const ids: Record<string, string[]> = {
      comum: ['cartucho_pirata', 'bala_laque', 'soco_filme_b'],
      incomum: ['bate_volta', 'lado_b', 'trilha_montagem'],
      raro: ['teleguiada', 'bala_cluster', 'camera_lenta'],
      epico: ['globo_discoteca'],
    };
    for (const [rarity, list] of Object.entries(ids)) {
      for (const id of list) expect(UPGRADE_POOL.find((c) => c.id === id)?.rarity).toBe(rarity);
    }
  });

  it('Cartucho Pirata: 3 cartas = +1 bala por tiro', () => {
    expect(world({ cartucho_pirata: 2 }).weapon.pelletsPerShot).toBe(1);
    expect(world({ cartucho_pirata: 3 }).weapon.pelletsPerShot).toBe(2);
  });

  it('Bala com Laquê e Soco de Filme B mexem no tamanho e no empurrão', () => {
    expect(world({ bala_laque: 1 }).weapon.projectileRadius).toBeCloseTo(WORLD_CONFIG.weapon.projectileRadius * 1.12);
    expect(world({ soco_filme_b: 2 }).weapon.knockback).toBeCloseTo(WORLD_CONFIG.weapon.knockback * 1.25 ** 2);
  });

  it('Bala Bate-Volta quica na parede em vez de sumir', () => {
    const w = world({ bate_volta: 1 });
    const b = WORLD_CONFIG.bounds;
    const p = w.projectiles.spawn('player', b.right - 30, 150, 900, 0, 4, 1, false, 0, 1, 'pistol');
    p.wallBounceLeft = w.effective.wallBounce;
    run(w, 0.1);
    expect(p.active).toBe(true);
    expect(p.vx).toBeLessThan(0);
    expect(p.wallBounceLeft).toBe(0);
  });

  it('Lado B: passando de 100% todo tiro sai repetido', () => {
    const w = world({ lado_b: 7 }); // 105%
    run(w, 0.05, { fireHeld: true });
    expect(w.stats.shotsFired).toBe(1);
    expect(active(w, 'pistol').length).toBeGreaterThanOrEqual(2);
  });

  it('Trilha de Montagem acelera com o combo, até o limite', () => {
    const w = world({ trilha_montagem: 1 });
    expect(w.comboHaste()).toBe(0);
    w.combo.count = 10;
    expect(w.comboHaste()).toBeCloseTo(0.2);
    w.combo.count = 500;
    expect(w.comboHaste()).toBeCloseTo(1);
  });

  it('Teleguiada faz a bala curvar até o vilão', () => {
    const w = world({ teleguiada: 2 });
    const e = pato(w, 600, 150);
    const p = w.projectiles.spawn('player', 400, 300, 0, -700, 4, 1, false, 0, 2, 'pistol');
    p.homing = w.effective.homing;
    let hit = false;
    for (let i = 0; i < 120 && !hit; i++) {
      w.step(idle(w), SIM_STEP);
      hit = w.events.some((ev) => ev.type === 'enemyHit' && ev.uid === e.uid);
    }
    expect(hit).toBe(true);
  });

  it('Bala Cluster solta 2 estilhaços com 40% do dano, que não se dividem', () => {
    const w = world({ bala_cluster: 1 });
    const e = pato(w, 400, 200);
    e.hp = 1000;
    const p = w.projectiles.spawn('player', 400, 260, 0, -900, 4, 10, false, 0, 1, 'pistol');
    p.splitCount = w.effective.splitCount;
    run(w, 0.1);
    const shards = active(w, 'fragmento');
    expect(shards).toHaveLength(2);
    expect(shards[0]!.damage).toBeCloseTo(4);
    expect(shards[0]!.splitCount).toBe(0);
  });

  it('Câmera Lenta deixa as balas inimigas mais lentas', () => {
    expect(world({ camera_lenta: 2 }).effective.enemyBulletSpeed).toBeCloseTo(0.85 ** 2);
    expect(world({ camera_lenta: 50 }).effective.enemyBulletSpeed).toBe(0.3);
  });

  it('Globo de Discoteca dispara sozinho; com 5 fica dourado e mais rápido', () => {
    const w = world({ globo_discoteca: 1 });
    run(w, 1.25);
    expect(w.events.filter((e) => e.type === 'discoShot')).toHaveLength(1);
    expect(active(w, 'disco')).toHaveLength(5);
    expect(active(w, 'disco')[0]!.damage).toBeLessThanOrEqual(WORLD_CONFIG.weapon.damage * 0.5 * WORLD_CONFIG.weapon.critMultiplier);

    const g = world({ globo_discoteca: 5 });
    expect(g.disco).toMatchObject({ count: 13, golden: true, interval: 0.6 });
    run(g, 1.25);
    expect(g.events.filter((e) => e.type === 'discoShot')).toHaveLength(2);
  });
});
