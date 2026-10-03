'use client'
// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 5: Minhas Simulações + "E se...?"
// Choque da economia → mesmo motor do módulo Simulações (cfoCore) em cima
// dos números reais da empresa; salvas em nexus_simulation (RLS por empresa).
// Explicação curta via OpenAI (uso frequente — regra de roteamento de IA),
// com texto por regra se a IA falhar. A conta nunca depende da IA.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Pencil, Trash2, Copy, Archive, ArchiveRestore, Star, ArrowLeft, Play, Save } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import { ThemeToggle } from '../../../../components/ThemeToggle'
import { useLanguage } from '../../../../lib/LanguageContext'
import { useThemeAxioma } from '../../../../lib/ThemeContext'
import { PALETA, VERDE_SOLIDO } from '../../../../lib/nexusTema'
import { DivisorNexus } from '../DivisorNexus'
import { VARIAVEIS_ZERO, PRESETS_MACRO, variaveisDoEvento, type VariaveisMacro } from '../../../../lib/nexusSimulacaoMotor'
import { perguntarAoAxioma } from '../../../../lib/ia/cliente'
import {
  carregarPontoPartida, rodarSimulacao, listarSimulacoes, salvarSimulacao, mudarStatusSimulacao, favoritarSimulacao,
  autoArquivarAntigas, type PontoPartida, type ResultadoSimulacao, type SimulacaoSalva,
} from '../../../../lib/nexusSimulacaoHelpers'

type Lang = 'pt' | 'en' | 'es'
type Nome3 = [string, string, string]

const fBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
const HORIZONTES = [12, 36, 60, 120]

// Campos do "E se...?" — choque (o que muda na economia) e exposição (quanto
// da SUA empresa está sujeita a ele, informado por você).
const CAMPOS: { k: keyof VariaveisMacro; nome: Nome3; dica: Nome3; grupo: 'choque' | 'exposicao' }[] = [
  { k: 'receitaPct', grupo: 'choque', nome: ['Receita (%)', 'Revenue (%)', 'Ingresos (%)'], dica: ['Variação direta das vendas', 'Direct change in sales', 'Variación directa de ventas'] },
  { k: 'dolarPct', grupo: 'choque', nome: ['Dólar (%)', 'US dollar (%)', 'Dólar (%)'], dica: ['Quanto o dólar sobe ou cai', 'How much the dollar moves', 'Cuánto sube o baja el dólar'] },
  { k: 'selicPontos', grupo: 'choque', nome: ['Selic (pontos)', 'Selic (points)', 'Selic (puntos)'], dica: ['Ex.: 2 = Selic sobe 2 pontos ao ano', 'E.g. 2 = Selic up 2 points a year', 'Ej.: 2 = Selic sube 2 puntos al año'] },
  { k: 'ipcaPontos', grupo: 'choque', nome: ['Inflação extra (pontos)', 'Extra inflation (points)', 'Inflación extra (puntos)'], dica: ['Aumento de preços acima do esperado', 'Price increase above expected', 'Aumento de precios por encima de lo esperado'] },
  { k: 'petroleoPct', grupo: 'choque', nome: ['Petróleo (%)', 'Oil (%)', 'Petróleo (%)'], dica: ['Afeta combustível e frete', 'Affects fuel and freight', 'Afecta combustible y flete'] },
  { k: 'exposicaoCambialPct', grupo: 'exposicao', nome: ['Custo em dólar (%)', 'Cost in dollars (%)', 'Costo en dólares (%)'], dica: ['Quanto do seu custo variável é importado ou cotado em dólar', 'Share of your variable cost priced in dollars', 'Parte de su costo variable en dólares'] },
  { k: 'dividaPosFixadaPct', grupo: 'exposicao', nome: ['Dívida pós-fixada (%)', 'Floating-rate debt (%)', 'Deuda variable (%)'], dica: ['Quanto da sua dívida acompanha a Selic', 'Share of your debt tied to Selic', 'Parte de su deuda atada a la Selic'] },
  { k: 'repassePrecoPct', grupo: 'exposicao', nome: ['Repasse ao preço (%)', 'Price pass-through (%)', 'Traslado al precio (%)'], dica: ['Quanto da inflação você consegue repassar', 'How much inflation you can pass on', 'Cuánta inflación puede trasladar'] },
  { k: 'pesoCombustivelPct', grupo: 'exposicao', nome: ['Combustível/frete no custo (%)', 'Fuel/freight in cost (%)', 'Combustible/flete en el costo (%)'], dica: ['Peso de combustível e frete no custo variável', 'Weight of fuel/freight in variable cost', 'Peso de combustible/flete en el costo variable'] },
]

