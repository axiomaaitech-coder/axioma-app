// 🦅 AXIOMA AI.TECH - Sugestão Inteligente (autocomplete por histórico da empresa)
// Ponto único de onde qualquer campo do app pede sugestão de valor já usado
// antes. Modo atual: "regra" (histórico agregado no banco, ver
// ESTOQUE-FASE3-SUGESTOES-SQL.sql). Trocar pra IA depois é só mudar o corpo
// destas 3 funções — quem chama (os campos da tela) não muda nada.

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Colunas de produtos elegíveis pra sugestão por histórico — mesma lista
// aceita pela função estoque_sugestoes_coluna() no banco (whitelist lá
// também, dupla checagem).
export type ColunaComSugestao = "rua" | "prateleira" | "nivel" | "posicao" | "conta_contabil";

export type ComboLocalizacao = { rua: string | null; prateleira: string | null; nivel: string | null; posicao: string | null; usos: number };

// MODO: hoje só "regra" (histórico via RPC). Quando ligar IA (fase futura),
// trocar aqui por algo como:
//   const MODO: "regra" | "ia" = process.env.NEXT_PUBLIC_SUGESTAO_MODO === "ia" ? "ia" : "regra";
// e, dentro de cada função abaixo, um `if (MODO === "ia") return await sugerirComIA(...)`
// chamando um serviço de LLM — sem mexer em quem chama buscarSugestoesColuna/
// buscarSugestoesAtributo/buscarCombosLocalizacao no restante do app.

export async function buscarSugestoesColuna(empresaId: string, coluna: ColunaComSugestao): Promise<string[]> {
  const { data, error } = await supabase.rpc("estoque_sugestoes_coluna", { p_empresa_id: empresaId, p_coluna: coluna });
  if (error || !data) return [];
  return data.map((d: any) => d.valor).filter(Boolean);
}

export async function buscarSugestoesAtributo(empresaId: string, chave: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("estoque_sugestoes_atributo", { p_empresa_id: empresaId, p_chave: chave });
  if (error || !data) return [];
  return data.map((d: any) => d.valor).filter(Boolean);
}

export async function buscarCombosLocalizacao(empresaId: string): Promise<ComboLocalizacao[]> {
  const { data, error } = await supabase.rpc("estoque_sugestoes_localizacao", { p_empresa_id: empresaId });
  if (error || !data) return [];
  return data;
}
