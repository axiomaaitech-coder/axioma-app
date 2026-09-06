'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Lock, Undo2, ChevronDown, ChevronUp } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva, obterMeuPapel } from '../../../../lib/empresaHelpers'
import {
  listarPlanoDeContas, registrarLancamentoContabil, estornarLancamentoContabil,
  type ContaContabil, type PartidaContabilInput,
} from '../../../../lib/contabilidadeHelpers'
import { listarLancamentos, listarPartidas, type LancamentoContabilRow, type PartidaRow } from '../../../../lib/contabilidadeRelatoriosHelpers'
import { fBRL2 } from '../../../../lib/cfoCore'

type Idioma3 = 'pt' | 'en' | 'es'

const AZULC = '#6ab0ff'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AMARELO = '#fbbf24'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

const PAPEIS_EDICAO = ['dono', 'admin']

type LinhaPartida = { contaId: string; tipo: 'debito' | 'credito'; valor: string }

function hojeISO(): string { return new Date().toISOString().slice(0, 10) }
function linhaVazia(tipo: 'debito' | 'credito'): LinhaPartida { return { contaId: '', tipo, valor: '' } }

export default function LancamentoManualPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [podeEditar, setPodeEditar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [contas, setContas] = useState<ContaContabil[]>([])
  const [manuais, setManuais] = useState<LancamentoContabilRow[]>([])
  const [partidasPorLancamento, setPartidasPorLancamento] = useState<Record<string, PartidaRow[]>>({})
  const [toast, setToast] = useState<{ msg: string; tipo: 'erro' | 'ok' } | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [confirmandoEstorno, setConfirmandoEstorno] = useState<string | null>(null)
  const [estornando, setEstornando] = useState<string | null>(null)

  const [data, setData] = useState(hojeISO())
  const [descricao, setDescricao] = useState('')
  const [linhas, setLinhas] = useState<LinhaPartida[]>([linhaVazia('debito'), linhaVazia('credito')])

  function mostrarToast(msg: string, tipo: 'erro' | 'ok' = 'erro') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4500)
  }

  const carregar = useCallback(async (empId: string) => {
    const [listaContas, lancs] = await Promise.all([
      listarPlanoDeContas(empId),
      listarLancamentos(empId),
    ])
    setContas(listaContas.filter((c) => c.ativo))
    const manuaisOrdenados = lancs.filter((l) => l.origem_tabela === 'manual').sort((a, b) => b.data.localeCompare(a.data)).slice(0, 30)
    setManuais(manuaisOrdenados)
    const partidas = await listarPartidas(empId, manuaisOrdenados.map((l) => l.id))
    const porLancamento: Record<string, PartidaRow[]> = {}
    partidas.forEach((p) => { (porLancamento[p.lancamento_id] ||= []).push(p) })
    setPartidasPorLancamento(porLancamento)
  }, [])

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (!empId) { setLoading(false); return }
      const papel = await obterMeuPapel(empId)
      setPodeEditar(papel != null && PAPEIS_EDICAO.includes(papel))
      await carregar(empId)
      setLoading(false)
    })()
  }, [carregar])

  const contaPorId = useMemo(() => new Map(contas.map((c) => [c.id, c])), [contas])

  function atualizarLinha(i: number, campo: keyof LinhaPartida, valor: string) {
    setLinhas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)))
  }
  function adicionarLinha() { setLinhas((prev) => [...prev, linhaVazia('debito')]) }
  function removerLinha(i: number) { setLinhas((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev)) }
  function limparForm() { setData(hojeISO()); setDescricao(''); setLinhas([linhaVazia('debito'), linhaVazia('credito')]) }

  const totalDebito = linhas.filter((l) => l.tipo === 'debito').reduce((s, l) => s + (parseFloat(l.valor.replace(',', '.')) || 0), 0)
  const totalCredito = linhas.filter((l) => l.tipo === 'credito').reduce((s, l) => s + (parseFloat(l.valor.replace(',', '.')) || 0), 0)
  const diferenca = Math.round((totalDebito - totalCredito) * 100) / 100
  const linhasValidas = linhas.every((l) => l.contaId && parseFloat(l.valor.replace(',', '.')) > 0)
  const podeSalvar = podeEditar && !!descricao.trim() && !!data && linhasValidas && diferenca === 0 && totalDebito > 0

  async function salvar() {
    if (!empresaId) return
    if (!descricao.trim() || !data || !linhasValidas || diferenca !== 0 || totalDebito <= 0) {
      mostrarToast(L('Preencha descrição, data e as partidas — débito e crédito precisam somar o mesmo valor.', 'Fill in description, date and the entries — debit and credit must add up to the same amount.', 'Complete descripción, fecha y las partidas — débito y crédito deben sumar el mismo valor.'), 'erro')
      return
    }
    setSalvando(true)
    const partidas: PartidaContabilInput[] = linhas.map((l) => ({ contaId: l.contaId, tipo: l.tipo, valor: Math.round((parseFloat(l.valor.replace(',', '.')) || 0) * 100) / 100 }))
    const { erro } = await registrarLancamentoContabil(empresaId, data, descricao.trim(), partidas, { origemTabela: 'manual' })
    setSalvando(false)
    if (erro) {
      mostrarToast(L('Não foi possível gravar o lançamento. Tente novamente.', 'Could not post the entry. Try again.', 'No se pudo grabar el asiento. Intente de nuevo.'), 'erro')
      return
    }
    mostrarToast(L('Lançamento gravado.', 'Entry posted.', 'Asiento grabado.'), 'ok')
    limparForm()
    await carregar(empresaId)
  }

  async function confirmarEstorno(lancamentoId: string) {
    if (!empresaId) return
    setEstornando(lancamentoId)
    const { erro } = await estornarLancamentoContabil(lancamentoId, L('Estorno manual (Contador)', 'Manual reversal (Accountant)', 'Reversión manual (Contador)'))
    setEstornando(null)
    setConfirmandoEstorno(null)
    if (erro) {
      mostrarToast(L('Não foi possível estornar. Tente novamente.', 'Could not reverse it. Try again.', 'No se pudo revertir. Intente de nuevo.'), 'erro')
      return
    }
    mostrarToast(L('Lançamento estornado.', 'Entry reversed.', 'Asiento revertido.'), 'ok')
    await carregar(empresaId)
  }

  return (
    <ModuloLayout
      titulo={L('Lançamento Manual', 'Manual Journal Entry', 'Asiento Manual')}
      subtitulo={L('Ajustes, provisões e correções contábeis — partida dobrada de verdade, nunca edita um lançamento existente (sempre estorna e relança).', 'Adjustments, accruals and accounting corrections — real double-entry, never edits an existing entry (always reverses and re-posts).', 'Ajustes, provisiones y correcciones contables — partida doble real, nunca edita un asiento existente (siempre revierte y vuelve a asentar).')}
      botaoExtra={
        <button onClick={() => router.push('/contador')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(59,111,212,0.14)', color: AZULC, border: `1px solid ${AZULC}40` }}>
          <ArrowLeft size={15} />{L('Voltar ao Contador', 'Back to Accountant', 'Volver a Contador')}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !empresaId ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : (
        <div className="space-y-6">

          {toast && (
            <div className="rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ background: toast.tipo === 'ok' ? `${VERDE}15` : `${VERMELHO}15`, border: `1px solid ${toast.tipo === 'ok' ? VERDE : VERMELHO}35`, color: toast.tipo === 'ok' ? VERDE : VERMELHO }}>
              {toast.msg}
            </div>
          )}

          {!podeEditar && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold w-fit" style={{ background: `${CINZA}15`, color: CINZA }}>
              <Lock size={14} />
              {L('Só dono ou admin da empresa pode lançar ou estornar — você está vendo em modo leitura.', 'Only the company owner or admin can post or reverse entries — you are viewing in read-only mode.', 'Solo el dueño o admin de la empresa puede asentar o revertir — estás viendo en modo lectura.')}
            </div>
          )}

          {podeEditar && (
            <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: '1px solid rgba(106,176,255,0.16)' }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: TITULO }}>{L('Novo Lançamento', 'New Entry', 'Nuevo Asiento')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: CINZA }}>{L('Data', 'Date', 'Fecha')}</label>
                  <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold block mb-1" style={{ color: CINZA }}>{L('Descrição', 'Description', 'Descripción')}</label>
                  <input value={descricao} onChange={(e) => setDescricao(e.target.value)}
                    placeholder={L('Ex.: Provisão de depreciação de outubro', 'E.g.: October depreciation accrual', 'Ej.: Provisión de depreciación de octubre')}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
                </div>
              </div>

              <div className="space-y-2 mb-2">
                {linhas.map((linha, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                    <select value={linha.contaId} onChange={(e) => atualizarLinha(i, 'contaId', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'rgba(10,22,40,0.9)', border: `1px solid ${AZULC}30`, color: TEXTO }}>
                      <option value="">{L('Selecione a conta', 'Select the account', 'Seleccione la cuenta')}</option>
                      {contas.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}
                    </select>
                    <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${AZULC}30` }}>
                      {(['debito', 'credito'] as const).map((t) => (
                        <button key={t} type="button" onClick={() => atualizarLinha(i, 'tipo', t)}
                          className="px-3 py-2.5 text-xs font-bold whitespace-nowrap"
                          style={{ background: linha.tipo === t ? `${AZULC}25` : 'transparent', color: linha.tipo === t ? AZULC : CINZA }}>
                          {t === 'debito' ? L('Débito', 'Debit', 'Débito') : L('Crédito', 'Credit', 'Crédito')}
                        </button>
                      ))}
                    </div>
                    <input type="text" inputMode="decimal" value={linha.valor} onChange={(e) => atualizarLinha(i, 'valor', e.target.value)}
                      placeholder="0,00" className="w-28 px-3 py-2.5 rounded-xl text-sm text-right focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
                    <button type="button" onClick={() => removerLinha(i)} disabled={linhas.length <= 2}
                      className="p-2.5 rounded-xl disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.06)', color: VERMELHO }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={adicionarLinha} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: AZULC }}>
                <Plus size={14} />{L('Adicionar partida', 'Add entry line', 'Agregar partida')}
              </button>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
                <span style={{ color: CINZA }}>{L('Débito', 'Debit', 'Débito')}: <strong style={{ color: TEXTO }}>R$ {fBRL2(totalDebito)}</strong></span>
                <span style={{ color: CINZA }}>{L('Crédito', 'Credit', 'Crédito')}: <strong style={{ color: TEXTO }}>R$ {fBRL2(totalCredito)}</strong></span>
                {diferenca !== 0 ? (
                  <span className="font-bold" style={{ color: VERMELHO }}>{L('Diferença', 'Difference', 'Diferencia')}: R$ {fBRL2(Math.abs(diferenca))} — {L('não bate', "doesn't match", 'no cuadra')}</span>
                ) : totalDebito > 0 ? (
                  <span className="font-bold" style={{ color: VERDE }}>{L('Bate certinho', 'Balanced', 'Cuadra perfecto')} ✓</span>
                ) : null}
              </div>

              <button onClick={salvar} disabled={!podeSalvar || salvando}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff' }}>
                <Save size={16} />{salvando ? L('Gravando...', 'Posting...', 'Grabando...') : L('Gravar lançamento', 'Post entry', 'Grabar asiento')}
              </button>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: TITULO }}>{L('Últimos Lançamentos Manuais', 'Recent Manual Entries', 'Últimos Asientos Manuales')}</h3>
            {manuais.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(10,20,36,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm" style={{ color: CINZA }}>{L('Nenhum lançamento manual ainda.', 'No manual entries yet.', 'Ningún asiento manual aún.')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {manuais.map((m) => {
                  const partidas = partidasPorLancamento[m.id] || []
                  const estornado = !!m.estornado_por_id
                  const isExpandido = expandido === m.id
                  return (
                    <div key={m.id} className="rounded-xl overflow-hidden" style={{ background: 'rgba(10,20,36,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <button onClick={() => setExpandido(isExpandido ? null : m.id)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: estornado ? CINZA : TEXTO, textDecoration: estornado ? 'line-through' : 'none' }}>{m.descricao}</p>
                          <p className="text-[10px]" style={{ color: CINZA }}>{new Date(m.data + 'T00:00:00').toLocaleDateString(localeData)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {estornado && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${AMARELO}15`, color: AMARELO }}>{L('ESTORNADO', 'REVERSED', 'REVERTIDO')}</span>}
                          {isExpandido ? <ChevronUp size={14} style={{ color: CINZA }} /> : <ChevronDown size={14} style={{ color: CINZA }} />}
                        </div>
                      </button>
                      {isExpandido && (
                        <div className="px-4 pb-3">
                          <div className="rounded-lg p-2.5 mb-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            {partidas.map((p) => {
                              const conta = contaPorId.get(p.conta_id)
                              return (
                                <div key={p.id} className="flex justify-between text-[11px] py-0.5">
                                  <span style={{ color: CINZA }}>{conta ? `${conta.codigo} — ${conta.nome}` : p.conta_id}</span>
                                  <span className="font-semibold" style={{ color: p.tipo === 'debito' ? AZULC : VERDE }}>
                                    {p.tipo === 'debito' ? L('D', 'D', 'D') : L('C', 'C', 'C')} R$ {fBRL2(Number(p.valor))}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          {podeEditar && !estornado && (
                            confirmandoEstorno === m.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px]" style={{ color: AMARELO }}>{L('Confirma o estorno?', 'Confirm reversal?', '¿Confirma la reversión?')}</span>
                                <button onClick={() => confirmarEstorno(m.id)} disabled={estornando === m.id}
                                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg disabled:opacity-60" style={{ background: `${VERMELHO}20`, color: VERMELHO }}>
                                  {estornando === m.id ? L('Estornando...', 'Reversing...', 'Revirtiendo...') : L('Sim, estornar', 'Yes, reverse', 'Sí, revertir')}
                                </button>
                                <button onClick={() => setConfirmandoEstorno(null)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: CINZA }}>
                                  {L('Cancelar', 'Cancel', 'Cancelar')}
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmandoEstorno(m.id)} className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: AMARELO }}>
                                <Undo2 size={12} />{L('Estornar', 'Reverse', 'Revertir')}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </ModuloLayout>
  )
}
