import { angleToPlayer, facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, PolicialDef } from './types';

/**
 * Policial de Miami Corrupto (atirador): paira no alto de mochila-sirene.
 * Aponta a pistola com mira laser (telegraph) que segue o jogador; no fim do
 * aviso o laser TRAVA e saem dois tiros rápidos naquela linha ("double tap").
 * Nunca vem até o jogador.
 */
export function updatePolicial(e: Enemy, def: PolicialDef, ctx: EnemyContext, dt: number): void {
  e.shotCooldown = Math.max(0, e.shotCooldown - dt);
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.shotCooldown = ctx.rng.range(0.9, 1.5);
      }
      return;

    case 'descend':
      facePlayer(e, ctx);
      e.aimAngle = Math.PI / 2;
      if (updateDescend(e, dt)) {
        e.state = 'hover';
        pickHoverTarget(e, ctx);
      }
      return;

    case 'hover':
      facePlayer(e, ctx);
      steerHover(e, ctx, dt);
      e.aimAngle = e.facing > 0 ? 1.25 : Math.PI - 1.25; // pistola de lado, displicente
      if (e.shotCooldown <= 0) {
        e.state = 'aim';
        e.stateTimer = def.aimTime;
        ctx.telegraph(e, def.aimTime);
      }
      return;

    case 'aim':
      steerHover(e, ctx, dt, 0.1);
      // O laser segue o jogador até travar; depois congela.
      if (e.stateTimer > def.aimTime * def.aimLockFraction) {
        facePlayer(e, ctx);
        e.aimAngle = angleToPlayer(e, ctx);
      }
      if (e.stateTimer <= 0) {
        e.state = 'burst';
        e.burstLeft = def.shots;
        e.burstTimer = 0;
      }
      return;

    case 'burst':
      steerHover(e, ctx, dt, 0);
      e.burstTimer -= dt;
      while (e.burstTimer <= 0 && e.burstLeft > 0) {
        ctx.fire(e, e.aimAngle);
        e.vx -= Math.cos(e.aimAngle) * 40;
        e.burstLeft--;
        e.burstTimer += def.shotGap;
      }
      if (e.burstLeft <= 0) {
        e.state = 'recover';
        e.stateTimer = def.recoverTime;
        e.shotCooldown = def.shotCooldown * ctx.rng.range(0.85, 1.2);
      }
      return;

    case 'recover':
      steerHover(e, ctx, dt, 0.5);
      if (e.stateTimer <= 0) e.state = 'hover';
      return;

    default:
      e.state = 'hover';
  }
}
