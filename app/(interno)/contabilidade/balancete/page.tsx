'use client'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import SeletorPeriodo from '../../../../components/SeletorPeriodo'
import { LetreiroAxioma } from '../../../../components/LetreiroAxioma'
import { CentroCompartilhamento, BotaoCompartilhar } from '../../../../components/CentroCompartilhamento'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { listarPlanoDeContas, type ContaContabil, type TipoContaContabil } from '../../../../lib/contabilidadeHelpers'
import { listarLancamentos, listarPartidas, saldoNatural } from '../../../../lib/contabilidadeRelatoriosHelpers'
import { fBRL2, resolverPeriodo, type Periodo, type PeriodoPreset } from '../../../../lib/cfoCore'
import { useThemeAxioma } from '../../../../lib/ThemeContext'
import { ThemeToggle } from '../../../../components/ThemeToggle'
import { AnimatedNumber } from '../../../../components/AnimatedNumber'

type Idioma3 = 'pt' | 'en' | 'es'

// Paleta por tema — "dark" é o padrão de sempre (inalterado). "xms" (Tema
// Claro) usa as mesmas cores 600/700 já padronizadas no resto do Axioma.
const PALETA = {
  dark: { TEAL: '#14b8a6', VERDE: '#34d399', VERMELHO: '#f87171', CINZA: '#5a7a9a', TEXTO: '#c8d8f0', TITULO: '#e2ecf7' },
  // TEAL não é cor da nossa paleta padrão — no Claro vira verde-menta
  // (nossa cor de destaque/CTA, tema-tokens.md §1.1). CINZA sobe pra
  // #374151, mesmo padrão já usado nos demais módulos.
  xms: { TEAL: '#2ecc9b', VERDE: '#16a97d', VERMELHO: '#ff5a6b', CINZA: '#374151', TEXTO: '#101b3d', TITULO: '#101b3d' },
} as const

const ORDEM_TIPO: TipoContaContabil[] = ['ativo', 'passivo', 'patrimonio', 'receita', 'despesa']

