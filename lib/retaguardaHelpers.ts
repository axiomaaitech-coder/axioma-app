// 🦅 AXIOMA AI.TECH — PDV: Retaguarda do Caixa (dados). Toda leitura/escrita
// sensível (resumo do dia, vendas por categoria, itens com prejuízo,
// fechamento de turno, sangria/suprimento, config) passa pelas funções
// SECURITY DEFINER retaguarda_* (PDV-RETAGUARDA-SQL-REVISAO.txt, aplicado) —
// elas recusam quem não é dono/admin na primeira linha (erro AX020), então
// mesmo que este arquivo seja chamado por engano fora da tela certa, o
// servidor já bloqueia. Só listarTurnosAbertos() é query direta (turno_caixa
// não expõe custo/lucro, é a mesma tabela que a Frente de Caixa já lê hoje).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { publicarEventoNaoBloqueante } from "./contabilidadeConsumidor";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function obterUsuarioAtualId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

export type ModoRetaguarda = "ao_vivo" | "fechamento" | "ambos";

export type ConfigRetaguarda = {
  modo: ModoRetaguarda;
  conferirGaveta: boolean;
  verLucro: boolean;
};

const CONFIG_PADRAO: ConfigRetaguarda = { modo: "ambos", conferirGaveta: true, verLucro: true };

export async function obterConfigRetaguarda(empresaId: string): Promise<ConfigRetaguarda> {
  const { data, error } = await supabase.from("empresas")
    .select("retaguarda_modo, retaguarda_conferir_gaveta, retaguarda_ver_lucro")
    .eq("id", empresaId).maybeSingle();
  if (error || !data) {
    if (error) Sentry.captureException(new Error(`Falha ao carregar config da retaguarda: ${error.message}`), { extra: { tabela: "empresas", operacao: "select", empresaId } });
    return CONFIG_PADRAO;
  }
  return {
    modo: (data.retaguarda_modo as ModoRetaguarda) || "ambos",
    conferirGaveta: data.retaguarda_conferir_gaveta ?? true,
    verLucro: data.retaguarda_ver_lucro ?? true,
  };
}

export async function salvarConfigRetaguarda(
  empresaId: string, config: ConfigRetaguarda
): Promise<{ erro?: string; codigo?: string }> {
  const { error } = await supabase.rpc("retaguarda_salvar_config", {
    p_empresa_id: empresaId, p_modo: config.modo,
    p_conferir_gaveta: config.conferirGaveta, p_ver_lucro: config.verLucro,
  });
  if (error) {
    Sentry.captureException(new Error(`Falha ao salvar config da retaguarda: ${error.message}`), { extra: { operacao: "rpc:retaguarda_salvar_config", empresaId, motivo: error.message } });
    return { erro: error.message, codigo: error.code };
  }
  return {};
}

// Data no formato YYYY-MM-DD do FUSO DO NAVEGADOR (loja), não UTC — uma
// venda feita às 23h de um dia no Brasil não pode virar "amanhã" só porque
// o servidor do banco está em outro fuso.
export function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type ResumoDia = {
  totalVendido: number;
  qtdVendas: number;
  ticketMedio: number;
  lucroReal: number | null;
  itensSemCusto: number;
};

export async function obterResumoDia(empresaId: string, data: string): Promise<{ resumo?: ResumoDia; erro?: string; codigo?: string }> {
  const { data: linhas, error } = await supabase.rpc("retaguarda_resumo_dia", { p_empresa_id: empresaId, p_data: data });
  if (error) return { erro: error.message, codigo: error.code };
  const l = Array.isArray(linhas) ? linhas[0] : linhas;
  if (!l) return { resumo: { totalVendido: 0, qtdVendas: 0, ticketMedio: 0, lucroReal: null, itensSemCusto: 0 } };
  return {
    resumo: {
      totalVendido: Number(l.total_vendido) || 0,
      qtdVendas: Number(l.qtd_vendas) || 0,
      ticketMedio: Number(l.ticket_medio) || 0,
      lucroReal: l.lucro_real === null || l.lucro_real === undefined ? null : Number(l.lucro_real),
      itensSemCusto: Number(l.itens_sem_custo) || 0,
    },
  };
}

export type VendaPorCategoria = {
  nicho: string; categoria: string; subNicho: string;
  quantidade: number; valorVendido: number; lucroReal: number | null;
};

