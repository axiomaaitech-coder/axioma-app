// AXIOMA AI.TECH — Núcleo MEI (fonte única de cálculo)
// Substitui os hardcodes de teto/DAS espalhados nas 7 telas do módulo MEI.
// Maioria são funções puras (recebem dado já carregado pela tela); a Central
// de Obrigações (seção final) tem I/O direto, mesmo padrão misto de
// lib/relatoriosHelpers.ts (funções async de carga + funções puras de cálculo
// no mesmo arquivo).

import { createBrowserClient } from "@supabase/ssr";
import { nomeMesPt } from "./relatoriosHelpers";
import { precoPorDivisor } from "./cfoCore";

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

export function limiteRestante(faturamentoAno: number, teto: number = LIMITE_ANUAL_MEI): number {
  return Math.max(0, teto - faturamentoAno);
}

export function percentualLimite(faturamentoAno: number, teto: number = LIMITE_ANUAL_MEI): number {
  return Math.min(100, (faturamentoAno / teto) * 100);
}

export function semaforoTeto(percentual: number): "verde" | "amarelo" | "vermelho" {
  if (percentual >= 90) return "vermelho";
  if (percentual >= 70) return "amarelo";
  return "verde";
}

// ============================================================================
// TETO PROPORCIONAL — corrige o teto fixo de R$81.000 pra quem abriu o MEI no
// ano corrente. Regra oficial: R$6.750 (81.000/12) por mês de atividade,
// contando o mês de abertura como mês inteiro. Fonte única — toda tela que
// mostra o teto do usuário (Faturamento, Painel, IA Advisor, Precificação
// MEI) deve calcular por aqui, nunca usar LIMITE_ANUAL_MEI direto quando há
// data_abertura disponível.
// ============================================================================

export function tetoProporcionalMEI(
  dataAbertura: string | null | undefined,
  ano: number
): { teto: number; mesesAtivos: number; proporcional: boolean } {
  if (!dataAbertura) return { teto: LIMITE_ANUAL_MEI, mesesAtivos: 12, proporcional: false };
  const abertura = new Date(dataAbertura.slice(0, 10) + "T00:00:00");
  const anoAbertura = abertura.getFullYear();
  if (anoAbertura < ano) return { teto: LIMITE_ANUAL_MEI, mesesAtivos: 12, proporcional: false };
  if (anoAbertura > ano) return { teto: 0, mesesAtivos: 0, proporcional: true };
  const mesesAtivos = 12 - abertura.getMonth();
  const teto = Math.round((LIMITE_ANUAL_MEI / 12) * mesesAtivos * 100) / 100;
  return { teto, mesesAtivos, proporcional: true };
}

// Percentual SEM teto em 100% (diferente de percentualLimite, que trava em
// 100 pra barra visual) — necessário pra distinguir 100-120% (ainda dá tempo
// até dezembro) de >120% (desenquadramento retroativo).
export function percentualDeTeto(faturamentoAno: number, teto: number): number {
  return teto > 0 ? (faturamentoAno / teto) * 100 : faturamentoAno > 0 ? 999 : 0;
}

export function semaforoTetoDetalhado(percentual: number): "verde" | "amarelo" | "laranja" | "vermelho" {
  if (percentual > 120) return "vermelho";
  if (percentual > 100) return "laranja";
  if (percentual > 80) return "amarelo";
  return "verde";
}

// Projeção detalhada: além da média móvel (projecaoTeto já existente), traduz
// pro que o MEI realmente quer saber — o MÊS calendário provável de estouro
// (não só "N meses"), e quanto ainda dá pra faturar por mês até dezembro sem
// estourar (o restante do teto dividido igualmente pelos meses que faltam).
export function projecaoTetoDetalhada(
  receitas: ReceitaMEI[],
  ano: number,
  mesReferencia: number,
  teto: number,
  janelaMeses = 6
): {
  mediaMensal: number;
  projecaoAnual: number;
  faturamentoAno: number;
  restanteAno: number;
  mesesParaEstourar: number | null;
  mesIndexEstouro: number | null; // 0-11, null se não estoura dentro do ano corrente
  margemRecomendadaMes: number;
} {
  const { mediaMensal, projecaoAnual } = projecaoTeto(receitas, ano, mesReferencia, janelaMeses);
  const faturamentoAno = faturamentoAnoMEI(receitas, ano);
  const restanteAno = Math.max(0, teto - faturamentoAno);
  const mesesParaEstourar = mediaMensal > 0 ? Math.ceil(restanteAno / mediaMensal) : null;
  const idxEstouro = mesesParaEstourar !== null ? mesReferencia + mesesParaEstourar : null;
  const mesIndexEstouro = idxEstouro !== null && idxEstouro <= 11 ? idxEstouro : null;
  const mesesRestantesAno = 12 - mesReferencia;
  const margemRecomendadaMes = mesesRestantesAno > 0 ? restanteAno / mesesRestantesAno : 0;
  return { mediaMensal, projecaoAnual, faturamentoAno, restanteAno, mesesParaEstourar, mesIndexEstouro, margemRecomendadaMes };
}

