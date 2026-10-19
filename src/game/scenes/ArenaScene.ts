import Phaser from 'phaser';
import type { GameEvent } from '@/core/run/events';
import { FixedStepper } from '@/core/run/fixedStep';
import { RunPhaseMachine } from '@/core/run/runPhase';
import type { RunPhase } from '@/core/run/runPhase';
import { EMPTY_INPUT, World } from '@/core/run/world';
import type { SimInput } from '@/core/run/world';
import { bus } from '@/shared/bus';
import { FrameStats } from '@/shared/frameStats';
import { loadSettings, prefersReducedMotion } from '@/shared/settings';
import type { Settings } from '@/shared/settings';
import type { CardInfo, HudSnapshot } from '@/shared/types';
import { ARENA, RENDER_ZOOM, SIM_STEP, TERRAIN, VIEW_HEIGHT, VIEW_WIDTH } from '../data/arena';
import { Terrain } from '@/core/physics/terrain';
import { isGolden } from '@/core/upgrades/upgrades';
import { WORLD_CONFIG } from '../data/world';
import { EnemyView } from '../rendering/EnemyView';
import type { EnemyVisual } from '../rendering/EnemyView';
import { VacaView } from '../rendering/VacaView';
import { PlayerView } from '../rendering/PlayerView';
import { ProjectileRenderer } from '../rendering/ProjectileRenderer';
import { Stage } from '../rendering/stage';
import { TEX_SCALE } from '../rendering/textures';
import { AudioSystem } from '../systems/AudioSystem';
import { musicModeFor } from '../data/music';
import { Feedback } from '../systems/Feedback';
import { FloatingText } from '../systems/FloatingText';
import { InputSystem } from '../systems/InputSystem';
import { Particles } from '../systems/Particles';
import { ScreenShake } from '../systems/ScreenShake';
import type { EnemyKind } from '@/core/enemies/types';

