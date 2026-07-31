// AXIOMA AI.TECH — Núcleo MEI (fonte única de cálculo)
// Substitui os hardcodes de teto/DAS espalhados nas 7 telas do módulo MEI.
// Maioria são funções puras (recebem dado já carregado pela tela); a Central
// de Obrigações (seção final) tem I/O direto, mesmo padrão misto de
// lib/relatoriosHelpers.ts (funções async de carga + funções puras de cálculo
// no mesmo arquivo).

import { createBrowserClient } from "@supabase/ssr";
import { nomeMesPt } from "./relatoriosHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const LIMITE_ANUAL_MEI = 81000;

// DAS 2026: INSS 5% do salário mínimo oficial 2026 (R$1.621, Decreto
// 12.797/2025) = R$81,05 + parcela fixa por categoria (ICMS R$1 / ISS R$5,
// estáveis desde 2006). Valores conferidos: Comércio/Indústria R$82,05,
// Serviços R$86,05, Comércio+Serviços R$87,05.
export const INSS_MEI_2026 = 81.05;
export const DAS_MEI_2026 = {
  "Comércio": INSS_MEI_2026 + 1, // ICMS
  "Indústria": INSS_MEI_2026 + 1, // ICMS
  "Transporte": INSS_MEI_2026 + 1, // ICMS (transporte de cargas)
  "Serviços": INSS_MEI_2026 + 5, // ISS
  "Comércio e Serviços": INSS_MEI_2026 + 6, // ICMS + ISS
} as const;

export type CategoriaMEI = keyof typeof DAS_MEI_2026;

export function dasMensalPorCategoria(categoria: string | null | undefined): number {
  const cat = (categoria || "Serviços") as CategoriaMEI;
  return DAS_MEI_2026[cat] ?? DAS_MEI_2026["Serviços"];
}

// ============================================================================
// IRPF MEI — movido de app/(interno)/mei/imposto-renda/page.tsx (Fase 2) pra
// virar fonte única, reaproveitado pelo Cofre também.
// ============================================================================

export function percentualIsentoPorCategoria(categoria: string | null | undefined): number {
  if (categoria === "Comércio" || categoria === "Indústria") return 0.08;
  if (categoria === "Transporte") return 0.16;
  return 0.32; // Serviços / Comércio e Serviços
}

export const FAIXAS_IRPF = [
  { limite: 2259.2, aliquota: 0, deducao: 0 },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite: Infinity, aliquota: 0.275, deducao: 896.0 },
];

export function calcularIRPF(rendaMensal: number): { imposto: number; aliquota: number; aliquotaEfetiva: number } {
  const faixa = FAIXAS_IRPF.find((f) => rendaMensal <= f.limite)!;
  const imposto = Math.max(0, rendaMensal * faixa.aliquota - faixa.deducao);
  const aliquotaEfetiva = rendaMensal > 0 ? (imposto / rendaMensal) * 100 : 0;
  return { imposto, aliquota: faixa.aliquota * 100, aliquotaEfetiva };
}

// ============================================================================
// TETO ANUAL
// ============================================================================

export type ReceitaMEI = { valor: number; data: string; considera_teto_mei?: boolean | null };

// considera_teto_mei nulo/ausente conta como true (linhas antigas, sem a coluna
// marcada, continuam contando — ver MEI-TETO-FLAG-SQL.sql).
export function faturamentoAnoMEI(receitas: ReceitaMEI[], ano: number): number {
  return receitas
    .filter((r) => new Date(r.data).getFullYear() === ano && r.considera_teto_mei !== false)
    .reduce((acc, r) => acc + (r.valor || 0), 0);
}

export function limiteRestante(faturamentoAno: number): number {
  return Math.max(0, LIMITE_ANUAL_MEI - faturamentoAno);
}

export function percentualLimite(faturamentoAno: number): number {
  return Math.min(100, (faturamentoAno / LIMITE_ANUAL_MEI) * 100);
}

