import Phaser from 'phaser';
import { PIXEL_FONT } from '../rendering/fonts';

interface Floater {
  text: Phaser.GameObjects.Text;
  life: number;
  maxLife: number;
  vy: number;
  scale: number;
}

/** A fonte pixel é mais baixa que a antiga; compensa para manter o tamanho na tela. */
const FONT_K = 1.3;

/** Números de dano e pontos, em pool. `setText` só é chamado ao reaproveitar. */
export class FloatingText {
  private readonly items: Floater[] = [];
  private cursor = 0;

  constructor(scene: Phaser.Scene, capacity = 40) {
    for (let i = 0; i < capacity; i++) {
      const text = scene.add
        .text(0, 0, '', {
          fontFamily: PIXEL_FONT,
          fontSize: '16px',
          color: '#F7F1E8',
          stroke: '#0D0F15',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(60)
        .setResolution(1)
        .setVisible(false);
      this.items.push({ text, life: 0, maxLife: 1, vy: 0, scale: 1 });
    }
  }

  spawn(x: number, y: number, value: string, color: string, size: number, life = 0.65): void {
    const f = this.items[this.cursor] as Floater;
    this.cursor = (this.cursor + 1) % this.items.length;
    f.text
      .setText(value)
      .setColor(color)
      .setFontSize(Math.round(size * FONT_K))
      .setPosition(x + (Math.random() - 0.5) * 10, y)
      .setVisible(true);
    f.life = f.maxLife = life;
    f.vy = -70;
    f.scale = 1;
    f.text.setRotation(0);
  }

  /** Onomatopeia de gibi: palavra grande, torta e com mais "salto". */
  comic(x: number, y: number, word: string, color: string, size: number): void {
    this.spawn(x, y, word, color, size, 0.75);
    const f = this.items[(this.cursor + this.items.length - 1) % this.items.length] as Floater;
    f.text.setRotation((Math.random() - 0.5) * 0.5);
    f.vy = -110;
    f.scale = 1.4;
  }

  update(dt: number): void {
    for (const f of this.items) {
      if (f.life <= 0) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.text.setVisible(false);
        continue;
      }
      const t = 1 - f.life / f.maxLife;
      f.vy *= Math.max(0, 1 - 4 * dt);
      f.text.y += f.vy * dt;
      // Salto: começa grande, assenta rápido (spring barato).
      const pop = t < 0.15 ? 1.5 - (t / 0.15) * 0.5 : 1;
      f.text.setScale(pop * f.scale);
      f.text.alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    }
  }

  clear(): void {
    for (const f of this.items) {
      f.life = 0;
      f.text.setVisible(false);
    }
  }
}
