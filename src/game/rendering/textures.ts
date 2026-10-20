import Phaser from 'phaser';
import { NEON, PAL } from './palette';

/**
 * PLACEHOLDERS PROCEDURAIS — TEMPORÁRIOS.
 * Toda a arte do protótipo é desenhada aqui em código para destravar a Fase 0.
 * Será substituída pela pixel art definitiva (GDD §7). Nada aqui vem de outro jogo.
 *
 * As texturas são geradas em TEX_SCALE× e exibidas com escala 1/TEX_SCALE,
 * para ficarem nítidas com o canvas em resolução 2×.
 */
export const TEX_SCALE = 2;
const S = TEX_SCALE;
const O = PAL.outline;

class Pen {
  constructor(readonly g: Phaser.GameObjects.Graphics) {}
  fill(color: number, alpha = 1): this {
    this.g.fillStyle(color, alpha);
    return this;
  }
  circle(x: number, y: number, r: number): this {
    this.g.fillCircle(x * S, y * S, r * S);
    return this;
  }
  ellipse(x: number, y: number, w: number, h: number): this {
    this.g.fillEllipse(x * S, y * S, w * S, h * S);
    return this;
  }
  rect(x: number, y: number, w: number, h: number): this {
    this.g.fillRect(x * S, y * S, w * S, h * S);
    return this;
  }
  round(x: number, y: number, w: number, h: number, r: number): this {
    this.g.fillRoundedRect(x * S, y * S, w * S, h * S, r * S);
    return this;
  }
  tri(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): this {
    this.g.fillTriangle(x1 * S, y1 * S, x2 * S, y2 * S, x3 * S, y3 * S);
    return this;
  }
  poly(points: Array<[number, number]>): this {
    this.g.fillPoints(
      points.map(([x, y]) => new Phaser.Geom.Point(x * S, y * S)),
      true,
    );
    return this;
  }
  stroke(width: number, color: number, alpha = 1): this {
    this.g.lineStyle(width * S, color, alpha);
    return this;
  }
  strokeCircle(x: number, y: number, r: number): this {
    this.g.strokeCircle(x * S, y * S, r * S);
    return this;
  }
  line(x1: number, y1: number, x2: number, y2: number): this {
    this.g.lineBetween(x1 * S, y1 * S, x2 * S, y2 * S);
    return this;
  }
  // Formas com contorno cartoon: desenha a silhueta escura maior e o preenchimento por cima.
  oCircle(x: number, y: number, r: number, color: number, ow = 1.5): this {
    return this.fill(O).circle(x, y, r + ow).fill(color).circle(x, y, r);
  }
  oEllipse(x: number, y: number, w: number, h: number, color: number, ow = 1.5): this {
    return this.fill(O).ellipse(x, y, w + ow * 2, h + ow * 2).fill(color).ellipse(x, y, w, h);
  }
  oRound(x: number, y: number, w: number, h: number, r: number, color: number, ow = 1.5): this {
    return this.fill(O).round(x - ow, y - ow, w + ow * 2, h + ow * 2, r + ow).fill(color).round(x, y, w, h, r);
  }
}

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (p: Pen) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(new Pen(g));
  g.generateTexture(key, Math.ceil(w * S), Math.ceil(h * S));
  g.destroy();
}

/** Tamanho lógico (sem TEX_SCALE) de cada textura, para posicionar origens. */
export const TEX = {
  plBody: { w: 30, h: 28 },
  /** Pescoço (pivô de rotação da cabeça) em (13, 23). */
  plHead: { w: 28, h: 26, nx: 13, ny: 23 },
  /** Faixa do chapéu (onde ele assenta na cabeça) em (16, 12). */
  plHat: { w: 32, h: 15, bx: 16, by: 12 },
  plThigh: { w: 8, h: 9.5, py: 1.5 },
  plShin: { w: 8, h: 10, py: 1.5 },
  /** Tornozelo em (3.5, 2.5). */
  plShoe: { w: 13, h: 7, ax: 3.5, ay: 2.5 },
  plUpArm: { w: 7, h: 11, py: 2 },
  plForearm: { w: 8, h: 16, py: 2 },
  /** O centro do rosto fica em (22, 16) da textura do cabelo. */
  plHair: { w: 40, h: 36, cx: 22, cy: 16 },
  plArm: { w: 42, h: 20, pivotX: 5 },
  patoBody: { w: 44, h: 40 },
  patoHat: { w: 36, h: 18 },
  patoGun: { w: 22, h: 10, pivotX: 4 },
  patoBalloons: { w: 44, h: 48 },
  galinhaJetpack: { w: 22, h: 30 },
  galinhaBody: { w: 48, h: 56 },
  galinhaGlasses: { w: 22, h: 8 },
  galinhaGun: { w: 56, h: 18, pivotX: 10 },
  vacaCape: { w: 30, h: 32 },
  /** Quadril em (15, 30). */
  vacaTorso: { w: 30, h: 32, hx: 15, hy: 30 },
  /** Pescoço em (10, 21). */
  vacaHead: { w: 25, h: 22, nx: 10, ny: 21 },
  /** Base do topete em (8, 13). */
  vacaPomp: { w: 32, h: 16, bx: 8, by: 13 },
  vacaThigh: { w: 9, h: 10, py: 1.5 },
  vacaShin: { w: 12, h: 12.4, py: 1.5 },
  /** Tornozelo em (3.5, 2). */
  vacaBoot: { w: 12, h: 6, ax: 3.5, ay: 2 },
  vacaUpArm: { w: 8, h: 10, py: 3 },
  vacaForearm: { w: 11, h: 13, py: 1.5 },
  /** Pega em (4, 10). */
  vacaMic: { w: 8, h: 14, gx: 4, gy: 10 },
  pomboBody: { w: 34, h: 30 },
  pomboWing: { w: 24, h: 12 },
  pomboGun: { w: 24, h: 9, pivotX: 3 },
  porcoBody: { w: 46, h: 46 },
  porcoCase: { w: 31, h: 21, pivotX: 4 },
  pomboneBody: { w: 96, h: 92 },
  pomboneWing: { w: 60, h: 28 },
  pomboneGun: { w: 64, h: 22, pivotX: 8 },
  vacaBell: { w: 12, h: 13 },
} as const;

