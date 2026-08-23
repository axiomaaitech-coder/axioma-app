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

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    return { erro: error.message, codigo: (error as any).code };
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
  if (error) return { erro: error.message, codigo: (error as any).code };
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
  if (error) return { dados: [], erro: error.message, codigo: (error as any).code };
  return {
    dados: (linhas || []).map((l: any) => ({
      nicho: l.nicho, categoria: l.categoria, subNicho: l.sub_nicho,
      quantidade: Number(l.quantidade) || 0, valorVendido: Number(l.valor_vendido) || 0,
      lucroReal: l.lucro_real === null || l.lucro_real === undefined ? null : Number(l.lucro_real),
    })),
  };
}

export type ItemPrejuizo = {
  vendaId: string; produtoNome: string; quantidade: number;
  precoUnitario: number; custoUnitario: number; prejuizoUnitario: number;
};

export async function obterItensPrejuizo(empresaId: string, data: string): Promise<{ dados: ItemPrejuizo[]; erro?: string; codigo?: string }> {
  const { data: linhas, error } = await supabase.rpc("retaguarda_itens_prejuizo", { p_empresa_id: empresaId, p_data: data });
  if (error) return { dados: [], erro: error.message, codigo: (error as any).code };
  return {
    dados: (linhas || []).map((l: any) => ({
      vendaId: l.venda_id, produtoNome: l.produto_nome, quantidade: Number(l.quantidade) || 0,
      precoUnitario: Number(l.preco_unitario_venda) || 0, custoUnitario: Number(l.custo_unitario_na_venda) || 0,
      prejuizoUnitario: Number(l.prejuizo_unitario) || 0,
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
  if (error) return { erro: error.message, codigo: (error as any).code };
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
  if (error) return { erro: error.message, codigo: (error as any).code };
  return { id: data as string };
}
