import Phaser from 'phaser';
import type { Enemy, EnemyKind } from '@/core/enemies/types';
import { lerp } from '@/core/math/scalar';
import { TEX, TEX_SCALE } from './textures';
import { VICE_TEX } from './texturesVice';
import { normalizeAngle, Spring } from './spring';

const INV = 1 / TEX_SCALE;

interface Rig {
  /** Atrás do corpo: paraquedas, jetpack, asa-delta ou rotor. */
  lift: Phaser.GameObjects.Image;
  flame: Phaser.GameObjects.Image | null;
  body: Phaser.GameObjects.Image;
  prop: Phaser.GameObjects.Image;
  gun: Phaser.GameObjects.Image;
  gunX: number;
  gunY: number;
  glow: Phaser.GameObjects.Image;
  excl: Phaser.GameObjects.Image;
  exclY: number;
}

/** Contrato comum dos visuais de inimigo (pool por espécie na cena). */
export interface EnemyVisual {
  readonly kind: EnemyKind;
  uid: number;
  bind(e: Enemy): void;
  release(): void;
  onHit(): void;
  onTelegraph(duration: number): void;
  onShot(): void;
  onLanded(speed: number): void;
  update(e: Enemy, alpha: number, dt: number, reducedMotion: boolean): void;
}

/** Visual de um vilão atirador que paira no alto. Reaproveitado via pool por tipo. */
export class EnemyView implements EnemyVisual {
  readonly root: Phaser.GameObjects.Container;
  private readonly rig: Rig;
  private readonly shadow: Phaser.GameObjects.Image;
  /** Seta de aviso no topo da tela enquanto o vilão está para entrar. */
  private readonly marker: Phaser.GameObjects.Image;
  /** Bolha do escudo dado pelo Tio do Cassino. */
  private readonly shield: Phaser.GameObjects.Image;
  private readonly shieldScale: number;
  /** Escala do visual (o chefe é desenhado na base e ampliado). */
  private readonly size: number;
  private readonly squash = new Spring(380, 12);
  private flash = 0;
  private time = Math.random() * 10;
  private gunFrame = 0;
  private gunFrameTimer = 0;
  private telegraphT = 0;
  private telegraphDur = 0;
  private shotKick = 0;
  /** Mira laser do Policial Corrupto (desenhada no mundo, fora do container). */
  private readonly laser: Phaser.GameObjects.Graphics | null;
  uid = -1;

  constructor(
    scene: Phaser.Scene,
    readonly kind: EnemyKind,
    private readonly groundAt: (x: number) => number,
  ) {
    this.rig = this.build(scene, kind);
    this.shadow = scene.add.image(0, 0, 'shadow').setScale(0.9 * INV).setDepth(9);
    const big = kind === 'don_pombone';
    this.shieldScale = big ? 1.15 / 1.3 : 1;
    this.size = big ? 1.3 : 1;
    this.marker = scene.add.image(0, 14, 'fx_drop').setScale(INV).setDepth(95).setVisible(false);
    const r = this.rig;
    const parts: Phaser.GameObjects.Image[] = [r.lift];
    if (r.flame) parts.push(r.flame);
    parts.push(r.body, r.prop, r.gun, r.glow, r.excl);
    this.shield = scene.add.image(0, 0, 'fx_shield').setVisible(false);
    parts.push(this.shield);
    this.root = scene.add.container(0, 0, parts).setDepth(big ? 23 : 25);
    this.laser = kind === 'policial_corrupto' ? scene.add.graphics().setDepth(24).setBlendMode(Phaser.BlendModes.ADD) : null;
    this.release();
  }

  private build(scene: Phaser.Scene, kind: EnemyKind): Rig {
    switch (kind) {
      case 'patinador_assassino':
        return this.buildPatinador(scene);
      case 'policial_corrupto':
        return this.buildPolicial(scene);
      case 'pato_pistoleiro':
        return this.buildPato(scene);
      case 'galinha_rambo':
        return this.buildGalinha(scene);
      case 'pombo_mafioso':
        return this.buildPombo(scene);
      case 'porco_executivo':
        return this.buildPorco(scene);
      case 'don_pombone':
        return this.buildPombone(scene);
      default:
        throw new Error(`sem visual de atirador para ${kind}`);
    }
  }

