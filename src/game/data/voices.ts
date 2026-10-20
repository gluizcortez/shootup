/**
 * Falas gravadas (voz sintetizada por IA: Chatterbox guiado por Kokoro, com sotaque de gângster
 * cubano exagerado). Arquivos em public/voice; gerados por tools/voice.
 */
export type VoiceLineId = 'toniAppear' | 'toniRage' | 'toniDeath';

export interface VoiceLineDef {
  readonly file: string;
  /** Legenda do que é dito (mostrada no callout). */
  readonly text: string;
  /** Atraso em segundos depois do evento que dispara a fala. */
  readonly delay: number;
}

export const VOICE_LINES: Readonly<Record<VoiceLineId, VoiceLineDef>> = {
  toniAppear: {
    file: 'voice/toni_appear.mp3',
    text: 'The only thing in this world that gives orders... is shoots!',
    delay: 0.25,
  },
  toniRage: { file: 'voice/toni_rage.mp3', text: 'Say hello to my little friend!', delay: 0.1 },
  toniDeath: { file: 'voice/toni_death.mp3', text: 'Say goodnight to the bad guy!', delay: 0.35 },
};

/** Quanto a música abaixa enquanto alguém fala (ganho multiplicador). */
export const VOICE_DUCK = 0.35;
