import { applyFriction, facePlayer, muzzlePosition, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, PatoDef } from './types';

/**
 * Pato Pistoleiro: desce do topo de paraquedas, balançando e atirando lá de cima.
 * Ao pousar, aproxima em saltinhos. Antes de cada tiro único e mirado faz
 * pose dramática (telegraph).
 */
export function updatePato(e: Enemy, def: PatoDef, ctx: EnemyContext, dt: number): void {
  e.shotCooldown = Math.max(0, e.shotCooldown - dt);
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.stateTimer = 0;
        e.vy = def.descentMaxSpeed;
        e.shotCooldown = ctx.rng.range(0.5, 1.1);
      }
      return;

    case 'descend':
      facePlayer(e, ctx);
      if (e.grounded) {
        e.state = 'approach';
        e.hopTimer = ctx.rng.range(0.15, 0.35);
        return;
      }
      // Balança no paraquedas (stateTimer decresce: usamos como relógio).
      e.vx = Math.sin(-e.stateTimer * 2.4 + e.uid) * def.swaySpeed;
      if (e.shotCooldown <= 0 && e.y > ctx.bounds.ceilingY + 50) {
        e.state = 'aim';
        e.stateTimer = def.aimTime;
        e.vx = 0;
        ctx.telegraph(e, def.aimTime);
      }
      return;

    case 'approach': {
      const dx = ctx.playerX - e.x;
      const dist = Math.abs(dx);
      if (!e.grounded) return; // mantém o impulso do salto
      applyFriction(e, dt);
      facePlayer(e, ctx);
      if (dist >= def.minRange && dist <= def.maxRange && e.shotCooldown <= 0) {
        e.state = 'aim';
        e.stateTimer = def.aimTime;
        e.vx = 0;
        ctx.telegraph(e, def.aimTime);
        return;
      }
      e.hopTimer -= dt;
      if (e.hopTimer <= 0) {
        let dir: number = e.facing;
        if (dist < def.minRange) dir = -e.facing;
        else if (dist <= def.maxRange) dir = ctx.rng.chance(0.5) ? 1 : -1;
        e.vx = dir * def.hopSpeedX * ctx.rng.range(0.85, 1.15);
        e.vy = -def.hopSpeedY * ctx.rng.range(0.9, 1.1);
        e.grounded = false;
        e.hopTimer = def.hopPause * ctx.rng.range(0.8, 1.25);
      }
      return;
    }

    case 'aim':
      applyFriction(e, dt);
      if (!e.grounded) e.vx *= 0.9;
      facePlayer(e, ctx);
      if (e.stateTimer <= 0) {
        const m = muzzlePosition(e);
        ctx.fire(e, Math.atan2(ctx.playerY - m.y, ctx.playerX - m.x));
        if (e.grounded) e.vx = -e.facing * 60; // coice cômico da pistolinha
        e.state = 'recover';
        e.stateTimer = def.recoverTime;
        e.shotCooldown = def.shotCooldown * ctx.rng.range(0.85, 1.2);
      }
      return;

    case 'recover':
      applyFriction(e, dt);
      if (e.stateTimer <= 0) {
        if (e.airborneEntry && !e.grounded) {
          e.state = 'descend';
          e.stateTimer = 0;
        } else {
          e.state = 'approach';
          e.hopTimer = 0.1;
        }
      }
      return;

    default:
      e.state = 'approach';
  }
}
