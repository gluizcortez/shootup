import { useEffect, useState } from 'react';
import { TactileButton } from '../components/TactileButton';
import { ScoreTable } from '../components/ScoreTable';
import { actions, useGame } from '../store/gameStore';
import { SettingsPanel } from './SettingsPanel';

type View = 'main' | 'scores' | 'help' | 'options';

const LOGO = 'ShootUp!';

/** Piadas do rodapé do programa, trocando sozinhas. */
const TICKER = [
  'Patrocínio: Seguros Quá-Quá — "a gente cobre até bico".',
  'Nenhum pato foi ferido de verdade. Só no orgulho.',
  'Pipoca Boom: estoura antes de você.',
  'A Vaca Loca pediu pra avisar: ela não freia.',
  'O Porco Executivo marcou uma reunião sobre você.',
  'Don Pombone manda lembranças. E balas.',
  'Aplausos são obrigatórios. A plateia é refém.',
];

const CAST: Array<[string, string]> = [
  ['Pato Pistoleiro', 'faz pose dramática ("!") antes de cada tiro mirado.'],
  ['Galinha Rambo', 'gira a metralhadora, trava a mira e solta a rajada.'],
  ['Vaca Loca', 'bípede, pisa forte e investe pelo chão. Pule por cima!'],
  ['Pombo Mafioso', 'chega em bando de 3 em V e atira junto depois do assobio.'],
  ['Porco Executivo', 'joga moedas e dá escudo aos colegas. Mate primeiro!'],
  ['Don Pombone', 'o chefão da onda 10. Bate as asas antes de cada ataque.'],
];

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

function Ticker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % TICKER.length), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ticker" aria-live="polite">
      <span key={i}>{TICKER[i]}</span>
    </div>
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
            <b /> AO VIVO
          </div>
          <Logo />
          <p className="title-tagline">The World's Worst Show</p>
          <div className="menu">
            <TactileButton autoFocus className="menu-play" onClick={actions.start} data-testid="play">
              JOGAR
            </TactileButton>
            <div className="menu-row">
              <TactileButton variant="ghost" onClick={() => setView('scores')} data-testid="menu-scores">
                PLACAR
              </TactileButton>
              <TactileButton variant="ghost" onClick={() => setView('help')}>
                COMO JOGAR
              </TactileButton>
              <TactileButton variant="ghost" onClick={() => setView('options')}>
                OPÇÕES
              </TactileButton>
            </div>
          </div>
          {best && (
            <div className="best">
              RECORDE <strong>{best.score.toLocaleString('pt-BR')}</strong> · {best.name}
            </div>
          )}
          <Ticker />
        </div>
      )}
      {view !== 'main' && (
        <div className="panel panel--menu">
          {view === 'scores' && (
            <>
              <h2 className="panel-title">PLACAR DO ESTÚDIO</h2>
              <ScoreTable scores={scores} />
              <p className="note">Placar salvo só neste navegador. O ranking online chega numa fase futura.</p>
            </>
          )}
          {view === 'help' && (
            <>
              <h2 className="panel-title">COMO JOGAR</h2>
              <ul className="controls">
                <li>
                  <kbd>A</kbd>
                  <kbd>D</kbd> mover · <kbd>W</kbd>/<kbd>Espaço</kbd> pular (segure para ir mais alto)
                </li>
                <li>
                  <kbd>Mouse</kbd> mirar · <kbd>Botão esq.</kbd> segurado atira
                </li>
                <li>
                  <kbd>1</kbd>
                  <kbd>2</kbd>
                  <kbd>3</kbd> escolher carta · <kbd>Esc</kbd> pausa · <kbd>R</kbd> reinicia
                </li>
              </ul>
              <h3 className="cast-title">ELENCO DE HOJE</h3>
              <dl className="cast">
                {CAST.map(([name, desc]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{desc}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {view === 'options' && (
            <>
              <h2 className="panel-title">OPÇÕES</h2>
              <SettingsPanel />
            </>
          )}
          <div className="panel-actions">
            <TactileButton autoFocus onClick={() => setView('main')}>
              VOLTAR
            </TactileButton>
          </div>
        </div>
      )}
    </div>
  );
}
