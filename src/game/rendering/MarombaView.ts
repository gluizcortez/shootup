import Phaser from 'phaser';
import type { Enemy } from '@/core/enemies/types';
import { lerp } from '@/core/math/scalar';
import { Limb } from './limb';
import type { EnemyVisual } from './EnemyView';
import { TEX_SCALE } from './textures';
import { VICE_TEX } from './texturesVice';
import { Spring } from './spring';

const INV = 1 / TEX_SCALE;
/** Origem do container = pés. Medidas em px acima do chão, olhando para a direita. */
const HIP_Y = -23;
const HIP_SPREAD = 4;
/** Do quadril (centro do torso) até ombros e pescoço. */
const SHOULDER_F = { x: 15, y: -29 };
const SHOULDER_B = { x: -15, y: -29 };
const NECK = { x: 1, y: -33 };
const ARM_A = 12;
const ARM_B = 12;
const GLINTS = 4;

type Img = Phaser.GameObjects.Image;
type Pt = { x: number; y: number };

interface Pose {
  /** Alvos das mãos (espaço do container) e lado para onde dobra cada cotovelo. */
  handF: Pt;
  handB: Pt;
  bendF: 1 | -1;
  bendB: 1 | -1;
  face: 'maromba_head' | 'maromba_head_grr' | 'maromba_head_kiss';
  headRot: number;
  /** Peito estufado (escala X extra do torso). */
  pump: number;
  lean: number;
}

/** Poses de fisiculturismo, em ciclo (o índice vem da IA em `Enemy.attack`). */
const POSES: readonly Pose[] = [
  // Duplo bíceps de frente.
  { handF: { x: 27, y: -64 }, handB: { x: -27, y: -64 }, bendF: 1, bendB: -1, face: 'maromba_head', headRot: 0, pump: 0.05, lean: 0 },
  // "Most muscular": punhos juntos na barriga, careta de força.
  { handF: { x: 4, y: -38 }, handB: { x: -2, y: -39 }, bendF: -1, bendB: 1, face: 'maromba_head_grr', headRot: 0.12, pump: 0.12, lean: 0.1 },
  // Bíceps de lado com a outra mão na cintura.
  { handF: { x: 27, y: -64 }, handB: { x: -12, y: -30 }, bendF: 1, bendB: 1, face: 'maromba_head', headRot: -0.1, pump: 0.06, lean: -0.05 },
  // Beijinho no próprio bíceps.
  { handF: { x: 22, y: -68 }, handB: { x: -12, y: -30 }, bendF: 1, bendB: 1, face: 'maromba_head_kiss', headRot: 0.28, pump: 0.04, lean: 0.05 },
];

/**
 * Maromba Miami Vice (id `maromba_vice`): fisiculturista bronzeado de spray,
 * oleoso, de bandana e shortinho neon, braços gigantes e perninhas de palito.
 * Cai do céu esperneando e, plantado no chão, só troca de pose mostrando os
 * muques (cotovelos por IK de dois ossos, ver limb.ts).
 */
export class MarombaView implements EnemyVisual {
  readonly kind = 'maromba_vice' as const;
  readonly root: Phaser.GameObjects.Container;
  private readonly torso: Img;
  private readonly head: Img;
  private readonly tails: Img;
  private readonly legBack: Img;
  private readonly legFront: Img;
  private readonly armBack: Limb;
  private readonly armFront: Limb;
  private readonly glints: Img[] = [];
  private readonly heart: Img;
  private readonly shadow: Img;
  private readonly marker: Img;
  private readonly shieldImg: Img;
  private readonly squash = new Spring(300, 10);
  private readonly tailSpring = new Spring(160, 6);
  private flash = 0;
  private time = Math.random() * 10;
  private pose = -1;
  private poseBlend = 1;
  private heartT = 1;
  private from: { f: Pt; b: Pt } = { f: { x: 0, y: 0 }, b: { x: 0, y: 0 } };
  private cur: { f: Pt; b: Pt } = { f: { x: 27, y: -64 }, b: { x: -27, y: -64 } };
  uid = -1;

