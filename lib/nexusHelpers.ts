import { createBrowserClient } from "@supabase/ssr";
import type { PayloadEvento } from "./nexusEventDetector";

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Comitê 03, Parte 1: leitura dos 4 indicadores reais
// (nexus_economic_series, pública, RLS de leitura pra authenticated).
// Só leitura — nenhuma escrita acontece a partir do cliente aqui.
// ═══════════════════════════════════════════════════════════════

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import { calcularFreshness, type FreshnessStatus } from "./nexusFreshness";
export type { FreshnessStatus };

export type PontoSerie = { data: string; valor: number };

export type IndicadorNexus = {
  codigo: string;
  nome: { pt: string; en: string; es: string };
  emoji: string;
  valor: number | null;
  dataReferencia: string | null;
  freshness: FreshnessStatus | null;
  formato: "moeda" | "percentual" | "indice";
  casas: number; // casas decimais na tela (iene precisa de 4, o resto 2)
  historico: PontoSerie[]; // ascendente por data, pro mini-gráfico
};

// CDI (12) continua no catálogo/ingestão, mas fora da tela: repete a Selic
// e fecha a grade em 8 (2x4, mesmo tamanho dos cards de notícia da TV).
// Catálogo dos códigos semeados em nexus_series_catalog (Comitê 02 + Etapa 2:
// euro/libra/iene/desemprego/IBC-Br, SQL em NEXUS-ETAPA2-SERIES-SQL.txt) —
// nome amigável e formato de exibição não vêm do banco (banco guarda o
// dado bruto), a tela decide como cada um aparece.
const CATALOGO: Omit<IndicadorNexus, "valor" | "dataReferencia" | "freshness" | "historico">[] = [
  { codigo: "1", nome: { pt: "Dólar", en: "US Dollar", es: "Dólar" }, emoji: "💵", formato: "moeda", casas: 2 },
  { codigo: "21619", nome: { pt: "Euro", en: "Euro", es: "Euro" }, emoji: "💶", formato: "moeda", casas: 2 },
  { codigo: "21623", nome: { pt: "Libra", en: "British Pound", es: "Libra" }, emoji: "💷", formato: "moeda", casas: 2 },
  { codigo: "21621", nome: { pt: "Iene", en: "Japanese Yen", es: "Yen" }, emoji: "💴", formato: "moeda", casas: 4 },
  { codigo: "432", nome: { pt: "Selic", en: "Selic Rate", es: "Tasa Selic" }, emoji: "🏦", formato: "percentual", casas: 2 },
  { codigo: "433", nome: { pt: "IPCA", en: "IPCA (Inflation)", es: "IPCA (Inflación)" }, emoji: "📈", formato: "percentual", casas: 2 },
  { codigo: "24369", nome: { pt: "Desemprego", en: "Unemployment", es: "Desempleo" }, emoji: "👷", formato: "percentual", casas: 1 },
  { codigo: "24363", nome: { pt: "Atividade Econômica (IBC-Br)", en: "Economic Activity (IBC-Br)", es: "Actividad Económica (IBC-Br)" }, emoji: "🏭", formato: "indice", casas: 1 },
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
          .select("valor, data_referencia, frequencia")
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
        // recalculado agora, não o valor gravado na coleta (ver lib/nexusFreshness.ts)
        freshness: maisRecente?.data_referencia ? calcularFreshness(maisRecente.data_referencia as string, maisRecente.frequencia as string | null) : null,
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
  // "em dia" e não "atualizado hoje": vale também pra série mensal cujo dado
  // mais novo é de meses atrás (desemprego/IBC-Br) — é o último publicado.
  live: { pt: "em dia", en: "up to date", es: "al día" },
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
  // null = série ainda sem nenhum ponto (acabou de entrar no catálogo) — não é
  // dado velho, é dado que ainda não chegou.
  if (!status) return { texto: { pt: "aguardando 1ª coleta", en: "awaiting first update", es: "esperando 1ª actualización" }[lang], cor: "#7f9bb8" };
  return { texto: TEXTO_FRESHNESS[status][lang], cor: COR_FRESHNESS[status] };
}

// ─── Etapa 3: eventos detectados (nexus_global_event, pública, só leitura) ───

