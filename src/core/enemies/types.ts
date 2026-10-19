import type { Rng } from '../math/rng';
import type { ArenaBounds } from '../physics/playerMotor';

export type EnemyKind = 'pato_pistoleiro' | 'galinha_rambo';

interface EnemyBaseDef {
  id: EnemyKind;
  name: string;
  maxHp: number;
  /** Hitbox real (meias-medidas), documentada e separada do visual. */
  hw: number;
  hh: number;
  score: number;
  contactDamage: number;
  gravity: number;
  /** Fator aplicado ao knockback recebido (1 = normal, <1 = mais pesado). */
  knockbackScale: number;
  groundFriction: number;
  entrySpeed: number;
  bulletSpeed: number;
  bulletRadius: number;
  bulletDamage: number;
  bulletLifetime: number;
  /** Posição da boca da arma relativa ao centro, com o animal virado para a direita. */
  muzzle: { x: number; y: number };
}

export interface PatoDef extends EnemyBaseDef {
  behaviour: 'pato';
  hopSpeedX: number;
  hopSpeedY: number;
  hopPause: number;
  minRange: number;
  maxRange: number;
  /** Duração da pose dramática antes do tiro (telegraph). */
  aimTime: number;
  recoverTime: number;
  shotCooldown: number;
}

export interface GalinhaDef extends EnemyBaseDef {
  behaviour: 'galinha';
  walkSpeed: number;
  preferredRange: number;
  rangeTolerance: number;
  /** Cano girando antes da rajada (telegraph). */
  spinUpTime: number;
  burstCount: number;
  burstInterval: number;
  burstSpreadDeg: number;
  /** Empurrão para trás a cada disparo da rajada. */
  recoilImpulse: number;
  cooldown: number;
}

export type EnemyDef = PatoDef | GalinhaDef;

export type EnemyStateName =
  | 'enter'
  | 'approach'
  | 'aim'
  | 'recover'
  | 'position'
  | 'spinup'
  | 'burst'
  | 'cooldown';

export interface Enemy {
  uid: number;
  def: EnemyDef;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  hp: number;
  grounded: boolean;
  facing: 1 | -1;
  state: EnemyStateName;
  stateTimer: number;
  hopTimer: number;
  shotCooldown: number;
  burstLeft: number;
  burstTimer: number;
  alive: boolean;
}

/** O que a IA pode pedir ao mundo. Mantém a IA pura e testável. */
export interface EnemyContext {
  readonly playerX: number;
  readonly playerY: number;
  readonly bounds: ArenaBounds;
  readonly rng: Rng;
  fire(e: Enemy, angle: number): void;
  telegraph(e: Enemy, duration: number): void;
}