  private buildPatinador(scene: Phaser.Scene): Rig {
    const t = VICE_TEX.patinadorBody;
    const lift = scene.add.image(-4, -45, 'patinador_hair').setScale(INV); // juba atrás da cabeça
    const flame = scene.add
      .image(0, -1, 'fx_flame')
      .setOrigin(0.5, 0)
      .setScale(INV)
      .setBlendMode(Phaser.BlendModes.ADD); // patins a jato
    const body = scene.add.image(0, 0, 'patinador_body').setOrigin(t.fx / t.w, t.fy / t.h).setScale(INV);
    const prop = scene.add.image(5.5, -49, 'patinador_visor').setScale(INV).setRotation(-0.08);
    const gun = scene.add
      .image(4, -36, 'patinador_gun')
      .setOrigin(VICE_TEX.patinadorGun.pivotX / VICE_TEX.patinadorGun.w, 0.5)
      .setScale(INV);
    const glow = scene.add.image(27, -36, 'fx_glow').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    const excl = scene.add.image(-6, -64, 'fx_excl').setScale(INV).setVisible(false);
    return { lift, flame, body, prop, gun, gunX: 4, gunY: -36, glow, excl, exclY: -64 };
  }

  private buildPolicial(scene: Phaser.Scene): Rig {
    const t = VICE_TEX.policialBody;
    const lift = scene.add.image(-11, -32, 'policial_siren').setScale(INV); // mochila com giroflex
    const flame = scene.add
      .image(-11, -19, 'fx_flame')
      .setOrigin(0.5, 0)
      .setScale(INV)
      .setBlendMode(Phaser.BlendModes.ADD);
    const body = scene.add.image(0, 0, 'policial_body').setOrigin(t.fx / t.w, t.fy / t.h).setScale(INV);
    const prop = scene.add.image(7.5, -44.5, 'policial_shades').setScale(INV);
    const gun = scene.add
      .image(6, -35, 'policial_gun')
      .setOrigin(VICE_TEX.policialGun.pivotX / VICE_TEX.policialGun.w, 0.5)
      .setScale(INV);
    const glow = scene.add.image(31, -35, 'fx_glow').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    const excl = scene.add.image(-8, -62, 'fx_excl').setScale(INV).setVisible(false);
    return { lift, flame, body, prop, gun, gunX: 6, gunY: -35, glow, excl, exclY: -62 };
  }

  private buildPombo(scene: Phaser.Scene): Rig {
    const t = TEX.pomboBody;
    const lift = scene.add.image(-1, -17, 'pombo_wing').setOrigin(3 / TEX.pomboWing.w, 0.5).setScale(INV);
    const body = scene.add.image(0, 0, 'pombo_body').setOrigin(17 / t.w, 28 / t.h).setScale(INV);
    const prop = scene.add.image(5, -24.5, 'pombo_hat').setScale(INV).setRotation(-0.1);
    const gun = scene.add
      .image(4, -10, 'pombo_gun')
      .setOrigin(TEX.pomboGun.pivotX / TEX.pomboGun.w, 0.5)
      .setScale(INV);
    const glow = scene.add.image(20, -10, 'fx_glow').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    const excl = scene.add.image(-8, -36, 'fx_excl').setScale(INV).setVisible(false);
    return { lift, flame: null, body, prop, gun, gunX: 4, gunY: -10, glow, excl, exclY: -36 };
  }

  private buildPorco(scene: Phaser.Scene): Rig {
    const t = TEX.porcoBody;
    const lift = scene.add.image(3, -55, 'porco_heli').setScale(INV);
    const body = scene.add.image(0, 0, 'porco_body').setOrigin(23 / t.w, 45 / t.h).setScale(INV);
    const prop = scene.add.image(3, -47, 'porco_hat').setScale(INV).setRotation(0.08);
    const gun = scene.add
      .image(9, -22, 'porco_case')
      .setOrigin(TEX.porcoCase.pivotX / TEX.porcoCase.w, 0.5)
      .setScale(INV);
    const glow = scene.add.image(26, -22, 'fx_glow').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    const excl = scene.add.image(-14, -60, 'fx_excl').setScale(INV).setVisible(false);
    return { lift, flame: null, body, prop, gun, gunX: 9, gunY: -22, glow, excl, exclY: -60 };
  }

