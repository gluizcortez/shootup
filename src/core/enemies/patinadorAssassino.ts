import { approach, clamp, DEG_TO_RAD } from '../math/scalar';
import { angleToPlayer, facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, PatinadorDef } from './types';

/**
 * Patinador Assassino (atirador): patina no ar de patins a jato, dando
 * arrancadas curtas no alto. Ataque "drive-by": agacha (telegraph), escolhe o
 * lado e atravessa por cima do jogador numa linha reta horizontal, soltando
 * tiros mirados durante a passada. Nunca desce até o jogador.
 */
export function updatePatinador(e: Enemy, def: PatinadorDef, ctx: EnemyContext, dt: number): void {
  e.shotCooldown = Math.max(0, e.shotCooldown - dt);
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
      e.aimAngle = Math.PI / 2;
      if (updateDescend(e, dt)) {
        e.state = 'hover';
        pickHoverTarget(e, ctx);
      }
      return;

    case 'hover':
      facePlayer(e, ctx);
      steerHover(e, ctx, dt);
      e.aimAngle = e.facing > 0 ? 0.9 : Math.PI - 0.9;
      if (e.shotCooldown <= 0) {
        e.state = 'crouch';
        e.stateTimer = def.crouchTime;
        ctx.telegraph(e, def.crouchTime);
      }
      return;

    case 'crouch': {
      // Freia e se agacha nos patins; decide o lado da passada no fim.
      e.vx = approach(e.vx, 0, 900 * dt);
      holdAltitude(e, dt);
      facePlayer(e, ctx);
      e.aimAngle = angleToPlayer(e, ctx);
      if (e.stateTimer <= 0) {
        const b = ctx.bounds;
        const dx = ctx.playerX - e.x;
        let dir: 1 | -1 = dx >= 0 ? 1 : -1;
        // Jogador logo embaixo: passa para o lado com mais pista.
        if (Math.abs(dx) < 40) dir = e.x - b.left > b.right - e.x ? -1 : 1;
        e.chargeDir = dir;
        e.facing = dir;
        e.targetX = clamp(ctx.playerX + dir * def.dashOvershoot, b.left + def.hw + 10, b.right - def.hw - 10);
        e.state = 'dash';
        e.stateTimer = 3; // segurança: nenhuma passada dura para sempre
        e.burstLeft = def.dashShots;
        e.burstTimer = def.dashFireInterval * 0.6;
      }
      return;
    }

    case 'dash': {
      const dir = e.chargeDir;
      e.facing = dir;
      e.vx = approach(e.vx, dir * def.dashSpeed, def.dashAccel * dt);
      holdAltitude(e, dt);
      e.aimAngle = angleToPlayer(e, ctx);
      e.burstTimer -= dt;
      const spread = def.dashSpreadDeg * DEG_TO_RAD;
      while (e.burstTimer <= 0 && e.burstLeft > 0) {
        ctx.fire(e, e.aimAngle + ctx.rng.range(-spread, spread));
        e.burstLeft--;
        e.burstTimer += def.dashFireInterval;
      }
      const b = ctx.bounds;
      const atWall = (dir < 0 && e.x - def.hw <= b.left + 12) || (dir > 0 && e.x + def.hw >= b.right - 12);
      if ((e.targetX - e.x) * dir <= 0 || atWall || e.stateTimer <= 0) {
        e.state = 'recover';
        e.stateTimer = def.recoverTime;
        e.shotCooldown = def.attackCooldown * ctx.rng.range(0.85, 1.2);
        pickHoverTarget(e, ctx);
      }
      return;
    }

    case 'recover':
      steerHover(e, ctx, dt, 0.5);
      if (e.stateTimer <= 0) e.state = 'hover';
      return;

    default:
      e.state = 'hover';
  }
}

/** Mantém a altitude escolhida, sem o balanço da patrulha (passada reta). */
function holdAltitude(e: Enemy, dt: number): void {
  e.vy = approach(e.vy, clamp((e.hoverY - e.y) * 5, -200, 200), 1200 * dt);
}
