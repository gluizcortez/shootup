import { approach } from '../math/scalar';
import type { ArenaBounds } from '../physics/playerMotor';
import type { Enemy, EnemyContext, EnemyDef } from './types';

export function createEnemy(uid: number, def: EnemyDef, side: -1 | 1, bounds: ArenaBounds): Enemy {
  const x = side < 0 ? bounds.left - def.hw - 20 : bounds.right + def.hw + 20;
  const y = bounds.floorY - def.hh;
  return {
    uid,
    def,
    x,
    y,
    px: x,
    py: y,
    vx: 0,
    vy: 0,
    hp: def.maxHp,
    grounded: true,
    facing: side < 0 ? 1 : -1,
    state: 'enter',
    stateTimer: 0,
    hopTimer: 0,
    shotCooldown: 0.6,
    burstLeft: 0,
    burstTimer: 0,
    alive: true,
  };
}

/** Entrada pela lateral: anda até estar inteiro dentro da arena. */
export function updateEntry(e: Enemy, bounds: ArenaBounds): boolean {
  e.vx = e.facing * e.def.entrySpeed;
  const inside = e.x - e.def.hw > bounds.left + 8 && e.x + e.def.hw < bounds.right - 8;
  return inside;
}

export function applyFriction(e: Enemy, dt: number): void {
  if (e.grounded) e.vx = approach(e.vx, 0, e.def.groundFriction * dt);
}

export function facePlayer(e: Enemy, ctx: EnemyContext): void {
  e.facing = ctx.playerX >= e.x ? 1 : -1;
}

export function muzzlePosition(e: Enemy): { x: number; y: number } {
  return { x: e.x + e.def.muzzle.x * e.facing, y: e.y + e.def.muzzle.y };
}

/** Integra gravidade, chão e paredes. Durante a entrada as paredes não valem. */
export function integrateEnemy(e: Enemy, bounds: ArenaBounds, dt: number): void {
  if (!e.grounded) e.vy += e.def.gravity * dt;
  e.x += e.vx * dt;
  e.y += e.vy * dt;
  const floor = bounds.floorY - e.def.hh;
  if (e.y >= floor) {
    e.y = floor;
    if (e.vy > 0) e.vy = 0;
    e.grounded = true;
  } else {
    e.grounded = false;
  }
  if (e.state !== 'enter') {
    if (e.x - e.def.hw < bounds.left) {
      e.x = bounds.left + e.def.hw;
      if (e.vx < 0) e.vx = 0;
    } else if (e.x + e.def.hw > bounds.right) {
      e.x = bounds.right - e.def.hw;
      if (e.vx > 0) e.vx = 0;
    }
  }
}
