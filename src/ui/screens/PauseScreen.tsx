import { TactileButton } from '../components/TactileButton';
import { actions } from '../store/gameStore';
import { SettingsPanel } from './SettingsPanel';

export function PauseScreen() {
  return (
    <div className="screen screen--dim">
      <div className="panel">
        <h2 className="panel-title">INTERVALO COMERCIAL</h2>
        <div className="panel-actions">
          <TactileButton autoFocus onClick={actions.resume}>
            CONTINUAR
          </TactileButton>
          <TactileButton variant="ghost" onClick={actions.restart}>
            REINICIAR
          </TactileButton>
          <TactileButton variant="ghost" onClick={actions.quitToMenu}>
            MENU
          </TactileButton>
        </div>
        <SettingsPanel />
      </div>
    </div>
  );
}
