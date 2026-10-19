import { createWeaponState, pelletAngles, rollDamage, tickWeapon } from '../combat/weapon';
import type { WeaponDef, WeaponState } from '../combat/weapon';
import { ProjectilePool } from '../combat/projectiles';
import type { Projectile } from '../combat/projectiles';
import { createEnemy, integrateEnemy, muzzlePosition } from '../enemies/enemyPhysics';
import { updateGalinha } from '../enemies/galinhaRambo';
import { updatePato } from '../enemies/patoPistoleiro';
import type { Enemy, EnemyContext, EnemyDef, EnemyKind } from '../enemies/types';
import { Rng } from '../math/rng';
import { boxesOverlap, sweptCircleHitsBox } from '../physics/collision';
import type { Box } from '../physics/collision';
import { createMotor, stepMotor } from '../physics/playerMotor';
import type { ArenaBounds, MotorState, MotorTuning } from '../physics/playerMotor';
import { breakCombo, createCombo, registerKill, tickCombo } from '../scoring/combo';
import type { ComboState, ComboTuning } from '../scoring/combo';
import type { GameEvent } from './events';
import { createWaveState, tickWaves } from './waves';
import type { WaveConfig, WaveState } from './waves';

export interface PlayerConfig {
  hw: number;
  hh: number;
  maxHp: number;
  invulnTime: number;
  hurtKnockbackX: number;
  hurtKnockbackY: number;
  /** Ombro (pivô da arma) relativo ao centro do jogador. */
  shoulder: { x: number; y: number };
  motor: MotorTuning;
}

export interface WorldConfig {
  bounds: ArenaBounds;
  player: PlayerConfig;
  weapon: WeaponDef;
  enemies: Record<EnemyKind, EnemyDef>;
  waves: WaveConfig;
  combo: ComboTuning;
  projectileCapacity: number;
}

/** Entrada já amostrada para um passo fixo. */
export interface SimInput {
  moveX: number;
  jumpPressed: boolean;
  jumpHeld: boolean;
  fireHeld: boolean;
  aimX: number;
  aimY: number;
}

export interface PlayerState {
  motor: MotorState;
  px: number;
  py: number;
  hp: number;
  invuln: number;
  aimAngle: number;
  alive: boolean;
  weapon: WeaponState;
}

export interface RunStats {
  time: number;
  kills: number;
  shotsFired: number;
  shotsHit: number;
  crits: number;
  damageTaken: number;
}

export const EMPTY_INPUT: SimInput = {
  moveX: 0,
  jumpPressed: false,
  jumpHeld: false,
  fireHeld: false,
  aimX: 0,
  aimY: 0,
};

/**
 * Simulação completa de uma run, sem Phaser nem DOM.
 * Determinística dada a seed e a sequência de entradas.
 */
export class World {
  readonly rng: Rng;
  readonly player: PlayerState;
  readonly enemies: Enemy[] = [];
  readonly projectiles: ProjectilePool;
  readonly combo: ComboState = createCombo();
  readonly waves: WaveState;
  readonly stats: RunStats = { time: 0, kills: 0, shotsFired: 0, shotsHit: 0, crits: 0, damageTaken: 0 };
  /** Fila de eventos; quem consome chama `drainEvents`. */
  readonly events: GameEvent[] = [];
  score = 0;
  /** Desativa geração de ondas (testes e cenários de debug). */
  wavesEnabled = true;
  /** Runs com comandos de debug não podem ir para ranking. */
  debugTainted = false;

  private nextUid = 1;
  private readonly angleScratch: number[] = [];
  private readonly enemyBox: Box = { x: 0, y: 0, hw: 0, hh: 0 };
  private readonly playerBox: Box = { x: 0, y: 0, hw: 0, hh: 0 };
  private readonly ctx: EnemyContext;

  constructor(
    readonly config: WorldConfig,
    readonly seed: number,
  ) {
    this.rng = new Rng(seed);
    const b = config.bounds;
    const p = config.player;
    const motor = createMotor((b.left + b.right) / 2, b.floorY - p.hh, p.hw, p.hh);
    motor.grounded = true;
    this.player = {
      motor,
      px: motor.x,
      py: motor.y,
      hp: p.maxHp,
      invuln: 0,
      aimAngle: 0,
      alive: true,
      weapon: createWeaponState(config.weapon),
    };
    this.projectiles = new ProjectilePool(config.projectileCapacity);
    this.waves = createWaveState(config.waves);

    const world = this;
    this.ctx = {
      get playerX() {
        return world.player.motor.x;
      },
      get playerY() {
        return world.player.motor.y;
      },
      bounds: b,
      rng: this.rng,
      fire: (e, angle) => this.enemyFire(e, angle),
      telegraph: (e, duration) =>
        this.emit({ type: 'enemyTelegraph', uid: e.uid, kind: e.def.id, state: e.state, duration }),
    };
  }

  emit(ev: GameEvent): void {
    this.events.push(ev);
  }

  drainEvents(out: GameEvent[]): GameEvent[] {
    out.length = 0;
    for (const ev of this.events) out.push(ev);
    this.events.length = 0;
    return out;
  }

