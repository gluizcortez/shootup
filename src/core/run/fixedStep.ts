/**
 * Acumulador de passo fixo. A simulação sempre avança em `step` segundos,
 * independente do framerate; a renderização interpola com `alpha`.
 */
export class FixedStepper {
  private accumulator = 0;
  alpha = 0;

  constructor(
    readonly step: number,
    /** Limite de passos por quadro para evitar a "espiral da morte". */
    readonly maxStepsPerFrame = 8,
  ) {}

  /** Devolve quantos passos fixos devem rodar neste quadro. */
  advance(frameSeconds: number): number {
    const clamped = Math.min(Math.max(frameSeconds, 0), this.step * this.maxStepsPerFrame);
    this.accumulator += clamped;
    let steps = 0;
    while (this.accumulator >= this.step && steps < this.maxStepsPerFrame) {
      this.accumulator -= this.step;
      steps++;
    }
    if (steps === this.maxStepsPerFrame) this.accumulator = Math.min(this.accumulator, this.step);
    this.alpha = this.accumulator / this.step;
    return steps;
  }

  reset(): void {
    this.accumulator = 0;
    this.alpha = 0;
  }
}
