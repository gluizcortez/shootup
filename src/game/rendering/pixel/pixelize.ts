/**
 * Converte um desenho em alta resolução em pixel art de verdade, na escala
 * final de 1 texel = 1 unidade do mundo:
 *
 * 1. Reduz cada bloco F×F a UM pixel, escolhendo a cor dominante (não a média),
 *    com bônus para cores que contrastam: contornos e brilhos finos sobrevivem.
 * 2. Separa as regiões de cor e dá volume a cada uma com um mapa de altura
 *    (distância até a borda) iluminado do alto à esquerda: luz quente nas
 *    bordas de cima, sombra roxa nas de baixo, como num sprite pintado à mão.
 * 3. Troca o contorno preto interno por um tom escuro da cor vizinha
 *    ("sel-out"), deixando a linha preta só na silhueta.
 *
 * Função pura sobre RGBA; não depende do Phaser, então é testável.
 */

export type PixelMode = 'sprite' | 'flat' | 'glow';

export interface PixelImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

const LIGHT = normalize3(-0.55, -0.72, 0.55);
const FLAT_I = LIGHT[2];
/** Luz quente e sombra roxa: combinam com o neon de Miami. */
const HI = [255, 244, 226] as const;
const LO = [34, 12, 66] as const;
/** PAL.outline. */
const OUTLINE = [13, 15, 21] as const;

function normalize3(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}

function lum(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Reduz um desenho F× para 1×. */
export function downsample(src: PixelImage, f: number, w: number, h: number, mode: PixelMode): PixelImage {
  const out = new Uint8ClampedArray(w * h * 4);
  const counts = new Map<number, { n: number; r: number; g: number; b: number; a: number }>();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      counts.clear();
      let opaque = 0;
      let aSum = 0;
      let lr = 0;
      let lg = 0;
      let lb = 0;
      for (let sy = 0; sy < f; sy++) {
        const yy = y * f + sy;
        if (yy >= src.height) continue;
        for (let sx = 0; sx < f; sx++) {
          const xx = x * f + sx;
          if (xx >= src.width) continue;
          const i = (yy * src.width + xx) * 4;
          const a = src.data[i + 3] as number;
          aSum += a;
          if (a < 100) continue;
          const r = src.data[i] as number;
          const g = src.data[i + 1] as number;
          const b = src.data[i + 2] as number;
          opaque++;
          lr += r;
          lg += g;
          lb += b;
          const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          const c = counts.get(key);
          if (c) {
            c.n++;
            c.r += r;
            c.g += g;
            c.b += b;
            c.a += a;
          } else counts.set(key, { n: 1, r, g, b, a });
        }
      }
      const o = (y * w + x) * 4;
      const cells = f * f;
      if (mode === 'glow') {
        // Brilho em degraus: média de cor e alfa quantizado em 4 níveis.
        const a = aSum / cells;
        if (a < 12) continue;
        let best = { n: 0, r: 0, g: 0, b: 0, a: 0 };
        for (const c of counts.values()) if (c.n > best.n) best = c;
        if (best.n === 0) {
          // Pixels quase transparentes: usa a cor média de todos.
          let r = 0;
          let g = 0;
          let b = 0;
          let n = 0;
          for (let sy = 0; sy < f; sy++)
            for (let sx = 0; sx < f; sx++) {
              const i = ((y * f + sy) * src.width + x * f + sx) * 4;
              if ((src.data[i + 3] as number) === 0) continue;
              r += src.data[i] as number;
              g += src.data[i + 1] as number;
              b += src.data[i + 2] as number;
              n++;
            }
          if (n === 0) continue;
          best = { n, r, g, b, a: 0 };
        }
        out[o] = best.r / best.n;
        out[o + 1] = best.g / best.n;
        out[o + 2] = best.b / best.n;
        out[o + 3] = Math.min(255, Math.ceil(a / 64) * 64);
        continue;
      }
      if (opaque * 2 < cells * 0.85) continue;
      const lAvg = lum(lr / opaque, lg / opaque, lb / opaque);
      let bestScore = -1;
      let pick = { n: 1, r: 0, g: 0, b: 0, a: 255 };
      for (const c of counts.values()) {
        const l = lum(c.r / c.n, c.g / c.n, c.b / c.n);
        // Contraste vale mais: linhas escuras e brilhos não somem na redução.
        const score = c.n * (1 + 1.6 * Math.abs(l - lAvg) + (l < 0.12 ? 0.35 : 0));
        if (score > bestScore) {
          bestScore = score;
          pick = c;
        }
      }
      out[o] = pick.r / pick.n;
      out[o + 1] = pick.g / pick.n;
      out[o + 2] = pick.b / pick.n;
      out[o + 3] = 255;
    }
  }
  return { width: w, height: h, data: out };
}

