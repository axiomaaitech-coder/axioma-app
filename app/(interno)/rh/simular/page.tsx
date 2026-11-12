"use client";
// RH · Simulador "Contratar ou não" (2026-11-09; padrão CFO 2026-11-12, pedido do Elias: "uma simulação séria, com os dados
// que são relevantes"). Entrada completa (cargo, jornada, adicionais, horas extras, comissão, benefícios, RAT/FAP/terceiros,
// custos de entrada, rampa e receita esperada) → custo real, impacto no lucro/faturamento/caixa, retorno (ponto de equilíbrio,
// prazo para se pagar, ROI), Fator R e custo de desligar. Salvar por 30 dias (RH-22) para comparar; PDF e compartilhar.
// Mesma conta da IA (lib/rhSimulacao + lib/rhSimulacaoBase).
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Calculator, AlertTriangle, Save, FileDown, Share2, Trash2, FolderOpen } from "lucide-react";
import { RotinaRh, supabaseRh as supabase, type CtxRotina } from "../../../../components/rh/RotinaRh";
import { CanvasBox } from "../../../../components/CanvasBox";
import { BotaoAcao } from "../../../../components/BotaoAcao";
import { CentroCompartilhamento } from "../../../../components/CentroCompartilhamento";
import { hojeISO } from "../../../../lib/datas";
import { lerValorBR } from "../../../../lib/valorBR";
import { gerarPdfTabela } from "../../../../lib/gerarPdfTabela";
import { mensagemErroRh } from "../../../../lib/rhEstrutura";
import { simularContratacao, somaMes, SALARIO_MINIMO, type ExtrasSimulacao } from "../../../../lib/rhSimulacao";
import { carregarBaseSimulacao } from "../../../../lib/rhSimulacaoBase";

type Res = NonNullable<ReturnType<typeof simularContratacao>>;
type Form = Record<string, string | boolean>;
type Salva = { id: string; nome: string; entrada: Form; resultado: Res; criado_em: string };
const DIAS_GUARDA = 30;
const brl = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const pctTxt = (n: number | null | undefined) => (n == null ? "—" : `${String(n).replace(".", ",")}%`);
const NOME_MES = { pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] };
const FORM0 = (): Form => ({ nome: "", cargo: "", salario: "", quantidade: "1", aprendiz: false, mes: somaMes(hojeISO().slice(0, 7), 1), jornada: "44",
  periculosidade: false, insalubridade: "0", he: "", hePct: "50", noturnas: "", comissao: "",
  vt: "", refeicao: "", saude: "", outros: "", rat: "2", fap: "1", terceiros: "5,8",
  recrutamento: "", exames: "", equipamentos: "", treinamento: "", rampa: "", receita: "", margem: "" });
const num = (v: string | boolean) => (typeof v === "string" && v.trim() ? lerValorBR(v) : 0);

type Cores = CtxRotina["cor"];
// Fora do componente da tela: definidos dentro, eram recriados a cada letra e o campo perdia o cursor.
function Campo({ id, rotulo, ajuda, cor, children }: { id: string; rotulo: string; ajuda?: string; cor: Cores; children: ReactNode }) {
  return <div><label htmlFor={id} className="text-xs font-semibold block mb-1" style={{ color: cor.titulo }}>{rotulo}</label>{children}{ajuda && <p className="text-xs mt-1" style={{ color: cor.texto2 }}>{ajuda}</p>}</div>;
}
function Bloco({ titulo, cor, children }: { titulo: string; cor: Cores; children: ReactNode }) {
  return <div className="rounded-xl p-3 axi-card-faixa" style={{ background: cor.aninhado, border: `1px solid ${cor.borda}` }}><p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: cor.verde }}>{titulo}</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div></div>;
}

