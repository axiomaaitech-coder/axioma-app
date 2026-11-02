"use client";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";

// Número que "autocarrega" (conta de 0 até o valor real) ao montar/atualizar
// — usado em KPIs e valores de destaque nos dois temas (Escuro/Claro), não
// muda cor/fonte, só anima o dígito. Formato sempre pt-BR (mesma convenção
// já usada em todo valor monetário do Axioma, independente do idioma da UI
// — ver fBRL/toLocaleString("pt-BR") espalhados pelos módulos). Sempre anima,
// mesmo com prefers-reduced-motion ativo no sistema — decisão explícita do
// Elias (é assinatura visual do painel, não decorativo), mesmo critério do
// CountUp.
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
    // "89.2%" (fPct usa ponto decimal) NÃO é milhar: sem vírgula e com 1–2 casas depois de um ponto só
    // = decimal com ponto. Antes virava 892% (Índice de Recuperação na Inadimplência). "1.500" segue milhar.
    const pontoDecimal = !core.includes(",") && /^-?\d+\.\d{1,2}$/.test(core);
    const casasDecimais = pontoDecimal ? core.split(".")[1].length : core.includes(",") ? core.split(",")[1].length : 0;
    const numericTarget = pontoDecimal ? parseFloat(core) : parseFloat(core.replace(/\./g, "").replace(",", "."));

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
      // termina exatamente no texto original (mesmo separador decimal que a tela mandou)
      onComplete: () => { if (ref.current) ref.current.textContent = value; },
    });

    return () => { tween.kill(); };
  }, [value, duration]);

  return <span ref={ref} className={className}>{value}</span>;
}

export default AnimatedNumber;
