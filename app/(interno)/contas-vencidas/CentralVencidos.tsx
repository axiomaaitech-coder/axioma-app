'use client'
// Central de contas vencidas — a receber (Fase 2 etapa 2) e a pagar (etapa 3), uma peça só para os dois lados. Usa a análise já carregada pela
// tela (motor de vencidos) — nada recalculado aqui. Escreve só contato e promessa de cobrança (tabelas que já
// existem); o recebimento continua em Contas a Receber (origem única). Contato: lápis + lixeira de 60 dias, sem senha.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, FileDown, Pencil, RotateCcw, Sheet, Trash2 } from 'lucide-react'
import type { ItemVencido } from '../../../lib/vencidos/dados'
import { registrarPromessa, salvarCaso } from '../../../lib/vencidos/dados'
import { simularPagamentos, type BaseTesouraria } from '../../../lib/vencidos/motor'
import { criarInteracao, listarInteracoes, excluirInteracao, restaurarInteracao, atualizarInteracao, listarLixeiraCobranca, restaurarCompromisso, DIAS_LIXEIRA, type CobrancaInteracao, type CobrancaCompromisso } from '../../../lib/cobrancaHelpers'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { exportarPlanilha } from '../../../lib/exportarPlanilha'
import { createClient } from '../../../lib/supabase/client'
import { hojeISO } from '../../../lib/datas'
import { nomeAcao, porqueAcao, nomeFator, nomePromessa, nomeCanal, nomeCausa, nomeTendencia, nomeCriticidade, CANAIS_CONTATO, type Lang } from '../../../lib/vencidos/textos'

type Paleta = { VERDE: string; VERMELHO: string; ALERTA: string; CINZA: string; TEXTO: string; PAINEL_BG: string; ANINHADA: string; BORDA: string; CAMPO: string }
type Ordem = 'prioridade' | 'atraso' | 'saldo' | 'cliente'
const POR_PAGINA = 20
const BOTAO_ACAO = 'linear-gradient(135deg, #0a4f3b, #0f7d5c)'
const BOTAO_SECUNDARIO = '#101b3d'

