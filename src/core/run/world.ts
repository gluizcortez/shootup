import { createWeaponState, pelletAngles, rollDamage, tickWeapon } from '../combat/weapon';
import type { WeaponDef, WeaponState } from '../combat/weapon';
import { ProjectilePool } from '../combat/projectiles';
import type { Projectile } from '../combat/projectiles';
import { createEnemy, integrateEnemy, muzzlePosition, rangedDef } from '../enemies/enemyPhysics';
import { updateGalinha } from '../enemies/galinhaRambo';
import { updatePato } from '../enemies/patoPistoleiro';
import { updateVaca } from '../enemies/vacaLoca';
import { updatePombo } from '../enemies/pomboMafioso';
import { updatePorco } from '../enemies/porcoExecutivo';
import { updatePombone } from '../enemies/donPombone';
import { updateMaromba } from '../enemies/marombaVice';
import { updatePatinador } from '../enemies/patinadorAssassino';
import { updatePolicial } from '../enemies/policialCorrupto';
import type { Enemy, EnemyContext, EnemyDef, EnemyKind } from '../enemies/types';
import { Rng } from '../math/rng';
import { boxesOverlap, sweptCircleHitsBox } from '../physics/collision';
import type { Box } from '../physics/collision';
import { createMotor, stepMotor } from '../physics/playerMotor';
import type { ArenaBounds, MotorState, MotorTuning } from '../physics/playerMotor';
import { Terrain } from '../physics/terrain';
import type { TerrainDef } from '../physics/terrain';
import { breakCombo, createCombo, registerKill, tickCombo } from '../scoring/combo';
import type { ComboState, ComboTuning } from '../scoring/combo';
import type { GameEvent } from './events';
import { createWaveState, scaleForWave, tickWaves } from './waves';
import type { WaveConfig, WaveState } from './waves';
import { computeStats, isGolden, rollOffer } from '../upgrades/upgrades';
import type { Rarity, StatClamp, StatKey, Stats, UpgradeDef } from '../upgrades/types';

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

export interface UpgradeConfig {
  pool: readonly UpgradeDef[];
  /** Peso de sorteio por raridade. */
  weights: Record<Rarity, number>;
  /** Pesos da oferta logo após vencer um chefe (épicas bem mais prováveis). */
  bossWeights?: Record<Rarity, number>;
  /** Dano da bala depois de cada ricochete (Sinuca Mortal), como fração. */
  ricochetDamageMult: number;
  /** Dano de cada estilhaço (Bala Cluster), como fração do dano da bala que acertou. */
  splitDamageFrac: number;
  /** Teto da cadência extra por combo (Trilha de Montagem), como fração. */
  comboHasteMax: number;
  clamps: Partial<Record<StatKey, StatClamp>>;
  /** Cartas por oferta entre ondas. */
  offerSize: number;
}

export interface WorldConfig {
  bounds: ArenaBounds;
  terrain: TerrainDef;
  player: PlayerConfig;
  weapon: WeaponDef;
  enemies: Record<EnemyKind, EnemyDef>;
  waves: WaveConfig;
  combo: ComboTuning;
  upgrades: UpgradeConfig;
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
  maxHp: number;
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
  readonly terrain: Terrain;
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
  /** Oferece cartas entre ondas (desligado em alguns testes). */
  upgradesEnabled = true;
  /** Cartas na mão: id → stacks. */
  readonly owned = new Map<string, number>();
  /** Oferta aberta; enquanto existir, a simulação fica congelada esperando a escolha. */
  offer: UpgradeDef[] | null = null;
  /** Arma e movimento efetivos (base + cartas). */
  weapon: WeaponDef;
  motorTuning: MotorTuning;
  effective: Stats;
  /** Habilidades épicas ativas (recalculadas junto com os atributos). */
  private explode: { count: number; damageFrac: number; speedFrac: number; lifetime: number; golden: boolean } | null = null;
  private bleed: { damage: number; duration: number; interval: number; golden: boolean } | null = null;
  /** Globo de Discoteca (épica): lido também pela renderização. */
  disco: {
    count: number;
    interval: number;
    damageFrac: number;
    speedFrac: number;
    lifetime: number;
    height: number;
    golden: boolean;
    timer: number;
  } | null = null;

