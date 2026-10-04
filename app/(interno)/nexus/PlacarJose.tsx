'use client'
// "Placar do José" (Etapa 9) — previsto × realizado. Toda semana o José diz se
// 6 indicadores sobem, caem ou ficam estáveis em 30 e 90 dias; o cron confere
// com o dado oficial quando o prazo vence. Card sempre visível com o placar;
// a lista de previsões abre no clique.
import { useEffect, useState } from 'react'
import { PALETA, VERDE_SOLIDO } from '../../../lib/nexusTema'
import { TITULO_SECAO } from './fonteJose'
import { obterPlacarJose, type PlacarJose as TipoPlacar, type PrevisaoJose } from '../../../lib/nexusHelpers'
import { SERIES_PREVISAO } from '../../../lib/nexusPrevisoes'

type Lang = 'pt' | 'en' | 'es'

const DIRECAO: Record<PrevisaoJose['direcao'], [string, string, string]> = {
  sobe: ['↑ sobe', '↑ rises', '↑ sube'],
  cai: ['↓ cai', '↓ falls', '↓ baja'],
  estavel: ['→ estável', '→ stable', '→ estable'],
}
const STATUS: Record<PrevisaoJose['status'], { rotulo: [string, string, string]; cor: string; sobre: string }> = {
  aberta: { rotulo: ['Aguardando', 'Waiting', 'Esperando'], cor: '#7f9bb8', sobre: '#101b3d' },
  acertou: { rotulo: ['Acertou', 'Right', 'Acertó'], cor: '#2ecc9b', sobre: '#101b3d' },
  errou: { rotulo: ['Errou', 'Wrong', 'Falló'], cor: '#ff5a6b', sobre: '#2b0007' },
  sem_dado: { rotulo: ['Sem dado oficial', 'No official data', 'Sin dato oficial'], cor: '#f5a623', sobre: '#2b1900' },
}

