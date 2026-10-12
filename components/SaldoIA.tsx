'use client'
// SALDO DE IA DO MÊS + RECARGA (Elias 2026-10-11). Lê ia_situacao (banco decide plano, teste e
// ciclo) e abre o pagamento avulso do Stripe (/api/stripe/recarga). O saldo só sobe quando o
// Stripe confirma o pagamento (webhook) — por isso, ao voltar do pagamento, relê em alguns segundos.
import { useEffect, useState } from 'react'
import { createBrowserClient } from '../lib/supabaseBrowser'
import { CanvasBox } from './CanvasBox'
import { RECARGAS, reais, type TipoIA } from '../lib/planos'
import { reportarFalhaLeitura } from '../lib/erroUiHelpers'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
type Lang = 'pt' | 'en' | 'es'
type Linha = { limite: number; usado: number; recarga: number; restante: number }
type Situacao = Record<TipoIA, Linha> & { teste: boolean; teste_ia_ate: string | null; teste_ate: string | null; ciclo_fim: string; ilimitada: boolean }

const ROTULO: Record<TipoIA, { pt: string; en: string; es: string }> = {
  openai: { pt: 'IA comum (OpenAI)', en: 'Standard AI (OpenAI)', es: 'IA común (OpenAI)' },
  anthropic: { pt: 'IA avançada (Anthropic)', en: 'Advanced AI (Anthropic)', es: 'IA avanzada (Anthropic)' },
  nota: { pt: 'Notas lidas pela IA', en: 'Invoices read by AI', es: 'Facturas leídas por IA' },
}

