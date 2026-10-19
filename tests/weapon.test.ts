import { describe, expect, it } from 'vitest';
import { createWeaponState, pelletAngles, rollDamage, tickWeapon } from '@/core/combat/weapon';
import { Rng } from '@/core/math/rng';
import { PISTOL } from '@/game/data/weapons';

function shotsOver(seconds: number, dt: number): number {
  const s = createWeaponState(PISTOL);
  let total = 0;
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) total += tickWeapon(s, PISTOL, true, dt);
  return total;
}

describe('weapon', () => {
  it('dispara imediatamente ao apertar o gatilho', () => {
    const s = createWeaponState(PISTOL);
    expect(tickWeapon(s, PISTOL, true, 1 / 120)).toBe(1);
  });

  it('cadência independe do framerate', () => {
    const expected = Math.floor(3 / PISTOL.fireInterval) + 1;
    for (const dt of [1 / 30, 1 / 60, 1 / 120, 1 / 144]) {
      expect(Math.abs(shotsOver(3, dt) - expected)).toBeLessThanOrEqual(1);
    }
  });

  it('não dispara sem gatilho e não acumula disparos guardados', () => {
    const s = createWeaponState(PISTOL);
    for (let i = 0; i < 120; i++) expect(tickWeapon(s, PISTOL, false, 1 / 120)).toBe(0);
    expect(tickWeapon(s, PISTOL, true, 1 / 120)).toBe(1);
    expect(tickWeapon(s, PISTOL, true, 1 / 120)).toBe(0);
  });

  it('spread fica dentro do limite configurado', () => {
    const rng = new Rng(7);
    const out: number[] = [];
    const max = (PISTOL.spreadDeg * Math.PI) / 180;
    for (let i = 0; i < 500; i++) {
      for (const a of pelletAngles(PISTOL, 1, rng, out)) expect(Math.abs(a - 1)).toBeLessThanOrEqual(max);
    }
  });

  it('crítico multiplica o dano', () => {
    const rng = new Rng(1);
    let crits = 0;
    for (let i = 0; i < 2000; i++) {
      const r = rollDamage(PISTOL, rng);
      expect(r.amount).toBe(r.crit ? PISTOL.damage * PISTOL.critMultiplier : PISTOL.damage);
      if (r.crit) crits++;
    }
    expect(crits / 2000).toBeGreaterThan(PISTOL.critChance - 0.04);
    expect(crits / 2000).toBeLessThan(PISTOL.critChance + 0.04);
  });
});
