/** Estados explícitos da run (GDD §10). UPGRADE_SELECT = escolhendo carta entre ondas. */
export type RunPhase = 'MENU' | 'PLAYING' | 'PAUSED' | 'UPGRADE_SELECT' | 'GAME_OVER';

const TRANSITIONS: Record<RunPhase, readonly RunPhase[]> = {
  MENU: ['PLAYING'],
  PLAYING: ['PAUSED', 'UPGRADE_SELECT', 'GAME_OVER', 'MENU'],
  UPGRADE_SELECT: ['PLAYING', 'MENU'],
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