  private buildPombone(scene: Phaser.Scene): Rig {
    const t = TEX.pomboneBody;
    const lift = scene.add.image(-28, -86, 'pombone_wing').setScale(INV); // rotor da mochila
    const body = scene.add.image(0, 0, 'pombone_body').setOrigin(48 / t.w, 90 / t.h).setScale(INV);
    const prop = scene.add.image(12, -84, 'pombone_hat').setScale(INV).setRotation(-0.12);
    const gun = scene.add
      .image(14, -32, 'pombone_gun')
      .setOrigin(TEX.pomboneGun.pivotX / TEX.pomboneGun.w, 0.5)
      .setScale(INV);
    const glow = scene.add.image(50, -32, 'fx_glow').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    const excl = scene.add.image(-20, -104, 'fx_excl').setScale(INV * 1.6).setVisible(false);
    return { lift, flame: null, body, prop, gun, gunX: 14, gunY: -32, glow, excl, exclY: -104 };
  }

  private buildPato(scene: Phaser.Scene): Rig {
    const t = TEX.patoBody;
    const lift = scene.add
      .image(5, -26, 'pato_balloons')
      .setOrigin(0.5, 46 / TEX.patoBalloons.h)
      .setScale(INV);
    const body = scene.add.image(0, 0, 'pato_body').setOrigin(20 / t.w, 36 / t.h).setScale(INV);
    const prop = scene.add.image(7, -31, 'pato_hat').setOrigin(0.5, 0.85).setScale(INV).setRotation(-0.12);
    const gun = scene.add
      .image(-2, -14, 'pato_gun')
      .setOrigin(TEX.patoGun.pivotX / TEX.patoGun.w, 0.5)
      .setScale(INV);
    const glow = scene.add.image(14, -14, 'fx_glow').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    const excl = scene.add.image(-14, -40, 'fx_excl').setScale(INV).setVisible(false);
    return { lift, flame: null, body, prop, gun, gunX: -2, gunY: -14, glow, excl, exclY: -40 };
  }

  private buildGalinha(scene: Phaser.Scene): Rig {
    const t = TEX.galinhaBody;
    const lift = scene.add.image(-14, -30, 'galinha_jetpack').setScale(INV);
    const flame = scene.add
      .image(-14, -15, 'fx_flame')
      .setOrigin(0.5, 0)
      .setScale(INV)
      .setBlendMode(Phaser.BlendModes.ADD);
    const body = scene.add.image(0, 0, 'galinha_body').setOrigin(23 / t.w, 55 / t.h).setScale(INV);
    const prop = scene.add.image(7, -38, 'galinha_glasses').setScale(INV);
    const gun = scene.add
      .image(-11, -21, 'galinha_gun_a')
      .setOrigin(TEX.galinhaGun.pivotX / TEX.galinhaGun.w, 0.5)
      .setScale(INV);
    const glow = scene.add.image(34, -21, 'fx_glow').setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    const excl = scene.add.image(4, -72, 'fx_excl').setScale(INV).setVisible(false);
    return { lift, flame, body, prop, gun, gunX: -11, gunY: -21, glow, excl, exclY: -72 };
  }

  bind(e: Enemy): void {
    this.uid = e.uid;
    this.root.setVisible(true).setActive(true).setAlpha(1).setRotation(0);
    this.shadow.setVisible(true);
    this.flash = 0;
    this.telegraphT = 0;
    this.telegraphDur = 0;
    this.shotKick = 0;
    this.rig.excl.setVisible(false);
    this.rig.glow.setScale(0);
    this.clearFlash();
  }

