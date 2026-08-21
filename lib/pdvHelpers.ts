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
  // Opcional pra busca de venda (frente de caixa procura em todos os
  // nichos); a navegação do Catálogo sempre passa um segmento.
  segmento?: string;
  categoria?: string;
  subNicho?: string; // SEM_SUBNICHO pro bucket "sem sub-nicho definido"
  busca?: string;
  pagina?: number;
};

// Papel "operador" nunca lê a tabela crua — a RLS de PDV-FASE0 já bloqueia
// por LINHA (empresas_do_usuario_operacional()), então essa troca de fonte é
// o que permite ele enxergar produto algum, com as colunas seguras da
// vw_produtos_seguro (ver PDV-FASE3-ETAPA0-OPERADOR-PRODUTOS-SQL.sql).
// Qualquer outro papel continua na tabela crua, comportamento inalterado.
export async function listarProdutosPdv(empresaId: string, filtro: FiltroProdutosPdv, papel?: string | null): Promise<{ dados: ProdutoPdv[]; total: number }> {
  const pagina = filtro.pagina ?? 0;
  const de = pagina * PDV_PAGE_SIZE;
  const ate = de + PDV_PAGE_SIZE - 1;

  const fonte = papel === "operador" ? "vw_produtos_seguro" : "produtos";
  let query = supabase.from(fonte).select(COLUNAS_SEGURAS, { count: "exact" })
    .eq("empresa_id", empresaId).eq("status", "ativo");

  if (filtro.segmento) query = query.eq("segmento", filtro.segmento);
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

// ============================================================================
// TELA "PRODUTOS CADASTRADOS" — lista completa (sem paginação) pra montar a
// árvore nicho→categoria→sub-nicho agrupada no cliente. Teto generoso (5000)
// no mesmo espírito column-only/com limite das funções acima; dono/admin só,
// nunca a fonte vw_produtos_seguro do operador (esta tela não é dele).
// ============================================================================
export async function listarTodosProdutosPdv(empresaId: string): Promise<ProdutoPdv[]> {
  const { data, error } = await supabase.from("produtos").select(COLUNAS_SEGURAS)
    .eq("empresa_id", empresaId).eq("status", "ativo")
    .order("nome", { ascending: true }).limit(5000);
  if (error) return [];
  return (data as unknown as ProdutoPdv[]) || [];
}

// ============================================================================
// FASE 2 — CADASTRO: cascata (camada 3, IA) + checagem de duplicidade
// ============================================================================

// Camadas 1 (buscarProdutoPorCodigo) e 2 (consultarEan) já existem em
// estoqueHelpers.ts e são reaproveitadas tal e qual pelo formulário do PDV —
// só a camada 3 (IA) é nova, porque só ela não existia antes desta fase.
export type ConsultaIaResposta =
  | { status: "nao_configurado" }
  | { status: "nao_encontrado" }
  | { status: "erro"; mensagem?: string }
  | { status: "ok"; nome?: string; marca?: string; categoria?: string };

export async function consultarIA(ean: string, idioma: string): Promise<ConsultaIaResposta> {
  try {
    const resp = await fetch(`/api/produto/consulta-ia?ean=${encodeURIComponent(ean)}&idioma=${encodeURIComponent(idioma)}`);
    return await resp.json();
  } catch {
    return { status: "erro" };
  }
}

// Produto sem código de barras (típico de serviço) não passa pela Camada 1 —
// única defesa contra duplicar é comparar nome, dentro do mesmo nicho/empresa.
// ILIKE sem "%" já é comparação exata *case-insensitive* no Postgres — não é
// busca difusa, é "mesmo nome, ignorando maiúscula/minúscula".
export async function verificarNomeDuplicado(empresaId: string, segmento: string, nome: string): Promise<{ id: string; nome: string } | null> {
  const termo = nome.trim();
  if (!termo) return null;
  const { data } = await supabase.from("produtos").select("id, nome")
    .eq("empresa_id", empresaId).eq("segmento", segmento).eq("status", "ativo")
    .ilike("nome", termo)
    .limit(1).maybeSingle();
  return data || null;
}
