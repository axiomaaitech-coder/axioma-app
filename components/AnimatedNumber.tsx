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
    const prefixMatch = value.match(/^[^\d]*/);
    const prefix = prefixMatch ? prefixMatch[0] : "";
    const suffixMatch = value.match(/[^\d]*$/);
    const suffix = suffixMatch ? suffixMatch[0] : "";
    const numericTarget = Number(value.replace(/[^\d]/g, ""));

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
        ref.current.textContent = `${prefix}${new Intl.NumberFormat("pt-BR").format(
          Math.round(counter.current),
        )}${suffix}`;
      },
    });

    return () => { tween.kill(); };
  }, [value, duration]);

  return <span ref={ref} className={className}>{value}</span>;
}

export default AnimatedNumber;
