import Phaser from 'phaser';
import type { GameEvent } from '@/core/run/events';
import type { EnemyKind } from '@/core/enemies/types';
import type { Settings, VfxQuality } from '@/shared/settings';
import { VIEW_MARGIN } from '../data/view';
import { CSS, NEON, PAL } from '../rendering/palette';
import type { AudioSystem, SfxId } from './AudioSystem';
import type { FloatingText } from './FloatingText';
import type { Particles, ParticleSpec } from './Particles';
import type { ScreenShake } from './ScreenShake';

const QUALITY_MULT: Record<VfxQuality, number> = { low: 0.35, medium: 0.7, high: 1 };

/** Pedaços que voam no abate (confete de figurino), por vilão. */
const FEATHER_TINT: Record<EnemyKind, number[]> = {
  pato_pistoleiro: [0x7fe0d4, 0xff7ab8, NEON.pink, NEON.cyan],
  galinha_rambo: [0x26222e, 0x8a8f9c, 0xff2d3d, 0xb8c0cc],
  vaca_loca: [NEON.pink, NEON.cyan, 0xffd166, 0x9b5cff],
  pombo_mafioso: [0x1c1a2a, NEON.pink, 0x39ff88],
  // Yuppie "morre" em papelada e dinheiro de mentirinha.
  porco_executivo: [0xffffff, 0x7bd389, PAL.gold, 0xffb3d1],
  don_pombone: [PAL.donCoat, 0xd8192e, PAL.gold, NEON.pink],
};

const KILL_SFX: Record<EnemyKind, SfxId> = {
  pato_pistoleiro: 'killPato',
  galinha_rambo: 'killGalinha',
  vaca_loca: 'killVaca',
  pombo_mafioso: 'killPombo',
  porco_executivo: 'killPorco',
  don_pombone: 'killBoss',
};
const KILL_PROP: Record<EnemyKind, string> = {
  pato_pistoleiro: 'pato_hat',
  galinha_rambo: 'galinha_glasses',
  vaca_loca: 'vaca_bell',
  pombo_mafioso: 'pombo_hat',
  porco_executivo: 'porco_case',
  don_pombone: 'pombone_hat',
};
/** Onomatopeias de gibi no abate, por vilão. */
const COMIC_WORDS: Record<EnemyKind, readonly string[]> = {
  pato_pistoleiro: ['POW!', 'BLAM!', 'CORTA!', 'PLOC!'],
  galinha_rambo: ['VOLTAREI!', 'KABUM!', 'CRÁS!', 'HASTA!'],
  vaca_loca: ['UFA!', 'PLOFT!', 'TÓIN!', 'SEM FÔLEGO!'],
  pombo_mafioso: ['HAI!', 'PUF!', 'ZÁS!', 'SUMIU!'],
  porco_executivo: ['KA-CHING!', 'FALIU!', 'DEMITIDO!', 'CRASH!'],
  don_pombone: ['CAPUT!'],
};
const COMIC_COLORS = [CSS.amber, CSS.coral, CSS.turquoise, CSS.violet];

const TELEGRAPH_SFX: Record<EnemyKind, SfxId> = {
  pato_pistoleiro: 'telegraphPato',
  galinha_rambo: 'telegraphGalinha',
  vaca_loca: 'stomp',
  pombo_mafioso: 'whistle',
  porco_executivo: 'telegraphPato',
  don_pombone: 'wingFlap',
};

export interface FeedbackHooks {
  hitstop(seconds: number): void;
  onPlayerShot(): void;
  onPlayerJump(): void;
  onPlayerLand(speed: number): void;
  onPlayerDied(): void;
  onEnemyHit(uid: number): void;
  onEnemyTelegraph(uid: number, duration: number): void;
  onEnemyShot(uid: number): void;
  onEnemyLanded(uid: number, speed: number): void;
  onEnemyKilled(uid: number): void;
  onCrosshairHit(crit: boolean): void;
  onCombo(multiplier: number): void;
}

/**
 * Traduz eventos da simulação em "game feel": partículas, som, shake,
 * números e hitstop. Só lê eventos — nunca altera o estado do jogo.
 */
