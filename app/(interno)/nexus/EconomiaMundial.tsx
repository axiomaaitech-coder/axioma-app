'use client'
// "Economia mundial" — abaixo dos indicadores do Brasil: petróleo Brent (IPEA,
// diário), PIB/inflação de China, EUA e Zona do Euro (Banco Mundial, anual) e
// matérias-primas soja/milho/café/minério (FMI, mensal). Fontes gratuitas.
import { PALETA } from '../../../lib/nexusTema'
import { traduzirFreshness, type EconomiaMundial as TipoEconomia, type PaisMundo, type IndicadorNexus } from '../../../lib/nexusHelpers'

type Lang = 'pt' | 'en' | 'es'
const BARRA = <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
const CARD = 'relative overflow-hidden rounded-2xl p-4 min-h-40 flex flex-col axi-card-premium3d'

const PAISES_CARD: { iso: string; bandeira: string; nome: [string, string, string] }[] = [
  { iso: 'CHN', bandeira: '🇨🇳', nome: ['China', 'China', 'China'] },
  { iso: 'USA', bandeira: '🇺🇸', nome: ['EUA', 'United States', 'EE. UU.'] },
  { iso: 'EMU', bandeira: '🇪🇺', nome: ['Zona do Euro', 'Euro Area', 'Zona Euro'] },
]

function Sparkline({ valores, cor }: { valores: number[]; cor: string }) {
  if (valores.length < 2) return null
  const min = Math.min(...valores), max = Math.max(...valores), faixa = max - min || 1
  const pts = valores.map((v, i) => `${(i / (valores.length - 1)) * 100},${36 - ((v - min) / faixa) * 32}`).join(' ')
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-10" aria-hidden>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

const pct = (v: number | null, lang: Lang) => v == null ? '—' : `${v > 0 ? '+' : ''}${v.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { maximumFractionDigits: 1 })}%`

export function EconomiaMundial({ lang, temaClaro, dados }: { lang: Lang; temaClaro: boolean; dados: TipoEconomia | null }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG } = PALETA[temaClaro ? 'xms' : 'dark']
  const estilo = { background: PAINEL_BG, border: `1px solid ${CIANO}30` }
  const brent = dados?.brent ?? null
  const pais = (iso: string): PaisMundo | undefined => dados?.paises.find((p) => p.iso === iso)

  return (
    <section>
      <div className="mb-3 px-1">
        <h2 className="text-base font-bold" style={{ color: TITULO }}>🌐 {L('Economia mundial', 'World economy', 'Economía mundial')}</h2>
        <p className="text-xs mt-0.5" style={{ color: TEXTO, opacity: temaClaro ? 1 : 0.8 }}>
          {L('Petróleo diário (IPEA/EIA), crescimento e inflação dos principais parceiros do Brasil (Banco Mundial, dado anual) e preço das matérias-primas que o Brasil mais exporta (FMI).', 'Daily oil (IPEA/EIA), growth and inflation of Brazil’s main partners (World Bank, annual data) and prices of Brazil’s top export commodities (IMF).', 'Petróleo diario (IPEA/EIA), crecimiento e inflación de los principales socios de Brasil (Banco Mundial, dato anual) y precio de las materias primas que Brasil más exporta (FMI).')}
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CardPreco ind={brent} rotulo={`🛢️ ${L('Petróleo Brent', 'Brent crude', 'Petróleo Brent')}`} valor={brent?.valor != null ? `US$ ${num(brent.valor, lang)}` : '—'} mensal={false} lang={lang} temaClaro={temaClaro} />

        {PAISES_CARD.map((c) => {
          const p = pais(c.iso)
          return (
            <div key={c.iso} className={CARD} style={estilo}>
              {BARRA}
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{c.bandeira} {L(...c.nome)}</p>
              <p className="text-2xl font-black leading-none" style={{ color: TITULO }}>{pct(p?.pib ?? null, lang)}</p>
              <p className="text-[11px] mt-1" style={{ color: TEXTO, opacity: temaClaro ? 1 : 0.85 }}>{L('crescimento do PIB', 'GDP growth', 'crecimiento del PIB')}</p>
              <p className="text-xs mt-2" style={{ color: TEXTO }}>{L('Inflação', 'Inflation', 'Inflación')}: <span className="font-bold" style={{ color: TITULO }}>{pct(p?.inflacao ?? null, lang)}</span></p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px]" style={{ color: CINZA }}>{p?.ano ? `${L('ano', 'year', 'año')} ${p.ano} · Banco Mundial` : L('aguardando 1ª coleta', 'awaiting first update', 'esperando 1ª actualización')}</span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs font-bold mt-4 mb-2 px-1" style={{ color: TITULO }}>
        {L('Matérias-primas — preço internacional médio do mês (FMI)', 'Commodities — monthly average international price (IMF)', 'Materias primas — precio internacional medio del mes (FMI)')}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(dados?.materias ?? []).map((m) => (
          <CardPreco key={m.codigo} ind={m} rotulo={`${m.emoji} ${m.nome[lang]}`} valor={precoMateria(m, lang)} mensal lang={lang} temaClaro={temaClaro} />
        ))}
      </div>
    </section>
  )
}

const num = (v: number, lang: Lang) => v.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// Café vem em centavos de dólar por libra-peso; o resto em US$ por tonelada.
const precoMateria = (m: IndicadorNexus, lang: Lang) => m.valor == null ? '—' : m.codigo === 'FMI:CAFE' ? `${num(m.valor, lang)} US¢/lb` : `US$ ${num(m.valor, lang)}/t`

// Card de preço com mini-gráfico, data e selo de atualidade (Brent e matérias-primas).
function CardPreco({ ind, rotulo, valor, mensal, lang, temaClaro }: { ind: IndicadorNexus | null; rotulo: string; valor: string; mensal: boolean; lang: Lang; temaClaro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { CIANO, CINZA, TITULO, PAINEL_BG } = PALETA[temaClaro ? 'xms' : 'dark']
  const fresh = traduzirFreshness(ind?.freshness ?? null, lang)
  const local = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const data = ind?.dataReferencia ? new Date(ind.dataReferencia + 'T00:00:00').toLocaleDateString(local, mensal ? { month: 'short', year: 'numeric' } : undefined) : null
  return (
    <div className={CARD} style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
      {BARRA}
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{rotulo}</p>
      <p className="text-2xl font-black leading-none mb-1" style={{ color: TITULO }}>{valor}</p>
      {ind && <Sparkline valores={ind.historico.map((p) => p.valor)} cor={temaClaro ? '#16a97d' : CIANO} />}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[10px]" style={{ color: CINZA }}>{data ?? L('aguardando 1ª coleta', 'awaiting first update', 'esperando 1ª actualización')}</span>
        {ind?.valor != null && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={temaClaro
          ? (ind.freshness === 'live' || ind.freshness === 'fresh' ? { background: '#2ecc9b', color: '#101b3d' } : ind.freshness === 'recent' ? { background: '#f5a623', color: '#2b1900' } : { background: '#ff5a6b', color: '#2b0007' })
          : { background: `${fresh.cor}20`, color: fresh.cor }}>{fresh.texto}</span>}
      </div>
    </div>
  )
}
