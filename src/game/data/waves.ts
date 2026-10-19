import type { WaveConfig } from '@/core/run/waves';

/** Ondas do protótipo: os animais descem do topo. Primeiro só patos, depois a Galinha Rambo estreia. */
export const WAVES: WaveConfig = {
  firstWaveDelay: 1.2,
  intermission: 2.2,
  clearBonusPerWave: 150,
  maxAlive: 9,
  scripted: [
    {
      callout: 'PATOS NA ÁREA!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.75 },
        { kind: 'pato_pistoleiro', delay: 2.2, x: 0.25 },
      ],
    },
    {
      callout: 'O BANDO CHEGOU!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.2 },
        { kind: 'pato_pistoleiro', delay: 0.8, x: 0.8 },
        { kind: 'pato_pistoleiro', delay: 2.5, x: 'random' },
        { kind: 'pato_pistoleiro', delay: 3.2, x: 'random' },
      ],
    },
    {
      callout: 'CUIDADO: GALINHA ARMADA!',
      spawns: [
        { kind: 'galinha_rambo', delay: 0, x: 0.85 },
        { kind: 'pato_pistoleiro', delay: 2.5, x: 0.15 },
        { kind: 'pato_pistoleiro', delay: 4, x: 0.3 },
      ],
    },
    {
      callout: 'AUDIÊNCIA EM ALTA!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.15 },
        { kind: 'pato_pistoleiro', delay: 0.4, x: 0.85 },
        { kind: 'galinha_rambo', delay: 1.5, x: 'random' },
        { kind: 'pato_pistoleiro', delay: 3.5, x: 'random' },
        { kind: 'galinha_rambo', delay: 6, x: 'random' },
        { kind: 'pato_pistoleiro', delay: 6.5, x: 'random' },
      ],
    },
  ],
};
