import Phaser from 'phaser';
import type { World } from '@/core/run/world';
import { lerp } from '@/core/math/scalar';
import { TEX, TEX_SCALE } from './textures';
import { normalizeAngle, Spring } from './spring';

const INV = 1 / TEX_SCALE;

/** Visual do competidor. Lê o estado do World; nunca o altera. */
export class PlayerView {
  readonly root: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Image;
  private readonly head: Phaser.GameObjects.Image;
  private readonly legL: Phaser.GameObjects.Image;
  private readonly legR: Phaser.GameObjects.Image;
  private readonly arm: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly squash = new Spring(420, 14);
  private kick = 0;
  private runPhase = 0;
  private blink = 0;
  private dead = false;
  private deathT = 0;
  private deathVy = 0;
  private deathSpin = 0;
  private readonly shoulderY: number;
  private readonly shoulderX: number;

  constructor(
    scene: Phaser.Scene,
    private readonly hh: number,
    shoulder: { x: number; y: number },
    private readonly groundAt: (x: number) => number,
  ) {
    this.shoulderX = shoulder.x;
    this.shoulderY = -hh + shoulder.y;
    this.shadow = scene.add.image(0, 0, 'shadow').setScale(0.8 * INV).setDepth(9);
    this.legL = scene.add.image(-4, -14, 'pl_leg').setOrigin(0.5, 0).setScale(INV);
    this.legR = scene.add.image(5, -14, 'pl_leg').setOrigin(0.5, 0).setScale(INV);
    this.body = scene.add.image(0, -24, 'pl_body').setScale(INV);
    this.head = scene.add.image(1, -40, 'pl_head').setOrigin(0.5, 0.62).setScale(INV);
    this.arm = scene.add
      .image(this.shoulderX, this.shoulderY, 'pl_arm')
      .setOrigin(TEX.plArm.pivotX / TEX.plArm.w, 0.5)
      .setScale(INV);
    this.root = scene.add.container(0, 0, [this.legL, this.legR, this.body, this.head, this.arm]).setDepth(30);
  }

  onShot(): void {
    this.kick = 1;
  }

  onJump(): void {
    this.squash.set(0);
    this.squash.kick(4.5); // estica
  }

  onLand(speed: number): void {
    this.squash.kick(-Math.min(6, 1.5 + speed / 160)); // achata proporcional à queda
  }

  onDeath(): void {
    this.dead = true;
    this.deathT = 0;
    this.deathVy = -420;
    this.deathSpin = (Math.random() < 0.5 ? -1 : 1) * 9;
  }

  reset(): void {
    this.dead = false;
    this.root.setRotation(0).setAlpha(1).setVisible(true);
    this.squash.set(0);
    this.squash.velocity = 0;
    this.kick = 0;
  }

  update(world: World, alpha: number, dt: number): void {
    const p = world.player;
    const m = p.motor;
    const x = lerp(p.px, m.x, alpha);
    const y = lerp(p.py, m.y, alpha) + this.hh;

    if (this.dead) {
      this.deathT += dt;
      this.deathVy += 1400 * dt;
      this.root.y = Math.min(this.root.y + this.deathVy * dt, this.groundAt(this.root.x) + 60);
      this.root.rotation += this.deathSpin * dt;
      this.root.alpha = Math.max(0, 1 - this.deathT / 1.4);
      this.shadow.setVisible(false);
      return;
    }

    const facing = Math.cos(p.aimAngle) >= 0 ? 1 : -1;
    const d = this.squash.update(dt);
    const sx = 1 - d * 0.045;
    const sy = 1 + d * 0.06;
    this.root.setPosition(x, y).setScale(facing * sx, sy);

    // Ciclo de corrida e pose aérea.
    if (m.grounded) {
      const speed = Math.abs(m.vx);
      if (speed > 20) {
        // Pernas acompanham a direção do movimento mesmo andando de costas.
        const backwards = Math.sign(m.vx) !== facing ? -1 : 1;
        this.runPhase += dt * speed * 0.05 * backwards;
        const s = Math.sin(this.runPhase);
        this.legL.rotation = s * 0.75;
        this.legR.rotation = -s * 0.75;
        this.body.y = -24 - Math.abs(Math.cos(this.runPhase)) * 1.8;
      } else {
        this.legL.rotation *= 0.7;
        this.legR.rotation *= 0.7;
        this.body.y = -24 + Math.sin(performance.now() / 260) * 0.5; // respiração
      }
    } else {
      const rising = m.vy < 0;
      this.legL.rotation = rising ? -0.7 : 0.35;
      this.legR.rotation = rising ? 0.5 : -0.25;
      this.body.y = -24;
    }

    // Braço + pistola mirando, com recuo visual (não mexe no cursor nem na mira real).
    this.kick = Math.max(0, this.kick - dt * 14);
    const local = normalizeAngle(facing > 0 ? p.aimAngle : Math.PI - p.aimAngle);
    const k = this.kick * this.kick;
    this.arm.rotation = local - k * 0.42;
    this.arm.x = this.shoulderX - Math.cos(local) * k * 6;
    this.arm.y = this.shoulderY - Math.sin(local) * k * 6 + (this.body.y + 24);
    this.head.rotation = local * 0.22;
    this.head.y = -40 + (this.body.y + 24);

    // Piscar durante i-frames.
    if (p.invuln > 0) {
      this.blink += dt;
      this.root.alpha = Math.floor(this.blink * 16) % 2 === 0 ? 0.35 : 1;
    } else {
      this.blink = 0;
      this.root.alpha = 1;
    }

    const gy = this.groundAt(x);
    const height = Math.max(0, gy - y);
    const sh = Math.max(0.35, 1 - height / 220);
    this.shadow.setVisible(true).setPosition(x, gy + 1).setScale(0.8 * sh * INV, 0.8 * sh * INV).setAlpha(sh);
  }
}
