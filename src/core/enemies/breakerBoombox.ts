import { approach } from '../math/scalar';
import { facePlayer, updateIncoming } from './enemyPhysics';
import type { BreakerDef, Enemy, EnemyContext } from './types';

/**
 * Breakdancer do Boombox (melee): cai do topo e PERSEGUE o jogador andando
 * no ritmo (mais devagar que ele). A cada `spinEvery` agacha (telegraph) e sai
 * de headspin atrás do jogador, corrigindo a direção no giro. Depois do giro
 * fica tonto um instante.
 */
export function updateBreaker(e: Enemy, def: BreakerDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.vy = 220;
      }
      return;

    case 'descend':
      facePlayer(e, ctx);
      if (e.grounded) {
        e.state = 'walk';
        e.stateTimer = def.spinEvery * ctx.rng.range(0.5, 0.8);
      }
      return;

    case 'walk': {
      facePlayer(e, ctx);
      const dx = ctx.playerX - e.x;
      const want = Math.abs(dx) < 6 ? 0 : Math.sign(dx) * def.walkSpeed;
      e.vx = approach(e.vx, want, def.walkAccel * dt);
      if (e.stateTimer <= 0 && e.grounded) {
        e.state = 'crouch';
        e.stateTimer = def.crouchTime;
        ctx.telegraph(e, def.crouchTime);
      }
      return;
    }

    case 'crouch':
      facePlayer(e, ctx);
      e.vx = approach(e.vx, 0, 1600 * dt);
      if (e.stateTimer <= 0) {
        e.state = 'spin';
        e.stateTimer = def.spinTime;
        e.chargeDir = e.facing;
      }
      return;

    case 'spin': {
      // Headspin teleguiado: vira devagar se o jogador passar para o outro lado.
      const dir: 1 | -1 = ctx.playerX >= e.x ? 1 : -1;
      e.chargeDir = dir;
      e.facing = dir;
      e.vx = approach(e.vx, dir * def.spinSpeed, def.spinAccel * dt);
      if (e.stateTimer <= 0) {
        e.state = 'rest';
        e.stateTimer = def.restTime;
      }
      return;
    }

    case 'rest':
      e.vx = approach(e.vx, 0, 900 * dt);
      if (e.stateTimer <= 0) {
        e.state = 'walk';
        e.stateTimer = def.spinEvery * ctx.rng.range(0.85, 1.15);
      }
      return;

    default:
      e.state = 'walk';
  }
}
