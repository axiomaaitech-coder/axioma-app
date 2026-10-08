'use client'
// Rastreabilidade — o caminho de cada dinheiro que se mexeu no Axioma. Cada
// pagamento/recebimento/estorno aparece com as "portas" (módulos) por onde
// precisava passar e o selo de cada uma: chegou, a caminho ou falhou (com o
// motivo). O botão "Houve falha?" refaz o caminho (Guardião) e pede à
// Inteligência do Axioma a explicação em linguagem simples do que sobrou.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Check, Clock, X, Minus, Sparkles, RotateCcw, ExternalLink } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { ThemeToggle } from '../../../components/ThemeToggle'
import AvisoAxioma from '../../../components/AvisoAxioma'
import HistoricoConta from '../../../components/HistoricoConta'
import { useThemeAxioma } from '../../../lib/ThemeContext'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import { rodarGuardiao } from '../../../lib/rastreio/guardiao'
import { DESTINOS_POR_TIPO, type Destino, type TipoRastreio, type StatusDestino } from '../../../lib/rastreio/motor'
import { lerTodas } from '../../../lib/lerTodas'
import { reportarFalhaLeitura } from '../../../lib/erroUiHelpers'
import { fBRL2 } from '../../../lib/cfoCore'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

type Idioma3 = 'pt' | 'en' | 'es'
type DestinoRow = { destino: Destino; status: StatusDestino; ultimo_erro: string | null; tentativas: number; resolvido_por: string | null; executado_em: string | null }
type RastroRow = {
  id: string; tipo: TipoRastreio; origem_tabela: string; origem_id: string; valor: number; encargos: number;
  data_movimento: string; descricao: string | null; status: 'pendente' | 'ok' | 'falhou'; criado_em: string;
  payload: { contraparte?: string | null; forma?: string | null; origem_modulo?: string | null; natureza?: string | null }; rastreio_destino: DestinoRow[];
}
type Explicacao = { rastreio_id: string; explicacao: string; acao: string }

const PALETA = {
  dark: { VERDE: '#2ecc9b', VERMELHO: '#f87171', AMBAR: '#fbbf24', CINZA: '#a3b1c2', TEXTO: '#e6edf5', PAINEL_BG: 'rgba(10,20,36,0.7)', ANINHADA: 'rgba(2,8,16,0.5)', BORDA: 'rgba(255,255,255,0.08)' },
  xms: { VERDE: '#0f7d5c', VERMELHO: '#d93848', AMBAR: '#b45309', CINZA: '#374151', TEXTO: '#101b3d', PAINEL_BG: '#f6f7c4', ANINHADA: 'rgba(255,255,255,0.5)', BORDA: 'rgba(16,27,61,0.12)' },
} as const