const NOME_CENARIO: Record<string, Nome3> = {
  conservador: ['Conservador', 'Conservative', 'Conservador'],
  base: ['Base', 'Base', 'Base'],
  otimista: ['Otimista', 'Optimistic', 'Optimista'],
  adverso: ['Adverso', 'Adverse', 'Adverso'],
}

function explicacaoPorRegra(r: ResultadoSimulacao, lang: Lang): string {
  const base = r.cenarios.find((c) => c.nome === 'base')
  if (!base) return ''
  const delta = base.lucroLiquidoMensal - r.lucroAtualMensal
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const sentido = delta >= 0 ? L('sobe', 'rises', 'sube') : L('cai', 'falls', 'baja')
  return L(
    `No cenário base, o lucro mensal ${sentido} ${fBRL(Math.abs(delta))} (de ${fBRL(r.lucroAtualMensal)} para ${fBRL(base.lucroLiquidoMensal)}).`,
    `In the base case, monthly profit ${sentido} ${fBRL(Math.abs(delta))} (from ${fBRL(r.lucroAtualMensal)} to ${fBRL(base.lucroLiquidoMensal)}).`,
    `En el escenario base, el beneficio mensual ${sentido} ${fBRL(Math.abs(delta))} (de ${fBRL(r.lucroAtualMensal)} a ${fBRL(base.lucroLiquidoMensal)}).`,
  )
}

