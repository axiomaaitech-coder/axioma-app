'use client'
import { Suspense, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import SeletorPeriodo from '../../../../components/SeletorPeriodo'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { listarPlanoDeContas, type ContaContabil } from '../../../../lib/contabilidadeHelpers'
import {
  listarLancamentos, listarPartidas, saldoNatural, diaAnterior, origemLabel,
  type LancamentoContabilRow, type PartidaRow,
} from '../../../../lib/contabilidadeRelatoriosHelpers'
import { fBRL2, resolverPeriodo, type Periodo, type PeriodoPreset } from '../../../../lib/cfoCore'

type Idioma3 = 'pt' | 'en' | 'es'

const TEAL = '#14b8a6'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

// useSearchParams exige Suspense no App Router (mesmo padrão de pdv/cadastro).
export default function RazaoPage() {
  return (
    <Suspense fallback={null}>
      <RazaoInner />
    </Suspense>
  )
}

function RazaoInner() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const searchParams = useSearchParams()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [contas, setContas] = useState<ContaContabil[]>([])
  const [contaId, setContaId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [carregandoExtrato, setCarregandoExtrato] = useState(false)

  const [preset, setPreset] = useState<PeriodoPreset>('mes_atual')
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo('mes_atual'))
  const periodo = resolverPeriodo(preset, personalizado)

  const [saldoAnterior, setSaldoAnterior] = useState(0)
  const [linhas, setLinhas] = useState<{ lancamento: LancamentoContabilRow; partida: PartidaRow; saldo: number }[]>([])

  const [modalLancamento, setModalLancamento] = useState<LancamentoContabilRow | null>(null)
  const [partidasModal, setPartidasModal] = useState<PartidaRow[]>([])

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (empId) {
        const lista = await listarPlanoDeContas(empId)
        setContas(lista)
        const daUrl = searchParams.get('conta')
        if (daUrl && lista.some((c) => c.id === daUrl)) setContaId(daUrl)
        else if (lista.length > 0) setContaId(lista[0].id)
      }
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!empresaId || !contaId) { setLinhas([]); setSaldoAnterior(0); return }
    const conta = contas.find((c) => c.id === contaId)
    if (!conta) return
    (async () => {
      setCarregandoExtrato(true)
      const [antes, doPeriodo] = await Promise.all([
        listarLancamentos(empresaId, undefined, diaAnterior(periodo.inicio)),
        listarLancamentos(empresaId, periodo.inicio, periodo.fim),
      ])
      const partidasAntes = await listarPartidas(empresaId, antes.map((l) => l.id), contaId)
      const debitoAntes = partidasAntes.filter((p) => p.tipo === 'debito').reduce((s, p) => s + Number(p.valor), 0)
      const creditoAntes = partidasAntes.filter((p) => p.tipo === 'credito').reduce((s, p) => s + Number(p.valor), 0)
      const abertura = saldoNatural(conta.natureza, debitoAntes, creditoAntes)
      setSaldoAnterior(abertura)

      const partidasPeriodo = await listarPartidas(empresaId, doPeriodo.map((l) => l.id), contaId)
      const porLancamento = new Map(doPeriodo.map((l) => [l.id, l]))
      const ordenadas = partidasPeriodo
        .map((p) => ({ partida: p, lancamento: porLancamento.get(p.lancamento_id) }))
        .filter((x): x is { partida: PartidaRow; lancamento: LancamentoContabilRow } => !!x.lancamento)
        .sort((a, b) => a.lancamento.data.localeCompare(b.lancamento.data) || a.partida.id.localeCompare(b.partida.id))

      let saldo = abertura
      const linhasCalc = ordenadas.map(({ partida, lancamento }) => {
        saldo += saldoNatural(conta.natureza, partida.tipo === 'debito' ? Number(partida.valor) : 0, partida.tipo === 'credito' ? Number(partida.valor) : 0)
        return { lancamento, partida, saldo }
      })
      setLinhas(linhasCalc)
      setCarregandoExtrato(false)
    })()
  }, [empresaId, contaId, periodo.inicio, periodo.fim, contas])

  async function abrirLancamento(l: LancamentoContabilRow) {
    setModalLancamento(l)
    if (!empresaId) return
    const p = await listarPartidas(empresaId, [l.id])
    setPartidasModal(p)
  }

  const contaSelecionada = contas.find((c) => c.id === contaId) || null
  const contaNome = (id: string) => { const c = contas.find((x) => x.id === id); return c ? `${c.codigo} — ${c.nome}` : id }

  return (
    <ModuloLayout
      titulo={L('Livro Razão', 'General Ledger', 'Libro Mayor')}
      subtitulo={L('Extrato por conta contábil, com saldo acumulado — direto do ledger', 'Account statement with running balance — straight from the ledger', 'Extracto por cuenta contable con saldo acumulado — directo del libro mayor')}
    >
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={contaId}
          onChange={(e) => setContaId(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
          style={{ background: 'rgba(10,22,40,0.9)', border: `1px solid ${TEAL}40`, color: TEAL, minWidth: 220 }}
        >
          {contas.length === 0 && <option value="">{L('Nenhuma conta cadastrada', 'No accounts registered', 'Ninguna cuenta registrada')}</option>}
          {contas.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}
        </select>
        <SeletorPeriodo preset={preset} onChangePreset={setPreset} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={TEAL} lang={lang} />
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !contaSelecionada ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Cadastre o plano de contas para ver o Razão.', 'Set up the chart of accounts to see the ledger.', 'Registre el plan de cuentas para ver el libro mayor.')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 640 }}>
            <thead>
              <tr style={{ color: CINZA }}>
                <th className="text-left py-2 font-semibold whitespace-nowrap">{L('Data', 'Date', 'Fecha')}</th>
                <th className="text-left py-2 font-semibold">{L('Descrição', 'Description', 'Descripción')}</th>
                <th className="text-right py-2 font-semibold whitespace-nowrap">{L('Débito', 'Debit', 'Débito')}</th>
                <th className="text-right py-2 font-semibold whitespace-nowrap">{L('Crédito', 'Credit', 'Crédito')}</th>
                <th className="text-right py-2 font-semibold whitespace-nowrap">{L('Saldo', 'Balance', 'Saldo')}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <td className="py-2" colSpan={4} style={{ color: CINZA, fontStyle: 'italic' }}>{L('Saldo Anterior', 'Opening Balance', 'Saldo Anterior')}</td>
                <td className="text-right py-2 font-bold whitespace-nowrap" style={{ color: TEXTO }}>R$ {fBRL2(saldoAnterior)}</td>
              </tr>
              {carregandoExtrato && (
                <tr><td colSpan={5} className="py-4 text-center" style={{ color: CINZA }}>{L('Carregando extrato...', 'Loading statement...', 'Cargando extracto...')}</td></tr>
              )}
              {!carregandoExtrato && linhas.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center" style={{ color: CINZA }}>{L('Nenhum lançamento no período selecionado.', 'No entries in the selected period.', 'Ningún asiento en el período seleccionado.')}</td></tr>
              )}
              {linhas.map(({ lancamento, partida, saldo }) => (
                <tr key={partida.id} onClick={() => abrirLancamento(lancamento)} className="cursor-pointer" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <td className="py-2 whitespace-nowrap" style={{ color: TEXTO }}>{new Date(lancamento.data + 'T00:00:00').toLocaleDateString(localeData)}</td>
                  <td className="py-2">
                    <span style={{ color: TEXTO }}>{lancamento.descricao}</span>
                    {lancamento.estornado_por_id && (
                      <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: `${VERMELHO}20`, color: VERMELHO }}>
                        {L('ESTORNADO', 'REVERSED', 'REVERSADO')}
                      </span>
                    )}
                  </td>
                  <td className="text-right py-2 whitespace-nowrap" style={{ color: TEXTO }}>{partida.tipo === 'debito' ? `R$ ${fBRL2(Number(partida.valor))}` : '—'}</td>
                  <td className="text-right py-2 whitespace-nowrap" style={{ color: TEXTO }}>{partida.tipo === 'credito' ? `R$ ${fBRL2(Number(partida.valor))}` : '—'}</td>
                  <td className="text-right py-2 font-bold whitespace-nowrap" style={{ color: saldo >= 0 ? VERDE : VERMELHO }}>R$ {fBRL2(saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {modalLancamento && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setModalLancamento(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${TEAL}35`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: TEAL }}>
                        {new Date(modalLancamento.data + 'T00:00:00').toLocaleDateString(localeData)}
                      </p>
                      <h3 className="text-base font-bold" style={{ color: TITULO }}>{modalLancamento.descricao}</h3>
                      <p className="text-xs mt-1" style={{ color: CINZA }}>{L('Origem', 'Source', 'Origen')}: {origemLabel(modalLancamento.origem_tabela, lang)}</p>
                    </div>
                    <button onClick={() => setModalLancamento(null)} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ minWidth: 360 }}>
                      <thead>
                        <tr style={{ color: CINZA }}>
                          <th className="text-left py-1.5 font-semibold">{L('Conta', 'Account', 'Cuenta')}</th>
                          <th className="text-right py-1.5 font-semibold">{L('Débito', 'Debit', 'Débito')}</th>
                          <th className="text-right py-1.5 font-semibold">{L('Crédito', 'Credit', 'Crédito')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partidasModal.map((p) => (
                          <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <td className="py-1.5" style={{ color: TEXTO }}>{contaNome(p.conta_id)}</td>
                            <td className="text-right py-1.5 whitespace-nowrap" style={{ color: TEXTO }}>{p.tipo === 'debito' ? `R$ ${fBRL2(Number(p.valor))}` : '—'}</td>
                            <td className="text-right py-1.5 whitespace-nowrap" style={{ color: TEXTO }}>{p.tipo === 'credito' ? `R$ ${fBRL2(Number(p.valor))}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </ModuloLayout>
  )
}
