import Phaser from 'phaser';
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
        fontFamily: '"Arial Black", "Trebuchet MS", system-ui, sans-serif',
        fontSize: '17px',
        color: CSS.outline,
        align: 'center',
        wordWrap: { width: MAX_TEXT_WIDTH },
      })
      .setOrigin(0.5)
      .setResolution(2);
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

  /** Balão com o rabicho apontando para a origem (0, 0). */
  private draw(side: 1 | -1, w: number, h: number): void {
    const left = side > 0 ? TAIL : -TAIL - w;
    const g = this.bg.clear();
    g.fillStyle(NEON.pink, 1).fillRoundedRect(left + 5, -h / 2 + 5, w, h, 12);
    g.fillStyle(0xffffff, 1).lineStyle(4, 0x0d0f15, 1);
    g.fillRoundedRect(left, -h / 2, w, h, 12).strokeRoundedRect(left, -h / 2, w, h, 12);
    const base = side > 0 ? TAIL + 2 : -TAIL - 2;
    g.fillTriangle(0, 0, base, -9, base, 9).lineBetween(0, 0, base, -9).lineBetween(0, 0, base, 9);
    g.fillRect(side > 0 ? TAIL - 1 : -TAIL - 5, -7, 6, 14);
    this.text.setPosition(left + w / 2, 0);
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
