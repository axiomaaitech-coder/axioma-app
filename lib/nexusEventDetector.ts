// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 3: detector de eventos por regra, em cima das séries
// oficiais já ingeridas (nexus_economic_series). Função pura: recebe o
// histórico, devolve eventos — quem grava é a rota do cron. Sem import de
// nada pra rodar direto no Node (scripts/check-nexus-eventos.mjs).
//
// Nunca inventa: todo evento nasce de 2+ pontos reais da mesma série oficial,
// com a evidência (URL do BCB) e natureza explícita (fact/signal/
// official_decision) — nunca "forecast" nem "rumor" aqui.
//
// Chave de idempotência (source_event_ref) é determinística: rodar o cron de
// novo com o mesmo histórico gera as mesmas chaves, e o upsert só atualiza.
// Câmbio usa semana ISO + direção na chave (um evento por semana/direção,
// com a maior variação da semana) — evita um evento por dia numa alta longa.
// ═══════════════════════════════════════════════════════════════

export type PontoSerieEvento = { data: string; valor: number } // data ISO yyyy-mm-dd

export type RegraEvento = "fx_5d" | "selic_mudanca" | "ipca_forte" | "ipca_deflacao" | "desemprego_variacao" | "atividade_variacao"

export type PayloadEvento = {
  serie: string
  regra: RegraEvento
  direcao: "alta" | "queda"
  valor_atual: number
  valor_anterior: number
  variacao: number // % pra câmbio/atividade, pontos (p.p.) pra Selic/desemprego, o próprio valor mensal pro IPCA
  data_ref: string
  data_ref_anterior: string
}

export type EventoDetectado = {
  source_event_ref: string
  natureza: "fact" | "signal" | "official_decision"
  category: "financial" | "economic"
  event_type: RegraEvento
  subcategory: string // código da série
  severity: number // 0-100
  confidence: number // 0-100
  evidence_level: "official"
  data_ref: string
  payload: PayloadEvento
}

// Limiares num lugar só — calibrar aqui se o Nexus ficar barulhento/quieto demais.
export const LIMIARES = {
  fxVariacao5d: 3, // %
  fxJanela: 5, // observações (dias úteis)
  ipcaForte: 0.5, // % no mês
  desempregoPp: 0.3, // pontos percentuais
  atividadePct: 1, // %
}

const SERIES_CAMBIO = ["1", "21619", "21623", "21621"]
const SELIC = "432"
const IPCA = "433"
const DESEMPREGO = "24369"
const ATIVIDADE = "24363"

const arred = (n: number, casas = 2) => Math.round(n * 10 ** casas) / 10 ** casas
const limitar = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

