// AXIOMA AI.TECH — Núcleo MEI (fonte única de cálculo)
// Substitui os hardcodes de teto/DAS espalhados nas 7 telas do módulo MEI.
// Maioria são funções puras (recebem dado já carregado pela tela); a Central
// de Obrigações (seção final) tem I/O direto, mesmo padrão misto de
// lib/relatoriosHelpers.ts (funções async de carga + funções puras de cálculo
// no mesmo arquivo).

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const LIMITE_ANUAL_MEI = 81000;

// DAS 2026: INSS 5% do salário mínimo (R$75,90 — mesma base já usada no
// projeto) + parcela fixa por categoria (ICMS/ISS, estável ano a ano).
// Se a tabela oficial 2026 divergir, ajustar só aqui.
export const INSS_MEI_2026 = 75.9;
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
