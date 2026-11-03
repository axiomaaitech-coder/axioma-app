'use client'
// Simulador de recuperação (Overdue Intelligence, Fase 2 etapa 9): "se recuperarmos X% em N dias…", "se Y% descumprirem
// as promessas", "se anteciparmos as negociações". Cálculo do motor (simularCenarioRecuperacao) sobre o caixa da
// Tesouraria — SIMULAÇÃO: nada é gravado nem altera saldo real.
import { useState } from 'react'
import Link from 'next/link'
import type { AnaliseVencidos } from '../../../lib/vencidos/dados'
import { noPrazo, simularCenarioRecuperacao, type Cenario } from '../../../lib/vencidos/motor'
import { coresSituacao, corTextoSituacao } from '../../../lib/cfoCore'

type Paleta = { VERDE: string; VERMELHO: string; CINZA: string; TEXTO: string; PAINEL_BG: string; ANINHADA: string; BORDA: string; CAMPO: string }
const BOTAO_ACAO = 'linear-gradient(135deg, #0a4f3b, #0f7d5c)'
const BOTAO_SECUNDARIO = '#101b3d'

export default function Simulador({ a, prometido, emNegociacao, lang, P, fmt, temaClaro }: { a: AnaliseVencidos; prometido: number; emNegociacao: number; lang: 'pt' | 'en' | 'es'; P: Paleta; fmt: (v: number) => string; temaClaro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const [pct, setPct] = useState(70)
  const [prazo, setPrazo] = useState(30)
  const [descumpre, setDescumpre] = useState(0)
  const [antecipar, setAntecipar] = useState(false)
  // caixa a pagar/receber que vence dentro do prazo do cenário (o 30 dias da Tesouraria vale só para 30)
  const base = { ...a.tesouraria, aPagarNoPrazo: noPrazo(a.titulosPagar, a.hoje, prazo), aReceberNoPrazo: noPrazo(a.titulosReceber, a.hoje, prazo) }
  const cen = (x: number): Cenario => ({ pct: x, prazoDias: prazo, prometido, emNegociacao, pctDescumpre: descumpre, anteciparNegociacao: antecipar })
  const s = simularCenarioRecuperacao(base, cen(pct))
  const comparar = [...new Set([30, 50, 70, 90, pct])].sort((x, y) => x - y).map((x) => simularCenarioRecuperacao(base, cen(x)))
  const cs = coresSituacao(temaClaro)
  const nivel = (r: string) => (r === 'alto' ? 'critico' : r === 'medio' ? 'atencao' : 'bom') as 'critico' | 'atencao' | 'bom'
  const nomeRisco = (r: string) => (r === 'alto' ? L('Alto: caixa negativo', 'High: negative cash', 'Alto: caja negativa') : r === 'medio' ? L('Médio: abaixo da reserva', 'Medium: below reserve', 'Medio: bajo la reserva') : L('Baixo', 'Low', 'Bajo'))
  const vezes = (v: number | null) => (v == null ? '—' : `${v.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { maximumFractionDigits: 2 })}×`)
  const aninhada = { background: P.ANINHADA, border: `1px solid ${P.BORDA}` }
  const pill = (ativo: boolean) => ({ background: ativo ? BOTAO_ACAO : BOTAO_SECUNDARIO, color: '#ffffff' })
  const kpi = (titulo: string, valor: string, cor: string, sub?: string) => (
    <div className="rounded-xl p-3 min-w-0 axi-card-premium3d axi-card-faixa" style={aninhada}>
      <p className="text-xs" style={{ color: P.CINZA }}>{titulo}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color: cor }}>{valor}</p>
      {sub && <p className="text-[11px]" style={{ color: P.CINZA }}>{sub}</p>}
    </div>
  )
  return (
    <div className="rounded-2xl p-4 space-y-3 axi-card-premium3d axi-card-faixa" style={{ background: P.PAINEL_BG, border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{L('Simulador de recuperação', 'Recovery simulator', 'Simulador de recuperación')}</p>
          <p className="text-[11px]" style={{ color: P.CINZA }}>{L(`Sobre ${fmt(a.tesouraria.vencidoReceber)} vencidos a receber e o caixa da Tesouraria (${fmt(a.tesouraria.caixaDisponivel)}). Simulação — nada é gravado.`, `On ${fmt(a.tesouraria.vencidoReceber)} overdue receivables and Treasury cash (${fmt(a.tesouraria.caixaDisponivel)}). Simulation — nothing is saved.`, `Sobre ${fmt(a.tesouraria.vencidoReceber)} vencidos por cobrar y la caja de Tesorería (${fmt(a.tesouraria.caixaDisponivel)}). Simulación — nada se guarda.`)}</p>
        </div>
        <Link href="/tesouraria" className="text-[11px] font-semibold underline" style={{ color: P.VERDE }}>{L('Tesouraria', 'Treasury', 'Tesorería')} ›</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1.5">
          <p className="font-semibold">{L('Quanto do vencido recuperar', 'How much of the overdue to recover', 'Cuánto de lo vencido recuperar')}: {pct}%</p>
          <div className="flex flex-wrap gap-1">{[30, 40, 50, 60, 70, 90].map((x) => <button key={x} type="button" onClick={() => setPct(x)} className="px-2.5 py-1 rounded-lg font-bold axi-card-premium3d axi-card-faixa" style={pill(pct === x)}>{x}%</button>)}</div>
          <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} aria-label={L('Percentual personalizado', 'Custom percentage', 'Porcentaje personalizado')} className="w-full" style={{ accentColor: '#2ecc9b' }} />
          <p className="font-semibold pt-1">{L('Em quantos dias', 'In how many days', 'En cuántos días')}</p>
          <div className="flex flex-wrap gap-1">{[15, 30, 60, 90].map((x) => <button key={x} type="button" onClick={() => setPrazo(x)} className="px-2.5 py-1 rounded-lg font-bold axi-card-premium3d axi-card-faixa" style={pill(prazo === x)}>{x} {L('dias', 'days', 'días')}</button>)}</div>
        </div>
        <div className="space-y-1.5">
          <p className="font-semibold">{L('Promessas descumpridas', 'Broken promises', 'Promesas incumplidas')}: {descumpre}% <span style={{ color: P.CINZA }}>({L('prometido', 'promised', 'prometido')} {fmt(prometido)})</span></p>
          {prometido > 0 ? (
            <>
              <div className="flex flex-wrap gap-1">{[0, 10, 20, 30, 50, 100].map((x) => <button key={x} type="button" onClick={() => setDescumpre(x)} className="px-2.5 py-1 rounded-lg font-bold axi-card-premium3d axi-card-faixa" style={pill(descumpre === x)}>{x}%</button>)}</div>
              <input type="range" min={0} max={100} step={5} value={descumpre} onChange={(e) => setDescumpre(Number(e.target.value))} aria-label={L('Percentual de promessas descumpridas', 'Share of broken promises', 'Porcentaje de promesas incumplidas')} className="w-full h-8" style={{ accentColor: '#2ecc9b' }} />
              <p style={{ color: corTextoSituacao('bom', temaClaro) }}>{L(`Entram das promessas: ${fmt(s.composicao.dasPromessas)}`, `From promises: ${fmt(s.composicao.dasPromessas)}`, `Entran de las promesas: ${fmt(s.composicao.dasPromessas)}`)}</p>
            </>
          ) : <p style={{ color: P.CINZA }}>{L('Nenhuma promessa de pagamento em aberto agora — registre na conta, na central abaixo.', 'No open payment promise right now — record one on the bill, in the center below.', 'Ninguna promesa de pago abierta ahora — regístrela en la cuenta, en la central de abajo.')}</p>}
          <p className="font-semibold pt-1">{L('Negociações', 'Negotiations', 'Negociaciones')}</p>
          {emNegociacao > 0 ? (
            <>
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={() => setAntecipar(false)} className="px-2.5 py-1.5 rounded-lg font-bold axi-card-premium3d axi-card-faixa" style={pill(!antecipar)}>{L('No ritmo normal', 'At normal pace', 'Al ritmo normal')}</button>
                <button type="button" onClick={() => setAntecipar(true)} className="px-2.5 py-1.5 rounded-lg font-bold axi-card-premium3d axi-card-faixa" style={pill(antecipar)}>{L('Antecipar (entram inteiras)', 'Bring forward (in full)', 'Anticipar (entran completas)')}</button>
              </div>
              <p style={{ color: corTextoSituacao('bom', temaClaro) }}>{L(`Entram das negociações: ${fmt(s.composicao.dasNegociacoes)} de ${fmt(emNegociacao)}`, `From negotiations: ${fmt(s.composicao.dasNegociacoes)} of ${fmt(emNegociacao)}`, `Entran de las negociaciones: ${fmt(s.composicao.dasNegociacoes)} de ${fmt(emNegociacao)}`)}</p>
            </>
          ) : <p style={{ color: P.CINZA }}>{L('Nenhuma negociação em andamento agora (as aprovadas viram acordo e entram nas promessas). Proponha na conta, na central abaixo.', 'No negotiation in progress right now (approved ones become agreements and count as promises). Propose one on the bill, in the center below.', 'Ninguna negociación en curso ahora (las aprobadas se vuelven acuerdo y cuentan como promesas). Propóngala en la cuenta, en la central de abajo.')}</p>}
          <p className="text-[11px]" style={{ color: P.CINZA }}>{L('Recuperado = restante × % + promessas que forem cumpridas + negociações. O mesmo dinheiro nunca conta duas vezes.', 'Recovered = remainder × % + promises kept + negotiations. The same money is never counted twice.', 'Recuperado = resto × % + promesas cumplidas + negociaciones. El mismo dinero nunca cuenta dos veces.')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {kpi(L('Recuperado no cenário', 'Recovered in scenario', 'Recuperado en el escenario'), fmt(s.recuperado), corTextoSituacao('bom', temaClaro), L(`ainda vencido: ${fmt(s.aindaVencido)}`, `still overdue: ${fmt(s.aindaVencido)}`, `aún vencido: ${fmt(s.aindaVencido)}`))}
        {kpi(L(`Caixa em ${prazo} dias`, `Cash in ${prazo} days`, `Caja en ${prazo} días`), fmt(s.caixaProjetado), corTextoSituacao(nivel(s.riscoRuptura), temaClaro), nomeRisco(s.riscoRuptura))}
        {kpi(L('Cobertura das obrigações', 'Obligation coverage', 'Cobertura de obligaciones'), vezes(s.coberturaObrigacoes), P.TEXTO, L('o que entra ÷ o que vence', 'what comes in ÷ what is due', 'lo que entra ÷ lo que vence'))}
        {kpi(L('Folga sobre a reserva', 'Margin over reserve', 'Margen sobre la reserva'), fmt(s.folgaSobreReserva), s.folgaSobreReserva < 0 ? cs.critico : corTextoSituacao('bom', temaClaro), L(`reserva mínima ${fmt(a.tesouraria.reservaMinima)}`, `minimum reserve ${fmt(a.tesouraria.reservaMinima)}`, `reserva mínima ${fmt(a.tesouraria.reservaMinima)}`))}
        {kpi(L('Liquidez imediata', 'Immediate liquidity', 'Liquidez inmediata'), fmt(s.liquidezImediata), P.TEXTO, L('caixa + recuperado − pagar vencido', 'cash + recovered − overdue payable', 'caja + recuperado − vencido por pagar'))}
        {kpi(L('Capital de giro', 'Working capital', 'Capital de trabajo'), s.capitalDeGiro == null ? '—' : fmt(s.capitalDeGiro), P.TEXTO, L('não muda: recebível vira caixa', 'unchanged: receivable turns into cash', 'no cambia: el cobro se vuelve caja'))}
        {kpi(L('Das promessas', 'From promises', 'De las promesas'), fmt(s.composicao.dasPromessas), P.TEXTO)}
        {kpi(L('Das negociações', 'From negotiations', 'De las negociaciones'), fmt(s.composicao.dasNegociacoes), P.TEXTO)}
      </div>
      <div className="rounded-xl p-3 overflow-x-auto axi-card-premium3d axi-card-faixa" style={aninhada}>
        <p className="text-xs font-bold mb-1">{L(`Comparar cenários (${prazo} dias)`, `Compare scenarios (${prazo} days)`, `Comparar escenarios (${prazo} días)`)}</p>
        <table className="w-full text-xs">
          <thead><tr className="text-left" style={{ color: P.CINZA }}>
            <th className="p-1.5">{L('Recuperação', 'Recovery', 'Recuperación')}</th><th className="p-1.5 text-right">{L('Recuperado', 'Recovered', 'Recuperado')}</th>
            <th className="p-1.5 text-right">{L('Caixa', 'Cash', 'Caja')}</th><th className="p-1.5 text-right">{L('Cobertura', 'Coverage', 'Cobertura')}</th>
            <th className="p-1.5 text-right">{L('Folga', 'Margin', 'Margen')}</th><th className="p-1.5">{L('Risco', 'Risk', 'Riesgo')}</th>
          </tr></thead>
          <tbody>
            {comparar.map((c) => (
              <tr key={c.pct} style={{ borderTop: `1px solid ${P.BORDA}`, fontWeight: c.pct === pct ? 700 : 400 }}>
                <td className="p-1.5">{c.pct}%{c.pct === pct ? ` · ${L('atual', 'current', 'actual')}` : ''}</td>
                <td className="p-1.5 text-right">{fmt(c.recuperado)}</td>
                <td className="p-1.5 text-right">{fmt(c.caixaProjetado)}</td>
                <td className="p-1.5 text-right">{vezes(c.coberturaObrigacoes)}</td>
                <td className="p-1.5 text-right">{fmt(c.folgaSobreReserva)}</td>
                <td className="p-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: cs[nivel(c.riscoRuptura)] }} />{nomeRisco(c.riscoRuptura)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
