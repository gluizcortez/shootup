import { VIEW_HEIGHT, VIEW_WIDTH } from './arena';

/**
 * Pixel art: cada texel vira exatamente `zoom`×`zoom` pixels do canvas (zoom
 * inteiro), e o navegador só faz o ajuste fino até o tamanho da janela. Assim
 * todos os pixels do jogo têm o mesmo tamanho na tela.
 */
export const DEFAULT_ZOOM = 2;
export const MAX_ZOOM = 3;

/** Zoom inteiro cujo canvas fica mais perto dos pixels reais da janela. */
export function pixelZoom(viewWidth: number, targetPx: number): number {
  if (!Number.isFinite(targetPx) || targetPx <= 0) return DEFAULT_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(1, Math.round(targetPx / viewWidth)));
}

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
  /** Pixels de canvas por unidade do mundo (sempre inteiro). */
  zoom: number;
  canvasW: number;
  canvasH: number;
}

export function clampAspect(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return VIEW_WIDTH / VIEW_HEIGHT;
  return Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, aspect));
}

/**
 * `windowPx` é a largura da janela em pixels físicos (CSS × devicePixelRatio).
 * A arena inteira cabe sempre; a sobra vira cenário. Janela mais larga que a
 * arena ganha coxias dos lados; mais estreita ganha bambolina e plateia.
 */
export function computeView(windowAspect: number, windowPx?: number): ViewLayout {
  const aspect = clampAspect(windowAspect);
  const arenaAspect = VIEW_WIDTH / VIEW_HEIGHT;
  let width = VIEW_WIDTH;
  let height = VIEW_HEIGHT;
  if (aspect > arenaAspect) width = VIEW_HEIGHT * aspect;
  else height = VIEW_WIDTH / aspect;
  const zoom = windowPx === undefined ? DEFAULT_ZOOM : pixelZoom(width, windowPx);
  return {
    left: -(width - VIEW_WIDTH) / 2,
    top: -(height - VIEW_HEIGHT) * TOP_SHARE,
    width,
    height,
    zoom,
    canvasW: Math.round(width * zoom),
    canvasH: Math.round(height * zoom),
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
