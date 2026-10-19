import Phaser from 'phaser';
import type { Enemy } from '@/core/enemies/types';
import { lerp } from '@/core/math/scalar';
import { PAL } from './palette';
import type { EnemyVisual } from './EnemyView';
import { TEX, TEX_SCALE } from './textures';
import { Spring } from './spring';

const INV = 1 / TEX_SCALE;
/** Altura das pernas: o tronco fica apoiado nelas (origem do container = pés). */
const LEG_TOP = -11;
const BODY_BOTTOM = -8;

/**
 * Vaca Loca: corpo + quatro pernas articuladas + sininho.
 * Poses por estado: bate o casco no aviso, galopa inclinada na investida
 * e cambaleia com estrelinhas quando está tonta.
 */
export class VacaView implements EnemyVisual {
  readonly kind = 'vaca_loca' as const;
  readonly root: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Image;
  private readonly bell: Phaser.GameObjects.Image;
  /** Traseira esquerda, traseira direita, dianteira esquerda, dianteira direita. */
  private readonly legs: Phaser.GameObjects.Image[];
  private readonly stars: Phaser.GameObjects.Image[];
  private readonly excl: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly marker: Phaser.GameObjects.Image;
  private readonly squash = new Spring(320, 11);
  private flash = 0;
  private time = Math.random() * 10;
  private gallop = 0;
  private telegraphT = 0;
  private telegraphDur = 0;
  uid = -1;

  constructor(
    scene: Phaser.Scene,
    private readonly groundAt: (x: number) => number,
  ) {
    const leg = (x: number, back: boolean) =>
      scene.add
        .image(x, LEG_TOP, 'vaca_leg')
        .setOrigin(0.5, 0)
        .setScale(INV)
        .setTint(back ? 0xd9d3cc : 0xffffff);
    this.legs = [leg(-19, true), leg(-12, false), leg(4, true), leg(10, false)];
    this.body = scene.add
      .image(0, BODY_BOTTOM, 'vaca_body')
      .setOrigin(32 / TEX.vacaBody.w, 1)
      .setScale(INV);
    this.bell = scene.add.image(13, -14, 'vaca_bell').setOrigin(0.5, 0).setScale(INV);
    this.excl = scene.add.image(20, -52, 'fx_excl').setScale(INV).setVisible(false);
    this.stars = [0, 1, 2].map(() =>
      scene.add.image(0, 0, 'px_star').setTint(PAL.amber).setScale(1.1).setVisible(false),
    );
    const [lb, lf, rb, rf] = this.legs as [Phaser.GameObjects.Image, Phaser.GameObjects.Image, Phaser.GameObjects.Image, Phaser.GameObjects.Image];
    this.root = scene.add.container(0, 0, [lb, rb, this.body, lf, rf, this.bell, this.excl, ...this.stars]).setDepth(24);
    this.shadow = scene.add.image(0, 0, 'shadow').setScale(1.5 * INV).setDepth(9);
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
    const [lb, lf, rb, rf] = this.legs as [Phaser.GameObjects.Image, Phaser.GameObjects.Image, Phaser.GameObjects.Image, Phaser.GameObjects.Image];
    let legA = 0;
    let legB = 0;
    let stompLeg = 0;

    switch (e.state) {
      case 'charge': {
        // Galope: frequência acompanha a velocidade; tronco inclinado para frente.
        this.gallop += dt * (6 + speed * 0.05);
        legA = Math.sin(this.gallop) * 0.75;
        legB = Math.sin(this.gallop + Math.PI) * 0.75;
        bob = reducedMotion ? 0 : -Math.abs(Math.sin(this.gallop)) * 3;
        tilt = 0.1;
        break;
      }
      case 'stomp': {
        // Bate o casco dianteiro: levanta e desce rápido, cabeça baixa.
        this.telegraphT += dt;
        const k = Math.sin(this.telegraphT * 26);
        stompLeg = k > 0 ? -k * 0.9 : 0;
        tilt = 0.07 + (reducedMotion ? 0 : Math.sin(this.telegraphT * 26) * 0.02);
        break;
      }
      case 'dizzy':
        tilt = reducedMotion ? 0 : Math.sin(this.time * 5) * 0.12;
        legA = Math.sin(this.time * 3) * 0.2;
        legB = -legA;
        break;
      case 'descend':
        legA = -0.45;
        legB = 0.45;
        break;
      default:
        bob = reducedMotion ? 0 : Math.sin(this.time * 3) * 0.6;
        if (speed > 20) {
          this.gallop += dt * speed * 0.04;
          legA = Math.sin(this.gallop) * 0.35;
          legB = -legA;
        }
    }

    lb.rotation = legA;
    rf.rotation = legA;
    lf.rotation = legB;
    rb.rotation = legB + stompLeg;
    rf.rotation += stompLeg * 0.3;
    this.body.y = BODY_BOTTOM + bob;
    this.bell.y = -14 + bob;
    this.bell.rotation = reducedMotion ? 0 : Math.sin(this.time * (e.state === 'charge' ? 18 : 4)) * (e.state === 'charge' ? 0.5 : 0.15);
    this.root.rotation += (-tilt * e.facing - this.root.rotation) * Math.min(1, dt * 12);

    // Aviso "!" com pop durante o bater de casco.
    if (e.state === 'stomp' && this.telegraphDur > 0) {
      const t = Math.min(1, this.telegraphT / this.telegraphDur);
      const pop = t < 0.15 ? (t / 0.15) * 1.3 : 1.3 - Math.min(0.3, (t - 0.15) * 2);
      this.excl.setVisible(true).setScale(pop * INV);
      this.excl.y = -52 - Math.sin(this.time * 20) * 1.5;
    } else if (this.excl.visible) {
      this.excl.setVisible(false);
      this.telegraphDur = 0;
    }

    // Estrelinhas orbitando a cabeça quando tonta.
    const dizzy = e.state === 'dizzy';
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i] as Phaser.GameObjects.Image;
      s.setVisible(dizzy);
      if (!dizzy) continue;
      const a = this.time * 6 + (i * Math.PI * 2) / 3;
      s.setPosition(20 + Math.cos(a) * 13, -40 + Math.sin(a) * 4).setRotation(this.time * 5);
    }

    const gy = this.groundAt(x);
    const height = Math.max(0, gy - y);
    const sh = Math.max(0.3, 1 - height / 400);
    this.shadow.setPosition(x, gy + 1).setScale(1.5 * sh * INV).setAlpha(0.4 + sh * 0.4);
  }
}
