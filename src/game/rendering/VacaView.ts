import Phaser from 'phaser';
import type { Enemy } from '@/core/enemies/types';
import { lerp } from '@/core/math/scalar';
import { Limb } from './limb';
import { PAL } from './palette';
import type { EnemyVisual } from './EnemyView';
import { TEX, TEX_SCALE } from './textures';
import { Spring } from './spring';

const INV = 1 / TEX_SCALE;
/** Origem do container = pés. Medidas em px acima do chão, olhando para a direita. */
const HIP = { x: 0, y: -15 };
const HIP_SPREAD = 2.5;
const LEG_A = 7;
const LEG_B = 7;
const ANKLE_H = 3;
/** Do quadril até o pescoço e até cada ombro, no espaço do tronco. */
const NECK = { x: 1.5, y: -26 };
const SHOULDER_F = { x: 5.5, y: -21 };
const SHOULDER_B = { x: -4, y: -21 };
const ARM_A = 6.5;
const ARM_B = 7;
/** Topete assenta na testa, relativo ao pescoço. */
const POMP_OFF = { x: -1, y: -17 };
/** Velocidade a partir da qual a investida vira deslize de joelhos. */
const SLIDE_SPEED = 230;
const SPARKS = 10;
const SPARK_LIFE = 0.35;
const GLINTS = 3;

type Img = Phaser.GameObjects.Image;

interface Spark {
  img: Img;
  life: number;
  vx: number;
  vy: number;
}

/**
 * Rei do Topete (id estável `vaca_loca`): imitador do rei do rock que atropela.
 * Esqueleto com joelhos e cotovelos (IK). Arma a investida com a dancinha do
 * rei (joelho tremendo, quadril rebolando, "uh-huh!" no microfone), atravessa
 * a arena num deslize de joelhos soltando faísca e, tonto, fica com o topete
 * desabado na cara.
 */
export class VacaView implements EnemyVisual {
  readonly kind = 'vaca_loca' as const;
  readonly root: Phaser.GameObjects.Container;
  private readonly cape: Img;
  private readonly torso: Img;
  private readonly head: Img;
  private readonly pomp: Img;
  private readonly bell: Img;
  private readonly mic: Img;
  private readonly bootBack: Img;
  private readonly bootFront: Img;
  private readonly legBack: Limb;
  private readonly legFront: Limb;
  private readonly armBack: Limb;
  private readonly armFront: Limb;
  private readonly glints: Img[] = [];
  private readonly sparks: Spark[] = [];
  private readonly stars: Img[];
  private readonly excl: Img;
  private readonly shadow: Img;
  private readonly marker: Img;
  private readonly shieldImg: Img;
  private readonly squash = new Spring(320, 11);
  /** Topete e capa atrasam em relação ao corpo. */
  private readonly pompSpring = new Spring(220, 7);
  private readonly capeSpring = new Spring(140, 6);
  private capeAngle = 0;
  private flash = 0;
  private time = Math.random() * 10;
  private cycle = 0;
  private telegraphT = 0;
  private telegraphDur = 0;
  private sparkTimer = 0;
  private slide = 0;
  private prevY = 0;
  uid = -1;

