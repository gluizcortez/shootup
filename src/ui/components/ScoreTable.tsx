import type { CSSProperties } from 'react';
import type { ScoreEntry } from '@/shared/leaderboard';

const MEDALS = ['🥇', '🥈', '🥉'];

/** Tabela do placar local. `highlight` é a posição (1-based) recém-gravada. */
export function ScoreTable({ scores, highlight = 0, limit = 10 }: { scores: ScoreEntry[]; highlight?: number; limit?: number }) {
  if (scores.length === 0) {
    return <p className="scores-empty">Ninguém sobreviveu ao programa ainda. Seja o primeiro!</p>;
  }
  return (
    <ol className="scores" data-testid="scores">
      {scores.slice(0, limit).map((e, i) => (
        <li key={`${e.date}-${i}`} className={i + 1 === highlight ? 'scores-me' : ''} style={{ '--i': i } as CSSProperties}>
          <span className="scores-pos">{MEDALS[i] ?? `${i + 1}º`}</span>
          <span className="scores-name">{e.name}</span>
          <span className="scores-wave">onda {e.wave}</span>
          <span className="scores-score">{e.score.toLocaleString('pt-BR')}</span>
        </li>
      ))}
    </ol>
  );
}