  constructor(
    scene: Phaser.Scene,
    private readonly groundAt: (x: number) => number,
  ) {
    const T = VICE_TEX;
    const img = (key: string, ox: number, oy: number) => scene.add.image(0, 0, key).setOrigin(ox, oy).setScale(INV);
    const limbImg = (key: string, t: { w: number; h: number; py: number }) => img(key, 0.5, t.py / t.h);
    const arm = (bend: 1 | -1) =>
      new Limb(limbImg('maromba_uparm', T.marombaUpArm), limbImg('maromba_forearm', T.marombaForearm), ARM_A, ARM_B, bend);
    const shade = 0xd9b8a8;

    this.armBack = arm(-1);
    this.armBack.setTint(shade);
    this.legBack = img('maromba_leg', T.marombaLeg.px / T.marombaLeg.w, 0).setTint(shade);
    this.legFront = img('maromba_leg', T.marombaLeg.px / T.marombaLeg.w, 0);
    this.torso = img('maromba_torso', T.marombaTorso.hx / T.marombaTorso.w, T.marombaTorso.hy / T.marombaTorso.h);
    this.tails = img('maromba_tails', T.marombaTails.ax / T.marombaTails.w, T.marombaTails.ay / T.marombaTails.h);
    this.head = img('maromba_head', T.marombaHead.nx / T.marombaHead.w, T.marombaHead.ny / T.marombaHead.h);
    this.armFront = arm(1);
    for (let i = 0; i < GLINTS; i++) {
      this.glints.push(scene.add.image(0, 0, 'px_star').setScale(0).setBlendMode(Phaser.BlendModes.ADD));
    }
    this.heart = scene.add.image(0, 0, 'heart').setTint(0xff4f8a).setVisible(false);
    this.shieldImg = scene.add.image(0, -36, 'fx_shield').setScale(0.6).setVisible(false);
    this.root = scene.add
      .container(0, 0, [
        this.armBack.upper,
        this.armBack.lower,
        this.legBack,
        this.legFront,
        this.tails,
        this.torso,
        this.head,
        this.armFront.upper,
        this.armFront.lower,
        ...this.glints,
        this.heart,
        this.shieldImg,
      ])
      .setDepth(24);
    this.shadow = scene.add.image(0, 0, 'shadow').setScale(1.4 * INV).setDepth(9);
    this.marker = scene.add.image(0, 14, 'fx_drop').setScale(INV).setDepth(95).setVisible(false);
    this.release();
  }

  bind(e: Enemy): void {
    this.cur = { f: { x: 20, y: -72 }, b: { x: -20, y: -72 } };
    this.uid = e.uid;
    this.root.setVisible(true).setActive(true).setAlpha(1).setRotation(0);
    this.shadow.setVisible(true);
    this.flash = 0;
    this.pose = -1;
    this.poseBlend = 1;
    this.heartT = 1;
    this.heart.setVisible(false);
    this.clearFlash();
    this.root.setPosition(e.x, e.y + e.def.hh);
  }

  release(): void {
    this.uid = -1;
    this.root.setVisible(false).setActive(false);
    this.shadow.setVisible(false);
    this.marker.setVisible(false);
  }

  onHit(): void {
    this.flash = 0.07;
    this.torso.setTintFill(0xffffff);
    this.head.setTintFill(0xffffff);
    this.squash.kick(-1.5);
  }

  onTelegraph(): void {}

  onShot(): void {}

  onLanded(speed: number): void {
    // Pouso de bigorna: achata, a bandana chicoteia.
    this.squash.kick(-Math.min(9, 3 + speed / 150));
    this.tailSpring.kick(-8);
  }

