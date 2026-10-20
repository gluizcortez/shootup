import type { Rng } from '../math/rng';
import type { EnemyDef, EnemyKind } from '../enemies/types';

export interface WaveSpawn {
  kind: EnemyKind;
  /** Segundos após o início da onda. */
  delay: number;
  /** Coluna de entrada no topo: 0 = esquerda, 1 = direita. */
  x: number | 'random';
}

export interface WaveDef {
  spawns: WaveSpawn[];
  /** Frase curta do narrador. */
  callout: string;
}

/**
 * Elenco das ondas comuns: quem pode aparecer a partir de qual onda e com que
 * frequência. Na onda de estreia o vilão vem garantido.
 */
export interface RosterEntry {
  kind: EnemyKind;
  /** Primeira onda em que aparece (estreia garantida nela). */
  from: number;
  /** Peso do sorteio para preencher as vagas da onda. */
  weight: number;
  /** Fração máxima da onda que este vilão pode ocupar (mínimo 1), para melee e esquadrilhas não lotarem a arena. */
  maxShare?: number;
  /** Frase do narrador na onda de estreia. */
  debutCallout?: string;
}

/** Tamanho da onda comum: `base`, +1 a cada `every` ondas, até `max`. */
export interface WaveSize {
  base: number;
  every: number;
  max: number;
}

export interface WaveConfig {
  /** Ondas comuns: X vilões (ver `size`) sorteados do elenco, TODOS entrando juntos. */
  roster: readonly RosterEntry[];
  size: WaveSize;
  intermission: number;
  firstWaveDelay: number;
  clearBonusPerWave: number;
  /** Fração da vida máxima recuperada ao limpar uma onda (0.2 = 20%, arredondado para cima). */
  clearHealFrac: number;
  /** Limite de vivos ao mesmo tempo; só vale para as entradas cronometradas das ondas de chefe. */
  maxAlive: number;
  /** Ondas de chefe fixas (ex.: 10 → Toni Mantega): entradas cronometradas, têm prioridade. */
  bossWaves?: Readonly<Record<number, WaveDef>>;
  /** Frases do narrador nas ondas comuns sem estreia. */
  callouts: readonly string[];
  /** Crescimento linear e suave dos inimigos a cada onda (onda 1 = valores base). */
  growth?: WaveGrowth;
}

export interface WaveGrowth {
  /** Fração de vida extra por onda (0.08 → onda 10 tem 1,72× a vida base). */
  hpPerWave: number;
  /** Fração de velocidade extra por onda (balas e investidas). */
  speedPerWave: number;
  /** Teto do multiplicador de velocidade. */
  maxSpeedMult: number;
  /** Fração de dano extra por onda (balas, contato e ondas de choque), arredondado. */
  damagePerWave: number;
}

/**
 * Cópia do inimigo ajustada para a onda: vida, dano e velocidade sobem em linha reta,
 * devagar. Sem crescimento (ou na onda 1) devolve o próprio def.
 */
export function scaleForWave(def: EnemyDef, wave: number, g: WaveGrowth | undefined): EnemyDef {
  const steps = Math.max(0, wave - 1);
  if (!g || steps === 0) return def;
  const hpMult = 1 + g.hpPerWave * steps;
  const speedMult = Math.min(g.maxSpeedMult, 1 + g.speedPerWave * steps);
  const maxHp = def.fixedHp ? def.maxHp : Math.round(def.maxHp * hpMult);
  const dmgMult = 1 + g.damagePerWave * steps;
  const dmg = (v: number): number => (v > 0 ? Math.max(1, Math.round(v * dmgMult)) : 0);
  const scaled: EnemyDef & { bulletSpeed?: number; chargeSpeed?: number; bulletDamage?: number; shockDamage?: number } = {
    ...def,
    maxHp,
    contactDamage: dmg(def.contactDamage),
  };
  if ('bulletSpeed' in def) scaled.bulletSpeed = def.bulletSpeed * speedMult;
  if ('bulletDamage' in def) scaled.bulletDamage = dmg(def.bulletDamage);
  if ('shockDamage' in def) scaled.shockDamage = dmg(def.shockDamage);
  if (def.behaviour === 'vaca') scaled.chargeSpeed = def.chargeSpeed * speedMult;
  return scaled;
}

export interface ScheduledSpawn {
  kind: EnemyKind;
  at: number;
  x: number;
}

export type WavePhase = 'intermission' | 'active';

export interface WaveState {
  wave: number;
  phase: WavePhase;
  timer: number;
  elapsed: number;
  queue: ScheduledSpawn[];
  total: number;
  spawned: number;
  callout: string;
  /** Onda de chefe: entradas cronometradas e sujeitas a `maxAlive`. */
  boss: boolean;
}

