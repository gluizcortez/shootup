import { approach } from '../math/scalar';
import { facePlayer, updateIncoming } from './enemyPhysics';
import type { Enemy, EnemyContext, MarombaDef } from './types';

/**
 * Maromba Miami Vice (melee): cai do topo e, ao pousar, fica parado para
 * sempre mostrando os muques (troca de pose a cada `poseTime`). Não persegue
 * nem ataca; o perigo é encostar nele (dano de contato) ou estar embaixo
 * quando ele cai. `attack` guarda o índice da pose para o visual.
 */
export function updateMaromba(e: Enemy, def: MarombaDef, ctx: EnemyContext, dt: number): void {
  e.stateTimer -= dt;

  switch (e.state) {
    case 'incoming':
      if (updateIncoming(e)) {
        e.state = 'descend';
        e.vy = 260;
      }
      return;

    case 'descend':
      e.vx = 0;
      if (e.grounded) {
        e.state = 'flex';
        e.stateTimer = def.poseTime;
        e.attack = 0;
        facePlayer(e, ctx);
      }
      return;

    case 'flex':
      // Plantado: tranco de bala não arrasta o monumento.
      e.vx = approach(e.vx, 0, 2000 * dt);
      if (e.stateTimer <= 0) {
        e.attack++;
        e.stateTimer = def.poseTime * ctx.rng.range(0.85, 1.15);
        facePlayer(e, ctx); // vira para exibir o muque para a "plateia"
      }
      return;

    default:
      e.state = 'flex';
  }
}
