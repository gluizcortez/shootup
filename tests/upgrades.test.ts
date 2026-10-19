import { describe, expect, it } from 'vitest';
import { Rng } from '@/core/math/rng';
import { World } from '@/core/run/world';
import type { SimInput } from '@/core/run/world';
import type { Stats, UpgradeDef } from '@/core/upgrades/types';
import { computeStats, isOfferable, rollOffer } from '@/core/upgrades/upgrades';
import { SIM_STEP } from '@/game/data/arena';
import { UPGRADE_POOL, UPGRADES } from '@/game/data/upgrades';
import { WORLD_CONFIG } from '@/game/data/world';

const BASE: Stats = {
  fireInterval: 0.2,
  pellets: 1,
  spreadDeg: 2,
  damage: 10,
  critChance: 0.1,
  critMultiplier: 2,
  projectileSpeed: 800,
  pierce: 0,
  ricochet: 0,
  runSpeed: 300,
  jumpVelocity: 700,
  maxHp: 5,
};

function card(id: string, patch: Partial<UpgradeDef> = {}): UpgradeDef {
  return {
    id,
    name: id,
    description: '',
    rarity: 'comum',
    branch: 'balistica',
    tags: [],
    maxStacks: 3,
    prerequisites: [],
    exclusions: [],
    modifiers: [],
    ...patch,
  };
}

const defsOf = (list: UpgradeDef[]) => new Map(list.map((d) => [d.id, d]));

describe('upgrades — cálculo de atributos', () => {
  it('ordem: base → somas → produtos → limites, independente da ordem das cartas', () => {
    const plus = card('plus', { modifiers: [{ stat: 'damage', op: 'add', value: 1 }] });
    const times = card('times', { modifiers: [{ stat: 'damage', op: 'mul', value: 0.8 }] });
    const defs = defsOf([plus, times]);
    const a = computeStats(BASE, new Map([['plus', 2], ['times', 1]]), defs, {});
    const b = computeStats(BASE, new Map([['times', 1], ['plus', 2]]), defs, {});
    expect(a.damage).toBeCloseTo((10 + 2) * 0.8);
    expect(b.damage).toBeCloseTo(a.damage);
  });

  it('multiplicadores acumulam por stack e respeitam os limites', () => {
    const fast = card('fast', { modifiers: [{ stat: 'fireInterval', op: 'mul', value: 0.5 }] });
    const s = computeStats(BASE, new Map([['fast', 3]]), defsOf([fast]), { fireInterval: { min: 0.05, max: 2 } });
    expect(s.fireInterval).toBeCloseTo(0.05); // 0.2 × 0.125 = 0.025 → limitado a 0.05
  });

  it('atributos inteiros são arredondados para baixo', () => {
    const half = card('half', { modifiers: [{ stat: 'pellets', op: 'add', value: 0.5 }] });
    expect(computeStats(BASE, new Map([['half', 1]]), defsOf([half]), {}).pellets).toBe(1);
    expect(computeStats(BASE, new Map([['half', 2]]), defsOf([half]), {}).pellets).toBe(2);
  });
});

describe('upgrades — oferta', () => {
  it('respeita máximo de stacks, pré-requisitos e exclusões', () => {
    const a = card('a', { maxStacks: 1 });
    const b = card('b', { prerequisites: ['a'] });
    const c = card('c', { exclusions: ['a'] });
    expect(isOfferable(a, new Map())).toBe(true);
    expect(isOfferable(a, new Map([['a', 1]]))).toBe(false);
    expect(isOfferable(b, new Map())).toBe(false);
    expect(isOfferable(b, new Map([['a', 1]]))).toBe(true);
    expect(isOfferable(c, new Map([['a', 1]]))).toBe(false);
  });

  it('sorteia cartas distintas, determinísticas pela seed', () => {
    const roll = (seed: number) => rollOffer(UPGRADE_POOL, new Map(), UPGRADES.weights, new Rng(seed), 3).map((c) => c.id);
    const first = roll(42);
    expect(first).toHaveLength(3);
    expect(new Set(first).size).toBe(3);
    expect(roll(42)).toEqual(first);
  });

  it('devolve menos cartas quando o baralho acaba e ignora raridade com peso 0', () => {
    const pool = [card('x'), card('y', { rarity: 'raro' })];
    const out = rollOffer(pool, new Map(), { comum: 1, incomum: 1, raro: 0, epico: 0 }, new Rng(1), 3);
    expect(out.map((c) => c.id)).toEqual(['x']);
  });

  it('todas as cartas do jogo têm ids únicos e mudam algum atributo', () => {
    expect(new Set(UPGRADE_POOL.map((c) => c.id)).size).toBe(UPGRADE_POOL.length);
    for (const c of UPGRADE_POOL) expect(c.modifiers.length > 0 || c.onPick !== undefined || c.effect !== undefined).toBe(true);
  });
});

