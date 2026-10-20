import type Phaser from 'phaser';
import { NEON, PAL } from './palette';
import { make } from './textures';
import type { Pen } from './textures';

/**
 * PLACEHOLDERS PROCEDURAIS (mesma regra de textures.ts): Maromba Miami Vice,
 * Patinador Assassino e Policial de Miami Corrupto. Chaves seguem os IDs
 * estáveis (maromba_*, patinador_*, policial_*).
 */
const O = PAL.outline;

/** Tamanho lógico (sem TEX_SCALE) e pontos de encaixe de cada textura. */
export const VICE_TEX = {
  /** Quadril em (24, 38); ombros em (24 ± 17, 8); pescoço em (24, 4). */
  marombaTorso: { w: 48, h: 40, hx: 24, hy: 38 },
  /** Pescoço (pivô) em (11, 23); nó da bandana em (3.5, 6). */
  marombaHead: { w: 24, h: 25, nx: 11, ny: 23, kx: 3.5, ky: 6 },
  marombaTails: { w: 13, h: 8, ax: 1, ay: 4 },
  marombaUpArm: { w: 18, h: 17, py: 2.5 },
  marombaForearm: { w: 13, h: 18, py: 2 },
  marombaLeg: { w: 9, h: 24, px: 3.5 },
  /** Pés (centro das rodinhas) em (18, 53). */
  patinadorBody: { w: 36, h: 54, fx: 18, fy: 53 },
  patinadorHair: { w: 32, h: 28 },
  patinadorVisor: { w: 18, h: 8 },
  patinadorGun: { w: 28, h: 11, pivotX: 3 },
  /** Pés em (20, 53). */
  policialBody: { w: 40, h: 54, fx: 20, fy: 53 },
  policialSiren: { w: 20, h: 28 },
  policialShades: { w: 15, h: 6 },
  policialGun: { w: 32, h: 13, pivotX: 4 },
  policialDonut: { w: 14, h: 14 },
} as const;

/** Bronzeado de spray laranja. */
const TAN = 0xf08a3c;
const TAN_SHADE = 0xc8622a;
const TAN_HI = 0xffc38a;
const LIME = 0x9dff3a;

