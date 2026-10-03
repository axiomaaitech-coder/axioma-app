"use client";

// Marquee executivo (ticker rolante) — mesmo padrão inline já usado no
// Dashboard/Custos Fixos/etc. (array de itens + 2 repetições + @keyframes),
// extraído aqui porque o MEI passou a usar em 7 telas de uma vez — evita
// duplicar a mesma animação 7 vezes. Módulos mais antigos que já tinham a
// versão inline (Dashboard, Custos Fixos...) não precisaram migrar.
//
// cor/onClick por item são OPCIONAIS — usados pelo Cockpit MEI pra misturar
// avisos de severidades diferentes numa única tira, cada um clicável pro seu
// submódulo de origem. Os 7 módulos que só passam string/destaque continuam
// exatamente iguais.

export type ItemLetreiro = { texto: string; destaque?: boolean; cor?: string; onClick?: () => void };

export function LetreiroExecutivo({
  itens,
  cor,
  solido = false,
  corDestaque,
  textoBase = "var(--axi-text-primary)",
}: {
  itens: (string | ItemLetreiro | false | null | undefined)[];
  cor: string;
  /** Opt-in — fundo sólido (opaco) na cor `cor`, em vez do tingimento
   * translúcido padrão. Sem isso, comportamento 100% igual a antes (nenhum
   * dos ~8 módulos que já usam este componente muda). */
  solido?: boolean;
  /** Cor do texto/separador dos itens "destaque" quando `solido` — pra dar
   * contraste sobre o fundo sólido (ex.: verde-menta sobre azul-marinho).
   * Sem isso, usa `cor` (comportamento de sempre). */
  corDestaque?: string;
  /** Cor do texto não-destacado. Opcional — o padrão já resolve certo em
   * qualquer tema (var(--axi-text-primary) segue o data-theme da tela).
   * Só passe algo aqui se quiser fugir do padrão de propósito. Antes disso
   * o padrão era um hex fixo claro, ilegível/"transparente" sobre fundo
   * branco no tema Claro — corrigido pra nunca mais depender de cada
   * módulo lembrar de passar essa prop. */
  textoBase?: string;
}) {
  const normalizados: ItemLetreiro[] = itens
    .filter((it): it is string | ItemLetreiro => !!it)
    .map((it) => (typeof it === "string" ? { texto: it } : it));

  if (normalizados.length === 0) return null;

  // Letreiro único nos 2 temas (Elias 2026-10-03): azul-marinho sólido, letra branca,
  // destaque verde-menta — cor/solido/corDestaque/textoBase ficam só por compatibilidade.
  void cor; void solido; void corDestaque; void textoBase;
  const corAcento = "#2ecc9b";
  const texto = "#ffffff";

  return (
    <div className="relative rounded-xl overflow-hidden" style={{
      background: "#101b3d",
      border: "1px solid rgba(46,204,155,0.35)",
    }}>
      <div className="letreiro-axioma py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
        {[0, 1].map((rep) => (
          <span key={rep} className="text-[13px] font-bold tracking-wide" aria-hidden={rep === 1}>
            {normalizados.map((it, i) => (
              <span key={i}>
                {it.onClick ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={it.onClick}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); it.onClick!(); } }}
                    className="cursor-pointer px-1 -mx-1 py-2 -my-2 rounded active:opacity-70"
                    style={{ color: it.destaque ? corAcento : texto }}
                  >
                    {it.texto}
                  </span>
                ) : (
                  <span style={{ color: it.destaque ? corAcento : texto }}>{it.texto}</span>
                )}
                <span style={{ color: corAcento }}>{"  •  "}</span>
              </span>
            ))}
          </span>
        ))}
      </div>
      <style>{`.letreiro-axioma{animation:letreiroAxioma 30s linear infinite}@keyframes letreiroAxioma{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.letreiro-axioma:hover{animation-play-state:paused}`}</style>
    </div>
  );
}

export default LetreiroExecutivo;
