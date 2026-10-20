import Phaser from 'phaser';
import type { World } from '@/core/run/world';
import { lerp } from '@/core/math/scalar';
import { NEON } from './palette';
import { normalizeAngle, Spring } from './spring';
import { JOHNNY_ATLAS, JOHNNY_META, type SpriteMeta } from './sprites';

const SPARKLES = 4;
const GLITTER = 10;
const GLITTER_LIFE = 0.45;
const MOON_FRAMES = 8;
/** Quadros de recuo: o revólver sobe ~3 passos de ângulo no tiro. */
const KICK_STEPS = 3;

type Img = Phaser.GameObjects.Image;

interface Glitter {
  img: Img;
  life: number;
  vx: number;
  vy: number;
}

/**
 * Visual do Johnny Replay, o dançarino dos anos 80 que só anda de moonwalk.
 * Pixel art pintada quadro a quadro (tools/sprites/johnny.py): o corpo troca
 * de quadro conforme o estado e o braço com o revólver tem um quadro por
 * ângulo de mira. Lê o World; nunca o altera.
 */
export class PlayerView {
  readonly root: Phaser.GameObjects.Container;
  private readonly body: Img;
  private readonly arm: Img;
  private readonly meta: SpriteMeta;
  private readonly sparkles: Img[] = [];
  private readonly glitter: Glitter[] = [];
  private readonly shadow: Img;
  private readonly squash = new Spring(420, 14);
  private cheer = 0;
  /** Pose do crítico (mão na virilha, joelho erguido, cabeça pra trás), 1 → 0. */
  private crit = 0;
  private critCooldown = 0;
  private kick = 0;
  private runPhase = 0;
  private glitterTimer = 0;
  private glitterNext = 0;
  private blink = 0;
  private dead = false;
  private deathT = 0;
  private deathVy = 0;
  private deathSpin = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly hh: number,
    _shoulder: { x: number; y: number },
    private readonly groundAt: (x: number) => number,
  ) {
    this.meta = scene.cache.json.get(JOHNNY_META) as SpriteMeta;
    const b = this.meta.body;
    this.shadow = scene.add.image(0, 0, 'shadow').setScale(0.8).setDepth(9);
    this.body = scene.add.image(0, 0, JOHNNY_ATLAS, 'idle_up_1').setOrigin(b.originX / b.w, b.originY / b.h);
    this.arm = scene.add.image(0, 0, JOHNNY_ATLAS, 'arm_12');
    for (let i = 0; i < SPARKLES; i++) {
      this.sparkles.push(
        scene.add.image(0, 0, 'px_star').setScale(0).setBlendMode(Phaser.BlendModes.ADD).setTint(i % 2 ? 0xffffff : 0x9fe8ff),
      );
    }
    for (let i = 0; i < GLITTER; i++) {
      const g = scene.add.image(0, 0, 'px_star').setVisible(false).setDepth(29).setBlendMode(Phaser.BlendModes.ADD);
      this.glitter.push({ img: g, life: 0, vx: 0, vy: 0 });
    }
    this.root = scene.add.container(0, 0, [this.body, ...this.sparkles, this.arm]).setDepth(30);
  }

  onShot(): void {
    this.kick = 1;
  }

  /** Crítico acertou: dispara a pose. Devolve true se é uma pose nova (para o "HII-HII!"). */
  onCrit(): boolean {
    if (this.dead) return false;
    const fresh = this.critCooldown <= 0;
    this.crit = 1;
    if (fresh) {
      this.critCooldown = 0.6;
      this.squash.kick(3);
    }
    return fresh;
  }

  onJump(): void {
    this.squash.set(0);
    this.squash.kick(4.5); // estica
    this.cheer = 1;
  }

  onLand(speed: number): void {
    this.squash.kick(-Math.min(6, 1.5 + speed / 160)); // achata proporcional à queda
  }

  onDeath(): void {
    this.dead = true;
    this.deathT = 0;
    this.deathVy = -420;
    this.deathSpin = (Math.random() < 0.5 ? -1 : 1) * 9;
    this.body.setFrame('hurt');
    this.arm.setVisible(false);
  }

  reset(): void {
    this.dead = false;
    this.root.setRotation(0).setAlpha(1).setVisible(true);
    this.arm.setVisible(true);
    this.squash.set(0);
    this.squash.velocity = 0;
    this.kick = 0;
    this.crit = 0;
    this.critCooldown = 0;
    for (const g of this.glitter) {
      g.life = 0;
      g.img.setVisible(false);
    }
  }

  update(world: World, alpha: number, dt: number): void {
    const p = world.player;
    const m = p.motor;
    const x = lerp(p.px, m.x, alpha);
    const y = lerp(p.py, m.y, alpha) + this.hh;
    this.updateGlitter(dt);

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
    this.root.setPosition(Math.round(x), Math.round(y)).setScale(facing * (1 - d * 0.045), 1 + d * 0.06);

    const t = performance.now() / 1000;
    const speed = Math.abs(m.vx);
    const dir = Math.sign(m.vx) * facing; // sentido do movimento no espaço local
    const moving = m.grounded && speed > 20;
    this.cheer = Math.max(0, this.cheer - dt * 1.5);
    this.critCooldown = Math.max(0, this.critCooldown - dt);
    this.crit = Math.max(0, this.crit - dt * 1.4);

    let frame: string;
    if (this.crit > 0.35) {
      frame = 'crit';
    } else if (p.invuln > 0.75) {
      frame = 'hurt';
    } else if (moving) {
      // Moonwalk de verdade: andando para trás o pé desliza; para a frente, o filme roda ao contrário.
      this.runPhase += dt * speed * 0.028 * (dir <= 0 ? 1 : -1);
      const i = Math.floor((((this.runPhase / (Math.PI * 2)) % 1) + 1) % 1 * MOON_FRAMES);
      frame = `moon_${i}`;
      this.emitGlitter(dt, x, y, facing);
    } else if (m.grounded) {
      // Parado: dobra os joelhos na batida; a cada 4 tempos sobe na ponta dos pés.
      const beat = t * 2.2;
      const tiptoe = Math.floor(beat) % 4 === 3;
      const hand = Math.floor(t * 1.1) % 2 === 0 ? 'up' : 'down';
      frame = tiptoe ? `tiptoe_${hand}` : `idle_${hand}_${beat % 1 < 0.3 ? 0 : 1}`;
    } else {
      frame = m.vy < 0 || this.cheer > 0.6 ? 'jump' : 'fall';
    }
    this.body.setFrame(frame);

    // Braço + revólver: um quadro por ângulo de mira, com recuo (não mexe na mira real).
    const anchor = this.meta.anchors[frame]?.shoulder ?? [this.meta.body.originX, this.meta.body.originY - 40];
    const b = this.meta.body;
    const sx = anchor[0] - b.originX;
    const sy = anchor[1] - b.originY;
    this.kick = Math.max(0, this.kick - dt * 14);
    const local = normalizeAngle(facing > 0 ? p.aimAngle : Math.PI - p.aimAngle);
    const k = this.kick * this.kick;
    const arm = this.meta.arm;
    const step = (arm.stepDeg * Math.PI) / 180;
    const idx = Phaser.Math.Clamp(Math.round((local + Math.PI / 2) / step - k * KICK_STEPS), 0, arm.count - 1);
    this.arm.setFrame(`arm_${idx}`).setPosition(
      Math.round(sx - Math.cos(local) * k * 5),
      Math.round(sy - Math.sin(local) * k * 5),
    );
    // Mirando bem para cima o braço passa por trás do chapéu.
    if (local < -1.1) this.root.moveDown(this.arm);
    else this.root.bringToTop(this.arm);

    // Lantejoulas piscando na jaqueta (mais rápido no moonwalk e no crítico).
    const rate = moving || frame === 'crit' ? 9 : 4;
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i] as Img;
      const ph = t * rate + i * 1.7;
      const cycle = Math.floor(ph / Math.PI);
      const px = -6 + ((cycle * 37 + i * 53) % 13);
      const py = sy - 2 + ((cycle * 29 + i * 41) % 18);
      s.setPosition(px, py).setScale(Math.max(0, Math.sin(ph)) * 0.26).setRotation(ph);
    }

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
    this.shadow.setVisible(true).setPosition(x, gy + 1).setScale(0.8 * sh).setAlpha(sh);
  }

  /** Brilhinho que fica no chão sob o pé que desliza. */
  private emitGlitter(dt: number, x: number, y: number, facing: number): void {
    this.glitterTimer -= dt;
    if (this.glitterTimer > 0) return;
    this.glitterTimer = 0.05;
    const g = this.glitter[this.glitterNext] as Glitter;
    this.glitterNext = (this.glitterNext + 1) % this.glitter.length;
    g.life = GLITTER_LIFE;
    g.vx = (Math.random() - 0.5) * 30;
    g.vy = -20 - Math.random() * 30;
    g.img
      .setVisible(true)
      .setPosition(x + (Math.random() * 10 - 3) * facing, y - 1)
      .setTint(Math.random() < 0.5 ? NEON.pink : NEON.cyan)
      .setScale(0.3)
      .setAlpha(1);
  }

  private updateGlitter(dt: number): void {
    for (const g of this.glitter) {
      if (g.life <= 0) continue;
      g.life -= dt;
      if (g.life <= 0) {
        g.img.setVisible(false);
        continue;
      }
      g.img.x += g.vx * dt;
      g.img.y += g.vy * dt;
      g.img.rotation += dt * 6;
      const k = g.life / GLITTER_LIFE;
      g.img.setAlpha(k).setScale(0.3 * k);
    }
  }
}
