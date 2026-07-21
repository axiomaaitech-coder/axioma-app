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
};

export type ContaPagarRow = {
  id: string; fornecedor_id: string | null; descricao: string; categoria?: string | null;
  valor_total: number; valor_pago: number;
  data_emissao?: string | null; data_vencimento?: string | null; data_pagamento?: string | null;
  status?: string | null;
};

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

export type ScoreFornecedor = { total: number; componentes: { nome: string; valor: number; peso: number }[]; amostraSuficiente: boolean };

// Score 0-100 — v1 transparente, só com o que é real hoje (status, qualidade e risco
// cadastrados na Fase 1, pontualidade de pagamento). Cada componente só entra se tiver
// dado — nunca completa com número inventado. Sempre explica o que pesou.
export function calcularScoreFornecedor(f: FornecedorRow, contasDoFornecedor: ContaPagarRow[]): ScoreFornecedor {
  const componentes: { nome: string; valor: number; peso: number }[] = [
    { nome: "status", valor: (f.status || "ativo") === "ativo" ? 100 : 0, peso: 20 },
  ];
  if (f.nivel_qualidade && PESO_QUALIDADE[f.nivel_qualidade]) {
    componentes.push({ nome: "qualidade", valor: (PESO_QUALIDADE[f.nivel_qualidade] / 4) * 100, peso: 30 });
  }
  if (f.classificacao_risco && PESO_RISCO[f.classificacao_risco]) {
    componentes.push({ nome: "risco", valor: 100 - ((PESO_RISCO[f.classificacao_risco] - 1) / 2) * 100, peso: 30 });
  }
  const pont = pontualidadePagamento(contasDoFornecedor);
  if (pont.pagas > 0) componentes.push({ nome: "pontualidade", valor: pont.percentual, peso: 20 });

  const pesoTotal = componentes.reduce((s, c) => s + c.peso, 0);
  const total = pesoTotal > 0 ? Math.round(componentes.reduce((s, c) => s + c.valor * c.peso, 0) / pesoTotal) : 0;
  return { total, componentes, amostraSuficiente: componentes.length >= 2 };
}

export function scoreMedioCarteira(fornecedores: FornecedorRow[], contas: ContaPagarRow[]): MetricaCarteira {
  const scores = fornecedores
    .map((f) => calcularScoreFornecedor(f, contas.filter((c) => c.fornecedor_id === f.id)))
    .filter((s) => s.amostraSuficiente);
  if (scores.length === 0) return { media: 0, amostra: 0, total: fornecedores.length, amostraSuficiente: false };
  const soma = scores.reduce((s, sc) => s + sc.total, 0);
  return { media: Math.round(soma / scores.length), amostra: scores.length, total: fornecedores.length, amostraSuficiente: scores.length >= 3 };
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
