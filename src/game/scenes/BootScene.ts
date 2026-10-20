import Phaser from 'phaser';
import { generateTextures } from '../rendering/textures';
import { generateViceTextures } from '../rendering/texturesVice';
import { generateVice2Textures } from '../rendering/texturesVice2';

/** Gera toda a arte provisória em memória (sem downloads) e segue para a arena. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    generateViceTextures(this);
    generateVice2Textures(this);
    this.scene.start('Arena');
  }
}
