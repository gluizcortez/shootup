import { TactileButton } from '../components/TactileButton';
import { actions, useGame } from '../store/gameStore';

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GameOverScreen() {
  const summary = useGame((s) => s.summary);
  if (!summary) return null;
  const rows: Array<[string, string]> = [
    ['Onda alcançada', String(summary.wave)],
    ['Abates', String(summary.kills)],
    ['Combo máximo', String(summary.bestCombo)],
    ['Precisão', `${Math.round(summary.accuracy * 100)}%`],
    ['Tempo', fmtTime(summary.timeSeconds)],
    ['Arma', summary.weaponName],
  ];
  return (
    <div className="screen screen--dim" data-testid="gameover">
      <div className="panel panel--gameover">
        <div className="title-kicker">FIM DO PROGRAMA</div>
        <h2 className="panel-title">ELIMINADO!</h2>
        <div className="final-score">
          <span>PONTUAÇÃO</span>
          <strong>{summary.score.toLocaleString('pt-BR')}</strong>
        </div>
        <dl className="summary">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {summary.debugTainted && <p className="note">Run com comandos de debug: não conta para ranking.</p>}
        <div className="panel-actions">
          <TactileButton autoFocus onClick={actions.restart}>
            TENTAR DE NOVO (R)
          </TactileButton>
          <TactileButton variant="ghost" onClick={actions.quitToMenu}>
            MENU
          </TactileButton>
        </div>
        <p className="note">Pontuação só local por enquanto. O ranking online entra numa fase futura.</p>
      </div>
    </div>
  );
}
