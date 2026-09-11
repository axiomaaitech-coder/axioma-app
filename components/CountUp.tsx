"use client";
import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

// Animação de count-up pros números de indicador (KPIs) — sobe do zero até
// o valor real quando o card entra na tela. Componente novo, sem uso em
// nenhum outro módulo ainda; opt-in por tela. Respeita prefers-reduced-motion
// (mostra o valor final direto, sem animar) e só anima um valor numérico —
// a formatação (moeda, %, etc.) fica com quem chama, via `formatar`.
export function CountUp({
  valor,
  formatar,
  duracao = 0.9,
}: {
  valor: number;
  formatar: (v: number) => string;
  duracao?: number;
}) {
  const [exibido, setExibido] = useState(0);
  const primeiraRenderRef = useRef(true);

  useEffect(() => {
    const reduzida = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzida) {
      setExibido(valor);
      return;
    }
    const de = primeiraRenderRef.current ? 0 : exibido;
    primeiraRenderRef.current = false;
    const controls = animate(de, valor, {
      duration: duracao,
      ease: "easeOut",
      onUpdate: (v) => setExibido(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return <>{formatar(exibido)}</>;
}

export default CountUp;
