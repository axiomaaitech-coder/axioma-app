// 🦅 AXIOMA AI.TECH - Helpers do Centro de Inteligência Estratégica de Fornecedores
// Fase 1: Cadastro Enterprise (contatos, documentos com validade, contratos, produtos, timeline).
// Mesmo padrão de storage/CRUD já usado em empresaHelpers.ts (bucket + tabela de metadados).

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// TIPOS — LINHAS DO SUPABASE
// ============================================================================

export type FornecedorContato = {
  id: string; user_id: string; fornecedor_id: string;
  nome: string; cargo?: string | null; email?: string | null; telefone?: string | null;
  whatsapp?: string | null; principal?: boolean | null; created_at: string;
};

export type FornecedorDocumento = {
  id: string; user_id: string; fornecedor_id: string;
  nome: string; tipo?: string | null; numero_documento?: string | null;
  data_emissao?: string | null; data_validade?: string | null;
  storage_path?: string | null; mime_type?: string | null; tamanho_bytes?: number | null;
  created_at: string;
};

export type FornecedorContrato = {
  id: string; user_id: string; fornecedor_id: string;
  descricao?: string | null; data_inicio?: string | null; data_fim?: string | null;
  renovacao_automatica?: boolean | null; indice_reajuste?: string | null;
  valor_contratado?: number | null; valor_utilizado?: number | null; created_at: string;
};

export type FornecedorProduto = {
  id: string; user_id: string; fornecedor_id: string;
  descricao: string; categoria?: string | null; valor_unitario?: number | null;
  unidade?: string | null; created_at: string;
};

export type FornecedorInteracao = {
  id: string; user_id: string; fornecedor_id: string;
  data: string; tipo?: string | null; descricao: string; created_at: string;
};

export const TIPOS_DOCUMENTO_FORNECEDOR = [
  { key: "contrato", label: "Contrato", icon: "📄" },
  { key: "cnd", label: "Certidão Negativa de Débitos", icon: "✅" },
  { key: "alvara", label: "Alvará de Funcionamento", icon: "🏛️" },
  { key: "licenca", label: "Licença/Certificação", icon: "📜" },
  { key: "seguro", label: "Apólice de Seguro", icon: "🛡️" },
  { key: "bancario", label: "Comprovante Bancário", icon: "🏦" },
  { key: "ficha_cadastral", label: "Ficha Cadastral", icon: "🗂️" },
  { key: "outros", label: "Outros", icon: "📎" },
];

// ============================================================================
// CONTATOS
// ============================================================================

export async function listarContatos(fornecedorId: string): Promise<FornecedorContato[]> {
  const { data } = await supabase.from("fornecedor_contatos").select("*")
    .eq("fornecedor_id", fornecedorId).order("principal", { ascending: false }).order("created_at", { ascending: true });
  return data || [];
}

export async function criarContato(fornecedorId: string, userId: string, dados: Partial<FornecedorContato>): Promise<{ id?: string; erro?: string }> {
  const { data, error } = await supabase.from("fornecedor_contatos")
    .insert({ ...dados, fornecedor_id: fornecedorId, user_id: userId }).select("id").single();
  if (error) return { erro: error.message };
  return { id: data.id };
}

