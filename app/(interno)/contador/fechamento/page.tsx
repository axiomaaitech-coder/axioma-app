'use client'
// Fechamento do mês guiado (2026-11-12): checklist por competência (lib/fechamentoMes.ts) com o que falta, quanto e
// onde resolver — no estilo da Kingdee — mais os indicadores que já existiam (prontidão pelo ledger e Data Trust).
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, MinusCircle, HelpCircle } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import { AnimatedNumber } from '../../../../components/AnimatedNumber'
import { ThemeToggle } from '../../../../components/ThemeToggle'
import { useThemeAxioma } from '../../../../lib/ThemeContext'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { obterFechamento, obterDataTrust, type FechamentoInfo, type DataTrust } from '../../../../lib/contadorHelpers'
import { carregarChecklistFechamento, progressoFechamento, type ItemFechamento } from '../../../../lib/fechamentoMes'
import { createBrowserClient } from '../../../../lib/supabaseBrowser'
import { fBRL2 } from '../../../../lib/cfoCore'
import { hojeISO } from '../../../../lib/datas'

type Idioma3 = 'pt' | 'en' | 'es'
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Tela interna (fora do menu principal) — data-theme local, ver lib/ThemeContext.tsx. Sem vermelho decorativo.
const PALETA = {
  dark: { AZULC: '#2ecc9b', VERDE: '#34d399', ALERTA: '#fbbf24', CINZA: '#a3b1c2', TEXTO: '#e6edf5', PAINEL_BG: 'rgba(10,20,36,0.7)', BORDA: 'rgba(255,255,255,0.08)', ANINHADO: 'rgba(2,8,16,0.5)', CAMPO: 'rgba(10,22,40,0.9)' },
  xms: { AZULC: '#0f7a5a', VERDE: '#0f7a5a', ALERTA: '#9a3412', CINZA: '#374151', TEXTO: '#101b3d', PAINEL_BG: '#f6f7c4', BORDA: 'rgba(16,27,61,0.12)', ANINHADO: 'rgba(245,238,220,0.7)', CAMPO: '#ffffff' },
} as const
const NOME_MES = { pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] }
const somaMes = (mes: string, n: number) => { const [a, m] = mes.split('-').map(Number); const t = a * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}` }

export default function ContadorFechamentoPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const classePremium3d = ' axi-card-premium3d axi-card-faixa'
  const { AZULC, VERDE, ALERTA, CINZA, TEXTO, PAINEL_BG, BORDA, ANINHADO, CAMPO } = PALETA[tema]
  const mesAtual = hojeISO().slice(0, 7)
  const meses = Array.from({ length: 6 }, (_, i) => somaMes(mesAtual, -i))
  const nomeMes = (m: string) => `${NOME_MES[lang][Number(m.slice(5, 7)) - 1]}/${m.slice(0, 4)}`

  const [mes, setMes] = useState(somaMes(mesAtual, -1)) // fecha-se o mês que acabou
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [itens, setItens] = useState<ItemFechamento[] | null>(null)
  const [fechamento, setFechamento] = useState<FechamentoInfo | null>(null)
  const [dataTrust, setDataTrust] = useState<DataTrust | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (empId) {
        const [lista, f, dt] = await Promise.all([
          carregarChecklistFechamento(supabase, empId, mes, hojeISO()).catch(() => null),
          obterFechamento(empId, `${mes}-01`), obterDataTrust(empId, `${mes}-01`),
        ])
        setItens(lista); setFechamento(f); setDataTrust(dt)
      }
      setLoading(false)
    })()
  }, [mes])

  const prog = itens ? progressoFechamento(itens) : null
  const icone = (s: ItemFechamento['status']) => s === 'ok' ? <CheckCircle2 size={18} style={{ color: VERDE, flexShrink: 0 }} />
    : s === 'pendente' ? <AlertCircle size={18} style={{ color: ALERTA, flexShrink: 0 }} />
    : s === 'sem_dado' ? <HelpCircle size={18} style={{ color: ALERTA, flexShrink: 0 }} /> : <MinusCircle size={18} style={{ color: CINZA, flexShrink: 0 }} />
  const ordem = { pendente: 0, sem_dado: 1, ok: 2, nao_se_aplica: 3 } as const

  return (
    <div data-theme={tema} style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
    <ModuloLayout
      titulo={L('Fechamento do mês', 'Month-end close', 'Cierre del mes')}
      subtitulo={L('O que falta para fechar o mês, quanto e onde resolver — com o contador.', 'What is left to close the month, how much and where to fix it — with the accountant.', 'Lo que falta para cerrar el mes, cuánto y dónde resolverlo — con el contador.')}
      headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
      botaoExtra={
        <>
          <button onClick={() => router.push('/contador')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #0a1628, #101b3d)', color: '#fff', border: '1px solid rgba(46,204,155,0.35)' }}>
            {L('Voltar ao Contador', 'Back to Accountant', 'Volver al Contador')}
          </button>
          <ThemeToggle />
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="mes-fech" className="text-sm font-semibold" style={{ color: TEXTO }}>{L('Mês', 'Month', 'Mes')}</label>
          <select id="mes-fech" value={mes} onChange={(e) => setMes(e.target.value)} className="px-3 py-2 rounded-xl text-sm" style={{ background: CAMPO, border: `1px solid ${BORDA}`, color: TEXTO }}>
            {meses.map((m) => <option key={m} value={m}>{nomeMes(m)}{m === mesAtual ? L(' (em andamento)', ' (in progress)', ' (en curso)') : ''}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !empresaId ? (
          <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
        ) : (<>
          <div className={`rounded-2xl p-5${classePremium3d}`} style={{ background: PAINEL_BG, border: `1px solid ${BORDA}` }}>
            {!itens || !prog ? (
              <p className="text-sm" style={{ color: ALERTA }}>{L('Não foi possível montar o checklist agora. Recarregue a página.', 'Could not build the checklist now. Reload the page.', 'No se pudo armar la lista ahora. Recargue la página.')}</p>
            ) : (<>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: CINZA }}>{L('Checklist do fechamento', 'Close checklist', 'Lista del cierre')} · {nomeMes(mes)}</p>
                  <p className="text-2xl font-black mt-1" style={{ color: prog.pronto ? VERDE : TEXTO }}>{prog.pronto ? L('Mês pronto para fechar', 'Month ready to close', 'Mes listo para cerrar') : L(`${prog.ok} de ${prog.total} itens resolvidos`, `${prog.ok} of ${prog.total} items done`, `${prog.ok} de ${prog.total} ítems resueltos`)}</p>
                </div>
                <p className="text-3xl font-black" style={{ color: prog.pronto ? VERDE : AZULC }}>{prog.pct}%</p>
              </div>
              <div className="h-2 rounded-full mb-4" style={{ background: 'rgba(128,128,128,0.18)' }} role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-2 rounded-full" style={{ width: `${prog.pct}%`, background: VERDE }} />
              </div>
              <ul className="space-y-2">
                {[...itens].sort((a, b) => ordem[a.status] - ordem[b.status]).map((i) => (
                  <li key={i.id} className="rounded-xl p-3 flex flex-wrap items-center gap-3 axi-card-faixa" style={{ background: ANINHADO, border: `1px solid ${i.status === 'pendente' ? ALERTA + '55' : BORDA}` }}>
                    {icone(i.status)}
                    <div className="flex-1 min-w-[14rem]">
                      <p className="text-sm font-bold" style={{ color: TEXTO }}>{i.titulo[lang]}</p>
                      <p className="text-xs" style={{ color: i.status === 'pendente' || i.status === 'sem_dado' ? ALERTA : CINZA }}>{i.detalhe[lang]}{i.status === 'pendente' && i.valor ? ` · R$ ${fBRL2(i.valor)}` : ''}</p>
                    </div>
                    {i.status !== 'ok' && i.status !== 'nao_se_aplica' && (
                      <button type="button" onClick={() => router.push(i.rota)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #0b5f46, #0f7a5a)' }}>{i.acao[lang]}</button>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-3" style={{ color: CINZA }}>{L('Quando tudo estiver verde, gere os documentos para o contador em Relatórios. Item "não se aplica" não conta no progresso.', 'When everything is green, generate the accountant documents in Reports. "Does not apply" items do not count toward progress.', 'Cuando todo esté en verde, genere los documentos para el contador en Informes. Los ítems "no aplica" no cuentan en el progreso.')}</p>
            </>)}
          </div>

          {fechamento && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-2xl p-5 text-center${classePremium3d}`} style={{ background: PAINEL_BG, border: `1px solid ${BORDA}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{L('Prontidão pela Contabilidade', 'Readiness by Accounting', 'Preparación por Contabilidad')}</p>
                <p className="text-4xl font-black" style={{ color: AZULC }}><AnimatedNumber value={`${fechamento.readiness_pct.toFixed(0)}%`} /></p>
                <p className="text-xs mt-2" style={{ color: CINZA }}>{fechamento.previsao_prazo != null
                  ? L(`previsão: ${fechamento.previsao_prazo} dia(s) para fechar`, `forecast: ${fechamento.previsao_prazo} day(s) to close`, `previsión: ${fechamento.previsao_prazo} día(s) para cerrar`)
                  : L('ainda sem histórico suficiente para prever o prazo', 'not enough history yet to forecast the deadline', 'aún sin historial suficiente para prever el plazo')}</p>
              </div>
              <div className={`rounded-2xl p-5 text-center${classePremium3d}`} style={{ background: PAINEL_BG, border: `1px solid ${BORDA}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{L('Eventos não contabilizados', 'Events not booked', 'Eventos no contabilizados')}</p>
                <p className="text-4xl font-black" style={{ color: (fechamento.pendencias?.eventos_nao_contabilizados || 0) > 0 ? ALERTA : VERDE }}><AnimatedNumber value={String(fechamento.pendencias?.eventos_nao_contabilizados ?? 0)} /></p>
                <p className="text-xs mt-2" style={{ color: CINZA }}>{L(`de ${fechamento.pendencias?.eventos_total_periodo ?? 0} no mês`, `out of ${fechamento.pendencias?.eventos_total_periodo ?? 0} this month`, `de ${fechamento.pendencias?.eventos_total_periodo ?? 0} en el mes`)}</p>
              </div>
              <div className={`rounded-2xl p-5 text-center${classePremium3d}`} style={{ background: PAINEL_BG, border: `1px solid ${BORDA}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{L('Confiança dos dados', 'Data trust', 'Confianza de los datos')}</p>
                {dataTrust ? <p className="text-4xl font-black" style={{ color: AZULC }}><AnimatedNumber value={String(dataTrust.score)} /><span className="text-base font-semibold" style={{ color: CINZA }}>/1000</span></p>
                  : <p className="text-sm" style={{ color: CINZA }}>{L('Ainda não calculado', 'Not calculated yet', 'Aún no calculado')}</p>}
              </div>
            </div>
          )}
        </>)}
      </div>
    </ModuloLayout>
    </div>
  )
}
