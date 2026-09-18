"use client";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";

// Número que "autocarrega" (conta de 0 até o valor real) ao montar/atualizar
// — usado em KPIs e valores de destaque nos dois temas (Escuro/Claro), não
// muda cor/fonte, só anima o dígito. Formato sempre pt-BR (mesma convenção
// já usada em todo valor monetário do Axioma, independente do idioma da UI
// — ver fBRL/toLocaleString("pt-BR") espalhados pelos módulos).
export function AnimatedNumber({
  value,
  className,
  duration = 1.2,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Núcleo numérico no formato pt-BR (milhar com ".", decimal com ",") —
    // NÃO usar replace(/[^\d]/g,"") sozinho: isso junta "42,5" em "425" e
    // corrompe qualquer valor com casas decimais (percentuais, taxas etc).
    const match = value.match(/-?[\d.,]*\d/);
    if (!match || match.index === undefined) {
      ref.current.textContent = value;
      return;
    }
    const core = match[0];
    const prefix = value.slice(0, match.index);
    const suffix = value.slice(match.index + core.length);
    const casasDecimais = core.includes(",") ? core.split(",")[1].length : 0;
    const numericTarget = parseFloat(core.replace(/\./g, "").replace(",", "."));

    if (!Number.isFinite(numericTarget) || numericTarget === 0) {
      ref.current.textContent = value;
      return;
    }

    const counter = { current: 0 };
    const tween = gsap.to(counter, {
      current: numericTarget,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (!ref.current) return;
        ref.current.textContent = `${prefix}${new Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: casasDecimais,
          maximumFractionDigits: casasDecimais,
        }).format(counter.current)}${suffix}`;
      },
    });

    return () => { tween.kill(); };
  }, [value, duration]);

  return <span ref={ref} className={className}>{value}</span>;
}

export default AnimatedNumber;
