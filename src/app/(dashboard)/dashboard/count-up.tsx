"use client";

// Animação de contagem: atualizar estado a cada frame é o objetivo aqui.
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";

/**
 * Anima um número de 0 até `value` ao montar (easeOutCubic).
 * Respeita prefers-reduced-motion: nesse caso mostra o valor final direto.
 * Só dispara quando entra na viewport (IntersectionObserver) - bom pro analytics.
 */
export function CountUp({
  value,
  duration = 1100,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || value === 0) {
      setDisplay(value);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const start = () => {
      if (ran.current) return;
      ran.current = true;
      let startTs = 0;
      let raf = 0;
      const tick = (ts: number) => {
        if (!startTs) startTs = ts;
        const p = Math.min(1, (ts - startTs) / duration);
        setDisplay(Math.round(easeOutCubic(p) * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setDisplay(0);
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("pt-BR")}
    </span>
  );
}
