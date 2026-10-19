/** Estados explícitos da run (GDD §10). WAVE_CLEAR/UPGRADE_SELECT chegam na Fase 1. */
export type RunPhase = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

const TRANSITIONS: Record<RunPhase, readonly RunPhase[]> = {
  MENU: ['PLAYING'],
  PLAYING: ['PAUSED', 'GAME_OVER', 'MENU'],
  PAUSED: ['PLAYING', 'MENU', 'GAME_OVER'],
  GAME_OVER: ['PLAYING', 'MENU'],
};

export function canTransition(from: RunPhase, to: RunPhase): boolean {
  return TRANSITIONS[from].includes(to);
}

export class RunPhaseMachine {
  constructor(private current: RunPhase = 'MENU') {}

  get phase(): RunPhase {
    return this.current;
  }

  /** Retorna false (sem lançar) se a transição não é permitida. */
  to(next: RunPhase): boolean {
    if (next === this.current || !canTransition(this.current, next)) return false;
    this.current = next;
    return true;
  }
}
