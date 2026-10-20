import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { CardGlyph } from './CardGlyph';
import { Counter } from './Counter';

const HEART = 'M12 20 L3.5 11.5 C0.5 8.5 1.5 2.5 6.5 2.5 C9 2.5 11 4 12 6 C13 4 15 2.5 17.5 2.5 C22.5 2.5 23.5 8.5 20.5 11.5 Z';

/** Corações com metades: vida e máximo andam de ½ em ½. Meio coração de capacidade aparece cortado. */
function Hearts({ hp, max }: { hp: number; max: number }) {
  return (
    <div className="hud-hearts" aria-label={`Health ${hp} of ${max}`}>
      {Array.from({ length: Math.ceil(max) }, (_, i) => {
        const fill = Math.max(0, Math.min(1, hp - i));
        const capHalf = max - i < 1;
        const state = fill >= 1 ? 'full' : fill > 0 ? 'half' : 'empty';
        return (
          <svg key={i} className={`heart ${state}${capHalf ? ' cap-half' : ''}`} viewBox="0 0 24 22" aria-hidden="true">
            <clipPath id={`heart-half-${i}`}>
              <rect x="0" y="0" width="12" height="22" />
            </clipPath>
            <g clipPath={capHalf ? `url(#heart-half-${i})` : undefined}>
              <path className="heart-bg" d={HEART} />
              {state === 'half' && <path className="heart-fill" d={HEART} clipPath={`url(#heart-half-${i})`} />}
            </g>
          </svg>
        );
      })}
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
  const danger = hp > 0 && hp <= 1 && maxHp > 1;
  return (
    <>
      {danger && <div className="danger-vignette" aria-hidden="true" />}
      <div className={`hud ${danger ? 'hud--danger' : ''}`}>
      <WaveBlock />
      <ScoreBlock />
      <div className="hud-bottom-left">
        <Hearts hp={hp} max={maxHp} />
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
