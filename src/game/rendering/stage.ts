import Phaser from 'phaser';
import type { Terrain } from '@/core/physics/terrain';
import { ARENA, VIEW_HEIGHT, VIEW_WIDTH } from '../data/arena';
import { RENDER_ZOOM, VIEW_MARGIN } from '../data/view';
import { NEON } from './palette';

/** Resolução do cenário assado: a mesma do canvas, então fica nítido sem gastar à toa. */
const S = RENDER_ZOOM;
const X0 = -VIEW_MARGIN.side;
const Y0 = -VIEW_MARGIN.top;
const BG_W = VIEW_WIDTH + VIEW_MARGIN.side * 2;
const BG_H = VIEW_HEIGHT + VIEW_MARGIN.top + VIEW_MARGIN.bottom;
const HORIZON = 352;
const VANISH_X = VIEW_WIDTH / 2;
const SUN = { x: VIEW_WIDTH / 2, y: 372, r: 152 };
const FONT_DISPLAY = '"Arial Black", "Trebuchet MS", system-ui, sans-serif';
const FONT_SCRIPT = '"Brush Script MT", "Segoe Script", "Comic Sans MS", cursive';

/** Converte coordenadas do mundo para pixels da textura do cenário. */
const tx = (x: number) => (x - X0) * S;
const ty = (y: number) => (y - Y0) * S;

/**
 * Ocean Drive à meia-noite: pôr do sol listrado, mar, prédios art déco com
 * neon, palmeiras e o chão em grade synthwave seguindo o relevo. Os inimigos
 * descem do topo, então a metade de cima fica calma (céu e silhuetas escuras).
 * Tudo estático vira UMA textura; só neon, holofotes e o letreiro de VHS são
 * objetos animados, e baratos.
 */