  /** Posição do ombro (pivô da arma) do jogador. */
  shoulder(): { x: number; y: number } {
    const m = this.player.motor;
    const s = this.config.player.shoulder;
    const facing = Math.cos(this.player.aimAngle) >= 0 ? 1 : -1;
    return { x: m.x + s.x * facing, y: m.y + s.y };
  }

  /** Anuncia um animal no topo, na coluna `xNorm` (0 = esquerda, 1 = direita). */
  spawnEnemy(kind: EnemyKind, xNorm: number): Enemy {
    const e = createEnemy(this.nextUid++, this.config.enemies[kind], xNorm, this.config.bounds);
    this.enemies.push(e);
    this.emit({ type: 'enemyIncoming', uid: e.uid, kind, x: e.x, warn: e.def.warnTime });
    return e;
  }

  step(input: SimInput, dt: number): void {
    if (!this.player.alive) {
      // O mundo continua (projéteis voando, inimigos comemorando) mas sem jogador.
      this.stepProjectiles(dt);
      this.stepEnemies(dt);
      return;
    }
    this.stats.time += dt;
    this.stepPlayer(input, dt);
    this.stepEnemies(dt);
    this.stepProjectiles(dt);
    this.resolveContacts();
    if (tickCombo(this.combo, dt)) this.emit({ type: 'comboBroken', count: 0 });
    if (this.wavesEnabled) this.stepWaves(dt);
  }

  private stepPlayer(input: SimInput, dt: number): void {
    const p = this.player;
    const m = p.motor;
    p.px = m.x;
    p.py = m.y;
    p.invuln = Math.max(0, p.invuln - dt);

    stepMotor(m, input, this.config.player.motor, this.config.bounds, dt);
    if (m.justJumped) this.emit({ type: 'playerJumped', x: m.x, y: m.y + m.hh });
    if (m.justLanded) this.emit({ type: 'playerLanded', x: m.x, y: m.y + m.hh, speed: m.landingSpeed });

    // Mira pelo ombro, não pelo centro, para o cano apontar exatamente ao cursor.
    const sx = m.x + this.config.player.shoulder.x * (input.aimX >= m.x ? 1 : -1);
    const sy = m.y + this.config.player.shoulder.y;
    p.aimAngle = Math.atan2(input.aimY - sy, input.aimX - sx);

    const w = this.config.weapon;
    const shots = tickWeapon(p.weapon, w, input.fireHeld, dt);
    for (let s = 0; s < shots; s++) {
      const mx = sx + Math.cos(p.aimAngle) * w.barrelLength;
      const my = sy + Math.sin(p.aimAngle) * w.barrelLength;
      for (const a of pelletAngles(w, p.aimAngle, this.rng, this.angleScratch)) {
        const roll = rollDamage(w, this.rng);
        this.projectiles.spawn(
          'player',
          mx,
          my,
          Math.cos(a) * w.projectileSpeed,
          Math.sin(a) * w.projectileSpeed,
          w.projectileRadius,
          roll.amount,
          roll.crit,
          w.knockback,
          w.projectileLifetime,
          w.id,
        );
      }
      this.stats.shotsFired++;
      this.emit({ type: 'shot', x: mx, y: my, angle: p.aimAngle, weaponId: w.id });
    }
  }

  private stepEnemies(dt: number): void {
    const b = this.config.bounds;
    for (const e of this.enemies) {
      e.px = e.x;
      e.py = e.y;
      const def = e.def;
      if (this.player.alive) {
        if (def.behaviour === 'pato') updatePato(e, def, this.ctx, dt);
        else updateGalinha(e, def, this.ctx, dt);
      } else {
        e.vx *= 0.9;
      }
      const impact = integrateEnemy(e, b, dt);
      if (impact > 0) {
        this.emit({ type: 'enemyLanded', uid: e.uid, kind: e.def.id, x: e.x, y: e.y + e.def.hh, impact });
      }
    }
  }

  private enemyFire(e: Enemy, angle: number): void {
    const d = e.def;
    const m = muzzlePosition(e);
    this.projectiles.spawn(
      'enemy',
      m.x,
      m.y,
      Math.cos(angle) * d.bulletSpeed,
      Math.sin(angle) * d.bulletSpeed,
      d.bulletRadius,
      d.bulletDamage,
      false,
      0,
      d.bulletLifetime,
      d.id,
    );
    this.emit({ type: 'enemyShot', uid: e.uid, kind: d.id, x: m.x, y: m.y, angle });
  }

