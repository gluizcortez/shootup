import Phaser from 'phaser';
import { generateTextures } from '../rendering/textures';

/** Gera toda a arte provisória em memória (sem downloads) e segue para a arena. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    this.scene.start('Arena');
  }
}
