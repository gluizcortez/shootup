import type { ArenaBounds } from '@/core/physics/playerMotor';

/** Resolução lógica 16:9. O canvas escala para caber na janela. */
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;

export const ARENA: ArenaBounds = {
  left: 24,
  right: VIEW_WIDTH - 24,
  floorY: 468,
  ceilingY: 0,
};

/** Simulação a 120 Hz. */
export const SIM_STEP = 1 / 120;

/** O canvas renderiza em 2× a resolução lógica para a arte ficar nítida em telas grandes. */
export const RENDER_ZOOM = 2;