  private stepProjectiles(dt: number): void {
    const b = this.config.bounds;
    const items = this.projectiles.items;
    for (let i = 0; i < items.length; i++) {
      const p = items[i] as Projectile;
      if (!p.active) continue;
      p.px = p.x;
      p.py = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.team === 'player') {
        if (this.hitEnemies(p)) continue;
      } else if (this.player.alive && this.hitPlayer(p)) {
        continue;
      }

      // Impacto em chão/paredes/teto ou fim de vida.
      const hitFloor = p.y + p.radius >= b.floorY;
      const out = p.x < b.left - 60 || p.x > b.right + 60 || p.y < b.ceilingY - 60;
      if (hitFloor) {
        this.emit({ type: 'projectileImpact', x: p.x, y: b.floorY, team: p.team, angle: Math.atan2(p.vy, p.vx) });
        this.projectiles.release(p);
      } else if (out || p.life <= 0) {
        this.projectiles.release(p);
      }
    }
  }

  private hitEnemies(p: Projectile): boolean {
    const box = this.enemyBox;
    for (const e of this.enemies) {
      if (!e.alive || e.state === 'incoming') continue;
      box.x = e.x;
      box.y = e.y;
      box.hw = e.def.hw;
      box.hh = e.def.hh;
      if (!sweptCircleHitsBox(p.px, p.py, p.x, p.y, p.radius, box)) continue;

      const speed = Math.hypot(p.vx, p.vy) || 1;
      const dirX = p.vx / speed;
      const dirY = p.vy / speed;
      e.hp -= p.damage;
      e.vx += dirX * p.knockback * e.def.knockbackScale;
      if (e.grounded && dirY < 0.2) {
        e.vy = -90 * e.def.knockbackScale; // pulinho de susto
        e.grounded = false;
      }
      this.stats.shotsHit++;
      if (p.crit) this.stats.crits++;
      this.emit({ type: 'enemyHit', uid: e.uid, kind: e.def.id, x: p.x, y: p.y, damage: p.damage, crit: p.crit, dirX, dirY });
      if (e.hp <= 0) this.killEnemy(e, p.crit);
      this.projectiles.release(p);
      return true;
    }
    return false;
  }

  private killEnemy(e: Enemy, crit: boolean): void {
    e.alive = false;
    this.stats.kills++;
    const points = registerKill(this.combo, e.def.score, this.config.combo);
    this.score += points;
    this.emit({
      type: 'enemyKilled',
      uid: e.uid,
      kind: e.def.id,
      x: e.x,
      y: e.y,
      score: points,
      combo: this.combo.count,
      multiplier: this.combo.multiplier,
      crit,
    });
    const idx = this.enemies.indexOf(e);
    if (idx >= 0) {
      this.enemies[idx] = this.enemies[this.enemies.length - 1] as Enemy;
      this.enemies.pop();
    }
  }

  private hitPlayer(p: Projectile): boolean {
    const m = this.player.motor;
    const box = this.playerBox;
    box.x = m.x;
    box.y = m.y;
    box.hw = m.hw;
    box.hh = m.hh;
    if (!sweptCircleHitsBox(p.px, p.py, p.x, p.y, p.radius, box)) return false;
    if (this.player.invuln > 0) return false; // atravessa durante i-frames
    this.hurtPlayer(p.damage, p.vx >= 0 ? 1 : -1);
    this.projectiles.release(p);
    return true;
  }

  private resolveContacts(): void {
    const p = this.player;
    if (p.invuln > 0 || !p.alive) return;
    const m = p.motor;
    const pb = this.playerBox;
    pb.x = m.x;
    pb.y = m.y;
    pb.hw = m.hw;
    pb.hh = m.hh;
    const eb = this.enemyBox;
    for (const e of this.enemies) {
      if (e.state === 'incoming') continue;
      eb.x = e.x;
      eb.y = e.y;
      eb.hw = e.def.hw * 0.8;
      eb.hh = e.def.hh * 0.85;
      if (boxesOverlap(pb, eb)) {
        this.hurtPlayer(e.def.contactDamage, m.x >= e.x ? 1 : -1);
        return;
      }
    }
  }

  private hurtPlayer(damage: number, dirX: number): void {
    const p = this.player;
    const cfg = this.config.player;
    p.hp = Math.max(0, p.hp - damage);
    p.invuln = cfg.invulnTime;
    this.stats.damageTaken += damage;
    p.motor.vx = dirX * cfg.hurtKnockbackX;
    p.motor.vy = -cfg.hurtKnockbackY;
    p.motor.grounded = false;
    if (this.combo.count > 0) {
      const count = this.combo.count;
      breakCombo(this.combo);
      this.emit({ type: 'comboBroken', count });
    }
    this.emit({ type: 'playerHurt', x: p.motor.x, y: p.motor.y, hp: p.hp, damage });
    if (p.hp <= 0) {
      p.alive = false;
      this.emit({ type: 'playerDied', x: p.motor.x, y: p.motor.y });
    }
  }

  private stepWaves(dt: number): void {
    const res = tickWaves(this.waves, this.config.waves, this.rng, this.enemies.length, dt, (kind, x) =>
      this.spawnEnemy(kind, x),
    );
    if (res === 'started') {
      this.emit({ type: 'waveStarted', wave: this.waves.wave, total: this.waves.total, callout: this.waves.callout });
    } else if (res === 'cleared') {
      const bonus = this.config.waves.clearBonusPerWave * this.waves.wave;
      this.score += bonus;
      this.emit({ type: 'waveCleared', wave: this.waves.wave, bonus });
    }
  }

  /** Inimigos restantes na onda atual (vivos + ainda por entrar). */
  remainingInWave(): number {
    return this.enemies.length + this.waves.queue.length;
  }
}
