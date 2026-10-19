import {
  BARS_PER_PHRASE,
  CHORDS,
  MELODY_A,
  MELODY_B,
  MUSIC_MODES,
  SAD_TROMBONE,
  STEPS_PER_BAR,
  midiToHz,
  type MusicMode,
  type NoteEvent,
} from '../data/music';

/** Quanto à frente agendamos notas (cobre quadros lentos sem atrasar a batida). */
const LOOKAHEAD = 0.14;
const CYCLE_STEPS = STEPS_PER_BAR * BARS_PER_PHRASE * 2;
const PHRASE_STEPS = STEPS_PER_BAR * BARS_PER_PHRASE;
const OPEN_CUTOFF = 18000;
const MUFFLED_CUTOFF = 650;

/**
 * Sequenciador da trilha. Roda no relógio do WebAudio (preciso), mas é
 * alimentado pelo update da cena: a cada quadro agenda os passos que caem
 * dentro da janela de lookahead. O BPM desliza até o alvo do modo atual.
 */
export class MusicSystem {
  private readonly bus: GainNode;
  private readonly filter: BiquadFilterNode;
  private playing = false;
  private step = 0;
  private nextTime = 0;
  private bpm = MUSIC_MODES.menu.bpm;
  private mode: MusicMode = MUSIC_MODES.menu;
  private transpose = 0;

  constructor(
    private readonly ctx: AudioContext,
    out: AudioNode,
    private readonly noise: AudioBuffer,
  ) {
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = OPEN_CUTOFF;
    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(this.filter).connect(out);
  }

  /** Recomeça do primeiro compasso (nova run). */
  restart(): void {
    this.playing = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.transpose = this.mode.transpose;
    this.fade(1, 0.05);
  }

