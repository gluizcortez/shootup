/** Janela deslizante de tempos de quadro para média e P95 (GDD §12). */
export class FrameStats {
  private readonly samples: Float32Array;
  private readonly sorted: Float32Array;
  private index = 0;
  private count = 0;

  constructor(readonly size = 240) {
    this.samples = new Float32Array(size);
    this.sorted = new Float32Array(size);
  }

  push(ms: number): void {
    this.samples[this.index] = ms;
    this.index = (this.index + 1) % this.size;
    if (this.count < this.size) this.count++;
  }

  average(): number {
    if (this.count === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.count; i++) sum += this.samples[i] as number;
    return sum / this.count;
  }

  percentile(p: number): number {
    if (this.count === 0) return 0;
    const view = this.sorted.subarray(0, this.count);
    view.set(this.samples.subarray(0, this.count));
    view.sort();
    const idx = Math.min(this.count - 1, Math.ceil((p / 100) * this.count) - 1);
    return view[Math.max(0, idx)] as number;
  }
}
