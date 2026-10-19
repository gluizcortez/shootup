import Phaser from 'phaser';
import type { Enemy, EnemyKind } from '@/core/enemies/types';
import { lerp } from '@/core/math/scalar';
import { TEX, TEX_SCALE } from './textures';
import { normalizeAngle, Spring } from './spring';

const INV = 1 / TEX_SCALE;

interface Rig {
  body: Phaser.GameObjects.Image;
  prop: Phaser.GameObjects.Image;
  gun: Phaser.GameObjects.Image;
  gunX: number;
  gunY: number;
  glow: Phaser.GameObjects.Image;
  excl: Phaser.GameObjects.Image;
  exclY: number;
}

/** Visual de um animal. Reaproveitado via pool por espécie. */
export class EnemyView {
  readonly root: Phaser.GameObjects.Container;
  private readonly rig: Rig;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly squash = new Spring(380, 12);
  private flash = 0;
  private wasGrounded = true;
  private time = Math.random() * 10;
  private gunFrame = 0;
  private gunFrameTimer = 0;
  private telegraphT = 0;
  private telegraphDur = 0;
  private shotKick = 0;
  uid = -1;

  constructor(
    scene: Phaser.Scene,
    readonly kind: EnemyKind,
    private readonly floorY: number,
  ) {
    this.rig = kind === 'pato_pistoleiro' ? this.buildPato(scene) : this.buildGalinha(scene);
    this.shadow = scene.add.image(0, floorY + 1, 'shadow').setScale(0.9 * INV).setDepth(9);
    const r = this.rig;
    this.root = scene.add.container(0, 0, [r.body, r.prop, r.gun, r.glow, r.excl]).setDepth(25);
    this.release();
  }

  private buildPato(scene: Phaser.Scene): Rig {
    const t = TEX.patoBody;
    const body = scene.add.image(0, 0, 'pato_body').setOrigin(20 / t.w, 36 / t.h).setScale(INV);
    const prop = scene.add.image(7, -31, 'pato_hat').setOrigin(0.5, 0.85).setScale(INV).setRotation(-0.12);
    const gun = scene.add
      .image(-2, -14, 'pato_gun')
      .setOrigin(TEX.patoGun.pivotX / TEX.patoGun.w, 0.5)
      .setScale(INV);
    const glow = scene.add.image(16, -16, 'fx_glow').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    const excl = scene.add.image(4, -58, 'fx_excl').setScale(INV).setVisible(false);
    return { body, prop, gun, gunX: -2, gunY: -14, glow, excl, exclY: -58 };
  }

  private buildGalinha(scene: Phaser.Scene): Rig {
    const t = TEX.galinhaBody;
    const body = scene.add.image(0, 0, 'galinha_body').setOrigin(23 / t.w, 55 / t.h).setScale(INV);
    const prop = scene.add.image(7, -38, 'galinha_glasses').setScale(INV);
    const gun = scene.add
      .image(-11, -21, 'galinha_gun_a')
      .setOrigin(TEX.galinhaGun.pivotX / TEX.galinhaGun.w, 0.5)
      .setScale(INV);
    const glow = scene.add.image(36, -21, 'fx_glow').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    const excl = scene.add.image(4, -72, 'fx_excl').setScale(INV).setVisible(false);
    return { body, prop, gun, gunX: -11, gunY: -21, glow, excl, exclY: -72 };
  }

  bind(e: Enemy): void {
    this.uid = e.uid;
    this.root.setVisible(true).setActive(true).setAlpha(1).setRotation(0);
    this.shadow.setVisible(true);
    this.flash = 0;
    this.telegraphT = 0;
    this.telegraphDur = 0;
    this.shotKick = 0;
    this.wasGrounded = e.grounded;
    this.rig.excl.setVisible(false);
    this.rig.glow.setScale(0);
    this.clearFlash();
  }

  release(): void {
    this.uid = -1;
    this.root.setVisible(false).setActive(false);
    this.shadow.setVisible(false);
  }

  onHit(): void {
    this.flash = 0.07;
    for (const o of this.parts()) o.setTintFill(0xffffff);
    this.squash.kick(-3);
  }

  onTelegraph(duration: number): void {
    this.telegraphT = 0;
    this.telegraphDur = duration;
    this.rig.excl.setVisible(true).setScale(0);
  }

  onShot(): void {
    this.shotKick = 1;
    if (this.kind === 'pato_pistoleiro') {
      this.telegraphDur = 0;
      this.rig.excl.setVisible(false);
    }
  }

  private parts(): Phaser.GameObjects.Image[] {
    return [this.rig.body, this.rig.prop, this.rig.gun];
  }

