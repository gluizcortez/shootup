import { angleToPlayer, facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, PatoDef } from './types';

/**
 * Pato Pistoleiro (atirador): desce do topo pendurado em balões de festa e
 * patrulha no alto, sempre deslocado do jogador. Antes de cada tiro único e
 * mirado faz pose dramática (telegraph). Nunca vem até o jogador.
 */
export function updatePato(e: Enemy, def: PatoDef, ctx: EnemyContext, dt: number): void {
  e.shotCooldown = Math.max(0, e.shotCooldown - dt);
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.shotCooldown = ctx.rng.range(0.6, 1.2);
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
      e.aimAngle = e.facing > 0 ? 1.1 : Math.PI - 1.1; // pistolinha relaxada, apontando para baixo
      if (e.shotCooldown <= 0) {
        e.state = 'aim';
        e.stateTimer = def.aimTime;
        ctx.telegraph(e, def.aimTime);
      }
      return;

    case 'aim':
      // Para no ar e acompanha o jogador com a pistola durante a pose.
      facePlayer(e, ctx);
      steerHover(e, ctx, dt, 0.15);
      e.aimAngle = angleToPlayer(e, ctx);
      if (e.stateTimer <= 0) {
        ctx.fire(e, e.aimAngle);
        e.vx -= Math.cos(e.aimAngle) * 50; // coice cômico
        e.vy -= Math.sin(e.aimAngle) * 50;
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
