'use client'
// Painel de Risco (Financial Core 2.6 — bloco A3): o que pode dar problema de dinheiro,
// nota de 0 a 100 por risco com a explicação em números e atalho pro módulo. Lê o mesmo
// retrato da empresa que a IA usa (números batem com o que a IA fala). Só leitura.
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, ArrowRight } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { ThemeToggle } from '../../../components/ThemeToggle'
import { useThemeAxioma } from '../../../lib/ThemeContext'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import { createClient } from '../../../lib/supabase/client'
import { montarRetrato, type NumerosRetrato } from '../../../lib/ia/retratoEmpresa'
import { lerTodas } from '../../../lib/lerTodas'
import { hojeISO } from '../../../lib/datas'
import { avaliarRiscos, notaGeral, nivelDaNota, prazoMedioDias, mesesDeCaixa, type ItemRisco, type NivelRisco, type Idioma3 } from '../../../lib/riscoHelpers'

const PALETA = {
  dark: { OK: '#2ecc9b', ATENCAO: '#fbbf24', RISCO: '#f87171', CINZA: '#a3b1c2', TEXTO: '#e6edf5', PAINEL_BG: 'rgba(10,20,36,0.7)', ANINHADA: 'rgba(2,8,16,0.5)', BORDA: 'rgba(255,255,255,0.08)' },
  xms: { OK: '#0f7a5a', ATENCAO: '#101b3d', RISCO: '#d93848', CINZA: '#374151', TEXTO: '#101b3d', PAINEL_BG: '#f6f7c4', ANINHADA: 'rgba(245,238,220,0.7)', BORDA: 'rgba(16,27,61,0.12)' },
} as const

