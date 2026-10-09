'use client'
// 🦅 PAINEL DAS E OBRIGAÇÕES — Rodada 2 (2026-10-09)
// Tela do motor canônico (lib/meiObrigacoesMotor.ts): 12 meses por ano, pago × falta ×
// vencido × estimativa, registrar/corrigir/estornar pagamento, planejamento e cenários.
// Nenhuma conta é refeita aqui: totais vêm de mei_resumo_obrigacoes e dos meses do banco.
// Cenário mexe SÓ nas estimativas e nunca grava dado real (vai pra tabela simulacoes).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import * as Sentry from '@sentry/nextjs'
import { Pencil, Trash2, Copy, Eye, CalendarClock, Info } from 'lucide-react'
import { CanvasBox } from '../CanvasBox'
import Modal from '../Modal'
import { useConfirmarExclusao, EFEITO } from '../ConfirmarExclusao'
import { hojeISO } from '../../lib/datas'
import { calcularPenalidadeDASAtraso } from '../../lib/meiHelpers'
import { obterConfigTesouraria, obterPosicaoCaixa } from '../../lib/tesourariaHelpers'
import {
  gerarPeriodosDAS, lerCalendarioDAS, resumoObrigacoes, registrarPagamentoDAS, estornarPagamentoDAS,
  garantirContasDoCalendario, completarRastrosPendentes, type MesDAS, type ResumoAno, type MetodoPagamento, type PagamentoDAS,
} from '../../lib/meiObrigacoesMotor'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

type Lang = 'pt' | 'en' | 'es'
type Cores = { VERDE: string; VERMELHO: string; OURO: string; AMBAR: string; NEUTRO: string; CAMPO_BG: string; TEXTO_SEC: string; NESTED_BORDA: string }
type Cenario = 'base' | 'conservador' | 'estresse' | 'personalizado'
type Simulacao = { id: string; nome: string; created_at: string; parametros: { modulo: string; ano: number; cenario: Cenario; pct: number; regras: string[] }; resultado_projetado: { base: number; cenario: number; diferenca: number } }

const MENTA = '#0f7a5a'   // botão: verde-menta escuro
const NAVY = '#101b3d'    // botão: azul-marinho escuro
const PCT_CENARIO: Record<Exclude<Cenario, 'personalizado'>, number> = { base: 0, conservador: 5, estresse: 10 }
const r2 = (v: number) => Math.round(v * 100) / 100

