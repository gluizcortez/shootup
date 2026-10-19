import Phaser from 'phaser';
import { ARENA, VIEW_HEIGHT, VIEW_WIDTH } from '../data/arena';
import { PAL } from './palette';
import { TEX_SCALE } from './textures';

const S = TEX_SCALE;

/**
 * Estúdio de TV (placeholder). Tudo estático vira UMA textura; só luzes,
 * lâmpadas e plateia são objetos animados, e baratos.
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

  constructor(private readonly scene: Phaser.Scene) {
    this.bakeTextures();
    scene.add.image(0, 0, 'stage_bg').setOrigin(0).setScale(1 / S).setDepth(-100);

    for (const [x, flip] of [
      [60, 1],
      [VIEW_WIDTH - 60, -1],
    ] as const) {
      const spot = scene.add
        .image(x, -10, 'spot_cone')
        .setOrigin(0.5, 0)
        .setScale(1 / S)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.5)
        .setDepth(-90);
      spot.setData('flip', flip);
      this.spots.push(spot);
    }

    // Lâmpadas em volta do telão.
    const fx = 330;
    const fy = 52;
    const fw = 300;
    const fh = 150;
    const add = (x: number, y: number) =>
      this.bulbs.push(scene.add.image(x, y, 'px_dot').setScale(0.55).setTint(PAL.amber).setDepth(-80));
    for (let x = fx; x <= fx + fw; x += 20) {
      add(x, fy);
      add(x, fy + fh);
    }
    for (let y = fy + 20; y < fy + fh; y += 20) {
      add(fx, y);
      add(fx + fw, y);
    }

    const title = scene.add
      .text(VIEW_WIDTH / 2, fy + 62, 'SHOOTUP!', {
        fontFamily: '"Arial Black", "Trebuchet MS", system-ui, sans-serif',
        fontSize: '54px',
        color: '#FFC857',
        stroke: '#0D0F15',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(-80)
      .setResolution(2);
    title.setShadow(0, 5, '#FF5964', 0, false, true);
    scene.add
      .text(VIEW_WIDTH / 2, fy + 112, "THE WORLD'S WORST SHOW", {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#42DEC4',
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(-80)
      .setResolution(2);

    // Patrocinadores fictícios.
    this.sponsor(170, 150, 'PIPOCA\nBOOM', '#FF5964', -0.06);
    this.sponsor(VIEW_WIDTH - 170, 150, 'SEGUROS\nQUÁ-QUÁ', '#B37CFF', 0.05);

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

  private sponsor(x: number, y: number, text: string, color: string, angle: number): void {
    const board = this.scene.add.rectangle(x, y, 110, 64, PAL.plum).setStrokeStyle(3, PAL.outline).setDepth(-85);
    board.setRotation(angle);
    this.scene.add
      .text(x, y, text, {
        fontFamily: '"Arial Black", system-ui, sans-serif',
        fontSize: '16px',
        color,
        align: 'center',
        lineSpacing: -4,
      })
      .setOrigin(0.5)
      .setRotation(angle)
      .setDepth(-84)
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
        const flip = s.getData('flip') as number;
        s.setRotation(flip * (-0.35 + Math.sin(this.time * 0.6 + flip) * 0.25));
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
      const w = 260;
      const h = 520;
      g.fillGradientStyle(0xfff1c1, 0xfff1c1, 0xfff1c1, 0xfff1c1, 0.35, 0.35, 0, 0);
      g.fillTriangle((w / 2) * S, 0, 0, h * S, w * S, h * S);
      g.generateTexture('spot_cone', w * S, h * S);
      g.destroy();
    }
    if (tex.exists('stage_bg')) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const W = VIEW_WIDTH * S;
    const floor = ARENA.floorY * S;
    const H = VIEW_HEIGHT * S;

    // Parede do fundo com degradê.
    g.fillGradientStyle(0x2a2140, 0x2a2140, PAL.charcoal, PAL.charcoal, 1);
    g.fillRect(0, 0, W, floor);
    // Painéis verticais sutis.
    g.fillStyle(0xffffff, 0.025);
    for (let x = 0; x < W; x += 80 * S) g.fillRect(x, 0, 40 * S, floor);
    // Cortinas laterais.
    for (const side of [0, 1]) {
      const x0 = side === 0 ? 0 : W - 70 * S;
      g.fillStyle(0x5c1f3a, 1);
      g.fillRect(x0, 0, 70 * S, floor);
      g.fillStyle(0x7a2a4c, 1);
      for (let i = 0; i < 4; i++) g.fillRect(x0 + (8 + i * 16) * S, 0, 6 * S, floor);
      g.fillStyle(0x000000, 0.25);
      g.fillRect(side === 0 ? x0 + 64 * S : x0, 0, 6 * S, floor);
    }
    // Sanefa.
    g.fillStyle(0x5c1f3a, 1);
    g.fillRect(0, 0, W, 22 * S);
    g.fillStyle(PAL.amber, 1);
    g.fillRect(0, 22 * S, W, 3 * S);

    // Telão.
    g.fillStyle(PAL.outline, 1);
    g.fillRoundedRect(322 * S, 44 * S, 316 * S, 166 * S, 14 * S);
    g.fillStyle(0x1b1530, 1);
    g.fillRoundedRect(330 * S, 52 * S, 300 * S, 150 * S, 10 * S);
    g.fillStyle(PAL.turquoise, 0.08);
    for (let y = 56; y < 200; y += 6) g.fillRect(334 * S, y * S, 292 * S, 2 * S);

    // Piso do palco.
    g.fillStyle(0x3a2f4f, 1);
    g.fillRect(0, floor, W, H - floor);
    g.fillStyle(0x2f2642, 1);
    for (let x = 0; x < W; x += 64 * S) g.fillRect(x, floor + 6 * S, 2 * S, 30 * S);
    g.fillStyle(PAL.amber, 1);
    g.fillRect(0, floor, W, 3 * S);
    g.fillStyle(0xfff1c1, 0.5);
    g.fillRect(0, floor, W, 1 * S);
    // Saia do palco.
    g.fillStyle(0x1d1729, 1);
    g.fillRect(0, floor + 36 * S, W, H - floor - 36 * S);
    g.fillStyle(PAL.coral, 0.7);
    for (let x = 12; x < VIEW_WIDTH; x += 24) g.fillCircle(x * S, (ARENA.floorY + 44) * S, 2.5 * S);

    g.generateTexture('stage_bg', W, H);
    g.destroy();
  }
}
