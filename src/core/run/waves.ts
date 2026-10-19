import type { Rng } from '../math/rng';
import type { EnemyKind } from '../enemies/types';

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
  'AUDIÊNCIA EM ALTA!',
  'MAIS PENAS NO PALCO!',
  'O PRODUTOR PEDIU MAIS!',
  'PATOS NA ÁREA!',
  'A FAMÍLIA CHEGOU!',
  'O RH MANDOU MAIS PORCOS!',
];

/**
 * Ondas além das roteirizadas: escalada simples, só para o protótipo.
 * Elenco por faixa (GDD §4): pombos a partir da 4, porcos a partir da 7.
 */
export function generateWave(n: number, rng: Rng): WaveDef {
  const patos = 2 + Math.floor(n * 0.6);
  const galinhas = Math.floor((n - 1) / 2);
  const spawns: WaveSpawn[] = [];
  let t = 0;
  for (let i = 0; i < patos; i++) {
    spawns.push({ kind: 'pato_pistoleiro', delay: t, x: 'random' });
    t += rng.range(0.6, 1.4);
  }
  let g = 1.5;
  for (let i = 0; i < galinhas; i++) {
    spawns.push({ kind: 'galinha_rambo', delay: g, x: 'random' });
    g += rng.range(2.0, 3.5);
  }
  // Cada entrada de pombo é uma esquadrilha inteira.
  let s = 2;
  for (let i = 0; i < (n >= 4 ? Math.floor((n - 2) / 2) : 0); i++) {
    spawns.push({ kind: 'pombo_mafioso', delay: s, x: 'random' });
    s += rng.range(4.0, 6.0);
  }
  let pc = 2.5;
  for (let i = 0; i < (n >= 7 ? Math.floor((n - 5) / 2) : 0); i++) {
    spawns.push({ kind: 'porco_executivo', delay: pc, x: 'random' });
    pc += rng.range(3.5, 5.0);
  }
  let v = 3;
  for (let i = 0; i < Math.floor(n / 3); i++) {
    spawns.push({ kind: 'vaca_loca', delay: v, x: 'random' });
    v += rng.range(3.0, 5.0);
  }
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
