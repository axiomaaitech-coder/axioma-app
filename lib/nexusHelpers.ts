import { createBrowserClient } from "@supabase/ssr";

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Comitê 03, Parte 1: leitura dos 4 indicadores reais
// (nexus_economic_series, pública, RLS de leitura pra authenticated).
// Só leitura — nenhuma escrita acontece a partir do cliente aqui.
// ═══════════════════════════════════════════════════════════════

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type FreshnessStatus = "live" | "fresh" | "recent" | "stale" | "expired" | "unknown";

export type PontoSerie = { data: string; valor: number };

export type IndicadorNexus = {
  codigo: string;
  nome: { pt: string; en: string; es: string };
  emoji: string;
  valor: number | null;
  dataReferencia: string | null;
  freshness: FreshnessStatus | null;
  formatoPercentual: boolean;
  historico: PontoSerie[]; // ascendente por data, pro mini-gráfico
};

// Catálogo fixo dos 4 códigos já semeados em nexus_series_catalog (Comitê 02) —
// nome amigável e formato de exibição não vêm do banco (banco guarda o
// dado bruto), a tela decide como cada um aparece.
const CATALOGO: Omit<IndicadorNexus, "valor" | "dataReferencia" | "freshness" | "historico">[] = [
  { codigo: "1", nome: { pt: "Dólar", en: "US Dollar", es: "Dólar" }, emoji: "💵", formatoPercentual: false },
  { codigo: "432", nome: { pt: "Selic", en: "Selic Rate", es: "Tasa Selic" }, emoji: "🏦", formatoPercentual: true },
  { codigo: "433", nome: { pt: "IPCA", en: "IPCA (Inflation)", es: "IPCA (Inflación)" }, emoji: "📈", formatoPercentual: true },
  { codigo: "12", nome: { pt: "CDI", en: "CDI Rate", es: "Tasa CDI" }, emoji: "💰", formatoPercentual: true },
];

// 30 pontos bastam pro mini-gráfico e já trazem o valor mais recente (primeira
// linha, mais nova) — uma query só por indicador, sem N+1 pra buscar o atual
// e o histórico separadamente.
const PONTOS_HISTORICO = 30;

export async function obterIndicadoresNexus(): Promise<{ indicadores: IndicadorNexus[]; erro: boolean }> {
  try {
    const resultados = await Promise.all(
      CATALOGO.map((c) =>
        supabase
          .from("nexus_economic_series")
          .select("valor, data_referencia, freshness_status")
          .eq("serie_codigo", c.codigo)
          .order("data_referencia", { ascending: false })
          .limit(PONTOS_HISTORICO)
      )
    );

    const algumErro = resultados.some((r) => r.error);
    const indicadores: IndicadorNexus[] = CATALOGO.map((c, i) => {
      const linhas = resultados[i].data ?? [];
      const maisRecente = linhas[0];
      const historico: PontoSerie[] = linhas
        .filter((l) => l.valor != null)
        .map((l) => ({ data: l.data_referencia as string, valor: l.valor as number }))
        .reverse(); // ascendente por data
      return {
        ...c,
        valor: maisRecente?.valor ?? null,
        dataReferencia: maisRecente?.data_referencia ?? null,
        freshness: (maisRecente?.freshness_status as FreshnessStatus) ?? null,
        historico,
      };
    });

    return { indicadores, erro: algumErro };
  } catch {
    return {
      indicadores: CATALOGO.map((c) => ({ ...c, valor: null, dataReferencia: null, freshness: null, historico: [] })),
      erro: true,
    };
  }
}

const TEXTO_FRESHNESS: Record<FreshnessStatus, { pt: string; en: string; es: string }> = {
  live: { pt: "atualizado hoje", en: "updated today", es: "actualizado hoy" },
  fresh: { pt: "atualizado", en: "updated", es: "actualizado" },
  recent: { pt: "recente", en: "recent", es: "reciente" },
  stale: { pt: "desatualizado", en: "outdated", es: "desactualizado" },
  expired: { pt: "desatualizado", en: "outdated", es: "desactualizado" },
  unknown: { pt: "desatualizado", en: "outdated", es: "desactualizado" },
};

const COR_FRESHNESS: Record<FreshnessStatus, string> = {
  live: "#34d399",
  fresh: "#34d399",
  recent: "#fbbf24",
  stale: "#f87171",
  expired: "#f87171",
  unknown: "#f87171",
};

export function traduzirFreshness(status: FreshnessStatus | null, lang: "pt" | "en" | "es"): { texto: string; cor: string } {
  if (!status) return { texto: TEXTO_FRESHNESS.unknown[lang], cor: COR_FRESHNESS.unknown };
  return { texto: TEXTO_FRESHNESS[status][lang], cor: COR_FRESHNESS[status] };
}