export default function BalancetePage() {
  const { idioma } = useLanguage()
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const { TEAL, VERDE, VERMELHO, CINZA, TEXTO, TITULO } = PALETA[tema]
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
  const [shareAberto, setShareAberto] = useState(false)

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
    <div data-theme={tema} style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
    <ModuloLayout
      titulo={L('Balancete de Verificação', 'Trial Balance', 'Balance de Comprobación')}
      subtitulo={L('Saldo de todas as contas no período, agrupado por tipo — direto do ledger', 'Balance of every account in the period, grouped by type — straight from the ledger', 'Saldo de todas las cuentas en el período, agrupado por tipo — directo del libro mayor')}
      headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
      botaoExtra={
        <>
          <BotaoCompartilhar onClick={() => setShareAberto(true)} texto={L('Compartilhar', 'Share', 'Compartir')} cor={TEAL} corTexto={TEAL} solido={temaClaro} />
          <ThemeToggle />
        </>
      }
    >
      <div className="mb-5">
        <SeletorPeriodo preset={preset} onChangePreset={setPreset} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={TEAL} lang={lang} temaClaro={temaClaro} />
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : grupos.length === 0 ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhum lançamento no período selecionado.', 'No entries in the selected period.', 'Ningún asiento en el período seleccionado.')}</p>
      ) : (
        <>
          <div className="mb-5">
            <LetreiroAxioma id="balancete" cor={TEAL} solido={temaClaro} corDestaque="#2ecc9b" itens={[
              `${L('Débito', 'Debit', 'Débito')} R$ ${fBRL2(totalDebitoGeral)}`,
              `${L('Crédito', 'Credit', 'Crédito')} R$ ${fBRL2(totalCreditoGeral)}`,
              fecha ? `${L('Balancete fechado', 'Trial balance closed', 'Balance cerrado')} ✓` : `${L('Não fecha', "Doesn't close", 'No cierra')} ⚠️`,
            ]} />
          </div>
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
                    <tr style={{ borderTop: '1px solid var(--axi-border)' }}>
                      <td colSpan={5} className="py-2 font-black uppercase tracking-wide" style={{ color: TEAL, fontSize: 10 }}>{TIPO_LABEL[g.tipo]}</td>
                    </tr>
                    {g.linhas.map((l) => (
                      <tr key={l.conta.id} onClick={() => router.push(`/contabilidade/razao?conta=${l.conta.id}`)} className="cursor-pointer" style={{ borderTop: '1px solid var(--axi-border)' }}>
                        <td className="py-2 whitespace-nowrap" style={{ color: CINZA }}>{l.conta.codigo}</td>
                        <td className="py-2" style={{ color: TEXTO }}>{l.conta.nome}</td>
                        <td className="text-right py-2 whitespace-nowrap" style={{ color: TEXTO }}>{l.debito > 0 ? <AnimatedNumber value={`R$ ${fBRL2(l.debito)}`} /> : '—'}</td>
                        <td className="text-right py-2 whitespace-nowrap" style={{ color: TEXTO }}>{l.credito > 0 ? <AnimatedNumber value={`R$ ${fBRL2(l.credito)}`} /> : '—'}</td>
                        <td className="text-right py-2 font-bold whitespace-nowrap" style={{ color: l.saldo >= 0 ? VERDE : VERMELHO }}><AnimatedNumber value={`${l.saldo < 0 ? '− ' : ''}R$ ${fBRL2(Math.abs(l.saldo))}`} /></td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '1px solid var(--axi-border)' }}>
                      <td colSpan={2} className="py-1.5 text-right font-semibold" style={{ color: CINZA }}>{L('Subtotal', 'Subtotal', 'Subtotal')}</td>
                      <td className="text-right py-1.5 font-semibold whitespace-nowrap" style={{ color: TEXTO }}><AnimatedNumber value={`R$ ${fBRL2(g.totalDebito)}`} /></td>
                      <td className="text-right py-1.5 font-semibold whitespace-nowrap" style={{ color: TEXTO }}><AnimatedNumber value={`R$ ${fBRL2(g.totalCredito)}`} /></td>
                      <td />
                    </tr>
                  </Fragment>
                ))}
                <tr style={{ borderTop: `2px solid ${TEAL}50` }}>
                  <td colSpan={2} className="py-2 text-right font-black" style={{ color: TITULO }}>{L('TOTAL GERAL', 'GRAND TOTAL', 'TOTAL GENERAL')}</td>
                  <td className="text-right py-2 font-black whitespace-nowrap" style={{ color: TITULO }}><AnimatedNumber value={`R$ ${fBRL2(totalDebitoGeral)}`} /></td>
                  <td className="text-right py-2 font-black whitespace-nowrap" style={{ color: TITULO }}><AnimatedNumber value={`R$ ${fBRL2(totalCreditoGeral)}`} /></td>
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

      <CentroCompartilhamento
        aberto={shareAberto}
        onFechar={() => setShareAberto(false)}
        lang={lang}
        textoResumo={[
          `🚀 AXIOMA AI.TECH — ${L('Balancete de Verificação', 'Trial Balance', 'Balance de Comprobación')}`,
          `💰 ${L('Débito', 'Debit', 'Débito')}: R$ ${fBRL2(totalDebitoGeral)}`,
          `💰 ${L('Crédito', 'Credit', 'Crédito')}: R$ ${fBRL2(totalCreditoGeral)}`,
          fecha ? `✅ ${L('Balancete fechado', 'Trial balance closed', 'Balance cerrado')}` : `⚠️ ${L('Não fecha', "Doesn't close", 'No cierra')}`,
        ].join('\n')}
        assunto={`${L('Balancete de Verificação', 'Trial Balance', 'Balance de Comprobación')} — Axioma`}
        cor={TEAL}
      />
    </ModuloLayout>
    </div>
  )
}
