// ═══════════════════════════════════════════════════════════════
// AXIOMA AI.TECH — bcbApi.ts
// Indicadores macro REAIS (Selic, CDI, IPCA acumulado 12m, dólar PTAX)
// via API pública do Banco Central (SGS), sem chave e sem custo.
// FONTE ÚNICA (regra do Elias 2026-10-07: "todos os dados têm que bater entre os
// módulos"): lê PRIMEIRO a base do Nexus — a mesma dos cards do Nexus, do José e da
// IA, que já tem fontes reserva (IBGE, IPEA, Copom, BCE). A API do BC na hora só
// completa o que faltar; números fixos só se tudo estiver fora do ar.
// ═══════════════════════════════════════════════════════════════

import { hojeISO } from "./datas";

export type IndicadoresMacro = {
  selic: number;       // % a.a. (meta Selic)
  cdi: number;         // % a.a.
  ipca12m: number;      // % acumulado 12 meses
  usdBrl: number;       // PTAX venda
  fonte: "bcb" | "nexus" | "fallback";
};

// Último recurso (BC e Nexus fora do ar ao mesmo tempo). Revisado em 2026-10-07.
export const FALLBACK_MACRO: IndicadoresMacro = { selic: 13.75, cdi: 13.65, ipca12m: 4.5, usdBrl: 5.0, fonte: "fallback" };

const SERIE_SELIC = 432;
// 4389 = CDI anualizado (% a.a.). A série 12 é a taxa DIÁRIA (~0,05% ao dia) — usada
// aqui por engano até 2026-10-07, fazia o CDI aparecer como 0,05% em Investimentos.
const SERIE_CDI = 4389;
const SERIE_IPCA_MENSAL = 433;
const SERIE_USD = 1;

async function buscarUltimosValores(codigo: number, n: number): Promise<number[] | null> {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${n}?formato=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    return json.map((item: any) => parseFloat(String(item.valor).replace(",", ".")));
  } catch {
    return null;
  }
}

// IPCA acumulado 12 meses = composição das 12 variações mensais, não a soma simples.
function acumular12Meses(variacoesMensais: number[]): number {
  const fator = variacoesMensais.reduce((acc, v) => acc * (1 + v / 100), 1);
  return (fator - 1) * 100;
}

export async function buscarIndicadoresMacro(): Promise<IndicadoresMacro> {
  // CDI anualizado não fica na base do Nexus: vem sempre da mesma série do BC (4389).
  const [nexus, cdiArr] = await Promise.all([ultimosDoNexus(), buscarUltimosValores(SERIE_CDI, 1)]);
  const falta = { selic: nexus.selic == null, ipca: nexus.ipca12m == null, usd: nexus.usdBrl == null };
  const [selicArr, ipcaArr, usdArr] = await Promise.all([
    falta.selic ? buscarUltimosValores(SERIE_SELIC, 1) : Promise.resolve(null),
    falta.ipca ? buscarUltimosValores(SERIE_IPCA_MENSAL, 12) : Promise.resolve(null),
    falta.usd ? buscarUltimosValores(SERIE_USD, 1) : Promise.resolve(null),
  ]);
  const selic = nexus.selic ?? selicArr?.[0];
  const ipca12m = nexus.ipca12m ?? (ipcaArr?.length === 12 ? acumular12Meses(ipcaArr) : undefined);
  const usdBrl = nexus.usdBrl ?? usdArr?.[0];
  const cdi = cdiArr?.[0] ?? (selic != null ? Math.round((selic - 0.1) * 100) / 100 : undefined); // CDI anda ~0,10 abaixo da Selic meta
  if (selic == null && ipca12m == null && usdBrl == null) return FALLBACK_MACRO;
  return {
    selic: selic ?? FALLBACK_MACRO.selic,
    cdi: cdi ?? FALLBACK_MACRO.cdi,
    ipca12m: ipca12m ?? FALLBACK_MACRO.ipca12m,
    usdBrl: usdBrl ?? FALLBACK_MACRO.usdBrl,
    fonte: !falta.selic || !falta.usd ? "nexus" : "bcb",
  };
}

async function ultimosDoNexus(): Promise<{ selic?: number; ipca12m?: number; usdBrl?: number }> {
  try {
    const { supabase } = await import("./supabase");
    const ultimos = async (codigo: string, n: number) => {
      const { data } = await supabase.from("nexus_economic_series").select("valor").eq("serie_codigo", codigo)
        .lte("data_referencia", hojeISO()).order("data_referencia", { ascending: false }).limit(n);
      return (data ?? []).map((l) => Number(l.valor)).filter(Number.isFinite);
    };
    const [selic, ipca, usd] = await Promise.all([ultimos("432", 1), ultimos("433", 12), ultimos("1", 1)]);
    return { selic: selic[0], ipca12m: ipca.length === 12 ? acumular12Meses(ipca) : undefined, usdBrl: usd[0] };
  } catch {
    return {};
  }
}
