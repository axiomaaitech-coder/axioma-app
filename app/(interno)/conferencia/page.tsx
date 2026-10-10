'use client'
// Conferência entre módulos — DRE × Contabilidade (competência), Contas a Pagar/Receber × Fluxo
// (caixa), mês a mês, e as PRÉVIAS dos casos históricos que precisam de reprocessamento.
// Só leitura: nenhuma correção é feita daqui sem aprovação explícita caso a caso.
import { useCallback, useEffect, useState } from 'react'
import { Check, X, AlertTriangle } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { ThemeToggle } from '../../../components/ThemeToggle'
import { useThemeAxioma } from '../../../lib/ThemeContext'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import { carregarConferencia, type LinhaConferencia, type CasoReprocessar, type Par } from '../../../lib/conferenciaHelpers'
import { hojeISO } from '../../../lib/datas'

type Idioma3 = 'pt' | 'en' | 'es'
const PALETA = {
  dark: { VERDE: '#2ecc9b', VERMELHO: '#f87171', AMBAR: '#fbbf24', CINZA: '#a3b1c2', TEXTO: '#e6edf5', PAINEL_BG: 'rgba(10,20,36,0.7)', ANINHADA: 'rgba(2,8,16,0.5)', BORDA: 'rgba(255,255,255,0.08)' },
  xms: { VERDE: '#0f7d5c', VERMELHO: '#d93848', AMBAR: '#b45309', CINZA: '#374151', TEXTO: '#101b3d', PAINEL_BG: '#f6f7c4', ANINHADA: 'rgba(245,238,220,0.7)', BORDA: 'rgba(16,27,61,0.12)' },
} as const

