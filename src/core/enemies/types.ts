import type { Rng } from '../math/rng';
import type { ArenaBounds } from '../physics/playerMotor';

export type EnemyKind =
  | 'pato_pistoleiro'
  | 'galinha_rambo'
  | 'vaca_loca'
  | 'pombo_mafioso'
  | 'porco_executivo'
  | 'don_pombone'
  | 'maromba_vice'
  | 'patinador_assassino'
  | 'policial_corrupto';

/**
 * Papel tático (estrutura do Seraph's Last Stand):
 * - `ranged`: entra pelo topo e fica PAIRANDO no alto, atirando para baixo. Nunca se aproxima do jogador.
 * - `melee`: anda no chão e é o único tipo que vem até o jogador (ex.: Vaca Loca).
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
  /** Dano ao encostar no jogador (só vale para `melee`). */
  contactDamage: number;
  /** Fator aplicado ao knockback recebido (1 = normal, <1 = mais pesado). */
  knockbackScale: number;
  /** Tempo do aviso no topo da tela antes de o animal aparecer. */
  warnTime: number;
  /** Velocidade da descida do topo (atiradores) ou de queda máxima (melee). */
  descendSpeed: number;
  /** Chefe: barra de vida própria no HUD. */
  boss?: boolean;
}

/** Atirador que paira no alto. */
interface RangedDef extends EnemyBaseDef {
  role: 'ranged';
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

export interface PatoDef extends RangedDef {
  behaviour: 'pato';
  /** Duração da pose dramática antes do tiro (telegraph). */
  aimTime: number;
  recoverTime: number;
  shotCooldown: number;
}

export interface GalinhaDef extends RangedDef {
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

/**
 * Vaca Loca (melee): cai do topo, bate o casco (aviso) e investe em linha reta
 * pelo chão; ao bater na parede fica tonta e vulnerável.
 */
export interface VacaDef extends EnemyBaseDef {
  role: 'melee';
  behaviour: 'vaca';
  gravity: number;
  /** Duração do "bater casco" antes da investida (telegraph). */
  stompTime: number;
  chargeSpeed: number;
  chargeAccel: number;
  /** Tempo tonta depois de bater na parede. */
  dizzyTime: number;
  /** Respiro no chão entre investidas que não bateram em parede. */
  restTime: number;
  /** Multiplicador de dano recebido enquanto está tonta. */
  dizzyDamageMult: number;
  /** A investida termina sozinha depois de passar o jogador por esta distância. */
  overshoot: number;
}

/**
 * Pombo Mafioso: entra em esquadrilha (bando de `squadSize`) em formação V.
 * O líder patrulha e decide; o bando muda de direção junto e solta salvas
 * sincronizadas depois de um assobio (telegraph).
 */
export interface PomboDef extends RangedDef {
  behaviour: 'pombo';
  squadSize: number;
  /** Deslocamento de cada posição da formação em relação ao líder. */
  formation: ReadonlyArray<{ x: number; y: number }>;
  aimTime: number;
  volleyCount: number;
  volleyInterval: number;
  volleyCooldown: number;
  recoverTime: number;
}

/**
 * Porco Executivo (suporte): voa de hélice de ventilador no chapéu, joga um
 * leque de moedas e, de tempos em tempos, convoca uma "REUNIÃO URGENTE" que
 * dá escudo (seguro corporativo) aos animais próximos.
 */
export interface PorcoDef extends RangedDef {
  behaviour: 'porco';
  aimTime: number;
  coinCount: number;
  coinSpreadDeg: number;
  recoverTime: number;
  shotCooldown: number;
  buffEvery: number;
  /** Duração do aviso da reunião. */
  buffTime: number;
  buffRadius: number;
  buffTargets: number;
  shieldAmount: number;
  shieldMax: number;
}

/**
 * Don Pombone (chefe da onda 10): pombo gigante de sobretudo branco. Anuncia
 * cada ataque batendo as asas. Ataques: convocar esquadrilha, rajada em V e
 * varredura. Abaixo de `phase2At` da vida fica mais rápido e dobra o V.
 */
export interface PomboneDef extends RangedDef {
  behaviour: 'pombone';
  boss: true;
  telegraphTime: number;
  telegraphTimePhase2: number;
  cooldown: number;
  cooldownPhase2: number;
  phase2At: number;
  vCount: number;
  vSpreadDeg: number;
  /** Quanto cada bala mais aberta do V é mais lenta (forma a ponta da flecha). */
  vSpeedFalloff: number;
  sweepCount: number;
  sweepTime: number;
  /** Ângulos (graus) de início e fim da varredura, medidos no mundo. */
  sweepFromDeg: number;
  sweepToDeg: number;
  /** Não convoca mais pombos se já houver este tanto vivo. */
  summonMaxPombos: number;
}

/**
 * Maromba Miami Vice (melee): cai do topo feito um piano e, depois de pousar,
 * fica plantado no chão só mostrando os muques. Não anda nem ataca: é um
 * obstáculo vivo que machuca quem encosta nele.
 */
export interface MarombaDef extends EnemyBaseDef {
  role: 'melee';
  behaviour: 'maromba';
  gravity: number;
  /** Segundos em cada pose de fisiculturismo (só muda o visual). */
  poseTime: number;
}

/**
 * Patinador Assassino (atirador): patina no ar de patins a jato, bem ágil.
 * Agacha (telegraph) e atravessa por cima do jogador num "drive-by", soltando
 * uma fileira de tiros mirados durante a passada. Fica sempre no alto.
 */
export interface PatinadorDef extends RangedDef {
  behaviour: 'patinador';
  /** Agachamento antes da passada (telegraph). */
  crouchTime: number;
  dashSpeed: number;
  dashAccel: number;
  /** A passada termina esta distância depois do ponto em que o jogador estava. */
  dashOvershoot: number;
  dashFireInterval: number;
  dashShots: number;
  dashSpreadDeg: number;
  recoverTime: number;
  attackCooldown: number;
}

/**
 * Policial de Miami Corrupto (atirador): mira com laser vermelho que segue o
 * jogador e trava no fim do aviso; então dá dois tiros rápidos ("double tap")
 * ao longo da linha travada. Fica sempre no alto.
 */
export interface PolicialDef extends RangedDef {
  behaviour: 'policial';
  aimTime: number;
  /** Fração final da mira em que o laser já está travado (janela para sair da linha). */
  aimLockFraction: number;
  shots: number;
  shotGap: number;
  recoverTime: number;
  shotCooldown: number;
}

export type EnemyDef =
  | PatoDef
  | GalinhaDef
  | VacaDef
  | PomboDef
  | PorcoDef
  | PomboneDef
  | MarombaDef
  | PatinadorDef
  | PolicialDef;
export type RangedEnemyDef = PatoDef | GalinhaDef | PomboDef | PorcoDef | PomboneDef | PatinadorDef | PolicialDef;

/** Ataques do chefe (índice em `Enemy.attack`). */
export const POMBONE_ATTACKS = ['summon', 'vshot', 'sweep'] as const;
export type PomboneAttack = (typeof POMBONE_ATTACKS)[number];

export type EnemyStateName =
  | 'incoming'
  | 'descend'
  | 'hover'
  | 'aim'
  | 'recover'
  | 'spinup'
  | 'burst'
  | 'cooldown'
  | 'stomp'
  | 'charge'
  | 'dizzy'
  | 'rest'
  | 'buff'
  | 'flex'
  | 'crouch'
  | 'dash';

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
  /** Só para inimigos de chão. */
  grounded: boolean;
  /** Direção travada da investida (-1/1). */
  chargeDir: -1 | 1;
  /** Esquadrilha (0 = sozinho) e posição na formação. */
  squadId: number;
  squadSlot: number;
  /** Escudo que absorve dano antes da vida (dado pelo Porco Executivo). */
  shield: number;
  /** Ataque escolhido (chefe) ou contador genérico. */
  attack: number;
  /** Chefe: já entrou na segunda fase? */
  enraged: boolean;
  /** Timer secundário (ex.: próxima reunião do porco). */
  altTimer: number;
  /** Sangramento (carta Vampiresco): segundos restantes, dano por tick, intervalo e próximo tick. */
  bleedTime: number;
  bleedDamage: number;
  bleedInterval: number;
  bleedTick: number;
  alive: boolean;
}

/** O que a IA pode pedir ao mundo. Mantém a IA pura e testável. */
export interface EnemyContext {
  readonly playerX: number;
  readonly playerY: number;
  readonly bounds: ArenaBounds;
  readonly rng: Rng;
  /** Todos os inimigos vivos (esquadrilhas, buffs). Não mutar a lista. */
  readonly enemies: readonly Enemy[];
  groundAt(x: number): number;
  /** Dispara uma bala da boca da arma; `speedScale` multiplica a velocidade. */
  fire(e: Enemy, angle: number, speedScale?: number): void;
  telegraph(e: Enemy, duration: number): void;
  /** Anuncia um novo animal no topo (chefe convocando reforços). */
  summon(kind: EnemyKind, xNorm: number): void;
  /** Escudo aplicado em `targets` por `source` (só para efeitos visuais/sonoros). */
  buffed(source: Enemy, targets: readonly Enemy[]): void;
  /** Chefe entrou na segunda fase. */
  enraged(e: Enemy): void;
}
