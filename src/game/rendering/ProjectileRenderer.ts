import Phaser from 'phaser';
import type { Projectile, ProjectilePool } from '@/core/combat/projectiles';
import { lerp } from '@/core/math/scalar';
import { TEX_SCALE } from './textures';

const INV = 1 / TEX_SCALE;

/**
 * Um sprite por slot do pool de projéteis (mapeamento 1:1, sem alocação).
 * Tiros do jogador: traço âmbar fino. Inimigos: bola coral grande com contorno.
 */
export class ProjectileRenderer {
  private readonly sprites: Phaser.GameObjects.Image[] = [];
  private readonly lastUid: number[] = [];
  private time = 0;

  constructor(scene: Phaser.Scene, pool: ProjectilePool) {
    for (let i = 0; i < pool.capacity; i++) {
      this.sprites.push(scene.add.image(0, 0, 'b_player').setVisible(false).setDepth(40));
      this.lastUid.push(0);
    }
  }

  /** Nova run: uids recomeçam, então esquecemos o cache de texturas. */
  reset(): void {
    this.lastUid.fill(0);
    for (const s of this.sprites) s.setVisible(false);
  }

  update(pool: ProjectilePool, alpha: number, dt: number): void {
    this.time += dt;
    const items = pool.items;
    for (let i = 0; i < items.length; i++) {
      const p = items[i] as Projectile;
      const s = this.sprites[i] as Phaser.GameObjects.Image;
      if (!p.active) {
        if (s.visible) s.setVisible(false);
        continue;
      }
      if (this.lastUid[i] !== p.uid) {
        this.lastUid[i] = p.uid;
        const enemy = p.team === 'enemy';
        s.setTexture(enemy ? 'b_enemy' : 'b_player').setDepth(enemy ? 45 : 40);
        if (!enemy) s.setRotation(Math.atan2(p.vy, p.vx));
        if (p.crit) s.setTint(0xfff3c4);
        else s.clearTint();
        s.setVisible(true);
      }
      s.x = lerp(p.px, p.x, alpha);
      s.y = lerp(p.py, p.y, alpha);
      if (p.team === 'enemy') {
        const pulse = 1 + Math.sin(this.time * 18 + p.uid) * 0.08;
        s.setScale(pulse * INV * (p.radius / 6.5));
        s.rotation += dt * 6;
      } else {
        const crit = p.crit ? 1.35 : 1;
        s.setScale(1.25 * INV * crit, INV * crit);
      }
    }
  }
}
