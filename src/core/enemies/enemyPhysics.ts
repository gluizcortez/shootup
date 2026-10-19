import { approach } from '../math/scalar';
import type { ArenaBounds } from '../physics/playerMotor';
import type { Enemy, EnemyContext, EnemyDef } from './types';

/**
 * Cria o animal acima da tela, na coluna `xNorm` (0..1 da largura da arena).
 * Ele fica parado em `incoming` durante o aviso e depois desce.
 */
export function createEnemy(uid: number, def: EnemyDef, xNorm: number, bounds: ArenaBounds): Enemy {
  const t = Math.min(1, Math.max(0, xNorm));
  const x = bounds.left + def.hw + 8 + t * (bounds.right - bounds.left - 2 * (def.hw + 8));
  const y = bounds.ceilingY - def.hh - 24;
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
    grounded: false,
    facing: x < (bounds.left + bounds.right) / 2 ? 1 : -1,
    state: 'incoming',
    stateTimer: def.warnTime,
    hopTimer: 0,
    shotCooldown: 0.6,
    burstLeft: 0,
    burstTimer: 0,
    airborneEntry: true,
    alive: true,
  };
}

/** Aviso no topo: o animal ainda não existe na arena. */
export function updateIncoming(e: Enemy): boolean {
  e.vx = 0;
  e.vy = 0;
  return e.stateTimer <= 0;
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

/**
 * Integra gravidade, chão e paredes. Durante o aviso não se move; durante a
 * descida a queda é limitada por `descentMaxSpeed`. Devolve a velocidade de
 * impacto se pousou neste passo (0 caso contrário).
 */
export function integrateEnemy(e: Enemy, bounds: ArenaBounds, dt: number): number {
  if (e.state === 'incoming') return 0;
  if (!e.grounded) {
    e.vy += e.def.gravity * dt;
    if (e.airborneEntry && e.vy > e.def.descentMaxSpeed) e.vy = e.def.descentMaxSpeed;
  }
  e.x += e.vx * dt;
  e.y += e.vy * dt;
  if (e.x - e.def.hw < bounds.left) {
    e.x = bounds.left + e.def.hw;
    if (e.vx < 0) e.vx = 0;
  } else if (e.x + e.def.hw > bounds.right) {
    e.x = bounds.right - e.def.hw;
    if (e.vx > 0) e.vx = 0;
  }
  const floor = bounds.floorY - e.def.hh;
  let impact = 0;
  if (e.y >= floor) {
    e.y = floor;
    if (!e.grounded) impact = Math.max(1, e.vy);
    if (e.vy > 0) e.vy = 0;
    e.grounded = true;
    e.airborneEntry = false;
  } else {
    e.grounded = false;
  }
  return impact;
}