export class Feedback {
  private mult = 1;
  private flashOn = true;
  private numbersOn = true;
  private readonly flashRect: Phaser.GameObjects.Rectangle;
  private flashAlpha = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly particles: Particles,
    private readonly texts: FloatingText,
    private readonly shake: ScreenShake,
    private readonly audio: AudioSystem,
    private readonly hooks: FeedbackHooks,
    private readonly width: number,
    height: number,
  ) {
    this.flashRect = scene.add
      .rectangle(width / 2, height / 2 + (VIEW_MARGIN.bottom - VIEW_MARGIN.top) / 2, width + VIEW_MARGIN.side * 2 + 80, height + VIEW_MARGIN.top + VIEW_MARGIN.bottom + 80, PAL.coral)
      .setAlpha(0)
      .setDepth(90)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  applySettings(s: Settings): void {
    this.mult = QUALITY_MULT[s.vfxQuality];
    this.flashOn = s.flashes;
    this.numbersOn = s.damageNumbers;
    this.shake.intensity = s.screenShake;
    this.audio.setVolume(s.sfxVolume, s.muted, s.musicVolume);
  }

  private count(n: number): number {
    const v = n * this.mult;
    const base = Math.floor(v);
    return base + (Math.random() < v - base ? 1 : 0);
  }

  private emit(p: ParticleSpec): void {
    this.particles.emit(p);
  }

  update(dt: number): void {
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 3);
      this.flashRect.setAlpha(this.flashAlpha);
    }
  }

  handle(ev: GameEvent): void {
    switch (ev.type) {
      case 'shot':
        return this.shot(ev.x, ev.y, ev.angle);
      case 'enemyHit':
        return this.enemyHit(ev);
      case 'enemyKilled':
        return this.enemyKilled(ev);
      case 'enemyTelegraph':
        this.hooks.onEnemyTelegraph(ev.uid, ev.duration);
        this.audio.play(ev.state === 'buff' ? 'phone' : TELEGRAPH_SFX[ev.kind], ev.duration);
        return;
      case 'enemyBuffed':
        this.audio.play('kaching');
        if (this.numbersOn) this.texts.spawn(ev.x, ev.y - 40, 'REUNIÃO URGENTE!', CSS.amber, 14, 1.1);
        for (let i = 0, n = this.count(14); i < n; i++) this.money(ev.x, ev.y);
        return;
      case 'shieldBroken':
        this.audio.play('shieldBreak');
        this.ring(ev.x, ev.y, PAL.gold);
        for (let i = 0, n = this.count(8); i < n; i++) this.spark(ev.x, ev.y, Math.random() * Math.PI * 2, 1, PAL.gold, 260);
        return;
      case 'bossEnraged':
        this.audio.play('bossRage');
        this.shake.add(0.6);
        if (this.flashOn) this.flashAlpha = 0.22;
        for (let i = 0, n = this.count(20); i < n; i++) this.feather(ev.x, ev.y, ev.kind, Math.random() * Math.PI * 2, 2);
        return;
      case 'enemyLanded': {
        this.hooks.onEnemyLanded(ev.uid, ev.speed);
        const k = Math.min(1, ev.speed / 800);
        this.audio.play('slam');
        this.shake.add(0.15 + k * 0.25);
        for (let i = 0, n = this.count(6 + k * 8); i < n; i++) {
          this.dust(ev.x + (i % 2 ? 1 : -1) * 18, ev.y, (i % 2 ? 1 : -1) * (80 + Math.random() * 160));
        }
        return;
      }
      case 'enemyCharge':
        this.audio.play('moo');
        this.shake.add(0.12);
        for (let i = 0, n = this.count(8); i < n; i++) this.dust(ev.x - ev.dir * 20, ev.y, -ev.dir * (80 + Math.random() * 200));
        return;
      case 'enemyStunned':
        this.audio.play('dizzy');
        this.shake.add(0.35);
        this.hooks.hitstop(0.05);
        for (let i = 0, n = this.count(8); i < n; i++) this.star(ev.x, ev.y - 10, i % 2 ? PAL.amber : PAL.warmWhite);
        this.ring(ev.x, ev.y, PAL.amber);
        return;
      case 'ricochet':
        this.audio.play('ricochet');
        for (let i = 0, n = this.count(4); i < n; i++) this.spark(ev.x, ev.y, ev.angle + (Math.random() - 0.5) * 0.8, 0.8, PAL.turquoise, 320);
        return;
      case 'enemyBled': {
        const tint = ev.golden ? PAL.amber : PAL.coral;
        for (let i = 0, n = this.count(3); i < n; i++) this.spark(ev.x, ev.y, -Math.PI / 2 + (Math.random() - 0.5) * 1.4, 0.8, tint, 160);
        if (this.numbersOn) this.texts.spawn(ev.x, ev.y - 6, `${ev.damage}`, ev.golden ? CSS.amber : CSS.coral, 13, 0.5);
        return;
      }
      case 'enemyExploded': {
        const tint = ev.golden ? PAL.amber : PAL.coral;
        this.audio.play('shieldBreak');
        this.shake.add(ev.golden ? 0.3 : 0.18);
        this.ring(ev.x, ev.y, tint);
        for (let i = 0, n = this.count(10); i < n; i++) this.spark(ev.x, ev.y, Math.random() * Math.PI * 2, 1.1, tint, 380);
        return;
      }
      case 'upgradeOffer':
        this.audio.play('cardOffer');
        return;
      case 'upgradePicked':
        this.audio.play('cardPick');
        for (let i = 0, n = this.count(24); i < n; i++) this.confetti();
        return;
      case 'enemyShot':
        this.hooks.onEnemyShot(ev.uid);
        this.audio.play(ev.kind === 'galinha_rambo' ? 'enemyShotGalinha' : 'enemyShotPato');
        this.emit({
          texture: 'fx_glow',
          x: ev.x,
          y: ev.y,
          vx: 0,
          vy: 0,
          life: 0.07,
          scaleFrom: 1.6,
          scaleTo: 0.6,
          additive: true,
        });
        for (let i = 0, n = this.count(3); i < n; i++) this.spark(ev.x, ev.y, ev.angle, 0.5, PAL.coral, 260);
        if (ev.kind === 'galinha_rambo') {
          this.shake.add(0.05);
          this.shell(ev.x - Math.cos(ev.angle) * 30, ev.y, Math.cos(ev.angle) >= 0 ? 1 : -1);
        }
        return;
      case 'projectileImpact': {
        const color = ev.team === 'player' ? PAL.amber : PAL.coral;
        for (let i = 0, n = this.count(4); i < n; i++) {
          this.spark(ev.x, ev.y - 1, -Math.PI / 2 + (Math.random() - 0.5) * 2.2, 1, color, 220);
        }
        this.puff(ev.x, ev.y - 3, 1, 0.5);
        return;
      }
      case 'playerJumped':
        this.hooks.onPlayerJump();
        this.audio.play('jump');
        for (let i = 0, n = this.count(4); i < n; i++) this.dust(ev.x, ev.y, (i % 2 ? 1 : -1) * (40 + Math.random() * 60));
        return;
      case 'playerLanded': {
        this.hooks.onPlayerLand(ev.speed);
        const k = Math.min(1, ev.speed / 900);
        this.audio.play('land', k);
        if (k > 0.35) this.shake.add(k * 0.18);
        for (let i = 0, n = this.count(3 + k * 6); i < n; i++) {
          this.dust(ev.x, ev.y, (i % 2 ? 1 : -1) * (60 + Math.random() * 120 * k));
        }
        return;
      }
      case 'playerHurt':
        this.audio.play('hurt');
        this.texts.comic(ev.x, ev.y - 34, Math.random() < 0.5 ? 'AI!' : 'UI!', CSS.coral, 22);
        this.shake.add(0.55);
        this.hooks.hitstop(0.08);
        if (this.flashOn) this.flashAlpha = 0.28;
        for (let i = 0, n = this.count(10); i < n; i++) {
          this.spark(ev.x, ev.y, Math.random() * Math.PI * 2, 1.2, PAL.coral, 320);
        }
        for (let i = 0, n = this.count(5); i < n; i++) this.star(ev.x, ev.y - 10, PAL.warmWhite);
        return;
      case 'playerDied':
        this.hooks.onPlayerDied();
        this.audio.play('gameOver');
        this.shake.add(0.9);
        for (let i = 0, n = this.count(18); i < n; i++) this.star(ev.x, ev.y, i % 2 ? PAL.amber : PAL.turquoise);
        this.ring(ev.x, ev.y, PAL.coral);
        return;
      case 'comboBroken':
        this.hooks.onCombo(1);
        return;
      case 'waveStarted':
        this.audio.play('waveStart');
        return;
      case 'waveCleared':
        this.audio.play('waveClear');
        for (let i = 0, n = this.count(40); i < n; i++) this.confetti();
        return;
      case 'enemyIncoming':
        this.audio.play('incoming', ev.warn);
        return;

    }
  }

  private shot(x: number, y: number, angle: number): void {
    this.hooks.onPlayerShot();
    this.audio.play('shot');
    this.shake.add(0.06);
    // Flash da boca: forma + luz, vida curtíssima.
    this.emit({
      texture: 'fx_muzzle',
      x: x + Math.cos(angle) * 6,
      y: y + Math.sin(angle) * 6,
      vx: 0,
      vy: 0,
      life: 0.05,
      rotation: angle,
      scaleFrom: 1.1 + Math.random() * 0.4,
      scaleTo: 0.5,
      additive: true,
      depth: 46,
    });
    this.emit({
      texture: 'px_soft',
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.06,
      tint: PAL.amber,
      scaleFrom: 2.2,
      scaleTo: 1,
      additive: true,
      alphaFrom: 0.8,
    });
    for (let i = 0, n = this.count(3); i < n; i++) this.spark(x, y, angle + (Math.random() - 0.5) * 0.7, 0.6, PAL.amber, 380);
    this.puff(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4, 1, 0.45);
  }

  private enemyHit(ev: Extract<GameEvent, { type: 'enemyHit' }>): void {
    this.hooks.onEnemyHit(ev.uid);
    this.hooks.onCrosshairHit(ev.crit);
    this.audio.play(ev.shielded ? 'shieldHit' : ev.crit ? 'crit' : 'hit');
    const back = Math.atan2(-ev.dirY, -ev.dirX);
    const fwd = Math.atan2(ev.dirY, ev.dirX);
    for (let i = 0, n = this.count(ev.crit ? 7 : 4); i < n; i++) {
      this.spark(ev.x, ev.y, back + (Math.random() - 0.5) * 1.6, 0.9, ev.crit ? PAL.amber : PAL.warmWhite, 300);
    }
    for (let i = 0, n = this.count(2); i < n; i++) this.feather(ev.x, ev.y, ev.kind, fwd);
    if (ev.crit) {
      this.shake.add(0.12);
      this.emit({ texture: 'px_star', x: ev.x, y: ev.y, vx: 0, vy: 0, life: 0.14, tint: PAL.amber, scaleFrom: 2.4, scaleTo: 0.6, additive: true, spin: 8 });
    }
    if (this.numbersOn) {
      this.texts.spawn(ev.x, ev.y - 14, ev.crit ? `${ev.damage}!` : `${ev.damage}`, ev.crit ? CSS.amber : CSS.warmWhite, ev.crit ? 22 : 15);
    }
  }

  private enemyKilled(ev: Extract<GameEvent, { type: 'enemyKilled' }>): void {
    this.hooks.onEnemyKilled(ev.uid);
    this.hooks.onCombo(ev.multiplier);
    const boss = ev.kind === 'don_pombone';
    if (boss) return this.bossKilled(ev);
    const heavy = ev.kind !== 'pato_pistoleiro' && ev.kind !== 'pombo_mafioso';
    this.audio.play(KILL_SFX[ev.kind]);
    this.hooks.hitstop(heavy ? 0.07 : 0.045);
    this.shake.add(heavy ? 0.4 : 0.25);
    const n = this.count(heavy ? 22 : 16);
    for (let i = 0; i < n; i++) this.feather(ev.x, ev.y, ev.kind, Math.random() * Math.PI * 2, 1.6);
    for (let i = 0, m = this.count(6); i < m; i++) this.star(ev.x, ev.y, i % 2 ? PAL.amber : PAL.warmWhite);
    for (let i = 0, m = this.count(4); i < m; i++) this.puff(ev.x + (Math.random() - 0.5) * 20, ev.y, 1.4, 0.6);
    this.ring(ev.x, ev.y, PAL.warmWhite);
    if (ev.kind === 'porco_executivo') {
      for (let i = 0, m = this.count(16); i < m; i++) this.money(ev.x, ev.y);
    }
    if (ev.kind === 'pato_pistoleiro') {
      // Os balões se soltam e sobem: piada visual.
      this.emit({ texture: 'pato_balloons', x: ev.x, y: ev.y - 40, vx: (Math.random() - 0.5) * 40, vy: -90, life: 1.6, gravity: -60, spin: (Math.random() - 0.5) * 1.5, depth: 24 });
    } else if (heavy) {
      this.audio.play('slam');
    }
    // O acessório voa longe: piada visual.
    this.emit({
      texture: KILL_PROP[ev.kind],
      x: ev.x,
      y: ev.y - 20,
      vx: (Math.random() - 0.5) * 200,
      vy: -380 - Math.random() * 120,
      life: 1.4,
      gravity: 1300,
      spin: (Math.random() - 0.5) * 16,
      bounceY: 0.35,
      depth: 26,
    });
    const words = COMIC_WORDS[ev.kind];
    this.texts.comic(
      ev.x + (Math.random() - 0.5) * 20,
      ev.y - 10,
      words[Math.floor(Math.random() * words.length)] as string,
      COMIC_COLORS[Math.floor(Math.random() * COMIC_COLORS.length)] as string,
      heavy ? 30 : 24,
    );
    if (Math.random() < 0.35) this.audio.play('boing');
    if (this.numbersOn) {
      const label = ev.multiplier > 1 ? `+${ev.score} ×${ev.multiplier}` : `+${ev.score}`;
      this.texts.spawn(ev.x, ev.y - 34, label, CSS.turquoise, 18, 0.9);
    }
  }

  /** Chefe derrotado: chuva de penas, confete, flash e câmera tremendo. */
  private bossKilled(ev: Extract<GameEvent, { type: 'enemyKilled' }>): void {
    this.hooks.onEnemyKilled(ev.uid);
    this.hooks.onCombo(ev.multiplier);
    this.audio.play('killBoss');
    this.hooks.hitstop(0.25);
    this.shake.add(1);
    if (this.flashOn) this.flashAlpha = 0.4;
    for (let i = 0, n = this.count(60); i < n; i++) this.feather(ev.x, ev.y, ev.kind, Math.random() * Math.PI * 2, 2.4);
    for (let i = 0, n = this.count(20); i < n; i++) this.star(ev.x, ev.y, i % 2 ? PAL.gold : PAL.warmWhite);
    for (let i = 0, n = this.count(90); i < n; i++) this.confetti();
    this.ring(ev.x, ev.y, PAL.gold);
    this.ring(ev.x, ev.y - 20, PAL.warmWhite);
    this.emit({ texture: 'pombone_hat', x: ev.x, y: ev.y - 60, vx: 120, vy: -520, life: 2.4, gravity: 900, spin: 6, bounceY: 0.4, depth: 26 });
    this.emit({ texture: 'pombone_gun', x: ev.x, y: ev.y, vx: -160, vy: -380, life: 2.4, gravity: 1100, spin: -8, bounceY: 0.3, depth: 26 });
    this.texts.comic(ev.x, ev.y - 20, 'CAPUT!', CSS.amber, 44);
    if (this.numbersOn) this.texts.spawn(ev.x, ev.y - 70, `+${ev.score}`, CSS.amber, 30, 1.6);
  }

  /** Notas e moedas de mentirinha voando (Porco Executivo). */
  private money(x: number, y: number): void {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
    const v = 120 + Math.random() * 200;
    const coin = Math.random() < 0.4;
    this.emit({
      texture: coin ? 'b_coin' : 'px_feather',
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 1.2 + Math.random() * 0.6,
      tint: coin ? undefined : 0x7bd389,
      gravity: coin ? 900 : 200,
      drag: coin ? 0.5 : 2.5,
      spin: (Math.random() - 0.5) * 12,
      sway: coin ? 0 : 50,
      bounceY: coin ? 0.4 : undefined,
      scaleFrom: coin ? 0.5 : 1.3,
      depth: 27,
    });
  }

  /** Poeira levantada por quem corre no chão (chamado pela cena durante a investida). */
  trail(x: number, y: number, dir: number): void {
    this.dust(x, y, -dir * (40 + Math.random() * 80));
  }

  // ── Primitivas de efeito ───────────────────────────────────────────

  private spark(x: number, y: number, angle: number, size: number, tint: number, speed: number): void {
    const v = speed * (0.5 + Math.random() * 0.8);
    this.emit({
      texture: 'px_dot',
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: 0.12 + Math.random() * 0.12,
      tint,
      gravity: 500,
      drag: 4,
      scaleFrom: size * 1.4,
      scaleTo: 0.2,
      alignToVelocity: true,
      additive: true,
      depth: 47,
    });
  }

  private shell(x: number, y: number, facing: number): void {
    this.emit({
      texture: 'px_shell',
      x,
      y,
      vx: -facing * (60 + Math.random() * 90),
      vy: -200 - Math.random() * 90,
      life: 1.3,
      gravity: 1500,
      spin: (Math.random() - 0.5) * 40,
      bounceY: 0.4,
      depth: 31,
    });
  }

  private puff(x: number, y: number, size: number, life: number): void {
    this.emit({
      texture: 'px_soft',
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: -20 - Math.random() * 30,
      life: life * (0.7 + Math.random() * 0.5),
      tint: 0xcfc6d8,
      drag: 2,
      scaleFrom: 0.5 * size,
      scaleTo: 1.4 * size,
      alphaFrom: 0.35,
      depth: 21,
    });
  }

  private dust(x: number, y: number, vx: number): void {
    this.emit({
      texture: 'px_soft',
      x,
      y: y - 2,
      vx,
      vy: -15 - Math.random() * 35,
      life: 0.35 + Math.random() * 0.2,
      tint: 0xb8a9c9,
      drag: 5,
      scaleFrom: 0.35,
      scaleTo: 0.9,
      alphaFrom: 0.5,
      depth: 21,
    });
  }

  private feather(x: number, y: number, kind: EnemyKind, angle: number, speedMult = 1): void {
    const tints = FEATHER_TINT[kind];
    const v = (80 + Math.random() * 170) * speedMult;
    this.emit({
      texture: 'px_feather',
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 80,
      life: 0.9 + Math.random() * 0.8,
      tint: tints[Math.floor(Math.random() * tints.length)] as number,
      gravity: 220,
      drag: 3.2,
      spin: (Math.random() - 0.5) * 9,
      rotation: Math.random() * Math.PI,
      sway: 60,
      scaleFrom: 0.9 + Math.random() * 0.5,
      depth: 27,
    });
  }

  private star(x: number, y: number, tint: number): void {
    const a = Math.random() * Math.PI * 2;
    const v = 120 + Math.random() * 200;
    this.emit({
      texture: 'px_star',
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 60,
      life: 0.45 + Math.random() * 0.25,
      tint,
      gravity: 400,
      drag: 2.5,
      spin: (Math.random() - 0.5) * 14,
      scaleFrom: 1.3,
      scaleTo: 0.4,
      depth: 48,
    });
  }

  private ring(x: number, y: number, tint: number): void {
    this.emit({ texture: 'fx_ring', x, y, vx: 0, vy: 0, life: 0.22, tint, scaleFrom: 0.3, scaleTo: 2.2, additive: true, alphaFrom: 0.9, depth: 49 });
  }

  private confetti(): void {
    const colors = [PAL.amber, PAL.turquoise, PAL.coral, PAL.violet, PAL.warmWhite];
    this.emit({
      texture: 'px_feather',
      x: 60 + Math.random() * (this.width - 120),
      y: -10,
      vx: (Math.random() - 0.5) * 80,
      vy: 80 + Math.random() * 120,
      life: 2 + Math.random(),
      tint: colors[Math.floor(Math.random() * colors.length)] as number,
      gravity: 60,
      drag: 0.6,
      spin: (Math.random() - 0.5) * 10,
      sway: 90,
      scaleFrom: 0.8,
      depth: 15,
    });
  }
}
