import type { WaveConfig } from '@/core/run/waves';

/**
 * Ondas comuns: cada uma traz X vilões que entram TODOS JUNTOS pelo topo, e X
 * cresce com as ondas (2, 2, 3, 4, 5, 5, 6, 7, 8... até 12). O elenco libera
 * aos poucos, com estreia garantida: Capangas na 1, Patinador Assassino na 2,
 * Rei do Topete na 3, Exterminador na 4, Maromba Miami Vice na 5, Ninjas de
 * Asa-Delta na 6, Policial Corrupto na 7 e o Tio do Cassino na 9.
 * Onda 10 (chefe Toni Mantega) é a exceção: entradas cronometradas.
 * Vida e velocidade dos inimigos crescem devagar a cada onda (`growth`).
 */
export const WAVES: WaveConfig = {
  firstWaveDelay: 1.2,
  intermission: 2.2,
  clearBonusPerWave: 15,
  clearHeal: 0.5,
  maxAlive: 7,
  growth: { hpPerWave: 0.08, speedPerWave: 0.02, maxSpeedMult: 1.35 },
  size: { base: 2, perWave: 0.75, max: 12 },
  roster: [
    { kind: 'pato_pistoleiro', from: 1, weight: 3, debutCallout: 'GOONS ON THE BLOCK!' },
    { kind: 'patinador_assassino', from: 2, weight: 2, maxPerWave: 3, debutCallout: 'ROLLER DISCO OF DEATH!' },
    { kind: 'vaca_loca', from: 3, weight: 1.5, maxPerWave: 2, debutCallout: 'THE KING HAS ENTERED THE BUILDING!' },
    { kind: 'galinha_rambo', from: 4, weight: 1.5, maxPerWave: 3, debutCallout: 'WATCH OUT: HIRED TERMINATOR!' },
    { kind: 'maromba_vice', from: 5, weight: 1, maxPerWave: 2, debutCallout: "SUN'S OUT, GUNS OUT!" },
    { kind: 'pombo_mafioso', from: 6, weight: 1, maxPerWave: 2, debutCallout: 'NINJAS FROM THE SKY!' },
    { kind: 'policial_corrupto', from: 7, weight: 1.5, maxPerWave: 3, debutCallout: 'FREEZE, PUNK! THE COPS ARE CROOKED!' },
    { kind: 'porco_executivo', from: 9, weight: 1, maxPerWave: 2 },
  ],
  callouts: [
    'RATINGS THROUGH THE ROOF!',
    'MORE EXTRAS ON SET!',
    'THE PRODUCER WANTS MORE!',
    'GOONS ON THE BLOCK!',
    'THE GANG IS HERE!',
    'ROLLER DISCO OF DEATH!',
    'MIAMI VICE SQUAD ON THE TAKE!',
    'PUMP UP THE VOLUME!',
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
