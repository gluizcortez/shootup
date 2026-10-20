import Phaser from 'phaser';
import type { Enemy } from '@/core/enemies/types';
import { lerp } from '@/core/math/scalar';
import { PAL } from './palette';
import type { EnemyVisual } from './EnemyView';
import { TEX, TEX_SCALE } from './textures';
import { Spring } from './spring';

const INV = 1 / TEX_SCALE;
/** Origem do container = pés. Quadril e ombros em px acima do chão. */
const HIP = -16;
const BODY_BOTTOM = -13;
const SHOULDER_Y = -33;
const BELL_Y = -39;

type Img = Phaser.GameObjects.Image;

/**
 * Rei do Topete (id estável `vaca_loca`): imitador do rei do rock que atropela.
 * Poses por estado: pisa forte de punhos erguidos no aviso, sprint
 * inclinado na investida, cambaleia com estrelinhas quando tonta.
 */
export class VacaView implements EnemyVisual {
  readonly kind = 'vaca_loca' as const;
  readonly root: Phaser.GameObjects.Container;
  private readonly body: Img;
  private readonly bell: Img;
  private readonly legBack: Img;
  private readonly legFront: Img;
  private readonly armBack: Img;
  private readonly armFront: Img;
  private readonly stars: Img[];
  private readonly excl: Img;
  private readonly shadow: Img;
  private readonly marker: Img;
  private readonly shieldImg: Img;
  private readonly squash = new Spring(320, 11);
  private flash = 0;
  private time = Math.random() * 10;
  private cycle = 0;
  private telegraphT = 0;
  private telegraphDur = 0;
  uid = -1;

  constructor(
    scene: Phaser.Scene,
    private readonly groundAt: (x: number) => number,
  ) {
    const shade = 0xc9b8d6;
    const leg = (x: number, back: boolean) =>
      scene.add.image(x, HIP, 'vaca_leg').setOrigin(0.5, 0.05).setScale(INV).setTint(back ? shade : 0xffffff);
    const arm = (x: number, back: boolean) =>
      scene.add
        .image(x, SHOULDER_Y, 'vaca_arm')
        .setOrigin(TEX.vacaArm.pivotX / TEX.vacaArm.w, 0.5)
        .setScale(INV)
        .setTint(back ? shade : 0xffffff);
    this.legBack = leg(-5, true);
    this.legFront = leg(4, false);
    this.armBack = arm(-4, true);
    this.armFront = arm(5, false);
    this.body = scene.add
      .image(0, BODY_BOTTOM, 'vaca_body')
      .setOrigin(20 / TEX.vacaBody.w, 1)
      .setScale(INV);
    this.bell = scene.add.image(8, BELL_Y, 'vaca_bell').setOrigin(0.5, 0).setScale(INV);
    this.excl = scene.add.image(6, -78, 'fx_excl').setScale(INV).setVisible(false);
    this.shieldImg = scene.add.image(0, -29, 'fx_shield').setScale(0.5).setVisible(false);
    this.stars = [0, 1, 2].map(() => scene.add.image(0, 0, 'px_star').setTint(PAL.amber).setScale(1.1).setVisible(false));
    this.root = scene.add
      .container(0, 0, [this.armBack, this.legBack, this.body, this.legFront, this.bell, this.armFront, this.excl, this.shieldImg, ...this.stars])
      .setDepth(24);
    this.shadow = scene.add.image(0, 0, 'shadow').setScale(1.1 * INV).setDepth(9);
    this.marker = scene.add.image(0, 14, 'fx_drop').setScale(INV).setDepth(95).setVisible(false);
    this.release();
  }

  bind(e: Enemy): void {
    this.uid = e.uid;
    this.root.setVisible(true).setActive(true).setAlpha(1).setRotation(0);
    this.shadow.setVisible(true);
    this.flash = 0;
    this.telegraphDur = 0;
    this.excl.setVisible(false);
    this.clearFlash();
  }

  release(): void {
    this.uid = -1;
    this.root.setVisible(false).setActive(false);
    this.shadow.setVisible(false);
    this.marker.setVisible(false);
    for (const s of this.stars) s.setVisible(false);
  }

  onHit(): void {
    this.flash = 0.07;
    this.body.setTintFill(0xffffff);
    this.squash.kick(-2.5);
  }

  onTelegraph(duration: number): void {
    this.telegraphT = 0;
    this.telegraphDur = duration;
    this.excl.setVisible(true).setScale(0);
  }

  onShot(): void {}

  onLanded(speed: number): void {
    this.squash.kick(-Math.min(6, 2 + speed / 200));
  }

  private clearFlash(): void {
    this.body.clearTint();
  }

