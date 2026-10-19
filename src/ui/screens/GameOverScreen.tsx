import { useEffect, useState } from 'react';
import { rankFor, NAME_MAX } from '@/shared/leaderboard';
import { ScoreTable } from '../components/ScoreTable';
import { TactileButton } from '../components/TactileButton';
import { actions, useGame } from '../store/gameStore';

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GameOverScreen() {
  const summary = useGame((s) => s.summary);
  const scores = useGame((s) => s.scores);
  const lastName = useGame((s) => s.lastName);
  const [name, setName] = useState(lastName);
  const [savedRank, setSavedRank] = useState(0);
  // Posição calculada uma vez, antes de gravar (depois de gravar, a lista muda).
  const [rank] = useState(() => (summary && !summary.debugTainted ? rankFor(scores, summary.score) : 0));

  useEffect(() => {
    if (rank === 1) actions.sfx('record');
    else if (rank > 0) actions.sfx('rankIn');
  }, [rank]);

  if (!summary) return null;
  const rows: Array<[string, string]> = [
    ['Onda alcançada', String(summary.wave)],
    ['Abates', String(summary.kills)],
    ['Combo máximo', String(summary.bestCombo)],
    ['Precisão', `${Math.round(summary.accuracy * 100)}%`],
    ['Tempo', fmtTime(summary.timeSeconds)],
    ['Arma', summary.weaponName],
  ];
  const save = () => {
    if (savedRank) return;
    setSavedRank(actions.saveScore(name, summary));
  };
  const entering = rank > 0 && savedRank === 0;

  return (
    <div className="screen screen--dim" data-testid="gameover">
      <div className="panel panel--gameover">
        <div className="title-kicker">FIM DO PROGRAMA</div>
        <h2 className="panel-title">ELIMINADO!</h2>
        {rank === 1 && <div className="record-burst">NOVO RECORDE!</div>}
        <div className="final-score">
          <span>PONTUAÇÃO</span>
          <strong>{summary.score.toLocaleString('pt-BR')}</strong>
        </div>
        {entering ? (
          <form
            className="name-entry"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label htmlFor="player-name">Você entrou no placar em {rank}º lugar! Seu nome:</label>
            <div className="name-row">
              <input
                id="player-name"
                data-testid="player-name"
                autoFocus
                maxLength={NAME_MAX}
                value={name}
                placeholder="SEU NOME"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <TactileButton type="submit" data-testid="save-score">
                SALVAR
              </TactileButton>
            </div>
          </form>
        ) : (
          <>
            {savedRank > 0 && <ScoreTable scores={scores} highlight={savedRank} limit={5} />}
            {savedRank === 0 && (
              <dl className="summary">
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )}
        {summary.debugTainted && <p className="note">Run com comandos de debug: não entra no placar.</p>}
        <div className="panel-actions">
          <TactileButton autoFocus={!entering} onClick={actions.restart}>
            TENTAR DE NOVO (R)
          </TactileButton>
          <TactileButton variant="ghost" onClick={actions.quitToMenu}>
            MENU
          </TactileButton>
        </div>
      </div>
    </div>
  );
}
