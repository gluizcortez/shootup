import Phaser from 'phaser';
import type { SimInput } from '@/core/run/world';

/**
 * Amostra teclado e mouse uma vez por quadro. O "pulo apertado" é travado
 * por evento até ser consumido por um passo da simulação, então nenhum
 * toque se perde, mesmo em quadros sem passo fixo.
 */
export class InputSystem {
  private readonly keys: Record<'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'space', Phaser.Input.Keyboard.Key>;
  private jumpLatched = false;
  private firing = false;
  private aimX: number;
  private aimY: number;
  private readonly unsubs: Array<() => void> = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly zoom: number,
    defaultAim: { x: number; y: number },
  ) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('Teclado indisponível no Phaser');
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      a: kb.addKey(K.A),
      d: kb.addKey(K.D),
      up: kb.addKey(K.UP),
      w: kb.addKey(K.W),
      space: kb.addKey(K.SPACE),
    };
    const latch = () => {
      this.jumpLatched = true;
    };
    for (const k of [this.keys.up, this.keys.w, this.keys.space]) {
      k.on('down', latch);
      this.unsubs.push(() => k.off('down', latch));
    }
    this.aimX = defaultAim.x;
    this.aimY = defaultAim.y;

    const down = (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) this.firing = true;
    };
    const up = (p: Phaser.Input.Pointer) => {
      if (!p.leftButtonDown()) this.firing = false;
    };
    const move = (p: Phaser.Input.Pointer) => {
      this.aimX = p.x / this.zoom;
      this.aimY = p.y / this.zoom;
    };
    scene.input.on('pointerdown', down);
    scene.input.on('pointerup', up);
    scene.input.on('pointerupoutside', up);
    scene.input.on('pointermove', move);
    this.unsubs.push(() => {
      scene.input.off('pointerdown', down);
      scene.input.off('pointerup', up);
      scene.input.off('pointerupoutside', up);
      scene.input.off('pointermove', move);
    });
  }

  get aim(): { x: number; y: number } {
    return { x: this.aimX, y: this.aimY };
  }

  /** Solta tudo (perda de foco, pausa). */
  releaseAll(): void {
    this.firing = false;
    this.jumpLatched = false;
    this.scene.input.keyboard?.resetKeys();
  }

  sample(out: SimInput): SimInput {
    const k = this.keys;
    const left = k.left.isDown || k.a.isDown;
    const right = k.right.isDown || k.d.isDown;
    out.moveX = (right ? 1 : 0) - (left ? 1 : 0);
    out.jumpHeld = k.up.isDown || k.w.isDown || k.space.isDown;
    out.jumpPressed = this.jumpLatched;
    out.fireHeld = this.firing;
    out.aimX = this.aimX;
    out.aimY = this.aimY;
    return out;
  }

  /** Chamado depois que um passo usou o pulo travado. */
  consumeJump(): void {
    this.jumpLatched = false;
  }

  destroy(): void {
    for (const u of this.unsubs) u();
  }
}
