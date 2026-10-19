import type { EnemyKind, EnemyStateName } from '../enemies/types';
import type { Team } from '../combat/projectiles';

/**
 * Eventos emitidos pela simulação. VFX, áudio e HUD reagem a eles;
 * nenhum deles altera dano ou física, então reduzir efeitos não muda o jogo.
 */
export type GameEvent =
  | { type: 'shot'; x: number; y: number; angle: number; weaponId: string }
  | { type: 'enemyHit'; uid: number; kind: EnemyKind; x: number; y: number; damage: number; crit: boolean; dirX: number; dirY: number }
  | { type: 'enemyKilled'; uid: number; kind: EnemyKind; x: number; y: number; score: number; combo: number; multiplier: number; crit: boolean }
  | { type: 'enemyIncoming'; uid: number; kind: EnemyKind; x: number; warn: number }
  | { type: 'enemyTelegraph'; uid: number; kind: EnemyKind; state: EnemyStateName; duration: number }
  | { type: 'enemyShot'; uid: number; kind: EnemyKind; x: number; y: number; angle: number }
  | { type: 'projectileImpact'; x: number; y: number; team: Team; angle: number }
  | { type: 'playerJumped'; x: number; y: number }
  | { type: 'playerLanded'; x: number; y: number; speed: number }
  | { type: 'playerHurt'; x: number; y: number; hp: number; damage: number }
  | { type: 'playerDied'; x: number; y: number }
  | { type: 'comboBroken'; count: number }
  | { type: 'waveStarted'; wave: number; total: number; callout: string }
  | { type: 'waveCleared'; wave: number; bonus: number }
  | { type: 'enemyLanded'; uid: number; kind: EnemyKind; x: number; y: number; speed: number }
  | { type: 'enemyCharge'; uid: number; kind: EnemyKind; x: number; y: number; dir: number }
  | { type: 'enemyStunned'; uid: number; kind: EnemyKind; x: number; y: number }
  | { type: 'ricochet'; x: number; y: number; angle: number }
  | { type: 'upgradeOffer'; wave: number; cards: readonly string[] }
  | { type: 'upgradePicked'; id: string; stacks: number };

export type GameEventType = GameEvent['type'];
