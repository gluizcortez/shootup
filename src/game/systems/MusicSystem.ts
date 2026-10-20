import { SAD_TROMBONE, TRACKS, midiToHz, type MusicMode, type TrackId } from '../data/music';

const OPEN_CUTOFF = 18000;
const MUFFLED_CUTOFF = 650;
const CROSSFADE = 0.7;

interface Voice {
  readonly track: TrackId;
  readonly src: AudioBufferSourceNode;
  readonly gain: GainNode;
}

/**
 * Toca as faixas gravadas em loop. Trocar de modo faz crossfade entre faixas
 * e desliza o playbackRate (andamento). Faixas carregam sob demanda; até
 * chegarem, o jogo segue em silêncio musical (offline-first: falhar no
 * download nunca trava a run).
 */
export class MusicSystem {
  private readonly bus: GainNode;
  private readonly filter: BiquadFilterNode;
  private readonly buffers = new Map<TrackId, AudioBuffer>();
  private readonly loading = new Map<TrackId, Promise<void>>();
  private current: Voice | null = null;
  private wanted: MusicMode | null = null;
  private playing = false;

  constructor(
    private readonly ctx: AudioContext,
    out: AudioNode,
    private readonly baseUrl = '/',
  ) {
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = OPEN_CUTOFF;
    this.bus = ctx.createGain();
    this.bus.connect(this.filter).connect(out);
    for (const id of Object.keys(TRACKS) as TrackId[]) void this.load(id);
  }

  /** Recomeça a trilha (nova run): a faixa volta do início do loop. */
  restart(): void {
    this.playing = true;
    this.fadeOut(0.05);
    this.bus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.bus.gain.setTargetAtTime(1, this.ctx.currentTime, 0.03);
  }

  stop(): void {
    this.playing = false;
    this.fadeOut(0.4);
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  /** Pausa e cartas: a música continua, mas "abafada", como se viesse do camarim. */
  setMuffled(muffled: boolean): void {
    this.filter.frequency.setTargetAtTime(muffled ? MUFFLED_CUTOFF : OPEN_CUTOFF, this.ctx.currentTime, 0.12);
  }

  update(mode: MusicMode): void {
    if (!this.playing || this.ctx.state !== 'running') return;
    const prev = this.wanted;
    this.wanted = mode;
    if (!this.current || this.current.track !== mode.track) {
      this.startTrack(mode);
    } else if (!prev || prev.rate !== mode.rate) {
      // Acelera rápido quando a coisa aperta, desacelera devagar quando alivia.
      const tc = mode.rate > (prev?.rate ?? 1) ? 0.25 : 0.8;
      this.current.src.playbackRate.setTargetAtTime(mode.rate, this.ctx.currentTime, tc);
    }
  }

  /** Derrota: corta a banda e toca o trombone triste. */
  sadTrombone(): void {
    this.stop();
    const t0 = this.ctx.currentTime + 0.25;
    const stepDur = 0.11;
    const last = SAD_TROMBONE[SAD_TROMBONE.length - 1]![0];
    for (const [s, midi, len] of SAD_TROMBONE) {
      this.kazoo(t0 + s * stepDur, midiToHz(midi), len * stepDur, s === last ? 5 : 0);
    }
  }

  private load(id: TrackId): Promise<void> {
    const existing = this.loading.get(id);
    if (existing) return existing;
    const p = fetch(this.baseUrl + TRACKS[id].file)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((data) => this.ctx.decodeAudioData(data))
      .then((buf) => {
        this.buffers.set(id, buf);
        // Chegou a faixa que estava sendo esperada: entra já.
        if (this.playing && this.wanted?.track === id && !this.current) this.startTrack(this.wanted);
      })
      .catch((err: unknown) => console.warn(`[music] faixa ${id} indisponível; seguindo sem ela.`, err));
    this.loading.set(id, p);
    return p;
  }

  private startTrack(mode: MusicMode): void {
    const buf = this.buffers.get(mode.track);
    this.fadeOut(CROSSFADE / 2);
    if (!buf) return;
    const def = TRACKS[mode.track];
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = def.loop[0];
    src.loopEnd = Math.min(def.loop[1], buf.duration);
    src.playbackRate.value = mode.rate;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(def.gain, t + CROSSFADE);
    src.connect(gain).connect(this.bus);
    src.start(t, def.loop[0]);
    this.current = { track: mode.track, src, gain };
  }

  private fadeOut(time: number): void {
    const v = this.current;
    if (!v) return;
    this.current = null;
    const t = this.ctx.currentTime;
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setTargetAtTime(0.0001, t, time / 3);
    v.src.stop(t + time + 0.1);
  }

  /** Serra num filtro estreito com vibrato: soa como um kazoo de festa. */
  private kazoo(t: number, hz: number, dur: number, vibratoHz: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(hz * 0.97, t);
    o.frequency.exponentialRampToValueAtTime(hz, t + 0.04);
    if (vibratoHz > 0) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = vibratoHz;
      depth.gain.value = hz * 0.025;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur);
    }
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 700;
    f.Q.value = 2.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    g.gain.setValueAtTime(0.3, t + Math.max(0.021, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // Passa por fora do bus (que acabou de silenciar), direto no filtro.
    o.connect(f).connect(g).connect(this.filter);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
}
