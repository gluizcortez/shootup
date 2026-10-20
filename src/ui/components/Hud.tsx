import { useEffect, useRef, useState } from 'react';
import { isLowHp } from '@/shared/types';
import { useGame } from '../store/gameStore';
import { CardGlyph } from './CardGlyph';
import { Counter } from './Counter';

/**
 * Barra de vida numérica (estilo Seraph's Last Stand): enche em verde-água,
 * uma faixa "fantasma" mostra o dano recém-sofrido drenando atrás, e o número
 * rola até o valor novo. Cura acende a barra; dano faz ela tremer.
 */
function HealthBar({ hp, max }: { hp: number; max: number }) {
  const frac = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
  const [ghost, setGhost] = useState(frac);
  const prev = useRef(hp);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && hp !== prev.current) {
      // Reinicia a animação de dano/cura direto no DOM (sem remontar o contador).
      el.classList.remove('hp--hit', 'hp--heal');
      void el.offsetWidth;
      el.classList.add(hp < prev.current ? 'hp--hit' : 'hp--heal');
      prev.current = hp;
    }
  }, [hp]);

  useEffect(() => {
    if (frac >= ghost) {
      setGhost(frac);
      return;
    }
    const t = setTimeout(() => setGhost(frac), 380);
    return () => clearTimeout(t);
  }, [frac, ghost]);

  return (
    <div
      ref={ref}
      className="hp"
      role="meter"
      aria-label="Health"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={hp}
      data-testid="hud-hp"
    >
      <div className="hp-bar">
        <div className="hp-ghost" style={{ transform: `scaleX(${ghost})` }} />
        <div className="hp-fill" style={{ transform: `scaleX(${frac})` }} />
        <div className="hp-shine" />
      </div>
      <div className="hp-text">
        <span className="hp-label">HP</span>
        <Counter value={hp} className="hp-now" duration={220} />
        <span className="hp-max">/{max}</span>
      </div>
    </div>
  );
}

function WaveBlock() {
  const wave = useGame((s) => s.hud.wave);
  const remaining = useGame((s) => s.hud.waveRemaining);
  const total = useGame((s) => s.hud.waveTotal);
  // Esquadrilhas contam como uma entrada mas viram vários animais: limita a barra.
  const progress = total > 0 ? Math.min(1, Math.max(0, 1 - remaining / total)) : 0;
  return (
    <div className="hud-wave">
      <div className="hud-label">WAVE</div>
      <div className="hud-wave-number" data-testid="hud-wave">
        {wave || '—'}
      </div>
      <div className="hud-bar">
        <div className="hud-bar-fill" style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}

function ScoreBlock() {
  const score = useGame((s) => s.hud.score);
  const combo = useGame((s) => s.hud.combo);
  const mult = useGame((s) => s.hud.multiplier);
  return (
    <div className="hud-score">
      <div className="hud-label">SCORE</div>
      <Counter value={score} className="hud-score-number" />
      <span data-testid="hud-score" hidden>
        {score}
      </span>
      <div className={`hud-combo ${combo >= 2 ? 'on' : ''}`} key={`${mult}`}>
        <span className="hud-combo-mult">×{mult.toLocaleString('en-US')}</span>
        <span className="hud-combo-count">{combo} COMBO</span>
      </div>
    </div>
  );
}

function Callout() {
  const callout = useGame((s) => s.callout);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!callout) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1700);
    return () => clearTimeout(t);
  }, [callout]);
  if (!callout || !visible) return null;
  return (
    <div className="callout" key={callout.id}>
      <div className="callout-title">{callout.title}</div>
      {callout.subtitle && <div className="callout-sub">{callout.subtitle}</div>}
    </div>
  );
}

function BossBar() {
  const boss = useGame((s) => s.hud.boss);
  if (!boss) return null;
  return (
    <div className={`boss ${boss.enraged ? 'boss--enraged' : ''}`} data-testid="boss-bar">
      <div className="boss-name">{boss.name.toUpperCase()}</div>
      <div className="boss-bar">
        <div className="boss-bar-fill" style={{ transform: `scaleX(${boss.hp / boss.maxHp})` }} />
      </div>
    </div>
  );
}

/** Cartas na mão, canto inferior direito. */
function Hand() {
  const hand = useGame((s) => s.hand);
  if (hand.length === 0) return null;
  return (
    <div className="hud-hand" data-testid="hud-hand">
      {hand.map((c) => (
        <div key={c.id} className={`chip chip--${c.rarity}${c.golden ? ' chip--gold' : ''}`} title={c.description}>
          <CardGlyph card={c} />
          <span>{c.name}</span>
          {c.stacks > 1 && <b>×{c.stacks}</b>}
        </div>
      ))}
    </div>
  );
}

function Perf() {
  const perf = useGame((s) => s.perf);
  if (!perf) return null;
  return (
    <div className="perf">
      {perf.fps.toFixed(0)} FPS · avg {perf.avgMs.toFixed(1)} ms · P95 {perf.p95Ms.toFixed(1)} ms · {perf.projectiles} shots ·{' '}
      {perf.enemies} enemies · {perf.particles} particles
    </div>
  );
}

export function Hud() {
  const hp = useGame((s) => s.hud.hp);
  const maxHp = useGame((s) => s.hud.maxHp);
  const weapon = useGame((s) => s.hud.weaponName);
  const danger = isLowHp(hp, maxHp);
  return (
    <>
      {danger && <div className="danger-vignette" aria-hidden="true" />}
      <div className={`hud ${danger ? 'hud--danger' : ''}`}>
      <WaveBlock />
      <ScoreBlock />
      <div className="hud-bottom-left">
        <HealthBar hp={hp} max={maxHp} />
        <div className="hud-weapon">{weapon.toUpperCase()}</div>
      </div>
      <BossBar />
      <Hand />
      <Callout />
      <Perf />
      </div>
    </>
  );
}
