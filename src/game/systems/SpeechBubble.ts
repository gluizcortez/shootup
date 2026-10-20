import Phaser from 'phaser';
import { PIXEL_FONT } from '../rendering/fonts';
import { ARENA } from '../data/arena';
import { CSS, NEON } from '../rendering/palette';

const PAD_X = 14;
const PAD_Y = 10;
const TAIL = 16;
/** Topo mínimo do balão, abaixo da barra de vida do chefe. */
const MIN_Y = 110;
const MAX_TEXT_WIDTH = 260;
const POP_IN = 0.16;
const FADE_OUT = 0.25;

/**
 * Balão de fala de gibi que acompanha um personagem. Um balão por vez: uma
 * fala nova substitui a anterior. Só visual; não toca som.
 */
export class SpeechBubble {
  private readonly root: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;
  private life = 0;
  private maxLife = 1;
  private side: 1 | -1 | 0 = 0;
  private x = 0;
  private y = 0;

  constructor(scene: Phaser.Scene) {
    this.bg = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, '', {
        fontFamily: PIXEL_FONT,
        fontSize: '22px',
        color: CSS.outline,
        align: 'center',
        wordWrap: { width: MAX_TEXT_WIDTH },
      })
      .setOrigin(0.5)
      .setResolution(1);
    this.root = scene.add.container(0, 0, [this.bg, this.text]).setDepth(70).setVisible(false);
  }

  /**
   * Mostra `line` saindo da boca de quem fala, em (x, y). O balão fica ao lado
   * (direita por padrão; esquerda se não couber), longe da barra do chefe.
   */
  say(line: string, x: number, y: number, seconds: number): void {
    this.text.setText(line);
    this.life = this.maxLife = seconds;
    this.side = 0;
    this.follow(x, y);
    this.root.setVisible(true).setScale(0.2);
  }

  /** Move a âncora do balão (chamar a cada quadro enquanto quem fala existe). */
  follow(x: number, y: number): void {
    const w = this.text.width + PAD_X * 2;
    const h = this.text.height + PAD_Y * 2;
    const side = x + TAIL + w <= ARENA.right ? 1 : -1;
    if (side !== this.side) this.draw(side, w, h);
    this.side = side;
    this.x = x;
    this.y = Phaser.Math.Clamp(y, MIN_Y + h / 2, ARENA.floorY - h / 2);
  }

  /** Balão em pixel art (cantos em degrau, borda de 2 px) com o rabicho apontando para (0, 0). */
  private draw(side: 1 | -1, w: number, h: number): void {
    w = Math.round(w);
    h = Math.round(h);
    const left = side > 0 ? TAIL : -TAIL - w;
    const top = -Math.round(h / 2);
    const g = this.bg.clear();
    const box = (x: number, y: number, bw: number, bh: number, r: number, color: number) => {
      g.fillStyle(color, 1);
      g.fillRect(x + r, y, bw - r * 2, bh);
      g.fillRect(x, y + r, bw, bh - r * 2);
      if (r > 1) g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
    };
    box(left + 4, top + 4, w, h, 3, NEON.pink); // sombra neon
    box(left, top, w, h, 3, 0x0d0f15); // borda
    box(left + 2, top + 2, w - 4, h - 4, 2, 0xffffff);
    g.fillStyle(0xd8dcf0, 1).fillRect(left + 4, top + h - 4, w - 8, 1); // sombreado de baixo
    // Rabicho em degraus: cada coluna encolhe 1 pixel de cada lado.
    for (let i = 0; i < TAIL + 3; i++) {
      const half = Math.round((Math.min(i, TAIL) / TAIL) * 7);
      const x = side > 0 ? i : -i - 1;
      if (i < TAIL) g.fillStyle(0x0d0f15, 1).fillRect(x, -half - 2, 1, half * 2 + 4);
      if (half > 0) g.fillStyle(0xffffff, 1).fillRect(x, -half, 1, half * 2);
    }
    this.text.setPosition(Math.round(left + w / 2), 0);
  }

  update(dt: number): void {
    if (this.life <= 0) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.hide();
      return;
    }
    const age = this.maxLife - this.life;
    const pop = Math.min(1, age / POP_IN);
    const scale = pop < 1 ? 0.2 + Phaser.Math.Easing.Back.Out(pop) * 0.8 : 1;
    this.root
      .setPosition(this.x, this.y)
      .setScale(scale)
      .setAlpha(Math.min(1, this.life / FADE_OUT))
      .setAngle(Math.sin(age * 9) * 1.5);
  }

  get active(): boolean {
    return this.life > 0;
  }

  hide(): void {
    this.life = 0;
    this.root.setVisible(false);
  }
}