export default function ConferenciaPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const local = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const fmt = (v: number) => v.toLocaleString(local, { style: 'currency', currency: 'BRL' })
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const P = PALETA[tema]
  const anoHoje = Number(hojeISO().slice(0, 4))
  const [ano, setAno] = useState(anoHoje)
  const [meses, setMeses] = useState<LinhaConferencia[]>([])
  const [casos, setCasos] = useState<CasoReprocessar[]>([])
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)

  const carregar = useCallback(async (a: number) => {
    setCarregando(true)
    const empresaId = await obterEmpresaAtiva()
    if (!empresaId) { setCarregando(false); return }
    const fim = a === anoHoje ? hojeISO() : `${a}-12-31`
    const r = await carregarConferencia(empresaId, `${a}-01-01`, fim, lang)
    setMeses(r.meses); setCasos(r.casos); setFalhou(r.falhou); setCarregando(false)
  }, [anoHoje, lang])
  useEffect(() => { void carregar(ano) }, [ano, carregar])

  const painel = { background: P.PAINEL_BG, border: `1px solid ${P.BORDA}` }
  const aninhada = { background: P.ANINHADA, border: `1px solid ${P.BORDA}` }
  const Celula = ({ p }: { p: Par }) => (
    <td className="px-2 py-1.5 text-right whitespace-nowrap" title={`${fmt(p.a)} × ${fmt(p.b)}`}>
      <span className="inline-flex items-center gap-1 font-semibold" style={{ color: p.ok ? P.VERDE : P.VERMELHO }}>
        {p.ok ? <Check size={12} /> : <X size={12} />}{p.ok ? fmt(p.a) : fmt(p.diferenca)}
      </span>
    </td>
  )
  const NOME_CASO: Record<CasoReprocessar['codigo'], string> = {
    D3: L('Pagamento que não chegou ao Fluxo/Contabilidade', 'Payment that never reached Cash Flow/Accounting', 'Pago que no llegó al Flujo/Contabilidad'),
    D4: L('Parte de um pagamento sem rastro', 'Part of a payment with no trace', 'Parte de un pago sin rastro'),
    D5: L('Receita fora da Contabilidade', 'Revenue missing from Accounting', 'Ingreso fuera de Contabilidad'),
    D7: L('Receita pendente sem conta a receber', 'Pending revenue with no receivable', 'Ingreso pendiente sin cuenta por cobrar'),
  }
  const grupos = (['D3', 'D4', 'D5', 'D7'] as const).map((c) => ({ codigo: c, itens: casos.filter((x) => x.codigo === c) })).filter((g) => g.itens.length)

  return (
    <div data-theme={tema}>
      <ModuloLayout titulo={L('Conferência entre módulos', 'Cross-module reconciliation', 'Conciliación entre módulos')}
        subtitulo={L('Os números batem? DRE × Contabilidade, contas × Fluxo de Caixa — mês a mês', 'Do the numbers match? P&L × Accounting, bills × Cash Flow — month by month', '¿Cuadran los números? EERR × Contabilidad, cuentas × Flujo de Caja — mes a mes')}
        headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
        botaoExtra={<ThemeToggle />}>
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={painel}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-xs" style={{ color: P.CINZA }}>{L('Só compara números do mesmo critério: competência com competência, caixa com caixa. ✅ = bate · ❌ = diferença em R$.', 'Only compares numbers on the same basis: accrual with accrual, cash with cash. ✅ = matches · ❌ = difference in R$.', 'Solo compara números del mismo criterio: devengo con devengo, caja con caja. ✅ = cuadra · ❌ = diferencia en R$.')}</p>
              <div className="flex gap-1">
                {[anoHoje - 1, anoHoje].map((a) => (
                  <button key={a} onClick={() => setAno(a)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: a === ano ? '#0f7a5a' : '#101b3d', color: '#fff' }}>{a}</button>
                ))}
              </div>
            </div>
            {falhou && <p role="alert" className="text-xs font-semibold mb-2" style={{ color: P.VERMELHO }}>{L('Alguns dados não carregaram — a conferência pode estar incompleta.', 'Some data did not load — the reconciliation may be incomplete.', 'Algunos datos no cargaron — la conciliación puede estar incompleta.')}</p>}
            {carregando ? <p className="text-xs py-6 text-center" style={{ color: P.CINZA }}>{L('Conferindo…', 'Reconciling…', 'Conciliando…')}</p> : (
              <div className="overflow-x-auto rounded-xl" style={aninhada}>
                <table className="w-full text-xs min-w-[640px]" style={{ color: P.TEXTO }}>
                  <thead>
                    <tr style={{ color: P.CINZA }}>
                      <th className="px-2 py-2 text-left">{L('Mês', 'Month', 'Mes')}</th>
                      <th className="px-2 py-2 text-right">{L('Receita: DRE × Contabilidade', 'Revenue: P&L × Accounting', 'Ingreso: EERR × Contabilidad')}</th>
                      <th className="px-2 py-2 text-right">{L('Custo: DRE × Contabilidade', 'Cost: P&L × Accounting', 'Costo: EERR × Contabilidad')}</th>
                      <th className="px-2 py-2 text-right">{L('Pago × Fluxo', 'Paid × Cash Flow', 'Pagado × Flujo')}</th>
                      <th className="px-2 py-2 text-right">{L('Recebido × Fluxo', 'Received × Cash Flow', 'Cobrado × Flujo')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meses.map((m) => (
                      <tr key={m.mes} style={{ borderTop: `1px solid ${P.BORDA}` }}>
                        <td className="px-2 py-1.5 font-semibold">{new Date(`${m.mes}-01T00:00:00`).toLocaleDateString(local, { month: 'short', year: 'numeric' })}</td>
                        <Celula p={m.receitaDreXContabil} /><Celula p={m.custoDreXContabil} /><Celula p={m.pagoXFluxo} /><Celula p={m.recebidoXFluxo} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl p-4" style={painel}>
            <p className="text-sm font-bold mb-1" style={{ color: P.TEXTO }}>{L('Casos antigos para reprocessar — prévia', 'Old cases to reprocess — preview', 'Casos antiguos para reprocesar — vista previa')}</p>
            <p className="text-xs mb-3" style={{ color: P.CINZA }}>{L('Isto é só uma prévia: mostra o registro, o que muda em cada módulo e o risco de duplicar. Nada é alterado sem a sua aprovação, caso a caso.', 'This is only a preview: it shows the record, what changes in each module and the duplication risk. Nothing changes without your approval, case by case.', 'Esto es solo una vista previa: muestra el registro, qué cambia en cada módulo y el riesgo de duplicar. Nada cambia sin su aprobación, caso por caso.')}</p>
            {!carregando && grupos.length === 0 && <p className="text-xs" style={{ color: P.VERDE }}>{L('Nenhum caso pendente.', 'No pending cases.', 'Ningún caso pendiente.')}</p>}
            <div className="space-y-3">
              {grupos.map((g) => (
                <details key={g.codigo} className="rounded-xl p-3" style={aninhada} open={g.itens.length <= 5}>
                  <summary className="text-xs font-bold cursor-pointer" style={{ color: P.TEXTO }}>{g.codigo} · {NOME_CASO[g.codigo]} ({g.itens.length})</summary>
                  <div className="space-y-2 mt-2">
                    {g.itens.slice(0, 50).map((c) => (
                      <div key={`${c.codigo}-${c.id}`} className="rounded-lg p-2.5 text-[11px]" style={{ border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
                        <p className="font-bold">{c.descricao} {c.data ? `· ${new Date(`${c.data}T00:00:00`).toLocaleDateString(local)}` : ''}</p>
                        <p style={{ color: P.CINZA }}>{L('Registro', 'Record', 'Registro')}: {c.tabela} · <span className="font-mono">{c.id}</span></p>
                        <p className="mt-1"><b>{L('Antes', 'Before', 'Antes')}:</b> {c.antes}</p>
                        <p><b>{L('Depois', 'After', 'Después')}:</b> {c.depois}</p>
                        <ul className="mt-1 list-disc pl-4" style={{ color: P.CINZA }}>{c.impacto.map((i) => <li key={i.modulo}><b style={{ color: P.TEXTO }}>{i.modulo}:</b> {i.efeito}</li>)}</ul>
                        {c.risco && <p className="mt-1 flex items-start gap-1 font-semibold" style={{ color: P.AMBAR }}><AlertTriangle size={12} className="mt-0.5 shrink-0" />{c.risco}</p>}
                      </div>
                    ))}
                    {g.itens.length > 50 && <p className="text-[11px]" style={{ color: P.CINZA }}>{L(`+${g.itens.length - 50} casos iguais`, `+${g.itens.length - 50} similar cases`, `+${g.itens.length - 50} casos iguales`)}</p>}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </ModuloLayout>
    </div>
  )
}
