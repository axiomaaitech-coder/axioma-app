'use client'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import SeletorPeriodo from '../../../../components/SeletorPeriodo'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { listarPlanoDeContas, type ContaContabil } from '../../../../lib/contabilidadeHelpers'
import { listarLancamentos, listarPartidas, grupoDre } from '../../../../lib/contabilidadeRelatoriosHelpers'
import { fBRL2, resolverPeriodo, type Periodo, type PeriodoPreset } from '../../../../lib/cfoCore'

type Idioma3 = 'pt' | 'en' | 'es'
type Grupo = '6' | '7' | '8' | '9' | '10'

const TEAL = '#14b8a6'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

export default function DrePage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [contas, setContas] = useState<ContaContabil[]>([])
  const [loading, setLoading] = useState(true)

  const [preset, setPreset] = useState<PeriodoPreset>('mes_atual')
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo('mes_atual'))
  const periodo = resolverPeriodo(preset, personalizado)

  const [totaisPorConta, setTotaisPorConta] = useState<Record<string, { debito: number; credito: number }>>({})
  const [grupoAberto, setGrupoAberto] = useState<Grupo | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (empId) setContas(await listarPlanoDeContas(empId))
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (!empresaId) return
    (async () => {
      const lancs = await listarLancamentos(empresaId, periodo.inicio, periodo.fim)
      const partidas = await listarPartidas(empresaId, lancs.map((l) => l.id))
      const acc: Record<string, { debito: number; credito: number }> = {}
      for (const p of partidas) {
        if (!acc[p.conta_id]) acc[p.conta_id] = { debito: 0, credito: 0 }
        if (p.tipo === 'debito') acc[p.conta_id].debito += Number(p.valor)
        else acc[p.conta_id].credito += Number(p.valor)
      }
      setTotaisPorConta(acc)
    })()
  }, [empresaId, periodo.inicio, periodo.fim])

  // Contas de cada grupo com o valor já no sinal que compõe a DRE — receita
  // líquida do crédito (o que aumenta receita); custo/despesa líquida do
  // débito (o que aumenta custo/despesa). Contas contra (ex: Devoluções,
  // natureza devedora dentro do grupo 6.x) saem naturalmente negativas.
  const contasPorGrupo = useMemo(() => {
    const mapa: Record<Grupo, { conta: ContaContabil; valor: number }[]> = { '6': [], '7': [], '8': [], '9': [], '10': [] }
    for (const c of contas) {
      const g = grupoDre(c.codigo)
      const t = totaisPorConta[c.id]
      if (!g || !t) continue
      const valor = g === '6' ? t.credito - t.debito : t.debito - t.credito
      if (valor !== 0) mapa[g].push({ conta: c, valor })
    }
    for (const g of Object.keys(mapa) as Grupo[]) mapa[g].sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))
    return mapa
  }, [contas, totaisPorConta])

  const somaGrupo = (g: Grupo) => contasPorGrupo[g].reduce((s, l) => s + l.valor, 0)

  const receitaBruta = somaGrupo('6')
  const cmv = somaGrupo('7')
  const lucroBruto = receitaBruta - cmv
  const despesasOperacionais = somaGrupo('8')
  const despesasFinanceiras = somaGrupo('9')
  const impostos = somaGrupo('10')
  const resultadoLiquido = lucroBruto - despesasOperacionais - despesasFinanceiras - impostos

  const semDados = Object.keys(totaisPorConta).length === 0

  type LinhaDre = { key: Grupo | null; label: string; valor: number; total?: boolean; sinal?: '−' }
  const linhas: LinhaDre[] = [
    { key: '6', label: L('Receita Bruta', 'Gross Revenue', 'Ingreso Bruto'), valor: receitaBruta },
    { key: '7', label: L('CMV / Custos', 'COGS / Costs', 'CMV / Costos'), valor: cmv, sinal: '−' },
    { key: null, label: L('= Lucro Bruto', '= Gross Profit', '= Utilidad Bruta'), valor: lucroBruto, total: true },
    { key: '8', label: L('Despesas Operacionais', 'Operating Expenses', 'Gastos Operativos'), valor: despesasOperacionais, sinal: '−' },
    { key: '9', label: L('Despesas Financeiras', 'Financial Expenses', 'Gastos Financieros'), valor: despesasFinanceiras, sinal: '−' },
    { key: '10', label: L('Impostos', 'Taxes', 'Impuestos'), valor: impostos, sinal: '−' },
    { key: null, label: L('= Resultado Líquido', '= Net Result', '= Resultado Neto'), valor: resultadoLiquido, total: true },
  ]

  return (
    <ModuloLayout
      titulo={L('DRE — Demonstrativo de Resultado', 'Income Statement', 'Estado de Resultados')}
      subtitulo={L('Calculado direto do Livro Razão contábil — receita, custo e despesa vêm do ledger, não de planilha solta', 'Calculated straight from the accounting ledger — revenue, cost and expense come from the ledger, not a loose spreadsheet', 'Calculado directo del libro mayor contable — ingreso, costo y gasto vienen del libro mayor, no de una planilla suelta')}
    >
      <div className="mb-5">
        <SeletorPeriodo preset={preset} onChangePreset={setPreset} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={TEAL} lang={lang} />
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : semDados ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhum lançamento no período selecionado.', 'No entries in the selected period.', 'Ningún asiento en el período seleccionado.')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 420 }}>
            <tbody>
              {linhas.map((l, i) => {
                const aberto = l.key !== null && grupoAberto === l.key
                const contasDoGrupo = l.key !== null ? contasPorGrupo[l.key] : []
                return (
                  <Fragment key={`linha-${i}`}>
                    <tr
                      onClick={() => l.key !== null && setGrupoAberto(aberto ? null : l.key)}
                      className={l.key !== null ? 'cursor-pointer' : ''}
                      style={{ borderTop: l.total ? `1px solid ${TEAL}40` : '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <td className="py-2.5 flex items-center gap-1.5" style={{ color: l.total ? TITULO : TEXTO, fontWeight: l.total ? 800 : 600 }}>
                        {l.key !== null && (
                          <motion.span animate={{ rotate: aberto ? 180 : 0 }} transition={{ duration: 0.15 }}>
                            <ChevronDown size={13} style={{ color: CINZA }} />
                          </motion.span>
                        )}
                        {l.label}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap" style={{ color: l.total ? (l.valor >= 0 ? VERDE : VERMELHO) : TEXTO, fontWeight: l.total ? 800 : 600 }}>
                        {l.sinal && '− '}R$ {fBRL2(Math.abs(l.valor))}
                      </td>
                    </tr>
                    {l.key !== null && (
                      <tr>
                        <td colSpan={2} style={{ padding: 0 }}>
                          <AnimatePresence>
                            {aberto && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                                <div className="pl-5 pb-2">
                                  {contasDoGrupo.length === 0 ? (
                                    <p className="text-xs py-1" style={{ color: CINZA }}>{L('Sem contas neste grupo no período.', 'No accounts in this group for the period.', 'Sin cuentas en este grupo en el período.')}</p>
                                  ) : contasDoGrupo.map((c) => (
                                    <div key={c.conta.id} onClick={(e) => { e.stopPropagation(); router.push(`/contabilidade/razao?conta=${c.conta.id}`) }}
                                      className="flex items-center justify-between py-1.5 text-xs cursor-pointer hover:underline" style={{ color: CINZA }}>
                                      <span>{c.conta.codigo} — {c.conta.nome}</span>
                                      <span style={{ color: TEXTO }}>R$ {fBRL2(c.valor)}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </ModuloLayout>
  )
}
