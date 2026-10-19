import { describe, expect, it } from 'vitest';
import { CHORDS, MELODY_A, MELODY_B, MUSIC_MODES, STEPS_PER_BAR, midiToHz, musicModeFor } from '@/game/data/music';

describe('trilha', () => {
  it('acelera no chefe e no último coração, e os dois somam', () => {
    const normal = musicModeFor({ inRun: true, bossActive: false, lowHp: false });
    const danger = musicModeFor({ inRun: true, bossActive: false, lowHp: true });
    const boss = musicModeFor({ inRun: true, bossActive: true, lowHp: false });
    const both = musicModeFor({ inRun: true, bossActive: true, lowHp: true });
    expect(normal.id).toBe('normal');
    expect(danger.bpm).toBeGreaterThan(normal.bpm);
    expect(boss.bpm).toBeGreaterThan(danger.bpm);
    expect(both.bpm).toBeGreaterThan(boss.bpm);
  });

  it('fora da run toca a versão calma do menu', () => {
    expect(musicModeFor({ inRun: false, bossActive: true, lowHp: true })).toBe(MUSIC_MODES.menu);
  });

  it('melodias cabem nos compassos e seguem os acordes da frase', () => {
    for (const melody of [MELODY_A, MELODY_B]) {
      expect(melody).toHaveLength(CHORDS.length);
      for (const bar of melody) {
        for (const [step, midi, len] of bar) {
          expect(step).toBeGreaterThanOrEqual(0);
          expect(step + len).toBeLessThanOrEqual(STEPS_PER_BAR);
          expect(midi).toBeGreaterThan(40);
        }
      }
    }
  });

  it('converte MIDI em Hz', () => {
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(81)).toBeCloseTo(880);
  });
});
