export interface ComboTuning {
  /** Segundos sem abate até o combo zerar. */
  window: number;
  /** A cada N abates o multiplicador sobe um degrau. */
  killsPerStep: number;
  stepBonus: number;
  maxMultiplier: number;
}

export interface ComboState {
  count: number;
  timer: number;
  multiplier: number;
  best: number;
}

export function createCombo(): ComboState {
  return { count: 0, timer: 0, multiplier: 1, best: 0 };
}

export function multiplierFor(count: number, t: ComboTuning): number {
  const steps = Math.floor(count / t.killsPerStep);
  return Math.min(1 + steps * t.stepBonus, t.maxMultiplier);
}

/** Registra um abate e devolve os pontos já multiplicados. */
export function registerKill(c: ComboState, baseScore: number, t: ComboTuning): number {
  c.count++;
  c.timer = t.window;
  c.multiplier = multiplierFor(c.count, t);
  if (c.count > c.best) c.best = c.count;
  return Math.round(baseScore * c.multiplier);
}

export function tickCombo(c: ComboState, dt: number): boolean {
  if (c.count === 0) return false;
  c.timer -= dt;
  if (c.timer <= 0) {
    breakCombo(c);
    return true;
  }
  return false;
}

export function breakCombo(c: ComboState): void {
  c.count = 0;
  c.timer = 0;
  c.multiplier = 1;
}