export default function NexusSimulacoesPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Lang
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const L3 = (n: Nome3) => L(...n)
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG, MODAL_BG, NESTED_BG, NESTED_BORDA } = PALETA[tema]
  const premium = ' axi-card-premium3d' // efeito nos 2 temas (pedido 2026-09-27)
  const caixa: CSSProperties = { background: PAINEL_BG, border: `1px solid ${CIANO}30` }
  const aninhada: CSSProperties = { background: NESTED_BG, border: `1px solid ${NESTED_BORDA === 'transparent' ? 'rgba(255,255,255,0.06)' : NESTED_BORDA}` }
  const botaoUtil: CSSProperties = temaClaro ? VERDE_SOLIDO : { background: `${CIANO}18`, border: `1px solid ${CIANO}50`, color: CIANO }
  const campo: CSSProperties = temaClaro
    ? { background: '#ffffff', border: '1px solid rgba(16,27,61,0.18)', color: '#101b3d' }
    : { background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(106,176,255,0.2)', color: '#e2ecf7' }
  const POS = temaClaro ? '#16a97d' : '#34d399'
  const NEG = temaClaro ? '#dc3545' : '#f87171'

  const [carregando, setCarregando] = useState(true)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [ponto, setPonto] = useState<PontoPartida | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [variaveis, setVariaveis] = useState<VariaveisMacro>(VARIAVEIS_ZERO)
  const [horizonte, setHorizonte] = useState(12)
  const [nome, setNome] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null)
  // Resultado só vale pros números com que foi calculado — mudou um campo, precisa simular de novo antes de salvar.
  const [chaveResultado, setChaveResultado] = useState('')
  const chaveAtual = JSON.stringify([variaveis, horizonte])
  const resultadoDesatualizado = !!resultado && chaveResultado !== chaveAtual
  const [explicando, setExplicando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [arquivadas, setArquivadas] = useState(false)
  const [lista, setLista] = useState<SimulacaoSalva[]>([])
  const [pagina, setPagina] = useState(0)
  const [temMais, setTemMais] = useState(false)
  const [filtro, setFiltro] = useState<'todas' | 'favoritas' | 'risco' | 'oportunidade' | number>('todas')
  const [confirmarExclusao, setConfirmarExclusao] = useState<SimulacaoSalva | null>(null)
  const [montado, setMontado] = useState(false)
  useEffect(() => { setMontado(true) }, [])
  const naRaiz = (conteudo: ReactNode) => !montado ? null : createPortal(<div data-theme={tema} className="nexus-escala" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{conteudo}</div>, document.body)

  useEffect(() => {
    (async () => {
      const r = await carregarPontoPartida()
      setPonto(r.ponto); setEmpresaId(r.empresaId)
      if (r.erro) setAviso(L('Parte dos dados da empresa não carregou — os números podem estar incompletos.', 'Some company data failed to load — numbers may be incomplete.', 'Parte de los datos no cargó — los números pueden estar incompletos.'))
      if (r.empresaId) await autoArquivarAntigas(r.empresaId)
      // Vindo do evento do José: /nexus/simulacoes?serie=432&variacao=-0.25&titulo=...
      const q = new URLSearchParams(window.location.search)
      const serie = q.get('serie'), variacao = Number(q.get('variacao'))
      if (serie && Number.isFinite(variacao)) {
        const v = variaveisDoEvento(serie, variacao)
        if (v) setVariaveis({ ...VARIAVEIS_ZERO, ...v })
        const titulo = q.get('titulo')
        if (titulo) setNome(titulo.slice(0, 80))
      }
      setCarregando(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function carregarLista(pag: number, arq = arquivadas) {
    if (!empresaId) return
    const r = await listarSimulacoes(empresaId, arq, pag)
    if (r.erro) setAviso(L('Não foi possível carregar suas simulações agora.', 'Could not load your simulations right now.', 'No fue posible cargar sus simulaciones ahora.'))
    setLista((atual) => (pag === 0 ? r.lista : [...atual, ...r.lista]))
    setTemMais(r.temMais); setPagina(pag)
  }
  useEffect(() => { carregarLista(0) }, [empresaId, arquivadas]) // eslint-disable-line react-hooks/exhaustive-deps

  async function explicar(r: ResultadoSimulacao) {
    setExplicando(true)
    const base = r.cenarios.find((c) => c.nome === 'base')
    // Motor de IA (docs/MOTOR-IA.md): retrato da empresa + resultado desta simulação.
    const ia = await perguntarAoAxioma({
      pergunta: L('Explique o resultado desta simulação "E se" para a minha empresa.', 'Explain the result of this "What if" simulation for my company.', 'Explique el resultado de esta simulación "Y si" para mi empresa.'),
      empresaId, tela: 'nexus-simulacoes', lang,
      contextoTela: `Você é José, a inteligência do Axioma Nexus. Explique em no máximo 3 frases curtas o resultado de uma simulação "E se", sem afirmar certeza, terminando com uma ação prática. Choque simulado: ${JSON.stringify(variaveis)}. Lucro mensal atual: ${fBRL(r.lucroAtualMensal)}. Cenário base: lucro mensal ${fBRL(base?.lucroLiquidoMensal ?? 0)}, caixa em ${horizonte} meses ${fBRL(base?.saldoCaixaProjetado ?? 0)}. Adverso: lucro ${fBRL(r.cenarios.find((c) => c.nome === 'adverso')?.lucroLiquidoMensal ?? 0)}.`,
    })
    const texto = ia?.resposta ?? explicacaoPorRegra(r, lang)
    setResultado((atual) => (atual ? { ...atual, explicacao: texto } : atual))
    setExplicando(false)
  }

  function simular() {
    if (!ponto) return
    const r = rodarSimulacao(ponto, variaveis, horizonte)
    setResultado(r)
    setChaveResultado(chaveAtual)
    explicar(r)
  }

  async function salvar() {
    if (!empresaId || !ponto || !resultado || resultadoDesatualizado) return
    setSalvando(true)
    const id = await salvarSimulacao({
      empresaId, id: editandoId ?? undefined, nome: nome.trim() || L('Simulação sem nome', 'Untitled simulation', 'Simulación sin nombre'),
      descricao: null, variaveis, horizonteMeses: horizonte, resultado, ponto,
    })
    setSalvando(false)
    if (!id) { setAviso(L('Não foi possível salvar a simulação. Tente de novo.', 'Could not save the simulation. Try again.', 'No fue posible guardar la simulación. Intente de nuevo.')); return }
    setEditandoId(id); setAviso(null)
    if (arquivadas) setArquivadas(false); else carregarLista(0)
  }

  function carregarNoConstrutor(s: SimulacaoSalva, copia: boolean) {
    setVariaveis({ ...VARIAVEIS_ZERO, ...s.variaveis }); setHorizonte(s.horizonteMeses)
    setNome(copia ? `${s.nome} ${L('(cópia)', '(copy)', '(copia)')}` : s.nome)
    setEditandoId(copia ? null : s.id); setResultado(copia ? null : s.resultado)
    setChaveResultado(JSON.stringify([{ ...VARIAVEIS_ZERO, ...s.variaveis }, s.horizonteMeses]))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function acaoStatus(s: SimulacaoSalva, status: 'completed' | 'archived' | 'deleted') {
    if (!empresaId) return
    if (await mudarStatusSimulacao(empresaId, s.id, status)) {
      setLista((l) => l.filter((x) => x.id !== s.id))
      if (editandoId === s.id && status === 'deleted') { setEditandoId(null); setResultado(null) }
    } else setAviso(L('Não foi possível concluir a ação. Tente de novo.', 'Could not complete the action. Try again.', 'No fue posible completar la acción. Intente de nuevo.'))
  }

  async function alternarFavorita(s: SimulacaoSalva) {
    if (!empresaId) return
    if (await favoritarSimulacao(empresaId, s.id, !s.favorita)) setLista((l) => l.map((x) => (x.id === s.id ? { ...x, favorita: !x.favorita } : x)))
  }

  const deltaBase = (s: SimulacaoSalva) => {
    const b = s.resultado?.cenarios.find((c) => c.nome === 'base')
    return b && s.resultado ? b.lucroLiquidoMensal - s.resultado.lucroAtualMensal : 0
  }
  const avisosSemEfeito: string[] = !ponto ? [] : [
    variaveis.selicPontos !== 0 && ponto.dividaTotal === 0 && L('Você não tem dívida cadastrada — a Selic não afeta seu resultado direto.', 'You have no registered debt — Selic does not affect your result directly.', 'No tiene deuda registrada — la Selic no afecta su resultado directo.'),
    variaveis.selicPontos !== 0 && ponto.dividaTotal > 0 && variaveis.dividaPosFixadaPct === 0 && L('Nenhuma parte da dívida está marcada como pós-fixada — a Selic não muda os juros.', 'No debt is marked as floating-rate — Selic does not change interest.', 'Ninguna deuda está marcada como variable — la Selic no cambia los intereses.'),
    variaveis.dolarPct !== 0 && variaveis.exposicaoCambialPct === 0 && L('Informe "Custo em dólar" para o dólar afetar seu custo.', 'Fill in "Cost in dollars" for the dollar to affect your cost.', 'Complete "Costo en dólares" para que el dólar afecte su costo.'),
    variaveis.petroleoPct !== 0 && variaveis.pesoCombustivelPct === 0 && L('Informe "Combustível/frete no custo" para o petróleo afetar seu custo.', 'Fill in "Fuel/freight in cost" for oil to affect your cost.', 'Complete "Combustible/flete en el costo" para que el petróleo afecte su costo.'),
    variaveis.receitaPct !== 0 && ponto.receitaMensal === 0 && L('Não há receita registrada nos últimos 12 meses — variar a receita não muda nada.', 'No revenue recorded in the last 12 months — changing revenue changes nothing.', 'No hay ingresos en los últimos 12 meses — variar los ingresos no cambia nada.'),
  ].filter((a): a is string => !!a)

  const listaFiltrada = lista.filter((s) =>
    filtro === 'todas' ? true : filtro === 'favoritas' ? s.favorita : filtro === 'risco' ? deltaBase(s) < 0 : filtro === 'oportunidade' ? deltaBase(s) > 0 : s.horizonteMeses === filtro)

  const chip = (ativo: boolean): CSSProperties => temaClaro
    ? { background: ativo ? '#2ecc9b' : 'rgba(16,27,61,0.06)', color: ativo ? '#101b3d' : '#374151', border: `1px solid ${ativo ? '#2ecc9b' : 'rgba(16,27,61,0.12)'}` }
    : { background: ativo ? `${CIANO}25` : 'rgba(255,255,255,0.05)', color: ativo ? CIANO : CINZA, border: `1px solid ${ativo ? `${CIANO}50` : 'rgba(255,255,255,0.08)'}` }

  return (
    <div data-theme={tema} className="nexus-escala" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
      <ModuloLayout
        titulo={L('Minhas Simulações', 'My Simulations', 'Mis Simulaciones')}
        subtitulo={L('E se a economia mudar? Veja o efeito no lucro e no caixa da sua empresa, com os seus números reais.', 'What if the economy shifts? See the effect on your profit and cash, using your real numbers.', '¿Y si cambia la economía? Vea el efecto en su beneficio y caja, con sus números reales.')}
        headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
        botaoExtra={
          <>
            <Link href="/nexus" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={botaoUtil}>
              <ArrowLeft size={16} aria-hidden />{L('Voltar ao Nexus', 'Back to Nexus', 'Volver a Nexus')}
            </Link>
            <ThemeToggle />
          </>
        }
      >
        {carregando ? (
          <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
        ) : !empresaId || !ponto ? (
          <p className="text-sm" style={{ color: TEXTO }}>{L('Nenhuma empresa ativa. Cadastre sua empresa para simular.', 'No active company. Register your company to simulate.', 'Ninguna empresa activa. Registre su empresa para simular.')}</p>
        ) : (
          <div className="space-y-6">
            {aviso && <div className="rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ ...aninhada, color: TEXTO }}>{aviso}</div>}

            {/* PONTO DE PARTIDA */}
            <section>
              <h2 className="text-base font-bold mb-1" style={{ color: TITULO }}>{L('Sua empresa hoje', 'Your company today', 'Su empresa hoy')}</h2>
              <p className="text-xs mb-3" style={{ color: TEXTO, opacity: temaClaro ? 1 : 0.8 }}>{L('Média dos últimos 12 meses, puxada de Receitas, Custos, Dívidas e Fluxo de Caixa.', 'Last 12-month average, from Revenue, Costs, Debt and Cash Flow.', 'Promedio de los últimos 12 meses, de Ingresos, Costos, Deudas y Flujo de Caja.')}</p>
              {!ponto.temDados && <p className="text-xs mb-3 font-semibold" style={{ color: NEG }}>{L('Ainda não há receitas ou custos cadastrados — a simulação vai sair zerada.', 'No revenue or costs registered yet — the simulation will be empty.', 'Aún no hay ingresos o costos registrados — la simulación saldrá vacía.')}</p>}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { l: L('Receita por mês', 'Revenue per month', 'Ingresos por mes'), v: ponto.receitaMensal },
                  { l: L('Custos por mês', 'Costs per month', 'Costos por mes'), v: ponto.custoFixoMensal + ponto.custoVariavelMensal },
                  { l: L('Lucro por mês', 'Profit per month', 'Beneficio por mes'), v: ponto.lucroMensal },
                  { l: L('Caixa disponível', 'Available cash', 'Caja disponible'), v: ponto.caixaDisponivel },
                ].map((k) => (
                  <div key={k.l} className={`relative overflow-hidden rounded-2xl p-4${premium}`} style={caixa}>
<div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
                    <p className="text-xs font-bold mb-1" style={{ color: CINZA }}>{k.l}</p>
                    <p className="text-xl font-black" style={{ color: TITULO }}>{fBRL(k.v)}</p>
                  </div>
                ))}
              </div>
            </section>

            <DivisorNexus />

            {/* CONSTRUTOR "E SE...?" */}
            <section className={`relative overflow-hidden rounded-2xl p-4 sm:p-5${premium}`} style={caixa}>
<div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
              <h2 className="text-base font-bold mb-3" style={{ color: TITULO }}>
                {editandoId ? L('Editando simulação', 'Editing simulation', 'Editando simulación') : L('E se...?', 'What if...?', '¿Y si...?')}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {PRESETS_MACRO.map((p) => (
                  <button key={p.id} onClick={() => { setVariaveis((v) => ({ ...v, ...p.variaveis })); if (!nome) setNome(L3(p.nome)) }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold" style={chip(false)}>
                    {p.emoji} {L3(p.nome)}
                  </button>
                ))}
                <button onClick={() => { setVariaveis(VARIAVEIS_ZERO); setResultado(null); setEditandoId(null); setNome('') }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold" style={chip(false)}>
                  {L('Limpar', 'Clear', 'Limpiar')}
                </button>
              </div>

              {(['choque', 'exposicao'] as const).map((grupo) => (
                <div key={grupo} className="mb-4">
                  <p className="text-xs font-bold mb-2" style={{ color: CINZA }}>
                    {grupo === 'choque' ? L('O que muda na economia', 'What changes in the economy', 'Qué cambia en la economía') : L('Quanto isso pega na sua empresa (você informa)', 'How much it hits your company (you set it)', 'Cuánto afecta a su empresa (usted informa)')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {CAMPOS.filter((c) => c.grupo === grupo).map((c) => (
                      <label key={c.k} className="block">
                        <span className="text-xs font-bold" style={{ color: TITULO }}>{L3(c.nome)}</span>
                        <input type="number" inputMode="decimal" value={variaveis[c.k]}
                          onChange={(e) => setVariaveis((v) => ({ ...v, [c.k]: Number(e.target.value) || 0 }))}
                          className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={campo} />
                        <span className="block text-[10px] mt-1" style={{ color: CINZA }}>{L3(c.dica)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="text-xs font-bold" style={{ color: TITULO }}>{L('Horizonte', 'Horizon', 'Horizonte')}</span>
                  <select value={horizonte} onChange={(e) => setHorizonte(Number(e.target.value))} className="block mt-1 px-3 py-2 rounded-lg text-sm" style={campo}>
                    {HORIZONTES.map((h) => <option key={h} value={h}>{h / 12} {h === 12 ? L('ano', 'year', 'año') : L('anos', 'years', 'años')}</option>)}
                  </select>
                </label>
                <label className="block flex-1 min-w-[200px]">
                  <span className="text-xs font-bold" style={{ color: TITULO }}>{L('Nome da simulação', 'Simulation name', 'Nombre de la simulación')}</span>
                  <input value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={campo}
                    placeholder={L('Ex.: Dólar a R$ 6 com 30% do custo importado', 'E.g. Dollar at R$ 6 with 30% imported cost', 'Ej.: Dólar a R$ 6 con 30% del costo importado')} />
                </label>
                <button onClick={simular} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={VERDE_SOLIDO}>
                  <Play size={15} aria-hidden />{L('Simular', 'Simulate', 'Simular')}
                </button>
              </div>
            </section>

            {/* RESULTADO */}
            {resultado && (
              <section className={`relative overflow-hidden rounded-2xl p-4 sm:p-5${premium}`} style={caixa}>
<div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h2 className="text-base font-bold" style={{ color: TITULO }}>{L('Resultado', 'Result', 'Resultado')}</h2>
                  {resultadoDesatualizado && <span className="text-xs font-semibold" style={{ color: NEG }}>{L('Você mudou os números — clique em Simular para atualizar antes de salvar.', 'You changed the numbers — click Simulate to update before saving.', 'Cambió los números — haga clic en Simular para actualizar antes de guardar.')}</span>}
                  <button onClick={salvar} disabled={salvando || resultadoDesatualizado} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60" style={VERDE_SOLIDO}>
                    <Save size={15} aria-hidden />{salvando ? L('Salvando...', 'Saving...', 'Guardando...') : editandoId ? L('Salvar alterações', 'Save changes', 'Guardar cambios') : L('Salvar simulação', 'Save simulation', 'Guardar simulación')}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {resultado.cenarios.map((c) => {
                    const delta = c.lucroLiquidoMensal - resultado.lucroAtualMensal
                    return (
                      <div key={c.nome} className="rounded-xl p-3" style={aninhada}>
                        <p className="text-xs font-bold mb-1" style={{ color: c.nome === 'base' ? (temaClaro ? '#16a97d' : CIANO) : CINZA }}>{L3(NOME_CENARIO[c.nome])}</p>
                        <p className="text-[11px]" style={{ color: CINZA }}>{L('Lucro por mês', 'Profit per month', 'Beneficio por mes')}</p>
                        <p className="text-lg font-black" style={{ color: TITULO }}>{fBRL(c.lucroLiquidoMensal)}</p>
                        <p className="text-xs font-bold" style={{ color: Math.round(delta) === 0 ? CINZA : delta > 0 ? POS : NEG }}>
                          {Math.round(delta) === 0 ? L('= sem mudança', '= no change', '= sin cambio') : `${delta > 0 ? '▲' : '▼'} ${fBRL(Math.abs(delta))} ${L('vs hoje', 'vs today', 'vs hoy')}`}
                        </p>
                        <p className="text-[11px] mt-2" style={{ color: CINZA }}>{L('Caixa em', 'Cash in', 'Caja en')} {horizonte / 12} {horizonte === 12 ? L('ano', 'year', 'año') : L('anos', 'years', 'años')}</p>
                        <p className="text-sm font-bold" style={{ color: c.saldoCaixaProjetado >= 0 ? TITULO : NEG }}>{fBRL(c.saldoCaixaProjetado)}</p>
                        {c.runwayMeses !== null && (
                          <p className="text-[11px] mt-1 font-semibold" style={{ color: NEG }}>{L(`Caixa dura ~${c.runwayMeses} meses`, `Cash lasts ~${c.runwayMeses} months`, `La caja dura ~${c.runwayMeses} meses`)}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
                {avisosSemEfeito.length > 0 && (
                  <div className="rounded-xl p-3 mb-3" style={{ ...aninhada, borderLeft: `3px solid ${temaClaro ? '#b45309' : '#2ecc9b'}` }}>
                    <p className="text-xs font-bold mb-1" style={{ color: TITULO }}>{L('Por que alguma parte não mudou?', 'Why did some part not change?', '¿Por qué alguna parte no cambió?')}</p>
                    <ul className="list-disc pl-4 space-y-0.5">{avisosSemEfeito.map((a) => <li key={a} className="text-xs" style={{ color: TEXTO }}>{a}</li>)}</ul>
                  </div>
                )}
                <div className="rounded-xl p-3" style={aninhada}>
                  <p className="text-xs font-bold mb-1" style={{ color: CINZA }}>{L('O José explica', 'José explains', 'José explica')}</p>
                  <p className="text-sm leading-relaxed" style={{ color: TEXTO }}>
                    {explicando ? L('José lendo os números...', 'José reading the numbers...', 'José leyendo los números...') : resultado.explicacao || explicacaoPorRegra(resultado, lang)}
                  </p>
                </div>
              </section>
            )}

            <DivisorNexus />

            {/* MINHAS SIMULAÇÕES */}
            <section id="salvas" className="scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-base font-bold" style={{ color: TITULO }}>{L('Simulações salvas', 'Saved simulations', 'Simulaciones guardadas')}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setArquivadas(false)} className="px-3 py-1.5 rounded-full text-xs font-bold" style={chip(!arquivadas)}>{L('Ativas', 'Active', 'Activas')}</button>
                  <button onClick={() => setArquivadas(true)} className="px-3 py-1.5 rounded-full text-xs font-bold" style={chip(arquivadas)}>{L('Arquivadas', 'Archived', 'Archivadas')}</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {([['todas', L('Todas', 'All', 'Todas')], ['favoritas', L('Favoritas', 'Favorites', 'Favoritas')], ['risco', L('Risco', 'Risk', 'Riesgo')], ['oportunidade', L('Oportunidade', 'Opportunity', 'Oportunidad')]] as const).map(([k, rot]) => (
                  <button key={k} onClick={() => setFiltro(k)} className="px-3 py-1.5 rounded-full text-xs font-bold" style={chip(filtro === k)}>{rot}</button>
                ))}
                {HORIZONTES.map((h) => (
                  <button key={h} onClick={() => setFiltro(h)} className="px-3 py-1.5 rounded-full text-xs font-bold" style={chip(filtro === h)}>{h / 12} {h === 12 ? L('ano', 'year', 'año') : L('anos', 'years', 'años')}</button>
                ))}
              </div>

              {listaFiltrada.length === 0 ? (
                <p className="text-sm" style={{ color: TEXTO }}>
                  {arquivadas ? L('Nenhuma simulação arquivada.', 'No archived simulations.', 'Ninguna simulación archivada.') : L('Nenhuma simulação salva ainda. Monte um "E se...?" acima e clique em Salvar.', 'No saved simulations yet. Build a "What if...?" above and click Save.', 'Aún no hay simulaciones guardadas. Arme un "¿Y si...?" arriba y haga clic en Guardar.')}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {listaFiltrada.map((s) => {
                    const d = deltaBase(s)
                    const icone = 'p-1.5 rounded-lg transition-colors ' + (temaClaro ? 'hover:bg-black/5' : 'hover:bg-white/10')
                    return (
                      <div key={s.id} className={`relative overflow-hidden rounded-2xl p-4 flex flex-col${premium}`} style={caixa}>
<div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: TITULO }}>{s.nome}</p>
                          <button onClick={() => alternarFavorita(s)} aria-label={L('Favoritar', 'Favorite', 'Favorito')} className={icone}>
                            <Star size={15} fill={s.favorita ? (temaClaro ? '#f5a623' : '#2ecc9b') : 'none'} style={{ color: s.favorita ? (temaClaro ? '#f5a623' : '#2ecc9b') : CINZA }} />
                          </button>
                        </div>
                        <p className="text-xs font-bold" style={{ color: Math.round(d) === 0 ? CINZA : d > 0 ? POS : NEG }}>
                          {Math.round(d) === 0 ? L('= sem mudança no cenário base', '= no change in base case', '= sin cambio en escenario base') : `${d > 0 ? '▲' : '▼'} ${fBRL(Math.abs(d))}/${L('mês no cenário base', 'mo in base case', 'mes en escenario base')}`}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: CINZA }}>
                          {s.horizonteMeses / 12} {s.horizonteMeses === 12 ? L('ano', 'year', 'año') : L('anos', 'years', 'años')} · {new Date(s.atualizadoEm).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR')}
                        </p>
                        <div className="flex gap-1 mt-auto pt-3">
                          <button onClick={() => carregarNoConstrutor(s, false)} aria-label={L('Editar', 'Edit', 'Editar')} title={L('Editar', 'Edit', 'Editar')} className={icone}><Pencil size={15} style={{ color: TITULO }} /></button>
                          <button onClick={() => carregarNoConstrutor(s, true)} aria-label={L('Duplicar', 'Duplicate', 'Duplicar')} title={L('Duplicar', 'Duplicate', 'Duplicar')} className={icone}><Copy size={15} style={{ color: TITULO }} /></button>
                          {arquivadas ? (
                            <button onClick={() => acaoStatus(s, 'completed')} aria-label={L('Desarquivar', 'Unarchive', 'Desarchivar')} title={L('Desarquivar', 'Unarchive', 'Desarchivar')} className={icone}><ArchiveRestore size={15} style={{ color: TITULO }} /></button>
                          ) : (
                            <button onClick={() => acaoStatus(s, 'archived')} aria-label={L('Arquivar', 'Archive', 'Archivar')} title={L('Arquivar', 'Archive', 'Archivar')} className={icone}><Archive size={15} style={{ color: TITULO }} /></button>
                          )}
                          <button onClick={() => setConfirmarExclusao(s)} aria-label={L('Excluir', 'Delete', 'Eliminar')} title={L('Excluir', 'Delete', 'Eliminar')} className={icone + ' ml-auto'}><Trash2 size={15} style={{ color: NEG }} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {temMais && (
                <button onClick={() => carregarLista(pagina + 1)} className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg" style={botaoUtil}>
                  {L('Ver mais', 'Show more', 'Ver más')}
                </button>
              )}
              {!arquivadas && <p className="text-[10px] mt-3" style={{ color: CINZA }}>{L('Simulações sem uso há 90 dias (e não favoritas) vão sozinhas para Arquivadas. Nada é apagado.', 'Simulations unused for 90 days (and not favorited) move to Archived automatically. Nothing is deleted.', 'Las simulaciones sin uso por 90 días (y no favoritas) pasan solas a Archivadas. Nada se borra.')}</p>}
            </section>
          </div>
        )}
      </ModuloLayout>

      {confirmarExclusao && naRaiz(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={() => setConfirmarExclusao(null)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl p-5" style={{ background: MODAL_BG, border: `1px solid ${NEG}60` }} onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-bold mb-2" style={{ color: TITULO }}>{L('Excluir esta simulação?', 'Delete this simulation?', '¿Eliminar esta simulación?')}</p>
            <p className="text-sm mb-4" style={{ color: TEXTO }}>“{confirmarExclusao.nome}” {L('some da sua lista.', 'will disappear from your list.', 'desaparece de su lista.')}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="px-4 py-2 rounded-xl text-sm font-bold" style={chip(false)}>{L('Cancelar', 'Cancel', 'Cancelar')}</button>
              <button onClick={() => { const s = confirmarExclusao; setConfirmarExclusao(null); acaoStatus(s, 'deleted') }} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: NEG, color: '#fff' }}>
                {L('Excluir', 'Delete', 'Eliminar')}
              </button>
            </div>
          </div>
        </div>,
      )}
    </div>
  )
}