export function semaforoTeto(percentual: number): "verde" | "amarelo" | "vermelho" {
  if (percentual >= 90) return "vermelho";
  if (percentual >= 70) return "amarelo";
  return "verde";
}

// Projeção por média móvel (janela de até 6 meses, usa o que houver disponível
// no ano corrente) — substitui a projeção linear ingênua (média de 3 meses
// fixos) que existia antes.
export function projecaoTeto(
  receitas: ReceitaMEI[],
  ano: number,
  mesReferencia: number, // 0-11 (Date.getMonth())
  janelaMeses = 6
): { mediaMensal: number; mesesParaEstourar: number | null; projecaoAnual: number } {
  const totaisPorMes: number[] = [];
  for (let m = Math.max(0, mesReferencia - janelaMeses + 1); m <= mesReferencia; m++) {
    const total = receitas
      .filter((r) => {
        const d = new Date(r.data);
        return d.getFullYear() === ano && d.getMonth() === m && r.considera_teto_mei !== false;
      })
      .reduce((acc, r) => acc + (r.valor || 0), 0);
    totaisPorMes.push(total);
  }
  const mediaMensal = totaisPorMes.length > 0 ? totaisPorMes.reduce((a, b) => a + b, 0) / totaisPorMes.length : 0;
  const faturamentoAno = faturamentoAnoMEI(receitas, ano);
  const restante = limiteRestante(faturamentoAno);
  const mesesParaEstourar = mediaMensal > 0 ? Math.ceil(restante / mediaMensal) : null;
  const projecaoAnual = mediaMensal * 12;
  return { mediaMensal, mesesParaEstourar, projecaoAnual };
}

// ============================================================================
// CALENDÁRIO DAS
// ============================================================================

// Dias até o próximo dia 20 (vencimento mensal do DAS).
export function diasParaDAS(hoje: Date = new Date()): number {
  const dia20DesteMes = new Date(hoje.getFullYear(), hoje.getMonth(), 20);
  if (hoje.getDate() <= 20) {
    return Math.ceil((dia20DesteMes.getTime() - hoje.getTime()) / 86400000);
  }
  const dia20ProxMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 20);
  return Math.ceil((dia20ProxMes.getTime() - hoje.getTime()) / 86400000);
}

// ============================================================================
// DETECTOR PESSOAL × EMPRESA (regra/palavra-chave — gancho de IA no lugar
// desta lista fixa quando a Claude API for ativada, ver app/api/ia-chat)
// ============================================================================

export const PALAVRAS_GASTO_PESSOAL = [
  "farmacia", "farmácia", "supermercado", "ifood", "uber eats", "netflix",
  "spotify", "academia", "salao", "salão", "cinema", "shopping", "roupa",
  "roupas", "viagem", "escola", "faculdade", "condominio", "condomínio",
  "combustivel pessoal", "combustível pessoal",
];

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase();
}

export function pareceGastoPessoal(descricao: string): boolean {
  const norm = normalizar(descricao || "");
  return PALAVRAS_GASTO_PESSOAL.some((p) => norm.includes(normalizar(p)));
}

// ============================================================================
// SCORE DE SAÚDE MEI (0-1000), 4 sub-scores 0-100 cada, por regra.
// ============================================================================

export type StatusObrigacao = "Não obrigatório" | "Pendente" | "Entregue" | "Atrasado";

export type ScoreMEIInput = {
  percentualTeto: number; // 0-100+
  statusDasn: StatusObrigacao;
  statusIrpf: StatusObrigacao;
  fluxoMensal: number; // entrou - saiu no mês
  receitaMensal: number;
  crescimentoMoM: number; // % vs mês anterior
};

export type ScoreMEIResultado = {
  score: number; // 0-1000
  nivel: string;
  cor: string;
  subScores: { financeiro: number; fiscal: number; teto: number; fluxo: number };
};

function pontosStatus(status: StatusObrigacao): number {
  if (status === "Entregue" || status === "Não obrigatório") return 100;
  if (status === "Pendente") return 60;
  return 0; // Atrasado
}

