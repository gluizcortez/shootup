import { useRef } from 'react';
import type { ButtonHTMLAttributes, PointerEvent } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };

/** Botão com resposta tátil: sobe, inclina seguindo o cursor e comprime no clique. */
export function TactileButton({ variant = 'primary', className = '', onPointerMove, onPointerLeave, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--tilt-x', `${(-py * 8).toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${(px * 10).toFixed(2)}deg`);
      el.style.setProperty('--shine-x', `${((px + 0.5) * 100).toFixed(1)}%`);
    }
    onPointerMove?.(e);
  };

  const leave = (e: PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (el) {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    }
    onPointerLeave?.(e);
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`tbtn tbtn--${variant} ${className}`}
      onPointerMove={move}
      onPointerLeave={leave}
      {...rest}
    />
  );
}
