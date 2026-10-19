import type { WaveConfig } from '@/core/run/waves';

/**
 * Ondas do protótipo: os animais descem do topo, poucos de cada vez, e o elenco
 * entra aos poucos. Patos nas 1–2, Vaca Loca estreia na 3, Galinha Rambo na 4,
 * Pombos Mafiosos na 6 e o Porco Executivo na 9. Onda 10: Don Pombone.
 * Vida e velocidade dos inimigos crescem devagar a cada onda (`growth`).
 */
export const WAVES: WaveConfig = {
  firstWaveDelay: 1.2,
  intermission: 2.2,
  clearBonusPerWave: 15,
  maxAlive: 7,
  growth: { hpPerWave: 0.08, speedPerWave: 0.02, maxSpeedMult: 1.35 },
  scripted: [
    {
      callout: 'PATOS NA ÁREA!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.75 },
        { kind: 'pato_pistoleiro', delay: 3, x: 0.25 },
      ],
    },
    {
      callout: 'O BANDO CHEGOU!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.2 },
        { kind: 'pato_pistoleiro', delay: 1.5, x: 0.8 },
        { kind: 'pato_pistoleiro', delay: 4, x: 'random' },
      ],
    },
    {
      callout: 'ESTOURO DA BOIADA!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.3 },
        { kind: 'vaca_loca', delay: 2.5, x: 0.7 },
        { kind: 'pato_pistoleiro', delay: 5, x: 'random' },
      ],
    },
    {
      callout: 'CUIDADO: GALINHA ARMADA!',
      spawns: [
        { kind: 'galinha_rambo', delay: 0, x: 0.85 },
        { kind: 'pato_pistoleiro', delay: 3, x: 0.15 },
        { kind: 'pato_pistoleiro', delay: 5.5, x: 'random' },
      ],
    },
    {
      callout: 'AUDIÊNCIA EM ALTA!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.15 },
        { kind: 'pato_pistoleiro', delay: 1.5, x: 0.85 },
        { kind: 'galinha_rambo', delay: 3, x: 'random' },
        { kind: 'vaca_loca', delay: 6, x: 'random' },
      ],
    },
    {
      callout: 'A FAMÍLIA CHEGOU!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.2 },
        { kind: 'pombo_mafioso', delay: 2, x: 0.6 },
        { kind: 'pato_pistoleiro', delay: 5, x: 'random' },
        { kind: 'galinha_rambo', delay: 7, x: 'random' },
      ],
    },
  ],
  bossWaves: {
    10: {
      callout: 'O PODEROSO POMBO CHEGOU!',
      spawns: [
        { kind: 'don_pombone', delay: 0, x: 0.5 },
        { kind: 'pato_pistoleiro', delay: 6, x: 0.15 },
        { kind: 'pato_pistoleiro', delay: 12, x: 0.85 },
      ],
    },
  },
};