/** Um campo de texto da UI (ex.: nome no placar) está com o foco. */
function typingInUi(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

/** Marcos de combo que o narrador anuncia. */
const COMBO_MILESTONES: ReadonlyArray<[number, string]> = [
  [5, 'A PLATEIA ACORDOU!'],
  [10, 'ISSO É AUDIÊNCIA!'],
  [15, 'O DIRETOR CHOROU!'],
  [25, 'RECORDE DE IBOPE!'],
  [40, 'TÁ PEGANDO FOGO, BICHO!'],
];
const HEARTBEAT_EVERY = 0.85;

const PARTICLE_CAPACITY = { low: 160, medium: 360, high: 700 } as const;
const DEATH_SEQUENCE = 1.3;

/**
 * Orquestra a arena: amostra input, roda a simulação em passo fixo,
 * desenha com interpolação e repassa eventos para feedback e HUD.
 */
export class ArenaScene extends Phaser.Scene {
  private world!: World;
  private readonly phase = new RunPhaseMachine('MENU');
  private readonly stepper = new FixedStepper(SIM_STEP);
  private readonly frameStats = new FrameStats();
  private input2!: InputSystem;
  private stage!: Stage;
  private playerView!: PlayerView;
  private projectileRenderer!: ProjectileRenderer;
  private particles!: Particles;
  private texts!: FloatingText;
  private readonly shake = new ScreenShake();
  private readonly audio = new AudioSystem();
  private feedback!: Feedback;
  private crosshair!: Phaser.GameObjects.Image;
  private hitmarker!: Phaser.GameObjects.Image;
  private crossKick = 0;
  private hitmarkerT = 0;
  private readonly viewPool: Record<EnemyKind, EnemyVisual[]> = {
    pato_pistoleiro: [],
    galinha_rambo: [],
    vaca_loca: [],
    pombo_mafioso: [],
    porco_executivo: [],
    don_pombone: [],
  };
  private readonly liveViews = new Map<number, EnemyVisual>();
  private trailTimer = 0;
  private heartbeatTimer = 0;
  private musicMuffled = false;
  private lastMilestone = 0;
  private offerId = 0;
  private readonly simInput: SimInput = { ...EMPTY_INPUT };
  /** Relevo para a renderização (sombras, partículas); o World tem o seu, igual. */
  private readonly terrain = new Terrain(TERRAIN);
  private readonly groundAt = (x: number): number => this.terrain.groundAt(x);
  private readonly eventScratch: GameEvent[] = [];
  private settings: Settings = loadSettings();
  private hitstop = 0;
  private deathTimer = -1;
  private lastHud = '';
  private showPerf = false;
  private perfTimer = 0;
  private readonly debugEnabled = import.meta.env.DEV || new URLSearchParams(location.search).has('debug');
  private readonly unsubs: Array<() => void> = [];

  constructor() {
    super('Arena');
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setZoom(RENDER_ZOOM);
    cam.centerOn(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
    cam.setBackgroundColor('#151922');

    this.stage = new Stage(this, this.terrain);
    this.world = this.newWorld();
    this.playerView = new PlayerView(this, WORLD_CONFIG.player.hh, WORLD_CONFIG.player.shoulder, this.groundAt);
    this.projectileRenderer = new ProjectileRenderer(this, this.world.projectiles);
    this.particles = new Particles(this, PARTICLE_CAPACITY[this.settings.vfxQuality], this.groundAt);
    this.texts = new FloatingText(this);
    this.input2 = new InputSystem(this, RENDER_ZOOM, { x: VIEW_WIDTH / 2 + 200, y: ARENA.floorY - 30 });

    this.crosshair = this.add.image(0, 0, 'crosshair').setScale(1 / TEX_SCALE).setDepth(100);
    this.hitmarker = this.add.image(0, 0, 'hitmarker').setScale(1 / TEX_SCALE).setDepth(101).setVisible(false);

    this.feedback = new Feedback(
      this,
      this.particles,
      this.texts,
      this.shake,
      this.audio,
      {
        hitstop: (s) => {
          if (!this.reducedMotion) this.hitstop = Math.max(this.hitstop, s);
        },
        onPlayerShot: () => {
          this.playerView.onShot();
          this.crossKick = 1;
        },
        onPlayerJump: () => this.playerView.onJump(),
        onPlayerLand: (speed) => this.playerView.onLand(speed),
        onPlayerDied: () => this.playerView.onDeath(),
        onEnemyHit: (uid) => this.liveViews.get(uid)?.onHit(),
        onEnemyTelegraph: (uid, d) => this.liveViews.get(uid)?.onTelegraph(d),
        onEnemyShot: (uid) => this.liveViews.get(uid)?.onShot(),
        onEnemyLanded: (uid, speed) => this.liveViews.get(uid)?.onLanded(speed),
        onEnemyKilled: (uid) => this.releaseView(uid),
        onCrosshairHit: (crit) => {
          this.hitmarkerT = 0.09;
          this.hitmarker.setTint(crit ? 0xffc857 : 0xffffff);
        },
        onCombo: (mult) => {
          this.stage.excitement = Math.min(1, (mult - 1) / 2);
        },
      },
      VIEW_WIDTH,
      VIEW_HEIGHT,
    );
    this.feedback.applySettings(this.settings);

    this.bindControls();
    this.bindBus();
    this.emitPhase();
    this.emitHud(true);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  private get reducedMotion(): boolean {
    return prefersReducedMotion() || this.settings.screenShake === 0;
  }

  private newWorld(): World {
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    return new World(WORLD_CONFIG, seed);
  }

  private bindControls(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    kb.on('keydown-ESC', () => this.togglePause());
    kb.on('keydown-P', () => this.togglePause());
    kb.on('keydown-R', () => {
      if (typingInUi()) return;
      if (this.phase.phase === 'GAME_OVER' || this.phase.phase === 'PAUSED') this.startRun();
    });
    kb.on('keydown-ENTER', () => {
      if (typingInUi()) return;
      if (this.phase.phase === 'MENU' || this.phase.phase === 'GAME_OVER') this.startRun();
    });
    kb.on('keydown-F3', (e: KeyboardEvent) => {
      e.preventDefault();
      this.showPerf = !this.showPerf;
      if (!this.showPerf) bus.emit('game:perf', null);
    });
    if (this.debugEnabled) {
      // Teste de estresse: só em dev ou com ?debug. Marca a run como não-ranqueável.
      kb.on('keydown-F4', (e: KeyboardEvent) => {
        e.preventDefault();
        if (this.phase.phase !== 'PLAYING') return;
        this.world.debugTainted = true;
        for (let i = 0; i < 3; i++) {
          this.world.spawnEnemy('galinha_rambo', 0.1 + i * 0.4);
          this.world.spawnEnemy('pato_pistoleiro', 0.25 + i * 0.25);
        }
        this.world.spawnEnemy('vaca_loca', 0.2);
        this.world.spawnEnemy('pombo_mafioso', 0.7);
        this.world.spawnEnemy('porco_executivo', 0.4);
      });
      // F6: chama o Don Pombone na hora.
      kb.on('keydown-F6', (e: KeyboardEvent) => {
        e.preventDefault();
        if (this.phase.phase !== 'PLAYING') return;
        this.world.debugTainted = true;
        this.world.spawnEnemy('don_pombone', 0.5);
      });
      // F5: abre uma oferta de cartas na hora (testar cartas sem limpar ondas).
      kb.on('keydown-F5', (e: KeyboardEvent) => {
        e.preventDefault();
        if (this.phase.phase !== 'PLAYING') return;
        this.world.debugTainted = true;
        this.world.openOffer();
      });
    }
    // Primeiro gesto libera o áudio do navegador.
    const unlock = () => this.audio.unlock();
    this.input.on('pointerdown', unlock);
    kb.on('keydown', unlock);

    // Trocar de aba ou perder foco pausa a run e solta o gatilho.
    const onBlur = () => {
      this.input2.releaseAll();
      if (this.phase.phase === 'PLAYING') this.setPhase('PAUSED');
    };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.game.events.on(Phaser.Core.Events.HIDDEN, onBlur);
    this.unsubs.push(() => {
      this.game.events.off(Phaser.Core.Events.BLUR, onBlur);
      this.game.events.off(Phaser.Core.Events.HIDDEN, onBlur);
    });
  }

  private bindBus(): void {
    this.unsubs.push(
      bus.on('ui:start', () => this.startRun()),
      bus.on('ui:restart', () => this.startRun()),
      bus.on('ui:pause', () => {
        if (this.phase.phase === 'PLAYING') this.setPhase('PAUSED');
      }),
      bus.on('ui:resume', () => {
        if (this.phase.phase === 'PAUSED') this.setPhase('PLAYING');
      }),
      bus.on('ui:quitToMenu', () => {
        this.resetRun();
        this.setPhase('MENU');
      }),
      bus.on('ui:pickCard', (id) => {
        if (this.phase.phase !== 'UPGRADE_SELECT') return;
        if (!this.world.pickUpgrade(id)) return;
        this.flushEvents();
        this.emitHand();
        bus.emit('game:offer', null);
        this.setPhase('PLAYING');
      }),
      bus.on('ui:cardHover', () => this.audio.play('cardHover')),
      bus.on('ui:sfx', (id) => {
        this.audio.unlock();
        this.audio.play(id);
      }),
      bus.on('ui:settings', (s) => {
        this.settings = s;
        this.feedback.applySettings(s);
      }),
    );
  }

  private togglePause(): void {
    if (this.phase.phase === 'PLAYING') this.setPhase('PAUSED');
    else if (this.phase.phase === 'PAUSED') this.setPhase('PLAYING');
  }

  private setPhase(next: RunPhase): void {
    if (!this.phase.to(next)) return;
    if (next !== 'PLAYING') this.input2.releaseAll();
    // Fora do jogo o teclado volta para a página (ex.: digitar o nome no placar).
    const kb = this.input.keyboard;
    if (next === 'PLAYING') kb?.enableGlobalCapture();
    else kb?.disableGlobalCapture();
    this.audio.play('ui');
    this.emitPhase();
  }

  private emitPhase(): void {
    bus.emit('game:phase', this.phase.phase);
  }

  private resetRun(): void {
    for (const uid of [...this.liveViews.keys()]) this.releaseView(uid);
    this.world = this.newWorld();
    this.particles.clear();
    this.texts.clear();
    this.shake.reset();
    this.stepper.reset();
    this.projectileRenderer.reset();
    this.input2.releaseAll();
    this.playerView.reset();
    this.hitstop = 0;
    this.deathTimer = -1;
    this.stage.excitement = 0;
    this.lastMilestone = 0;
    bus.emit('game:offer', null);
    this.emitHand();
    this.emitHud(true);
  }

  private startRun(): void {
    this.audio.unlock();
    this.audio.music?.restart();
    this.resetRun();
    this.setPhase('PLAYING');
  }

  /** Trilha: chefe em campo e último coração aceleram; pausa e cartas abafam. */
  private updateMusic(phase: RunPhase, dt: number): void {
    const music = this.audio.music;
    if (!music) return;
    if (phase === 'MENU' && !music.isPlaying) music.restart();
    const muffled = phase === 'MENU' || phase === 'PAUSED' || phase === 'UPGRADE_SELECT';
    if (muffled !== this.musicMuffled) {
      this.musicMuffled = muffled;
      music.setMuffled(muffled);
    }
    const w = this.world;
    const mode = musicModeFor({
      inRun: phase !== 'MENU' && phase !== 'GAME_OVER',
      bossActive: w.enemies.some((e) => e.def.boss && e.state !== 'incoming'),
      lowHp: w.player.alive && w.player.hp <= 1,
    });
    music.update(mode, dt);
  }

  private acquireView(uid: number, kind: EnemyKind): EnemyVisual {
    const view =
      this.viewPool[kind].pop() ??
      (kind === 'vaca_loca' ? new VacaView(this, this.groundAt) : new EnemyView(this, kind, this.groundAt));
    this.liveViews.set(uid, view);
    return view;
  }

  private releaseView(uid: number): void {
    const v = this.liveViews.get(uid);
    if (!v) return;
    v.release();
    this.liveViews.delete(uid);
    this.viewPool[v.kind].push(v);
  }

  override update(_time: number, smoothedMs: number): void {
    // Tempo real do quadro (o delta do Phaser é suavizado e mascara quedas de FPS).
    // O passo fixo + interpolação já cuidam da suavidade.
    const deltaMs = this.game.loop.rawDelta > 0 ? this.game.loop.rawDelta : smoothedMs;
    this.frameStats.push(deltaMs);
    const dt = Math.min(deltaMs / 1000, 0.1);
    const phase = this.phase.phase;
    const running = phase === 'PLAYING' || phase === 'GAME_OVER';

    if (running) this.simulate(dt);

    // Render (com interpolação entre os dois últimos passos fixos).
    const alpha = this.stepper.alpha;
    const w = this.world;
    for (const e of w.enemies) {
      let view = this.liveViews.get(e.uid);
      if (!view) {
        view = this.acquireView(e.uid, e.def.id);
        view.bind(e);
      }
      view.update(e, alpha, running ? dt : 0, this.reducedMotion);
    }
    this.updateMusic(phase, dt);
    // Vida no fim: coração batendo (o HUD pulsa em vermelho junto).
    if (phase === 'PLAYING' && w.player.alive && w.player.hp <= 1) {
      this.heartbeatTimer -= dt;
      if (this.heartbeatTimer <= 0) {
        this.heartbeatTimer = HEARTBEAT_EVERY;
        this.audio.play('heartbeat');
      }
    } else {
      this.heartbeatTimer = 0;
    }
    // Rastro de poeira das investidas.
    if (running) {
      this.trailTimer -= dt;
      if (this.trailTimer <= 0) {
        this.trailTimer = 0.045;
        for (const e of w.enemies) {
          if (e.state === 'charge' && e.grounded && Math.abs(e.vx) > 150) {
            this.feedback.trail(e.x - e.chargeDir * e.def.hw * 0.7, e.y + e.def.hh, e.chargeDir);
          }
        }
      }
    }
    this.playerView.update(w, alpha, running ? dt : 0);
    this.projectileRenderer.update(w.projectiles, alpha, running ? dt : 0);

    if (phase !== 'PAUSED') {
      this.particles.update(dt);
      this.texts.update(dt);
      this.shake.update(dt);
      this.feedback.update(dt);
      this.stage.update(dt, this.reducedMotion);
    }

    const cam = this.cameras.main;
    cam.centerOn(VIEW_WIDTH / 2 + this.shake.x, VIEW_HEIGHT / 2 + this.shake.y);

    // Mira: compensa o shake para o cursor ficar colado ao mouse.
    const aim = this.input2.aim;
    this.crossKick = Math.max(0, this.crossKick - dt * 9);
    this.crosshair
      .setPosition(aim.x + this.shake.x, aim.y + this.shake.y)
      .setScale((1 + this.crossKick * 0.35) / TEX_SCALE)
      .setVisible(phase === 'PLAYING');
    this.hitmarkerT = Math.max(0, this.hitmarkerT - dt);
    this.hitmarker.setPosition(this.crosshair.x, this.crosshair.y).setVisible(this.hitmarkerT > 0 && phase === 'PLAYING');

    this.emitHud(false);
    this.emitPerf(dt);
  }

  private simulate(dt: number): void {
    let simDt = dt;
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      simDt = 0;
    }
    if (this.deathTimer >= 0) {
      simDt *= 0.4; // câmera lenta na morte
      this.deathTimer -= dt;
      if (this.deathTimer < 0) this.finishRun();
    }

    const steps = this.stepper.advance(simDt);
    if (steps === 0) return;
    const input = this.phase.phase === 'PLAYING' ? this.input2.sample(this.simInput) : EMPTY_INPUT;
    for (let i = 0; i < steps; i++) {
      this.world.step(input, SIM_STEP);
      if (i === 0 && input.jumpPressed) {
        this.input2.consumeJump();
        this.simInput.jumpPressed = false;
      }
    }

    this.flushEvents();
  }

  /** Repassa eventos da simulação para feedback, HUD e máquina de fases. */
  private flushEvents(): void {
    for (const ev of this.world.drainEvents(this.eventScratch)) {
      this.feedback.handle(ev);
      if (ev.type === 'waveStarted') {
        bus.emit('game:callout', { id: Date.now(), title: `ONDA ${ev.wave}`, subtitle: ev.callout });
      } else if (ev.type === 'waveCleared') {
        bus.emit('game:callout', { id: Date.now(), title: 'ONDA LIMPA!', subtitle: `+${ev.bonus} de bônus da produção` });
      } else if (ev.type === 'playerDied') {
        this.deathTimer = DEATH_SEQUENCE;
        this.audio.music?.sadTrombone();
      } else if (ev.type === 'enemyKilled') {
        this.announceCombo(ev.combo);
        if (ev.kind === 'don_pombone') {
          bus.emit('game:callout', { id: Date.now(), title: 'DON POMBONE DERRUBADO!', subtitle: 'a família está de luto' });
        }
      } else if (ev.type === 'comboBroken') {
        this.lastMilestone = 0;
      } else if (ev.type === 'bossEnraged') {
        bus.emit('game:callout', { id: Date.now(), title: 'O DON FICOU BRAVO!', subtitle: 'agora é pessoal' });
      } else if (ev.type === 'upgradeOffer') {
        this.openCards(ev.wave);
      }
    }
  }

  /** Narrador grita nos marcos de combo, com a plateia vibrando. */
  private announceCombo(count: number): void {
    for (const [n, line] of COMBO_MILESTONES) {
      if (count >= n && this.lastMilestone < n) {
        this.lastMilestone = n;
        this.audio.play('cheer');
        this.stage.excitement = 1;
        bus.emit('game:callout', { id: Date.now(), title: `COMBO ${n}!`, subtitle: line });
      }
    }
  }

  private cardInfo(id: string): CardInfo | null {
    const def = WORLD_CONFIG.upgrades.pool.find((d) => d.id === id);
    if (!def) return null;
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      rarity: def.rarity,
      branch: def.branch,
      stacks: this.world.owned.get(def.id) ?? 0,
      golden: isGolden(def, this.world.owned.get(def.id) ?? 0),
      goldenAt: def.effect?.goldenAt ?? 0,
    };
  }

  private openCards(wave: number): void {
    const offer = this.world.offer;
    if (!offer) return;
    const cards = offer.map((c) => this.cardInfo(c.id)).filter((c): c is CardInfo => c !== null);
    this.input2.releaseAll();
    bus.emit('game:offer', { id: ++this.offerId, wave, cards });
    this.setPhase('UPGRADE_SELECT');
  }

  private emitHand(): void {
    const hand: CardInfo[] = [];
    for (const id of this.world.owned.keys()) {
      const c = this.cardInfo(id);
      if (c && c.stacks > 0) hand.push(c);
    }
    bus.emit('game:hand', hand);
  }

  private finishRun(): void {
    this.deathTimer = -1;
    const w = this.world;
    const s = w.stats;
    bus.emit('game:summary', {
      wave: w.waves.wave,
      score: w.score,
      kills: s.kills,
      bestCombo: w.combo.best,
      accuracy: s.shotsFired > 0 ? s.shotsHit / s.shotsFired : 0,
      timeSeconds: s.time,
      weaponName: WORLD_CONFIG.weapon.name,
      debugTainted: w.debugTainted,
    });
    this.setPhase('GAME_OVER');
  }

  private emitHud(force: boolean): void {
    const w = this.world;
    const b = w.enemies.find((e) => e.def.boss && e.state !== 'incoming');
    const boss = b ? { name: b.def.name, hp: Math.max(0, Math.ceil(b.hp)), maxHp: b.def.maxHp, enraged: b.enraged } : null;
    const hud: HudSnapshot = {
      wave: w.waves.wave,
      waveRemaining: w.remainingInWave(),
      waveTotal: w.waves.total,
      score: w.score,
      combo: w.combo.count,
      multiplier: w.combo.multiplier,
      hp: w.player.hp,
      maxHp: w.player.maxHp,
      weaponName: WORLD_CONFIG.weapon.name,
      boss,
    };
    // Chave barata: o HUD React só recebe algo quando um número muda.
    const key = `${hud.wave}|${hud.waveRemaining}|${hud.waveTotal}|${hud.score}|${hud.combo}|${hud.hp}|${hud.maxHp}|${boss ? `${boss.hp}${boss.enraged}` : ''}`;
    if (!force && key === this.lastHud) return;
    this.lastHud = key;
    bus.emit('game:hud', hud);
  }

  private emitPerf(dt: number): void {
    if (!this.showPerf) return;
    this.perfTimer -= dt;
    if (this.perfTimer > 0) return;
    this.perfTimer = 0.5;
    const avg = this.frameStats.average();
    bus.emit('game:perf', {
      fps: avg > 0 ? 1000 / avg : 0,
      avgMs: avg,
      p95Ms: this.frameStats.percentile(95),
      projectiles: this.world.projectiles.activeCount,
      enemies: this.world.enemies.length,
      particles: this.particles.activeCount,
    });
  }

  private teardown(): void {
    for (const u of this.unsubs) u();
    this.unsubs.length = 0;
    this.input2.destroy();
    this.audio.destroy();
  }
}
