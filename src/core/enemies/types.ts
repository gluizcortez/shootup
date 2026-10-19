import type { Rng } from '../math/rng';
import type { ArenaBounds } from '../physics/playerMotor';

export type EnemyKind = 'pato_pistoleiro' | 'galinha_rambo';

/**
 * Papel tático (estrutura do Seraph's Last Stand):
 * - `ranged`: entra pelo topo e fica PAIRANDO no alto, atirando para baixo. Nunca se aproxima do jogador.
 * - `melee`: o único tipo que vem até o jogador (ainda nenhum na Fase 0).
 */
export type EnemyRole = 'ranged' | 'melee';

interface EnemyBaseDef {
  id: EnemyKind;
  name: string;
  role: EnemyRole;
  maxHp: number;
  /** Hitbox real (meias-medidas), documentada e separada do visual. */
  hw: number;
  hh: number;
  score: number;
  contactDamage: number;
  /** Fator aplicado ao knockback recebido (1 = normal, <1 = mais pesado). */
  knockbackScale: number;
  /** Tempo do aviso no topo da tela antes de o animal aparecer. */
  warnTime: number;
  /** Velocidade da descida do topo até a altitude de patrulha. */
  descendSpeed: number;
  /** Faixa de altitude (y do centro) onde o animal patrulha. Sempre longe do chão. */
  hoverMinY: number;
  hoverMaxY: number;
  /** Velocidade horizontal máxima ao reposicionar no alto. */
  flySpeed: number;
  /** Distância horizontal mínima/máxima que tenta manter do jogador (nunca fica colado). */
  minOffsetX: number;
  maxOffsetX: number;
  /** Segundos entre trocas de posição de patrulha. */
  repositionEvery: number;
  bulletSpeed: number;
  bulletRadius: number;
  bulletDamage: number;
  bulletLifetime: number;
  /** Ombro/pivô da arma relativo ao centro, com o animal virado para a direita. */
  gunPivot: { x: number; y: number };
  /** Distância do pivô até a boca do cano. */
  barrelLength: number;
}

export interface PatoDef extends EnemyBaseDef {
  behaviour: 'pato';
  /** Duração da pose dramática antes do tiro (telegraph). */
  aimTime: number;
  recoverTime: number;
  shotCooldown: number;
}

export interface GalinhaDef extends EnemyBaseDef {
  behaviour: 'galinha';
  /** Cano girando antes da rajada (telegraph). A mira trava no fim do aviso. */
  spinUpTime: number;
  /** Fração final do aviso em que a mira já está travada (janela para esquivar). */
  aimLockFraction: number;
  burstCount: number;
  burstInterval: number;
  burstSpreadDeg: number;
  /** Empurrão para trás a cada disparo da rajada. */
  recoilImpulse: number;
  cooldown: number;
}

export type EnemyDef = PatoDef | GalinhaDef;

export type EnemyStateName = 'incoming' | 'descend' | 'hover' | 'aim' | 'recover' | 'spinup' | 'burst' | 'cooldown';

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
  facing: 1 | -1;
  state: EnemyStateName;
  stateTimer: number;
  /** Relógio próprio (balanço, bob). */
  age: number;
  /** Alvo de patrulha no alto. */
  targetX: number;
  hoverY: number;
  repositionTimer: number;
  shotCooldown: number;
  burstLeft: number;
  burstTimer: number;
  /** Ângulo da arma no mundo (lido pela renderização). */
  aimAngle: number;
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