export async function obterVendasPorCategoria(empresaId: string, data: string): Promise<{ dados: VendaPorCategoria[]; erro?: string; codigo?: string }> {
  const { data: linhas, error } = await supabase.rpc("retaguarda_vendas_por_categoria", { p_empresa_id: empresaId, p_data: data });
  if (error) return { dados: [], erro: error.message, codigo: error.code };
  return {
    dados: (linhas || []).map((l: any) => ({
      nicho: l.nicho, categoria: l.categoria, subNicho: l.sub_nicho,
      quantidade: Number(l.quantidade) || 0, valorVendido: Number(l.valor_vendido) || 0,
      lucroReal: l.lucro_real === null || l.lucro_real === undefined ? null : Number(l.lucro_real),
    })),
  };
}

export type VendaPorProduto = {
  produtoId: string; produtoNome: string; nicho: string; categoria: string; subNicho: string;
  quantidade: number; valorVendido: number; lucroReal: number | null; saldoAtual: number;
};

// 1 linha por produto vendido no dia — já com categoria/sub-nicho e o
// estoque atual, pra tela agregar em memória os níveis de navegação
// (Categoria → Sub-nicho → Produtos) sem uma chamada por nível.
export async function obterVendasPorProduto(empresaId: string, data: string): Promise<{ dados: VendaPorProduto[]; erro?: string; codigo?: string }> {
  const { data: linhas, error } = await supabase.rpc("retaguarda_vendas_por_produto", { p_empresa_id: empresaId, p_data: data });
  if (error) return { dados: [], erro: error.message, codigo: error.code };
  return {
    dados: (linhas || []).map((l: any) => ({
      produtoId: l.produto_id, produtoNome: l.produto_nome, nicho: l.nicho, categoria: l.categoria, subNicho: l.sub_nicho,
      quantidade: Number(l.quantidade) || 0, valorVendido: Number(l.valor_vendido) || 0,
      lucroReal: l.lucro_real === null || l.lucro_real === undefined ? null : Number(l.lucro_real),
      saldoAtual: Number(l.saldo_atual) || 0,
    })),
  };
}

export type VendaDetalheProduto = {
  vendaId: string; horario: string; quantidade: number; precoUnitario: number; subtotal: number;
};

// 1 linha por VENDA individual de um produto no dia — usada só quando o
// dono abre o modal de detalhe de um produto específico (Nível 4).
export async function obterVendasProdutoDetalhe(empresaId: string, produtoId: string, data: string): Promise<{ dados: VendaDetalheProduto[]; erro?: string; codigo?: string }> {
  const { data: linhas, error } = await supabase.rpc("retaguarda_vendas_produto_detalhe", { p_empresa_id: empresaId, p_produto_id: produtoId, p_data: data });
  if (error) return { dados: [], erro: error.message, codigo: error.code };
  return {
    dados: (linhas || []).map((l: any) => ({
      vendaId: l.venda_id, horario: l.horario, quantidade: Number(l.quantidade) || 0,
      precoUnitario: Number(l.preco_unitario) || 0, subtotal: Number(l.subtotal) || 0,
    })),
  };
}

export type ItemPrejuizo = {
  vendaId: string; produtoNome: string; quantidade: number;
  precoUnitario: number; custoUnitario: number; prejuizoUnitario: number;
};

export async function obterItensPrejuizo(empresaId: string, data: string): Promise<{ dados: ItemPrejuizo[]; erro?: string; codigo?: string }> {
  const { data: linhas, error } = await supabase.rpc("retaguarda_itens_prejuizo", { p_empresa_id: empresaId, p_data: data });
  if (error) return { dados: [], erro: error.message, codigo: error.code };
  return {
    dados: (linhas || []).map((l: any) => ({
      vendaId: l.venda_id, produtoNome: l.produto_nome, quantidade: Number(l.quantidade) || 0,
      precoUnitario: Number(l.preco_unitario_venda) || 0, custoUnitario: Number(l.custo_unitario_na_venda) || 0,
      prejuizoUnitario: Number(l.prejuizo_unitario) || 0,
    })),
  };
}

export type ComposicaoLinha = {
  componente: "abertura" | "venda" | "suprimento" | "sangria";
  referenciaId: string | null;
  numeroSequencial: number | null;
  horario: string;
  valor: number;
  produtoPrincipal: string | null;
  qtdItens: number | null;
  motivo: string | null;
};