export type EventoNexus = {
  id: string;
  natureza: string; // fact | signal | official_decision | ... (lista fechada no CHECK do banco)
  severity: number | null;
  confidence: number | null;
  evidenceLevel: string | null;
  publicadoEm: string | null;
  tituloPt: string; // fallback quando não houver payload
  descricaoPt: string | null;
  payload: PayloadEvento | null;
};

const COLUNAS_EVENTO = "event_id, natureza, severity, confidence, evidence_level, published_at, title, description, payload";

type LinhaEvento = {
  event_id: string; natureza: string; severity: number | null; confidence: number | null; evidence_level: string | null;
  published_at: string | null; title: string; description: string | null; payload: PayloadEvento | null;
};
const paraEvento = (l: LinhaEvento): EventoNexus => ({
  id: l.event_id, natureza: l.natureza, severity: l.severity, confidence: l.confidence, evidenceLevel: l.evidence_level,
  publicadoEm: l.published_at, tituloPt: l.title, descricaoPt: l.description, payload: l.payload ?? null,
});

// Paginação real (.range), nunca a tabela inteira — ela cresce todo dia.
export async function obterEventosNexus(pagina = 0, porPagina = 8): Promise<{ eventos: EventoNexus[]; temMais: boolean; erro: boolean }> {
  const inicio = pagina * porPagina;
  const { data, error } = await supabase
    .from("nexus_global_event")
    .select(COLUNAS_EVENTO)
    .order("published_at", { ascending: false })
    .range(inicio, inicio + porPagina); // pede 1 a mais só pra saber se existe próxima página
  if (error) return { eventos: [], temMais: false, erro: true };
  const linhas = (data ?? []) as LinhaEvento[];
  return { eventos: linhas.slice(0, porPagina).map(paraEvento), temMais: linhas.length > porPagina, erro: false };
}

// Um evento pelo id — abrir o modal direto via /nexus?evento=<id> (card flutuante).
export async function obterEventoNexus(id: string): Promise<EventoNexus | null> {
  const { data, error } = await supabase.from("nexus_global_event").select(COLUNAS_EVENTO).eq("event_id", id).maybeSingle();
  return error || !data ? null : paraEvento(data as LinhaEvento);
}

// Eventos de impacto alto recentes pro card flutuante (filtro no banco, poucos por vez).
export async function obterEventosDestaque(diasJanela = 14, severidadeMin = 70, limite = 5): Promise<EventoNexus[]> {
  const desde = new Date(Date.now() - diasJanela * 86400000).toISOString();
  const { data, error } = await supabase
    .from("nexus_global_event")
    .select(COLUNAS_EVENTO)
    .gte("severity", severidadeMin)
    .gte("published_at", desde)
    .order("published_at", { ascending: false })
    .limit(limite);
  return error ? [] : ((data ?? []) as LinhaEvento[]).map(paraEvento);
}

// Leituras do Joseph já geradas (eventos recentes) — contexto do chat do Joseph.
// Só o essencial de cada análise, pra não inflar o prompt.
export async function obterLeiturasRecentes(lang: "pt" | "en" | "es", limite = 5): Promise<{ titulo: string; data: string | null; leitura: string | null }[]> {
  const { data, error } = await supabase
    .from("nexus_global_event")
    .select("title, published_at, joseph_analise")
    .order("published_at", { ascending: false })
    .limit(limite);
  if (error) return [];
  return (data ?? []).map((l) => {
    const analises = (l.joseph_analise ?? {}) as Record<string, { leitura?: string } | undefined>;
    return { titulo: l.title as string, data: (l.published_at as string | null)?.slice(0, 10) ?? null, leitura: analises[lang]?.leitura ?? analises.pt?.leitura ?? null };
  });
}

// Manchetes recentes coletadas (fonte jornalística) — contexto do chat do José
// sobre o mundo (conflitos, acordos, mercados), sempre marcadas como não oficiais.
export async function obterManchetesRecentes(dias = 5, limite = 16): Promise<{ titulo: string; canal: string | null; data: string | null }[]> {
  const desde = new Date(Date.now() - dias * 86400000).toISOString();
  const { data, error } = await supabase
    .from("nexus_news")
    .select("title, canal, publication_date")
    .gte("publication_date", desde)
    .order("publication_date", { ascending: false })
    .limit(limite);
  if (error) return [];
  return (data ?? []).map((n) => ({ titulo: n.title as string, canal: (n.canal as string | null) ?? null, data: (n.publication_date as string | null)?.slice(0, 10) ?? null }));
}

