import { useEffect } from 'react';
import { GameHost } from './GameHost';
import { Hud } from '@/ui/components/Hud';
import { GameOverScreen } from '@/ui/screens/GameOverScreen';
import { PauseScreen } from '@/ui/screens/PauseScreen';
import { TitleScreen } from '@/ui/screens/TitleScreen';
import { useGame } from '@/ui/store/gameStore';

export function App() {
  const phase = useGame((s) => s.phase);

  // Evita que o navegador role a página com espaço/setas enquanto se joga.
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (phase === 'PLAYING' && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', block, { passive: false });
    return () => window.removeEventListener('keydown', block);
  }, [phase]);

  return (
    <div className="stage-frame" data-phase={phase}>
      <GameHost />
      <div className={`overlay ${phase === 'PLAYING' ? 'overlay--playing' : ''}`}>
        {(phase === 'PLAYING' || phase === 'PAUSED') && <Hud />}
        {phase === 'MENU' && <TitleScreen />}
        {phase === 'PAUSED' && <PauseScreen />}
        {phase === 'GAME_OVER' && <GameOverScreen />}
      </div>
    </div>
  );
}