export function PlacarJose({ lang, temaClaro }: { lang: Lang; temaClaro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG, NESTED_BG, NESTED_BORDA } = PALETA[temaClaro ? 'xms' : 'dark']
  const [placar, setPlacar] = useState<TipoPlacar | null>(null)
  const [erro, setErro] = useState(false)
  const [aberto, setAberto] = useState(false)

  useEffect(() => { obterPlacarJose().then(setPlacar).catch(() => setErro(true)) }, [])

  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const data = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })
  const num = (v: number) => v.toLocaleString(locale, { maximumFractionDigits: 4 })
  const nomeSerie = (codigo: string) => SERIES_PREVISAO.find((x) => x.codigo === codigo)?.nome[lang] ?? codigo
  const conferidas = (placar?.acertos ?? 0) + (placar?.erros ?? 0)
  const taxa = conferidas ? Math.round((placar!.acertos / conferidas) * 100) : null
  const proxima = placar?.previsoes.filter((p) => p.status === 'aberta').map((p) => p.dataAlvo).sort()[0]
  const ACENTO = temaClaro ? '#16a97d' : '#2ecc9b'

  return (
    <section className="relative overflow-hidden rounded-2xl p-4 axi-card-premium3d" style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
      <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className={TITULO_SECAO} style={{ color: TITULO }}>🎯 {L('Placar do José', 'José’s scorecard', 'Marcador de José')}</h2>
          <p className="text-xs mt-0.5" style={{ color: TEXTO, opacity: temaClaro ? 1 : 0.8 }}>
            {L('Toda semana o José diz se dólar, euro, Selic, IPCA, desemprego e petróleo vão subir, cair ou ficar estáveis em 30 e 90 dias. Quando o prazo vence, conferimos com o dado oficial — assim você sabe quanto confiar nele.',
              'Every week José says whether the dollar, euro, Selic, IPCA, unemployment and oil will rise, fall or stay stable in 30 and 90 days. When the deadline arrives, we check it against official data — so you know how much to trust him.',
              'Cada semana José dice si el dólar, el euro, la Selic, el IPCA, el desempleo y el petróleo van a subir, bajar o quedarse estables en 30 y 90 días. Cuando vence el plazo, lo comparamos con el dato oficial — así sabe cuánto confiar en él.')}
          </p>
        </div>
        <button onClick={() => setAberto((a) => !a)} disabled={!placar?.previsoes.length}
          className="shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          style={temaClaro ? VERDE_SOLIDO : { background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', border: 'none', color: '#fff' }}>
          {aberto ? L('Fechar', 'Close', 'Cerrar') : L('Ver previsões', 'See forecasts', 'Ver previsiones')}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { rotulo: L('Acertos', 'Right', 'Aciertos'), valor: taxa == null ? '—' : `${taxa}%`, sub: conferidas ? L(`${placar!.acertos} de ${conferidas} conferidas`, `${placar!.acertos} of ${conferidas} checked`, `${placar!.acertos} de ${conferidas} verificadas`) : L('nenhuma conferida ainda', 'none checked yet', 'ninguna verificada aún') },
          { rotulo: L('Aguardando prazo', 'Awaiting deadline', 'Esperando plazo'), valor: placar ? String(placar.abertas) : '—', sub: proxima ? L(`próxima em ${data(proxima)}`, `next on ${data(proxima)}`, `próxima el ${data(proxima)}`) : '' },
          { rotulo: L('Erros', 'Wrong', 'Errores'), valor: placar ? String(placar.erros) : '—', sub: L('mostrados sem esconder', 'shown, never hidden', 'mostrados sin ocultar') },
        ].map((c) => (
          <div key={c.rotulo} className="relative overflow-hidden rounded-xl p-3 axi-card-premium3d" style={temaClaro ? { background: '#101b3d', border: '1px solid #101b3d' } : { background: NESTED_BG, border: `1px solid ${NESTED_BORDA}` }}>
                <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: temaClaro ? '#ffffff' : CINZA }}>{c.rotulo}</p>
            <p className="text-xl font-black leading-tight" style={{ color: temaClaro ? '#ffffff' : TITULO }}>{c.valor}</p>
            <p className="text-[10px]" style={{ color: temaClaro ? '#dbe4f0' : CINZA }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {erro && <p className="text-xs mt-3" style={{ color: CINZA }}>{L('O placar ainda não está disponível — as primeiras previsões saem no próximo painel do José.', 'The scorecard is not available yet — the first forecasts come with José’s next briefing.', 'El marcador aún no está disponible — las primeras previsiones llegan con el próximo panel de José.')}</p>}
      {placar && !placar.previsoes.length && <p className="text-xs mt-3" style={{ color: CINZA }}>{L('As primeiras previsões saem no próximo painel do José (coleta diária).', 'The first forecasts come with José’s next briefing (daily update).', 'Las primeras previsiones llegan con el próximo panel de José (actualización diaria).')}</p>}

      {aberto && placar && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
          {placar.previsoes.map((p) => {
            const st = STATUS[p.status]
            return (
              <div key={p.id} className="relative overflow-hidden rounded-xl p-3 axi-card-premium3d" style={{ background: NESTED_BG, border: `1px solid ${NESTED_BORDA}` }}>
                <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold" style={{ color: TITULO }}>{nomeSerie(p.serie)} <span className="text-[11px] font-normal" style={{ color: CINZA }}>· {p.horizonte} {L('dias', 'days', 'días')}</span></p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={temaClaro ? { background: st.cor, color: st.sobre } : { background: `${st.cor}20`, color: st.cor }}>{L(...st.rotulo)}</span>
                </div>
                <p className="text-xs mt-1 font-bold" style={{ color: temaClaro ? '#122b54' : ACENTO }}>{L(...DIRECAO[p.direcao])}{p.confianca != null && <span className="font-normal" style={{ color: CINZA }}> · {L('confiança', 'confidence', 'confianza')} {p.confianca}%</span>}</p>
                {p.motivo && <p className="text-[11px] mt-1" style={{ color: TEXTO }}>{p.motivo[lang]}</p>}
                <p className="text-[11px] mt-1.5" style={{ color: CINZA }}>
                  {L('Partida', 'Start', 'Partida')}: <span style={{ color: TEXTO }}>{num(p.valorBase)}</span> ({data(p.dataBase)})
                  {p.valorReal != null
                    ? <> · {L('Real', 'Actual', 'Real')}: <span style={{ color: TEXTO }}>{num(p.valorReal)}</span></>
                    : <> · {L('confere em', 'checked on', 'se verifica el')} {data(p.dataAlvo)}</>}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