export async function atualizarContato(id: string, dados: Partial<FornecedorContato>): Promise<{ erro?: string }> {
  const { error } = await supabase.from("fornecedor_contatos").update(dados).eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function excluirContato(id: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("fornecedor_contatos").delete().eq("id", id);
  return error ? { erro: error.message } : {};
}

// ============================================================================
// DOCUMENTOS (upload + validade)
// ============================================================================

export async function uploadDocumentoFornecedor(file: File, fornecedorId: string, userId: string, tipo: string): Promise<{ path?: string; erro?: string }> {
  const timestamp = Date.now();
  const nomeArquivo = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${userId}/${fornecedorId}/${tipo}/${timestamp}-${nomeArquivo}`;
  const { error } = await supabase.storage.from("fornecedor-documentos")
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (error) return { erro: error.message };
  return { path };
}

export async function listarDocumentos(fornecedorId: string): Promise<FornecedorDocumento[]> {
  const { data } = await supabase.from("fornecedor_documentos").select("*")
    .eq("fornecedor_id", fornecedorId).order("data_validade", { ascending: true, nullsFirst: false });
  return data || [];
}

export async function criarDocumentoFornecedor(fornecedorId: string, userId: string, dados: Partial<FornecedorDocumento>): Promise<{ id?: string; erro?: string }> {
  const { data, error } = await supabase.from("fornecedor_documentos")
    .insert({ ...dados, fornecedor_id: fornecedorId, user_id: userId }).select("id").single();
  if (error) return { erro: error.message };
  return { id: data.id };
}

export async function atualizarDocumentoFornecedor(id: string, dados: Partial<FornecedorDocumento>): Promise<{ erro?: string }> {
  const { error } = await supabase.from("fornecedor_documentos").update(dados).eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function excluirDocumentoFornecedor(doc: FornecedorDocumento): Promise<{ erro?: string }> {
  if (doc.storage_path) await supabase.storage.from("fornecedor-documentos").remove([doc.storage_path]);
  const { error } = await supabase.from("fornecedor_documentos").delete().eq("id", doc.id);
  return error ? { erro: error.message } : {};
}

export async function gerarUrlDocumentoFornecedor(path: string, segundos: number = 3600): Promise<string | null> {
  const { data } = await supabase.storage.from("fornecedor-documentos").createSignedUrl(path, segundos);
  return data?.signedUrl || null;
}

// ============================================================================
// CONTRATOS
// ============================================================================

export async function listarContratos(fornecedorId: string): Promise<FornecedorContrato[]> {
  const { data } = await supabase.from("fornecedor_contratos").select("*")
    .eq("fornecedor_id", fornecedorId).order("data_fim", { ascending: true, nullsFirst: false });
  return data || [];
}

export async function criarContrato(fornecedorId: string, userId: string, dados: Partial<FornecedorContrato>): Promise<{ id?: string; erro?: string }> {
  const { data, error } = await supabase.from("fornecedor_contratos")
    .insert({ ...dados, fornecedor_id: fornecedorId, user_id: userId }).select("id").single();
  if (error) return { erro: error.message };
  return { id: data.id };
}

export async function atualizarContrato(id: string, dados: Partial<FornecedorContrato>): Promise<{ erro?: string }> {
  const { error } = await supabase.from("fornecedor_contratos").update(dados).eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function excluirContrato(id: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("fornecedor_contratos").delete().eq("id", id);
  return error ? { erro: error.message } : {};
}

// ============================================================================
// PRODUTOS E SERVIÇOS
// ============================================================================

export async function listarProdutos(fornecedorId: string): Promise<FornecedorProduto[]> {
  const { data } = await supabase.from("fornecedor_produtos").select("*")
    .eq("fornecedor_id", fornecedorId).order("created_at", { ascending: true });
  return data || [];
}

export async function criarProduto(fornecedorId: string, userId: string, dados: Partial<FornecedorProduto>): Promise<{ id?: string; erro?: string }> {
  const { data, error } = await supabase.from("fornecedor_produtos")
    .insert({ ...dados, fornecedor_id: fornecedorId, user_id: userId }).select("id").single();
  if (error) return { erro: error.message };
  return { id: data.id };
}

export async function atualizarProduto(id: string, dados: Partial<FornecedorProduto>): Promise<{ erro?: string }> {
  const { error } = await supabase.from("fornecedor_produtos").update(dados).eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function excluirProduto(id: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("fornecedor_produtos").delete().eq("id", id);
  return error ? { erro: error.message } : {};
}

// ============================================================================
// TIMELINE DE INTERAÇÕES
// ============================================================================

export async function listarInteracoes(fornecedorId: string): Promise<FornecedorInteracao[]> {
  const { data } = await supabase.from("fornecedor_interacoes").select("*")
    .eq("fornecedor_id", fornecedorId).order("data", { ascending: false });
  return data || [];
}

export async function criarInteracao(fornecedorId: string, userId: string, dados: Partial<FornecedorInteracao>): Promise<{ id?: string; erro?: string }> {
  const { data, error } = await supabase.from("fornecedor_interacoes")
    .insert({ ...dados, fornecedor_id: fornecedorId, user_id: userId }).select("id").single();
  if (error) return { erro: error.message };
  return { id: data.id };
}

export async function atualizarInteracao(id: string, dados: Partial<FornecedorInteracao>): Promise<{ erro?: string }> {
  const { error } = await supabase.from("fornecedor_interacoes").update(dados).eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function excluirInteracao(id: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("fornecedor_interacoes").delete().eq("id", id);
  return error ? { erro: error.message } : {};
}

// ============================================================================
// MOTOR DE ALERTA DE VENCIMENTO (documentos + contratos)
// ============================================================================

export function documentosVencendo(docs: FornecedorDocumento[], diasAlerta: number = 30): { vencidos: FornecedorDocumento[]; aVencer: FornecedorDocumento[] } {
  const hoje = new Date().toISOString().slice(0, 10);
  const limite = new Date(); limite.setDate(limite.getDate() + diasAlerta);
  const limiteISO = limite.toISOString().slice(0, 10);
  const comValidade = docs.filter((d) => d.data_validade);
  return {
    vencidos: comValidade.filter((d) => d.data_validade! < hoje),
    aVencer: comValidade.filter((d) => d.data_validade! >= hoje && d.data_validade! <= limiteISO),
  };
}

export function contratosVencendo(contratos: FornecedorContrato[], diasAlerta: number = 30): { vencidos: FornecedorContrato[]; aVencer: FornecedorContrato[] } {
  const hoje = new Date().toISOString().slice(0, 10);
  const limite = new Date(); limite.setDate(limite.getDate() + diasAlerta);
  const limiteISO = limite.toISOString().slice(0, 10);
  const comData = contratos.filter((c) => c.data_fim);
  return {
    vencidos: comData.filter((c) => c.data_fim! < hoje),
    aVencer: comData.filter((c) => c.data_fim! >= hoje && c.data_fim! <= limiteISO),
  };
}

// ============================================================================
// FASE 2 — DASHBOARD EXECUTIVO (KPIs de carteira, todos calculados em cima
// do que a Fase 1 cadastra: fornecedores + contas_pagar + contratos).
// Funções puras — recebem os arrays já carregados, não fazem query própria
// (mesmo padrão do resto do alicerce em cfoCore.ts).
// ============================================================================

export type FornecedorRow = {
  id: string; nome: string; status?: string | null; categoria?: string | null;
  nivel_qualidade?: string | null; classificacao_risco?: string | null;
  uf?: string | null; cidade?: string | null; created_at?: string | null;
  tipo_pessoa?: string | null; regime_tributario?: string | null; contribuinte_icms?: string | null;
  valor_mensal?: number | null; centro_custo_id?: string | null;
};

export type ContaPagarRow = {
  id: string; fornecedor_id: string | null; descricao: string; categoria?: string | null;
  valor_total: number; valor_pago: number;
  data_emissao?: string | null; data_vencimento?: string | null; data_pagamento?: string | null;
  status?: string | null;
};

// Mesma regra usada pela tela de Fornecedores pra decidir o status de uma conta a pagar —
// centralizada aqui pra qualquer tela que precise recalcular o status ao editar valor/pagamento
// (ex: a Planilha do Centro de Custos) usar exatamente a mesma lógica, nunca duplicada.
export function calcStatus(total: number, pago: number, venc?: string | null): string {
  if (pago >= total && total > 0) return "pago";
  if (pago > 0 && pago < total) return "parcial";
  const hj = new Date().toISOString().split("T")[0];
  if (venc && venc < hj) return "vencido";
  return "pendente";
}

// Transferência de dados Fornecedor → Conta a Pagar: só sugere o que o cadastro
// realmente tem (nunca sobrescreve com undefined). Vencimento só entra se o
// fornecedor tiver prazo_medio_dias — condicao_pagamento é texto livre, não dá
// pra calcular data a partir dele.
export function sugerirDadosContaPorFornecedor(
  f: FornecedorRow & { prazo_medio_dias?: number | null; forma_pagamento_preferencial?: string | null },
  dataEmissaoAtual?: string,
): Partial<{ categoria: string; forma_pagamento: string; data_vencimento: string; centro_custo_id: string }> {
  const sugestao: Partial<{ categoria: string; forma_pagamento: string; data_vencimento: string; centro_custo_id: string }> = {};
  if (f.categoria) sugestao.categoria = f.categoria;
  if (f.forma_pagamento_preferencial) sugestao.forma_pagamento = f.forma_pagamento_preferencial;
  if (f.centro_custo_id) sugestao.centro_custo_id = f.centro_custo_id;
  if (f.prazo_medio_dias) {
    const base = dataEmissaoAtual ? new Date(dataEmissaoAtual + "T00:00:00") : new Date();
    base.setDate(base.getDate() + f.prazo_medio_dias);
    sugestao.data_vencimento = base.toISOString().slice(0, 10);
  }
  return sugestao;
}

export function comprasNoPeriodo(contas: ContaPagarRow[], periodo: { inicio: string; fim: string }): number {
  return contas
    .filter((c) => { const d = c.data_emissao || c.data_vencimento; return d && d >= periodo.inicio && d <= periodo.fim; })
    .reduce((s, c) => s + (c.valor_total || 0), 0);
}

function gastoPorFornecedor(contas: ContaPagarRow[]): Map<string, number> {
  const mapa = new Map<string, number>();
  contas.forEach((c) => { if (!c.fornecedor_id) return; mapa.set(c.fornecedor_id, (mapa.get(c.fornecedor_id) || 0) + (c.valor_total || 0)); });
  return mapa;
}

export type ConcentracaoFornecedores = { percentualMaior: number; nomeMaior: string | null; amostraSuficiente: boolean };

// Dependência financeira — quanto do total pago está concentrado no maior fornecedor
// (mesma lógica de "concentração top 20%" já usada em Receitas, só que pro lado da despesa).
export function concentracaoFornecedores(fornecedores: FornecedorRow[], contas: ContaPagarRow[]): ConcentracaoFornecedores {
  const mapa = gastoPorFornecedor(contas);
  const total = Array.from(mapa.values()).reduce((a, b) => a + b, 0);
  if (total <= 0 || mapa.size === 0) return { percentualMaior: 0, nomeMaior: null, amostraSuficiente: false };
  let maiorId = "", maiorValor = 0;
  mapa.forEach((v, k) => { if (v > maiorValor) { maiorValor = v; maiorId = k; } });
  return {
    percentualMaior: Math.round((maiorValor / total) * 1000) / 10,
    nomeMaior: fornecedores.find((f) => f.id === maiorId)?.nome || null,
    amostraSuficiente: mapa.size >= 2,
  };
}

export type DiversificacaoFornecedores = { indice: number; fornecedoresComCompra: number; amostraSuficiente: boolean };

// Índice de diversificação — Herfindahl-Hirschman invertido e normalizado 0-100.
// 100 = gasto espalhado igualmente entre fornecedores, 0 = 100% concentrado em um só.
export function diversificacaoFornecedores(contas: ContaPagarRow[]): DiversificacaoFornecedores {
  const mapa = gastoPorFornecedor(contas);
  const valores = Array.from(mapa.values());
  const total = valores.reduce((a, b) => a + b, 0);
  if (total <= 0) return { indice: 0, fornecedoresComCompra: 0, amostraSuficiente: false };
  const hhi = valores.reduce((s, v) => s + Math.pow(v / total, 2), 0);
  return { indice: Math.round((1 - hhi) * 100), fornecedoresComCompra: valores.length, amostraSuficiente: valores.length >= 2 };
}

export type CurvaABCItem = { fornecedorId: string; nome: string; valor: number; percentual: number; percentualAcumulado: number; classe: "A" | "B" | "C" };

// Curva ABC — poucos fornecedores concentrando a maior parte da compra (classe A = 80% do gasto).
export function curvaABC(fornecedores: FornecedorRow[], contas: ContaPagarRow[]): CurvaABCItem[] {
  const mapa = gastoPorFornecedor(contas);
  const total = Array.from(mapa.values()).reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  let acumulado = 0;
  return Array.from(mapa.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, valor]) => {
      const percentual = (valor / total) * 100;
      acumulado += percentual;
      const classe: CurvaABCItem["classe"] = acumulado <= 80 ? "A" : acumulado <= 95 ? "B" : "C";
      return {
        fornecedorId: id, nome: fornecedores.find((f) => f.id === id)?.nome || "—", valor,
        percentual: Math.round(percentual * 10) / 10, percentualAcumulado: Math.round(acumulado * 10) / 10, classe,
      };
    });
}

export function distribuicaoGeografica(fornecedores: FornecedorRow[]): { uf: string; quantidade: number }[] {
  const mapa = new Map<string, number>();
  fornecedores.forEach((f) => { const uf = (f.uf || "").trim(); if (!uf) return; mapa.set(uf, (mapa.get(uf) || 0) + 1); });
  return Array.from(mapa.entries()).map(([uf, quantidade]) => ({ uf, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
}

export type MetricaCarteira = { media: number; amostra: number; total: number; amostraSuficiente: boolean };

const PESO_RISCO: Record<string, number> = { baixo: 1, medio: 2, alto: 3 };

// Risco médio — só entra na média quem já foi classificado no cadastro (Fase 1). Sem achismo.
export function riscoMedioCarteira(fornecedores: FornecedorRow[]): MetricaCarteira {
  const avaliados = fornecedores.filter((f) => f.classificacao_risco && PESO_RISCO[f.classificacao_risco]);
  if (avaliados.length === 0) return { media: 0, amostra: 0, total: fornecedores.length, amostraSuficiente: false };
  const soma = avaliados.reduce((s, f) => s + PESO_RISCO[f.classificacao_risco as string], 0);
  return { media: Math.round((soma / avaliados.length) * 100) / 100, amostra: avaliados.length, total: fornecedores.length, amostraSuficiente: avaliados.length >= 3 };
}

const PESO_QUALIDADE: Record<string, number> = { ruim: 1, regular: 2, bom: 3, excelente: 4 };

// Índice de qualidade — mesma regra: só entra quem foi avaliado no cadastro.
export function qualidadeMediaCarteira(fornecedores: FornecedorRow[]): MetricaCarteira {
  const avaliados = fornecedores.filter((f) => f.nivel_qualidade && PESO_QUALIDADE[f.nivel_qualidade]);
  if (avaliados.length === 0) return { media: 0, amostra: 0, total: fornecedores.length, amostraSuficiente: false };
  const soma = avaliados.reduce((s, f) => s + PESO_QUALIDADE[f.nivel_qualidade as string], 0);
  return { media: Math.round((soma / avaliados.length) * 100) / 100, amostra: avaliados.length, total: fornecedores.length, amostraSuficiente: avaliados.length >= 3 };
}

export type PontualidadePagamento = { percentual: number; pagas: number; pagasEmDia: number; amostraSuficiente: boolean };

// Pontualidade — mede o que o schema realmente guarda: se NÓS pagamos o fornecedor em dia.
// Não é o mesmo que "o fornecedor entregou no prazo" (isso o Axioma não rastreia ainda).
export function pontualidadePagamento(contas: ContaPagarRow[]): PontualidadePagamento {
  const pagas = contas.filter((c) => c.status === "pago" && c.data_pagamento && c.data_vencimento);
  if (pagas.length === 0) return { percentual: 0, pagas: 0, pagasEmDia: 0, amostraSuficiente: false };
  const emDia = pagas.filter((c) => (c.data_pagamento as string) <= (c.data_vencimento as string));
  return { percentual: Math.round((emDia.length / pagas.length) * 1000) / 10, pagas: pagas.length, pagasEmDia: emDia.length, amostraSuficiente: pagas.length >= 3 };
}

// Índice de estabilidade — tempo médio de relacionamento (dias desde o cadastro),
// mesma interpretação já usada no módulo Clientes.
export function tempoMedioRelacionamentoDias(fornecedores: FornecedorRow[]): number {
  const comData = fornecedores.filter((f) => f.created_at);
  if (comData.length === 0) return 0;
  const hoje = Date.now();
  const soma = comData.reduce((s, f) => s + Math.max(0, (hoje - new Date(f.created_at as string).getTime()) / 86400000), 0);
  return Math.round(soma / comData.length);
}

// ============================================================================
// FASE 3 — SCORE CORPORATIVO AXIOMA (0-1000), 14 critérios.
// Substitui a v1 da Fase 2 (mais simples) por um motor completo e transparente.
// Pesos num objeto único, fácil de ajustar. Critério sem dado real não penaliza —
// fica de fora do cálculo e o peso dele é redistribuído entre os que têm dado.
// ============================================================================

// 7 critérios com dado real hoje + 7 reservados para infraestrutura futura
// (histórico de entrega/defeito, benchmark de preço, volume de pedidos,
// dados financeiros de terceiros, ESG estruturado, RFQ) — nenhum é inventado.
export const PESOS_SCORE_AXIOMA: Record<string, number> = {
  qualidade: 15, pontualidade: 15, risco: 12, compliance: 10, dependencia: 8,
  estabilidade: 7, relacionamento: 6,
  confiabilidade: 6, preco: 5, capacidadeEntrega: 5, saudeFinanceira: 4,
  sustentabilidade: 3, inovacao: 2, flexibilidade: 2,
};

const TIPOS_DOC_COMPLIANCE = ["cnd", "alvara", "licenca", "seguro"];

export type CriterioScoreAxioma = { chave: string; valor: number | null; peso: number; contribuicao: number; semDados: boolean };
export type ScoreAxiomaFornecedor = { total: number; nivel: "critico" | "atencao" | "saudavel"; criterios: CriterioScoreAxioma[] };

export function calcularScoreAxiomaFornecedor(
  f: FornecedorRow,
  contasDoFornecedor: ContaPagarRow[],
  documentosDoFornecedor: FornecedorDocumento[],
  interacoesDoFornecedor: FornecedorInteracao[],
  totalComprasCarteira: number,
): ScoreAxiomaFornecedor {
  const valores: Record<string, number | null> = {
    confiabilidade: null, preco: null, capacidadeEntrega: null, saudeFinanceira: null,
    sustentabilidade: null, inovacao: null, flexibilidade: null,
  };

  valores.qualidade = f.nivel_qualidade && PESO_QUALIDADE[f.nivel_qualidade] ? (PESO_QUALIDADE[f.nivel_qualidade] / 4) * 100 : null;

  const pont = pontualidadePagamento(contasDoFornecedor);
  valores.pontualidade = pont.pagas > 0 ? pont.percentual : null;

  valores.risco = f.classificacao_risco && PESO_RISCO[f.classificacao_risco] ? 100 - ((PESO_RISCO[f.classificacao_risco] - 1) / 2) * 100 : null;

  const docsCompliance = documentosDoFornecedor.filter((d) => d.tipo && TIPOS_DOC_COMPLIANCE.includes(d.tipo));
  if (docsCompliance.length > 0) {
    const hoje = new Date().toISOString().slice(0, 10);
    const validos = docsCompliance.filter((d) => !d.data_validade || d.data_validade >= hoje);
    valores.compliance = Math.round((validos.length / docsCompliance.length) * 100);
  } else valores.compliance = null;

  // Dependência invertida: quanto MENOR a fatia desse fornecedor no total comprado, melhor a nota.
  if (totalComprasCarteira > 0) {
    const gastoForn = contasDoFornecedor.reduce((s, c) => s + (c.valor_total || 0), 0);
    valores.dependencia = Math.round(Math.max(0, 100 - (gastoForn / totalComprasCarteira) * 100));
  } else valores.dependencia = null;

  if (f.created_at) {
    const dias = Math.max(0, (Date.now() - new Date(f.created_at).getTime()) / 86400000);
    valores.estabilidade = Math.round(Math.min(100, (dias / 365) * 100));
  } else valores.estabilidade = null;

  valores.relacionamento = interacoesDoFornecedor.length > 0 ? Math.round(Math.min(100, interacoesDoFornecedor.length * 20)) : null;

  const criterios: CriterioScoreAxioma[] = Object.keys(PESOS_SCORE_AXIOMA).map((chave) => ({
    chave, valor: valores[chave], peso: PESOS_SCORE_AXIOMA[chave], contribuicao: 0, semDados: valores[chave] == null,
  }));

  const comDado = criterios.filter((c) => !c.semDados);
  const pesoTotal = comDado.reduce((s, c) => s + c.peso, 0);
  if (pesoTotal > 0) {
    comDado.forEach((c) => { c.contribuicao = Math.round(((c.valor as number) * c.peso) / pesoTotal * 10); });
  }
  const total = comDado.reduce((s, c) => s + c.contribuicao, 0);
  const nivel: ScoreAxiomaFornecedor["nivel"] = total <= 400 ? "critico" : total <= 700 ? "atencao" : "saudavel";
  return { total, nivel, criterios };
}

export function rankingScoreAxioma(
  fornecedores: FornecedorRow[], contas: ContaPagarRow[], documentos: FornecedorDocumento[], interacoes: FornecedorInteracao[],
): { fornecedor: FornecedorRow; score: ScoreAxiomaFornecedor }[] {
  const totalCarteira = contas.reduce((s, c) => s + (c.valor_total || 0), 0);
  return fornecedores
    .map((f) => ({
      fornecedor: f,
      score: calcularScoreAxiomaFornecedor(
        f, contas.filter((c) => c.fornecedor_id === f.id), documentos.filter((d) => d.fornecedor_id === f.id),
        interacoes.filter((i) => i.fornecedor_id === f.id), totalCarteira,
      ),
    }))
    .sort((a, b) => b.score.total - a.score.total);
}

export function scoreMedioCarteiraAxioma(ranking: { score: ScoreAxiomaFornecedor }[]): MetricaCarteira {
  const comDado = ranking.filter((r) => r.score.criterios.some((c) => !c.semDados));
  if (comDado.length === 0) return { media: 0, amostra: 0, total: ranking.length, amostraSuficiente: false };
  const soma = comDado.reduce((s, r) => s + r.score.total, 0);
  return { media: Math.round(soma / comDado.length), amostra: comDado.length, total: ranking.length, amostraSuficiente: comDado.length >= 3 };
}

// ============================================================================
// FASE 4 — INTELIGÊNCIA DE COMPRAS + ALERTAS.
// A maior parte da Fase 4 reaproveita funções que já existem em cfoCore.ts
// (serieRolling, detectarAnomaliasHistoricas, detectarDesperdicio) — só o que
// é genuinamente novo do domínio de fornecedores fica aqui.
// ============================================================================

export type InflacaoFornecedor = { ticketAtual: number; ticketAnterior: number; variacaoPct: number; amostraSuficiente: boolean };

// "Inflação do fornecedor" = variação do ticket médio (valor/compra) entre o período
// atual e o anterior. Não é inflação oficial — é a variação real do que a empresa paga.
export function inflacaoFornecedor(
  contasDoFornecedor: ContaPagarRow[],
  periodoAtual: { inicio: string; fim: string },
  periodoAnt: { inicio: string; fim: string },
): InflacaoFornecedor {
  const noPeriodo = (p: { inicio: string; fim: string }) => contasDoFornecedor.filter((c) => {
    const d = c.data_emissao || c.data_vencimento; return d && d >= p.inicio && d <= p.fim;
  });
  const atual = noPeriodo(periodoAtual);
  const anterior = noPeriodo(periodoAnt);
  if (atual.length === 0 || anterior.length === 0) return { ticketAtual: 0, ticketAnterior: 0, variacaoPct: 0, amostraSuficiente: false };
  const ticketAtual = atual.reduce((s, c) => s + (c.valor_total || 0), 0) / atual.length;
  const ticketAnterior = anterior.reduce((s, c) => s + (c.valor_total || 0), 0) / anterior.length;
  const variacaoPct = ticketAnterior > 0 ? ((ticketAtual - ticketAnterior) / ticketAnterior) * 100 : 0;
  return { ticketAtual, ticketAnterior, variacaoPct: Math.round(variacaoPct * 10) / 10, amostraSuficiente: true };
}

export type GrupoConsolidacao = {
  categoria: string;
  fornecedores: { id: string; nome: string; totalGasto: number; ticketMedio: number; qtdCompras: number }[];
  economiaEstimada: number;
};

// Oportunidades de Consolidação — fornecedores ativos na MESMA categoria, com histórico
// de compra. Se consolidasse tudo no de menor ticket médio, essa seria a economia.
// Comparação 100% interna (entre os próprios fornecedores cadastrados), sem inventar
// preço de mercado externo — é aqui que "economia possível" ganha um número real.
export function oportunidadesConsolidacao(fornecedores: FornecedorRow[], contas: ContaPagarRow[]): GrupoConsolidacao[] {
  const porCategoria = new Map<string, FornecedorRow[]>();
  fornecedores.filter((f) => (f.status || "ativo") === "ativo" && f.categoria).forEach((f) => {
    const cat = f.categoria as string;
    if (!porCategoria.has(cat)) porCategoria.set(cat, []);
    porCategoria.get(cat)!.push(f);
  });

  const grupos: GrupoConsolidacao[] = [];
  porCategoria.forEach((forns, categoria) => {
    const linhas = forns.map((f) => {
      const cf = contas.filter((c) => c.fornecedor_id === f.id);
      const totalGasto = cf.reduce((s, c) => s + (c.valor_total || 0), 0);
      return { id: f.id, nome: f.nome, totalGasto, ticketMedio: cf.length > 0 ? totalGasto / cf.length : 0, qtdCompras: cf.length };
    }).filter((l) => l.qtdCompras > 0);
    if (linhas.length < 2) return;
    linhas.sort((a, b) => a.ticketMedio - b.ticketMedio);
    const maisBarato = linhas[0];
    const economiaEstimada = linhas.slice(1).reduce((s, l) => s + Math.max(0, (l.ticketMedio - maisBarato.ticketMedio) * l.qtdCompras), 0);
    grupos.push({ categoria, fornecedores: linhas, economiaEstimada: Math.round(economiaEstimada) });
  });
  return grupos.sort((a, b) => b.economiaEstimada - a.economiaEstimada);
}

export type FornecedorParado = { id: string; nome: string; diasParado: number; ultimaCompra: string };

// Fornecedor ativo, com histórico de compra, mas sem nenhuma conta_pagar recente.
// Quem nunca comprou não entra aqui — isso não é "parado", é "sem histórico ainda".
export function fornecedoresParados(fornecedores: FornecedorRow[], contas: ContaPagarRow[], diasLimite: number = 90): FornecedorParado[] {
  const hoje = Date.now();
  const out: FornecedorParado[] = [];
  fornecedores.filter((f) => (f.status || "ativo") === "ativo").forEach((f) => {
    const datas = contas.filter((c) => c.fornecedor_id === f.id && (c.data_emissao || c.data_vencimento))
      .map((c) => (c.data_emissao || c.data_vencimento) as string).sort();
    if (datas.length === 0) return;
    const ultima = datas[datas.length - 1];
    const dias = Math.round((hoje - new Date(ultima + "T00:00:00").getTime()) / 86400000);
    if (dias >= diasLimite) out.push({ id: f.id, nome: f.nome, diasParado: dias, ultimaCompra: ultima });
  });
  return out.sort((a, b) => b.diasParado - a.diasParado);
}

export type FornecedorPrecoAlto = { id: string; nome: string; categoria: string; ticketMedio: number; mediaGrupo: number; percentualAcima: number };

// "Preço acima do mercado" — Axioma não tem acesso a preço de mercado externo, então
// a comparação é 100% interna: ticket médio do fornecedor vs a média dos outros
// fornecedores da MESMA categoria. Só entra quem tem ≥2 fornecedores comparáveis.
export function precoAcimaMediaInterna(fornecedores: FornecedorRow[], contas: ContaPagarRow[], limitePct: number = 20): FornecedorPrecoAlto[] {
  const porCategoria = new Map<string, FornecedorRow[]>();
  fornecedores.filter((f) => (f.status || "ativo") === "ativo" && f.categoria).forEach((f) => {
    const cat = f.categoria as string;
    if (!porCategoria.has(cat)) porCategoria.set(cat, []);
    porCategoria.get(cat)!.push(f);
  });

  const out: FornecedorPrecoAlto[] = [];
  porCategoria.forEach((forns, categoria) => {
    const linhas = forns.map((f) => {
      const cf = contas.filter((c) => c.fornecedor_id === f.id);
      const totalGasto = cf.reduce((s, c) => s + (c.valor_total || 0), 0);
      return { id: f.id, nome: f.nome, ticketMedio: cf.length > 0 ? totalGasto / cf.length : 0, qtdCompras: cf.length };
    }).filter((l) => l.qtdCompras > 0);
    if (linhas.length < 2) return;
    const mediaGrupo = linhas.reduce((s, l) => s + l.ticketMedio, 0) / linhas.length;
    if (mediaGrupo <= 0) return;
    linhas.forEach((l) => {
      const percentualAcima = ((l.ticketMedio - mediaGrupo) / mediaGrupo) * 100;
      if (percentualAcima >= limitePct) out.push({ id: l.id, nome: l.nome, categoria, ticketMedio: l.ticketMedio, mediaGrupo, percentualAcima: Math.round(percentualAcima) });
    });
  });
  return out.sort((a, b) => b.percentualAcima - a.percentualAcima);
}

// ============================================================================
// FASE 5A — SIMULADOR EXECUTIVO POR FORNECEDOR.
// A simulação em si reaproveita 100% simularCenariosExecutivos (cfoCore.ts) —
// aqui só ficam as duas conversões pequenas e específicas de fornecedor que
// alimentam esse motor.
// ============================================================================

// Converte a variação em R$ de UM fornecedor num choque percentual sobre a base
// de custo relevante da empresa toda (a mesma unidade que simularCenariosExecutivos espera).
export function pctChoqueDoFornecedor(deltaValorMensal: number, baseMensalRelevante: number): number {
  if (baseMensalRelevante <= 0) return 0;
  return (deltaValorMensal / baseMensalRelevante) * 100;
}

// "Aumento/redução de prazo" não é custo — é caixa. Estimativa simplificada:
// mudar o prazo em X dias equivale a antecipar/adiar ~1/30 do valor mensal por dia.
// Não é um fluxo de caixa dia a dia real, é uma aproximação — deixado claro na tela.
export function estimativaCaixaPrazo(valorMensalFornecedor: number, deltaDiasPrazo: number): number {
  return (valorMensalFornecedor / 30) * deltaDiasPrazo;
}

// ============================================================================
// FASE 5B — REFORMA TRIBUTÁRIA 2026 POR FORNECEDOR (IVA dual — CBS/IBS).
// Axioma não inventa alíquota — as alíquotas finais do IBS/CBS ainda não estão
// regulamentadas. O que É real e calculável hoje: o potencial de cada fornecedor
// gerar crédito tributário no modelo de IVA (não-cumulativo), a partir do que já
// está no cadastro (Fase 1): tipo de pessoa, regime tributário, contribuinte de ICMS.
// ============================================================================

export type NivelCreditoReforma = "pleno" | "parcial" | "baixo" | "indefinido";
export type CreditoReformaFornecedor = { id: string; nome: string; categoria?: string | null; nivel: NivelCreditoReforma; motivo: string };

export function avaliarCreditoReforma(fornecedores: FornecedorRow[]): CreditoReformaFornecedor[] {
  return fornecedores.filter((f) => (f.status || "ativo") === "ativo").map((f) => {
    if (f.tipo_pessoa === "PF") return { id: f.id, nome: f.nome, categoria: f.categoria, nivel: "baixo" as const, motivo: "pessoa_fisica" };
    if (!f.tipo_pessoa || !f.regime_tributario) return { id: f.id, nome: f.nome, categoria: f.categoria, nivel: "indefinido" as const, motivo: "cadastro_incompleto" };
    if (f.regime_tributario === "simples" || f.regime_tributario === "mei") return { id: f.id, nome: f.nome, categoria: f.categoria, nivel: "parcial" as const, motivo: "simples_ou_mei" };
    if (f.regime_tributario === "presumido" || f.regime_tributario === "real") {
      return { id: f.id, nome: f.nome, categoria: f.categoria, nivel: f.contribuinte_icms === "sim" ? "pleno" as const : "parcial" as const, motivo: f.contribuinte_icms === "sim" ? "pj_contribuinte" : "pj_nao_contribuinte" };
    }
    return { id: f.id, nome: f.nome, categoria: f.categoria, nivel: "indefinido" as const, motivo: "cadastro_incompleto" };
  });
}

// ============================================================================
// ARQUITETURA PREPARADA (comentário only — não implementar antes de aprovação)
// ============================================================================
// Fase futura — Portal do Fornecedor: login próprio do fornecedor (tabela de convites +
//   RLS por fornecedor_id) para ele mesmo atualizar documentos/dados cadastrais.
// Fase futura — Homologação/Onboarding: workflow de aprovação com etapas e responsável,
//   status "em homologação" → "aprovado", histórico de quem aprovou.
// Fase futura — Cotação/RFQ: tabela de solicitações de cotação vinculada a fornecedor_produtos,
//   comparação de propostas entre fornecedores concorrentes para o mesmo item.
// Fase futura — Histórico de Qualidade: fornecedores.nivel_qualidade é um valor único
//   atual, sem linha do tempo. O alerta "Queda de Qualidade" (Fase 4) fica reservado sem
//   instância até existir uma tabela fornecedor_qualidade_historico (data + nota), pra
//   dar de fato pra medir tendência em vez de comparar um ponto só contra ele mesmo.
// Fase futura — IA Executiva real: quando ANTHROPIC_API_KEY for ativada, o mesmo padrão
//   já usado em Clientes (enviarPerguntaZIA) entra aqui — tenta POST /api/ia-chat com
//   {mensagem, historico, contexto}, cai no conselho por regras se falhar. Nenhuma chamada
//   de rede é feita na Fase 5, só o texto por regras.
// Fase futura — Reforma Tributária com valor em R$: quando o IBS/CBS estiver regulamentado
//   com alíquotas oficiais, avaliarCreditoReforma pode evoluir de nível (pleno/parcial/baixo)
//   para um cálculo de crédito em R$ de verdade, cruzando com o valor efetivo pago a cada
//   fornecedor (contas_pagar).
