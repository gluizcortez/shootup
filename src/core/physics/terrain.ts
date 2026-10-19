/**
 * Relevo do chão da arena (heightfield 1D). O centro é plano; os cantos têm
 * subidas e descidas que o jogador usa para esquivar, como em Seraph's Last Stand.
 * Data-driven: a forma vem de `TerrainDef` (em game/data/arena.ts).
 */

/** Rampa encostada numa parede: platô no alto junto à parede e descida suave. */
export interface RampFeature {
  kind: 'ramp';
  side: 'left' | 'right';
  height: number;
  /** Largura do platô colado à parede. */
  plateau: number;
  /** Largura da descida até o nível base. */
  slope: number;
}

/** Morrinho (ou buraco, com altura negativa) em formato de cosseno. */
export interface BumpFeature {
  kind: 'bump';
  x: number;
  height: number;
  halfWidth: number;
}

export type TerrainFeature = RampFeature | BumpFeature;

export interface TerrainDef {
  /** y do chão sem relevo. */
  baseY: number;
  left: number;
  right: number;
  features: TerrainFeature[];
}

function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** Altura (px acima de baseY) num x qualquer, calculada direto da definição. */
export function heightAt(def: TerrainDef, x: number): number {
  let h = 0;
  for (const f of def.features) {
    if (f.kind === 'ramp') {
      const d = f.side === 'left' ? x - def.left : def.right - x;
      if (d <= f.plateau) h += f.height;
      else h += f.height * (1 - smoothstep((d - f.plateau) / f.slope));
    } else {
      const u = (x - f.x) / f.halfWidth;
      if (u > -1 && u < 1) h += f.height * 0.5 * (1 + Math.cos(u * Math.PI));
    }
  }
  return h;
}

/** Tabela amostrada a cada 1 px: consulta O(1) no loop quente. */
export class Terrain {
  private readonly ys: Float32Array;
  private readonly x0: number;
  readonly baseY: number;
  /** Ponto mais alto do relevo (menor y). */
  readonly topY: number;

  constructor(readonly def: TerrainDef) {
    this.x0 = Math.floor(def.left) - 2;
    const n = Math.ceil(def.right) - this.x0 + 4;
    this.ys = new Float32Array(n);
    let top = def.baseY;
    for (let i = 0; i < n; i++) {
      const y = def.baseY - heightAt(def, this.x0 + i);
      this.ys[i] = y;
      if (y < top) top = y;
    }
    this.baseY = def.baseY;
    this.topY = top;
  }

  /** y do chão em x (interpolado). Fora da arena, usa a borda. */
  groundAt(x: number): number {
    const f = x - this.x0;
    const last = this.ys.length - 1;
    if (f <= 0) return this.ys[0] as number;
    if (f >= last) return this.ys[last] as number;
    const i = Math.floor(f);
    const t = f - i;
    const a = this.ys[i] as number;
    const b = this.ys[i + 1] as number;
    return a + (b - a) * t;
  }

  /** Inclinação dy/dx (positivo = desce para a direita). */
  slopeAt(x: number): number {
    return (this.groundAt(x + 1) - this.groundAt(x - 1)) / 2;
  }

  /** Chão sob um corpo de meia-largura `hw`: o ponto mais alto sob os pés. */
  groundUnder(x: number, hw: number): number {
    return Math.min(this.groundAt(x - hw), this.groundAt(x), this.groundAt(x + hw));
  }
}

/** Chão plano, útil em testes. */
export function flatTerrain(baseY: number, left: number, right: number): Terrain {
  return new Terrain({ baseY, left, right, features: [] });
}