  release(): void {
    this.uid = -1;
    this.root.setVisible(false).setActive(false);
    this.shadow.setVisible(false);
    this.marker.setVisible(false);
    this.laser?.clear();
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

  onLanded(): void {}

  private parts(): Phaser.GameObjects.Image[] {
    return [this.rig.body, this.rig.prop, this.rig.gun];
  }

  private clearFlash(): void {
    for (const o of this.parts()) o.clearTint();
  }

  update(e: Enemy, alpha: number, dt: number, reducedMotion: boolean): void {
    this.time += dt;
    const x = lerp(e.px, e.x, alpha);
    const y = lerp(e.py, e.y, alpha) + e.def.hh;
    const r = this.rig;

    // Aviso no topo: pulsa e quica até o animal aparecer.
    if (e.state === 'incoming') {
      const pulse = 1 + Math.abs(Math.sin(this.time * 12)) * 0.25;
      this.marker
        .setVisible(true)
        .setPosition(e.x, 16 + Math.abs(Math.sin(this.time * 9)) * 6)
        .setScale(pulse * INV);
      this.root.setVisible(false);
      this.shadow.setVisible(false);
      this.laser?.clear();
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
    // Patinador agachado nos patins antes do drive-by.
    const crouch = e.state === 'crouch' ? 0.14 : 0;
    this.root
      .setPosition(x, y)
      .setScale(this.size * e.facing * (1 - d * 0.05 + crouch * 0.4), this.size * (1 + d * 0.065 - crouch));
    // Inclina na direção do voo; pose dramática do pato ao mirar.
    const tilt = e.state === 'aim' ? -0.14 : Math.max(-0.25, Math.min(0.25, e.vx * e.facing * 0.0018));
    this.root.rotation += (tilt * e.facing - this.root.rotation) * Math.min(1, dt * 10);

    // Paraquedas balança; asa-delta oscila; rotores giram; chama do jetpack tremula.
    if (this.kind === 'pato_pistoleiro') {
      r.lift.rotation = reducedMotion ? 0 : Math.sin(this.time * 2.2) * 0.08 - e.vx * e.facing * 0.001;
    } else if (this.kind === 'pombo_mafioso') {
      r.lift.rotation = (reducedMotion ? 0 : Math.sin(this.time * 7) * 0.12) - 0.15 - e.vx * e.facing * 0.0008;
    } else if (this.kind === 'don_pombone') {
      // Toni Mantega anuncia o ataque acelerando o rotor da mochila.
      const angry = e.state === 'aim';
      r.lift.scaleX = INV * Math.cos(this.time * (angry ? 70 : 32));
    } else if (this.kind === 'patinador_assassino' && r.flame) {
      // Juba balança com o vento; o jato dos patins aponta para trás na passada.
      const dash = e.state === 'dash';
      r.lift.rotation = reducedMotion ? 0 : Math.sin(this.time * 6) * 0.08 + Math.min(0.35, Math.abs(e.vx) * 0.0007);
      const boost = dash ? 1.9 : e.state === 'descend' ? 1.4 : 1;
      r.flame
        .setRotation(dash ? 1.15 : 0.15)
        .setScale(INV * (0.8 + Math.random() * 0.4) * boost, INV * (0.6 + Math.random() * 0.5) * boost);
      r.body.rotation = reducedMotion ? 0 : dash ? 0.12 : Math.sin(this.time * 4.5 + e.uid) * 0.07; // gingado de rinque
    } else if (this.kind === 'policial_corrupto' && r.flame) {
      // Giroflex piscando vermelho/azul.
      const blink = Math.floor(this.time * (e.state === 'aim' ? 14 : 7)) % 2 === 0;
      if (reducedMotion) r.lift.clearTint();
      else r.lift.setTint(blink ? 0xffd0d6 : 0xd0dcff);
      const boost = e.state === 'descend' ? 1.4 : 1;
      r.flame.setScale(INV * (0.7 + Math.random() * 0.4) * boost, INV * (0.6 + Math.random() * 0.5) * boost);
    } else if (this.kind === 'porco_executivo') {
      r.lift.scaleX = INV * Math.cos(this.time * 45);
    } else if (r.flame) {
      const boost = e.state === 'descend' ? 1.4 : 1;
      r.flame.setScale(INV * (0.8 + Math.random() * 0.4) * boost, INV * (0.7 + Math.random() * 0.6) * boost);
      r.body.rotation = e.state === 'descend' && !reducedMotion ? Math.sin(this.time * 30) * 0.12 : 0; // esperneando
    }

    // Arma: aponta para onde a IA mira (ângulo do mundo convertido para o espaço local).
    this.shotKick = Math.max(0, this.shotKick - dt * 10);
    const local = normalizeAngle(e.facing > 0 ? e.aimAngle : Math.PI - e.aimAngle) - this.root.rotation * e.facing;
    let gunRot = local - this.shotKick * 0.5;
    if (this.kind === 'galinha_rambo') {
      if (e.state === 'burst') gunRot += (Math.random() - 0.5) * 0.06;
      this.updateMinigun(e, dt);
    }
    r.gun.rotation = gunRot;
    r.gun.x = r.gunX - Math.cos(local) * this.shotKick * 4;
    r.gun.y = r.gunY - Math.sin(local) * this.shotKick * 4;

    // Telegraph: "!" com pop, brilho crescendo na boca da arma.
    if (this.telegraphDur > 0 && (e.state === 'aim' || e.state === 'spinup' || e.state === 'buff' || e.state === 'crouch')) {
      this.telegraphT += dt;
      const t = Math.min(1, this.telegraphT / this.telegraphDur);
      const pop = t < 0.15 ? (t / 0.15) * 1.3 : 1.3 - Math.min(0.3, (t - 0.15) * 2);
      r.excl.setScale(pop * INV).setVisible(true);
      r.excl.y = r.exclY - Math.sin(this.time * 20) * 1.5;
      const len = (e.def.role === 'ranged' ? e.def.barrelLength : 16) / this.size;
      r.glow
        .setPosition(r.gun.x + Math.cos(gunRot) * len, r.gun.y + Math.sin(gunRot) * len)
        .setScale(0.4 + t * 1.1)
        .setAlpha(0.5 + 0.5 * Math.sin(this.time * 40));
    } else {
      r.excl.setVisible(false);
      r.glow.setScale(Math.max(0, r.glow.scale - dt * 8));
    }

    if (this.laser) this.drawLaser(e, x, y - e.def.hh);

    // Escudo: bolha dourada pulsando enquanto durar.
    if (e.shield > 0) {
      const pulse = 1 + Math.sin(this.time * 6) * 0.04;
      this.shield
        .setVisible(true)
        .setPosition(0, -e.def.hh / this.size)
        .setScale((this.shieldScale * pulse * (e.def.hw + e.def.hh) * 1.6) / 128)
        .setAlpha(0.55 + 0.35 * Math.min(1, e.shield / 30));
    } else if (this.shield.visible) {
      this.shield.setVisible(false);
    }

    // Sombra no chão: mostra a coluna onde o atirador está.
    const gy = this.groundAt(x);
    const height = Math.max(0, gy - y);
    const sh = Math.max(0.3, 1 - height / 500);
    this.shadow.setPosition(x, gy + 1).setScale(0.9 * this.size * sh * INV).setAlpha(0.4 + sh * 0.4);
  }

  /**
   * Mira laser do Policial: segue o jogador durante a mira e pisca quando trava
   * (janela para sair da linha). Vai da boca do cano até bater no chão.
   */
  private drawLaser(e: Enemy, cx: number, cy: number): void {
    const g = this.laser as Phaser.GameObjects.Graphics;
    g.clear();
    if (e.state !== 'aim' || e.def.behaviour !== 'policial') return;
    const def = e.def;
    const locked = e.stateTimer <= def.aimTime * def.aimLockFraction;
    if (locked && Math.floor(this.time * 24) % 2 === 0) return;
    const px = cx + def.gunPivot.x * e.facing;
    const py = cy + def.gunPivot.y;
    const dx = Math.cos(e.aimAngle);
    const dy = Math.sin(e.aimAngle);
    const sx = px + dx * def.barrelLength;
    const sy = py + dy * def.barrelLength;
    let len = 20;
    while (len < 1400 && sy + dy * len < this.groundAt(sx + dx * len)) len += 10;
    const ex = sx + dx * len;
    const ey = sy + dy * len;
    const k = Math.min(1, 1 - e.stateTimer / def.aimTime);
    g.lineStyle(locked ? 4 : 3, 0xff2d3d, 0.18 + k * 0.15).lineBetween(sx, sy, ex, ey);
    g.lineStyle(locked ? 1.6 : 1, locked ? 0xffe0e4 : 0xff5a6a, 0.6 + k * 0.35).lineBetween(sx, sy, ex, ey);
    g.fillStyle(0xff2d3d, 0.9).fillCircle(ex, ey, locked ? 4 : 3);
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