  stop(): void {
    this.playing = false;
    this.fade(0.0001, 0.15);
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  /** Pausa e cartas: a música continua, mas "abafada", como se viesse do camarim. */
  setMuffled(muffled: boolean): void {
    this.filter.frequency.setTargetAtTime(muffled ? MUFFLED_CUTOFF : OPEN_CUTOFF, this.ctx.currentTime, 0.12);
  }

  update(mode: MusicMode, dt: number): void {
    this.mode = mode;
    if (!this.playing || this.ctx.state !== 'running') return;
    // Acelera rápido quando a coisa aperta, desacelera devagar quando alivia.
    const rate = mode.bpm > this.bpm ? 2.5 : 0.8;
    this.bpm += (mode.bpm - this.bpm) * Math.min(1, dt * rate);
    const now = this.ctx.currentTime;
    // Aba escondida / travada: ressincroniza em vez de despejar notas atrasadas.
    if (this.nextTime < now - 0.05) this.nextTime = now + 0.02;
    while (this.nextTime < now + LOOKAHEAD) {
      this.schedule(this.step, this.nextTime);
      this.nextTime += 60 / this.bpm / 4;
      this.step = (this.step + 1) % CYCLE_STEPS;
    }
  }

  /** Derrota: corta a banda e toca o trombone triste. */
  sadTrombone(): void {
    this.stop();
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.25;
    const stepDur = 0.11;
    // Passa por fora do bus (que acabou de silenciar), direto no filtro.
    const out = this.filter;
    for (const [s, midi, len] of SAD_TROMBONE) {
      const isLast = s === SAD_TROMBONE[SAD_TROMBONE.length - 1]![0];
      this.kazoo(out, t0 + s * stepDur, midiToHz(midi), len * stepDur, 0.3, isLast ? 5 : 0, 700);
    }
  }

  private fade(to: number, time: number): void {
    const g = this.bus.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setTargetAtTime(to, this.ctx.currentTime, time);
  }

  private schedule(step: number, t: number): void {
    const m = this.mode;
    const inBar = step % STEPS_PER_BAR;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const chordIdx = bar % BARS_PER_PHRASE;
    const sectionB = bar >= BARS_PER_PHRASE;
    // Troca de tom só no início da frase, para não desafinar no meio.
    if (step % PHRASE_STEPS === 0) this.transpose = m.transpose;
    const tr = this.transpose;
    const stepDur = 60 / this.bpm / 4;
    const chord = CHORDS[chordIdx]!;
    const out = this.bus;

    // --- Bateria ---
    const kickHere = m.fourOnFloor ? inBar % 4 === 0 : inBar === 0 || inBar === 8 || inBar === 10;
    if (kickHere) this.kick(out, t);
    if (inBar === 4 || inBar === 12) this.snare(out, t);
    if (m.hats16 || inBar % 2 === 0) this.hat(out, t, inBar === 14 && !m.hats16 ? 0.16 : 0.035, inBar % 4 === 2 ? 0.12 : 0.07);
    if (m.cowbell && inBar % 4 === 2) this.cowbell(out, t);
    // Virada de tom-tom no fim de cada frase: o clássico dos anos 80.
    if (chordIdx === 3 && inBar >= 12) this.tom(out, t, 260 - (inBar - 12) * 40);
    if (m.orchHit && step % PHRASE_STEPS === 0) this.orchHit(out, t, chord.triad, tr);

    // --- Baixo: oitavas saltitantes em colcheias ---
    if (inBar % 2 === 0) {
      const up = inBar % 4 === 2;
      this.bass(out, t, midiToHz(chord.bass + tr + (up ? 12 : 0)), stepDur * 1.7);
    }

    // --- Pad: acorde longo de sintetizador no começo do compasso ---
    if (inBar === 0) for (const n of chord.triad) this.pad(out, t, midiToHz(n + tr), stepDur * STEPS_PER_BAR);

    // --- Arpejo de semicolcheias quando o bicho pega ---
    if (m.arp) {
      const seq = [0, 1, 2, 1];
      const n = chord.triad[seq[inBar % 4]!]! + 12 + (inBar % 8 >= 4 ? 12 : 0);
      this.blip(out, t, midiToHz(n + tr), stepDur * 0.8);
    }

    // --- Melodia ---
    const melody = (sectionB ? MELODY_B : MELODY_A)[chordIdx]!;
    for (const note of melody) {
      if (note[0] !== inBar) continue;
      this.lead(out, t, note, tr, stepDur, sectionB);
    }
  }

  private lead(out: AudioNode, t: number, [, midi, len]: NoteEvent, tr: number, stepDur: number, kazoo: boolean): void {
    const hz = midiToHz(midi + tr);
    const dur = len * stepDur * 0.92;
    if (kazoo) this.kazoo(out, t, hz, dur, 0.12, 6, 1400);
    else this.square(out, t, hz, dur, 0.07);
  }

  // ---------------------------------------------------------------- vozes

  private env(g: GainNode, t: number, attack: number, dur: number, peak: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private osc(type: OscillatorType, hz: number, t: number, dur: number): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(hz, t);
    o.start(t);
    o.stop(t + dur + 0.03);
    return o;
  }

  private kick(out: AudioNode, t: number): void {
    const o = this.osc('sine', 150, t, 0.3);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = this.ctx.createGain();
    this.env(g, t, 0.003, 0.28, 0.75);
    o.connect(g).connect(out);
  }

  /** Caixa "gated reverb": estalo + cauda de ruído cortada seco. */
  private snare(out: AudioNode, t: number): void {
    this.noiseHit(out, t, 0.2, 'bandpass', 1900, 0.7, 0.32);
    const o = this.osc('triangle', 210, t, 0.1);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    const g = this.ctx.createGain();
    this.env(g, t, 0.002, 0.09, 0.25);
    o.connect(g).connect(out);
  }

  private hat(out: AudioNode, t: number, dur: number, peak: number): void {
    this.noiseHit(out, t, dur, 'highpass', 8000, 0.8, peak);
  }

  private cowbell(out: AudioNode, t: number): void {
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 800;
    f.Q.value = 2;
    const g = this.ctx.createGain();
    this.env(g, t, 0.002, 0.18, 0.16);
    f.connect(g).connect(out);
    this.osc('square', 562, t, 0.18).connect(f);
    this.osc('square', 845, t, 0.18).connect(f);
  }

  private tom(out: AudioNode, t: number, hz: number): void {
    const o = this.osc('sine', hz, t, 0.2);
    o.frequency.exponentialRampToValueAtTime(hz * 0.55, t + 0.18);
    const g = this.ctx.createGain();
    this.env(g, t, 0.003, 0.2, 0.4);
    o.connect(g).connect(out);
  }

  /** "TÃÃÃ!": acorde de serra empilhado com ataque seco. */
  private orchHit(out: AudioNode, t: number, triad: readonly number[], tr: number): void {
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(5000, t);
    f.frequency.exponentialRampToValueAtTime(600, t + 0.4);
    const g = this.ctx.createGain();
    this.env(g, t, 0.004, 0.45, 0.22);
    f.connect(g).connect(out);
    for (const n of triad) {
      this.osc('sawtooth', midiToHz(n + tr - 12), t, 0.45).connect(f);
      this.osc('sawtooth', midiToHz(n + tr) * 1.005, t, 0.45).connect(f);
    }
    this.noiseHit(out, t, 0.12, 'lowpass', 3000, 0.5, 0.2);
  }

  private bass(out: AudioNode, t: number, hz: number, dur: number): void {
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 6;
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(260, t + dur);
    const g = this.ctx.createGain();
    this.env(g, t, 0.005, dur, 0.28);
    this.osc('sawtooth', hz, t, dur).connect(f).connect(g).connect(out);
  }

  private pad(out: AudioNode, t: number, hz: number, dur: number): void {
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1100;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.025, t + dur * 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g).connect(out);
    this.osc('sawtooth', hz, t, dur).connect(f);
    this.osc('sawtooth', hz * 1.007, t, dur).connect(f);
  }

