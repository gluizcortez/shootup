import type Phaser from 'phaser';
import { NEON, PAL } from './palette';
import { make } from './textures';
import type { Pen } from './textures';

/**
 * PLACEHOLDERS PROCEDURAIS (mesma regra de textures.ts): Breakdancer do
 * Boombox, Lutador Mamute, DJ Neon, Mágico de Las Vegas e Vendedor de
 * Infomercial, mais as balas temáticas deles.
 */
const O = PAL.outline;
const SKIN = PAL.skin;
const SKIN_B = 0xc98a5e;
const SKIN_C = 0x8a5a3c;

/** Tamanho lógico (sem TEX_SCALE) e pontos de encaixe de cada textura. */
export const VICE2_TEX = {
  /** Pés em (17, 49). */
  breakerBody: { w: 34, h: 50, fx: 17, fy: 49 },
  /** De cabeça para baixo: topo da cabeça (apoio do giro) em (20, 49). */
  breakerSpin: { w: 40, h: 50, fx: 20, fy: 49 },
  /** Pés em (25, 63). */
  lutadorBody: { w: 50, h: 64, fx: 25, fy: 63 },
  /** Barrigada no ar: centro do corpo em (32, 20). */
  lutadorFlop: { w: 64, h: 40, cx: 32, cy: 20 },
  /** Pés em (18, 51). */
  djBody: { w: 36, h: 52, fx: 18, fy: 51 },
  djDeck: { w: 46, h: 14 },
  djPhones: { w: 22, h: 18 },
  djGun: { w: 30, h: 16, pivotX: 3 },
  magicoBody: { w: 36, h: 52, fx: 18, fy: 51 },
  magicoHat: { w: 18, h: 17 },
  magicoCard: { w: 36, h: 12 },
  magicoGun: { w: 26, h: 14, pivotX: 3 },
  vendedorBody: { w: 38, h: 52, fx: 19, fy: 51 },
  vendedorTv: { w: 38, h: 30 },
  vendedorToupee: { w: 16, h: 8 },
  vendedorGun: { w: 26, h: 14, pivotX: 3 },
} as const;

/** Bala temática por vilão (id → textura); o resto usa `b_enemy`. */
export const ENEMY_BULLET_TEXTURE: Readonly<Record<string, string>> = {
  dj_neon: 'b_note',
  magico_vegas: 'b_card',
  vendedor_tv: 'b_box',
  lutador_mamute: 'b_shock',
};

