import Phaser from 'phaser';
import type { World } from '@/core/run/world';
import { lerp } from '@/core/math/scalar';
import { NEON, PAL } from './palette';

const R = 13;
const MIRROR_COLORS = [NEON.pink, NEON.cyan, NEON.violet, 0xf7f1e8];

/**
 * Globo de Discoteca (carta épica): bola espelhada girando acima do jogador,
 * com um raio de luz no fio e um "pulo" a cada rajada. Só desenho; o tiro é do World.
 */
export class DiscoBallView {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly glow: Phaser.GameObjects.Image;
  private spin = 0;
  private kick = 0;

  constructor(scene: Phaser.Scene) {
    this.glow = scene.add.image(0, 0, 'fx_glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(38).setVisible(false);
    this.g = scene.add.graphics().setDepth(39);
  }

  /** Rajada saiu: o globo dá um tranco. */
  pulse(): void {
    this.kick = 1;
  }

  update(w: World, alpha: number, dt: number, reducedMotion: boolean): void {
    const d = w.disco;
    const g = this.g;
    g.clear();
    if (!d || !w.player.alive) {
      this.glow.setVisible(false);
      return;
    }
    this.spin += dt * (reducedMotion ? 1.5 : 5);
    this.kick = Math.max(0, this.kick - dt * 6);
    const m = w.player.motor;
    const x = lerp(w.player.px, m.x, alpha);
    const bob = reducedMotion ? 0 : Math.sin(this.spin * 0.7) * 3;
    const y = lerp(w.player.py, m.y, alpha) - d.height + bob;
    const r = R * (1 + this.kick * 0.25);

    this.glow
      .setVisible(true)
      .setPosition(x, y)
      .setTint(d.golden ? PAL.amber : NEON.pink)
      .setAlpha(0.35 + this.kick * 0.4)
      .setScale(1.2 + this.kick * 0.8);

    // Fio pendurado no "teto" invisível.
    g.lineStyle(2, PAL.warmWhite, 0.6);
    g.lineBetween(x, y - r - 18, x, y - r);

    g.fillStyle(PAL.outline, 1);
    g.fillCircle(x, y, r + 2);
    g.fillStyle(d.golden ? PAL.amber : 0x9aa3b5, 1);
    g.fillCircle(x, y, r);

    // Ladrilhos espelhados: faixas que deslizam com o giro.
    const rows = 4;
    const cols = 6;
    for (let row = 0; row < rows; row++) {
      const v = (row + 0.5) / rows; // 0..1 de cima a baixo
      const yy = y - r + v * 2 * r;
      const half = Math.sqrt(Math.max(0, r * r - (yy - y) ** 2));
      for (let c = 0; c < cols; c++) {
        const u = ((c / cols + this.spin * 0.08) % 1) * Math.PI;
        const xx = x - Math.cos(u) * half;
        const color = MIRROR_COLORS[(c + row) % MIRROR_COLORS.length] as number;
        g.fillStyle(d.golden ? PAL.warmWhite : color, 0.55 + 0.45 * Math.sin(u));
        g.fillRect(xx - 1.8, yy - 2.2, 3.6, 3.6);
      }
    }
    // Brilho estourado.
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(x - r * 0.35, y - r * 0.4, 2.5);
  }

  reset(): void {
    this.g.clear();
    this.glow.setVisible(false);
    this.kick = 0;
  }
}
