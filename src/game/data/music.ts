/**
 * Trilha sonora: faixas gravadas (MP3 em public/music) geradas com o modelo
 * aberto ACE-Step 1.5 (licença MIT) a partir das descrições abaixo.
 * O jogo escolhe a faixa pelo "humor" da run e acelera o andamento
 * (playbackRate) quando o bicho pega: chefe em campo e último coração.
 */

export type TrackId = 'menu' | 'arena' | 'chefe';

export interface TrackDef {
  readonly id: TrackId;
  readonly file: string;
  readonly bpm: number;
  /** Trecho em loop [início, fim] em segundos, alinhado nos compassos (o arquivo já vem com a emenda em crossfade). */
  readonly loop: readonly [number, number];
  /** Ganho relativo (as faixas saem do gerador com volumes diferentes). */
  readonly gain: number;
  /** Descrição usada para gerar a faixa (documentação/reprodutibilidade). */
  readonly prompt: string;
  readonly seed: number;
}

export const TRACKS: Readonly<Record<TrackId, TrackDef>> = {
  menu: {
    id: 'menu',
    file: 'music/menu.mp3',
    bpm: 108,
    loop: [0, 28.889],
    gain: 1,
    prompt:
      'chill but fun 80s Miami night drive, retro synthwave, palm trees and neon signs, warm analog synth pads, groovy bass, gated drums, catchy saxophone melody, video store vibe, title screen music, instrumental',
    seed: 302,
  },
  arena: {
    id: 'arena',
    file: 'music/arena.mp3',
    bpm: 124,
    loop: [0, 40.65],
    gain: 1,
    prompt:
      '80s Miami action movie car chase, outrun synthwave, neon nights on Ocean Drive, driving arpeggiated synth bass, punchy LinnDrum gated reverb snare, catchy neon synth lead hook, saxophone solo, electric guitar power chords, cheesy over-the-top fun, video game soundtrack, instrumental / main hook, memorable melody / sax solo / main hook reprise, high energy',
    seed: 101,
  },
  chefe: {
    id: 'chefe',
    file: 'music/chefe.mp3',
    bpm: 150,
    loop: [0, 32],
    gain: 1,
    prompt:
      'over the top 80s action hero vs drug lord showdown, synthwave meets hair metal, fast tempo, double kick drums, screaming guitar, gated snare, dramatic choir pads, orchestra hits, neon Miami night, cheesy and epic, video game boss battle, instrumental',
    seed: 202,
  },
};

/** [passo, nota MIDI, duração em passos] */
export type NoteEvent = readonly [step: number, midi: number, len: number];

/** "Uóóó-uó-uó-uóóóó": trombone triste da derrota (sintetizado na hora). */
export const SAD_TROMBONE: readonly NoteEvent[] = [
  [0, 63, 3],
  [3, 62, 3],
  [6, 61, 3],
  [9, 60, 9],
];

export type MusicModeId = 'menu' | 'normal' | 'danger' | 'boss' | 'bossDanger';

export interface MusicMode {
  readonly id: MusicModeId;
  readonly track: TrackId;
  /** Multiplicador de andamento (e de tom: acelerar deixa tudo mais "desenho animado"). */
  readonly rate: number;
}

export const MUSIC_MODES: Readonly<Record<MusicModeId, MusicMode>> = {
  menu: { id: 'menu', track: 'menu', rate: 1 },
  normal: { id: 'normal', track: 'arena', rate: 1 },
  danger: { id: 'danger', track: 'arena', rate: 1.16 },
  boss: { id: 'boss', track: 'chefe', rate: 1 },
  bossDanger: { id: 'bossDanger', track: 'chefe', rate: 1.12 },
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

/** Andamento efetivo em BPM de um modo. */
export function effectiveBpm(mode: MusicMode): number {
  return TRACKS[mode.track].bpm * mode.rate;
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