// Horizontes do painel executivo mais recente (12m/3a/5a/10a) — o chat usa como base
// pras perguntas "como a economia afeta minha empresa em N anos".
export async function obterHorizontesPainel(lang: "pt" | "en" | "es"): Promise<{ data: string; texto: string } | null> {
  const { data, error } = await supabase.from("nexus_briefing").select("data, conteudo").eq("lang", lang).order("data", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return null;
  const c = data.conteudo as Record<string, { titulo?: string; texto?: string; confianca?: number } | undefined>;
  const linha = (k: string, rot: string) => (c[k]?.texto ? `- ${rot} (confiança ${c[k]?.confianca ?? "?"}/100): ${c[k]?.titulo ?? ""} — ${c[k]?.texto}` : "");
  return { data: data.data as string, texto: [linha("horizonte_12m", "12 meses"), linha("horizonte_3a", "3 anos"), linha("horizonte_5a", "5 anos"), linha("horizonte_10a", "10 anos")].filter(Boolean).join("\n") };
}

// Planos do José já guardados da empresa (RLS por empresa) — lista "Meus planos
// salvos" com o prazo até a limpeza automática (lib/nexusRetencao.ts).
export async function listarPlanosSalvos(empresaId: string, limite = 12): Promise<{ id: string; horizonte: string; lang: string; data: string; geradoEm: string; conteudo: unknown }[]> {
  const { data, error } = await supabase
    .from("nexus_plano_empresa")
    .select("id, horizonte, lang, data, gerado_em, conteudo")
    .eq("empresa_id", empresaId)
    .order("gerado_em", { ascending: false })
    .limit(limite);
  if (error) return [];
  return (data ?? []).map((l) => ({ id: l.id as string, horizonte: l.horizonte as string, lang: l.lang as string, data: l.data as string, geradoEm: l.gerado_em as string, conteudo: l.conteudo }));
}

// ─── Economia mundial (IPEA Brent + Banco Mundial) — cards e contexto do José ───
export type PaisMundo = { iso: string; pib: number | null; inflacao: number | null; ano: string | null };
export type EconomiaMundial = { brent: IndicadorNexus | null; paises: PaisMundo[] };

const ISOS_MUNDO = ["USA", "CHN", "EMU", "ARG", "JPN", "GBR", "IND", "MEX"];

export async function obterEconomiaMundial(): Promise<EconomiaMundial> {
  const [brentRes, bmRes] = await Promise.all([
    supabase.from("nexus_economic_series").select("valor, data_referencia, frequencia").eq("serie_codigo", "IPEA:BRENT").order("data_referencia", { ascending: false }).limit(30),
    supabase.from("nexus_economic_series").select("serie_codigo, valor, data_referencia").like("serie_codigo", "WB:%").order("data_referencia", { ascending: false }).limit(200),
  ]);
  const pontos = (brentRes.data ?? []).filter((l) => l.valor != null);
  const brent: IndicadorNexus | null = pontos.length ? {
    codigo: "IPEA:BRENT", nome: { pt: "Petróleo Brent", en: "Brent crude", es: "Petróleo Brent" }, emoji: "🛢️",
    valor: Number(pontos[0].valor), dataReferencia: pontos[0].data_referencia as string,
    freshness: calcularFreshness(pontos[0].data_referencia as string, pontos[0].frequencia as string | null),
    formato: "indice", casas: 2,
    historico: [...pontos].reverse().map((l) => ({ data: l.data_referencia as string, valor: Number(l.valor) })),
  } : null;
  // Mais recente por série (a lista já vem do mais novo pro mais antigo).
  const ultimo = new Map<string, { valor: number; ano: string }>();
  for (const l of bmRes.data ?? []) if (!ultimo.has(l.serie_codigo as string)) ultimo.set(l.serie_codigo as string, { valor: Number(l.valor), ano: (l.data_referencia as string).slice(0, 4) });
  const paises = ISOS_MUNDO.map((iso) => {
    const pib = ultimo.get(`WB:${iso}:NY.GDP.MKTP.KD.ZG`), inf = ultimo.get(`WB:${iso}:FP.CPI.TOTL.ZG`);
    return { iso, pib: pib?.valor ?? null, inflacao: inf?.valor ?? null, ano: pib?.ano ?? inf?.ano ?? null };
  });
  return { brent, paises };
}
