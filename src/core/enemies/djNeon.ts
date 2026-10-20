import { DEG_TO_RAD } from '../math/scalar';
import { facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import type { DjDef, Enemy, EnemyContext } from './types';

/**
 * DJ Neon (atirador): paira com as caixas de som. Anuncia o "drop" (telegraph)
 * e solta leques de notas em semicírculo para baixo, em `beats` batidas
 * defasadas meio passo (a segunda cobre os buracos da primeira). Nunca desce.
 */
export function updateDj(e: Enemy, def: DjDef, ctx: EnemyContext, dt: number): void {
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
      e.aimAngle = Math.PI / 2;
      if (e.shotCooldown <= 0) {
        e.state = 'aim';
        e.stateTimer = def.aimTime;
        ctx.telegraph(e, def.aimTime);
        ctx.shout(e, def.shout);
      }
      return;

    case 'aim':
      steerHover(e, ctx, dt, 0.1);
      if (e.stateTimer <= 0) {
        e.state = 'burst';
        e.burstLeft = def.beats;
        e.burstTimer = 0;
      }
      return;

    case 'burst':
      steerHover(e, ctx, dt, 0);
      e.burstTimer -= dt;
      while (e.burstTimer <= 0 && e.burstLeft > 0) {
        const beat = def.beats - e.burstLeft;
        const from = def.ringFromDeg * DEG_TO_RAD;
        const to = def.ringToDeg * DEG_TO_RAD;
        const step = (to - from) / Math.max(1, def.ringCount - 1);
        const offset = beat % 2 === 1 ? step / 2 : 0;
        for (let i = 0; i < def.ringCount; i++) ctx.fire(e, from + offset + i * step);
        e.vy -= 30;
        e.burstLeft--;
        e.burstTimer += def.beatGap;
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