/** Quantos deste vilão cabem numa onda de `total` (sem `maxShare`, sem teto). */
export function maxCount(r: RosterEntry, total: number): number {
  return r.maxShare === undefined ? total : Math.max(1, Math.floor(total * r.maxShare));
}

/** Quantos vilões a onda comum `n` traz. */
export function waveSize(n: number, size: WaveSize): number {
  return Math.max(1, Math.min(size.max, size.base + Math.floor((n - 1) / size.every)));
}

/**
 * Onda comum `n`: exatamente `waveSize(n)` vilões, todos com `delay` 0 (entram
 * juntos), em colunas espalhadas pela largura. Estreias da onda vêm primeiro;
 * o resto é sorteado por peso entre os já liberados, respeitando `maxShare`.
 * Uma esquadrilha de ninjas conta como 1 vilão.
 */
export function generateWave(n: number, cfg: WaveConfig, rng: Rng): WaveDef {
  const total = waveSize(n, cfg.size);
  const unlocked = cfg.roster.filter((r) => r.from <= n);
  const counts = new Map<EnemyKind, number>();
  const kinds: EnemyKind[] = [];
  const push = (kind: EnemyKind) => {
    kinds.push(kind);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  };
  const debuts = unlocked.filter((r) => r.from === n);
  for (const r of debuts) if (kinds.length < total) push(r.kind);
  while (kinds.length < total) {
    const open = unlocked.filter((r) => r.maxShare === undefined || (counts.get(r.kind) ?? 0) < maxCount(r, total));
    if (open.length === 0) break;
    let roll = rng.range(0, open.reduce((sum, r) => sum + r.weight, 0));
    let pick = open[open.length - 1] as RosterEntry;
    for (const r of open) {
      roll -= r.weight;
      if (roll <= 0) {
        pick = r;
        break;
      }
    }
    push(pick.kind);
  }
  // Embaralha para as estreias não caírem sempre na mesma ponta.
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rng.range(0, i + 1));
    [kinds[i], kinds[j]] = [kinds[j] as EnemyKind, kinds[i] as EnemyKind];
  }
  const spawns: WaveSpawn[] = kinds.map((kind, i) => ({
    kind,
    delay: 0,
    x: Math.min(0.97, Math.max(0.03, (i + 0.5) / kinds.length + rng.range(-0.03, 0.03))),
  }));
  const debut = debuts.find((r) => r.debutCallout);
  return { spawns, callout: debut?.debutCallout ?? rng.pick(cfg.callouts) };
}

export function createWaveState(cfg: WaveConfig): WaveState {
  return {
    wave: 0,
    phase: 'intermission',
    timer: cfg.firstWaveDelay,
    elapsed: 0,
    queue: [],
    total: 0,
    spawned: 0,
    callout: '',
    boss: false,
  };
}

export function beginWave(s: WaveState, cfg: WaveConfig, rng: Rng): void {
  s.wave++;
  const bossDef = cfg.bossWaves?.[s.wave];
  s.boss = bossDef !== undefined;
  const def = bossDef ?? generateWave(s.wave, cfg, rng);
  s.queue = def.spawns
    .map((sp) => ({
      kind: sp.kind,
      at: sp.delay,
      x: sp.x === 'random' ? rng.range(0.05, 0.95) : sp.x,
    }))
    .sort((a, b) => a.at - b.at) as ScheduledSpawn[];
  s.total = s.queue.length;
  s.spawned = 0;
  s.elapsed = 0;
  s.phase = 'active';
  s.callout = def.callout;
}

export type WaveTickResult = 'none' | 'started' | 'cleared';

/**
 * Avança a onda. `spawn` é chamado para cada inimigo que deve entrar agora.
 * Onda comum: todos entram de uma vez. Onda de chefe: respeita `maxAlive`
 * adiando os reforços em vez de descartá-los.
 */
export function tickWaves(
  s: WaveState,
  cfg: WaveConfig,
  rng: Rng,
  aliveCount: number,
  dt: number,
  spawn: (kind: EnemyKind, xNorm: number) => void,
): WaveTickResult {
  if (s.phase === 'intermission') {
    s.timer -= dt;
    if (s.timer <= 0) {
      beginWave(s, cfg, rng);
      return 'started';
    }
    return 'none';
  }

  s.elapsed += dt;
  let alive = aliveCount;
  while (s.queue.length > 0 && (s.queue[0] as ScheduledSpawn).at <= s.elapsed && (!s.boss || alive < cfg.maxAlive)) {
    const next = s.queue.shift() as ScheduledSpawn;
    spawn(next.kind, next.x);
    s.spawned++;
    alive++;
  }
  if (s.queue.length === 0 && alive === 0) {
    s.phase = 'intermission';
    s.timer = cfg.intermission;
    return 'cleared';
  }
  return 'none';
}
