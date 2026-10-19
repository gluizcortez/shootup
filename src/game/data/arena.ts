import type { ArenaBounds } from '@/core/physics/playerMotor';
import type { TerrainDef } from '@/core/physics/terrain';

/** Resolução lógica 16:9. O canvas escala para caber na janela. */
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;

export const ARENA: ArenaBounds = {
  left: 24,
  right: VIEW_WIDTH - 24,
  floorY: 468,
  ceilingY: 0,
};

/**
 * Relevo do palco: centro plano e, em cada canto, um platô alto colado à
 * parede, uma descida e um morrinho antes do plano. Serve para esquivar
 * subindo/descendo e para ganhar altura contra os atiradores.
 */
export const TERRAIN: TerrainDef = {
  baseY: ARENA.floorY,
  left: ARENA.left,
  right: ARENA.right,
  features: [
    { kind: 'ramp', side: 'left', height: 74, plateau: 58, slope: 96 },
    { kind: 'ramp', side: 'right', height: 74, plateau: 58, slope: 96 },
    { kind: 'bump', x: ARENA.left + 232, height: 22, halfWidth: 58 },
    { kind: 'bump', x: ARENA.right - 232, height: 22, halfWidth: 58 },
  ],
};

/** Simulação a 120 Hz. */
export const SIM_STEP = 1 / 120;

/** O canvas renderiza em 2× a resolução lógica para a arte ficar nítida em telas grandes. */
export const RENDER_ZOOM = 2;