export function generateViceTextures(scene: Phaser.Scene): void {
  const T = VICE_TEX;
  const shine = (p: Pen, x: number, y: number, w: number, h: number) => p.fill(0xffffff, 0.75).ellipse(x, y, w, h);

  // ── Maromba Miami Vice (melee): torso em V, braços gigantes, perninhas ──
  make(scene, 'maromba_torso', T.marombaTorso.w, T.marombaTorso.h, (p) => {
    // Shortinho neon rosa com cós limão (minúsculo de propósito).
    p.oRound(13, 29, 22, 10, 3, NEON.pink, 1.3);
    p.fill(LIME).rect(13, 29, 22, 2.4);
    p.fill(0xffffff, 0.35).rect(15, 33, 6, 1.2);
    // Tronco em V absurdo.
    p.fill(O).poly([[2, 7], [46, 7], [35, 33], [13, 33]]);
    p.fill(TAN).poly([[4, 8.5], [44, 8.5], [33.8, 31.5], [14.2, 31.5]]);
    p.oCircle(7, 10, 6.5, TAN, 1.3); // deltoides
    p.oCircle(41, 10, 6.5, TAN, 1.3);
    p.fill(TAN_SHADE).ellipse(17, 20, 9, 4).ellipse(31, 20, 9, 4); // sombra sob o peitoral
    p.fill(O).ellipse(17, 14.5, 16.5, 12).ellipse(31, 14.5, 16.5, 12); // peitorais
    p.fill(TAN).ellipse(17, 14.5, 14.5, 10).ellipse(31, 14.5, 14.5, 10);
    p.fill(TAN_HI).ellipse(15, 12.5, 7, 3.4).ellipse(29, 12.5, 7, 3.4);
    // Tanquinho: 6 gomos.
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) p.oRound(19.2 + c * 5.2, 21 + r * 3.4, 4.4, 2.8, 1.2, TAN, 0.7);
    }
    // Óleo: brilhos espalhados.
    shine(p, 9, 7.6, 4, 1.6);
    shine(p, 39, 7.6, 4, 1.6);
    shine(p, 20, 11, 3, 1.3);
    shine(p, 34, 11, 3, 1.3);
    shine(p, 22, 22, 1.4, 0.8);
    // Corrente de ouro de Miami.
    p.stroke(1.1, PAL.gold).line(18, 7, 24, 12).line(24, 12, 30, 7);
    p.fill(PAL.gold).circle(24, 12.4, 1.6);
  });

  for (const [key, face] of [
    ['maromba_head', 'grin'],
    ['maromba_head_grr', 'grr'],
    ['maromba_head_kiss', 'kiss'],
  ] as const) {
    make(scene, key, T.marombaHead.w, T.marombaHead.h, (p) => {
      // Trapézio de touro sustentando uma cabecinha minúscula.
      p.fill(O).poly([[1, 25], [22, 25], [17, 14], [6, 14]]);
      p.fill(TAN).poly([[3, 24], [20, 24], [16, 15], [7, 15]]);
      p.fill(TAN_SHADE).rect(9, 18, 6, 6);
      p.oRound(6, 3, 12, 14, 4, TAN, 1.3); // cabeça quadradona
      p.oCircle(6.6, 10.6, 2, TAN, 1); // orelha
      p.fill(0xffe08a).round(7, 1.2, 10, 3, 1.4); // topinho loiro platinado
      // Bandana neon com bolinhas.
      p.fill(O).rect(5, 4, 14.4, 4.4);
      p.fill(NEON.pink).rect(5.6, 4.6, 13.2, 3.2);
      p.fill(0xffffff).circle(8, 6.2, 0.6).circle(11.5, 5.6, 0.6).circle(15, 6.4, 0.6);
      p.fill(O).rect(12, 9.2, 5.6, 1.2); // sobrancelha grossa
      p.fill(0xe8763a).poly([[17.4, 10.6], [20.4, 13], [17.4, 13.4]]); // nariz
      if (face === 'kiss') {
        p.stroke(1, O).line(13, 11.2, 16, 11.2); // olho fechado
        p.fill(O).circle(18, 15.4, 1.9);
        p.fill(0xff4f8a).circle(18.3, 15.4, 1.2); // biquinho
      } else {
        p.fill(0xffffff).circle(15, 11.4, 1.6);
        p.fill(O).circle(15.6, 11.5, 0.8);
        if (face === 'grr') {
          // Força total: dentes trincados e veia na testa.
          p.oRound(12, 13.6, 7, 3, 0.8, 0xffffff, 0.9);
          p.stroke(0.5, O).line(14, 13.6, 14, 16.6).line(16.2, 13.6, 16.2, 16.6);
          p.stroke(0.9, 0x7a2e8a).line(10, 2, 11, 3.6);
          p.fill(0xff2d3d, 0.6).circle(9, 13, 1.6);
        } else {
          // Sorrisão de comercial de pasta de dente.
          p.fill(O).poly([[11.5, 13.4], [19.6, 13], [18.4, 16.6], [12.6, 16.4]]);
          p.fill(0xffffff).poly([[12.4, 13.8], [19, 13.5], [18.6, 14.9], [12.6, 15]]);
          p.fill(0xffffff, 0.9).circle(19.4, 13.2, 0.6);
        }
      }
      shine(p, 10, 6.2, 2, 0.8);
    });
  }
  make(scene, 'maromba_tails', T.marombaTails.w, T.marombaTails.h, (p) => {
    // Pontas do nó da bandana (tremulam atrás da cabeça).
    p.fill(O).poly([[0, 2.2], [12.5, 0], [9, 3.6], [0, 5]]).poly([[0, 3.4], [11, 7.6], [7, 4.4]]);
    p.fill(NEON.pink).poly([[1, 2.8], [10.5, 1.2], [8, 3.5], [1, 4.4]]).poly([[1, 4], [9.2, 6.6], [6.4, 4.6]]);
    p.fill(0xffffff).circle(5, 3.2, 0.5).circle(8, 2.4, 0.5);
  });
  make(scene, 'maromba_uparm', T.marombaUpArm.w, T.marombaUpArm.h, (p) => {
    // Bíceps do tamanho da cabeça (desenhado apontando para baixo).
    p.oEllipse(9, 9, 15, 15, TAN, 1.3);
    p.fill(TAN_SHADE).ellipse(6, 10, 4, 10);
    p.fill(TAN_HI).ellipse(11.5, 7, 5, 6);
    shine(p, 12.4, 6, 2, 3);
    p.stroke(0.8, 0xb5532a).line(8, 4, 9.5, 9).line(9.5, 9, 8.6, 13); // veia
  });
  make(scene, 'maromba_forearm', T.marombaForearm.w, T.marombaForearm.h, (p) => {
    p.oRound(2.5, 0.5, 8, 12, 3.4, TAN, 1.2);
    p.fill(TAN_SHADE).rect(3, 3, 2, 8);
    p.fill(O).rect(2, 9, 9, 3);
    p.fill(LIME).rect(2.6, 9.5, 7.8, 2); // munhequeira
    p.oCircle(6.5, 14, 3.6, TAN, 1.2); // punho fechado
    p.fill(TAN_SHADE).rect(4.4, 13.6, 4.4, 0.6);
    shine(p, 8, 5, 1.4, 3);
  });
  make(scene, 'maromba_leg', T.marombaLeg.w, T.marombaLeg.h, (p) => {
    // Perninha de palito: o maromba pulou todos os dias de perna.
    p.oRound(2.4, 0, 2.4, 16, 1.1, TAN, 0.8);
    p.oRound(2, 13, 3.2, 6, 0.8, 0xffffff, 0.8); // meião com listras
    p.fill(0xff2d3d).rect(2, 14, 3.2, 0.7);
    p.fill(NEON.cyan).rect(2, 15.3, 3.2, 0.7);
    p.oRound(1, 18.6, 7.6, 4.4, 1.8, 0xffffff, 1); // tênis de cano alto
    p.fill(NEON.pink).rect(3, 19.6, 4, 0.9);
    p.fill(0x8e95a6).rect(1, 22.2, 7.6, 0.8);
  });

  // ── Patinador Assassino: patins a jato, polaina, viseira, cabelo absurdo ──
  const skate = (p: Pen, x: number) => {
    p.oRound(x, 45, 9, 5, 1.6, 0xffffff, 1.1); // bota do patins
    p.fill(NEON.pink).rect(x + 0.5, 46.6, 8, 1);
    p.fill(O).rect(x - 0.4, 49.6, 10, 1.4);
    p.oCircle(x + 1.6, 52, 1.6, NEON.cyan, 0.8); // rodinhas neon
    p.oCircle(x + 7, 52, 1.6, 0xffe14d, 0.8);
  };
  make(scene, 'patinador_body', T.patinadorBody.w, T.patinadorBody.h, (p) => {
    skate(p, 9);
    skate(p, 19);
    // Polainas listradas (rosa, ciano, amarelo).
    for (const x of [10.2, 20.2]) {
      p.oRound(x, 37, 6.4, 9, 2, NEON.pink, 1);
      p.fill(NEON.cyan).rect(x, 39.6, 6.4, 1.6);
      p.fill(0xffe14d).rect(x, 42.4, 6.4, 1.6);
      p.oRound(x + 1, 31, 4.6, 6, 1.6, PAL.skin, 0.9); // canela à mostra
      p.oRound(x - 0.4, 33.2, 7.2, 4.6, 2, 0x1b1724, 1); // joelheira
      p.fill(0xff2d3d).circle(x + 3.2, 35.4, 1.2);
    }
    p.oRound(10, 25, 17, 8, 3, 0x9b5cff, 1.2); // shortinho roxo
    p.fill(NEON.cyan).rect(10, 27.4, 17, 1.2);
    // Regata neon com raio.
    p.oRound(11, 14, 15, 13, 4, 0xffe14d, 1.2);
    p.fill(NEON.pink).poly([[19, 15], [15, 21], [18.6, 21], [16, 26], [22, 19], [18.6, 19], [21, 15]]);
    // Cabeça com viseira (a viseira e o cabelo são peças separadas).
    p.oRound(17.6, 11, 4.4, 4, 1.2, PAL.skin, 0.9); // pescoço
    p.oCircle(21, 7.5, 6.5, PAL.skin, 1.3);
    p.fill(O).ellipse(23, 7.4, 3, 3.4);
    p.fill(0xffffff).circle(23.5, 7, 1.2);
    p.fill(O).circle(24, 7.2, 0.6);
    // Sorrisão "RADICAL!" com aparelho nos dentes.
    p.fill(O).poly([[20, 10.4], [27, 9.6], [26, 13.4], [21, 13]]);
    p.fill(0xffffff).poly([[20.8, 10.7], [26.4, 10.1], [26, 11.6], [21, 11.8]]);
    p.fill(0x9aa3b5).rect(21.2, 11, 5, 0.5);
    p.fill(0xe8a87f).circle(27.4, 8.6, 1.4); // nariz
    p.fill(0xff7aa8, 0.8).circle(19.5, 10.2, 1.4);
    p.fill(O).rect(28, 6, 0.8, 0.8); // pinta
  });
  make(scene, 'patinador_hair', T.patinadorHair.w, T.patinadorHair.h, (p) => {
    // Juba crespa gigante (mullet + permanente), loiro com mecha rosa.
    const puffs: Array<[number, number, number]> = [
      [16, 10, 9],
      [8, 13, 7],
      [24, 9, 7.5],
      [6, 20, 6],
      [12, 22, 6],
      [20, 18, 6.5],
      [27, 14, 5],
      [9, 6, 5.5],
    ];
    for (const [x, y, r] of puffs) p.fill(O).circle(x, y, r + 1.4);
    for (const [x, y, r] of puffs) p.fill(0xffe08a).circle(x, y, r);
    p.fill(NEON.pink).circle(10, 21, 3.4).circle(6, 15, 2.6);
    p.fill(0xfff6c8).circle(14, 7, 2.6).circle(22, 7, 2);
    p.fill(0xd9b85a).circle(18, 17, 2.6).circle(9, 12, 2);
  });
  make(scene, 'patinador_visor', T.patinadorVisor.w, T.patinadorVisor.h, (p) => {
    // Viseira de plástico colorida + faixa atoalhada.
    p.fill(O).poly([[0, 2.5], [12, 1.5], [17.6, 4.6], [12, 6], [0, 5.6]]);
    p.fill(NEON.cyan).poly([[1, 3], [12, 2.2], [16, 4.6], [12, 5.2], [1, 5]]);
    p.fill(NEON.pink, 0.9).poly([[8, 2.4], [12, 2.2], [16, 4.6], [12, 5]]);
    p.fill(0xffffff, 0.6).rect(3, 3.2, 5, 0.6);
  });
  make(scene, 'patinador_gun', T.patinadorGun.w, T.patinadorGun.h, (p) => {
    p.oRound(0.5, 3.5, 9, 4, 2, PAL.skin, 1); // braço magrelo
    p.fill(0xff2d3d).rect(6.5, 3.4, 2.4, 4.2); // munhequeira
    p.oCircle(10.5, 5.5, 2.6, 0x1b1724, 1); // luva sem dedo
    p.oRound(11, 2, 13, 5, 1, NEON.pink, 1.1); // Uzi rosa-choque
    p.oRound(13, 5.6, 3.4, 5, 1, PAL.gunMetal, 0.9);
    p.oRound(17.6, 5.4, 2.4, 4.6, 0.8, PAL.gunMetal, 0.8); // pente
    p.oRound(23.4, 3, 4, 2.6, 0.6, PAL.gunMetal, 0.8);
    p.fill(0xffffff, 0.7).rect(12, 2.6, 10, 0.8);
  });

  // ── Policial de Miami Corrupto: blazer pastel, camisa aberta, Ray-Ban ──
  make(scene, 'policial_body', T.policialBody.w, T.policialBody.h, (p) => {
    p.oRound(14, 47, 8, 4.6, 1.8, 0xc8a46a, 1); // mocassim sem meia
    p.oRound(22, 47, 8, 4.6, 1.8, 0xc8a46a, 1);
    p.oRound(15, 32, 6.4, 16, 2, 0xf7f1e8, 1); // calça branca de linho
    p.oRound(22, 32, 6.4, 16, 2, 0xf7f1e8, 1);
    p.fill(O).rect(14, 31, 15, 2.6); // cinto
    p.oRound(23, 30.4, 5, 3.8, 1, PAL.gold, 0.7); // distintivo no cinto
    p.fill(0xfff3b0).circle(25.5, 32.3, 0.9);
    // Blazer rosa pastel com ombreira e mangas arregaçadas.
    p.oRound(11, 15, 21, 18, 5, 0xffb8d0, 1.4);
    p.fill(0xf29abb).round(11, 26, 21, 7, 3);
    // Camisa turquesa aberta até o umbigo, peito cabeludo e corrente.
    p.fill(O).tri(17, 15, 28, 15, 22.5, 30);
    p.fill(0x42dec4).tri(18, 15.4, 27, 15.4, 22.5, 28);
    p.fill(0xe0a477).tri(19.6, 15.4, 25.4, 15.4, 22.5, 25);
    p.fill(0x3a2116).circle(21.4, 18.6, 0.7).circle(23.4, 19.6, 0.7).circle(22.2, 21.6, 0.7).circle(23, 17.4, 0.6);
    p.stroke(0.9, PAL.gold).line(19.6, 15.6, 22.5, 20.6).line(22.5, 20.6, 25.4, 15.6);
    p.fill(PAL.gold).circle(22.5, 21, 1.2);
    p.fill(0xffd6e4).tri(16, 15, 19, 15, 20.4, 25).tri(29, 15, 26, 15, 24.8, 25); // lapelas
    // Dinheiro sujo saindo do bolso.
    p.oRound(12.6, 23, 5, 3, 0.6, 0x7bd389, 0.7);
    p.fill(0x4fa364).rect(13.4, 23.8, 3.4, 0.6);
    // Cabeça: mullet engomado, costeleta e bigodão.
    p.oRound(20, 11, 6, 5, 1.6, PAL.skin, 1); // pescoço
    p.oCircle(24, 8.5, 7.4, PAL.skin, 1.3);
    p.fill(O).poly([[16, 6], [19, 0.6], [27, 0], [31.4, 4.4], [27, 4], [24, 3.6], [20.6, 7], [21, 14], [16.6, 12]]);
    p.fill(0x3a2116).poly([[17.2, 6.4], [19.8, 1.6], [26.6, 1.2], [29.6, 4], [24, 2.8], [20, 6.6], [20.2, 12.6], [17.6, 11]]);
    p.oCircle(19.6, 9.4, 2.2, PAL.skin, 1); // orelha
    p.fill(0x4a3a30, 0.35).ellipse(26.5, 12.5, 10, 5); // barba por fazer
    p.fill(O).poly([[23.6, 11], [31, 10.6], [31.6, 13.4], [29, 12.4], [26.6, 13.4], [23.4, 13]]); // bigodão
    p.fill(0x3a2116).poly([[24.4, 11.5], [30.4, 11.2], [30.6, 12.4], [29, 11.8], [26.6, 12.6], [24.2, 12.4]]);
    p.fill(0xe8a87f).circle(31, 9.4, 1.7); // nariz
    p.fill(O).rect(26.6, 14.4, 3, 0.8); // sorrisinho torto
  });
  make(scene, 'policial_shades', T.policialShades.w, T.policialShades.h, (p) => {
    // Ray-Ban espelhado com reflexo neon.
    p.fill(O).round(0.5, 0.5, 6.4, 5, 1.6).round(7.6, 0.5, 6.4, 5, 1.6).rect(5, 1, 4, 1.2);
    p.fill(NEON.violet).round(1.4, 1.3, 4.8, 3.4, 1.2).round(8.4, 1.3, 4.8, 3.4, 1.2);
    p.fill(NEON.pink).rect(1.6, 3.6, 4.4, 1).rect(8.6, 3.6, 4.4, 1);
    p.fill(0xffffff, 0.85).rect(2.4, 1.8, 1.6, 0.8).rect(9.4, 1.8, 1.6, 0.8);
  });
  make(scene, 'policial_siren', T.policialSiren.w, T.policialSiren.h, (p) => {
    // Mochila a jato improvisada com giroflex de viatura no topo.
    p.oRound(3, 9, 14, 16, 3, 0xf7f1e8, 1.2);
    p.fill(0x1b1724).rect(3, 15, 14, 4);
    p.fill(0xffffff).round(5.5, 15.8, 9, 2.4, 1);
    p.fill(O).rect(7, 16.4, 0.6, 1.2).rect(9, 16.4, 0.6, 1.2).rect(11.4, 16.4, 0.6, 1.2);
    p.oRound(5, 24, 10, 3.4, 1, PAL.gunMetal, 1); // bocal
    p.oRound(1.5, 4, 17, 5, 1.6, 0x2a2f3a, 1.2); // base do giroflex
    p.fill(0xff2d3d).round(2.6, 1, 7, 5, 2);
    p.fill(0x2d6bff).round(10.4, 1, 7, 5, 2);
    p.fill(0xffffff, 0.7).rect(4, 1.8, 3, 1).rect(12, 1.8, 3, 1);
  });
  make(scene, 'policial_gun', T.policialGun.w, T.policialGun.h, (p) => {
    p.oRound(0.5, 3.5, 9, 5, 2.2, 0xffb8d0, 1); // manga arregaçada
    p.oRound(8, 4, 4, 4, 1.6, PAL.skin, 0.9);
    p.oCircle(13, 6.6, 2.8, PAL.skin, 1);
    p.oRound(12, 2, 17, 5, 1, 0xd6dbe6, 1.2); // pistolona cromada
    p.oRound(13.6, 5.6, 4, 6, 1, PAL.gunMetal, 1);
    p.fill(0xffffff, 0.8).rect(13, 2.6, 14, 0.9);
    p.oRound(22, 6.6, 6, 2.6, 0.8, 0x1b1724, 0.8); // mira laser embaixo do cano
    p.fill(0xff2d3d).circle(28, 7.9, 1.1);
  });
  make(scene, 'policial_donut', T.policialDonut.w, T.policialDonut.h, (p) => {
    // A rosquinha cai do bolso no abate.
    p.oCircle(7, 7, 6, 0xd9a35e, 1.2);
    p.fill(NEON.pink).circle(7, 7, 4.8);
    p.fill(0xffe14d).rect(4, 4.6, 1.6, 0.6).rect(8.6, 3.8, 0.6, 1.6).rect(9.4, 8.6, 1.6, 0.6).rect(4.6, 9, 0.6, 1.6);
    p.fill(O).circle(7, 7, 2);
    p.fill(0x272035).circle(7, 7, 1.4);
  });
}
