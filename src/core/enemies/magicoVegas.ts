import { DEG_TO_RAD } from '../math/scalar';
import { angleToPlayer, facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, MagicoDef } from './types';

/**
 * Mágico de Las Vegas (atirador): some numa nuvem de fumaça e reaparece em
 * outro ponto do alto; faz floreio com a capa (telegraph, mira segue o
 * jogador) e arremessa um leque de cartas. Nunca desce até o jogador.
 */
export function updateMagico(e: Enemy, def: MagicoDef, ctx: EnemyContext, dt: number): void {
  e.shotCooldown = Math.max(0, e.shotCooldown - dt);
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.shotCooldown = ctx.rng.range(1.0, 1.6);
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
      e.aimAngle = e.facing > 0 ? 1 : Math.PI - 1;
      if (e.shotCooldown <= 0) {
        e.state = 'vanish';
        e.stateTimer = def.vanishTime;
        ctx.poof(e, e.x, e.y);
      }
      return;

    case 'vanish':
      e.vx = 0;
      e.vy = 0;
      if (e.stateTimer <= 0) {
        // Reaparece noutro ponto da patrulha, já com o floreio de aviso.
        pickHoverTarget(e, ctx);
        e.x = e.px = e.targetX;
        e.y = e.py = e.hoverY;
        ctx.poof(e, e.x, e.y);
        ctx.shout(e, def.shout);
        facePlayer(e, ctx);
        e.state = 'aim';
        e.stateTimer = def.aimTime;
        ctx.telegraph(e, def.aimTime);
      }
      return;

    case 'aim':
      facePlayer(e, ctx);
      steerHover(e, ctx, dt, 0.05);
      e.aimAngle = angleToPlayer(e, ctx);
      if (e.stateTimer <= 0) {
        const step = def.cardSpreadDeg * DEG_TO_RAD;
        const mid = (def.cardCount - 1) / 2;
        for (let i = 0; i < def.cardCount; i++) ctx.fire(e, e.aimAngle + (i - mid) * step);
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