  constructor(
    scene: Phaser.Scene,
    private readonly groundAt: (x: number) => number,
  ) {
    const shade = 0xc9b8d6;
    const img = (key: string, ox: number, oy: number) => scene.add.image(0, 0, key).setOrigin(ox, oy).setScale(INV);
    const limbImg = (key: string, t: { w: number; h: number; py: number }) => img(key, 0.5, t.py / t.h);
    const leg = () => new Limb(limbImg('vaca_thigh', TEX.vacaThigh), limbImg('vaca_shin', TEX.vacaShin), LEG_A, LEG_B, -1);
    const arm = () => new Limb(limbImg('vaca_uparm', TEX.vacaUpArm), limbImg('vaca_forearm', TEX.vacaForearm), ARM_A, ARM_B, 1);
    const boot = () => img('vaca_boot', TEX.vacaBoot.ax / TEX.vacaBoot.w, TEX.vacaBoot.ay / TEX.vacaBoot.h);

    this.cape = img('vaca_cape', 0.5, 0.02);
    this.armBack = arm();
    this.armBack.setTint(shade);
    this.legBack = leg();
    this.legBack.setTint(shade);
    this.bootBack = boot().setTint(shade);
    this.torso = img('vaca_torso', TEX.vacaTorso.hx / TEX.vacaTorso.w, TEX.vacaTorso.hy / TEX.vacaTorso.h);
    this.legFront = leg();
    this.bootFront = boot();
    this.bell = img('vaca_bell', 0.5, 0);
    this.head = img('vaca_head', TEX.vacaHead.nx / TEX.vacaHead.w, TEX.vacaHead.ny / TEX.vacaHead.h);
    this.pomp = img('vaca_pomp', TEX.vacaPomp.bx / TEX.vacaPomp.w, TEX.vacaPomp.by / TEX.vacaPomp.h);
    this.armFront = arm();
    this.mic = img('vaca_mic', TEX.vacaMic.gx / TEX.vacaMic.w, TEX.vacaMic.gy / TEX.vacaMic.h);
    for (let i = 0; i < GLINTS; i++) {
      this.glints.push(scene.add.image(0, 0, 'px_star').setScale(0).setBlendMode(Phaser.BlendModes.ADD));
    }
    for (let i = 0; i < SPARKS; i++) {
      const s = scene.add.image(0, 0, 'px_star').setVisible(false).setDepth(25).setBlendMode(Phaser.BlendModes.ADD);
      this.sparks.push({ img: s, life: 0, vx: 0, vy: 0 });
    }
    this.excl = scene.add.image(6, -80, 'fx_excl').setScale(INV).setVisible(false);
    this.shieldImg = scene.add.image(0, -29, 'fx_shield').setScale(0.5).setVisible(false);
    this.stars = [0, 1, 2].map(() => scene.add.image(0, 0, 'px_star').setTint(PAL.amber).setScale(1.1).setVisible(false));
    this.root = scene.add
      .container(0, 0, [
        this.cape,
        this.armBack.upper,
        this.armBack.lower,
        this.legBack.upper,
        this.legBack.lower,
        this.bootBack,
        this.torso,
        this.legFront.upper,
        this.legFront.lower,
        this.bootFront,
        this.bell,
        this.head,
        this.pomp,
        ...this.glints,
        this.mic,
        this.armFront.upper,
        this.armFront.lower,
        this.excl,
        this.shieldImg,
        ...this.stars,
      ])
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
    this.slide = 0;
    this.capeAngle = 0;
    this.prevY = e.y;
    this.excl.setVisible(false);
    this.clearFlash();
  }

  release(): void {
    this.uid = -1;
    this.root.setVisible(false).setActive(false);
    this.shadow.setVisible(false);
    this.marker.setVisible(false);
    for (const s of this.stars) s.setVisible(false);
    for (const s of this.sparks) {
      s.life = 0;
      s.img.setVisible(false);
    }
  }

  onHit(): void {
    this.flash = 0.07;
    this.torso.setTintFill(0xffffff);
    this.head.setTintFill(0xffffff);
    this.squash.kick(-2.5);
    this.pompSpring.kick(6);
  }

  onTelegraph(duration: number): void {
    this.telegraphT = 0;
    this.telegraphDur = duration;
    this.excl.setVisible(true).setScale(0);
  }

  onShot(): void {}

