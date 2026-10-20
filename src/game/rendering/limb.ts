import type Phaser from 'phaser';

/**
 * Membro de dois ossos (coxa+canela, braço+antebraço) resolvido por IK
 * analítica: dado o ponto da junta raiz e o alvo da ponta, acha o joelho
 * ou cotovelo. As texturas são desenhadas apontando para baixo, com a origem
 * na articulação de cima.
 */
export class Limb {
  /** Ponta resolvida (tornozelo / punho) no espaço do container. */
  readonly end = { x: 0, y: 0 };
  readonly joint = { x: 0, y: 0 };

  constructor(
    readonly upper: Phaser.GameObjects.Image,
    readonly lower: Phaser.GameObjects.Image,
    private readonly lenA: number,
    private readonly lenB: number,
    /** -1 dobra a articulação para a frente (joelho), +1 para trás (cotovelo). */
    public bend: 1 | -1,
  ) {}

  solve(rx: number, ry: number, tx: number, ty: number): this {
    const a = this.lenA;
    const b = this.lenB;
    let dx = tx - rx;
    let dy = ty - ry;
    let d = Math.hypot(dx, dy);
    if (d < 1e-4) {
      dx = 0;
      dy = 1;
      d = 1e-4;
    }
    const maxD = a + b - 0.001;
    const minD = Math.abs(a - b) + 0.01;
    const dc = Math.min(maxD, Math.max(minD, d));
    const theta = Math.atan2(dy, dx);
    const cosA = (a * a + dc * dc - b * b) / (2 * a * dc);
    const alpha = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const upAng = theta + this.bend * alpha;
    const jx = rx + Math.cos(upAng) * a;
    const jy = ry + Math.sin(upAng) * a;
    const ex = rx + (dx / d) * dc;
    const ey = ry + (dy / d) * dc;
    const lowAng = Math.atan2(ey - jy, ex - jx);
    this.upper.setPosition(rx, ry).setRotation(upAng - Math.PI / 2);
    this.lower.setPosition(jx, jy).setRotation(lowAng - Math.PI / 2);
    this.joint.x = jx;
    this.joint.y = jy;
    this.end.x = jx + Math.cos(lowAng) * b;
    this.end.y = jy + Math.sin(lowAng) * b;
    return this;
  }

  setTint(color: number): void {
    this.upper.setTint(color);
    this.lower.setTint(color);
  }

  setTintFill(color: number): void {
    this.upper.setTintFill(color);
    this.lower.setTintFill(color);
  }

  clearTint(): void {
    this.upper.clearTint();
    this.lower.clearTint();
  }
}
