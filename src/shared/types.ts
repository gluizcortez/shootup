import type { RunPhase } from '@/core/run/runPhase';
import type { Settings } from './settings';

/** Snapshot de baixa frequência para o HUD React. Só é emitido quando muda. */
export interface HudSnapshot {
  wave: number;
  waveRemaining: number;
  waveTotal: number;
  score: number;
  combo: number;
  multiplier: number;
  hp: number;
  maxHp: number;
  weaponName: string;
}

export interface RunSummary {
  wave: number;
  score: number;
  kills: number;
  bestCombo: number;
  accuracy: number;
  timeSeconds: number;
  weaponName: string;
  debugTainted: boolean;
}

/** Carta como a UI precisa mostrar (sem a lógica de modificadores). */
export interface CardInfo {
  id: string;
  name: string;
  description: string;
  rarity: 'comum' | 'incomum' | 'raro';
  branch: 'balistica' | 'caos' | 'sobrevivencia';
  /** Stacks já na mão e máximo. */
  stacks: number;
  maxStacks: number;
}

export interface CardOffer {
  id: number;
  wave: number;
  cards: CardInfo[];
}

export interface Callout {
  id: number;
  title: string;
  subtitle?: string;
}

export interface PerfSnapshot {
  fps: number;
  avgMs: number;
  p95Ms: number;
  projectiles: number;
  enemies: number;
  particles: number;
}

export type GameToUi = {
  phase: RunPhase;
  hud: HudSnapshot;
  summary: RunSummary;
  callout: Callout;
  perf: PerfSnapshot | null;
  offer: CardOffer | null;
  /** Cartas na mão (stacks > 0), na ordem em que foram pegas. */
  hand: CardInfo[];
};

export type UiToGame = {
  start: void;
  pause: void;
  resume: void;
  restart: void;
  quitToMenu: void;
  settings: Settings;
  pickCard: string;
  cardHover: void;
};

export type BusEvents = { [K in keyof GameToUi as `game:${K}`]: GameToUi[K] } & {
  [K in keyof UiToGame as `ui:${K}`]: UiToGame[K];
};