function Conteudo({ ctx }: { ctx: CtxRotina }) {
  const { empresaId, pode, lang, L, cor, campo, cartao, avisar } = ctx;
  const [f, setF] = useState<Form>(FORM0);
  const [base, setBase] = useState<Awaited<ReturnType<typeof carregarBaseSimulacao>> | null>(null);
  const [cargos, setCargos] = useState<{ id: string; nome: string }[]>([]);
  const [res, setRes] = useState<Res | null>(null);
  const [salvas, setSalvas] = useState<Salva[] | null>(null);
  const [comparar, setComparar] = useState<Set<string>>(new Set());
  const [share, setShare] = useState(false);
  const set = (k: string) => (e: { target: { value: string; type?: string; checked?: boolean } }) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? !!e.target.checked : e.target.value }));
  const foraDoSimples = base?.regime === "presumido" || base?.regime === "real";

  async function lerSalvas() {
    const { data, error } = await supabase.from("rh_simulacoes").select("id, nome, entrada, resultado, criado_em").eq("empresa_id", empresaId).order("criado_em", { ascending: false }).limit(100);
    if (error) { Sentry.captureException(new Error(`rh/simular salvas: ${error.message}`)); setSalvas(null); return; }
    setSalvas((data ?? []) as Salva[]);
  }
  useEffect(() => {
    void carregarBaseSimulacao(supabase, empresaId, hojeISO(), pode.salario).then(setBase).catch(() => avisar(L("Não foi possível ler a DRE e o caixa agora: o custo sai, o impacto não.", "Could not read the income statement and cash now: the cost works, the impact does not.", "No se pudo leer el estado de resultados y la caja ahora: el costo sale, el impacto no.")));
    void supabase.from("rh_cargos").select("id, nome").eq("empresa_id", empresaId).is("excluido_em", null).order("nome").then(({ data }) => setCargos((data ?? []) as { id: string; nome: string }[]));
    void lerSalvas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // simulou antes da DRE/caixa chegarem: refaz sozinho quando chegam (senão o impacto ficaria vazio calado)
  useEffect(() => { if (base && res) setRes(calcular(f)); }, [base]); // eslint-disable-line react-hooks/exhaustive-deps
  const extras = (x: Form): ExtrasSimulacao => ({
    jornadaSemanal: num(x.jornada) || 44, periculosidade: !!x.periculosidade, insalubridadeGrau: Number(x.insalubridade) as 0 | 10 | 20 | 40,
    horasExtrasMes: num(x.he), adicionalHEPct: num(x.hePct) || 50, horasNoturnasMes: num(x.noturnas), comissaoMedia: num(x.comissao),
    valeTransporteMes: num(x.vt), refeicaoMes: num(x.refeicao), saudeMes: num(x.saude), outrosBeneficiosMes: num(x.outros),
    ratPct: num(x.rat), fap: num(x.fap) || 1, terceirosPct: num(x.terceiros),
    custoEntrada: { recrutamento: num(x.recrutamento), exames: num(x.exames), equipamentos: num(x.equipamentos), treinamento: num(x.treinamento) },
    rampaMeses: num(x.rampa), receitaAdicionalMes: num(x.receita), margemPct: num(x.margem) || undefined,
  });
  function calcular(x: Form): Res | null {
    const b = base ?? { base: { receitaMediaMensal: null, lucroMedioMensal: null, custoPessoalAtual: null, caixa: null }, regime: null };
    return simularContratacao({ salario: num(x.salario), quantidade: Number(x.quantidade) || 1, codCateg: x.aprendiz ? "103" : "101", regime: b.regime, mesInicio: String(x.mes), base: b.base, extras: extras(x) });
  }
  async function simular(): Promise<boolean> {
    if (!(num(f.salario) > 0)) { avisar(L("Informe o salário mensal.", "Enter the monthly salary.", "Informe el salario mensual.")); return false; }
    if (num(f.jornada) > 44) { avisar(L("A jornada semanal vai até 44 horas (CF art. 7º, XIII).", "Weekly hours go up to 44 (Constitution art. 7, XIII).", "La jornada semanal llega a 44 horas (CF art. 7º, XIII).")); return false; }
    const r = calcular(f);
    setRes(r);
    setTimeout(() => document.getElementById("resultado-sim")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    return !!r;
  }
  const nomeSim = () => String(f.nome).trim() || [cargos.find((c) => c.id === f.cargo)?.nome, brl(num(f.salario)), `${f.quantidade}x`].filter(Boolean).join(" · ");
  async function salvar(): Promise<boolean> {
    if (!res) return false;
    const { data, error } = await supabase.from("rh_simulacoes").insert({ empresa_id: empresaId, nome: nomeSim().slice(0, 120), entrada: f, resultado: res }).select("id");
    if (error || !data?.length) { avisar((error?.code === "42P01" || error?.code === "PGRST205") ? L("A tabela de simulações ainda não foi criada no banco.", "The simulations table has not been created yet.", "La tabla de simulaciones aún no fue creada.") : mensagemErroRh(error, lang)); return false; }
    avisar(L(`Simulação salva. Fica guardada por ${DIAS_GUARDA} dias para comparar.`, `Simulation saved. It is kept for ${DIAS_GUARDA} days for comparison.`, `Simulación guardada. Se conserva ${DIAS_GUARDA} días para comparar.`), "ok");
    await lerSalvas(); return true;
  }
  async function apagar(s: Salva): Promise<boolean> {
    const { data, error } = await supabase.from("rh_simulacoes").delete().eq("id", s.id).select("id");
    if (error || !data?.length) { avisar(mensagemErroRh(error, lang)); return false; }
    setComparar((c) => { const n = new Set(c); n.delete(s.id); return n; });
    await lerSalvas(); return true;
  }
  function abrir(s: Salva) {
    const x = { ...FORM0(), ...s.entrada };
    setF(x); setRes(calcular(x));
    setTimeout(() => document.getElementById("resultado-sim")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  const traduzAlerta = (a: string) => (lang === "pt" ? a : ({
    "com essa contratação o lucro médio mensal fica NEGATIVO": L("", "with this hire the average monthly profit becomes NEGATIVE", "con esta contratación la utilidad media mensual queda NEGATIVA"),
    "a contratação consome mais da metade do lucro médio mensal": L("", "the hire takes more than half of the average monthly profit", "la contratación consume más de la mitad de la utilidad media mensual"),
    "o caixa de hoje não cobre os primeiros meses dessa contratação": L("", "today's cash does not cover the first months of this hire", "la caja de hoy no cubre los primeros meses de esta contratación"),
    "novembro e dezembro têm o 13º: o caixa precisa de folga nesses meses": L("", "November and December have the 13th salary: cash needs room in those months", "noviembre y diciembre tienen el 13º: la caja necesita margen en esos meses"),
    "a folha atual não está (toda) lançada em Custos Fixos: o lucro médio da DRE está MAIOR que o real e o impacto desta contratação é pior do que parece": L("", "current payroll is not (fully) entered in Fixed Costs: the average profit in the income statement is HIGHER than the real one and this hire's impact is worse than it looks", "la nómina actual no está (toda) registrada en Costos Fijos: la utilidad media del estado de resultados es MAYOR que la real y el impacto de esta contratación es peor de lo que parece"),
    "o custo de pessoal passa do faturamento médio mensal": L("", "personnel cost exceeds average monthly revenue", "el costo de personal supera la facturación media mensual"),
    "mesmo com a receita esperada a contratação não se paga: a contribuição mensal fica abaixo do custo": L("", "even with the expected revenue the hire does not pay off: the monthly contribution is below the cost", "aun con el ingreso esperado la contratación no se paga: la contribución mensual queda por debajo del costo"),
    "a contratação não se paga em 24 meses com a receita e a rampa informadas": L("", "the hire does not pay off within 24 months with the revenue and ramp-up entered", "la contratación no se paga en 24 meses con el ingreso y la rampa informados"),
    "mais de 2 horas extras por dia útil em média: a CLT limita a 2 horas por dia (art. 59) — risco trabalhista": L("", "more than 2 overtime hours per working day on average: the CLT limits it to 2 hours a day (art. 59) — labor risk", "más de 2 horas extras por día hábil en promedio: la CLT limita a 2 horas por día (art. 59) — riesgo laboral"),
    "a contratação leva o Fator R a 28% ou mais: se a atividade estiver sujeita ao Fator R, o Simples pode passar do Anexo V para o III (imposto menor)": L("", "the hire takes the R factor to 28% or more: if the activity is subject to the R factor, the Simples may move from Annex V to III (lower tax)", "la contratación lleva el factor R a 28% o más: si la actividad está sujeta al factor R, el Simples puede pasar del Anexo V al III (impuesto menor)"),
  } as Record<string, string>)[a] ?? a);
  // linhas do relatório: as mesmas no PDF, no compartilhar e na comparação
  const linhas = (r: Res): [string, string][] => [
    [L("Pessoas", "People", "Personas"), String(r.quantidade)],
    [L("Salário-base", "Base salary", "Salario base"), brl(r.por_pessoa.salario)],
    [L("Adicionais (periculosidade, insalubridade, noturno)", "Premiums (hazard, unhealthy, night)", "Adicionales (peligrosidad, insalubridad, nocturno)"), brl(r.por_pessoa.adicionais)],
    [L("Variáveis (horas extras + descanso, comissão)", "Variable pay (overtime + rest, commission)", "Variables (horas extras + descanso, comisión)"), brl(r.por_pessoa.variaveis)],
    [L("Provisões de 13º e férias", "13th and vacation provisions", "Provisiones de 13º y vacaciones"), brl(r.por_pessoa.provisoes_13_ferias)],
    ["FGTS", brl(r.por_pessoa.fgts)],
    [L("INSS patronal", "Employer INSS", "INSS patronal"), brl(r.por_pessoa.inss_patronal)],
    [L("RAT × FAP", "RAT × FAP", "RAT × FAP"), brl(r.por_pessoa.rat_fap)],
    [L("Terceiros (Sistema S etc.)", "Third parties (S System etc.)", "Terceros (Sistema S etc.)"), brl(r.por_pessoa.terceiros)],
    [L("Benefícios (parte da Empresa)", "Benefits (company share)", "Beneficios (parte de la empresa)"), brl(r.por_pessoa.beneficios)],
    [L("Custo mensal por pessoa", "Monthly cost per person", "Costo mensual por persona"), brl(r.por_pessoa.custo_mensal)],
    [L("Para cada R$ 1 de salário", "For each R$ 1 of salary", "Por cada R$ 1 de salario"), r.por_pessoa.multiplicador == null ? "—" : `R$ ${r.por_pessoa.multiplicador.toFixed(2).replace(".", ",")}`],
    [L("Custo da hora trabalhada", "Cost per hour worked", "Costo de la hora trabajada"), brl(r.por_pessoa.custo_hora_trabalhada)],
    [L("Custo mensal total", "Total monthly cost", "Costo mensual total"), brl(r.custo_mensal_total)],
    [L("Custos de entrada", "Onboarding costs", "Costos de entrada"), brl(r.custo_entrada)],
    [L("Custo em 12 meses (com entrada)", "Cost in 12 months (with onboarding)", "Costo en 12 meses (con entrada)"), brl(r.custo_12_meses)],
    [L("Lucro médio mensal antes → depois", "Average monthly profit before → after", "Utilidad media mensual antes → después"), `${brl(r.impacto.lucro_medio_mensal_antes)} → ${brl(r.impacto.lucro_medio_mensal_depois)}`],
    [L("Pessoal sobre o faturamento", "Personnel over revenue", "Personal sobre la facturación"), `${pctTxt(r.impacto.pessoal_sobre_faturamento_antes_pct)} → ${pctTxt(r.impacto.pessoal_sobre_faturamento_depois_pct)}`],
    [L("Receita mínima para se pagar", "Minimum revenue to pay off", "Ingreso mínimo para pagarse"), r.impacto.receita_minima_para_se_pagar == null ? "—" : `${brl(r.impacto.receita_minima_para_se_pagar)}/${L("mês", "month", "mes")}`],
    [L("Prazo para se pagar", "Payback period", "Plazo para pagarse"), !r.retorno ? "—" : r.retorno.prazo_para_se_pagar_meses == null ? L("mais de 24 meses", "over 24 months", "más de 24 meses") : L(`${r.retorno.prazo_para_se_pagar_meses} mês(es)`, `${r.retorno.prazo_para_se_pagar_meses} month(s)`, `${r.retorno.prazo_para_se_pagar_meses} mes(es)`)],
    [L("Retorno em 12 meses (ROI)", "12-month return (ROI)", "Retorno en 12 meses (ROI)"), r.retorno ? pctTxt(r.retorno.roi_12_meses_pct) : "—"],
    [L("Fator R antes → depois", "R factor before → after", "Factor R antes → después"), r.fator_r ? `${pctTxt(r.fator_r.antes_pct)} → ${pctTxt(r.fator_r.depois_pct)} (${L("Anexo", "Annex", "Anexo")} ${r.fator_r.anexo_depois})` : "—"],
    [L("Desligar após 12 meses (por pessoa)", "Terminate after 12 months (per person)", "Desvincular tras 12 meses (por persona)"), r.desligamento_apos_12_meses ? brl(r.desligamento_apos_12_meses.custo_por_pessoa) : "—"],
    [L("Saída de caixa no 1º ano", "Cash out in the 1st year", "Salida de caja en el 1er año"), brl(r.caixa_primeiro_ano)],
  ];
  const titulo = () => `${L("Simulação de contratação", "Hiring simulation", "Simulación de contratación")} — ${nomeSim()}`;
  function pdf(): boolean {
    if (!res) return false;
    return gerarPdfTabela({ titulo: titulo(), subtitulo: `${L("Gerado em", "Generated on", "Generado el")} ${hojeISO().split("-").reverse().join("/")} · ${L("simulação, não grava nada", "simulation, nothing is saved", "simulación, no se graba nada")}`,
      colunas: [{ header: L("Item", "Item", "Ítem"), key: "i", width: 3 }, { header: L("Valor", "Amount", "Valor"), key: "v", width: 2, align: "right" }],
      linhas: [...linhas(res).map(([i, v]) => ({ i, v })), ...res.alertas.map((a) => ({ i: `⚠ ${traduzAlerta(a)}`, v: "" }))],
      nomeArquivo: `simulacao-contratacao-${hojeISO()}` }, (m) => avisar(m), lang);
  }
  const resumoShare = res ? [titulo(), ...linhas(res).map(([i, v]) => `• ${i}: ${v}`), ...res.alertas.map((a) => `⚠ ${traduzAlerta(a)}`), "— Axioma AI.Tech"].join("\n") : "";

  const nomeMes = (m: string) => `${NOME_MES[lang][Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;
  const maxFluxo = res ? Math.max(1, ...res.fluxo.map((x) => x.valor)) : 1;
  const nested = { background: cor.aninhado, border: `1px solid ${cor.borda}` };

  const inp = (k: string, ph = "", modo: "decimal" | "numeric" = "decimal") => <input id={`sim-${k}`} inputMode={modo} placeholder={ph} value={String(f[k])} onChange={set(k)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} />;
  const marcadas = (salvas ?? []).filter((s) => comparar.has(s.id));

  return (<>
    <p className="text-sm" style={{ color: cor.texto2 }}>{L("Antes de contratar, veja o custo real (salário, adicionais, horas extras, encargos e benefícios), quanto o lucro e o caixa mudam, quanto a vaga precisa trazer de receita para se pagar e quanto custaria desligar depois. Salve as simulações para comparar candidatos e vagas por 30 dias.", "Before hiring, see the real cost (salary, premiums, overtime, charges and benefits), how profit and cash change, how much revenue the role must bring to pay off and what terminating later would cost. Save simulations to compare candidates and roles for 30 days.", "Antes de contratar, vea el costo real (salario, adicionales, horas extras, cargas y beneficios), cómo cambian la utilidad y la caja, cuánto ingreso debe traer el puesto para pagarse y cuánto costaría desvincular después. Guarde las simulaciones para comparar candidatos y puestos durante 30 días.")}</p>
    <CanvasBox cor={cor.verde} {...cartao}>
      <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: cor.titulo }}><Calculator size={16} /> {L("Quem você quer contratar?", "Who do you want to hire?", "¿A quién quiere contratar?")}</p>
      <div className="space-y-3">
        <Bloco cor={cor} titulo={L("1 · Vaga", "1 · Role", "1 · Puesto")}>
          <Campo cor={cor} id="sim-nome" rotulo={L("Nome da simulação", "Simulation name", "Nombre de la simulación")}>{inp("nome", L("ex.: Vendedor externo — candidato A", "e.g. Field sales — candidate A", "ej.: Vendedor externo — candidato A"))}</Campo>
          <Campo cor={cor} id="sim-cargo" rotulo={L("Cargo (da Estrutura)", "Position (from Structure)", "Cargo (de la Estructura)")}><select id="sim-cargo" value={String(f.cargo)} onChange={set("cargo")} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo}><option value="">{L("— opcional —", "— optional —", "— opcional —")}</option>{cargos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></Campo>
          <Campo cor={cor} id="sim-salario" rotulo={L("Salário-base mensal (R$)", "Monthly base salary (R$)", "Salario base mensual (R$)")}>{inp("salario", "2.500,00")}</Campo>
          <Campo cor={cor} id="sim-quantidade" rotulo={L("Quantas pessoas", "How many people", "Cuántas personas")}>{inp("quantidade", "1", "numeric")}</Campo>
          <Campo cor={cor} id="sim-mes" rotulo={L("Começa em", "Starts in", "Empieza en")}><input id="sim-mes" type="month" value={String(f.mes)} onChange={(e) => setF((x) => ({ ...x, mes: e.target.value || x.mes }))} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo} /></Campo>
          <Campo cor={cor} id="sim-jornada" rotulo={L("Jornada semanal (horas)", "Weekly hours", "Jornada semanal (horas)")} ajuda={L("44 h = 220 h no mês para a hora extra", "44 h = 220 h a month for overtime", "44 h = 220 h al mes para la hora extra")}>{inp("jornada", "44", "numeric")}</Campo>
          <label className="flex items-center gap-2 text-sm pt-6" style={{ color: "var(--axi-text-primary)" }}><input type="checkbox" checked={!!f.aprendiz} onChange={set("aprendiz")} /> {L("Jovem aprendiz (FGTS 2%)", "Young apprentice (FGTS 2%)", "Joven aprendiz (FGTS 2%)")}</label>
        </Bloco>
        <Bloco cor={cor} titulo={L("2 · Adicionais e variáveis (média mensal)", "2 · Premiums and variable pay (monthly average)", "2 · Adicionales y variables (promedio mensual)")}>
          <label className="flex items-center gap-2 text-sm pt-6" style={{ color: "var(--axi-text-primary)" }}><input type="checkbox" checked={!!f.periculosidade} onChange={set("periculosidade")} /> {L("Periculosidade (30% do salário)", "Hazard pay (30% of salary)", "Peligrosidad (30% del salario)")}</label>
          <Campo cor={cor} id="sim-insalubridade" rotulo={L("Insalubridade", "Unhealthy conditions", "Insalubridad")} ajuda={L(`sobre o salário mínimo (${brl(SALARIO_MINIMO)})`, `on the minimum wage (${brl(SALARIO_MINIMO)})`, `sobre el salario mínimo (${brl(SALARIO_MINIMO)})`)}><select id="sim-insalubridade" value={String(f.insalubridade)} onChange={set("insalubridade")} className="w-full px-3 py-2.5 rounded-xl text-sm" style={campo}>{[["0", L("Não tem", "None", "No tiene")], ["10", L("Grau mínimo (10%)", "Minimum (10%)", "Grado mínimo (10%)")], ["20", L("Grau médio (20%)", "Medium (20%)", "Grado medio (20%)")], ["40", L("Grau máximo (40%)", "Maximum (40%)", "Grado máximo (40%)")]].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Campo>
          <Campo cor={cor} id="sim-he" rotulo={L("Horas extras por mês", "Overtime hours a month", "Horas extras al mes")}>{inp("he", "0", "numeric")}</Campo>
          <Campo cor={cor} id="sim-hePct" rotulo={L("Adicional da hora extra (%)", "Overtime premium (%)", "Adicional de la hora extra (%)")} ajuda={L("mínimo 50%; veja a convenção", "minimum 50%; check the agreement", "mínimo 50%; vea el convenio")}>{inp("hePct", "50", "numeric")}</Campo>
          <Campo cor={cor} id="sim-noturnas" rotulo={L("Horas noturnas por mês (22h–5h)", "Night hours a month (10pm–5am)", "Horas nocturnas al mes (22h–5h)")}>{inp("noturnas", "0", "numeric")}</Campo>
          <Campo cor={cor} id="sim-comissao" rotulo={L("Comissão média mensal (R$)", "Average monthly commission (R$)", "Comisión media mensual (R$)")}>{inp("comissao", "0,00")}</Campo>
        </Bloco>
        <Bloco cor={cor} titulo={L("3 · Benefícios (por pessoa, por mês)", "3 · Benefits (per person, per month)", "3 · Beneficios (por persona, por mes)")}>
          <Campo cor={cor} id="sim-vt" rotulo={L("Vale-transporte (R$)", "Transit pass (R$)", "Vale de transporte (R$)")} ajuda={L("a Empresa paga só o que passar de 6% do salário", "the company pays only what exceeds 6% of salary", "la empresa paga solo lo que supere el 6% del salario")}>{inp("vt", "0,00")}</Campo>
          <Campo cor={cor} id="sim-refeicao" rotulo={L("Vale-refeição/alimentação (R$)", "Meal/food voucher (R$)", "Vale de comida (R$)")}>{inp("refeicao", "0,00")}</Campo>
          <Campo cor={cor} id="sim-saude" rotulo={L("Plano de saúde/odonto (R$)", "Health/dental plan (R$)", "Plan de salud/odonto (R$)")}>{inp("saude", "0,00")}</Campo>
          <Campo cor={cor} id="sim-outros" rotulo={L("Outros benefícios (R$)", "Other benefits (R$)", "Otros beneficios (R$)")}>{inp("outros", "0,00")}</Campo>
        </Bloco>
        {foraDoSimples && <Bloco cor={cor} titulo={L("4 · Encargos do Lucro Presumido/Real", "4 · Presumed/Actual Profit charges", "4 · Cargas del Lucro Presumido/Real")}>
          <Campo cor={cor} id="sim-rat" rotulo={L("RAT (%)", "RAT (%)", "RAT (%)")} ajuda={L("1%, 2% ou 3% pelo CNAE", "1%, 2% or 3% by CNAE", "1%, 2% o 3% por el CNAE")}>{inp("rat", "2")}</Campo>
          <Campo cor={cor} id="sim-fap" rotulo="FAP" ajuda={L("de 0,5 a 2,0 (DCTFWeb)", "from 0.5 to 2.0 (DCTFWeb)", "de 0,5 a 2,0 (DCTFWeb)")}>{inp("fap", "1")}</Campo>
          <Campo cor={cor} id="sim-terceiros" rotulo={L("Terceiros (%)", "Third parties (%)", "Terceros (%)")} ajuda={L("Sistema S, salário-educação, Incra — pelo FPAS", "S System, education salary, Incra — by FPAS", "Sistema S, salario-educación, Incra — por el FPAS")}>{inp("terceiros", "5,8")}</Campo>
        </Bloco>}
        <Bloco cor={cor} titulo={L(`${foraDoSimples ? 5 : 4} · Custos para trazer a pessoa (uma vez)`, `${foraDoSimples ? 5 : 4} · Costs to bring the person in (one-time)`, `${foraDoSimples ? 5 : 4} · Costos para traer a la persona (una vez)`)}>
          <Campo cor={cor} id="sim-recrutamento" rotulo={L("Recrutamento (R$)", "Recruiting (R$)", "Reclutamiento (R$)")}>{inp("recrutamento", "0,00")}</Campo>
          <Campo cor={cor} id="sim-exames" rotulo={L("Exame admissional (R$)", "Pre-employment exam (R$)", "Examen de ingreso (R$)")}>{inp("exames", "0,00")}</Campo>
          <Campo cor={cor} id="sim-equipamentos" rotulo={L("Equipamentos e uniforme (R$)", "Equipment and uniform (R$)", "Equipos y uniforme (R$)")}>{inp("equipamentos", "0,00")}</Campo>
          <Campo cor={cor} id="sim-treinamento" rotulo={L("Treinamento (R$)", "Training (R$)", "Capacitación (R$)")}>{inp("treinamento", "0,00")}</Campo>
        </Bloco>
        <Bloco cor={cor} titulo={L(`${foraDoSimples ? 6 : 5} · Retorno esperado da vaga`, `${foraDoSimples ? 6 : 5} · Expected return of the role`, `${foraDoSimples ? 6 : 5} · Retorno esperado del puesto`)}>
          <Campo cor={cor} id="sim-receita" rotulo={L("Receita nova por pessoa/mês (R$)", "New revenue per person/month (R$)", "Ingreso nuevo por persona/mes (R$)")} ajuda={L("vendas que ela deve trazer (ou economia que gera)", "sales they should bring (or savings)", "ventas que debe traer (o ahorro)")}>{inp("receita", "0,00")}</Campo>
          <Campo cor={cor} id="sim-margem" rotulo={L("Margem de contribuição (%)", "Contribution margin (%)", "Margen de contribución (%)")} ajuda={base?.base.margemContribuicaoPct != null ? L(`vazio = a da sua DRE (${pctTxt(base.base.margemContribuicaoPct)})`, `empty = your income statement's (${pctTxt(base.base.margemContribuicaoPct)})`, `vacío = la de su estado de resultados (${pctTxt(base.base.margemContribuicaoPct)})`) : undefined}>{inp("margem", "")}</Campo>
          <Campo cor={cor} id="sim-rampa" rotulo={L("Meses até produzir 100%", "Months to full productivity", "Meses hasta producir 100%")} ajuda={L("a receita cresce até lá", "revenue ramps up until then", "el ingreso crece hasta entonces")}>{inp("rampa", "0", "numeric")}</Campo>
        </Bloco>
      </div>
      <BotaoAcao executar={simular} texto={L("Simular", "Simulate", "Simular")} textoTrabalhando="…" className="mt-3 px-6 py-2.5 rounded-xl text-sm" estilo={{ background: cor.btnMenta, color: "#fff" }} />
      {base && <p className="text-xs mt-2" style={{ color: cor.texto2 }}>{L("Regime usado", "Tax regime used", "Régimen usado")}: <b>{base.regime ?? L("não informado (Config → Empresa)", "not set (Settings → Company)", "no informado (Config → Empresa)")}</b>{base.base.lucroMedioMensal != null && <> · {L("lucro médio mensal (12 meses)", "average monthly profit (12 months)", "utilidad media mensual (12 meses)")}: <b>{brl(base.base.lucroMedioMensal)}</b></>}</p>}
    </CanvasBox>

    {res && <div id="resultado-sim" className="space-y-4" style={{ scrollMarginTop: 80 }}>
      <div className="flex flex-wrap gap-2">
        <BotaoAcao executar={salvar} texto={<><Save size={14} className="inline mr-1" />{L(`Salvar (${DIAS_GUARDA} dias)`, `Save (${DIAS_GUARDA} days)`, `Guardar (${DIAS_GUARDA} días)`)}</>} textoTrabalhando="…" className="px-4 py-2 rounded-xl text-sm" estilo={{ background: cor.btnMenta, color: "#fff" }} />
        <button type="button" onClick={pdf} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: cor.btnMenta, color: "#fff" }}><FileDown size={14} className="inline mr-1" />{L("Baixar PDF", "Download PDF", "Descargar PDF")}</button>
        <button type="button" onClick={() => setShare(true)} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: cor.btnAzul, color: "#fff" }}><Share2 size={14} className="inline mr-1" />{L("Compartilhar", "Share", "Compartir")}</button>
      </div>
      {res.alertas.length > 0 && <CanvasBox cor={cor.laranja} {...cartao}>
        <ul className="space-y-1 text-sm">{res.alertas.map((a) => <li key={a} className="flex gap-2 font-semibold" style={{ color: cor.laranja }}><AlertTriangle size={16} className="shrink-0" /> {traduzAlerta(a)}</li>)}</ul>
      </CanvasBox>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CanvasBox cor={cor.verde} {...cartao}>
          <p className="text-sm font-black mb-2" style={{ color: cor.titulo }}>{L("Custo real por pessoa", "Real cost per person", "Costo real por persona")}</p>
          <p className="text-2xl font-black" style={{ color: cor.verde }}>{brl(res.por_pessoa.custo_mensal)} <span className="text-sm font-semibold" style={{ color: cor.texto2 }}>/{L("mês", "month", "mes")}</span></p>
          <p className="text-xs mb-3" style={{ color: cor.texto2 }}>{L(`Para cada R$ 1,00 de salário, a Empresa gasta R$ ${(res.por_pessoa.multiplicador == null ? "—" : res.por_pessoa.multiplicador.toFixed(2).replace(".", ","))}. Hora trabalhada: ${brl(res.por_pessoa.custo_hora_trabalhada)}.`, `For each R$ 1.00 of salary, the company spends R$ ${res.por_pessoa.multiplicador == null ? "—" : res.por_pessoa.multiplicador.toFixed(2)}. Hour worked: ${brl(res.por_pessoa.custo_hora_trabalhada)}.`, `Por cada R$ 1,00 de salario, la empresa gasta R$ ${(res.por_pessoa.multiplicador == null ? "—" : res.por_pessoa.multiplicador.toFixed(2).replace(".", ","))}. Hora trabajada: ${brl(res.por_pessoa.custo_hora_trabalhada)}.`)}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">{linhas(res).slice(1, 10).map(([n, v]) => (
            <div key={n} className="rounded-xl p-2" style={nested}><p style={{ color: cor.texto2 }}>{n}</p><p className="font-bold text-sm" style={{ color: cor.titulo }}>{v}</p></div>))}</div>
          <p className="text-sm mt-3" style={{ color: cor.titulo }}>{L(`${res.quantidade} pessoa(s)`, `${res.quantidade} person(s)`, `${res.quantidade} persona(s)`)}: <b>{brl(res.custo_mensal_total)}</b>/{L("mês", "month", "mes")} · {L("12 meses com entrada", "12 months with onboarding", "12 meses con entrada")}: <b>{brl(res.custo_12_meses)}</b></p>
          <p className="text-xs mt-2" style={{ color: cor.texto2 }}>{res.base_inss_patronal}</p>
        </CanvasBox>
        <CanvasBox cor={cor.verde} {...cartao}>
          <p className="text-sm font-black mb-2" style={{ color: cor.titulo }}>{L("Impacto e retorno", "Impact and return", "Impacto y retorno")}</p>
          <div className="space-y-2 text-sm">{linhas(res).slice(16, 23).map(([n, v]) => (
            <div key={n} className="rounded-xl p-2 flex flex-wrap justify-between gap-2" style={nested}><span style={{ color: cor.texto2 }}>{n}</span><b style={{ color: cor.titulo }}>{v}</b></div>))}
            <div className="rounded-xl p-2 flex flex-wrap justify-between gap-2" style={nested}><span style={{ color: cor.texto2 }}>{L("Caixa de hoje cobre", "Today's cash covers", "La caja de hoy cubre")}</span><b style={{ color: cor.titulo }}>{res.impacto.meses_de_folego_no_caixa == null ? "—" : L(`${res.impacto.meses_de_folego_no_caixa} mês(es) desse custo`, `${res.impacto.meses_de_folego_no_caixa} month(s) of this cost`, `${res.impacto.meses_de_folego_no_caixa} mes(es) de este costo`)}</b></div>
          </div>
          {res.desligamento_apos_12_meses && <p className="text-xs mt-2" style={{ color: cor.texto2 }}>{L(`Se não der certo: desligar sem justa causa depois de 12 meses custa ${brl(res.desligamento_apos_12_meses.verbas)} de verbas (aviso de ${res.desligamento_apos_12_meses.aviso_dias} dias, 13º, férias + 1/3) + ${brl(res.desligamento_apos_12_meses.multa_fgts)} de multa do FGTS, por pessoa.`, `If it does not work out: terminating without cause after 12 months costs ${brl(res.desligamento_apos_12_meses.verbas)} in severance (${res.desligamento_apos_12_meses.aviso_dias}-day notice, 13th, vacation + 1/3) + ${brl(res.desligamento_apos_12_meses.multa_fgts)} FGTS fine, per person.`, `Si no funciona: desvincular sin justa causa tras 12 meses cuesta ${brl(res.desligamento_apos_12_meses.verbas)} en rubros (aviso de ${res.desligamento_apos_12_meses.aviso_dias} días, 13º, vacaciones + 1/3) + ${brl(res.desligamento_apos_12_meses.multa_fgts)} de multa del FGTS, por persona.`)}</p>}
          <div className="flex flex-wrap gap-3 mt-3 text-xs font-bold">
            <Link href="/dre" className="underline" style={{ color: cor.verde }}>{L("Abrir DRE ›", "Open income statement ›", "Abrir estado de resultados ›")}</Link>
            <Link href="/fluxo-caixa" className="underline" style={{ color: cor.verde }}>{L("Abrir Fluxo de Caixa ›", "Open cash flow ›", "Abrir flujo de caja ›")}</Link>
            <Link href="/rh" className="underline" style={{ color: cor.verde }}>{L("Custo de pessoal atual ›", "Current personnel cost ›", "Costo de personal actual ›")}</Link>
            {res.fator_r && <Link href="/ia-tributaria" className="underline" style={{ color: cor.verde }}>{L("Fator R na IA Tributária ›", "R factor in Tax AI ›", "Factor R en la IA Tributaria ›")}</Link>}
            {base?.base.folhaForaDaDre && <Link href="/custos-fixos" className="underline" style={{ color: cor.laranja }}>{L("Lançar a folha em Custos Fixos ›", "Enter payroll in Fixed Costs ›", "Registrar la nómina en Costos Fijos ›")}</Link>}
          </div>
        </CanvasBox>
      </div>
      <CanvasBox cor={cor.verde} {...cartao}>
        <p className="text-sm font-black mb-1" style={{ color: cor.titulo }}>{L("Saída de caixa mês a mês (1º ano)", "Cash out month by month (1st year)", "Salida de caja mes a mes (1er año)")}: {brl(res.caixa_primeiro_ano)}</p>
        <p className="text-xs mb-3" style={{ color: cor.texto2 }}>{L("Remuneração no 5º dia útil e encargos no dia 20 do mês seguinte; benefícios no próprio mês; 13º em 30/11 e 20/12; custos de entrada no 1º mês. Toque num mês para ver o que sai.", "Pay on the 5th business day and charges on the 20th of the following month; benefits in the month itself; 13th salary on Nov 30 and Dec 20; onboarding costs in the 1st month. Tap a month to see what goes out.", "Remuneración el 5º día hábil y cargas el día 20 del mes siguiente; beneficios en el mismo mes; 13º el 30/11 y 20/12; costos de entrada en el 1er mes. Toque un mes para ver qué sale.")}</p>
        <div className="space-y-1">{res.fluxo.map((x) => (
          <details key={x.mes} className="rounded-lg px-2 py-1" style={nested}>
            <summary className="cursor-pointer flex items-center gap-2 text-sm" style={{ color: cor.titulo }}>
              <span className="w-14 shrink-0 font-semibold">{nomeMes(x.mes)}</span>
              <span className="flex-1 h-2 rounded-full" style={{ background: "rgba(128,128,128,0.15)" }}><span className="block h-2 rounded-full" style={{ width: `${(x.valor / maxFluxo) * 100}%`, background: x.itens.some((i) => i.rotulo.startsWith("13º")) ? cor.laranja : cor.verde }} /></span>
              <b className="w-28 text-right shrink-0">{brl(x.valor)}</b>
            </summary>
            {x.itens.length ? <ul className="text-xs mt-1 mb-1 pl-16 space-y-0.5" style={{ color: cor.texto2 }}>{x.itens.map((i) => <li key={i.rotulo} className="flex justify-between gap-2"><span>{i.rotulo}</span><span>{brl(i.valor)}</span></li>)}</ul>
              : <p className="text-xs pl-16 mb-1" style={{ color: cor.texto2 }}>{L("Nada sai neste mês.", "Nothing goes out this month.", "No sale nada este mes.")}</p>}
          </details>))}</div>
      </CanvasBox>
      <details className="text-xs" style={{ color: cor.texto2 }}><summary className="cursor-pointer font-semibold">{L("Premissas desta simulação", "Assumptions of this simulation", "Premisas de esta simulación")}</summary>
        {lang === "pt" ? <ul className="list-disc pl-4 mt-1">{[...res.premissas, ...(base?.limitacoes ?? [])].map((p) => <li key={p}>{p}</li>)}</ul>
          : <p className="mt-1">{L("", "Pay = salary + premiums (hazard, unhealthy, night) + overtime with weekly-rest reflection (≈ 1/6) + average commission, with 13th and vacation + 1/3 provisions. Presumed/Actual Profit: INSS 20% + RAT × FAP + third parties (check them in your DCTFWeb); Simples: already in the DAS (Annex IV pays separately). Transit pass: the company pays only above 6% of salary; benefits are not part of the charges base. Profit, revenue and contribution margin are averages of the last 12 complete months of the income statement. Termination: without cause after 12 months, notice paid, 40% FGTS fine.", "Remuneración = salario + adicionales (peligrosidad, insalubridad, nocturno) + horas extras con reflejo en el descanso (≈ 1/6) + comisión media, con provisiones de 13º y vacaciones + 1/3. Lucro Presumido/Real: INSS 20% + RAT × FAP + terceros (confírmelos en su DCTFWeb); Simples: ya en el DAS (Anexo IV paga aparte). Vale de transporte: la empresa paga solo lo que supere el 6% del salario; los beneficios no entran en la base de cargas. Utilidad, facturación y margen de contribución: promedios de los últimos 12 meses completos. Desvinculación: sin justa causa tras 12 meses, aviso indemnizado, multa del 40% del FGTS.")}</p>}
      </details>
    </div>}

    <CanvasBox cor={cor.verde} {...cartao}>
      <p className="text-sm font-black mb-1 flex items-center gap-2" style={{ color: cor.titulo }}><FolderOpen size={16} /> {L("Simulações salvas", "Saved simulations", "Simulaciones guardadas")}</p>
      <p className="text-xs mb-3" style={{ color: cor.texto2 }}>{L(`Ficam ${DIAS_GUARDA} dias e depois são apagadas sozinhas. Marque até 4 para comparar lado a lado.`, `Kept for ${DIAS_GUARDA} days, then deleted automatically. Tick up to 4 to compare side by side.`, `Se guardan ${DIAS_GUARDA} días y luego se borran solas. Marque hasta 4 para comparar lado a lado.`)}</p>
      {salvas == null ? <p className="text-sm" style={{ color: cor.laranja }}>{L("Não foi possível ler as simulações salvas agora.", "Could not read the saved simulations now.", "No se pudieron leer las simulaciones guardadas ahora.")}</p>
        : salvas.length === 0 ? <p className="text-sm" style={{ color: cor.texto2 }}>{L("Nenhuma simulação salva. Simule e toque em Salvar.", "No saved simulations. Simulate and tap Save.", "Ninguna simulación guardada. Simule y toque Guardar.")}</p>
        : <ul className="space-y-2">{salvas.map((s) => {
          const resta = Math.max(0, DIAS_GUARDA - Math.floor((Date.now() - Date.parse(s.criado_em)) / 86400000));
          return (<li key={s.id} className="rounded-xl p-3 flex flex-wrap items-center gap-2 axi-card-faixa" style={nested}>
            <input type="checkbox" aria-label={L("Comparar", "Compare", "Comparar")} checked={comparar.has(s.id)} disabled={!comparar.has(s.id) && comparar.size >= 4}
              onChange={() => setComparar((c) => { const n = new Set(c); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; })} />
            <span className="flex-1 min-w-[12rem] text-sm" style={{ color: "var(--axi-text-primary)" }}><b>{s.nome}</b><span style={{ color: cor.texto2 }}> · {brl(s.resultado.custo_mensal_total)}/{L("mês", "month", "mes")} · {L(`apaga em ${resta} dia(s)`, `deleted in ${resta} day(s)`, `se borra en ${resta} día(s)`)}</span></span>
            <button type="button" onClick={() => abrir(s)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnAzul, color: "#fff" }}>{L("Abrir", "Open", "Abrir")}</button>
            <BotaoAcao executar={() => apagar(s)} texto={<><Trash2 size={13} className="inline" /> {L("Apagar", "Delete", "Borrar")}</>} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={{ background: "#7f1d1d", color: "#fff" }} />
          </li>);
        })}</ul>}
      {marcadas.length >= 2 && <div className="mt-4 overflow-x-auto">
        <p className="text-sm font-black mb-2" style={{ color: cor.titulo }}>{L("Comparação", "Comparison", "Comparación")}</p>
        <table className="w-full text-xs" style={{ color: "var(--axi-text-primary)" }}>
          <thead><tr><th className="text-left p-1.5" style={{ color: cor.texto2 }}>{L("Item", "Item", "Ítem")}</th>{marcadas.map((s) => <th key={s.id} className="text-right p-1.5" style={{ color: cor.titulo }}>{s.nome}</th>)}</tr></thead>
          <tbody>{linhas(marcadas[0].resultado).map(([rot], i) => (
            <tr key={rot} style={{ borderTop: `1px solid ${cor.borda}` }}><td className="p-1.5" style={{ color: cor.texto2 }}>{rot}</td>{marcadas.map((s) => <td key={s.id} className="p-1.5 text-right font-semibold whitespace-nowrap">{linhas(s.resultado)[i][1]}</td>)}</tr>))}</tbody>
        </table>
      </div>}
    </CanvasBox>
    <CentroCompartilhamento aberto={share} onFechar={() => setShare(false)} lang={lang} textoResumo={resumoShare} textoDetalhado={resumoShare} assunto={`${titulo()} — Axioma`} onExportarPDF={pdf} cor="#0f7a5a" />
  </>);
}

export default function RhSimularPage() {
  return (
    <RotinaRh titulo={{ pt: "Simular contratação", en: "Hiring simulator", es: "Simular contratación" }}
      subtitulo={{ pt: "Contratar ou não: custo real, impacto, retorno e caixa mês a mês", en: "Hire or not: real cost, impact, return and month-by-month cash", es: "Contratar o no: costo real, impacto, retorno y caja mes a mes" }}
      letreiro={(c) => [c.L("Custo real além do salário", "Real cost beyond salary", "Costo real además del salario"), c.L("Prazo para a vaga se pagar", "Payback of the role", "Plazo para que el puesto se pague"), c.L("Simulações salvas por 30 dias", "Simulations kept for 30 days", "Simulaciones guardadas 30 días"), c.L("13º no caixa de nov/dez", "13th salary in Nov/Dec cash", "13º en la caja de nov/dic")]}>
      {(ctx) => <Conteudo ctx={ctx} />}
    </RotinaRh>
  );
}