const NOME_DESTINO: Record<Destino, Record<Idioma3, string>> = {
  contabilidade: { pt: 'Contabilidade', en: 'Accounting', es: 'Contabilidad' },
  fluxo_caixa: { pt: 'Fluxo de Caixa', en: 'Cash Flow', es: 'Flujo de Caja' },
  dre_gerencial: { pt: 'Receitas/Custos e DRE', en: 'Revenue/Costs & P&L', es: 'Ingresos/Costos y EERR' },
  inadimplencia: { pt: 'Inadimplência', en: 'Delinquency', es: 'Morosidad' },
}
const NOME_TIPO: Record<TipoRastreio, Record<Idioma3, string>> = {
  ap_pagamento: { pt: 'Pagamento a fornecedor', en: 'Supplier payment', es: 'Pago a proveedor' },
  ap_estorno: { pt: 'Estorno de pagamento', en: 'Payment reversal', es: 'Reversión de pago' },
  ar_recebimento: { pt: 'Recebimento de cliente', en: 'Customer receipt', es: 'Cobro de cliente' },
  ar_estorno: { pt: 'Estorno de recebimento', en: 'Receipt reversal', es: 'Reversión de cobro' },
  ap_criacao: { pt: 'Nova conta a pagar', en: 'New bill to pay', es: 'Nueva cuenta por pagar' },
  ar_criacao: { pt: 'Nova conta a receber', en: 'New bill to receive', es: 'Nueva cuenta por cobrar' },
  manual: { pt: 'Lançamento manual', en: 'Manual entry', es: 'Registro manual' },
  manual_estorno: { pt: 'Lançamento manual desfeito (edição/exclusão)', en: 'Manual entry undone (edit/delete)', es: 'Registro manual deshecho (edición/eliminación)' },
}
// Nascimento: de qual tela/módulo a conta veio
const NOME_ORIGEM: Record<string, Record<Idioma3, string>> = {
  contas_pagar: { pt: 'Nova Conta em Contas a Pagar', en: 'New Bill in Payables', es: 'Nueva Cuenta en Cuentas por Pagar' },
  contas_receber: { pt: 'Nova Conta em Contas a Receber', en: 'New Bill in Receivables', es: 'Nueva Cuenta en Cuentas por Cobrar' },
  fornecedores: { pt: 'Fornecedores', en: 'Suppliers', es: 'Proveedores' },
  clientes: { pt: 'Clientes', en: 'Customers', es: 'Clientes' },
  inadimplencia: { pt: 'Inadimplência', en: 'Delinquency', es: 'Morosidad' },
  importar_documentos: { pt: 'Nota importada (Importar Documentos)', en: 'Imported invoice (Import Documents)', es: 'Nota importada (Importar Documentos)' },
  custos_fixos: { pt: 'Custo Fixo (gerada sozinha no mês)', en: 'Fixed Cost (generated automatically)', es: 'Costo Fijo (generada sola en el mes)' },
  receitas: { pt: 'Receitas', en: 'Revenue', es: 'Ingresos' },
  custos_variaveis: { pt: 'Custos Variáveis', en: 'Variable Costs', es: 'Costos Variables' },
  fluxo_caixa: { pt: 'Fluxo de Caixa', en: 'Cash Flow', es: 'Flujo de Caja' },
  faturamento_mei: { pt: 'Faturamento MEI', en: 'MEI Revenue', es: 'Facturación MEI' },
  importar_documentos_custo: { pt: 'Nota importada (Importar Documentos)', en: 'Imported invoice (Import Documents)', es: 'Nota importada (Importar Documentos)' },
}