  private clearFlash(): void {
    this.torso.clearTint();
    this.head.clearTint();
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

    const t = this.time;
    const rm = reducedMotion ? 0 : 1;
    const falling = e.state === 'descend';
    let target: Pose;
    let handF: Pt;
    let handB: Pt;
    let legRotB = 0;
    let legRotF = 0;

    if (falling) {
      // Caindo do céu: braços para cima esperneando, perninhas pedalando.
      target = POSES[0] as Pose;
      const w = Math.sin(t * 22) * rm;
      handF = { x: 20 + w * 4, y: -72 };
      handB = { x: -20 - w * 4, y: -72 };
      legRotB = 0.4 + w * 0.3;
      legRotF = -0.3 - w * 0.3;
      this.armFront.bend = 1;
      this.armBack.bend = -1;
    } else {
      const idx = ((e.attack % POSES.length) + POSES.length) % POSES.length;
      if (idx !== this.pose) {
        // Troca de pose: tranco de "pump" e brilho no óleo.
        if (this.pose >= 0) this.squash.kick(3.5);
        this.pose = idx;
        this.poseBlend = 0;
        this.from = { f: { ...this.cur.f }, b: { ...this.cur.b } };
        if (idx === 3) this.heartT = 0;
      }
      target = POSES[idx] as Pose;
      this.poseBlend = Math.min(1, this.poseBlend + dt * 7);
      const k = 1 - (1 - this.poseBlend) ** 3;
      // Tremedeira de quem está contraindo tudo.
      const shake = (target.face === 'maromba_head_grr' ? 0.6 : 0.25) * rm;
      const jx = Math.sin(t * 47) * shake;
      const jy = Math.cos(t * 41) * shake;
      handF = { x: lerp(this.from.f.x, target.handF.x, k) + jx, y: lerp(this.from.f.y, target.handF.y, k) + jy };
      handB = { x: lerp(this.from.b.x, target.handB.x, k) - jx, y: lerp(this.from.b.y, target.handB.y, k) + jy };
      this.armFront.bend = target.bendF;
      this.armBack.bend = target.bendB;
    }
    this.cur = { f: handF, b: handB };

    const d = this.squash.update(dt);
    const breathe = Math.sin(t * 2.4) * 0.02 * rm;
    this.root.setPosition(x, y).setScale(e.facing * (1 - d * 0.05), 1 + d * 0.05);
    this.root.rotation += ((falling ? Math.sin(t * 9) * 0.12 * rm : 0) - this.root.rotation) * Math.min(1, dt * 10);

    // Pernas finas (sem joelho: palitos firmes) e tronco.
    this.legBack.setPosition(-HIP_SPREAD, HIP_Y).setRotation(legRotB);
    this.legFront.setPosition(HIP_SPREAD, HIP_Y).setRotation(legRotF);
    const lean = falling ? 0 : target.lean;
    const cos = Math.cos(lean);
    const sin = Math.sin(lean);
    const rot = (p: Pt): Pt => ({ x: p.x * cos - p.y * sin, y: HIP_Y + p.x * sin + p.y * cos });
    const pump = falling ? 0 : target.pump * Math.min(1, this.poseBlend * 1.5);
    this.torso
      .setPosition(0, HIP_Y + 1)
      .setRotation(lean)
      .setScale(INV * (1 + pump + breathe), INV * (1 + breathe * 0.5));
    const sf = rot(SHOULDER_F);
    const sb = rot(SHOULDER_B);
    sf.x *= 1 + pump;
    sb.x *= 1 + pump;
    this.armFront.solve(sf.x, sf.y, handF.x, handF.y);
    this.armBack.solve(sb.x, sb.y, handB.x, handB.y);
    // Bíceps incha quando contrai.
    const flexScale = INV * (1 + pump * 1.4);
    this.armFront.upper.setScale(flexScale, INV);
    this.armBack.upper.setScale(flexScale, INV);

    // Cabeça minúscula e bandana com mola.
    const neck = rot(NECK);
    const headRot = (falling ? -0.2 : target.headRot) + lean * 0.5;
    this.head.setTexture(falling ? 'maromba_head_grr' : target.face).setPosition(neck.x, neck.y).setRotation(headRot);
    const T = VICE_TEX.marombaHead;
    const kx = T.kx - T.nx;
    const ky = T.ky - T.ny;
    const hc = Math.cos(headRot);
    const hs = Math.sin(headRot);
    const td = this.tailSpring.update(dt);
    this.tails
      .setPosition(neck.x + kx * hc - ky * hs, neck.y + kx * hs + ky * hc)
      .setRotation((falling ? 0.9 : -0.3) + headRot + td * 0.06 + Math.sin(t * 8) * 0.12 * rm)
      .setScale(-INV, INV); // espelhada: as pontas caem para trás da cabeça

    // Brilhos de óleo piscando no peito e nos bíceps.
    const spots: Pt[] = [
      { x: -7, y: -14 + HIP_Y },
      { x: 8, y: -16 + HIP_Y },
      this.armFront.joint,
      this.armBack.joint,
    ];
    for (let i = 0; i < this.glints.length; i++) {
      const g = this.glints[i] as Img;
      const ph = (t * 1.3 + i * 0.29) % 1;
      const boost = this.poseBlend < 1 ? 1.6 : 1;
      const s = reducedMotion ? 0 : Math.max(0, Math.sin(ph * Math.PI * 2)) ** 6 * 0.6 * boost;
      const p = spots[i] as Pt;
      g.setPosition(p.x, p.y - (i >= 2 ? 3 : 0)).setScale(s).setRotation(t * 3);
    }

    // Coraçãozinho subindo no beijo do bíceps.
    if (this.heartT < 1) {
      this.heartT = Math.min(1, this.heartT + dt * 0.8);
      const k = this.heartT;
      this.heart
        .setVisible(true)
        .setPosition(this.armFront.joint.x + 4 + Math.sin(k * 12) * 3 * rm, this.armFront.joint.y - 8 - k * 30)
        .setScale(0.8 + Math.sin(k * Math.PI) * 0.6)
        .setAlpha(1 - k * k);
    } else if (this.heart.visible) {
      this.heart.setVisible(false);
    }

    this.shieldImg.setVisible(e.shield > 0);
    if (e.shield > 0) this.shieldImg.setAlpha(0.55 + 0.3 * Math.sin(this.time * 6));

    const gy = this.groundAt(x);
    const height = Math.max(0, gy - y);
    const sh = Math.max(0.3, 1 - height / 400);
    this.shadow.setPosition(x, gy + 1).setScale(1.4 * sh * INV).setAlpha(0.4 + sh * 0.4);
  }
}
