import type { Rng } from '../math/rng';
import type { Owned, Rarity, StatClamp, StatKey, Stats, UpgradeDef } from './types';

// maxHp não é inteiro: há meios corações.
const INTEGER_STATS: ReadonlySet<StatKey> = new Set<StatKey>(['pellets', 'pierce', 'ricochet']);

/**
 * Calcula os atributos finais. Ordem fixa (documentada e testada):
 *   1. valor base
 *   2. + soma de todos os `add` (value × stacks)
 *   3. × produto de todos os `mul` (value ^ stacks)
 *   4. limite [min, max] do atributo
 *   5. atributos inteiros arredondados para baixo
 * Somar antes de multiplicar evita que a ordem de escolha das cartas mude o resultado.
 */
export function computeStats(
  base: Stats,
  owned: Owned,
  defs: ReadonlyMap<string, UpgradeDef>,
  clamps: Partial<Record<StatKey, StatClamp>>,
): Stats {
  const add = {} as Record<StatKey, number>;
  const mul = {} as Record<StatKey, number>;
  for (const k of Object.keys(base) as StatKey[]) {
    add[k] = 0;
    mul[k] = 1;
  }
  for (const [id, stacks] of owned) {
    const def = defs.get(id);
    if (!def || stacks <= 0) continue;
    for (const m of def.modifiers) {
      if (m.op === 'add') add[m.stat] += m.value * stacks;
      else mul[m.stat] *= Math.pow(m.value, stacks);
    }
  }
  const out = {} as Stats;
  for (const k of Object.keys(base) as StatKey[]) {
    let v = (base[k] + add[k]) * mul[k];
    const c = clamps[k];
    if (c) v = Math.min(c.max, Math.max(c.min, v));
    out[k] = INTEGER_STATS.has(k) ? Math.floor(v + 1e-9) : v;
  }
  return out;
}

/** A carta pode aparecer numa oferta agora? */
export function isOfferable(def: UpgradeDef, owned: Owned): boolean {
  if ((owned.get(def.id) ?? 0) >= def.maxStacks) return false;
  for (const p of def.prerequisites) if ((owned.get(p) ?? 0) <= 0) return false;
  for (const x of def.exclusions) if ((owned.get(x) ?? 0) > 0) return false;
  return true;
}

/**
 * Sorteia até `count` cartas distintas, com peso por raridade, usando a RNG
 * da run (mesma seed, mesma oferta). Devolve menos se o baralho acabar.
 */
export function rollOffer(
  pool: readonly UpgradeDef[],
  owned: Owned,
  weights: Record<Rarity, number>,
  rng: Rng,
  count: number,
): UpgradeDef[] {
  const candidates = pool.filter((d) => isOfferable(d, owned) && weights[d.rarity] > 0);
  const out: UpgradeDef[] = [];
  while (out.length < count && candidates.length > 0) {
    let total = 0;
    for (const c of candidates) total += weights[c.rarity];
    let r = rng.next() * total;
    let idx = candidates.length - 1;
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[(candidates[i] as UpgradeDef).rarity];
      if (r < 0) {
        idx = i;
        break;
      }
    }
    out.push(candidates[idx] as UpgradeDef);
    candidates.splice(idx, 1);
  }
  return out;
}

/** A habilidade da carta já virou dourada com estes stacks? */
export function isGolden(def: UpgradeDef, stacks: number): boolean {
  return def.effect !== undefined && stacks >= def.effect.goldenAt;
}
