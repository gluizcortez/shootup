import { approach, clamp } from '../math/scalar';
import { facePlayer, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, LutadorDef } from './types';

/**
 * Lutador Mamute (melee): no chão provoca a plateia; agacha (telegraph), salta
 * em arco mirando onde o jogador está e cai de barriga. O impacto solta duas
 * ondas de choque rasteiras, uma para cada lado: o jeito de escapar é pular.
 */
export function updateLutador(e: Enemy, def: LutadorDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.vy = 240;
      }
      return;

    case 'descend':
      if (e.grounded) slam(e, def, ctx);
      return;

    case 'rest':
      // Provocação: mão na orelha "não estou ouvindo!".
      facePlayer(e, ctx);
      e.vx = approach(e.vx, 0, 1400 * dt);
      if (e.stateTimer <= 0 && e.grounded) {
        e.state = 'crouch';
        e.stateTimer = def.crouchTime;
        ctx.telegraph(e, def.crouchTime);
      }
      return;

    case 'crouch':
      facePlayer(e, ctx);
      e.vx = approach(e.vx, 0, 1400 * dt);
      if (e.stateTimer <= 0) {
        // Tempo de voo de um salto balístico: sobe e desce até a mesma altura.
        const flight = (2 * def.jumpSpeed) / def.gravity;
        e.vx = clamp((ctx.playerX - e.x) / flight, -def.maxLeapVx, def.maxLeapVx);
        e.vy = -def.jumpSpeed;
        e.grounded = false;
        e.state = 'leap';
        e.stateTimer = flight + 2; // segurança
      }
      return;

    case 'leap':
      if (e.grounded && e.vy >= 0) slam(e, def, ctx);
      else if (e.stateTimer <= 0) {
        e.state = 'rest';
        e.stateTimer = def.tauntTime;
      }
      return;

    default:
      e.state = 'rest';
  }
}

/** Cai de barriga: onda de choque rasteira para os dois lados. */
function slam(e: Enemy, def: LutadorDef, ctx: EnemyContext): void {
  e.vx = 0;
  const feet = e.y + def.hh;
  for (const dir of [-1, 1] as const) {
    const x = e.x + dir * (def.hw + def.shockRadius);
    const y = Math.min(feet, ctx.groundAt(x)) - def.shockHeight;
    ctx.spawnBullet(e, x, y, dir * def.shockSpeed, 0, def.shockRadius, def.shockDamage, def.shockLifetime);
  }
  ctx.shout(e, def.shout);
  e.state = 'rest';
  e.stateTimer = def.tauntTime * ctx.rng.range(0.85, 1.15);
}
