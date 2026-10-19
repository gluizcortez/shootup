import Phaser from 'phaser';
import { PAL } from './palette';

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
  plBody: { w: 30, h: 26 },
  plHead: { w: 28, h: 28 },
  plLeg: { w: 8, h: 14 },
  plArm: { w: 36, h: 14, pivotX: 4 },
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
  // ── Competidor (protagonista provisório) ─────────────────────────────
  make(scene, 'pl_body', TEX.plBody.w, TEX.plBody.h, (p) => {
    p.oRound(4, 3, 22, 20, 7, PAL.turquoise);
    p.fill(0x2fb7a2).round(4, 15, 22, 8, 4); // sombra do paletó
    p.fill(PAL.warmWhite).tri(12, 3, 18, 3, 15, 10); // gola
    p.fill(PAL.coral).tri(14, 5, 16, 5, 15, 13); // gravata
    p.fill(PAL.amber).circle(21, 10, 2.6); // broche-estrela do programa
    p.fill(PAL.warmWhite).circle(20.3, 9.3, 0.9);
  });
  make(scene, 'pl_head', TEX.plHead.w, TEX.plHead.h, (p) => {
    p.oCircle(14, 16, 9, PAL.skin);
    // Capacete de auditório: domo âmbar com faixa turquesa e lâmpada.
    p.fill(O).ellipse(14, 11, 23, 15);
    p.fill(PAL.amber).ellipse(14, 11, 20, 12);
    p.fill(PAL.amber).rect(4, 11, 20, 3);
    p.fill(PAL.turquoise).rect(4, 11, 20, 2.5);
    p.fill(0xfff1c1).ellipse(10, 8, 6, 3);
    p.fill(O).rect(13, 1, 2, 4);
    p.oCircle(14, 2.5, 2, PAL.coral, 1);
    // Rosto olhando para a direita.
    p.fill(PAL.warmWhite).circle(18, 17, 3.2);
    p.fill(O).circle(19.2, 17.2, 1.6);
    p.fill(0xe9967a).circle(21.5, 21, 1.6); // bochecha
    p.fill(O).rect(16, 22.2, 4, 1.2); // boca determinada
  });
  make(scene, 'pl_leg', TEX.plLeg.w, TEX.plLeg.h, (p) => {
    p.oRound(1.5, 0, 5, 10, 2, PAL.plumLight, 1);
    p.oRound(1, 9, 7, 4, 2, PAL.coral, 1); // tênis
  });
  make(scene, 'pl_arm', TEX.plArm.w, TEX.plArm.h, (p) => {
    // Braço (manga) + mão + pistola. Pivô no ombro (x=4).
    p.oRound(1, 4.5, 12, 6, 3, PAL.turquoise, 1);
    p.oCircle(14, 8, 3.2, PAL.skin, 1);
    p.oRound(14, 3, 18, 6, 1.5, PAL.gunMetal, 1.2); // ferrolho
    p.oRound(15, 6.5, 5, 7, 1.5, PAL.gunMetal, 1.2); // empunhadura
    p.fill(PAL.gunLight).rect(15, 4, 15, 1.5);
    p.fill(PAL.amber).rect(29, 4, 2, 2); // massa de mira
  });

  // ── Pato Pistoleiro ──────────────────────────────────────────────────
  make(scene, 'pato_body', TEX.patoBody.w, TEX.patoBody.h, (p) => {
    p.oRound(13, 32, 7, 4, 2, PAL.beak, 1); // pés
    p.oRound(23, 32, 7, 4, 2, PAL.beak, 1);
    p.oEllipse(20, 24, 30, 20, PAL.duckYellow); // corpo
    p.fill(0xfff3b0).ellipse(22, 27, 16, 10); // barriga
    p.fill(O).tri(4, 20, 9, 24, 5, 27); // rabinho
    p.fill(PAL.duckYellow).tri(5.5, 21, 8.5, 24, 6, 25.5);
    p.oCircle(27, 12, 9, PAL.duckYellow); // cabeça
    p.oRound(31, 12, 12, 5, 2.5, PAL.beak, 1.2); // bico
    p.fill(0xd9790a).rect(32, 14.5, 10, 1);
    p.fill(PAL.warmWhite).circle(29.5, 9.5, 3.4); // olho arregalado
    p.fill(O).circle(30.8, 9.8, 1.7);
    p.fill(O).poly([[25, 5.5], [33, 6], [33, 7], [25, 7.5]]); // sobrancelha durona
    p.fill(0xf2b705).ellipse(16, 23, 12, 8); // asa
    p.stroke(1, O).g.strokeEllipse(16 * S, 23 * S, 12 * S, 8 * S);
  });
  make(scene, 'pato_hat', TEX.patoHat.w, TEX.patoHat.h, (p) => {
    p.oRound(2, 11, 32, 4, 2, PAL.hatBrown, 1.2); // aba
    p.oRound(9, 2, 18, 11, 4, PAL.hatBrown, 1.2); // copa
    p.fill(PAL.hatBand).rect(9, 9, 18, 2.5);
    p.fill(0xb07a42).rect(12, 3.5, 3, 5);
  });
  make(scene, 'pato_gun', TEX.patoGun.w, TEX.patoGun.h, (p) => {
    p.oCircle(4, 5, 3, 0xf2b705, 1); // ponta da asa
    p.oRound(7, 2, 11, 4, 1, PAL.gunMetal, 1); // pistolinha minúscula
    p.oRound(8, 4.5, 3, 4, 1, PAL.hatBrown, 1);
  });

  make(scene, 'pato_balloons', TEX.patoBalloons.w, TEX.patoBalloons.h, (p) => {
    // Cachinho de balões de festa do programa: o pato voa pendurado neles.
    p.stroke(1, O).line(10, 20, 22, 46).line(22, 16, 22, 46).line(34, 20, 22, 46);
    const balloon = (x: number, y: number, color: number) => {
      p.fill(O).ellipse(x, y, 17, 20).tri(x - 2.5, y + 9, x + 2.5, y + 9, x, y + 12.5);
      p.fill(color).ellipse(x, y, 14, 17).tri(x - 1.5, y + 8, x + 1.5, y + 8, x, y + 11);
      p.fill(0xffffff, 0.5).ellipse(x - 3, y - 4, 4, 6);
    };
    balloon(10, 12, PAL.coral);
    balloon(34, 12, PAL.turquoise);
    balloon(22, 9, PAL.amber);
  });

  // ── Galinha Rambo ────────────────────────────────────────────────────
  make(scene, 'galinha_body', TEX.galinhaBody.w, TEX.galinhaBody.h, (p) => {
    p.oRound(15, 49, 6, 6, 1, PAL.beak, 1); // pernas
    p.oRound(26, 49, 6, 6, 1, PAL.beak, 1);
    p.oEllipse(23, 36, 34, 30, PAL.chickenWhite); // corpo bombado
    p.fill(0xe7e1d6).ellipse(25, 42, 22, 12);
    p.fill(O).poly([[5, 28], [11, 30], [8, 40]]); // rabo arrepiado
    p.fill(PAL.chickenWhite).poly([[6.5, 30], [10, 31], [8.5, 37]]);
    p.oCircle(27, 17, 10, PAL.chickenWhite); // cabeça
    p.oRound(20, 3, 5, 7, 2.5, PAL.comb, 1); // crista
    p.oRound(24, 1, 5, 8, 2.5, PAL.comb, 1);
    p.oRound(28, 3, 5, 7, 2.5, PAL.comb, 1);
    p.fill(O).tri(35, 15, 43, 18, 35, 21); // bico
    p.fill(PAL.beak).tri(36, 16, 41.5, 18, 36, 20);
    p.oRound(34, 20, 4, 6, 2, PAL.comb, 1); // barbela
    p.fill(PAL.comb).rect(17, 11, 20, 4.5); // bandana
    p.fill(O).rect(17, 15.5, 20, 0.8);
    p.fill(PAL.comb).poly([[17, 12], [9, 9], [11, 14]]); // pontas da bandana
    p.fill(PAL.comb).poly([[17, 14], [10, 17], [13, 19]]);
    p.fill(0xfaf0d0).ellipse(16, 34, 14, 12); // bíceps de asa
    p.stroke(1, O).g.strokeEllipse(16 * S, 34 * S, 14 * S, 12 * S);
  });
  make(scene, 'galinha_glasses', TEX.galinhaGlasses.w, TEX.galinhaGlasses.h, (p) => {
    p.fill(O).round(1, 1, 9, 6, 2).round(11, 1, 9, 6, 2).rect(8, 2, 5, 1.5);
    p.fill(0x5b6b8c).rect(3, 2, 3, 1.2).rect(13, 2, 3, 1.2);
  });
  for (const [key, offset] of [
    ['galinha_gun_a', 0],
    ['galinha_gun_b', 2],
  ] as const) {
    make(scene, key, TEX.galinhaGun.w, TEX.galinhaGun.h, (p) => {
      p.oRound(2, 6, 10, 8, 3, PAL.chickenWhite, 1); // asa segurando
      p.oRound(8, 3, 24, 12, 3, PAL.gunMetal, 1.2); // corpo da metralhadora
      p.fill(PAL.coral).rect(12, 5, 4, 8); // faixa de aviso
      p.fill(PAL.amber).rect(16, 5, 2, 8);
      p.oRound(31, 4, 22, 10, 2, 0x2a2f3a, 1.2); // feixe de canos
      p.fill(PAL.gunLight);
      for (let i = 0; i < 3; i++) p.rect(32, 5.2 + ((i * 3 + offset) % 9), 21, 1.2);
      p.oRound(50, 3, 5, 12, 1.5, PAL.gunMetal, 1);
      p.oRound(14, 13, 8, 5, 1.5, PAL.brass, 1); // caixa de munição
    });
  }

  make(scene, 'galinha_jetpack', TEX.galinhaJetpack.w, TEX.galinhaJetpack.h, (p) => {
    // Jetpack improvisado: dois botijões com fita adesiva.
    p.oRound(1, 2, 9, 22, 4, PAL.gunLight, 1.2);
    p.oRound(11, 2, 9, 22, 4, PAL.gunLight, 1.2);
    p.fill(PAL.coral).rect(1.5, 10, 18, 3);
    p.fill(0xffffff, 0.4).rect(3, 4, 2, 14).rect(13, 4, 2, 14);
    p.oRound(2.5, 23, 6, 5, 1, PAL.gunMetal, 1);
    p.oRound(12.5, 23, 6, 5, 1, PAL.gunMetal, 1);
  });
  // ── Vaca Loca (bípede: corre em duas patas, braços de casco) ─────────
  make(scene, 'vaca_body', TEX.vacaBody.w, TEX.vacaBody.h, (p) => {
    // Rabo com tufo saindo das costas.
    p.stroke(2, O).line(9, 34, 2, 40);
    p.oCircle(2.5, 41, 2.4, PAL.cowSpot, 1);
    p.oRound(7, 19, 26, 27, 11, PAL.cowWhite); // tronco em pé, barrigudo
    p.fill(PAL.cowSpot).ellipse(13, 27, 9, 11).ellipse(26, 40, 8, 6).ellipse(29, 24, 4, 5);
    p.fill(PAL.cowPink).ellipse(24, 34, 9, 10); // barriga rosada
    // Cabeça grande na frente, olhar de doida e sorriso assustador.
    p.oRound(12, 4, 22, 19, 8, PAL.cowWhite);
    p.fill(PAL.cowSpot).ellipse(16, 9, 7, 6);
    p.oEllipse(11, 9, 7, 4, PAL.cowPink, 1); // orelha
    p.oRound(15, 0, 4, 6, 2, PAL.horn, 1); // chifres
    p.oRound(26, 0, 4, 6, 2, PAL.horn, 1);
    p.oRound(28, 11, 15, 11, 5, PAL.cowPink, 1.2); // focinho
    p.fill(O).circle(36, 14.5, 1.1).circle(40.5, 14.5, 1.1);
    p.fill(O).round(29, 18, 12, 3.4, 1.7); // sorrisão
    p.fill(PAL.warmWhite).rect(30.5, 18.4, 9, 1.4);
    p.fill(PAL.warmWhite).circle(21, 10, 4); // olhos arregalados, desalinhados
    p.fill(PAL.warmWhite).circle(28, 8.5, 3.2);
    p.fill(PAL.coral).circle(22, 10.5, 2);
    p.fill(O).circle(22.4, 10.6, 1.1).circle(28.8, 8, 1.2);
  });
  make(scene, 'vaca_leg', TEX.vacaLeg.w, TEX.vacaLeg.h, (p) => {
    p.oRound(1.5, 0, 6, 13, 3, PAL.cowWhite, 1);
    p.fill(PAL.cowSpot).ellipse(4.5, 5, 4, 4);
    p.oRound(0.5, 12, 8, 5, 1.5, PAL.hoof, 1);
  });
  make(scene, 'vaca_arm', TEX.vacaArm.w, TEX.vacaArm.h, (p) => {
    // Braço com casco na ponta; pivô no ombro (x = pivotX).
    p.oRound(1, 1.5, 12, 5, 2.5, PAL.cowWhite, 1);
    p.oRound(11, 0.5, 5, 7, 2, PAL.hoof, 1);
  });
  make(scene, 'vaca_bell', TEX.vacaBell.w, TEX.vacaBell.h, (p) => {
    p.oRound(4, 0, 4, 3, 1, PAL.coral, 1); // coleira
    p.fill(O).poly([[2, 12], [3, 3], [9, 3], [10, 12]]);
    p.fill(PAL.brass).poly([[3, 11], [4, 4], [8, 4], [9, 11]]);
    p.fill(0xfff1c1).rect(4.5, 5, 1.3, 5);
    p.oCircle(6, 12, 1.4, PAL.gunMetal, 0.8);
  });

  // ── Pombo Mafioso: sobretudo, óculos escuros e metralhadora no estojo de violino ──
  make(scene, 'pombo_body', TEX.pomboBody.w, TEX.pomboBody.h, (p) => {
    p.oRound(12, 25, 3, 4, 1, PAL.beak, 0.8); // perninhas
    p.oRound(18, 25, 3, 4, 1, PAL.beak, 0.8);
    p.fill(O).poly([[3, 15], [8, 13], [8, 22]]); // rabo
    p.fill(PAL.pigeonDark).poly([[4.5, 15.5], [7.5, 14.5], [7.5, 20]]);
    p.oEllipse(16, 18, 20, 16, PAL.trench); // sobretudo
    p.fill(0xa8864e).rect(7, 18, 18, 2.2); // cinto
    p.fill(PAL.brass).rect(15, 17.6, 3, 3);
    p.fill(0xa8864e).tri(14, 10, 21, 10, 17, 18); // lapela
    p.oCircle(21, 8, 6.5, PAL.pigeon); // cabeça
    p.fill(PAL.pigeonNeck).ellipse(19, 13.5, 11, 3.5); // pescoço furta-cor
    p.fill(PAL.pigeonNeck2).ellipse(19, 14.6, 9, 1.6);
    p.fill(O).round(18, 5.2, 11, 3.6, 1.4); // óculos escuros
    p.fill(0x5b6b8c).rect(19.5, 5.8, 3, 1);
    p.fill(O).tri(26, 9, 32.5, 10.8, 26, 12.5); // bico
    p.fill(0xd9c9b0).tri(26.8, 9.8, 31, 10.8, 26.8, 11.7);
    p.fill(PAL.warmWhite).circle(29.2, 10.2, 0.6);
  });
  make(scene, 'pombo_wing', TEX.pomboWing.w, TEX.pomboWing.h, (p) => {
    p.fill(O).poly([[1, 6], [8, 1], [23, 2], [20, 6], [23, 9], [8, 11]]);
    p.fill(PAL.pigeon).poly([[3, 6], [9, 2.5], [20, 3.4], [17.5, 6], [20, 8], [9, 9.5]]);
    p.fill(PAL.pigeonDark).rect(12, 5.4, 7, 1.2);
  });
  make(scene, 'pombo_hat', 18, 9, (p) => {
    p.oRound(1, 6, 16, 2.5, 1.2, 0x23202b, 1);
    p.oRound(4, 1, 10, 6, 2.5, 0x23202b, 1);
    p.fill(PAL.coral).rect(4, 4.5, 10, 1.4);
  });
  make(scene, 'pombo_gun', TEX.pomboGun.w, TEX.pomboGun.h, (p) => {
    p.oCircle(3, 4.5, 2.6, PAL.pigeon, 0.8); // ponta da asa
    p.fill(O).poly([[5, 1], [14, 0.5], [17, 2], [17, 7], [14, 8.5], [5, 8]]); // estojo de violino
    p.fill(0x8a5a2b).poly([[6, 2], [13.5, 1.6], [16, 3], [16, 6], [13.5, 7.4], [6, 7]]);
    p.fill(PAL.brass).rect(9, 4, 2, 1.4);
    p.oRound(16, 3, 7, 2.6, 0.8, PAL.gunMetal, 0.8); // cano saindo do estojo
  });

  // ── Porco Executivo: terno apertado, gravata, maleta e hélice no chapéu ──
  make(scene, 'porco_body', TEX.porcoBody.w, TEX.porcoBody.h, (p) => {
    p.oRound(15, 40, 6, 5, 1.5, PAL.hoof, 1); // pés
    p.oRound(25, 40, 6, 5, 1.5, PAL.hoof, 1);
    p.stroke(1.6, O).line(5, 27, 1, 24); // rabinho enrolado
    p.fill(O).circle(2, 22, 2.2);
    p.fill(PAL.pig).circle(2, 22, 1.2);
    p.oEllipse(23, 30, 34, 24, PAL.suit); // terno apertadíssimo
    p.fill(PAL.suitLight).ellipse(19, 26, 14, 8);
    p.fill(PAL.warmWhite).tri(20, 19, 30, 19, 25, 32); // camisa
    p.fill(PAL.coral).poly([[24, 20], [26, 20], [27, 30], [25, 33], [23, 30]]); // gravata
    p.fill(O).circle(18, 33, 1.2).circle(31, 33, 1.2); // botões estourando
    p.fill(PAL.gold).circle(34, 25, 1.4); // broche de "funcionário do mês"
    p.oCircle(25, 13, 11, PAL.pig); // cabeção
    p.fill(O).tri(14, 5, 18, 0, 21, 5); // orelhas
    p.fill(PAL.pigDark).tri(15.5, 5, 18, 2, 19.5, 5);
    p.fill(O).tri(29, 4, 33, 0, 35, 6);
    p.fill(PAL.pigDark).tri(30.5, 4.5, 33, 2, 33.8, 5.5);
    p.oRound(31, 11, 11, 9, 4.5, PAL.pigDark, 1.2); // focinho
    p.fill(O).ellipse(34.5, 15.5, 2, 3).ellipse(38.5, 15.5, 2, 3);
    p.fill(O).round(23, 9, 6, 2, 1); // olhinho presunçoso semicerrado
    p.fill(PAL.warmWhite).rect(24, 9, 4, 0.8);
    p.fill(O).rect(22, 6.5, 8, 1.2); // sobrancelha arqueada
    p.fill(O).round(28, 21, 7, 1.4, 0.7); // sorrisinho
  });
  make(scene, 'porco_hat', 20, 16, (p) => {
    p.oRound(2, 12, 16, 3, 1.4, 0x1b1d26, 1); // cartola
    p.oRound(5, 3, 10, 10, 1.5, 0x1b1d26, 1);
    p.fill(PAL.gold).rect(5, 9.5, 10, 1.6);
    p.fill(PAL.gunLight).rect(9, 0, 2, 3.5); // mastro da hélice
  });
  make(scene, 'porco_heli', 40, 6, (p) => {
    p.oRound(1, 1.5, 38, 3, 1.5, PAL.gunLight, 1);
    p.fill(PAL.coral).rect(1.5, 2, 4, 2).rect(34.5, 2, 4, 2);
    p.oCircle(20, 3, 2, PAL.gold, 0.8);
  });
  make(scene, 'porco_case', TEX.porcoCase.w, TEX.porcoCase.h, (p) => {
    p.oRound(1, 4, 9, 6, 3, PAL.suit, 1); // manga
    p.oCircle(10, 7, 2.6, PAL.pig, 0.8); // mão (casco)
    p.oRound(12, 2, 13, 11, 2, 0x7a4a24, 1.2); // maleta
    p.fill(0x5e3519).rect(12.5, 7, 12, 1.2);
    p.fill(PAL.gold).rect(17, 5.5, 3, 3);
    p.stroke(1.4, O).line(15.5, 2, 15.5, 0.5).line(15.5, 0.5, 21.5, 0.5).line(21.5, 0.5, 21.5, 2);
  });
  make(scene, 'b_coin', 14, 14, (p) => {
    p.fill(O).circle(7, 7, 6.6);
    p.fill(PAL.gold).circle(7, 7, 5.4);
    p.fill(0xfff1a8).circle(5.5, 5.5, 1.8);
    p.stroke(1.4, 0xb8860b).line(7, 3.5, 7, 10.5);
    p.stroke(1.2, 0xb8860b).line(5, 5, 9, 5).line(5, 7, 9, 7).line(5, 9, 9, 9);
  });

  // ── Don Pombone: pombo gigante de sobretudo branco, chapéu e corrente de ouro ──
  make(scene, 'pombone_body', TEX.pomboneBody.w, TEX.pomboneBody.h, (p) => {
    p.oRound(36, 80, 8, 11, 3, PAL.beak, 1.5); // pernas finas e ridículas
    p.oRound(52, 80, 8, 11, 3, PAL.beak, 1.5);
    p.fill(O).poly([[4, 50], [20, 42], [22, 66]]); // cauda
    p.fill(PAL.pigeonDark).poly([[8, 50], [18, 46], [19.5, 62]]);
    p.oEllipse(46, 58, 64, 50, PAL.donCoat, 2); // sobretudo branco
    p.fill(0xdcd6c8).ellipse(42, 66, 50, 26);
    p.fill(0xdcd6c8).tri(46, 34, 66, 34, 56, 64); // lapelas
    p.fill(0x1b1d26).tri(51, 36, 61, 36, 56, 58); // camisa preta
    p.fill(PAL.donCoat).rect(54.5, 38, 3, 16); // gravata branca
    p.stroke(2.2, PAL.gold).line(44, 40, 52, 56).line(52, 56, 64, 40); // correntão de ouro
    p.oCircle(52, 57, 3.4, PAL.gold, 1.2);
    p.oCircle(40, 44, 4.2, PAL.coral, 1.2); // cravo vermelho na lapela
    p.fill(0xff8a92).circle(39, 43, 1.6);
    p.fill(0xbfb9ad).rect(16, 70, 60, 2.5); // cinto
    p.oCircle(58, 22, 19, PAL.pigeon, 2); // cabeçona
    p.fill(PAL.pigeonNeck).ellipse(54, 37, 32, 9); // pescoço furta-cor
    p.fill(PAL.pigeonNeck2).ellipse(54, 39.5, 26, 4);
    p.fill(O).tri(72, 20, 94, 25, 72, 30); // bico enorme
    p.fill(0xd9c9b0).tri(74, 21.5, 90, 25, 74, 28.5);
    p.stroke(1.6, 0xc8a46a).line(80, 28, 92, 33); // palito de dente
    p.fill(PAL.warmWhite).circle(64, 17, 6); // olho semicerrado de chefão
    p.fill(O).circle(65.5, 18.5, 3);
    p.fill(PAL.pigeon).rect(57, 10, 14, 6.5); // pálpebra pesada
    p.fill(O).poly([[55, 9], [73, 12], [73, 15], [55, 12.5]]); // sobrancelha grossa
    p.fill(O).circle(60, 30, 1.3).circle(66, 31, 1.3).circle(63, 33, 1.3); // barba por fazer
  });
  make(scene, 'pombone_wing', TEX.pomboneWing.w, TEX.pomboneWing.h, (p) => {
    p.fill(O).poly([[2, 14], [16, 2], [58, 4], [50, 11], [58, 16], [48, 22], [56, 26], [16, 26]]);
    p.fill(PAL.pigeon).poly([[5, 14], [17, 5], [52, 6.5], [45, 11], [52, 15], [43, 21], [49, 23.5], [17, 23]]);
    p.fill(PAL.pigeonDark).rect(24, 10, 18, 2).rect(24, 16, 16, 2);
  });
  make(scene, 'pombone_hat', 52, 24, (p) => {
    p.oRound(2, 17, 48, 6, 3, PAL.donCoat, 1.5); // aba
    p.oRound(10, 3, 32, 16, 6, PAL.donCoat, 1.5); // copa
    p.fill(0x1b1d26).rect(10, 12, 32, 4.5); // faixa
    p.fill(PAL.coral).poly([[36, 12], [46, 0], [44, 8], [40, 14]]); // pena
  });
  make(scene, 'pombone_gun', TEX.pomboneGun.w, TEX.pomboneGun.h, (p) => {
    p.oCircle(7, 11, 6, PAL.pigeon, 1.2); // ponta da asa
    p.oRound(12, 6, 32, 9, 2, PAL.gold, 1.4); // metralhadora de ouro
    p.oCircle(26, 17, 6, 0xd4a017, 1.2); // tambor
    p.fill(0xfff1a8).rect(14, 7.5, 28, 1.6);
    p.oRound(43, 8, 19, 5, 1.5, 0xd4a017, 1.2); // cano
    p.fill(O).rect(46, 9.5, 14, 1);
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
  make(scene, 'b_player', 22, 8, (p) => {
    p.fill(PAL.amber, 0.35).round(0, 1, 22, 6, 3);
    p.fill(PAL.amber).round(5, 2, 17, 4, 2);
    p.fill(0xfffbe8).round(11, 2.7, 10, 2.6, 1.3);
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
