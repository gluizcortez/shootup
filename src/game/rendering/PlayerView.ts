import Phaser from 'phaser';
import type { World } from '@/core/run/world';
import { lerp } from '@/core/math/scalar';
import { Limb } from './limb';
import { NEON } from './palette';
import { TEX, TEX_SCALE } from './textures';
import { normalizeAngle, Spring } from './spring';

const INV = 1 / TEX_SCALE;
/** O desenho fica um pouco maior que a hitbox, para ler bem na arena larga. */
const VISUAL_SCALE = 1.12;

const BODY_Y = -24;
const HIP_Y = -15;
const HIP_X = 3;
const NECK = { x: 1, y: -36 };
const BACK_SHOULDER = { x: -5, y: -32 };
const LEG_A = 6.2;
const LEG_B = 6.2;
/** Do tornozelo até a sola do sapato chapado. */
const ANKLE_H = 3.9;
const ARM_A = 7.5;
const ARM_B = 7.5;
/** Ponto de assento do chapéu e centro do rosto, relativos ao pescoço. */
const HAT_OFF = { x: 2, y: -19 };
const FACE_OFF = { x: 2, y: -10.5 };
const SPARKLES = 4;
const GLITTER = 10;
const GLITTER_LIFE = 0.45;

type Img = Phaser.GameObjects.Image;

interface FootPose {
  x: number;
  y: number;
  /** Rotação do sapato: >0 abaixa o bico (na ponta do pé). */
  rot: number;
}

interface Glitter {
  img: Img;
  life: number;
  vx: number;
  vy: number;
}

/**
 * Visual do Johnny Replay, o dançarino dos anos 80 que só anda de moonwalk.
 * Esqueleto com joelhos e cotovelos (IK): cada pose define onde ficam os pés
 * e a mão livre, e os membros se resolvem sozinhos. Lê o World; nunca o altera.
 */
export class PlayerView {
  readonly root: Phaser.GameObjects.Container;
  private readonly body: Img;
  private readonly head: Img;
  private readonly hat: Img;
  private readonly hair: Img;
  private readonly arm: Img;
  private readonly shoeBack: Img;
  private readonly shoeFront: Img;
  private readonly legBack: Limb;
  private readonly legFront: Limb;
  private readonly backArm: Limb;
  private readonly sparkles: Img[] = [];
  private readonly glitter: Glitter[] = [];
  private readonly shadow: Img;
  private readonly squash = new Spring(420, 14);
  /** Cachos e chapéu balançam atrasados em relação ao corpo. */
  private readonly hairSpring = new Spring(260, 9);
  private readonly hatSpring = new Spring(300, 10);
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
    const img = (key: string, ox: number, oy: number) => scene.add.image(0, 0, key).setOrigin(ox, oy).setScale(INV);
    const limbImg = (key: string, t: { w: number; h: number; py: number }) => img(key, 0.5, t.py / t.h);

