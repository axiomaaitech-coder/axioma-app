'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle2, XCircle, Pencil, ArrowLeft } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva, atualizarObrigacao } from '../../../../lib/empresaHelpers'
import { obterObrigacoesProximas, corRiscoObrigacao, type ObrigacaoProxima } from '../../../../lib/fiscalHelpers'
import { fBRL2 } from '../../../../lib/cfoCore'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Idioma3 = 'pt' | 'en' | 'es'

const VERMELHO = '#f87171'
const LARANJA = '#fb923c'
const AMARELO = '#fbbf24'
const VERDE = '#34d399'
const AZULC = '#6ab0ff'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'

const COR_RISCO: Record<string, string> = { atrasada: VERMELHO, urgente: LARANJA, atencao: AMARELO, folga: VERDE }
const EMOJI_RISCO: Record<string, string> = { atrasada: '🔴', urgente: '🟠', atencao: '🟡', folga: '🟢' }

const JANELAS = [7, 30, 60] as const

export default function FiscalObrigacoesPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [janela, setJanela] = useState<typeof JANELAS[number]>(30)
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoProxima[]>([])
  const [processando, setProcessando] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ texto: string; erro?: boolean } | null>(null)

  const carregar = useCallback(async (empId: string, dias: number) => {
    setObrigacoes(await obterObrigacoesProximas(empId, dias))
  }, [])

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      if (empId) await carregar(empId, janela)
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (empresaId) carregar(empresaId, janela)
  }, [janela, empresaId, carregar])

  async function marcarStatus(o: ObrigacaoProxima, novoStatus: 'paga' | 'dispensada') {
    if (!empresaId || !userId || processando) return
    setProcessando(o.id)
    setMensagem(null)
    const { erro } = await atualizarObrigacao(o.id, empresaId, userId, { status: novoStatus })
    if (erro) {
      setMensagem({ texto: L('Não foi possível salvar. Tente de novo.', 'Could not save. Try again.', 'No se pudo guardar. Intente de nuevo.'), erro: true })
    } else {
      setMensagem({ texto: L('Atualizado.', 'Updated.', 'Actualizado.') })
      await carregar(empresaId, janela)
    }
    setProcessando(null)
  }

  return (
    <ModuloLayout
      titulo={L('Calendário de Obrigações', 'Obligation Calendar', 'Calendario de Obligaciones')}
      subtitulo={L('DAS, DASN, DEFIS, DCTF, EFD, ECF, ECD e as demais obrigações já geradas pro seu regime — vencimento, status e o que falta.', 'DAS, DASN, DEFIS, DCTF, EFD, ECF, ECD and the other obligations already generated for your regime — due date, status, and what is left.', 'DAS, DASN, DEFIS, DCTF, EFD, ECF, ECD y las demás obligaciones ya generadas para su régimen — vencimiento, estado y lo que falta.')}
      botaoExtra={
        <button onClick={() => router.push('/fiscal')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(59,111,212,0.14)', color: AZULC, border: `1px solid ${AZULC}40` }}>
          <ArrowLeft size={15} />{L('Voltar ao Fiscal', 'Back to Tax', 'Volver a Fiscal')}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !empresaId ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : (
        <div className="space-y-4">

          {mensagem && (
            <div className="rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ background: mensagem.erro ? `${VERMELHO}15` : `${VERDE}15`, border: `1px solid ${mensagem.erro ? VERMELHO : VERDE}35`, color: mensagem.erro ? VERMELHO : VERDE }}>
              {mensagem.texto}
            </div>
          )}

          <div className="flex items-center gap-2">
            {JANELAS.map((j) => (
              <button key={j} onClick={() => setJanela(j)}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: janela === j ? `${AZULC}25` : 'rgba(255,255,255,0.06)', color: janela === j ? AZULC : CINZA, border: `1px solid ${janela === j ? AZULC : 'transparent'}40` }}>
                {j} {L('dias', 'days', 'días')}
              </button>
            ))}
          </div>

          {obrigacoes.length === 0 ? (
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(10,20,36,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm" style={{ color: CINZA }}>{L(`Nenhuma obrigação em aberto vencendo nos próximos ${janela} dias.`, `No open obligation due in the next ${janela} days.`, `Ninguna obligación abierta vence en los próximos ${janela} días.`)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <table className="w-full text-xs" style={{ minWidth: 620 }}>
                <thead>
                  <tr style={{ color: CINZA, background: 'rgba(255,255,255,0.03)' }}>
                    <th className="text-left py-2 px-3 font-semibold whitespace-nowrap"></th>
                    <th className="text-left py-2 px-3 font-semibold">{L('Obrigação', 'Obligation', 'Obligación')}</th>
                    <th className="text-left py-2 px-3 font-semibold whitespace-nowrap hidden sm:table-cell">{L('Vencimento', 'Due Date', 'Vencimiento')}</th>
                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap hidden md:table-cell">{L('Valor', 'Amount', 'Valor')}</th>
                    <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">{L('Status', 'Status', 'Estado')}</th>
                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">{L('Ações', 'Actions', 'Acciones')}</th>
                  </tr>
                </thead>
                <tbody>
                  {obrigacoes.map((o) => {
                    const risco = corRiscoObrigacao(o)
                    const resolvida = o.status === 'paga' || o.status === 'dispensada'
                    return (
                      <tr key={o.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td className="py-2.5 px-3">{EMOJI_RISCO[risco]}</td>
                        <td className="py-2.5 px-3" style={{ color: TEXTO }}>
                          <p className="font-semibold">{o.nome}</p>
                          <p className="text-[10px]" style={{ color: CINZA }}>{o.tipo}</p>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap hidden sm:table-cell" style={{ color: TEXTO }}>
                          {new Date(o.data_vencimento + 'T00:00:00').toLocaleDateString(localeData)}
                          <span className="ml-1.5 text-[10px] font-bold" style={{ color: COR_RISCO[risco] }}>
                            ({risco === 'atrasada' ? L('atrasada', 'overdue', 'atrasada') : `${o.dias_restantes}d`})
                          </span>
                        </td>
                        <td className="text-right py-2.5 px-3 whitespace-nowrap hidden md:table-cell" style={{ color: TEXTO }}>
                          {o.valor_estimado != null && o.valor_estimado > 0 ? `R$ ${fBRL2(Number(o.valor_estimado))}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: resolvida ? CINZA : COR_RISCO[risco] }}>
                          {o.status}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-right">
                          {!resolvida && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => marcarStatus(o, 'paga')} disabled={processando === o.id}
                                title={L('Marcar como paga', 'Mark as paid', 'Marcar como pagada')}
                                className="p-1.5 rounded-lg disabled:opacity-50" style={{ background: `${VERDE}18`, color: VERDE }}>
                                <CheckCircle2 size={14} />
                              </button>
                              <button onClick={() => marcarStatus(o, 'dispensada')} disabled={processando === o.id}
                                title={L('Marcar como dispensada', 'Mark as waived', 'Marcar como dispensada')}
                                className="p-1.5 rounded-lg disabled:opacity-50" style={{ background: 'rgba(255,255,255,0.06)', color: CINZA }}>
                                <XCircle size={14} />
                              </button>
                              <button onClick={() => router.push('/empresa')}
                                title={L('Editar valor/dados na aba Compliance', 'Edit amount/details in the Compliance tab', 'Editar valor/datos en la pestaña Compliance')}
                                className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: AZULC }}>
                                <Pencil size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[10px]" style={{ color: CINZA }}>
            {L('Edição completa (nome, valor, recorrência) fica na aba Compliance da tela Empresa — aqui é só status rápido, sem duplicar o cadastro.', 'Full editing (name, amount, recurrence) stays in the Compliance tab on the Company screen — here it is just quick status, no duplicate record.', 'La edición completa (nombre, valor, recurrencia) queda en la pestaña Compliance de la pantalla Empresa — aquí es solo estado rápido, sin duplicar el registro.')}
          </p>
        </div>
      )}
    </ModuloLayout>
  )
}
