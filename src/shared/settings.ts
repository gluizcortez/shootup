export type VfxQuality = 'low' | 'medium' | 'high';

export interface Settings {
  /** 0..1 multiplica a intensidade do screen shake. */
  screenShake: number;
  flashes: boolean;
  damageNumbers: boolean;
  vfxQuality: VfxQuality;
  /** 0..1 */
  sfxVolume: number;
  /** 0..1 */
  musicVolume: number;
  muted: boolean;
}

const KEY = 'shootup.settings.v1';

export function prefersReducedMotion(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function defaultSettings(reducedMotion = prefersReducedMotion()): Settings {
  return {
    screenShake: reducedMotion ? 0 : 1,
    flashes: !reducedMotion,
    damageNumbers: true,
    vfxQuality: reducedMotion ? 'medium' : 'high',
    sfxVolume: 0.7,
    musicVolume: 0.5,
    muted: false,
  };
}

function sanitize(raw: unknown, base: Settings): Settings {
  if (typeof raw !== 'object' || raw === null) return base;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
  const q = r.vfxQuality;
  return {
    screenShake: num(r.screenShake, base.screenShake),
    flashes: bool(r.flashes, base.flashes),
    damageNumbers: bool(r.damageNumbers, base.damageNumbers),
    vfxQuality: q === 'low' || q === 'medium' || q === 'high' ? q : base.vfxQuality,
    sfxVolume: num(r.sfxVolume, base.sfxVolume),
    musicVolume: num(r.musicVolume, base.musicVolume),
    muted: bool(r.muted, base.muted),
  };
}

/** Lê do localStorage; qualquer falha cai no padrão (modo privado, JSON inválido...). */
export function loadSettings(): Settings {
  const base = defaultSettings();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw), base) : base;
  } catch {
    return base;
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Sem storage: as configurações valem só nesta sessão.
  }
}

export { sanitize as sanitizeSettings };
