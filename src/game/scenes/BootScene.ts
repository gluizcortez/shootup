import Phaser from 'phaser';
import { generateTextures } from '../rendering/textures';
import { generateViceTextures } from '../rendering/texturesVice';

/** Gera toda a arte provisória em memória (sem downloads) e segue para a arena. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    generateViceTextures(this);
    this.scene.start('Arena');
  }
}
