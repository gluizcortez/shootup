import Phaser from 'phaser';
import { loadPixelFonts } from '../rendering/fonts';
import { installCast, preloadSprites } from '../rendering/sprites';
import { generateTextures } from '../rendering/textures';
import { generateViceTextures } from '../rendering/texturesVice';
import { generateVice2Textures } from '../rendering/texturesVice2';

/** Carrega as folhas de sprites, gera o resto da pixel art em memória, espera as fontes e segue para a arena. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    preloadSprites(this);
  }

  create(): void {
    installCast(this);
    generateTextures(this);
    generateViceTextures(this);
    generateVice2Textures(this);
    // Em dev, expõe as texturas para inspecionar a pixel art (ferramenta de arte).
    if (import.meta.env.DEV) (window as unknown as { __tex?: Phaser.Textures.TextureManager }).__tex = this.textures;
    void loadPixelFonts().then(() => this.scene.start('Arena'));
  }
}
