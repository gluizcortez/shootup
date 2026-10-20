/**
 * SFX 100% sintetizados com WebAudio: originais, sem arquivos e sem licença
 * de terceiros. Placeholders até a mixagem definitiva (GDD §9).
 */
import type { VoiceLineId } from '../data/voices';
import { MusicSystem } from './MusicSystem';
import { VoiceSystem } from './VoiceSystem';

export type SfxId =
  | 'shot'
  | 'hit'
  | 'crit'
  | 'killPato'
  | 'killGalinha'
  | 'enemyShotPato'
  | 'enemyShotGalinha'
  | 'telegraphPato'
  | 'telegraphGalinha'
  | 'incoming'
  | 'slam'
  | 'jump'
  | 'land'
  | 'hurt'
  | 'waveStart'
  | 'waveClear'
  | 'gameOver'
  | 'ui'
  | 'stomp'
  | 'moo'
  | 'dizzy'
  | 'killVaca'
  | 'ricochet'
  | 'cardOffer'
  | 'cardHover'
  | 'cardPick'
  | 'killPombo'
  | 'killPorco'
  | 'killBoss'
  | 'whistle'
  | 'wingFlap'
  | 'phone'
  | 'kaching'
  | 'shieldHit'
  | 'shieldBreak'
  | 'bossRage'
  | 'uiHover'
  | 'uiClick'
  | 'record'
  | 'rankIn'
  | 'cheer'
  | 'heartbeat'
  | 'boing';

/** Intervalo mínimo entre repetições do mesmo som (evita empilhar ruído). */
const MIN_GAP: Partial<Record<SfxId, number>> = {
  hit: 0.03,
  crit: 0.04,
  enemyShotGalinha: 0.05,
  land: 0.08,
  ricochet: 0.04,
  cardHover: 0.05,
  whistle: 0.08,
  shieldHit: 0.05,
  killPombo: 0.05,
  uiHover: 0.04,
  cheer: 0.5,
  boing: 0.06,
};

const MAX_VOICES = 24;


