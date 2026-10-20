import { describe, expect, it } from 'vitest';
import { insertScore, MAX_ENTRIES, parseScores, rankFor, sanitizeName } from '@/shared/leaderboard';
import type { ScoreEntry } from '@/shared/leaderboard';

const entry = (score: number, name = 'A', wave = 1, date = '2026-10-19T00:00:00Z'): ScoreEntry => ({
  name,
  score,
  wave,
  kills: 1,
  bestCombo: 1,
  timeSeconds: 10,
  date,
});

describe('placar local', () => {
  it('limpa o nome: sem símbolos estranhos, espaços colapsados, máximo 12', () => {
    expect(sanitizeName('  Cortez  ')).toBe('Cortez');
    expect(sanitizeName('<script>x</script>')).toBe('scriptxscrip');
    expect(sanitizeName('a    b')).toBe('a b');
    expect(sanitizeName('ABCDEFGHIJKLMNOP')).toHaveLength(12);
    expect(sanitizeName('   ')).toBe('ANONYMOUS');
    expect(sanitizeName('João Ação!')).toBe('João Ação!');
  });

  it('insere na posição certa e corta no top 10', () => {
    let list: ScoreEntry[] = [];
    for (let i = 1; i <= 12; i++) list = insertScore(list, entry(i * 100)).list;
    expect(list).toHaveLength(MAX_ENTRIES);
    expect(list[0]?.score).toBe(1200);
    expect(list[9]?.score).toBe(300);
    const r = insertScore(list, entry(650, 'NOVO'));
    expect(r.rank).toBe(7);
    expect(r.list[6]?.name).toBe('NOVO');
    expect(insertScore(list, entry(50)).rank).toBe(0);
  });

  it('rankFor diz se a pontuação entra no placar', () => {
    const list = [entry(500), entry(300)];
    expect(rankFor(list, 600)).toBe(1);
    expect(rankFor(list, 400)).toBe(2);
    expect(rankFor(list, 100)).toBe(3);
    expect(rankFor(list, 0)).toBe(0);
    const full = Array.from({ length: 10 }, (_, i) => entry(1000 - i));
    expect(rankFor(full, 990)).toBe(0);
  });

  it('empate: onda maior na frente, depois o mais antigo', () => {
    const a = entry(100, 'velho', 3, '2026-01-01T00:00:00Z');
    const b = entry(100, 'novo', 3, '2026-02-01T00:00:00Z');
    const c = entry(100, 'onda5', 5, '2026-03-01T00:00:00Z');
    const list = insertScore(insertScore(insertScore([], b).list, a).list, c).list;
    expect(list.map((e) => e.name)).toEqual(['onda5', 'velho', 'novo']);
  });

  it('descarta lixo vindo do storage', () => {
    expect(parseScores('oi')).toEqual([]);
    expect(parseScores([{ name: 'x' }, null, entry(-5), entry(10)])).toHaveLength(1);
  });
});
