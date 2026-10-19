import Phaser from 'phaser';
import { TEX_SCALE } from '../rendering/textures';

export interface ParticleSpec {
  texture: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  tint?: number;
  gravity?: number;
  /** Fração de velocidade perdida por segundo (0..~10). */
  drag?: number;
  spin?: number;
  rotation?: number;
  scaleFrom?: number;
  scaleTo?: number;
  alphaFrom?: number;
  additive?: boolean;
  /** Quica uma vez no chão com esta restituição. */
  bounceY?: number;
  /** Balanço lateral (penas caindo). */
  sway?: number;
  /** Alinha a rotação à velocidade (faíscas). */
  alignToVelocity?: boolean;
  depth?: number;
}

interface Slot {
  img: Phaser.GameObjects.Image;
  active: boolean;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
  spin: number;
  s0: number;
  s1: number;
  a0: number;
  bounceY: number;
  bounced: boolean;
  sway: number;
  swayPhase: number;
  align: boolean;
}

/**
 * Sistema de partículas próprio com pool fixo. Puramente cosmético:
 * nada aqui influencia dano ou física do jogo.
 */
export class Particles {
  private readonly slots: Slot[] = [];
  private cursor = 0;
  activeCount = 0;

  constructor(
    scene: Phaser.Scene,
    capacity: number,
    private readonly floorY: number,
  ) {
    for (let i = 0; i < capacity; i++) {
      const img = scene.add.image(0, 0, 'px_dot').setVisible(false).setActive(false).setDepth(20);
      this.slots.push({
        img,
        active: false,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        gravity: 0,
        drag: 0,
        spin: 0,
        s0: 1,
        s1: 1,
        a0: 1,
        bounceY: 0,
        bounced: false,
        sway: 0,
        swayPhase: 0,
        align: false,
      });
    }
  }

  get capacity(): number {
    return this.slots.length;
  }

  emit(p: ParticleSpec): void {
    const n = this.slots.length;
    let slot: Slot | undefined;
    for (let i = 0; i < n; i++) {
      const s = this.slots[(this.cursor + i) % n] as Slot;
      if (!s.active) {
        slot = s;
        this.cursor = (this.cursor + i + 1) % n;
        break;
      }
    }
    // Pool cheio: descarta a emissão (efeito cosmético, nunca bloqueia o jogo).
    if (!slot) return;
    slot.active = true;
    this.activeCount++;
    slot.vx = p.vx;
    slot.vy = p.vy;
    slot.life = slot.maxLife = p.life;
    slot.gravity = p.gravity ?? 0;
    slot.drag = p.drag ?? 0;
    slot.spin = p.spin ?? 0;
    slot.s0 = (p.scaleFrom ?? 1) / TEX_SCALE;
    slot.s1 = (p.scaleTo ?? p.scaleFrom ?? 1) / TEX_SCALE;
    slot.a0 = p.alphaFrom ?? 1;
    slot.bounceY = p.bounceY ?? 0;
    slot.bounced = false;
    slot.sway = p.sway ?? 0;
    slot.swayPhase = Math.random() * Math.PI * 2;
    slot.align = p.alignToVelocity ?? false;
    const img = slot.img;
    img
      .setTexture(p.texture)
      .setPosition(p.x, p.y)
      .setRotation(p.rotation ?? 0)
      .setScale(slot.s0)
      .setAlpha(slot.a0)
      .setBlendMode(p.additive ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
      .setDepth(p.depth ?? 20)
      .setVisible(true)
      .setActive(true);
    if (p.tint !== undefined) img.setTint(p.tint);
    else img.clearTint();
  }

  update(dt: number): void {
    for (const s of this.slots) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.active = false;
        this.activeCount--;
        s.img.setVisible(false).setActive(false);
        continue;
      }
      const img = s.img;
      if (s.drag > 0) {
        const k = Math.max(0, 1 - s.drag * dt);
        s.vx *= k;
        s.vy *= k;
      }
      s.vy += s.gravity * dt;
      let x = img.x + s.vx * dt;
      let y = img.y + s.vy * dt;
      if (s.sway !== 0) {
        s.swayPhase += dt * 6;
        x += Math.cos(s.swayPhase) * s.sway * dt;
      }
      if (s.bounceY > 0 && y > this.floorY - 1 && s.vy > 0) {
        y = this.floorY - 1;
        if (!s.bounced) {
          s.vy = -s.vy * s.bounceY;
          s.vx *= 0.6;
          s.spin *= 0.5;
          s.bounced = true;
        } else {
          s.vy = 0;
          s.vx *= 0.8;
          s.spin = 0;
          s.gravity = 0;
        }
      }
      img.x = x;
      img.y = y;
      if (s.align) img.rotation = Math.atan2(s.vy, s.vx);
      else if (s.spin !== 0) img.rotation += s.spin * dt;
      const t = 1 - s.life / s.maxLife;
      img.setScale(s.s0 + (s.s1 - s.s0) * t);
      // Some no último terço da vida.
      img.alpha = t < 0.66 ? s.a0 : s.a0 * (1 - (t - 0.66) / 0.34);
    }
  }

  clear(): void {
    for (const s of this.slots) {
      if (!s.active) continue;
      s.active = false;
      s.img.setVisible(false).setActive(false);
    }
    this.activeCount = 0;
  }
}
