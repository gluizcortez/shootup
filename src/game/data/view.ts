import { RENDER_WIDTH, VIEW_HEIGHT, VIEW_WIDTH } from './arena';

/** Zoom fixo: a arte fica com o mesmo tamanho em qualquer proporção. */
export const RENDER_ZOOM = RENDER_WIDTH / VIEW_WIDTH;

/** Proporções de janela suportadas; fora disso sobra uma faixa (só em telas raras). */
export const MIN_ASPECT = 1.5;
export const MAX_ASPECT = 2.4;
/** Fração da sobra vertical que vai para cima (bambolina); o resto vira plateia embaixo. */
export const TOP_SHARE = 0.3;

/** Região visível do mundo e tamanho do canvas para uma proporção de janela. */
export interface ViewLayout {
  /** Canto superior esquerdo visível, em coordenadas do mundo (≤ 0). */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Pixels de canvas por unidade do mundo. */
  zoom: number;
  canvasW: number;
  canvasH: number;
}

export function clampAspect(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return VIEW_WIDTH / VIEW_HEIGHT;
  return Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, aspect));
}

/**
 * A arena inteira cabe sempre; a sobra vira cenário. Janela mais larga que a
 * arena ganha coxias dos lados; mais estreita ganha bambolina e plateia.
 */
export function computeView(windowAspect: number): ViewLayout {
  const aspect = clampAspect(windowAspect);
  const arenaAspect = VIEW_WIDTH / VIEW_HEIGHT;
  let width = VIEW_WIDTH;
  let height = VIEW_HEIGHT;
  if (aspect > arenaAspect) width = VIEW_HEIGHT * aspect;
  else height = VIEW_WIDTH / aspect;
  return {
    left: -(width - VIEW_WIDTH) / 2,
    top: -(height - VIEW_HEIGHT) * TOP_SHARE,
    width,
    height,
    zoom: RENDER_ZOOM,
    canvasW: Math.round(width * RENDER_ZOOM),
    canvasH: Math.round(height * RENDER_ZOOM),
  };
}

/** Maior sobra possível em cada borda; o cenário é desenhado até aqui. */
export const VIEW_MARGIN = (() => {
  const wide = computeView(MAX_ASPECT);
  const tall = computeView(MIN_ASPECT);
  return {
    side: -wide.left,
    top: -tall.top,
    bottom: tall.height + tall.top - VIEW_HEIGHT,
  };
})();
