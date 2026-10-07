// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — PDF completo do módulo: mesmas seções da tela, na mesma
// ordem (painel do José, indicadores, economia mundial, placar, eventos,
// leituras, manchetes, saúde das fontes). Só lê o que já está gravado —
// nunca aciona IA ao exportar. Formato de documento via gerarPdfRelatorio.
// ═══════════════════════════════════════════════════════════════
import { gerarPdfRelatorio, type SecaoRelatorio } from '../../../lib/gerarPdfRelatorio'
import { obterPainelSalvo, obterPlacarJose, obterLeiturasRecentes, obterManchetesRecentes, obterSaudeFontes, traduzirFreshness, type IndicadorNexus, type EventoNexus, type EconomiaMundial } from '../../../lib/nexusHelpers'
import { textoEvento, nomeSerie, fonteDaSerie } from '../../../lib/nexusEventDetector'
import { PAISES_CARD } from './EconomiaMundial'
import { ROTULO as ROTULO_FONTE } from './SaudeFontes'
import { hojeISO } from '../../../lib/datas'

type Lang = 'pt' | 'en' | 'es'

export type DadosPdfNexus = {
  lang: Lang
  indicadores: IndicadorNexus[]
  mundo: EconomiaMundial | null
  eventos: EventoNexus[]
  seriesDoRamo: string[]
  rotuloImpacto: (severity: number | null) => string
  formatarIndicador: (ind: IndicadorNexus) => string
}

