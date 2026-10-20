/** Falas dos personagens, mostradas em balão de gibi (sem áudio, a pedido). */
export type VoiceLineId = 'toniAppear' | 'toniRage' | 'toniDeath';

export interface VoiceLineDef {
  readonly text: string;
  /** Quanto tempo o balão fica na tela, em segundos. */
  readonly seconds: number;
}

export const VOICE_LINES: Readonly<Record<VoiceLineId, VoiceLineDef>> = {
  toniAppear: { text: 'The only thing in this world that gives orders... is shoots!', seconds: 4.5 },
  toniRage: { text: 'Say hello to my little friend!', seconds: 2.8 },
  toniDeath: { text: 'Say goodnight to the bad guy!', seconds: 3 },
};
