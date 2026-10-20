import type { WaveConfig } from '@/core/run/waves';

/**
 * Ondas comuns: cada uma traz X vilões que entram TODOS JUNTOS pelo topo, e X
 * ganha +1 a cada 3 ondas (2, 2, 2, 3, 3, 3, 4... até 30, na onda 85).
 * Estreias (garantidas na própria onda), uma por onda até a 14, dos mais
 * simples aos mais chatos:
 *  1 Vice Goon · 2 Killer Roller · 3 Boombox Breaker · 4 King of the Quiff ·
 *  5 Rent-a-Terminator · 6 Miami Vice Muscle · 7 DJ Laser Bass ·
 *  8 Hang-Glider Ninja · 9 Crooked Vice Cop · 10 CHEFE Tony Mantega ·
 *  11 The Great Vegasini · 12 Casino Uncle · 13 Macho Mammoth · 14 Mr. But-Wait.
 * A onda 10 é a exceção: entradas cronometradas.
 * Vida e velocidade dos inimigos crescem devagar a cada onda (`growth`).
 */
export const WAVES: WaveConfig = {
  firstWaveDelay: 1.2,
  intermission: 2.2,
  clearBonusPerWave: 15,
  clearHeal: 0.5,
  maxAlive: 7,
  growth: { hpPerWave: 0.08, speedPerWave: 0.02, maxSpeedMult: 1.35 },
  size: { base: 2, every: 3, max: 30 },
  roster: [
    { kind: 'pato_pistoleiro', from: 1, weight: 3, debutCallout: 'GOONS ON THE BLOCK!' },
    { kind: 'patinador_assassino', from: 2, weight: 2, maxShare: 0.3, debutCallout: 'ROLLER DISCO OF DEATH!' },
    { kind: 'breaker_boombox', from: 3, weight: 1.5, maxShare: 0.25, debutCallout: 'BREAKDANCE BATTLE!' },
    { kind: 'vaca_loca', from: 4, weight: 1.2, maxShare: 0.2, debutCallout: 'THE KING HAS ENTERED THE BUILDING!' },
    { kind: 'galinha_rambo', from: 5, weight: 1.3, maxShare: 0.3, debutCallout: 'WATCH OUT: HIRED TERMINATOR!' },
    { kind: 'maromba_vice', from: 6, weight: 1, maxShare: 0.15, debutCallout: "SUN'S OUT, GUNS OUT!" },
    { kind: 'dj_neon', from: 7, weight: 1.2, maxShare: 0.2, debutCallout: 'THE DJ IS IN THE HOUSE!' },
    { kind: 'pombo_mafioso', from: 8, weight: 1, maxShare: 0.15, debutCallout: 'NINJAS FROM THE SKY!' },
    { kind: 'policial_corrupto', from: 9, weight: 1.3, maxShare: 0.3, debutCallout: 'FREEZE, PUNK! THE COPS ARE CROOKED!' },
    { kind: 'magico_vegas', from: 11, weight: 1.3, maxShare: 0.25, debutCallout: "IT'S MAGIC... OR MURDER!" },
    { kind: 'porco_executivo', from: 12, weight: 0.8, maxShare: 0.15, debutCallout: 'THE CASINO UNCLE IS ON A ROLL!' },
    { kind: 'lutador_mamute', from: 13, weight: 0.8, maxShare: 0.15, debutCallout: 'THE MAMMOTH ENTERS THE RING!' },
    { kind: 'vendedor_tv', from: 14, weight: 0.6, maxShare: 0.1, debutCallout: 'CALL NOW! OPERATORS STANDING BY!' },
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
