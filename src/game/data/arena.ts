import type { ArenaBounds } from '@/core/physics/playerMotor';
import type { TerrainDef } from '@/core/physics/terrain';

/**
 * Retângulo lógico da arena (onde a simulação acontece). A câmera sempre o
 * mostra inteiro e preenche o resto da janela com cenário (ver `view.ts`),
 * então não há faixas pretas em nenhuma proporção comum de tela.
 */
export const VIEW_WIDTH = 1200;
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
    { kind: 'ramp', side: 'left', height: 74, plateau: 70, slope: 110 },
    { kind: 'ramp', side: 'right', height: 74, plateau: 70, slope: 110 },
    { kind: 'bump', x: ARENA.left + 290, height: 22, halfWidth: 62 },
    { kind: 'bump', x: ARENA.right - 290, height: 22, halfWidth: 62 },
  ],
};

/** Simulação a 120 Hz. */
export const SIM_STEP = 1 / 120;

/**
 * Largura do canvas em pixels quando a janela tem a proporção da arena.
 * Mantém o custo de preenchimento perto de 1920×1080 em qualquer proporção.
 */
export const RENDER_WIDTH = 1920;
