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
  plBody: { w: 36, h: 28 },
  plHead: { w: 34, h: 32 },
  /** O centro do rosto fica em (22, 16) da textura do cabelo. */
  plHair: { w: 40, h: 36, cx: 22, cy: 16 },
  plLeg: { w: 11, h: 17 },
  plArm: { w: 42, h: 20, pivotX: 5 },
  plBack: { w: 14, h: 22, pivotY: 3 },
  patoBody: { w: 44, h: 40 },
  patoHat: { w: 36, h: 18 },
  patoGun: { w: 22, h: 10, pivotX: 4 },
  patoBalloons: { w: 44, h: 48 },
  galinhaJetpack: { w: 22, h: 30 },
  galinhaBody: { w: 48, h: 56 },
  galinhaGlasses: { w: 22, h: 8 },
  galinhaGun: { w: 56, h: 18, pivotX: 10 },
  vacaBody: { w: 44, h: 47 },
  vacaLeg: { w: 9, h: 18 },
  vacaArm: { w: 17, h: 8, pivotX: 3 },
  pomboBody: { w: 34, h: 30 },
  pomboWing: { w: 24, h: 12 },
  pomboGun: { w: 24, h: 9, pivotX: 3 },
  porcoBody: { w: 46, h: 46 },
  porcoCase: { w: 26, h: 15, pivotX: 3 },
  pomboneBody: { w: 96, h: 92 },
  pomboneWing: { w: 60, h: 28 },
  pomboneGun: { w: 64, h: 22, pivotX: 8 },
  vacaBell: { w: 12, h: 13 },
} as const;

