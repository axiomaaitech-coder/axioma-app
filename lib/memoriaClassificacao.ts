// Memória de classificação (motor de aprendizado) — arquivo próprio para não criar volta
// de dependência: Importar Documentos e Contas a Pagar usam, e nenhum dos dois é usado por ela.
import * as Sentry from "@sentry/nextjs";
import { createBrowserClient } from "./supabaseBrowser";
import type { DestinoTabela } from "./importarParsers";
import { exigirLeitura, registrarLeitura } from "./erroUiHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// ============================================================================
// MOTOR DE APRENDIZADO — lembra como uma descrição parecida já foi
// classificada, pra SUGERIR (nunca decidir sozinho) da próxima vez (Fase 1).
// Números/datas somem da chave porque mudam a cada lançamento; o que
// identifica o padrão é o texto (ex: "UBER *TRIP 04/02" e "UBER *TRIP 05/03"
// viram a mesma chave "uber trip").
// ============================================================================

export function normalizarPadraoChave(descricao: string): string {
  return (descricao || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\d+/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

// Aprendizado por FORNECEDOR (Financial Core 2.2 — bloco A5): a descrição da nota muda
// a cada compra ("NF 4498…", "NF 4512…"), o CNPJ não. Mesma memória da descrição, chave própria.
export const chaveFornecedor = (cnpj: string) => `cnpj:${cnpj.replace(/\D/g, "")}`;

// Lote único (1 select + 1 upsert) por gravação — nunca 1 consulta por linha.
export async function atualizarPadroesClassificacao(
  empresaId: string,
  destino: DestinoTabela,
  linhas: { descricao?: string; categoria?: string; cnpj?: string }[]
): Promise<void> {
  if (!empresaId || linhas.length === 0) return;

  const contagem = new Map<string, { categoria: string | null; qtd: number }>();
  const contar = (chave: string, categoria: string | null) => {
    const atual = contagem.get(chave);
    if (atual) { atual.qtd++; if (categoria) atual.categoria = categoria; } // vale a escolha mais recente
    else contagem.set(chave, { categoria, qtd: 1 });
  };
  linhas.forEach((l) => {
    const chave = normalizarPadraoChave(l.descricao || "");
    if (chave) contar(chave, l.categoria || null);
    if (l.categoria && (l.cnpj || "").replace(/\D/g, "").length >= 11) contar(chaveFornecedor(l.cnpj!), l.categoria);
  });
  if (contagem.size === 0) return;

  const chaves = Array.from(contagem.keys());
  const existentes = await exigirLeitura(() => supabase
    .from("importacao_padroes_classificacao")
    .select("padrao_chave, ocorrencias")
    .eq("empresa_id", empresaId)
    .eq("destino_tabela", destino)
    .in("padrao_chave", chaves), "importarHelpers:609");

  const ocorrenciasExistentes = new Map((existentes || []).map((e: any) => [e.padrao_chave, e.ocorrencias]));

  const linhasUpsert = chaves.map((chave) => {
    const info = contagem.get(chave)!;
    return {
      empresa_id: empresaId,
      padrao_chave: chave,
      destino_tabela: destino,
      categoria: info.categoria,
      ocorrencias: (ocorrenciasExistentes.get(chave) || 0) + info.qtd,
      ultima_vez_usado: new Date().toISOString(),
    };
  });

  // varredura:ok — upsert de aprendizado; erro checado abaixo (não bloqueia a importação)
  const { error } = await supabase
    .from("importacao_padroes_classificacao")
    .upsert(linhasUpsert, { onConflict: "empresa_id,padrao_chave,destino_tabela" });
  // Cache de sugestão — se falhar, só perde o aprendizado desta leva (a
  // importação em si já terminou); não bloqueia nem avisa o usuário.
  if (error) reportarFalhaEscrita("importacao_padroes_classificacao", "upsert", error.message);
}

export type SugestaoClassificacao = { destino: DestinoTabela; categoria: string | null; confianca: number };

// Categoria que você escolheu nas importações anteriores DESTE fornecedor (null = nunca importou).
export async function categoriaAprendidaDoFornecedor(empresaId: string, cnpj: string, destino: DestinoTabela): Promise<string | null> {
  if ((cnpj || "").replace(/\D/g, "").length < 11) return null;
  const data = await registrarLeitura(() => supabase.from("importacao_padroes_classificacao").select("categoria")
    .eq("empresa_id", empresaId).eq("destino_tabela", destino).eq("padrao_chave", chaveFornecedor(cnpj)).maybeSingle(), "importarHelpers:644");
  return (data?.categoria as string | null) ?? null;
}

// 1 consulta só, pra todas as descrições novas de um arquivo de uma vez —
// a UI usa pra pré-sugerir categoria/destino, sem decidir por conta própria.
export async function sugerirClassificacoes(
  empresaId: string | null,
  descricoes: string[]
): Promise<Map<string, SugestaoClassificacao>> {
  const mapa = new Map<string, SugestaoClassificacao>();
  if (!empresaId) return mapa;

  const chaves = Array.from(new Set(descricoes.map(normalizarPadraoChave).filter(Boolean)));
  if (chaves.length === 0) return mapa;

  const data = await registrarLeitura(() => supabase
    .from("importacao_padroes_classificacao")
    .select("padrao_chave, destino_tabela, categoria, ocorrencias")
    .eq("empresa_id", empresaId)
    .in("padrao_chave", chaves), "importarHelpers:661");

  (data || []).forEach((p: any) => {
    const atual = mapa.get(p.padrao_chave);
    if (!atual || p.ocorrencias > atual.confianca) {
      mapa.set(p.padrao_chave, { destino: p.destino_tabela, categoria: p.categoria, confianca: p.ocorrencias });
    }
  });

  return mapa;
}
