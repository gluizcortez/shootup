import { approach, clamp, DEG_TO_RAD } from '../math/scalar';
import { angleToPlayer, facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, PomboDef } from './types';

/** Líder atual da esquadrilha: o membro vivo com a menor posição na formação. */
export function squadLeader(e: Enemy, ctx: EnemyContext): Enemy {
  if (e.squadId === 0) return e;
  let best = e;
  for (const o of ctx.enemies) {
    if (o.alive && o.squadId === e.squadId && o.state !== 'incoming' && o.squadSlot < best.squadSlot) best = o;
  }
  return best;
}

function slotOffset(def: PomboDef, slot: number): { x: number; y: number } {
  return def.formation[slot % def.formation.length] ?? { x: 0, y: 0 };
}

/** Líder patrulha; os outros seguram a posição na formação V em relação a ele. */
function fly(e: Enemy, def: PomboDef, ctx: EnemyContext, leader: Enemy, dt: number, scale: number): void {
  if (leader === e) {
    steerHover(e, ctx, dt, scale);
    return;
  }
  const mine = slotOffset(def, e.squadSlot);
  const lead = slotOffset(def, leader.squadSlot);
  const tx = clamp(leader.x + mine.x - lead.x, ctx.bounds.left + def.hw, ctx.bounds.right - def.hw);
  const ty = clamp(leader.y + mine.y - lead.y, def.hoverMinY - 30, def.hoverMaxY);
  const max = def.flySpeed * 1.6;
  e.vx = approach(e.vx, clamp((tx - e.x) * 6, -max, max), 1400 * dt);
  e.vy = clamp((ty - e.y) * 6, -220, 220);
}

/**
 * Pombo Mafioso (atirador em bando): esquadrilha em V que muda de direção
 * junto. O líder decide a salva; todo o bando assobia (telegraph) e dispara
 * rajadas curtas ao mesmo tempo. Nunca desce até o jogador.
 */
export function updatePombo(e: Enemy, def: PomboDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;
  const leader = squadLeader(e, ctx);

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.shotCooldown = ctx.rng.range(1.0, 1.6);
      }
      return;

    case 'descend':
      facePlayer(e, ctx);
      e.aimAngle = e.facing > 0 ? 0.6 : Math.PI - 0.6;
      if (updateDescend(e, dt)) {
        e.state = 'hover';
        if (leader === e) pickHoverTarget(e, ctx);
      }
      return;

    case 'hover':
      facePlayer(e, ctx);
      fly(e, def, ctx, leader, dt, 1);
      e.aimAngle = e.facing > 0 ? 0.6 : Math.PI - 0.6;
      if (leader === e) {
        e.shotCooldown -= dt;
        if (e.shotCooldown <= 0) {
          // Salva sincronizada: todo o bando que já está patrulhando entra no aviso junto.
          for (const o of ctx.enemies) {
            if (o.alive && (o === e || (e.squadId !== 0 && o.squadId === e.squadId)) && (o.state === 'hover' || o.state === 'recover')) {
              o.state = 'aim';
              o.stateTimer = def.aimTime;
              ctx.telegraph(o, def.aimTime);
            }
          }
          e.shotCooldown = def.volleyCooldown * ctx.rng.range(0.85, 1.15);
        }
      }
      return;

    case 'aim':
      facePlayer(e, ctx);
      fly(e, def, ctx, leader, dt, 0.3);
      e.aimAngle = angleToPlayer(e, ctx);
      if (e.stateTimer <= 0) {
        e.state = 'burst';
        e.burstLeft = def.volleyCount;
        e.burstTimer = 0;
      }
      return;

    case 'burst': {
      fly(e, def, ctx, leader, dt, 0.3);
      e.burstTimer -= dt;
      while (e.burstTimer <= 0 && e.burstLeft > 0) {
        ctx.fire(e, e.aimAngle + ctx.rng.range(-3, 3) * DEG_TO_RAD);
        e.vx -= Math.cos(e.aimAngle) * 25;
        e.burstLeft--;
        e.burstTimer += def.volleyInterval;
      }
      if (e.burstLeft <= 0) {
        e.state = 'recover';
        e.stateTimer = def.recoverTime;
      }
      return;
    }

    case 'recover':
      fly(e, def, ctx, leader, dt, 0.7);
      if (e.stateTimer <= 0) e.state = 'hover';
      return;

    default:
      e.state = 'hover';
  }
}
