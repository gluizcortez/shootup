import { DEG_TO_RAD } from '../math/scalar';
import { angleToPlayer, facePlayer, pickHoverTarget, steerHover, updateDescend, updateIncoming } from './enemyPhysics';
import { POMBONE_ATTACKS } from './types';
import type { Enemy, EnemyContext, PomboneDef } from './types';

const SUMMON = 0;
const VSHOT = 1;
const SWEEP = 2;

function pombosAlive(ctx: EnemyContext): number {
  let n = 0;
  for (const o of ctx.enemies) if (o.alive && o.def.id === 'pombo_mafioso') n++;
  return n;
}

/** Escolhe o próximo ataque: nunca repete o anterior e não convoca se já há pombos demais. */
function nextAttack(e: Enemy, def: PomboneDef, ctx: EnemyContext): number {
  let a = (e.attack + 1 + (ctx.rng.chance(0.4) ? 1 : 0)) % POMBONE_ATTACKS.length;
  if (a === e.attack) a = (a + 1) % POMBONE_ATTACKS.length;
  if (a === SUMMON && pombosAlive(ctx) >= def.summonMaxPombos) a = VSHOT;
  return a;
}

function fireV(e: Enemy, def: PomboneDef, ctx: EnemyContext): void {
  const aim = angleToPlayer(e, ctx);
  e.aimAngle = aim;
  const half = Math.floor(def.vCount / 2);
  for (let i = -half; i <= half; i++) {
    ctx.fire(e, aim + i * def.vSpreadDeg * DEG_TO_RAD, 1 - Math.abs(i) * def.vSpeedFalloff);
  }
}

/**
 * Don Pombone, chefe da onda 10. Paira no alto e anuncia cada ataque batendo
 * as asas (telegraph): convocar esquadrilha, rajada em V (flecha que aponta
 * para o jogador) e varredura de balas. Na segunda fase o aviso encurta e o
 * V sai duas vezes. Nunca desce até o jogador.
 */
export function updatePombone(e: Enemy, def: PomboneDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;
  if (!e.enraged && e.state !== 'incoming' && e.hp <= def.maxHp * def.phase2At) {
    e.enraged = true;
    ctx.enraged(e);
  }

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.shotCooldown = 1.6;
        e.attack = SWEEP; // o primeiro ataque nunca é a varredura
      }
      return;

    case 'descend':
      facePlayer(e, ctx);
      if (updateDescend(e, dt)) {
        e.state = 'hover';
        pickHoverTarget(e, ctx);
      }
      return;

    case 'hover':
      facePlayer(e, ctx);
      steerHover(e, ctx, dt);
      e.aimAngle = e.facing > 0 ? 0.5 : Math.PI - 0.5;
      e.shotCooldown -= dt;
      if (e.shotCooldown <= 0) {
        e.attack = nextAttack(e, def, ctx);
        const t = e.enraged ? def.telegraphTimePhase2 : def.telegraphTime;
        e.state = 'aim';
        e.stateTimer = t;
        ctx.telegraph(e, t);
      }
      return;

    case 'aim':
      steerHover(e, ctx, dt, 0.1);
      facePlayer(e, ctx);
      e.aimAngle = angleToPlayer(e, ctx);
      if (e.stateTimer > 0) return;
      if (e.attack === SUMMON) {
        const side = ctx.playerX > (ctx.bounds.left + ctx.bounds.right) / 2 ? 0.15 : 0.85;
        ctx.summon('pombo_mafioso', side + ctx.rng.range(-0.08, 0.08));
        e.state = 'recover';
        e.stateTimer = 0.6;
      } else if (e.attack === VSHOT) {
        e.state = 'burst';
        e.burstLeft = e.enraged ? 2 : 1;
        e.burstTimer = 0;
      } else {
        // Varredura começa do lado oposto ao jogador e vem na direção dele.
        e.state = 'burst';
        e.burstLeft = def.sweepCount;
        e.burstTimer = 0;
        e.chargeDir = ctx.playerX < e.x ? 1 : -1;
      }
      return;

    case 'burst': {
      steerHover(e, ctx, dt, 0);
      e.burstTimer -= dt;
      if (e.attack === VSHOT) {
        while (e.burstTimer <= 0 && e.burstLeft > 0) {
          fireV(e, def, ctx);
          e.burstLeft--;
          e.burstTimer += 0.45;
        }
      } else {
        const interval = def.sweepTime / def.sweepCount;
        while (e.burstTimer <= 0 && e.burstLeft > 0) {
          const k = 1 - (e.burstLeft - 1) / Math.max(1, def.sweepCount - 1);
          // chargeDir = 1: da direita (from) para a esquerda (to); -1: o contrário.
          const fromDeg = e.chargeDir > 0 ? def.sweepFromDeg : def.sweepToDeg;
          const toDeg = e.chargeDir > 0 ? def.sweepToDeg : def.sweepFromDeg;
          e.aimAngle = (fromDeg + (toDeg - fromDeg) * k) * DEG_TO_RAD;
          ctx.fire(e, e.aimAngle);
          e.burstLeft--;
          e.burstTimer += interval;
        }
      }
      if (e.burstLeft <= 0) {
        e.state = 'recover';
        e.stateTimer = 0.5;
      }
      return;
    }

    case 'recover':
      steerHover(e, ctx, dt, 0.6);
      if (e.stateTimer <= 0) {
        e.state = 'hover';
        e.shotCooldown = e.enraged ? def.cooldownPhase2 : def.cooldown;
      }
      return;

    default:
      e.state = 'hover';
  }
}
