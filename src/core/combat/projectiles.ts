export type Team = 'player' | 'enemy';

export interface Projectile {
  active: boolean;
  /** ID estável enquanto o projétil vive; reaproveitado pelo pool depois. */
  uid: number;
  team: Team;
  x: number;
  y: number;
  /** Posição no passo anterior (interpolação e colisão varrida). */
  px: number;
  py: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  crit: boolean;
  knockback: number;
  life: number;
  /** Origem visual: id da arma ou da espécie inimiga. */
  sourceId: string;
  /** Inimigos que ainda pode atravessar. */
  pierceLeft: number;
  /** Quiques restantes para o inimigo mais próximo. */
  ricochetLeft: number;
  /** Último inimigo atingido (não acerta o mesmo duas vezes seguidas). */
  lastHitUid: number;
}

/**
 * Pool de capacidade fixa: nenhuma alocação por disparo.
 * Quando cheio, recicla o projétil mais antigo do mesmo time.
 */
export class ProjectilePool {
  readonly items: Projectile[];
  private nextUid = 1;
  private cursor = 0;
  activeCount = 0;

  constructor(readonly capacity: number) {
    this.items = Array.from({ length: capacity }, () => ({
      active: false,
      uid: 0,
      team: 'player' as Team,
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      vx: 0,
      vy: 0,
      radius: 0,
      damage: 0,
      crit: false,
      knockback: 0,
      life: 0,
      sourceId: '',
      pierceLeft: 0,
      ricochetLeft: 0,
      lastHitUid: -1,
    }));
  }

  spawn(
    team: Team,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    crit: boolean,
    knockback: number,
    life: number,
    sourceId: string,
  ): Projectile {
    const p = this.acquire();
    p.active = true;
    p.uid = this.nextUid++;
    p.team = team;
    p.x = p.px = x;
    p.y = p.py = y;
    p.vx = vx;
    p.vy = vy;
    p.radius = radius;
    p.damage = damage;
    p.crit = crit;
    p.knockback = knockback;
    p.life = life;
    p.sourceId = sourceId;
    p.pierceLeft = 0;
    p.ricochetLeft = 0;
    p.lastHitUid = -1;
    return p;
  }

  release(p: Projectile): void {
    if (!p.active) return;
    p.active = false;
    this.activeCount--;
  }

  clear(): void {
    for (const p of this.items) p.active = false;
    this.activeCount = 0;
  }

  private acquire(): Projectile {
    const n = this.items.length;
    for (let i = 0; i < n; i++) {
      const idx = (this.cursor + i) % n;
      const p = this.items[idx] as Projectile;
      if (!p.active) {
        this.cursor = (idx + 1) % n;
        this.activeCount++;
        return p;
      }
    }
    // Pool cheio: recicla o slot do cursor (o mais antigo, aproximadamente).
    const p = this.items[this.cursor] as Projectile;
    this.cursor = (this.cursor + 1) % n;
    return p;
  }
}
