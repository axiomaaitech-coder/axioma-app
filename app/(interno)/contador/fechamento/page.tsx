'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ModuloLayout from '../../../../components/ModuloLayout'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { obterFechamento, obterDataTrust, type FechamentoInfo, type DataTrust } from '../../../../lib/contadorHelpers'
import { fBRL2 } from '../../../../lib/cfoCore'

type Idioma3 = 'pt' | 'en' | 'es'

const AZULC = '#6ab0ff'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AMARELO = '#fbbf24'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'

function corReadiness(pct: number): string { return pct >= 90 ? VERDE : pct >= 60 ? AMARELO : VERMELHO }

export default function ContadorFechamentoPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fechamento, setFechamento] = useState<FechamentoInfo | null>(null)
  const [dataTrust, setDataTrust] = useState<DataTrust | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (empId) {
        const hoje = new Date().toISOString().slice(0, 10)
        const [f, dt] = await Promise.all([obterFechamento(empId, hoje), obterDataTrust(empId, hoje)])
        setFechamento(f)
        setDataTrust(dt)
      }
      setLoading(false)
    })()
  }, [])

  return (
    <ModuloLayout
      titulo={L('Continuous Close', 'Continuous Close', 'Continuous Close')}
      subtitulo={L('Quão pronto está o fechamento deste mês — calculado do ledger, das contas a pagar e a receber em aberto.', "How ready this month's close is — calculated from the ledger and open payables/receivables.", 'Cuán listo está el cierre de este mes — calculado del libro mayor y de las cuentas por pagar/cobrar abiertas.')}
      botaoExtra={
        <button onClick={() => router.push('/contador')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(59,111,212,0.14)', color: AZULC, border: `1px solid ${AZULC}40` }}>
          {L('Voltar ao Contador', 'Back to Accountant', 'Volver al Contador')}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !empresaId ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : !fechamento ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Não foi possível calcular o fechamento agora. Tente de novo em instantes.', 'Could not calculate the close right now. Try again shortly.', 'No se pudo calcular el cierre ahora. Intente de nuevo en unos instantes.')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="md:col-span-1 rounded-2xl p-5 flex flex-col items-center justify-center text-center" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${corReadiness(fechamento.readiness_pct)}30` }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{L('Close Readiness', 'Close Readiness', 'Close Readiness')}</p>
            <p className="text-4xl font-black" style={{ color: corReadiness(fechamento.readiness_pct) }}>{fechamento.readiness_pct.toFixed(0)}%</p>
            <p className="text-xs mt-2" style={{ color: CINZA }}>
              {fechamento.previsao_prazo != null
                ? L(`previsão: ${fechamento.previsao_prazo} dia(s) pra fechar`, `forecast: ${fechamento.previsao_prazo} day(s) to close`, `previsión: ${fechamento.previsao_prazo} día(s) para cerrar`)
                : L('ainda sem histórico suficiente pra prever o prazo', 'not enough history yet to forecast the deadline', 'aún sin historial suficiente para prever el plazo')}
            </p>
          </div>

          <div className="md:col-span-1 rounded-2xl p-5 flex flex-col items-center justify-center text-center" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${AZULC}25` }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{L('Data Trust Score', 'Data Trust Score', 'Data Trust Score')}</p>
            {dataTrust ? (
              <p className="text-4xl font-black" style={{ color: AZULC }}>{dataTrust.score}<span className="text-base font-semibold" style={{ color: CINZA }}>/1000</span></p>
            ) : (
              <p className="text-sm" style={{ color: CINZA }}>{L('Ainda não calculado', 'Not calculated yet', 'Aún no calculado')}</p>
            )}
          </div>

          <div className="md:col-span-1 rounded-2xl p-5" style={{ background: 'rgba(10,20,36,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{L('Eventos não contabilizados', 'Uncooked events', 'Eventos no contabilizados')}</p>
            <p className="text-2xl font-black" style={{ color: (fechamento.pendencias?.eventos_nao_contabilizados || 0) > 0 ? AMARELO : VERDE }}>
              {fechamento.pendencias?.eventos_nao_contabilizados ?? 0}
            </p>
            <p className="text-[11px] mt-1" style={{ color: CINZA }}>{L(`de ${fechamento.pendencias?.eventos_total_periodo ?? 0} no período`, `out of ${fechamento.pendencias?.eventos_total_periodo ?? 0} this period`, `de ${fechamento.pendencias?.eventos_total_periodo ?? 0} en el período`)}</p>
          </div>

          <div onClick={() => router.push('/contas-pagar')} className="md:col-span-1 rounded-2xl p-5 cursor-pointer hover:brightness-110" style={{ background: 'rgba(10,20,36,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{L('Contas a pagar pendentes', 'Pending payables', 'Cuentas por pagar pendientes')}</p>
            <p className="text-2xl font-black" style={{ color: TEXTO }}>{fechamento.pendencias?.contas_pagar_pendentes.qtd ?? 0}</p>
            <p className="text-[11px] mt-1" style={{ color: CINZA }}>R$ {fBRL2(fechamento.pendencias?.contas_pagar_pendentes.valor_total ?? 0)} — {L('clique pra resolver', 'click to resolve', 'clic para resolver')}</p>
          </div>

          <div onClick={() => router.push('/contas-receber')} className="md:col-span-1 rounded-2xl p-5 cursor-pointer hover:brightness-110" style={{ background: 'rgba(10,20,36,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{L('Contas a receber pendentes', 'Pending receivables', 'Cuentas por cobrar pendientes')}</p>
            <p className="text-2xl font-black" style={{ color: TEXTO }}>{fechamento.pendencias?.contas_receber_pendentes.qtd ?? 0}</p>
            <p className="text-[11px] mt-1" style={{ color: CINZA }}>R$ {fBRL2(fechamento.pendencias?.contas_receber_pendentes.valor_total ?? 0)} — {L('clique pra resolver', 'click to resolve', 'clic para resolver')}</p>
          </div>

        </div>
      )}
    </ModuloLayout>
  )
}
