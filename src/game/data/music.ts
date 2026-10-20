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
  /** Trecho em loop [início, fim] em segundos, alinhado nos compassos. */
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
    loop: [6.099, 32.766],
    gain: 1,
    prompt:
      '80s TV game show theme song, cheesy and funny, bright synth brass fanfare, groovy bass, handclaps, sparkly keyboards, studio audience party vibe, retro television intro music, instrumental',
    seed: 31,
  },
  arena: {
    id: 'arena',
    file: 'music/arena.mp3',
    bpm: 124,
    loop: [7.757, 54.208],
    gain: 1,
    prompt:
      '80s synthpop arcade action theme, upbeat goofy comedic cartoon energy, punchy gated reverb drums, funky slap bass, bright brass stabs, cheesy catchy synth lead melody, cowbell, orchestra hits, video game soundtrack, instrumental / main theme, memorable catchy melody, driving beat / bridge, playful saxophone solo / main theme reprise, high energy',
    seed: 11,
  },
  chefe: {
    id: 'chefe',
    file: 'music/chefe.mp3',
    bpm: 150,
    loop: [0.38, 38.78],
    gain: 1,
    prompt:
      '80s hair metal meets synthwave boss fight, fast, epic and ridiculous, double kick drums, shredding guitar solo, dramatic choir and orchestra hits, synth bass arpeggios, big brass fanfare, video game final boss music, instrumental',
    seed: 22,
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