const idle = (w: World): SimInput => ({
  moveX: 0,
  jumpPressed: false,
  jumpHeld: false,
  fireHeld: false,
  aimX: w.player.motor.x + 100,
  aimY: w.player.motor.y,
});

function steps(w: World, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / SIM_STEP); i++) w.step(idle(w), SIM_STEP);
}

describe('upgrades — no World', () => {
  it('limpar a onda abre 3 cartas e congela a simulação até a escolha', () => {
    const w = new World(WORLD_CONFIG, 3);
    w.player.invuln = 1e9;
    let guard = 0;
    // Mata tudo que aparece até a primeira onda acabar.
    while (!w.offer && guard++ < 60 / SIM_STEP) {
      for (const e of w.enemies) if (e.state !== 'incoming') e.hp = 0.001;
      w.step({ ...idle(w), fireHeld: true, aimX: w.enemies[0]?.x ?? 0, aimY: w.enemies[0]?.y ?? 0 }, SIM_STEP);
    }
    expect(w.offer).not.toBeNull();
    expect(w.offer).toHaveLength(3);
    expect(w.events.some((e) => e.type === 'upgradeOffer')).toBe(true);
    const t = w.stats.time;
    steps(w, 1);
    expect(w.stats.time).toBe(t); // congelado

    expect(w.pickUpgrade('nao_existe')).toBe(false);
    const id = (w.offer as UpgradeDef[])[0]!.id;
    expect(w.pickUpgrade(id)).toBe(true);
    expect(w.offer).toBeNull();
    expect(w.owned.get(id)).toBe(1);
    steps(w, 0.5);
    expect(w.stats.time).toBeGreaterThan(t);
  });

  function withCard(id: string, seed = 1): World {
    const w = new World(WORLD_CONFIG, seed);
    w.wavesEnabled = false;
    w.player.invuln = 1e9;
    w.offer = [UPGRADE_POOL.find((c) => c.id === id) as UpgradeDef];
    expect(w.pickUpgrade(id)).toBe(true);
    return w;
  }

  it('Gatilho Nervoso deixa a arma mais rápida', () => {
    const w = withCard('gatilho_nervoso');
    expect(w.weapon.fireInterval).toBeCloseTo(WORLD_CONFIG.weapon.fireInterval * 0.99);
    expect(WORLD_CONFIG.weapon.fireInterval).toBe(0.6); // a base nunca é alterada
  });

  it('Tiro Duplo saiu do jogo', () => {
    expect(UPGRADE_POOL.some((c) => c.id === 'tiro_duplo')).toBe(false);
  });

  it('Casco Duro dá meio coração vazio, sem curar', () => {
    const w = new World(WORLD_CONFIG, 1);
    w.player.hp = 2;
    w.offer = [UPGRADE_POOL.find((c) => c.id === 'casco_duro') as UpgradeDef];
    w.pickUpgrade('casco_duro');
    expect(w.player.maxHp).toBe(WORLD_CONFIG.player.maxHp + 0.5);
    expect(w.player.hp).toBe(2);
  });

  it('Casco Regenerado cura 1 coração sem passar do máximo', () => {
    const w = new World(WORLD_CONFIG, 1);
    w.player.hp = 2;
    const def = UPGRADE_POOL.find((c) => c.id === 'casco_regenerado') as UpgradeDef;
    expect(def.rarity).toBe('raro');
    w.offer = [def];
    w.pickUpgrade('casco_regenerado');
    expect(w.player.hp).toBe(3);
    w.player.hp = w.player.maxHp;
    w.offer = [def];
    w.pickUpgrade('casco_regenerado');
    expect(w.player.hp).toBe(w.player.maxHp);
  });

  it('épicas quase nunca aparecem, mas aparecem bem mais depois do chefe', () => {
    const epicShare = (weights: typeof UPGRADES.weights) => {
      let epic = 0;
      let total = 0;
      for (let seed = 1; seed <= 400; seed++) {
        for (const c of rollOffer(UPGRADE_POOL, new Map(), weights, new Rng(seed), 3)) {
          total++;
          if (c.rarity === 'epico') epic++;
        }
      }
      return epic / total;
    };
    const normal = epicShare(UPGRADES.weights);
    const boss = epicShare(UPGRADES.bossWeights!);
    expect(normal).toBeLessThan(0.03);
    expect(boss).toBeGreaterThan(normal * 5);
  });

  function hoveringPatos(w: World, xs: number[], y: number) {
    return xs.map((x) => {
      const e = w.spawnEnemy('pato_pistoleiro', 0.5);
      e.state = 'hover';
      e.stateTimer = 99;
      e.shotCooldown = 99;
      e.x = e.px = x;
      e.y = e.py = y;
      return e;
    });
  }

  it('Bala Viajante atravessa um inimigo e acerta o de trás', () => {
    const w = withCard('bala_viajante');
    const [a, b] = hoveringPatos(w, [400, 470], 200);
    const p = w.projectiles.spawn('player', 330, 200, 900, 0, 4, 10, false, 0, 1, 'pistol');
    p.pierceLeft = w.weapon.pierce;
    const hits: number[] = [];
    for (let i = 0; i < 30; i++) {
      w.step(idle(w), SIM_STEP);
      for (const ev of w.events) if (ev.type === 'enemyHit') hits.push(ev.uid);
      w.events.length = 0;
    }
    expect(hits).toEqual([a!.uid, b!.uid]);
  });

  it('Sinuca Mortal: a bala quica no inimigo atingido para um lado qualquer, com metade do dano', () => {
    const w = withCard('sinuca_mortal');
    const [a] = hoveringPatos(w, [400], 160);
    const p = w.projectiles.spawn('player', 400, 300, 0, -900, 4, 10, false, 0, 1, 'pistol');
    p.ricochetLeft = w.weapon.ricochet;
    let ricochets = 0;
    for (let i = 0; i < 30 && ricochets === 0; i++) {
      w.step(idle(w), SIM_STEP);
      for (const ev of w.events) if (ev.type === 'ricochet') ricochets++;
      w.events.length = 0;
    }
    expect(ricochets).toBe(1);
    expect(p.active).toBe(true);
    expect(p.damage).toBe(5);
    expect(p.lastHitUid).toBe(a!.uid);
  });

  function hitOnce(w: World, e: { x: number; y: number }): void {
    w.projectiles.spawn('player', e.x, e.y + 40, 0, -900, 4, 1, false, 0, 1, 'pistol');
    for (let i = 0; i < 10; i++) w.step(idle(w), SIM_STEP);
  }

  function stack(w: World, id: string, n: number): void {
    const def = UPGRADE_POOL.find((c) => c.id === id) as UpgradeDef;
    for (let i = 0; i < n; i++) {
      w.offer = [def];
      w.pickUpgrade(id);
    }
  }

  it('Explosivo: abatido solta 2 balas com 50% do dano; mais cartas, mais balas; com 5, dourada e 100%', () => {
    const w = withCard('explosivo');
    const [a] = hoveringPatos(w, [400], 200);
    a!.hp = 1;
    w.events.length = 0;
    hitOnce(w, a!);
    const boom = w.events.find((e) => e.type === 'enemyExploded');
    expect(boom).toMatchObject({ count: 2, golden: false });
    const shards = w.projectiles.items.filter((p) => p.active && p.sourceId === 'explosivo');
    expect(shards).toHaveLength(2);
    expect(shards[0]!.damage).toBeCloseTo(w.weapon.damage * 0.5);

    stack(w, 'explosivo', 4);
    const [b] = hoveringPatos(w, [600], 200);
    b!.hp = 1;
    w.events.length = 0;
    hitOnce(w, b!);
    expect(w.events.find((e) => e.type === 'enemyExploded')).toMatchObject({ count: 6, golden: true });
    const gold = w.projectiles.items.filter((p) => p.active && p.sourceId === 'explosivo_dourado');
    expect(gold[0]!.damage).toBeCloseTo(w.weapon.damage);
  });

  it('Vampiresco: sangra 1 por segundo por carta; com 5, dourada e tick 2× mais rápido', () => {
    const w = withCard('vampiresco');
    const [a] = hoveringPatos(w, [400], 200);
    a!.hp = 100;
    hitOnce(w, a!);
    const after = a!.hp;
    w.events.length = 0;
    steps(w, 2.05);
    expect(after - a!.hp).toBe(2);
    expect(w.events.filter((e) => e.type === 'enemyBled')).toHaveLength(2);

    stack(w, 'vampiresco', 4);
    const [b] = hoveringPatos(w, [600], 200);
    b!.hp = 100;
    hitOnce(w, b!);
    const hp0 = b!.hp;
    steps(w, 2.05);
    expect(hp0 - b!.hp).toBe(5 * 4); // 5 de dano por tick, tick a cada 0,5 s
  });
});
