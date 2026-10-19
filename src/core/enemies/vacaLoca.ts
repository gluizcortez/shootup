import { approach } from '../math/scalar';
import { facePlayer, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, VacaDef } from './types';

/**
 * Vaca Loca (melee): cai do topo, bate o casco (telegraph) e investe em linha
 * reta pelo chão na direção do jogador. Não muda de direção durante a
 * investida: dá para pular por cima ou fugir pelo relevo. Ao bater na parede
 * fica tonta (e leva mais dano) antes de tentar de novo.
 */
export function updateVaca(e: Enemy, def: VacaDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.vy = 200;
      }
      return;

    case 'descend':
      facePlayer(e, ctx);
      if (e.grounded) {
        e.state = 'rest';
        e.stateTimer = def.restTime * 0.6;
      }
      return;

    case 'rest':
      e.vx = approach(e.vx, 0, 1400 * dt);
      facePlayer(e, ctx);
      if (e.stateTimer <= 0 && e.grounded) {
        e.state = 'stomp';
        e.stateTimer = def.stompTime;
        ctx.telegraph(e, def.stompTime);
      }
      return;

    case 'stomp':
      e.vx = approach(e.vx, 0, 1400 * dt);
      facePlayer(e, ctx);
      if (e.stateTimer <= 0) {
        e.state = 'charge';
        e.chargeDir = e.facing;
        e.stateTimer = 6; // segurança: nenhuma investida dura para sempre
      }
      return;

    case 'charge': {
      e.facing = e.chargeDir;
      e.vx = approach(e.vx, e.chargeDir * def.chargeSpeed, def.chargeAccel * dt);
      const b = ctx.bounds;
      const atWall =
        (e.chargeDir < 0 && e.x - def.hw <= b.left + 0.5) || (e.chargeDir > 0 && e.x + def.hw >= b.right - 0.5);
      if (atWall) {
        e.state = 'dizzy';
        e.stateTimer = def.dizzyTime;
        e.vx = -e.chargeDir * 160; // quica para trás
        e.vy = -220;
        e.grounded = false;
        return;
      }
      // Passou do jogador por uma boa distância e não vai bater em parede logo: freia.
      const passed = (ctx.playerX - e.x) * e.chargeDir < -def.overshoot;
      if (passed || e.stateTimer <= 0) {
        e.state = 'rest';
        e.stateTimer = def.restTime;
      }
      return;
    }

    case 'dizzy':
      if (e.grounded) e.vx = approach(e.vx, 0, 900 * dt);
      if (e.stateTimer <= 0) {
        e.state = 'rest';
        e.stateTimer = def.restTime * 0.5;
      }
      return;

    default:
      e.state = 'rest';
  }
}
