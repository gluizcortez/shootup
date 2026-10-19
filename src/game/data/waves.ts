import type { WaveConfig } from '@/core/run/waves';

/** Ondas do protótipo: primeiro só patos, depois a Galinha Rambo estreia. */
export const WAVES: WaveConfig = {
  firstWaveDelay: 1.2,
  intermission: 2.2,
  clearBonusPerWave: 150,
  maxAlive: 9,
  scripted: [
    {
      callout: 'PATOS NA ÁREA!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, side: 1 },
        { kind: 'pato_pistoleiro', delay: 2.2, side: -1 },
      ],
    },
    {
      callout: 'O BANDO CHEGOU!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, side: -1 },
        { kind: 'pato_pistoleiro', delay: 0.8, side: 1 },
        { kind: 'pato_pistoleiro', delay: 2.5, side: 'random' },
        { kind: 'pato_pistoleiro', delay: 3.2, side: 'random' },
      ],
    },
    {
      callout: 'CUIDADO: GALINHA ARMADA!',
      spawns: [
        { kind: 'galinha_rambo', delay: 0, side: 1 },
        { kind: 'pato_pistoleiro', delay: 2.5, side: -1 },
        { kind: 'pato_pistoleiro', delay: 4, side: -1 },
      ],
    },
    {
      callout: 'AUDIÊNCIA EM ALTA!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, side: -1 },
        { kind: 'pato_pistoleiro', delay: 0.4, side: 1 },
        { kind: 'galinha_rambo', delay: 1.5, side: 'random' },
        { kind: 'pato_pistoleiro', delay: 3.5, side: 'random' },
        { kind: 'galinha_rambo', delay: 6, side: 'random' },
        { kind: 'pato_pistoleiro', delay: 6.5, side: 'random' },
      ],
    },
  ],
};