export default function CentralVencidos({ dominio, itens, empresaId, lang, P, fmt, dataTxt, tesouraria }: { dominio: 'receber' | 'pagar'; itens: ItemVencido[]; empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; tesouraria: BaseTesouraria }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const pagar = dominio === 'pagar'
  const corSaldo = pagar ? P.VERMELHO : P.VERDE
  // colunas que mudam de lado: risco do cliente x importância do fornecedor; último contato x negociação
  const colRisco = (i: ItemVencido) => (pagar ? nomeCriticidade(lang, i.caso?.criticidade) : risco(i))
  const colContato = (i: ItemVencido) => (pagar ? (i.emNegociacao ? L('Em negociação', 'In negotiation', 'En negociación') : '—') : i.ultimoContato ? dataTxt(i.ultimoContato.data) : '—')
  const [ordem, setOrdem] = useState<Ordem>('prioridade')
  const [pagina, setPagina] = useState(0)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [aberto, setAberto] = useState<string | null>(null)
  const [verLixeira, setVerLixeira] = useState(false)
  const [aviso, setAviso] = useState('')

  const ordenados = useMemo(() => [...itens].sort((a, b) =>
    ordem === 'atraso' ? b.encargos.dias - a.encargos.dias
      : ordem === 'saldo' ? b.saldo - a.saldo
        : ordem === 'cliente' ? a.titulo.contraparteNome.localeCompare(b.titulo.contraparteNome)
          : (b.prioridade.score ?? 0) - (a.prioridade.score ?? 0)), [itens, ordem])
  const paginas = Math.max(1, Math.ceil(ordenados.length / POR_PAGINA))
  const pg = Math.min(pagina, paginas - 1) // filtro que encolhe a lista nunca deixa uma página vazia
  const visiveis = ordenados.slice(pg * POR_PAGINA, (pg + 1) * POR_PAGINA)

  const painel = { background: P.PAINEL_BG, border: `1px solid ${P.BORDA}` }
  const aninhada = { background: P.ANINHADA, border: `1px solid ${P.BORDA}` }
  const campo = { background: P.CAMPO, color: P.TEXTO, border: `1px solid ${P.BORDA}` }
  const dias = (n: number) => L(`${n} d`, `${n} d`, `${n} d`)
  const risco = (i: ItemVencido) => (i.risco.score == null ? L('sem histórico', 'no history', 'sin historial') : String(i.risco.score))
  const avisar = (m: string) => { setAviso(m); setTimeout(() => setAviso(''), 5000) }
  const recarregar = () => window.dispatchEvent(new Event('axioma:dados-atualizados'))

  // Exportação: as marcadas ou, sem marcação, todas as da lista filtrada
  const paraExportar = () => (selecionados.size ? ordenados.filter((i) => selecionados.has(i.titulo.id)) : ordenados)
  const linha = (i: ItemVencido) => ({
    [pagar ? L('Fornecedor', 'Supplier', 'Proveedor') : L('Cliente', 'Customer', 'Cliente')]: i.titulo.contraparteNome, [L('Descrição', 'Description', 'Descripción')]: i.titulo.descricao || '—',
    [L('Vencimento', 'Due date', 'Vencimiento')]: dataTxt(i.titulo.vencimento), [L('Dias de atraso', 'Days overdue', 'Días de atraso')]: i.encargos.dias,
    [L('Valor original', 'Original amount', 'Valor original')]: i.titulo.valor, [L('Saldo', 'Balance', 'Saldo')]: i.saldo,
    [L('Juros e multa', 'Interest and fines', 'Intereses y multas')]: Math.round((i.encargos.total - i.saldo) * 100) / 100,
    [pagar ? L('Importância', 'Importance', 'Importancia') : L('Risco (0–1000)', 'Risk (0–1000)', 'Riesgo (0–1000)')]: colRisco(i), [L('Prioridade', 'Priority', 'Prioridad')]: i.prioridade.score ?? 0,
    [pagar ? L('Negociação', 'Negotiation', 'Negociación') : L('Último contato', 'Last contact', 'Último contacto')]: colContato(i),
    [L('Próxima ação', 'Next action', 'Próxima acción')]: nomeAcao(lang, i.acao.acao),
  })
  const titulo = pagar ? L('Contas a pagar vencidas', 'Overdue payables', 'Cuentas por pagar vencidas') : L('Contas a receber vencidas', 'Overdue receivables', 'Cuentas por cobrar vencidas')
  const nomeArquivo = `${pagar ? L('contas-a-pagar-vencidas', 'overdue-payables', 'cuentas-por-pagar-vencidas') : L('contas-a-receber-vencidas', 'overdue-receivables', 'cuentas-por-cobrar-vencidas')}-${hojeISO()}`
  const exportarExcel = () => exportarPlanilha(paraExportar().map(linha), nomeArquivo, L('Vencidas', 'Overdue', 'Vencidas'), 'xlsx')
  const exportarPdf = () => {
    const l = paraExportar().map(linha), cols = Object.keys(l[0] ?? linha(ordenados[0]))
    gerarPdfTabela({ titulo, subtitulo: dataTxt(hojeISO()),
      colunas: cols.map((c, k) => ({ header: c, key: c, width: k < 2 ? 3 : 1.4, align: k >= 3 && k <= 8 ? 'right' : 'left' })),
      linhas: l.map((x) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, typeof v === 'number' && k !== cols[3] && k !== cols[8] ? fmt(v) : String(v)]))),
      resumo: [{ label: L('Total do saldo', 'Total balance', 'Total del saldo'), valor: fmt(paraExportar().reduce((s, i) => s + i.saldo, 0)) }], nomeArquivo,
    }, (m) => avisar(m), lang)
  }

  const marcar = (id: string) => setSelecionados((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const todosMarcados = visiveis.length > 0 && visiveis.every((i) => selecionados.has(i.titulo.id))

  return (
    <div className="rounded-2xl p-4 axi-card-premium3d axi-card-faixa min-w-0" style={painel}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-sm font-bold" style={{ color: P.TEXTO }}>{titulo} ({itens.length})</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <select aria-label={L('Ordenar por', 'Sort by', 'Ordenar por')} value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="rounded-lg px-2 py-1.5 text-xs" style={campo}>
            <option value="prioridade">{L('Mais prioritárias', 'Highest priority', 'Más prioritarias')}</option>
            <option value="atraso">{L('Mais atrasadas', 'Most overdue', 'Más atrasadas')}</option>
            <option value="saldo">{L('Maior saldo', 'Largest balance', 'Mayor saldo')}</option>
            <option value="cliente">{L('Cliente (A–Z)', 'Customer (A–Z)', 'Cliente (A–Z)')}</option>
          </select>
          <button type="button" onClick={exportarPdf} disabled={!itens.length} className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1" style={{ background: BOTAO_ACAO }}><FileDown size={13} />PDF</button>
          <button type="button" onClick={exportarExcel} disabled={!itens.length} className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1" style={{ background: BOTAO_ACAO }}><Sheet size={13} />Excel</button>
          {!pagar && <button type="button" onClick={() => setVerLixeira((v) => !v)} aria-pressed={verLixeira} className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1" style={{ background: BOTAO_SECUNDARIO }}><Trash2 size={13} />{L('Lixeira', 'Trash', 'Papelera')}</button>}
        </div>
      </div>
      {selecionados.size > 0 && <p className="text-[11px] mb-2" style={{ color: P.CINZA }}>{L(`${selecionados.size} marcada(s): PDF e Excel levam só elas.`, `${selecionados.size} selected: PDF and Excel export only those.`, `${selecionados.size} marcada(s): PDF y Excel llevan solo esas.`)} <button type="button" className="underline" onClick={() => setSelecionados(new Set())}>{L('Desmarcar', 'Clear', 'Desmarcar')}</button></p>}
      {aviso && <p role="status" className="text-xs font-semibold mb-2" style={{ color: P.TEXTO }}>{aviso}</p>}
      {pagar && selecionados.size > 0 && <SimulacaoPagamento itens={ordenados.filter((i) => selecionados.has(i.titulo.id))} tesouraria={tesouraria} lang={lang} P={P} fmt={fmt} />}
      {!pagar && verLixeira && <Lixeira empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} aoMudar={recarregar} />}

      {itens.length === 0 ? (
        <p className="text-xs py-4 text-center" style={{ color: P.VERDE }}>{pagar ? L('Nenhuma conta a pagar vencida com estes filtros.', 'No overdue payables with these filters.', 'Ninguna cuenta por pagar vencida con estos filtros.') : L('Nenhuma conta a receber vencida com estes filtros.', 'No overdue receivables with these filters.', 'Ninguna cuenta por cobrar vencida con estos filtros.')}</p>
      ) : (
        <>
          {/* Computador: tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs" style={{ color: P.TEXTO }}>
              <thead>
                <tr style={{ color: P.CINZA }} className="text-left">
                  <th className="p-1.5 w-6"><input type="checkbox" aria-label={L('Marcar todas da página', 'Select all on page', 'Marcar todas de la página')} checked={todosMarcados} onChange={() => setSelecionados((s) => { const n = new Set(s); visiveis.forEach((i) => (todosMarcados ? n.delete(i.titulo.id) : n.add(i.titulo.id))); return n })} /></th>
                  <th className="p-1.5">{pagar ? L('Fornecedor', 'Supplier', 'Proveedor') : L('Cliente', 'Customer', 'Cliente')}</th>
                  <th className="p-1.5">{L('Vencimento', 'Due', 'Vencimiento')}</th>
                  <th className="p-1.5 text-right">{L('Original', 'Original', 'Original')}</th>
                  <th className="p-1.5 text-right">{L('Saldo', 'Balance', 'Saldo')}</th>
                  <th className="p-1.5 text-right">{L('Juros/multa', 'Interest/fine', 'Int./multa')}</th>
                  <th className="p-1.5 text-right">{pagar ? L('Importância', 'Importance', 'Importancia') : L('Risco', 'Risk', 'Riesgo')}</th>
                  <th className="p-1.5 text-right">{L('Prioridade', 'Priority', 'Prioridad')}</th>
                  <th className="p-1.5">{pagar ? L('Negociação', 'Negotiation', 'Negociación') : L('Último contato', 'Last contact', 'Último contacto')}</th>
                  <th className="p-1.5">{L('Próxima ação', 'Next action', 'Próxima acción')}</th>
                  <th className="p-1.5 w-6" />
                </tr>
              </thead>
              <tbody>
                {visiveis.map((i) => (
                  <FragmentoLinha key={i.titulo.id} i={i} aberto={aberto === i.titulo.id} onAbrir={() => setAberto(aberto === i.titulo.id ? null : i.titulo.id)}
                    marcado={selecionados.has(i.titulo.id)} onMarcar={() => marcar(i.titulo.id)} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} risco={colRisco(i)} contato={colContato(i)} corSaldo={corSaldo} dias={dias(i.encargos.dias)}
                    detalhe={pagar ? <DetalhePagar i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} aoMudar={recarregar} avisar={avisar} /> : <Detalhe i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} aoMudar={recarregar} avisar={avisar} />} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Celular: cartões */}
          <div className="md:hidden space-y-2">
            {visiveis.map((i) => (
              <div key={i.titulo.id} className="rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={aninhada}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" aria-label={L('Marcar', 'Select', 'Marcar')} checked={selecionados.has(i.titulo.id)} onChange={() => marcar(i.titulo.id)} />
                  <button type="button" className="flex-1 min-w-0 text-left" onClick={() => setAberto(aberto === i.titulo.id ? null : i.titulo.id)} aria-expanded={aberto === i.titulo.id}>
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: P.TEXTO }}>{i.titulo.contraparteNome}</p>
                      <p className="text-sm font-bold shrink-0" style={{ color: corSaldo }}>{fmt(i.saldo)}</p>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: P.CINZA }}>{i.titulo.descricao || '—'}</p>
                    <p className="text-[11px] mt-1" style={{ color: P.CINZA }}>{dataTxt(i.titulo.vencimento)} · <b style={{ color: i.encargos.dias > 30 ? P.VERMELHO : P.TEXTO }}>{L(`${i.encargos.dias} dias`, `${i.encargos.dias} days`, `${i.encargos.dias} días`)}</b> · {pagar ? L('importância', 'importance', 'importancia') : L('risco', 'risk', 'riesgo')} {colRisco(i)}</p>
                    <p className="text-[11px] mt-0.5 font-semibold" style={{ color: P.VERDE }}>{nomeAcao(lang, i.acao.acao)}</p>
                  </button>
                </div>
                {aberto === i.titulo.id && <div className="mt-2">{pagar ? <DetalhePagar i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} aoMudar={recarregar} avisar={avisar} /> : <Detalhe i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} aoMudar={recarregar} avisar={avisar} />}</div>}
              </div>
            ))}
          </div>
          {paginas > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs" style={{ color: P.TEXTO }}>
              <button type="button" disabled={pg === 0} onClick={() => setPagina(pg - 1)} className="px-2.5 py-1 rounded-lg text-white font-bold disabled:opacity-60" style={{ background: BOTAO_SECUNDARIO }}>{L('Anterior', 'Previous', 'Anterior')}</button>
              <span>{L(`Página ${pg + 1} de ${paginas}`, `Page ${pg + 1} of ${paginas}`, `Página ${pg + 1} de ${paginas}`)}</span>
              <button type="button" disabled={pg >= paginas - 1} onClick={() => setPagina(pg + 1)} className="px-2.5 py-1 rounded-lg text-white font-bold disabled:opacity-60" style={{ background: BOTAO_SECUNDARIO }}>{L('Próxima', 'Next', 'Siguiente')}</button>
            </div>
          )}
          <p className="text-xs font-bold mt-3 text-right" style={{ color: P.TEXTO }}>{L('Total', 'Total', 'Total')}: {fmt(itens.reduce((s, i) => s + i.saldo, 0))}</p>
        </>
      )}
    </div>
  )
}

