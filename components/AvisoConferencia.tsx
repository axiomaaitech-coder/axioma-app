'use client'
// Conferência diária entre módulos (bloco A2, Elias 2026-10-10): uma vez por dia, ao
// abrir o Axioma, roda a mesma conferência da tela /conferencia no mês atual e no
// anterior. Se algum par não bater (DRE × Contabilidade, pago/recebido × Fluxo),
// mostra no topo de todas as telas o que diverge e quanto, com atalho pra conferência.
// Recalcula também quando uma tela avisa que os dados mudaram. Só leitura.
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ChevronDown, X } from 'lucide-react'
import { obterEmpresaAtiva } from '../lib/empresaHelpers'
import { hojeISO } from '../lib/datas'
import { useLanguage } from '../lib/LanguageContext'
import { carregarConferencia, type LinhaConferencia } from '../lib/conferenciaHelpers'

type Falha = { mes: string; par: keyof Omit<LinhaConferencia, 'mes'>; diferenca: number }
const PARES: Falha['par'][] = ['receitaDreXContabil', 'custoDreXContabil', 'pagoXFluxo', 'recebidoXFluxo']

// Pura: quais pares não bateram.
export function falhasDaConferencia(meses: LinhaConferencia[]): Falha[] {
  return meses.flatMap((m) => PARES.filter((p) => !m[p].ok).map((p) => ({ mes: m.mes, par: p, diferenca: m[p].diferenca })))
}

export default function AvisoConferencia() {
  const caminho = usePathname()
  const { idioma } = useLanguage()
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt)
  const [falhas, setFalhas] = useState<Falha[]>([])
  const [aberto, setAberto] = useState(false)
  const [oculto, setOculto] = useState(false)
  const ativo = !caminho?.startsWith('/pdv') && caminho !== '/conferencia'
  const hoje = hojeISO()
  const chaveOculto = 'axioma:aviso-conferencia-oculto'

  async function conferir(forcar: boolean) {
    try {
      const empresaId = await obterEmpresaAtiva()
      if (!empresaId) return
      const chave = `axioma:conferencia-dia:${empresaId}`
      if (!forcar) {
        try {
          const c = JSON.parse(localStorage.getItem(chave) || 'null') // varredura:ok cache do dia; sem ele recalcula
          if (c?.dia === hoje) { setFalhas(c.falhas); return }
        } catch { /* sem cache: calcula */ } // varredura:ok
      }
      const [a, m] = hoje.split('-').map(Number)
      const anterior = m === 1 ? `${a - 1}-12-01` : `${a}-${String(m - 1).padStart(2, '0')}-01`
      const r = await carregarConferencia(empresaId, anterior, `${hoje.slice(0, 7)}-31`, (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as 'pt' | 'en' | 'es')
      if (r.falhou) return // leitura incompleta: não acusa diferença que pode não existir (já foi ao Sentry)
      const f = falhasDaConferencia(r.meses)
      setFalhas(f)
      try { localStorage.setItem(chave, JSON.stringify({ dia: hoje, falhas: f })) } catch { /* recalcula na próxima */ } // varredura:ok
    } catch { /* tenta de novo quando os dados mudarem ou amanhã */ } // varredura:ok aviso informativo; a tela Conferência mostra o mesmo
  }

  useEffect(() => {
    if (!ativo) return
    try { setOculto(localStorage.getItem(chaveOculto) === hoje) } catch { /* mostra */ } // varredura:ok
    void conferir(false)
    // ponytail: recalcula a conferência inteira (2 meses) a cada mudança; se pesar em empresa grande, agregar no banco (RPC).
    const mudou = () => { void conferir(true) }
    window.addEventListener('axioma:dados-atualizados', mudou)
    return () => window.removeEventListener('axioma:dados-atualizados', mudou)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, hoje])

  if (!ativo || oculto || falhas.length === 0) return null
  const brl = (v: number) => Math.abs(v).toLocaleString(idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR', { style: 'currency', currency: 'BRL' })
  const NOME: Record<Falha['par'], string> = {
    receitaDreXContabil: L('Receita: DRE × Contabilidade', 'Revenue: P&L × Accounting', 'Ingreso: EERR × Contabilidad'),
    custoDreXContabil: L('Custos: DRE × Contabilidade', 'Costs: P&L × Accounting', 'Costos: EERR × Contabilidad'),
    pagoXFluxo: L('Contas pagas × Fluxo de Caixa', 'Paid bills × Cash Flow', 'Cuentas pagadas × Flujo de Caja'),
    recebidoXFluxo: L('Contas recebidas × Fluxo de Caixa', 'Received bills × Cash Flow', 'Cuentas cobradas × Flujo de Caja'),
  }
  const mesTxt = (mes: string) => `${mes.slice(5, 7)}/${mes.slice(0, 4)}`

  return (
    <div className="px-4 pt-3">
      <div className="max-w-7xl mx-auto rounded-xl axi-card-premium3d axi-card-faixa" style={{ background: '#101b3d', border: '1px solid rgba(255,90,107,0.55)', color: '#ffffff' }}>
        <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
          <AlertTriangle size={18} style={{ color: '#ff5a6b' }} className="flex-shrink-0" />
          <button onClick={() => setAberto((v) => !v)} className="flex-1 min-w-0 text-left text-sm" aria-expanded={aberto}>
            <strong>❌ {L(`Conferência de hoje: ${falhas.length} diferença${falhas.length > 1 ? 's' : ''} entre módulos`, `Today's check: ${falhas.length} difference${falhas.length > 1 ? 's' : ''} between modules`, `Conferencia de hoy: ${falhas.length} diferencia${falhas.length > 1 ? 's' : ''} entre módulos`)}</strong>
            <ChevronDown size={14} className="inline ml-2" style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>
          <Link href="/conferencia" className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#0f7a5a', color: '#ffffff' }}>{L('Ver conferência', 'View check', 'Ver conferencia')}</Link>
          <button onClick={() => { setOculto(true); try { localStorage.setItem(chaveOculto, hoje) } catch { /* só nesta tela */ } }} // varredura:ok
            title={L('Ocultar até amanhã', 'Hide until tomorrow', 'Ocultar hasta mañana')} className="text-xs opacity-80 hover:opacity-100 flex items-center gap-1">
            <X size={14} />{L('Ocultar hoje', 'Hide today', 'Ocultar hoy')}
          </button>
        </div>
        {aberto && (
          <div className="px-4 pb-3 space-y-1.5">
            {falhas.map((f) => (
              <Link key={`${f.mes}-${f.par}`} href="/conferencia" className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs hover:brightness-125" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span className="min-w-0 truncate"><strong>{mesTxt(f.mes)}</strong> • {NOME[f.par]}</span>
                <span className="flex-shrink-0" style={{ color: '#fca5a5' }}>{L('diferença', 'difference', 'diferencia')} <strong>{brl(f.diferenca)}</strong></span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
