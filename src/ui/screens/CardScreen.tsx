import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import type { CardInfo } from '@/shared/types';
import { CardGlyph } from '../components/CardGlyph';
import { actions, useGame } from '../store/gameStore';

const RARITY_LABEL: Record<CardInfo['rarity'], string> = { comum: 'COMUM', incomum: 'INCOMUM', raro: 'RARA', epico: 'ÉPICA' };
const BRANCH_LABEL: Record<CardInfo['branch'], string> = {
  balistica: 'Balística',
  caos: 'Caos',
  sobrevivencia: 'Sobrevivência',
};
/** Tempo da animação de escolha antes de devolver o controle ao jogo. */
const PICK_MS = 420;

function Card({
  card,
  index,
  picked,
  onPick,
}: {
  card: CardInfo;
  index: number;
  picked: string | null;
  onPick: (id: string) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--tilt-x', `${(-py * 14).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(px * 16).toFixed(2)}deg`);
    el.style.setProperty('--shine-x', `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--shine-y', `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  };

  const state = picked === null ? '' : picked === card.id ? 'card--picked' : 'card--discarded';
  const next = card.stacks + 1;
  const goldNext = card.goldenAt > 0 && next >= card.goldenAt;
  return (
    <button
      ref={ref}
      type="button"
      className={`card card--${card.rarity}${goldNext ? ' card--gold' : ''} ${state}`}
      style={{ '--i': index } as CSSProperties}
      data-testid={`card-${card.id}`}
      disabled={picked !== null}
      onPointerMove={move}
      onPointerLeave={leave}
      onPointerEnter={() => actions.cardHover()}
      onFocus={() => actions.cardHover()}
      onClick={() => onPick(card.id)}
    >
      <span className="card-inner">
        <span className="card-key">{index + 1}</span>
        <span className="card-rarity">{goldNext ? 'VIRA DOURADA!' : RARITY_LABEL[card.rarity]}</span>
        <span className="card-art">
          <CardGlyph card={card} />
        </span>
        <span className="card-name">{card.name}</span>
        <span className="card-desc">{card.description}</span>
        <span className="card-foot">
          <span className="card-branch">{BRANCH_LABEL[card.branch]}</span>
          {card.stacks > 0 && (
            <span className="card-stacks" aria-label={`Nível ${card.stacks} para ${next}`}>
              NV {card.stacks} → <b>{next}</b>
            </span>
          )}
        </span>
        <span className="card-shine" />
      </span>
    </button>
  );
}

/** Escolha de 1 entre 3 cartas entre ondas. Teclas 1/2/3 ou clique. */
export function CardScreen() {
  const offer = useGame((s) => s.offer);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => setPicked(null), [offer?.id]);

  const pick = useCallback(
    (id: string) => {
      if (picked !== null) return;
      setPicked(id);
      window.setTimeout(() => actions.pickCard(id), PICK_MS);
    },
    [picked],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const card = offer?.cards[n - 1];
      if (card) {
        e.preventDefault();
        pick(card.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [offer, pick]);

  if (!offer) return null;
  return (
    <div className="screen screen--cards" key={offer.id}>
      <div className="cards-head">
        <div className="cards-kicker">ONDA {offer.wave} LIMPA</div>
        <h2 className="cards-title">ESCOLHA UMA CARTA</h2>
      </div>
      <div className="cards-row">
        {offer.cards.map((c, i) => (
          <Card key={c.id} card={c} index={i} picked={picked} onPick={pick} />
        ))}
      </div>
      <div className="cards-hint">Clique ou aperte 1, 2 ou 3</div>
    </div>
  );
}