export default function RastreabilidadePage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const local = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const router = useRouter()
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const P = PALETA[tema]
  const classePremium3d = ' axi-card-premium3d axi-card-faixa'

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [rastros, setRastros] = useState<RastroRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'falhou' | 'pendente'>('todos')
  const [resolvendo, setResolvendo] = useState(false)
  const [explicacoes, setExplicacoes] = useState<Explicacao[]>([])
  const [aviso, setAviso] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null)
  const [historico, setHistorico] = useState<{ tipo: 'pagar' | 'receber'; id: string } | null>(null)

  const carregar = useCallback(async (emp: string) => {
    const { data, error } = await lerTodas(() => supabase.from('rastreio_movimentacao')
      .select('id, tipo, origem_tabela, origem_id, valor, encargos, data_movimento, descricao, status, criado_em, payload, rastreio_destino(destino, status, ultimo_erro, tentativas, resolvido_por, executado_em)')
      .eq('empresa_id', emp).order('criado_em', { ascending: false }).order('id'))
    if (error) { reportarFalhaLeitura('rastreabilidade.carregar', error); setAviso({ msg: L('Não foi possível carregar os rastros. Tente de novo.', 'Could not load the trails. Try again.', 'No se pudieron cargar los rastros. Intente de nuevo.'), tipo: 'erro' }) }
    setRastros((data || []) as RastroRow[])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  useEffect(() => {
    (async () => {
      const emp = await obterEmpresaAtiva()
      setEmpresaId(emp)
      if (emp) await carregar(emp)
      setCarregando(false)
    })()
    const recarregar = () => { if (empresaId) void carregar(empresaId) }
    window.addEventListener('axioma:dados-atualizados', recarregar)
    return () => window.removeEventListener('axioma:dados-atualizados', recarregar)
  }, [carregar, empresaId])

  // O aviso some sozinho (a barra do AvisoAxioma é só visual).
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 7000)
    return () => clearTimeout(t)
  }, [aviso])

  const contagem = useMemo(() => ({
    total: rastros.length,
    ok: rastros.filter((r) => r.status === 'ok').length,
    falhou: rastros.filter((r) => r.status === 'falhou').length,
    pendente: rastros.filter((r) => r.status === 'pendente').length,
  }), [rastros])
  const visiveis = filtro === 'todos' ? rastros : rastros.filter((r) => r.status === filtro)

  async function resolver() {
    if (!empresaId || resolvendo) return
    setResolvendo(true); setExplicacoes([])
    try {
      // 1) Refaz o caminho de tudo que não chegou (o pedido do usuário pula a folga de 1 min).
      const r = await rodarGuardiao(empresaId, 'usuario', 200)
      await carregar(empresaId)
      if (r.aindaComFalha.length === 0) {
        setAviso({ msg: r.resolvidos > 0
          ? L(`Resolvido: ${r.resolvidos} rastro(s) chegaram a todos os módulos.`, `Resolved: ${r.resolvidos} trail(s) reached every module.`, `Resuelto: ${r.resolvidos} rastro(s) llegaron a todos los módulos.`)
          : L('Tudo em ordem: todo dinheiro chegou a todos os módulos.', 'All good: every amount reached every module.', 'Todo en orden: todo el dinero llegó a todos los módulos.'), tipo: 'ok' })
        return
      }
      // 2) O que sobrou: a Inteligência do Axioma explica onde parou e o que fazer.
      const res = await fetch('/api/ia/rastreio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empresa_id: empresaId, lang }) })
      const j = await res.json().catch(() => null)
      if (res.ok && Array.isArray(j?.itens)) setExplicacoes(j.itens)
      setFiltro('falhou')
      setAviso({ msg: L(`${r.resolvidos} resolvido(s). ${r.aindaComFalha.length} ainda precisa(m) de atenção — veja a explicação em cada um.`, `${r.resolvidos} resolved. ${r.aindaComFalha.length} still need attention — see the explanation on each.`, `${r.resolvidos} resuelto(s). ${r.aindaComFalha.length} aún necesita(n) atención — vea la explicación en cada uno.`), tipo: 'erro' })
    } catch (e) {
      reportarFalhaLeitura('rastreabilidade.resolver', e)
      setAviso({ msg: L('Não foi possível concluir a verificação agora. Tente de novo em instantes.', 'Could not finish the check right now. Try again shortly.', 'No se pudo concluir la verificación ahora. Intente de nuevo en unos instantes.'), tipo: 'erro' })
    } finally { setResolvendo(false) }
  }

  const selo = (s: StatusDestino) => s === 'ok' ? { cor: P.VERDE, Icone: Check, txt: L('Chegou', 'Arrived', 'Llegó') }
    : s === 'falhou' ? { cor: P.VERMELHO, Icone: X, txt: L('Falhou', 'Failed', 'Falló') }
    : s === 'nao_aplica' ? { cor: P.CINZA, Icone: Minus, txt: L('Não se aplica', 'Not applicable', 'No aplica') }
    : { cor: P.AMBAR, Icone: Clock, txt: L('A caminho', 'On the way', 'En camino') }

  const botaoUtil = temaClaro
    ? { background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }
    : { background: 'rgba(46,204,155,0.14)', color: '#2ecc9b', border: '1px solid rgba(46,204,155,0.45)' }

  return (
    <div data-theme={tema} style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
      <ModuloLayout
        titulo={L('Rastreabilidade', 'Traceability', 'Trazabilidad')}
        subtitulo={L('O caminho de cada dinheiro que entrou ou saiu: por quais módulos ele precisava passar e se chegou em todos.', 'The path of every amount that came in or went out: which modules it had to reach and whether it reached them all.', 'El camino de cada dinero que entró o salió: por qué módulos debía pasar y si llegó a todos.')}
        headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
        botaoExtra={
          <>
            <button onClick={resolver} disabled={resolvendo || !empresaId}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60" style={botaoUtil}>
              {resolvendo ? <RotateCcw size={15} className="animate-spin" aria-hidden /> : <Sparkles size={15} aria-hidden />}
              {resolvendo ? L('Refazendo o caminho…', 'Redoing the path…', 'Rehaciendo el camino…') : L('Houve falha? Resolver com a Inteligência do Axioma', 'Something failed? Resolve with Axioma Intelligence', '¿Hubo una falla? Resolver con la Inteligencia de Axioma')}
            </button>
            <ThemeToggle />
          </>
        }
      >
        <AvisoAxioma aviso={aviso} onFechar={() => setAviso(null)} duracao={7000} />
        <HistoricoConta tipo={historico?.tipo ?? 'pagar'} contaId={historico?.id ?? null} onFechar={() => setHistorico(null)} />

        {carregando ? (
          <p className="text-sm" style={{ color: P.CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p>
        ) : !empresaId ? (
          <p className="text-sm" style={{ color: P.CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-2xl p-4 md:p-5${classePremium3d}`} style={{ background: P.PAINEL_BG, border: `1px solid ${P.BORDA}` }}>
              <p className="text-sm leading-relaxed" style={{ color: P.TEXTO }}>
                {L('Cada baixa vira um rastro com data, hora e valor. O Guardião confere a cada 5 minutos e termina sozinho o que parou no meio — sem nunca lançar duas vezes.',
                  'Every payment becomes a trail with date, time and amount. The Guardian checks every 5 minutes and finishes on its own whatever stopped midway — never posting twice.',
                  'Cada pago se convierte en un rastro con fecha, hora y valor. El Guardián revisa cada 5 minutos y termina solo lo que quedó a medias — sin registrar nunca dos veces.')}
              </p>
              <div className="flex flex-wrap gap-2 mt-3" role="tablist">
                {([
                  ['todos', L('Todos', 'All', 'Todos'), contagem.total, P.TEXTO],
                  ['falhou', L('Com falha', 'Failed', 'Con falla'), contagem.falhou, P.VERMELHO],
                  ['pendente', L('A caminho', 'On the way', 'En camino'), contagem.pendente, P.AMBAR],
                ] as const).map(([chave, rotulo, n, cor]) => (
                  <button key={chave} role="tab" aria-selected={filtro === chave} onClick={() => setFiltro(chave)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={filtro === chave ? (temaClaro ? { background: '#101b3d', color: '#fff' } : { background: 'rgba(46,204,155,0.18)', color: '#2ecc9b' }) : { background: P.ANINHADA, color: P.TEXTO, border: `1px solid ${P.BORDA}` }}>
                    {rotulo} <span style={{ color: filtro === chave ? undefined : cor }}>{n}</span>
                  </button>
                ))}
                <span className="text-sm self-center ml-1" style={{ color: P.CINZA }}>
                  {L(`${contagem.ok} chegaram em todos os módulos`, `${contagem.ok} reached every module`, `${contagem.ok} llegaron a todos los módulos`)}
                </span>
              </div>
            </div>

            {visiveis.length === 0 ? (
              <div className={`rounded-2xl p-6${classePremium3d}`} style={{ background: P.PAINEL_BG, border: `1px solid ${P.BORDA}` }}>
                <p className="text-sm" style={{ color: P.TEXTO }}>
                  {filtro === 'todos'
                    ? L('Nenhuma movimentação ainda. Dê baixa numa conta em Contas a Pagar ou Contas a Receber e o caminho dela aparece aqui.', 'No movements yet. Settle a bill in Payables or Receivables and its path shows up here.', 'Aún no hay movimientos. Registre un pago en Cuentas por Pagar o por Cobrar y su camino aparecerá aquí.')
                    : L('Nada neste filtro.', 'Nothing in this filter.', 'Nada en este filtro.')}
                </p>
              </div>
            ) : visiveis.map((r) => {
              const exp = explicacoes.find((e) => e.rastreio_id === r.id)
              const destinos = DESTINOS_POR_TIPO[r.tipo].map((d) => r.rastreio_destino.find((x) => x.destino === d) ?? { destino: d, status: 'pendente' as StatusDestino, ultimo_erro: null, tentativas: 0, resolvido_por: null, executado_em: null })
              const entrada = r.tipo === 'ar_recebimento' || (r.tipo === 'manual' && ['receita', 'aporte', 'emprestimo'].includes(r.payload?.natureza || ''))
              const ROTAS: Record<string, string> = { contas_pagar: '/contas-pagar', contas_receber: '/contas-receber', receitas: '/receitas', custos_variaveis: '/custos-variaveis', fluxo_caixa: '/fluxo-caixa' }
              const rotaOrigem = ROTAS[r.origem_tabela] || '/contas-receber'
              const ehConta = r.origem_tabela === 'contas_pagar' || r.origem_tabela === 'contas_receber'
              return (
                <article key={r.id} className={`rounded-2xl p-4 md:p-5${classePremium3d}`}
                  style={{ background: P.PAINEL_BG, border: `1px solid ${r.status === 'falhou' ? P.VERMELHO + '66' : P.BORDA}` }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: P.CINZA }}>{NOME_TIPO[r.tipo][lang]}{r.payload?.contraparte ? ` — ${r.payload.contraparte}` : ''}</p>
                      <h3 className="text-base font-bold leading-snug break-words" style={{ color: P.TEXTO }}>{r.descricao}</h3>
                      <p className="text-xs mt-0.5" style={{ color: P.CINZA }}>
                        {L('Data do movimento', 'Movement date', 'Fecha del movimiento')}: {new Date(r.data_movimento + 'T00:00:00').toLocaleDateString(local)}
                        {' · '}{L('registrado em', 'recorded on', 'registrado el')} {new Date(r.criado_em).toLocaleString(local, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {r.payload?.forma ? ` · ${r.payload.forma}` : ''}
                      </p>
                      {(r.tipo.endsWith('criacao') || r.tipo === 'manual') && (
                        <p className="text-xs mt-0.5 font-semibold" style={{ color: P.VERDE }}>
                          {L('Nasceu em', 'Created in', 'Nació en')}: {(NOME_ORIGEM[r.payload?.origem_modulo || ''] || NOME_ORIGEM[r.origem_tabela])?.[lang] || r.payload?.origem_modulo}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black" style={{ color: r.tipo.endsWith('estorno') ? P.CINZA : entrada ? P.VERDE : P.TEXTO }}>
                        {r.tipo.endsWith('criacao') ? '' : entrada ? '+' : r.tipo.endsWith('estorno') ? '↺ ' : '−'} R$ {fBRL2(Number(r.valor))}
                      </p>
                      {Number(r.encargos) > 0 && <p className="text-xs" style={{ color: P.AMBAR }}>{L('inclui juros/multa', 'includes interest/penalty', 'incluye intereses/multa')} R$ {fBRL2(Number(r.encargos))}</p>}
                      <div className="flex flex-col items-end gap-0.5 mt-1">
{ehConta && (
                        <button onClick={() => setHistorico({ tipo: r.origem_tabela === 'contas_pagar' ? 'pagar' : 'receber', id: r.origem_id })} className="text-xs font-semibold underline" style={{ color: P.VERDE }}>
                          {L('Ver histórico da conta', 'See bill history', 'Ver historial de la cuenta')}
                        </button>
                        )}
                        <button onClick={() => router.push(rotaOrigem)} className="inline-flex items-center gap-1 text-xs underline" style={{ color: P.CINZA }}>
                          {L('Ir para', 'Go to', 'Ir a')} {(NOME_ORIGEM[r.origem_tabela] || NOME_ORIGEM.contas_receber)[lang].replace(/^Nova Conta em /, '').replace(/^New Bill in /, '').replace(/^Nueva Cuenta en /, '')}<ExternalLink size={11} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* O caminho: uma porta por módulo, ligadas pela linha do dinheiro. */}
                  <ol className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))` }}>
                    {destinos.map((d) => {
                      const s = selo(d.status)
                      return (
                        <li key={d.destino} className="rounded-xl px-3 py-2.5" style={{ background: P.ANINHADA, border: `1px solid ${d.status === 'falhou' ? s.cor + '80' : P.BORDA}` }}>
                          <p className="text-sm font-semibold" style={{ color: P.TEXTO }}>{NOME_DESTINO[d.destino][lang]}</p>
                          <p className="flex items-center gap-1 text-xs font-bold mt-1" style={{ color: s.cor }}>
                            <s.Icone size={13} aria-hidden />{s.txt}
                            {d.tentativas > 1 && <span className="font-normal" style={{ color: P.CINZA }}>· {d.tentativas} {L('tentativas', 'attempts', 'intentos')}</span>}
                          </p>
                          {d.resolvido_por === 'guardiao' && d.status === 'ok' && <p className="text-[11px] mt-0.5" style={{ color: P.CINZA }}>{L('concluído pelo Guardião', 'completed by the Guardian', 'completado por el Guardián')}</p>}
                        </li>
                      )
                    })}
                  </ol>

                  {exp && (
                    <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: temaClaro ? 'rgba(217,56,72,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${P.VERMELHO}40` }}>
                      <p className="flex items-center gap-1.5 text-sm font-bold" style={{ color: P.TEXTO }}><Sparkles size={14} aria-hidden style={{ color: P.VERDE }} />{L('Inteligência do Axioma', 'Axioma Intelligence', 'Inteligencia de Axioma')}</p>
                      <p className="text-sm mt-1 leading-relaxed" style={{ color: P.TEXTO }}>{exp.explicacao}</p>
                      <p className="text-sm mt-1 font-semibold" style={{ color: P.TEXTO }}>{L('O que fazer', 'What to do', 'Qué hacer')}: {exp.acao}</p>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </ModuloLayout>
    </div>
  )
}
