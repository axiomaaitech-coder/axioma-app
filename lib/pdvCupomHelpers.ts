// 🦅 AXIOMA AI.TECH — PDV Fase 3, Etapas 3 e 4 (cupom não-fiscal + impressão
// automática/térmica). Lê nome/CNPJ/endereço de public.empresas (já
// cadastrados em /empresa) e a config de impressão (3 colunas novas — ver
// PDV-FASE3-ETAPA3-IMPRESSAO-CUPOM-SQL.sql e PDV-FASE3-ETAPA4-QZ-TRAY-SQL.sql).
// RLS de empresas já restringe UPDATE a "dono" (ver FIX-POLITICA-EMPRESAS-
// SQL.sql) — mesmo padrão anti-falha-silenciosa de definirPrecoVenda()
// (lib/pdvVendaHelpers.ts): 0 linhas sem error = sem permissão, não erro
// genérico.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type DadosEmpresaCupom = {
  nome: string;
  cnpj: string | null;
  endereco: string;
  impressaoAutomatica: boolean;
  rodape: string;
  impressora: string;
};

const PADRAO_CUPOM: DadosEmpresaCupom = { nome: "", cnpj: null, endereco: "", impressaoAutomatica: true, rodape: "", impressora: "" };

const COLUNAS_EMPRESA_CUPOM =
  "razao_social, nome_fantasia, nome, cnpj, logradouro, numero, complemento, bairro, cidade, uf, pdv_impressao_automatica, pdv_cupom_rodape, pdv_impressora_termica";

export async function obterDadosCupomEmpresa(empresaId: string): Promise<DadosEmpresaCupom> {
  const { data, error } = await supabase.from("empresas").select(COLUNAS_EMPRESA_CUPOM).eq("id", empresaId).maybeSingle();
  if (error || !data) {
    if (error) Sentry.captureException(new Error(`Falha ao carregar dados de cupom da empresa: ${error.message}`), { extra: { tabela: "empresas", operacao: "select", empresaId } });
    return PADRAO_CUPOM;
  }
  const enderecoPartes = [
    data.logradouro && data.numero ? `${data.logradouro}, ${data.numero}` : (data.logradouro || null),
    data.complemento || null,
    data.bairro || null,
    data.cidade && data.uf ? `${data.cidade}/${data.uf}` : (data.cidade || data.uf || null),
  ].filter(Boolean);
  return {
    nome: data.nome_fantasia || data.razao_social || data.nome || "",
    cnpj: data.cnpj || null,
    endereco: enderecoPartes.join(" — "),
    // pdv_impressao_automatica é NOT NULL DEFAULT true no banco — ?? true é
    // só rede de segurança pro caso raríssimo de vir null mesmo assim.
    impressaoAutomatica: data.pdv_impressao_automatica ?? true,
    rodape: data.pdv_cupom_rodape || "",
    impressora: data.pdv_impressora_termica || "",
  };
}

export async function salvarConfigCupom(
  empresaId: string, config: { impressaoAutomatica: boolean; rodape: string; impressora: string }
): Promise<{ erro?: string; semPermissao?: boolean }> {
  const { data, error } = await supabase.from("empresas")
    .update({
      pdv_impressao_automatica: config.impressaoAutomatica,
      pdv_cupom_rodape: config.rodape.trim() || null,
      pdv_impressora_termica: config.impressora.trim() || null,
    })
    .eq("id", empresaId).select("id");

  if (error) {
    Sentry.captureException(new Error(`Falha ao salvar config de impressão do PDV: ${error.message}`), { extra: { tabela: "empresas", operacao: "update", empresaId, motivo: error.message } });
    return { erro: error.message };
  }
  if (!data || data.length === 0) return { semPermissao: true };
  return {};
}
