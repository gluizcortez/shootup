import { approach, clamp } from '../math/scalar';
import type { ArenaBounds } from '../physics/playerMotor';
import type { Enemy, EnemyContext, EnemyDef, RangedEnemyDef } from './types';

/**
 * Cria o animal acima da tela, na coluna `xNorm` (0..1 da largura da arena).
 * Ele fica parado em `incoming` durante o aviso e depois desce.
 */
export function createEnemy(uid: number, def: EnemyDef, xNorm: number, bounds: ArenaBounds, hoverY: number): Enemy {
  const t = clamp(xNorm, 0, 1);
  const x = bounds.left + def.hw + 8 + t * (bounds.right - bounds.left - 2 * (def.hw + 8));
  const y = bounds.ceilingY - def.hh - 24;
  return {
    uid,
    def,
    x,
    y,
    px: x,
    py: y,
    vx: 0,
    vy: 0,
    hp: def.maxHp,
    facing: x < (bounds.left + bounds.right) / 2 ? 1 : -1,
    state: 'incoming',
    stateTimer: def.warnTime,
    age: 0,
    targetX: x,
    hoverY,
    repositionTimer: 0,
    shotCooldown: 0.6,
    burstLeft: 0,
    burstTimer: 0,
    aimAngle: Math.PI / 2,
    grounded: false,
    chargeDir: 1,
    alive: true,
  };
}

/** Aviso no topo: o animal ainda não existe na arena. */
export function updateIncoming(e: Enemy): boolean {
  e.vx = 0;
  e.vy = 0;
  return e.stateTimer <= 0;
}

/** Definição de atirador; lança erro se o inimigo não for `ranged`. */
export function rangedDef(e: Enemy): RangedEnemyDef {
  const d = e.def;
  if (d.role !== 'ranged') throw new Error(`${d.id} não é atirador`);
  return d;
}

/** Desce do topo até a altitude de patrulha. Devolve true ao chegar. */
export function updateDescend(e: Enemy, dt: number): boolean {
  e.vy = e.def.descendSpeed;
  e.vx = approach(e.vx, 0, 400 * dt);
  if (e.y >= e.hoverY) {
    e.y = e.hoverY;
    e.vy = 0;
    return true;
  }
  return false;
}

/**
 * Escolhe um ponto de patrulha no alto, deslocado na horizontal em relação
 * ao jogador: o atirador nunca fica colado nem desce até ele.
 */
export function pickHoverTarget(e: Enemy, ctx: EnemyContext): void {
  const d = rangedDef(e);
  const b = ctx.bounds;
  const side = ctx.rng.chance(0.5) ? 1 : -1;
  let tx = ctx.playerX + side * ctx.rng.range(d.minOffsetX, d.maxOffsetX);
  if (tx < b.left + d.hw + 10 || tx > b.right - d.hw - 10) tx = ctx.playerX - side * ctx.rng.range(d.minOffsetX, d.maxOffsetX);
  e.targetX = clamp(tx, b.left + d.hw + 10, b.right - d.hw - 10);
  e.hoverY = ctx.rng.range(d.hoverMinY, d.hoverMaxY);
  e.repositionTimer = d.repositionEvery * ctx.rng.range(0.7, 1.3);
}

/** Voo de patrulha: desliza até o alvo e flutua (bob) na altitude escolhida. */
export function steerHover(e: Enemy, ctx: EnemyContext, dt: number, speedScale = 1): void {
  e.repositionTimer -= dt;
  // Se o jogador chegou perto demais na horizontal, o atirador se afasta.
  const d = rangedDef(e);
  const tooClose = Math.abs(ctx.playerX - e.x) < d.minOffsetX * 0.6;
  if (e.repositionTimer <= 0 || tooClose) pickHoverTarget(e, ctx);
  const desiredVx = clamp((e.targetX - e.x) * 2.5, -d.flySpeed, d.flySpeed) * speedScale;
  e.vx = approach(e.vx, desiredVx, 600 * dt);
  const bob = Math.sin(e.age * 2.6 + e.uid) * 6;
  e.vy = clamp((e.hoverY + bob - e.y) * 4, -160, 160);
}

export function facePlayer(e: Enemy, ctx: EnemyContext): void {
  e.facing = ctx.playerX >= e.x ? 1 : -1;
}

export function gunPivot(e: Enemy): { x: number; y: number } {
  const d = rangedDef(e);
  return { x: e.x + d.gunPivot.x * e.facing, y: e.y + d.gunPivot.y };
}

export function muzzlePosition(e: Enemy): { x: number; y: number } {
  const p = gunPivot(e);
  const len = rangedDef(e).barrelLength;
  return { x: p.x + Math.cos(e.aimAngle) * len, y: p.y + Math.sin(e.aimAngle) * len };
}

export function angleToPlayer(e: Enemy, ctx: EnemyContext): number {
  const p = gunPivot(e);
  return Math.atan2(ctx.playerY - p.y, ctx.playerX - p.x);
}

/**
 * Integra a posição. Atiradores voam: sem gravidade, presos à faixa de
 * altitude e às paredes. Inimigos de chão caem com gravidade e seguem o relevo.
 * Devolve a velocidade de impacto se um inimigo de chão pousou neste passo.
 */
export function integrateEnemy(e: Enemy, bounds: ArenaBounds, groundAt: (x: number) => number, dt: number): number {
  if (e.state === 'incoming') return 0;
  e.age += dt;
  const d = e.def;
  if (d.role === 'melee' && !e.grounded) {
    e.vy = Math.min(e.vy + d.gravity * dt, d.descendSpeed);
  }
  e.x += e.vx * dt;
  e.y += e.vy * dt;
  if (e.x - d.hw < bounds.left) {
    e.x = bounds.left + d.hw;
    if (e.vx < 0) e.vx = 0;
  } else if (e.x + d.hw > bounds.right) {
    e.x = bounds.right - d.hw;
    if (e.vx > 0) e.vx = 0;
  }
  if (d.role === 'melee') {
    // Segue o relevo: o ponto mais alto sob o corpo.
    const ground = Math.min(groundAt(e.x - d.hw * 0.6), groundAt(e.x), groundAt(e.x + d.hw * 0.6));
    const feet = e.y + d.hh;
    let impact = 0;
    if (feet >= ground || (e.grounded && e.vy >= 0 && ground - feet < 12)) {
      if (!e.grounded) impact = Math.max(1, e.vy);
      e.y = ground - d.hh;
      if (e.vy > 0) e.vy = 0;
      e.grounded = true;
    } else {
      e.grounded = false;
    }
    return impact;
  }
  if (e.state !== 'descend') {
    const top = bounds.ceilingY + d.hh + 4;
    const bottom = d.hoverMaxY + 12;
    if (e.y < top) e.y = top;
    if (e.y > bottom) {
      e.y = bottom;
      if (e.vy > 0) e.vy = 0;
    }
  }
  return 0;
}
