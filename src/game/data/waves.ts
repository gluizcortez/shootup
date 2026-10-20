import type { WaveConfig } from '@/core/run/waves';

/**
 * Ondas do protótipo: os animais descem do topo, poucos de cada vez, e o elenco
 * entra aos poucos. Patos nas 1–2, Vaca Loca estreia na 3, Galinha Rambo na 4,
 * Ninjas de Asa-Delta na 6 e o Tio do Cassino na 9. Onda 10: Toni Mantega.
 * Vida e velocidade dos inimigos crescem devagar a cada onda (`growth`).
 */
export const WAVES: WaveConfig = {
  firstWaveDelay: 1.2,
  intermission: 2.2,
  clearBonusPerWave: 15,
  clearHeal: 0.5,
  maxAlive: 7,
  growth: { hpPerWave: 0.08, speedPerWave: 0.02, maxSpeedMult: 1.35 },
  scripted: [
    {
      callout: 'GOONS ON THE BLOCK!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.75 },
        { kind: 'pato_pistoleiro', delay: 3, x: 0.25 },
      ],
    },
    {
      callout: 'THE GANG IS HERE!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.2 },
        { kind: 'pato_pistoleiro', delay: 1.5, x: 0.8 },
        { kind: 'pato_pistoleiro', delay: 4, x: 'random' },
      ],
    },
    {
      callout: 'THE KING HAS ENTERED THE BUILDING!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.3 },
        { kind: 'vaca_loca', delay: 2.5, x: 0.7 },
        { kind: 'pato_pistoleiro', delay: 5, x: 'random' },
      ],
    },
    {
      callout: 'WATCH OUT: HIRED TERMINATOR!',
      spawns: [
        { kind: 'galinha_rambo', delay: 0, x: 0.85 },
        { kind: 'pato_pistoleiro', delay: 3, x: 0.15 },
        { kind: 'pato_pistoleiro', delay: 5.5, x: 'random' },
      ],
    },
    {
      callout: 'RATINGS THROUGH THE ROOF!',
      spawns: [
        { kind: 'pato_pistoleiro', delay: 0, x: 0.15 },
        { kind: 'pato_pistoleiro', delay: 1.5, x: 0.85 },
        { kind: 'galinha_rambo', delay: 3, x: 'random' },
        { kind: 'vaca_loca', delay: 6, x: 'random' },
      ],
    },
    {
      callout: 'NINJAS FROM THE SKY!',
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
      callout: 'THE BOSS HAS ARRIVED!',
      spawns: [
        { kind: 'don_pombone', delay: 0, x: 0.5 },
        { kind: 'pato_pistoleiro', delay: 6, x: 0.15 },
        { kind: 'pato_pistoleiro', delay: 12, x: 0.85 },
      ],
    },
  },
};
