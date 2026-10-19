import type { WeaponDef } from '@/core/combat/weapon';

/** Pistola: precisa e versátil. Começa lenta (1 tiro a cada 0,6 s, 75% menos que antes); as cartas aceleram. */
export const PISTOL: WeaponDef = {
  id: 'pistol',
  name: 'Pistola',
  fireInterval: 0.6,
  pelletsPerShot: 1,
  spreadDeg: 1.8,
  projectileSpeed: 880,
  projectileRadius: 4,
  projectileLifetime: 1.3,
  damage: 10,
  critChance: 0.12,
  critMultiplier: 2,
  knockback: 120,
  barrelLength: 28,
  pierce: 0,
  ricochet: 0,
};

export const WEAPONS = { pistol: PISTOL } as const;