  private blip(out: AudioNode, t: number, hz: number, dur: number): void {
    const g = this.ctx.createGain();
    this.env(g, t, 0.003, dur, 0.045);
    this.osc('triangle', hz, t, dur).connect(g).connect(out);
  }

  private square(out: AudioNode, t: number, hz: number, dur: number, peak: number): void {
    const o = this.osc('square', hz, t, dur);
    // Vibrato atrasado: a nota "canta" só quando segura.
    if (dur > 0.25) {
      const lfo = this.osc('sine', 5.5, t, dur);
      const depth = this.ctx.createGain();
      depth.gain.setValueAtTime(0, t);
      depth.gain.linearRampToValueAtTime(hz * 0.012, t + dur);
      lfo.connect(depth).connect(o.frequency);
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    g.gain.setValueAtTime(peak, t + Math.max(0.011, dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
  }

  /** Serra num filtro estreito com vibrato: soa como um kazoo de festa. */
  private kazoo(out: AudioNode, t: number, hz: number, dur: number, peak: number, vibratoHz: number, formant: number): void {
    const o = this.osc('sawtooth', hz * 0.97, t, dur);
    o.frequency.exponentialRampToValueAtTime(hz, t + 0.04);
    if (vibratoHz > 0) {
      const lfo = this.osc('sine', vibratoHz, t, dur);
      const depth = this.ctx.createGain();
      depth.gain.value = hz * 0.025;
      lfo.connect(depth).connect(o.frequency);
    }
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = formant;
    f.Q.value = 2.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    g.gain.setValueAtTime(peak, t + Math.max(0.021, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(out);
  }

  private noiseHit(
    out: AudioNode,
    t: number,
    dur: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    peak: number,
  ): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    this.env(g, t, 0.002, dur, peak);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }
}
