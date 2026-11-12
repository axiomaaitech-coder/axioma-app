"use client";
// Simulador do split payment (Reforma Tributária). Mesma conta em qualquer tela: lib/splitPayment.ts.
// Entrada pré-preenchida com os números reais da Empresa (receita e compras médias da DRE, caixa de hoje); tudo editável.
import { useEffect, useMemo, useState } from "react";
import { Scissors } from "lucide-react";
import { CanvasBox } from "../CanvasBox";
import { createBrowserClient } from "../../lib/supabaseBrowser";
import { saldoCaixaRealizado } from "../../lib/caixaSaldo";
import { hojeISO } from "../../lib/datas";
import { lerValorBR } from "../../lib/valorBR";
import { CENARIOS_SPLIT, simularSplit } from "../../lib/splitPayment";
import { carregarDadosFiscais } from "../../lib/iaTributariaHelpers";
import { obterEmpresaAtiva } from "../../lib/empresaHelpers";

type Lang = "pt" | "en" | "es";
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtIn = (n: number) => (n > 0 ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

// Sem receita/compras/regime nas props (ex.: Fluxo de Caixa), busca sozinho pela mesma leitura da IA Tributária.
export default function SimuladorSplit({ lang, temaClaro, empresaId: empProp, receitaMensal: recProp, comprasMensal: compProp, regime: regProp }: {
  lang: Lang; temaClaro: boolean; empresaId?: string | null; receitaMensal?: number; comprasMensal?: number; regime?: string | null;
}) {
  const [empAuto, setEmpAuto] = useState<string | null>(null);
  useEffect(() => { if (empProp === undefined) void obterEmpresaAtiva().then(setEmpAuto); }, [empProp]);
  const empresaId = empProp ?? empAuto;
  const [base, setBase] = useState<{ receita: number; compras: number; regime: string | null } | null>(null);
  useEffect(() => {
    if (recProp != null || !empresaId) return;
    void supabase.auth.getUser().then(({ data }) => data.user ? carregarDadosFiscais(data.user.id, empresaId) : null)
      .then((d) => { if (d) setBase({ receita: d.receita_bruta_mensal, compras: d.custos_variaveis_mensal, regime: d.regime_atual }); })
      .catch(() => setBase(null));
  }, [empresaId, recProp]);
  const receitaMensal = recProp ?? base?.receita ?? 0, comprasMensal = compProp ?? base?.compras ?? 0, regime = regProp ?? base?.regime ?? null;
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const cor = {
    titulo: temaClaro ? "#101b3d" : "#e6edf5", texto2: temaClaro ? "#374151" : "#a3b1c2", verde: temaClaro ? "#0f7a5a" : "#2ecc9b",
    alerta: temaClaro ? "#9a3412" : "#fbbf24", borda: temaClaro ? "rgba(16,27,61,0.12)" : "rgba(163,177,194,0.15)",
    aninhado: temaClaro ? "rgba(245,238,220,0.7)" : "rgba(2,8,16,0.5)", campo: temaClaro ? "#ffffff" : "rgba(10,22,40,0.9)",
  };
  const campo = { background: cor.campo, border: `1px solid ${cor.borda}`, color: cor.titulo };
  const [cenario, setCenario] = useState(CENARIOS_SPLIT[0].id);
  const [outra, setOutra] = useState("");
  const [receita, setReceita] = useState(fmtIn(receitaMensal));
  const [compras, setCompras] = useState(fmtIn(comprasMensal));
  const [pct, setPct] = useState("100");
  const [dias, setDias] = useState("40");
  const [caixa, setCaixa] = useState<number | null>(null);
  useEffect(() => { setReceita(fmtIn(receitaMensal)); setCompras(fmtIn(comprasMensal)); }, [receitaMensal, comprasMensal]);
  useEffect(() => { if (empresaId) void saldoCaixaRealizado(supabase, empresaId, hojeISO()).then((r) => setCaixa(r.erro ? null : r.saldo)); }, [empresaId]);

  const c = CENARIOS_SPLIT.find((x) => x.id === cenario);
  const aliquota = cenario === "outra" ? lerValorBR(outra) : c?.aliquotaPct ?? 0;
  const r = useMemo(() => simularSplit({ receitaMensal: lerValorBR(receita), pctTributavel: Number(pct) || 0, comprasComCreditoMensal: lerValorBR(compras), aliquotaPct: aliquota, diasImpostoNoCaixa: Number(dias) || 0, caixaHoje: caixa }), [receita, pct, compras, aliquota, dias, caixa]);
  const simples = /simples|mei/i.test(regime ?? "");
  const traduz = (a: string) => (lang === "pt" ? a : ({
    "o caixa de hoje não cobre o capital de giro que o split vai tirar": L("", "today's cash does not cover the working capital the split will take", "la caja de hoy no cubre el capital de trabajo que el split va a retirar"),
    "o caixa cobre o cenário com créditos, mas não o pior caso (retenção cheia)": L("", "cash covers the scenario with credits, but not the worst case (full withholding)", "la caja cubre el escenario con créditos, pero no el peor caso (retención total)"),
    "as compras com crédito passam da receita tributável: confira os valores": L("", "purchases with credit exceed taxable revenue: check the amounts", "las compras con crédito superan los ingresos gravados: revise los valores"),
  } as Record<string, string>)[a] ?? a);
  const lbl = (t: string, id: string, ajuda?: string) => <label htmlFor={id} className="text-xs font-semibold block mb-1" style={{ color: cor.titulo }}>{t}{ajuda && <span className="block font-normal" style={{ color: cor.texto2 }}>{ajuda}</span>}</label>;
  const linha = (n: string, v: string, destaque?: boolean) => (
    <div className="rounded-xl p-2.5 flex flex-wrap justify-between gap-2" style={{ background: cor.aninhado, border: `1px solid ${cor.borda}` }}>
      <span className="text-xs" style={{ color: cor.texto2 }}>{n}</span><b className={destaque ? "text-base" : "text-sm"} style={{ color: destaque ? cor.verde : cor.titulo }}>{v}</b>
    </div>);

  return (
    <CanvasBox cor={cor.verde} {...(temaClaro ? { fundo: "#f6f7c4", premium3d: true } : { premium3d: true })}>
      <p className="text-sm font-black flex items-center gap-2 mb-1" style={{ color: cor.titulo }}><Scissors size={16} /> {L("Split payment: quanto deixa de entrar no seu caixa", "Split payment: how much stops reaching your cash", "Split payment: cuánto deja de entrar en su caja")}</p>
      <p className="text-xs mb-3" style={{ color: cor.texto2 }}>{L("Com a Reforma, o IBS e a CBS são separados no momento em que o cliente paga, antes de o dinheiro chegar à sua conta (LC 214/2025, art. 31). Hoje você recebe o valor cheio e paga o imposto depois; com o split, esse dinheiro nunca passa pelo caixa. A implantação é gradual e ainda não tem data marcada (art. 35).", "With the Reform, IBS and CBS are split off when the customer pays, before the money reaches your account (LC 214/2025, art. 31). Today you receive the full amount and pay the tax later; with the split, that money never passes through your cash. Rollout is gradual and has no set date yet (art. 35).", "Con la Reforma, el IBS y la CBS se separan cuando el cliente paga, antes de que el dinero llegue a su cuenta (LC 214/2025, art. 31). Hoy recibe el valor completo y paga el impuesto después; con el split, ese dinero nunca pasa por la caja. La implantación es gradual y aún no tiene fecha (art. 35).")}</p>
      {simples && <p className="text-xs mb-3 font-semibold" style={{ color: cor.alerta }}>{L("Sua Empresa está no Simples: a regra do split para quem paga tudo no DAS ainda depende de regulamentação. A conta abaixo mostra o cenário de quem optar por pagar IBS e CBS pelo regime regular.", "Your company is in the Simples: the split rule for those paying everything in the DAS still depends on regulation. The math below shows the scenario for opting to pay IBS and CBS under the regular regime.", "Su empresa está en el Simples: la regla del split para quien paga todo en el DAS aún depende de reglamentación. La cuenta muestra el escenario de optar por pagar IBS y CBS por el régimen regular.")}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="sm:col-span-2 lg:col-span-3">{lbl(L("Cenário de alíquota", "Rate scenario", "Escenario de alícuota"), "split-cen", c ? `${L("Fonte", "Source", "Fuente")}: ${c.fonte}` : undefined)}
          <select id="split-cen" value={cenario} onChange={(e) => setCenario(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo}>
            {CENARIOS_SPLIT.map((x) => <option key={x.id} value={x.id}>{x.nome[lang]}</option>)}
            <option value="outra">{L("Outra alíquota (informar)", "Other rate (enter)", "Otra alícuota (informar)")}</option>
          </select></div>
        {cenario === "outra" && <div>{lbl(L("Alíquota (%)", "Rate (%)", "Alícuota (%)"), "split-outra")}<input id="split-outra" inputMode="decimal" value={outra} onChange={(e) => setOutra(e.target.value)} placeholder="10,5" className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} /></div>}
        <div>{lbl(L("Receita média por mês (R$)", "Average monthly revenue (R$)", "Ingreso medio mensual (R$)"), "split-rec", L("da sua DRE; pode mudar", "from your income statement; editable", "de su estado de resultados; editable"))}<input id="split-rec" inputMode="decimal" value={receita} onChange={(e) => setReceita(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} /></div>
        <div>{lbl(L("Parte que paga IBS/CBS (%)", "Share paying IBS/CBS (%)", "Parte que paga IBS/CBS (%)"), "split-pct", L("exportação e isentos ficam fora", "exports and exempt sales are excluded", "exportación y exentos quedan fuera"))}<input id="split-pct" inputMode="numeric" value={pct} onChange={(e) => setPct(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} /></div>
        <div>{lbl(L("Compras com crédito por mês (R$)", "Monthly purchases with credit (R$)", "Compras con crédito al mes (R$)"), "split-comp", L("mercadorias e insumos; da DRE", "goods and inputs; from income statement", "mercaderías e insumos; del estado de resultados"))}<input id="split-comp" inputMode="decimal" value={compras} onChange={(e) => setCompras(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} /></div>
        <div>{lbl(L("Dias que o imposto fica no caixa hoje", "Days the tax stays in cash today", "Días que el impuesto queda en caja hoy"), "split-dias", L("ex.: recebe no mês e paga dia 25 do mês seguinte ≈ 40", "e.g. receive during the month, pay on the 25th of next ≈ 40", "ej.: recibe en el mes y paga el 25 del siguiente ≈ 40"))}<input id="split-dias" inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {linha(L("Retido no recebimento, por mês (pior caso)", "Withheld at receipt, per month (worst case)", "Retenido al cobrar, por mes (peor caso)"), `${brl(r.retidoBruto)} · ${String(r.pctReceitaRetida).replace(".", ",")}% ${L("da receita", "of revenue", "de los ingresos")}`)}
        {linha(L("Créditos das compras que abatem", "Purchase credits that offset", "Créditos de compras que compensan"), brl(r.creditos))}
        {linha(L("Retido por mês, já com os créditos", "Withheld per month, net of credits", "Retenido por mes, neto de créditos"), brl(r.retidoLiquido))}
        {linha(L("Capital de giro a mais (com créditos)", "Extra working capital (with credits)", "Capital de trabajo extra (con créditos)"), brl(r.capitalGiroLiquido), true)}
        {linha(L("Capital de giro a mais (pior caso)", "Extra working capital (worst case)", "Capital de trabajo extra (peor caso)"), brl(r.capitalGiroPiorCaso))}
        {linha(L("Caixa de hoje", "Cash today", "Caja de hoy"), caixa == null ? "—" : `${brl(caixa)}${r.caixaCobre == null ? "" : r.caixaCobre ? L(" · cobre", " · covers it", " · cubre") : L(" · não cobre o pior caso", " · does not cover the worst case", " · no cubre el peor caso")}`)}
      </div>
      {r.alertas.length > 0 && <ul className="mt-3 space-y-1">{r.alertas.map((a) => <li key={a} className="text-xs font-semibold" style={{ color: cor.alerta }}>⚠ {traduz(a)}</li>)}</ul>}
      <p className="text-xs mt-3" style={{ color: cor.texto2 }}>{L("Como ler: o capital de giro a mais é o dinheiro do imposto que hoje fica no seu caixa por alguns dias e, com o split, deixa de existir. É uma necessidade única, que acompanha o tamanho das vendas. Transição oficial: 2026 teste (CBS 0,9% + IBS 0,1%), 2027 CBS cheia e fim do PIS/Cofins, IBS crescendo de 2029 a 2032, regime cheio em 2033 (EC 132/2023, ADCT arts. 125–129). Simulação para planejar: não é cálculo de guia.", "How to read it: the extra working capital is the tax money that today stays in your cash for a few days and disappears with the split. It is a one-time need that follows sales volume. Official transition: 2026 test (CBS 0.9% + IBS 0.1%), 2027 full CBS and end of PIS/Cofins, IBS rising 2029–2032, full regime in 2033 (EC 132/2023, ADCT arts. 125–129). A planning simulation, not a tax computation.", "Cómo leer: el capital de trabajo extra es el dinero del impuesto que hoy queda en su caja por algunos días y desaparece con el split. Es una necesidad única que acompaña el volumen de ventas. Transición oficial: 2026 prueba (CBS 0,9% + IBS 0,1%), 2027 CBS plena y fin de PIS/Cofins, IBS creciendo de 2029 a 2032, régimen pleno en 2033 (EC 132/2023, ADCT arts. 125–129). Simulación para planificar, no es cálculo de guía.")}</p>
    </CanvasBox>
  );
}
