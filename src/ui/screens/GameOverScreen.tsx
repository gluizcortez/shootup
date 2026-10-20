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
    ['Wave reached', String(summary.wave)],
    ['Kills', String(summary.kills)],
    ['Best combo', String(summary.bestCombo)],
    ['Accuracy', `${Math.round(summary.accuracy * 100)}%`],
    ['Time', fmtTime(summary.timeSeconds)],
    ['Weapon', summary.weaponName],
  ];
  const save = () => {
    if (savedRank) return;
    setSavedRank(actions.saveScore(name, summary));
  };
  const entering = rank > 0 && savedRank === 0;

  return (
    <div className="screen screen--dim" data-testid="gameover">
      <div className="panel panel--gameover">
        <div className="title-kicker">END OF PROGRAM</div>
        <h2 className="panel-title">WASTED!</h2>
        {rank === 1 && <div className="record-burst">NEW HIGH SCORE!</div>}
        <div className="final-score">
          <span>SCORE</span>
          <strong>{summary.score.toLocaleString('en-US')}</strong>
        </div>
        {entering ? (
          <form
            className="name-entry"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label htmlFor="player-name">You made the board at #{rank}! Your name:</label>
            <div className="name-row">
              <input
                id="player-name"
                data-testid="player-name"
                autoFocus
                maxLength={NAME_MAX}
                value={name}
                placeholder="YOUR NAME"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <TactileButton type="submit" data-testid="save-score">
                SAVE
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
        {summary.debugTainted && <p className="note">Run used debug commands: it won't go on the board.</p>}
        <div className="panel-actions">
          <TactileButton autoFocus={!entering} onClick={actions.restart}>
            TRY AGAIN (R)
          </TactileButton>
          <TactileButton variant="ghost" onClick={actions.quitToMenu}>
            MENU
          </TactileButton>
        </div>
      </div>
    </div>
  );
}
