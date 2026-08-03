'use client'
import { useState, useEffect, ReactNode } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva, carregarEmpresaPorId } from '../../../../lib/empresaHelpers'
import { createBrowserClient } from '@supabase/ssr'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { ArrowRight } from 'lucide-react'
import {
  tetoProporcionalMEI, faturamentoAnoMEI, percentualLimite, limiteRestante, semaforoTeto,
  projecaoTetoDetalhada, fluxoMesMEI, montarCofre, scoreMEI, dasMensalPorCategoria,
  carregarObrigacoesAno, competenciasDASDoAno, calcularDividaDASAcumulada, faseRiscoDAS, diasParaDAS,
  fracaoDASSobrePreco, fracaoIRPFExposicao, custoProprioRateado, detectarTrabalhoDeGraca,
  type StatusObrigacao, type ContaPagarMEI, type FaseRiscoDAS, type DetectorTrabalhoGratisResultado,
} from '../../../../lib/meiHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Paleta executiva desta tela — jade/bronze, nunca laranja (pedido explícito).
const JADE = '#047857'
const BRONZE = '#065f46'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AZUL = '#6ab0ff'
const AMBAR = '#f59e0b'
const FONTE_EXEC = "'Georgia','Times New Roman',serif"

const MESES: Record<'pt' | 'en' | 'es', string[]> = {
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
}

