import { useEffect, useState } from 'react';
import { TactileButton } from '../components/TactileButton';
import { ScoreTable } from '../components/ScoreTable';
import { actions, useGame } from '../store/gameStore';
import { SettingsPanel } from './SettingsPanel';

type View = 'main' | 'scores' | 'options';

const LOGO = 'ShootUp!';

function Logo() {
  return (
    <h1 className="title-logo" aria-label={LOGO}>
      {LOGO.split('').map((ch, i) => (
        <span key={i} className={`logo-ch ${i >= 5 ? 'logo-ch--up' : ''}`} style={{ animationDelay: `${i * 80}ms` }} aria-hidden="true">
          {ch}
        </span>
      ))}
    </h1>
  );
}

export function TitleScreen() {
  const [view, setView] = useState<View>('main');
  const scores = useGame((s) => s.scores);
  const best = scores[0];

  useEffect(() => {
    if (view === 'main') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setView('main');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  return (
    <div className="screen screen--title">
      <div className="spotlights" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      {view === 'main' && (
        <div className="title-card">
          <div className="onair">
            <b /> ▶ PLAY
          </div>
          <Logo />
          <p className="title-tagline">starring Johnny Replay</p>
          <div className="menu">
            <TactileButton autoFocus className="menu-play" onClick={actions.start} data-testid="play">
              PLAY
            </TactileButton>
            <div className="menu-row">
              <TactileButton variant="ghost" onClick={() => setView('scores')} data-testid="menu-scores">
                SCORES
              </TactileButton>
              <TactileButton variant="ghost" onClick={() => setView('options')}>
                OPTIONS
              </TactileButton>
            </div>
          </div>
          {best && (
            <div className="best">
              BEST <strong>{best.score.toLocaleString('en-US')}</strong> · {best.name}
            </div>
          )}
        </div>
      )}
      {view !== 'main' && (
        <div className="panel panel--menu">
          {view === 'scores' && (
            <>
              <h2 className="panel-title">STUDIO HIGH SCORES</h2>
              <ScoreTable scores={scores} />
              <p className="note">Scores are saved in this browser only. Online rankings arrive in a future phase.</p>
            </>
          )}
          {view === 'options' && (
            <>
              <h2 className="panel-title">OPTIONS</h2>
              <SettingsPanel />
            </>
          )}
          <div className="panel-actions">
            <TactileButton autoFocus onClick={() => setView('main')}>
              BACK
            </TactileButton>
          </div>
        </div>
      )}
    </div>
  );
}
