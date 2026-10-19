import { useEffect, useRef } from 'react';

interface Props {
  value: number;
  className?: string;
  /** Duração da contagem em ms. */
  duration?: number;
}

/**
 * Número que "rola" até o novo valor. Anima escrevendo direto no DOM via rAF,
 * sem rerender do React por quadro.
 */
export function Counter({ value, className, duration = 280 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = shown.current;
    const to = value;
    if (from === to) {
      el.textContent = to.toLocaleString('pt-BR');
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      shown.current = Math.round(from + (to - from) * eased);
      el.textContent = shown.current.toLocaleString('pt-BR');
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Pulso visual reiniciado a cada mudança.
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString('pt-BR')}
    </span>
  );
}