  onLanded(speed: number): void {
    this.squash.kick(-Math.min(6, 2 + speed / 200));
    this.pompSpring.kick(-Math.min(10, 3 + speed / 120));
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

    const d = this.squash.update(dt);
    this.root.setPosition(x, y).setScale(e.facing * (1 - d * 0.05), 1 + d * 0.06);

    const speed = Math.abs(e.vx);
    const t = this.time;
    const rm = reducedMotion ? 0 : 1;
    // Pose padrão: em pé, gingando, microfone na mão da frente.
    let hipX = HIP.x;
    let hipY = HIP.y;
    let lean = 0; // rotação do tronco em torno do quadril (+ = pra frente)
    let headRot = 0;
    let tilt = 0; // inclinação do container inteiro
    let footB = { x: -HIP_SPREAD - 1, y: -ANKLE_H, rot: 0 };
    let footF = { x: HIP_SPREAD + 1, y: -ANKLE_H, rot: 0 };
    let handB = { x: -5, y: -20 };
    let handF = { x: 9, y: -27 };
    let micUp = false;
    let uh = false;
    let pompDroop = 0;
    let capeTarget = 0.12; // + = capa vai pra trás
    let slideTarget = 0;

    switch (e.state) {
      case 'charge': {
        if (speed > SLIDE_SPEED) {
          // Deslize de joelhos de solo de guitarra: corpo pra trás, microfone pro alto.
          slideTarget = 1;
          hipY = -9;
          hipX = -1;
          lean = -0.32;
          headRot = -0.35;
          footB = { x: -12, y: -2, rot: 1.25 };
          footF = { x: -8, y: -2.4, rot: 1.25 };
          handF = { x: 6, y: -47 };
          handB = { x: -16, y: -34 };
          micUp = true;
          uh = true;
          capeTarget = 1.25 + Math.sin(t * 30) * 0.08 * rm;
        } else {
          // Arrancada: pernas girando, braço de trás bombeando.
          this.cycle += dt * (9 + speed * 0.045);
          const s = Math.sin(this.cycle);
          const c = Math.cos(this.cycle);
          hipY = HIP.y + Math.abs(c) * -1.6 * rm;
          lean = 0.28;
          footB = { x: -s * 7, y: -ANKLE_H - Math.max(0, c) * 5, rot: 0 };
          footF = { x: s * 7, y: -ANKLE_H - Math.max(0, -c) * 5, rot: 0 };
          handB = { x: -6 - s * 5, y: -20 };
          handF = { x: 16, y: -33 }; // apontando "lá vou eu"
          capeTarget = 0.6 + speed / 400;
        }
        tilt = 0.08;
        break;
      }
      case 'stomp': {
        // A dancinha do rei: pernas abertas, joelho da frente tremendo na ponta
        // do pé, quadril rebolando e "uh-huh!" alternando microfone e dedo pro alto.
        this.telegraphT += dt;
        const tt = this.telegraphT;
        const wobble = Math.sin(tt * 34) * rm;
        const swivel = Math.sin(tt * 15) * rm;
        hipX = swivel * 1.6;
        hipY = HIP.y - 0.6 + Math.abs(swivel) * 1.2;
        footB = { x: -7, y: -ANKLE_H, rot: 0 };
        footF = { x: 6 + wobble * 1.6, y: -ANKLE_H - 1.2, rot: 0.75 };
        lean = -0.05 + swivel * 0.1;
        const up = Math.floor(tt * 3.2) % 2 === 0;
        uh = !up;
        if (up) {
          handF = { x: 11, y: -51 }; // dedo (e microfone) pro céu
          micUp = true;
        } else {
          handF = { x: 10, y: -33 }; // microfone na boca
        }
        handB = { x: -3, y: -19 }; // mão na cintura
        headRot = up ? -0.2 : 0.08;
        capeTarget = 0.2 + swivel * 0.25;
        break;
      }
      case 'dizzy': {
        const w = Math.sin(t * 5) * rm;
        tilt = w * 0.16;
        hipX = w * 1.5;
        footB = { x: -4 + Math.sin(t * 4) * 2 * rm, y: -ANKLE_H, rot: 0 };
        footF = { x: 4 - Math.sin(t * 4) * 2 * rm, y: -ANKLE_H, rot: 0 };
        handB = { x: -6 + Math.sin(t * 6) * 3 * rm, y: -15 };
        handF = { x: 7 - Math.sin(t * 6) * 3 * rm, y: -14 };
        lean = 0.12;
        headRot = 0.3 + w * 0.2;
        pompDroop = 1.5; // topete desabou na cara
        capeTarget = 0.05;
        break;
      }
      case 'descend': {
        // Caindo do céu de braços abertos, capa esvoaçando pra cima.
        footB = { x: -7, y: -1, rot: 0.5 };
        footF = { x: 6, y: -5, rot: 0.3 };
        handB = { x: -14, y: -46 };
        handF = { x: 14, y: -48 };
        micUp = true;
        uh = true;
        headRot = -0.15;
        capeTarget = 2.6 + Math.sin(t * 20) * 0.15 * rm;
        pompDroop = -0.4;
        break;
      }
      default: {
        // Ginga parada: pezinho batendo, joelho mexendo.
        const beat = Math.sin(t * 6.5) * rm;
        hipY = HIP.y + Math.abs(beat) * 0.8;
        hipX = beat * 0.6;
        handF = { x: 9, y: -28 + Math.abs(beat) * 1.5 };
        footF = { x: HIP_SPREAD + 2, y: -ANKLE_H - Math.max(0, beat) * 1.4, rot: Math.max(0, beat) * 0.5 };
        if (speed > 20) {
          this.cycle += dt * speed * 0.06;
          const s = Math.sin(this.cycle);
          const c = Math.cos(this.cycle);
          footB = { x: -s * 5, y: -ANKLE_H - Math.max(0, c) * 3, rot: 0 };
          footF = { x: s * 5, y: -ANKLE_H - Math.max(0, -c) * 3, rot: 0 };
          lean = 0.1;
        }
      }
    }

    // Deslize suaviza a entrada/saída da pose de joelhos.
    this.slide += (slideTarget - this.slide) * Math.min(1, dt * 14);

    // Tronco gira em torno do quadril; ombros e pescoço seguem.
    const cos = Math.cos(lean);
    const sin = Math.sin(lean);
    const rot = (p: { x: number; y: number }) => ({ x: hipX + p.x * cos - p.y * sin, y: hipY + p.x * sin + p.y * cos });
    const neck = rot(NECK);
    const shF = rot(SHOULDER_F);
    const shB = rot(SHOULDER_B);
    this.torso.setPosition(hipX, hipY + 1).setRotation(lean);

    // Pernas e botas.
    this.legBack.solve(hipX - HIP_SPREAD * 0.5, hipY, footB.x, footB.y - Math.sin(footB.rot) * 3);
    this.legFront.solve(hipX + HIP_SPREAD * 0.5, hipY, footF.x, footF.y - Math.sin(footF.rot) * 3);
    this.bootBack.setPosition(this.legBack.end.x, this.legBack.end.y).setRotation(footB.rot);
    this.bootFront.setPosition(this.legFront.end.x, this.legFront.end.y).setRotation(footF.rot);

    // Braços.
    this.armBack.solve(shB.x, shB.y, handB.x, handB.y);
    this.armFront.solve(shF.x, shF.y, handF.x, handF.y);
    const wristA = Math.atan2(this.armFront.end.y - this.armFront.joint.y, this.armFront.end.x - this.armFront.joint.x);
    // Microfone na mão: cabeça pra cima, levemente inclinado pro rosto.
    this.mic
      .setPosition(this.armFront.end.x + Math.cos(wristA) * 1.5, this.armFront.end.y + Math.sin(wristA) * 1.5)
      .setRotation(micUp ? 0.25 : -0.5);

    // Cabeça, lenço e topete com mola.
    const headA = lean * 0.6 + headRot;
    this.head.setTexture(uh ? 'vaca_head_uh' : 'vaca_head').setPosition(neck.x, neck.y).setRotation(headA);
    this.bell.setPosition(neck.x + 4, neck.y - 1).setRotation(
      reducedMotion ? 0 : Math.sin(t * (e.state === 'charge' ? 18 : 4)) * (e.state === 'charge' ? 0.6 : 0.15),
    );
    const vy = (y - this.prevY) / Math.max(dt, 1e-4);
    this.prevY = y;
    if (!reducedMotion && Math.abs(vy) > 5) this.pompSpring.kick(Math.max(-3, Math.min(3, vy * 0.0015)));
    const pd = this.pompSpring.update(dt);
    const ha = Math.cos(headA);
    const hb = Math.sin(headA);
    this.pomp
      .setPosition(neck.x + POMP_OFF.x * ha - POMP_OFF.y * hb, neck.y + POMP_OFF.x * hb + POMP_OFF.y * ha)
      .setRotation(headA + pd * 0.08 + pompDroop);

    // Capa: mola atrás do alvo, presa entre os ombros.
    const cd = this.capeSpring.update(dt);
    this.capeAngle += (capeTarget - this.capeAngle) * Math.min(1, dt * 8);
    const capeRot = this.capeAngle + cd * 0.05 + (reducedMotion ? 0 : Math.sin(t * 7) * 0.03);
    this.cape
      .setPosition((shB.x + neck.x) * 0.5 - 1, (shB.y + neck.y) * 0.5 + 1)
      .setRotation(capeRot + lean)
      .setScale(INV * (1 - Math.min(0.25, Math.abs(capeRot) * 0.08)), INV);

    // Brilhinhos de strass que piscam no macacão.
    for (let i = 0; i < this.glints.length; i++) {
      const g = this.glints[i] as Img;
      const ph = (t * 1.7 + i * 0.37) % 1;
      const s = reducedMotion ? 0 : Math.max(0, Math.sin(ph * Math.PI * 2)) ** 6;
      const local = [
        { x: -5, y: -13 },
        { x: 6, y: -6 },
        { x: 1, y: -18 },
      ][i] as { x: number; y: number };
      const p = rot(local);
      g.setPosition(p.x, p.y).setScale(s * 0.55).setRotation(t * 3);
    }

    this.root.rotation += (tilt * e.facing - this.root.rotation) * Math.min(1, dt * 12);
    this.updateSparks(e, x, y, dt, reducedMotion);

    if (e.state === 'stomp' && this.telegraphDur > 0) {
      const tt = Math.min(1, this.telegraphT / this.telegraphDur);
      const pop = tt < 0.15 ? (tt / 0.15) * 1.3 : 1.3 - Math.min(0.3, (tt - 0.15) * 2);
      this.excl.setVisible(true).setScale(pop * INV);
      this.excl.y = -80 - Math.sin(this.time * 20) * 1.5;
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
      s.setPosition(4 + Math.cos(a) * 13, -64 + Math.sin(a) * 4).setRotation(this.time * 5);
    }

    this.shieldImg.setVisible(e.shield > 0);
    if (e.shield > 0) this.shieldImg.setAlpha(0.55 + 0.3 * Math.sin(this.time * 6));

    const gy = this.groundAt(x);
    const height = Math.max(0, gy - y);
    const sh = Math.max(0.3, 1 - height / 400);
    this.shadow.setPosition(x, gy + 1).setScale(1.1 * sh * INV).setAlpha(0.4 + sh * 0.4);
  }

  /** Faíscas saindo dos joelhos no deslize (fora do container, ficam pra trás). */
  private updateSparks(e: Enemy, x: number, y: number, dt: number, reducedMotion: boolean): void {
    if (this.slide > 0.6 && !reducedMotion) {
      this.sparkTimer -= dt;
      if (this.sparkTimer <= 0) {
        this.sparkTimer = 0.025;
        const s = this.sparks.find((p) => p.life <= 0);
        if (s) {
          s.life = SPARK_LIFE;
          s.vx = -e.facing * (60 + Math.random() * 120);
          s.vy = -(60 + Math.random() * 110);
          s.img
            .setVisible(true)
            .setPosition(x - e.facing * 3, y - 2)
            .setTint(Math.random() < 0.5 ? 0xffe14d : 0xff8a3d);
        }
      }
    }
    for (const s of this.sparks) {
      if (s.life <= 0) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.img.setVisible(false);
        continue;
      }
      s.vy += 600 * dt;
      s.img.x += s.vx * dt;
      s.img.y += s.vy * dt;
      const k = s.life / SPARK_LIFE;
      s.img.setScale(0.35 + k * 0.4).setAlpha(k).setRotation(s.img.rotation + dt * 12);
    }
  }
}
