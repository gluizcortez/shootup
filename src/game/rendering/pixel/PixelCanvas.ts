/**
 * Pincel de pixel art: desenha direto num buffer RGBA, 1 pixel por vez, sem
 * suavização. Linhas de Bresenham, degradês com pontilhado Bayer e polígonos
 * por varredura: tudo cai exatamente na grade de pixels.
 */

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/** Limiar do pontilhado ordenado 4×4 em (x, y), de 0 a 1. */
export function bayer(x: number, y: number): number {
  return BAYER4[((y & 3) << 2) | (x & 3)] as number;
}

export class PixelCanvas {
  readonly data: Uint8ClampedArray;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  /** Pinta um pixel; `a` < 1 mistura com o que já está lá. */
  pset(x: number, y: number, color: number, a = 1): void {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const d = this.data;
    if (a >= 1 || (d[i + 3] as number) === 0) {
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = a >= 1 ? 255 : Math.round(a * 255);
      return;
    }
    d[i] = (d[i] as number) + (r - (d[i] as number)) * a;
    d[i + 1] = (d[i + 1] as number) + (g - (d[i + 1] as number)) * a;
    d[i + 2] = (d[i + 2] as number) + (b - (d[i + 2] as number)) * a;
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return -1;
    const i = ((y | 0) * this.width + (x | 0)) * 4;
    if ((this.data[i + 3] as number) === 0) return -1;
    return ((this.data[i] as number) << 16) | ((this.data[i + 1] as number) << 8) | (this.data[i + 2] as number);
  }

  rect(x: number, y: number, w: number, h: number, color: number, a = 1): void {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.width, Math.round(x + w));
    const y1 = Math.min(this.height, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.pset(xx, yy, color, a);
  }

  /** Retângulo com pontilhado: cobre `k` (0..1) dos pixels de forma regular. */
  ditherRect(x: number, y: number, w: number, h: number, color: number, k: number): void {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.width, Math.round(x + w));
    const y1 = Math.min(this.height, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) if (bayer(xx, yy) < k) this.pset(xx, yy, color);
  }

  hline(x0: number, x1: number, y: number, color: number, a = 1): void {
    const a0 = Math.round(Math.min(x0, x1));
    const a1 = Math.round(Math.max(x0, x1));
    for (let x = a0; x <= a1; x++) this.pset(x, Math.round(y), color, a);
  }

  /** Linha de Bresenham com espessura em pixels (pincel quadrado). */
  line(x0: number, y0: number, x1: number, y1: number, color: number, thick = 1, a = 1): void {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const xe = Math.round(x1);
    const ye = Math.round(y1);
    const dx = Math.abs(xe - x);
    const dy = -Math.abs(ye - y);
    const sx = x < xe ? 1 : -1;
    const sy = y < ye ? 1 : -1;
    let err = dx + dy;
    const off = Math.floor((thick - 1) / 2);
    for (;;) {
      if (thick <= 1) this.pset(x, y, color, a);
      else this.rect(x - off, y - off, thick, thick, color, a);
      if (x === xe && y === ye) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /** Polígono preenchido por varredura (regra par-ímpar). */
  poly(pts: ReadonlyArray<readonly [number, number]>, color: number, a = 1): void {
    if (pts.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const xs: number[] = [];
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(this.height - 1, Math.ceil(maxY)); y++) {
      const cy = y + 0.5;
      xs.length = 0;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i] as readonly [number, number];
        const [bx, by] = pts[(i + 1) % pts.length] as readonly [number, number];
        if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + ((cy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.round(xs[k] as number);
        const xb = Math.round(xs[k + 1] as number) - 1;
        for (let x = xa; x <= xb; x++) this.pset(x, y, color, a);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: number, a = 1): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const t = (y + 0.5 - cy) / ry;
      if (Math.abs(t) > 1) continue;
      const half = rx * Math.sqrt(1 - t * t);
      for (let x = Math.round(cx - half); x < Math.round(cx + half); x++) this.pset(x, y, color, a);
    }
  }

  /**
   * Degradê vertical em faixas de cores da paleta, com a passagem entre
   * faixas pontilhada (Bayer): o jeito clássico de fazer céu em pixel art.
   */
  vbands(x: number, y: number, w: number, h: number, colors: readonly number[]): void {
    const n = colors.length - 1;
    for (let yy = 0; yy < h; yy++) {
      const t = (yy / Math.max(1, h - 1)) * n;
      const i = Math.min(n - 1, Math.floor(t));
      const f = t - i;
      const c0 = colors[i] as number;
      const c1 = colors[i + 1] as number;
      const py = Math.round(y) + yy;
      for (let xx = 0; xx < w; xx++) {
        const px = Math.round(x) + xx;
        this.pset(px, py, bayer(px, py) < f ? c1 : c0);
      }
    }
  }
}

export function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const r = Math.round(ar + (((b >> 16) & 0xff) - ar) * t);
  const g = Math.round(ag + (((b >> 8) & 0xff) - ag) * t);
  const bb = Math.round(ab + ((b & 0xff) - ab) * t);
  return (r << 16) | (g << 8) | bb;
}
