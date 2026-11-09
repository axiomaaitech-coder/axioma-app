"use client";
// RH · Simulador "Contratar ou não" (2026-11-09). Antes de contratar: custo real por pessoa, impacto no lucro médio e no
// peso do pessoal sobre o faturamento, e a saída de caixa mês a mês no 1º ano (com o 13º). Só simula: nada é gravado.
// Mesma conta da IA (lib/rhSimulacao + lib/rhSimulacaoBase).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, AlertTriangle } from "lucide-react";
import { RotinaRh, supabaseRh as supabase, type CtxRotina } from "../../../../components/rh/RotinaRh";
import { CanvasBox } from "../../../../components/CanvasBox";
import { BotaoAcao } from "../../../../components/BotaoAcao";
import { hojeISO } from "../../../../lib/datas";
import { lerValorBR } from "../../../../lib/valorBR";
import { simularContratacao, somaMes } from "../../../../lib/rhSimulacao";
import { carregarBaseSimulacao } from "../../../../lib/rhSimulacaoBase";

const brl = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const pctTxt = (n: number | null | undefined) => (n == null ? "—" : `${String(n).replace(".", ",")}%`);
const NOME_MES = { pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] };

function Conteudo({ ctx }: { ctx: CtxRotina }) {
  const { empresaId, pode, lang, L, cor, campo, cartao, avisar } = ctx;
  const [f, setF] = useState({ salario: "", quantidade: "1", aprendiz: false, mes: somaMes(hojeISO().slice(0, 7), 1) });
  const [base, setBase] = useState<Awaited<ReturnType<typeof carregarBaseSimulacao>> | null>(null);
  const [res, setRes] = useState<ReturnType<typeof simularContratacao>>(null);
  useEffect(() => { void carregarBaseSimulacao(supabase, empresaId, hojeISO(), pode.salario).then(setBase).catch(() => avisar(L("Não foi possível ler a DRE e o caixa agora: o custo sai, o impacto não.", "Could not read the income statement and cash now: the cost works, the impact does not.", "No se pudo leer el estado de resultados y la caja ahora: el costo sale, el impacto no."))); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function simular(): Promise<boolean> {
    const salario = lerValorBR(f.salario);
    if (!(salario > 0)) { avisar(L("Informe o salário mensal.", "Enter the monthly salary.", "Informe el salario mensual.")); return false; }
    const b = base ?? { base: { receitaMediaMensal: null, lucroMedioMensal: null, custoPessoalAtual: null, caixa: null }, regime: null, periodo_dre: { de: "", ate: "" }, limitacoes: [] };
    const r = simularContratacao({ salario, quantidade: Number(f.quantidade) || 1, codCateg: f.aprendiz ? "103" : "101", regime: b.regime, mesInicio: f.mes, base: b.base });
    setRes(r);
    setTimeout(() => document.getElementById("resultado-sim")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    return !!r;
  }
  const nomeMes = (m: string) => `${NOME_MES[lang][Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;
  const maxFluxo = res ? Math.max(1, ...res.fluxo.map((x) => x.valor)) : 1;
  const lbl = (t: string, id: string) => <label htmlFor={id} className="text-xs font-semibold block mb-1" style={{ color: cor.titulo }}>{t}</label>;
  const nested = { background: cor.aninhado, border: `1px solid ${cor.borda}` };
  const traduzAlerta = (a: string) => (lang === "pt" ? a : ({
    "com essa contratação o lucro médio mensal fica NEGATIVO": L("", "with this hire the average monthly profit becomes NEGATIVE", "con esta contratación la utilidad media mensual queda NEGATIVA"),
    "a contratação consome mais da metade do lucro médio mensal": L("", "the hire takes more than half of the average monthly profit", "la contratación consume más de la mitad de la utilidad media mensual"),
    "o caixa de hoje não cobre os primeiros meses dessa contratação": L("", "today's cash does not cover the first months of this hire", "la caja de hoy no cubre los primeros meses de esta contratación"),
    "novembro e dezembro têm o 13º: o caixa precisa de folga nesses meses": L("", "November and December have the 13th salary: cash needs room in those months", "noviembre y diciembre tienen el 13º: la caja necesita margen en esos meses"),
  } as Record<string, string>)[a] ?? a);

  return (<>
    <p className="text-sm" style={{ color: cor.texto2 }}>{L("Antes de contratar, veja quanto a pessoa custa de verdade (não só o salário), quanto o lucro médio cai e como fica o caixa mês a mês no primeiro ano. É só simulação: nada é gravado.", "Before hiring, see what the person really costs (not just the salary), how much average profit drops and how cash looks month by month in the first year. It is only a simulation: nothing is saved.", "Antes de contratar, vea cuánto cuesta realmente la persona (no solo el salario), cuánto baja la utilidad media y cómo queda la caja mes a mes en el primer año. Es solo una simulación: no se guarda nada.")}</p>
    <CanvasBox cor={cor.verde} {...cartao}>
      <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: cor.titulo }}><Calculator size={16} /> {L("Quem você quer contratar?", "Who do you want to hire?", "¿A quién quiere contratar?")}</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>{lbl(L("Salário mensal (R$)", "Monthly salary (R$)", "Salario mensual (R$)"), "sim-sal")}<input id="sim-sal" inputMode="decimal" placeholder="2.500,00" value={f.salario} onChange={(e) => setF({ ...f, salario: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} /></div>
        <div>{lbl(L("Quantas pessoas", "How many people", "Cuántas personas"), "sim-qtd")}<input id="sim-qtd" type="number" min={1} max={500} value={f.quantidade} onChange={(e) => setF({ ...f, quantidade: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} /></div>
        <div>{lbl(L("Começa em", "Starts in", "Empieza en"), "sim-mes")}<input id="sim-mes" type="month" value={f.mes} onChange={(e) => setF({ ...f, mes: e.target.value || f.mes })} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} /></div>
        <label className="flex items-center gap-2 text-sm py-2.5" style={{ color: "var(--axi-text-primary)" }}><input type="checkbox" checked={f.aprendiz} onChange={(e) => setF({ ...f, aprendiz: e.target.checked })} /> {L("Jovem aprendiz (FGTS 2%)", "Young apprentice (FGTS 2%)", "Joven aprendiz (FGTS 2%)")}</label>
      </div>
      <BotaoAcao executar={simular} texto={L("Simular", "Simulate", "Simular")} textoTrabalhando="…" className="mt-3 px-6 py-2.5 rounded-xl text-sm" estilo={{ background: cor.btnMenta, color: "#fff" }} />
      {base && <p className="text-xs mt-2" style={{ color: cor.texto2 }}>{L("Regime usado", "Tax regime used", "Régimen usado")}: <b>{base.regime ?? L("não informado (Config → Empresa)", "not set (Settings → Company)", "no informado (Config → Empresa)")}</b>{base.base.lucroMedioMensal != null && <> · {L("lucro médio mensal (12 meses)", "average monthly profit (12 months)", "utilidad media mensual (12 meses)")}: <b>{brl(base.base.lucroMedioMensal)}</b></>}</p>}
    </CanvasBox>

    {res && <div id="resultado-sim" className="space-y-4" style={{ scrollMarginTop: 80 }}>
      {res.alertas.length > 0 && <CanvasBox cor={cor.laranja} {...cartao}>
        <ul className="space-y-1 text-sm">{res.alertas.map((a) => <li key={a} className="flex gap-2 font-semibold" style={{ color: cor.laranja }}><AlertTriangle size={16} className="shrink-0" /> {traduzAlerta(a)}</li>)}</ul>
      </CanvasBox>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CanvasBox cor={cor.verde} {...cartao}>
          <p className="text-sm font-black mb-2" style={{ color: cor.titulo }}>{L("Custo real por pessoa", "Real cost per person", "Costo real por persona")}</p>
          <p className="text-2xl font-black" style={{ color: cor.verde }}>{brl(res.por_pessoa.custo_mensal)} <span className="text-sm font-semibold" style={{ color: cor.texto2 }}>/{L("mês", "month", "mes")}</span></p>
          <p className="text-xs mb-3" style={{ color: cor.texto2 }}>{L(`Para cada R$ 1,00 de salário, a Empresa gasta R$ ${(res.por_pessoa.custo_mensal / res.por_pessoa.salario).toFixed(2).replace(".", ",")}.`, `For each R$ 1.00 of salary, the company spends R$ ${(res.por_pessoa.custo_mensal / res.por_pessoa.salario).toFixed(2)}.`, `Por cada R$ 1,00 de salario, la empresa gasta R$ ${(res.por_pessoa.custo_mensal / res.por_pessoa.salario).toFixed(2).replace(".", ",")}.`)}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">{[[L("Salário", "Salary", "Salario"), res.por_pessoa.salario], ["FGTS", res.por_pessoa.fgts], [L("Provisões 13º e férias", "13th and vacation provisions", "Provisiones 13º y vacaciones"), res.por_pessoa.provisoes_13_ferias], [L("INSS patronal", "Employer INSS", "INSS patronal"), res.por_pessoa.inss_patronal]].map(([n, v]) => (
            <div key={String(n)} className="rounded-xl p-2" style={nested}><p style={{ color: cor.texto2 }}>{n}</p><p className="font-bold text-sm" style={{ color: cor.titulo }}>{brl(Number(v))}</p></div>))}</div>
          {res.quantidade > 1 && <p className="text-sm mt-3" style={{ color: cor.titulo }}>{L(`${res.quantidade} pessoas`, `${res.quantidade} people`, `${res.quantidade} personas`)}: <b>{brl(res.custo_mensal_total)}</b>/{L("mês", "month", "mes")}</p>}
          <p className="text-sm mt-1" style={{ color: cor.titulo }}>{L("Em 12 meses", "In 12 months", "En 12 meses")}: <b>{brl(res.custo_12_meses)}</b></p>
          <p className="text-xs mt-2" style={{ color: cor.texto2 }}>{res.base_inss_patronal}</p>
        </CanvasBox>
        <CanvasBox cor={cor.verde} {...cartao}>
          <p className="text-sm font-black mb-2" style={{ color: cor.titulo }}>{L("Impacto na Empresa", "Impact on the company", "Impacto en la empresa")}</p>
          <div className="space-y-2 text-sm">
            {[[L("Lucro médio mensal", "Average monthly profit", "Utilidad media mensual"), brl(res.impacto.lucro_medio_mensal_antes), brl(res.impacto.lucro_medio_mensal_depois)],
              [L("Pessoal sobre o faturamento", "Personnel over revenue", "Personal sobre la facturación"), pctTxt(res.impacto.pessoal_sobre_faturamento_antes_pct), pctTxt(res.impacto.pessoal_sobre_faturamento_depois_pct)]].map(([n, a, d]) => (
              <div key={n} className="rounded-xl p-2 flex flex-wrap justify-between gap-2" style={nested}><span style={{ color: cor.texto2 }}>{n}</span><span style={{ color: cor.titulo }}>{a} → <b>{d}</b></span></div>))}
            <div className="rounded-xl p-2 flex flex-wrap justify-between gap-2" style={nested}><span style={{ color: cor.texto2 }}>{L("Faturamento médio mensal", "Average monthly revenue", "Facturación media mensual")}</span><b style={{ color: cor.titulo }}>{brl(res.impacto.faturamento_medio_mensal)}</b></div>
            <div className="rounded-xl p-2 flex flex-wrap justify-between gap-2" style={nested}><span style={{ color: cor.texto2 }}>{L("Caixa de hoje cobre", "Today's cash covers", "La caja de hoy cubre")}</span><b style={{ color: cor.titulo }}>{res.impacto.meses_de_folego_no_caixa == null ? "—" : L(`${res.impacto.meses_de_folego_no_caixa} mês(es) desse custo`, `${res.impacto.meses_de_folego_no_caixa} month(s) of this cost`, `${res.impacto.meses_de_folego_no_caixa} mes(es) de este costo`)}</b></div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs font-bold">
            <Link href="/dre" className="underline" style={{ color: cor.verde }}>{L("Abrir DRE ›", "Open income statement ›", "Abrir estado de resultados ›")}</Link>
            <Link href="/fluxo-caixa" className="underline" style={{ color: cor.verde }}>{L("Abrir Fluxo de Caixa ›", "Open cash flow ›", "Abrir flujo de caja ›")}</Link>
            <Link href="/rh" className="underline" style={{ color: cor.verde }}>{L("Custo de pessoal atual ›", "Current personnel cost ›", "Costo de personal actual ›")}</Link>
          </div>
        </CanvasBox>
      </div>
      <CanvasBox cor={cor.verde} {...cartao}>
        <p className="text-sm font-black mb-1" style={{ color: cor.titulo }}>{L("Saída de caixa mês a mês (1º ano)", "Cash out month by month (1st year)", "Salida de caja mes a mes (1er año)")}: {brl(res.caixa_primeiro_ano)}</p>
        <p className="text-xs mb-3" style={{ color: cor.texto2 }}>{L("Salário no 5º dia útil e FGTS/INSS no dia 20 do mês seguinte; 13º em 30/11 e 20/12. Toque num mês para ver o que sai.", "Salary on the 5th business day and FGTS/INSS on the 20th of the following month; 13th salary on Nov 30 and Dec 20. Tap a month to see what goes out.", "Salario el 5º día hábil y FGTS/INSS el día 20 del mes siguiente; 13º el 30/11 y 20/12. Toque un mes para ver qué sale.")}</p>
        <div className="space-y-1">{res.fluxo.map((x) => (
          <details key={x.mes} className="rounded-lg px-2 py-1" style={nested}>
            <summary className="cursor-pointer flex items-center gap-2 text-sm" style={{ color: cor.titulo }}>
              <span className="w-14 shrink-0 font-semibold">{nomeMes(x.mes)}</span>
              <span className="flex-1 h-2 rounded-full" style={{ background: "rgba(128,128,128,0.15)" }}><span className="block h-2 rounded-full" style={{ width: `${(x.valor / maxFluxo) * 100}%`, background: x.itens.some((i) => i.rotulo.startsWith("13º")) ? cor.laranja : cor.verde }} /></span>
              <b className="w-28 text-right shrink-0">{brl(x.valor)}</b>
            </summary>
            {x.itens.length ? <ul className="text-xs mt-1 mb-1 pl-16 space-y-0.5" style={{ color: cor.texto2 }}>{x.itens.map((i) => <li key={i.rotulo} className="flex justify-between gap-2"><span>{i.rotulo}</span><span>{brl(i.valor)}</span></li>)}</ul>
              : <p className="text-xs pl-16 mb-1" style={{ color: cor.texto2 }}>{L("Nada sai neste mês (o salário do 1º mês é pago no mês seguinte).", "Nothing goes out this month (the 1st month's salary is paid the following month).", "No sale nada este mes (el salario del 1er mes se paga el mes siguiente).")}</p>}
          </details>))}</div>
      </CanvasBox>
      <details className="text-xs" style={{ color: cor.texto2 }}><summary className="cursor-pointer font-semibold">{L("Premissas desta simulação", "Assumptions of this simulation", "Premisas de esta simulación")}</summary>
        {lang === "pt" ? <ul className="list-disc pl-4 mt-1">{[...res.premissas, ...(base?.limitacoes ?? [])].map((p) => <li key={p}>{p}</li>)}</ul>
          : <p className="mt-1">{L("", "Same rule as HR personnel cost (salary + FGTS + provisions + employer INSS by regime), without overtime, benefits, RAT×FAP and third-party contributions; first vacation only after 12 months; profit and revenue are averages of the last 12 complete months of the income statement.", "Misma regla del costo de personal de RR. HH. (salario + FGTS + provisiones + INSS patronal según el régimen), sin horas extras, beneficios, RAT×FAP ni terceros; primeras vacaciones solo después de 12 meses; utilidad y facturación son promedios de los últimos 12 meses completos del estado de resultados.")}</p>}
      </details>
    </div>}
  </>);
}

export default function RhSimularPage() {
  return (
    <RotinaRh titulo={{ pt: "Simular contratação", en: "Hiring simulator", es: "Simular contratación" }}
      subtitulo={{ pt: "Contratar ou não: custo real, impacto no lucro e caixa mês a mês", en: "Hire or not: real cost, profit impact and month-by-month cash", es: "Contratar o no: costo real, impacto en la utilidad y caja mes a mes" }}
      letreiro={(c) => [c.L("Custo real além do salário", "Real cost beyond salary", "Costo real además del salario"), c.L("13º no caixa de nov/dez", "13th salary in Nov/Dec cash", "13º en la caja de nov/dic")]}>
      {(ctx) => <Conteudo ctx={ctx} />}
    </RotinaRh>
  );
}
