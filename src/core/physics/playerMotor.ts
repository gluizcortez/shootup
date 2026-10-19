import { approach, sign } from '../math/scalar';
import type { Terrain } from './terrain';

/**
 * Parâmetros de movimento do jogador. Todos em pixels e segundos.
 * Os valores ficam em `game/data/player.ts`; aqui só a forma.
 */
export interface MotorTuning {
  runSpeed: number;
  groundAccel: number;
  groundDecel: number;
  airAccel: number;
  airDecel: number;
  /** Multiplicador de aceleração ao inverter direção (vira mais rápido). */
  turnBoost: number;
  jumpVelocity: number;
  gravity: number;
  /** Gravidade extra ao cair: queda mais pesada que a subida. */
  fallGravityMult: number;
  /** Gravidade extra se o botão de pulo é solto na subida (pulo variável). */
  jumpCutGravityMult: number;
  /** Abaixo desta |vy| perto do ápice, a gravidade é reduzida (hang time). */
  apexThreshold: number;
  apexGravityMult: number;
  maxFallSpeed: number;
  /** Janela após sair do chão em que o pulo ainda vale. */
  coyoteTime: number;
  /** Janela antes de tocar o chão em que um pulo apertado é lembrado. */
  jumpBuffer: number;
}

export interface ArenaBounds {
  left: number;
  right: number;
  /** Nível base do chão (o relevo sobe a partir dele; veja Terrain). */
  floorY: number;
  ceilingY: number;
}

/** Quanto o motor "gruda" no chão ao descer rampas andando (px por passo). */
const SNAP_DOWN = 10;

export interface MotorState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hw: number;
  hh: number;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  /** Eventos do último passo, lidos pelo World. */
  justJumped: boolean;
  justLanded: boolean;
  landingSpeed: number;
}

export interface MotorInput {
  /** -1..1 */
  moveX: number;
  /** Borda de subida do botão de pulo neste passo. */
  jumpPressed: boolean;
  jumpHeld: boolean;
}

export function createMotor(x: number, y: number, hw: number, hh: number): MotorState {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    hw,
    hh,
    grounded: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    justJumped: false,
    justLanded: false,
    landingSpeed: 0,
  };
}

/** Avança o motor um passo fixo `dt` sobre o relevo `terrain`. Muta `s`. */
export function stepMotor(
  s: MotorState,
  input: MotorInput,
  t: MotorTuning,
  bounds: ArenaBounds,
  terrain: Terrain,
  dt: number,
): void {
  const wasGrounded = s.grounded;
  s.justJumped = false;
  s.justLanded = false;

  // Buffer de pulo e coyote time.
  s.jumpBufferTimer = input.jumpPressed ? t.jumpBuffer : Math.max(0, s.jumpBufferTimer - dt);
  s.coyoteTimer = s.grounded ? t.coyoteTime : Math.max(0, s.coyoteTimer - dt);

  // Horizontal: aceleração/desaceleração distintas no chão e no ar.
  const move = Math.max(-1, Math.min(1, input.moveX));
  const target = move * t.runSpeed;
  let accel: number;
  if (move !== 0) {
    accel = s.grounded ? t.groundAccel : t.airAccel;
    if (s.vx !== 0 && sign(s.vx) !== sign(move)) accel *= t.turnBoost;
  } else {
    accel = s.grounded ? t.groundDecel : t.airDecel;
  }
  s.vx = approach(s.vx, target, accel * dt);

  // Pulo.
  if (s.jumpBufferTimer > 0 && s.coyoteTimer > 0) {
    s.vy = -t.jumpVelocity;
    s.grounded = false;
    s.jumpBufferTimer = 0;
    s.coyoteTimer = 0;
    s.justJumped = true;
  }

  // Gravidade com queda pesada, pulo variável e ápice suave.
  if (!s.grounded) {
    let g = t.gravity;
    if (s.vy > 0) g *= t.fallGravityMult;
    else if (s.vy < 0 && !input.jumpHeld) g *= t.jumpCutGravityMult;
    if (Math.abs(s.vy) < t.apexThreshold && input.jumpHeld) g *= t.apexGravityMult;
    s.vy = Math.min(s.vy + g * dt, t.maxFallSpeed);
  }

  s.x += s.vx * dt;
  s.y += s.vy * dt;

  // Paredes da arena.
  if (s.x - s.hw < bounds.left) {
    s.x = bounds.left + s.hw;
    if (s.vx < 0) s.vx = 0;
  } else if (s.x + s.hw > bounds.right) {
    s.x = bounds.right - s.hw;
    if (s.vx > 0) s.vx = 0;
  }
  if (s.y - s.hh < bounds.ceilingY) {
    s.y = bounds.ceilingY + s.hh;
    if (s.vy < 0) s.vy = 0;
  }

  // Chão com relevo: sobe rampas andando, gruda ao descer, pousa em qualquer altura.
  const ground = terrain.groundUnder(s.x, s.hw * 0.6);
  const feet = s.y + s.hh;
  const snapping = wasGrounded && !s.justJumped && s.vy >= 0 && ground - feet <= SNAP_DOWN;
  if (feet >= ground || snapping) {
    s.y = ground - s.hh;
    if (!wasGrounded) {
      s.justLanded = true;
      s.landingSpeed = Math.max(0, s.vy);
    }
    if (s.vy > 0) s.vy = 0;
    s.grounded = true;
  } else {
    s.grounded = false;
  }
}
