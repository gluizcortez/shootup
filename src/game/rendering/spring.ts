/** Mola amortecida 1D para squash & stretch e recuos. Integrada em tempo real (cosmético). */
export class Spring {
  value = 0;
  velocity = 0;

  constructor(
    private readonly stiffness = 520,
    private readonly damping = 16,
  ) {}

  kick(impulse: number): void {
    this.velocity += impulse;
  }

  set(v: number): void {
    this.value = v;
  }

  update(dt: number): number {
    // Subpassos para estabilidade com dt variável.
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const a = -this.stiffness * this.value - this.damping * this.velocity;
      this.velocity += a * h;
      this.value += this.velocity * h;
    }
    return this.value;
  }
}

export function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
