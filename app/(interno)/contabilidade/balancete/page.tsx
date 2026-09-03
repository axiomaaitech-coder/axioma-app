'use client'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import SeletorPeriodo from '../../../../components/SeletorPeriodo'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { listarPlanoDeContas, type ContaContabil, type TipoContaContabil } from '../../../../lib/contabilidadeHelpers'
import { listarLancamentos, listarPartidas, saldoNatural } from '../../../../lib/contabilidadeRelatoriosHelpers'
import { fBRL2, resolverPeriodo, type Periodo, type PeriodoPreset } from '../../../../lib/cfoCore'

type Idioma3 = 'pt' | 'en' | 'es'

const TEAL = '#14b8a6'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

const ORDEM_TIPO: TipoContaContabil[] = ['ativo', 'passivo', 'patrimonio', 'receita', 'despesa']

export default function BalancetePage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()

  const TIPO_LABEL: Record<TipoContaContabil, string> = {
    ativo: L('Ativo', 'Asset', 'Activo'),
    passivo: L('Passivo', 'Liability', 'Pasivo'),
    patrimonio: L('Patrimônio Líquido', 'Equity', 'Patrimonio Líquido'),
    receita: L('Receita', 'Revenue', 'Ingreso'),
    despesa: L('Despesa', 'Expense', 'Gasto'),
  }

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [contas, setContas] = useState<ContaContabil[]>([])
  const [loading, setLoading] = useState(true)

  const [preset, setPreset] = useState<PeriodoPreset>('mes_atual')
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo('mes_atual'))
  const periodo = resolverPeriodo(preset, personalizado)

  const [totaisPorConta, setTotaisPorConta] = useState<Record<string, { debito: number; credito: number }>>({})

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

  const totalDebitoGeral = Object.values(totaisPorConta).reduce((s, t) => s + t.debito, 0)
  const totalCreditoGeral = Object.values(totaisPorConta).reduce((s, t) => s + t.credito, 0)
  const fecha = Math.round((totalDebitoGeral - totalCreditoGeral) * 100) === 0

  const grupos = useMemo(() => {
    return ORDEM_TIPO.map((tipo) => {
      const linhas = contas
        .filter((c) => c.tipo === tipo && totaisPorConta[c.id])
        .map((c) => {
          const t = totaisPorConta[c.id]
          return { conta: c, debito: t.debito, credito: t.credito, saldo: saldoNatural(c.natureza, t.debito, t.credito) }
        })
        .sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))
      return { tipo, linhas, totalDebito: linhas.reduce((s, l) => s + l.debito, 0), totalCredito: linhas.reduce((s, l) => s + l.credito, 0) }
    }).filter((g) => g.linhas.length > 0)
  }, [contas, totaisPorConta])

  return (
    <ModuloLayout
      titulo={L('Balancete de Verificação', 'Trial Balance', 'Balance de Comprobación')}
      subtitulo={L('Saldo de todas as contas no período, agrupado por tipo — direto do ledger', 'Balance of every account in the period, grouped by type — straight from the ledger', 'Saldo de todas las cuentas en el período, agrupado por tipo — directo del libro mayor')}
    >
      <div className="mb-5">
        <SeletorPeriodo preset={preset} onChangePreset={setPreset} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={TEAL} lang={lang} />
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : grupos.length === 0 ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhum lançamento no período selecionado.', 'No entries in the selected period.', 'Ningún asiento en el período seleccionado.')}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 560 }}>
              <thead>
                <tr style={{ color: CINZA }}>
                  <th className="text-left py-2 font-semibold">{L('Código', 'Code', 'Código')}</th>
                  <th className="text-left py-2 font-semibold">{L('Conta', 'Account', 'Cuenta')}</th>
                  <th className="text-right py-2 font-semibold whitespace-nowrap">{L('Débito', 'Debit', 'Débito')}</th>
                  <th className="text-right py-2 font-semibold whitespace-nowrap">{L('Crédito', 'Credit', 'Crédito')}</th>
                  <th className="text-right py-2 font-semibold whitespace-nowrap">{L('Saldo', 'Balance', 'Saldo')}</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => (
                  <Fragment key={g.tipo}>
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <td colSpan={5} className="py-2 font-black uppercase tracking-wide" style={{ color: TEAL, fontSize: 10 }}>{TIPO_LABEL[g.tipo]}</td>
                    </tr>
                    {g.linhas.map((l) => (
                      <tr key={l.conta.id} onClick={() => router.push(`/contabilidade/razao?conta=${l.conta.id}`)} className="cursor-pointer" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td className="py-2 whitespace-nowrap" style={{ color: CINZA }}>{l.conta.codigo}</td>
                        <td className="py-2" style={{ color: TEXTO }}>{l.conta.nome}</td>
                        <td className="text-right py-2 whitespace-nowrap" style={{ color: TEXTO }}>{l.debito > 0 ? `R$ ${fBRL2(l.debito)}` : '—'}</td>
                        <td className="text-right py-2 whitespace-nowrap" style={{ color: TEXTO }}>{l.credito > 0 ? `R$ ${fBRL2(l.credito)}` : '—'}</td>
                        <td className="text-right py-2 font-bold whitespace-nowrap" style={{ color: l.saldo >= 0 ? VERDE : VERMELHO }}>R$ {fBRL2(l.saldo)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td colSpan={2} className="py-1.5 text-right font-semibold" style={{ color: CINZA }}>{L('Subtotal', 'Subtotal', 'Subtotal')}</td>
                      <td className="text-right py-1.5 font-semibold whitespace-nowrap" style={{ color: TEXTO }}>R$ {fBRL2(g.totalDebito)}</td>
                      <td className="text-right py-1.5 font-semibold whitespace-nowrap" style={{ color: TEXTO }}>R$ {fBRL2(g.totalCredito)}</td>
                      <td />
                    </tr>
                  </Fragment>
                ))}
                <tr style={{ borderTop: `2px solid ${TEAL}50` }}>
                  <td colSpan={2} className="py-2 text-right font-black" style={{ color: TITULO }}>{L('TOTAL GERAL', 'GRAND TOTAL', 'TOTAL GENERAL')}</td>
                  <td className="text-right py-2 font-black whitespace-nowrap" style={{ color: TITULO }}>R$ {fBRL2(totalDebitoGeral)}</td>
                  <td className="text-right py-2 font-black whitespace-nowrap" style={{ color: TITULO }}>R$ {fBRL2(totalCreditoGeral)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold w-fit"
            style={{ background: fecha ? `${VERDE}15` : `${VERMELHO}15`, color: fecha ? VERDE : VERMELHO }}>
            {fecha ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {fecha
              ? L('Balancete fechado: débito total = crédito total', 'Trial balance closed: total debit = total credit', 'Balance cerrado: débito total = crédito total')
              : L('Atenção: débito total ≠ crédito total', 'Warning: total debit ≠ total credit', 'Atención: débito total ≠ crédito total')}
          </div>
        </>
      )}
    </ModuloLayout>
  )
}