export function SaldoIA({ empresaId, lang, temaClaro }: { empresaId: string | null; lang: Lang; temaClaro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const TEXTO = temaClaro ? '#101b3d' : '#e6edf5'
  const MUTED = temaClaro ? '#374151' : '#a3b1c2'
  const ACENTO = temaClaro ? '#16a97d' : '#2ecc9b'
  const NESTED = temaClaro ? { background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(16,27,61,0.12)' } : { background: 'rgba(2,8,16,0.5)', border: '1px solid rgba(46,204,155,0.15)' }
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const [s, setS] = useState<Situacao | null>(null)
  const [erro, setErro] = useState(false)
  const [abrindo, setAbrindo] = useState<TipoIA | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    if (!empresaId) return
    let cancelado = false
    const ler = async () => {
      const { data, error } = await supabase.rpc('ia_situacao', { p_empresa: empresaId })
      if (cancelado) return
      if (error) { reportarFalhaLeitura('uso-ia.saldo', new Error(error.message)); setErro(true); return }
      setErro(false); setS(data as Situacao)
    }
    ler()
    // Voltou do pagamento da recarga: o Stripe confirma em segundos — relê para mostrar o saldo novo.
    const voltou = new URLSearchParams(window.location.search).get('recarga')
    if (voltou === 'sucesso') setAviso(L('Pagamento recebido. O saldo novo aparece aqui em alguns segundos.', 'Payment received. Your new balance shows here in a few seconds.', 'Pago recibido. El nuevo saldo aparece aquí en unos segundos.'))
    const t = voltou === 'sucesso' ? setTimeout(ler, 6000) : undefined
    return () => { cancelado = true; if (t) clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function recarregar(tipo: TipoIA) {
    if (!empresaId) return
    setAbrindo(tipo)
    const r = await fetch('/api/stripe/recarga', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empresa_id: empresaId, tipo }) }).catch(() => null)
    const j = r ? await r.json().catch(() => null) : null
    if (j?.url) { window.location.href = j.url; return }
    setAbrindo(null)
    setAviso(L('Não foi possível abrir o pagamento agora. Tente de novo em instantes.', 'Could not open the payment right now. Try again shortly.', 'No fue posible abrir el pago ahora. Intente de nuevo en instantes.'))
  }

  const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale) : '—')

  return (
    <CanvasBox cor={ACENTO} fundo={temaClaro ? '#f6f7c4' : undefined} premium3d>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <p className="text-sm font-black" style={{ color: TEXTO }}>{L('Saldo de IA deste mês', 'This month’s AI balance', 'Saldo de IA de este mes')}</p>
        {s && !s.ilimitada && (
          <p className="text-xs" style={{ color: MUTED }}>
            {s.teste
              ? L(`Teste grátis: IA até ${data(s.teste_ia_ate)} · teste até ${data(s.teste_ate)}`, `Free trial: AI until ${data(s.teste_ia_ate)} · trial until ${data(s.teste_ate)}`, `Prueba gratis: IA hasta ${data(s.teste_ia_ate)} · prueba hasta ${data(s.teste_ate)}`)
              : L(`O saldo do plano volta cheio em ${data(s.ciclo_fim)}`, `Your plan balance refills on ${data(s.ciclo_fim)}`, `El saldo del plan vuelve completo el ${data(s.ciclo_fim)}`)}
          </p>
        )}
      </div>
      {aviso && <p className="text-xs mb-3 rounded-lg px-3 py-2" style={{ ...NESTED, color: TEXTO }}>{aviso}</p>}
      {erro ? <p className="text-sm py-4 text-center" style={{ color: TEXTO }}>{L('Não foi possível ler o saldo agora. Tente de novo em instantes.', 'Could not read the balance right now. Try again shortly.', 'No fue posible leer el saldo ahora. Intente de nuevo en instantes.')}</p>
        : !s ? <p className="text-sm py-4 text-center" style={{ color: MUTED }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
        : s.ilimitada ? <p className="text-sm py-2" style={{ color: TEXTO }}>{L('Esta empresa tem IA sem limite (uso interno).', 'This company has unlimited AI (internal use).', 'Esta empresa tiene IA sin límite (uso interno).')}</p>
        : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['openai', 'anthropic', 'nota'] as TipoIA[]).map((tipo) => {
              const x = s[tipo]
              const doPlano = Math.max(x.limite - x.usado, 0)
              const pctUsado = x.limite > 0 ? Math.min(100, Math.round((x.usado / x.limite) * 100)) : 100
              const alerta = pctUsado >= 80 && x.recarga === 0
              const rec = RECARGAS[tipo]
              return (
                <div key={tipo} className="rounded-xl p-4" style={NESTED}>
                  <p className="text-xs font-semibold" style={{ color: MUTED }}>{ROTULO[tipo][lang]}</p>
                  <p className="text-2xl font-black mt-1" style={{ color: TEXTO }}>{x.restante.toLocaleString(locale)}</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>
                    {L(`restantes · plano: ${doPlano} de ${x.limite}`, `left · plan: ${doPlano} of ${x.limite}`, `restantes · plan: ${doPlano} de ${x.limite}`)}{x.recarga > 0 ? L(` · recarga: ${x.recarga}`, ` · top-up: ${x.recarga}`, ` · recarga: ${x.recarga}`) : ''}
                  </p>
                  <div className="h-1.5 rounded-full mt-2" style={{ background: temaClaro ? 'rgba(16,27,61,0.08)' : 'rgba(46,204,155,0.1)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pctUsado}%`, background: alerta ? (temaClaro ? '#b91c1c' : '#f87171') : ACENTO }} />
                  </div>
                  {alerta && <p className="text-[11px] mt-2 font-semibold" style={{ color: temaClaro ? '#b91c1c' : '#f87171' }}>{x.restante === 0 ? L('Acabou — recarregue para continuar.', 'Used up — top up to continue.', 'Se agotó — recarga para continuar.') : L('Mais de 80% usado.', 'Over 80% used.', 'Más del 80% usado.')}</p>}
                  <button onClick={() => recarregar(tipo)} disabled={abrindo !== null}
                    className="mt-3 w-full px-3 py-2 rounded-lg text-xs font-bold"
                    style={{ background: abrindo !== null ? (temaClaro ? '#6b7280' : '#334155') : 'linear-gradient(135deg,#0a4f3b,#0f7d5c)', color: '#ffffff' }}>
                    {abrindo === tipo ? L('Abrindo pagamento...', 'Opening payment...', 'Abriendo pago...') : `${L('Recarregar', 'Top up', 'Recargar')}: ${rec.nome[lang]} · ${reais(rec.centavos, lang)}`}
                  </button>
                </div>
              )
            })}
          </div>
        )}
    </CanvasBox>
  )
}