function semanaIso(dataIso: string): string {
  const d = new Date(`${dataIso}T00:00:00Z`)
  const dia = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dia)
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const semana = Math.ceil(((d.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`
}

function evento(
  serie: string, regra: RegraEvento, natureza: EventoDetectado["natureza"], category: EventoDetectado["category"],
  severity: number, atual: PontoSerieEvento, anterior: PontoSerieEvento, variacao: number, ref: string,
): EventoDetectado {
  return {
    source_event_ref: ref,
    natureza,
    category,
    event_type: regra,
    subcategory: serie,
    severity: limitar(severity),
    confidence: 95, // série oficial, fonte única — sobe quando houver corroboração (etapa futura)
    evidence_level: "official",
    data_ref: atual.data,
    payload: {
      serie, regra,
      direcao: variacao >= 0 ? "alta" : "queda",
      valor_atual: atual.valor,
      valor_anterior: anterior.valor,
      variacao: arred(variacao),
      data_ref: atual.data,
      data_ref_anterior: anterior.data,
    },
  }
}

// historico: ascendente por data, só pontos válidos da série.
export function detectarEventosSerie(serie: string, historico: PontoSerieEvento[]): EventoDetectado[] {
  const h = [...historico].sort((a, b) => a.data.localeCompare(b.data))
  const out: EventoDetectado[] = []

  if (SERIES_CAMBIO.includes(serie)) {
    const porChave = new Map<string, EventoDetectado>()
    for (let i = LIMIARES.fxJanela; i < h.length; i++) {
      const base = h[i - LIMIARES.fxJanela]
      if (!base.valor) continue
      const pct = ((h[i].valor - base.valor) / base.valor) * 100
      if (Math.abs(pct) < LIMIARES.fxVariacao5d) continue
      const ref = `bcb:${serie}:fx_5d:${semanaIso(h[i].data)}:${pct >= 0 ? "alta" : "queda"}`
      const atual = porChave.get(ref)
      if (!atual || Math.abs(pct) > Math.abs(atual.payload.variacao)) {
        porChave.set(ref, evento(serie, "fx_5d", "signal", "financial", Math.abs(pct) * 15, h[i], base, pct, ref))
      }
    }
    out.push(...porChave.values())
  }

  for (let i = 1; i < h.length; i++) {
    const atual = h[i], anterior = h[i - 1]
    const dif = atual.valor - anterior.valor
    const ref = (regra: RegraEvento) => `bcb:${serie}:${regra}:${atual.data}`

    if (serie === SELIC && dif !== 0) {
      out.push(evento(serie, "selic_mudanca", "official_decision", "financial", 70 + Math.abs(dif) * 10, atual, anterior, dif, ref("selic_mudanca")))
    }
    if (serie === DESEMPREGO && Math.abs(dif) >= LIMIARES.desempregoPp - 1e-9) {
      out.push(evento(serie, "desemprego_variacao", "fact", "economic", 40 + Math.abs(dif) * 50, atual, anterior, dif, ref("desemprego_variacao")))
    }
    if (serie === ATIVIDADE && anterior.valor) {
      const pct = (dif / anterior.valor) * 100
      if (Math.abs(pct) >= LIMIARES.atividadePct) {
        out.push(evento(serie, "atividade_variacao", "fact", "economic", 40 + Math.abs(pct) * 15, atual, anterior, pct, ref("atividade_variacao")))
      }
    }
  }

  // IPCA olha o valor do mês em si (variação mensal já é o dado), não a diferença.
  if (serie === IPCA) {
    for (let i = 1; i < h.length; i++) {
      const v = h[i].valor
      if (v >= LIMIARES.ipcaForte) {
        out.push(evento(serie, "ipca_forte", "fact", "economic", 50 + (v - LIMIARES.ipcaForte) * 50, h[i], h[i - 1], v, `bcb:${serie}:ipca_forte:${h[i].data}`))
      } else if (v < 0) {
        out.push(evento(serie, "ipca_deflacao", "fact", "economic", 40, h[i], h[i - 1], v, `bcb:${serie}:ipca_deflacao:${h[i].data}`))
      }
    }
  }

  return out
}

// ─── Texto do evento em PT/EN/ES, gerado do payload (nunca do título salvo) ───

type Lang = "pt" | "en" | "es"

const NOME_SERIE: Record<string, Record<Lang, string>> = {
  "1": { pt: "Dólar", en: "US Dollar", es: "Dólar" },
  "21619": { pt: "Euro", en: "Euro", es: "Euro" },
  "21623": { pt: "Libra", en: "British Pound", es: "Libra" },
  "21621": { pt: "Iene", en: "Japanese Yen", es: "Yen" },
  "432": { pt: "Selic", en: "Selic rate", es: "Tasa Selic" },
  "433": { pt: "IPCA", en: "IPCA inflation", es: "Inflación IPCA" },
  "24369": { pt: "Desemprego", en: "Unemployment", es: "Desempleo" },
  "24363": { pt: "Atividade econômica (IBC-Br)", en: "Economic activity (IBC-Br)", es: "Actividad económica (IBC-Br)" },
}

const num = (n: number, casas: number, lang: Lang) =>
  n.toLocaleString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })

export function textoEvento(p: PayloadEvento, lang: Lang): { titulo: string; descricao: string } {
  const nome = NOME_SERIE[p.serie]?.[lang] ?? p.serie
  const sobe = p.direcao === "alta"
  const abs = Math.abs(p.variacao)
  const T = (pt: string, en: string, es: string) => (lang === "pt" ? pt : lang === "en" ? en : es)

  switch (p.regra) {
    case "fx_5d": {
      const casas = p.serie === "21621" ? 4 : 2
      return {
        titulo: sobe
          ? T(`${nome} dispara ${num(abs, 1, lang)}% em 5 dias`, `${nome} jumps ${num(abs, 1, lang)}% in 5 days`, `${nome} sube ${num(abs, 1, lang)}% en 5 días`)
          : T(`${nome} cai ${num(abs, 1, lang)}% em 5 dias`, `${nome} drops ${num(abs, 1, lang)}% in 5 days`, `${nome} cae ${num(abs, 1, lang)}% en 5 días`),
        descricao: T(
          `Cotação oficial foi de R$ ${num(p.valor_anterior, casas, lang)} para R$ ${num(p.valor_atual, casas, lang)} em 5 dias úteis.`,
          `Official rate moved from R$ ${num(p.valor_anterior, casas, lang)} to R$ ${num(p.valor_atual, casas, lang)} over 5 business days.`,
          `La cotización oficial pasó de R$ ${num(p.valor_anterior, casas, lang)} a R$ ${num(p.valor_atual, casas, lang)} en 5 días hábiles.`,
        ),
      }
    }
    case "selic_mudanca":
      return {
        titulo: sobe
          ? T(`Copom eleva a Selic para ${num(p.valor_atual, 2, lang)}%`, `Copom raises Selic to ${num(p.valor_atual, 2, lang)}%`, `Copom sube la Selic a ${num(p.valor_atual, 2, lang)}%`)
          : T(`Copom reduz a Selic para ${num(p.valor_atual, 2, lang)}%`, `Copom cuts Selic to ${num(p.valor_atual, 2, lang)}%`, `Copom reduce la Selic a ${num(p.valor_atual, 2, lang)}%`),
        descricao: T(
          `Meta da taxa básica de juros passou de ${num(p.valor_anterior, 2, lang)}% para ${num(p.valor_atual, 2, lang)}% ao ano.`,
          `The benchmark rate target moved from ${num(p.valor_anterior, 2, lang)}% to ${num(p.valor_atual, 2, lang)}% per year.`,
          `La meta de la tasa básica pasó de ${num(p.valor_anterior, 2, lang)}% a ${num(p.valor_atual, 2, lang)}% anual.`,
        ),
      }
    case "ipca_forte":
      return {
        titulo: T(`Inflação forte no mês: IPCA de ${num(p.valor_atual, 2, lang)}%`, `Strong monthly inflation: IPCA at ${num(p.valor_atual, 2, lang)}%`, `Inflación fuerte en el mes: IPCA de ${num(p.valor_atual, 2, lang)}%`),
        descricao: T(
          `No mês anterior o IPCA tinha sido ${num(p.valor_anterior, 2, lang)}%. Acima de ${num(LIMIARES.ipcaForte, 1, lang)}% ao mês, a inflação anualizada passa de 6%.`,
          `The previous month was ${num(p.valor_anterior, 2, lang)}%. Above ${num(LIMIARES.ipcaForte, 1, lang)}% a month, annualized inflation exceeds 6%.`,
          `El mes anterior fue ${num(p.valor_anterior, 2, lang)}%. Por encima de ${num(LIMIARES.ipcaForte, 1, lang)}% al mes, la inflación anualizada supera el 6%.`,
        ),
      }
    case "ipca_deflacao":
      return {
        titulo: T(`Deflação no mês: IPCA de ${num(p.valor_atual, 2, lang)}%`, `Monthly deflation: IPCA at ${num(p.valor_atual, 2, lang)}%`, `Deflación en el mes: IPCA de ${num(p.valor_atual, 2, lang)}%`),
        descricao: T(
          `Os preços caíram na média do mês (mês anterior: ${num(p.valor_anterior, 2, lang)}%).`,
          `Prices fell on average this month (previous month: ${num(p.valor_anterior, 2, lang)}%).`,
          `Los precios bajaron en promedio en el mes (mes anterior: ${num(p.valor_anterior, 2, lang)}%).`,
        ),
      }
    case "desemprego_variacao":
      return {
        titulo: sobe
          ? T(`Desemprego sobe para ${num(p.valor_atual, 1, lang)}%`, `Unemployment rises to ${num(p.valor_atual, 1, lang)}%`, `El desempleo sube a ${num(p.valor_atual, 1, lang)}%`)
          : T(`Desemprego cai para ${num(p.valor_atual, 1, lang)}%`, `Unemployment falls to ${num(p.valor_atual, 1, lang)}%`, `El desempleo baja a ${num(p.valor_atual, 1, lang)}%`),
        descricao: T(
          `Taxa de desocupação (IBGE/PNAD) foi de ${num(p.valor_anterior, 1, lang)}% para ${num(p.valor_atual, 1, lang)}%.`,
          `The unemployment rate (IBGE/PNAD) moved from ${num(p.valor_anterior, 1, lang)}% to ${num(p.valor_atual, 1, lang)}%.`,
          `La tasa de desocupación (IBGE/PNAD) pasó de ${num(p.valor_anterior, 1, lang)}% a ${num(p.valor_atual, 1, lang)}%.`,
        ),
      }
    case "atividade_variacao":
      return {
        titulo: sobe
          ? T(`Atividade econômica avança ${num(abs, 1, lang)}% no mês`, `Economic activity grows ${num(abs, 1, lang)}% in the month`, `La actividad económica avanza ${num(abs, 1, lang)}% en el mes`)
          : T(`Atividade econômica recua ${num(abs, 1, lang)}% no mês`, `Economic activity falls ${num(abs, 1, lang)}% in the month`, `La actividad económica retrocede ${num(abs, 1, lang)}% en el mes`),
        descricao: T(
          `IBC-Br, a prévia mensal do PIB feita pelo Banco Central, foi de ${num(p.valor_anterior, 1, lang)} para ${num(p.valor_atual, 1, lang)} pontos.`,
          `IBC-Br, the Central Bank's monthly GDP proxy, moved from ${num(p.valor_anterior, 1, lang)} to ${num(p.valor_atual, 1, lang)} points.`,
          `El IBC-Br, la estimación mensual del PIB del Banco Central, pasó de ${num(p.valor_anterior, 1, lang)} a ${num(p.valor_atual, 1, lang)} puntos.`,
        ),
      }
  }
}

// Trava da Verdade — o selo depende só do nível de evidência, nunca do texto.
export function travaDaVerdade(evidenceLevel: string | null, lang: Lang): { texto: string; nivel: "oficial" | "jornalistico" | "nao_confirmado" } {
  const T = (pt: string, en: string, es: string) => (lang === "pt" ? pt : lang === "en" ? en : es)
  if (evidenceLevel === "official") return { nivel: "oficial", texto: T("Confirmado por fonte oficial", "Confirmed by official source", "Confirmado por fuente oficial") }
  if (evidenceLevel === "journalistic") return { nivel: "jornalistico", texto: T("Relatado por fonte jornalística", "Reported by news source", "Reportado por fuente periodística") }
  return { nivel: "nao_confirmado", texto: T("Informação ainda não confirmada", "Not yet confirmed", "Información aún no confirmada") }
}
