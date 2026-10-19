import { DEG_TO_RAD } from '../math/scalar';
import { angleToPlayer, facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, PorcoDef } from './types';

/** Aliados vivos (exceto `e`) dentro do raio, do mais próximo ao mais longe. */
function alliesInRange(e: Enemy, def: PorcoDef, ctx: EnemyContext): Enemy[] {
  const r2 = def.buffRadius * def.buffRadius;
  return ctx.enemies
    .filter((o) => o !== e && o.alive && o.state !== 'incoming' && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= r2)
    .sort((a, b) => (a.x - e.x) ** 2 + (a.y - e.y) ** 2 - ((b.x - e.x) ** 2 + (b.y - e.y) ** 2));
}

/**
 * Porco Executivo (suporte): paira no alto, joga leques de moedas e convoca
 * "REUNIÃO URGENTE": depois do aviso, dá escudo aos aliados mais próximos.
 * Nunca vem até o jogador.
 */
export function updatePorco(e: Enemy, def: PorcoDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.shotCooldown = ctx.rng.range(1.0, 1.6);
        e.altTimer = def.buffEvery * ctx.rng.range(0.35, 0.6);
      }
      return;

    case 'descend':
      facePlayer(e, ctx);
      e.aimAngle = e.facing > 0 ? 0.8 : Math.PI - 0.8;
      if (updateDescend(e, dt)) {
        e.state = 'hover';
        pickHoverTarget(e, ctx);
      }
      return;

    case 'hover':
      facePlayer(e, ctx);
      steerHover(e, ctx, dt);
      e.aimAngle = e.facing > 0 ? 0.8 : Math.PI - 0.8;
      e.shotCooldown -= dt;
      e.altTimer -= dt;
      if (e.altTimer <= 0 && alliesInRange(e, def, ctx).length > 0) {
        e.state = 'buff';
        e.stateTimer = def.buffTime;
        ctx.telegraph(e, def.buffTime);
      } else if (e.shotCooldown <= 0) {
        e.state = 'aim';
        e.stateTimer = def.aimTime;
        ctx.telegraph(e, def.aimTime);
      }
      return;

    case 'aim':
      facePlayer(e, ctx);
      steerHover(e, ctx, dt, 0.2);
      e.aimAngle = angleToPlayer(e, ctx);
      if (e.stateTimer <= 0) {
        const step = def.coinSpreadDeg * DEG_TO_RAD;
        const mid = (def.coinCount - 1) / 2;
        for (let i = 0; i < def.coinCount; i++) ctx.fire(e, e.aimAngle + (i - mid) * step);
        e.vy -= 40;
        e.state = 'recover';
        e.stateTimer = def.recoverTime;
        e.shotCooldown = def.shotCooldown * ctx.rng.range(0.85, 1.2);
      }
      return;

    case 'buff':
      // Celular erguido gritando "REUNIÃO URGENTE!".
      steerHover(e, ctx, dt, 0.2);
      e.aimAngle = -Math.PI / 2;
      if (e.stateTimer <= 0) {
        const targets = alliesInRange(e, def, ctx).slice(0, def.buffTargets);
        for (const t of targets) t.shield = Math.min(def.shieldMax, t.shield + def.shieldAmount);
        if (targets.length > 0) ctx.buffed(e, targets);
        e.altTimer = def.buffEvery * ctx.rng.range(0.9, 1.1);
        e.state = 'recover';
        e.stateTimer = def.recoverTime;
      }
      return;

    case 'recover':
      steerHover(e, ctx, dt, 0.6);
      if (e.stateTimer <= 0) e.state = 'hover';
      return;

    default:
      e.state = 'hover';
  }
}