export function scoreMEI(input: ScoreMEIInput): ScoreMEIResultado {
  const teto = input.percentualTeto <= 50 ? 100 : Math.max(0, Math.round(100 - (input.percentualTeto - 50) * 2));
  const fiscal = Math.round((pontosStatus(input.statusDasn) + pontosStatus(input.statusIrpf)) / 2);
  const fluxoPct = input.receitaMensal > 0 ? (input.fluxoMensal / input.receitaMensal) * 100 : 0;
  const fluxo = input.fluxoMensal < 0 ? Math.max(0, 40 + fluxoPct) : input.fluxoMensal === 0 ? 50 : Math.min(100, 70 + fluxoPct);
  const financeiro = input.crescimentoMoM >= 5 ? 100 : input.crescimentoMoM >= 0 ? 70 : Math.max(0, 30 + input.crescimentoMoM);

  const pesos = { financeiro: 0.3, fiscal: 0.25, teto: 0.25, fluxo: 0.2 };
  const media = financeiro * pesos.financeiro + fiscal * pesos.fiscal + teto * pesos.teto + fluxo * pesos.fluxo;
  const score = Math.round(media * 10);

  let nivel = "Crítico";
  let cor = "#f87171";
  if (score >= 800) { nivel = "Excelente"; cor = "#34d399"; }
  else if (score >= 600) { nivel = "Bom"; cor = "#6ab0ff"; }
  else if (score >= 400) { nivel = "Regular"; cor = "#f59e0b"; }
  else if (score >= 200) { nivel = "Atenção"; cor = "#fb923c"; }

  return {
    score,
    nivel,
    cor,
    subScores: {
      financeiro: Math.round(financeiro),
      fiscal: Math.round(fiscal),
      teto: Math.round(teto),
      fluxo: Math.round(fluxo),
    },
  };
}

// ============================================================================
// FLUXO TRADUZIDO — primeira vez que o MEI cruza receita com custo real.
// ============================================================================

export type CustoMEI = { valor: number; data?: string | null; descricao?: string };
export type CustoFixoMEI = { valor_mensal: number; descricao?: string };

// ============================================================================
// CENTRAL DE OBRIGAÇÕES — reaproveita mei_obrigacoes/mei_declaracoes (órfãs
// até esta fase). Ver MEI-OBRIGACOES-SQL.sql pro schema/índice único
// (empresa_id, tipo, competencia) que o upsert abaixo depende.
// ============================================================================

export type TipoObrigacao = "DAS" | "DASN" | "IRPF";

export type ObrigacaoMEI = {
  id?: string;
  tipo: TipoObrigacao;
  competencia: string; // "2026-07" (DAS mensal) ou "2026" (DASN/IRPF anual)
  data_vencimento: string | null;
  status: StatusObrigacao;
  data_entrega: string | null;
};

export async function carregarObrigacoesAno(ano: number): Promise<ObrigacaoMEI[]> {
  const { data } = await supabase.from("mei_obrigacoes").select("*").like("competencia", `${ano}%`);
  return (data || []) as ObrigacaoMEI[];
}

