import { describe, expect, it } from 'vitest';
import { createMotor, stepMotor } from '@/core/physics/playerMotor';
import type { MotorInput, MotorState } from '@/core/physics/playerMotor';
import { ARENA, SIM_STEP } from '@/game/data/arena';
import { PLAYER } from '@/game/data/player';

const T = PLAYER.motor;
const idle: MotorInput = { moveX: 0, jumpPressed: false, jumpHeld: false };

function grounded(): MotorState {
  const m = createMotor(480, ARENA.floorY - PLAYER.hh, PLAYER.hw, PLAYER.hh);
  stepMotor(m, idle, T, ARENA, SIM_STEP);
  return m;
}

function run(m: MotorState, input: MotorInput, seconds: number, dt = SIM_STEP): void {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) stepMotor(m, i === 0 ? input : { ...input, jumpPressed: false }, T, ARENA, dt);
}

describe('playerMotor', () => {
  it('fica no chão parado', () => {
    const m = grounded();
    expect(m.grounded).toBe(true);
    expect(m.y + m.hh).toBeCloseTo(ARENA.floorY);
  });

  it('atinge a velocidade máxima rapidamente (< 0.15 s)', () => {
    const m = grounded();
    run(m, { moveX: 1, jumpPressed: false, jumpHeld: false }, 0.15);
    expect(m.vx).toBeCloseTo(T.runSpeed);
  });

  it('para rapidamente ao soltar', () => {
    const m = grounded();
    run(m, { moveX: 1, jumpPressed: false, jumpHeld: false }, 0.3);
    run(m, idle, 0.1);
    expect(m.vx).toBe(0);
  });

  it('pulo segurado vai mais alto que pulo tocado (pulo variável)', () => {
    const peak = (holdSeconds: number): number => {
      const m = grounded();
      let minY = m.y;
      for (let i = 0; i < 240; i++) {
        const held = i * SIM_STEP < holdSeconds;
        stepMotor(m, { moveX: 0, jumpPressed: i === 0, jumpHeld: held }, T, ARENA, SIM_STEP);
        minY = Math.min(minY, m.y);
      }
      return ARENA.floorY - PLAYER.hh - minY;
    };
    const tap = peak(0.05);
    const full = peak(1);
    expect(full).toBeGreaterThan(tap * 1.6);
    expect(full).toBeGreaterThan(110);
    expect(full).toBeLessThan(200);
  });

  it('jump buffer: apertar pouco antes de pousar ainda pula', () => {
    const m = grounded();
    stepMotor(m, { moveX: 0, jumpPressed: true, jumpHeld: true }, T, ARENA, SIM_STEP);
    // Cai até quase tocar o chão.
    let pressed = false;
    for (let i = 0; i < 400; i++) {
      const nearFloor = !m.grounded && m.vy > 0 && ARENA.floorY - (m.y + m.hh) < 12;
      const press = nearFloor && !pressed;
      if (press) pressed = true;
      stepMotor(m, { moveX: 0, jumpPressed: press, jumpHeld: false }, T, ARENA, SIM_STEP);
      if (pressed && m.justJumped) return;
    }
    throw new Error('o pulo bufferizado não aconteceu');
  });

  it('coyote time: pular logo após perder o chão funciona', () => {
    const m = grounded();
    // Simula sair de uma borda: tira do chão sem pular.
    m.grounded = false;
    m.y -= 4;
    m.coyoteTimer = T.coyoteTime;
    stepMotor(m, { moveX: 0, jumpPressed: false, jumpHeld: false }, T, ARENA, SIM_STEP);
    stepMotor(m, { moveX: 0, jumpPressed: true, jumpHeld: true }, T, ARENA, SIM_STEP);
    expect(m.justJumped).toBe(true);
  });

  it('movimento independe do tamanho do passo (60 vs 240 Hz)', () => {
    const a = grounded();
    const b = grounded();
    run(a, { moveX: 1, jumpPressed: false, jumpHeld: false }, 0.5, 1 / 60);
    run(b, { moveX: 1, jumpPressed: false, jumpHeld: false }, 0.5, 1 / 240);
    expect(Math.abs(a.x - b.x)).toBeLessThan(3);
  });

  it('respeita as paredes da arena', () => {
    const m = grounded();
    run(m, { moveX: -1, jumpPressed: false, jumpHeld: false }, 3);
    expect(m.x - m.hw).toBeCloseTo(ARENA.left);
  });
});