// Decomposição do "Esperado" linha a linha — pra dono/admin auditarem de
// onde vem cada centavo antes de fechar o caixa (ou depois, revendo o
// fechamento). Funciona com o turno aberto OU fechado.
export async function obterComposicaoEsperado(turnoCaixaId: string): Promise<{ dados: ComposicaoLinha[]; erro?: string; codigo?: string }> {
  const { data: linhas, error } = await supabase.rpc("retaguarda_composicao_esperado", { p_turno_caixa_id: turnoCaixaId });
  if (error) return { dados: [], erro: error.message, codigo: error.code };
  return {
    dados: (linhas || []).map((l: any) => ({
      componente: l.componente, referenciaId: l.referencia_id,
      numeroSequencial: l.numero_sequencial === null || l.numero_sequencial === undefined ? null : Number(l.numero_sequencial),
      horario: l.horario, valor: Number(l.valor) || 0,
      produtoPrincipal: l.produto_principal,
      qtdItens: l.qtd_itens === null || l.qtd_itens === undefined ? null : Number(l.qtd_itens),
      motivo: l.motivo,
    })),
  };
}

export type TurnoAberto = { id: string; caixaNome: string; valorAbertura: number; abertoEm: string };

export async function listarTurnosAbertos(empresaId: string): Promise<TurnoAberto[]> {
  const { data, error } = await supabase.from("turno_caixa")
    .select("id, valor_abertura, aberto_em, caixa(nome)")
    .eq("empresa_id", empresaId).eq("status", "aberto")
    .order("aberto_em", { ascending: true });
  if (error) {
    Sentry.captureException(new Error(`Falha ao listar turnos abertos: ${error.message}`), { extra: { tabela: "turno_caixa", operacao: "select", empresaId } });
    return [];
  }
  return (data || []).map((t: any) => ({
    id: t.id, caixaNome: t.caixa?.nome || "—",
    valorAbertura: Number(t.valor_abertura) || 0, abertoEm: t.aberto_em,
  }));
}

export type ResultadoFechamento = {
  turnoId: string; valorEsperado: number; valorContado: number | null; diferenca: number | null;
};

export async function fecharTurno(
  turnoCaixaId: string, valorContado: number | null, observacao?: string
): Promise<{ resultado?: ResultadoFechamento; erro?: string; codigo?: string }> {
  const { data, error } = await supabase.rpc("retaguarda_fechar_turno", {
    p_turno_caixa_id: turnoCaixaId, p_valor_contado: valorContado, p_observacao: observacao || null,
  });
  if (error) return { erro: error.message, codigo: error.code };
  const l = Array.isArray(data) ? data[0] : data;
  if (!l) return { erro: "RPC retaguarda_fechar_turno não devolveu resultado" };
  return {
    resultado: {
      turnoId: l.turno_id,
      valorEsperado: Number(l.valor_esperado) || 0,
      valorContado: l.valor_contado === null || l.valor_contado === undefined ? null : Number(l.valor_contado),
      diferenca: l.diferenca === null || l.diferenca === undefined ? null : Number(l.diferenca),
    },
  };
}

export async function registrarMovimentacao(
  turnoCaixaId: string, tipo: "sangria" | "suprimento", valor: number, motivo?: string
): Promise<{ id?: string; erro?: string; codigo?: string }> {
  const { data, error } = await supabase.rpc("retaguarda_registrar_movimentacao", {
    p_turno_caixa_id: turnoCaixaId, p_tipo: tipo, p_valor: valor, p_motivo: motivo || null,
  });
  if (error) return { erro: error.message, codigo: error.code };
  const id = data as string;
  // COMMIT 11 — liga ao ledger contábil. A RPC (SECURITY DEFINER) só devolve
  // o id da linha criada, não o empresa_id — busca de volta pra publicar o
  // evento com o campo que publicarEventoNaoBloqueante exige. Falha nessa
  // leitura nunca desfaz a sangria/suprimento, que já foi gravada de verdade
  // pela RPC acima — só perde o lançamento contábil, reportado no Sentry
  // como toda falha silenciosa deste projeto.
  const { data: mov } = await supabase.from("caixa_movimentacao").select("empresa_id, criado_em").eq("id", id).maybeSingle();
  if (mov?.empresa_id) {
    publicarEventoNaoBloqueante(mov.empresa_id, tipo === "sangria" ? "CASH_WITHDRAWAL" : "CASH_DEPOSIT",
      { valor, data_hora: mov.criado_em, motivo: motivo || null },
      { modulo: "pdv_retaguarda", tabela: "caixa_movimentacao", id });
  } else {
    Sentry.captureException(new Error(`Falha ao ler empresa_id de caixa_movimentacao para publicar evento contábil`), { extra: { tabela: "caixa_movimentacao", id } });
  }
  return { id };
}