    this.hair = img('pl_hair', TEX.plHair.cx / TEX.plHair.w, TEX.plHair.cy / TEX.plHair.h);
    this.backArm = new Limb(limbImg('pl_uparm', TEX.plUpArm), limbImg('pl_forearm', TEX.plForearm), ARM_A, ARM_B, 1);
    this.legBack = new Limb(limbImg('pl_thigh', TEX.plThigh), limbImg('pl_shin', TEX.plShin), LEG_A, LEG_B, -1);
    this.legFront = new Limb(limbImg('pl_thigh', TEX.plThigh), limbImg('pl_shin', TEX.plShin), LEG_A, LEG_B, -1);
    this.legBack.setTint(0xb8b4c8);
    const shoe = () => img('pl_shoe', TEX.plShoe.ax / TEX.plShoe.w, TEX.plShoe.ay / TEX.plShoe.h);
    this.shoeBack = shoe().setTint(0xb8b4c8);
    this.shoeFront = shoe();
    this.body = img('pl_body', 0.5, 0.5).setPosition(0, BODY_Y);
    this.head = img('pl_head', TEX.plHead.nx / TEX.plHead.w, TEX.plHead.ny / TEX.plHead.h);
    this.hat = img('pl_hat', TEX.plHat.bx / TEX.plHat.w, TEX.plHat.by / TEX.plHat.h);
    this.arm = img('pl_arm', TEX.plArm.pivotX / TEX.plArm.w, 0.5).setPosition(this.shoulderX, this.shoulderY);
    for (let i = 0; i < SPARKLES; i++) {
      this.sparkles.push(
        scene.add.image(0, 0, 'px_star').setScale(0).setBlendMode(Phaser.BlendModes.ADD).setTint(i % 2 ? 0xffffff : 0x9fe8ff),
      );
    }
    for (let i = 0; i < GLITTER; i++) {
      const g = scene.add.image(0, 0, 'px_star').setVisible(false).setDepth(29).setBlendMode(Phaser.BlendModes.ADD);
      this.glitter.push({ img: g, life: 0, vx: 0, vy: 0 });
    }
    this.root = scene.add
      .container(0, 0, [
        this.hair,
        this.backArm.upper,
        this.backArm.lower,
        this.legBack.upper,
        this.legBack.lower,
        this.shoeBack,
        this.body,
        this.legFront.upper,
        this.legFront.lower,
        this.shoeFront,
        this.head,
        this.hat,
        ...this.sparkles,
        this.arm,
      ])
      .setDepth(30);
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
      this.hatSpring.kick(-7); // o chapéu pula
      this.setHandInFront(true);
    }
    return fresh;
  }

  onJump(): void {
    this.squash.set(0);
    this.squash.kick(4.5); // estica
    this.hairSpring.kick(-6);
    this.hatSpring.kick(-4);
    this.cheer = 1;
  }

  onLand(speed: number): void {
    this.squash.kick(-Math.min(6, 1.5 + speed / 160)); // achata proporcional à queda
    this.hairSpring.kick(Math.min(9, 2 + speed / 90));
    this.hatSpring.kick(Math.min(6, 1 + speed / 140));
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
    for (const s of [this.squash, this.hairSpring, this.hatSpring]) {
      s.set(0);
      s.velocity = 0;
    }
    this.kick = 0;
    this.crit = 0;
    this.critCooldown = 0;
    this.setHandInFront(false);
    for (const g of this.glitter) {
      g.life = 0;
      g.img.setVisible(false);
    }
  }

  /** No crítico a mão livre passa para a frente do corpo. */
  private setHandInFront(front: boolean): void {
    const r = this.root;
    if (front) {
      r.moveAbove(this.backArm.upper, this.body);
      r.moveAbove(this.backArm.lower, this.backArm.upper);
    } else {
      r.moveBelow(this.backArm.lower, this.legBack.upper);
      r.moveBelow(this.backArm.upper, this.backArm.lower);
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
      this.hat.y -= dt * 60; // o chapéu sai voando
      this.hat.rotation += dt * 8;
      this.shadow.setVisible(false);
      return;
    }

    const facing = Math.cos(p.aimAngle) >= 0 ? 1 : -1;
    const d = this.squash.update(dt);
    this.root
      .setPosition(x, y)
      .setScale(facing * VISUAL_SCALE * (1 - d * 0.045), VISUAL_SCALE * (1 + d * 0.06));

    const t = performance.now() / 1000;
    const speed = Math.abs(m.vx);
    const dir = Math.sign(m.vx) * facing; // sentido do movimento no espaço local
    const moving = m.grounded && speed > 20;
    this.cheer = Math.max(0, this.cheer - dt * 1.5);
    this.critCooldown = Math.max(0, this.critCooldown - dt);

    let hipDrop = 0;
    let lean = 0;
    let headTilt = 0;
    let hoo = false;
    let back: FootPose;
    let front: FootPose;
    let hand: { x: number; y: number };

    if (moving) {
      // Moonwalk: o pé chapado desliza no sentido do movimento enquanto o outro
      // fica na ponta, parado no chão; depois trocam. O tronco tomba pra trás.
      this.runPhase += dt * speed * 0.028;
      back = this.moonFoot(-HIP_X, this.runPhase, dir);
      front = this.moonFoot(HIP_X + 1, this.runPhase + Math.PI, dir);
      lean = dir * 0.12;
      hipDrop = 0.6 + Math.abs(Math.sin(this.runPhase)) * 0.6;
      // Mão segurando a aba do chapéu, pose clássica de pista.
      hand = { x: 6, y: -50 + Math.sin(this.runPhase) * 0.6 };
      this.emitGlitter(dt, x, y, front.rot < 0.1 ? front : back, facing);
    } else if (m.grounded) {
      // Parado: dobra os joelhos na batida; a cada 4 tempos sobe na ponta dos pés.
      const beat = t * 2.2;
      const inBeat = beat % 1;
      const tiptoe = Math.floor(beat) % 4 === 3;
      hipDrop = tiptoe ? -2.6 : Math.max(0, 1 - inBeat * 3) * 1.6;
      back = { x: -HIP_X - 0.5, y: 0, rot: tiptoe ? 0.9 : 0 };
      front = { x: HIP_X + 1.5, y: 0, rot: tiptoe ? 0.9 : 0 };
      headTilt = Math.sin(beat * Math.PI) * 0.06;
      // Braço de discoteca: aponta pro céu e pro chão no ritmo.
      const up = Math.floor(t * 1.1) % 2 === 0;
      hand = up ? { x: -2, y: -53 } : { x: -15, y: -16 };
      hoo = tiptoe;
    } else {
      // No ar: joelho da frente erguido, perna de trás esticada, dedo pro céu.
      const rising = m.vy < 0;
      back = { x: -HIP_X - 3, y: rising ? -1 : 0.5, rot: 0.8 };
      front = { x: HIP_X + 4, y: rising ? -7 : -4, rot: 1.0 };
      hand = { x: -1, y: -54 };
      hoo = this.cheer > 0;
    }

    // Crítico: mão na virilha, joelho da frente lá em cima, cabeça pra trás.
    let critK = 0;
    if (this.crit > 0) {
      this.crit = Math.max(0, this.crit - dt * 1.4);
      critK = Math.min(1, this.crit * 3);
      const k = critK;
      front = { x: lerp(front.x, HIP_X + 3, k), y: lerp(front.y, -6.5, k), rot: lerp(front.rot, 1.25, k) };
      back = { x: lerp(back.x, -HIP_X - 1, k), y: lerp(back.y, 0, k), rot: lerp(back.rot, 0.15, k) };
      hand = { x: lerp(hand.x, 3, k), y: lerp(hand.y, -14, k) };
      hipDrop = lerp(hipDrop, 1.2, k);
      lean = lerp(lean, -0.16, k);
      headTilt = lerp(headTilt, -0.4, k);
      hoo = true;
      if (this.crit === 0) this.setHandInFront(false);
    }

    // Tronco; o quadril gira junto com ele (em torno do centro do corpo).
    this.body.rotation += (lean - this.body.rotation) * Math.min(1, dt * 12);
    const bob = hipDrop;
    this.body.y = BODY_Y + bob;
    const cosL = Math.cos(this.body.rotation);
    const sinL = Math.sin(this.body.rotation);
    const hip = (hx: number) => ({
      x: hx * cosL - (HIP_Y - BODY_Y) * sinL,
      y: this.body.y + hx * sinL + (HIP_Y - BODY_Y) * cosL,
    });
    const hb = hip(-HIP_X);
    const hf = hip(HIP_X);
    this.legBack.solve(hb.x, hb.y, back.x, back.y - ANKLE_H - this.ankleLift(back.rot));
    this.legFront.solve(hf.x, hf.y, front.x, front.y - ANKLE_H - this.ankleLift(front.rot));
    this.shoeBack.setPosition(this.legBack.end.x, this.legBack.end.y).setRotation(back.rot);
    this.shoeFront.setPosition(this.legFront.end.x, this.legFront.end.y).setRotation(front.rot);

    // Braço livre (o ombro acompanha a inclinação do tronco).
    this.backArm.solve(BACK_SHOULDER.x - sinL * 8, BACK_SHOULDER.y + bob, hand.x, hand.y);

    // Braço + revólver mirando, com recuo visual (não mexe na mira real).
    this.kick = Math.max(0, this.kick - dt * 14);
    const local = normalizeAngle(facing > 0 ? p.aimAngle : Math.PI - p.aimAngle);
    const k = this.kick * this.kick;
    this.arm.rotation = local - k * 0.42;
    this.arm.x = this.shoulderX - Math.cos(local) * k * 6;
    this.arm.y = this.shoulderY - Math.sin(local) * k * 6 + bob;

    // Cabeça olha para a mira; chapéu e cachos com mola própria.
    const hr = local * 0.22 + headTilt;
    const nx = NECK.x - sinL * 6;
    const ny = NECK.y + bob;
    this.head.setTexture(hoo ? 'pl_head_hoo' : 'pl_head').setPosition(nx, ny).setRotation(hr);
    const cosH = Math.cos(hr);
    const sinH = Math.sin(hr);
    const hs = this.hatSpring.update(dt);
    this.hat
      .setPosition(nx + HAT_OFF.x * cosH - HAT_OFF.y * sinH, ny + HAT_OFF.x * sinH + HAT_OFF.y * cosH + hs * 0.8 - critK * 3)
      .setRotation(hr - 0.12 + hs * 0.05 - critK * 0.35 + (moving ? -0.08 : 0));
    const hd = this.hairSpring.update(dt);
    const fall = m.grounded ? 0 : Math.max(-1, Math.min(1, m.vy / 900)) * 0.12;
    this.hair
      .setPosition(nx + FACE_OFF.x * cosH - FACE_OFF.y * sinH, ny + FACE_OFF.x * sinH + FACE_OFF.y * cosH)
      .setRotation(hr)
      .setScale(INV * (1 + hd * 0.1 - fall * 0.3), INV * (1 - hd * 0.22 + fall));

    // Lantejoulas piscando na jaqueta (mais rápido no moonwalk e no crítico).
    const rate = moving || critK > 0 ? 9 : 4;
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i] as Img;
      const ph = t * rate + i * 1.7;
      const cycle = Math.floor(ph / Math.PI);
      const sx = -6 + ((cycle * 37 + i * 53) % 13);
      const sy = -34 + ((cycle * 29 + i * 41) % 18);
      s.setPosition(sx, sy + bob).setScale(Math.max(0, Math.sin(ph)) * 0.26).setRotation(ph);
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
    this.shadow.setVisible(true).setPosition(x, gy + 1).setScale(0.8 * sh * INV, 0.8 * sh * INV).setAlpha(sh);
  }

  /** Quanto o tornozelo sobe quando o pé está na ponta. */
  private ankleLift(rot: number): number {
    return Math.max(0, Math.sin(rot)) * 5;
  }

  /**
   * Um pé do moonwalk. Metade do ciclo desliza chapado no sentido do
   * movimento; a outra metade fica na ponta, parado no chão (volta no espaço
   * local enquanto o corpo anda).
   */
  private moonFoot(baseX: number, phase: number, dir: number): FootPose {
    const u = (((phase / (Math.PI * 2)) % 1) + 1) % 1;
    const s = 4.6;
    if (u < 0.5) return { x: baseX + (u * 4 - 1) * s * dir, y: 0, rot: 0 };
    const v = (u - 0.5) * 2;
    // Sobe na ponta logo no começo da meia-volta e desce suave no fim.
    const toe = v < 0.15 ? v / 0.15 : v > 0.85 ? (1 - v) / 0.15 : 1;
    return { x: baseX + (1 - v * 2) * s * dir, y: 0, rot: toe * 0.85 };
  }

  /** Brilhinho que fica no chão sob o pé que desliza. */
  private emitGlitter(dt: number, x: number, y: number, foot: FootPose, facing: number): void {
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
      .setPosition(x + foot.x * facing * VISUAL_SCALE + (Math.random() - 0.5) * 6, y - 1)
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
