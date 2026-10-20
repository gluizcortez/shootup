import type { EnemyKind, EnemyStateName } from '@/core/enemies/types';

/**
 * Quadros de rosto/corpo dos vilões atiradores. Cada corpo do atlas `cast`
 * existe na base (`<key>`) e nas variantes `<key>_b` (respiração), `_blink`,
 * `_aim`, `_shoot`, `_hurt` e `_dead` (gerados por tools/sprites).
 */
export type EnemyFace = '' | '_b' | '_blink' | '_aim' | '_shoot' | '_hurt' | '_dead';

export const ENEMY_FACES: readonly EnemyFace[] = ['', '_b', '_blink', '_aim', '_shoot', '_hurt', '_dead'];

/** Textura-base do corpo de cada atirador (só esses têm quadros de rosto). */
export const BODY_KEY: Partial<Record<EnemyKind, string>> = {
  pato_pistoleiro: 'pato_body',
  galinha_rambo: 'galinha_body',
  pombo_mafioso: 'pombo_body',
  porco_executivo: 'porco_body',
  don_pombone: 'pombone_body',
  patinador_assassino: 'patinador_body',
  policial_corrupto: 'policial_body',
  dj_neon: 'dj_body',
  magico_vegas: 'magico_body',
  vendedor_tv: 'vendedor_body',
  // Lutadores de chão só têm o quadro `_dead` (o cadáver); a passada fica no BrawlerView.
  breaker_boombox: 'breaker_body',
  lutador_mamute: 'lutador_body',
};

const AIM_STATES: ReadonlySet<EnemyStateName> = new Set(['aim', 'spinup', 'buff', 'crouch', 'dash']);

/** Tempo do ciclo de respiração e intervalo médio entre piscadas (s). */
const BREATH = 1.1;
const BLINK_EVERY = 3.3;
const BLINK_LEN = 0.12;

export interface FaceInput {
  state: EnemyStateName;
  /** Segundos de careta de dor restantes. */
  hurt: number;
  /** Coice do último tiro (1 → 0). */
  shotKick: number;
  /** Relógio local do visual (s). */
  time: number;
  /** Desfasa a respiração/piscada entre inimigos iguais. */
  seed: number;
}

/** Escolhe o quadro: dor > tiro > mira > respiração com piscadas. */
export function pickEnemyFace(f: FaceInput): EnemyFace {
  if (f.hurt > 0) return '_hurt';
  if (f.shotKick > 0.3 || f.state === 'burst') return '_shoot';
  if (AIM_STATES.has(f.state)) return '_aim';
  const t = f.time + f.seed * 0.37;
  if (t % BLINK_EVERY < BLINK_LEN) return '_blink';
  return t % BREATH < BREATH / 2 ? '' : '_b';
}
