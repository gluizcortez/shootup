import { DEG_TO_RAD } from '../math/scalar';
import type { Rng } from '../math/rng';

/** Definição data-driven de uma arma de fogo do jogador. */
export interface WeaponDef {
  id: string;
  name: string;
  /** Segundos entre disparos com o gatilho segurado. */
  fireInterval: number;
  pelletsPerShot: number;
  /** Desvio máximo (graus) para cada lado da mira. */
  spreadDeg: number;
  projectileSpeed: number;
  projectileRadius: number;
  projectileLifetime: number;
  damage: number;
  critChance: number;
  critMultiplier: number;
  /** Empurrão (px/s) aplicado ao inimigo atingido. */
  knockback: number;
  /** Distância do ombro até a boca do cano. */
  barrelLength: number;
}

export interface WeaponState {
  defId: string;
  cooldown: number;
  shotsFired: number;
}

export function createWeaponState(def: WeaponDef): WeaponState {
  return { defId: def.id, cooldown: 0, shotsFired: 0 };
}

/**
 * Avança o cooldown e devolve quantos disparos acontecem neste passo.
 * O resto do cooldown é preservado entre passos, então a cadência é
 * independente do framerate e do tamanho do passo.
 */
export function tickWeapon(state: WeaponState, def: WeaponDef, triggerHeld: boolean, dt: number): number {
  state.cooldown -= dt;
  let shots = 0;
  if (triggerHeld) {
    while (state.cooldown <= 0 && shots < 4) {
      shots++;
      state.cooldown += def.fireInterval;
    }
  }
  if (state.cooldown < 0) state.cooldown = 0;
  state.shotsFired += shots;
  return shots;
}

/** Ângulo de cada projétil de um disparo, com spread determinístico pela seed. */
export function pelletAngles(def: WeaponDef, aimAngle: number, rng: Rng, out: number[]): number[] {
  out.length = 0;
  const spread = def.spreadDeg * DEG_TO_RAD;
  for (let i = 0; i < def.pelletsPerShot; i++) {
    out.push(aimAngle + rng.range(-spread, spread));
  }
  return out;
}

export interface DamageRoll {
  amount: number;
  crit: boolean;
}

export function rollDamage(def: WeaponDef, rng: Rng): DamageRoll {
  const crit = rng.chance(def.critChance);
  return { amount: crit ? def.damage * def.critMultiplier : def.damage, crit };
}