function FragmentoLinha({ i, aberto, onAbrir, marcado, onMarcar, lang, P, fmt, dataTxt, risco, contato, corSaldo, dias, detalhe }: { i: ItemVencido; aberto: boolean; onAbrir: () => void; marcado: boolean; onMarcar: () => void; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; risco: string; contato: string; corSaldo: string; dias: string; detalhe: ReactNode }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  return (
    <>
      <tr className="cursor-pointer" style={{ borderTop: `1px solid ${P.BORDA}` }} onClick={onAbrir}>
        <td className="p-1.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={L('Marcar', 'Select', 'Marcar')} checked={marcado} onChange={onMarcar} /></td>
        <td className="p-1.5 max-w-[14rem]"><p className="font-semibold truncate">{i.titulo.contraparteNome}</p><p className="truncate" style={{ color: P.CINZA }}>{i.titulo.descricao || '—'}</p></td>
        <td className="p-1.5 whitespace-nowrap">{dataTxt(i.titulo.vencimento)}<br /><b style={{ color: i.encargos.dias > 30 ? P.VERMELHO : P.TEXTO }}>{dias}</b></td>
        <td className="p-1.5 text-right whitespace-nowrap">{fmt(i.titulo.valor)}</td>
        <td className="p-1.5 text-right whitespace-nowrap font-bold" style={{ color: corSaldo }}>{fmt(i.saldo)}</td>
        <td className="p-1.5 text-right whitespace-nowrap">{fmt(Math.max(0, i.encargos.total - i.saldo))}</td>
        <td className="p-1.5 text-right whitespace-nowrap">{risco}</td>
        <td className="p-1.5 text-right">{i.prioridade.score ?? '—'}</td>
        <td className="p-1.5 whitespace-nowrap">{contato}</td>
        <td className="p-1.5 font-semibold" style={{ color: P.VERDE }}>{nomeAcao(lang, i.acao.acao)}</td>
        <td className="p-1.5"><button type="button" aria-expanded={aberto} aria-label={L('Detalhes', 'Details', 'Detalles')}>{aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></td>
      </tr>
      {aberto && <tr><td colSpan={11} className="p-2">{detalhe}</td></tr>}
    </>
  )
}

// Detalhe de uma conta: valores, base legal, por que a nota/ação, comportamento do cliente, contatos e promessa
function Detalhe({ i, empresaId, lang, P, fmt, dataTxt, aoMudar, avisar }: { i: ItemVencido; empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; aoMudar: () => void; avisar: (m: string) => void }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const aninhada = { background: P.ANINHADA, border: `1px solid ${P.BORDA}` }
  const campo = { background: P.CAMPO, color: P.TEXTO, border: `1px solid ${P.BORDA}` }
  const [contatos, setContatos] = useState<CobrancaInteracao[] | null>(null)
  const [novo, setNovo] = useState({ canal: 'telefone', descricao: '', data: hojeISO() })
  const [editando, setEditando] = useState<string | null>(null)
  const [textoEdit, setTextoEdit] = useState('')
  const [prom, setProm] = useState({ valor: '', data: '', canal: 'telefone' })
  const [salvando, setSalvando] = useState(false)
  const ler = () => listarInteracoes(empresaId, i.titulo.id).then(setContatos)
  // relê quando a conta muda ou quando um contato entra/sai (ex.: recuperado da lixeira)
  useEffect(() => { void ler() }, [i.titulo.id, i.ultimoContato?.data]) // eslint-disable-line react-hooks/exhaustive-deps
  const usuario = async () => (await createClient().auth.getUser()).data.user?.id ?? ''

  const salvarContato = async () => {
    if (!novo.descricao.trim()) return avisar(L('Escreva o que foi conversado.', 'Write what was discussed.', 'Escriba lo que se habló.'))
    setSalvando(true)
    const r = await criarInteracao(await usuario(), empresaId, { conta_id: i.titulo.id, cliente_id: i.titulo.contraparteId, tipo: 'contato', canal: novo.canal, descricao: novo.descricao.trim().slice(0, 2000), data: novo.data })
    setSalvando(false)
    if (r.erro) return avisar(L('Não foi possível registrar o contato. Tente de novo.', 'Could not save the contact. Try again.', 'No fue posible registrar el contacto. Intente de nuevo.'))
    setNovo({ ...novo, descricao: '' }); void ler(); aoMudar(); avisar(L('Contato registrado.', 'Contact saved.', 'Contacto registrado.'))
  }
  const salvarEdicao = async (id: string) => {
    const r = await atualizarInteracao(id, { descricao: textoEdit.trim().slice(0, 2000) })
    if (r.erro) return avisar(L('Não foi possível salvar a correção.', 'Could not save the change.', 'No fue posible guardar la corrección.'))
    setEditando(null); void ler()
  }
  const paraLixeira = async (id: string) => {
    const r = await excluirInteracao(id)
    if (r.erro) return avisar(L('Não foi possível mover para a lixeira.', 'Could not move to trash.', 'No fue posible mover a la papelera.'))
    void ler(); aoMudar(); avisar(L(`Contato movido para a lixeira — dá para recuperar por ${DIAS_LIXEIRA} dias.`, `Contact moved to trash — recoverable for ${DIAS_LIXEIRA} days.`, `Contacto movido a la papelera — se puede recuperar por ${DIAS_LIXEIRA} días.`))
  }
  const salvarPromessa = async () => {
    const valor = Number(prom.valor.replace(/\./g, '').replace(',', '.'))
    if (!prom.data || prom.data < hojeISO()) return avisar(L('Escolha uma data a partir de hoje.', 'Pick a date from today on.', 'Elija una fecha desde hoy.'))
    setSalvando(true)
    const r = await registrarPromessa(await usuario(), empresaId, i.titulo, { valor, data: prom.data, canal: prom.canal })
    setSalvando(false)
    if (!r.ok) return avisar(L('Valor da promessa deve ser maior que zero e até o saldo.', 'Promise amount must be above zero and up to the balance.', 'El valor debe ser mayor que cero y hasta el saldo.'))
    setProm({ valor: '', data: '', canal: prom.canal }); aoMudar(); avisar(L('Promessa registrada. Ela não conta como dinheiro em caixa.', 'Promise saved. It does not count as cash.', 'Promesa registrada. No cuenta como dinero en caja.'))
  }

  const enc = i.encargos
  const baseLegal = enc.relacao === 'b2b'
    ? L('Entre empresas: multa do contrato (até o valor da dívida, Código Civil art. 412).', 'Business to business: contract fine (up to the debt amount, Civil Code art. 412).', 'Entre empresas: multa del contrato (hasta el valor de la deuda, Código Civil art. 412).')
    : L('Consumidor (ou documento sem CNPJ): multa de no máximo 2% (Código de Defesa do Consumidor, art. 52).', 'Consumer (or no company ID): fine of at most 2% (Consumer Code, art. 52).', 'Consumidor (o sin CNPJ): multa de máximo 2% (Código de Defensa del Consumidor, art. 52).')
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-xs" style={{ color: P.TEXTO }}>
      <div className="rounded-xl p-3 space-y-1" style={aninhada}>
        <p className="font-bold mb-1">{L('Valores', 'Amounts', 'Valores')}</p>
        {[[L('Valor original', 'Original amount', 'Valor original'), i.titulo.valor], [L('Saldo em aberto', 'Open balance', 'Saldo pendiente'), i.saldo], [L('Multa', 'Fine', 'Multa'), enc.multa], [L('Juros', 'Interest', 'Intereses'), enc.juros], [L('Correção (IPCA)', 'Inflation update (IPCA)', 'Actualización (IPCA)'), enc.atualizacao], [L('Total atualizado', 'Updated total', 'Total actualizado'), enc.total]]
          .map(([t, v]) => <p key={String(t)} className="flex justify-between"><span style={{ color: P.CINZA }}>{t}</span><b>{fmt(Number(v))}</b></p>)}
        {i.disputa.aberta && <p style={{ color: P.CINZA }}>{L(`Contestado: ${fmt(i.disputa.contestado)}`, `Disputed: ${fmt(i.disputa.contestado)}`, `Disputado: ${fmt(i.disputa.contestado)}`)}</p>}
        <p className="text-[11px] pt-1" style={{ color: P.CINZA }}>{baseLegal} {L('Juros: os do contrato; sem contrato, Selic − IPCA (Lei 14.905/2024). Cálculo para conferência — o Axioma não cobra nada sozinho.', 'Interest: the contract rate; without it, Selic − IPCA (Law 14.905/2024). For checking only — Axioma never charges anything on its own.', 'Intereses: los del contrato; sin contrato, Selic − IPCA (Ley 14.905/2024). Cálculo para verificación — Axioma no cobra nada solo.')}</p>
      </div>
      <div className="rounded-xl p-3 space-y-1" style={aninhada}>
        <p className="font-bold">{L('Próxima ação', 'Next action', 'Próxima acción')}: <span style={{ color: P.VERDE }}>{nomeAcao(lang, i.acao.acao)}</span></p>
        <p style={{ color: P.CINZA }}>{porqueAcao(lang, i.acao.acao)}</p>
        <p className="pt-1"><b>{L('Causa provável', 'Likely cause', 'Causa probable')}:</b> {nomeCausa(lang, i.causaSugerida.causa)} <span style={{ color: P.CINZA }}>({i.causaSugerida.tipo === 'fato' ? L('confirmada', 'confirmed', 'confirmada') : L('a confirmar', 'to be confirmed', 'por confirmar')})</span></p>
        {i.promessa && <p><b>{nomePromessa(lang, i.promessa)}</b></p>}
        <p className="font-bold pt-1">{L('Nota de risco', 'Risk score', 'Nota de riesgo')}: {i.risco.score ?? L('sem histórico suficiente', 'not enough history', 'sin historial suficiente')}</p>
        {i.risco.score != null && i.risco.fatores.map((f) => <p key={f.chave} className="flex justify-between"><span style={{ color: P.CINZA }}>{nomeFator(lang, f.chave)}</span><span>{f.pontos > 0 ? '+' : ''}{f.pontos}</span></p>)}
        <p className="pt-1"><b>{L('Comportamento do cliente', 'Customer behaviour', 'Comportamiento del cliente')}:</b> {nomeTendencia(lang, i.dna.tendencia)}{i.dna.suficiente ? L(` · atraso médio ${i.dna.atrasoMedio} dias em ${i.dna.amostra} pagamentos`, ` · average delay ${i.dna.atrasoMedio} days over ${i.dna.amostra} payments`, ` · atraso promedio ${i.dna.atrasoMedio} días en ${i.dna.amostra} pagos`) : L(` · ${i.dna.amostra} pagamento(s) no histórico (mínimo 4)`, ` · ${i.dna.amostra} payment(s) in history (minimum 4)`, ` · ${i.dna.amostra} pago(s) en el historial (mínimo 4)`)}</p>
        <Link href="/contas-receber?filtro=vencido" className="inline-block mt-2 px-2.5 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Registrar recebimento em Contas a Receber', 'Record payment in Receivables', 'Registrar cobro en Cuentas por Cobrar')}</Link>
      </div>
      <div className="rounded-xl p-3 space-y-2" style={aninhada}>
        <p className="font-bold">{L('Contatos de cobrança', 'Collection contacts', 'Contactos de cobranza')}</p>
        {contatos === null ? <p style={{ color: P.CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p> : contatos.length === 0 ? <p style={{ color: P.CINZA }}>{L('Nenhum contato registrado.', 'No contacts yet.', 'Ningún contacto registrado.')}</p> : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {contatos.map((c) => (
              <li key={c.id} className="rounded-lg p-2" style={{ border: `1px solid ${P.BORDA}` }}>
                <div className="flex justify-between gap-2">
                  <span style={{ color: P.CINZA }}>{dataTxt(c.data)} · {nomeCanal(lang, c.canal)}</span>
                  <span className="flex gap-2 shrink-0">
                    <button type="button" aria-label={L('Editar', 'Edit', 'Editar')} title={L('Editar', 'Edit', 'Editar')} onClick={() => { setEditando(c.id); setTextoEdit(c.descricao) }}><Pencil size={13} /></button>
                    <button type="button" aria-label={L('Mover para a lixeira', 'Move to trash', 'Mover a la papelera')} title={L('Mover para a lixeira', 'Move to trash', 'Mover a la papelera')} onClick={() => void paraLixeira(c.id)}><Trash2 size={13} style={{ color: P.VERMELHO }} /></button>
                  </span>
                </div>
                {editando === c.id ? (
                  <div className="mt-1 space-y-1">
                    <textarea value={textoEdit} onChange={(e) => setTextoEdit(e.target.value)} rows={2} className="w-full rounded-lg p-1.5" style={campo} />
                    <div className="flex gap-1"><button type="button" onClick={() => void salvarEdicao(c.id)} className="px-2 py-1 rounded-lg text-white font-bold" style={{ background: BOTAO_ACAO }}>{L('Salvar', 'Save', 'Guardar')}</button><button type="button" onClick={() => setEditando(null)} className="px-2 py-1 rounded-lg text-white font-bold" style={{ background: BOTAO_SECUNDARIO }}>{L('Cancelar', 'Cancel', 'Cancelar')}</button></div>
                  </div>
                ) : <p className="mt-0.5 whitespace-pre-wrap">{c.descricao}</p>}
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-1 pt-1" style={{ borderTop: `1px solid ${P.BORDA}` }}>
          <div className="flex gap-1">
            <select aria-label={L('Canal', 'Channel', 'Canal')} value={novo.canal} onChange={(e) => setNovo({ ...novo, canal: e.target.value })} className="rounded-lg px-1.5 py-1" style={campo}>{CANAIS_CONTATO.map((c) => <option key={c} value={c}>{nomeCanal(lang, c)}</option>)}</select>
            <input type="date" aria-label={L('Data do contato', 'Contact date', 'Fecha del contacto')} value={novo.data} max={hojeISO()} onChange={(e) => setNovo({ ...novo, data: e.target.value })} className="rounded-lg px-1.5 py-1 flex-1" style={campo} />
          </div>
          <textarea aria-label={L('O que foi conversado', 'What was discussed', 'Lo que se habló')} placeholder={L('O que foi conversado', 'What was discussed', 'Lo que se habló')} value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} rows={2} className="w-full rounded-lg p-1.5" style={campo} />
          <button type="button" disabled={salvando} onClick={() => void salvarContato()} className="px-2.5 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Registrar contato', 'Save contact', 'Registrar contacto')}</button>
        </div>
        <div className="space-y-1 pt-2" style={{ borderTop: `1px solid ${P.BORDA}` }}>
          <p className="font-bold">{L('Promessa de pagamento', 'Payment promise', 'Promesa de pago')}</p>
          <div className="flex gap-1">
            <input inputMode="decimal" aria-label={L('Valor prometido', 'Promised amount', 'Valor prometido')} placeholder={L('Valor', 'Amount', 'Valor')} value={prom.valor} onChange={(e) => setProm({ ...prom, valor: e.target.value })} className="rounded-lg px-1.5 py-1 w-24" style={campo} />
            <input type="date" aria-label={L('Data prometida', 'Promised date', 'Fecha prometida')} value={prom.data} min={hojeISO()} onChange={(e) => setProm({ ...prom, data: e.target.value })} className="rounded-lg px-1.5 py-1 flex-1" style={campo} />
          </div>
          <button type="button" disabled={salvando} onClick={() => void salvarPromessa()} className="px-2.5 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_SECUNDARIO }}>{L('Registrar promessa', 'Save promise', 'Registrar promesa')}</button>
        </div>
      </div>
    </div>
  )
}

// Lixeira de 60 dias: contatos e promessas apagados; recuperar com um toque
function Lixeira({ empresaId, lang, P, fmt, dataTxt, aoMudar }: { empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; aoMudar: () => void }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const [l, setL] = useState<{ contatos: CobrancaInteracao[]; promessas: CobrancaCompromisso[] } | null>(null)
  const ler = () => listarLixeiraCobranca(empresaId).then(setL)
  useEffect(() => { void ler() }, [empresaId]) // eslint-disable-line react-hooks/exhaustive-deps
  const [agora] = useState(() => Date.now())
  const restam = (em?: string | null) => (em ? Math.max(0, DIAS_LIXEIRA - Math.floor((agora - new Date(em).getTime()) / 86400000)) : DIAS_LIXEIRA)
  const voltar = async (tipo: 'c' | 'p', id: string) => { const r = tipo === 'c' ? await restaurarInteracao(id) : await restaurarCompromisso(id); if (!r.erro) { void ler(); aoMudar() } }
  const itens = l ? [...l.contatos.map((c) => ({ k: 'c' as const, id: c.id, txt: `${dataTxt(c.data)} · ${nomeCanal(lang, c.canal)} — ${c.descricao}`, em: c.excluido_em })),
    ...l.promessas.map((p) => ({ k: 'p' as const, id: p.id, txt: `${L('Promessa', 'Promise', 'Promesa')} ${fmt(Number(p.valor_compromissado))} — ${dataTxt(p.data_compromissada)}`, em: (p as CobrancaCompromisso & { excluido_em?: string }).excluido_em }))] : []
  return (
    <div className="rounded-xl p-3 mb-3 text-xs" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
      <p className="font-bold mb-1">{L(`Lixeira (recupera por ${DIAS_LIXEIRA} dias)`, `Trash (recoverable for ${DIAS_LIXEIRA} days)`, `Papelera (se recupera por ${DIAS_LIXEIRA} días)`)}</p>
      {l === null ? <p style={{ color: P.CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p> : itens.length === 0 ? <p style={{ color: P.CINZA }}>{L('A lixeira está vazia.', 'Trash is empty.', 'La papelera está vacía.')}</p> : (
        <ul className="space-y-1">
          {itens.map((x) => (
            <li key={x.k + x.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">{x.txt} <span style={{ color: P.CINZA }}>({L(`${restam(x.em)} dias para recuperar`, `${restam(x.em)} days left`, `${restam(x.em)} días para recuperar`)})</span></span>
              <button type="button" onClick={() => void voltar(x.k, x.id)} className="px-2 py-1 rounded-lg text-white font-bold flex items-center gap-1 shrink-0" style={{ background: BOTAO_ACAO }}><RotateCcw size={12} />{L('Recuperar', 'Restore', 'Recuperar')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


// A pagar: importância do fornecedor (lápis), motivos da prioridade e caminho para pagar na origem
function DetalhePagar({ i, empresaId, lang, P, fmt, aoMudar, avisar }: { i: ItemVencido; empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string; aoMudar: () => void; avisar: (m: string) => void }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const aninhada = { background: P.ANINHADA, border: `1px solid ${P.BORDA}` }
  const campo = { background: P.CAMPO, color: P.TEXTO, border: `1px solid ${P.BORDA}` }
  const [ed, setEd] = useState({ criticidade: i.caso?.criticidade ?? 'media', risco_interrupcao: !!i.caso?.risco_interrupcao, impacto_producao: !!i.caso?.impacto_producao, impacto_vendas: !!i.caso?.impacto_vendas })
  const [salvando, setSalvando] = useState(false)
  const salvar = async () => {
    setSalvando(true)
    const r = await salvarCaso(empresaId, 'pagar', i.titulo.id, ed, 'importância do fornecedor')
    setSalvando(false)
    if (!r.ok) return avisar(L('Não foi possível salvar. Só dono, sócio, admin e financeiro podem alterar.', 'Could not save. Only owner, partner, admin and finance can change it.', 'No fue posible guardar. Solo dueño, socio, admin y finanzas pueden cambiarlo.'))
    aoMudar(); avisar(L('Importância do fornecedor salva — a prioridade foi recalculada.', 'Supplier importance saved — priority recalculated.', 'Importancia del proveedor guardada — la prioridad se recalculó.'))
  }
  const enc = i.encargos
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-xs" style={{ color: P.TEXTO }}>
      <div className="rounded-xl p-3 space-y-1" style={aninhada}>
        <p className="font-bold mb-1">{L('Valores', 'Amounts', 'Valores')}</p>
        {[[L('Valor original', 'Original amount', 'Valor original'), i.titulo.valor], [L('Saldo em aberto', 'Open balance', 'Saldo pendiente'), i.saldo], [L('Multa', 'Fine', 'Multa'), enc.multa], [L('Juros', 'Interest', 'Intereses'), enc.juros], [L('Correção (IPCA)', 'Inflation update (IPCA)', 'Actualización (IPCA)'), enc.atualizacao], [L('Total atualizado', 'Updated total', 'Total actualizado'), enc.total]]
          .map(([t, v]) => <p key={String(t)} className="flex justify-between"><span style={{ color: P.CINZA }}>{t}</span><b>{fmt(Number(v))}</b></p>)}
        <p className="text-[11px] pt-1" style={{ color: P.CINZA }}>{L('Estimativa pelo contrato; sem taxa no contrato, juros pela taxa legal (Selic − IPCA). Confira com o fornecedor.', 'Estimate by contract; without a contract rate, interest by the legal rate (Selic − IPCA). Check with the supplier.', 'Estimación por contrato; sin tasa en el contrato, intereses por la tasa legal (Selic − IPCA). Confirme con el proveedor.')}</p>
      </div>
      <div className="rounded-xl p-3 space-y-1" style={aninhada}>
        <p className="font-bold">{L('Próxima ação', 'Next action', 'Próxima acción')}: <span style={{ color: P.VERDE }}>{nomeAcao(lang, i.acao.acao)}</span></p>
        <p style={{ color: P.CINZA }}>{porqueAcao(lang, i.acao.acao)}</p>
        <p className="font-bold pt-1">{L('Prioridade de pagamento', 'Payment priority', 'Prioridad de pago')}: {i.prioridade.score}</p>
        {i.prioridade.fatores.map((f) => <p key={f.chave} className="flex justify-between"><span style={{ color: P.CINZA }}>{nomeFator(lang, f.chave)}</span><span>{f.pontos > 0 ? '+' : ''}{f.pontos}</span></p>)}
        <Link href="/contas-pagar?filtro=vencido" className="inline-block mt-2 px-2.5 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Pagar em Contas a Pagar', 'Pay in Payables', 'Pagar en Cuentas por Pagar')}</Link>
      </div>
      <div className="rounded-xl p-3 space-y-2" style={aninhada}>
        <p className="font-bold flex items-center gap-1"><Pencil size={13} />{L('Importância do fornecedor', 'Supplier importance', 'Importancia del proveedor')}</p>
        <select aria-label={L('Importância', 'Importance', 'Importancia')} value={ed.criticidade} onChange={(e) => setEd({ ...ed, criticidade: e.target.value as typeof ed.criticidade })} className="w-full rounded-lg px-1.5 py-1" style={campo}>
          {(['critica', 'alta', 'media', 'baixa'] as const).map((c) => <option key={c} value={c}>{nomeCriticidade(lang, c)}</option>)}
        </select>
        {([['risco_interrupcao', L('Pode parar o fornecimento', 'Supply may stop', 'Puede cortar el suministro')], ['impacto_producao', L('Atraso afeta a produção', 'Delay affects production', 'El atraso afecta la producción')], ['impacto_vendas', L('Atraso afeta as vendas', 'Delay affects sales', 'El atraso afecta las ventas')]] as const).map(([k, t]) => (
          <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={ed[k]} onChange={(e) => setEd({ ...ed, [k]: e.target.checked })} />{t}</label>
        ))}
        <button type="button" disabled={salvando} onClick={() => void salvar()} className="px-2.5 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Salvar importância', 'Save importance', 'Guardar importancia')}</button>
        <p className="text-[11px]" style={{ color: P.CINZA }}>{L('Um fornecedor essencial pode vir antes de uma conta maior ou mais antiga.', 'An essential supplier may come before a larger or older bill.', 'Un proveedor esencial puede ir antes que una cuenta mayor o más antigua.')}</p>
      </div>
    </div>
  )
}

// Simulação de regularização: o que acontece com o caixa se pagar as contas marcadas (não grava nada)
function SimulacaoPagamento({ itens, tesouraria, lang, P, fmt }: { itens: ItemVencido[]; tesouraria: BaseTesouraria; lang: Lang; P: Paleta; fmt: (v: number) => string }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const s = simularPagamentos(tesouraria, itens.map((i) => i.encargos.total))
  return (
    <div className="rounded-xl p-3 mb-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
      <p className="col-span-2 sm:col-span-4 font-bold">{L(`Simulação: pagar as ${itens.length} marcada(s) — não altera nada`, `Simulation: pay the ${itens.length} selected — changes nothing`, `Simulación: pagar las ${itens.length} marcada(s) — no cambia nada`)}</p>
      <p><span style={{ color: P.CINZA }}>{L('A pagar (com juros e multa)', 'To pay (with interest and fines)', 'A pagar (con intereses y multas)')}</span><br /><b>{fmt(s.pagamento)}</b></p>
      <p><span style={{ color: P.CINZA }}>{L('Caixa hoje', 'Cash today', 'Caja hoy')}</span><br /><b>{fmt(s.caixaAntes)}</b></p>
      <p><span style={{ color: P.CINZA }}>{L('Caixa depois', 'Cash after', 'Caja después')}</span><br /><b style={{ color: s.caixaDepois < 0 ? P.VERMELHO : P.TEXTO }}>{fmt(s.caixaDepois)}</b></p>
      <p><span style={{ color: P.CINZA }}>{L('Folga sobre a reserva mínima', 'Margin over minimum reserve', 'Margen sobre la reserva mínima')}</span><br /><b style={{ color: s.abaixoDaReserva ? P.VERMELHO : P.VERDE }}>{fmt(s.folgaSobreReserva)}</b></p>
    </div>
  )
}
