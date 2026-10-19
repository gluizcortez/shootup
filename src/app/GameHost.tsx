import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '@/game/config';

/** Monta o Phaser uma única vez dentro do React. React nunca desenha entidades do jogo. */
export function GameHost() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const game = new Phaser.Game(createGameConfig(el));
    return () => game.destroy(true);
  }, []);

  return <div ref={ref} className="game-canvas" data-testid="game-canvas" />;
}
