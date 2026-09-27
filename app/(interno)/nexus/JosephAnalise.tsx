'use client'
// Seção "Leitura do Joseph" dentro do modal do evento (Etapa 4). Busca a
// análise em /api/nexus/joseph (guardada por evento/idioma; gera na 1ª vez).
// Visualmente separada do fato acima: é INTERPRETAÇÃO, nunca fato (Push 03).
import { useEffect, useState, type CSSProperties } from 'react'
import { Brain, RotateCcw } from 'lucide-react'
import type { AnaliseJoseph } from '../../../lib/nexusJoseph'

type Lang = 'pt' | 'en' | 'es'
type Nome3 = [string, string, string]

const TIPO_CENARIO: Record<string, { nome: Nome3; escuro: string; claro: string }> = {
  base: { nome: ['Cenário base', 'Base case', 'Escenario base'], escuro: '#6ab0ff', claro: '#101b3d' },
  favoravel: { nome: ['Favorável', 'Upside', 'Favorable'], escuro: '#34d399', claro: '#16a97d' },
  adverso: { nome: ['Adverso', 'Downside', 'Adverso'], escuro: '#f87171', claro: '#dc3545' },
  choque: { nome: ['Choque', 'Shock', 'Shock'], escuro: '#a78bfa', claro: '#b45309' },
}
const PRIORIDADE: Record<string, { nome: Nome3; escuro: string; claro: string }> = {
  alta: { nome: ['Prioridade alta', 'High priority', 'Prioridad alta'], escuro: '#f87171', claro: '#dc3545' },
  media: { nome: ['Prioridade média', 'Medium priority', 'Prioridad media'], escuro: '#fbbf24', claro: '#b45309' },
  baixa: { nome: ['Prioridade baixa', 'Low priority', 'Prioridad baja'], escuro: '#34d399', claro: '#374151' },
}
const DIRECAO: Record<string, { simbolo: string; escuro: string; claro: string }> = {
  positivo: { simbolo: '▲', escuro: '#34d399', claro: '#16a97d' },
  negativo: { simbolo: '▼', escuro: '#f87171', claro: '#dc3545' },
  misto: { simbolo: '◆', escuro: '#fbbf24', claro: '#b45309' },
}

