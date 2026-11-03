'use client'
// Contas Vencidas — painel geral (Overdue Command Center, Fase 2 etapa 1) + listas a pagar/a receber.
// Números do motor de vencidos (lib/vencidos): mesma regra de saldo das telas de origem; cada lista leva à
// tela de origem já filtrada em "vencido", onde se paga/recebe. Esta tela só lê (e guarda a foto diária da
// previsão para comparar previsto x realizado e montar a evolução).
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { AlertTriangle, Search } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { ThemeToggle } from '../../../components/ThemeToggle'
import SeletorPeriodo from '../../../components/SeletorPeriodo'
import CentralVencidos, { CentralDisputas } from './CentralVencidos'
import { LetreiroAxioma } from '../../../components/LetreiroAxioma'
import ReactECharts from 'echarts-for-react'
import { useThemeAxioma } from '../../../lib/ThemeContext'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import { optBarrasH, optBarrasV, coresSituacao, resolverPeriodo, type Periodo, type PeriodoPreset } from '../../../lib/cfoCore'
import { carregarAnaliseVencidos, registrarPrevisaoDoDia, type AnaliseVencidos } from '../../../lib/vencidos/dados'
import { filtrosIniciais, resumoPainel, type Filtros, type Situacao } from '../../../lib/vencidos/painel'

