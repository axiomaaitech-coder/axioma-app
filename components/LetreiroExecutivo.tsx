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
}: {
  itens: (string | ItemLetreiro | false | null | undefined)[];
  cor: string;
}) {
  const normalizados: ItemLetreiro[] = itens
    .filter((it): it is string | ItemLetreiro => !!it)
    .map((it) => (typeof it === "string" ? { texto: it } : it));

  if (normalizados.length === 0) return null;

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(90deg, ${cor}18, ${cor}0c)`, border: `1px solid ${cor}30` }}>
      <div className="letreiro-axioma py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
        {[0, 1].map((rep) => (
          <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
            {normalizados.map((it, i) => (
              <span key={i}>
                {it.onClick ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={it.onClick}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); it.onClick!(); } }}
                    className="cursor-pointer px-1 -mx-1 py-2 -my-2 rounded active:opacity-70"
                    style={{ color: it.cor || (it.destaque ? cor : "#e2e8f0") }}
                  >
                    {it.texto}
                  </span>
                ) : (
                  <span style={{ color: it.cor || (it.destaque ? cor : "#e2e8f0") }}>{it.texto}</span>
                )}
                <span style={{ color: cor }}>{"  •  "}</span>
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