export async function exportarPdfNexus(d: DadosPdfNexus): Promise<boolean> {
  const { lang } = d
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const dataFmt = (iso: string | null | undefined) => (iso ? new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString(locale) : '—')
  const num = (v: number | null | undefined, casas = 2) => (v == null ? '—' : v.toLocaleString(locale, { minimumFractionDigits: casas, maximumFractionDigits: casas }))
  const grav = (g: string) => (g === 'alta' ? L('gravidade alta', 'high severity', 'gravedad alta') : g === 'media' ? L('gravidade média', 'medium severity', 'gravedad media') : L('gravidade baixa', 'low severity', 'gravedad baja'))

  // Tudo que ainda não está na memória da tela, em paralelo; uma falha só esvazia a própria seção.
  const [painel, placar, leituras, manchetes, fontes] = await Promise.all([
    obterPainelSalvo(lang).catch(() => null),
    obterPlacarJose().catch(() => null),
    obterLeiturasRecentes(lang, 8).catch(() => []),
    obterManchetesRecentes().catch(() => []),
    obterSaudeFontes().catch(() => []),
  ])

  const secoes: SecaoRelatorio[] = []
  const semDado = (t: string): SecaoRelatorio => ({ titulo: t, paragrafo: L('Sem dado disponível no momento.', 'No data available right now.', 'Sin datos disponibles por ahora.') })

  // 1. Painel executivo do José
  const tituloPainel = L('Painel executivo do José', "José's executive briefing", 'Panel ejecutivo de José')
  if (painel) {
    const c = painel.conteudo
    const itens = (lista: { titulo: string; texto: string; gravidade: string }[]) => lista.map((i) => ({ titulo: i.titulo, texto: i.texto, nota: grav(i.gravidade) }))
    const hz = (rot: string, h: { titulo: string; texto: string; confianca: number }) => ({ titulo: `${rot}: ${h.titulo}`, texto: h.texto, nota: `${L('confiança', 'confidence', 'confianza')} ${Math.round(h.confianca)}/100` })
    secoes.push(
      { titulo: `${tituloPainel} — ${dataFmt(painel.data)} · ${L('confiança geral', 'overall confidence', 'confianza general')} ${Math.round(c.confianca_geral)}/100`, itens: [{ titulo: c.mundo.titulo, texto: c.mundo.texto }, { titulo: c.brasil.titulo, texto: c.brasil.texto }] },
      { titulo: L('Alertas', 'Alerts', 'Alertas'), itens: itens(c.alertas) },
      { titulo: L('Riscos', 'Risks', 'Riesgos'), itens: itens(c.riscos) },
      { titulo: L('Oportunidades', 'Opportunities', 'Oportunidades'), itens: itens(c.oportunidades) },
      { titulo: L('Horizontes', 'Horizons', 'Horizontes'), itens: [hz(L('12 meses', '12 months', '12 meses'), c.horizonte_12m), hz(L('3 anos', '3 years', '3 años'), c.horizonte_3a), hz(L('5 anos', '5 years', '5 años'), c.horizonte_5a), hz(L('10 anos', '10 years', '10 años'), c.horizonte_10a)] },
      { titulo: c.jose_faria.titulo, destaque: true, itens: c.jose_faria.acoes.map((a) => ({ texto: a })) },
      { titulo: c.nao_estou_vendo.titulo, paragrafo: c.nao_estou_vendo.texto, itens: c.limitacoes.map((l) => ({ texto: l })) },
    )
  } else secoes.push(semDado(tituloPainel))

  // 2. Indicadores do Brasil
  secoes.push({
    titulo: L('Indicadores do Brasil', 'Brazil indicators', 'Indicadores de Brasil'),
    itens: d.indicadores.map((i) => ({
      titulo: `${i.nome[lang]}: ${d.formatarIndicador(i)}`,
      nota: `${L('referência', 'reference', 'referencia')} ${dataFmt(i.dataReferencia)} · ${traduzirFreshness(i.freshness, lang).texto} · ${fonteDaSerie(i.fonteReserva ? 'BCE:' : i.codigo, lang)}`,
    })),
  })

  // 3. Economia mundial
  const m = d.mundo
  const tituloMundo = L('Economia mundial', 'World economy', 'Economía mundial')
  if (m) {
    const serie = (i: IndicadorNexus, unidade: string, voltar: number) => ({
      titulo: `${i.nome[lang]}: ${unidade}${num(i.valor)}`,
      nota: `${L('referência', 'reference', 'referencia')} ${dataFmt(i.dataReferencia)}${i.historico.at(-voltar)?.valor != null ? ` · ${L('antes', 'before', 'antes')}: ${num(i.historico.at(-voltar)!.valor)}` : ''} · ${fonteDaSerie(i.codigo, lang)}`,
    })
    secoes.push({
      titulo: tituloMundo,
      itens: [
        ...(m.brent?.valor != null ? [serie(m.brent, 'US$ ', 30)] : []),
        ...PAISES_CARD.map((p) => ({ p, dado: m.paises.find((x) => x.iso === p.iso) })).filter((x) => x.dado?.ano).map(({ p, dado }) => ({
          titulo: L(...p.nome), texto: `${L('PIB', 'GDP', 'PIB')} ${num(dado!.pib, 1)}% · ${L('inflação', 'inflation', 'inflación')} ${num(dado!.inflacao, 1)}% (${dado!.ano})`, nota: L('Banco Mundial', 'World Bank', 'Banco Mundial'),
        })),
        ...m.materias.filter((i) => i.valor != null).map((i) => serie(i, i.codigo === 'FMI:CAFE' ? 'US¢/lb ' : 'US$/t ', 13)),
        ...m.combustiveis.filter((i) => i.valor != null).map((i) => serie(i, 'R$ ', 5)),
        ...m.comercio.filter((i) => i.valor != null).map((i) => serie(i, i.codigo.startsWith('COMEX:') ? 'US$ bi ' : '', 13)),
      ],
    })
  } else secoes.push(semDado(tituloMundo))

  // 4. Placar do José
  const tituloPlacar = L('Placar do José (previsões conferidas com o dado oficial)', "José's scorecard (forecasts checked against official data)", 'Marcador de José (previsiones verificadas con el dato oficial)')
  if (placar) {
    const dir = (x: string) => (x === 'sobe' ? L('sobe', 'up', 'sube') : x === 'cai' ? L('cai', 'down', 'baja') : L('estável', 'flat', 'estable'))
    const st = (x: string) => (x === 'acertou' ? L('acertou', 'hit', 'acertó') : x === 'errou' ? L('errou', 'missed', 'falló') : x === 'aberta' ? L('em aberto', 'open', 'abierta') : L('sem dado', 'no data', 'sin dato'))
    secoes.push({
      titulo: tituloPlacar,
      paragrafo: `${L('Acertos', 'Hits', 'Aciertos')}: ${placar.acertos} · ${L('Erros', 'Misses', 'Errores')}: ${placar.erros} · ${L('Em aberto', 'Open', 'Abiertas')}: ${placar.abertas}`,
      itens: placar.previsoes.map((p) => ({
        titulo: `${nomeSerie(p.serie, lang)} — ${dir(p.direcao)} ${L('em', 'in', 'en')} ${p.horizonte} ${L('dias', 'days', 'días')} (${st(p.status)})`,
        texto: p.motivo?.[lang] ?? '',
        nota: `${L('base', 'base', 'base')} ${num(p.valorBase)} ${L('em', 'on', 'el')} ${dataFmt(p.dataBase)} · ${L('confere em', 'checked on', 'verifica el')} ${dataFmt(p.dataAlvo)}${p.valorReal != null ? ` · ${L('real', 'actual', 'real')} ${num(p.valorReal)}` : ''}`,
      })),
    })
  } else secoes.push(semDado(tituloPlacar))

  // 5. Eventos detectados (os já carregados na tela)
  secoes.push({
    titulo: L('Eventos detectados pelo Radar', 'Events detected by the Radar', 'Eventos detectados por el Radar'),
    itens: d.eventos.map((ev) => {
      const t = ev.payload ? textoEvento(ev.payload, lang) : { titulo: ev.tituloPt, descricao: ev.descricaoPt ?? '' }
      const ramo = ev.payload && d.seriesDoRamo.includes(ev.payload.serie) ? ` · ${L('mexe com o seu ramo', 'affects your industry', 'afecta a su sector')}` : ''
      return { titulo: t.titulo, texto: t.descricao, nota: `${dataFmt(ev.publicadoEm)} · ${d.rotuloImpacto(ev.severity)}${ramo}` }
    }),
  })

  // 6. Leituras do José
  const lidas = leituras.filter((l) => l.leitura)
  if (lidas.length) secoes.push({ titulo: L('Leituras do José sobre os eventos', "José's readings of the events", 'Lecturas de José sobre los eventos'), itens: lidas.map((l) => ({ titulo: l.titulo, texto: l.leitura!, nota: dataFmt(l.data) })) })

  // 7. Manchetes
  if (manchetes.length) secoes.push({
    titulo: L('Manchetes recentes (fonte jornalística, não é dado oficial)', 'Recent headlines (news source, not official data)', 'Titulares recientes (fuente periodística, no es dato oficial)'),
    itens: manchetes.map((n) => ({ texto: n.titulo, nota: `${dataFmt(n.data)}${n.canal ? ` · ${n.canal}` : ''}` })),
  })

  // 8. Saúde das fontes
  if (fontes.length) secoes.push({
    titulo: L('Saúde das fontes de dados', 'Data source health', 'Salud de las fuentes de datos'),
    itens: fontes.map((f) => ({ titulo: `${f.nome}: ${L(...ROTULO_FONTE[f.saude])}`, nota: `${L('último sucesso', 'last success', 'último éxito')} ${dataFmt(f.ultimoSucesso)}${f.emPausa ? ` · ${L('em pausa', 'paused', 'en pausa')}` : ''}` })),
  })

  const ind = (cod: string) => d.indicadores.find((i) => i.codigo === cod)
  const hoje = hojeISO()
  return gerarPdfRelatorio({
    lang,
    titulo: L('Nexus — Inteligência Econômica', 'Nexus — Economic Intelligence', 'Nexus — Inteligencia Económica'),
    subtitulo: `${L('Gerado em', 'Generated on', 'Generado el')} ${dataFmt(hoje)} · ${L('dados oficiais (Banco Central, IBGE, IPEA, FMI, Banco Mundial, ANP, OCDE) e leituras do José', 'official data (Central Bank, IBGE, IPEA, IMF, World Bank, ANP, OECD) and José’s readings', 'datos oficiales (Banco Central, IBGE, IPEA, FMI, Banco Mundial, ANP, OCDE) y lecturas de José')} · ${L('não é recomendação de investimento', 'not investment advice', 'no es recomendación de inversión')}`,
    numeros: ['1', '432', '433', '24363'].map(ind).filter((i): i is IndicadorNexus => !!i).map((i) => ({ rotulo: i.nome[lang], valor: d.formatarIndicador(i) })),
    secoes,
    rodape: L('Axioma Nexus — relatório completo do módulo.', 'Axioma Nexus — full module report.', 'Axioma Nexus — informe completo del módulo.'),
    nomeArquivo: `axioma-nexus-${hoje}.pdf`,
  })
}