export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  /** Trilha sonora; existe só depois que o navegador libera o áudio. */
  music: MusicSystem | null = null;
  /** Falas gravadas dos personagens; abaixam a música enquanto tocam. */
  private voices: VoiceSystem | null = null;
  private musicVolume = 0.5;
  private noise: AudioBuffer | null = null;
  private readonly last = new Map<SfxId, number>();
  private voiceEnds: number[] = [];
  private volume = 0.7;
  private muted = false;

  /** Navegadores só liberam áudio após um gesto do usuário. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor({ latencyHint: 'interactive' });
        this.master = this.ctx.createGain();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 4;
        this.master.connect(comp).connect(this.ctx.destination);
        this.noise = this.makeNoise(this.ctx);
        this.musicGain = this.ctx.createGain();
        const duck = this.ctx.createGain();
        this.musicGain.connect(duck).connect(comp);
        this.voices = new VoiceSystem(this.ctx, this.master, duck, import.meta.env.BASE_URL);
        this.music = new MusicSystem(this.ctx, this.musicGain, import.meta.env.BASE_URL);
        this.applyVolume();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch (err) {
      console.warn('[audio] WebAudio indisponível; seguindo sem som.', err);
      this.ctx = null;
    }
  }

  setVolume(volume: number, muted: boolean, musicVolume = this.musicVolume): void {
    this.volume = volume;
    this.muted = muted;
    this.musicVolume = musicVolume;
    this.applyVolume();
  }

  private applyVolume(): void {
    if (!this.ctx) return;
    this.master?.gain.setValueAtTime(this.muted ? 0 : this.volume * 0.6, this.ctx.currentTime);
    this.musicGain?.gain.setValueAtTime(this.muted ? 0 : this.musicVolume * 0.55, this.ctx.currentTime);
  }

  play(id: SfxId, param = 1): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const gap = MIN_GAP[id];
    if (gap !== undefined && now - (this.last.get(id) ?? -1) < gap) return;
    this.voiceEnds = this.voiceEnds.filter((t) => t > now);
    if (this.voiceEnds.length >= MAX_VOICES && id !== 'hurt' && id !== 'gameOver') return;
    this.last.set(id, now);
    const end = this.render(ctx, this.master, id, now, param);
    this.voiceEnds.push(end);
  }

  private render(ctx: AudioContext, out: AudioNode, id: SfxId, t: number, param: number): number {
    const vary = 1 + (Math.random() - 0.5) * 0.12; // pitch variation discreta
    switch (id) {
      case 'shot':
        this.noiseBurst(ctx, out, t, 0.07, 2200 * vary, 0.9, 0.55, 'bandpass');
        this.sweep(ctx, out, t, 'triangle', 210 * vary, 55, 0.09, 0.55);
        this.sweep(ctx, out, t, 'square', 1400 * vary, 400, 0.03, 0.08);
        return t + 0.1;
      case 'hit':
        this.sweep(ctx, out, t, 'triangle', 950 * vary, 520, 0.05, 0.25);
        this.noiseBurst(ctx, out, t, 0.025, 4000, 1, 0.15, 'highpass');
        return t + 0.06;
      case 'crit':
        this.sweep(ctx, out, t, 'sine', 1320 * vary, 1300, 0.12, 0.22);
        this.sweep(ctx, out, t + 0.02, 'sine', 1980 * vary, 1960, 0.12, 0.16);
        this.noiseBurst(ctx, out, t, 0.03, 5000, 1, 0.2, 'highpass');
        return t + 0.15;
      case 'killPato': {
        // "Quá!" — dente de serra com filtro formante descendo.
        const o = ctx.createOscillator();
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(560 * vary, t);
        o.frequency.exponentialRampToValueAtTime(300, t + 0.2);
        f.type = 'bandpass';
        f.Q.value = 5;
        f.frequency.setValueAtTime(1500, t);
        f.frequency.exponentialRampToValueAtTime(700, t + 0.2);
        this.env(g, t, 0.005, 0.22, 0.5);
        o.connect(f).connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.25);
        this.noiseBurst(ctx, out, t, 0.08, 1200, 0.7, 0.35, 'lowpass');
        return t + 0.25;
      }
      case 'killGalinha': {
        // "Cócóricó" encurtado e indignado.
        const notes = [700, 1050, 520];
        notes.forEach((n, i) => this.sweep(ctx, out, t + i * 0.07, 'square', n * vary, n * 0.85, 0.08, 0.16));
        this.noiseBurst(ctx, out, t, 0.12, 900, 0.7, 0.45, 'lowpass');
        return t + 0.3;
      }
      case 'enemyShotPato':
        this.sweep(ctx, out, t, 'sine', 980 * vary, 260, 0.14, 0.22);
        this.noiseBurst(ctx, out, t, 0.04, 1800, 1, 0.12, 'bandpass');
        return t + 0.15;
      case 'enemyShotGalinha':
        // Mesmo "piu" macio do pato, só mais curto, agudo e baixinho: a rajada vira um "piu-piu-piu".
        this.sweep(ctx, out, t, 'sine', 1150 * vary, 340, 0.09, 0.13);
        this.noiseBurst(ctx, out, t, 0.025, 2000, 1, 0.05, 'bandpass');
        return t + 0.1;
      case 'telegraphPato':
        this.noiseBurst(ctx, out, t, 0.02, 3500, 2, 0.25, 'highpass');
        this.noiseBurst(ctx, out, t + 0.09, 0.03, 2500, 2, 0.3, 'highpass');
        this.sweep(ctx, out, t + 0.12, 'sine', 1600, 2400, 0.08, 0.06);
        return t + 0.22;
      case 'telegraphGalinha': {
        // Armando a arma: "tec-tec-tec" de engrenagem que acelera + assobio macio subindo + "cocó!" no fim.
        const dur = Math.max(0.2, param);
        const clicks = 5;
        for (let i = 0; i < clicks; i++) {
          const at = t + dur * (1 - Math.pow(1 - i / clicks, 1.6));
          this.sweep(ctx, out, at, 'triangle', 1700 + i * 120, 1300 + i * 120, 0.03, 0.07);
        }
        this.sweep(ctx, out, t, 'sine', 520, 1050, dur, 0.035, true);
        this.sweep(ctx, out, t + dur - 0.12, 'sine', 760 * vary, 640, 0.06, 0.1);
        this.sweep(ctx, out, t + dur - 0.05, 'sine', 1020 * vary, 820, 0.07, 0.1);
        return t + dur + 0.03;
      }
      case 'incoming': {
        // Assobio descendo: "lá vem coisa do teto".
        const dur = Math.max(0.3, param);
        this.sweep(ctx, out, t, 'sine', 1800 * vary, 700, dur, 0.07, true);
        return t + dur;
      }
      case 'slam':
        this.sweep(ctx, out, t, 'sine', 140, 38, 0.3, 0.6);
        this.noiseBurst(ctx, out, t, 0.18, 600, 0.8, 0.5, 'lowpass');
        return t + 0.3;
      case 'jump':
        this.sweep(ctx, out, t, 'sine', 300 * vary, 560, 0.09, 0.14);
        return t + 0.1;
      case 'land':
        this.noiseBurst(ctx, out, t, 0.06, 500, 0.8, Math.min(0.35, 0.1 + param * 0.25), 'lowpass');
        return t + 0.07;
      case 'hurt':
        this.sweep(ctx, out, t, 'square', 320, 110, 0.28, 0.3);
        this.noiseBurst(ctx, out, t, 0.15, 800, 0.8, 0.4, 'lowpass');
        return t + 0.3;
      case 'waveStart':
        [523, 659, 784, 1046].forEach((n, i) => this.sweep(ctx, out, t + i * 0.07, 'square', n, n, 0.09, 0.12));
        return t + 0.4;
      case 'waveClear':
        [784, 988, 1175, 1568].forEach((n, i) => this.sweep(ctx, out, t + i * 0.06, 'triangle', n, n, 0.12, 0.2));
        this.applause(ctx, out, t + 0.1, 1.1);
        return t + 1.2;
      case 'gameOver':
        // Trombone triste: "uá uá uá uááá".
        [392, 370, 349].forEach((n, i) => this.sweep(ctx, out, t + i * 0.32, 'sawtooth', n, n * 0.97, 0.28, 0.16, false, 900));
        this.sweep(ctx, out, t + 0.96, 'sawtooth', 330, 300, 0.9, 0.16, false, 900, 6);
        return t + 1.9;
      case 'ui':
        this.sweep(ctx, out, t, 'triangle', 1200, 900, 0.04, 0.12);
        return t + 0.05;
      case 'stomp': {
        // Casco batendo no chão três vezes durante o aviso.
        const dur = Math.max(0.3, param);
        for (let i = 0; i < 3; i++) {
          const at = t + (i * dur) / 3;
          this.sweep(ctx, out, at, 'sine', 110, 45, 0.12, 0.4);
          this.noiseBurst(ctx, out, at, 0.06, 500, 0.8, 0.3, 'lowpass');
        }
        return t + dur;
      }
      case 'moo':
        // "Muuu!" bravo: dente de serra grave com vibrato, filtrado.
        this.sweep(ctx, out, t, 'sawtooth', 150 * vary, 110, 0.55, 0.22, false, 700, 7);
        this.sweep(ctx, out, t, 'square', 75 * vary, 55, 0.5, 0.08, false, 400);
        return t + 0.55;
      case 'dizzy':
        // Passarinhos girando: três piados agudos.
        [1800, 2200, 1900].forEach((n, i) => this.sweep(ctx, out, t + 0.05 + i * 0.12, 'sine', n * vary, n * 1.25, 0.07, 0.07));
        this.sweep(ctx, out, t, 'sine', 160, 40, 0.35, 0.6);
        this.noiseBurst(ctx, out, t, 0.2, 700, 0.8, 0.55, 'lowpass');
        return t + 0.45;
      case 'killVaca':
        this.sweep(ctx, out, t, 'sawtooth', 220 * vary, 70, 0.6, 0.2, false, 800, 9);
        this.noiseBurst(ctx, out, t, 0.15, 900, 0.7, 0.45, 'lowpass');
        return t + 0.6;
      case 'ricochet':
        this.sweep(ctx, out, t, 'sine', 2600 * vary, 3900, 0.1, 0.08);
        this.noiseBurst(ctx, out, t, 0.02, 6000, 1, 0.12, 'highpass');
        return t + 0.11;
      case 'cardOffer':
        // Cartas deslizando na mesa.
        for (let i = 0; i < 3; i++) this.noiseBurst(ctx, out, t + i * 0.08, 0.07, 3000, 0.7, 0.18, 'bandpass');
        return t + 0.3;
      case 'cardHover':
        this.sweep(ctx, out, t, 'triangle', 1500 * vary, 1700, 0.03, 0.05);
        return t + 0.04;
      case 'killPombo':
        // "Rru-rru!" indignado.
        this.sweep(ctx, out, t, 'sine', 420 * vary, 300, 0.09, 0.25, false, undefined, 30);
        this.sweep(ctx, out, t + 0.1, 'sine', 380 * vary, 260, 0.12, 0.22, false, undefined, 30);
        this.noiseBurst(ctx, out, t, 0.08, 1500, 0.7, 0.3, 'lowpass');
        return t + 0.25;
      case 'killPorco':
        // "Óinc!" + caixa registradora.
        this.sweep(ctx, out, t, 'sawtooth', 600 * vary, 900, 0.08, 0.2, false, 1800);
        this.sweep(ctx, out, t + 0.08, 'sawtooth', 900 * vary, 400, 0.12, 0.2, false, 1800);
        [2093, 2637].forEach((n, i) => this.sweep(ctx, out, t + 0.2 + i * 0.06, 'triangle', n, n, 0.15, 0.12));
        return t + 0.4;
      case 'killBoss':
        // Sinfonia do fracasso mafioso: queda grave + fanfarra + aplausos.
        this.sweep(ctx, out, t, 'sawtooth', 300, 40, 1.1, 0.3, false, 900, 5);
        this.noiseBurst(ctx, out, t, 0.5, 400, 0.8, 0.6, 'lowpass');
        [523, 659, 784, 1046, 1318].forEach((n, i) => this.sweep(ctx, out, t + 0.5 + i * 0.09, 'square', n, n, 0.16, 0.14));
        this.applause(ctx, out, t + 0.6, 2.2);
        return t + 2.8;
      case 'whistle':
        // Assobio de mafioso antes da salva.
        this.sweep(ctx, out, t, 'sine', 1400 * vary, 2300, 0.12, 0.08);
        this.sweep(ctx, out, t + 0.15, 'sine', 1500 * vary, 1100, 0.18, 0.08);
        return t + 0.35;
      case 'wingFlap': {
        // Asas batendo forte durante o aviso do chefe.
        const dur = Math.max(0.4, param);
        const flaps = Math.max(3, Math.round(dur / 0.12));
        for (let i = 0; i < flaps; i++) this.noiseBurst(ctx, out, t + (i * dur) / flaps, 0.07, 700, 0.9, 0.45, 'lowpass');
        this.sweep(ctx, out, t, 'sawtooth', 90, 180, dur, 0.06, true, 600);
        return t + dur;
      }
      case 'phone': {
        // Celular do porco tocando: "REUNIÃO URGENTE!".
        const dur = Math.max(0.4, param);
        for (let i = 0; i < Math.floor(dur / 0.15); i++) {
          this.sweep(ctx, out, t + i * 0.15, 'square', i % 2 ? 1320 : 1760, i % 2 ? 1320 : 1760, 0.1, 0.06);
        }
        return t + dur;
      }
      case 'kaching':
        this.noiseBurst(ctx, out, t, 0.05, 3000, 1, 0.3, 'highpass');
        [2349, 3136].forEach((n, i) => this.sweep(ctx, out, t + 0.04 + i * 0.07, 'triangle', n, n, 0.2, 0.14));
        return t + 0.3;
      case 'shieldHit':
        this.sweep(ctx, out, t, 'sine', 2200 * vary, 1800, 0.06, 0.12);
        return t + 0.07;
      case 'shieldBreak':
        this.noiseBurst(ctx, out, t, 0.2, 5000, 0.7, 0.35, 'highpass');
        this.sweep(ctx, out, t, 'triangle', 2600, 500, 0.25, 0.18);
        return t + 0.27;
      case 'bossRage':
        this.sweep(ctx, out, t, 'sawtooth', 120, 260, 0.6, 0.3, false, 1200, 8);
        this.noiseBurst(ctx, out, t, 0.4, 600, 0.8, 0.5, 'lowpass');
        return t + 0.65;
      case 'uiHover':
        this.sweep(ctx, out, t, 'triangle', 1700 * vary, 2000, 0.03, 0.05);
        return t + 0.04;
      case 'uiClick':
        // "Plim" de botão de programa de auditório.
        this.sweep(ctx, out, t, 'square', 880, 1320, 0.05, 0.1, false, 3000);
        this.sweep(ctx, out, t + 0.05, 'triangle', 1760, 1760, 0.08, 0.1);
        return t + 0.14;
      case 'record':
        // Fanfarra de recorde + plateia ensandecida.
        [523, 659, 784, 1046, 784, 1046, 1318].forEach((n, i) => this.sweep(ctx, out, t + i * 0.1, 'square', n, n, 0.12, 0.14, false, 4000));
        this.sweep(ctx, out, t + 0.75, 'sawtooth', 1046, 1060, 0.7, 0.12, false, 3000, 6);
        this.applause(ctx, out, t + 0.2, 2.4);
        return t + 2.6;
      case 'rankIn':
        [659, 880, 1046].forEach((n, i) => this.sweep(ctx, out, t + i * 0.08, 'triangle', n, n, 0.14, 0.16));
        this.applause(ctx, out, t + 0.1, 1.2);
        return t + 1.3;
      case 'cheer':
        // Plateia: aplausos + assobios + "uhuu".
        this.applause(ctx, out, t, 1.3);
        this.sweep(ctx, out, t + 0.05, 'sine', 1800 * vary, 2600, 0.25, 0.06);
        this.sweep(ctx, out, t + 0.35, 'sine', 2000 * vary, 1500, 0.3, 0.05);
        this.sweep(ctx, out, t + 0.1, 'sawtooth', 300 * vary, 420, 0.45, 0.05, false, 1200, 5);
        return t + 1.4;
      case 'heartbeat':
        this.sweep(ctx, out, t, 'sine', 70, 45, 0.12, 0.55);
        this.sweep(ctx, out, t + 0.18, 'sine', 65, 40, 0.14, 0.45);
        return t + 0.35;
      case 'boing':
        // Mola cartunesca (onomatopeias de abate).
        this.sweep(ctx, out, t, 'sine', 220 * vary, 660, 0.18, 0.12, false, undefined, 18);
        return t + 0.2;
      case 'cardPick':
        [659, 880, 1318].forEach((n, i) => this.sweep(ctx, out, t + i * 0.05, 'triangle', n, n, 0.1, 0.16));
        this.noiseBurst(ctx, out, t, 0.06, 2500, 0.8, 0.2, 'bandpass');
        return t + 0.3;
    }
  }

  private env(g: GainNode, t: number, attack: number, dur: number, peak: number, sustain = false): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    if (sustain) {
      g.gain.setValueAtTime(peak, t + dur * 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
  }

  private sweep(
    ctx: AudioContext,
    out: AudioNode,
    t: number,
    type: OscillatorType,
    from: number,
    to: number,
    dur: number,
    peak: number,
    sustain = false,
    lowpass?: number,
    vibratoHz?: number,
  ): void {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    this.env(g, t, Math.min(0.01, dur * 0.2), dur, peak, sustain);
    let node: AudioNode = o;
    if (lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lowpass;
      node = node.connect(f);
    }
    if (vibratoHz) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = vibratoHz;
      depth.gain.value = from * 0.03;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur);
    }
    node.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noiseBurst(
    ctx: AudioContext,
    out: AudioNode,
    t: number,
    dur: number,
    freq: number,
    q: number,
    peak: number,
    type: BiquadFilterType,
  ): void {
    if (!this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t, 0.002, dur, peak);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  private applause(ctx: AudioContext, out: AudioNode, t: number, dur: number): void {
    if (!this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2500;
    f.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // Modulação rápida imita palmas individuais.
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.type = 'square';
    lfo.frequency.value = 13;
    depth.gain.value = 0.06;
    lfo.connect(depth).connect(g.gain);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + dur);
    lfo.start(t);
    lfo.stop(t + dur);
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** Toca uma fala gravada (respeita volume de efeitos e o mudo). */
  voice(id: VoiceLineId): void {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    this.voices?.play(id);
  }

  stopVoice(): void {
    this.voices?.stop();
  }

  destroy(): void {
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.music = null;
    this.voices = null;
  }
}