export async function salvarObrigacao(params: {
  userId: string;
  empresaId: string | null;
  tipo: TipoObrigacao;
  competencia: string;
  status: StatusObrigacao;
  dataVencimento?: string | null;
  dataEntrega?: string | null;
}): Promise<void> {
  await supabase.from("mei_obrigacoes").upsert(
    {
      user_id: params.userId,
      empresa_id: params.empresaId,
      tipo: params.tipo,
      competencia: params.competencia,
      status: params.status,
      data_vencimento: params.dataVencimento ?? null,
      data_entrega: params.dataEntrega ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id,tipo,competencia" }
  );

  // DASN entregue vira histórico permanente em mei_declaracoes (nunca some,
  // mesmo se o status em mei_obrigacoes for corrigido depois).
  if (params.status === "Entregue" && params.tipo === "DASN") {
    await supabase.from("mei_declaracoes").insert({
      user_id: params.userId,
      empresa_id: params.empresaId,
      competencia: params.competencia,
      data_entrega: params.dataEntrega || new Date().toISOString().slice(0, 10),
    });
  }
}

export function fluxoMesMEI(
  receitasMes: ReceitaMEI[],
  custosVariaveisMes: CustoMEI[],
  custosFixos: CustoFixoMEI[]
): { entrou: number; saiu: number; sobra: number } {
  const entrou = receitasMes.reduce((s, r) => s + (r.valor || 0), 0);
  const saiuVar = custosVariaveisMes.reduce((s, c) => s + (c.valor || 0), 0);
  const saiuFixo = custosFixos.reduce((s, c) => s + (c.valor_mensal || 0), 0);
  const saiu = saiuVar + saiuFixo;
  return { entrou, saiu, sobra: entrou - saiu };
}

// Série mensal (entrou/saiu/sobra) — reaproveitada pelos gráficos do Painel
// (Evolução de Ganhos, Fluxo de Caixa Visual) pra não duplicar o loop de mês.
export function serieMensalMEI(
  receitas: ReceitaMEI[],
  custosVariaveis: CustoMEI[],
  custosFixos: CustoFixoMEI[],
  ano: number,
  mesReferencia: number,
  janelaMeses: number
): { mes: string; ano: number; mesNum: number; entrou: number; saiu: number; sobra: number }[] {
  const pontos = [];
  for (let m = Math.max(0, mesReferencia - janelaMeses + 1); m <= mesReferencia; m++) {
    const receitasMes = receitas.filter((r) => {
      const d = new Date(r.data);
      return d.getFullYear() === ano && d.getMonth() === m;
    });
    const custosVarMes = custosVariaveis.filter((c) => {
      if (!c.data) return false;
      const d = new Date(c.data);
      return d.getFullYear() === ano && d.getMonth() === m;
    });
    const { entrou, saiu, sobra } = fluxoMesMEI(receitasMes, custosVarMes, custosFixos);
    pontos.push({ mes: nomeMesPt(m + 1), ano, mesNum: m, entrou, saiu, sobra });
  }
  return pontos;
}

// ============================================================================
// COFRE INTELIGENTE — "o que é seu de verdade" (Fase 2, diferencial central).
// Separa a sobra do mês nas fatias que já têm dono antes de sobrar pró-labore.
// Honestidade: nunca inventa valor — o que falta vira aviso, não suposição
// silenciosa. Gancho de IA: a explicação de cada fatia hoje é texto fixo por
// regra; quando ANTHROPIC_API_KEY entrar, trocar por chamada a
// app/api/ia-chat (mesma rota do IA MEI Advisor), sem mudar os números.
// ============================================================================

export type ContaPagarMEI = { valor_total: number; valor_pago: number };

export type CofreInput = {
  sobraMes: number; // fluxoMesMEI().sobra
  receitaMensalMedia: number; // pra estimar IRPF proporcional
  faturamentoAnual: number;
  categoriaMei: string;
  dasValor: number; // valor configurado (pode divergir do padrão da categoria)
  contasPagarAbertas: ContaPagarMEI[];
  reservaEmergenciaPct: number | null; // null = não configurado ainda
};

export type CofreResultado = {
  das: number;
  irpfReserva: number;
  compromissos: number;
  reservaEmergencia: number;
  reservaEmergenciaPctUsado: number;
  reservaEmergenciaAssumida: boolean;
  proLaboreSeguro: number;
  avisos: string[];
};

export function montarCofre(input: CofreInput): CofreResultado {
  const avisos: string[] = [];

  const das = input.dasValor;

  const percentualIsento = percentualIsentoPorCategoria(input.categoriaMei);
  const rendaTributavelMensalMedia = input.receitaMensalMedia * (1 - percentualIsento);
  const irpfReserva = calcularIRPF(rendaTributavelMensalMedia).imposto;

  const compromissos = input.contasPagarAbertas.reduce(
    (s, c) => s + Math.max(0, (c.valor_total || 0) - (c.valor_pago || 0)),
    0
  );
  if (input.contasPagarAbertas.length === 0) {
    avisos.push("Nenhuma conta a pagar encontrada neste período — considerando R$0 em compromissos.");
  }

  const reservaEmergenciaAssumida = input.reservaEmergenciaPct === null || input.reservaEmergenciaPct === undefined;
  const reservaEmergenciaPctUsado = reservaEmergenciaAssumida ? 10 : (input.reservaEmergenciaPct as number);
  if (reservaEmergenciaAssumida) {
    avisos.push("Assumindo 10% de reserva de emergência — ajuste em Configurar MEI.");
  }
  const reservaEmergencia = Math.max(0, input.sobraMes) * (reservaEmergenciaPctUsado / 100);

  const proLaboreSeguro = input.sobraMes - das - irpfReserva - compromissos - reservaEmergencia;

  return {
    das,
    irpfReserva,
    compromissos,
    reservaEmergencia,
    reservaEmergenciaPctUsado,
    reservaEmergenciaAssumida,
    proLaboreSeguro,
    avisos,
  };
}

// ============================================================================
// RESERVA AUTOMÁTICA DE IMPOSTO — quanto separar a cada receita nova.
// ============================================================================

export function percentualReservaImposto(dasMensal: number, receitaMensalMedia: number, irpfMensal: number): number {
  if (receitaMensalMedia <= 0) return 0;
  return Math.min(100, ((dasMensal + irpfMensal) / receitaMensalMedia) * 100);
}

export function valorASepararPorReceita(valorReceita: number, percentualReserva: number): number {
  return valorReceita * (percentualReserva / 100);
}

// ============================================================================
// DETECTOR DE RETIRADA PERIGOSA — pró-labore vs. o que a empresa aguenta.
// ============================================================================

export function detectarRetiradaPerigosa(params: {
  proLaboreSeguro: number;
  gastosPessoaisMes: number;
}): { perigosa: boolean; motivo: "seguro_negativo" | "gasto_pessoal_alto" | null } {
  if (params.proLaboreSeguro < 0) return { perigosa: true, motivo: "seguro_negativo" };
  if (params.gastosPessoaisMes > params.proLaboreSeguro) return { perigosa: true, motivo: "gasto_pessoal_alto" };
  return { perigosa: false, motivo: null };
}

// ============================================================================
// GUARDIÃO DA RESERVA — detecta consumo da reserva de DAS/IRPF e calcula a
// consequência oficial se não repor até o vencimento. Detecção por lançamento
// (o que está registrado no sistema) — gancho de Open Finance comentado
// abaixo pra quando der pra validar direto no saldo bancário real.
//
// async function validarReservaViaOpenFinance(empresaId: string, valorReserva: number) {
//   // leria of_transacoes/saldo real do banco conectado (Pluggy) e compararia
//   // com a reserva necessária, em vez de inferir pela sobra dos lançamentos.
// }
// ============================================================================

export function detectarConsumoReserva(params: {
  reservaNecessaria: number; // DAS + IRPF do mês (do Cofre)
  sobraMes: number;
}): { consumida: boolean; valorConsumido: number } {
  const valorConsumido = Math.max(0, params.reservaNecessaria - Math.max(0, params.sobraMes));
  return { consumida: valorConsumido > 0, valorConsumido };
}

// Multa 0,33%/dia (teto 20%) + juros pela Selic real (lib/bcbApi.ts) — nunca
// chuta a taxa. Retorna zero se não há atraso.
export function calcularPenalidadeDASAtraso(
  valorDas: number,
  diasAtraso: number,
  selicAnualPct: number
): { multa: number; juros: number; total: number } {
  if (diasAtraso <= 0) return { multa: 0, juros: 0, total: valorDas };
  const multaPct = Math.min(0.33 * diasAtraso, 20);
  const multa = valorDas * (multaPct / 100);
  const juros = valorDas * (selicAnualPct / 100 / 365) * diasAtraso;
  return { multa, juros, total: valorDas + multa + juros };
}
