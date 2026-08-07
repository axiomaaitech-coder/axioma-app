// 🦅 AXIOMA AI.TECH — PDV: consultas do Catálogo (Fase 1, só navegação)
// Nunca duplica o que o Estoque já faz: contagem por nicho reaproveita
// carregarContagemPorSegmento() de estoqueHelpers.ts (mesma view
// vw_estoque_por_segmento). Este arquivo só existe pra cobrir o que o
// Estoque NÃO tem — leitura com colunas restritas (sem custo/margem, mesmo
// dono usando por enquanto — arquitetura já pronta pro dia em que o operador
// entrar, Fase 3) e navegação por categoria/sub-nicho real, não só a árvore
// curada (produto cadastrado com texto livre precisa continuar achável,
// nunca some da navegação).

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const PDV_PAGE_SIZE = 24;

// Marcador interno (nunca gravado no banco) pro bucket "sem sub-nicho
// definido" — subcategoria nula ou vazia, que é o caso de praticamente todo
// produto cadastrado antes desta fase (campo sempre existiu livre, nunca foi
// preenchido por nenhum fluxo automatizado).
export const SEM_SUBNICHO = "__sem_subnicho__";

export type ProdutoPdv = {
  id: string;
  nome: string;
  codigo_barras: string | null;
  sku: string | null;
  categoria: string | null;
  subcategoria: string | null;
  segmento: string | null;
  preco_venda: number | null;
  preco_sugerido: number | null;
  saldo_disponivel: number;
  status: "ativo" | "inativo";
};

// Nunca "*", nunca preco_custo/preco_medio/margem/markup — column-level
// security de propósito (ver PDV-FASE0-EQUIPE-OPERADOR-SQL.sql, nota final).
const COLUNAS_SEGURAS = "id, nome, codigo_barras, sku, categoria, subcategoria, segmento, preco_venda, preco_sugerido, saldo_disponivel, status";

// ============================================================================
// ETAPA 2/3 — categorias e sub-nichos REAIS presentes no banco (além da
// árvore curada), pra nenhum produto ficar inalcançável só porque foi
// cadastrado com texto livre diferente do dicionário. Column-only, sempre
// filtrado pelo nível anterior (nunca varre a tabela toda), com teto —
// mesmo espírito de "agregação no banco", numa fatia já pequena.
// ============================================================================

export async function listarCategoriasReais(empresaId: string, segmento: string): Promise<string[]> {
  const { data } = await supabase.from("produtos").select("categoria")
    .eq("empresa_id", empresaId).eq("segmento", segmento).eq("status", "ativo")
    .not("categoria", "is", null).limit(500);
  const vistos = new Set<string>();
  for (const linha of data || []) {
    const valor = (linha as any).categoria?.trim();
    if (valor) vistos.add(valor);
  }
  return Array.from(vistos).sort();
}

export async function listarSubNichosReais(empresaId: string, segmento: string, categoria: string): Promise<string[]> {
  const { data } = await supabase.from("produtos").select("subcategoria")
    .eq("empresa_id", empresaId).eq("segmento", segmento).eq("categoria", categoria).eq("status", "ativo")
    .not("subcategoria", "is", null).limit(500);
  const vistos = new Set<string>();
  for (const linha of data || []) {
    const valor = (linha as any).subcategoria?.trim();
    if (valor) vistos.add(valor);
  }
  return Array.from(vistos).sort();
}

// ============================================================================
// ETAPA 4 — folha: lista paginada de produtos, colunas restritas
// ============================================================================

export type FiltroProdutosPdv = {
  segmento: string;
  categoria?: string;
  subNicho?: string; // SEM_SUBNICHO pro bucket "sem sub-nicho definido"
  busca?: string;
  pagina?: number;
};

export async function listarProdutosPdv(empresaId: string, filtro: FiltroProdutosPdv): Promise<{ dados: ProdutoPdv[]; total: number }> {
  const pagina = filtro.pagina ?? 0;
  const de = pagina * PDV_PAGE_SIZE;
  const ate = de + PDV_PAGE_SIZE - 1;

  let query = supabase.from("produtos").select(COLUNAS_SEGURAS, { count: "exact" })
    .eq("empresa_id", empresaId).eq("segmento", filtro.segmento).eq("status", "ativo");

  if (filtro.categoria) query = query.eq("categoria", filtro.categoria);
  if (filtro.subNicho === SEM_SUBNICHO) query = query.or("subcategoria.is.null,subcategoria.eq.");
  else if (filtro.subNicho) query = query.eq("subcategoria", filtro.subNicho);

  if (filtro.busca && filtro.busca.trim()) {
    const termo = filtro.busca.trim();
    query = query.or(`nome.ilike.%${termo}%,codigo_barras.ilike.%${termo}%,sku.ilike.%${termo}%`);
  }

  const { data, count, error } = await query.order("nome", { ascending: true }).range(de, ate);
  if (error) return { dados: [], total: 0 };
  return { dados: (data as unknown as ProdutoPdv[]) || [], total: count || 0 };
}
