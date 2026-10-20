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

export interface WaveConfig {
  /** Ondas roteirizadas; depois delas, `generateWave` assume. */
  scripted: WaveDef[];
  intermission: number;
  firstWaveDelay: number;
  clearBonusPerWave: number;
  maxAlive: number;
  /** Ondas de chefe fixas (ex.: 10 → Don Pombone), têm prioridade sobre as outras. */
  bossWaves?: Readonly<Record<number, WaveDef>>;
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
}

/**
 * Cópia do inimigo ajustada para a onda: vida e velocidade sobem em linha reta,
 * devagar. Sem crescimento (ou na onda 1) devolve o próprio def.
 */
export function scaleForWave(def: EnemyDef, wave: number, g: WaveGrowth | undefined): EnemyDef {
  const steps = Math.max(0, wave - 1);
  if (!g || steps === 0) return def;
  const hpMult = 1 + g.hpPerWave * steps;
  const speedMult = Math.min(g.maxSpeedMult, 1 + g.speedPerWave * steps);
  const scaled: EnemyDef & { bulletSpeed?: number; chargeSpeed?: number } = { ...def, maxHp: Math.round(def.maxHp * hpMult) };
  if ('bulletSpeed' in def) scaled.bulletSpeed = def.bulletSpeed * speedMult;
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
}

const GENERATED_CALLOUTS = [
  'RATINGS THROUGH THE ROOF!',
  'MORE EXTRAS ON SET!',
  'THE PRODUCER WANTS MORE!',
  'GOONS ON THE BLOCK!',
  'THE GANG IS HERE!',
  'WALL STREET SENT MORE YUPPIES!',
];

/**
 * Ondas além das roteirizadas: escalada lenta, um bicho a mais a cada poucas ondas.
 * Elenco por faixa (GDD §4): pombos já vêm das roteirizadas, porcos a partir da 9.
 */
export function generateWave(n: number, rng: Rng): WaveDef {
  const spawns: WaveSpawn[] = [];
  const add = (kind: EnemyKind, count: number, start: number, gapMin: number, gapMax: number) => {
    let t = start;
    for (let i = 0; i < count; i++) {
      spawns.push({ kind, delay: t, x: 'random' });
      t += rng.range(gapMin, gapMax);
    }
  };
  add('pato_pistoleiro', 2 + Math.floor(n / 4), 0, 1.4, 2.4);
  add('galinha_rambo', Math.floor((n - 2) / 4), 2.5, 4.0, 6.0);
  // Cada entrada de pombo é uma esquadrilha inteira.
  add('pombo_mafioso', n >= 6 ? Math.floor((n - 3) / 4) : 0, 4, 6.0, 8.0);
  add('porco_executivo', n >= 9 ? Math.floor((n - 5) / 4) : 0, 5, 5.0, 7.0);
  add('vaca_loca', Math.floor((n - 1) / 4), 6, 5.0, 7.0);
  return { spawns, callout: rng.pick(GENERATED_CALLOUTS) };
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
  };
}

export function beginWave(s: WaveState, cfg: WaveConfig, rng: Rng): void {
  s.wave++;
  const def =
    cfg.bossWaves?.[s.wave] ??
    (s.wave <= cfg.scripted.length ? (cfg.scripted[s.wave - 1] as WaveDef) : generateWave(s.wave, rng));
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
 * Respeita `maxAlive` adiando spawns em vez de descartá-los.
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
  while (s.queue.length > 0 && (s.queue[0] as ScheduledSpawn).at <= s.elapsed && alive < cfg.maxAlive) {
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