/** Volume por região + contorno interno colorido. Altera `img` no lugar. */
export function shadeRegions(img: PixelImage): void {
  const { width: w, height: h, data } = img;
  const n = w * h;
  mergeNearColors(img, 20);
  const key = new Int32Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    if ((data[i * 4 + 3] as number) < 128) continue;
    key[i] = (((data[i * 4] as number) >> 3) << 10) | (((data[i * 4 + 1] as number) >> 3) << 5) | ((data[i * 4 + 2] as number) >> 3);
  }
  // "Linha" é só a cor de contorno do jogo (quase preta, levemente azulada).
  const isLine = (i: number) => {
    if (key[i] === -1) return false;
    const dr = (data[i * 4] as number) - OUTLINE[0];
    const dg = (data[i * 4 + 1] as number) - OUTLINE[1];
    const db = (data[i * 4 + 2] as number) - OUTLINE[2];
    return dr * dr + dg * dg + db * db < 160;
  };

  // Regiões conectadas de mesma cor.
  const region = new Int32Array(n).fill(-1);
  const regions: number[][] = [];
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    if (key[i] === -1 || region[i] !== -1 || isLine(i)) continue;
    const id = regions.length;
    const px: number[] = [];
    region[i] = id;
    stack.push(i);
    while (stack.length) {
      const p = stack.pop() as number;
      px.push(p);
      const x = p % w;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w];
      for (const q of nb) {
        if (q < 0 || q >= n || region[q] !== -1 || key[q] !== key[p]) continue;
        region[q] = id;
        stack.push(q);
      }
    }
    regions.push(px);
  }

  const shaded = new Uint8ClampedArray(data);
  const dist = new Float32Array(n);
  const height = new Float32Array(n);
  for (let id = 0; id < regions.length; id++) {
    const px = regions[id] as number[];
    if (px.length < 10) continue;
    const small = px.length < 40;
    // Distância até a borda (BFS a partir dos pixels de borda).
    const queue: number[] = [];
    for (const p of px) {
      const x = p % w;
      const edge =
        x === 0 || x === w - 1 || p < w || p >= n - w || region[p - 1] !== id || region[p + 1] !== id || region[p - w] !== id || region[p + w] !== id;
      dist[p] = edge ? 1 : 0;
      if (edge) queue.push(p);
    }
    for (let qi = 0; qi < queue.length; qi++) {
      const p = queue[qi] as number;
      const x = p % w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
        if (q < 0 || q >= n || region[q] !== id || dist[q] !== 0) continue;
        dist[q] = (dist[p] as number) + 1;
        queue.push(q);
      }
    }
    const R = Math.max(1.5, Math.min(4, Math.sqrt(px.length) / 2.4));
    for (const p of px) dist[p] = Math.sqrt(Math.min(dist[p] as number, R) / R);
    // Suaviza o relevo (a distância em grade faz degraus que viram ruído na luz).
    for (const p of px) {
      const x = p % w;
      let sum = 0;
      let cnt = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (x + dx < 0 || x + dx >= w) continue;
          const q = p + dy * w + dx;
          const v = q >= 0 && q < n && region[q] === id ? (dist[q] as number) : 0;
          sum += v;
          cnt++;
        }
      height[p] = sum / cnt;
    }
    const hAt = (q: number, fallback: number) => (q >= 0 && q < n && region[q] === id ? (height[q] as number) : fallback);
    const base = lum(data[(px[0] as number) * 4] as number, data[(px[0] as number) * 4 + 1] as number, data[(px[0] as number) * 4 + 2] as number);
    // Cores muito claras ganham menos luz; muito escuras, menos sombra.
    const hiK = base > 0.85 ? 0.35 : 1;
    const loK = base < 0.2 ? 0.45 : 1;
    for (const p of px) {
      const x = p % w;
      const hl = hAt(x > 0 ? p - 1 : -1, 0);
      const hr = hAt(x < w - 1 ? p + 1 : -1, 0);
      const hu = hAt(p - w, 0);
      const hd = hAt(p + w, 0);
      const gx = (hr - hl) / 2;
      const gy = (hd - hu) / 2;
      const k = 1.6;
      const [nx, ny, nz] = normalize3(-gx * k, -gy * k, 1);
      const I = nx * (LIGHT[0] as number) + ny * (LIGHT[1] as number) + nz * (LIGHT[2] as number);
      let level = Math.round((I - FLAT_I) * 3.2);
      level = Math.max(small ? -1 : -2, Math.min(1, level));
      if (level === 0) continue;
      const o = p * 4;
      const t = level > 0 ? 0.26 * level * hiK : 0.24 * -level * loK;
      const c = level > 0 ? HI : LO;
      shaded[o] = (data[o] as number) + ((c[0] as number) - (data[o] as number)) * t;
      shaded[o + 1] = (data[o + 1] as number) + ((c[1] as number) - (data[o + 1] as number)) * t;
      shaded[o + 2] = (data[o + 2] as number) + ((c[2] as number) - (data[o + 2] as number)) * t;
    }
  }

  // Contorno interno: a linha preta entre duas cores vira um tom escuro delas.
  // Só em traços compridos (contornos); pupilas e detalhes pequenos ficam pretos.
  const lineSize = new Int32Array(n);
  const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (seen[i] || !isLine(i)) continue;
    const comp: number[] = [];
    seen[i] = 1;
    stack.push(i);
    while (stack.length) {
      const p = stack.pop() as number;
      comp.push(p);
      const x = p % w;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          if (x + dx < 0 || x + dx >= w) continue;
          const q = p + dy * w + dx;
          if (q < 0 || q >= n || seen[q] || !isLine(q)) continue;
          seen[q] = 1;
          stack.push(q);
        }
    }
    for (const p of comp) lineSize[p] = comp.length;
  }
  for (let i = 0; i < n; i++) {
    if (!isLine(i) || (lineSize[i] as number) < 12) continue;
    const x = i % w;
    const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
    let outside = false;
    let r = 0;
    let g = 0;
    let b = 0;
    let c = 0;
    for (const q of nb) {
      if (q < 0 || q >= n || key[q] === -1) {
        outside = true;
        break;
      }
      if (isLine(q)) continue;
      r += data[q * 4] as number;
      g += data[q * 4 + 1] as number;
      b += data[q * 4 + 2] as number;
      c++;
    }
    if (outside || c === 0) continue;
    const t = 0.62;
    shaded[i * 4] = r / c + ((LO[0] as number) - r / c) * t;
    shaded[i * 4 + 1] = g / c + ((LO[1] as number) - g / c) * t;
    shaded[i * 4 + 2] = b / c + ((LO[2] as number) - b / c) * t;
  }
  data.set(shaded);
}

