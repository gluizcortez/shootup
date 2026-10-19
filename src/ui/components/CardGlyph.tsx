import type { CardInfo } from '@/shared/types';

/** Ícones simples por carta (SVG em código, placeholder até a arte final). */
const GLYPHS: Record<string, string> = {
  tiro_duplo: 'M6 9h18l6 4-6 4H6zM6 21h18l6 4-6 4H6z',
  gatilho_nervoso: 'M20 3 8 21h9l-3 16 14-22h-9z',
  bala_viajante: 'M2 17h4v6H2zM10 17h4v6h-4zM18 15h12l8 5-8 5H18z',
  sinuca_mortal: 'M4 32 16 10l8 14L36 6l2 2-14 22-8-14L7 34z',
  mira_cirurgica: 'M20 4a16 16 0 1 0 0.01 0zm0 5a11 11 0 1 1-0.01 0zM19 0h2v12h-2zM19 28h2v12h-2zM0 19h12v2H0zM28 19h12v2H28z',
  pe_leve: 'M8 26c6-1 9-6 12-12l6 2c-1 5 1 9 6 11v5H6zM2 12h10v2H2zM0 18h8v2H0z',
  calibre_reforcado: 'M14 4h12v6H14zM12 12h16v24H12zM16 16h8v4h-8z',
  olho_vivo: 'M2 20C8 10 32 10 38 20 32 30 8 30 2 20zm18-7a7 7 0 1 0 0.01 0zm0 4a3 3 0 1 1-0.01 0z',
  ponta_oca: 'M6 14h20l8 6-8 6H6zM26 17a3 3 0 1 0 0.01 0z',
  casco_regenerado: 'M20 36 6 22C1 17 3 8 11 8c4 0 7 2 9 6 2-4 5-6 9-6 8 0 10 9 5 14zM18 14h4v5h5v4h-5v5h-4v-5h-5v-4h5z',
  explosivo: 'M20 2l4 10 10-4-5 10 10 4-10 4 5 10-10-4-4 10-4-10-10 4 5-10-10-4 10-4-5-10 10 4z',
  vampiresco: 'M4 8h32c0 10-6 16-16 16S4 18 4 8zM10 14l3 10 3-8zM24 16l3 8 3-10zM19 28c-2 4-3 6-3 8a4 4 0 0 0 8 0c0-2-1-4-3-8z',
  casco_duro: 'M20 36 6 22C1 17 3 8 11 8c4 0 7 2 9 6 2-4 5-6 9-6 8 0 10 9 5 14z',
};

export function CardGlyph({ card }: { card: CardInfo }) {
  const d = GLYPHS[card.id] ?? 'M20 4 36 20 20 36 4 20z';
  return (
    <svg className="card-glyph" viewBox="0 0 40 40" aria-hidden="true">
      <path d={d} fillRule="evenodd" />
    </svg>
  );
}
