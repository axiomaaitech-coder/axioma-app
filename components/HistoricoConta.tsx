'use client'
// Histórico da Conta — o "porquê" por trás de cada número. Clicar numa conta (a
// pagar ou a receber) em qualquer módulo abre: de onde veio a dívida, quando
// nasceu, vencimento, forma e parcelas combinadas, quem aprovou, CADA pagamento
// (1º, 2º, 3º…) com data, valor, forma e juros, estornos, quanto já foi pago e
// quanto falta — e se cada pagamento chegou à contabilidade, ao Fluxo e à DRE.
// Fonte: a própria conta + eventos_negocio (registro permanente de tudo que
// aconteceu) + rastreio_movimentacao (Motor de Rastreabilidade).
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { X, Check, AlertTriangle, Route } from 'lucide-react'
import Modal from './Modal'
import { useLanguage } from '../lib/LanguageContext'
import { useThemeAxioma } from '../lib/ThemeContext'
import { reportarFalhaLeitura } from '../lib/erroUiHelpers'
import { hojeISO } from '../lib/datas'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

type Tipo = 'pagar' | 'receber'
type Conta = Record<string, unknown> & { id: string; descricao?: string | null; created_at?: string | null; data_emissao?: string | null; data_vencimento?: string | null }
type Evento = { id: string; tipo: string; payload: Record<string, unknown> | null; usuario_id: string | null; criado_em: string }
type Rastro = { evento_id: string | null; status: string; rastreio_destino: { destino: string; status: string }[] }

const PALETA = {
  dark: { FUNDO: '#0b1626', TEXTO: '#e6edf5', CINZA: '#a3b1c2', VERDE: '#2ecc9b', VERMELHO: '#f87171', AMBAR: '#fbbf24', ANINHADA: 'rgba(2,8,16,0.5)', BORDA: 'rgba(255,255,255,0.08)' },
  xms: { FUNDO: '#f6f7c4', TEXTO: '#101b3d', CINZA: '#374151', VERDE: '#0f7d5c', VERMELHO: '#d93848', AMBAR: '#b45309', ANINHADA: 'rgba(255,255,255,0.5)', BORDA: 'rgba(16,27,61,0.12)' },
} as const

