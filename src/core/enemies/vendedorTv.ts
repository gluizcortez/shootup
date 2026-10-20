import { angleToPlayer, facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, VendedorDef } from './types';

/**
 * Vendedor de Infomercial (suporte): paira com um telefone gigante e atira
 * caixas de produto devagar. A cada `callEvery` grita o bordão (telegraph,
 * telefone tocando) e chama um capanga pelo telefone, que cai do topo.
 * Não chama se já houver `summonMax` capangas vivos. Nunca desce.
 */
export function updateVendedor(e: Enemy, def: VendedorDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.shotCooldown = ctx.rng.range(1.0, 1.6);
        e.altTimer = def.callEvery * ctx.rng.range(0.4, 0.6);
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

    case 'hover': {
      facePlayer(e, ctx);
      steerHover(e, ctx, dt);
      e.aimAngle = e.facing > 0 ? 0.8 : Math.PI - 0.8;
      e.shotCooldown -= dt;
      e.altTimer -= dt;
      const helpers = ctx.enemies.filter((o) => o.alive && o.def.id === def.summonKind).length;
      if (e.altTimer <= 0 && helpers < def.summonMax) {
        e.state = 'buff';
        e.stateTimer = def.callTime;
        ctx.telegraph(e, def.callTime);
        ctx.shout(e, def.shout);
      } else if (e.shotCooldown <= 0) {
        e.state = 'aim';
        e.stateTimer = def.aimTime;
        ctx.telegraph(e, def.aimTime);
      }
      return;
    }

    case 'aim':
      facePlayer(e, ctx);
      steerHover(e, ctx, dt, 0.2);
      e.aimAngle = angleToPlayer(e, ctx);
      if (e.stateTimer <= 0) {
        ctx.fire(e, e.aimAngle);
        e.state = 'recover';
        e.stateTimer = def.recoverTime;
        e.shotCooldown = def.shotCooldown * ctx.rng.range(0.85, 1.2);
      }
      return;

    case 'buff':
      // Telefone erguido: "LIGUE JÁ!". No fim do aviso, o capanga é chamado.
      steerHover(e, ctx, dt, 0.2);
      e.aimAngle = -Math.PI / 2;
      if (e.stateTimer <= 0) {
        const b = ctx.bounds;
        ctx.summon(def.summonKind, (e.x - b.left) / (b.right - b.left));
        e.altTimer = def.callEvery * ctx.rng.range(0.9, 1.1);
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
