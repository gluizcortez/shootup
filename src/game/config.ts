import Phaser from 'phaser';
import { RENDER_ZOOM, VIEW_HEIGHT, VIEW_WIDTH } from './data/arena';
import { ArenaScene } from './scenes/ArenaScene';
import { BootScene } from './scenes/BootScene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: VIEW_WIDTH * RENDER_ZOOM,
    height: VIEW_HEIGHT * RENDER_ZOOM,
    backgroundColor: '#151922',
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
