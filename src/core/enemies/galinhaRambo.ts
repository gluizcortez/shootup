import { DEG_TO_RAD } from '../math/scalar';
import { angleToPlayer, facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, GalinhaDef } from './types';

/**
 * Galinha Rambo (atiradora pesada): desce de jetpack e paira no alto, devagar.
 * O cano gira (telegraph) acompanhando o jogador; no fim do aviso a mira TRAVA
 * e sai uma rajada naquela direção. Cada tiro a empurra para trás no ar.
 * Nunca vem até o jogador.
 */
export function updateGalinha(e: Enemy, def: GalinhaDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.shotCooldown = ctx.rng.range(0.8, 1.4);
      }
      return;

    case 'descend':
      facePlayer(e, ctx);
      e.aimAngle = e.facing > 0 ? 0.4 : Math.PI - 0.4;
      if (updateDescend(e, dt)) {
        e.state = 'hover';
        pickHoverTarget(e, ctx);
      }
      return;

    case 'hover':
      e.shotCooldown = Math.max(0, e.shotCooldown - dt);
      facePlayer(e, ctx);
      steerHover(e, ctx, dt);
      e.aimAngle = e.facing > 0 ? 0.4 : Math.PI - 0.4;
      if (e.shotCooldown <= 0) {
        e.state = 'spinup';
        e.stateTimer = def.spinUpTime;
        ctx.telegraph(e, def.spinUpTime);
      }
      return;

    case 'spinup':
      steerHover(e, ctx, dt, 0.2);
      // Rastreia o jogador até a trava; depois da trava, a mira congela.
      if (e.stateTimer > def.spinUpTime * def.aimLockFraction) {
        facePlayer(e, ctx);
        e.aimAngle = angleToPlayer(e, ctx);
      }
      if (e.stateTimer <= 0) {
        e.state = 'burst';
        e.burstLeft = def.burstCount;
        e.burstTimer = 0;
      }
      return;

    case 'burst': {
      steerHover(e, ctx, dt, 0);
      e.burstTimer -= dt;
      const spread = def.burstSpreadDeg * DEG_TO_RAD;
      while (e.burstTimer <= 0 && e.burstLeft > 0) {
        ctx.fire(e, e.aimAngle + ctx.rng.range(-spread, spread));
        e.vx -= Math.cos(e.aimAngle) * def.recoilImpulse;
        e.vy -= Math.sin(e.aimAngle) * def.recoilImpulse * 0.5;
        e.burstLeft--;
        e.burstTimer += def.burstInterval;
      }
      if (e.burstLeft <= 0) {
        e.state = 'cooldown';
        e.stateTimer = def.cooldown * 0.4;
        e.shotCooldown = def.cooldown;
      }
      return;
    }

    case 'cooldown':
      steerHover(e, ctx, dt, 0.6);
      if (e.stateTimer <= 0) e.state = 'hover';
      return;

    default:
      e.state = 'hover';
  }
}
