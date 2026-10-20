import Phaser from 'phaser';
import { computeView } from './data/view';
import { ArenaScene } from './scenes/ArenaScene';
import { BootScene } from './scenes/BootScene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  // A cena reajusta o tamanho a cada mudança da janela (ArenaScene.applyLayout).
  const layout = computeView(parent.clientWidth / Math.max(1, parent.clientHeight));
  return {
    type: Phaser.AUTO,
    parent,
    width: layout.canvasW,
    height: layout.canvasH,
    backgroundColor: '#12061f',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      roundPixels: false,
      powerPreference: 'high-performance',
    },
    audio: { noAudio: true }, // SFX via AudioSystem próprio (WebAudio)
    input: { mouse: { preventDefaultWheel: false } },
    disableContextMenu: true,
    banner: false,
    fps: { smoothStep: true },
    scene: [BootScene, ArenaScene],
  };
}
