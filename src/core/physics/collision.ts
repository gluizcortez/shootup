/** Caixas são centradas: (x, y) é o centro, hw/hh são meias-medidas. */
export interface Box {
  x: number;
  y: number;
  hw: number;
  hh: number;
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.y - b.y) < a.hh + b.hh;
}

export function circleIntersectsBox(cx: number, cy: number, r: number, b: Box): boolean {
  const dx = Math.max(Math.abs(cx - b.x) - b.hw, 0);
  const dy = Math.max(Math.abs(cy - b.y) - b.hh, 0);
  return dx * dx + dy * dy < r * r;
}

/**
 * Teste varrido: o segmento (x0,y0)->(x1,y1) de um círculo de raio r cruza a caixa?
 * Evita que projéteis rápidos atravessem alvos finos entre dois passos.
 */
export function sweptCircleHitsBox(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  b: Box,
): boolean {
  // Slab test contra a caixa expandida pelo raio (aproximação conservadora).
  const minX = b.x - b.hw - r;
  const maxX = b.x + b.hw + r;
  const minY = b.y - b.hh - r;
  const maxY = b.y + b.hh + r;
  const dx = x1 - x0;
  const dy = y1 - y0;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x0 < minX || x0 > maxX) return false;
  } else {
    let t1 = (minX - x0) / dx;
    let t2 = (maxX - x0) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y0 < minY || y0 > maxY) return false;
  } else {
    let t1 = (minY - y0) / dy;
    let t2 = (maxY - y0) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}