export default function PainelObrigacoesDAS({ empresaId, lang, temaClaro, cores, cartaoTema, selicAnual, onCalendario, showToast }: {
  empresaId: string | null; lang: Lang; temaClaro: boolean; cores: Cores
  cartaoTema: { fundo?: string; premium3d: boolean }; selicAnual: number
  onCalendario?: (meses: MesDAS[], ano: number) => void
  showToast: (msg: string, tipo?: 'erro' | 'ok') => void
}) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const local = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const fmt = (v: number) => v.toLocaleString(local, { style: 'currency', currency: 'BRL' })
  const dataBR = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString(local)
  const { VERDE, VERMELHO, OURO, AMBAR, NEUTRO, CAMPO_BG, TEXTO_SEC, NESTED_BORDA } = cores
  const NESTED_BG = temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(255,255,255,0.03)' // caixa aninhada: bege no Claro
  // Cor explícita: as janelas abrem fora do <div data-theme> da página (portal) e a variável
  // de tema voltava pro texto claro do Escuro — no Claro o texto sumia no fundo creme.
  const TEXTO = temaClaro ? '#101b3d' : '#e5edf7'
  const mesAno = (iso: string) => { const t = new Date(iso + 'T00:00:00').toLocaleDateString(local, { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1) }
  const hoje = hojeISO()
  const anoHoje = Number(hoje.slice(0, 4))
  const anos = [anoHoje - 1, anoHoje, anoHoje + 1, anoHoje + 2]

  const [ano, setAno] = useState(anoHoje)
  const [meses, setMeses] = useState<MesDAS[]>([])
  const [resumo, setResumo] = useState<ResumoAno | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [falha, setFalha] = useState(false)
  const [caixaLivre, setCaixaLivre] = useState<number | null>(null)
  const { confirmar, janelaConfirmacao } = useConfirmarExclusao(temaClaro)

  // ------------------------------------------------------------ carregar
  const carregar = useCallback(async (anoSel: number) => {
    if (!empresaId) { setCarregando(false); return }
    setCarregando(true); setFalha(false)
    const g = await gerarPeriodosDAS(empresaId, anoSel)          // idempotente: trocar de ano/recarregar não duplica
    const [cal, res] = await Promise.all([lerCalendarioDAS(empresaId, anoSel, hoje), resumoObrigacoes(empresaId, anoSel)])
    if (g.erro || cal.erro || res.erro) setFalha(true)
    setMeses(cal.data); setResumo(res.data ?? null); setCarregando(false)
    onCalendario?.(cal.data, anoSel)
    // Fora do caminho da tela: conta a pagar dos DAS próximos (Contas a Pagar/Tesouraria/aviso
    // de 7 dias) e conserto de pagamento que não chegou na Contabilidade/Fluxo.
    const { data: { user } } = await supabase.auth.getUser()
    if (user && anoSel === anoHoje) {
      void garantirContasDoCalendario(user.id, empresaId, cal.data, hoje).then((r) => { if (r.criadas) window.dispatchEvent(new Event('axioma:dados-atualizados')) })
      void completarRastrosPendentes(empresaId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, hoje])

  useEffect(() => { void carregar(ano) }, [ano, carregar])
  useEffect(() => {
    if (!empresaId) return
    void obterConfigTesouraria(empresaId).then((c) => obterPosicaoCaixa(empresaId, hoje, Number(c?.reserva_minima) || 0))
      .then((p) => setCaixaLivre(p.linhas.length ? p.totalLivre : null)).catch(() => setCaixaLivre(null))
  }, [empresaId, hoje])

  // Central de Obrigações (topo da página) pede "pagar o DAS deste mês".
  useEffect(() => {
    const abrir = (e: Event) => {
      const comp = (e as CustomEvent<string>).detail
      const m = meses.find((x) => x.competencia === comp)
      if (m) abrirPagamento(m); else if (comp) setAno(Number(comp.slice(0, 4)) + (comp.endsWith('-12') ? 1 : 0))
    }
    window.addEventListener('axioma:das-pagar', abrir)
    return () => window.removeEventListener('axioma:das-pagar', abrir)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meses])

  // ------------------------------------------------------------ números da tela (da fonte canônica)
  const proximo = meses.find((m) => m.natureza === 'oficial' && m.saldo > 0 && m.data_vencimento >= hoje)
  const projecaoAteDez = r2(meses.filter((m) => m.natureza === 'projecao' && m.data_vencimento >= hoje).reduce((s, m) => s + (m.valor_esperado ?? 0), 0))
  const previsaoAnual = r2(meses.reduce((s, m) => s + (m.valor_esperado ?? 0), 0))
  const aguardando = meses.filter((m) => m.situacao === 'aguardando_conciliacao')
  const temProjecao = meses.some((m) => m.natureza === 'projecao')
  const premissaProjecao = meses.find((m) => m.natureza === 'projecao')?.premissa
  const faltaAteDez = r2((resumo?.pendenteOficial ?? 0) + projecaoAteDez)

  // ------------------------------------------------------------ janela de pagamento
  const [pagando, setPagando] = useState<{ mes: MesDAS; corrigir?: PagamentoDAS } | null>(null)
  const [fData, setFData] = useState(hoje)
  const [fValor, setFValor] = useState('')
  const [fMetodo, setFMetodo] = useState<MetodoPagamento>('pix')
  const [fRef, setFRef] = useState('')
  const [chave, setChave] = useState('')
  const [salvando, setSalvando] = useState(false)

  // O que ainda dá pra abater no mês. "Falta informar o pagamento" mostra Falta R$ 0 (não é
  // dívida), mas o pagamento dele abate o valor inteiro — antes a janela usava esse 0 e todo
  // o valor virava "multa/juros": o banco recusava (DAS de jan/2026, 2026-10-09).
  const saldoPagavel = (m: MesDAS) => m.situacao === 'aguardando_conciliacao' ? r2(Math.max(0, (m.valor_esperado ?? 0) - m.pago)) : m.saldo
  function sugerido(m: MesDAS, data: string, base = saldoPagavel(m)): number {
    const dias = Math.floor((new Date(data + 'T00:00:00').getTime() - new Date(m.data_vencimento + 'T00:00:00').getTime()) / 86400000)
    return dias > 0 ? r2(calcularPenalidadeDASAtraso(base, dias, selicAnual).total) : base
  }
  function abrirPagamento(m: MesDAS, corrigir?: PagamentoDAS) {
    // Já marcado como pago antes: o normal é ter pago no vencimento (sem multa) — a pessoa ajusta a data.
    const data = corrigir?.data_pagamento ?? (m.situacao === 'aguardando_conciliacao' && m.data_vencimento <= hoje ? m.data_vencimento : hoje)
    setPagando({ mes: m, corrigir }); setFData(data); setFMetodo((corrigir?.metodo as MetodoPagamento) ?? 'pix'); setFRef(corrigir?.referencia ?? '')
    setFValor(String(corrigir ? r2(corrigir.valor + corrigir.encargos) : sugerido(m, data)))
    setChave(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
  }
  const valorNum = parseFloat(fValor) || 0
  const saldoDaJanela = pagando ? r2(saldoPagavel(pagando.mes) + (pagando.corrigir?.valor ?? 0)) : 0   // corrigir devolve o que o pagamento antigo abatia
  const principal = r2(Math.min(valorNum, saldoDaJanela))
  const encargos = r2(Math.max(0, valorNum - saldoDaJanela))
  const parcialFalta = r2(Math.max(0, saldoDaJanela - valorNum))

  async function confirmarPagamento() {
    if (!pagando || !empresaId) return
    if (!(principal > 0)) { showToast(L('Este mês não tem valor em aberto para abater.', 'This month has no open amount to settle.', 'Este mes no tiene valor abierto para saldar.')); return }
    if (!(valorNum > 0) || !fData || fData > hoje) { showToast(L('Informe a data (até hoje) e um valor maior que zero.', 'Enter the date (up to today) and an amount above zero.', 'Informe la fecha (hasta hoy) y un valor mayor que cero.')); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast(L('Sessão expirada. Entre de novo.', 'Session expired. Sign in again.', 'Sesión expirada. Ingrese de nuevo.')); return }
    setSalvando(true)
    if (pagando.corrigir) {
      // Corrigir = estornar o antigo (fica no histórico) e registrar o certo.
      if (!(await confirmar({ oQue: { pt: `o pagamento de ${fmt(pagando.corrigir.valor + pagando.corrigir.encargos)} (para corrigir)`, en: `the ${fmt(pagando.corrigir.valor + pagando.corrigir.encargos)} payment (to fix it)`, es: `el pago de ${fmt(pagando.corrigir.valor + pagando.corrigir.encargos)} (para corregirlo)` }, efeito: EFEITO.financeiro, tabela: 'pagamentos_obrigacao', registroId: pagando.corrigir.id }))) { setSalvando(false); return }
      const e = await estornarPagamentoDAS(empresaId, pagando.corrigir.id, 'Correção do pagamento na tela DAS e Obrigações')
      if (e.erro) { setSalvando(false); showToast(L('Não foi possível corrigir agora. Nada mudou — tente de novo.', 'Could not fix it now. Nothing changed — try again.', 'No se pudo corregir ahora. Nada cambió — intente de nuevo.')); return }
    }
    const r = await registrarPagamentoDAS({
      userId: user.id, empresaId, chave, valor: valorNum, data: fData, metodo: fMetodo, origem: 'manual', referencia: fRef.trim() || null,
      alocacoes: [{ obrigacao_id: pagando.mes.id, valor: principal, encargos }],
    })
    setSalvando(false)
    if (r.erro) {
      showToast(r.erro === 'sem_permissao' ? L('Seu acesso não permite registrar pagamento nesta empresa.', 'Your access does not allow recording payments in this company.', 'Su acceso no permite registrar pagos en esta empresa.')
        : r.erro === 'data_invalida' ? L('A data do pagamento não pode ser no futuro.', 'The payment date cannot be in the future.', 'La fecha del pago no puede ser futura.')
        : L('Não foi possível registrar o pagamento. Nada foi gravado — tente de novo.', 'Could not record the payment. Nothing was saved — try again.', 'No se pudo registrar el pago. No se guardó nada — intente de nuevo.'))
      return
    }
    setPagando(null)
    showToast(r.avisoRastreio
      ? L('Pagamento registrado. A Contabilidade/Fluxo será atualizada em instantes (o Axioma completa sozinho).', 'Payment recorded. Accounting/Cash Flow will update shortly (Axioma completes it automatically).', 'Pago registrado. Contabilidad/Flujo se actualizará en instantes (Axioma lo completa solo).')
      : L('Pagamento registrado — já está no Fluxo de Caixa e na Contabilidade.', 'Payment recorded — already in Cash Flow and Accounting.', 'Pago registrado — ya está en el Flujo de Caja y en Contabilidad.'), 'ok')
    window.dispatchEvent(new Event('axioma:dados-atualizados'))
    void carregar(ano)
  }

  // ------------------------------------------------------------ detalhes / estorno (lixeira)
  const [detalhe, setDetalhe] = useState<MesDAS | null>(null)
  async function estornar(p: PagamentoDAS) {
    if (!empresaId) return
    const outros = meses.filter((m) => m.pagamentos.some((x) => x.id === p.id)).length
    if (!(await confirmar({ oQue: { pt: `o pagamento de ${fmt(p.valor + p.encargos)} de ${dataBR(p.data_pagamento)}${outros > 1 ? ` (cobre ${outros} meses)` : ''}`, en: `the ${fmt(p.valor + p.encargos)} payment of ${dataBR(p.data_pagamento)}`, es: `el pago de ${fmt(p.valor + p.encargos)} del ${dataBR(p.data_pagamento)}` }, efeito: EFEITO.financeiro, tabela: 'pagamentos_obrigacao', registroId: p.id }))) return
    const r = await estornarPagamentoDAS(empresaId, p.id, 'Estorno pela tela DAS e Obrigações (autorizado por supervisor)')
    if (r.erro) { showToast(/sem_permissao/.test(r.erro) ? L('Só dono, sócio, administrador, financeiro ou contábil estornam pagamento.', 'Only owner, partner, admin, finance or accounting can reverse a payment.', 'Solo dueño, socio, administrador, finanzas o contable revierten un pago.') : L('Não foi possível estornar agora. Nada mudou.', 'Could not reverse now. Nothing changed.', 'No se pudo revertir ahora. Nada cambió.')); return }
    setDetalhe(null)
    showToast(L('Pagamento estornado — o histórico guarda o original.', 'Payment reversed — the history keeps the original.', 'Pago revertido — el historial guarda el original.'), 'ok')
    window.dispatchEvent(new Event('axioma:dados-atualizados'))
    void carregar(ano)
  }

  // ------------------------------------------------------------ cenários (só estimativas)
  const [cenario, setCenario] = useState<Cenario>('base')
  const [pctPers, setPctPers] = useState('3')
  const pct = cenario === 'personalizado' ? Math.max(-50, Math.min(100, parseFloat(pctPers) || 0)) : PCT_CENARIO[cenario]
  const projetados = meses.filter((m) => m.natureza === 'projecao')
  const baseProj = r2(projetados.reduce((s, m) => s + (m.valor_esperado ?? 0), 0))
  const cenarioProj = r2(projetados.reduce((s, m) => s + r2((m.valor_esperado ?? 0) * (1 + pct / 100)), 0))
  const difCenario = r2(cenarioProj - baseProj)
  const [sims, setSims] = useState<Simulacao[]>([])
  const [nomeSim, setNomeSim] = useState('')
  const [editSim, setEditSim] = useState<string | null>(null)
  const carregarSims = useCallback(async () => {
    if (!empresaId) return
    const { data, error } = await supabase.from('simulacoes').select('id, nome, created_at, parametros, resultado_projetado')
      .eq('empresa_id', empresaId).eq('parametros->>modulo', 'mei_das').order('created_at', { ascending: false }).limit(50)
    if (error) { Sentry.captureException(new Error(`[DAS] ler simulações: ${error.message}`)); return }
    setSims((data || []) as Simulacao[])
  }, [empresaId])
  useEffect(() => { void carregarSims() }, [carregarSims])

  async function salvarSim(duplicarDe?: Simulacao) {
    if (!empresaId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const p = duplicarDe?.parametros ?? { modulo: 'mei_das', ano, cenario, pct, regras: [...new Set(meses.map((m) => m.premissa ?? ''))].filter(Boolean) }
    const res = duplicarDe?.resultado_projetado ?? { base: baseProj, cenario: cenarioProj, diferenca: difCenario }
    const nome = duplicarDe ? `${duplicarDe.nome} (${L('cópia', 'copy', 'copia')})` : (nomeSim.trim() || `${L('Cenário', 'Scenario', 'Escenario')} ${ano} ${pct >= 0 ? '+' : ''}${pct}%`)
    const q = editSim && !duplicarDe
      ? supabase.from('simulacoes').update({ nome, parametros: p, resultado_projetado: res }).eq('id', editSim).eq('empresa_id', empresaId).select('id')
      : supabase.from('simulacoes').insert({ empresa_id: empresaId, user_id: user.id, nome, descricao: L('Planejamento do DAS (hipotético — não altera dado real)', 'DAS planning (hypothetical — does not change real data)', 'Planificación del DAS (hipotético — no altera datos reales)'), parametros: p, resultado_projetado: res }).select('id')
    const { data, error } = await q
    if (error || !data?.length) { Sentry.captureException(new Error(`[DAS] salvar simulação: ${error?.message || '0 linhas'}`)); showToast(L('Não foi possível salvar a simulação.', 'Could not save the scenario.', 'No se pudo guardar el escenario.')); return }
    setNomeSim(''); setEditSim(null); showToast(L('Simulação salva.', 'Scenario saved.', 'Escenario guardado.'), 'ok'); void carregarSims()
  }
  async function excluirSim(s: Simulacao) {
    if (!(await confirmar({ oQue: `"${s.nome}"`, efeito: EFEITO.planejamento, tabela: 'simulacoes', registroId: s.id }))) return
    const { data, error } = await supabase.from('simulacoes').delete().eq('id', s.id).eq('empresa_id', empresaId!).select('id')
    if (error || !data?.length) { showToast(L('Não foi possível excluir a simulação.', 'Could not delete the scenario.', 'No se pudo eliminar el escenario.')); return }
    void carregarSims()
  }
  function editarSim(s: Simulacao) {
    setEditSim(s.id); setNomeSim(s.nome); setAno(s.parametros.ano)
    if (s.parametros.cenario === 'personalizado') { setCenario('personalizado'); setPctPers(String(s.parametros.pct)) } else setCenario(s.parametros.cenario)
  }

  // ------------------------------------------------------------ peças visuais
  const STATUS = useMemo(() => ({
    previsto: { r: L('Estimativa', 'Estimate', 'Estimación'), c: NEUTRO },
    pendente: { r: L('A pagar', 'To pay', 'A pagar'), c: OURO },
    parcial: { r: L('Pago em parte', 'Partly paid', 'Pagado en parte'), c: AMBAR },
    pago: { r: L('Pago', 'Paid', 'Pagado'), c: VERDE },
    vencido: { r: L('Vencido', 'Overdue', 'Vencido'), c: VERMELHO },
    aguardando_conciliacao: { r: L('Falta informar o pagamento', 'Payment details missing', 'Falta informar el pago'), c: AMBAR },
    cancelado: { r: L('Cancelado', 'Cancelled', 'Cancelado'), c: NEUTRO },
    retificado: { r: L('Retificado', 'Amended', 'Rectificado'), c: NEUTRO },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [lang, temaClaro])
  const botao = (cor: string, extra = '') => ({ className: `px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-60 ${extra}`, style: { background: cor, color: '#ffffff' } })
  const caixa = 'rounded-xl p-3 axi-card-premium3d axi-card-faixa'
  const caixaStyle = { background: NESTED_BG, border: `1px solid ${NESTED_BORDA}` }
  const metodos: [MetodoPagamento, string][] = [['pix', 'Pix'], ['boleto', L('Boleto / código de barras', 'Bank slip / barcode', 'Boleto / código de barras')], ['debito_automatico', L('Débito automático', 'Direct debit', 'Débito automático')], ['transferencia', L('Transferência', 'Transfer', 'Transferencia')], ['cartao', L('Cartão', 'Card', 'Tarjeta')], ['outro', L('Outro', 'Other', 'Otro')]]

  const Indicador = ({ titulo, valor, sub, cor }: { titulo: string; valor: string; sub?: string; cor: string }) => (
    <div className={caixa} style={caixaStyle}>
      <p className="text-[11px] font-semibold" style={{ color: TEXTO_SEC }}>{titulo}</p>
      <p className="text-lg font-black leading-tight mt-0.5" style={{ color: cor }}>{valor}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: TEXTO_SEC }}>{sub}</p>}
    </div>
  )

  if (!empresaId) return null
  return (
    <>
      <CanvasBox cor={VERDE} {...cartaoTema}>
        {/* Cabeçalho + escolha do ano */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-base font-bold" style={{ color: TEXTO }}>{L('DAS do ano', 'DAS for the year', 'DAS del año')}</p>
            <p className="text-xs" style={{ color: TEXTO_SEC }}>{L('O que você já pagou, o que falta e quando vence — mês a mês.', 'What you paid, what is left and when it is due — month by month.', 'Lo que ya pagó, lo que falta y cuándo vence — mes a mes.')}</p>
          </div>
          <div className="flex gap-1" role="tablist" aria-label={L('Ano', 'Year', 'Año')}>
            {anos.map((a) => (
              <button key={a} role="tab" aria-selected={a === ano} onClick={() => setAno(a)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: a === ano ? MENTA : NAVY, color: '#ffffff', opacity: a === ano ? 1 : 0.85 }}>{a}</button>
            ))}
          </div>
        </div>

        {falha && <p role="alert" className="text-xs font-semibold mb-3" style={{ color: VERMELHO }}>{L('Alguns dados não carregaram. Os números podem estar incompletos — atualize a página.', 'Some data did not load. Numbers may be incomplete — refresh the page.', 'Algunos datos no cargaron. Los números pueden estar incompletos — actualice la página.')}</p>}

        {carregando ? (
          <p className="text-xs py-6 text-center" style={{ color: TEXTO_SEC }}>{L('Carregando o calendário…', 'Loading the calendar…', 'Cargando el calendario…')}</p>
        ) : meses.length === 0 ? (
          <p className="text-xs py-6 text-center" style={{ color: TEXTO_SEC }}>{L('Cadastre os dados do MEI (categoria e data de abertura) no Painel MEI para o calendário do DAS aparecer.', 'Fill in the MEI details (category and opening date) on the MEI Panel to see the DAS calendar.', 'Complete los datos del MEI (categoría y fecha de apertura) en el Panel MEI para ver el calendario del DAS.')}</p>
        ) : (
          <>
            {/* Resumo — confirmado separado de estimativa */}
            <p className="text-xs font-bold mb-2" style={{ color: TEXTO }}>{L('Valores confirmados', 'Confirmed amounts', 'Valores confirmados')}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
              <Indicador titulo={L('Já pago no ano', 'Paid this year', 'Ya pagado en el año')} valor={fmt(r2((resumo?.pago ?? 0) + (resumo?.encargosPagos ?? 0)))} cor={VERDE}
                sub={(resumo?.encargosPagos ?? 0) > 0 ? L(`inclui ${fmt(resumo!.encargosPagos)} de multa/juros`, `includes ${fmt(resumo!.encargosPagos)} fines/interest`, `incluye ${fmt(resumo!.encargosPagos)} de multa/intereses`) : L('estornos já descontados', 'reversals already deducted', 'reversiones ya descontadas')} />
              <Indicador titulo={L('Falta pagar (oficial)', 'Left to pay (official)', 'Falta pagar (oficial)')} valor={fmt(resumo?.pendenteOficial ?? 0)} cor={OURO} sub={L('sem contar estimativas', 'estimates not included', 'sin contar estimaciones')} />
              <Indicador titulo={L('Vencido', 'Overdue', 'Vencido')} valor={fmt(resumo?.vencido ?? 0)} cor={(resumo?.vencido ?? 0) > 0 ? VERMELHO : VERDE} sub={(resumo?.vencido ?? 0) > 0 ? L('sem multa e juros — veja o Mapa de Consequências', 'before fines and interest — see the Consequences Map', 'sin multa e intereses — vea el Mapa de Consecuencias') : L('nada em atraso', 'nothing overdue', 'nada atrasado')} />
              <Indicador titulo={L('Próximo vencimento', 'Next due date', 'Próximo vencimiento')} valor={proximo ? fmt(proximo.saldo) : '—'} cor={TEXTO} sub={proximo ? dataBR(proximo.data_vencimento) : L('nenhum DAS oficial em aberto', 'no open official DAS', 'ningún DAS oficial abierto')} />
            </div>
            <p className="text-xs font-bold mb-2" style={{ color: TEXTO }}>{L('Estimativas', 'Estimates', 'Estimaciones')}</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              <Indicador titulo={L('Estimado até dezembro', 'Estimated until December', 'Estimado hasta diciembre')} valor={fmt(projecaoAteDez)} cor={NEUTRO} sub={temProjecao ? L('meses sem valor oficial publicado', 'months without an official amount', 'meses sin valor oficial publicado') : L('todos os meses já têm valor oficial', 'every month has an official amount', 'todos los meses tienen valor oficial')} />
              <Indicador titulo={L(`Previsão para ${ano}`, `Forecast for ${ano}`, `Previsión para ${ano}`)} valor={fmt(previsaoAnual)} cor={TEXTO} sub={L(`${meses.length} meses: oficial + estimativa`, `${meses.length} months: official + estimate`, `${meses.length} meses: oficial + estimación`)} />
              <Indicador titulo={L('Falta informar o pagamento', 'Payment details missing', 'Falta informar el pago')} valor={String(aguardando.length)} cor={aguardando.length ? AMBAR : VERDE} sub={aguardando.length ? L('marcados como pagos sem valor — não contam como pago nem como dívida', 'marked paid without amount — count neither as paid nor as debt', 'marcados pagados sin valor — no cuentan como pago ni deuda') : L('tudo conciliado', 'all reconciled', 'todo conciliado')} />
            </div>
            {temProjecao && premissaProjecao && (
              <p className="text-[11px] mb-4 flex items-start gap-1.5" style={{ color: TEXTO_SEC }}><Info size={13} className="mt-0.5 shrink-0" />{L('Premissa da estimativa: ', 'Estimate assumption: ', 'Premisa de la estimación: ')}{premissaProjecao}. {L('O valor muda em janeiro com o salário mínimo.', 'The amount changes in January with the minimum wage.', 'El valor cambia en enero con el salario mínimo.')}</p>
            )}

            {/* 12 meses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {meses.map((m) => {
                const st = STATUS[m.situacaoTela]
                const atual = m.data_vencimento.slice(0, 7) === hoje.slice(0, 7)
                const pagavel = m.natureza === 'oficial' && (m.saldo > 0 || m.situacao === 'aguardando_conciliacao')
                const ultimo = m.pagamentos.filter((p) => !p.estornado).at(-1)
                return (
                  <div key={m.id} className={caixa} style={{ ...caixaStyle, border: atual ? `2px solid ${VERDE}` : caixaStyle.border }} aria-current={atual ? 'date' : undefined}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: TEXTO }}>{mesAno(m.data_vencimento)}{atual && <span className="ml-1 text-[10px] font-semibold" style={{ color: VERDE }}>{L('· este mês', '· this month', '· este mes')}</span>}</p>
                        <p className="text-[11px]" style={{ color: TEXTO_SEC }}>{L('Competência', 'Period', 'Competencia')} {m.competencia.slice(5, 7)}/{m.competencia.slice(0, 4)} · {L('vence', 'due', 'vence')} {dataBR(m.data_vencimento)}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: `${st.c}22`, color: st.c, border: `1px solid ${st.c}55` }}>{st.r}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-2 text-[11px]">
                      <div><p style={{ color: TEXTO_SEC }}>{m.natureza === 'projecao' ? L('Estimado', 'Estimated', 'Estimado') : L('Valor', 'Amount', 'Valor')}</p><p className="font-bold" style={{ color: TEXTO }}>{m.valor_esperado != null ? fmt(m.valor_esperado) : '—'}</p></div>
                      <div><p style={{ color: TEXTO_SEC }}>{L('Pago', 'Paid', 'Pagado')}</p><p className="font-bold" style={{ color: m.pago > 0 ? VERDE : TEXTO }}>{fmt(r2(m.pago + m.encargos))}</p></div>
                      <div><p style={{ color: TEXTO_SEC }}>{L('Falta', 'Left', 'Falta')}</p><p className="font-bold" style={{ color: m.vencido ? VERMELHO : TEXTO }}>{m.natureza === 'projecao' ? '—' : fmt(m.saldo)}</p></div>
                    </div>
                    {ultimo && <p className="text-[10px] mt-1" style={{ color: TEXTO_SEC }}>{L('Pago em', 'Paid on', 'Pagado el')} {dataBR(ultimo.data_pagamento)}{ultimo.referencia ? ` · ${L('ref.', 'ref.', 'ref.')} ${ultimo.referencia}` : ''}</p>}
                    {m.situacao === 'aguardando_conciliacao' && <p className="text-[10px] mt-1" style={{ color: AMBAR }}>{L('Marcado como pago antes, sem valor. Informe quanto e quando pagou.', 'Marked paid before, without amount. Enter how much and when.', 'Marcado pagado antes, sin valor. Informe cuánto y cuándo pagó.')}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {pagavel && <button {...botao(MENTA)} onClick={() => abrirPagamento(m)}>{L('Registrar pagamento', 'Record payment', 'Registrar pago')}</button>}
                      {m.pagamentos.length > 0 && <button {...botao(NAVY, 'inline-flex items-center gap-1')} onClick={() => setDetalhe(m)}><Eye size={12} />{L('Detalhes', 'Details', 'Detalles')}</button>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CanvasBox>

      {/* Planejamento e antecipação — só planejamento, nada é marcado como pago */}
      {!carregando && meses.length > 0 && (
        <CanvasBox cor={VERDE} {...cartaoTema}>
          <p className="text-base font-bold flex items-center gap-2" style={{ color: TEXTO }}><CalendarClock size={16} />{L(`Planejamento ${ano}`, `${ano} planning`, `Planificación ${ano}`)}</p>
          <p className="text-xs mb-3" style={{ color: TEXTO_SEC }}>{L('Quanto reservar e quando o dinheiro sai. Isto é planejamento: nenhum mês é marcado como pago.', 'How much to set aside and when the money leaves. This is planning: no month is marked as paid.', 'Cuánto reservar y cuándo sale el dinero. Esto es planificación: ningún mes se marca como pagado.')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <Indicador titulo={L('Para quitar tudo até dezembro', 'To clear everything by December', 'Para saldar todo hasta diciembre')} valor={fmt(faltaAteDez)} cor={TEXTO}
              sub={L(`${fmt(resumo?.pendenteOficial ?? 0)} oficial + ${fmt(projecaoAteDez)} estimado`, `${fmt(resumo?.pendenteOficial ?? 0)} official + ${fmt(projecaoAteDez)} estimated`, `${fmt(resumo?.pendenteOficial ?? 0)} oficial + ${fmt(projecaoAteDez)} estimado`)} />
            <Indicador titulo={L('Reserva por mês', 'Monthly reserve', 'Reserva mensual')} valor={fmt(r2(faltaAteDez / Math.max(1, meses.filter((m) => m.saldo > 0 || (m.natureza === 'projecao' && m.data_vencimento >= hoje)).length)))} cor={TEXTO} sub={L('dividido pelos meses que ainda têm desembolso', 'split across months that still need payment', 'dividido entre los meses que aún requieren pago')} />
            <Indicador titulo={L('Caixa livre hoje (Tesouraria)', 'Free cash today (Treasury)', 'Caja libre hoy (Tesorería)')} valor={caixaLivre == null ? '—' : fmt(caixaLivre)} cor={caixaLivre == null ? NEUTRO : caixaLivre >= faltaAteDez ? VERDE : VERMELHO}
              sub={caixaLivre == null ? L('cadastre as contas na Tesouraria para comparar', 'add accounts in Treasury to compare', 'registre las cuentas en Tesorería para comparar') : caixaLivre >= faltaAteDez ? L('cobre todos os DAS até dezembro', 'covers every DAS until December', 'cubre todos los DAS hasta diciembre') : L(`faltam ${fmt(r2(faltaAteDez - caixaLivre))} para cobrir`, `${fmt(r2(faltaAteDez - caixaLivre))} short`, `faltan ${fmt(r2(faltaAteDez - caixaLivre))} para cubrir`)} />
          </div>
          <p className="text-[11px] mb-1 font-semibold" style={{ color: TEXTO }}>{L('Meses com desembolso', 'Months with payments due', 'Meses con desembolso')}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {meses.filter((m) => m.saldo > 0 || (m.natureza === 'projecao' && m.data_vencimento >= hoje)).map((m) => (
              <span key={m.id} className="text-[11px] px-2 py-1 rounded-lg" style={{ ...caixaStyle, color: m.vencido ? VERMELHO : TEXTO }}>
                {dataBR(m.data_vencimento)} · {fmt(m.natureza === 'projecao' ? (m.valor_esperado ?? 0) : m.saldo)}{m.natureza === 'projecao' ? ` (${L('estimado', 'estimated', 'estimado')})` : ''}
              </span>
            ))}
          </div>
          <p className="text-[11px]" style={{ color: TEXTO_SEC }}>{L('Pagar adiantado: pelas regras atuais o Portal do Simples gera as guias do ano corrente; as do ano seguinte só a partir de janeiro. Confirme no PGMEI antes de pagar.', 'Paying ahead: under current rules the Simples portal issues the current year slips; next year only from January. Check PGMEI before paying.', 'Pagar por adelantado: según las reglas actuales el Portal del Simples emite las guías del año en curso; las del siguiente solo desde enero. Confirme en el PGMEI antes de pagar.')}</p>
        </CanvasBox>
      )}

      {/* Cenários — mexem só nas estimativas, nunca no dado real */}
      {!carregando && meses.length > 0 && (
        <CanvasBox cor={VERDE} {...cartaoTema}>
          <p className="text-base font-bold" style={{ color: TEXTO }}>{L('Cenários do DAS', 'DAS scenarios', 'Escenarios del DAS')}</p>
          <p className="text-xs mb-3" style={{ color: TEXTO_SEC }}>{L('Teste variações nos meses ainda sem valor oficial. Os percentuais são exemplos, não previsões oficiais — nada aqui altera seus dados.', 'Test changes in months without an official amount yet. Percentages are examples, not official forecasts — nothing here changes your data.', 'Pruebe variaciones en los meses aún sin valor oficial. Los porcentajes son ejemplos, no previsiones oficiales — nada aquí altera sus datos.')}</p>
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {(['base', 'conservador', 'estresse', 'personalizado'] as Cenario[]).map((c) => (
              <button key={c} onClick={() => setCenario(c)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cenario === c ? MENTA : NAVY, color: '#ffffff' }}>
                {c === 'base' ? L('Base (regra oficial)', 'Base (official rule)', 'Base (regla oficial)') : c === 'conservador' ? L('Conservador +5%', 'Conservative +5%', 'Conservador +5%') : c === 'estresse' ? L('Estresse +10%', 'Stress +10%', 'Estrés +10%') : L('Personalizado', 'Custom', 'Personalizado')}
              </button>
            ))}
            {cenario === 'personalizado' && (
              <label className="text-xs flex items-center gap-1" style={{ color: TEXTO }}>
                <input type="number" step="0.5" min={-50} max={100} value={pctPers} onChange={(e) => setPctPers(e.target.value)} aria-label={L('Variação em %', 'Change in %', 'Variación en %')}
                  className="w-20 px-2 py-1 rounded-lg text-xs" style={{ background: CAMPO_BG, border: `1px solid ${NESTED_BORDA}`, color: TEXTO }} />%
              </label>
            )}
          </div>
          {projetados.length === 0 ? (
            <p className="text-xs" style={{ color: TEXTO_SEC }}>{L(`Todos os meses de ${ano} já têm valor oficial — não há estimativa para variar. Escolha um ano seguinte.`, `Every month of ${ano} already has an official amount — nothing to vary. Pick a later year.`, `Todos los meses de ${ano} ya tienen valor oficial — nada que variar. Elija un año siguiente.`)}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <Indicador titulo={L('Estimativa base', 'Base estimate', 'Estimación base')} valor={fmt(baseProj)} cor={TEXTO} sub={L(`${projetados.length} meses estimados`, `${projetados.length} estimated months`, `${projetados.length} meses estimados`)} />
              <Indicador titulo={L('Neste cenário', 'In this scenario', 'En este escenario')} valor={fmt(cenarioProj)} cor={difCenario > 0 ? VERMELHO : difCenario < 0 ? VERDE : TEXTO} sub={L(`${fmt(r2(cenarioProj / projetados.length))} por mês`, `${fmt(r2(cenarioProj / projetados.length))} per month`, `${fmt(r2(cenarioProj / projetados.length))} por mes`)} />
              <Indicador titulo={L('Impacto no caixa', 'Cash impact', 'Impacto en caja')} valor={`${difCenario > 0 ? '+' : ''}${fmt(difCenario)}`} cor={difCenario > 0 ? VERMELHO : difCenario < 0 ? VERDE : TEXTO} sub={L('a mais (ou a menos) para reservar no ano', 'more (or less) to set aside this year', 'más (o menos) para reservar en el año')} />
            </div>
          )}
          <div className={`${caixa} mb-3`} style={caixaStyle}>
            <p className="text-[11px] font-bold mb-1" style={{ color: TEXTO }}>{L('Reforma Tributária', 'Tax Reform', 'Reforma Tributaria')}</p>
            <p className="text-[11px]" style={{ color: TEXTO_SEC }}>{L('O DAS do MEI é um valor fixo definido pela regra oficial do período — o Axioma não aplica aumento da Reforma por conta própria. O impacto econômico da Reforma (preços, custos, margem) é outra análise: use Simulações e a IA Tributária. Quando sair regra oficial para o MEI, ela entra aqui com fonte e data.', 'The MEI DAS is a fixed amount set by the official rule for the period — Axioma does not apply Reform increases on its own. The Reform economic impact (prices, costs, margin) is a separate analysis: use Simulations and Tax AI. When an official MEI rule is published, it comes in here with source and date.', 'El DAS del MEI es un valor fijo definido por la regla oficial del período — Axioma no aplica aumentos de la Reforma por su cuenta. El impacto económico de la Reforma (precios, costos, margen) es otro análisis: use Simulaciones y la IA Tributaria. Cuando salga una regla oficial para el MEI, entra aquí con fuente y fecha.')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input value={nomeSim} onChange={(e) => setNomeSim(e.target.value)} maxLength={80} placeholder={L('Nome da simulação (opcional)', 'Scenario name (optional)', 'Nombre del escenario (opcional)')}
              className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg text-xs" style={{ background: CAMPO_BG, border: `1px solid ${NESTED_BORDA}`, color: TEXTO }} />
            <button {...botao(MENTA)} onClick={() => void salvarSim()}>{editSim ? L('Salvar alterações', 'Save changes', 'Guardar cambios') : L('Salvar simulação', 'Save scenario', 'Guardar escenario')}</button>
            {editSim && <button {...botao(NAVY)} onClick={() => { setEditSim(null); setNomeSim('') }}>{L('Cancelar edição', 'Cancel editing', 'Cancelar edición')}</button>}
          </div>
          {sims.length > 0 && (
            <div className="space-y-1.5">
              {sims.map((s) => (
                <div key={s.id} className={`${caixa} flex flex-wrap items-center justify-between gap-2`} style={caixaStyle}>
                  <div className="text-[11px]" style={{ color: TEXTO }}>
                    <p className="font-bold">{s.nome}</p>
                    <p style={{ color: TEXTO_SEC }}>{s.parametros.ano} · {s.parametros.pct >= 0 ? '+' : ''}{s.parametros.pct}% · {fmt(s.resultado_projetado.cenario)} ({s.resultado_projetado.diferenca >= 0 ? '+' : ''}{fmt(s.resultado_projetado.diferenca)}) · {new Date(s.created_at).toLocaleDateString(local)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button aria-label={L('Editar', 'Edit', 'Editar')} title={L('Editar', 'Edit', 'Editar')} onClick={() => editarSim(s)} className="p-1.5 rounded-lg" style={{ background: NAVY, color: '#fff' }}><Pencil size={12} /></button>
                    <button aria-label={L('Duplicar', 'Duplicate', 'Duplicar')} title={L('Duplicar', 'Duplicate', 'Duplicar')} onClick={() => void salvarSim(s)} className="p-1.5 rounded-lg" style={{ background: MENTA, color: '#fff' }}><Copy size={12} /></button>
                    <button aria-label={L('Excluir', 'Delete', 'Eliminar')} title={L('Excluir', 'Delete', 'Eliminar')} onClick={() => void excluirSim(s)} className="p-1.5 rounded-lg" style={{ background: NAVY, color: '#fff' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CanvasBox>
      )}

      {/* Janela: registrar / corrigir pagamento */}
      <Modal open={!!pagando} onClose={() => { if (!salvando) setPagando(null) }}>
        <CanvasBox cor={VERDE} {...cartaoTema}>
          <p className="text-sm font-bold" style={{ color: TEXTO }}>{pagando?.corrigir ? L('Corrigir pagamento', 'Fix payment', 'Corregir pago') : L('Registrar pagamento do DAS', 'Record DAS payment', 'Registrar pago del DAS')}</p>
          {pagando && <p className="text-xs mb-3" style={{ color: TEXTO_SEC }}>{L('Competência', 'Period', 'Competencia')} {pagando.mes.competencia.slice(5, 7)}/{pagando.mes.competencia.slice(0, 4)} · {L('vence', 'due', 'vence')} {dataBR(pagando.mes.data_vencimento)} · {L('em aberto', 'open', 'abierto')} {fmt(saldoDaJanela)}</p>}
          <label className="text-xs font-semibold block" style={{ color: TEXTO_SEC }}>{L('Data do pagamento', 'Payment date', 'Fecha del pago')}
            <input type="date" value={fData} max={hoje} onChange={(e) => { setFData(e.target.value); if (pagando && e.target.value && !pagando.corrigir) setFValor(String(sugerido(pagando.mes, e.target.value))) }}
              className="w-full mt-1 mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: `1px solid ${NESTED_BORDA}`, color: TEXTO }} />
          </label>
          <label className="text-xs font-semibold block" style={{ color: TEXTO_SEC }}>{L('Valor pago (R$)', 'Amount paid (R$)', 'Valor pagado (R$)')}
            <input type="number" step="0.01" min="0" value={fValor} onChange={(e) => setFValor(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: `1px solid ${NESTED_BORDA}`, color: TEXTO }} />
          </label>
          <p className="text-[11px] mt-1 mb-3" style={{ color: parcialFalta > 0 ? AMBAR : TEXTO_SEC }}>
            {parcialFalta > 0 ? L(`Pagamento parcial: continua faltando ${fmt(parcialFalta)}.`, `Partial payment: ${fmt(parcialFalta)} still left.`, `Pago parcial: sigue faltando ${fmt(parcialFalta)}.`)
              : encargos > 0 ? L(`${fmt(principal)} do DAS + ${fmt(encargos)} de multa/juros (vão para a conta de juros).`, `${fmt(principal)} DAS + ${fmt(encargos)} fines/interest (go to the interest account).`, `${fmt(principal)} del DAS + ${fmt(encargos)} de multa/intereses (van a la cuenta de intereses).`)
              : L('Quita o mês inteiro.', 'Clears the whole month.', 'Salda el mes entero.')}
          </p>
          <label className="text-xs font-semibold block" style={{ color: TEXTO_SEC }}>{L('Como pagou', 'How you paid', 'Cómo pagó')}
            <select value={fMetodo} onChange={(e) => setFMetodo(e.target.value as MetodoPagamento)} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: `1px solid ${NESTED_BORDA}`, color: TEXTO }}>
              {metodos.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold block" style={{ color: TEXTO_SEC }}>{L('Nº do documento ou autenticação (opcional)', 'Document number or authentication (optional)', 'Nº del documento o autenticación (opcional)')}
            <input value={fRef} onChange={(e) => setFRef(e.target.value)} maxLength={80} className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: `1px solid ${NESTED_BORDA}`, color: TEXTO }} />
          </label>
          <p className="text-[11px] mt-1 mb-4" style={{ color: TEXTO_SEC }}>{L('Com o nº da guia, o Axioma reconhece este pagamento no extrato do banco sozinho.', 'With the slip number, Axioma recognizes this payment in the bank statement by itself.', 'Con el nº de la guía, Axioma reconoce este pago en el extracto bancario solo.')}</p>
          <div className="flex gap-2">
            <button disabled={salvando} onClick={() => setPagando(null)} {...botao(NAVY, 'flex-1 py-2.5 text-sm')}>{L('Cancelar', 'Cancel', 'Cancelar')}</button>
            <button disabled={salvando} onClick={() => void confirmarPagamento()} {...botao(MENTA, 'flex-1 py-2.5 text-sm')}>{salvando ? '…' : pagando?.corrigir ? L('Salvar correção', 'Save fix', 'Guardar corrección') : L('Registrar pagamento', 'Record payment', 'Registrar pago')}</button>
          </div>
        </CanvasBox>
      </Modal>

      {/* Janela: detalhes do mês (lápis = corrigir, lixeira = estornar) */}
      <Modal open={!!detalhe} onClose={() => setDetalhe(null)}>
        <CanvasBox cor={VERDE} {...cartaoTema}>
          {detalhe && <>
            <p className="text-sm font-bold" style={{ color: TEXTO }}>{L('Pagamentos de', 'Payments for', 'Pagos de')} {L('competência', 'period', 'competencia')} {detalhe.competencia.slice(5, 7)}/{detalhe.competencia.slice(0, 4)}</p>
            <p className="text-xs mb-3" style={{ color: TEXTO_SEC }}>{L('Estornar não apaga: o pagamento original fica no histórico, marcado.', 'Reversing does not delete: the original payment stays in the history, marked.', 'Revertir no borra: el pago original queda en el historial, marcado.')}</p>
            <div className="space-y-1.5">
              {detalhe.pagamentos.map((p) => (
                <div key={p.id} className={`${caixa} flex items-center justify-between gap-2`} style={caixaStyle}>
                  <div className="text-[11px]" style={{ color: TEXTO, textDecoration: p.estornado ? 'line-through' : undefined }}>
                    <p className="font-bold">{fmt(r2(p.valor + p.encargos))} · {dataBR(p.data_pagamento)}</p>
                    <p style={{ color: TEXTO_SEC }}>{metodos.find(([v]) => v === p.metodo)?.[1] ?? p.metodo}{p.encargos > 0 ? ` · ${L('inclui', 'includes', 'incluye')} ${fmt(p.encargos)} ${L('de multa/juros', 'fines/interest', 'de multa/intereses')}` : ''}{p.referencia ? ` · ${p.referencia}` : ''}{p.estornado ? ` · ${L('estornado', 'reversed', 'revertido')}` : ''}</p>
                  </div>
                  {!p.estornado && (
                    <div className="flex gap-1">
                      <button aria-label={L('Corrigir', 'Fix', 'Corregir')} title={L('Corrigir', 'Fix', 'Corregir')} onClick={() => { setDetalhe(null); abrirPagamento(detalhe, p) }} className="p-1.5 rounded-lg" style={{ background: NAVY, color: '#fff' }}><Pencil size={12} /></button>
                      <button aria-label={L('Estornar', 'Reverse', 'Revertir')} title={L('Estornar', 'Reverse', 'Revertir')} onClick={() => void estornar(p)} className="p-1.5 rounded-lg" style={{ background: NAVY, color: '#fff' }}><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setDetalhe(null)} {...botao(NAVY, 'w-full mt-3 py-2.5 text-sm')}>{L('Fechar', 'Close', 'Cerrar')}</button>
          </>}
        </CanvasBox>
      </Modal>
      {janelaConfirmacao}
    </>
  )
}