  private clearFlash(): void {
    for (const o of this.parts()) o.clearTint();
  }

  update(e: Enemy, alpha: number, dt: number, playerX: number, playerY: number, reducedMotion: boolean): void {
    this.time += dt;
    const x = lerp(e.px, e.x, alpha);
    const y = lerp(e.py, e.y, alpha) + e.def.hh;
    const r = this.rig;

    if (this.flash > 0) {
      this.flash -= dt;
      if (this.flash <= 0) this.clearFlash();
    }
    if (e.grounded && !this.wasGrounded) this.squash.kick(-4);
    if (!e.grounded && this.wasGrounded) this.squash.kick(3.5);
    this.wasGrounded = e.grounded;

    const d = this.squash.update(dt);
    this.root.setPosition(x, y).setScale(e.facing * (1 - d * 0.05), 1 + d * 0.065);

    // Rotação do corpo: gingado ao andar, pose dramática ao mirar.
    let lean = 0;
    if (e.state === 'aim') lean = -0.16;
    else if (e.grounded && Math.abs(e.vx) > 15 && !reducedMotion) lean = Math.sin(this.time * 14) * 0.07;
    r.body.rotation += (lean - r.body.rotation) * Math.min(1, dt * 18);
    r.prop.rotation = (this.kind === 'pato_pistoleiro' ? -0.12 : 0) + r.body.rotation * 0.8;

    // Arma: aponta ao jogador no aviso do pato; rajada horizontal na galinha.
    this.shotKick = Math.max(0, this.shotKick - dt * 10);
    let gunRot = 0;
    if (this.kind === 'pato_pistoleiro') {
      if (e.state === 'aim' || e.state === 'recover') {
        const mx = x + e.def.muzzle.x * e.facing;
        const my = y - e.def.hh + e.def.muzzle.y;
        const world = Math.atan2(playerY - my, playerX - mx);
        gunRot = normalizeAngle(e.facing > 0 ? world : Math.PI - world);
      } else {
        gunRot = 0.5; // pistolinha baixa, relaxada
      }
      gunRot -= this.shotKick * 0.8;
    } else {
      gunRot = e.state === 'burst' ? (Math.random() - 0.5) * 0.06 : 0.05;
      this.updateMinigun(e, dt);
    }
    r.gun.rotation = gunRot;
    r.gun.x = r.gunX - this.shotKick * 4;
    r.gun.y = r.gunY;

    // Telegraph: "!" com pop, brilho crescendo na boca da arma.
    if (this.telegraphDur > 0 && (e.state === 'aim' || e.state === 'spinup')) {
      this.telegraphT += dt;
      const t = Math.min(1, this.telegraphT / this.telegraphDur);
      const pop = t < 0.15 ? (t / 0.15) * 1.3 : 1.3 - Math.min(0.3, (t - 0.15) * 2);
      r.excl.setScale(pop * INV).setVisible(true);
      r.excl.y = r.exclY - Math.sin(this.time * 20) * 1.5;
      r.glow.setScale(0.4 + t * 1.1).setAlpha(0.5 + 0.5 * Math.sin(this.time * 40));
      if (this.kind === 'pato_pistoleiro') {
        // O brilho segue a ponta da pistolinha.
        r.glow.x = r.gun.x + Math.cos(gunRot) * 16;
        r.glow.y = r.gun.y + Math.sin(gunRot) * 16;
      }
      if (this.kind === 'galinha_rambo' && !reducedMotion) {
        r.body.x = (Math.random() - 0.5) * 1.5 * t; // tremendo de raiva
      }
    } else {
      r.excl.setVisible(false);
      r.glow.setScale(Math.max(0, r.glow.scale - dt * 8));
      r.body.x = 0;
    }

    this.shadow.setPosition(x, this.floorY + 1);
    const height = Math.max(0, this.floorY - y);
    const sh = Math.max(0.4, 1 - height / 160);
    this.shadow.setScale(0.9 * sh * INV);
  }

  private updateMinigun(e: Enemy, dt: number): void {
    let interval = 0;
    if (e.state === 'spinup' && this.telegraphDur > 0) {
      const t = Math.min(1, this.telegraphT / this.telegraphDur);
      interval = 0.14 - t * 0.12;
    } else if (e.state === 'burst') {
      interval = 0.02;
    } else if (e.state === 'cooldown') {
      interval = 0.09;
    }
    if (interval <= 0) return;
    this.gunFrameTimer -= dt;
    if (this.gunFrameTimer <= 0) {
      this.gunFrameTimer = interval;
      this.gunFrame ^= 1;
      this.rig.gun.setTexture(this.gunFrame ? 'galinha_gun_b' : 'galinha_gun_a');
    }
  }
}
