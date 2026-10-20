import Phaser from 'phaser';
import type { World } from '@/core/run/world';
import { lerp } from '@/core/math/scalar';
import { TEX, TEX_SCALE } from './textures';
import { normalizeAngle, Spring } from './spring';

const INV = 1 / TEX_SCALE;

const BODY_Y = -25;
const HEAD_Y = -37;

/** Centro do rosto, de onde os cachos pendem. */
const FACE_DY = -7.5;

/**
 * Visual do Johnny Replay, o dançarino dos anos 80 que só anda de moonwalk.
 * Lê o estado do World; nunca o altera.
 */
export class PlayerView {
  readonly root: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Image;
  private readonly head: Phaser.GameObjects.Image;
  private readonly hair: Phaser.GameObjects.Image;
  private readonly backArm: Phaser.GameObjects.Image;
  /** Os cachos balançam atrasados em relação ao corpo. */
  private readonly hairSpring = new Spring(260, 9);
  private cheer = 0;
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
    this.hair = scene.add
      .image(1, HEAD_Y + FACE_DY, 'pl_hair')
      .setOrigin(TEX.plHair.cx / TEX.plHair.w, TEX.plHair.cy / TEX.plHair.h)
      .setScale(INV);
    this.backArm = scene.add
      .image(-5, -33, 'pl_back')
      .setOrigin(0.5, TEX.plBack.pivotY / TEX.plBack.h)
      .setScale(INV);
    this.legL = scene.add.image(-4, -16, 'pl_leg').setOrigin(0.5, 0).setScale(INV);
    this.legR = scene.add.image(5, -16, 'pl_leg').setOrigin(0.5, 0).setScale(INV);
    this.body = scene.add.image(0, BODY_Y, 'pl_body').setScale(INV);
    this.head = scene.add.image(1, HEAD_Y, 'pl_head').setOrigin(0.5, 26 / TEX.plHead.h).setScale(INV);
    this.arm = scene.add
      .image(this.shoulderX, this.shoulderY, 'pl_arm')
      .setOrigin(TEX.plArm.pivotX / TEX.plArm.w, 0.5)
      .setScale(INV);
    this.root = scene.add
      .container(0, 0, [this.hair, this.backArm, this.legL, this.legR, this.body, this.head, this.arm])
      .setDepth(30);
  }

  onShot(): void {
    this.kick = 1;
  }

  onJump(): void {
    this.squash.set(0);
    this.squash.kick(4.5); // estica
    this.hairSpring.kick(-6); // o cabelo fica para trás
    this.cheer = 1;
  }

  onLand(speed: number): void {
    this.squash.kick(-Math.min(6, 1.5 + speed / 160)); // achata proporcional à queda
    this.hairSpring.kick(Math.min(9, 2 + speed / 90)); // e os cachos desabam
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
    this.hairSpring.set(0);
    this.hairSpring.velocity = 0;
    this.kick = 0;
  }

  /**
   * Um pé do moonwalk. Na primeira metade do ciclo desliza chapado no sentido
   * do movimento; na segunda volta na ponta, com o joelho dobrado (perna mais
   * curta) e o calcanhar erguido.
   */
  private moonFoot(leg: Phaser.GameObjects.Image, baseX: number, phase: number, dir: number): void {
    const u = (((phase / (Math.PI * 2)) % 1) + 1) % 1;
    if (u < 0.5) {
      leg.setX(baseX + (u * 2 - 0.5) * 7 * dir).setRotation(0).setScale(INV, INV);
    } else {
      const v = (u - 0.5) * 2;
      leg.setX(baseX + (0.5 - v) * 7 * dir).setRotation(-0.28 * dir).setScale(INV, INV * 0.8);
    }
  }

  private relaxLeg(leg: Phaser.GameObjects.Image, baseX: number, scaleY: number): void {
    leg.rotation *= 0.7;
    leg.x += (baseX - leg.x) * 0.3;
    leg.setScale(INV, INV * scaleY);
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

    // Moonwalk: o corpo vai para um lado e os pés "andam" para o outro.
    // Cada pé alterna entre deslizar chapado e ficar na ponta com o joelho dobrado.
    const t = performance.now() / 1000;
    let lean = 0;
    if (m.grounded) {
      const speed = Math.abs(m.vx);
      if (speed > 20) {
        const dir = Math.sign(m.vx) * facing; // sentido do movimento no espaço local
        this.runPhase += dt * speed * 0.028;
        this.moonFoot(this.legL, -4, this.runPhase, dir);
        this.moonFoot(this.legR, 5, this.runPhase + Math.PI, dir);
        lean = dir * 0.12; // tronco tomba para trás, contra o "andar" das pernas
        this.body.y = BODY_Y - Math.abs(Math.sin(this.runPhase)) * 0.8;
      } else {
        // Parado: bate o pé na batida e fica na ponta dos pés de vez em quando.
        const beat = Math.floor(t * 2.2);
        const tiptoe = beat % 4 === 3;
        this.relaxLeg(this.legL, -4, tiptoe ? 0.84 : 1);
        this.relaxLeg(this.legR, 5, beat % 2 === 0 ? 0.9 : 1);
        this.body.y = BODY_Y + (tiptoe ? -2.4 : Math.sin(t * 13.8) * 0.5);
      }
    } else {
      // No ar: chute de lado com a perna da frente e a de trás dobrada.
      const rising = m.vy < 0;
      this.legL.setRotation(rising ? 0.5 : 0.2).setScale(INV, INV * 0.82).setX(-4);
      this.legR.setRotation(rising ? -1.25 : -0.6).setScale(INV, INV).setX(5);
      this.body.y = BODY_Y;
    }
    this.body.rotation += (lean - this.body.rotation) * Math.min(1, dt * 10);
    const bob = this.body.y - BODY_Y;

    // Braço livre de discoteca: aponta pro céu e pro chão na batida;
    // no moonwalk fica pro alto, segurando a pose; no pulo, dedo pro céu.
    this.cheer = Math.max(0, this.cheer - dt * 1.5);
    let armTarget: number;
    if (!m.grounded || this.cheer > 0) armTarget = Math.PI - 0.35;
    else if (Math.abs(m.vx) > 20) armTarget = Math.PI - 0.7 + Math.sin(this.runPhase * 0.5) * 0.15;
    else armTarget = Math.floor(t * 1.1) % 2 === 0 ? Math.PI - 0.45 : 0.55;
    this.backArm.rotation += (armTarget - this.backArm.rotation) * Math.min(1, dt * 16);
    this.backArm.y = -33 + bob;

    // Cabelo: mola própria (pulo e pouso) + esticão na queda livre.
    const hd = this.hairSpring.update(dt);
    const fall = m.grounded ? 0 : Math.max(-1, Math.min(1, m.vy / 900)) * 0.12;
    this.hair.setScale(INV * (1 + hd * 0.1 - fall * 0.3), INV * (1 - hd * 0.22 + fall));

    // Braço + pistola mirando, com recuo visual (não mexe no cursor nem na mira real).
    this.kick = Math.max(0, this.kick - dt * 14);
    const local = normalizeAngle(facing > 0 ? p.aimAngle : Math.PI - p.aimAngle);
    const k = this.kick * this.kick;
    this.arm.rotation = local - k * 0.42;
    this.arm.x = this.shoulderX - Math.cos(local) * k * 6;
    this.arm.y = this.shoulderY - Math.sin(local) * k * 6 + bob;
    this.head.rotation = local * 0.22;
    this.head.y = HEAD_Y + bob;
    // Cachos acompanham o rosto girando em torno do pescoço.
    const r = this.head.rotation;
    this.hair.rotation = r;
    this.hair.x = 1 - Math.sin(r) * FACE_DY;
    this.hair.y = HEAD_Y + bob + Math.cos(r) * FACE_DY;

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
