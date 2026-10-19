import Phaser from 'phaser';
import type { Terrain } from '@/core/physics/terrain';
import { ARENA, VIEW_HEIGHT, VIEW_WIDTH } from '../data/arena';
import { PAL } from './palette';
import { TEX_SCALE } from './textures';

const S = TEX_SCALE;
const TRUSS_Y = 10;

/**
 * Estúdio de TV visto da plateia (placeholder). Os animais caem do urdimento
 * no topo, então a metade de cima fica livre: só céu escuro do estúdio, a
 * treliça de luzes e feixes suaves. Tudo estático vira UMA textura; só
 * luzes, lâmpadas e plateia são objetos animados, e baratos.
 */
export class Stage {
  private readonly bulbs: Phaser.GameObjects.Image[] = [];
  private readonly heads: Phaser.GameObjects.Image[] = [];
  private readonly spots: Phaser.GameObjects.Image[] = [];
  private bulbTimer = 0;
  private bulbPhase = 0;
  private time = 0;
  /** 0..1, sobe com o combo e anima a plateia. */
  excitement = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly terrain: Terrain,
  ) {
    this.bakeTextures();
    scene.add.image(0, 0, 'stage_bg').setOrigin(0).setScale(1 / S).setDepth(-100);

    // Refletores pendurados na treliça, varrendo a zona de queda.
    for (const [x, phase] of [
      [210, 0],
      [480, 2.1],
      [750, 4.2],
    ] as const) {
      const spot = scene.add
        .image(x, TRUSS_Y + 6, 'spot_cone')
        .setOrigin(0.5, 0)
        .setScale(1 / S)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.32)
        .setDepth(-90);
      spot.setData('phase', phase);
      this.spots.push(spot);
    }

    // Lâmpadas de camarim nas bordas das cortinas.
    for (const x of [ARENA.left + 46, ARENA.right - 46]) {
      for (let y = 40; y < terrain.groundAt(x) - 10; y += 22) {
        this.bulbs.push(scene.add.image(x, y, 'px_dot').setScale(0.5).setTint(PAL.amber).setDepth(-80));
      }
    }

    // Logo do programa: grande e apagado no fundo, nunca competindo com os animais.
    scene.add
      .text(VIEW_WIDTH / 2, 300, 'SHOOTUP!', {
        fontFamily: '"Arial Black", "Trebuchet MS", system-ui, sans-serif',
        fontSize: '120px',
        color: '#2c2342',
        stroke: '#1d1729',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(-85)
      .setResolution(2);
    scene.add
      .text(VIEW_WIDTH / 2, 372, "THE WORLD'S WORST SHOW", {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#2f6f6a',
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(-85)
      .setResolution(2);

    // Patrocinadores fictícios em faixas verticais nas cortinas.
    this.banner(36, 250, 'PIPOCA\nBOOM', '#FF5964');
    this.banner(VIEW_WIDTH - 36, 250, 'SEGUROS\nQUÁ-QUÁ', '#B37CFF');

    // Plateia em silhueta, na frente do palco (abaixo do chão, não atrapalha a leitura).
    for (let i = 0; i < 26; i++) {
      const x = 14 + i * 37 + (i % 2) * 6;
      const head = scene.add
        .image(x, VIEW_HEIGHT + 6, 'aud_head')
        .setOrigin(0.5, 1)
        .setScale((0.9 + ((i * 37) % 7) * 0.04) / S)
        .setDepth(50);
      head.setData('phase', i * 1.7);
      this.heads.push(head);
    }
  }

  private banner(x: number, y: number, text: string, color: string): void {
    this.scene.add.rectangle(x, y, 60, 120, PAL.plum).setStrokeStyle(3, PAL.outline).setDepth(-84);
    this.scene.add
      .text(x, y, text, {
        fontFamily: '"Arial Black", system-ui, sans-serif',
        fontSize: '11px',
        color,
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(-83)
      .setResolution(2);
  }

  update(dt: number, reducedMotion: boolean): void {
    this.time += dt;
    this.bulbTimer -= dt;
    if (this.bulbTimer <= 0) {
      this.bulbTimer = 0.35 - this.excitement * 0.25;
      this.bulbPhase ^= 1;
      for (let i = 0; i < this.bulbs.length; i++) {
        (this.bulbs[i] as Phaser.GameObjects.Image).setAlpha((i + this.bulbPhase) % 2 === 0 ? 1 : 0.25);
      }
    }
    if (!reducedMotion) {
      for (const s of this.spots) {
        s.setRotation(Math.sin(this.time * 0.5 + (s.getData('phase') as number)) * 0.35);
      }
    }
    const amp = reducedMotion ? 0 : 1.5 + this.excitement * 7;
    const speed = 3 + this.excitement * 9;
    for (const h of this.heads) {
      const ph = h.getData('phase') as number;
      h.y = VIEW_HEIGHT + 6 - Math.max(0, Math.sin(this.time * speed + ph)) * amp;
    }
    this.excitement = Math.max(0, this.excitement - dt * 0.15);
  }

  private bakeTextures(): void {
    const tex = this.scene.textures;
    if (!tex.exists('aud_head')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x07080c, 1);
      g.fillCircle(14 * S, 10 * S, 9 * S);
      g.fillRoundedRect(1 * S, 17 * S, 26 * S, 22 * S, 9 * S);
      g.generateTexture('aud_head', 28 * S, 38 * S);
      g.destroy();
    }
    if (!tex.exists('spot_cone')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      const w = 220;
      const h = 470;
      g.fillGradientStyle(0xfff1c1, 0xfff1c1, 0xfff1c1, 0xfff1c1, 0.3, 0.3, 0, 0);
      g.fillTriangle((w / 2) * S, 0, 0, h * S, w * S, h * S);
      g.generateTexture('spot_cone', w * S, h * S);
      g.destroy();
    }
    if (tex.exists('stage_bg')) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const W = VIEW_WIDTH * S;
    const floor = ARENA.floorY * S;
    const H = VIEW_HEIGHT * S;

    // Fundo: o "céu" escuro do estúdio no alto, clareando até a parede do palco.
    g.fillGradientStyle(0x0c0a14, 0x0c0a14, 0x2a2140, 0x2a2140, 1);
    g.fillRect(0, 0, W, floor);
    // Feixes verticais bem sutis: a zona de queda.
    g.fillStyle(0xffffff, 0.018);
    for (let x = 120; x < VIEW_WIDTH - 100; x += 120) g.fillRect(x * S, 0, 46 * S, floor);
    // Parede baixa com painéis, só perto do chão.
    g.fillStyle(0x31274a, 1);
    g.fillRect(0, floor - 90 * S, W, 90 * S);
    g.fillStyle(0x3a2f56, 1);
    for (let x = 0; x < VIEW_WIDTH; x += 80) g.fillRect((x + 4) * S, floor - 84 * S, 72 * S, 78 * S);
    g.fillStyle(PAL.turquoise, 0.35);
    g.fillRect(0, floor - 92 * S, W, 2 * S);

    // Cortinas laterais (abertas em cima: o urdimento fica à vista).
    for (const side of [0, 1]) {
      const x0 = side === 0 ? 0 : W - 70 * S;
      g.fillStyle(0x5c1f3a, 1);
      g.fillRect(x0, 0, 70 * S, floor);
      g.fillStyle(0x7a2a4c, 1);
      for (let i = 0; i < 4; i++) g.fillRect(x0 + (8 + i * 16) * S, 0, 6 * S, floor);
      g.fillStyle(0x000000, 0.25);
      g.fillRect(side === 0 ? x0 + 64 * S : x0, 0, 6 * S, floor);
    }

    // Treliça de luz no topo: de onde os animais "caem" no palco.
    g.fillStyle(0x4b5266, 1);
    g.fillRect(0, (TRUSS_Y - 4) * S, W, 3 * S);
    g.fillRect(0, (TRUSS_Y + 4) * S, W, 3 * S);
    g.lineStyle(1.5 * S, 0x4b5266, 1);
    for (let x = 0; x < VIEW_WIDTH; x += 16) {
      g.lineBetween(x * S, (TRUSS_Y - 2) * S, (x + 8) * S, (TRUSS_Y + 5) * S);
      g.lineBetween((x + 8) * S, (TRUSS_Y + 5) * S, (x + 16) * S, (TRUSS_Y - 2) * S);
    }
    // Refletores pendurados.
    for (const x of [210, 480, 750]) {
      g.fillStyle(PAL.outline, 1);
      g.fillRoundedRect((x - 10) * S, (TRUSS_Y + 2) * S, 20 * S, 12 * S, 3 * S);
      g.fillStyle(0xfff1c1, 1);
      g.fillRect((x - 7) * S, (TRUSS_Y + 11) * S, 14 * S, 3 * S);
    }

    // Piso do palco seguindo o relevo (rampas nos cantos, morrinhos).
    const top: Phaser.Geom.Point[] = [];
    for (let x = 0; x <= VIEW_WIDTH; x += 4) top.push(new Phaser.Geom.Point(x * S, this.terrain.groundAt(x) * S));
    const poly = (offset: number) => [
      ...top.map((p) => new Phaser.Geom.Point(p.x, p.y + offset * S)),
      new Phaser.Geom.Point(W, H),
      new Phaser.Geom.Point(0, H),
    ];
    g.fillStyle(0x3a2f4f, 1);
    g.fillPoints(poly(0), true);
    // Faixa mais escura logo abaixo da borda: dá volume às rampas.
    g.fillStyle(0x2f2642, 1);
    g.fillPoints(poly(14), true);
    g.fillStyle(0x3a2f4f, 1);
    g.fillPoints(poly(18), true);
    // Tábuas: linhas verticais curtas que acompanham o relevo.
    g.fillStyle(0x2f2642, 1);
    for (let x = 32; x < VIEW_WIDTH; x += 64) g.fillRect(x * S, (this.terrain.groundAt(x) + 22) * S, 2 * S, 26 * S);
    // Borda âmbar contínua.
    g.lineStyle(3 * S, PAL.amber, 1);
    g.strokePoints(top, false);
    g.lineStyle(1 * S, 0xfff1c1, 0.6);
    g.strokePoints(top.map((p) => new Phaser.Geom.Point(p.x, p.y - 1 * S)), false);
    // Saia do palco (frente plana, abaixo de tudo).
    g.fillStyle(0x1d1729, 1);
    g.fillRect(0, floor + 36 * S, W, H - floor - 36 * S);
    g.fillStyle(PAL.coral, 0.7);
    for (let x = 12; x < VIEW_WIDTH; x += 24) g.fillCircle(x * S, (ARENA.floorY + 44) * S, 2.5 * S);

    g.generateTexture('stage_bg', W, H);
    g.destroy();
  }
}
