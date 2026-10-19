import { useSyncExternalStore } from 'react';
import type { RunPhase } from '@/core/run/runPhase';
import { bus } from '@/shared/bus';
import { loadSettings, saveSettings } from '@/shared/settings';
import type { Settings } from '@/shared/settings';
import type { Callout, CardInfo, CardOffer, HudSnapshot, PerfSnapshot, RunSummary } from '@/shared/types';

export interface UiState {
  phase: RunPhase;
  hud: HudSnapshot;
  summary: RunSummary | null;
  callout: Callout | null;
  perf: PerfSnapshot | null;
  offer: CardOffer | null;
  hand: CardInfo[];
  settings: Settings;
}

let state: UiState = {
  phase: 'MENU',
  hud: { wave: 0, waveRemaining: 0, waveTotal: 0, score: 0, combo: 0, multiplier: 1, hp: 5, maxHp: 5, weaponName: 'Pistola' },
  summary: null,
  callout: null,
  perf: null,
  offer: null,
  hand: [],
  settings: loadSettings(),
};

const listeners = new Set<() => void>();

function set(patch: Partial<UiState>): void {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

// O jogo empurra dados em baixa frequência; React só rerenderiza quando algo muda.
bus.on('game:phase', (phase) => set({ phase }));
bus.on('game:hud', (hud) => set({ hud }));
bus.on('game:summary', (summary) => set({ summary }));
bus.on('game:callout', (callout) => set({ callout }));
bus.on('game:perf', (perf) => set({ perf }));
bus.on('game:offer', (offer) => set({ offer }));
bus.on('game:hand', (hand) => set({ hand }));

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): UiState {
  return state;
}

/** Seletor: o componente só rerenderiza se a fatia selecionada mudar. */
export function useGame<T>(selector: (s: UiState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export function updateSettings(patch: Partial<Settings>): void {
  const settings = { ...state.settings, ...patch };
  saveSettings(settings);
  set({ settings });
  bus.emit('ui:settings', settings);
}

export const actions = {
  start: () => bus.emit('ui:start', undefined),
  pause: () => bus.emit('ui:pause', undefined),
  resume: () => bus.emit('ui:resume', undefined),
  restart: () => bus.emit('ui:restart', undefined),
  quitToMenu: () => bus.emit('ui:quitToMenu', undefined),
  pickCard: (id: string) => bus.emit('ui:pickCard', id),
  cardHover: () => bus.emit('ui:cardHover', undefined),
};
