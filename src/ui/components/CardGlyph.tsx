import type { CardInfo } from '@/shared/types';

/** Ícones simples por carta (SVG em código, placeholder até a arte final). */
const GLYPHS: Record<string, string> = {
  tiro_duplo: 'M6 9h18l6 4-6 4H6zM6 21h18l6 4-6 4H6z',
  gatilho_nervoso: 'M20 3 8 21h9l-3 16 14-22h-9z',
  gatilho_turbo: 'M14 3 2 21h9l-3 16 14-22h-9zM28 3 20 15h6l-2 10 10-14h-6z',
  calibre_magnum: 'M6 2h10v6H6zM24 2h10v6H24zM5 10h12v28H5zM23 10h12v28H23z',
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
  shake_proteina: 'M10 10h20l-3 28H13zM12 4h16v4H12zM24 0h3l-2 10h-3zM14 18h12v3H14z',
  mordida_garotos_perdidos: 'M4 6h32v6c-2 6-6 10-10 12l-2 10-4-9-4 9-2-10C10 22 6 18 4 12zM28 30c-1 3-2 5-2 6a3 3 0 0 0 6 0c0-1-1-3-2-6z',
  cartucho_pirata: 'M4 10h32v20H4zM9 15a3 3 0 1 0 0.01 0zM31 15a3 3 0 1 0 0.01 0zM14 16h12v8H14z',
  bala_laque: 'M14 2h12v6H14zM12 10h16v28H12zM6 4l4 4-2 2-4-4zM34 4l-4 4 2 2 4-4z',
  soco_filme_b: 'M8 14c0-4 4-6 8-6h10c4 0 8 3 8 8v8c0 6-4 10-10 10h-6c-6 0-10-4-10-10zM2 18h4v2H2zM0 24h6v2H0z',
  bate_volta: 'M2 34h36v4H2zM6 30 14 8l8 22 8-22 4 2-12 26-8-20-6 16z',
  lado_b: 'M20 2a18 18 0 1 0 0.01 0zm0 13a5 5 0 1 1-0.01 0zM17 9h3c3 0 4 1.5 4 3s-1 2-2 2.4c1.4.4 2.5 1.4 2.5 3 0 2-1.5 3.6-4.5 3.6h-3z',
  trilha_montagem: 'M12 6h20v4H16v18a5 5 0 1 1-4-4.9zM28 10h4v14a5 5 0 1 1-4-4.9z',
  teleguiada: 'M4 34C8 18 18 10 30 8l-2-5 10 7-9 6v-5C19 12 11 20 8 34z',
  bala_cluster: 'M20 14a6 6 0 1 0 0.01 0zM6 6l5 2-2 3zM34 6l-3 5-2-3zM4 26l6-2v4zM36 26l-6 2v-4zM18 32h4l-2 6z',
  camera_lenta: 'M4 12h22v16H4zM26 17l10-6v18l-10-6zM10 4a5 5 0 1 0 0.01 0zM20 4a5 5 0 1 0 0.01 0z',
  globo_discoteca: 'M19 0h2v8h-2zM20 9a14 14 0 1 0 0.01 0zM8 18h24v2H8zM9 25h22v2H9zM19 9h2v28h-2z',
};

export function CardGlyph({ card }: { card: CardInfo }) {
  const d = GLYPHS[card.id] ?? 'M20 4 36 20 20 36 4 20z';
  return (
    <svg className="card-glyph" viewBox="0 0 40 40" aria-hidden="true">
      <path d={d} fillRule="evenodd" />
    </svg>
  );
}