export function generateVice2Textures(scene: Phaser.Scene): void {
  const T = VICE2_TEX;
  const sneaker = (p: Pen, x: number, y: number, color: number) => {
    p.oRound(x, y, 9, 5, 2, 0xffffff, 1.1);
    p.fill(color).rect(x + 1, y + 1.4, 6, 1);
    p.fill(0x9aa3b5).rect(x, y + 4, 9, 1);
  };

  // ── Breakdancer do Boombox (melee que persegue) ────────────────────
  make(scene, 'breaker_body', T.breakerBody.w, T.breakerBody.h, (p) => {
    sneaker(p, 8, 44, 0xff2d3d);
    sneaker(p, 17, 44, 0xff2d3d);
    // Calça de agasalho vermelha com listra branca.
    p.oRound(9, 29, 7, 16, 2.4, 0xd8192e, 1);
    p.oRound(17, 29, 7, 16, 2.4, 0xd8192e, 1);
    p.fill(0xffffff).rect(10.4, 30, 1, 14).rect(22, 30, 1, 14);
    // Jaqueta de agasalho azul com zíper.
    p.oRound(8, 16, 18, 15, 4, 0x2d6bff, 1.2);
    p.fill(0xffffff).rect(8.6, 19, 17, 1.2);
    p.fill(0xd8192e).rect(8.6, 21, 17, 1.2);
    p.fill(0xc4cad6).rect(17, 16.6, 0.8, 14);
    p.stroke(1.2, PAL.gold).line(13, 16.4, 17.4, 23).line(17.4, 23, 21.8, 16.4); // corrente grossa
    p.oCircle(17.4, 23.6, 2, PAL.gold, 0.8);
    p.fill(O).rect(16.4, 22.8, 2, 1.4);
    // Cabeça com chapéu de pescador e sorriso de dente de ouro.
    p.oRound(15, 13, 5, 4, 1.4, SKIN_C, 1);
    p.oCircle(19, 9.5, 7, SKIN_C, 1.3);
    p.fill(O).round(10.4, 1.4, 17.4, 6.4, 3);
    p.fill(0xff2fa8).round(11.2, 2.2, 15.8, 5, 2.6); // chapéu Kangol rosa
    p.fill(O).round(9, 5.8, 21, 2.4, 1.2);
    p.fill(0xff2fa8).round(9.6, 6.2, 19.8, 1.4, 0.7);
    p.fill(0xffffff).circle(22.4, 10, 1.4);
    p.fill(O).circle(23, 10.2, 0.7);
    p.fill(O).poly([[19, 13], [25.4, 12.6], [24.4, 15.4], [20, 15]]);
    p.fill(0xffffff).rect(19.8, 13.2, 4.6, 1);
    p.fill(PAL.gold).rect(22, 13.2, 1.4, 1);
    p.fill(0x6b3a22).circle(25.6, 11, 1.3); // nariz
    // Boombox no ombro.
    p.oRound(1, 9, 14, 8, 1.6, 0xc4cad6, 1.2);
    p.oCircle(4.4, 13, 2.6, 0x2a2f3a, 0.8);
    p.oCircle(11.4, 13, 2.6, 0x2a2f3a, 0.8);
    p.fill(NEON.cyan).circle(4.4, 13, 1).circle(11.4, 13, 1);
    p.fill(NEON.pink).rect(6.6, 10.4, 2.8, 1.2);
    p.stroke(1, O).line(3, 9, 5, 6.4).line(5, 6.4, 11, 6.4).line(11, 6.4, 13, 9); // alça
    p.oCircle(13.6, 17.4, 2.4, SKIN_C, 0.9); // mão segurando
  });
  make(scene, 'breaker_spin', T.breakerSpin.w, T.breakerSpin.h, (p) => {
    // Headspin: de cabeça para baixo, pernas abertas em V no alto.
    p.oRound(5, 1, 6, 16, 2.4, 0xd8192e, 1); // pernas
    p.oRound(29, 1, 6, 16, 2.4, 0xd8192e, 1);
    p.fill(0xffffff).rect(6, 1.4, 1, 15).rect(33, 1.4, 1, 15);
    p.oRound(3, 0, 9, 5, 2, 0xffffff, 1); // tênis para cima
    p.oRound(28, 0, 9, 5, 2, 0xffffff, 1);
    p.oRound(9, 12, 22, 9, 3, 0xd8192e, 1.2); // quadril
    p.oRound(12, 19, 16, 16, 4, 0x2d6bff, 1.2); // jaqueta
    p.fill(0xffffff).rect(12.6, 24, 15, 1.2);
    p.oRound(4, 30, 7, 5, 2, SKIN_C, 1); // mãos no chão
    p.oRound(29, 30, 7, 5, 2, SKIN_C, 1);
    p.oCircle(20, 39, 6.6, SKIN_C, 1.3); // cabeça (rosto de cabeça pra baixo)
    p.fill(0xffffff).circle(17.6, 40, 1.2).circle(22.4, 40, 1.2);
    p.fill(O).circle(17.6, 40.4, 0.6).circle(22.4, 40.4, 0.6);
    p.fill(O).ellipse(20, 35.4, 5, 2.4);
    p.fill(O).round(12.6, 43.6, 14.8, 5, 2);
    p.fill(0xff2fa8).round(13.4, 44.2, 13.2, 4, 1.8); // Kangol no chão, girando
  });

  // ── Lutador Mamute (melee que salta) ───────────────────────────────
  const TAN = 0xe08b4a;
  const TAN_HI = 0xffbe86;
  make(scene, 'lutador_body', T.lutadorBody.w, T.lutadorBody.h, (p) => {
    // Botas vermelhas com joelheira amarela.
    p.oRound(12, 50, 11, 13, 3, 0xd8192e, 1.3);
    p.oRound(27, 50, 11, 13, 3, 0xd8192e, 1.3);
    p.fill(0xffe14d).round(12.6, 50.6, 9.8, 4, 1.6).round(27.6, 50.6, 9.8, 4, 1.6);
    p.oRound(13, 40, 9, 12, 3, TAN, 1.2); // coxas
    p.oRound(28, 40, 9, 12, 3, TAN, 1.2);
    p.oRound(11, 35, 28, 9, 3, 0xffe14d, 1.3); // sunga amarela
    p.fill(0xd8192e).rect(11.6, 38.6, 26.8, 1.6);
    // Tronco de geladeira com regata rasgada.
    p.oRound(7, 14, 36, 24, 8, TAN, 1.4);
    p.fill(0xd8192e).poly([[12, 16], [38, 16], [36, 24], [32, 21], [28, 27], [24, 22], [20, 28], [16, 22], [13, 26]]);
    p.fill(0xffe14d).rect(15, 18, 20, 1.6);
    p.fill(TAN_HI).ellipse(19, 30, 8, 4).ellipse(31, 30, 8, 4);
    // Cinturão de campeão.
    p.oRound(11, 32, 28, 6, 2, 0x1b1724, 1.2);
    p.oRound(20, 30.4, 10, 9, 3, PAL.gold, 1.2);
    p.fill(0xff2d3d).circle(25, 34.8, 2);
    p.fill(0xffffff, 0.8).circle(23, 32.4, 1);
    // Braços enormes (mão na orelha: "não tô ouvindo!").
    p.oEllipse(6, 23, 11, 16, TAN, 1.3);
    p.oEllipse(44, 23, 11, 16, TAN, 1.3);
    p.oRound(40, 8, 7, 14, 3, TAN, 1.2);
    p.oCircle(42.6, 7, 3.6, TAN, 1.1);
    p.fill(TAN_HI).ellipse(46, 20, 4, 6).ellipse(8, 20, 4, 6);
    // Cabeça: bandana vermelha, bigodão loiro em ferradura.
    p.oRound(20, 1, 13, 15, 5, TAN, 1.3);
    p.fill(O).rect(19.2, 1, 14.6, 5);
    p.fill(0xd8192e).rect(20, 1.6, 13, 3.6);
    p.fill(0xffe14d).circle(23, 3.4, 0.7).circle(28, 3, 0.7);
    p.fill(0xffffff).circle(29, 8, 1.4);
    p.fill(O).circle(29.6, 8.2, 0.7);
    p.fill(O).rect(26.6, 6, 5, 1);
    p.fill(O).poly([[24, 11], [33, 10.6], [33, 16], [31.4, 16], [31, 12.6], [26, 12.6], [25.6, 16], [24, 16]]);
    p.fill(0xffe08a).poly([[24.8, 11.6], [32.2, 11.4], [32.2, 15.4], [31.8, 15.4], [31.4, 12], [25.6, 12], [25.2, 15.4], [24.8, 15.4]]);
    p.fill(0xb5532a).circle(33, 9.6, 1.6); // nariz
  });
  make(scene, 'lutador_flop', T.lutadorFlop.w, T.lutadorFlop.h, (p) => {
    // Barrigada: corpo na horizontal, braços e pernas abertos, gritando.
    p.oRound(1, 8, 14, 9, 3, TAN, 1.2); // braço da frente esticado
    p.oRound(49, 8, 14, 9, 3, 0xd8192e, 1.2); // perna (bota)
    p.oRound(44, 22, 18, 8, 3, 0xd8192e, 1.2);
    p.fill(0xffe14d).rect(45, 9, 3, 7).rect(45, 23, 3, 6);
    p.oEllipse(32, 20, 40, 26, TAN, 1.5); // barrigão
    p.fill(0xd8192e).poly([[16, 10], [40, 9], [44, 18], [38, 16], [32, 22], [26, 15], [20, 20]]);
    p.oRound(36, 16, 12, 10, 3, 0xffe14d, 1.2); // sunga
    p.oRound(22, 22, 12, 7, 2, PAL.gold, 1.1); // cinturão
    p.oRound(3, 22, 14, 8, 3, TAN, 1.2); // outro braço
    p.oCircle(11, 13, 7, TAN, 1.3); // cabeça na frente
    p.fill(O).rect(5, 7, 12, 4);
    p.fill(0xd8192e).rect(5.6, 7.6, 10.8, 2.8);
    p.fill(O).ellipse(8, 16, 6, 5); // boca aberta "AAAH"
    p.fill(0xb83252).ellipse(8, 17, 3.6, 2.6);
    p.fill(0xffe08a).poly([[4, 14], [12, 14.4], [12, 15.4], [4.6, 15.4]]);
  });

  // ── DJ Neon (atirador de leque de notas) ───────────────────────────
  make(scene, 'dj_body', T.djBody.w, T.djBody.h, (p) => {
    sneaker(p, 8, 46, NEON.cyan);
    sneaker(p, 18, 46, NEON.cyan);
    // Calça de agasalho preta com listras neon.
    p.oRound(10, 31, 7, 16, 2.4, 0x1b1724, 1);
    p.oRound(18, 31, 7, 16, 2.4, 0x1b1724, 1);
    p.fill(NEON.pink).rect(11, 32, 1, 14).rect(23.4, 32, 1, 14);
    p.fill(NEON.cyan).rect(12.4, 32, 0.8, 14).rect(22.2, 32, 0.8, 14);
    // Regata de tela amarela, correntes de ouro.
    p.oRound(10, 18, 16, 15, 4, 0xffe14d, 1.2);
    for (let y = 20; y < 32; y += 2) for (let x = 11.4; x < 25; x += 2) p.fill(0xd9b52a).circle(x, y, 0.5);
    p.stroke(1, PAL.gold).line(14, 18.4, 18, 25).line(18, 25, 22, 18.4);
    p.stroke(1, PAL.gold).line(13, 18.4, 18, 28).line(18, 28, 23, 18.4);
    p.oCircle(18, 28.4, 2, PAL.gold, 0.8);
    p.fill(O).rect(17.2, 27.6, 1.6, 1.6);
    // Cabeça com cabelo "hi-top" de 30 cm e óculos de persiana.
    p.oRound(17, 15, 5, 5, 1.4, SKIN_B, 1);
    p.oCircle(20, 12.4, 7, SKIN_B, 1.3);
    p.fill(O).round(12.6, 0, 15, 9, 1.6);
    p.fill(0x1b1420).round(13.4, 0.8, 13.4, 7.6, 1.2);
    p.fill(NEON.pink).rect(13.4, 2.6, 13.4, 1.1); // risca neon no topo
    p.fill(O).round(18.6, 9.6, 10, 3.6, 1);
    p.fill(NEON.yellow);
    for (let i = 0; i < 3; i++) p.rect(19.2, 10.1 + i * 1.05, 8.8, 0.5);
    p.fill(O).poly([[20, 15.4], [26.4, 15], [25.4, 17.4], [21, 17.2]]);
    p.fill(0xffffff).rect(20.6, 15.6, 5, 0.8);
    p.fill(0x8a5a3c).circle(27.4, 13.2, 1.4);
  });
  make(scene, 'dj_deck', T.djDeck.w, T.djDeck.h, (p) => {
    // Pick-up voador: ele flutua em cima da mesa de som.
    p.oRound(1, 3, 44, 9, 2, 0x2a2f3a, 1.3);
    p.fill(NEON.cyan).rect(2, 10, 42, 1);
    p.oEllipse(12, 5, 17, 5, 0x0d0f15, 0.8);
    p.oEllipse(34, 5, 17, 5, 0x0d0f15, 0.8);
    p.fill(NEON.pink).ellipse(12, 5, 5, 1.6);
    p.fill(NEON.yellow).ellipse(34, 5, 5, 1.6);
    p.fill(0xc4cad6).rect(21, 5, 4, 3);
    p.fill(0xff2d3d).circle(22, 9, 0.7);
    p.fill(0x39ff88).circle(24.4, 9, 0.7);
  });
  make(scene, 'dj_phones', T.djPhones.w, T.djPhones.h, (p) => {
    // Fones gigantes.
    p.stroke(2.4, O).line(4, 9, 6, 2).line(6, 2, 16, 2).line(16, 2, 18, 9);
    p.stroke(1.2, 0xc4cad6).line(4, 9, 6, 2).line(6, 2, 16, 2).line(16, 2, 18, 9);
    p.oRound(0.5, 8, 7, 9, 3, NEON.pink, 1.2);
    p.oRound(14.5, 8, 7, 9, 3, NEON.pink, 1.2);
    p.fill(0xffffff, 0.5).rect(2, 9.6, 1.2, 5).rect(16, 9.6, 1.2, 5);
  });
  make(scene, 'dj_gun', T.djGun.w, T.djGun.h, (p) => {
    p.oRound(0.5, 5, 9, 5, 2.2, SKIN_B, 1); // braço
    p.oCircle(10, 7.6, 2.6, SKIN_B, 1);
    // Mini caixa de som de mão: o cone da frente é a "boca".
    p.oRound(10, 1, 18, 14, 2.4, 0x2a2f3a, 1.3);
    p.oCircle(22, 8, 5, 0x0d0f15, 0.8);
    p.fill(NEON.cyan).circle(22, 8, 3.4);
    p.fill(0x0d0f15).circle(22, 8, 1.4);
    p.oCircle(14, 5, 2, 0x0d0f15, 0.6);
    p.fill(NEON.pink).circle(14, 5, 1).rect(12, 11, 5, 1.4);
  });

  // ── Mágico de Las Vegas (teleporta e joga cartas) ──────────────────
  const PURPLE = 0x7b2cbf;
  const PURPLE_HI = 0xb37cff;
  make(scene, 'magico_body', T.magicoBody.w, T.magicoBody.h, (p) => {
    p.fill(O).poly([[5, 17], [16, 16], [12, 47], [2, 44]]); // capa (forro vermelho)
    p.fill(0xd8192e).poly([[6, 18.4], [15, 17.6], [11.4, 45.4], [3.4, 43]]);
    p.oRound(9, 46, 9, 5, 2, 0x0d0f15, 1);
    p.oRound(18, 46, 9, 5, 2, 0x0d0f15, 1);
    p.fill(0xffffff, 0.6).rect(11, 47, 3, 0.8).rect(20, 47, 3, 0.8);
    p.oRound(11, 33, 6.6, 14, 2, PURPLE, 1);
    p.oRound(18.4, 33, 6.6, 14, 2, PURPLE, 1);
    // Fraque de lantejoula roxa, camisa branca e gravata-borboleta.
    p.oRound(10, 18, 17, 17, 4, PURPLE, 1.2);
    p.fill(O).tri(15, 18, 23, 18, 19, 30);
    p.fill(0xffffff).tri(16, 18.6, 22, 18.6, 19, 28);
    p.fill(0xd8192e).poly([[16.6, 19], [19, 20.4], [21.4, 19], [21.4, 22], [19, 20.8], [16.6, 22]]);
    for (let y = 21; y < 34; y += 2.4) for (let x = 11; x < 26; x += 2.4) if (x < 15.4 || x > 22.6) p.fill(PURPLE_HI).circle(x, y, 0.6);
    p.fill(0xffffff, 0.8).circle(12, 22, 0.6).circle(24.6, 27, 0.6);
    // Cabeça: cabelo engomado, bigode enrolado e cavanhaque.
    p.oRound(17, 14.4, 5, 5, 1.4, SKIN, 1);
    p.oCircle(20, 11, 7, SKIN, 1.3);
    p.fill(0x1b1420).poly([[13, 9], [14, 4.6], [19, 3.6], [24.6, 4.6], [26, 7], [21, 6.4], [16, 8], [15.6, 12]]);
    p.fill(0xffffff).circle(23.4, 9.4, 1.4);
    p.fill(O).circle(24, 9.6, 0.7);
    p.stroke(1, O).line(21.6, 7.4, 25.6, 6.4); // sobrancelha arqueada
    p.fill(O).poly([[21, 13], [24, 12.4], [27, 13], [28.6, 11.4], [28.4, 13.6], [24, 14], [20.4, 14.4], [19.4, 12.4]]); // bigode enrolado
    p.fill(O).tri(22, 15, 25, 15, 23.4, 19.4); // cavanhaque
    p.fill(0xe8a87f).circle(27, 10.6, 1.4);
  });
  make(scene, 'magico_hat', T.magicoHat.w, T.magicoHat.h, (p) => {
    p.oRound(3, 0.5, 12, 13, 1.4, 0x1b1420, 1.2);
    p.fill(PURPLE).rect(3, 9, 12, 2.4);
    p.fill(0xffffff, 0.35).rect(5, 2, 1.4, 6.6);
    p.oRound(0.5, 13, 17, 3, 1.2, 0x1b1420, 1);
    p.fill(0xffffff).circle(13, 4, 1.2); // estrelinha
  });
  make(scene, 'magico_card', T.magicoCard.w, T.magicoCard.h, (p) => {
    // Ás de copas gigante como tapete voador.
    p.fill(O).poly([[4, 1], [36, 1], [32, 11], [0, 11]]);
    p.fill(0xffffff).poly([[5, 2.2], [34.4, 2.2], [31.2, 9.8], [1.8, 9.8]]);
    p.fill(0xff2d3d).circle(16.6, 5.2, 1.8).circle(19.4, 5.2, 1.8).tri(14.8, 5.8, 21.2, 5.8, 18, 9);
    p.fill(0xff2d3d).rect(6.6, 3, 1.4, 2.6).rect(28.6, 6.6, 1.4, 2.6);
  });
  make(scene, 'magico_gun', T.magicoGun.w, T.magicoGun.h, (p) => {
    p.oRound(0.5, 4.6, 9, 5, 2.2, PURPLE, 1);
    p.oCircle(11, 7, 3, 0xffffff, 1); // luva branca
    // Leque de cartas na mão.
    for (let i = 0; i < 4; i++) {
      const y = 1 + i * 2.6;
      p.fill(O).round(12.6, y, 12, 4.4, 0.8);
      p.fill(0xffffff).round(13.2, y + 0.5, 10.8, 3.4, 0.6);
      p.fill(i % 2 ? 0x1b1420 : 0xff2d3d).circle(22, y + 2.2, 0.9);
    }
  });

  // ── Vendedor de Infomercial (suporte que chama capangas) ───────────
  const PLAID = 0xf08a3c;
  make(scene, 'vendedor_body', T.vendedorBody.w, T.vendedorBody.h, (p) => {
    p.oRound(10, 46, 9, 5, 2, 0x5a3420, 1);
    p.oRound(19, 46, 9, 5, 2, 0x5a3420, 1);
    p.oRound(11, 33, 7, 14, 2, 0x8a6a4a, 1); // calça marrom
    p.oRound(19, 33, 7, 14, 2, 0x8a6a4a, 1);
    // Paletó xadrez laranja e turquesa.
    p.oRound(9, 17, 20, 18, 4, PLAID, 1.2);
    p.fill(0x42dec4, 0.7);
    for (let x = 11; x < 28; x += 4) p.rect(x, 17.6, 1.2, 17);
    for (let y = 19; y < 34; y += 4) p.rect(9.6, y, 19, 1.2);
    p.fill(O).tri(15, 17, 24, 17, 19.5, 30);
    p.fill(0xffffff).tri(16, 17.6, 23, 17.6, 19.5, 28.6);
    p.fill(NEON.pink).poly([[18.6, 18.6], [20.4, 18.6], [21.6, 29], [19.5, 31], [17.4, 29]]); // gravata larga
    p.fill(NEON.yellow).rect(18.4, 22, 2.4, 1).rect(18.2, 25.6, 2.8, 1);
    // Cabeça: sorriso de comercial, gota de suor e headset.
    p.oRound(18, 14, 5, 5, 1.4, SKIN, 1);
    p.oCircle(21, 10.6, 7.4, SKIN, 1.3);
    p.fill(0x6b4a2c).poly([[14, 8], [16, 4.4], [23, 3.2], [27, 5], [20, 5.6], [16, 9]]); // cabelo ralo
    p.fill(0xffffff).circle(24, 8.6, 1.6);
    p.fill(O).circle(24.6, 8.8, 0.8);
    p.stroke(1, O).line(22, 6.2, 26, 6);
    p.fill(O).poly([[18.6, 12], [27.6, 11.6], [26.6, 16], [20, 15.6]]); // sorrisão
    p.fill(0xffffff).poly([[19.4, 12.4], [27, 12.1], [26.6, 13.8], [19.8, 14]]);
    p.stroke(0.4, 0xc4cad6).line(21.4, 12.3, 21.4, 14).line(23.4, 12.2, 23.4, 13.9).line(25.4, 12.1, 25.4, 13.8);
    p.fill(0xe8a87f).circle(28.4, 9.6, 1.6);
    p.fill(0x7fe7ff).circle(15.6, 6, 1).tri(14.8, 5.6, 16.4, 5.6, 15.6, 3.8); // suor
    p.stroke(0.9, O).line(15, 10, 15, 13).line(15, 13, 22, 15); // fio do headset
    p.oCircle(22.4, 15, 1.2, 0x2a2f3a, 0.6);
    p.oCircle(14.6, 10.4, 2.2, 0x2a2f3a, 0.8);
  });
  make(scene, 'vendedor_tv', T.vendedorTv.w, T.vendedorTv.h, (p) => {
    // TV de tubo voadora com "CALL NOW!" piscando na tela.
    p.stroke(1, O).line(14, 6, 9, 0.6).line(24, 6, 29, 0.6);
    p.oRound(1, 6, 36, 22, 3, 0x6b4a2c, 1.3);
    p.fill(0x8a6a4a).rect(30, 9, 5, 16);
    p.fill(0x2a2f3a).circle(32.4, 12, 1.2).circle(32.4, 16, 1.2);
    p.oRound(4, 8.6, 25, 17, 3, 0x2d6bff, 1);
    p.fill(NEON.yellow).rect(6, 11, 21, 3.6);
    p.fill(0xd8192e).rect(7, 11.8, 2, 2).rect(10, 11.8, 2, 2).rect(13, 11.8, 2, 2).rect(16, 11.8, 2, 2).rect(19, 11.8, 2, 2).rect(22, 11.8, 2, 2);
    p.fill(0xffffff).rect(7, 17, 19, 1.4).rect(7, 20, 14, 1.4);
    p.fill(0xffffff, 0.35).rect(5, 9.4, 3, 6);
  });
  make(scene, 'vendedor_toupee', T.vendedorToupee.w, T.vendedorToupee.h, (p) => {
    // Peruca (voa longe quando ele cai).
    p.fill(O).ellipse(8, 5, 16, 7);
    p.fill(0x6b4a2c).ellipse(8, 4.8, 14, 5.4);
    p.fill(0x8a6a4a).ellipse(6, 3.6, 7, 2);
  });
  make(scene, 'vendedor_gun', T.vendedorGun.w, T.vendedorGun.h, (p) => {
    p.oRound(0.5, 4.6, 9, 5, 2.2, PLAID, 1);
    p.oCircle(10.6, 7, 2.8, SKIN, 1);
    // Celular-tijolo dos anos 80, antena para a frente.
    p.oRound(11, 3.6, 12, 7, 1.4, 0x2a2f3a, 1.2);
    p.fill(0x39ff88).rect(13, 5, 4, 2);
    p.fill(0xc4cad6).rect(18, 5, 1, 1).rect(20, 5, 1, 1).rect(18, 7.6, 1, 1).rect(20, 7.6, 1, 1);
    p.stroke(1.2, O).line(23, 5.4, 25.6, 5.4);
    p.oCircle(25.4, 5.4, 0.8, 0xff2d3d, 0.4);
  });

  // ── Balas temáticas ────────────────────────────────────────────────
  make(scene, 'b_note', 18, 18, (p) => {
    p.fill(O).ellipse(7, 13, 10, 7.6);
    p.fill(NEON.cyan).ellipse(7, 13, 7.6, 5.4);
    p.fill(O).rect(10, 2, 3, 12).poly([[10, 2], [17, 5], [17, 8.6], [12, 6]]);
    p.fill(NEON.cyan).rect(10.8, 3, 1.4, 10).poly([[11, 3], [16, 5.4], [16, 7], [12, 5.4]]);
    p.fill(0xffffff).circle(5.6, 12, 1.2);
  });
  make(scene, 'b_card', 18, 18, (p) => {
    p.fill(O).round(3, 1, 12, 16, 2);
    p.fill(0xffffff).round(4, 2, 10, 14, 1.4);
    p.fill(0xff2d3d).circle(7.6, 8, 1.8).circle(10.4, 8, 1.8).tri(5.8, 8.6, 12.2, 8.6, 9, 12.4);
  });
  make(scene, 'b_box', 18, 18, (p) => {
    p.fill(O).rect(1, 1, 16, 16);
    p.fill(NEON.yellow).rect(2.2, 2.2, 13.6, 13.6);
    p.fill(0xd8192e).rect(2.2, 7, 13.6, 3.6);
    p.fill(0xffffff).rect(4, 7.8, 10, 0.7).rect(4, 9.2, 7, 0.7);
  });
  make(scene, 'b_shock', 18, 18, (p) => {
    p.fill(O).ellipse(9, 11, 18, 12);
    p.fill(0xffe14d).ellipse(9, 11, 15.4, 9.4);
    p.fill(0xffffff).ellipse(9, 11, 8, 4);
    p.fill(0xd8192e).tri(1, 11, 5, 4, 7, 9).tri(17, 11, 13, 4, 11, 9);
  });
}
