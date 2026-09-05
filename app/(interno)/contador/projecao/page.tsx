'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ModuloLayout from '../../../../components/ModuloLayout'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { obterProjecaoDoNada, type ProjecaoDoNada } from '../../../../lib/contadorHelpers'
import { fBRL2 } from '../../../../lib/cfoCore'

type Idioma3 = 'pt' | 'en' | 'es'

const AZULC = '#6ab0ff'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AMARELO = '#fbbf24'
const CINZA = '#5a7a9a'

export default function ContadorProjecaoPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState<ProjecaoDoNada | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (empId) setDados(await obterProjecaoDoNada(empId))
      setLoading(false)
    })()
  }, [])

  const rompe = dados?.pontos.find((p) => p.abaixoDaReserva)

  return (
    <ModuloLayout
      titulo={L('Se Eu Fizer Nada', 'If I Do Nothing', 'Si No Hago Nada')}
      subtitulo={L('Mantendo tudo exatamente como está — sem cortar custo, sem vender mais, sem pegar empréstimo — onde sua empresa chega em 30/60/90/180 dias.', 'Keeping everything exactly as it is — no cost cuts, no more sales, no new loan — where your company lands in 30/60/90/180 days.', 'Manteniendo todo exactamente como está — sin cortar costos, sin vender más, sin nuevo préstamo — dónde llega su empresa en 30/60/90/180 días.')}
      botaoExtra={
        <button onClick={() => router.push('/tesouraria/gemeo')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(167,139,250,0.14)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)' }}>
          {L('Simular uma mudança grande', 'Simulate a big change', 'Simular un cambio grande')}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !empresaId ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : !dados ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Não foi possível calcular a projeção agora.', 'Could not calculate the projection right now.', 'No se pudo calcular la proyección ahora.')}</p>
      ) : (
        <div className="space-y-5">
          {rompe && (
            <div className="rounded-xl px-4 py-3 text-xs font-semibold" style={{ background: `${VERMELHO}15`, border: `1px solid ${VERMELHO}35`, color: VERMELHO }}>
              {L(`Sem mudar nada, o caixa rompe a reserva mínima em ${rompe.horizonteDias} dias.`, `Without any change, cash breaks the minimum reserve in ${rompe.horizonteDias} days.`, `Sin cambiar nada, la caja rompe la reserva mínima en ${rompe.horizonteDias} días.`)}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {dados.pontos.map((p) => (
              <div key={p.horizonteDias} className="rounded-2xl p-3 md:p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${p.abaixoDaReserva ? VERMELHO : AZULC}25` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: CINZA }}>{p.horizonteDias} {L('dias', 'days', 'días')}</p>
                <p className="text-sm md:text-lg font-bold whitespace-nowrap" style={{ color: p.abaixoDaReserva ? VERMELHO : AZULC }}>R$ {fBRL2(p.saldoProjetadoBase)}</p>
                {p.abaixoDaReserva && <p className="text-[10px] mt-1" style={{ color: VERMELHO }}>{L('abaixo da reserva', 'below reserve', 'debajo de la reserva')}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl p-3 md:p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${dados.capitalDeGiro.capitalDeGiro >= 0 ? VERDE : VERMELHO}25` }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: CINZA }}>{L('Capital de Giro', 'Working Capital', 'Capital de Trabajo')}</p>
              <p className="text-sm md:text-lg font-bold" style={{ color: dados.capitalDeGiro.capitalDeGiro >= 0 ? VERDE : VERMELHO }}>R$ {fBRL2(dados.capitalDeGiro.capitalDeGiro)}</p>
            </div>
            <div className="rounded-2xl p-3 md:p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${AMARELO}25` }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: CINZA }}>{L('Dívida Pendente', 'Outstanding Debt', 'Deuda Pendiente')}</p>
              <p className="text-sm md:text-lg font-bold" style={{ color: AMARELO }}>R$ {fBRL2(dados.dividaPendente)}</p>
            </div>
            <div className="rounded-2xl p-3 md:p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${AZULC}25` }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: CINZA }}>{L('Liquidity Score', 'Liquidity Score', 'Liquidity Score')}</p>
              <p className="text-sm md:text-lg font-bold" style={{ color: AZULC }}>{dados.liquidityScoreAtual.total}</p>
            </div>
          </div>
        </div>
      )}
    </ModuloLayout>
  )
}