export function generateTextures(scene: Phaser.Scene): void {
  // ── Johnny Replay (protagonista) ─────────────────────────────────────
  // Balconista de videolocadora que jura ser astro de ação: mullet, bigodão,
  // aviador espelhado, bandana, regata branca, jaqueta vermelha sem mangas,
  // braços de palito e uma arma grande demais para ele.
  const jacket = 0xe8283c;
  const jacketDark = 0xa8172b;
  const hair = 0x3a2116;
  const hairLight = 0x6a3d25;
  const bandana = 0xff2d3d;
  make(scene, 'pl_hair', TEX.plHair.w, TEX.plHair.h, (p) => {
    // Mullet: curto e espetado em cima, comprido atrás (balança com mola).
    const back: Array<[number, number, number]> = [
      [13, 14, 7.5],
      [11, 21, 5.5],
      [10.5, 27, 4.8],
      [12, 31.5, 3.6],
    ];
    const top: Array<[number, number, number]> = [
      [22, 8.5, 8.5],
      [15, 9.5, 6.5],
      [28, 9, 5.5],
    ];
    for (const [x, y, r] of [...back, ...top]) p.fill(O).circle(x, y, r + 1.5);
    p.fill(O).tri(18, 3, 22, -0.5, 24, 3).tri(24, 2.5, 30, 0.5, 29, 5).tri(12, 6, 13, 0.5, 18, 4);
    for (const [x, y, r] of [...back, ...top]) p.fill(hair).circle(x, y, r);
    p.fill(hair).tri(19, 3.5, 22, 1, 23.5, 4).tri(24.5, 3.5, 29, 2, 28.5, 5.5).tri(13, 6.5, 13.6, 2, 17.5, 4.6);
    p.fill(hairLight).circle(20, 6, 2.4).circle(13, 13, 1.8).circle(10.5, 22, 1.5).circle(10.5, 28, 1.2);
    // Pontas da bandana voando atrás.
    p.fill(O).poly([[14, 10], [2, 7], [3.5, 11.5], [13.5, 14]]).poly([[14, 12], [4, 16], [6.5, 18.5], [14, 15]]);
    p.fill(bandana).poly([[13.5, 10.8], [3.6, 8.4], [4.6, 10.8], [13.4, 13]]).poly([[13.6, 13], [5.6, 16.4], [6.9, 17.4], [13.6, 14.5]]);
  });
  make(scene, 'pl_head', TEX.plHead.w, TEX.plHead.h, (p) => {
    p.oCircle(10.5, 19, 3, PAL.skin, 1.2); // orelha
    p.oEllipse(17, 18.5, 19, 21, PAL.skin); // rosto comprido de quem nunca malhou
    p.fill(0xe8a87f).circle(11, 19, 1.2);
    p.fill(0xe0a27c).ellipse(19, 27, 9, 3); // queixo fraquinho
    // Bandana vermelha na testa.
    p.fill(O).round(7, 6.6, 21, 5.4, 2);
    p.fill(bandana).round(8, 7.4, 19, 3.8, 1.5);
    p.fill(0xff8a8a).rect(9, 8, 17, 0.9);
    p.fill(0xffffff, 0.8).circle(12, 9.6, 0.5).circle(17, 9.4, 0.5).circle(22, 9.6, 0.5);
    // Aviador espelhado (reflete um pôr do sol neon).
    p.fill(O).poly([[16.5, 13], [28, 13], [27.5, 18], [24, 20.5], [19, 19.5], [16.5, 16]]);
    p.fill(O).poly([[11.5, 13.6], [15.6, 13.6], [15.2, 17.6], [12.4, 18]]);
    p.fill(0xff4fa3).poly([[17.6, 14], [27, 14], [26.8, 16], [17.6, 16]]);
    p.fill(0xffb347).poly([[17.6, 16], [26.8, 16], [26.4, 17.4], [18, 17.4]]);
    p.fill(0x22e6ff).poly([[18, 17.4], [26.4, 17.4], [23.6, 19.4], [19.4, 18.8]]);
    p.fill(0xff4fa3, 0.8).poly([[12.4, 14.4], [15, 14.4], [14.8, 16.8], [12.8, 17]]);
    p.fill(0xffffff, 0.95).tri(19, 14.4, 21.5, 14.4, 19, 16.4);
    p.fill(O).rect(26, 13.6, 4.5, 1.2); // haste
    // Nariz.
    p.fill(O).ellipse(27.5, 21.5, 6, 6);
    p.fill(0xf0b08a).ellipse(27.5, 21.5, 4.2, 4.2);
    // Bigodão exagerado, caindo nas pontas.
    p.fill(O).poly([[19, 23.4], [31, 23.4], [32.5, 28.5], [29.5, 26.5], [21, 26.5], [18, 29]]);
    p.fill(hair).poly([[19.8, 24.2], [30.2, 24.2], [31.3, 26.9], [29.3, 25.6], [21.2, 25.6], [19.2, 27.4]]);
    p.fill(hairLight).rect(22, 24.6, 6, 0.8);
    // Boca de durão (que não convence).
    p.fill(O).rect(22.5, 27.6, 5, 1.1);
  });
  make(scene, 'pl_body', TEX.plBody.w, TEX.plBody.h, (p) => {
    // Tronco magrelo: regata branca canelada com o umbigo à mostra.
    p.oRound(11, 4, 14, 22, 4, PAL.warmWhite);
    p.fill(0xd9d3c8);
    for (let x = 13; x < 24; x += 2.4) p.rect(x, 6, 0.6, 18);
    p.fill(PAL.skin).tri(14, 4, 22, 4, 18, 9); // decote
    p.fill(0xf0c6a0).circle(18, 21.5, 0.8);
    // Jaqueta vermelha sem mangas, gola levantada, aberta.
    p.fill(O).round(8.5, 3, 7.5, 24, 3).round(20, 3, 7.5, 24, 3);
    p.fill(jacket).round(9.5, 4, 5.5, 22, 2.4).round(21, 4, 5.5, 22, 2.4);
    p.fill(jacketDark).rect(9.5, 19, 5.5, 2).rect(21, 19, 5.5, 2);
    p.fill(O).tri(9, 4, 14.5, 4, 10, -0.5).tri(27, 4, 21.5, 4, 26, -0.5); // gola em pé
    p.fill(jacket).tri(10, 3.5, 13.5, 3.5, 10.6, 0.8).tri(26, 3.5, 22.5, 3.5, 25.4, 0.8);
    p.fill(0xb8bcc8).rect(15, 6, 0.8, 18).rect(20.2, 6, 0.8, 18); // zíperes
    // Cinto com fivela de águia dourada.
    p.fill(O).rect(10.5, 22.5, 15, 3.5);
    p.fill(0x5a3a22).rect(11, 23, 14, 2.5);
    p.oRound(15.5, 22.4, 5, 3.6, 0.8, PAL.gold, 0.6);
    // Bottom de broche: "ASTRO".
    p.oCircle(24, 9, 1.6, 0x22e6ff, 0.6);
  });
  make(scene, 'pl_leg', TEX.plLeg.w, TEX.plLeg.h, (p) => {
    p.oRound(3, 0, 5.5, 12, 2, 0xc9a87a, 1); // calça cáqui
    p.fill(0xa8875c).rect(3, 7, 5.5, 1);
    p.oRound(2, 10, 8, 4, 1.2, PAL.warmWhite, 1); // cano alto
    p.fill(bandana).rect(2, 11, 8, 1);
    p.oRound(1.5, 12.5, 9.5, 3.8, 1.8, PAL.warmWhite, 1); // tênis
    p.fill(0x22e6ff).tri(4, 13.2, 9.5, 13.4, 6.5, 15);
    p.fill(0x9aa3b5).rect(1.5, 15.4, 9.5, 1);
  });
  make(scene, 'pl_arm', TEX.plArm.w, TEX.plArm.h, (p) => {
    // Pivô no ombro (x=5). Braço de palito + luva sem dedos + revólver gigante.
    p.oCircle(5, 10, 3, PAL.skin, 1);
    p.oRound(5, 8.6, 10, 3, 1.4, PAL.skin, 1);
    p.oRound(13.5, 7.5, 5, 6, 1.6, 0x4a2c1c, 1); // luva
    p.oRound(15, 10, 6, 8, 1.6, 0x8a5a2b, 1.2); // cabo de madeira
    p.fill(0xb07a42).rect(16.5, 11, 1.2, 5.5);
    p.oRound(16, 3, 11, 9, 2.6, 0xc4cad6, 1.3); // tambor enorme
    p.fill(0x8e95a6).rect(18, 5, 1.4, 5).rect(21, 5, 1.4, 5).rect(24, 5, 1.4, 5);
    p.oRound(25, 3.6, 15, 5.4, 1.2, 0xc4cad6, 1.3); // cano comprido
    p.fill(0xffffff, 0.75).rect(17, 3.8, 22, 1.1);
    p.oRound(37.5, 1.6, 2.2, 2.6, 0.6, 0xc4cad6, 0.8); // massa de mira
    p.fill(O).rect(39.6, 4.4, 1.4, 3.8); // boca do cano
    p.fill(0xff4fa3).rect(26, 8.4, 11, 0.7); // filete neon (customizado, claro)
  });
  make(scene, 'pl_back', TEX.plBack.w, TEX.plBack.h, (p) => {
    // Braço livre: palito com luva, faz "muque" (sem muque nenhum).
    p.oRound(5, 1, 4, 13, 1.8, PAL.skin, 1);
    p.fill(0xf7cfa8).ellipse(7.6, 8, 2.4, 3.2); // bíceps de ervilha
    p.oRound(3.5, 13, 7, 7, 2.6, 0x4a2c1c, 1); // punho de luva
    p.fill(PAL.skin).rect(4.5, 17.6, 5, 1.6);
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

  // ── Aeróbica Turbo (id vaca_loca): professora de aeróbica que atropela ──
  make(scene, 'vaca_body', TEX.vacaBody.w, TEX.vacaBody.h, (p) => {
    // Permanente gigante atrás da cabeça.
    for (const [x, y, r] of [
      [14, 8, 7],
      [10, 15, 6],
      [20, 4, 6.5],
      [27, 4, 5.5],
      [11, 22, 4.5],
    ] as const) p.fill(O).circle(x, y, r + 1.5);
    for (const [x, y, r] of [
      [14, 8, 7],
      [10, 15, 6],
      [20, 4, 6.5],
      [27, 4, 5.5],
      [11, 22, 4.5],
    ] as const) p.fill(0xffd166).circle(x, y, r);
    p.fill(0xffe9a8).circle(18, 3, 2).circle(11, 12, 1.6);
    // Collant rosa-choque cavado + meia-calça.
    p.oRound(10, 20, 22, 27, 9, 0xff2fa8);
    p.fill(0x9b5cff).tri(12, 40, 31, 40, 21.5, 47); // cava roxa
    p.fill(0xffffff, 0.5).round(14, 23, 4, 14, 2);
    p.fill(NEON.cyan).rect(10, 34, 22, 2.4); // cinto neon
    // Cabeça com faixa, cara de quem está no 300º polichinelo.
    p.oRound(15, 5, 20, 19, 8, PAL.skin);
    p.fill(O).round(14, 6.5, 22, 5, 2);
    p.fill(NEON.cyan).round(15, 7.2, 20, 3.4, 1.4);
    p.fill(NEON.pink).rect(15, 8.4, 20, 1);
    p.fill(PAL.warmWhite).circle(26, 14, 3.6).circle(32, 13.6, 3); // olhos esbugalhados
    p.fill(O).circle(27.2, 14.2, 1.6).circle(33, 13.8, 1.3);
    p.fill(0x7a2b8a).ellipse(29, 11.4, 9, 1.6); // sombra azul-roxa
    p.fill(O).round(26, 19, 9, 4.6, 2.2); // grito de "VAI, VAI, VAI!"
    p.fill(PAL.warmWhite).rect(27, 19.4, 7, 1.2);
    p.fill(0xff5a8a).circle(23, 18, 1.8); // blush exagerado
    p.fill(0x7fe7ff, 0.9).circle(37, 9, 1).circle(36, 12, 0.8); // gotas de suor
  });
  make(scene, 'vaca_leg', TEX.vacaLeg.w, TEX.vacaLeg.h, (p) => {
    p.oRound(2, 0, 5, 9, 2, 0xff9ad0, 1); // meia-calça
    p.oRound(1, 7, 7, 7, 2, NEON.cyan, 1); // polaina
    p.fill(0x0fb8d8).rect(1, 9, 7, 1).rect(1, 11.5, 7, 1);
    p.oRound(0.5, 13, 8.5, 4.4, 1.8, PAL.warmWhite, 1); // tênis de aeróbica
    p.fill(NEON.pink).rect(1.5, 14.2, 6, 1);
  });
  make(scene, 'vaca_arm', TEX.vacaArm.w, TEX.vacaArm.h, (p) => {
    // Braço com munhequeira e halterinho rosa; pivô no ombro.
    p.oRound(1, 2, 10, 4, 2, PAL.skin, 1);
    p.fill(NEON.cyan).rect(8, 2, 2.6, 4);
    p.oRound(11, 0.5, 2.4, 7, 1, NEON.pink, 1);
    p.oRound(15, 0.5, 2.4, 7, 1, NEON.pink, 1);
    p.fill(O).rect(13, 3.4, 2.4, 1.2);
  });
  make(scene, 'vaca_bell', TEX.vacaBell.w, TEX.vacaBell.h, (p) => {
    // Walkman pendurado no pescoço, com fone de ouvido laranja.
    p.stroke(0.8, O).line(6, 0, 6, 3);
    p.oRound(2, 3, 8, 9, 1.2, 0x2b6fd6, 1);
    p.fill(0x9aa3b5).rect(3, 4.5, 6, 3);
    p.fill(O).circle(4.6, 6, 0.9).circle(7.4, 6, 0.9);
    p.fill(0xff8a3d).rect(3, 9.5, 6, 1.2);
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

  // ── Yuppie Turbo (id porco_executivo): Wall Street com celular-tijolo ──
  make(scene, 'porco_body', TEX.porcoBody.w, TEX.porcoBody.h, (p) => {
    p.oRound(15, 40, 7, 5, 1.5, 0x1b1820, 1); // sapato de bico fino
    p.oRound(25, 40, 7, 5, 1.5, 0x1b1820, 1);
    p.oRound(16, 32, 5, 9, 1.5, 0x3d4255, 1); // calça risca de giz
    p.oRound(25, 32, 5, 9, 1.5, 0x3d4255, 1);
    p.oEllipse(23, 28, 30, 22, 0xffb3d1); // camisa rosa
    p.fill(0xf598bd).ellipse(23, 33, 26, 8);
    p.fill(0xe8283c).rect(15, 18, 2.6, 20).rect(29, 18, 2.6, 20); // suspensórios
    p.fill(PAL.gold).circle(16.3, 30, 1).circle(30.3, 30, 1);
    p.fill(0xe8283c).poly([[23, 19], [26, 19], [27, 31], [24.5, 34], [22, 31]]); // gravata poderosa
    p.fill(PAL.warmWhite).tri(20, 17, 29, 17, 24.5, 21); // colarinho
    p.oCircle(25, 12, 10.5, PAL.skin); // cabeça
    // Cabelo de gel penteado para trás, sem um fio fora do lugar.
    p.fill(O).poly([[13, 12], [15, 3], [24, 0], [33, 2], [35, 6], [25, 5], [17, 9], [16, 15]]);
    p.fill(0x2a1a12).poly([[14.5, 11.5], [16, 4], [24, 1.4], [32, 3], [32.8, 5], [25, 4], [17.4, 8], [16.6, 13]]);
    p.stroke(0.6, 0x6a4a35).line(18, 5, 28, 2.6).line(17, 7.4, 30, 3.8);
    p.fill(O).rect(26, 8.6, 6, 1.1); // sobrancelha
    p.fill(O).round(27, 10.4, 4, 1.6, 0.8); // olho presunçoso
    p.fill(0xe8a87f).circle(34.5, 13, 2); // nariz
    p.fill(O).round(26.5, 16.4, 8, 3.6, 1.6); // sorriso de comissão
    p.fill(PAL.warmWhite).rect(27.5, 16.8, 6, 1.4);
    p.fill(PAL.gold).rect(30, 16.8, 1.3, 1.4); // dente de ouro
  });
  make(scene, 'porco_hat', 20, 16, (p) => {
    // Boné de hélice (o único brinquedo que a bolsa não levou).
    p.fill(O).ellipse(10, 12, 18, 9);
    p.fill(NEON.pink).ellipse(10, 12, 16, 7.4);
    p.fill(NEON.cyan).poly([[2.4, 12.5], [10, 8.4], [10, 15.6]]);
    p.fill(0xffe14d).poly([[17.6, 12.5], [10, 8.4], [10, 15.6]]);
    p.oRound(13, 13.5, 7, 2.4, 1, NEON.pink, 0.8); // aba
    p.fill(PAL.gunLight).rect(9, 0, 2, 9); // mastro da hélice
  });
  make(scene, 'porco_heli', 40, 6, (p) => {
    p.oRound(1, 1.5, 38, 3, 1.5, 0xe8e2f0, 1);
    p.fill(NEON.pink).rect(1.5, 2, 4, 2).rect(34.5, 2, 4, 2);
    p.oCircle(20, 3, 2, PAL.gold, 0.8);
  });
  make(scene, 'porco_case', TEX.porcoCase.w, TEX.porcoCase.h, (p) => {
    p.oRound(1, 4, 9, 6, 3, 0xffb3d1, 1); // manga dobrada
    p.oCircle(10, 7, 2.6, PAL.skin, 0.8);
    p.oRound(11, 2.5, 8, 12, 1.6, 0x4a4f5e, 1.2); // celular-tijolo
    p.fill(0x9fe8a8).rect(12.2, 3.8, 5.6, 2.6); // visor verde
    p.fill(0xd6dbe6);
    for (let y = 7.4; y < 13; y += 1.9) p.rect(12.4, y, 1.4, 1).rect(14.3, y, 1.4, 1).rect(16.2, y, 1.4, 1);
    p.oRound(17.5, -0.5, 1.6, 4, 0.6, 0x2a2f3a, 0.6); // antena
    p.fill(NEON.pink).circle(18.3, 0.2, 0.9);
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
