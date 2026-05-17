"use client";

import * as React from "react";

type Props = {
  value: number;
  duration?: number; // ms
  format?: (n: number) => string;
  className?: string;
};

/**
 * Anima de 0 até `value` em `duration`ms usando easing cubic-out.
 */
export function NumberTicker({ value, duration = 900, format, className }: Props) {
  const [n, setN] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // cubic-out
      setN(value * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setN(value); // snap exato
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const display = format ? format(n) : Math.round(n).toLocaleString("pt-BR");
  return <span className={className}>{display}</span>;
}