  update(e: Enemy, alpha: number, dt: number, reducedMotion: boolean): void {
    this.time += dt;
    const x = lerp(e.px, e.x, alpha);
    const y = lerp(e.py, e.y, alpha) + e.def.hh;

    if (e.state === 'incoming') {
      const pulse = 1 + Math.abs(Math.sin(this.time * 12)) * 0.25;
      this.marker
        .setVisible(true)
        .setPosition(e.x, 16 + Math.abs(Math.sin(this.time * 9)) * 6)
        .setScale(pulse * INV);
      this.root.setVisible(false);
      this.shadow.setVisible(false);
      return;
    }
    if (this.marker.visible) {
      this.marker.setVisible(false);
      this.root.setVisible(true);
      this.shadow.setVisible(true);
    }
    if (this.flash > 0) {
      this.flash -= dt;
      if (this.flash <= 0) this.clearFlash();
    }

    const d = this.squash.update(dt);
    this.root.setPosition(x, y).setScale(e.facing * (1 - d * 0.05), 1 + d * 0.06);

    const speed = Math.abs(e.vx);
    let tilt = 0;
    let bob = 0;
    let legB = 0;
    let legF = 0;
    let armB = 1.2; // braços caídos ao lado do corpo (apontando para baixo)
    let armF = 1.2;
    let liftFront = 0;
    let hip = 0;

    switch (e.state) {
      case 'charge': {
        // Sprint de desenho animado: pernas girando, braços bombeando, corpo inclinado.
        this.cycle += dt * (8 + speed * 0.045);
        const s = Math.sin(this.cycle);
        legB = s * 0.95;
        legF = -s * 0.95;
        armB = 0.5 - s * 1.1;
        armF = -0.15; // dedo apontado pra frente, como quem diz "lá vou eu"

        bob = reducedMotion ? 0 : -Math.abs(Math.cos(this.cycle)) * 4;
        tilt = 0.28;
        break;
      }
      case 'stomp': {
        // Arma a investida com a dancinha do rei: joelho tremendo na ponta do pé,
        // quadril rebolando e o dedo apontando pro alto e pro chão ("uh-huh!").
        this.telegraphT += dt;
        const wobble = reducedMotion ? 0 : Math.sin(this.telegraphT * 30);
        legB = 0.38;
        legF = -0.3 + wobble * 0.32;
        liftFront = 2 + Math.max(0, wobble) * 2;
        hip = reducedMotion ? 0 : Math.sin(this.telegraphT * 15) * 0.12;
        const up = Math.floor(this.telegraphT * 3) % 2 === 0;
        armF = up ? -1.25 : 0.9;
        armB = 0.55; // mão na cintura
        bob = reducedMotion ? 0 : -Math.abs(Math.sin(this.telegraphT * 15)) * 1.5;
        tilt = -0.06;
        break;
      }
      case 'dizzy':
        tilt = reducedMotion ? 0 : Math.sin(this.time * 5) * 0.18;
        legB = Math.sin(this.time * 4) * 0.25;
        legF = -legB;
        armB = 1.2 + Math.sin(this.time * 6) * 0.7; // braços moles balançando
        armF = 1.2 - Math.sin(this.time * 6) * 0.7;
        break;
      case 'descend':
        // Caindo de braços e pernas abertos.
        legB = 0.5;
        legF = -0.5;
        armB = -2.2;
        armF = -0.9;
        break;
      default:
        bob = reducedMotion ? 0 : Math.sin(this.time * 3) * 0.8;
        armB = 1.25 + Math.sin(this.time * 3) * 0.08;
        armF = 1.15 - Math.sin(this.time * 3) * 0.08;
        if (speed > 20) {
          this.cycle += dt * speed * 0.05;
          legB = Math.sin(this.cycle) * 0.45;
          legF = -legB;
        }
    }

    this.legBack.rotation = legB;
    this.legFront.rotation = legF;
    this.legFront.y = HIP - liftFront;
    this.armBack.rotation = armB;
    this.armFront.rotation = armF;
    this.armBack.y = this.armFront.y = SHOULDER_Y + bob;
    this.body.y = BODY_BOTTOM + bob;
    this.body.rotation = hip;
    this.bell.y = BELL_Y + bob;
    const swing = e.state === 'charge' ? 0.6 : 0.15;
    this.bell.rotation = reducedMotion ? 0 : Math.sin(this.time * (e.state === 'charge' ? 18 : 4)) * swing;
    this.root.rotation += (tilt * e.facing - this.root.rotation) * Math.min(1, dt * 12);

    if (e.state === 'stomp' && this.telegraphDur > 0) {
      const t = Math.min(1, this.telegraphT / this.telegraphDur);
      const pop = t < 0.15 ? (t / 0.15) * 1.3 : 1.3 - Math.min(0.3, (t - 0.15) * 2);
      this.excl.setVisible(true).setScale(pop * INV);
      this.excl.y = -78 - Math.sin(this.time * 20) * 1.5;
    } else if (this.excl.visible) {
      this.excl.setVisible(false);
      this.telegraphDur = 0;
    }

    const dizzy = e.state === 'dizzy';
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i] as Img;
      s.setVisible(dizzy);
      if (!dizzy) continue;
      const a = this.time * 6 + (i * Math.PI * 2) / 3;
      s.setPosition(6 + Math.cos(a) * 13, -64 + Math.sin(a) * 4).setRotation(this.time * 5);
    }

    this.shieldImg.setVisible(e.shield > 0);
    if (e.shield > 0) this.shieldImg.setAlpha(0.55 + 0.3 * Math.sin(this.time * 6));

    const gy = this.groundAt(x);
    const height = Math.max(0, gy - y);
    const sh = Math.max(0.3, 1 - height / 400);
    this.shadow.setPosition(x, gy + 1).setScale(1.1 * sh * INV).setAlpha(0.4 + sh * 0.4);
  }
}
