import Phaser from 'phaser';
import type { Enemy } from '@/core/enemies/types';
import { lerp } from '@/core/math/scalar';
import { PAL } from './palette';
import type { EnemyVisual } from './EnemyView';
import { TEX_SCALE } from './textures';
import { VICE2_TEX } from './texturesVice2';
import { Spring } from './spring';

const INV = 1 / TEX_SCALE;

type Img = Phaser.GameObjects.Image;
export type BrawlerKind = 'breaker_boombox' | 'lutador_mamute';

/**
 * Visual dos brigões de chão de corpo inteiro (sem esqueleto):
 * - Breakdancer do Boombox: anda gingando (toprock), agacha e vira de cabeça
 *   para baixo num headspin (giro simulado pela escala X), fica tonto depois.
 * - Lutador Mamute: provoca a plateia, agacha tremendo, sobe esticado e desce
 *   numa barrigada de braços abertos.
 */
export class BrawlerView implements EnemyVisual {
  readonly root: Phaser.GameObjects.Container;
  private readonly body: Img;
  private readonly alt: Img;
  private readonly excl: Img;
  private readonly shieldImg: Img;
  private readonly stars: Img[];
  private readonly shadow: Img;
  private readonly marker: Img;
  private readonly squash = new Spring(320, 11);
  private flash = 0;
  private time = Math.random() * 10;
  private cycle = 0;
  /** Passada no atlas (`<prefix>_walk_0..3`); null sem os quadros. */
  private readonly walkPrefix: string | null;
  private readonly baseKey: string;
  private walkPhase = 0;
  private walkKey = '';
  private telegraphT = 0;
  private telegraphDur = 0;
  private readonly exclY: number;
  uid = -1;

  constructor(
    scene: Phaser.Scene,
    readonly kind: BrawlerKind,
    private readonly groundAt: (x: number) => number,
  ) {
    const T = VICE2_TEX;
    const breaker = kind === 'breaker_boombox';
    const bt = breaker ? T.breakerBody : T.lutadorBody;
    this.body = scene.add.image(0, 0, breaker ? 'breaker_body' : 'lutador_body').setOrigin(bt.fx / bt.w, bt.fy / bt.h).setScale(INV);
    this.baseKey = breaker ? 'breaker_body' : 'lutador_body';
    const prefix = breaker ? 'breaker_walk' : 'lutador_walk';
    this.walkPrefix = scene.textures.exists(`${prefix}_3`) ? prefix : null;
    this.alt = breaker
      ? scene.add.image(0, 0, 'breaker_spin').setOrigin(T.breakerSpin.fx / T.breakerSpin.w, T.breakerSpin.fy / T.breakerSpin.h)
      : scene.add.image(0, 0, 'lutador_flop').setOrigin(T.lutadorFlop.cx / T.lutadorFlop.w, T.lutadorFlop.cy / T.lutadorFlop.h);
    this.alt.setScale(INV).setVisible(false);
    this.exclY = breaker ? -60 : -78;
    this.excl = scene.add.image(-4, this.exclY, 'fx_excl').setScale(INV).setVisible(false);
    this.shieldImg = scene.add.image(0, breaker ? -24 : -32, 'fx_shield').setScale(breaker ? 0.5 : 0.7).setVisible(false);
    this.stars = [0, 1, 2].map(() => scene.add.image(0, 0, 'px_star').setTint(PAL.amber).setScale(1.1).setVisible(false));
    this.root = scene.add.container(0, 0, [this.body, this.alt, this.excl, this.shieldImg, ...this.stars]).setDepth(24);
    this.shadow = scene.add.image(0, 0, 'shadow').setScale((breaker ? 1 : 1.5) * INV).setDepth(9);
    this.marker = scene.add.image(0, 14, 'fx_drop').setScale(INV).setDepth(95).setVisible(false);
    this.release();
  }

  bind(e: Enemy): void {
    this.uid = e.uid;
    this.root.setVisible(true).setActive(true).setAlpha(1).setRotation(0).setPosition(e.x, e.y + e.def.hh);
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
  }

  onHit(): void {
    this.flash = 0.07;
    this.body.setTintFill(0xffffff);
    this.alt.setTintFill(0xffffff);
    this.squash.kick(-2);
  }

  onTelegraph(duration: number): void {
    this.telegraphT = 0;
    this.telegraphDur = duration;
    this.excl.setVisible(true).setScale(0);
  }

  onShot(): void {}

  onLanded(speed: number): void {
    this.squash.kick(-Math.min(9, 2.5 + speed / 160));
  }

