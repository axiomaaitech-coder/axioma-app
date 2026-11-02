'use client'
// Contas Vencidas — a pagar e a receber atrasadas numa tela só (Elias 2026-11-02). Só leitura:
// cada conta leva à tela de origem já filtrada em "vencido", onde se paga/recebe ou cobra.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { ThemeToggle } from '../../../components/ThemeToggle'
import { useThemeAxioma } from '../../../lib/ThemeContext'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import { carregarContasVencidas, type ContaVencida, type ResumoVencidas } from '../../../lib/contasVencidasHelpers'

type Idioma3 = 'pt' | 'en' | 'es'
const PALETA = {
  // Escuro: paleta aprovada 2026-10-03 (alerta amarelo, nada de laranja). Claro: card creme, caixa
  // aninhada bege, texto menta escuro/navy (mesmas cores de Inadimplência e Contas a Receber).
  dark: { VERDE: '#34d399', VERMELHO: '#f87171', AMBAR: '#facc15', CINZA: '#a3b1c2', TEXTO: '#e6edf5', PAINEL_BG: 'linear-gradient(180deg, rgba(16,32,58,0.92), rgba(10,22,40,0.92))', ANINHADA: 'rgba(2,8,16,0.5)', BORDA: 'rgba(46,204,155,0.15)' },
  xms: { VERDE: '#0f7a5a', VERMELHO: '#d93848', AMBAR: '#b45309', CINZA: '#374151', TEXTO: '#101b3d', PAINEL_BG: '#f6f7c4', ANINHADA: 'rgba(245,238,220,0.7)', BORDA: 'rgba(16,27,61,0.12)' },
} as const
const BOTAO_ACAO = 'linear-gradient(135deg, #0a4f3b, #0f7d5c)'
const BOTAO_SECUNDARIO = '#101b3d'

