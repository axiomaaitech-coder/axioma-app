'use client'
// Botão "Pesquisar" de todo card/janela do Nexus → Motor de Pesquisa Nexus
// (lib/nexusPesquisa.ts): dado oficial com fonte e hora da coleta, leitura do
// José e as reportagens coletadas, com veículo, data e link pra conferir.
import { useState, type MouseEvent } from 'react'
import { Search, ExternalLink, X, RotateCcw } from 'lucide-react'
import Modal from '../../../components/Modal'
import { JosephAvatar } from '../../../components/JosephAvatar'
import { PALETA } from '../../../lib/nexusTema'
import type { ResultadoPesquisa } from '../../../lib/nexusPesquisa'

type Lang = 'pt' | 'en' | 'es'
const localDe = (lang: Lang) => (lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR')

export function BotaoPesquisaNexus({ tema, lang, temaClaro, rotulo }: { tema: string; lang: Lang; temaClaro: boolean; rotulo?: string }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const [aberto, setAberto] = useState(false)
  const [estado, setEstado] = useState<'parado' | 'carregando' | 'ok' | 'erro'>('parado')
  const [r, setR] = useState<ResultadoPesquisa | null>(null)

  async function pesquisar() {
    setEstado('carregando')
    try {
      const res = await fetch('/api/nexus/pesquisa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tema, lang }) })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.pesquisa) throw new Error(String(res.status))
      setR(j.pesquisa); setEstado('ok')
    } catch { setEstado('erro') }
  }
  const abrir = (e: MouseEvent) => { e.stopPropagation(); setAberto(true); if (estado !== 'ok' || r?.titulo == null) void pesquisar() }

  return (
    <>
      <button onClick={abrir} title={L('Pesquisar fontes e reportagens sobre isto', 'Search sources and news about this', 'Buscar fuentes y noticias sobre esto')}
        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md transition-transform hover:scale-105"
        style={temaClaro ? { background: '#101b3d', color: '#fff' } : { color: '#2ecc9b', border: '1px solid rgba(46,204,155,0.45)' }}>
        <Search size={11} aria-hidden />{rotulo ?? L('Pesquisar', 'Search', 'Buscar')}
      </button>
      <Modal open={aberto} onClose={() => setAberto(false)} maxWidthClassName="max-w-2xl">
        <JanelaPesquisa lang={lang} temaClaro={temaClaro} estado={estado} r={r} onFechar={() => setAberto(false)} onTentar={pesquisar} />
      </Modal>
    </>
  )
}

function JanelaPesquisa({ lang, temaClaro, estado, r, onFechar, onTentar }: { lang: Lang; temaClaro: boolean; estado: string; r: ResultadoPesquisa | null; onFechar: () => void; onTentar: () => void }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { CIANO, CINZA, TEXTO, TITULO } = PALETA[temaClaro ? 'xms' : 'dark']
  const fundo = temaClaro ? '#f6f7c4' : '#0b1626'
  const acento = temaClaro ? '#0f7d5c' : CIANO
  const local = localDe(lang)
  const dataRef = (d: string, freq: string | null) => new Date(d + 'T00:00:00').toLocaleDateString(local, freq === 'mensal' || freq === 'mensal_defasada' ? { month: 'long', year: 'numeric' } : freq === 'anual' ? { year: 'numeric' } : undefined)
  const num = (v: number) => v.toLocaleString(local, { maximumFractionDigits: 4 })

  return (
    <div className="relative rounded-2xl p-5 axi-card-premium3d" style={{ background: fundo, border: `1px solid ${CIANO}55` }}>
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: '#2ecc9b' }} aria-hidden />
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: acento }}>
            <Search size={12} aria-hidden />{L('Motor de Pesquisa Nexus', 'Nexus Search Engine', 'Motor de Búsqueda Nexus')}
          </p>
          <h3 className="text-lg font-black leading-snug mt-0.5" style={{ color: TITULO }}>{r?.titulo ?? '…'}</h3>
        </div>
        <button onClick={onFechar} aria-label={L('Fechar', 'Close', 'Cerrar')} style={{ color: CINZA }}><X size={20} /></button>
      </div>

      {estado === 'carregando' && (
        <div className="flex items-center gap-3 py-6" role="status">
          <JosephAvatar tamanho={44} estado="pensando" />
          <div>
            <p className="text-sm font-bold" style={{ color: TITULO }}>{L('Pesquisando…', 'Searching…', 'Buscando…')}</p>
            <p className="text-xs" style={{ color: TEXTO }}>{L('Lendo o dado oficial e as reportagens coletadas pelo Axioma.', 'Reading the official data and the news collected by Axioma.', 'Leyendo el dato oficial y las noticias recogidas por Axioma.')}</p>
          </div>
        </div>
      )}

      {estado === 'erro' && (
        <div className="flex flex-wrap items-center gap-3 py-4">
          <p className="text-sm" style={{ color: TEXTO }}>{L('Não foi possível pesquisar agora.', 'Could not search right now.', 'No fue posible buscar ahora.')}</p>
          <button onClick={onTentar} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>
            <RotateCcw size={12} aria-hidden />{L('Tentar de novo', 'Try again', 'Intentar de nuevo')}
          </button>
        </div>
      )}

      {estado === 'ok' && r && (
        <div className="space-y-4">
          {r.dados.length > 0 && (
            <section>
              <p className="text-[11px] font-black uppercase tracking-wide mb-1.5" style={{ color: CINZA }}>{L('Dado oficial', 'Official data', 'Dato oficial')}</p>
              <ul className="space-y-1.5">
                {r.dados.map((d) => (
                  <li key={d.serie} className="rounded-xl px-3 py-2" style={{ background: temaClaro ? 'rgba(16,27,61,0.05)' : 'rgba(255,255,255,0.04)' }}>
                    <p className="text-sm font-bold" style={{ color: TITULO }}>{d.nome}: {num(d.valor)}
                      {d.anterior && <span className="text-xs font-semibold" style={{ color: CINZA }}> ({L('antes', 'before', 'antes')}: {num(d.anterior.valor)})</span>}
                    </p>
                    <p className="text-[11px]" style={{ color: TEXTO }}>
                      {L('Referência', 'Reference', 'Referencia')}: {dataRef(d.data, d.frequencia)}
                      {d.fonte && <> · {L('Fonte', 'Source', 'Fuente')}: {d.pagina ? <a href={d.pagina} target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{ color: acento }}>{d.fonte}</a> : d.fonte}</>}
                      {d.coletadoEm && <> · {L('coletado em', 'collected on', 'recolectado el')} {new Date(d.coletadoEm).toLocaleString(local, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</>}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.resumo && (
            <section>
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide mb-1.5" style={{ color: CINZA }}>
                <JosephAvatar tamanho={18} estado="parado" />{L('Leitura do José', "José's reading", 'Lectura de José')}
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: TEXTO }}>{r.resumo}</p>
              {r.pontos.length > 0 && <ul className="mt-2 space-y-1">{r.pontos.map((p, i) => <li key={i} className="flex gap-1.5 text-[13px]" style={{ color: TEXTO }}><span style={{ color: acento }}>▸</span>{p}</li>)}</ul>}
              {r.paraEmpresa && <p className="mt-2 text-[13px] font-semibold rounded-lg px-3 py-2" style={{ color: TITULO, background: temaClaro ? 'rgba(46,204,155,0.15)' : 'rgba(46,204,155,0.08)' }}>💼 {r.paraEmpresa}</p>}
            </section>
          )}

          <section>
            <p className="text-[11px] font-black uppercase tracking-wide mb-1.5" style={{ color: CINZA }}>
              {L('Reportagens coletadas (últimos 30 dias)', 'Collected news (last 30 days)', 'Noticias recogidas (últimos 30 días)')}
            </p>
            {r.materias.length === 0
              ? <p className="text-xs" style={{ color: TEXTO }}>{L('Nenhuma reportagem sobre este tema nos últimos 30 dias. Use o dado oficial acima.', 'No news on this topic in the last 30 days. Use the official data above.', 'Ninguna noticia sobre este tema en los últimos 30 días. Use el dato oficial de arriba.')}</p>
              : <ul className="space-y-2.5">
                  {r.materias.map((m, i) => (
                    <li key={i} className="rounded-xl px-3 py-2.5" style={{ border: `1px solid ${CIANO}30` }}>
                      {m.url
                        ? <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-[13px] font-bold underline leading-snug" style={{ color: TITULO }}>{m.titulo}<ExternalLink size={11} className="mt-0.5 shrink-0" aria-hidden /></a>
                        : <p className="text-[13px] font-bold leading-snug" style={{ color: TITULO }}>{m.titulo}</p>}
                      <p className="text-[11px] mt-0.5" style={{ color: acento }}>{m.veiculo} · {new Date(m.data).toLocaleString(local, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      {m.resumo && <p className="text-[12px] leading-relaxed mt-1" style={{ color: TEXTO }}>{m.resumo}</p>}
                    </li>
                  ))}
                </ul>}
          </section>

          <p className="text-[10px] text-right" style={{ color: CINZA }}>
            {r.assinatura === 'José' ? L('— José, pelo Motor de Pesquisa Nexus', '— José, via the Nexus Search Engine', '— José, por el Motor de Búsqueda Nexus') : L('— Motor de Pesquisa Nexus', '— Nexus Search Engine', '— Motor de Búsqueda Nexus')}
            {' · '}{new Date(r.geradoEm).toLocaleString(local, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            {' · '}{L('reportagens: fonte jornalística, não confirmada oficialmente', 'news: journalistic source, not officially confirmed', 'noticias: fuente periodística, no confirmada oficialmente')}
          </p>
        </div>
      )}
    </div>
  )
}