  private clearFlash(): void {
    this.body.clearTint();
    this.alt.clearTint();
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

    const rm = reducedMotion ? 0 : 1;
    const t = this.time;
    const d = this.squash.update(dt);
    let sx = 1 - d * 0.05;
    let sy = 1 + d * 0.06;
    let rot = 0;
    let useAlt = false;
    let dizzy = false;

    if (this.kind === 'breaker_boombox') {
      switch (e.state) {
        case 'walk': {
          // Toprock: passinho de lado com o boombox no ombro.
          this.cycle += dt * (4 + Math.abs(e.vx) * 0.05);
          rot = Math.sin(this.cycle) * 0.1 * rm + 0.06;
          sy += Math.abs(Math.sin(this.cycle)) * 0.04 * rm;
          break;
        }
        case 'crouch':
          sy *= 0.82;
          sx *= 1.08;
          rot = Math.sin(t * 40) * 0.04 * rm;
          break;
        case 'spin': {
          // Headspin: a escala X oscila e dá a ilusão de giro em torno do próprio eixo.
          useAlt = true;
          const s = reducedMotion ? 1 : Math.cos(t * 34);
          sx *= Math.abs(s) < 0.2 ? 0.2 * Math.sign(s || 1) : s;
          break;
        }
        case 'rest':
          dizzy = true;
          rot = Math.sin(t * 5) * 0.15 * rm;
          break;
        default:
          rot = e.state === 'descend' ? Math.sin(t * 18) * 0.15 * rm : 0;
      }
    } else {
      switch (e.state) {
        case 'rest':
          // Provocação: "não tô ouvindo!", balançando o peitoral.
          sy += Math.max(0, Math.sin(t * 5)) * 0.04 * rm;
          rot = -0.05;
          break;
        case 'crouch':
          sy *= 0.8;
          sx *= 1.1;
          rot = Math.sin(t * 45) * 0.03 * rm;
          break;
        case 'leap':
          if (e.vy < 0) {
            sy *= 1.12;
            sx *= 0.92;
          } else {
            useAlt = true;
          }
          break;
        case 'descend':
          useAlt = true;
          break;
        default:
          break;
      }
    }

    // Passada quadro a quadro enquanto anda; parado volta ao corpo base.
    let key = this.baseKey;
    if (this.walkPrefix && e.state === 'walk' && Math.abs(e.vx) > 5) {
      this.walkPhase += dt * (5 + Math.abs(e.vx) * 0.03);
      key = `${this.walkPrefix}_${Math.floor(this.walkPhase) % 4}`;
    }
    if (key !== this.walkKey) {
      this.walkKey = key;
      this.body.setTexture(key);
    }
    this.body.setVisible(!useAlt);
    this.alt.setVisible(useAlt);
    if (useAlt && this.kind === 'lutador_mamute') this.alt.setPosition(0, -e.def.hh);
    this.root.setPosition(x, y).setScale(e.facing * sx, sy);
    this.root.rotation += (rot * e.facing - this.root.rotation) * Math.min(1, dt * 14);

    if (e.state === 'crouch' && this.telegraphDur > 0) {
      this.telegraphT += dt;
      const tt = Math.min(1, this.telegraphT / this.telegraphDur);
      const pop = tt < 0.15 ? (tt / 0.15) * 1.3 : 1.3 - Math.min(0.3, (tt - 0.15) * 2);
      this.excl.setVisible(true).setScale(pop * INV);
      this.excl.y = this.exclY - Math.sin(t * 20) * 1.5;
    } else if (this.excl.visible) {
      this.excl.setVisible(false);
      this.telegraphDur = 0;
    }

    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i] as Img;
      s.setVisible(dizzy);
      if (!dizzy) continue;
      const a = t * 6 + (i * Math.PI * 2) / 3;
      s.setPosition(2 + Math.cos(a) * 11, this.exclY + 8 + Math.sin(a) * 4).setRotation(t * 5);
    }

    this.shieldImg.setVisible(e.shield > 0);
    if (e.shield > 0) this.shieldImg.setAlpha(0.55 + 0.3 * Math.sin(t * 6));

    const gy = this.groundAt(x);
    const height = Math.max(0, gy - y);
    const sh = Math.max(0.3, 1 - height / 400);
    const base = this.kind === 'breaker_boombox' ? 1 : 1.5;
    this.shadow.setPosition(x, gy + 1).setScale(base * sh * INV).setAlpha(0.4 + sh * 0.4);
  }
}