export type MovimentacaoCaixa = {
  id: string; tipo: "sangria" | "suprimento"; valor: number; motivo: string | null;
  usuarioId: string; criadoEm: string;
};

// Leitura direta da tabela (RLS já libera SELECT pra dono/admin da empresa —
// ver PDV-RETAGUARDA-SQL-REVISAO.txt, Parte A) — sem RPC pra isso, só a
// ESCRITA (criar/editar/excluir) passa por função.
export async function listarMovimentacoesTurno(turnoCaixaId: string): Promise<MovimentacaoCaixa[]> {
  const { data, error } = await supabase.from("caixa_movimentacao")
    .select("id, tipo, valor, motivo, usuario_id, criado_em")
    .eq("turno_caixa_id", turnoCaixaId)
    .order("criado_em", { ascending: true });
  if (error) {
    Sentry.captureException(new Error(`Falha ao listar movimentações do turno: ${error.message}`), { extra: { tabela: "caixa_movimentacao", operacao: "select", turnoCaixaId } });
    return [];
  }
  return (data || []).map((m: any) => ({
    id: m.id, tipo: m.tipo, valor: Number(m.valor) || 0, motivo: m.motivo,
    usuarioId: m.usuario_id, criadoEm: m.criado_em,
  }));
}

export async function editarMovimentacao(
  movimentacaoId: string, valor: number, motivo?: string
): Promise<{ erro?: string; codigo?: string }> {
  const { error } = await supabase.rpc("retaguarda_editar_movimentacao", {
    p_movimentacao_id: movimentacaoId, p_valor: valor, p_motivo: motivo || null,
  });
  if (error) return { erro: error.message, codigo: error.code };
  // Achado do Elias (2026-09-02): editar não pode deixar o lançamento antigo
  // órfão com o valor errado — o consumidor estorna (lançamento novo, nunca
  // UPDATE no já gravado) e relança com o valor certo. tipo nunca muda aqui
  // (a RPC só aceita valor/motivo — ver "tipoNaoMuda" na tela), então o valor
  // NOVO junto do tipo já gravado é o suficiente pro consumidor relançar.
  const { data: mov } = await supabase.from("caixa_movimentacao").select("empresa_id, tipo, criado_em").eq("id", movimentacaoId).maybeSingle();
  if (mov?.empresa_id) {
    publicarEventoNaoBloqueante(mov.empresa_id, "CASH_MOVEMENT_UPDATED",
      { tipo: mov.tipo, valor_depois: valor, data_hora: mov.criado_em },
      { modulo: "pdv_retaguarda", tabela: "caixa_movimentacao", id: movimentacaoId });
  } else {
    Sentry.captureException(new Error(`Falha ao ler empresa_id de caixa_movimentacao para publicar evento contábil (editar)`), { extra: { tabela: "caixa_movimentacao", id: movimentacaoId } });
  }
  return {};
}

export async function excluirMovimentacao(movimentacaoId: string): Promise<{ erro?: string; codigo?: string }> {
  // Lê ANTES de excluir — depois da RPC a linha já não existe mais pra buscar
  // o empresa_id de volta.
  const { data: antes } = await supabase.from("caixa_movimentacao").select("empresa_id").eq("id", movimentacaoId).maybeSingle();
  const { error } = await supabase.rpc("retaguarda_excluir_movimentacao", { p_movimentacao_id: movimentacaoId });
  if (error) return { erro: error.message, codigo: error.code };
  // Achado do Elias (2026-09-02): excluir não pode deixar o lançamento já
  // gravado órfão — o consumidor estorna (lançamento novo, nunca DELETE no
  // já gravado).
  if (antes?.empresa_id) {
    publicarEventoNaoBloqueante(antes.empresa_id, "CASH_MOVEMENT_DELETED",
      {}, { modulo: "pdv_retaguarda", tabela: "caixa_movimentacao", id: movimentacaoId });
  } else {
    Sentry.captureException(new Error(`Falha ao ler empresa_id de caixa_movimentacao para publicar evento contábil (excluir)`), { extra: { tabela: "caixa_movimentacao", id: movimentacaoId } });
  }
  return {};
}
