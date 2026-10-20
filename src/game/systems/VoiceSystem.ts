import { VOICE_DUCK, VOICE_LINES, type VoiceLineId } from '../data/voices';

const DUCK_FADE = 0.12;

/**
 * Toca falas gravadas por cima de tudo, abaixando a música enquanto fala.
 * Uma fala por vez: a nova corta a anterior. Arquivos carregam no unlock;
 * se não chegarem, o jogo segue mudo (offline-first).
 */
export class VoiceSystem {
  private readonly buffers = new Map<VoiceLineId, AudioBuffer>();
  private readonly out: GainNode;
  private current: AudioBufferSourceNode | null = null;

  constructor(
    private readonly ctx: AudioContext,
    out: AudioNode,
    private readonly duck: GainNode,
    baseUrl: string,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = 1.7;
    this.out.connect(out);
    for (const id of Object.keys(VOICE_LINES) as VoiceLineId[]) {
      fetch(baseUrl + VOICE_LINES[id].file)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((data) => ctx.decodeAudioData(data))
        .then((buf) => this.buffers.set(id, buf))
        .catch((err: unknown) => console.warn(`[voice] fala ${id} indisponível; seguindo sem ela.`, err));
    }
  }

  play(id: VoiceLineId): void {
    const buf = this.buffers.get(id);
    if (!buf) return;
    this.stop();
    const t = this.ctx.currentTime + VOICE_LINES[id].delay;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.out);
    src.start(t);
    const g = this.duck.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setTargetAtTime(VOICE_DUCK, t - DUCK_FADE, DUCK_FADE / 3);
    g.setTargetAtTime(1, t + buf.duration, DUCK_FADE);
    src.onended = () => {
      if (this.current === src) this.current = null;
    };
    this.current = src;
  }

  stop(): void {
    const src = this.current;
    if (!src) return;
    this.current = null;
    try {
      src.stop();
    } catch {
      // já tinha parado
    }
    this.duck.gain.cancelScheduledValues(this.ctx.currentTime);
    this.duck.gain.setTargetAtTime(1, this.ctx.currentTime, DUCK_FADE);
  }
}