  private nextUid = 1;
  private nextSquad = 1;
  private readonly angleScratch: number[] = [];
  private readonly enemyBox: Box = { x: 0, y: 0, hw: 0, hh: 0 };
  private readonly playerBox: Box = { x: 0, y: 0, hw: 0, hh: 0 };
  private readonly ctx: EnemyContext;
  private readonly upgradeDefs: ReadonlyMap<string, UpgradeDef>;

  constructor(
    readonly config: WorldConfig,
    readonly seed: number,
  ) {
    this.rng = new Rng(seed);
    const b = config.bounds;
    const p = config.player;
    this.terrain = new Terrain(config.terrain);
    const cx = (b.left + b.right) / 2;
    const motor = createMotor(cx, this.terrain.groundAt(cx) - p.hh, p.hw, p.hh);
    motor.grounded = true;
    this.player = {
      motor,
      px: motor.x,
      py: motor.y,
      hp: p.maxHp,
      maxHp: p.maxHp,
      invuln: 0,
      aimAngle: 0,
      alive: true,
      weapon: createWeaponState(config.weapon),
    };
    this.projectiles = new ProjectilePool(config.projectileCapacity);
    this.waves = createWaveState(config.waves);
    this.upgradeDefs = new Map(config.upgrades.pool.map((d) => [d.id, d]));
    this.weapon = { ...config.weapon };
    this.motorTuning = { ...p.motor };
    this.effective = this.baseStats();
    this.recomputeStats();

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
      enemies: this.enemies,
      groundAt: (x) => this.terrain.groundAt(x),
      fire: (e, angle, speedScale) => this.enemyFire(e, angle, speedScale ?? 1),
      summon: (kind, xNorm) => {
        this.spawnEnemy(kind, xNorm);
      },
      buffed: (src, targets) =>
        this.emit({ type: 'enemyBuffed', uid: src.uid, x: src.x, y: src.y, targets: targets.map((t) => t.uid) }),
      enraged: (e) => this.emit({ type: 'bossEnraged', uid: e.uid, kind: e.def.id, x: e.x, y: e.y }),
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

  /**
   * Anuncia um animal no topo, na coluna `xNorm` (0 = esquerda, 1 = direita).
   * Pombos entram em esquadrilha: devolve o líder.
   */
  spawnEnemy(kind: EnemyKind, xNorm: number): Enemy {
    const def = this.config.enemies[kind];
    if (def.behaviour !== 'pombo') return this.spawnOne(kind, xNorm, 0);
    const squad = this.nextSquad++;
    const width = this.config.bounds.right - this.config.bounds.left;
    const base = this.rng.range(def.hoverMinY + 20, def.hoverMaxY);
    let leader: Enemy | null = null;
    for (let i = 0; i < def.squadSize; i++) {
      const off = def.formation[i % def.formation.length] ?? { x: 0, y: 0 };
      const e = this.spawnOne(kind, xNorm + off.x / width, base + off.y);
      e.squadId = squad;
      e.squadSlot = i;
      leader ??= e;
    }
    return leader as Enemy;
  }

  private spawnOne(kind: EnemyKind, xNorm: number, hoverY: number): Enemy {
    const def = scaleForWave(this.config.enemies[kind], this.waves.wave, this.config.waves.growth);
    const y = hoverY || (def.role === 'ranged' ? this.rng.range(def.hoverMinY, def.hoverMaxY) : 0);
    const e = createEnemy(this.nextUid++, def, xNorm, this.config.bounds, y);
    this.enemies.push(e);
    this.emit({ type: 'enemyIncoming', uid: e.uid, kind, x: e.x, warn: e.def.warnTime });
    return e;
  }

  step(input: SimInput, dt: number): void {
    if (this.offer) return; // escolhendo carta: tudo parado
    if (!this.player.alive) {
      // O mundo continua (projéteis voando, inimigos comemorando) mas sem jogador.
      this.stepProjectiles(dt);
      this.stepEnemies(dt);
      return;
    }
    this.stats.time += dt;
    this.stepPlayer(input, dt);
    this.stepDisco(dt);
    this.stepEnemies(dt);
    this.stepBleed(dt);
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

    stepMotor(m, input, this.motorTuning, this.config.bounds, this.terrain, dt);
    if (m.justJumped) this.emit({ type: 'playerJumped', x: m.x, y: m.y + m.hh });
    if (m.justLanded) this.emit({ type: 'playerLanded', x: m.x, y: m.y + m.hh, speed: m.landingSpeed });

    // Mira pelo ombro, não pelo centro, para o cano apontar exatamente ao cursor.
    const sx = m.x + this.config.player.shoulder.x * (input.aimX >= m.x ? 1 : -1);
    const sy = m.y + this.config.player.shoulder.y;
    p.aimAngle = Math.atan2(input.aimY - sy, input.aimX - sx);

    const w = this.weapon;
    // Trilha de Montagem: o combo acelera o cooldown (sem passar do limite de cadência).
    const shots = tickWeapon(p.weapon, w, input.fireHeld, dt * (1 + this.comboHaste()));
    const echo = this.effective.echoChance;
    for (let s = 0; s < shots; s++) {
      const mx = sx + Math.cos(p.aimAngle) * w.barrelLength;
      const my = sy + Math.sin(p.aimAngle) * w.barrelLength;
      this.fireVolley(mx, my, p.aimAngle, 0);
      this.stats.shotsFired++;
      this.emit({ type: 'shot', x: mx, y: my, angle: p.aimAngle, weaponId: w.id });
      // Lado B: cada 100% é uma repetição garantida; o resto é chance. Repetições não contam na precisão.
      if (echo > 0) {
        let extra = Math.floor(echo);
        if (this.rng.chance(echo - extra)) extra++;
        for (let k = 0; k < extra; k++) {
          this.fireVolley(mx, my, p.aimAngle, this.rng.range(-0.07, 0.07));
          this.emit({ type: 'echoShot', x: mx, y: my, angle: p.aimAngle });
        }
      }
    }
  }

  /** Um disparo da arma (todas as balas do tiro), com desvio extra opcional. */
  private fireVolley(x: number, y: number, aim: number, jitter: number): void {
    const w = this.weapon;
    for (const a of pelletAngles(w, aim + jitter, this.rng, this.angleScratch)) {
      this.spawnPlayerBullet(x, y, a, w.projectileSpeed, 1, w.projectileLifetime, w.id);
    }
  }

  /** Bala do jogador com todos os modificadores de carta (perfura, quica, persegue, divide). */
  private spawnPlayerBullet(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damageFrac: number,
    life: number,
    sourceId: string,
  ): Projectile {
    const w = this.weapon;
    const st = this.effective;
    const roll = rollDamage(w, this.rng);
    const b = this.projectiles.spawn(
      'player',
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      w.projectileRadius,
      roll.amount * damageFrac,
      roll.crit,
      w.knockback,
      life,
      sourceId,
    );
    b.pierceLeft = w.pierce;
    b.ricochetLeft = w.ricochet;
    b.wallBounceLeft = st.wallBounce;
    b.homing = st.homing;
    b.splitCount = st.splitCount;
    return b;
  }

  /** Cadência extra do combo, como fração (0 = nenhuma). */
  comboHaste(): number {
    const per = this.effective.comboHaste;
    if (per <= 0 || this.combo.count <= 0) return 0;
    const minInterval = this.config.upgrades.clamps.fireInterval?.min ?? 0;
    const room = minInterval > 0 ? Math.max(0, this.weapon.fireInterval / minInterval - 1) : Infinity;
    return Math.min(per * this.combo.count, this.config.upgrades.comboHasteMax, room);
  }

  /** Globo de Discoteca: rajadas em leque para cima, sozinho, enquanto o jogador vive. */
  private stepDisco(dt: number): void {
    const d = this.disco;
    if (!d) return;
    d.timer -= dt;
    if (d.timer > 0) return;
    d.timer += d.interval;
    const m = this.player.motor;
    const x = m.x;
    const y = m.y - d.height;
    const speed = this.weapon.projectileSpeed * d.speedFrac;
    // Arco de cima: um pouco abaixo do horizontal de cada lado até o teto.
    const from = -Math.PI - 0.25;
    const span = Math.PI + 0.5;
    const offset = this.rng.range(0, span / d.count);
    for (let i = 0; i < d.count; i++) {
      const a = from + offset + (i / d.count) * span;
      this.spawnPlayerBullet(x, y, a, speed, d.damageFrac, d.lifetime, d.golden ? 'disco_dourado' : 'disco');
    }
    this.emit({ type: 'discoShot', x, y, count: d.count, golden: d.golden });
  }

  private stepEnemies(dt: number): void {
    const b = this.config.bounds;
    // Índice: o chefe pode convocar reforços durante o laço (entram no fim da lista).
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i] as Enemy;
      e.px = e.x;
      e.py = e.y;
      const def = e.def;
      const before = e.state;
      if (this.player.alive) {
        if (def.behaviour === 'pato') updatePato(e, def, this.ctx, dt);
        else if (def.behaviour === 'galinha') updateGalinha(e, def, this.ctx, dt);
        else if (def.behaviour === 'vaca') updateVaca(e, def, this.ctx, dt);
        else if (def.behaviour === 'pombo') updatePombo(e, def, this.ctx, dt);
        else if (def.behaviour === 'porco') updatePorco(e, def, this.ctx, dt);
        else if (def.behaviour === 'maromba') updateMaromba(e, def, this.ctx, dt);
        else if (def.behaviour === 'patinador') updatePatinador(e, def, this.ctx, dt);
        else if (def.behaviour === 'policial') updatePolicial(e, def, this.ctx, dt);
        else updatePombone(e, def, this.ctx, dt);
      } else {
        e.vx *= 0.9;
        if (def.role === 'ranged') e.vy *= 0.9;
      }
      if (before !== e.state) {
        if (e.state === 'charge') this.emit({ type: 'enemyCharge', uid: e.uid, kind: def.id, x: e.x, y: e.y + def.hh, dir: e.chargeDir });
        else if (e.state === 'dizzy') this.emit({ type: 'enemyStunned', uid: e.uid, kind: def.id, x: e.x, y: e.y });
      }
      const impact = integrateEnemy(e, b, this.ctx.groundAt, dt);
      if (impact > 0) this.emit({ type: 'enemyLanded', uid: e.uid, kind: def.id, x: e.x, y: e.y + def.hh, speed: impact });
    }
  }

  private enemyFire(e: Enemy, angle: number, speedScale: number): void {
    const d = rangedDef(e);
    const m = muzzlePosition(e);
    const speed = d.bulletSpeed * speedScale * this.effective.enemyBulletSpeed;
    this.projectiles.spawn(
      'enemy',
      m.x,
      m.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
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
      if (p.homing > 0) this.steer(p, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.team === 'player') {
        if (this.hitEnemies(p)) continue;
      } else if (this.player.alive && this.hitPlayer(p)) {
        continue;
      }

      // Impacto em chão/paredes/teto ou fim de vida.
      const groundY = this.terrain.groundAt(p.x);
      const hitFloor = p.y + p.radius >= groundY;
      if (p.wallBounceLeft > 0 && this.bounceWalls(p, groundY)) continue;
      const out = p.x < b.left - 60 || p.x > b.right + 60 || p.y < b.ceilingY - 60;
      if (hitFloor) {
        this.emit({ type: 'projectileImpact', x: p.x, y: groundY, team: p.team, angle: Math.atan2(p.vy, p.vx) });
        this.projectiles.release(p);
      } else if (out || p.life <= 0) {
        this.projectiles.release(p);
      }
    }
  }

  /**
   * Acerto de bala do jogador. Ordem: dano → perfuração (segue reto) →
   * ricochete (quica no inimigo para um lado qualquer, com dano reduzido) → some.
   * Devolve true se a bala tocou alguém neste passo.
   */
  private hitEnemies(p: Projectile): boolean {
    const box = this.enemyBox;
    for (const e of this.enemies) {
      if (!e.alive || e.state === 'incoming' || e.uid === p.lastHitUid) continue;
      box.x = e.x;
      box.y = e.y;
      box.hw = e.def.hw;
      box.hh = e.def.hh;
      if (!sweptCircleHitsBox(p.px, p.py, p.x, p.y, p.radius, box)) continue;

      const speed = Math.hypot(p.vx, p.vy) || 1;
      const dirX = p.vx / speed;
      const dirY = p.vy / speed;
      const d = e.def;
      const raw = d.behaviour === 'vaca' && e.state === 'dizzy' ? p.damage * d.dizzyDamageMult : p.damage;
      // Dano sempre inteiro: multiplicadores de cartas geram dízimas (ex.: 6.4000000001).
      const damage = Math.max(1, Math.round(raw));
      // Escudo do Porco Executivo absorve primeiro.
      const shielded = e.shield > 0;
      const absorbed = Math.min(e.shield, damage);
      e.shield -= absorbed;
      e.hp -= damage - absorbed;
      if (shielded && e.shield <= 0) this.emit({ type: 'shieldBroken', uid: e.uid, x: e.x, y: e.y });
      e.vx += dirX * p.knockback * d.knockbackScale;
      // Tranco no ar só para quem voa; quem anda no chão continua no chão.
      if (d.role === 'ranged') e.vy += dirY * p.knockback * 0.6 * d.knockbackScale;
      this.stats.shotsHit++;
      if (p.crit) this.stats.crits++;
      this.emit({ type: 'enemyHit', uid: e.uid, kind: d.id, x: p.x, y: p.y, damage, crit: p.crit, dirX, dirY, shielded });
      const bl = this.bleed;
      if (bl) {
        if (e.bleedTime <= 0) e.bleedTick = bl.interval;
        e.bleedTime = bl.duration;
        e.bleedDamage = bl.damage;
        e.bleedInterval = bl.interval;
      }
      if (e.hp <= 0) this.killEnemy(e, p.crit);
      if (p.splitCount > 0) this.splitBullet(p, e.uid, dirX, dirY);

      p.lastHitUid = e.uid;
      if (p.pierceLeft > 0) {
        p.pierceLeft--;
      } else if (p.ricochetLeft > 0) {
        this.bounceOff(p);
        p.ricochetLeft--;
      } else {
        this.projectiles.release(p);
      }
      return true;
    }
    return false;
  }

  /** Sinuca Mortal: a bala quica no inimigo atingido e sai voando para um lado qualquer. */
  private bounceOff(p: Projectile): void {
    const speed = Math.hypot(p.vx, p.vy);
    const angle = this.rng.range(-Math.PI, Math.PI);
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.px = p.x;
    p.py = p.y;
    p.damage *= this.config.upgrades.ricochetDamageMult;
    p.life = Math.max(p.life, 0.8);
    this.emit({ type: 'ricochet', x: p.x, y: p.y, angle });
  }

  /** Bala Bate-Volta: quica em chão, paredes e teto. Devolve true se quicou. */
  private bounceWalls(p: Projectile, groundY: number): boolean {
    const b = this.config.bounds;
    let bounced = false;
    if (p.y + p.radius >= groundY) {
      p.y = groundY - p.radius;
      p.vy = -Math.abs(p.vy);
      bounced = true;
    } else if (p.y - p.radius <= b.ceilingY) {
      p.y = b.ceilingY + p.radius;
      p.vy = Math.abs(p.vy);
      bounced = true;
    }
    if (p.x - p.radius <= b.left) {
      p.x = b.left + p.radius;
      p.vx = Math.abs(p.vx);
      bounced = true;
    } else if (p.x + p.radius >= b.right) {
      p.x = b.right - p.radius;
      p.vx = -Math.abs(p.vx);
      bounced = true;
    }
    if (!bounced) return false;
    p.wallBounceLeft--;
    p.px = p.x;
    p.py = p.y;
    // Depois de quicar pode voltar a acertar o mesmo inimigo.
    p.lastHitUid = -1;
    p.life = Math.max(p.life, 0.6);
    this.emit({ type: 'ricochet', x: p.x, y: p.y, angle: Math.atan2(p.vy, p.vx) });
    return true;
  }

  /** Teleguiada: vira a bala para o inimigo mais perto, até `homing` rad/s. */
  private steer(p: Projectile, dt: number): void {
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (!e.alive || e.state === 'incoming' || e.uid === p.lastHitUid) continue;
      const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    if (!best) return;
    const speed = Math.hypot(p.vx, p.vy);
    const cur = Math.atan2(p.vy, p.vx);
    let diff = Math.atan2(best.y - p.y, best.x - p.x) - cur;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const max = p.homing * dt;
    const a = cur + Math.max(-max, Math.min(max, diff));
    p.vx = Math.cos(a) * speed;
    p.vy = Math.sin(a) * speed;
  }

  /** Bala Cluster: ao acertar, solta estilhaços em leque para a frente. Estilhaços não se dividem. */
  private splitBullet(p: Projectile, hitUid: number, dirX: number, dirY: number): void {
    const n = p.splitCount;
    const base = Math.atan2(dirY, dirX);
    const spread = 1.8;
    const speed = Math.hypot(p.vx, p.vy) * 0.85;
    for (let i = 0; i < n; i++) {
      const a = n === 1 ? base + this.rng.range(-0.5, 0.5) : base - spread / 2 + (i / (n - 1)) * spread;
      const f = this.projectiles.spawn(
        'player',
        p.x,
        p.y,
        Math.cos(a) * speed,
        Math.sin(a) * speed,
        Math.max(3, p.radius * 0.75),
        p.damage * this.config.upgrades.splitDamageFrac,
        false,
        p.knockback * 0.4,
        0.55,
        'fragmento',
      );
      f.lastHitUid = hitUid;
      f.homing = p.homing;
    }
    this.emit({ type: 'bulletSplit', x: p.x, y: p.y, count: n });
  }

  /** Sangramento da carta Vampiresco: ignora escudo e pode matar. */
  private stepBleed(dt: number): void {
    // De trás para frente: killEnemy troca o morto pelo último da lista.
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i] as Enemy;
      if (e.bleedTime <= 0 || !e.alive) continue;
      e.bleedTime -= dt;
      e.bleedTick -= dt;
      if (e.bleedTick > 0) continue;
      e.bleedTick += e.bleedInterval;
      e.hp -= e.bleedDamage;
      this.emit({ type: 'enemyBled', uid: e.uid, x: e.x, y: e.y - e.def.hh, damage: e.bleedDamage, golden: this.bleed?.golden ?? false });
      if (e.hp <= 0) this.killEnemy(e, false);
    }
  }

  /** Carta Explosivo: o abatido vira uma chuva de balas do jogador. */
  private explodeEnemy(e: Enemy): void {
    const ex = this.explode;
    if (!ex) return;
    const w = this.weapon;
    const speed = w.projectileSpeed * ex.speedFrac;
    const offset = this.rng.range(0, Math.PI * 2);
    for (let i = 0; i < ex.count; i++) {
      const a = offset + (i / ex.count) * Math.PI * 2;
      const b = this.projectiles.spawn(
        'player',
        e.x,
        e.y,
        Math.cos(a) * speed,
        Math.sin(a) * speed,
        w.projectileRadius,
        w.damage * ex.damageFrac,
        false,
        w.knockback * 0.5,
        ex.lifetime,
        ex.golden ? 'explosivo_dourado' : 'explosivo',
      );
      b.lastHitUid = e.uid;
    }
    this.emit({ type: 'enemyExploded', x: e.x, y: e.y, count: ex.count, golden: ex.golden });
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
    this.explodeEnemy(e);
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
      // Só inimigos corpo a corpo encostam no jogador; atiradores ficam no alto.
      if (e.state === 'incoming' || e.def.role !== 'melee') continue;
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
      // Rodada acabou: balas inimigas que ainda estavam no ar somem.
      this.projectiles.releaseTeam('enemy');
      const bonus = this.config.waves.clearBonusPerWave * this.waves.wave;
      this.score += bonus;
      // Fim de rodada cura meio coração (o dano continua tirando corações inteiros).
      const p = this.player;
      const before = p.hp;
      if (p.alive) p.hp = Math.min(p.maxHp, p.hp + this.config.waves.clearHeal);
      this.emit({ type: 'waveCleared', wave: this.waves.wave, bonus, healed: p.hp - before });
      if (this.upgradesEnabled) this.openOffer();
    }
  }

  /** Sorteia cartas e congela a simulação até `pickUpgrade`. */
  openOffer(): void {
    const u = this.config.upgrades;
    const afterBoss = this.config.waves.bossWaves?.[this.waves.wave] !== undefined;
    const weights = afterBoss && u.bossWeights ? u.bossWeights : u.weights;
    const cards = rollOffer(u.pool, this.owned, weights, this.rng, u.offerSize);
    if (cards.length === 0) return;
    this.offer = cards;
    this.emit({ type: 'upgradeOffer', wave: this.waves.wave, cards: cards.map((c) => c.id) });
  }

  /** Aplica a carta escolhida da oferta aberta. Devolve false se o id não está na oferta. */
  pickUpgrade(id: string): boolean {
    const card = this.offer?.find((c) => c.id === id);
    if (!card) return false;
    const stacks = (this.owned.get(id) ?? 0) + 1;
    this.owned.set(id, stacks);
    this.recomputeStats();
    const p = this.player;
    // Vida máxima nova vem vazia; só cartas de cura enchem corações.
    p.hp = Math.min(p.maxHp, p.hp + (card.onPick?.heal ?? 0));
    this.offer = null;
    this.emit({ type: 'upgradePicked', id, stacks });
    return true;
  }

  private baseStats(): Stats {
    const w = this.config.weapon;
    const p = this.config.player;
    return {
      fireInterval: w.fireInterval,
      pellets: w.pelletsPerShot,
      spreadDeg: w.spreadDeg,
      damage: w.damage,
      critChance: w.critChance,
      critMultiplier: w.critMultiplier,
      projectileSpeed: w.projectileSpeed,
      pierce: w.pierce,
      ricochet: w.ricochet,
      runSpeed: p.motor.runSpeed,
      jumpVelocity: p.motor.jumpVelocity,
      maxHp: p.maxHp,
      projectileRadius: w.projectileRadius,
      knockback: w.knockback,
      wallBounce: 0,
      echoChance: 0,
      comboHaste: 0,
      homing: 0,
      splitCount: 0,
      enemyBulletSpeed: 1,
    };
  }

  /** Recalcula arma, movimento e vida a partir da base + cartas na mão. */
  recomputeStats(): void {
    const st = computeStats(this.baseStats(), this.owned, this.upgradeDefs, this.config.upgrades.clamps);
    this.effective = st;
    const w = this.weapon;
    w.fireInterval = st.fireInterval;
    w.pelletsPerShot = st.pellets;
    w.spreadDeg = st.spreadDeg;
    w.damage = st.damage;
    w.critChance = st.critChance;
    w.critMultiplier = st.critMultiplier;
    w.projectileSpeed = st.projectileSpeed;
    w.pierce = st.pierce;
    w.ricochet = st.ricochet;
    w.projectileRadius = st.projectileRadius;
    w.knockback = st.knockback;
    this.motorTuning.runSpeed = st.runSpeed;
    this.motorTuning.jumpVelocity = st.jumpVelocity;
    this.player.maxHp = st.maxHp;
    this.player.hp = Math.min(this.player.hp, st.maxHp);
    this.recomputeEffects();
  }

  private recomputeEffects(): void {
    this.explode = null;
    this.bleed = null;
    const prevDisco = this.disco;
    this.disco = null;
    for (const [id, stacks] of this.owned) {
      const def = this.upgradeDefs.get(id);
      const fx = def?.effect;
      if (!def || !fx || stacks <= 0) continue;
      const golden = isGolden(def, stacks);
      if (fx.kind === 'explode') {
        this.explode = {
          count: fx.baseCount + fx.perStack * (stacks - 1),
          damageFrac: golden ? fx.goldenDamageFrac : fx.damageFrac,
          speedFrac: fx.speedFrac,
          lifetime: fx.lifetime,
          golden,
        };
      } else if (fx.kind === 'disco') {
        const interval = golden ? fx.goldenInterval : fx.interval;
        this.disco = {
          count: fx.baseCount + fx.perStack * (stacks - 1),
          interval,
          damageFrac: golden ? fx.goldenDamageFrac : fx.damageFrac,
          speedFrac: fx.speedFrac,
          lifetime: fx.lifetime,
          height: fx.height,
          golden,
          timer: Math.min(prevDisco?.timer ?? interval, interval),
        };
      } else {
        this.bleed = {
          damage: fx.damagePerStack * stacks,
          duration: fx.duration,
          interval: golden ? fx.goldenTickInterval : fx.tickInterval,
          golden,
        };
      }
    }
  }

  /** Inimigos restantes na onda atual (vivos + ainda por entrar). */
  remainingInWave(): number {
    return this.enemies.length + this.waves.queue.length;
  }
}
