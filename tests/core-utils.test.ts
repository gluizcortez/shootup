import { describe, expect, it } from 'vitest';
import { Rng } from '@/core/math/rng';
import { boxesOverlap, circleIntersectsBox, sweptCircleHitsBox } from '@/core/physics/collision';
import { FixedStepper } from '@/core/run/fixedStep';
import { RunPhaseMachine } from '@/core/run/runPhase';
import { breakCombo, createCombo, registerKill, tickCombo } from '@/core/scoring/combo';
import { ProjectilePool } from '@/core/combat/projectiles';
import { scaleForWave } from '@/core/run/waves';
import { PATO_PISTOLEIRO, VACA_LOCA } from '@/game/data/enemies';

describe('Rng', () => {
  it('é determinístico pela seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
  it('int fica no intervalo fechado', () => {
    const r = new Rng(3);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
    }
  });
});

describe('colisão', () => {
  const box = { x: 100, y: 100, hw: 10, hh: 20 };
  it('caixas', () => {
    expect(boxesOverlap(box, { x: 115, y: 100, hw: 6, hh: 6 })).toBe(true);
    expect(boxesOverlap(box, { x: 117, y: 100, hw: 6, hh: 6 })).toBe(false);
  });
  it('círculo', () => {
    expect(circleIntersectsBox(113, 100, 4, box)).toBe(true);
    expect(circleIntersectsBox(115, 100, 4, box)).toBe(false);
  });
  it('projétil rápido não atravessa alvo fino', () => {
    // Anda 60 px num passo, passando pela caixa sem nunca terminar dentro dela.
    expect(sweptCircleHitsBox(60, 100, 140, 100, 2, box)).toBe(true);
    expect(sweptCircleHitsBox(60, 40, 140, 40, 2, box)).toBe(false);
  });
});

describe('FixedStepper', () => {
  it('converte tempo de quadro em passos fixos com resto', () => {
    const s = new FixedStepper(1 / 120);
    let steps = 0;
    for (let i = 0; i < 60; i++) steps += s.advance(1 / 60);
    expect(steps).toBeGreaterThanOrEqual(119);
    expect(steps).toBeLessThanOrEqual(120);
  });
  it('limita passos após um travamento', () => {
    const s = new FixedStepper(1 / 120, 8);
    expect(s.advance(2)).toBe(8);
    expect(s.advance(0)).toBeLessThanOrEqual(1);
  });
});

describe('combo', () => {
  const t = { window: 2, killsPerStep: 3, stepBonus: 0.5, maxMultiplier: 3 };
  it('multiplicador sobe com abates seguidos e respeita o teto', () => {
    const c = createCombo();
    expect(registerKill(c, 100, t)).toBe(100);
    registerKill(c, 100, t);
    expect(registerKill(c, 100, t)).toBe(150);
    for (let i = 0; i < 30; i++) registerKill(c, 100, t);
    expect(c.multiplier).toBe(3);
  });
  it('zera após a janela sem abates', () => {
    const c = createCombo();
    registerKill(c, 100, t);
    expect(tickCombo(c, 1.9)).toBe(false);
    expect(tickCombo(c, 0.2)).toBe(true);
    expect(c.count).toBe(0);
    expect(c.multiplier).toBe(1);
  });
  it('guarda o melhor combo', () => {
    const c = createCombo();
    for (let i = 0; i < 5; i++) registerKill(c, 1, t);
    breakCombo(c);
    registerKill(c, 1, t);
    expect(c.best).toBe(5);
  });
});

describe('RunPhaseMachine', () => {
  it('só aceita transições válidas', () => {
    const m = new RunPhaseMachine();
    expect(m.to('PAUSED')).toBe(false);
    expect(m.to('PLAYING')).toBe(true);
    expect(m.to('PAUSED')).toBe(true);
    expect(m.to('PLAYING')).toBe(true);
    expect(m.to('GAME_OVER')).toBe(true);
    expect(m.to('PAUSED')).toBe(false);
    expect(m.to('PLAYING')).toBe(true);
  });
});

describe('ProjectilePool', () => {
  it('reutiliza slots sem alocar e conta ativos', () => {
    const pool = new ProjectilePool(4);
    const a = pool.spawn('player', 0, 0, 1, 0, 2, 1, false, 0, 1, 'x');
    pool.spawn('player', 0, 0, 1, 0, 2, 1, false, 0, 1, 'x');
    expect(pool.activeCount).toBe(2);
    pool.release(a);
    expect(pool.activeCount).toBe(1);
    for (let i = 0; i < 10; i++) pool.spawn('enemy', 0, 0, 1, 0, 2, 1, false, 0, 1, 'y');
    expect(pool.items.length).toBe(4);
    expect(pool.activeCount).toBe(4);
  });
});

import { FrameStats } from '@/shared/frameStats';
import { TypedEmitter } from '@/shared/eventBus';
import { defaultSettings, sanitizeSettings } from '@/shared/settings';

