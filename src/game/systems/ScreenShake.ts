/**
 * Shake por "trauma": cada impacto soma trauma (0..1), o deslocamento é
 * trauma² × máximo, e decai rápido. Limitado e escalável pelas configurações.
 */
export class ScreenShake {
  private trauma = 0;
  private t = 0;
  x = 0;
  y = 0;
  intensity = 1;

  constructor(
    private readonly maxOffset = 9,
    private readonly decayPerSecond = 2.2,
  ) {}

  add(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt: number): void {
    this.t += dt;
    this.trauma = Math.max(0, this.trauma - this.decayPerSecond * dt);
    const k = this.trauma * this.trauma * this.maxOffset * this.intensity;
    // Ruído suave e barato (somas de senos) em vez de aleatório puro: menos enjoativo.
    this.x = k * (Math.sin(this.t * 71.3) * 0.6 + Math.sin(this.t * 43.1 + 1.7) * 0.4);
    this.y = k * (Math.sin(this.t * 67.9 + 0.5) * 0.6 + Math.sin(this.t * 39.7 + 3.1) * 0.4);
  }

  reset(): void {
    this.trauma = 0;
    this.x = this.y = 0;
  }
}