export class Stage {
  private readonly signs: Phaser.GameObjects.Text[] = [];
  private readonly beams: Phaser.GameObjects.Image[] = [];
  private readonly stars: Phaser.GameObjects.Image[] = [];
  private readonly edgeGlow: Phaser.GameObjects.Image;
  private readonly rec: Phaser.GameObjects.Text;
  private readonly counter: Phaser.GameObjects.Text;
  private flickerTimer = 0;
  private time = 0;
  private shownSecond = -1;
  /** 0..1, sobe com o combo e acende o neon. */
  excitement = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly terrain: Terrain,
  ) {
    this.bakeTextures();
    scene.add.image(X0, Y0, 'miami_bg').setOrigin(0).setScale(1 / S).setDepth(-100);

    // Holofotes de estreia varrendo o céu por trás dos prédios.
    for (const [x, tint, phase] of [
      [230, NEON.pink, 0],
      [970, NEON.cyan, 2.4],
    ] as const) {
      const beam = scene.add
        .image(x, HORIZON - 30, 'beam')
        .setOrigin(0.5, 1)
        .setScale(1 / S)
        .setTint(tint)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.16)
        .setDepth(-99);
      beam.setData('phase', phase);
      this.beams.push(beam);
    }

    // Estrelas piscando no alto.
    for (let i = 0; i < 28; i++) {
      const x = X0 + ((i * 397) % BG_W);
      const y = Y0 + 8 + ((i * 131) % (HORIZON - 150 - Y0));
      const star = scene.add
        .image(x, y, 'px_dot')
        .setScale(0.18 + (i % 3) * 0.08)
        .setAlpha(0.6)
        .setDepth(-98);
      star.setData('phase', i * 1.3);
      this.stars.push(star);
    }

    // Letreiros de neon nos prédios (piscam, e piscam mais com o combo).
    this.sign(178, 214, 'OCEAN\nDRIVE', NEON.cyanCss, 22, FONT_DISPLAY, -0.02);
    this.sign(1012, 206, 'Vídeo Replay', NEON.pinkCss, 30, FONT_SCRIPT, -0.06);
    this.sign(1012, 238, 'LOCADORA · 24H', NEON.yellowCss, 11, FONT_DISPLAY, -0.06);
    this.sign(VIEW_WIDTH / 2, HORIZON + 30, 'ShootUp!', NEON.pinkCss, 46, FONT_SCRIPT, -0.04, 0.3);

    // Brilho do tubo de neon que contorna o chão; pulsa com o combo.
    this.edgeGlow = scene.add
      .image(X0, Y0, 'edge_glow')
      .setOrigin(0)
      .setScale(1 / S)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.5)
      .setDepth(-95);

    // Faixa de cima vira o OSD de uma fita VHS (só aparece em telas mais altas
    // que a arena). Fica na frente dos inimigos: eles surgem "de trás da fita".
    scene.add.image(X0, Y0, 'vhs_band').setOrigin(0).setScale(1 / S).setDepth(48);
    this.rec = scene.add
      .text(40, -VIEW_MARGIN.top / 2, '▶ PLAY', {
        fontFamily: '"Courier New", monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#F7F1E8',
      })
      .setOrigin(0, 0.5)
      .setDepth(49)
      .setResolution(2);
    this.counter = scene.add
      .text(VIEW_WIDTH - 40, -VIEW_MARGIN.top / 2, 'SP 0:00:00', {
        fontFamily: '"Courier New", monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#F7F1E8',
      })
      .setOrigin(1, 0.5)
      .setDepth(49)
      .setResolution(2);
  }

  private sign(
    x: number,
    y: number,
    text: string,
    color: string,
    size: number,
    font: string,
    rotation: number,
    alpha = 1,
  ): void {
    const t = this.scene.add
      .text(x, y, text, {
        fontFamily: font,
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color,
        align: 'center',
        stroke: '#1a0630',
        strokeThickness: Math.max(3, size / 7),
        lineSpacing: -4,
        shadow: { color, blur: 14, fill: true, stroke: true, offsetX: 0, offsetY: 0 },
      })
      .setOrigin(0.5)
      .setRotation(rotation)
      .setAlpha(alpha)
      .setDepth(-97)
      .setResolution(2);
    t.setData('base', alpha);
    this.signs.push(t);
  }

  /** Reposiciona o OSD da fita na faixa de cima que a janela atual mostra. */
  setView(top: number): void {
    const visible = -top > 22;
    this.rec.setVisible(visible).setY(top / 2);
    this.counter.setVisible(visible).setY(top / 2);
  }

  update(dt: number, reducedMotion: boolean): void {
    this.time += dt;
    const ex = this.excitement;

    // Neon: falha de vez em quando; com combo alto, pisca no ritmo.
    this.flickerTimer -= dt;
    if (this.flickerTimer <= 0) {
      this.flickerTimer = ex > 0.5 ? 0.12 : 0.18 + Math.random() * 0.5;
      for (const s of this.signs) {
        const base = s.getData('base') as number;
        const off = ex > 0.5 ? Math.random() < 0.35 : Math.random() < 0.06;
        s.setAlpha(off && !reducedMotion ? base * 0.35 : base);
      }
    }
    this.edgeGlow.setAlpha(0.35 + ex * 0.6 + (reducedMotion ? 0 : Math.sin(this.time * (2 + ex * 8)) * 0.1));

    if (!reducedMotion) {
      for (const b of this.beams) b.setRotation(Math.sin(this.time * 0.45 + (b.getData('phase') as number)) * 0.55);
      for (const s of this.stars) s.setAlpha(0.35 + Math.abs(Math.sin(this.time * 1.7 + (s.getData('phase') as number))) * 0.6);
    }

    // OSD da fita: contador de tempo e "PLAY" piscando.
    const sec = Math.floor(this.time);
    if (sec !== this.shownSecond) {
      this.shownSecond = sec;
      const m = Math.floor(sec / 60) % 60;
      const h = Math.floor(sec / 3600);
      this.counter.setText(`SP ${h}:${String(m).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`);
      this.rec.setAlpha(sec % 2 === 0 || reducedMotion ? 1 : 0.55);
    }
    this.excitement = Math.max(0, ex - dt * 0.15);
  }

  private bakeTextures(): void {
    const tex = this.scene.textures;
    if (!tex.exists('beam')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      const w = 120;
      const h = 520;
      // Gradiente na mão: o Canvas do generateTexture ignora fillGradientStyle.
      for (let y = 0; y < h; y += 4) {
        const t = y / h;
        const half = (w / 2) * (1 - t);
        g.fillStyle(0xffffff, 0.9 * t);
        g.fillRect((w / 2 - half) * S, y * S, half * 2 * S, 4 * S);
      }
      g.generateTexture('beam', w * S, h * S);
      g.destroy();
    }
    if (!tex.exists('vhs_band')) this.bakeVhsBand();
    if (!tex.exists('edge_glow')) this.bakeEdgeGlow();
    if (!tex.exists('miami_bg')) this.bakeBackground();
  }

  private groundPoints(offset = 0): Phaser.Geom.Point[] {
    const pts: Phaser.Geom.Point[] = [];
    for (let x = X0; x <= X0 + BG_W; x += 4) {
      const gx = Math.min(VIEW_WIDTH, Math.max(0, x));
      pts.push(new Phaser.Geom.Point(tx(x), ty(this.terrain.groundAt(gx) + offset)));
    }
    return pts;
  }

  private bakeVhsBand(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const h = VIEW_MARGIN.top;
    vgrad(g, 0, 0, BG_W * S, h * S, 0x07020f, 0x12052a);
    g.fillStyle(0xffffff, 0.035);
    for (let y = 0; y < h; y += 3) g.fillRect(0, y * S, BG_W * S, 1 * S);
    g.fillStyle(NEON.pink, 1);
    g.fillRect(0, (h - 3) * S, BG_W * S, 3 * S);
    g.fillStyle(NEON.cyan, 1);
    g.fillRect(0, (h - 6) * S, BG_W * S, 1.5 * S);
    g.generateTexture('vhs_band', BG_W * S, h * S);
    g.destroy();
  }

  private bakeEdgeGlow(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const top = this.groundPoints();
    g.lineStyle(16 * S, NEON.cyan, 0.12);
    g.strokePoints(top, false);
    g.lineStyle(8 * S, NEON.cyan, 0.25);
    g.strokePoints(top, false);
    g.generateTexture('edge_glow', BG_W * S, BG_H * S);
    g.destroy();
  }

  private bakeBackground(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const W = BG_W * S;
    const H = BG_H * S;

    // Céu: anil no alto → roxo → magenta → laranja no horizonte.
    const bands: Array<[number, number, number]> = [
      [Y0, 0x0b0322, 0x1d0a4a],
      [120, 0x1d0a4a, 0x4a1170],
      [240, 0x4a1170, 0xa4247f],
      [310, 0xa4247f, 0xf2546b],
    ];
    for (let i = 0; i < bands.length; i++) {
      const [y, c0, c1] = bands[i] as [number, number, number];
      const y1 = i + 1 < bands.length ? (bands[i + 1] as [number, number, number])[0] : HORIZON;
      vgrad(g, 0, ty(y), W, (y1 - y) * S + 1, c0, c1);
    }

    // Sol retrô listrado (fatias com frestas que engrossam para baixo).
    for (let y = SUN.y - SUN.r; y < Math.min(HORIZON, SUN.y + SUN.r); y += 2) {
      const k = (y - (SUN.y - SUN.r)) / (SUN.r * 2);
      const below = y - (SUN.y - SUN.r * 0.25);
      if (below > 0 && below % 14 < 2 + below / 16) continue;
      const half = Math.sqrt(Math.max(0, SUN.r * SUN.r - (y - SUN.y) * (y - SUN.y)));
      g.fillStyle(lerpColor(0xffb35c, 0xff3d8b, Math.min(1, k * 1.25)), 0.72);
      g.fillRect(tx(SUN.x - half), ty(y), half * 2 * S, 2 * S + 0.5);
    }

    // Mar com reflexos do sol.
    vgrad(g, 0, ty(HORIZON), W, (ARENA.floorY - HORIZON + 10) * S, 0x3a1272, 0x14052e);
    g.fillStyle(0xff7ab8, 0.55);
    for (let i = 0; i < 9; i++) {
      const y = HORIZON + 5 + i * 8;
      const half = 120 - i * 9 + (i % 2) * 18;
      g.fillRect(tx(SUN.x - half), ty(y), half * 2 * S, 1.6 * S);
    }
    g.lineStyle(2 * S, 0xffb3d9, 0.8);
    g.lineBetween(0, ty(HORIZON), W, ty(HORIZON));

    // Prédios art déco dos dois lados, com neon nas quinas e janelas acesas.
    const buildings: Array<[number, number, number]> = [
      [X0, 70, 210],
      [40, 110, 160],
      [118, 128, 186],
      [238, 92, 238],
      [318, 70, 268],
      [812, 76, 262],
      [880, 96, 222],
      [966, 140, 170],
      [1100, 96, 200],
      [1190, 120, 236],
    ];
    for (const [x, w, top] of buildings) this.building(g, x, w, top);
    this.palm(g, 70, ARENA.floorY - 40, 1.05, -0.12);
    this.palm(g, 380, ARENA.floorY - 60, 0.85, 0.1);
    this.palm(g, 800, ARENA.floorY - 60, 0.8, -0.08);
    this.palm(g, 1135, ARENA.floorY - 40, 1.1, 0.14);

    // Muretinha do calçadão atrás do chão, em rosa pastel art déco.
    g.fillStyle(0x3d1466, 1);
    g.fillRect(0, ty(ARENA.floorY - 34), W, 40 * S);
    g.fillStyle(0x5a1f86, 1);
    for (let x = X0; x < X0 + BG_W; x += 40) g.fillRect(tx(x + 3), ty(ARENA.floorY - 30), 34 * S, 3 * S);
    g.fillStyle(NEON.pink, 0.7);
    g.fillRect(0, ty(ARENA.floorY - 36), W, 2 * S);

    // Chão: preenche abaixo do relevo e risca a grade synthwave em perspectiva.
    const top = this.groundPoints();
    g.fillStyle(0x16052c, 1);
    g.fillPoints([...top, new Phaser.Geom.Point(W, H), new Phaser.Geom.Point(0, H)], true);
    const bottom = Y0 + BG_H;
    // Linhas horizontais: cada vez mais espaçadas perto da câmera.
    g.lineStyle(1.6 * S, NEON.pink, 0.55);
    for (let i = 1; ; i++) {
      const y = ARENA.floorY - 34 + i * i * 2.2;
      if (y > bottom) break;
      this.gridRow(g, y);
    }
    // Linhas que fogem para o horizonte, só abaixo do relevo.
    g.lineStyle(1.4 * S, NEON.violet, 0.6);
    for (let i = -24; i <= 24; i++) {
      const xb = VANISH_X + i * 70;
      this.gridRay(g, xb, bottom);
    }
    // Faixa mais escura logo abaixo da borda: dá volume às rampas.
    g.fillStyle(0x16052c, 0.75);
    g.fillPoints([...top, ...this.groundPoints(10).reverse()], true);
    // Tubo de neon contínuo na borda.
    g.lineStyle(3 * S, NEON.cyan, 1);
    g.strokePoints(top, false);
    g.lineStyle(1 * S, 0xe9fdff, 0.9);
    g.strokePoints(this.groundPoints(-0.8), false);

    // Paredes da arena: postes de neon art déco.
    for (const x of [ARENA.left - 10, ARENA.right + 10]) {
      const gy = this.terrain.groundAt(Math.min(VIEW_WIDTH, Math.max(0, x)));
      g.fillStyle(0x2a0b55, 1);
      g.fillRect(tx(x - 6), ty(40), 12 * S, (gy - 40) * S);
      g.fillStyle(NEON.pink, 0.9);
      g.fillRect(tx(x - 1), ty(46), 2 * S, (gy - 52) * S);
      g.fillStyle(NEON.cyan, 1);
      g.fillCircle(tx(x), ty(40), 6 * S);
    }

    g.generateTexture('miami_bg', W, H);
    g.destroy();
  }

  private gridRow(g: Phaser.GameObjects.Graphics, y: number): void {
    let start: number | null = null;
    for (let x = X0; x <= X0 + BG_W + 4; x += 4) {
      const below = x <= X0 + BG_W && y > this.terrain.groundAt(Math.min(VIEW_WIDTH, Math.max(0, x))) + 6;
      if (below && start === null) start = x;
      if (!below && start !== null) {
        g.lineBetween(tx(start), ty(y), tx(x - 4), ty(y));
        start = null;
      }
    }
  }

  private gridRay(g: Phaser.GameObjects.Graphics, xb: number, bottom: number): void {
    const steps = 80;
    let prev: { x: number; y: number } | null = null;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = HORIZON + (bottom - HORIZON) * t;
      const x = VANISH_X + (xb - VANISH_X) * t;
      const gx = Math.min(VIEW_WIDTH, Math.max(0, x));
      const ok = y > this.terrain.groundAt(gx) + 6 && x >= X0 && x <= X0 + BG_W;
      if (ok && prev) g.lineBetween(tx(prev.x), ty(prev.y), tx(x), ty(y));
      prev = ok ? { x, y } : null;
    }
  }

  private building(g: Phaser.GameObjects.Graphics, x: number, w: number, top: number): void {
    const base = HORIZON + 4;
    g.fillStyle(0x2b0d4f, 1);
    g.fillRect(tx(x), ty(top), w * S, (base - top) * S);
    // Coroa escalonada art déco.
    g.fillRect(tx(x + w * 0.2), ty(top - 14), w * 0.6 * S, 14 * S);
    g.fillRect(tx(x + w * 0.38), ty(top - 26), w * 0.24 * S, 12 * S);
    g.fillStyle(0x1f0a3c, 1);
    g.fillRect(tx(x + w - 10), ty(top), 10 * S, (base - top) * S);
    // Neon nas quinas.
    const neon = (x * 7) % 3 === 0 ? NEON.cyan : NEON.pink;
    g.lineStyle(1.6 * S, neon, 0.85);
    g.lineBetween(tx(x + 1), ty(top), tx(x + 1), ty(base));
    g.lineBetween(tx(x), ty(top), tx(x + w), ty(top));
    g.lineBetween(tx(x + w * 0.2), ty(top - 14), tx(x + w * 0.8), ty(top - 14));
    // Janelas acesas (determinísticas pela posição).
    for (let wy = top + 12; wy < base - 12; wy += 16) {
      for (let wx = x + 10; wx < x + w - 16; wx += 14) {
        const h = Math.abs(Math.sin(wx * 12.9898 + wy * 78.233) * 43758.5453) % 1;
        if (h < 0.55) continue;
        g.fillStyle(h > 0.85 ? NEON.cyan : 0xffd27a, h > 0.85 ? 0.75 : 0.6);
        g.fillRect(tx(wx), ty(wy), 6 * S, 8 * S);
      }
    }
  }

  private palm(g: Phaser.GameObjects.Graphics, x: number, baseY: number, scale: number, lean: number): void {
    const color = 0x12041f;
    const h = 210 * scale;
    let px = x;
    let py = baseY;
    g.fillStyle(color, 1);
    // Tronco curvo em gomos.
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      const nx = x + Math.sin(t * 1.4) * lean * h;
      const ny = baseY - t * h;
      g.fillEllipse(tx(nx), ty(ny), (12 - t * 4) * scale * S, 18 * scale * S);
      px = nx;
      py = ny;
    }
    // Folhas: arcos de elipses caindo para os lados.
    for (const [dir, droop] of [
      [-1, 0.5],
      [1, 0.5],
      [-1, 1.1],
      [1, 1.1],
      [-0.4, -0.2],
      [0.5, -0.1],
    ] as const) {
      for (let j = 1; j <= 7; j++) {
        const t = j / 7;
        const fx = px + dir * t * 70 * scale;
        const fy = py - 6 * scale + (t * t * droop * 50 - t * 12) * scale;
        g.fillEllipse(tx(fx), ty(fy), (20 - t * 12) * scale * S, (8 - t * 4) * scale * S);
      }
    }
    g.fillCircle(tx(px), ty(py), 8 * scale * S);
  }
}

/** Degradê vertical em faixas finas (funciona no Canvas do generateTexture). */
function vgrad(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, c0: number, c1: number): void {
  const step = 3;
  for (let i = 0; i < h; i += step) {
    g.fillStyle(lerpColor(c0, c1, i / h), 1);
    g.fillRect(x, y + i, w, Math.min(step, h - i) + 0.5);
  }
}

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const r = Math.round(ar + (((b >> 16) & 0xff) - ar) * t);
  const gg = Math.round(ag + (((b >> 8) & 0xff) - ag) * t);
  const bb = Math.round(ab + ((b & 0xff) - ab) * t);
  return (r << 16) | (gg << 8) | bb;
}