/** Junta cores quase iguais (sobras de transparência) na mais frequente. */
function mergeNearColors(img: PixelImage, tol: number): void {
  const { data } = img;
  const hist = new Map<number, number>();
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] as number) < 128) continue;
    const c = ((data[i] as number) << 16) | ((data[i + 1] as number) << 8) | (data[i + 2] as number);
    hist.set(c, (hist.get(c) ?? 0) + 1);
  }
  const colors = [...hist.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const palette: number[] = [];
  const map = new Map<number, number>();
  const t2 = tol * tol;
  for (const c of colors) {
    const r = (c >> 16) & 0xff;
    const g = (c >> 8) & 0xff;
    const b = c & 0xff;
    let hit = c;
    for (const p of palette) {
      const dr = ((p >> 16) & 0xff) - r;
      const dg = ((p >> 8) & 0xff) - g;
      const db = (p & 0xff) - b;
      if (dr * dr + dg * dg + db * db < t2) {
        hit = p;
        break;
      }
    }
    if (hit === c) palette.push(c);
    map.set(c, hit);
  }
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] as number) < 128) continue;
    const c = ((data[i] as number) << 16) | ((data[i + 1] as number) << 8) | (data[i + 2] as number);
    const m = map.get(c) as number;
    data[i] = (m >> 16) & 0xff;
    data[i + 1] = (m >> 8) & 0xff;
    data[i + 2] = m & 0xff;
  }
}

export function pixelize(src: PixelImage, f: number, w: number, h: number, mode: PixelMode): PixelImage {
  const img = downsample(src, f, w, h, mode);
  if (mode === 'sprite') shadeRegions(img);
  return img;
}
