import { TactileButton } from '../components/TactileButton';
import { actions } from '../store/gameStore';

export function TitleScreen() {
  return (
    <div className="screen screen--title">
      <div className="title-card">
        <div className="title-kicker">AO VIVO · PROTÓTIPO FASE 0</div>
        <h1 className="title-logo">
          Shoot<span>Up!</span>
        </h1>
        <p className="title-tagline">The World's Worst Show</p>
        <TactileButton autoFocus onClick={actions.start} data-testid="play">
          JOGAR
        </TactileButton>
        <ul className="controls">
          <li>
            <kbd>A</kbd>
            <kbd>D</kbd> mover
          </li>
          <li>
            <kbd>W</kbd>/<kbd>Espaço</kbd> pular (segure para ir mais alto)
          </li>
          <li>
            <kbd>Mouse</kbd> mirar · <kbd>Botão esq.</kbd> segurado atira
          </li>
          <li>
            <kbd>Esc</kbd> pausa · <kbd>R</kbd> reinicia · <kbd>F3</kbd> desempenho
          </li>
        </ul>
      </div>
    </div>
  );
}
