/** Fontes pixel do jogo (carregadas por @font-face em tokens.css). */
export const PIXEL_FONT = '"Jersey 10", "Arial Black", system-ui, sans-serif';
export const VHS_FONT = '"VT323", "Courier New", monospace';

/** Garante as fontes antes de criar textos no canvas (senão saem na fonte reserva). */
export async function loadPixelFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('16px "Jersey 10"'),
      document.fonts.load('16px "VT323"'),
    ]);
  } catch {
    // Sem as fontes o jogo segue com a fonte reserva; nunca trava a run.
  }
}
