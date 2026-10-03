"use client";

// Letreiro/marquee padrão da marca — mesmo efeito visual já usado em
// Receitas, Precificação e outros módulos (texto rolando, pausa no hover),
// extraído aqui pra reaproveitar nos módulos que usam ModuloLayout
// (Tesouraria, Contador, Fiscal, Razão, Balancete, DRE Contábil), que não
// tinham essa marca. "AXIOMA AI.TECH" sempre entra como 1º item.

export function LetreiroAxioma({ id, itens, cor, solido, corDestaque }: {
  id: string; itens: string[]; cor: string;
  /** Opt-in — fundo SÓLIDO azul-marinho + texto branco (regra absoluta do
   * letreiro no tema Claro), no lugar do degradê translúcido de sempre.
   * undefined = comportamento idêntico ao de sempre (nenhum módulo que já
   * usa este componente muda sem passar isso explicitamente). */
  solido?: boolean;
  /** Cor de destaque (primeiro item + separador) quando solido=true. */
  corDestaque?: string;
}) {
  const todos = ["🚀 AXIOMA AI.TECH", ...itens];
  const classe = `marquee-${id}`;
  // Letreiro único (Elias 2026-10-03): azul-marinho, letra branca, destaque verde-menta
  void cor; void solido; void corDestaque;
  const acento = "#2ecc9b";
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: "#101b3d", border: "1px solid rgba(46,204,155,0.35)" }}>
      <div className={`${classe} py-2.5 whitespace-nowrap`} style={{ display: "inline-block" }}>
        {[0, 1].map((rep) => (
          <span key={rep} className="text-sm font-bold tracking-wide" aria-hidden={rep === 1}>
            {todos.map((m, i) => (
              <span key={i} style={{ color: i === 0 ? acento : "#ffffff" }}>
                {m}<span style={{ color: acento }}>{"  •  "}</span>
              </span>
            ))}
          </span>
        ))}
      </div>
      <style>{`.${classe}{animation:${classe} 30s linear infinite}@keyframes ${classe}{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.${classe}:hover{animation-play-state:paused}`}</style>
    </div>
  );
}
