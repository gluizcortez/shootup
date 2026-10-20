import type { PlayerConfig } from '@/core/run/world';

/**
 * Tuning do competidor. Valores pensados para resposta imediata:
 * ~0.09 s para atingir velocidade máxima, virada rápida, pulo de ~140 px
 * com subida leve e queda pesada.
 */
export const PLAYER: PlayerConfig = {
  hw: 12,
  hh: 22,
  /** Vida numérica (barra). Tiros comuns tiram 8 na onda 1. */
  maxHp: 40,
  invulnTime: 1.0,
  hurtKnockbackX: 320,
  hurtKnockbackY: 330,
  shoulder: { x: 3, y: -19 },
  motor: {
    runSpeed: 300,
    groundAccel: 3400,
    groundDecel: 4200,
    airAccel: 2400,
    airDecel: 900,
    turnBoost: 1.6,
    jumpVelocity: 720,
    gravity: 1850,
    fallGravityMult: 1.65,
    jumpCutGravityMult: 2.6,
    apexThreshold: 80,
    apexGravityMult: 0.55,
    maxFallSpeed: 1000,
    coyoteTime: 0.1,
    jumpBuffer: 0.12,
  },
};
