import { approach, DEG_TO_RAD } from '../math/scalar';
import { applyFriction, facePlayer, updateEntry } from './enemyPhysics';
import type { Enemy, EnemyContext, GalinhaDef } from './types';

/**
 * Galinha Rambo: mantém distância, gira o cano (telegraph) e solta uma rajada
 * horizontal. Cada tiro a empurra para trás. Dá para pular por cima da rajada.
 */
export function updateGalinha(e: Enemy, def: GalinhaDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;

  switch (e.state) {
    case 'enter':
      if (updateEntry(e, ctx.bounds)) {
        e.state = 'position';
        e.shotCooldown = ctx.rng.range(0.4, 1.0);
      }
      return;

    case 'position': {
      e.shotCooldown = Math.max(0, e.shotCooldown - dt);
      facePlayer(e, ctx);
      const dist = Math.abs(ctx.playerX - e.x);
      let dir = 0;
      if (dist > def.preferredRange + def.rangeTolerance) dir = e.facing;
      else if (dist < def.preferredRange - def.rangeTolerance) dir = -e.facing;
      if (e.grounded) e.vx = approach(e.vx, dir * def.walkSpeed, def.groundFriction * dt);
      if (e.shotCooldown <= 0 && dist < def.preferredRange + def.rangeTolerance * 3) {
        e.state = 'spinup';
        e.stateTimer = def.spinUpTime;
        ctx.telegraph(e, def.spinUpTime);
      }
      return;
    }

    case 'spinup':
      applyFriction(e, dt);
      if (e.stateTimer <= 0) {
        e.state = 'burst';
        e.burstLeft = def.burstCount;
        e.burstTimer = 0;
      }
      return;

    case 'burst':
      applyFriction(e, dt);
      e.burstTimer -= dt;
      while (e.burstTimer <= 0 && e.burstLeft > 0) {
        const spread = def.burstSpreadDeg * DEG_TO_RAD;
        const base = e.facing > 0 ? 0 : Math.PI;
        ctx.fire(e, base + ctx.rng.range(-spread, spread));
        e.vx -= e.facing * def.recoilImpulse;
        e.burstLeft--;
        e.burstTimer += def.burstInterval;
      }
      if (e.burstLeft <= 0) {
        e.state = 'cooldown';
        e.stateTimer = def.cooldown * 0.5;
        e.shotCooldown = def.cooldown;
      }
      return;

    case 'cooldown':
      applyFriction(e, dt);
      if (e.stateTimer <= 0) e.state = 'position';
      return;

    default:
      e.state = 'position';
  }
}