export default function RiscoPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const P = PALETA[tema]
  const [itens, setItens] = useState<ItemRisco[]>([])
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [num, setNum] = useState<NumerosRetrato | null>(null)
  const [prazos, setPrazos] = useState<{ pmr: number | null; pmp: number | null }>({ pmr: null, pmp: null })

  const carregar = useCallback(async () => {
    setCarregando(true); setFalhou(false)
    try {
      const empresaId = await obterEmpresaAtiva()
      if (!empresaId) return
      const db = createClient()
      const desde = `${Number(hojeISO().slice(0, 4)) - 1}${hojeISO().slice(4, 10)}` // últimos 12 meses
      const [r, cr, cp] = await Promise.all([
        montarRetrato(db, empresaId),
        lerTodas(() => db.from('contas_receber').select('data_emissao, data_recebimento, valor_recebido').eq('empresa_id', empresaId).gt('valor_recebido', 0).gte('data_recebimento', desde).order('id')),
        lerTodas(() => db.from('contas_pagar').select('data_emissao, data_pagamento, valor_pago').eq('empresa_id', empresaId).gt('valor_pago', 0).gte('data_pagamento', desde).order('id')),
      ])
      if (cr.error || cp.error) setFalhou(true)
      setItens(avaliarRiscos(r.numeros, lang)); setNum(r.numeros)
      setPrazos({
        pmr: prazoMedioDias((cr.data as { data_emissao: string | null; data_recebimento: string | null; valor_recebido: number }[]).map((c) => ({ inicio: c.data_emissao, fim: c.data_recebimento, valor: Number(c.valor_recebido) }))),
        pmp: prazoMedioDias((cp.data as { data_emissao: string | null; data_pagamento: string | null; valor_pago: number }[]).map((c) => ({ inicio: c.data_emissao, fim: c.data_pagamento, valor: Number(c.valor_pago) }))),
      })
    } catch { setFalhou(true) } // varredura:ok a tela mostra o aviso de falha; nada é gravado
    finally { setCarregando(false) }
  }, [lang])
  useEffect(() => { void carregar() }, [carregar])

  const cor = (n: NivelRisco) => (n === 'ok' ? P.OK : n === 'atencao' ? P.ATENCAO : n === 'risco' ? P.RISCO : P.CINZA)
  const rotulo = (n: NivelRisco) => (n === 'ok' ? L('Tranquilo', 'Fine', 'Tranquilo') : n === 'atencao' ? L('Atenção', 'Watch', 'Atención') : n === 'risco' ? L('Risco', 'Risk', 'Riesgo') : L('Sem dado', 'No data', 'Sin dato'))
  const geral = notaGeral(itens)
  const ordenados = [...itens].sort((a, b) => (a.nota ?? 999) - (b.nota ?? 999)) // pior primeiro, sem dado no fim
  const painel = { background: P.PAINEL_BG, border: `1px solid ${P.BORDA}` }
  const aninhada = { background: P.ANINHADA, border: `1px solid ${P.BORDA}` }

  return (
    <div data-theme={tema}>
      <ModuloLayout titulo={L('Painel de Risco', 'Risk Panel', 'Panel de Riesgo')}
        subtitulo={L('O que pode dar problema de dinheiro — nota de 0 a 100 por risco, com o porquê em números', 'What could cause money trouble — a 0–100 score per risk, with the reason in numbers', 'Lo que puede causar problemas de dinero — nota de 0 a 100 por riesgo, con el porqué en números')}
        headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
        botaoExtra={<ThemeToggle />}>
        <div className="space-y-4" style={{ color: P.TEXTO }}>
          <div className="rounded-2xl p-4 md:p-5 axi-card-premium3d axi-card-faixa flex items-center gap-4 flex-wrap" style={painel}>
            <ShieldAlert size={28} style={{ color: cor(nivelDaNota(geral)) }} aria-hidden />
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-semibold">{L('Nota geral de risco', 'Overall risk score', 'Nota general de riesgo')}</p>
              <p className="text-xs" style={{ color: P.CINZA }}>{L('Média das notas com dado. 100 = nenhum risco à vista. Médias mensais dos últimos 12 meses — os mesmos números que a IA usa.', 'Average of scores with data. 100 = no risk in sight. Monthly averages of the last 12 months — the same numbers the AI uses.', 'Promedio de las notas con dato. 100 = ningún riesgo a la vista. Promedios mensuales de los últimos 12 meses — los mismos números que usa la IA.')}</p>
            </div>
            <p className="text-3xl font-black" style={{ color: cor(nivelDaNota(geral)) }}>{carregando ? '…' : geral == null ? '—' : `${geral}/100`}</p>
          </div>

          {falhou && (
            <div className="rounded-xl px-4 py-3 text-sm axi-card-premium3d axi-card-faixa" style={{ ...aninhada, color: P.RISCO }}>
              {L('Não foi possível ler os dados agora. Tente de novo em instantes.', 'Could not read the data now. Try again shortly.', 'No se pudieron leer los datos ahora. Intente de nuevo en instantes.')}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ordenados.map((i) => (
              <div key={i.chave} className="rounded-2xl p-4 axi-card-premium3d axi-card-faixa flex flex-col gap-2" style={painel}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{i.titulo}</p>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap" style={{ background: cor(i.nivel), color: '#ffffff' }}>
                    {i.nota == null ? rotulo(i.nivel) : `${i.nota} · ${rotulo(i.nivel)}`}
                  </span>
                </div>
                <p className="text-xs rounded-lg px-3 py-2 axi-card-premium3d axi-card-faixa" style={aninhada}>{i.explicacao}</p>
                <Link href={i.rota} className="self-start inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: temaClaro ? '#0f7a5a' : '#101b3d', color: '#ffffff' }}>
                  {L('Ver detalhes', 'See details', 'Ver detalles')} <ArrowRight size={12} aria-hidden />
                </Link>
              </div>
            ))}
          </div>

          {num && (() => {
            const brl = (v: number) => v.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
            const dias = (d: number | null) => (d == null ? '—' : L(`${d} dias`, `${d} days`, `${d} días`))
            const saidaMensal = num.custoFixoMensal + num.custoVariavelMensal + num.impostoMensal + num.jurosMensal
            const aguenta = mesesDeCaixa(num.caixa, saidaMensal)
            const ciclo = prazos.pmr != null && prazos.pmp != null ? prazos.pmr - prazos.pmp : null
            const metricas = [
              { t: L('Margem de lucro', 'Profit margin', 'Margen de ganancia'), v: num.margemPct == null ? '—' : `${num.margemPct.toFixed(1)}%`, d: L('Lucro ÷ receita, média mensal de 12 meses.', 'Profit ÷ revenue, 12-month monthly average.', 'Ganancia ÷ ingresos, promedio mensual de 12 meses.') },
              { t: L('Ponto de equilíbrio', 'Break-even', 'Punto de equilibrio'), v: num.pontoEquilibrioMensal == null ? '—' : `${brl(num.pontoEquilibrioMensal)}/${L('mês', 'mo', 'mes')}`, d: L('Quanto precisa vender por mês para não ter prejuízo.', 'How much you must sell per month to avoid a loss.', 'Cuánto debe vender por mes para no tener pérdida.') },
              { t: L('Prazo médio para receber', 'Average collection period', 'Plazo medio de cobro'), v: dias(prazos.pmr), d: L('Da emissão até o dinheiro entrar (contas recebidas em 12 meses).', 'From issue until the money arrives (bills received in 12 months).', 'De la emisión hasta que entra el dinero (cuentas cobradas en 12 meses).') },
              { t: L('Prazo médio para pagar', 'Average payment period', 'Plazo medio de pago'), v: dias(prazos.pmp), d: L('Da emissão até você pagar (contas pagas em 12 meses).', 'From issue until you pay (bills paid in 12 months).', 'De la emisión hasta que usted paga (cuentas pagadas en 12 meses).') },
              { t: L('Ciclo de caixa', 'Cash cycle', 'Ciclo de caja'), v: ciclo == null ? '—' : dias(ciclo), d: ciclo == null ? L('Precisa de contas recebidas e pagas para calcular.', 'Needs received and paid bills to calculate.', 'Necesita cuentas cobradas y pagadas para calcular.') : ciclo > 0 ? L('Você paga antes de receber: esse é o tempo que o caixa banca a operação.', 'You pay before you get paid: this is how long cash funds the operation.', 'Usted paga antes de cobrar: es el tiempo que la caja financia la operación.') : L('Você recebe antes de pagar — bom para o caixa.', 'You get paid before you pay — good for cash.', 'Usted cobra antes de pagar — bueno para la caja.') },
              { t: L('Quanto o caixa aguenta', 'Cash runway', 'Cuánto aguanta la caja'), v: aguenta == null ? '—' : L(`${aguenta} meses`, `${aguenta} months`, `${aguenta} meses`), d: L(`Caixa ${brl(num.caixa)} ÷ saídas de ${brl(saidaMensal)}/mês, se nenhuma venda entrar.`, `Cash ${brl(num.caixa)} ÷ outflows of ${brl(saidaMensal)}/mo, if no sale comes in.`, `Caja ${brl(num.caixa)} ÷ salidas de ${brl(saidaMensal)}/mes, si no entra ninguna venta.`) },
            ]
            return (
              <div className="rounded-2xl p-4 md:p-5 axi-card-premium3d axi-card-faixa" style={painel}>
                <p className="text-sm font-semibold mb-3">{L('Métricas do CFO', 'CFO metrics', 'Métricas del CFO')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {metricas.map((m) => (
                    <div key={m.t} className="rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={aninhada}>
                      <p className="text-xs uppercase tracking-wider" style={{ color: P.CINZA }}>{m.t}</p>
                      <p className="text-lg font-black" style={{ color: temaClaro ? '#101b3d' : P.OK }}>{m.v}</p>
                      <p className="text-[11px] mt-1" style={{ color: P.CINZA }}>{m.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </ModuloLayout>
    </div>
  )
}