export default function HistoricoConta({ tipo, contaId, onFechar }: { tipo: Tipo; contaId: string | null; onFechar: () => void }) {
  const { idioma } = useLanguage()
  const lang = (idioma === 'en' || idioma === 'es' ? idioma : 'pt') as 'pt' | 'en' | 'es'
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const local = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const router = useRouter()
  const { tema } = useThemeAxioma()
  const P = PALETA[tema]
  const [carregando, setCarregando] = useState(false)
  const [conta, setConta] = useState<Conta | null>(null)
  const [contraparte, setContraparte] = useState<string | null>(null)
  const [centro, setCentro] = useState<string | null>(null)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [rastros, setRastros] = useState<Rastro[]>([])
  const [eu, setEu] = useState<string | null>(null)
  const [erro, setErro] = useState(false)

  const tabela = tipo === 'pagar' ? 'contas_pagar' : 'contas_receber'
  const campoTotal = tipo === 'pagar' ? 'valor_total' : 'valor'
  const campoPago = tipo === 'pagar' ? 'valor_pago' : 'valor_recebido'

  useEffect(() => {
    if (!contaId) return
    let vivo = true
    ;(async () => {
      setCarregando(true); setErro(false)
      try {
        const [{ data: c, error: e1 }, { data: ev, error: e2 }, { data: ra }, { data: u }] = await Promise.all([
          supabase.from(tabela).select('*').eq('id', contaId).maybeSingle(),
          supabase.from('eventos_negocio').select('id, tipo, payload, usuario_id, criado_em').eq('origem_tabela', tabela).eq('origem_id', contaId).order('criado_em', { ascending: true }),
          supabase.from('rastreio_movimentacao').select('evento_id, status, rastreio_destino(destino, status)').eq('origem_tabela', tabela).eq('origem_id', contaId),
          supabase.auth.getUser(),
        ])
        if (e1 || e2 || !c) throw new Error(e1?.message || e2?.message || 'conta não encontrada')
        const ct = c as Conta
        const idParte = (tipo === 'pagar' ? ct.fornecedor_id : ct.cliente_id) as string | null
        const [parte, cc] = await Promise.all([
          idParte ? supabase.from(tipo === 'pagar' ? 'fornecedores' : 'clientes').select('nome').eq('id', idParte).maybeSingle() : Promise.resolve({ data: null }),
          ct.centro_custo_id ? supabase.from('centros_custo').select('nome').eq('id', ct.centro_custo_id as string).maybeSingle() : Promise.resolve({ data: null }),
        ])
        if (!vivo) return
        setConta(ct); setEventos((ev || []) as Evento[]); setRastros((ra || []) as Rastro[]); setEu(u?.user?.id ?? null)
        setContraparte((parte.data as { nome?: string } | null)?.nome ?? null)
        setCentro((cc.data as { nome?: string } | null)?.nome ?? null)
      } catch (e) {
        reportarFalhaLeitura('historicoConta', e)
        if (vivo) setErro(true)
      } finally { if (vivo) setCarregando(false) }
    })()
    return () => { vivo = false }
  }, [contaId, tabela, tipo])

  const brl = (v: number) => v.toLocaleString(local, { style: 'currency', currency: 'BRL' })
  const data = (d?: string | null) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString(local) : '—')
  const dataHora = (d: string) => new Date(d).toLocaleString(local, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const quem = (id: string | null) => (!id ? L('sistema', 'system', 'sistema') : id === eu ? L('você', 'you', 'usted') : L('outro membro da equipe', 'another team member', 'otro miembro del equipo'))
  const num = (v: unknown) => Number(v) || 0

  const total = num(conta?.[campoTotal])
  const pago = num(conta?.[campoPago])
  const falta = Math.max(0, total - pago - (tipo === 'receber' ? num(conta?.valor_desconto) : 0))
  const pagamentos = eventos.filter((e) => e.tipo === (tipo === 'pagar' ? 'AP_PAID' : 'AR_RECEIVED'))
  const somaEventos = pagamentos.reduce((s, e) => s + num(e.payload?.valor_incremento), 0)
  const estornado = eventos.filter((e) => e.tipo === (tipo === 'pagar' ? 'AP_PAYMENT_REVERSED' : 'AR_PAYMENT_REVERSED')).reduce((s, e) => s + num(e.payload?.valor), 0)
  const juros = pagamentos.reduce((s, e) => s + num(e.payload?.valor_encargos), 0)
  // Pago antes de existir o histórico detalhado (dados antigos/importados): mostra a
  // diferença com honestidade em vez de esconder.
  const semDetalhe = Math.max(0, Math.round((pago - (somaEventos - estornado)) * 100) / 100)
  const venc = conta?.data_vencimento as string | null
  const vencida = !!venc && falta > 0.005 && venc < hojeISO()
  const diasAtraso = vencida && venc ? Math.round((new Date(hojeISO() + 'T00:00:00').getTime() - new Date(venc + 'T00:00:00').getTime()) / 86400000) : 0
  const verbo = tipo === 'pagar' ? L('pagamento', 'payment', 'pago') : L('recebimento', 'receipt', 'cobro')

  const NOME_DESTINO: Record<string, string> = {
    contabilidade: L('Contabilidade', 'Accounting', 'Contabilidad'), fluxo_caixa: L('Fluxo de Caixa', 'Cash Flow', 'Flujo de Caja'),
    dre_gerencial: tipo === 'pagar' ? L('Custos/DRE', 'Costs/P&L', 'Costos/EERR') : L('Receitas/DRE', 'Revenue/P&L', 'Ingresos/EERR'),
    inadimplencia: L('Inadimplência', 'Delinquency', 'Morosidad'),
  }

  let nPag = 0
  const linhaDoTempo = eventos.map((e) => {
    const p = e.payload || {}
    switch (e.tipo) {
      case 'AP_CREATED': case 'AR_CREATED':
        return { e, cor: P.TEXTO, titulo: L('Conta criada no Axioma', 'Bill created in Axioma', 'Cuenta creada en Axioma'), detalhe: `${brl(num(p.valor))}${p.vencimento ? ` · ${L('vence', 'due', 'vence')} ${data(p.vencimento as string)}` : ''}` }
      case 'AP_APPROVED':
        return { e, cor: P.VERDE, titulo: L('Aprovada para pagamento', 'Approved for payment', 'Aprobada para pago'), detalhe: (p.motivo as string) || '' }
      case 'AP_REJECTED':
        return { e, cor: P.VERMELHO, titulo: L('Rejeitada', 'Rejected', 'Rechazada'), detalhe: (p.motivo as string) || '' }
      case 'AP_UPDATED': case 'AR_UPDATED': {
        const mudouValor = p.valor_antes != null && p.valor_depois != null && num(p.valor_antes) !== num(p.valor_depois)
        return { e, cor: P.AMBAR, titulo: L('Conta editada', 'Bill edited', 'Cuenta editada'), detalhe: mudouValor ? `${L('valor', 'amount', 'valor')}: ${brl(num(p.valor_antes))} → ${brl(num(p.valor_depois))}` : '' }
      }
      case 'AP_PAID': case 'AR_RECEIVED': {
        nPag++
        const r = rastros.find((x) => x.evento_id === e.id)
        const enc = num(p.valor_encargos)
        return {
          e, cor: P.VERDE, rastro: r,
          titulo: L(`${nPag}º ${verbo}`, `${verbo[0].toUpperCase() + verbo.slice(1)} #${nPag}`, `${verbo[0].toUpperCase() + verbo.slice(1)} n.º ${nPag}`),
          detalhe: `${brl(num(p.valor_incremento))}${enc > 0 ? ` (${L('inclui juros/multa', 'includes interest/penalty', 'incluye intereses/multa')} ${brl(enc)})` : ''} · ${(p.forma_pagamento || p.forma_recebimento || L('forma não informada', 'method not given', 'forma no informada')) as string} · ${L('data do', 'date of', 'fecha del')} ${verbo}: ${data((p.data_pagamento || p.data_recebimento) as string)}`,
        }
      }
      case 'AP_PAYMENT_REVERSED': case 'AR_PAYMENT_REVERSED':
        return { e, cor: P.VERMELHO, titulo: L(`Estorno de ${verbo}`, `${verbo} reversed`, `Reversión de ${verbo}`), detalhe: `${brl(num(p.valor))}${p.motivo ? ` · ${L('motivo', 'reason', 'motivo')}: ${p.motivo}` : ''}` }
      case 'AP_DUPLICATE_DETECTED':
        return { e, cor: P.AMBAR, titulo: L('Possível duplicidade detectada', 'Possible duplicate detected', 'Posible duplicado detectado'), detalhe: '' }
      case 'AP_DUPLICATE_IGNORED':
        return { e, cor: P.AMBAR, titulo: L('Duplicidade ignorada por decisão do usuário', 'Duplicate ignored by user decision', 'Duplicado ignorado por decisión del usuario'), detalhe: '' }
      default:
        return null
    }
  }).filter(Boolean) as { e: Evento; cor: string; titulo: string; detalhe: string; rastro?: Rastro }[]

  const Info = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
    <div className="rounded-lg px-3 py-2" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}` }}>
      <p className="text-[11px]" style={{ color: P.CINZA }}>{rotulo}</p>
      <p className="text-sm font-semibold break-words" style={{ color: P.TEXTO }}>{valor}</p>
    </div>
  )

  return (
    <Modal open={!!contaId} onClose={onFechar} maxWidthClassName="max-w-2xl">
      <div className="relative rounded-2xl p-5 max-h-[85vh] overflow-y-auto axi-card-premium3d" style={{ background: P.FUNDO, border: `1px solid ${P.BORDA}` }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: '#2ecc9b' }} aria-hidden />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: P.CINZA }}>{tipo === 'pagar' ? L('Histórico da conta a pagar', 'Payable history', 'Historial de la cuenta por pagar') : L('Histórico da conta a receber', 'Receivable history', 'Historial de la cuenta por cobrar')}</p>
            <h3 className="text-lg font-bold leading-snug break-words" style={{ color: P.TEXTO }}>{conta?.descricao || '…'}</h3>
            {contraparte && <p className="text-sm" style={{ color: P.TEXTO }}>{tipo === 'pagar' ? L('Fornecedor', 'Supplier', 'Proveedor') : L('Cliente', 'Customer', 'Cliente')}: <strong>{contraparte}</strong></p>}
          </div>
          <button onClick={onFechar} aria-label={L('Fechar', 'Close', 'Cerrar')} style={{ color: P.CINZA }}><X size={20} /></button>
        </div>

        {carregando ? <p className="text-sm py-6" style={{ color: P.CINZA }}>{L('Carregando o histórico…', 'Loading history…', 'Cargando historial…')}</p>
          : erro || !conta ? <p className="text-sm py-6" style={{ color: P.VERMELHO }}>{L('Não foi possível carregar o histórico desta conta. Feche e tente de novo.', 'Could not load this bill\'s history. Close and try again.', 'No se pudo cargar el historial. Cierre e intente de nuevo.')}</p>
          : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Info rotulo={L('Valor da conta', 'Bill amount', 'Valor de la cuenta')} valor={brl(total)} />
              <Info rotulo={tipo === 'pagar' ? L('Já pago', 'Paid so far', 'Ya pagado') : L('Já recebido', 'Received so far', 'Ya cobrado')} valor={brl(pago)} />
              <Info rotulo={L('Falta', 'Remaining', 'Falta')} valor={brl(falta)} />
              <Info rotulo={L(`Nº de ${verbo}s`, `Number of ${verbo}s`, `N.º de ${verbo}s`)} valor={String(pagamentos.length + (semDetalhe > 0 ? 1 : 0))} />
            </div>
            {vencida && (
              <p className="flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2" style={{ color: P.VERMELHO, background: tema === 'xms' ? 'rgba(217,56,72,0.08)' : 'rgba(248,113,113,0.08)' }}>
                <AlertTriangle size={14} aria-hidden />{L(`Vencida há ${diasAtraso} dia(s), faltando ${brl(falta)}`, `Overdue for ${diasAtraso} day(s), ${brl(falta)} remaining`, `Vencida hace ${diasAtraso} día(s), faltan ${brl(falta)}`)}
              </p>
            )}

            <section>
              <p className="text-sm font-bold mb-1.5" style={{ color: P.TEXTO }}>{L('Dados da dívida', 'Debt details', 'Datos de la deuda')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Info rotulo={L('Emissão da nota', 'Invoice issue date', 'Emisión de la factura')} valor={data(conta.data_emissao)} />
                <Info rotulo={L('Lançada no Axioma em', 'Recorded in Axioma on', 'Registrada en Axioma el')} valor={conta.created_at ? dataHora(conta.created_at) : '—'} />
                <Info rotulo={L('Vencimento', 'Due date', 'Vencimiento')} valor={data(venc)} />
                <Info rotulo={L('Forma combinada', 'Agreed method', 'Forma acordada')} valor={((tipo === 'pagar' ? conta.forma_pagamento : conta.forma_recebimento) as string) || '—'} />
                <Info rotulo={L('Parcelas', 'Installments', 'Cuotas')} valor={num(conta.parcelas) > 1 ? `${num(conta.parcelas)}x` : L('à vista (1x)', 'single (1x)', 'contado (1x)')} />
                <Info rotulo={tipo === 'pagar' ? L('Nota fiscal', 'Invoice no.', 'Factura') : L('Documento', 'Document', 'Documento')} valor={((tipo === 'pagar' ? conta.numero_nota : conta.numero_documento) as string) || '—'} />
                <Info rotulo={L('Categoria', 'Category', 'Categoría')} valor={(conta.categoria as string) || '—'} />
                <Info rotulo={L('Centro de custo', 'Cost center', 'Centro de costo')} valor={centro || '—'} />
                {juros > 0 && <Info rotulo={L('Juros/multa pagos', 'Interest/penalty paid', 'Intereses/multa pagados')} valor={brl(juros)} />}
              </div>
            </section>

            <section>
              <p className="text-sm font-bold mb-1.5" style={{ color: P.TEXTO }}>{L('Linha do tempo', 'Timeline', 'Línea de tiempo')}</p>
              <ol className="space-y-2">
                {semDetalhe > 0 && (
                  <li className="rounded-lg px-3 py-2" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}` }}>
                    <p className="text-sm font-semibold" style={{ color: P.AMBAR }}>{L(`${verbo[0].toUpperCase() + verbo.slice(1)} anterior ao histórico detalhado`, `${verbo} recorded before detailed history`, `${verbo} anterior al historial detallado`)}: {brl(semDetalhe)}</p>
                    <p className="text-xs" style={{ color: P.CINZA }}>{L('Registrado antes de o Axioma guardar cada baixa (ou veio de importação). Data/forma não disponíveis.', 'Recorded before Axioma kept each payment (or imported). Date/method unavailable.', 'Registrado antes de que Axioma guardara cada pago (o importado). Fecha/forma no disponibles.')}</p>
                  </li>
                )}
                {linhaDoTempo.length === 0 && semDetalhe === 0 && <li className="text-sm" style={{ color: P.CINZA }}>{L('Nenhum movimento registrado ainda.', 'No movements recorded yet.', 'Aún no hay movimientos registrados.')}</li>}
                {linhaDoTempo.map(({ e, cor, titulo, detalhe, rastro }) => (
                  <li key={e.id} className="rounded-lg px-3 py-2" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}` }}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-bold" style={{ color: cor }}>{titulo}</p>
                      <p className="text-xs" style={{ color: P.CINZA }}>{dataHora(e.criado_em)} · {L('por', 'by', 'por')} {quem(e.usuario_id)}</p>
                    </div>
                    {detalhe && <p className="text-sm" style={{ color: P.TEXTO }}>{detalhe}</p>}
                    {rastro && (
                      <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mt-1" style={{ color: P.CINZA }}>
                        {rastro.rastreio_destino.map((d) => (
                          <span key={d.destino} className="inline-flex items-center gap-0.5" style={{ color: d.status === 'ok' ? P.VERDE : d.status === 'falhou' ? P.VERMELHO : P.CINZA }}>
                            {d.status === 'ok' ? <Check size={11} aria-hidden /> : d.status === 'falhou' ? <X size={11} aria-hidden /> : null}{NOME_DESTINO[d.destino] ?? d.destino}
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            <button onClick={() => { onFechar(); router.push('/rastreabilidade') }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg"
              style={tema === 'xms' ? { background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' } : { color: '#2ecc9b', border: '1px solid rgba(46,204,155,0.45)' }}>
              <Route size={14} aria-hidden />{L('Ver o caminho do dinheiro (Rastreabilidade)', 'See the money path (Traceability)', 'Ver el camino del dinero (Trazabilidad)')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
