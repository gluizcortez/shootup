import { describe, expect, it } from 'vitest';
import { MUSIC_MODES, TRACKS, effectiveBpm, midiToHz, musicModeFor } from '@/game/data/music';

describe('trilha', () => {
  it('acelera no chefe e no último coração, e os dois somam', () => {
    const normal = musicModeFor({ inRun: true, bossActive: false, lowHp: false });
    const danger = musicModeFor({ inRun: true, bossActive: false, lowHp: true });
    const boss = musicModeFor({ inRun: true, bossActive: true, lowHp: false });
    const both = musicModeFor({ inRun: true, bossActive: true, lowHp: true });
    expect(normal.id).toBe('normal');
    expect(effectiveBpm(danger)).toBeGreaterThan(effectiveBpm(normal));
    expect(effectiveBpm(boss)).toBeGreaterThan(effectiveBpm(normal));
    expect(effectiveBpm(both)).toBeGreaterThan(effectiveBpm(boss));
    expect(boss.track).toBe('chefe');
  });

  it('fora da run toca a faixa do menu', () => {
    expect(musicModeFor({ inRun: false, bossActive: true, lowHp: true })).toBe(MUSIC_MODES.menu);
  });

  it('loops são trechos válidos', () => {
    for (const t of Object.values(TRACKS)) {
      expect(t.loop[0]).toBeGreaterThanOrEqual(0);
      expect(t.loop[1]).toBeGreaterThan(t.loop[0] + 5);
      expect(t.gain).toBeGreaterThan(0);
    }
  });

  it('converte MIDI em Hz', () => {
    expect(midiToHz(69)).toBe(440);
  });
});