export function JosephAnalise({ eventId, lang, temaClaro }: { eventId: string; lang: Lang; temaClaro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const L3 = (n: Nome3) => L(...n)
  const [analise, setAnalise] = useState<AnaliseJoseph | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    setEstado('carregando')
    setAnalise(null)
    ;(async () => {
      try {
        const res = await fetch('/api/nexus/joseph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: eventId, lang }),
        })
        const json = await res.json().catch(() => null)
        if (cancelado) return
        if (res.ok && json?.analise) { setAnalise(json.analise); setEstado('ok') } else setEstado('erro')
      } catch {
        if (!cancelado) setEstado('erro')
      }
    })()
    return () => { cancelado = true }
  }, [eventId, lang, tentativa])

  const TIT = temaClaro ? '#101b3d' : '#e2ecf7'
  const TXT = temaClaro ? '#101b3d' : '#c8d8f0'
  const SEC = temaClaro ? '#374151' : '#8aa4c2'
  const ACENTO = temaClaro ? '#16a97d' : '#22d3ee'
  const caixa: CSSProperties = temaClaro
    ? { background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(16,27,61,0.12)' }
    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
  const cor = (c: { escuro: string; claro: string }) => (temaClaro ? c.claro : c.escuro)
  const rotulo = (texto: string) => <p className="text-[11px] font-bold mb-1" style={{ color: SEC }}>{texto}</p>

  return (
    <section className="mt-5 rounded-2xl p-4" style={{ border: `1px dashed ${ACENTO}80` }} aria-live="polite">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Brain size={16} style={{ color: ACENTO }} aria-hidden />
        <h4 className="text-sm font-black" style={{ color: TIT }}>{L('Leitura do Joseph', "Joseph's reading", 'Lectura de Joseph')}</h4>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: SEC, border: `1px solid ${SEC}60` }}>
          {L('Interpretação — não é fato', 'Interpretation — not a fact', 'Interpretación — no es un hecho')}
        </span>
      </div>

      {estado === 'carregando' && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: TXT }}>
            {L('O Joseph está analisando este evento. Na primeira vez leva até 1 minuto — depois fica guardado.', 'Joseph is analyzing this event. The first time takes up to a minute — then it is saved.', 'Joseph está analizando este evento. La primera vez tarda hasta un minuto — luego queda guardado.')}
          </p>
          {[0, 1, 2].map((i) => <div key={i} className="h-3 rounded animate-pulse" style={{ background: temaClaro ? 'rgba(16,27,61,0.08)' : 'rgba(255,255,255,0.06)', width: `${90 - i * 15}%` }} />)}
        </div>
      )}

      {estado === 'erro' && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs" style={{ color: TXT }}>
            {L('Não foi possível gerar a leitura agora.', 'Could not generate the reading right now.', 'No fue posible generar la lectura ahora.')}
          </p>
          <button onClick={() => setTentativa((t) => t + 1)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
            style={temaClaro ? { background: 'linear-gradient(135deg, #16a97d, #2ecc9b)', color: '#fff' } : { background: `${ACENTO}18`, border: `1px solid ${ACENTO}50`, color: ACENTO }}>
            <RotateCcw size={12} aria-hidden />{L('Tentar de novo', 'Try again', 'Intentar de nuevo')}
          </button>
        </div>
      )}

      {estado === 'ok' && analise && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: TXT }}>{analise.leitura}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={caixa}>{rotulo(L('Impacto no Brasil', 'Impact on Brazil', 'Impacto en Brasil'))}<p className="text-xs leading-relaxed" style={{ color: TXT }}>{analise.impacto_brasil}</p></div>
            <div className="rounded-xl p-3" style={caixa}>{rotulo(L('Impacto global', 'Global impact', 'Impacto global'))}<p className="text-xs leading-relaxed" style={{ color: TXT }}>{analise.impacto_global}</p></div>
          </div>

          {analise.impacto_setores.length > 0 && (
            <div>
              {rotulo(L('Setores mais afetados', 'Most affected sectors', 'Sectores más afectados'))}
              <ul className="space-y-1.5">
                {analise.impacto_setores.map((s, i) => {
                  const d = DIRECAO[s.direcao] ?? DIRECAO.misto
                  return (
                    <li key={i} className="text-xs leading-relaxed" style={{ color: TXT }}>
                      <span className="font-bold" style={{ color: cor(d) }}>{d.simbolo} {s.setor}:</span> {s.efeito}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="rounded-xl p-3" style={caixa}>
            {rotulo(L('O que muda para uma empresa como a sua', 'What changes for a business like yours', 'Qué cambia para una empresa como la suya'))}
            <p className="text-xs leading-relaxed" style={{ color: TXT }}>{analise.impacto_empresa}</p>
            <p className="text-[10px] mt-2" style={{ color: SEC }}>
              {L('Visão para uma empresa típica. A conta com os números da sua empresa chega com o simulador "E se...?".', 'View for a typical business. The math with your own numbers comes with the "What if...?" simulator.', 'Visión para una empresa típica. El cálculo con sus números llega con el simulador "¿Y si...?".')}
            </p>
          </div>

          <div>
            {rotulo(L('Cenários', 'Scenarios', 'Escenarios'))}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {analise.cenarios.map((c, i) => {
                const t = TIPO_CENARIO[c.tipo] ?? TIPO_CENARIO.base
                const p = Math.max(0, Math.min(100, Math.round(c.probabilidade)))
                return (
                  <div key={i} className="rounded-xl p-3" style={{ ...caixa, borderTop: `3px solid ${cor(t)}` }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold" style={{ color: cor(t) }}>{L3(t.nome)}</span>
                      <span className="text-[11px] font-bold" style={{ color: TIT }}>{p}%</span>
                    </div>
                    <div className="h-1.5 rounded-full mb-2" style={{ background: temaClaro ? 'rgba(16,27,61,0.08)' : 'rgba(255,255,255,0.08)' }} role="img" aria-label={`${p}%`}>
                      <div className="h-1.5 rounded-full" style={{ width: `${p}%`, background: cor(t) }} />
                    </div>
                    <p className="text-xs font-bold mb-0.5" style={{ color: TIT }}>{c.titulo}</p>
                    <p className="text-xs leading-relaxed" style={{ color: TXT }}>{c.descricao}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            {rotulo(L('O que fazer', 'What to do', 'Qué hacer'))}
            <ol className="space-y-2">
              {analise.o_que_fazer.map((a, i) => {
                const pr = PRIORIDADE[a.prioridade] ?? PRIORIDADE.media
                return (
                  <li key={i} className="rounded-xl p-3" style={caixa}>
                    <p className="text-xs font-bold leading-snug" style={{ color: TIT }}>{i + 1}. {a.acao}</p>
                    <p className="text-[10px] mt-1" style={{ color: SEC }}>
                      <span className="font-bold" style={{ color: cor(pr) }}>{L3(pr.nome)}</span> · {a.horizonte}
                    </p>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={caixa}>{rotulo(L('Risco — o que pode destruir valor', 'Risk — what can destroy value', 'Riesgo — lo que puede destruir valor'))}<p className="text-xs leading-relaxed" style={{ color: TXT }}>{analise.risco}</p></div>
            <div className="rounded-xl p-3" style={caixa}>{rotulo(L('Oportunidade — o que pode criar valor', 'Opportunity — what can create value', 'Oportunidad — lo que puede crear valor'))}<p className="text-xs leading-relaxed" style={{ color: TXT }}>{analise.oportunidade}</p></div>
          </div>

          <details className="rounded-xl p-3" style={caixa}>
            <summary className="cursor-pointer text-xs font-bold" style={{ color: TIT }}>
              {L('Confiança da leitura', 'Reading confidence', 'Confianza de la lectura')}: {Math.round(analise.confianca)}/100 — {L('por que o Joseph acha isso?', 'why does Joseph think so?', '¿por qué Joseph piensa esto?')}
            </summary>
            <div className="mt-2 space-y-2">
              <ul className="list-disc pl-4 space-y-0.5">{analise.porque_confianca.map((m, i) => <li key={i} className="text-xs" style={{ color: TXT }}>{m}</li>)}</ul>
              {rotulo(L('O que pode mudar este quadro', 'What could change this picture', 'Qué puede cambiar este panorama'))}
              <ul className="list-disc pl-4 space-y-0.5">{analise.incertezas.map((m, i) => <li key={i} className="text-xs" style={{ color: TXT }}>{m}</li>)}</ul>
              <p className="text-[10px]" style={{ color: SEC }}>{L('Horizonte', 'Horizon', 'Horizonte')}: {analise.horizonte}</p>
            </div>
          </details>
        </div>
      )}
    </section>
  )
}
