import Phaser from 'phaser';
import type { Terrain } from '@/core/physics/terrain';
import { ARENA, VIEW_HEIGHT, VIEW_WIDTH } from '../data/arena';
import { VIEW_MARGIN } from '../data/view';
import { PIXEL_FONT, VHS_FONT } from './fonts';
import { NEON } from './palette';
import { addPixelTexture } from './pixel/bake';
import { bayer, mix, PixelCanvas } from './pixel/PixelCanvas';

/** Cenário em pixel art: 1 texel por unidade do mundo, como os personagens. */
const S = 1;
const X0 = -VIEW_MARGIN.side;
const Y0 = -VIEW_MARGIN.top;
const BG_W = VIEW_WIDTH + VIEW_MARGIN.side * 2;
const BG_H = VIEW_HEIGHT + VIEW_MARGIN.top + VIEW_MARGIN.bottom;
const HORIZON = 352;
const VANISH_X = VIEW_WIDTH / 2;
const SUN = { x: VIEW_WIDTH / 2, y: 372, r: 152 };
const FONT_DISPLAY = PIXEL_FONT;
const FONT_SCRIPT = PIXEL_FONT;

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
    this.sign(1012, 206, 'Video Replay', NEON.pinkCss, 30, FONT_SCRIPT, -0.06);
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
        fontFamily: VHS_FONT,
        fontSize: '24px',
        color: '#F7F1E8',
      })
      .setOrigin(0, 0.5)
      .setDepth(49)
      .setResolution(1);
    this.counter = scene.add
      .text(VIEW_WIDTH - 40, -VIEW_MARGIN.top / 2, 'SP 0:00:00', {
        fontFamily: VHS_FONT,
        fontSize: '24px',
        color: '#F7F1E8',
      })
      .setOrigin(1, 0.5)
      .setDepth(49)
      .setResolution(1);
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
        fontSize: `${Math.round(size * 1.3)}px`,
        color,
        align: 'center',
        stroke: '#1a0630',
        strokeThickness: Math.max(3, size / 7),
        lineSpacing: -4,
        shadow: { color, blur: 6, fill: true, stroke: true, offsetX: 0, offsetY: 0 },
      })
      .setOrigin(0.5)
      .setRotation(rotation)
      .setAlpha(alpha)
      .setDepth(-97)
      .setResolution(1);
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
    if (!tex.exists('beam')) this.bakeBeam();
    if (!tex.exists('vhs_band')) this.bakeVhsBand();
    if (!tex.exists('edge_glow')) this.bakeEdgeGlow();
    if (!tex.exists('miami_bg')) this.bakeBackground();
  }

  private upload(key: string, pc: PixelCanvas): void {
    addPixelTexture(this.scene, key, pc.width, pc.height, pc.data);
  }

  /** Holofote: cone em degraus de transparência (pixel art não tem degradê liso). */
  private bakeBeam(): void {
    const w = 120;
    const h = 520;
    const pc = new PixelCanvas(w, h);
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const half = (w / 2) * (1 - t);
      const a = Math.ceil(t * 4) / 4;
      for (let x = Math.round(w / 2 - half); x < Math.round(w / 2 + half); x++) {
        if (bayer(x, y) < 0.92) pc.pset(x, y, 0xffffff, a * 0.9);
      }
    }
    this.upload('beam', pc);
  }

  /** Altura do chão (em pixels da textura) em cada coluna. */
  private groundRow(px: number): number {
    const x = X0 + px;
    return Math.round(ty(this.terrain.groundAt(Math.min(VIEW_WIDTH, Math.max(0, x)))));
  }

  private bakeVhsBand(): void {
    const h = Math.round(VIEW_MARGIN.top);
    const pc = new PixelCanvas(BG_W, h);
    pc.vbands(0, 0, BG_W, h, [0x07020f, 0x0b0418, 0x12052a]);
    // Linhas de varredura da fita.
    for (let y = 0; y < h; y += 3) pc.hline(0, BG_W, y, 0xffffff, 0.035);
    pc.rect(0, h - 3, BG_W, 3, NEON.pink);
    pc.rect(0, h - 6, BG_W, 1, NEON.cyan);
    this.upload('vhs_band', pc);
  }

  private bakeEdgeGlow(): void {
    const pc = new PixelCanvas(BG_W, BG_H);
    for (let x = 0; x < BG_W; x++) {
      const gy = this.groundRow(x);
      for (let d = -8; d <= 8; d++) {
        const k = 1 - Math.abs(d) / 9;
        const a = k > 0.6 ? 0.3 : k > 0.3 ? 0.16 : 0.08;
        if (bayer(x, gy + d) < 0.85) pc.pset(x, gy + d, NEON.cyan, a);
      }
    }
    this.upload('edge_glow', pc);
  }

  private bakeBackground(): void {
    const pc = new PixelCanvas(BG_W, BG_H);
    const horizon = Math.round(ty(HORIZON));
    const wallTop = Math.round(ty(ARENA.floorY - 34));

    // Céu: anil no alto → roxo → magenta → coral no horizonte, em faixas pontilhadas.
    pc.vbands(0, 0, BG_W, horizon, [0x0b0322, 0x120530, 0x1a0842, 0x260b52, 0x3a0f63, 0x55136f, 0x7a1a78, 0xa4247f, 0xcf3478, 0xf2546b]);

    // Estrelas fixas (as que piscam são objetos à parte).
    for (let i = 0; i < 90; i++) {
      const x = (i * 211 + 37) % BG_W;
      const y = (i * 97 + 11) % Math.max(1, horizon - 170);
      pc.pset(x, y, i % 7 === 0 ? 0xffe3f6 : 0x8d6fd0);
      if (i % 13 === 0) {
        pc.pset(x - 1, y, 0x6a4ab0);
        pc.pset(x + 1, y, 0x6a4ab0);
        pc.pset(x, y - 1, 0x6a4ab0);
        pc.pset(x, y + 1, 0x6a4ab0);
      }
    }

    this.sun(pc, horizon);
    this.skyline(pc, horizon);

    // Mar com reflexos do sol em traços quebrados.
    pc.vbands(0, horizon, BG_W, wallTop - horizon + 2, [0x3a1272, 0x2e0e60, 0x23094c, 0x1a073c]);
    const sx = tx(SUN.x);
    for (let i = 0; i < 11; i++) {
      const y = horizon + 3 + i * 6;
      const half = 128 - i * 9 + (i % 2) * 14;
      const color = i < 3 ? 0xffb35c : i < 6 ? 0xff7ab8 : 0xc0479a;
      for (let x = Math.round(sx - half); x < sx + half; x++) {
        const seg = Math.floor((x + i * 13) / (7 + (i % 3) * 3));
        if ((seg * 7 + i) % 4 === 0) continue;
        pc.pset(x, y, color);
      }
    }
    pc.hline(0, BG_W, horizon, 0xffb3d9);
    pc.hline(0, BG_W, horizon + 1, 0xa4247f);

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
    for (const [x, w, top] of buildings) this.building(pc, x, w, top, horizon);
    this.palm(pc, 70, ARENA.floorY - 40, 1.05, -0.12);
    this.palm(pc, 380, ARENA.floorY - 60, 0.85, 0.1);
    this.palm(pc, 800, ARENA.floorY - 60, 0.8, -0.08);
    this.palm(pc, 1135, ARENA.floorY - 40, 1.1, 0.14);

    // Muretinha do calçadão em rosa art déco, com frisos e neon no topo.
    pc.rect(0, wallTop, BG_W, 40, 0x3d1466);
    pc.rect(0, wallTop + 1, BG_W, 1, 0x5a1f86);
    for (let x = 0; x < BG_W; x += 40) {
      pc.rect(x + 3, wallTop + 4, 34, 3, 0x5a1f86);
      pc.rect(x + 3, wallTop + 7, 34, 1, 0x2c0d4c);
      pc.rect(x + 19, wallTop + 10, 2, 26, 0x4a1877);
      pc.rect(x + 21, wallTop + 10, 1, 26, 0x2c0d4c);
    }
    pc.rect(0, wallTop - 2, BG_W, 2, NEON.pink);
    pc.hline(0, BG_W, wallTop - 3, 0xff8fd0);

    this.ground(pc);

    // Paredes da arena: postes de neon art déco.
    for (const x of [ARENA.left - 10, ARENA.right + 10]) {
      const gy = Math.round(ty(this.terrain.groundAt(Math.min(VIEW_WIDTH, Math.max(0, x)))));
      const px = Math.round(tx(x));
      const top = Math.round(ty(40));
      pc.rect(px - 6, top, 12, gy - top, 0x2a0b55);
      pc.rect(px - 6, top, 1, gy - top, 0x4a1a7a);
      pc.rect(px + 5, top, 1, gy - top, 0x1a0738);
      pc.rect(px - 1, top + 6, 2, gy - top - 12, NEON.pink);
      pc.rect(px - 2, top + 6, 1, gy - top - 12, 0x8a1a66);
      pc.rect(px + 1, top + 6, 1, gy - top - 12, 0xff8fd0);
      pc.ellipse(px, top, 6, 6, 0x0e7c9a);
      pc.ellipse(px, top, 5, 5, NEON.cyan);
      pc.ellipse(px - 1, top - 1, 2, 2, 0xe9fdff);
    }

    this.upload('miami_bg', pc);
  }

  /** Sol retrô listrado, com halo pontilhado em volta. */
  private sun(pc: PixelCanvas, horizon: number): void {
    const cx = tx(SUN.x);
    const cy = ty(SUN.y);
    const r = SUN.r;
    const ramp = [0xffe08a, 0xffc46a, 0xffa45c, 0xff7d5e, 0xff5a72, 0xff3d8b];
    for (let y = Math.floor(cy - r - 12); y < horizon; y++) {
      for (let x = Math.floor(cx - r - 12); x <= cx + r + 12; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d > r) {
          // Halo: duas coroas pontilhadas.
          if (d < r + 6 && bayer(x, y) < 0.5) pc.pset(x, y, 0xff4f8f, 0.35);
          else if (d < r + 12 && bayer(x, y) < 0.25) pc.pset(x, y, 0xff4f8f, 0.25);
          continue;
        }
        const below = y - (cy - r * 0.25);
        if (below > 0 && below % 14 < 2 + below / 16) continue;
        const t = ((y - (cy - r)) / (r * 2)) * 1.25 * (ramp.length - 1);
        const i = Math.min(ramp.length - 2, Math.floor(t));
        const f = Math.min(1, t - i);
        pc.pset(x, y, bayer(x, y) < f ? (ramp[i + 1] as number) : (ramp[i] as number));
      }
    }
  }

  /** Silhuetas distantes da cidade, na frente do sol só nas pontas. */
  private skyline(pc: PixelCanvas, horizon: number): void {
    const cx = tx(SUN.x);
    let x = 0;
    let i = 0;
    while (x < BG_W) {
      const w = 18 + ((i * 37) % 26);
      const h = 18 + ((i * 53) % 52);
      if (Math.abs(x + w / 2 - cx) > 150) {
        pc.rect(x, horizon - h, w, h, 0x4a1260);
        pc.rect(x, horizon - h, w, 1, 0x6a1c74);
        if (i % 3 === 0) pc.rect(x + Math.floor(w / 2), horizon - h - 8, 1, 8, 0x4a1260);
        if (i % 3 === 0) pc.pset(x + Math.floor(w / 2), horizon - h - 9, 0xff4f7a);
      }
      x += w + ((i * 7) % 5);
      i++;
    }
  }

  private building(pc: PixelCanvas, wx: number, w: number, topY: number, horizon: number): void {
    const x = Math.round(tx(wx));
    const top = Math.round(ty(topY));
    const base = horizon + 4;
    const body = 0x2b0d4f;
    pc.rect(x, top, w, base - top, body);
    // Coroa escalonada art déco.
    const c1 = Math.round(w * 0.2);
    const c2 = Math.round(w * 0.38);
    pc.rect(x + c1, top - 14, w - c1 * 2, 14, body);
    pc.rect(x + c2, top - 26, w - c2 * 2, 12, body);
    // Volume: quina iluminada à esquerda, face em sombra à direita.
    pc.rect(x + w - 10, top, 10, base - top, 0x1f0a3c);
    pc.rect(x + w - c1 - 6, top - 14, 6, 14, 0x1f0a3c);
    pc.rect(x + 1, top + 1, 1, base - top, 0x4a1a7a);
    // Faixas horizontais art déco.
    for (let y = top + 6; y < base; y += 48) pc.rect(x + 2, y, w - 12, 1, 0x3a1466);
    // Neon nas quinas: tubo + brilho de 1 pixel em volta.
    const neon = (wx * 7) % 3 === 0 ? NEON.cyan : NEON.pink;
    const glow = mix(neon, body, 0.6);
    pc.rect(x, top, 1, base - top, neon);
    pc.rect(x + 1, top + 1, 1, base - top, glow);
    pc.rect(x, top, w, 1, neon);
    pc.rect(x, top + 1, w, 1, glow);
    pc.rect(x + c1, top - 14, w - c1 * 2, 1, neon);
    pc.rect(x + c1, top - 13, w - c1 * 2, 1, glow);
    // Antena com luz vermelha nos prédios mais altos.
    if (w > 100) {
      const ax = x + Math.round(w / 2);
      pc.rect(ax, top - 44, 1, 18, 0x3a1466);
      pc.pset(ax, top - 45, 0xff3d5a);
      pc.pset(ax - 1, top - 45, 0x8a1a3a);
      pc.pset(ax + 1, top - 45, 0x8a1a3a);
    }
    // Janelas (determinísticas pela posição): quentes, ciano ou apagadas.
    for (let wy = topY + 12; wy < HORIZON + 4 - 12; wy += 16) {
      for (let wxx = wx + 10; wxx < wx + w - 16; wxx += 14) {
        const h = Math.abs(Math.sin(wxx * 12.9898 + wy * 78.233) * 43758.5453) % 1;
        const px = Math.round(tx(wxx));
        const py = Math.round(ty(wy));
        if (h < 0.55) {
          pc.rect(px, py, 5, 7, 0x1a0833);
          pc.pset(px, py, 0x3a1466);
          continue;
        }
        const lit = h > 0.85 ? 0x6ef0ff : 0xffd27a;
        const hi = h > 0.85 ? 0xd0ffff : 0xfff0c0;
        const lo = h > 0.85 ? 0x2a9ac0 : 0xc8883a;
        pc.rect(px, py, 5, 7, lit);
        pc.rect(px, py, 5, 1, hi);
        pc.rect(px, py + 6, 5, 1, lo);
        pc.rect(px + 2, py + 1, 1, 5, lo); // caixilho
        pc.rect(px - 1, py + 7, 7, 1, 0x3a1466); // peitoril
      }
    }
  }

  /** Palmeira em silhueta com contraluz rosa do lado do sol. */
  private palm(pc: PixelCanvas, x: number, baseY: number, scale: number, lean: number): void {
    const dark = 0x12041f;
    const ring = 0x1d0832;
    const rim = 0x6a1c6e;
    const h = 210 * scale;
    const towardSun = x < SUN.x ? 1 : -1;
    let topX = tx(x);
    let topY = ty(baseY);
    const steps = Math.round(h);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = tx(x + Math.sin(t * 1.4) * lean * h);
      const cy = ty(baseY - t * h);
      const half = ((12 - t * 5) * scale) / 2;
      const color = Math.floor(i / 4) % 2 === 0 ? dark : ring;
      pc.hline(cx - half, cx + half, cy, color);
      pc.pset(Math.round(cx + towardSun * half), Math.round(cy), rim);
      topX = cx;
      topY = cy;
    }
    // Folhas: arcos com folíolos pendurados.
    for (const [dir, droop, len] of [
      [-1, 0.5, 1],
      [1, 0.5, 1],
      [-1, 1.1, 0.9],
      [1, 1.1, 0.9],
      [-0.4, -0.2, 0.7],
      [0.5, -0.1, 0.75],
    ] as const) {
      let px = topX;
      let py = topY;
      const n = 22;
      for (let j = 1; j <= n; j++) {
        const t = j / n;
        const fx = topX + dir * t * 72 * scale * len;
        const fy = topY - 6 * scale + (t * t * droop * 50 - t * 12) * scale;
        const thick = t < 0.35 ? 3 : t < 0.7 ? 2 : 1;
        pc.line(px, py, fx, fy, dark, thick);
        // Folíolos caindo do talo.
        if (j % 2 === 0 && t > 0.15) {
          const ll = (7 - t * 4) * scale;
          pc.line(fx, fy, fx + dir * 2, fy + ll, dark);
          if (dir * towardSun > 0) pc.pset(Math.round(fx + dir * 2), Math.round(fy + ll), rim);
        }
        px = fx;
        py = fy;
      }
    }
    // Cocos.
    pc.ellipse(topX - 3, topY + 2, 3, 3, ring);
    pc.ellipse(topX + 3, topY + 3, 3, 3, dark);
    pc.ellipse(topX, topY - 1, 5, 4, dark);
  }

  /** Chão com grade synthwave em perspectiva e o tubo de neon na borda do relevo. */
  private ground(pc: PixelCanvas): void {
    const fill = 0x16052c;
    const rowColor = mix(fill, NEON.pink, 0.6);
    const rayColor = mix(fill, NEON.violet, 0.6);
    const edge = new Int32Array(BG_W);
    for (let x = 0; x < BG_W; x++) {
      edge[x] = this.groundRow(x);
      pc.rect(x, edge[x] as number, 1, BG_H - (edge[x] as number), fill);
    }
    const below = (x: number, y: number) => x >= 0 && x < BG_W && y > (edge[x] as number) + 6;
    // Linhas horizontais: cada vez mais espaçadas perto da câmera.
    for (let i = 1; ; i++) {
      const y = Math.round(ty(ARENA.floorY - 34 + i * i * 2.2));
      if (y >= BG_H) break;
      for (let x = 0; x < BG_W; x++) if (below(x, y)) pc.pset(x, y, rowColor);
    }
    // Linhas que fogem para o horizonte, só abaixo do relevo.
    const vx = tx(VANISH_X);
    const hy = ty(HORIZON);
    for (let i = -24; i <= 24; i++) {
      const xb = vx + i * 70;
      for (let y = Math.ceil(hy); y < BG_H; y++) {
        const t = (y - hy) / (BG_H - hy);
        const x = Math.round(vx + (xb - vx) * t);
        const x2 = Math.round(vx + (xb - vx) * ((y + 1 - hy) / (BG_H - hy)));
        for (let xx = Math.min(x, x2); xx <= Math.max(x, x2); xx++) if (below(xx, y)) pc.pset(xx, y, rayColor);
      }
    }
    // Faixa pontilhada logo abaixo da borda: dá volume às rampas.
    for (let x = 0; x < BG_W; x++) {
      const gy = edge[x] as number;
      for (let d = 0; d < 10; d++) if (bayer(x, gy + d) < 0.75 - d * 0.06) pc.pset(x, gy + d, 0x0e0320);
    }
    // Tubo de neon contínuo: 3 pixels de ciano com miolo branco.
    for (let x = 0; x < BG_W; x++) {
      const gy = edge[x] as number;
      const prev = x > 0 ? (edge[x - 1] as number) : gy;
      const y0 = Math.min(gy, prev);
      const y1 = Math.max(gy, prev);
      for (let y = y0; y <= y1; y++) {
        pc.pset(x, y - 1, 0x1aa8c8);
        pc.pset(x, y, 0xe9fdff);
        pc.pset(x, y + 1, NEON.cyan);
        pc.pset(x, y + 2, 0x1aa8c8);
      }
    }
  }
}