type Idioma3 = 'pt' | 'en' | 'es'
const PALETA = {
  // Escuro: paleta aprovada 2026-10-03 (alerta amarelo, nada de laranja). Claro: card creme, caixa
  // aninhada bege, texto menta escuro/navy (mesmas cores de Inadimplência e Contas a Receber).
  dark: { VERDE: '#34d399', VERMELHO: '#f87171', ALERTA: '#2ecc9b', CINZA: '#a3b1c2', TEXTO: '#e6edf5', PAINEL_BG: 'linear-gradient(180deg, rgba(16,32,58,0.92), rgba(10,22,40,0.92))', ANINHADA: 'rgba(2,8,16,0.5)', BORDA: 'rgba(46,204,155,0.15)', CAMPO: 'rgba(10,22,40,0.9)', BARRA_REC: '#34d399' },
  xms: { VERDE: '#0f7a5a', VERMELHO: '#d93848', ALERTA: '#101b3d', CINZA: '#374151', TEXTO: '#101b3d', PAINEL_BG: '#f6f7c4', ANINHADA: 'rgba(245,238,220,0.7)', BORDA: 'rgba(16,27,61,0.12)', CAMPO: '#ffffff', BARRA_REC: '#2ecc9b' },
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
  const [a, setA] = useState<AnaliseVencidos | null>(null)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [preset, setPreset] = useState<PeriodoPreset>('mes_atual')
  const [personalizado, setPersonalizado] = useState<Periodo>(() => resolverPeriodo('mes_atual'))
  const periodo = useMemo(() => resolverPeriodo(preset, personalizado), [preset, personalizado])
  const [f, setF] = useState<Filtros>(() => filtrosIniciais(periodo.inicio, periodo.fim))
  const [lado, setLado] = useState<'receber' | 'pagar'>('receber')
  // tela de celular (acompanha girar o aparelho)
  const [estreito, setEstreito] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const ver = () => setEstreito(mq.matches)
    ver(); mq.addEventListener('change', ver)
    return () => mq.removeEventListener('change', ver)
  }, [])

  useEffect(() => {
    const ler = () => {
      void obterEmpresaAtiva().then(async (id) => {
        setEmpresaId(id)
        if (!id) { setA(null); setCarregando(false); return }
        const analise = await carregarAnaliseVencidos(id)
        setA(analise); setCarregando(false)
        if (!analise.falhou) void registrarPrevisaoDoDia(id, analise) // foto do dia: precisão e evolução
      })
    }
    ler()
    window.addEventListener('axioma:dados-atualizados', ler)
    return () => window.removeEventListener('axioma:dados-atualizados', ler)
  }, [])

  const filtros = { ...f, inicio: periodo.inicio, fim: periodo.fim }
  const r = a ? resumoPainel(a, filtros) : null

  const painel = { background: P.PAINEL_BG, border: `1px solid ${P.BORDA}` }
  const aninhada = { background: P.ANINHADA, border: `1px solid ${P.BORDA}` }
  const campo = { background: P.CAMPO, color: P.TEXTO, border: `1px solid ${P.BORDA}` }
  const dataTxt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(local)
  const pct = (v: number | null) => (v == null ? '—' : `${v.toLocaleString(local, { maximumFractionDigits: 1 })}%`)

  const situacoes: [Situacao, string][] = [
    ['todas', L('Todas as situações', 'All statuses', 'Todas las situaciones')],
    ['promessa', L('Com promessa de pagamento', 'With payment promise', 'Con promesa de pago')],
    ['negociacao', L('Em negociação', 'In negotiation', 'En negociación')],
    ['disputa', L('Com divergência', 'In dispute', 'Con divergencia')],
    ['sem_acompanhamento', L('Sem acompanhamento', 'Not followed up', 'Sin seguimiento')],
  ]
  const ag = r ? (lado === 'receber' ? r.agingReceber : r.agingPagar) : null
  // Cores de situação do Axioma (coresSituacao): a vencer cinza, até 30 dias verde-menta, 31–90 azul-marinho,
  // acima de 90 vermelho (atraso grave) — sempre com legenda; nada de dourado
  const cs = coresSituacao(temaClaro)
  const CORES_AGING = { aVencer: cs.neutro, ate30: cs.bom, ate90: cs.atencao, acima90: cs.critico }
  const corFaixa = (ate: number | null) => (ate != null && ate <= 30 ? CORES_AGING.ate30 : ate != null && ate <= 90 ? CORES_AGING.ate90 : CORES_AGING.acima90)
  const rotulosAging = ag ? [L('A vencer', 'Not due', 'Por vencer'), ...ag.faixas.map((x) => x.rotulo)] : []
  const valoresAging = ag ? [ag.aVencer.saldo, ...ag.faixas.map((x) => x.saldo)] : []
  const qtdAging = ag ? [ag.aVencer.qtd, ...ag.faixas.map((x) => x.qtd)] : []
  const baseAging = valoresAging.reduce((s, v) => s + v, 0)
  const ate30 = ag && baseAging > 0 ? Math.round(((ag.aVencer.saldo + ag.faixas.filter((x) => x.ate != null && x.ate <= 30).reduce((s, x) => s + x.saldo, 0)) / baseAging) * 1000) / 10 : null
  // Celular: barras DEITADAS (faixa na lateral, todas legíveis); computador: colunas. Mesmo dado, mesmas cores.
  const opcaoAging = ag ? (() => {
    const cores = [CORES_AGING.aVencer, ...ag.faixas.map((x) => corFaixa(x.ate))]
    const o = (estreito ? optBarrasH : optBarrasV)(valoresAging, rotulosAging, CORES_AGING.ate90, CORES_AGING.ate30, cores, temaClaro)
    const dias = L('dias', 'days', 'días'), contas = L('conta(s)', 'bill(s)', 'cuenta(s)'), doTotal = L('do total', 'of total', 'del total')
    const curto = (v: number) => v.toLocaleString(local, { notation: 'compact', maximumFractionDigits: 1 })
    const nomeFaixa = (v: string, i: number) => (i === 0 ? v : `${v} ${dias}`)
    const eixoCategoria = { interval: 0, fontSize: estreito ? 10 : 11, formatter: nomeFaixa, ...(estreito ? {} : { rotate: 30 }) }
    const eixoValor = { formatter: (v: number) => curto(v) }
    return {
      ...o,
      grid: estreito ? { ...o.grid, right: 52 } : { ...o.grid, left: 56, right: 8, bottom: 40 },
      ...(estreito
        ? { yAxis: { ...o.yAxis, axisLabel: { ...o.yAxis.axisLabel, ...eixoCategoria } }, xAxis: { ...o.xAxis, axisLabel: { ...o.xAxis.axisLabel, ...eixoValor } } }
        : { xAxis: { ...o.xAxis, axisLabel: { ...o.xAxis.axisLabel, ...eixoCategoria } }, yAxis: { ...o.yAxis, axisLabel: { ...o.yAxis.axisLabel, ...eixoValor } } }),
      tooltip: { ...o.tooltip, confine: true, formatter: (p: { dataIndex: number; name: string; value: number }) =>
        `<b>${nomeFaixa(p.name, p.dataIndex)}</b><br/><b style="font-size:15px">${fmt(p.value)}</b><br/>${qtdAging[p.dataIndex]} ${contas} · ${baseAging ? ((p.value / baseAging) * 100).toLocaleString(local, { maximumFractionDigits: 1 }) : 0}% ${doTotal}` },
      series: [{ ...o.series[0], barWidth: estreito ? '64%' : '62%', label: { ...o.series[0].label, fontSize: 10, formatter: (p: { value: number }) => (p.value > 0 ? curto(p.value) : '') } }],
    }
  })() : null

  return (
    <div data-theme={tema}>
      <ModuloLayout titulo={L('Contas Vencidas', 'Overdue Bills', 'Cuentas Vencidas')}
        subtitulo={L('O que está atrasado, a pagar e a receber, numa tela só — e o caminho para resolver', 'What is late, payable and receivable, on one screen — and the way to solve it', 'Lo que está atrasado, por pagar y por cobrar, en una sola pantalla — y el camino para resolverlo')}
        headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
        botaoExtra={<ThemeToggle />}>
        {carregando ? <p className="text-xs py-10 text-center" style={{ color: P.CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p> : !a || !r ? (
          <p className="text-xs py-10 text-center" style={{ color: P.CINZA }}>{L('Escolha a Empresa ativa no topo da tela.', 'Choose the active Company at the top of the screen.', 'Elija la Empresa activa en la parte superior.')}</p>
        ) : (
          <div className="space-y-4">
            {a.falhou && <p role="alert" className="text-xs font-semibold flex items-center gap-1" style={{ color: P.VERMELHO }}><AlertTriangle size={14} />{L('Alguns dados não carregaram — os números podem estar incompletos. Atualize a página.', 'Some data did not load — the numbers may be incomplete. Refresh the page.', 'Algunos datos no cargaron — los números pueden estar incompletos. Actualice la página.')}</p>}

            {/* Letreiro padrão do Axioma (azul-marinho, letra branca, destaque verde-menta) com os números do painel */}
            <LetreiroAxioma id="vencidos" cor="#2ecc9b" itens={[
              `${L('A receber vencido', 'Overdue receivable', 'Por cobrar vencido')}: ${fmt(r.totalReceber)}`,
              `${L('A pagar vencido', 'Overdue payable', 'Por pagar vencido')}: ${fmt(r.totalPagar)}`,
              `${L('Recuperado no período', 'Recovered in period', 'Recuperado en el período')}: ${fmt(r.recuperado)}`,
              `${L('Taxa de recuperação', 'Recovery rate', 'Tasa de recuperación')}: ${pct(r.taxaRecuperacao)}`,
              `${L('Promessas descumpridas', 'Broken promises', 'Promesas incumplidas')}: ${r.promessasDescumpridas}`,
              `${L('Divergências abertas', 'Open disputes', 'Divergencias abiertas')}: ${r.disputasAbertas}`,
              `${L('Até 30 dias', 'Up to 30 days', 'Hasta 30 días')}: ${pct(ate30)} (${L('referência 75–80%', 'reference 75–80%', 'referencia 75–80%')})`,
            ]} />

            {/* Filtros: valem para os números, as faixas e as listas */}
            <div className="rounded-2xl p-3 axi-card-premium3d axi-card-faixa flex flex-wrap items-center gap-2" style={painel}>
              <SeletorPeriodo preset={preset} onChangePreset={setPreset} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={P.VERDE} lang={lang} temaClaro={temaClaro} />
              <label className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs min-w-[12rem] flex-1 sm:flex-none" style={campo}>
                <Search size={14} aria-hidden />
                <span className="sr-only">{L('Buscar cliente ou fornecedor', 'Search customer or supplier', 'Buscar cliente o proveedor')}</span>
                <input value={f.busca} onChange={(e) => setF({ ...f, busca: e.target.value })} placeholder={L('Cliente, fornecedor ou descrição', 'Customer, supplier or description', 'Cliente, proveedor o descripción')} className="bg-transparent outline-none w-full" style={{ color: P.TEXTO }} />
              </label>
              <select aria-label={L('Faixa de atraso', 'Overdue range', 'Rango de atraso')} value={f.faixa} onChange={(e) => setF({ ...f, faixa: Number(e.target.value) })} className="rounded-lg px-2 py-1.5 text-xs" style={campo}>
                <option value={-1}>{L('Todas as faixas', 'All ranges', 'Todos los rangos')}</option>
                {r.agingReceber.faixas.map((x, i) => <option key={x.rotulo} value={i}>{x.rotulo} {L('dias', 'days', 'días')}</option>)}
              </select>
              <select aria-label={L('Situação', 'Status', 'Situación')} value={f.situacao} onChange={(e) => setF({ ...f, situacao: e.target.value as Situacao })} className="rounded-lg px-2 py-1.5 text-xs" style={campo}>
                {situacoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>

            {/* Totais (os mesmos três de antes) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { t: L('A receber vencido', 'Overdue receivable', 'Por cobrar vencido'), v: r.totalReceber, n: r.receber.length, cor: P.VERDE },
                { t: L('A pagar vencido', 'Overdue payable', 'Por pagar vencido'), v: r.totalPagar, n: r.pagar.length, cor: P.VERMELHO },
                { t: L('Diferença (receber − pagar)', 'Difference (receive − pay)', 'Diferencia (cobrar − pagar)'), v: r.diferenca, n: null, cor: r.diferenca >= 0 ? P.VERDE : P.VERMELHO },
              ].map((k) => (
                <div key={k.t} className="rounded-2xl p-4 axi-card-premium3d axi-card-faixa" style={painel}>
                  <p className="text-xs" style={{ color: P.CINZA }}>{k.t}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: k.cor }}>{fmt(k.v)}</p>
                  {k.n !== null && <p className="text-[11px] mt-0.5" style={{ color: P.CINZA }}>{k.n} {L(k.n === 1 ? 'conta' : 'contas', k.n === 1 ? 'bill' : 'bills', k.n === 1 ? 'cuenta' : 'cuentas')}</p>}
                </div>
              ))}
            </div>

            {/* Recuperação e acompanhamento: um bloco, com a origem de cada número */}
            <div className="rounded-2xl p-4 axi-card-premium3d axi-card-faixa" style={painel}>
              <p className="text-sm font-bold mb-3" style={{ color: P.TEXTO }}>{L('Recuperação e acompanhamento', 'Recovery and follow-up', 'Recuperación y seguimiento')}</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <Indicador P={P} aninhada={aninhada} deOnde={L('De onde vem', 'Where it comes from', 'De dónde viene')} titulo={L('Recuperado no período', 'Recovered in period', 'Recuperado en el período')} valor={fmt(r.recuperado)} cor={P.VERDE}
                  origem={L('Soma do que clientes pagaram DEPOIS do vencimento, com a data de recebimento dentro do período escolhido (Contas a Receber). Pagamento em dia não conta.', 'Sum of what customers paid AFTER the due date, with the receipt date inside the chosen period (Receivables). On-time payments do not count.', 'Suma de lo que los clientes pagaron DESPUÉS del vencimiento, con la fecha de cobro dentro del período elegido (Cuentas por Cobrar). El pago a tiempo no cuenta.')} />
                <Indicador P={P} aninhada={aninhada} deOnde={L('De onde vem', 'Where it comes from', 'De dónde viene')} titulo={L('Taxa de recuperação', 'Recovery rate', 'Tasa de recuperación')} valor={pct(r.taxaRecuperacao)} cor={P.VERDE}
                  origem={L('Recuperado no período ÷ (recuperado + o que continua vencido hoje).', 'Recovered in period ÷ (recovered + what is still overdue today).', 'Recuperado en el período ÷ (recuperado + lo que sigue vencido hoy).')} />
                <Indicador P={P} aninhada={aninhada} deOnde={L('De onde vem', 'Where it comes from', 'De dónde viene')} titulo={L('Valor em risco', 'Value at risk', 'Valor en riesgo')} valor={fmt(r.valorEmRisco)} cor={P.VERMELHO}
                  sub={r.qtdSemScore ? L(`+ ${fmt(r.semScore)} sem histórico para medir`, `+ ${fmt(r.semScore)} without history to measure`, `+ ${fmt(r.semScore)} sin historial para medir`) : undefined}
                  origem={L(`Para cada conta vencida de cliente com histórico (4 ou mais pagamentos), saldo não contestado × nota de risco (0 a 1000). Clientes sem histórico suficiente não recebem nota e aparecem à parte. Metodologia ${a.versao}.`, `For each overdue bill of a customer with history (4 or more payments), undisputed balance × risk score (0 to 1000). Customers without enough history get no score and are shown apart. Methodology ${a.versao}.`, `Para cada cuenta vencida de cliente con historial (4 o más pagos), saldo no disputado × nota de riesgo (0 a 1000). Clientes sin historial suficiente no reciben nota y aparecen aparte. Metodología ${a.versao}.`)} />
                <Indicador P={P} aninhada={aninhada} deOnde={L('De onde vem', 'Where it comes from', 'De dónde viene')} titulo={L('Previsão em 30 dias', 'Forecast in 30 days', 'Previsión en 30 días')} valor={fmt(r.previsao.horizontes.find((h) => h.horizonteDias === 30)?.valor ?? 0)} cor={P.TEXTO}
                  sub={L('estimativa, não é caixa', 'estimate, not cash', 'estimación, no es caja')}
                  origem={L('Quanto do vencido deve entrar em 30 dias, pela nota de risco e pelos dias de atraso de cada conta. Valor contestado e cliente sem histórico ficam fora. Promessa não conta como dinheiro.', 'How much of the overdue amount should come in within 30 days, by each bill’s risk score and days overdue. Disputed amounts and customers without history are left out. A promise does not count as money.', 'Cuánto de lo vencido debe entrar en 30 días, según la nota de riesgo y los días de atraso de cada cuenta. Lo disputado y los clientes sin historial quedan fuera. La promesa no cuenta como dinero.')} />
                <Indicador P={P} aninhada={aninhada} deOnde={L('De onde vem', 'Where it comes from', 'De dónde viene')} titulo={L('Promessas em aberto', 'Open promises', 'Promesas abiertas')} valor={String(r.promessasPendentes)} cor={P.TEXTO} sub={r.promessasPendentes ? fmt(r.valorPrometido) : undefined}
                  origem={L('Promessas de pagamento registradas na cobrança (pendentes, confirmadas ou pagas em parte) que ainda não venceram.', 'Payment promises recorded in collection (pending, confirmed or partly paid) that are not due yet.', 'Promesas de pago registradas en la cobranza (pendientes, confirmadas o pagadas en parte) que aún no vencieron.')} />
                <Indicador P={P} aninhada={aninhada} deOnde={L('De onde vem', 'Where it comes from', 'De dónde viene')} titulo={L('Promessas descumpridas', 'Broken promises', 'Promesas incumplidas')} valor={String(r.promessasDescumpridas)} cor={r.promessasDescumpridas ? P.VERMELHO : P.TEXTO}
                  origem={L('Promessas cuja data passou sem nenhum pagamento depois delas.', 'Promises whose date passed with no payment after them.', 'Promesas cuya fecha pasó sin ningún pago después de ellas.')} />
                <Indicador P={P} aninhada={aninhada} deOnde={L('De onde vem', 'Where it comes from', 'De dónde viene')} titulo={L('Divergências abertas', 'Open disputes', 'Divergencias abiertas')} valor={String(r.disputasAbertas)} cor={r.disputasAbertas ? P.ALERTA : P.TEXTO} sub={r.disputasAbertas ? fmt(r.valorContestado) : undefined}
                  origem={L('Contas com divergência aberta ou em análise (a receber e a pagar). O valor é a parte contestada; o restante continua sendo cobrado ou pago.', 'Bills with an open or under-review dispute (receivable and payable). The amount is the disputed part; the rest is still collected or paid.', 'Cuentas con divergencia abierta o en análisis (por cobrar y por pagar). El valor es la parte disputada; el resto se sigue cobrando o pagando.')} />
                <Indicador P={P} aninhada={aninhada} deOnde={L('De onde vem', 'Where it comes from', 'De dónde viene')} titulo={L('Sem previsão confiável', 'No reliable forecast', 'Sin previsión confiable')} valor={fmt(r.previsao.composicao.semPrevisaoConfiavel)} cor={P.CINZA}
                  origem={L('Saldo de clientes com menos de 4 pagamentos no histórico: o Axioma não inventa previsão para eles.', 'Balance of customers with fewer than 4 payments in history: Axioma does not make up a forecast for them.', 'Saldo de clientes con menos de 4 pagos en el historial: Axioma no inventa una previsión para ellos.')} />
              </div>
            </div>

            {/* Atraso por faixa — colunas no padrão dos ERPs/relatórios de CFO (mesmo gráfico de Contas a Receber) */}
            {ag && (
              <div className="rounded-2xl p-4 axi-card-premium3d axi-card-faixa min-w-0" style={painel}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="text-sm font-bold" style={{ color: P.TEXTO }}>{L('Atraso por faixa', 'Overdue by range', 'Atraso por rango')}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: P.CINZA }}>
                      {L('Até 30 dias (com a vencer): ', 'Up to 30 days (incl. not due): ', 'Hasta 30 días (con por vencer): ')}
                      <b style={{ color: ate30 == null ? P.CINZA : ate30 >= 75 ? P.VERDE : P.TEXTO }}>{pct(ate30)}</b>
                      {L(' · referência de mercado: 75–80%', ' · market reference: 75–80%', ' · referencia de mercado: 75–80%')}
                    </p>
                  </div>
                  <div className="flex gap-1" role="group">
                    {(['receber', 'pagar'] as const).map((x) => (
                      <button key={x} type="button" aria-pressed={lado === x} onClick={() => setLado(x)} className="px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                        style={{ background: lado === x ? (x === 'receber' ? BOTAO_ACAO : BOTAO_SECUNDARIO) : temaClaro ? '#6b7280' : 'rgba(255,255,255,0.12)' }}>
                        {x === 'receber' ? L('A receber', 'Receivable', 'Por cobrar') : L('A pagar', 'Payable', 'Por pagar')}
                      </button>
                    ))}
                  </div>
                </div>
                {ag.aVencer.saldo + ag.total > 0 ? (
                  <ReactECharts option={opcaoAging} style={{ height: estreito ? rotulosAging.length * 30 + 30 : 290 }} notMerge lazyUpdate />
                ) : (
                  <p className="text-xs text-center py-10" style={{ color: P.VERDE }}>{L('Nada em aberto neste lado.', 'Nothing open on this side.', 'Nada abierto en este lado.')}</p>
                )}
                {/* mesma informação em tabela, para leitor de tela */}
                <table className="sr-only">
                  <caption>{L('Atraso por faixa', 'Overdue by range', 'Atraso por rango')}</caption>
                  <tbody>{rotulosAging.map((rot, i) => <tr key={rot}><th>{rot}</th><td>{fmt(valoresAging[i])}</td><td>{qtdAging[i]}</td></tr>)}</tbody>
                </table>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] mt-1" style={{ color: P.CINZA }}>
                  <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: CORES_AGING.aVencer }} />{L('A vencer', 'Not due', 'Por vencer')}</span>
                  <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: CORES_AGING.ate30 }} />{L('Até 30 dias', 'Up to 30 days', 'Hasta 30 días')}</span>
                  <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: CORES_AGING.ate90 }} />{L('31 a 90 dias', '31 to 90 days', '31 a 90 días')}</span>
                  <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: CORES_AGING.acima90 }} />{L('Acima de 90 dias', 'Over 90 days', 'Más de 90 días')}</span>
                  <span className="ml-auto">{L(`Juros e multa estimados: ${fmt(ag.faixas.reduce((s, x) => s + x.encargos, 0))} · Maior devedor: ${pct(ag.maiorPct)} do vencido`, `Estimated interest and fines: ${fmt(ag.faixas.reduce((s, x) => s + x.encargos, 0))} · Largest debtor: ${pct(ag.maiorPct)} of overdue`, `Intereses y multas estimados: ${fmt(ag.faixas.reduce((s, x) => s + x.encargos, 0))} · Mayor deudor: ${pct(ag.maiorPct)} de lo vencido`)}</span>
                </div>
              </div>
            )}

              {/* Previsão de recuperação e evolução */}
              <div className="rounded-2xl p-4 axi-card-premium3d axi-card-faixa min-w-0" style={painel}>
                <p className="text-sm font-bold mb-3" style={{ color: P.TEXTO }}>{L('Previsão de recuperação', 'Recovery forecast', 'Previsión de recuperación')}</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {r.previsao.horizontes.map((h) => (
                    <div key={h.horizonteDias} className="rounded-lg p-2 text-center min-w-0 axi-card-premium3d axi-card-faixa" style={aninhada}>
                      <p className="text-[11px]" style={{ color: P.CINZA }}>{h.horizonteDias} {L('dias', 'days', 'días')}</p>
                      <p className="text-xs font-bold truncate" style={{ color: P.VERDE }}>{fmt(h.valor)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: P.CINZA }}>
                  {r.previsao.confianca === 'sem_dados'
                    ? L('Ainda não há clientes com histórico suficiente para prever.', 'There are no customers with enough history to forecast yet.', 'Aún no hay clientes con historial suficiente para prever.')
                    : L(`Confiança ${r.previsao.confianca === 'media' ? 'média' : 'baixa'}. Estimativa, não é caixa disponível.`, `${r.previsao.confianca === 'media' ? 'Medium' : 'Low'} confidence. Estimate, not available cash.`, `Confianza ${r.previsao.confianca === 'media' ? 'media' : 'baja'}. Estimación, no es caja disponible.`)}
                </p>
                <p className="text-sm font-bold mt-4 mb-2" style={{ color: P.TEXTO }}>{L('Evolução do vencido a receber', 'Overdue receivable over time', 'Evolución de lo vencido por cobrar')}</p>
                {a.evolucao.length < 2 ? (
                  <p className="text-[11px]" style={{ color: P.CINZA }}>{L('A evolução começa a ser registrada hoje: a cada dia em que esta tela é aberta, o Axioma guarda o total vencido daquele dia.', 'The history starts today: each day this screen is opened, Axioma saves that day’s overdue total.', 'La evolución empieza hoy: cada día que se abre esta pantalla, Axioma guarda el total vencido de ese día.')}</p>
                ) : (() => {
                  const pts = a.evolucao, max = Math.max(1, ...pts.map((p) => p.saldo))
                  const xy = pts.map((p, i) => `${(i / (pts.length - 1)) * 100},${40 - (p.saldo / max) * 36}`).join(' ')
                  return (
                    <div>
                      <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="w-full h-16" role="img" aria-label={L('Evolução do vencido a receber', 'Overdue receivable over time', 'Evolución de lo vencido por cobrar')}>
                        <polyline points={xy} fill="none" stroke={P.BARRA_REC} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                      </svg>
                      <p className="text-[11px] flex justify-between" style={{ color: P.CINZA }}><span>{dataTxt(pts[0].data)}: {fmt(pts[0].saldo)}</span><span>{dataTxt(pts[pts.length - 1].data)}: {fmt(pts[pts.length - 1].saldo)}</span></p>
                    </div>
                  )
                })()}
              </div>

            {/* Ligações com os módulos vizinhos: cada assunto resolvido no lugar certo, sem duplicar */}
            <nav aria-label={L('Módulos ligados', 'Linked modules', 'Módulos vinculados')} className="flex flex-wrap gap-1.5">
              {([
                ['/contas-receber?filtro=vencido', L('Contas a Receber', 'Receivables', 'Cuentas por Cobrar')],
                ['/contas-pagar?filtro=vencido', L('Contas a Pagar', 'Payables', 'Cuentas por Pagar')],
                ['/inadimplencia', L('Inadimplência (régua e negociação)', 'Delinquency (schedule and negotiation)', 'Morosidad (regla y negociación)')],
                ['/clientes', L('Clientes', 'Customers', 'Clientes')],
                ['/fornecedores', L('Fornecedores', 'Suppliers', 'Proveedores')],
                ['/tesouraria', L('Tesouraria', 'Treasury', 'Tesorería')],
                ['/fluxo-caixa', L('Fluxo de Caixa', 'Cash Flow', 'Flujo de Caja')],
              ] as const).map(([href, nome]) => (
                <Link key={href} href={href} className="px-2.5 py-1 rounded-lg text-xs font-bold text-white axi-card-premium3d axi-card-faixa" style={{ background: BOTAO_SECUNDARIO }}>{nome}</Link>
              ))}
            </nav>

            <CentralDisputas itens={[...a.receber, ...a.pagar]} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} />
            {empresaId && <CentralVencidos dominio="receber" itens={r.receber} empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} tesouraria={a.tesouraria} titulos={a.titulosReceber} temaClaro={temaClaro} />}
            {empresaId && <CentralVencidos dominio="pagar" itens={r.pagar} empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} tesouraria={a.tesouraria} titulos={a.titulosPagar} temaClaro={temaClaro} />}
          </div>
        )}
      </ModuloLayout>
    </div>
  )
}

// Indicador com "de onde vem": toque abre a origem do número (nada escondido em modal)
function Indicador({ titulo, valor, cor, sub, origem, P, aninhada, deOnde }: { titulo: string; valor: string; cor: string; sub?: string; origem: string; P: { CINZA: string; TEXTO: string }; aninhada: CSSProperties; deOnde: string }) {
  return (
    <details className="rounded-xl p-3 min-w-0 axi-card-premium3d axi-card-faixa" style={aninhada}>
      <summary className="cursor-pointer list-none">
        <p className="text-xs" style={{ color: P.CINZA }}>{titulo}</p>
        <p className="text-lg font-bold mt-0.5" style={{ color: cor }}>{valor}</p>
        {sub && <p className="text-[11px]" style={{ color: P.CINZA }}>{sub}</p>}
        <p className="text-[11px] mt-1 underline" style={{ color: P.CINZA }}>{deOnde}</p>
      </summary>
      <p className="text-[11px] mt-2 leading-snug" style={{ color: P.TEXTO }}>{origem}</p>
    </details>
  )
}