export default function CockpitMEI() {
  const { idioma } = useLanguage()
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const [loading, setLoading] = useState(true)
  const [nomeEmpresa, setNomeEmpresa] = useState<string | null>(null)
  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitas, setReceitas] = useState<any[]>([])
  const [custosVariaveis, setCustosVariaveis] = useState<any[]>([])
  const [custosFixos, setCustosFixos] = useState<any[]>([])
  const [contasPagar, setContasPagar] = useState<ContaPagarMEI[]>([])
  const [obrigacoes, setObrigacoes] = useState<any[]>([])
  const [precoSalvo, setPrecoSalvo] = useState<any>(null)

  const txt = {
    titulo: { pt: 'MEI — Cockpit', en: 'MEI — Cockpit', es: 'MEI — Cockpit' },
    subtitulo: { pt: 'O retrato consolidado do seu MEI, num só lugar', en: 'The consolidated picture of your MEI, in one place', es: 'El retrato consolidado de su MEI, en un solo lugar' },
    saudacao: { pt: 'Olá, {nome} — aqui está a foto de hoje.', en: 'Hello, {nome} — here is today\'s snapshot.', es: 'Hola, {nome} — aquí está la foto de hoy.' },
    empresaFallback: { pt: 'Sua empresa', en: 'Your company', es: 'Su empresa' },
    scoreLabel: { pt: 'Score de Saúde do MEI', en: 'MEI Health Score', es: 'Score de Salud del MEI' },
    verDetalhe: { pt: 'Ver detalhe', en: 'See detail', es: 'Ver detalle' },

    card1Titulo: { pt: 'Teto do MEI', en: 'MEI Cap', es: 'Techo del MEI' },
    card1DoTeto: { pt: 'do teto', en: 'of the cap', es: 'del techo' },
    card1Restam: { pt: 'Restam', en: 'Remaining', es: 'Restan' },
    card1Estoura: { pt: 'No ritmo atual, estoura em', en: 'At the current pace, breaks the cap in', es: 'Al ritmo actual, supera el techo en' },
    card1SemProjecao: { pt: 'Sem risco de estouro neste ritmo', en: 'No risk of breaking the cap at this pace', es: 'Sin riesgo de superar el techo a este ritmo' },

    card2Titulo: { pt: 'O que é seu de verdade', en: 'What\'s really yours', es: 'Lo que es realmente suyo' },
    card2Sub: { pt: 'Pró-labore seguro este mês, depois de DAS, IRPF, contas e reserva', en: 'Safe pro-labore this month, after DAS, income tax, bills and reserve', es: 'Pro-labore seguro este mes, después de DAS, IRPF, cuentas y reserva' },

    card3Titulo: { pt: 'DAS & Obrigações', en: 'DAS & Obligations', es: 'DAS & Obligaciones' },
    card3EmDia: { pt: 'Em dia', en: 'Up to date', es: 'Al día' },
    card3Atrasado: { pt: 'Atrasado', en: 'Overdue', es: 'Atrasado' },
    card3DiasVencer: { pt: 'dias até vencer', en: 'days until due', es: 'días hasta el vencimiento' },
    card3DiasAtraso: { pt: 'dias em atraso', en: 'days overdue', es: 'días de atraso' },
    faseMultaTeto: { pt: 'Multa no teto (20%)', en: 'Fine at cap (20%)', es: 'Multa al tope (20%)' },
    faseInapto: { pt: 'Risco de CNPJ Inapto', en: 'Risk of inactive CNPJ', es: 'Riesgo de CNPJ Inapto' },
    faseDividaAtiva: { pt: 'Dívida Ativa da União', en: 'Federal Active Debt', es: 'Deuda Activa de la Unión' },

    card4Titulo: { pt: 'Você está trabalhando de graça?', en: 'Are you working for free?', es: '¿Está trabajando gratis?' },
    card4Prejuizo: { pt: 'Prejuízo de', en: 'Loss of', es: 'Pérdida de' },
    card4PorUnidade: { pt: 'por unidade cobrada', en: 'per unit charged', es: 'por unidad cobrada' },
    card4Apertada: { pt: 'Margem apertada:', en: 'Tight margin:', es: 'Margen ajustado:' },
    card4Saudavel: { pt: 'Margem saudável:', en: 'Healthy margin:', es: 'Margen saludable:' },
    card4Vazio: { pt: 'Você ainda não informou quanto cobra hoje na Precificação MEI.', en: 'You haven\'t told us what you charge today in MEI Pricing yet.', es: 'Aún no informó cuánto cobra hoy en Precios MEI.' },
    card4CtaVazio: { pt: 'Complete em Precificação MEI', en: 'Complete in MEI Pricing', es: 'Complete en Precios MEI' },

    kpiFaturamento: { pt: 'Faturamento acumulado', en: 'Accumulated revenue', es: 'Facturación acumulada' },
    kpiProjecao: { pt: 'Projeção anual', en: 'Annual projection', es: 'Proyección anual' },
    kpiReserva: { pt: 'Sobra do mês vs. o que precisa guardar', en: 'This month\'s leftover vs. what you need to set aside', es: 'Sobra del mes vs. lo que necesita guardar' },
  }
  const t = (key: keyof typeof txt) => txt[key][lang]
  const fmt = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const empresaId = await obterEmpresaAtiva()
    if (!empresaId) { setLoading(false); return }

    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    const inicioMes = new Date(anoAtual, hoje.getMonth(), 1).toISOString().slice(0, 10)
    const fimMes = new Date(anoAtual, hoje.getMonth() + 1, 0).toISOString().slice(0, 10)

    const [empresa, meiRes, recRes, cvRes, cfRes, cpRes, obrigacoesRows, precoRes] = await Promise.all([
      carregarEmpresaPorId(empresaId),
      supabase.from('mei_dados').select('*').eq('empresa_id', empresaId).maybeSingle(),
      supabase.from('receitas').select('valor, data, considera_teto_mei').eq('empresa_id', empresaId),
      supabase.from('custos_variaveis').select('valor, data').eq('empresa_id', empresaId),
      supabase.from('custos_fixos').select('valor_mensal').eq('empresa_id', empresaId),
      supabase.from('contas_pagar').select('valor_total, valor_pago').eq('empresa_id', empresaId).neq('status', 'pago').gte('data_vencimento', inicioMes).lte('data_vencimento', fimMes),
      carregarObrigacoesAno(anoAtual),
      supabase.from('mei_precos_salvos').select('*').eq('empresa_id', empresaId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    setNomeEmpresa(empresa?.nome_fantasia || empresa?.razao_social || null)
    setMeiDados(meiRes.data || null)
    setReceitas(recRes.data || [])
    setCustosVariaveis(cvRes.data || [])
    setCustosFixos(cfRes.data || [])
    setContasPagar((cpRes.data || []) as ContaPagarMEI[])
    setObrigacoes(obrigacoesRows)
    setPrecoSalvo(precoRes.data || null)
    setLoading(false)
  }

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth()

  // ---- Card 1: Teto do MEI ----
  const tetoInfo = tetoProporcionalMEI(meiDados?.data_abertura, anoAtual)
  const teto = tetoInfo.teto
  const faturamentoAnual = faturamentoAnoMEI(receitas, anoAtual)
  const percentualLimiteAtual = percentualLimite(faturamentoAnual, teto)
  const restanteLimite = limiteRestante(faturamentoAnual, teto)
  const semaforo = semaforoTeto(percentualLimiteAtual)
  const corTeto = semaforo === 'vermelho' ? VERMELHO : semaforo === 'amarelo' ? AMBAR : VERDE
  const projecao = projecaoTetoDetalhada(receitas, anoAtual, mesAtual, teto, 6)
  const mesEstouroLabel = projecao.mesIndexEstouro !== null ? MESES[lang][projecao.mesIndexEstouro] : null

  // ---- Card 2: Cofre (o que é seu de verdade) ----
  const receitasMes = receitas.filter((r) => { const d = new Date(r.data); return d.getFullYear() === anoAtual && d.getMonth() === mesAtual })
  const custosVarMes = custosVariaveis.filter((c) => { if (!c.data) return false; const d = new Date(c.data); return d.getFullYear() === anoAtual && d.getMonth() === mesAtual })
  const fluxo = fluxoMesMEI(receitasMes, custosVarMes, custosFixos)
  const dasMensalAtual = meiDados?.das_valor || dasMensalPorCategoria(meiDados?.categoria_mei)
  const mediaMensal6m = projecao.mediaMensal
  const cofre = montarCofre({
    sobraMes: fluxo.sobra,
    receitaMensalMedia: mediaMensal6m,
    faturamentoAnual,
    categoriaMei: meiDados?.categoria_mei || 'Serviços',
    dasValor: dasMensalAtual,
    contasPagarAbertas: contasPagar,
    reservaEmergenciaPct: meiDados?.reserva_emergencia_pct ?? null,
  })

  // ---- Health Score (mesmo cálculo do Painel MEI) ----
  const receitaMesAtual = receitasMes.reduce((s, r) => s + (r.valor || 0), 0)
  const mesAnteriorData = new Date(anoAtual, mesAtual - 1, 1)
  const receitaMesAnterior = receitas.filter((r) => { const d = new Date(r.data); return d.getFullYear() === mesAnteriorData.getFullYear() && d.getMonth() === mesAnteriorData.getMonth() }).reduce((s, r) => s + (r.valor || 0), 0)
  const crescimentoMoM = receitaMesAnterior > 0 ? ((receitaMesAtual - receitaMesAnterior) / receitaMesAnterior) * 100 : 0
  const competenciaAnual = String(anoAtual)
  const statusDasn: StatusObrigacao = obrigacoes.find((o) => o.tipo === 'DASN' && o.competencia === competenciaAnual)?.status || 'Pendente'
  const statusIrpf: StatusObrigacao = obrigacoes.find((o) => o.tipo === 'IRPF' && o.competencia === competenciaAnual)?.status || 'Não obrigatório'
  const score = scoreMEI({
    percentualTeto: percentualLimiteAtual,
    statusDasn, statusIrpf,
    fluxoMensal: fluxo.sobra,
    receitaMensal: receitaMesAtual,
    crescimentoMoM,
  })

  // ---- Card 3: DAS & Obrigações (mesma detecção por data da tela DAS) ----
  const diaVencimentoDas = meiDados?.dia_vencimento_das || 20
  const competenciasAno = competenciasDASDoAno(obrigacoes, anoAtual, diaVencimentoDas, meiDados?.data_abertura, hoje)
  const divida = calcularDividaDASAcumulada(competenciasAno, dasMensalAtual, 10.75, hoje)
  const faseAtual: FaseRiscoDAS = faseRiscoDAS(divida.piorDiasAtraso)
  const diasAteVencimentoDas = diasParaDAS(hoje, diaVencimentoDas)
  const corDas = faseAtual === 'em_dia' ? VERDE : faseAtual === 'atrasado' ? AMBAR : VERMELHO
  const faseLabel = faseAtual === 'multa_teto' ? t('faseMultaTeto') : faseAtual === 'inapto' ? t('faseInapto') : faseAtual === 'divida_ativa' ? t('faseDividaAtiva') : null

  // ---- Card 4: Trabalhando de graça — mesma estratégia da tela Precificação MEI
  // (recalcula ao vivo com DAS/categoria/pró-labore ATUAIS; só os inputs de custo e
  // o preço cobrado vêm congelados do último preço salvo), pra nunca divergir do
  // veredito mostrado lá pro mesmo registro. ----
  const dadosPreco = precoSalvo?.dados || null
  const temPrecoSalvo = !!(dadosPreco && parseFloat(dadosPreco.precoCobradoHoje))
  let detectorGraca: DetectorTrabalhoGratisResultado | null = null
  if (temPrecoSalvo) {
    const modo = precoSalvo.modo as 'hora' | 'projeto' | 'produto'
    const custoFixoNum = parseFloat(dadosPreco.custoFixoMensal) || 0
    const custoVarNum = parseFloat(dadosPreco.custoVariavelMensal) || 0
    const horasNum = parseFloat(dadosPreco.horasTrabalhadasMes) || 0
    const unidadesNum = parseFloat(dadosPreco.unidadesVendidasMes) || 0
    const proLaboreDesejado = meiDados?.pro_labore_desejado ?? null
    const custoPorHoraOperacional = horasNum > 0 ? (custoFixoNum + custoVarNum) / horasNum + custoProprioRateado(proLaboreDesejado, horasNum) : 0
    const custoPorUnidadeOperacional = unidadesNum > 0 ? (custoFixoNum + custoVarNum) / unidadesNum + custoProprioRateado(proLaboreDesejado, unidadesNum) : 0
    let custoBaseAtual = 0
    if (modo === 'projeto') {
      const horasProjeto = parseFloat(dadosPreco.horasEstimadasProjeto) || 0
      const materiais = parseFloat(dadosPreco.materiaisProjeto) || 0
      custoBaseAtual = custoPorHoraOperacional * horasProjeto + materiais
    } else if (modo === 'produto') {
      const custoUnit = parseFloat(dadosPreco.custoUnitarioProduto) || 0
      custoBaseAtual = custoUnit + custoPorUnidadeOperacional
    } else {
      custoBaseAtual = custoPorHoraOperacional
    }
    const inicio12m = new Date(hoje); inicio12m.setMonth(inicio12m.getMonth() - 11)
    const receitaMensalMedia12m = receitas
      .filter((r) => { const d = new Date(r.data); return d >= inicio12m && d <= hoje })
      .reduce((s, r) => s + (r.valor || 0), 0) / 12
    const receitaReferenciaDAS = receitaMensalMedia12m > 0 ? receitaMensalMedia12m : teto / 12
    const fracaoDASAtual = fracaoDASSobrePreco(dasMensalAtual, receitaReferenciaDAS)
    const fracaoIRPFAtual = fracaoIRPFExposicao(meiDados?.categoria_mei)
    detectorGraca = detectarTrabalhoDeGraca({
      precoCobradoHoje: parseFloat(dadosPreco.precoCobradoHoje) || 0,
      custoBase: custoBaseAtual,
      fracaoDAS: fracaoDASAtual,
      fracaoIRPF: fracaoIRPFAtual,
    })
  }
  const corGraca = !detectorGraca ? AZUL : detectorGraca.situacao === 'prejuizo' ? VERMELHO : detectorGraca.situacao === 'apertada' ? AMBAR : VERDE

  // ---- KPIs de apoio ----
  const reservaNecessaria = cofre.das + cofre.irpfReserva
  const corReserva = fluxo.sobra >= reservaNecessaria ? VERDE : VERMELHO

  const saudacao = t('saudacao').replace('{nome}', nomeEmpresa || t('empresaFallback'))

  const CardVeredito = ({ cor, titulo, children, href }: { cor: string; titulo: string; children: ReactNode; href: string }) => (
    <CanvasBox cor={cor}>
      <p className="text-sm font-semibold mb-3" style={{ color: '#c8d8f0', fontFamily: FONTE_EXEC }}>{titulo}</p>
      <div className="mb-4">{children}</div>
      <a href={href} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: cor, textDecoration: 'none' }}>
        {t('verDetalhe')} <ArrowRight size={12} />
      </a>
    </CanvasBox>
  )

  if (loading) {
    return (
      <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')}>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${JADE} transparent transparent transparent` }} />
        </div>
      </ModuloLayout>
    )
  }

  return (
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')}>
      <div className="space-y-4">

        {/* Saudação + Health Score */}
        <CanvasBox cor={JADE}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-base md:text-lg font-semibold text-center md:text-left" style={{ color: '#c8d8f0', fontFamily: FONTE_EXEC }}>{saudacao}</p>
            <div className="text-center md:text-right flex-shrink-0">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{t('scoreLabel')}</p>
              <div className="flex items-baseline gap-2 justify-center md:justify-end">
                <span className="text-3xl font-black" style={{ color: score.cor, fontFamily: FONTE_EXEC }}>{score.score}</span>
                <span className="text-base" style={{ color: '#5a7a9a' }}>/ 1000</span>
              </div>
              <p className="text-sm font-bold" style={{ color: score.cor }}>{score.nivel}</p>
            </div>
          </div>
        </CanvasBox>

        {/* 4 cards de veredito */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <CardVeredito cor={corTeto} titulo={t('card1Titulo')} href="/mei/faturamento">
            <p className="text-2xl font-black mb-1" style={{ color: corTeto, fontFamily: FONTE_EXEC }}>{percentualLimiteAtual.toFixed(1)}% <span className="text-sm font-semibold" style={{ color: '#5a7a9a' }}>{t('card1DoTeto')}</span></p>
            <p className="text-xs" style={{ color: '#c8d8f0' }}>{t('card1Restam')}: <strong>{fmt(restanteLimite)}</strong></p>
            <p className="text-xs mt-1" style={{ color: '#5a7a9a' }}>
              {mesEstouroLabel ? <>{t('card1Estoura')} <strong style={{ color: corTeto }}>{mesEstouroLabel}</strong></> : t('card1SemProjecao')}
            </p>
          </CardVeredito>

          <CardVeredito cor={cofre.proLaboreSeguro >= 0 ? VERDE : VERMELHO} titulo={t('card2Titulo')} href="/mei">
            <p className="text-2xl font-black mb-1" style={{ color: cofre.proLaboreSeguro >= 0 ? VERDE : VERMELHO, fontFamily: FONTE_EXEC }}>{fmt(cofre.proLaboreSeguro)}</p>
            <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('card2Sub')}</p>
          </CardVeredito>

          <CardVeredito cor={corDas} titulo={t('card3Titulo')} href="/mei/das">
            <p className="text-2xl font-black mb-1" style={{ color: corDas, fontFamily: FONTE_EXEC }}>
              {faseAtual === 'em_dia' ? t('card3EmDia') : t('card3Atrasado')}
            </p>
            <p className="text-xs" style={{ color: '#c8d8f0' }}>
              {faseAtual === 'em_dia'
                ? <>{diasAteVencimentoDas} {t('card3DiasVencer')}</>
                : <>{divida.piorDiasAtraso} {t('card3DiasAtraso')}</>}
            </p>
            {faseLabel && <p className="text-xs mt-1 font-semibold" style={{ color: VERMELHO }}>{faseLabel}</p>}
          </CardVeredito>

          <CardVeredito cor={corGraca} titulo={t('card4Titulo')} href="/mei/precificacao">
            {!detectorGraca ? (
              <>
                <p className="text-xs mb-2" style={{ color: '#5a7a9a' }}>{t('card4Vazio')}</p>
                <p className="text-xs font-semibold" style={{ color: AZUL }}>{t('card4CtaVazio')}</p>
              </>
            ) : detectorGraca.situacao === 'prejuizo' ? (
              <>
                <p className="text-2xl font-black mb-1" style={{ color: VERMELHO, fontFamily: FONTE_EXEC }}>{fmt(detectorGraca.prejuizoPorUnidade)}</p>
                <p className="text-xs" style={{ color: '#c8d8f0' }}>{t('card4Prejuizo')} {fmt(detectorGraca.prejuizoPorUnidade)} {t('card4PorUnidade')}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black mb-1" style={{ color: corGraca, fontFamily: FONTE_EXEC }}>{detectorGraca.margemRealPct.toFixed(1)}%</p>
                <p className="text-xs" style={{ color: '#c8d8f0' }}>{detectorGraca.situacao === 'apertada' ? t('card4Apertada') : t('card4Saudavel')}</p>
              </>
            )}
          </CardVeredito>

        </div>

        {/* Faixa de KPIs de apoio */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CanvasBox cor={BRONZE}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{t('kpiFaturamento')}</p>
            <p className="text-lg font-black" style={{ color: BRONZE, fontFamily: FONTE_EXEC }}>{fmt(faturamentoAnual)}</p>
          </CanvasBox>
          <CanvasBox cor={BRONZE}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{t('kpiProjecao')}</p>
            <p className="text-lg font-black" style={{ color: BRONZE, fontFamily: FONTE_EXEC }}>{fmt(projecao.projecaoAnual)}</p>
          </CanvasBox>
          <CanvasBox cor={corReserva}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{t('kpiReserva')}</p>
            <p className="text-lg font-black" style={{ color: corReserva, fontFamily: FONTE_EXEC }}>{fmt(fluxo.sobra)} / {fmt(reservaNecessaria)}</p>
          </CanvasBox>
        </div>

      </div>
    </ModuloLayout>
  )
}
