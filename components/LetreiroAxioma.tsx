"use client";

// Letreiro/marquee padrão da marca — mesmo efeito visual já usado em
// Receitas, Precificação e outros módulos (texto rolando, pausa no hover),
// extraído aqui pra reaproveitar nos módulos que usam ModuloLayout
// (Tesouraria, Contador, Fiscal, Razão, Balancete, DRE Contábil), que não
// tinham essa marca. "AXIOMA AI.TECH" sempre entra como 1º item.

export function LetreiroAxioma({ id, itens, cor }: { id: string; itens: string[]; cor: string }) {
  const todos = ["🚀 AXIOMA AI.TECH", ...itens];
  const classe = `marquee-${id}`;
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(90deg, ${cor}20, ${cor}0d)`, border: `1px solid ${cor}40` }}>
      <div className={`${classe} py-2.5 whitespace-nowrap`} style={{ display: "inline-block" }}>
        {[0, 1].map((rep) => (
          <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
            {todos.map((m, i) => (
              <span key={i} style={{ color: i === 0 ? cor : "#e2e8f0" }}>
                {m}<span style={{ color: cor }}>{"  •  "}</span>
              </span>
            ))}
          </span>
        ))}
      </div>
      <style>{`.${classe}{animation:${classe} 30s linear infinite}@keyframes ${classe}{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.${classe}:hover{animation-play-state:paused}`}</style>
    </div>
  );
}