describe('FrameStats', () => {
  it('calcula média e P95', () => {
    const s = new FrameStats(100);
    for (let i = 1; i <= 100; i++) s.push(i);
    expect(s.average()).toBeCloseTo(50.5);
    expect(s.percentile(95)).toBe(95);
  });
});

describe('TypedEmitter', () => {
  it('entrega payload e permite cancelar', () => {
    const bus = new TypedEmitter<{ a: number }>();
    const got: number[] = [];
    const off = bus.on('a', (v) => got.push(v));
    bus.emit('a', 1);
    off();
    bus.emit('a', 2);
    expect(got).toEqual([1]);
  });
  it('um listener com erro não derruba os outros', () => {
    const bus = new TypedEmitter<{ a: number }>();
    let ok = false;
    const original = console.error;
    console.error = () => {};
    bus.on('a', () => {
      throw new Error('x');
    });
    bus.on('a', () => {
      ok = true;
    });
    bus.emit('a', 1);
    console.error = original;
    expect(ok).toBe(true);
  });
});

describe('settings', () => {
  it('movimento reduzido desliga shake e flashes por padrão', () => {
    const s = defaultSettings(true);
    expect(s.screenShake).toBe(0);
    expect(s.flashes).toBe(false);
  });
  it('sanitiza valores inválidos vindos do storage', () => {
    const base = defaultSettings(false);
    const s = sanitizeSettings({ screenShake: 9, vfxQuality: 'ultra', muted: 'sim' }, base);
    expect(s.screenShake).toBe(1);
    expect(s.vfxQuality).toBe(base.vfxQuality);
    expect(s.muted).toBe(false);
  });
});

import { Terrain, heightAt } from '@/core/physics/terrain';

describe('Terrain', () => {
  const def = {
    baseY: 400,
    left: 0,
    right: 800,
    features: [
      { kind: 'ramp' as const, side: 'left' as const, height: 70, plateau: 50, slope: 100 },
      { kind: 'ramp' as const, side: 'right' as const, height: 70, plateau: 50, slope: 100 },
      { kind: 'bump' as const, x: 250, height: 20, halfWidth: 50 },
    ],
  };
  const t = new Terrain(def);
  it('centro plano no nível base', () => {
    expect(t.groundAt(400)).toBeCloseTo(400);
  });
  it('platô alto junto às paredes, simétrico', () => {
    expect(t.groundAt(20)).toBeCloseTo(330);
    expect(t.groundAt(780)).toBeCloseTo(330);
    expect(t.topY).toBeCloseTo(330);
  });
  it('morrinho com pico no centro dele', () => {
    expect(heightAt(def, 250)).toBeCloseTo(20);
    expect(t.groundAt(250)).toBeLessThan(t.groundAt(220));
  });
  it('relevo contínuo (sem degraus)', () => {
    for (let x = 0; x < 800; x += 0.5) expect(Math.abs(t.groundAt(x + 0.5) - t.groundAt(x))).toBeLessThan(1.5);
  });
});

describe('scaleForWave', () => {
  const g = { hpPerWave: 0.08, speedPerWave: 0.02, maxSpeedMult: 1.35, damagePerWave: 0.08 };

  it('onda 1 usa os valores base', () => {
    expect(scaleForWave(PATO_PISTOLEIRO, 1, g)).toBe(PATO_PISTOLEIRO);
  });

  it('vida e velocidade sobem em linha reta, devagar, com vida inteira', () => {
    const p = scaleForWave(PATO_PISTOLEIRO, 6, g) as typeof PATO_PISTOLEIRO;
    expect(p.maxHp).toBe(Math.round(PATO_PISTOLEIRO.maxHp * 1.4));
    expect(Number.isInteger(p.maxHp)).toBe(true);
    expect(p.bulletSpeed).toBeCloseTo(PATO_PISTOLEIRO.bulletSpeed * 1.1);
    const v = scaleForWave(VACA_LOCA, 6, g) as typeof VACA_LOCA;
    expect(v.chargeSpeed).toBeCloseTo(VACA_LOCA.chargeSpeed * 1.1);
    expect(PATO_PISTOLEIRO.maxHp).toBe(12); // a base nunca é alterada
  });

  it('dano sobe junto, sempre inteiro', () => {
    const p = scaleForWave(PATO_PISTOLEIRO, 10, g) as typeof PATO_PISTOLEIRO;
    expect(p.bulletDamage).toBe(Math.round(PATO_PISTOLEIRO.bulletDamage * 1.72));
    const v = scaleForWave(VACA_LOCA, 10, g);
    expect(v.contactDamage).toBe(Math.round(VACA_LOCA.contactDamage * 1.72));
    expect(scaleForWave(PATO_PISTOLEIRO, 10, g).contactDamage).toBe(0); // quem não encosta continua sem dano
  });

  it('velocidade tem teto', () => {
    const p = scaleForWave(PATO_PISTOLEIRO, 60, g) as typeof PATO_PISTOLEIRO;
    expect(p.bulletSpeed).toBeCloseTo(PATO_PISTOLEIRO.bulletSpeed * 1.35);
  });
});
