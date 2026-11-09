"use client";
// Cartão "Custo de pessoal (RH)" — a ponte RH ↔ financeiro na tela (2026-11-09). Mesma conta da IA (lib/rhCustoPessoal):
// estimativa do RH × o que está lançado em Custos Fixos como "Folha de pagamento". Não grava nada e não soma na DRE.
// Usado no Painel do RH, em Custos Fixos e em Centros de Custo. Sem liberação de salário no RH: só um aviso.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { CanvasBox } from "../CanvasBox";
import { createBrowserClient } from "../../lib/supabaseBrowser";
import { obterEmpresaAtiva } from "../../lib/empresaHelpers";
import { lerTodas } from "../../lib/lerTodas";
import { hojeISO } from "../../lib/datas";
import { lerPodeRh } from "../../lib/rhAcesso";
import { contratoAtual } from "../../lib/rhIA";
import { custoPessoal, compararComFinanceiro, regimeDaEmpresa, type SalarioVigente } from "../../lib/rhCustoPessoal";
import { custosFixosNoMes, type CustoFixo } from "../../lib/financeiro/calculos";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
type Lang = "pt" | "en" | "es";
type Linha = Record<string, any>;
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CustoPessoalCard({ lang, temaClaro, agrupar = "departamento", ondeEsta }: { lang: Lang; temaClaro: boolean; agrupar?: "departamento" | "centro"; ondeEsta?: "custos-fixos" | "centros-custo" | "rh" }) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [d, setD] = useState<{ estado: "carregando" | "sem_acesso" | "erro" | "ok"; r?: ReturnType<typeof custoPessoal>; ponte?: ReturnType<typeof compararComFinanceiro> | null }>({ estado: "carregando" });
  useEffect(() => { void (async () => {
    const eid = await obterEmpresaAtiva();
    if (!eid) { setD({ estado: "sem_acesso" }); return; }
    const pode = await lerPodeRh(supabase, eid, ["ver", "salario"]);
    if (!pode) { setD({ estado: "erro" }); return; }
    if (!pode.ver || !pode.salario) { setD({ estado: "sem_acesso" }); return; }
    const ler = (t: string, cols: string, lixeira: boolean) => lerTodas(() => { const q = supabase.from(t).select(cols).eq("empresa_id", eid); return (lixeira ? q.is("excluido_em", null) : q).order("id"); });
    const hoje = hojeISO();
    const [cs, ks, rs, ds, cc, emp, cf] = await Promise.all([
      ler("rh_colaboradores", "id, situacao", true),
      ler("rh_contratos", "id, colaborador_id, cargo_id, departamento_id, cod_categ, data_admissao, data_termino, experiencia, data_desligamento", false),
      ler("rh_remuneracoes", "id, contrato_id, vigencia_inicio, und_sal_fixo, valor", false),
      ler("rh_departamentos", "id, nome, centro_custo_id", true),
      supabase.from("centros_custo").select("id, nome").eq("empresa_id", eid),
      supabase.from("empresas").select("regime_tributario, atividade_fiscal").eq("id", eid).maybeSingle(),
      supabase.from("custos_fixos").select("id, descricao, categoria, valor_mensal, data_inicio, data_fim, created_at").eq("empresa_id", eid).eq("categoria", "Folha de pagamento"),
    ]);
    if ([cs, ks, rs, ds].some((x) => x.error)) { setD({ estado: "erro" }); return; }
    const vivos = new Set((cs.data as Linha[]).filter((c) => c.situacao === "ativo" || c.situacao === "afastado").map((c) => c.id));
    const ativos = [...contratoAtual(ks.data as never[] as { id: string; colaborador_id: string; cargo_id: string | null; departamento_id: string | null; data_admissao: string; data_termino: string | null; experiencia: boolean; data_desligamento: string | null; cod_categ: string }[]).values()]
      .filter((k) => vivos.has(k.colaborador_id) && !k.data_desligamento);
    const sal = new Map<string, SalarioVigente>();
    for (const x of [...(rs.data as Linha[])].filter((x) => x.vigencia_inicio <= hoje).sort((a, b) => String(b.vigencia_inicio).localeCompare(String(a.vigencia_inicio)))) if (!sal.has(x.contrato_id)) sal.set(x.contrato_id, { und_sal_fixo: Number(x.und_sal_fixo), valor: Number(x.valor) });
    const r = custoPessoal({ contratos: ativos, salario: sal, regime: regimeDaEmpresa((emp.data as Linha | null)?.regime_tributario), atividadeFiscal: (emp.data as Linha | null)?.atividade_fiscal,
      departamentos: new Map((ds.data as Linha[]).map((x) => [x.id, { nome: x.nome, centro_custo_id: x.centro_custo_id }])), centros: new Map(((cc.data ?? []) as Linha[]).map((x) => [x.id, x.nome])) });
    setD({ estado: "ok", r, ponte: cf.error ? null : compararComFinanceiro(r.custo_total_mensal, custosFixosNoMes(cf.data as CustoFixo[], hoje.slice(0, 7)).total_ativo) });
  })(); }, []);

  const verde = temaClaro ? "#0f7a5a" : "#2ecc9b", texto2 = temaClaro ? "#374151" : "var(--axi-text-secondary)", titulo = temaClaro ? "#101b3d" : "var(--axi-text-primary)";
  const aninhado = temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)", borda = temaClaro ? "rgba(16,27,61,0.12)" : "rgba(163,177,194,0.15)";
  const cartao = temaClaro ? { fundo: "#f6f7c4", premium3d: true } : { premium3d: true };
  const corSit: Record<string, string> = { confere: verde, folha_nao_lancada: temaClaro ? "#9a3412" : "#fbbf24", lancado_a_menos: temaClaro ? "#9a3412" : "#fbbf24", lancado_a_mais: temaClaro ? "#9a3412" : "#fbbf24" };
  const textoSit = (s: string) => ({
    folha_nao_lancada: L("Custos Fixos não tem nada em \"Folha de pagamento\" neste mês: a DRE e o Fluxo de Caixa não estão vendo a folha.", "Fixed Costs has nothing under \"Payroll\" this month: the income statement and cash flow are not seeing payroll.", "Costos Fijos no tiene nada en \"Nómina\" este mes: el estado de resultados y el flujo de caja no ven la nómina."),
    confere: L("O lançado em Custos Fixos (\"Folha de pagamento\") confere com a estimativa do RH (até 5% de diferença).", "What is entered in Fixed Costs (\"Payroll\") matches the HR estimate (within 5%).", "Lo registrado en Costos Fijos (\"Nómina\") coincide con la estimación de RR. HH. (hasta 5%)."),
    lancado_a_menos: L("Custos Fixos (\"Folha de pagamento\") está abaixo da estimativa do RH: pode faltar encargo, provisão ou pessoa.", "Fixed Costs (\"Payroll\") is below the HR estimate: charges, provisions or people may be missing.", "Costos Fijos (\"Nómina\") está por debajo de la estimación de RR. HH.: pueden faltar cargas, provisiones o personas."),
    lancado_a_mais: L("Custos Fixos (\"Folha de pagamento\") está acima da estimativa do RH: pode haver pessoa fora do RH, benefício ou lançamento antigo.", "Fixed Costs (\"Payroll\") is above the HR estimate: there may be people outside HR, benefits or an old entry.", "Costos Fijos (\"Nómina\") está por encima de la estimación de RR. HH.: puede haber personas fuera de RR. HH., beneficios o un registro antiguo."),
  } as Record<string, string>)[s] ?? s;

  return (
    <CanvasBox cor={verde} {...cartao}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-sm font-black flex items-center gap-2" style={{ color: titulo }}><Users size={16} /> {L("Custo de pessoal (RH)", "Personnel cost (HR)", "Costo de personal (RR. HH.)")}
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(128,128,128,0.15)", color: texto2 }}>{L("estimativa mensal", "monthly estimate", "estimación mensual")}</span></p>
        {ondeEsta !== "rh" && <Link href="/rh" className="text-xs font-bold underline" style={{ color: verde }}>{L("Ver no RH ›", "See in HR ›", "Ver en RR. HH. ›")}</Link>}
      </div>
      {d.estado === "carregando" ? <p className="text-sm" style={{ color: texto2 }}>{L("Calculando…", "Calculating…", "Calculando…")}</p>
      : d.estado === "sem_acesso" ? <p className="text-sm" style={{ color: texto2 }}>{L("Só para quem tem a liberação de salário do RH (RH · Estrutura e acessos → Acessos do RH).", "Only for people with HR salary access (HR · Structure and access → HR access).", "Solo para quien tiene habilitación de salario en RR. HH. (RR. HH. · Estructura y accesos → Accesos de RR. HH.).")}</p>
      : d.estado === "erro" || !d.r ? <p className="text-sm" style={{ color: texto2 }}>{L("Não foi possível calcular o custo de pessoal agora (falha de conexão). Recarregue a página.", "Could not calculate the personnel cost now (connection failure). Reload the page.", "No se pudo calcular el costo de personal ahora (falla de conexión). Recargue la página.")}</p>
      : d.r.pessoas_contadas === 0 ? <p className="text-sm" style={{ color: texto2 }}>{L("Nenhum colaborador ativo com salário mensal no RH.", "No active employee with a monthly salary in HR.", "Ningún colaborador activo con salario mensual en RR. HH.")} <Link href="/rh/colaboradores" className="underline font-bold" style={{ color: verde }}>{L("Cadastrar em Colaboradores ›", "Register in Employees ›", "Registrar en Colaboradores ›")}</Link></p>
      : (() => { const r = d.r!; const lista = agrupar === "centro" ? r.por_centro_custo : r.por_departamento; return (<>
        <p className="text-2xl font-black" style={{ color: verde }}>{brl(r.custo_total_mensal)} <span className="text-sm font-semibold" style={{ color: texto2 }}>/{L("mês", "month", "mes")} · {r.pessoas_contadas} {r.pessoas_contadas === 1 ? L("pessoa", "person", "persona") : L("pessoas", "people", "personas")}</span></p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-3 text-xs">
          {[[L("Salários", "Salaries", "Salarios"), r.salarios], [L("FGTS", "FGTS", "FGTS"), r.fgts], [L("Provisões 13º e férias", "13th and vacation provisions", "Provisiones 13º y vacaciones"), r.provisoes_13_ferias], [L("INSS patronal", "Employer INSS", "INSS patronal"), r.inss_patronal]].map(([n, v]) => (
            <div key={String(n)} className="rounded-xl p-2" style={{ background: aninhado, border: `1px solid ${borda}` }}><p style={{ color: texto2 }}>{n}</p><p className="font-bold text-sm" style={{ color: titulo }}>{brl(Number(v))}</p></div>))}
        </div>
        {d.ponte && <div className="rounded-xl p-3 text-sm mb-3" style={{ background: aninhado, border: `1px solid ${corSit[d.ponte.situacao]}` }}>
          <p className="font-semibold" style={{ color: corSit[d.ponte.situacao] }}>{textoSit(d.ponte.situacao)}</p>
          <p className="text-xs mt-1" style={{ color: texto2 }}>{L("Lançado em Custos Fixos", "Entered in Fixed Costs", "Registrado en Costos Fijos")}: <b>{brl(d.ponte.lancado_custos_fixos_folha)}</b> · {L("Estimativa do RH", "HR estimate", "Estimación de RR. HH.")}: <b>{brl(d.ponte.estimativa_rh)}</b>
            {ondeEsta !== "custos-fixos" && <> · <Link href="/custos-fixos" className="underline font-bold" style={{ color: verde }}>{L("Abrir Custos Fixos ›", "Open Fixed Costs ›", "Abrir Costos Fijos ›")}</Link></>}</p>
          <p className="text-xs mt-1" style={{ color: texto2 }}>{L("A DRE e o Fluxo de Caixa usam só o que foi lançado: a estimativa nunca é somada a eles.", "The income statement and cash flow use only what was entered: the estimate is never added to them.", "El estado de resultados y el flujo de caja usan solo lo registrado: la estimación nunca se les suma.")}</p>
        </div>}
        <ul className="space-y-1 text-sm">{lista.map((x) => (
          <li key={x.nome} className="flex justify-between gap-2" style={{ color: titulo }}><span>{x.nome} <span className="text-xs" style={{ color: texto2 }}>({x.pessoas})</span></span><b>{brl(x.custo_mensal)}</b></li>))}</ul>
        <details className="mt-2 text-xs" style={{ color: texto2 }}><summary className="cursor-pointer font-semibold">{L("O que entra nesta conta", "What this estimate includes", "Qué entra en esta cuenta")}</summary>
          <p className="mt-1">{L("Salário mensal + FGTS (8%; aprendiz 2%) + provisões de 13º e férias com 1/3 + INSS patronal pelo regime", "Monthly salary + FGTS (8%; apprentice 2%) + 13th and vacation (+1/3) provisions + employer INSS by tax regime", "Salario mensual + FGTS (8%; aprendiz 2%) + provisiones de 13º y vacaciones con 1/3 + INSS patronal según el régimen")} — {r.base_inss_patronal}.</p>
          {lang === "pt" ? <ul className="list-disc pl-4 mt-1">{r.limitacoes.map((l) => <li key={l}>{l}</li>)}</ul>
            : <p className="mt-1">{L("", "Not included: overtime, allowances, commissions, absences, benefits, RAT×FAP and third-party contributions; contracts paid by hour, day or task and contracts without a salary are left out.", "No incluye: horas extras, adicionales, comisiones, faltas, beneficios, RAT×FAP y terceros; los contratos por hora, día o tarea y sin salario quedan fuera.")}</p>}</details>
      </>); })()}
    </CanvasBox>
  );
}