export default function ContasVencidasPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const local = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const fmt = (v: number) => v.toLocaleString(local, { style: 'currency', currency: 'BRL' })
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const P = PALETA[tema]
  const [r, setR] = useState<ResumoVencidas | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const ler = () => { void obterEmpresaAtiva().then(async (id) => { setR(id ? await carregarContasVencidas(id) : null); setCarregando(false) }) }
    ler()
    window.addEventListener('axioma:dados-atualizados', ler)
    return () => window.removeEventListener('axioma:dados-atualizados', ler)
  }, [])

  const painel = { background: P.PAINEL_BG, border: `1px solid ${P.BORDA}` }
  const aninhada = { background: P.ANINHADA, border: `1px solid ${P.BORDA}` }
  const liquido = (r?.totalReceber ?? 0) - (r?.totalPagar ?? 0)
  const dataTxt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(local)
  const diasTxt = (n: number) => L(`${n} dia${n > 1 ? 's' : ''} de atraso`, `${n} day${n > 1 ? 's' : ''} overdue`, `${n} día${n > 1 ? 's' : ''} de atraso`)

  const lista = (tipo: ContaVencida['tipo'], itens: ContaVencida[], total: number) => {
    const pagar = tipo === 'pagar'
    const href = pagar ? '/contas-pagar?filtro=vencido' : '/contas-receber?filtro=vencido'
    return (
      <div className="rounded-2xl p-4 axi-card-premium3d axi-card-faixa min-w-0" style={painel}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: P.TEXTO }}>
            {pagar ? <ArrowUpRight size={16} style={{ color: P.VERMELHO }} /> : <ArrowDownLeft size={16} style={{ color: P.VERDE }} />}
            {pagar ? L('A pagar vencidas', 'Overdue payables', 'Por pagar vencidas') : L('A receber vencidas', 'Overdue receivables', 'Por cobrar vencidas')} ({itens.length})
          </p>
          <Link href={href} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: pagar ? BOTAO_SECUNDARIO : BOTAO_ACAO, color: '#ffffff' }}>
            {pagar ? L('Pagar em Contas a Pagar', 'Pay in Payables', 'Pagar en Cuentas por Pagar') : L('Receber em Contas a Receber', 'Receive in Receivables', 'Cobrar en Cuentas por Cobrar')}
          </Link>
        </div>
        {itens.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: P.VERDE }}>{pagar ? L('Nenhuma conta a pagar vencida.', 'No overdue payables.', 'Ninguna cuenta por pagar vencida.') : L('Nenhuma conta a receber vencida.', 'No overdue receivables.', 'Ninguna cuenta por cobrar vencida.')}</p>
        ) : (
          <div className="space-y-2">
            {itens.slice(0, 100).map((c) => (
              <Link key={c.id} href={href} className="block rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={aninhada}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: P.TEXTO }}>{c.descricao}</p>
                    {c.nome && <p className="text-xs truncate" style={{ color: P.CINZA }}>{c.nome}</p>}
                    <p className="text-[11px] mt-0.5" style={{ color: P.CINZA }}>{L('Venceu em', 'Due on', 'Venció el')} {dataTxt(c.vencimento)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: pagar ? P.VERMELHO : P.VERDE }}>{fmt(c.saldo)}</p>
                    <p className="text-[11px] font-semibold" style={{ color: c.dias > 30 ? P.VERMELHO : P.AMBAR }}>{diasTxt(c.dias)}</p>
                  </div>
                </div>
              </Link>
            ))}
            {itens.length > 100 && <p className="text-[11px] text-center" style={{ color: P.CINZA }}>{L(`+${itens.length - 100} contas — veja todas na tela de origem`, `+${itens.length - 100} bills — see all on the source screen`, `+${itens.length - 100} cuentas — vea todas en la pantalla de origen`)}</p>}
          </div>
        )}
        {itens.length > 0 && <p className="text-xs font-bold mt-3 text-right" style={{ color: P.TEXTO }}>{L('Total', 'Total', 'Total')}: {fmt(total)}</p>}
      </div>
    )
  }

  return (
    <div data-theme={tema}>
      <ModuloLayout titulo={L('Contas Vencidas', 'Overdue Bills', 'Cuentas Vencidas')}
        subtitulo={L('O que está atrasado, a pagar e a receber, numa tela só — e o caminho para resolver', 'What is late, payable and receivable, on one screen — and the way to solve it', 'Lo que está atrasado, por pagar y por cobrar, en una sola pantalla — y el camino para resolverlo')}
        headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
        botaoExtra={<ThemeToggle />}>
        {carregando ? <p className="text-xs py-10 text-center" style={{ color: P.CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p> : (
          <div className="space-y-4">
            {r?.falhou && <p role="alert" className="text-xs font-semibold flex items-center gap-1" style={{ color: P.VERMELHO }}><AlertTriangle size={14} />{L('Alguns dados não carregaram — a lista pode estar incompleta. Atualize a página.', 'Some data did not load — the list may be incomplete. Refresh the page.', 'Algunos datos no cargaron — la lista puede estar incompleta. Actualice la página.')}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { t: L('A pagar vencido', 'Overdue payable', 'Por pagar vencido'), v: r?.totalPagar ?? 0, n: r?.pagar.length ?? 0, cor: P.VERMELHO },
                { t: L('A receber vencido', 'Overdue receivable', 'Por cobrar vencido'), v: r?.totalReceber ?? 0, n: r?.receber.length ?? 0, cor: P.VERDE },
                { t: L('Diferença (receber − pagar)', 'Difference (receive − pay)', 'Diferencia (cobrar − pagar)'), v: liquido, n: null, cor: liquido >= 0 ? P.VERDE : P.VERMELHO },
              ].map((k) => (
                <div key={k.t} className="rounded-2xl p-4 axi-card-premium3d axi-card-faixa" style={painel}>
                  <p className="text-xs" style={{ color: P.CINZA }}>{k.t}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: k.cor }}>{fmt(k.v)}</p>
                  {k.n !== null && <p className="text-[11px] mt-0.5" style={{ color: P.CINZA }}>{k.n} {L(k.n === 1 ? 'conta' : 'contas', k.n === 1 ? 'bill' : 'bills', k.n === 1 ? 'cuenta' : 'cuentas')}</p>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {lista('pagar', r?.pagar ?? [], r?.totalPagar ?? 0)}
              {lista('receber', r?.receber ?? [], r?.totalReceber ?? 0)}
            </div>
          </div>
        )}
      </ModuloLayout>
    </div>
  )
}
