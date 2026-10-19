/**
 * Atributos que as cartas podem alterar. Todos numéricos; os inteiros
 * (projéteis por tiro, perfuração, ricochete, vida) são arredondados para
 * baixo depois do cálculo.
 */
export type StatKey =
  | 'fireInterval'
  | 'pellets'
  | 'spreadDeg'
  | 'damage'
  | 'critChance'
  | 'critMultiplier'
  | 'projectileSpeed'
  | 'pierce'
  | 'ricochet'
  | 'runSpeed'
  | 'jumpVelocity'
  | 'maxHp';

export type Stats = Record<StatKey, number>;

export type Rarity = 'comum' | 'incomum' | 'raro' | 'epico';
export type Branch = 'balistica' | 'caos' | 'sobrevivencia';

/** `add` soma `value` por stack; `mul` multiplica por `value` a cada stack. */
export interface Modifier {
  stat: StatKey;
  op: 'add' | 'mul';
  value: number;
}

export interface UpgradeDef {
  /** ID estável (salvo em runs e replays; nunca renomear). */
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  branch: Branch;
  tags: readonly string[];
  /** Limite de stacks; sem valor = acumula infinitamente. */
  maxStacks?: number;
  /** Todas precisam estar na mão para a carta aparecer. */
  prerequisites: readonly string[];
  /** Nenhuma pode estar na mão para a carta aparecer. */
  exclusions: readonly string[];
  modifiers: readonly Modifier[];
  /** Efeito imediato ao escolher (ex.: curar). */
  onPick?: { heal?: number };
  /** Habilidade especial (cartas épicas). Fica dourada ao chegar em `goldenAt` stacks. */
  effect?: UpgradeEffect;
}

export type UpgradeEffect =
  | {
      /** Inimigo abatido explode em projéteis do jogador. */
      kind: 'explode';
      /** Projéteis com 1 stack; cada stack extra soma `perStack`. */
      baseCount: number;
      perStack: number;
      /** Fração do dano da arma por projétil (normal e dourada). */
      damageFrac: number;
      goldenDamageFrac: number;
      goldenAt: number;
      /** Velocidade como fração da velocidade da bala da arma. */
      speedFrac: number;
      lifetime: number;
    }
  | {
      /** Acertos aplicam sangramento: `damagePerStack` × stacks a cada tick. */
      kind: 'bleed';
      damagePerStack: number;
      /** Segundos de sangramento após o último acerto. */
      duration: number;
      tickInterval: number;
      goldenTickInterval: number;
      goldenAt: number;
    };

export interface StatClamp {
  min: number;
  max: number;
}

/** Cartas na mão: id → quantidade de stacks. */
export type Owned = ReadonlyMap<string, number>;
