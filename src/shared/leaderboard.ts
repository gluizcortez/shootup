/**
 * Placar local (top 10), salvo no navegador. Offline-first: o ranking online
 * (Supabase, validado no servidor) entra numa fase futura e não depende disto.
 * Runs com debug nunca entram.
 */
export interface ScoreEntry {
  name: string;
  score: number;
  wave: number;
  kills: number;
  bestCombo: number;
  timeSeconds: number;
  /** ISO 8601. */
  date: string;
}

export const MAX_ENTRIES = 10;
export const NAME_MAX = 12;
const KEY = 'shootup.scores.v1';
const NAME_KEY = 'shootup.lastName.v1';

/** Nome exibível: sem controles, espaços colapsados, até NAME_MAX caracteres. */
export function sanitizeName(raw: string): string {
  const clean = raw
    .replace(/[^\p{L}\p{N} _.!?-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
    .trim();
  return clean || 'ANONYMOUS';
}

function isEntry(v: unknown): v is ScoreEntry {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const n = (k: string) => typeof r[k] === 'number' && Number.isFinite(r[k] as number) && (r[k] as number) >= 0;
  return typeof r.name === 'string' && typeof r.date === 'string' && n('score') && n('wave') && n('kills') && n('bestCombo') && n('timeSeconds');
}

/** Ordena: mais pontos primeiro; empate → onda maior → mais antigo primeiro. */
export function sortScores(list: ScoreEntry[]): ScoreEntry[] {
  return [...list].sort((a, b) => b.score - a.score || b.wave - a.wave || a.date.localeCompare(b.date));
}

/** Lista já validada, ordenada e cortada (lixo no storage é descartado). */
export function parseScores(raw: unknown): ScoreEntry[] {
  if (!Array.isArray(raw)) return [];
  return sortScores(raw.filter(isEntry).map((e) => ({ ...e, name: sanitizeName(e.name) }))).slice(0, MAX_ENTRIES);
}

/** Posição (1-based) que a pontuação ocuparia, ou 0 se não entra no top. */
export function rankFor(list: readonly ScoreEntry[], score: number): number {
  if (score <= 0) return 0;
  let pos = list.findIndex((e) => score > e.score);
  if (pos < 0) pos = list.length;
  return pos < MAX_ENTRIES ? pos + 1 : 0;
}

/** Insere e devolve a nova lista e a posição (0 se não entrou). */
export function insertScore(list: readonly ScoreEntry[], entry: ScoreEntry): { list: ScoreEntry[]; rank: number } {
  const e = { ...entry, name: sanitizeName(entry.name) };
  const next = sortScores([...list, e]).slice(0, MAX_ENTRIES);
  const idx = next.indexOf(e);
  return { list: next, rank: idx + 1 };
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadScores(): ScoreEntry[] {
  try {
    const raw = storage()?.getItem(KEY);
    return raw ? parseScores(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveScores(list: readonly ScoreEntry[]): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage cheio ou bloqueado: o placar só não persiste.
  }
}

export function loadLastName(): string {
  try {
    return storage()?.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveLastName(name: string): void {
  try {
    storage()?.setItem(NAME_KEY, name);
  } catch {
    // ignora
  }
}
