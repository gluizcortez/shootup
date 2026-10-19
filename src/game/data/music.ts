/**
 * Trilha "Auditório Turbo": synth-pop anos 80 de programa de auditório,
 * 100% composta aqui e sintetizada em tempo real (sem arquivos de áudio).
 * Notas em MIDI; cada compasso tem 16 passos (semicolcheias).
 * Progressão clássica Am–F–C–G em frases de 4 compassos; a melodia alterna
 * entre o "chiptune" (A) e o "kazoo" (B), formando um ciclo de 8 compassos.
 */

/** [passo dentro do compasso, nota MIDI, duração em passos] */
export type NoteEvent = readonly [step: number, midi: number, len: number];

export const STEPS_PER_BAR = 16;
export const BARS_PER_PHRASE = 4;

/** Acordes da frase: fundamental do baixo + tríade do arpejo/pad. */
export const CHORDS: readonly { readonly bass: number; readonly triad: readonly [number, number, number] }[] = [
  { bass: 33, triad: [57, 60, 64] }, // Am
  { bass: 29, triad: [53, 57, 60] }, // F
  { bass: 36, triad: [55, 60, 64] }, // C
  { bass: 31, triad: [55, 59, 62] }, // G
];

/** Melodia A: pulinho chiptune que gruda na cabeça. */
export const MELODY_A: readonly (readonly NoteEvent[])[] = [
  [[0, 69, 2], [2, 72, 2], [4, 76, 3], [7, 74, 1], [8, 72, 2], [10, 74, 2], [12, 76, 4]],
  [[0, 77, 2], [2, 76, 1], [3, 74, 1], [4, 72, 4], [10, 69, 2], [12, 72, 4]],
  [[0, 76, 2], [2, 79, 2], [4, 84, 3], [7, 83, 1], [8, 79, 2], [10, 76, 2], [12, 79, 4]],
  [[0, 79, 2], [2, 81, 1], [3, 79, 1], [4, 74, 2], [6, 71, 2], [8, 74, 4], [12, 79, 2], [14, 71, 2]],
];

/** Melodia B: o kazoo responde "na-na-naaa" como plateia empolgada. */
export const MELODY_B: readonly (readonly NoteEvent[])[] = [
  [[0, 81, 1], [1, 81, 1], [2, 81, 2], [6, 79, 1], [7, 81, 3], [12, 76, 2], [14, 77, 2]],
  [[0, 77, 1], [1, 77, 1], [2, 77, 2], [6, 76, 1], [7, 77, 3], [12, 72, 2], [14, 74, 2]],
  [[0, 76, 1], [1, 76, 1], [2, 76, 2], [6, 74, 1], [7, 76, 3], [12, 79, 2], [14, 84, 2]],
  [[0, 83, 6], [6, 81, 1], [7, 79, 1], [8, 74, 8]],
];

/** "Uóóó-uó-uó-uóóóó": trombone triste da derrota. */
export const SAD_TROMBONE: readonly NoteEvent[] = [
  [0, 63, 3],
  [3, 62, 3],
  [6, 61, 3],
  [9, 60, 9],
];

export type MusicModeId = 'menu' | 'normal' | 'danger' | 'boss' | 'bossDanger';

export interface MusicMode {
  readonly id: MusicModeId;
  readonly bpm: number;
  /** Bumbo em todos os tempos (senão só no 1 e no 3). */
  readonly fourOnFloor: boolean;
  /** Chimbal em semicolcheias (senão colcheias). */
  readonly hats16: boolean;
  readonly arp: boolean;
  /** More cowbell. */
  readonly cowbell: boolean;
  /** Orquestra "TÃÃÃ" no começo de cada frase. */
  readonly orchHit: boolean;
  /** Troca de tom brega dos anos 80 (semitons), aplicada no início da frase. */
  readonly transpose: number;
}

export const MUSIC_MODES: Readonly<Record<MusicModeId, MusicMode>> = {
  menu: { id: 'menu', bpm: 108, fourOnFloor: false, hats16: false, arp: false, cowbell: false, orchHit: false, transpose: 0 },
  normal: { id: 'normal', bpm: 118, fourOnFloor: false, hats16: false, arp: false, cowbell: false, orchHit: false, transpose: 0 },
  danger: { id: 'danger', bpm: 140, fourOnFloor: true, hats16: true, arp: true, cowbell: false, orchHit: false, transpose: 0 },
  boss: { id: 'boss', bpm: 148, fourOnFloor: true, hats16: true, arp: true, cowbell: true, orchHit: true, transpose: 2 },
  bossDanger: { id: 'bossDanger', bpm: 160, fourOnFloor: true, hats16: true, arp: true, cowbell: true, orchHit: true, transpose: 3 },
};

export interface MusicContext {
  readonly inRun: boolean;
  readonly bossActive: boolean;
  readonly lowHp: boolean;
}

/** Escolhe o "humor" da trilha: chefe e último coração aceleram (e somam). */
export function musicModeFor(c: MusicContext): MusicMode {
  if (!c.inRun) return MUSIC_MODES.menu;
  if (c.bossActive) return MUSIC_MODES[c.lowHp ? 'bossDanger' : 'boss'];
  return MUSIC_MODES[c.lowHp ? 'danger' : 'normal'];
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