export function generateTextures(scene: Phaser.Scene): void {
  // ── Johnny Replay (protagonista) ─────────────────────────────────────
  // Balconista de videolocadora que se acha o rei da pista de dança dos anos
  // 80: fedora, cachinho na testa, jaqueta de lantejoulas com ombreiras, uma
  // luva brilhante, calça pega-frango, meia branca cintilante e mocassim.
  // Esqueleto com joelhos e cotovelos (ver limb.ts); o revólver é enorme.
  const sequin = 0xc9cfe0;
  const sequinMid = 0xa9b0c8;
  const sequinDark = 0x7e86a3;
  const curls = 0x1d1420;
  const glove = 0xf7f7ff;
  const pants = 0x1b1724;
  const pantsHi = 0x3a3150;
  const skinShade = 0xe0a477;
  make(scene, 'pl_hair', TEX.plHair.w, TEX.plHair.h, (p) => {
    // Cachos que pendem atrás da orelha (balançam com mola).
    const locks: Array<[number, number, number]> = [
      [14, 15, 5],
      [12, 21, 4.4],
      [13.5, 26.5, 3.8],
      [11, 30, 3],
      [17, 23, 3.4],
    ];
    for (const [x, y, r] of locks) p.fill(O).circle(x, y, r + 1.4);
    for (const [x, y, r] of locks) p.fill(curls).circle(x, y, r);
    p.fill(0x5a4466).circle(13, 13.6, 1.6).circle(11.4, 20, 1.3).circle(13, 25.6, 1.1).circle(16.4, 22, 1);
  });
  for (const [key, hoo] of [
    ['pl_head', false],
    ['pl_head_hoo', true],
  ] as const) {
    make(scene, key, TEX.plHead.w, TEX.plHead.h, (p) => {
      p.oRound(10, 18, 7, 7, 2, PAL.skin, 1.2); // pescoço
      p.oEllipse(15, 12.5, 17, 19, PAL.skin); // rosto
      p.fill(skinShade, 0.7).ellipse(10.5, 13, 7, 15); // sombra da nuca
      p.oCircle(9.4, 13.5, 2.6, PAL.skin, 1.1); // orelha
      p.fill(skinShade).circle(9.6, 13.6, 1.1);
      p.fill(curls).round(11, 6, 3, 9, 1.4); // costeleta
      // Cachinho rebelde na testa.
      p.stroke(1.8, O).g.strokeCircle(21 * S, 5.6 * S, 2.3 * S);
      p.stroke(1.1, curls).g.strokeCircle(21 * S, 5.6 * S, 2.3 * S);
      p.fill(O).tri(20.5, 7.6, 22.6, 7.6, 22, 10);
      if (hoo) {
        // Olhos espremidos ("^ ^") e boca em "HII!".
        p.stroke(1.3, O).line(17.5, 10.6, 19.4, 9.2).line(19.4, 9.2, 21.6, 10.8);
        p.stroke(1.1, O).line(17.6, 6.6, 21.4, 7.4);
        p.fill(O).ellipse(20.8, 17.6, 4.6, 5.2);
        p.fill(0xb83252).ellipse(20.8, 18.4, 2.8, 2.8);
        p.fill(PAL.warmWhite).rect(19.2, 15.6, 3.2, 0.9);
      } else {
        // Olhar de galã: pálpebra pesada, cílios e sobrancelha arqueada.
        p.fill(PAL.warmWhite).ellipse(19.5, 10.5, 4.6, 3.6);
        p.fill(O).circle(20.4, 10.8, 1.2);
        p.fill(PAL.skin).rect(17, 8.2, 5.4, 1.9);
        p.stroke(1.1, O).line(17.2, 10, 22, 9.8).line(21.8, 9.8, 23, 9.2);
        p.stroke(1, O).line(17, 6.6, 19.6, 6).line(19.6, 6, 22, 6.8);
        p.fill(O).poly([[18, 17.2], [23, 16.2], [23.4, 17.4], [18.6, 18.4]]); // sorriso de lado
        p.fill(PAL.warmWhite).poly([[19, 17.2], [22.6, 16.5], [22.7, 17.1], [19.2, 17.7]]);
      }
      p.fill(O).poly([[22.5, 9.8], [26.8, 14.4], [23, 15]]); // nariz fino e empinado
      p.fill(0xf0c09a).poly([[23, 10.8], [25.6, 14], [23.4, 14.2]]);
      p.fill(0xff7aa8, 0.85).circle(16.4, 15.4, 2); // bochecha
      p.fill(0xffffff, 0.5).circle(18.6, 4.8, 1.2); // brilho na testa
    });
  }
  make(scene, 'pl_hat', TEX.plHat.w, TEX.plHat.h, (p) => {
    // Fedora preto com faixa branca; aba fina e caída na frente.
    p.fill(O).poly([[0.5, 11.4], [31.5, 10], [31, 13.6], [2, 14]]);
    p.fill(0x18141f).poly([[1.6, 11.8], [30.4, 10.8], [30, 12.6], [2.6, 13]]);
    p.fill(O).round(7, 0.5, 18, 11.5, 5);
    p.fill(0x221c2c).round(8, 1.5, 16, 9.6, 4.4);
    p.fill(0x3a3150).tri(12, 2, 20, 2, 16, 5.4); // vinco
    p.fill(0x2e2740).round(9, 2.5, 4, 6, 2);
    p.fill(PAL.warmWhite).rect(8, 7.6, 16, 2.4);
    p.fill(0xd6dbe6).rect(8, 9.2, 16, 0.8);
    p.fill(0xffffff, 0.55).rect(19, 2.6, 3.4, 1.1);
  });
  make(scene, 'pl_body', TEX.plBody.w, TEX.plBody.h, (p) => {
    // Cintura da calça (aparece abaixo da jaqueta).
    p.oRound(8, 19, 14, 9, 3, pants, 1.2);
    // Jaqueta de lantejoulas com ombreira pontuda.
    p.oRound(6, 3, 18, 20, 5, sequin);
    p.oRound(1.5, 1.5, 11, 6.5, 3, sequin, 1.2);
    p.fill(sequinMid).round(6, 15, 18, 8, 4);
    p.fill(sequinDark).round(6, 19, 18, 4, 2);
    p.fill(O).tri(12, 3, 21, 3, 16.5, 15.5);
    p.fill(0x14101c).tri(13, 3.6, 20, 3.6, 16.5, 14); // camisa preta
    p.fill(PAL.skin).tri(15, 3.6, 18.4, 3.6, 16.6, 6.6);
    p.fill(0xe6e9f4).tri(12, 3, 14.6, 3, 15.2, 14.2).tri(21, 3, 18.6, 3, 18.2, 14.2); // lapelas
    // Lantejoulas em xadrez: claras, médias e escuras.
    for (let y = 5; y < 22; y += 2.2) {
      for (let x = 7; x < 24; x += 2.2) {
        if (x > 11.5 && x < 21.5 && y < 15.5) continue;
        const k = (Math.round(x * 3 + y * 7) % 3 + 3) % 3;
        p.fill(k === 0 ? 0xffffff : k === 1 ? sequinDark : 0x9fe8ff, k === 0 ? 0.9 : 0.7).circle(x, y, 0.6);
      }
    }
    p.fill(0xffffff, 0.22).poly([[7, 10], [11, 4], [13, 4], [8, 14]]); // reflexo diagonal
    p.fill(NEON.pink).rect(2.5, 5.5, 9, 1.6); // braçadeira neon
    p.fill(O).rect(8, 21, 14, 2.6); // cinto
    p.oRound(13.4, 20.6, 4, 3.4, 0.8, PAL.gold, 0.6);
  });
  make(scene, 'pl_thigh', TEX.plThigh.w, TEX.plThigh.h, (p) => {
    p.oRound(1, 0, 6, 9, 2.6, pants, 1);
    p.fill(pantsHi).rect(4.6, 1.5, 0.9, 6);
  });
  make(scene, 'pl_shin', TEX.plShin.w, TEX.plShin.h, (p) => {
    p.oRound(1.6, 3.6, 4.8, 6, 1.4, glove, 0.9); // meia branca cintilante
    p.fill(0x7fe7ff).circle(3, 5.6, 0.5).circle(5, 7.8, 0.5);
    p.fill(0xffffff).circle(4.4, 5, 0.6);
    p.oRound(1, 0, 6, 5, 2.2, pants, 1); // barra pega-frango
    p.fill(pantsHi).rect(4.4, 1, 0.9, 3);
  });
  make(scene, 'pl_shoe', TEX.plShoe.w, TEX.plShoe.h, (p) => {
    // Mocassim preto envernizado; tornozelo em (3.5, 2.5), bico para a frente.
    p.fill(O).poly([[0.5, 2.5], [6, 0.8], [10.5, 2], [12.8, 4.2], [12.4, 6.4], [0.6, 6.4]]);
    p.fill(0x0d0b12).poly([[1.4, 3], [6, 1.8], [10.2, 2.9], [11.8, 4.5], [11.4, 5.4], [1.4, 5.4]]);
    p.fill(0xffffff, 0.7).poly([[6, 2.4], [9.6, 3.2], [8.6, 3.6], [5.6, 3]]);
    p.fill(0x6b7385).rect(1, 5.6, 11.6, 0.8); // sola
  });
  make(scene, 'pl_uparm', TEX.plUpArm.w, TEX.plUpArm.h, (p) => {
    p.oRound(1, 0, 5, 10, 2.4, sequin, 1);
    p.fill(0xffffff, 0.9).circle(2.6, 3, 0.6).circle(4.4, 6.4, 0.6);
    p.fill(sequinDark, 0.8).circle(4.2, 2.4, 0.5).circle(2.6, 8, 0.5);
  });
  make(scene, 'pl_forearm', TEX.plForearm.w, TEX.plForearm.h, (p) => {
    p.oRound(1.2, 0, 5.6, 8, 2.4, sequin, 1);
    p.fill(0xffffff, 0.9).circle(3, 3, 0.6).circle(5, 5.6, 0.6);
    p.fill(PAL.warmWhite).rect(1.4, 7, 5.2, 1.6); // punho da camisa
    p.oRound(1, 8.4, 6, 5, 2.2, glove, 1); // luva brilhante
    p.oRound(3, 12, 2.4, 4, 1.1, glove, 0.8); // dedo indicador esticado
    p.fill(0x7fe7ff).circle(2.6, 10, 0.55).circle(5.2, 11.4, 0.55);
    p.fill(0xffffff).circle(4.2, 9.6, 0.6);
  });
  make(scene, 'pl_arm', TEX.plArm.w, TEX.plArm.h, (p) => {
    // Pivô no ombro (x=5). Manga de lantejoula + luva + revólver gigante.
    p.oCircle(5, 9, 4.6, sequin, 1.1); // ombreira da frente
    p.fill(0xffffff, 0.9).circle(4, 7, 0.7);
    p.oRound(5, 7.6, 10, 4.6, 2.2, sequin, 1);
    p.fill(0xffffff, 0.85).circle(8, 9, 0.6).circle(11.6, 10.4, 0.6);
    p.fill(sequinDark, 0.8).circle(10, 8.6, 0.5);
    p.fill(PAL.warmWhite).rect(13.2, 7.6, 1.6, 4.6);
    p.oRound(13.5, 7.5, 5, 6, 1.6, glove, 1);
    p.fill(0x7fe7ff).circle(15, 9, 0.6).circle(17, 11.4, 0.6);
    p.oRound(15, 10, 6, 8, 1.6, 0x8a5a2b, 1.2); // cabo de madeira
    p.fill(0xb07a42).rect(16.5, 11, 1.2, 5.5);
    p.oRound(16, 3, 11, 9, 2.6, 0xc4cad6, 1.3); // tambor enorme
    p.fill(0x8e95a6).rect(18, 5, 1.4, 5).rect(21, 5, 1.4, 5).rect(24, 5, 1.4, 5);
    p.oRound(25, 3.6, 15, 5.4, 1.2, 0xc4cad6, 1.3); // cano comprido
    p.fill(0xffffff, 0.75).rect(17, 3.8, 22, 1.1);
    p.oRound(37.5, 1.6, 2.2, 2.6, 0.6, 0xc4cad6, 0.8); // massa de mira
    p.fill(O).rect(39.6, 4.4, 1.4, 3.8); // boca do cano
    p.fill(NEON.pink).rect(26, 8.4, 11, 0.7);
  });

  // ── Elenco de vilões: paródias de filmes de ação e da Miami dos anos 80 ──
  // As chaves de textura seguem os IDs estáveis dos inimigos (pato_*, galinha_*…).
  const skinB = 0xe0a477;
  const stubble = 0x4a3a30;
  const leather = 0x26222e;
  const leatherHi = 0x3d3848;

  // ── Capanga Vice (id pato_pistoleiro): terno pastel, paraquedas neon ──
  make(scene, 'pato_body', TEX.patoBody.w, TEX.patoBody.h, (p) => {
    p.oRound(16, 27, 6, 10, 2, 0xf2f0ea, 1); // calça de linho
    p.oRound(24, 27, 6, 10, 2, 0xf2f0ea, 1);
    p.oRound(14.5, 35, 8, 3.6, 1.6, 0x8a5a2b, 1); // mocassim sem meia
    p.oRound(23.5, 35, 8, 3.6, 1.6, 0x8a5a2b, 1);
    p.oRound(11, 15, 23, 15, 5, 0x7fe0d4); // blazer turquesa pastel
    p.fill(0x5cc4b8).round(11, 24, 23, 6, 3);
    p.fill(O).tri(18.5, 15, 29, 15, 23.5, 27);
    p.fill(0xff7ab8).tri(19.6, 15.6, 27.8, 15.6, 23.5, 25.5); // camiseta rosa
    p.fill(0xa8f0e8).tri(17, 15, 20, 15, 21, 24).tri(30, 15, 27, 15, 26, 24); // lapelas
    p.oCircle(27, 10, 8.5, PAL.skin); // cabeça
    p.oCircle(21, 11, 2.4, PAL.skin, 1); // orelha
    p.fill(stubble, 0.35).ellipse(29.5, 15, 12, 6); // barba por fazer
    p.fill(O).round(24.5, 6.6, 11.5, 4.4, 1.6); // Ray-Ban
    p.fill(0x22e6ff, 0.8).rect(26, 7.4, 3.6, 1.2).rect(31, 7.4, 3.6, 1.2);
    p.fill(0xe8a87f).circle(35, 11.5, 1.8); // nariz
    p.fill(O).round(29.5, 14.6, 5, 1.2, 0.6); // sorrisinho de lado
    p.fill(PAL.gold).circle(21, 13.5, 0.9); // brinco
  });
  make(scene, 'pato_hat', TEX.patoHat.w, TEX.patoHat.h, (p) => {
    // Topete engomado com gel (fica por cima da cabeça).
    p.fill(O).poly([[6, 16], [8, 8], [16, 3], [27, 2], [33, 6], [30, 10], [24, 9], [26, 16]]);
    p.fill(0x3a2116).poly([[7.5, 15], [9.5, 8.5], [16.5, 4.4], [26.5, 3.4], [31, 6.2], [28.6, 8.6], [22.5, 8], [24.5, 15]]);
    p.fill(0x7a4a2c).poly([[12, 7], [20, 4.4], [26, 4.2], [18, 6.4]]);
  });
  make(scene, 'pato_gun', TEX.patoGun.w, TEX.patoGun.h, (p) => {
    p.oRound(0.5, 3, 6, 4, 2, 0x7fe0d4, 1); // manga
    p.oCircle(7, 5, 2.6, PAL.skin, 1);
    p.oRound(8, 2, 11, 4, 1, 0xd6dbe6, 1); // pistolinha cromada
    p.oRound(8.6, 4.5, 3, 4.4, 1, PAL.gunMetal, 1);
    p.fill(0xffffff, 0.8).rect(9, 2.6, 9, 0.8);
  });
  make(scene, 'pato_balloons', TEX.patoBalloons.w, TEX.patoBalloons.h, (p) => {
    // Paraquedas listrado em neon (desce flutuando e fica pendurado no alto).
    p.stroke(0.9, O).line(4, 18, 22, 46).line(15, 20, 22, 46).line(29, 20, 22, 46).line(40, 18, 22, 46);
    p.fill(O).ellipse(22, 16, 44, 30);
    p.fill(O).rect(0, 16, 44, 4);
    const stripes = [NEON.pink, 0xffe14d, NEON.cyan, NEON.pink, 0xffe14d, NEON.cyan];
    for (let i = 0; i < stripes.length; i++) {
      p.fill(stripes[i] as number).poly([
        [1.5 + i * 6.8, 17],
        [22, 2.5],
        [22, 2.5],
        [1.5 + (i + 1) * 6.8, 17],
      ]);
    }
    p.fill(0x1a0630, 0.25).rect(1.5, 14, 41, 3);
    p.fill(0xffffff, 0.45).ellipse(14, 9, 8, 4);
  });

  // ── Exterminador de Aluguel (id galinha_rambo): ciborgue de academia ──
  make(scene, 'galinha_body', TEX.galinhaBody.w, TEX.galinhaBody.h, (p) => {
    p.oRound(14, 46, 8, 9, 1.5, 0x1b1820, 1); // coturnos
    p.oRound(25, 46, 8, 9, 1.5, 0x1b1820, 1);
    p.oEllipse(23, 36, 34, 28, leather); // colete de couro
    p.fill(0x8a8f9c).ellipse(27, 37, 16, 18); // regata cinza
    p.fill(0x6f7480).rect(19, 43, 16, 1.5);
    p.fill(leatherHi).ellipse(14, 32, 8, 14);
    p.fill(0xc0c4cc).circle(13, 30, 0.9).circle(13, 35, 0.9).circle(14, 40, 0.9); // tachinhas
    p.fill(O).rect(10, 47, 28, 3); // cinto de balas
    p.fill(PAL.brass);
    for (let x = 12; x < 36; x += 3) p.rect(x, 47.5, 1.6, 2);
    // Cabeça quadrada de flat-top, queixo de bigorna.
    p.oRound(17, 6, 20, 22, 4, skinB);
    p.fill(O).rect(16, 3, 22, 6);
    p.fill(0x2a1a12).rect(17, 4, 20, 4.5);
    p.fill(stubble, 0.4).round(24, 20, 13, 8, 3);
    p.oCircle(17, 16, 2.6, skinB, 1); // orelha
    // Meia cara de metal (o ciborgue apareceu depois do tiro).
    p.fill(0xb8c0cc).poly([[31, 9], [37, 9], [37, 22], [32, 19]]);
    p.stroke(0.8, 0x6b7385).line(32, 13, 37, 13).line(33, 17, 37, 17);
    p.fill(O).round(28, 23, 9, 2, 1); // boca reta
    p.fill(0xc8885c).rect(35, 15, 3, 4); // nariz
    p.oEllipse(14, 34, 15, 13, skinB); // bíceps gigante
    p.fill(0xf0b88c).ellipse(13, 32, 6, 4);
    p.fill(0x22e6ff).rect(8.5, 35, 11, 1.6); // tatuagem "MÃE" em neon
  });
  make(scene, 'galinha_glasses', TEX.galinhaGlasses.w, TEX.galinhaGlasses.h, (p) => {
    // Óculos escuros com uma lente quebrada: atrás, o olho vermelho do ciborgue.
    p.fill(O).round(1, 1, 9, 6, 2).round(11, 1, 9, 6, 2).rect(8, 2, 5, 1.5);
    p.fill(0x5b6b8c).rect(3, 2, 3, 1.2);
    p.fill(0xff2d3d).circle(15.5, 4, 2.2);
    p.fill(0xffd0d0).circle(15, 3.5, 0.8);
    p.stroke(0.6, 0x9aa3b5).line(11.5, 1.5, 14, 4).line(20, 6.5, 17, 4);
  });
  for (const [key, offset] of [
    ['galinha_gun_a', 0],
    ['galinha_gun_b', 2],
  ] as const) {
    make(scene, key, TEX.galinhaGun.w, TEX.galinhaGun.h, (p) => {
      p.oRound(2, 6, 10, 8, 3, skinB, 1); // punho fechado
      p.fill(O).rect(4, 8, 6, 0.6).rect(4, 10.5, 6, 0.6);
      p.oRound(8, 3, 24, 12, 3, PAL.gunMetal, 1.2); // corpo da metralhadora
      p.fill(NEON.pink).rect(12, 5, 4, 8); // faixa neon
      p.fill(NEON.cyan).rect(16, 5, 2, 8);
      p.oRound(31, 4, 22, 10, 2, 0x2a2f3a, 1.2); // feixe de canos
      p.fill(PAL.gunLight);
      for (let i = 0; i < 3; i++) p.rect(32, 5.2 + ((i * 3 + offset) % 9), 21, 1.2);
      p.oRound(50, 3, 5, 12, 1.5, PAL.gunMetal, 1);
      p.oRound(14, 13, 8, 5, 1.5, PAL.brass, 1); // caixa de munição
    });
  }
  make(scene, 'galinha_jetpack', TEX.galinhaJetpack.w, TEX.galinhaJetpack.h, (p) => {
    // Jetpack de garagem: dois extintores e fita adesiva rosa.
    p.oRound(1, 2, 9, 22, 4, 0xe8283c, 1.2);
    p.oRound(11, 2, 9, 22, 4, 0xe8283c, 1.2);
    p.fill(NEON.pink).rect(1.5, 10, 18, 3);
    p.fill(0xffffff, 0.4).rect(3, 4, 2, 14).rect(13, 4, 2, 14);
    p.oRound(2.5, 23, 6, 5, 1, PAL.gunMetal, 1);
    p.oRound(12.5, 23, 6, 5, 1, PAL.gunMetal, 1);
  });

  // ── Rei do Topete (id vaca_loca): imitador do rei do rock que atropela ──
  // Macacão branco de Las Vegas cravejado de strass, capa com forro vermelho,
  // calça boca de sino, bota branca, topete separado (balança com mola),
  // costeletas, óculos dourados e microfone cromado. Esqueleto com IK.
  const suit = 0xfbf8ff;
  const suitShade = 0xdcd6ec;
  const ruby = 0xff2d3d;
  const pomade = 0x0f0b18;
  const gem = (p: Pen, x: number, y: number, r = 1.1, core: number = ruby) => {
    p.fill(PAL.gold).circle(x, y, r);
    p.fill(core).circle(x, y, r * 0.5);
    p.fill(0xffffff, 0.9).circle(x - r * 0.35, y - r * 0.35, r * 0.25);
  };
  make(scene, 'vaca_cape', TEX.vacaCape.w, TEX.vacaCape.h, (p) => {
    // Capa presa nos ombros (topo) que se abre em leque; forro vermelho na borda.
    p.fill(O).poly([[9, 0], [21, 0], [29, 31], [1, 31]]);
    p.fill(ruby).poly([[10, 1], [20, 1], [27.6, 30], [2.4, 30]]);
    p.fill(suit).poly([[11, 1], [20, 1], [25, 30], [6, 30]]);
    p.fill(suitShade).poly([[11, 1], [14, 1], [11, 30], [6, 30]]);
    p.fill(PAL.gold).rect(6, 27.6, 19.2, 2.4); // barra dourada
    for (const [x, y] of [[15, 7], [13, 15], [19, 13], [16, 22], [21, 21], [11, 24]] as const) gem(p, x, y, 1.2, 0x22e6ff);
    // Águia dourada estilizada no meio da capa.
    p.fill(PAL.gold).poly([[11, 17], [16, 15], [21, 17], [17.5, 18.4], [16, 21], [14.5, 18.4]]);
  });
  make(scene, 'vaca_torso', TEX.vacaTorso.w, TEX.vacaTorso.h, (p) => {
    // Quadril em (15, 30); ombros no alto. Gola alta e decote até o umbigo.
    p.oRound(5, 6, 20, 25, 7, suit);
    p.fill(suitShade).round(5, 22, 20, 9, 4).rect(5, 8, 3, 18);
    p.fill(O).tri(11.5, 6, 21.5, 6, 16.5, 20);
    p.fill(PAL.skin).tri(12.8, 6.6, 20.2, 6.6, 16.5, 18.4); // peito à mostra
    p.fill(0x3a2116, 0.6).circle(15.6, 10, 0.7).circle(17.4, 12.4, 0.7).circle(16.4, 8.4, 0.6).circle(15.4, 14, 0.6);
    p.fill(PAL.gold).rect(16, 9.6, 0.7, 4).circle(16.3, 14.6, 1.2); // correntinha com medalha
    p.oRound(6.5, 0, 7, 9, 2, suit, 1.2).oRound(19, 0, 7, 9, 2, suit, 1.2); // gola alta
    p.fill(PAL.gold).rect(7, 1, 6, 1).rect(19.5, 1, 6, 1);
    for (const [x, y] of [[8, 12], [24, 12], [8.6, 18], [23.6, 18], [11, 4.6], [22, 4.6]] as const) gem(p, x, y);
    p.oRound(4.6, 21, 21, 5, 1.6, PAL.gold, 1); // cinturão de campeão
    p.oRound(12, 19.8, 9, 7.4, 2.4, 0xffe14d, 1);
    gem(p, 16.5, 23.5, 2, ruby);
    for (const x of [7, 9.6, 23.4, 26]) p.fill(PAL.gold).rect(x - 0.4, 26, 0.8, 3.4); // correntinhas do cinto
    p.fill(0xffffff, 0.75).rect(21.6, 9, 1.2, 9); // brilho do cetim
  });
  const head = (key: string, uh: boolean) =>
    make(scene, key, TEX.vacaHead.w, TEX.vacaHead.h, (p) => {
      // Pescoço em (10, 21). Topete é peça separada (vaca_pomp).
      p.oRound(3.5, 3, 17, 17, 7, PAL.skin);
      p.fill(0xe8a87f, 0.6).circle(9, 15.5, 2.6); // bochecha
      p.fill(pomade).poly([[3, 3], [10, 1.6], [14, 3.4], [7, 5.4], [6, 13], [3.4, 12]]); // cabelo de trás
      p.fill(pomade).round(5, 8, 3.6, 10.6, 1.6); // costeleta enorme
      p.fill(pomade).tri(5, 18.4, 8.6, 18.4, 7.4, 20.4);
      p.fill(O).round(11, 7.6, 12, 4.8, 2); // óculos dourados
      p.fill(PAL.gold).round(11.7, 8.2, 5, 3.6, 1.4).round(17.4, 8.2, 5, 3.6, 1.4);
      p.fill(0xfff1a8).rect(12.4, 8.8, 2, 1).rect(18, 8.8, 2, 1);
      p.fill(O).rect(14.4, 6.4, 6, 1); // sobrancelha arqueada
      p.oCircle(22.4, 12.6, 1.8, 0xe8a87f, 0.8); // nariz
      if (uh) {
        // "Uh-huh!": lábio torto lá em cima e boca aberta.
        p.fill(O).poly([[15, 15.6], [21.6, 14.2], [22, 17.6], [17, 18.6]]);
        p.fill(0x7a1830).poly([[16, 16], [21, 15], [21.2, 17], [17.4, 17.8]]);
        p.fill(0xffffff).rect(18, 15.2, 3, 0.9);
      } else {
        p.fill(O).poly([[15.4, 16.6], [21.6, 15.4], [22, 17.2], [17.4, 18]]); // beicinho torto
        p.fill(0xd65a7a).poly([[16.4, 16.8], [21, 16], [21.2, 16.8], [17.6, 17.4]]);
      }
    });
  head('vaca_head', false);
  head('vaca_head_uh', true);
  make(scene, 'vaca_pomp', TEX.vacaPomp.w, TEX.vacaPomp.h, (p) => {
    // Topete monumental com brilhantina; base em (8, 13) assenta na testa.
    p.fill(O).poly([[2, 14], [2, 6], [8, 1], [19, -0.2], [28, 1.4], [30.5, 5.6], [26, 8.6], [20, 7], [13, 10.4], [10, 15]]);
    p.fill(pomade).poly([[3.4, 13.2], [3.6, 6.6], [8.6, 2.4], [19, 1.2], [27.2, 2.6], [29, 5.4], [25.6, 7.2], [19.6, 5.6], [12.4, 9], [9.4, 13.4]]);
    p.fill(0x4b5a9c, 0.9).poly([[9, 3.6], [19, 2.4], [25, 3.4], [17, 4.2], [10.6, 6]]); // reflexo azul
    p.fill(0x9fb0ff, 0.8).poly([[12, 3.4], [18, 2.8], [16, 3.6]]);
    p.fill(pomade).poly([[26, 6.6], [29.4, 9.6], [27.6, 11.6], [27.4, 8.6]]); // mechinha rebelde
  });
  make(scene, 'vaca_thigh', TEX.vacaThigh.w, TEX.vacaThigh.h, (p) => {
    p.oRound(1, 0, 7, 10, 3, suit, 1);
    p.fill(PAL.gold).rect(5.6, 1, 1, 8);
  });
  make(scene, 'vaca_shin', TEX.vacaShin.w, TEX.vacaShin.h, (p) => {
    // Boca de sino que abre em leque, com gomo vermelho e strass.
    p.fill(O).poly([[2.4, 0], [9.6, 0], [12, 12.4], [0, 12.4]]);
    p.fill(suit).poly([[3.2, 0.7], [8.8, 0.7], [11, 11.6], [1, 11.6]]);
    p.fill(ruby).poly([[5.4, 5], [6.6, 5], [8, 11.6], [4, 11.6]]);
    p.fill(PAL.gold).rect(1, 10.6, 10, 1);
    gem(p, 6, 3, 0.9, 0x22e6ff);
    gem(p, 2.8, 9, 0.8);
    gem(p, 9.2, 9, 0.8);
  });
  make(scene, 'vaca_boot', TEX.vacaBoot.w, TEX.vacaBoot.h, (p) => {
    // Bota branca de bico fino e salto dourado; tornozelo em (3.5, 2).
    p.fill(O).poly([[0.4, 1], [5, 0.4], [9, 2.4], [11.6, 4.4], [11, 5.6], [0.4, 5.6]]);
    p.fill(suit).poly([[1.2, 1.6], [5, 1.2], [8.6, 3], [10.6, 4.6], [1.2, 4.6]]);
    p.fill(PAL.gold).rect(0.6, 4.4, 3, 1.2);
    p.fill(0xffffff).rect(5, 2, 2.4, 0.8);
  });
  make(scene, 'vaca_uparm', TEX.vacaUpArm.w, TEX.vacaUpArm.h, (p) => {
    p.oCircle(4, 3, 3.4, suit, 1); // ombro
    p.oRound(1, 1, 6, 9, 2.6, suit, 1);
    gem(p, 4, 5, 0.8, 0x22e6ff);
  });
  make(scene, 'vaca_forearm', TEX.vacaForearm.w, TEX.vacaForearm.h, (p) => {
    // Manga boca de sino com franja dourada; mão com anelzão.
    p.fill(O).poly([[3, 0], [8, 0], [10.6, 8], [0.4, 8]]);
    p.fill(suit).poly([[3.6, 0.6], [7.4, 0.6], [9.8, 7.4], [1.2, 7.4]]);
    for (const x of [1.4, 3.4, 5.4, 7.4, 9.2]) p.fill(PAL.gold).rect(x, 7.4, 0.9, 2.4);
    p.oCircle(5.5, 10, 2.6, PAL.skin, 0.9);
    p.oRound(4.6, 11, 1.9, 2.8, 0.8, PAL.skin, 0.6); // dedo
    gem(p, 4, 9.2, 0.9);
  });
  make(scene, 'vaca_mic', TEX.vacaMic.w, TEX.vacaMic.h, (p) => {
    // Microfone cromado retrô; pega em (4, 10), cabeça para cima.
    p.oRound(2.6, 6, 2.8, 8, 1, 0x9aa3b8, 0.9);
    p.oRound(0.6, 0.4, 6.8, 7, 3, 0xcfd6e6, 1);
    p.fill(0x6b7385).rect(1.2, 2.4, 5.6, 0.7).rect(1.2, 4, 5.6, 0.7);
    p.fill(0xffffff).rect(1.8, 1.2, 1.2, 4.6);
  });
  make(scene, 'vaca_bell', TEX.vacaBell.w, TEX.vacaBell.h, (p) => {
    // Lenço de seda vermelho no pescoço (pronto para jogar na plateia).
    p.fill(O).poly([[2, 0], [10, 0], [8, 6], [9.5, 12.5], [6, 9], [2.5, 12.5], [4, 6]]);
    p.fill(0xff2d3d).poly([[3, 0.8], [9, 0.8], [7.2, 6], [8.2, 11], [6, 8.2], [3.8, 11], [4.8, 6]]);
    p.fill(0xff8a92).rect(4, 1.4, 4, 1);
  });

  // ── Ninja de Asa-Delta (id pombo_mafioso): esquadrilha de ninjas com Uzi ──
  make(scene, 'pombo_body', TEX.pomboBody.w, TEX.pomboBody.h, (p) => {
    p.oRound(11, 23, 4, 6, 1.4, 0x15131f, 0.8); // pernas de tabi
    p.oRound(18, 23, 4, 6, 1.4, 0x15131f, 0.8);
    p.oEllipse(16, 18, 20, 15, 0x1c1a2a); // gi preto
    p.fill(0x2e2a44).ellipse(13, 16, 8, 6);
    p.fill(0x39ff88).rect(7, 19, 18, 2.2); // faixa verde-neon
    p.oCircle(21, 8, 6.5, 0x1c1a2a); // capuz
    p.fill(PAL.skin).round(18.5, 6, 9, 3.4, 1.4); // fresta dos olhos
    p.fill(O).rect(21, 6.8, 1.6, 1.6).rect(25, 6.8, 1.6, 1.6);
    p.fill(O).rect(19.5, 5.2, 4, 0.8).rect(24, 5.6, 3.6, 0.8); // sobrancelhas bravas
  });
  make(scene, 'pombo_wing', TEX.pomboWing.w, TEX.pomboWing.h, (p) => {
    // Asa-delta de brinquedo, em neon (presa nas costas).
    p.fill(O).poly([[1, 6], [23, 0.5], [21, 6], [23, 11.5]]);
    p.fill(NEON.pink).poly([[3, 6], [21, 2], [19.4, 6], [21, 10]]);
    p.fill(0xffe14d).poly([[3, 6], [12, 4], [12, 8]]);
    p.stroke(0.8, O).line(3, 6, 21, 6);
  });
  make(scene, 'pombo_hat', 18, 9, (p) => {
    // Pontas da faixa ninja tremulando para trás.
    p.fill(O).poly([[16, 3], [1, 0.5], [3, 3.8], [16, 5]]).poly([[16, 4.5], [2, 7.4], [5, 8.6], [16, 6]]);
    p.fill(NEON.pink).poly([[15.5, 3.6], [2.6, 1.6], [3.8, 3.4], [15.5, 4.5]]).poly([[15.5, 5], [3.6, 7.6], [5, 8], [15.5, 5.7]]);
  });
  make(scene, 'pombo_gun', TEX.pomboGun.w, TEX.pomboGun.h, (p) => {
    p.oCircle(3, 4.5, 2.6, 0x1c1a2a, 0.8); // luva preta
    p.oRound(5, 1.5, 13, 4.5, 1, 0x2a2f3a, 1); // Uzi
    p.oRound(9, 4.5, 3.4, 4.4, 0.8, 0x2a2f3a, 0.8); // pente
    p.oRound(17, 2.5, 6, 2.4, 0.6, PAL.gunMetal, 0.8);
    p.fill(0x39ff88).rect(6, 2.2, 3, 0.8);
  });

  // ── Tio do Cassino (id porco_executivo): mafioso de cassino decadente ──
  // Terno verde-limão xadrez, barriga estourando a camisa, correntes de ouro,
  // anel em todo dedo, charuto aceso e um caça-níquel que cospe moedas.
  const suitLime = 0x9be830;
  const suitLimeDark = 0x6fb21c;
  const checks = NEON.pink;
  make(scene, 'porco_body', TEX.porcoBody.w, TEX.porcoBody.h, (p) => {
    // Sapato bicolor de malandro.
    p.oRound(13, 40, 8, 5, 1.8, 0xf7f1e8, 1).oRound(25, 40, 8, 5, 1.8, 0xf7f1e8, 1);
    p.fill(0x6b3a1e).rect(17, 40.6, 3.6, 3.8).rect(29, 40.6, 3.6, 3.8);
    // Calça do terno.
    p.oRound(15, 32, 6, 9, 1.5, suitLime, 1).oRound(25, 32, 6, 9, 1.5, suitLime, 1);
    p.fill(checks, 0.8).rect(15, 35, 6, 0.7).rect(25, 35, 6, 0.7).rect(17.6, 32, 0.7, 9).rect(27.6, 32, 0.7, 9);
    // Paletó aberto.
    p.oEllipse(22, 27, 34, 23, suitLime);
    p.fill(suitLimeDark).ellipse(15, 30, 14, 16);
    p.fill(checks, 0.75);
    for (const x of [9, 14, 19, 26, 31, 36]) p.rect(x, 17, 0.8, 21);
    for (const y of [21, 26, 31, 36]) p.rect(5.5, y, 33, 0.8);
    // Camisa de oncinha estourando os botões e o barrigão pra fora.
    p.fill(O).poly([[17, 16.5], [30, 16.5], [36, 30], [31, 39], [21, 39], [18, 28]]);
    p.fill(0xffc857).poly([[18.2, 17.4], [29.4, 17.4], [34.8, 29.6], [30.4, 37.8], [21.6, 37.8], [19, 28]]);
    p.fill(0x6b3a1e, 0.85);
    for (const [x, y] of [[21, 20], [26, 19.6], [23.6, 24], [28.4, 23.4], [31.4, 27], [21.6, 28.4]] as const) p.circle(x, y, 0.9);
    p.oEllipse(26, 34.5, 21, 12, PAL.skin, 1.2); // barrigão escapando da camisa
    p.fill(0xe0a477).ellipse(26, 37.6, 17, 4.6);
    p.fill(0x3a2116, 0.5).circle(22, 33, 0.5).circle(29, 32.6, 0.5).circle(25, 31.8, 0.5);
    p.fill(O).ellipse(26.5, 34.6, 1.8, 2.2); // umbigo
    p.fill(PAL.warmWhite).circle(22.4, 30.4, 0.9).circle(24, 27, 0.9); // botões que sobreviveram
    p.fill(PAL.warmWhite).circle(38.5, 25, 0.9); // botão voando
    // Peito cabeludo com três correntes de ouro.
    p.fill(PAL.skin).tri(21, 16.4, 28.6, 16.4, 25, 21.6);
    p.fill(0x3a2116, 0.7).circle(23.4, 17.6, 0.6).circle(25.6, 18.4, 0.6).circle(24.6, 19.8, 0.5);
    p.stroke(0.8, PAL.gold).line(21.6, 17, 25, 20.6).line(25, 20.6, 28.4, 17);
    p.stroke(0.7, 0xffe14d).line(20.6, 17, 25, 23).line(25, 23, 29.4, 17);
    p.fill(PAL.gold).circle(25, 24, 1.6);
    p.fill(O).rect(24.5, 23.2, 1, 1.6); // medalhão de cifrão
    // Lapelas largas e lenço no bolso.
    p.fill(suitLimeDark).poly([[16, 16.5], [20.6, 16.5], [19.6, 27], [15.6, 21]]);
    p.fill(NEON.pink).poly([[9, 20.4], [12.4, 20.4], [11.6, 18], [10.4, 19.2]]);
    // Cabeção: careca brilhando, cabelinho dos lados, bigode de vassoura.
    p.oCircle(25, 10, 10, PAL.skin);
    p.oEllipse(24, 18, 15, 6, PAL.skin, 1); // papada
    p.fill(0xffffff, 0.65).ellipse(23, 2.6, 6, 2.4);
    p.fill(0x8a8f9c).poly([[14.6, 7], [17.6, 5.4], [17, 13.6], [14.8, 12.6]]); // cabelo grisalho
    p.stroke(0.6, 0x5a5f6c).line(17, 3.4, 30, 1.6).line(17.4, 2.4, 29, 0.8); // fios do pente-e-vem
    p.fill(O).round(23.6, 6.2, 11.6, 4.8, 2); // óculos rosados
    p.fill(0xff7ab8).round(24.4, 6.8, 4.6, 3.4, 1.2).round(30, 6.8, 4.6, 3.4, 1.2);
    p.fill(0xffffff, 0.8).rect(25, 7.2, 1.6, 0.9).rect(30.6, 7.2, 1.6, 0.9);
    p.oCircle(35, 11, 2.4, 0xe0927a, 0.9); // nariz de quem bebe
    p.fill(0x3a2a24).poly([[26, 13], [36, 12.4], [37, 15.4], [31, 14.6], [26, 16]]); // bigodão
    p.fill(O).round(30, 15, 5, 2, 0.8); // boca
    p.fill(PAL.gold).rect(31.4, 15.2, 1.2, 1); // dente de ouro
    // Charuto aceso.
    p.oRound(34, 14.6, 9, 2.6, 1.2, 0x7a4a26, 0.8);
    p.fill(PAL.gold).rect(36, 14.6, 1.2, 2.6);
    p.fill(0xff5a2a).circle(43, 15.9, 1.2);
    p.fill(0xffe14d).circle(43.2, 15.9, 0.6);
    p.fill(0xd6dbe6, 0.55).circle(43.4, 11.6, 1.6).circle(44.2, 8, 1.2);
  });
  make(scene, 'porco_hat', 20, 16, (p) => {
    // Chapeuzinho porkpie apertado na careca, com pena e mastro da hélice.
    p.fill(O).round(1, 11, 18, 3.4, 1.6);
    p.fill(0x2a1f3a).round(2, 11.6, 16, 2.2, 1);
    p.oRound(5, 5.6, 10, 6.6, 1.6, 0x2a1f3a, 1);
    p.fill(NEON.pink).rect(5, 9.6, 10, 1.6);
    p.fill(NEON.cyan).poly([[13, 10], [18, 3], [16, 9.4]]); // pena
    p.fill(PAL.gunLight).rect(9, 0, 2, 6); // mastro da hélice
  });
  make(scene, 'porco_heli', 40, 6, (p) => {
    // Hélice de duas cartas de baralho (um ás e um coringa).
    p.oRound(1, 0.8, 18, 4.4, 1, 0xf7f1e8, 0.8).oRound(21, 0.8, 18, 4.4, 1, 0xf7f1e8, 0.8);
    p.fill(0x15131f).tri(8, 1.6, 6.4, 4, 9.6, 4);
    p.fill(0xff2d3d).circle(30, 3, 1.3);
    p.fill(0xff2d3d).rect(2, 1.4, 1, 1).rect(36.8, 3.6, 1, 1);
    p.oCircle(20, 3, 2, PAL.gold, 0.8);
  });
  make(scene, 'porco_case', TEX.porcoCase.w, TEX.porcoCase.h, (p) => {
    // Pega pela mão cheia de anéis (pivô em x=4); o caça-níquel cospe moedas pela bandeja da frente.
    p.oRound(8, 3, 19, 17, 3, 0xd8192e, 1.2); // gabinete vermelho
    p.fill(0xa30f22).rect(8, 15, 19, 5);
    p.oRound(9.6, 0.6, 16, 4.4, 2, PAL.gold, 1); // letreiro
    p.fill(0xff2d3d).rect(11.4, 1.8, 2.2, 1.6).rect(16.4, 1.8, 2.2, 1.6).rect(21.4, 1.8, 2.2, 1.6); // luzinhas
    p.oRound(10, 6, 15, 6.6, 1, 0xf7f1e8, 1); // janela dos rolos
    p.fill(0xff2d3d).rect(11.2, 7.2, 3.4, 1).rect(13, 7.2, 1, 4.4); // 7
    p.fill(0xff2d3d).rect(16, 7.2, 3.4, 1).rect(17.8, 7.2, 1, 4.4); // 7
    p.fill(0xb5179e).circle(22.4, 10, 1.4).circle(20.8, 10.6, 1.2); // cerejas
    p.fill(0x39ff88).rect(21.2, 7.4, 0.8, 2.4);
    p.oRound(24, 14, 6, 4, 1, PAL.gold, 1); // bandeja de moedas (boca do "canhão")
    p.fill(O).rect(25, 15, 4.6, 1.6);
    p.fill(PAL.gold).circle(27.4, 13.6, 1.2);
    p.stroke(1.2, PAL.gunLight).line(27, 6, 29, 1.4); // alavanca
    p.oCircle(29, 1.4, 1.6, 0xff2d3d, 0.7);
    // Mão gorducha com anel em todo dedo.
    p.oRound(1, 7, 8, 7, 3, PAL.skin, 1);
    p.fill(PAL.gold).rect(3, 7, 1.2, 7).rect(5.2, 7, 1.2, 7);
    p.fill(0x22e6ff).circle(3.6, 8.4, 0.8);
    p.fill(0xff2d3d).circle(5.8, 12.4, 0.8);
    p.oRound(0, 3.6, 5, 4.6, 2, suitLime, 1); // punho do paletó
  });
  make(scene, 'b_coin', 14, 14, (p) => {
    p.fill(O).circle(7, 7, 6.6);
    p.fill(PAL.gold).circle(7, 7, 5.4);
    p.fill(0xfff1a8).circle(5.5, 5.5, 1.8);
    p.stroke(1.4, 0xb8860b).line(7, 3.5, 7, 10.5);
    p.stroke(1.2, 0xb8860b).line(5, 5, 9, 5).line(5, 7, 9, 7).line(5, 9, 9, 9);
  });

  // ── Toni Mantega (id don_pombone): o chefão de terno branco ──────────
  make(scene, 'pombone_body', TEX.pomboneBody.w, TEX.pomboneBody.h, (p) => {
    p.oRound(34, 76, 10, 14, 3, PAL.donCoat, 1.5); // calça branca
    p.oRound(50, 76, 10, 14, 3, PAL.donCoat, 1.5);
    p.oRound(32, 86, 14, 5.5, 2.5, 0x1b1820, 1.4); // sapato bicolor
    p.oRound(48, 86, 14, 5.5, 2.5, 0x1b1820, 1.4);
    p.fill(PAL.warmWhite).rect(34, 86.4, 6, 3).rect(50, 86.4, 6, 3);
    // Mochila-helicóptero (mastro do rotor sai daqui).
    p.oRound(12, 30, 16, 32, 5, 0x4a4f5e, 1.6);
    p.fill(NEON.pink).rect(13, 40, 14, 3);
    p.fill(0x6b7385).rect(17, 6, 5, 26);
    p.oEllipse(46, 58, 62, 46, PAL.donCoat, 2); // terno branco
    p.fill(0xdcd6c8).ellipse(42, 68, 50, 20);
    p.fill(O).tri(44, 34, 68, 34, 56, 66);
    p.fill(0xd8192e).tri(46, 35, 66, 35, 56, 63); // camisa vermelha aberta
    p.fill(0xc98a64).tri(49, 35, 63, 35, 56, 52); // peito cabeludo
    p.fill(0x3a2116, 0.6).circle(54, 41, 1).circle(58, 43, 1).circle(55, 46, 1).circle(57, 39, 0.9);
    p.fill(0xeeeae0).tri(44, 34, 50, 34, 49, 60).tri(68, 34, 62, 34, 63, 60); // lapelas
    p.stroke(2.2, PAL.gold).line(47, 38, 56, 54).line(56, 54, 65, 38); // correntão
    p.stroke(1.4, PAL.gold).line(49, 38, 56, 49).line(56, 49, 63, 38);
    p.oCircle(56, 55, 3.6, PAL.gold, 1.2);
    p.oCircle(40, 44, 3.8, NEON.pink, 1.2); // cravo neon
    // Cabeção: cabelo engomado preto, cicatriz, charuto.
    p.oCircle(58, 22, 18, skinB, 2);
    p.oCircle(42, 22, 4, skinB, 1.2); // orelha
    p.fill(stubble, 0.45).ellipse(62, 32, 26, 12);
    p.fill(PAL.warmWhite).circle(64, 17, 5.4);
    p.fill(O).circle(65.6, 18, 2.8);
    p.fill(skinB).rect(57.5, 10.5, 13, 6); // pálpebra pesada
    p.fill(O).poly([[55, 9.5], [74, 11.5], [74, 14.5], [55, 12.6]]); // sobrancelhão
    p.stroke(1.3, 0xb85a4a).line(66, 23, 72, 30).line(67.5, 25.5, 70, 24.5); // cicatriz
    p.fill(0xc8885c).ellipse(75, 22, 7, 8); // nariz
    p.fill(O).round(63, 31, 13, 3.4, 1.6); // careta
    p.fill(PAL.warmWhite).rect(65, 31.4, 8, 1.2);
    p.oRound(72, 30.5, 16, 4, 2, 0x7a4a24, 1); // charuto
    p.fill(0xff8a3d).rect(86.5, 31, 2, 3);
    p.fill(0x9aa3b5, 0.7).circle(91, 28, 2).circle(93, 24, 1.6);
  });
  make(scene, 'pombone_wing', TEX.pomboneWing.w, TEX.pomboneWing.h, (p) => {
    // Pá do rotor da mochila-helicóptero (gira via scaleX na view).
    p.oRound(1, 11, 58, 6, 3, 0xe8e2f0, 1.4);
    p.fill(NEON.pink).rect(1.5, 12, 6, 4).rect(52.5, 12, 6, 4);
    p.oCircle(30, 14, 4, PAL.gold, 1.2);
  });
  make(scene, 'pombone_hat', 52, 24, (p) => {
    // Topete engomado preto-azulado, brilhando de gel.
    p.fill(O).poly([[4, 23], [6, 12], [16, 4], [32, 1], [46, 4], [50, 12], [42, 11], [30, 9], [20, 13], [16, 23]]);
    p.fill(0x14101c).poly([[6, 21.5], [8, 12.6], [17, 5.6], [32, 2.6], [45, 5.4], [47.4, 10.2], [41, 9.4], [30, 7.6], [19, 11.6], [14.6, 21.5]]);
    p.fill(0x5b6b9c, 0.8).poly([[18, 7], [32, 4], [40, 5.4], [28, 6.4]]);
  });
  make(scene, 'pombone_gun', TEX.pomboneGun.w, TEX.pomboneGun.h, (p) => {
    p.oCircle(7, 11, 5.5, skinB, 1.2); // punho com anel
    p.fill(PAL.gold).rect(5, 12, 4, 2);
    p.oRound(12, 5, 34, 9, 2, PAL.gold, 1.4); // fuzil de ouro
    p.oRound(22, 13, 6, 9, 1.5, 0xd4a017, 1.2); // pente curvo
    p.fill(0xfff1a8).rect(14, 6.5, 30, 1.6);
    p.oRound(30, 13, 16, 5, 2, 0x2a2f3a, 1.2); // lança-granadas ("meu amiguinho")
    p.oRound(45, 7, 17, 4.6, 1.5, 0xd4a017, 1.2); // cano
    p.fill(O).rect(48, 8.4, 12, 1);
  });
  make(scene, 'fx_shield', 64, 64, (p) => {
    // Bolha do "seguro corporativo" dado pelo Porco Executivo.
    p.fill(PAL.gold, 0.12).circle(32, 32, 30);
    p.stroke(2.5, PAL.gold, 0.9).strokeCircle(32, 32, 29);
    p.stroke(1.2, 0xffffff, 0.6).strokeCircle(32, 32, 25);
    p.fill(0xffffff, 0.5).ellipse(22, 18, 12, 6);
  });

  make(scene, 'fx_flame', 10, 20, (p) => {
    p.fill(PAL.coral).poly([[0, 0], [10, 0], [5, 20]]);
    p.fill(PAL.amber).poly([[1.8, 0], [8.2, 0], [5, 14]]);
    p.fill(0xfffbe8).poly([[3.5, 0], [6.5, 0], [5, 7]]);
  });

  // ── Projéteis ───────────────────────────────────────────────────────
  make(scene, 'b_player', 14, 14, (p) => {
    // Bolinha amarela com contorno e brilho (o tiro do jogador).
    p.fill(O).circle(7, 7, 6.5);
    p.fill(0xffe14d).circle(7, 7, 5.2);
    p.fill(0xfff6b0).circle(6, 6, 2.6);
    p.fill(0xffffff).circle(5.2, 5.2, 1.2);
  });
  make(scene, 'b_enemy', 18, 18, (p) => {
    p.fill(O).circle(9, 9, 8.5);
    p.fill(PAL.coral).circle(9, 9, 7);
    p.fill(0xffb3b8).circle(9, 9, 4);
    p.fill(0xffffff).circle(7, 7, 1.8);
  });

  // ── Partículas e efeitos ────────────────────────────────────────────
  make(scene, 'px_dot', 8, 8, (p) => p.fill(0xffffff).circle(4, 4, 3.5));
  make(scene, 'px_soft', 32, 32, (p) => {
    for (let r = 16; r > 0; r -= 2) p.fill(0xffffff, 0.08).circle(16, 16, r);
  });
  make(scene, 'px_feather', 14, 6, (p) => {
    p.fill(0xffffff).poly([[0, 3], [5, 0.5], [13, 2], [14, 3], [13, 4], [5, 5.5]]);
    p.fill(0xd9d9d9).rect(1, 2.6, 12, 0.8);
  });
  make(scene, 'px_shell', 7, 4, (p) => {
    p.fill(0x8a6a1f).round(0, 0, 7, 4, 1);
    p.fill(PAL.brass).round(0.5, 0.5, 6, 2.5, 1);
  });
  make(scene, 'px_star', 14, 14, (p) => {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 7 : 3;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push([7 + Math.cos(a) * r, 7 + Math.sin(a) * r]);
    }
    p.fill(0xffffff).poly(pts);
  });
  make(scene, 'fx_muzzle', 30, 20, (p) => {
    p.fill(PAL.amber).poly([[0, 10], [12, 2], [10, 8], [30, 10], [10, 12], [12, 18]]);
    p.fill(0xfffbe8).poly([[2, 10], [12, 6], [22, 10], [12, 14]]);
  });
  make(scene, 'fx_ring', 64, 64, (p) => {
    p.stroke(3, 0xffffff).strokeCircle(32, 32, 28);
  });
  make(scene, 'fx_excl', 12, 26, (p) => {
    p.oRound(3, 1, 6, 15, 3, PAL.amber, 1.5);
    p.oCircle(6, 21.5, 3, PAL.amber, 1.5);
  });
  make(scene, 'fx_drop', 26, 30, (p) => {
    // Aviso de entrada no topo: seta para baixo com "!".
    p.fill(O).poly([[1, 6], [25, 6], [13, 29]]);
    p.fill(PAL.coral).poly([[4.5, 8], [21.5, 8], [13, 25]]);
    p.fill(PAL.warmWhite).round(11.5, 9.5, 3, 7, 1.5).circle(13, 19.5, 1.7);
    p.fill(O).rect(1, 0, 24, 4);
    p.fill(PAL.amber).rect(2, 0.8, 22, 2.4);
  });
  make(scene, 'fx_glow', 24, 24, (p) => {
    for (let r = 12; r > 0; r -= 1.5) p.fill(PAL.coral, 0.12).circle(12, 12, r);
    p.fill(0xffffff, 0.9).circle(12, 12, 3);
  });
  make(scene, 'crosshair', 34, 34, (p) => {
    p.stroke(4, O).strokeCircle(17, 17, 9);
    p.stroke(2, PAL.warmWhite).strokeCircle(17, 17, 9);
    for (const [x1, y1, x2, y2] of [
      [17, 1, 17, 7],
      [17, 27, 17, 33],
      [1, 17, 7, 17],
      [27, 17, 33, 17],
    ] as const) {
      p.stroke(4, O).line(x1, y1, x2, y2);
      p.stroke(2, PAL.warmWhite).line(x1, y1, x2, y2);
    }
    p.fill(PAL.coral).circle(17, 17, 1.6);
  });
  make(scene, 'hitmarker', 24, 24, (p) => {
    for (const [x1, y1, x2, y2] of [
      [3, 3, 9, 9],
      [21, 3, 15, 9],
      [3, 21, 9, 15],
      [21, 21, 15, 15],
    ] as const) {
      p.stroke(4, O).line(x1, y1, x2, y2);
      p.stroke(2, 0xffffff).line(x1, y1, x2, y2);
    }
  });
  make(scene, 'shadow', 40, 10, (p) => p.fill(0x000000, 0.35).ellipse(20, 5, 40, 10));
  make(scene, 'heart', 12, 11, (p) => {
    p.fill(0xffffff).circle(3.5, 3.5, 3.3).circle(8.5, 3.5, 3.3).tri(0.3, 4.5, 11.7, 4.5, 6, 10.5);
  });
}