// ============================================================================
// RELATÓRIO MENSAL DE RECEITAS BRUTAS — obrigação oficial do MEI (registro
// que ele deve manter, mês a mês). Mesmo critério de "conta pro teto MEI" já
// usado no resto da tela (considera_teto_mei), pra não ter dois números de
// "receita bruta" divergentes na mesma tela.
// ============================================================================

export function receitasBrutasPorMes(
  receitas: ReceitaMEI[],
  ano: number
): { mesNum: number; total: number; quantidade: number }[] {
  const meses = Array.from({ length: 12 }, (_, i) => ({ mesNum: i, total: 0, quantidade: 0 }));
  receitas.forEach((r) => {
    const d = new Date(r.data);
    if (d.getFullYear() === ano && r.considera_teto_mei !== false) {
      meses[d.getMonth()].total += r.valor || 0;
      meses[d.getMonth()].quantidade += 1;
    }
  });
  return meses;
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

// Dias até o próximo vencimento do DAS (dia 20 por padrão, configurável em Configurar MEI).
export function diasParaDAS(hoje: Date = new Date(), diaVencimento: number = 20): number {
  const diaEsteMes = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
  if (hoje.getDate() <= diaVencimento) {
    return Math.ceil((diaEsteMes.getTime() - hoje.getTime()) / 86400000);
  }
  const diaProxMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVencimento);
  return Math.ceil((diaProxMes.getTime() - hoje.getTime()) / 86400000);
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

// ============================================================================
// DÍVIDA ACUMULADA DE DAS — "Mapa de Consequências" (Fase reforma DAS &
// Obrigações). Detecção de atraso é sempre por DATA (vencimento no passado +
// status diferente de "Entregue"), nunca depende do usuário ter clicado
// "Atrasado" manualmente — um mês nunca tocado na tela é "Pendente" por
// padrão (mesmo comportamento já usado na tela), mas se o vencimento já
// passou, ele entra na dívida do mesmo jeito.
// ============================================================================

// Marcos oficiais do MEI inadimplente. 61 dias é onde a multa de 0,33%/dia
// atinge o teto de 20% (0,33 × 61 ≈ 20,1%). 12 e 24 meses são os prazos
// oficiais de CNPJ Inapto e inscrição em Dívida Ativa da União.
export const DIAS_MULTA_TETO = 61;
export const DIAS_CNPJ_INAPTO = 365;
export const DIAS_DIVIDA_ATIVA = 730;

export type FaseRiscoDAS = "em_dia" | "atrasado" | "multa_teto" | "inapto" | "divida_ativa";

export function faseRiscoDAS(diasAtraso: number): FaseRiscoDAS {
  if (diasAtraso <= 0) return "em_dia";
  if (diasAtraso < DIAS_MULTA_TETO) return "atrasado";
  if (diasAtraso < DIAS_CNPJ_INAPTO) return "multa_teto";
  if (diasAtraso < DIAS_DIVIDA_ATIVA) return "inapto";
  return "divida_ativa";
}

export type CompetenciaDAS = { mesNum: number; competencia: string; dataVencimento: Date; status: StatusObrigacao };

// Monta a lista honesta de competências de DAS que já deveriam existir este
// ano (desde a abertura do MEI, ou desde janeiro se abriu em ano anterior),
// cruzando com o que já foi gravado em mei_obrigacoes — mês sem registro
// conta como "Pendente" (mesmo default já usado na tela). Único lugar que
// gera essa lista — alimenta tanto o cálculo da dívida quanto o Histórico do
// ano, pra nunca divergir.
export function competenciasDASDoAno(
  obrigacoesCarregadas: ObrigacaoMEI[],
  anoAtual: number,
  diaVencimento: number,
  dataAbertura: string | null | undefined,
  hoje: Date = new Date()
): CompetenciaDAS[] {
  const aberturaObj = dataAbertura ? new Date(dataAbertura.slice(0, 10) + "T00:00:00") : null;
  const mesInicio = aberturaObj && aberturaObj.getFullYear() === anoAtual ? aberturaObj.getMonth() : 0;
  if (aberturaObj && aberturaObj.getFullYear() > anoAtual) return [];
  const resultado: CompetenciaDAS[] = [];
  for (let m = mesInicio; m <= 11; m++) {
    const dataVencimento = new Date(anoAtual, m, diaVencimento);
    if (dataVencimento > hoje) break; // mês futuro ainda não é uma obrigação
    const competencia = `${anoAtual}-${String(m + 1).padStart(2, "0")}`;
    const registro = obrigacoesCarregadas.find((o) => o.tipo === "DAS" && o.competencia === competencia);
    resultado.push({ mesNum: m, competencia, dataVencimento, status: registro?.status || "Pendente" });
  }
  return resultado;
}

export type DasAtrasado = {
  competencia: string;
  dataVencimento: string;
  diasAtraso: number;
  valorOriginal: number;
  penalidade: { multa: number; juros: number; total: number };
};

export function calcularDividaDASAcumulada(
  competenciasDoAno: CompetenciaDAS[],
  dasValorMensal: number,
  selicAnualPct: number,
  hoje: Date = new Date()
): { atrasos: DasAtrasado[]; totalOriginal: number; totalAtualizado: number; piorDiasAtraso: number } {
  const atrasos: DasAtrasado[] = competenciasDoAno
    .filter((c) => c.status !== "Entregue" && c.dataVencimento < hoje)
    .map((c) => {
      const diasAtraso = Math.floor((hoje.getTime() - c.dataVencimento.getTime()) / 86400000);
      return {
        competencia: c.competencia,
        dataVencimento: c.dataVencimento.toISOString().slice(0, 10),
        diasAtraso,
        valorOriginal: dasValorMensal,
        penalidade: calcularPenalidadeDASAtraso(dasValorMensal, diasAtraso, selicAnualPct),
      };
    });
  const totalOriginal = atrasos.length * dasValorMensal;
  const totalAtualizado = atrasos.reduce((s, a) => s + a.penalidade.total, 0);
  const piorDiasAtraso = atrasos.reduce((m, a) => Math.max(m, a.diasAtraso), 0);
  return { atrasos, totalOriginal, totalAtualizado, piorDiasAtraso };
}

// Projeção "bola de neve": quanto a dívida acumulada vira daqui a N dias se
// nada for pago, reaproveitando a mesma fórmula de penalidade pra cada
// competência em atraso.
export function projecaoBolaDeNeveDAS(
  atrasos: DasAtrasado[],
  selicAnualPct: number,
  horizontesDias: number[] = [30, 60, 90]
): { dias: number; valorTotal: number }[] {
  return horizontesDias.map((h) => ({
    dias: h,
    valorTotal: atrasos.reduce((s, a) => s + calcularPenalidadeDASAtraso(a.valorOriginal, a.diasAtraso + h, selicAnualPct).total, 0),
  }));
}

// Parcelamento PGMEI: até 60 parcelas, mínimo R$50 cada — trava o máximo de
// parcelas automaticamente pra nunca sugerir uma parcela abaixo do mínimo.
export const PARCELA_MINIMA_DAS = 50;
export const PARCELAS_MAXIMAS_DAS = 60;

export function maxParcelasDAS(dividaTotal: number): number {
  if (dividaTotal <= 0) return 0;
  return Math.max(1, Math.min(PARCELAS_MAXIMAS_DAS, Math.floor(dividaTotal / PARCELA_MINIMA_DAS)));
}

// ============================================================================
// REFORMA TRIBUTÁRIA — marcos oficiais pro MEI, como dado (não texto — a
// página monta a cópia PT/EN/ES). Fonte: EC 132/2023 + LC 214/2025. Mudam
// por lei — atualizar aqui quando houver regulamentação nova, tratar sempre
// como estimativa sujeita a confirmação.
//
// Tom deliberado: 2026 é ano-teste (IBS/CBS simbólicos, MEI segue só no DAS,
// sem imposto novo) — `urgente: false` de propósito, pra nunca alarmar por
// algo que ainda não pesa no bolso. A urgência real é 2027 (decisão MEI x ME,
// prazo setembro/2026, CBS cobrada de verdade, split payment voluntário B2B,
// nota fiscal obrigatória pra serviços).
// ============================================================================

export type MarcoReformaMEI = { ano: number; urgente: boolean };

export const MARCOS_REFORMA_MEI: MarcoReformaMEI[] = [
  { ano: 2026, urgente: false },
  { ano: 2027, urgente: true },
  { ano: 2033, urgente: false },
];

// Índice do marco em que estamos hoje — só pra posicionar o marcador "você
// está aqui" na timeline.
export function faseAtualReformaMEI(anoAtual: number = new Date().getFullYear()): number {
  if (anoAtual < 2027) return 0;
  if (anoAtual < 2033) return 1;
  return 2;
}

// Nanoempreendedor (categoria nova da Reforma, LC 214/2025): teto próprio
// menor que o MEI, isento de CBS/IBS — opção informativa pra MEI muito
// pequeno, nunca empurrada como recomendação automática.
export const LIMITE_NANOEMPREENDEDOR = 40500;

// ============================================================================
// PRECIFICAÇÃO MEI — reaproveita a fórmula única `precoPorDivisor` (cfoCore.ts,
// mesma usada pela Precificação principal). DAS e a exposição de IRPF viram
// FRAÇÃO do preço pra caber no mesmo divisor; custo da própria hora entra
// ANTES do divisor, como custo — é o erro nº 1 de quem precifica MEI: esquecer
// o próprio tempo.
// ============================================================================

// pro_labore_desejado (mei_dados) rateado pelas horas/unidades da venda —
// unit-agnóstico: serve pra hora, projeto ou produto.
export function custoProprioRateado(proLaboreDesejado: number | null | undefined, unidadesOuHoras: number): number {
  if (!proLaboreDesejado || unidadesOuHoras <= 0) return 0;
  return proLaboreDesejado / unidadesOuHoras;
}

// DAS é valor fixo mensal — vira fração do preço dividindo pela receita
// mensal de referência (média real, se houver histórico; senão o teto
// proporcional/12, estimativa honesta pra quem ainda não faturou).
export function fracaoDASSobrePreco(dasMensal: number, receitaMensalReferencia: number): number {
  if (receitaMensalReferencia <= 0) return 0;
  return Math.min(0.95, dasMensal / receitaMensalReferencia);
}

// Aproximação conservadora: parcela exposta do IRPF (1 − isenção da categoria)
// tributada na alíquota marginal máxima (27,5%) — mesmo teto usado no Cofre
// Inteligente (calcularIRPF), sem inventar uma alíquota efetiva menor.
export function fracaoIRPFExposicao(categoria: string | null | undefined): number {
  return (1 - percentualIsentoPorCategoria(categoria)) * 0.275;
}

export type DetectorTrabalhoGratisResultado = {
  precoMinimo: number; // margem 0 — só cobre custo + DAS + IRPF
  situacao: "prejuizo" | "apertada" | "saudavel";
  prejuizoPorUnidade: number; // > 0 só quando situacao === "prejuizo"
  margemRealPct: number; // só relevante quando situacao !== "prejuizo"
};

// "Você está trabalhando de graça?" — compara o que o usuário diz que cobra
// hoje com o preço mínimo real (custo + DAS + IRPF, sem lucro nenhum).
export function detectarTrabalhoDeGraca(params: {
  precoCobradoHoje: number;
  custoBase: number; // custo fixo rateado + variável rateado + custo da própria hora, sem imposto
  fracaoDAS: number;
  fracaoIRPF: number;
}): DetectorTrabalhoGratisResultado {
  const precoMinimo = precoPorDivisor(params.custoBase, [params.fracaoDAS, params.fracaoIRPF]);
  if (params.precoCobradoHoje < precoMinimo) {
    return { precoMinimo, situacao: "prejuizo", prejuizoPorUnidade: precoMinimo - params.precoCobradoHoje, margemRealPct: 0 };
  }
  const custoTotalComImpostos = params.custoBase + params.precoCobradoHoje * (params.fracaoDAS + params.fracaoIRPF);
  const margemRealPct = params.precoCobradoHoje > 0 ? ((params.precoCobradoHoje - custoTotalComImpostos) / params.precoCobradoHoje) * 100 : 0;
  return { precoMinimo, situacao: margemRealPct < 15 ? "apertada" : "saudavel", prejuizoPorUnidade: 0, margemRealPct };
}
