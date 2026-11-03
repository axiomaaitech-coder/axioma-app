'use client'
// Central de contas vencidas — a receber (Fase 2 etapa 2) e a pagar (etapa 3), uma peça só para os dois lados. Usa a análise já carregada pela
// tela (motor de vencidos) — nada recalculado aqui. Escreve só contato e promessa de cobrança (tabelas que já
// existem); o recebimento continua em Contas a Receber (origem única). Contato: lápis + lixeira de 60 dias, sem senha.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, FileDown, Pencil, RotateCcw, Sheet, Trash2, X } from 'lucide-react'
import type { ItemVencido } from '../../../lib/vencidos/dados'
import { registrarPromessa, salvarCaso, listarNegociacoes, proporNegociacao, decidirNegociacao, type PropostaNegociacao } from '../../../lib/vencidos/dados'
import { simularPagamentos, linhaDoTempo, emAberto, saldoDoTitulo, previsaoRecuperacao, simularNegociacao, recomendarNegociacao, disputaParada, type BaseTesouraria, type Titulo, type OpcaoNegociacao } from '../../../lib/vencidos/motor'
import ReactECharts from 'echarts-for-react'
import { optBarrasV, coresSituacao, corTextoSituacao } from '../../../lib/cfoCore'
import { criarInteracao, listarInteracoes, listarInteracoesCliente, excluirInteracao, restaurarInteracao, atualizarInteracao, listarLixeiraCobranca, restaurarCompromisso, DIAS_LIXEIRA, type CobrancaInteracao, type CobrancaCompromisso } from '../../../lib/cobrancaHelpers'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { montarMensagem, modeloSugerido, nomeMensagem, linkWhatsapp, linkEmail, TIPOS_MENSAGEM, type TipoMensagem } from '../../../lib/vencidos/mensagens'
import { exportarPlanilha } from '../../../lib/exportarPlanilha'
import { createClient } from '../../../lib/supabase/client'
import { hojeISO, somarDiasISO } from '../../../lib/datas'
import { explicarAcao } from '../../../lib/vencidos/explicacao'
import { nomeAcao, nomeFator, nomePromessa, nomeCanal, nomeCausa, nomeTendencia, nomeCriticidade, CANAIS_CONTATO, type Lang } from '../../../lib/vencidos/textos'

type Paleta = { VERDE: string; VERMELHO: string; ALERTA: string; CINZA: string; TEXTO: string; PAINEL_BG: string; ANINHADA: string; BORDA: string; CAMPO: string }
type Ordem = 'prioridade' | 'atraso' | 'saldo' | 'cliente'
const POR_PAGINA = 20
// Situação pelo cenário (cores do Axioma, sempre com o número/rótulo junto)
const nivelRisco = (score: number | null) => (score == null ? 'neutro' : score >= 700 ? 'critico' : score >= 400 ? 'atencao' : 'bom') as 'bom' | 'atencao' | 'critico' | 'neutro'
const nivelAtraso = (dias: number) => (dias <= 0 ? 'bom' : dias <= 30 ? 'atencao' : 'critico') as 'bom' | 'atencao' | 'critico'
const nivelTendencia = (t: string) => (t === 'piora' ? 'critico' : t === 'melhora' ? 'bom' : 'neutro') as 'bom' | 'critico' | 'neutro'
const BOTAO_ACAO = 'linear-gradient(135deg, #0a4f3b, #0f7d5c)'
const BOTAO_SECUNDARIO = '#101b3d'

export default function CentralVencidos({ dominio, itens, empresaId, lang, P, fmt, dataTxt, tesouraria, titulos, temaClaro }: { dominio: 'receber' | 'pagar'; itens: ItemVencido[]; empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; tesouraria: BaseTesouraria; titulos: Titulo[]; temaClaro: boolean }) {
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
  const [dossie, setDossie] = useState<ItemVencido | null>(null)
  const [verLixeira, setVerLixeira] = useState(false)
  const [aviso, setAviso] = useState('')
  // tabela no computador OU cartões no celular — nunca os dois montados (antes os detalhes abriam 2× e liam o banco 2×)
  const [estreito, setEstreito] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const ver = () => setEstreito(mq.matches)
    ver(); mq.addEventListener('change', ver)
    return () => mq.removeEventListener('change', ver)
  }, [])

  const ordenados = useMemo(() => [...itens].sort((a, b) =>
    ordem === 'atraso' ? b.encargos.dias - a.encargos.dias
      : ordem === 'saldo' ? b.saldo - a.saldo
        : ordem === 'cliente' ? a.titulo.contraparteNome.localeCompare(b.titulo.contraparteNome)
          : (b.prioridade.score ?? 0) - (a.prioridade.score ?? 0)), [itens, ordem])
  // "Abrir" na Central de divergências: abre a conta aqui, na página certa, e rola até ela
  useEffect(() => {
    const abrir = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; dominio: string }>).detail
      if (d?.dominio !== dominio) return
      const pos = ordenados.findIndex((x) => x.titulo.id === d.id)
      if (pos < 0) return
      setPagina(Math.floor(pos / POR_PAGINA)); setAberto(d.id)
      setTimeout(() => document.getElementById(`conta-${d.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
    window.addEventListener('axioma:abrir-conta', abrir)
    return () => window.removeEventListener('axioma:abrir-conta', abrir)
  }, [dominio, ordenados])
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
      {dossie && <Dossie i={dossie} dominio={dominio} itens={itens} historico={titulos} empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} temaClaro={temaClaro} onFechar={() => setDossie(null)} onAbrirConta={(id) => { setAberto(id); setDossie(null) }} />}
      {!pagar && verLixeira && <Lixeira empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} aoMudar={recarregar} />}

      {itens.length === 0 ? (
        <p className="text-xs py-4 text-center" style={{ color: P.VERDE }}>{pagar ? L('Nenhuma conta a pagar vencida com estes filtros.', 'No overdue payables with these filters.', 'Ninguna cuenta por pagar vencida con estos filtros.') : L('Nenhuma conta a receber vencida com estes filtros.', 'No overdue receivables with these filters.', 'Ninguna cuenta por cobrar vencida con estos filtros.')}</p>
      ) : (
        <>
          {/* Computador: tabela */}
          {!estreito && <div className="overflow-x-auto">
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
                    marcado={selecionados.has(i.titulo.id)} onMarcar={() => marcar(i.titulo.id)} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} risco={colRisco(i)} corRisco={pagar ? P.TEXTO : corTextoSituacao(nivelRisco(i.risco.score), temaClaro)} contato={colContato(i)} corSaldo={corSaldo} dias={dias(i.encargos.dias)} onDossie={() => setDossie(i)}
                    detalhe={pagar ? <DetalhePagar i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} aoMudar={recarregar} avisar={avisar} /> : <Detalhe i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} aoMudar={recarregar} avisar={avisar} historico={titulos} itens={itens} temaClaro={temaClaro} />} />
                ))}
              </tbody>
            </table>
          </div>}
          {/* Celular: cartões */}
          {estreito && <div className="space-y-2">
            {visiveis.map((i) => (
              <div key={i.titulo.id} id={`conta-${i.titulo.id}`} className="rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={aninhada}>
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
                  <button type="button" onClick={() => setDossie(i)} className="px-2 py-1 rounded-lg text-[11px] font-bold text-white shrink-0" style={{ background: BOTAO_SECUNDARIO }}>{L('Dossiê', 'Dossier', 'Expediente')}</button>
                </div>
                {aberto === i.titulo.id && <div className="mt-2">{pagar ? <DetalhePagar i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} aoMudar={recarregar} avisar={avisar} /> : <Detalhe i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} aoMudar={recarregar} avisar={avisar} historico={titulos} itens={itens} temaClaro={temaClaro} />}</div>}
              </div>
            ))}
          </div>}
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

function FragmentoLinha({ i, aberto, onAbrir, marcado, onMarcar, lang, P, fmt, dataTxt, risco, corRisco, contato, corSaldo, dias, detalhe, onDossie }: { i: ItemVencido; aberto: boolean; onAbrir: () => void; marcado: boolean; onMarcar: () => void; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; risco: string; corRisco: string; contato: string; corSaldo: string; dias: string; detalhe: ReactNode; onDossie: () => void }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  return (
    <>
      <tr id={`conta-${i.titulo.id}`} className="cursor-pointer" style={{ borderTop: `1px solid ${P.BORDA}` }} onClick={onAbrir}>
        <td className="p-1.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={L('Marcar', 'Select', 'Marcar')} checked={marcado} onChange={onMarcar} /></td>
        <td className="p-1.5 max-w-[14rem]"><button type="button" className="font-semibold truncate underline decoration-dotted text-left max-w-full" title={L('Abrir dossiê', 'Open dossier', 'Abrir expediente')} onClick={(e) => { e.stopPropagation(); onDossie() }}>{i.titulo.contraparteNome}</button><p className="truncate" style={{ color: P.CINZA }}>{i.titulo.descricao || '—'}</p></td>
        <td className="p-1.5 whitespace-nowrap">{dataTxt(i.titulo.vencimento)}<br /><b style={{ color: i.encargos.dias > 30 ? P.VERMELHO : P.TEXTO }}>{dias}</b></td>
        <td className="p-1.5 text-right whitespace-nowrap">{fmt(i.titulo.valor)}</td>
        <td className="p-1.5 text-right whitespace-nowrap font-bold" style={{ color: corSaldo }}>{fmt(i.saldo)}</td>
        <td className="p-1.5 text-right whitespace-nowrap">{fmt(Math.max(0, i.encargos.total - i.saldo))}</td>
        <td className="p-1.5 text-right whitespace-nowrap font-semibold" style={{ color: corRisco }}>{risco}</td>
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
// Explicação completa da próxima ação (etapa 10): por quê, dados usados, benefício, risco e próximo passo
function ExplicacaoAcao({ i, lang, P, fmt }: { i: ItemVencido; lang: Lang; P: Paleta; fmt: (v: number) => string }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const x = explicarAcao(lang, i, hojeISO(), fmt)
  const bloco = (t: string, txt: string, cor?: string) => <p><b style={{ color: cor ?? P.TEXTO }}>{t}:</b> <span style={{ color: P.TEXTO }}>{txt}</span></p>
  return (
    <div className="space-y-1 rounded-lg p-2" style={{ border: `1px solid ${P.BORDA}` }}>
      {bloco(L('Por quê', 'Why', 'Por qué'), x.porque)}
      <div><b>{L('Dados usados', 'Data used', 'Datos usados')}:</b>
        <ul className="list-disc pl-4" style={{ color: P.CINZA }}>{x.dados.map((d) => <li key={d}>{d}</li>)}</ul>
      </div>
      {bloco(L('Benefício', 'Benefit', 'Beneficio'), x.beneficio, P.VERDE)}
      {bloco(L('Risco de não fazer', 'Risk of not doing it', 'Riesgo de no hacerlo'), x.risco, P.VERMELHO)}
      {bloco(L('Próximo passo', 'Next step', 'Próximo paso'), x.passo, P.VERDE)}
    </div>
  )
}

function Detalhe({ i, empresaId, lang, P, fmt, dataTxt, aoMudar, avisar, historico, itens, temaClaro }: { i: ItemVencido; empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; aoMudar: () => void; avisar: (m: string) => void; historico: Titulo[]; itens: ItemVencido[]; temaClaro: boolean }) {
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
      <div className="rounded-xl p-3 space-y-1 axi-card-premium3d axi-card-faixa" style={aninhada}>
        <Titulo P={P} texto={L('Valores', 'Amounts', 'Valores')} href="/contas-receber?filtro=vencido" ir={L('Contas a Receber', 'Receivables', 'Cuentas por Cobrar')} />
        {[[L('Valor original', 'Original amount', 'Valor original'), i.titulo.valor], [L('Saldo em aberto', 'Open balance', 'Saldo pendiente'), i.saldo], [L('Multa', 'Fine', 'Multa'), enc.multa], [L('Juros', 'Interest', 'Intereses'), enc.juros], [L('Correção (IPCA)', 'Inflation update (IPCA)', 'Actualización (IPCA)'), enc.atualizacao], [L('Total atualizado', 'Updated total', 'Total actualizado'), enc.total]]
          .map(([t, v]) => <p key={String(t)} className="flex justify-between"><span style={{ color: P.CINZA }}>{t}</span><b>{fmt(Number(v))}</b></p>)}
        {i.disputa.aberta && <p style={{ color: P.CINZA }}>{L(`Contestado: ${fmt(i.disputa.contestado)}`, `Disputed: ${fmt(i.disputa.contestado)}`, `Disputado: ${fmt(i.disputa.contestado)}`)}</p>}
        <p className="text-[11px] pt-1" style={{ color: P.CINZA }}>{baseLegal} {L('Juros: os do contrato; sem contrato, Selic − IPCA (Lei 14.905/2024). Cálculo para conferência — o Axioma não cobra nada sozinho.', 'Interest: the contract rate; without it, Selic − IPCA (Law 14.905/2024). For checking only — Axioma never charges anything on its own.', 'Intereses: los del contrato; sin contrato, Selic − IPCA (Ley 14.905/2024). Cálculo para verificación — Axioma no cobra nada solo.')}</p>
      </div>
      <div className="rounded-xl p-3 space-y-1 axi-card-premium3d axi-card-faixa" style={aninhada}>
        <p className="font-bold">{L('Próxima ação', 'Next action', 'Próxima acción')}: <span style={{ color: P.VERDE }}>{nomeAcao(lang, i.acao.acao)}</span></p>
        <ExplicacaoAcao i={i} lang={lang} P={P} fmt={fmt} />
        <p className="pt-1"><b>{L('Causa provável', 'Likely cause', 'Causa probable')}:</b> {nomeCausa(lang, i.causaSugerida.causa)} <span style={{ color: P.CINZA }}>({i.causaSugerida.tipo === 'fato' ? L('confirmada', 'confirmed', 'confirmada') : L('a confirmar', 'to be confirmed', 'por confirmar')})</span></p>
        {i.promessa && <p><b>{nomePromessa(lang, i.promessa)}</b></p>}
        <p className="font-bold pt-1">{L('Nota de risco', 'Risk score', 'Nota de riesgo')}: {i.risco.score ?? L('sem histórico suficiente', 'not enough history', 'sin historial suficiente')}</p>
        {i.risco.score != null && i.risco.fatores.map((f) => <p key={f.chave} className="flex justify-between"><span style={{ color: P.CINZA }}>{nomeFator(lang, f.chave)}</span><span>{f.pontos > 0 ? '+' : ''}{f.pontos}</span></p>)}
        <p className="pt-1"><b>{L('Comportamento do cliente', 'Customer behaviour', 'Comportamiento del cliente')}:</b> {nomeTendencia(lang, i.dna.tendencia)}{i.dna.suficiente ? L(` · atraso médio ${i.dna.atrasoMedio} dias em ${i.dna.amostra} pagamentos`, ` · average delay ${i.dna.atrasoMedio} days over ${i.dna.amostra} payments`, ` · atraso promedio ${i.dna.atrasoMedio} días en ${i.dna.amostra} pagos`) : L(` · ${i.dna.amostra} pagamento(s) no histórico (mínimo 4)`, ` · ${i.dna.amostra} payment(s) in history (minimum 4)`, ` · ${i.dna.amostra} pago(s) en el historial (mínimo 4)`)}</p>
        <Link href="/contas-receber?filtro=vencido" className="inline-block mt-2 px-2.5 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Registrar recebimento em Contas a Receber', 'Record payment in Receivables', 'Registrar cobro en Cuentas por Cobrar')}</Link>
      </div>
      <div className="rounded-xl p-3 space-y-2 axi-card-premium3d axi-card-faixa" style={aninhada}>
        <Titulo P={P} texto={L('Contatos de cobrança', 'Collection contacts', 'Contactos de cobranza')} href="/inadimplencia" ir={L('Régua de cobrança', 'Collection schedule', 'Regla de cobranza')} />
        {contatos === null ? <p style={{ color: P.CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p> : contatos.length === 0 ? <p style={{ color: P.CINZA }}>{L('Nenhum contato registrado.', 'No contacts yet.', 'Ningún contacto registrado.')}</p> : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {contatos.map((c) => (
              <li key={c.id} className="rounded-lg p-2 axi-card-premium3d axi-card-faixa" style={{ border: `1px solid ${P.BORDA}` }}>
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
      <DisputaBloco i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} aoMudar={aoMudar} avisar={avisar} />
      <NegociacaoCliente i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} aoMudar={aoMudar} avisar={avisar} />
      <MensagemCliente i={i} empresaId={empresaId} lang={lang} P={P} aoEnviar={() => { void ler(); aoMudar() }} avisar={avisar} />
      <DnaCliente i={i} historico={historico} itens={itens} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} temaClaro={temaClaro} />
    </div>
  )
}

// Central de comunicação (etapa 6): modelo de mensagem com o dado real da conta; a PESSOA envia (copiar,
// WhatsApp ou e-mail dela) e marca como enviada — aí o contato entra no histórico. Nada sai do Axioma sozinho.
function MensagemCliente({ i, empresaId, lang, aoEnviar, avisar }: { i: ItemVencido; empresaId: string; lang: Lang; P: Paleta; aoEnviar: () => void; avisar: (m: string) => void }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const promessaAberta = !!i.promessa && ['pendente', 'confirmada', 'parcialmente_cumprida'].includes(i.promessa)
  const [tipo, setTipo] = useState<TipoMensagem>(() => modeloSugerido(i.encargos.dias, promessaAberta))
  const [idioma, setIdioma] = useState<'pt' | 'en' | 'es'>('pt')
  const [ctx, setCtx] = useState<{ empresa: string; telefone: string | null; email: string | null } | null>(null)
  const [editado, setEditado] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null) // canal aberto, aguardando "marcar como enviada"
  useEffect(() => {
    let vivo = true
    const sb = createClient()
    void Promise.all([
      sb.from('empresas').select('nome').eq('id', empresaId).maybeSingle(),
      i.titulo.contraparteId ? sb.from('clientes').select('whatsapp, telefone, email').eq('id', i.titulo.contraparteId).maybeSingle() : Promise.resolve({ data: null }),
    ]).then(([e, c]) => {
      const cli = c.data as { whatsapp?: string | null; telefone?: string | null; email?: string | null } | null
      if (vivo) setCtx({ empresa: (e.data as { nome?: string } | null)?.nome ?? '', telefone: cli?.whatsapp || cli?.telefone || null, email: cli?.email ?? null })
    })
    return () => { vivo = false }
  }, [empresaId, i.titulo.contraparteId])
  const loc = idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR'
  const dataMsg = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(loc)
  const valorMsg = (v: number) => v.toLocaleString(loc, { style: 'currency', currency: 'BRL' })
  const m = montarMensagem(tipo, idioma, {
    cliente: i.titulo.contraparteNome, empresa: ctx?.empresa ?? '', descricao: i.titulo.descricao || '—', valor: valorMsg(i.saldo),
    vencimento: dataMsg(i.titulo.vencimento), dias: i.encargos.dias,
    promessaValor: promessaAberta && i.promessaFalta ? valorMsg(i.promessaFalta) : null, promessaData: null,
  })
  const texto = editado ?? m.texto
  const wa = linkWhatsapp(ctx?.telefone, texto), mail = linkEmail(ctx?.email, m.assunto, texto)
  const marcarEnviada = async () => {
    const { data: u } = await createClient().auth.getUser()
    const r = await criarInteracao(u.user?.id ?? '', empresaId, { conta_id: i.titulo.id, cliente_id: i.titulo.contraparteId, tipo: 'contato', canal: aberto ?? 'whatsapp', descricao: `${nomeMensagem(idioma, tipo)}: ${texto}`.slice(0, 2000), data: hojeISO() })
    if (r.erro) return avisar(L('Não foi possível registrar o envio.', 'Could not record the message.', 'No fue posible registrar el envío.'))
    setAberto(null); aoEnviar(); avisar(L('Mensagem registrada no histórico de contatos.', 'Message recorded in the contact history.', 'Mensaje registrado en el historial de contactos.'))
  }
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setAberto('outro'); avisar(L('Texto copiado.', 'Text copied.', 'Texto copiado.')) }
    catch { avisar(L('Não foi possível copiar — selecione o texto e copie.', 'Could not copy — select the text and copy it.', 'No fue posible copiar — seleccione el texto y cópielo.')) }
  }
  const sugerido = modeloSugerido(i.encargos.dias, promessaAberta)
  // Cores do Axioma nos 2 temas: cartão azul-marinho, letra branca, modelo escolhido verde-menta escuro
  const MSG = { fundo: 'linear-gradient(160deg, #101b3d 0%, #0a1628 100%)', borda: 'rgba(46,204,155,0.35)', botao: '#122b54', texto: 'rgba(10,22,40,0.65)', suave: '#c8d3e0' }
  const botao = 'px-4 py-2.5 rounded-xl text-sm font-bold text-white'
  return (
    <div className="lg:col-span-3 rounded-2xl p-4 md:p-5 space-y-4 axi-card-premium3d axi-card-faixa" style={{ background: MSG.fundo, border: `1px solid ${MSG.borda}` }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base md:text-lg font-bold" style={{ color: '#ffffff' }}>{L('Mensagem ao cliente', 'Message to the customer', 'Mensaje al cliente')}</p>
          <p className="text-sm mt-0.5" style={{ color: MSG.suave }}>{L('Escolha o modelo — o texto já vem com os dados reais da conta e pode ser ajustado antes de enviar.', 'Pick a template — the text comes with the real bill data and can be adjusted before sending.', 'Elija el modelo — el texto viene con los datos reales de la cuenta y se puede ajustar antes de enviar.')}</p>
        </div>
        <label className="text-sm flex items-center gap-2" style={{ color: '#ffffff' }}>{L('Idioma', 'Language', 'Idioma')}
          <select aria-label={L('Idioma da mensagem', 'Message language', 'Idioma del mensaje')} value={idioma} onChange={(e) => { setIdioma(e.target.value as 'pt' | 'en' | 'es'); setEditado(null) }} className="rounded-xl px-3 py-2 text-sm" style={{ background: MSG.botao, color: '#ffffff', border: `1px solid ${MSG.borda}` }}>
            <option value="pt">Português</option><option value="en">English</option><option value="es">Español</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={L('Modelos de mensagem', 'Message templates', 'Modelos de mensaje')}>
        {TIPOS_MENSAGEM.map((t) => (
          <button key={t} type="button" aria-pressed={tipo === t} onClick={() => { setTipo(t); setEditado(null) }}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold axi-card-premium3d axi-card-faixa"
            style={tipo === t ? { background: BOTAO_ACAO, color: '#ffffff', border: '1px solid #2ecc9b' } : { background: MSG.botao, color: '#ffffff', border: `1px solid ${MSG.borda}` }}>
            {nomeMensagem(lang, t)}{t === sugerido ? ` · ${L('sugerido', 'suggested', 'sugerido')}` : ''}
          </button>
        ))}
      </div>
      <div className="rounded-2xl p-1 axi-card-premium3d axi-card-faixa" style={{ border: '1px solid rgba(46,204,155,0.55)', background: MSG.texto }}>
        <textarea aria-label={L('Texto da mensagem', 'Message text', 'Texto del mensaje')} value={texto} onChange={(e) => setEditado(e.target.value)} rows={13}
          className="w-full rounded-xl p-4 text-[15px] md:text-base leading-relaxed outline-none resize-y" style={{ background: 'transparent', color: '#ffffff' }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void copiar()} className={botao} style={{ background: MSG.botao, border: `1px solid ${MSG.borda}` }}>{L('Copiar texto', 'Copy text', 'Copiar texto')}</button>
        {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => setAberto('whatsapp')} className={botao} style={{ background: BOTAO_ACAO }}>{L('Abrir no WhatsApp', 'Open in WhatsApp', 'Abrir en WhatsApp')}</a>
          : <span className="px-2 py-2.5 text-sm" style={{ color: MSG.suave }}>{L('WhatsApp: cliente sem telefone no cadastro', 'WhatsApp: no phone on file', 'WhatsApp: cliente sin teléfono registrado')}</span>}
        {mail ? <a href={mail} onClick={() => setAberto('email')} className={botao} style={{ background: BOTAO_ACAO }}>{L('Abrir no e-mail', 'Open in email', 'Abrir en correo')}</a>
          : <span className="px-2 py-2.5 text-sm" style={{ color: MSG.suave }}>{L('E-mail: cliente sem e-mail no cadastro', 'Email: no address on file', 'Correo: cliente sin correo registrado')}</span>}
        {aberto && <button type="button" onClick={() => void marcarEnviada()} className={botao} style={{ background: BOTAO_ACAO }}>{L('Marcar como enviada', 'Mark as sent', 'Marcar como enviada')}</button>}
      </div>
      <p className="text-sm" style={{ color: MSG.suave }}>{L('Quem envia é você, pelo seu WhatsApp ou e-mail — o Axioma não manda nada sozinho. Os textos são cordiais e firmes, sem ameaça nem constrangimento (Código de Defesa do Consumidor, art. 42). Envio automático (WhatsApp Business, e-mail, SMS): não configurado.', 'You send it, from your own WhatsApp or email — Axioma never sends anything on its own. Texts are friendly and firm, with no threats or embarrassment (Consumer Code, art. 42). Automatic sending (WhatsApp Business, email, SMS): not configured.', 'Usted lo envía, desde su WhatsApp o correo — Axioma no envía nada solo. Los textos son cordiales y firmes, sin amenazas ni vergüenza (Código de Defensa del Consumidor, art. 42). Envío automático (WhatsApp Business, correo, SMS): no configurado.')}</p>
    </div>
  )
}

// DNA de pagamento do cliente (etapa 4): perfil, linha do tempo dos atrasos, tendência com os números que a
// sustentam, promessas, acordos e exposição. Tudo do motor (dnaFinanceiro/linhaDoTempo) — nada calculado aqui.
function DnaCliente({ i, historico, itens, lang, P, fmt, dataTxt, temaClaro }: { i: ItemVencido; historico: Titulo[]; itens: ItemVencido[]; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; temaClaro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const d = i.dna
  const doCliente = historico.filter((t) => (t.contraparteId ?? t.contraparteNome) === (i.titulo.contraparteId ?? i.titulo.contraparteNome))
  const pontos = linhaDoTempo(doCliente)
  const hoje = hojeISO()
  const vencidoCliente = itens.filter((x) => (x.titulo.contraparteId ?? x.titulo.contraparteNome) === (i.titulo.contraparteId ?? i.titulo.contraparteNome)).reduce((s, x) => s + x.saldo, 0)
  const abertoCliente = doCliente.filter((t) => emAberto(t, hoje)).reduce((s, t) => s + saldoDoTitulo(t, hoje), 0)
  const cs = coresSituacao(temaClaro)
  const opcao = pontos.length ? (() => {
    const o = optBarrasV(pontos.map((p) => p.dias), pontos.map((p) => dataTxt(p.data)), cs.atencao, cs.atencao, pontos.map((p) => cs[nivelAtraso(p.dias)]), temaClaro)
    const diasTxt = L('dias de atraso', 'days late', 'días de atraso'), emDia = L('pago em dia', 'paid on time', 'pagado a tiempo')
    return {
      ...o, grid: { ...o.grid, left: 36, right: 8, top: 24, bottom: 28 },
      yAxis: { ...o.yAxis, axisLabel: { ...o.yAxis.axisLabel, formatter: (v: number) => String(v) } },
      tooltip: { ...o.tooltip, formatter: (p: { dataIndex: number }) => { const x = pontos[p.dataIndex]; return `<b>${dataTxt(x.data)}</b><br/>${x.dias ? `${x.dias} ${diasTxt}` : emDia}<br/>${fmt(x.valor)}` } },
      series: [{ ...o.series[0], barMaxWidth: 36, label: { ...o.series[0].label, formatter: (p: { value: number }) => (p.value > 0 ? String(p.value) : '') } }],
    }
  })() : null
  const n = (v: number | null, suf = '') => (v == null ? '—' : `${v.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR')}${suf}`)
  const dias = L(' dias', ' days', ' días')
  // por que a tendência: os números das duas janelas (fato), e a conclusão (inferência)
  const base = d.amostraRecente >= 2 && d.amostraAnterior >= 2
    ? L(`Antes: atraso médio ${n(d.anteriorAtraso, dias)}${d.anteriorPrazo != null ? `, prazo ${n(d.anteriorPrazo, dias)}` : ''} em ${d.amostraAnterior} pagamentos. Últimos 6 meses: atraso médio ${n(d.recenteAtraso, dias)}${d.recentePrazo != null ? `, prazo ${n(d.recentePrazo, dias)}` : ''} em ${d.amostraRecente} pagamentos.`,
      `Before: average delay ${n(d.anteriorAtraso, dias)}${d.anteriorPrazo != null ? `, term ${n(d.anteriorPrazo, dias)}` : ''} over ${d.amostraAnterior} payments. Last 6 months: average delay ${n(d.recenteAtraso, dias)}${d.recentePrazo != null ? `, term ${n(d.recentePrazo, dias)}` : ''} over ${d.amostraRecente} payments.`,
      `Antes: atraso promedio ${n(d.anteriorAtraso, dias)}${d.anteriorPrazo != null ? `, plazo ${n(d.anteriorPrazo, dias)}` : ''} en ${d.amostraAnterior} pagos. Últimos 6 meses: atraso promedio ${n(d.recenteAtraso, dias)}${d.recentePrazo != null ? `, plazo ${n(d.recentePrazo, dias)}` : ''} en ${d.amostraRecente} pagos.`)
    : L('Para comparar, são precisos ao menos 2 pagamentos nos últimos 6 meses e 2 antes disso.', 'To compare, at least 2 payments in the last 6 months and 2 before are needed.', 'Para comparar, se necesitan al menos 2 pagos en los últimos 6 meses y 2 antes.')
  const regra = L('Piora = atraso ou prazo subiu 5 dias e 30%; melhora = caiu 5 dias e 30%.', 'Worse = delay or term rose 5 days and 30%; better = fell 5 days and 30%.', 'Empeora = atraso o plazo subió 5 días y 30%; mejora = bajó 5 días y 30%.')
  return (
    <div className="lg:col-span-3 rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}` }}>
      <Titulo P={P} texto={<>{L('DNA de pagamento de', 'Payment DNA of', 'ADN de pago de')} {i.titulo.contraparteNome}</>} href={i.titulo.dominio === 'pagar' ? '/fornecedores' : '/clientes'} ir={i.titulo.dominio === 'pagar' ? L('Fornecedores', 'Suppliers', 'Proveedores') : L('Inteligência de Clientes', 'Customer Intelligence', 'Inteligencia de Clientes')} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="space-y-1">
          {[[L('Atraso médio', 'Average delay', 'Atraso promedio'), n(d.atrasoMedio, dias)], [L('Pagamentos com atraso', 'Late payments', 'Pagos con atraso'), n(d.frequenciaAtrasoPct, '%')],
            [L('Regularidade (variação)', 'Regularity (variation)', 'Regularidad (variación)'), d.regularidadeDesvio == null ? '—' : `± ${n(d.regularidadeDesvio, dias)}`], [L('Prazo médio de pagamento', 'Average payment term', 'Plazo promedio de pago'), n(d.prazoMedioPagamento, dias)],
            [L('Valor médio pago', 'Average amount paid', 'Valor promedio pagado'), d.valorMedioRecebido == null ? '—' : fmt(d.valorMedioRecebido)], [L('Pagamentos parciais em aberto', 'Open partial payments', 'Pagos parciales abiertos'), String(d.pagamentosParciais)],
            [L('Promessas cumpridas / descumpridas', 'Promises kept / broken', 'Promesas cumplidas / incumplidas'), `${d.promessas.cumpridas} / ${d.promessas.descumpridas}`], [L('Acordos', 'Agreements', 'Acuerdos'), String(d.acordos)],
            [L('Exposição: vencido / em aberto', 'Exposure: overdue / open', 'Exposición: vencido / abierto'), `${fmt(vencidoCliente)} / ${fmt(abertoCliente)}`], [L('Nota de risco', 'Risk score', 'Nota de riesgo'), i.risco.score == null ? L('sem histórico', 'no history', 'sin historial') : String(i.risco.score)]]
            .map(([t, v]) => <p key={t} className="flex justify-between gap-2"><span style={{ color: P.CINZA }}>{t}</span><b className="text-right">{v}</b></p>)}
        </div>
        <div className="lg:col-span-2 min-w-0">
          <p style={{ color: P.CINZA }}>{L('Dias de atraso em cada pagamento (mais antigo à esquerda)', 'Days late on each payment (oldest on the left)', 'Días de atraso en cada pago (más antiguo a la izquierda)')}</p>
          {opcao ? <ReactECharts option={opcao} style={{ height: 170 }} notMerge lazyUpdate /> : <p className="py-6 text-center" style={{ color: P.CINZA }}>{L('Este cliente ainda não tem pagamentos registrados.', 'This customer has no recorded payments yet.', 'Este cliente aún no tiene pagos registrados.')}</p>}
          <div className="flex flex-wrap gap-x-3 text-[11px]" style={{ color: P.CINZA }}>
            {(['bom', 'atencao', 'critico'] as const).map((k) => <span key={k}><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: cs[k] }} />{k === 'bom' ? L('Em dia', 'On time', 'A tiempo') : k === 'atencao' ? L('Até 30 dias', 'Up to 30 days', 'Hasta 30 días') : L('Mais de 30 dias', 'Over 30 days', 'Más de 30 días')}</span>)}
          </div>
          <p className="mt-1"><b>{L('Tendência', 'Trend', 'Tendencia')}: <span style={{ color: corTextoSituacao(nivelTendencia(d.tendencia), temaClaro) }}>{nomeTendencia(lang, d.tendencia)}</span></b> <span style={{ color: P.CINZA }}>({d.tendencia === 'indefinida' ? L('fato', 'fact', 'hecho') : L('conclusão a partir dos números', 'conclusion drawn from the numbers', 'conclusión a partir de los números')})</span></p>
          <p style={{ color: P.CINZA }}>{base} {regra}</p>
          {!d.suficiente && <p style={{ color: P.CINZA }}>{L(`Histórico curto (${d.amostra} pagamento(s); mínimo 4): o Axioma não classifica o cliente nem dá nota de risco.`, `Short history (${d.amostra} payment(s); minimum 4): Axioma does not classify the customer or give a risk score.`, `Historial corto (${d.amostra} pago(s); mínimo 4): Axioma no clasifica al cliente ni da nota de riesgo.`)}</p>}
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
    <div className="rounded-xl p-3 mb-3 text-xs axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
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
      <div className="rounded-xl p-3 space-y-1 axi-card-premium3d axi-card-faixa" style={aninhada}>
        <Titulo P={P} texto={L('Valores', 'Amounts', 'Valores')} href="/contas-pagar?filtro=vencido" ir={L('Contas a Pagar', 'Payables', 'Cuentas por Pagar')} />
        {[[L('Valor original', 'Original amount', 'Valor original'), i.titulo.valor], [L('Saldo em aberto', 'Open balance', 'Saldo pendiente'), i.saldo], [L('Multa', 'Fine', 'Multa'), enc.multa], [L('Juros', 'Interest', 'Intereses'), enc.juros], [L('Correção (IPCA)', 'Inflation update (IPCA)', 'Actualización (IPCA)'), enc.atualizacao], [L('Total atualizado', 'Updated total', 'Total actualizado'), enc.total]]
          .map(([t, v]) => <p key={String(t)} className="flex justify-between"><span style={{ color: P.CINZA }}>{t}</span><b>{fmt(Number(v))}</b></p>)}
        <p className="text-[11px] pt-1" style={{ color: P.CINZA }}>{L('Estimativa pelo contrato; sem taxa no contrato, juros pela taxa legal (Selic − IPCA). Confira com o fornecedor.', 'Estimate by contract; without a contract rate, interest by the legal rate (Selic − IPCA). Check with the supplier.', 'Estimación por contrato; sin tasa en el contrato, intereses por la tasa legal (Selic − IPCA). Confirme con el proveedor.')}</p>
      </div>
      <div className="rounded-xl p-3 space-y-1 axi-card-premium3d axi-card-faixa" style={aninhada}>
        <p className="font-bold">{L('Próxima ação', 'Next action', 'Próxima acción')}: <span style={{ color: P.VERDE }}>{nomeAcao(lang, i.acao.acao)}</span></p>
        <ExplicacaoAcao i={i} lang={lang} P={P} fmt={fmt} />
        <p className="font-bold pt-1">{L('Prioridade de pagamento', 'Payment priority', 'Prioridad de pago')}: {i.prioridade.score}</p>
        {i.prioridade.fatores.map((f) => <p key={f.chave} className="flex justify-between"><span style={{ color: P.CINZA }}>{nomeFator(lang, f.chave)}</span><span>{f.pontos > 0 ? '+' : ''}{f.pontos}</span></p>)}
        <Link href="/contas-pagar?filtro=vencido" className="inline-block mt-2 px-2.5 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Pagar em Contas a Pagar', 'Pay in Payables', 'Pagar en Cuentas por Pagar')}</Link>
      </div>
      <div className="rounded-xl p-3 space-y-2 axi-card-premium3d axi-card-faixa" style={aninhada}>
        <Titulo P={P} texto={<span className="flex items-center gap-1"><Pencil size={13} />{L('Importância do fornecedor', 'Supplier importance', 'Importancia del proveedor')}</span>} href="/fornecedores" ir={L('Fornecedores', 'Suppliers', 'Proveedores')} />
        <select aria-label={L('Importância', 'Importance', 'Importancia')} value={ed.criticidade} onChange={(e) => setEd({ ...ed, criticidade: e.target.value as typeof ed.criticidade })} className="w-full rounded-lg px-1.5 py-1" style={campo}>
          {(['critica', 'alta', 'media', 'baixa'] as const).map((c) => <option key={c} value={c}>{nomeCriticidade(lang, c)}</option>)}
        </select>
        {([['risco_interrupcao', L('Pode parar o fornecimento', 'Supply may stop', 'Puede cortar el suministro')], ['impacto_producao', L('Atraso afeta a produção', 'Delay affects production', 'El atraso afecta la producción')], ['impacto_vendas', L('Atraso afeta as vendas', 'Delay affects sales', 'El atraso afecta las ventas')]] as const).map(([k, t]) => (
          <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={ed[k]} onChange={(e) => setEd({ ...ed, [k]: e.target.checked })} />{t}</label>
        ))}
        <button type="button" disabled={salvando} onClick={() => void salvar()} className="px-2.5 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Salvar importância', 'Save importance', 'Guardar importancia')}</button>
        <p className="text-[11px]" style={{ color: P.CINZA }}>{L('Um fornecedor essencial pode vir antes de uma conta maior ou mais antiga.', 'An essential supplier may come before a larger or older bill.', 'Un proveedor esencial puede ir antes que una cuenta mayor o más antigua.')}</p>
      </div>
      <DisputaBloco i={i} empresaId={empresaId} lang={lang} P={P} fmt={fmt} aoMudar={aoMudar} avisar={avisar} />
    </div>
  )
}

// Simulação de regularização: o que acontece com o caixa se pagar as contas marcadas (não grava nada)
function SimulacaoPagamento({ itens, tesouraria, lang, P, fmt }: { itens: ItemVencido[]; tesouraria: BaseTesouraria; lang: Lang; P: Paleta; fmt: (v: number) => string }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const s = simularPagamentos(tesouraria, itens.map((i) => i.encargos.total))
  return (
    <div className="rounded-xl p-3 mb-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
      <div className="col-span-2 sm:col-span-4"><Titulo P={P} texto={L(`Simulação: pagar as ${itens.length} marcada(s) — não altera nada`, `Simulation: pay the ${itens.length} selected — changes nothing`, `Simulación: pagar las ${itens.length} marcada(s) — no cambia nada`)} href="/tesouraria" ir={L('Tesouraria', 'Treasury', 'Tesorería')} /></div>
      <p><span style={{ color: P.CINZA }}>{L('A pagar (com juros e multa)', 'To pay (with interest and fines)', 'A pagar (con intereses y multas)')}</span><br /><b>{fmt(s.pagamento)}</b></p>
      <p><span style={{ color: P.CINZA }}>{L('Caixa hoje', 'Cash today', 'Caja hoy')}</span><br /><b>{fmt(s.caixaAntes)}</b></p>
      <p><span style={{ color: P.CINZA }}>{L('Caixa depois', 'Cash after', 'Caja después')}</span><br /><b style={{ color: s.caixaDepois < 0 ? P.VERMELHO : P.TEXTO }}>{fmt(s.caixaDepois)}</b></p>
      <p><span style={{ color: P.CINZA }}>{L('Folga sobre a reserva mínima', 'Margin over minimum reserve', 'Margen sobre la reserva mínima')}</span><br /><b style={{ color: s.abaixoDaReserva ? P.VERMELHO : P.VERDE }}>{fmt(s.folgaSobreReserva)}</b></p>
    </div>
  )
}

// Dossiê de recuperação por cliente/fornecedor (etapa 5): tudo da contraparte num lugar só — identificação,
// exposição, previsão, contas vencidas, DNA e comunicações. Reaproveita os blocos da central (nada novo calculado).
function Dossie({ i, dominio, itens, historico, empresaId, lang, P, fmt, dataTxt, temaClaro, onFechar, onAbrirConta }: { i: ItemVencido; dominio: 'receber' | 'pagar'; itens: ItemVencido[]; historico: Titulo[]; empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; temaClaro: boolean; onFechar: () => void; onAbrirConta: (id: string) => void }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const pagar = dominio === 'pagar'
  const chave = i.titulo.contraparteId ?? i.titulo.contraparteNome
  const daContraparte = itens.filter((x) => (x.titulo.contraparteId ?? x.titulo.contraparteNome) === chave)
  const hist = historico.filter((t) => (t.contraparteId ?? t.contraparteNome) === chave)
  const hoje = hojeISO()
  const vencido = daContraparte.reduce((s2, x) => s2 + x.saldo, 0)
  const aberto = hist.filter((t) => emAberto(t, hoje)).reduce((s2, t) => s2 + saldoDoTitulo(t, hoje), 0)
  const prev = pagar ? null : previsaoRecuperacao(daContraparte.map((x) => ({ titulo: x.titulo, risco: x.risco.score, prometido: x.promessaFalta, emNegociacao: x.emNegociacao })), hoje)
  type Cad = { documento?: string | null; email?: string | null; telefone?: string | null; whatsapp?: string | null; cidade?: string | null; estado?: string | null; uf?: string | null; limite_credito?: number | null; condicao_pagamento?: string | null; responsavel?: string | null }
  const [cad, setCad] = useState<Cad | null>(null)
  const [contatos, setContatos] = useState<CobrancaInteracao[] | null>(null)
  useEffect(() => {
    let vivo = true
    if (i.titulo.contraparteId) {
      const tabela = pagar ? 'fornecedores' : 'clientes'
      const cols = pagar ? 'documento, email, telefone, cidade, uf, condicao_pagamento, responsavel' : 'documento, email, telefone, whatsapp, cidade, estado, limite_credito, condicao_pagamento, responsavel'
      void createClient().from(tabela).select(cols).eq('id', i.titulo.contraparteId).maybeSingle().then(({ data }) => { if (vivo) setCad((data as Cad | null) ?? {}) })
      if (!pagar) void listarInteracoesCliente(empresaId, i.titulo.contraparteId).then((c) => { if (vivo) setContatos(c) })
    }
    return () => { vivo = false }
  }, [i.titulo.contraparteId, pagar, empresaId])
  const cadV: Cad | null = i.titulo.contraparteId ? cad : {} // sem cadastro ligado: identificação vazia, sem consulta
  const aninhada = { background: P.ANINHADA, border: `1px solid ${P.BORDA}` }
  const linha = (t: string, v: ReactNode) => <p className="flex justify-between gap-2"><span style={{ color: P.CINZA }}>{t}</span><b className="text-right min-w-0 truncate">{v}</b></p>
  return (
    <div className="rounded-2xl p-3 mb-3 text-xs space-y-2 axi-card-premium3d axi-card-faixa" style={{ background: P.PAINEL_BG, border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{L('Dossiê de', 'Dossier of', 'Expediente de')} {i.titulo.contraparteNome}</p>
          <p style={{ color: P.CINZA }}>{pagar ? L('Fornecedor', 'Supplier', 'Proveedor') : L('Cliente', 'Customer', 'Cliente')}</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Link href={pagar ? '/fornecedores' : '/clientes'} className="px-2.5 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_SECUNDARIO }}>{pagar ? L('Abrir Fornecedores', 'Open Suppliers', 'Abrir Proveedores') : L('Abrir Clientes', 'Open Customers', 'Abrir Clientes')}</Link>
          <button type="button" onClick={onFechar} aria-label={L('Fechar dossiê', 'Close dossier', 'Cerrar expediente')} className="px-2 py-1.5 rounded-lg text-white" style={{ background: BOTAO_SECUNDARIO }}><X size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded-xl p-3 space-y-1 axi-card-premium3d axi-card-faixa" style={aninhada}>
          <Titulo P={P} texto={L('Identificação', 'Identification', 'Identificación')} href={pagar ? '/fornecedores' : '/clientes'} ir={L('Cadastro', 'Record', 'Registro')} />
          {cadV === null ? <p style={{ color: P.CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p> : <>
            {linha(L('Documento', 'Tax ID', 'Documento'), cadV.documento || '—')}
            {linha(L('Telefone', 'Phone', 'Teléfono'), cadV.whatsapp || cadV.telefone || '—')}
            {linha(L('E-mail', 'Email', 'Correo'), cadV.email || '—')}
            {linha(L('Cidade', 'City', 'Ciudad'), [cadV.cidade, cadV.estado ?? cadV.uf].filter(Boolean).join(' / ') || '—')}
            {linha(L('Condição de pagamento', 'Payment terms', 'Condición de pago'), cadV.condicao_pagamento || '—')}
            {!pagar && linha(L('Limite de crédito', 'Credit limit', 'Límite de crédito'), cadV.limite_credito ? fmt(Number(cadV.limite_credito)) : '—')}
            {linha(L('Responsável', 'Contact person', 'Responsable'), cadV.responsavel || '—')}
          </>}
        </div>
        <div className="rounded-xl p-3 space-y-1 axi-card-premium3d axi-card-faixa" style={aninhada}>
          <Titulo P={P} texto={L('Exposição', 'Exposure', 'Exposición')} href={pagar ? '/contas-pagar?filtro=vencido' : '/contas-receber?filtro=vencido'} ir={pagar ? L('Contas a Pagar', 'Payables', 'Cuentas por Pagar') : L('Contas a Receber', 'Receivables', 'Cuentas por Cobrar')} />
          {linha(L('Vencido', 'Overdue', 'Vencido'), <span style={{ color: P.VERMELHO }}>{fmt(vencido)}</span>)}
          {linha(L('A vencer', 'Not due', 'Por vencer'), fmt(Math.max(0, aberto - vencido)))}
          {linha(L('Total em aberto', 'Total open', 'Total abierto'), fmt(aberto))}
          {linha(L('Contas vencidas', 'Overdue bills', 'Cuentas vencidas'), String(daContraparte.length))}
          {!pagar && linha(L('Nota de risco', 'Risk score', 'Nota de riesgo'), <span style={{ color: corTextoSituacao(nivelRisco(i.risco.score), temaClaro) }}>{i.risco.score ?? L('sem histórico', 'no history', 'sin historial')}</span>)}
        </div>
        <div className="rounded-xl p-3 space-y-1 axi-card-premium3d axi-card-faixa" style={aninhada}>
          <Titulo P={P} texto={pagar ? L('Prioridade de pagamento', 'Payment priority', 'Prioridad de pago') : L('Previsão de recuperação', 'Recovery forecast', 'Previsión de recuperación')} href="/tesouraria" ir={L('Tesouraria', 'Treasury', 'Tesorería')} />
          {prev ? (prev.confianca === 'sem_dados'
            ? <p style={{ color: P.CINZA }}>{L('Sem histórico suficiente para prever (o Axioma não inventa previsão).', 'Not enough history to forecast (Axioma does not make up forecasts).', 'Sin historial suficiente para prever (Axioma no inventa previsiones).')}</p>
            : prev.horizontes.map((h) => linha(L(`Em ${h.horizonteDias} dias`, `In ${h.horizonteDias} days`, `En ${h.horizonteDias} días`), fmt(h.valor))))
            : daContraparte.map((x) => linha(x.titulo.descricao || '—', String(x.prioridade.score ?? '—')))}
          {prev && prev.composicao.prometido > 0 && linha(L('Prometido (não é caixa)', 'Promised (not cash)', 'Prometido (no es caja)'), fmt(prev.composicao.prometido))}
        </div>
      </div>
      <div className="rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={aninhada}>
        <p className="font-bold mb-1">{L('Contas vencidas e próximas ações', 'Overdue bills and next actions', 'Cuentas vencidas y próximas acciones')}</p>
        <ul className="space-y-1">
          {daContraparte.map((x) => (
            <li key={x.titulo.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0">{x.titulo.descricao || '—'} · {dataTxt(x.titulo.vencimento)} · <b style={{ color: corTextoSituacao(nivelAtraso(x.encargos.dias), temaClaro) }}>{L(`${x.encargos.dias} dias`, `${x.encargos.dias} days`, `${x.encargos.dias} días`)}</b>{x.promessa ? ` · ${nomePromessa(lang, x.promessa)}` : ''}{x.disputa.aberta ? ` · ${L('em divergência', 'in dispute', 'en divergencia')}` : ''}</span>
              <span className="flex items-center gap-2 shrink-0"><b>{fmt(x.saldo)}</b><span style={{ color: P.VERDE }}>{nomeAcao(lang, x.acao.acao)}</span>
                <button type="button" onClick={() => onAbrirConta(x.titulo.id)} className="px-2 py-0.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Abrir', 'Open', 'Abrir')}</button></span>
            </li>
          ))}
        </ul>
      </div>
      <DnaCliente i={i} historico={historico} itens={itens} lang={lang} P={P} fmt={fmt} dataTxt={dataTxt} temaClaro={temaClaro} />
      {!pagar && (
        <div className="rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={aninhada}>
          <Titulo P={P} texto={L('Comunicações', 'Communications', 'Comunicaciones')} href="/inadimplencia" ir={L('Régua de cobrança', 'Collection schedule', 'Regla de cobranza')} />
          {contatos === null ? <p style={{ color: P.CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p> : contatos.length === 0
            ? <p style={{ color: P.CINZA }}>{L('Nenhum contato registrado com este cliente.', 'No contacts recorded with this customer.', 'Ningún contacto registrado con este cliente.')}</p>
            : <ul className="space-y-1 max-h-40 overflow-y-auto">{contatos.map((c) => <li key={c.id}><span style={{ color: P.CINZA }}>{dataTxt(c.data)} · {nomeCanal(lang, c.canal)}</span> — {c.descricao}</li>)}</ul>}
          <p className="text-[11px] mt-1" style={{ color: P.CINZA }}>{L('Para registrar contato ou promessa, abra a conta acima.', 'To record a contact or promise, open the bill above.', 'Para registrar contacto o promesa, abra la cuenta arriba.')}</p>
        </div>
      )}
    </div>
  )
}

// Título de cartão com caminho para o módulo dono da informação (dá sentido ao destino)
function Titulo({ texto, href, ir, P }: { texto: ReactNode; href?: string; ir?: string; P: Paleta }) {
  return (
    <p className="font-bold mb-1 flex items-center justify-between gap-2">
      <span>{texto}</span>
      {href && <Link href={href} className="text-[11px] font-semibold underline shrink-0" style={{ color: P.VERDE }}>{ir} ›</Link>}
    </p>
  )
}

// Negociação (etapa 7): alternativas lado a lado pelo motor (simularNegociacao), recomendação pela maior
// recuperação esperada, proposta registrada e decisão SÓ de dono/sócio/admin (o banco confere). IA não concede.
const CUSTO_CAPITAL_MES = 1 // premissa declarada na tela: custo do dinheiro de 1% ao mês
function NegociacaoCliente({ i, empresaId, lang, P, fmt, dataTxt, aoMudar, avisar }: { i: ItemVencido; empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string; aoMudar: () => void; avisar: (m: string) => void }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const campo = { background: P.CAMPO, color: P.TEXTO, border: `1px solid ${P.BORDA}` }
  const encargos = Math.max(0, Math.round((i.encargos.total - i.saldo) * 100) / 100)
  const probBase = i.risco.score == null ? 0.5 : Math.max(0, Math.min(1, (1000 - i.risco.score) / 1000))
  const ctx = { custoCapitalMesPct: CUSTO_CAPITAL_MES, probabilidadeBase: probBase, encargos }
  const [livre, setLivre] = useState<OpcaoNegociacao>({ tipo: 'entrada_parcelas', entradaPct: 20, parcelas: 4, intervaloDias: 30, descontoPct: 0 })
  const opcoes: { nome: string; op: OpcaoNegociacao }[] = [
    { nome: L('À vista', 'Pay in full', 'Al contado'), op: { tipo: 'integral' } },
    { nome: L('Entrada 30% + 3 parcelas', '30% down + 3 installments', 'Entrada 30% + 3 cuotas'), op: { tipo: 'entrada_parcelas', entradaPct: 30, parcelas: 3, intervaloDias: 30 } },
    { nome: L('10% de desconto à vista', '10% off in full', '10% de descuento al contado'), op: { tipo: 'desconto', descontoPct: 10 } },
    { nome: L('Novo vencimento em 30 dias', 'New due date in 30 days', 'Nuevo vencimiento en 30 días'), op: { tipo: 'novo_vencimento', prazoDias: 30 } },
    { nome: L('Personalizada', 'Custom', 'Personalizada'), op: livre },
  ]
  const alts = opcoes.map((o) => simularNegociacao(i.saldo, o.op, ctx))
  const rec = recomendarNegociacao(alts)
  const [lista, setLista] = useState<{ casoId: string | null; propostas: PropostaNegociacao[] } | null>(null)
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const ler = () => listarNegociacoes(empresaId, 'receber', i.titulo.id).then(setLista)
  useEffect(() => { void ler() }, [i.titulo.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const hojeIso = hojeISO()
  const propor = async (k: number) => {
    setOcupado(true)
    let casoId = lista?.casoId ?? null
    if (!casoId) { const c = await salvarCaso(empresaId, 'receber', i.titulo.id, {}, 'aberto para negociação'); casoId = c.ok ? c.valor ?? null : null }
    const r = casoId ? await proporNegociacao(empresaId, casoId, alts[k]) : { ok: false as const, erro: '' }
    setOcupado(false)
    if (!r.ok) return avisar(L('Não foi possível registrar a proposta. Só dono, sócio, admin e financeiro podem propor.', 'Could not save the proposal. Only owner, partner, admin and finance can propose.', 'No fue posible registrar la propuesta. Solo dueño, socio, admin y finanzas pueden proponer.'))
    void ler(); aoMudar(); avisar(L('Proposta registrada — aguarda aprovação de dono, sócio ou admin.', 'Proposal saved — awaiting approval by owner, partner or admin.', 'Propuesta registrada — espera aprobación de dueño, socio o admin.'))
  }
  const decidir = async (pr: PropostaNegociacao, aprovar: boolean) => {
    if (!motivo.trim()) return avisar(L('Escreva o motivo da decisão.', 'Write the reason for the decision.', 'Escriba el motivo de la decisión.'))
    setOcupado(true)
    const r = await decidirNegociacao(empresaId, lista!.casoId!, pr, aprovar, motivo, i.titulo)
    setOcupado(false)
    if (!r.ok) return avisar(L('Não foi possível decidir. Aprovar ou recusar é só para dono, sócio ou admin.', 'Could not decide. Only owner, partner or admin can approve or refuse.', 'No fue posible decidir. Aprobar o rechazar es solo para dueño, socio o admin.'))
    setMotivo(''); void ler(); aoMudar()
    avisar(aprovar ? L('Negociação aprovada: virou um acordo no acompanhamento de promessas.', 'Negotiation approved: it became an agreement in promise tracking.', 'Negociación aprobada: se convirtió en un acuerdo en el seguimiento de promesas.') : L('Proposta recusada.', 'Proposal refused.', 'Propuesta rechazada.'))
  }
  const linhaV = (t: string, v: string, forte = false) => <p className="flex justify-between gap-2"><span style={{ color: P.CINZA }}>{t}</span>{forte ? <b>{v}</b> : <span>{v}</span>}</p>
  const dataParcela = (dia: number) => dataTxt(somarDiasISO(hojeIso, dia))
  return (
    <div className="lg:col-span-3 rounded-xl p-3 space-y-2 axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}` }}>
      <Titulo P={P} texto={L('Negociação', 'Negotiation', 'Negociación')} href="/inadimplencia" ir={L('Central de Negociação (Inadimplência)', 'Negotiation center (Delinquency)', 'Central de Negociación (Morosidad)')} />
      <p className="text-[11px]" style={{ color: P.CINZA }}>{L(`Saldo ${fmt(i.saldo)} + juros e multa ${fmt(encargos)}. Chance base de pagar: ${Math.round(probBase * 100)}% (${i.risco.score == null ? 'sem histórico: 50%' : `nota de risco ${i.risco.score}`}). Custo do dinheiro: ${CUSTO_CAPITAL_MES}% ao mês (premissa). Simulação — nada é alterado até a aprovação.`, `Balance ${fmt(i.saldo)} + interest and fines ${fmt(encargos)}. Base chance of payment: ${Math.round(probBase * 100)}% (${i.risco.score == null ? 'no history: 50%' : `risk score ${i.risco.score}`}). Cost of money: ${CUSTO_CAPITAL_MES}% a month (premise). Simulation — nothing changes until approval.`, `Saldo ${fmt(i.saldo)} + intereses y multas ${fmt(encargos)}. Probabilidad base de pago: ${Math.round(probBase * 100)}% (${i.risco.score == null ? 'sin historial: 50%' : `nota de riesgo ${i.risco.score}`}). Costo del dinero: ${CUSTO_CAPITAL_MES}% al mes (premisa). Simulación — nada cambia hasta la aprobación.`)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
        {alts.map((a, k) => (
          <div key={k} className="rounded-lg p-2 space-y-0.5 axi-card-premium3d axi-card-faixa" style={{ border: `1px solid ${rec?.indice === k ? P.VERDE : P.BORDA}` }}>
            <p className="font-bold">{opcoes[k].nome}</p>
            {rec?.indice === k && <p className="text-[11px] font-bold" style={{ color: P.VERDE }}>{rec.motivo === 'sem_concessao' ? L('Recomendada: mesma recuperação sem conceder nada', 'Recommended: same recovery with no concession', 'Recomendada: misma recuperación sin conceder nada') : L('Recomendada: maior recuperação esperada', 'Recommended: highest expected recovery', 'Recomendada: mayor recuperación esperada')}</p>}
            {k === opcoes.length - 1 && (
              <div className="grid grid-cols-2 gap-1 py-1">
                <select aria-label={L('Tipo', 'Type', 'Tipo')} value={livre.tipo} onChange={(e) => setLivre({ ...livre, tipo: e.target.value as OpcaoNegociacao['tipo'] })} className="col-span-2 rounded px-1 py-0.5" style={campo}>
                  <option value="entrada_parcelas">{L('Entrada + parcelas', 'Down payment + installments', 'Entrada + cuotas')}</option>
                  <option value="desconto">{L('Desconto à vista', 'Discount in full', 'Descuento al contado')}</option>
                  <option value="novo_vencimento">{L('Novo vencimento', 'New due date', 'Nuevo vencimiento')}</option>
                  <option value="parcial">{L('Pagamento parcial', 'Partial payment', 'Pago parcial')}</option>
                  <option value="renegociacao">{L('Renegociação (parcelas)', 'Rescheduling (installments)', 'Renegociación (cuotas)')}</option>
                </select>
                {(livre.tipo === 'entrada_parcelas' || livre.tipo === 'renegociacao') && <>
                  <label className="text-[11px]">{L('Entrada %', 'Down %', 'Entrada %')}<input type="number" min={0} max={100} value={livre.entradaPct ?? 0} onChange={(e) => setLivre({ ...livre, entradaPct: Number(e.target.value) })} className="w-full rounded px-1" style={campo} /></label>
                  <label className="text-[11px]">{L('Parcelas', 'Installments', 'Cuotas')}<input type="number" min={1} max={36} value={livre.parcelas ?? 1} onChange={(e) => setLivre({ ...livre, parcelas: Number(e.target.value) })} className="w-full rounded px-1" style={campo} /></label>
                </>}
                {livre.tipo !== 'parcial' && <label className="text-[11px]">{L('Desconto %', 'Discount %', 'Descuento %')}<input type="number" min={0} max={100} value={livre.descontoPct ?? 0} onChange={(e) => setLivre({ ...livre, descontoPct: Number(e.target.value) })} className="w-full rounded px-1" style={campo} /></label>}
                {livre.tipo === 'novo_vencimento' && <label className="text-[11px]">{L('Prazo (dias)', 'Term (days)', 'Plazo (días)')}<input type="number" min={1} value={livre.prazoDias ?? 30} onChange={(e) => setLivre({ ...livre, prazoDias: Number(e.target.value) })} className="w-full rounded px-1" style={campo} /></label>}
                {livre.tipo === 'parcial' && <label className="text-[11px] col-span-2">{L('Valor pago agora', 'Amount paid now', 'Valor pagado ahora')}<input type="number" min={0} value={livre.valorParcial ?? 0} onChange={(e) => setLivre({ ...livre, valorParcial: Number(e.target.value) })} className="w-full rounded px-1" style={campo} /></label>}
                <label className="text-[11px] col-span-2 flex items-center gap-1"><input type="checkbox" checked={!!livre.dispensarEncargos} onChange={(e) => setLivre({ ...livre, dispensarEncargos: e.target.checked })} />{L('Dispensar juros e multa', 'Waive interest and fines', 'Dispensar intereses y multas')}</label>
              </div>
            )}
            {linhaV(L('Devido (com encargos)', 'Owed (with charges)', 'Adeudado (con cargos)'), fmt(a.devido))}
            {linhaV(L('Desconto', 'Discount', 'Descuento'), fmt(a.desconto))}
            {linhaV(L('Total negociado', 'Negotiated total', 'Total negociado'), fmt(a.totalNegociado), true)}
            {a.restanteEmAberto > 0 && linhaV(L('Continua em aberto', 'Still open', 'Sigue abierto'), fmt(a.restanteEmAberto))}
            <p style={{ color: P.CINZA }}>{L('Parcelas', 'Installments', 'Cuotas')}: {a.parcelas.map((x) => `${dataParcela(x.dia)} ${fmt(x.valor)}`).join(' · ')}</p>
            {linhaV(L('Caixa em 30 / 60 / 90 dias', 'Cash in 30 / 60 / 90 days', 'Caja en 30 / 60 / 90 días'), `${fmt(a.impactoLiquidez.d30)} / ${fmt(a.impactoLiquidez.d60)} / ${fmt(a.impactoLiquidez.d90)}`)}
            {linhaV(L('Custo do tempo', 'Cost of time', 'Costo del tiempo'), fmt(a.custoOportunidade))}
            {linhaV(L('Recuperação esperada', 'Expected recovery', 'Recuperación esperada'), fmt(a.valorLiquidoRecuperavel), true)}
            <p className="text-[11px]" style={{ color: a.precisaAprovacao ? P.ALERTA : P.CINZA }}>{a.precisaAprovacao ? L('Exige aprovação (dono, sócio ou admin)', 'Needs approval (owner, partner or admin)', 'Requiere aprobación (dueño, socio o admin)') : L('Sem concessão', 'No concession', 'Sin concesión')}</p>
            <button type="button" disabled={ocupado} onClick={() => void propor(k)} className="w-full mt-1 px-2 py-1 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Propor esta', 'Propose this', 'Proponer esta')}</button>
          </div>
        ))}
      </div>
      {lista && lista.propostas.length > 0 && (
        <div className="space-y-1 pt-1" style={{ borderTop: `1px solid ${P.BORDA}` }}>
          <p className="font-bold">{L('Propostas', 'Proposals', 'Propuestas')}</p>
          {lista.propostas.map((pr) => (
            <div key={pr.id} className="rounded-lg p-2 flex flex-wrap items-center justify-between gap-2 axi-card-premium3d axi-card-faixa" style={{ border: `1px solid ${P.BORDA}` }}>
              <span>{dataTxt(pr.criado_em.slice(0, 10))} · {fmt(pr.simulacao.totalNegociado)} {L(`em ${pr.simulacao.parcelas.length} pagamento(s)`, `in ${pr.simulacao.parcelas.length} payment(s)`, `en ${pr.simulacao.parcelas.length} pago(s)`)} · <b style={{ color: pr.situacao === 'aprovada' ? P.VERDE : pr.situacao === 'recusada' ? P.VERMELHO : P.TEXTO }}>{pr.situacao === 'pendente' ? L('aguardando aprovação', 'awaiting approval', 'esperando aprobación') : pr.situacao === 'aprovada' ? L('aprovada', 'approved', 'aprobada') : L('recusada', 'refused', 'rechazada')}</b>{pr.motivo ? ` — ${pr.motivo}` : ''}</span>
              {pr.situacao === 'pendente' && (
                <span className="flex flex-wrap gap-1">
                  <input aria-label={L('Motivo da decisão', 'Reason for the decision', 'Motivo de la decisión')} placeholder={L('Motivo da decisão', 'Reason', 'Motivo')} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="rounded px-1.5 py-0.5" style={campo} />
                  <button type="button" disabled={ocupado} onClick={() => void decidir(pr, true)} className="px-2 py-0.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Aprovar', 'Approve', 'Aprobar')}</button>
                  <button type="button" disabled={ocupado} onClick={() => void decidir(pr, false)} className="px-2 py-0.5 rounded-lg font-bold text-white" style={{ background: BOTAO_SECUNDARIO }}>{L('Recusar', 'Refuse', 'Rechazar')}</button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Divergência da conta (etapa 8): registrar, acompanhar e resolver. O contestado sai da cobrança e da previsão
// (motor); o título nunca é apagado nem liquidado aqui. Lápis = corrigir; cancelar fica no histórico (antes/depois).
const TIPOS_DISPUTA = ['valor', 'nota_fiscal', 'entrega', 'qualidade', 'devolucao', 'duplicidade', 'contrato', 'desconto', 'outros'] as const
const STATUS_DISPUTA = ['aberta', 'em_analise', 'resolvida_favor', 'resolvida_contra', 'cancelada'] as const
function DisputaBloco({ i, empresaId, lang, P, fmt, aoMudar, avisar }: { i: ItemVencido; empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string; aoMudar: () => void; avisar: (m: string) => void }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const campo = { background: P.CAMPO, color: P.TEXTO, border: `1px solid ${P.BORDA}` }
  const c = i.caso
  const [f, setF] = useState({ tipo: c?.disputa_tipo ?? 'valor', status: c?.disputa_status ?? 'aberta', valor: String(c?.disputa_valor ?? ''), prazo: c?.disputa_prazo ?? '', responsavel: c?.disputa_responsavel ?? '', motivo: '' })
  const [evid, setEvid] = useState<{ nome: string; link?: string | null }[]>(c?.disputa_evidencias ?? [])
  const [nova, setNova] = useState({ nome: '', link: '' })
  const [aberto, setAberto] = useState(!!c?.disputa_status)
  const [salvando, setSalvando] = useState(false)
  const temDisputa = !!c?.disputa_status
  const parada = disputaParada({ status: c?.disputa_status, prazo: c?.disputa_prazo, atualizadoEm: c?.atualizado_em }, hojeISO())
  const resolvendo = ['resolvida_favor', 'resolvida_contra', 'cancelada'].includes(f.status)
  const salvar = async () => {
    const valor = Number(String(f.valor).replace(/\./g, '').replace(',', '.')) || 0
    if (valor < 0 || valor > i.saldo + 0.004) return avisar(L('O valor contestado deve ficar entre zero e o saldo da conta.', 'The disputed amount must be between zero and the bill balance.', 'El valor disputado debe estar entre cero y el saldo de la cuenta.'))
    if (resolvendo && !f.motivo.trim()) return avisar(L('Escreva como a divergência foi resolvida.', 'Write how the dispute was resolved.', 'Escriba cómo se resolvió la divergencia.'))
    setSalvando(true)
    const r = await salvarCaso(empresaId, i.titulo.dominio, i.titulo.id, { disputa_tipo: f.tipo, disputa_status: f.status, disputa_valor: valor, disputa_prazo: f.prazo || null, disputa_responsavel: f.responsavel.trim() || null, disputa_evidencias: evid }, f.motivo.trim() || (temDisputa ? 'divergência atualizada' : 'divergência aberta'))
    setSalvando(false)
    if (!r.ok) return avisar(L('Não foi possível salvar a divergência. Só dono, sócio, admin e financeiro podem alterar.', 'Could not save the dispute. Only owner, partner, admin and finance can change it.', 'No fue posible guardar la divergencia. Solo dueño, socio, admin y finanzas pueden cambiarla.'))
    setF({ ...f, motivo: '' }); aoMudar()
    avisar(resolvendo ? L('Divergência encerrada — o valor volta a ser cobrado normalmente.', 'Dispute closed — the amount is collected normally again.', 'Divergencia cerrada — el valor vuelve a cobrarse normalmente.') : L('Divergência salva — o valor contestado saiu da cobrança e da previsão.', 'Dispute saved — the disputed amount left collection and forecast.', 'Divergencia guardada — el valor disputado salió de la cobranza y la previsión.'))
  }
  const nomeTipo = (t: string) => ({ valor: L('Valor incorreto', 'Wrong amount', 'Valor incorrecto'), nota_fiscal: L('Nota fiscal', 'Invoice', 'Factura'), entrega: L('Entrega', 'Delivery', 'Entrega'), qualidade: L('Qualidade', 'Quality', 'Calidad'), devolucao: L('Devolução', 'Return', 'Devolución'), duplicidade: L('Cobrança em duplicidade', 'Duplicate charge', 'Cobro duplicado'), contrato: L('Contrato', 'Contract', 'Contrato'), desconto: L('Desconto', 'Discount', 'Descuento'), outros: L('Outros', 'Other', 'Otros') } as Record<string, string>)[t] ?? t
  const nomeStatus = (t: string) => ({ aberta: L('Aberta', 'Open', 'Abierta'), em_analise: L('Em análise', 'Under review', 'En análisis'), resolvida_favor: L('Resolvida a nosso favor', 'Resolved in our favor', 'Resuelta a nuestro favor'), resolvida_contra: L('Resolvida a favor da outra parte', 'Resolved for the other party', 'Resuelta a favor de la otra parte'), cancelada: L('Cancelada', 'Cancelled', 'Cancelada') } as Record<string, string>)[t] ?? t
  return (
    <div className="lg:col-span-3 rounded-xl p-3 space-y-2 axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${parada.parada ? P.VERMELHO : P.BORDA}` }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{L('Divergência', 'Dispute', 'Divergencia')}{temDisputa ? `: ${nomeStatus(c!.disputa_status!)} · ${fmt(i.disputa.contestado)} ${L('contestado', 'disputed', 'disputado')}` : ''}</p>
        {parada.parada && <span className="font-bold" style={{ color: P.VERMELHO }}>{parada.prazoVencido ? L('Prazo vencido', 'Deadline passed', 'Plazo vencido') : L(`Parada há ${parada.diasSemAtualizar} dias`, `Stalled for ${parada.diasSemAtualizar} days`, `Detenida hace ${parada.diasSemAtualizar} días`)}</span>}
        <button type="button" onClick={() => setAberto((v) => !v)} className="px-2.5 py-1 rounded-lg font-bold text-white flex items-center gap-1" style={{ background: BOTAO_SECUNDARIO }}><Pencil size={12} />{temDisputa ? L('Editar divergência', 'Edit dispute', 'Editar divergencia') : L('Registrar divergência', 'Record dispute', 'Registrar divergencia')}</button>
      </div>
      {!temDisputa && !aberto && <p style={{ color: P.CINZA }}>{L('Use quando a cobrança é contestada (valor, nota, entrega, qualidade…): a parte contestada sai da cobrança e o restante continua sendo cobrado.', 'Use it when the bill is contested (amount, invoice, delivery, quality…): the disputed part leaves collection and the rest is still collected.', 'Úselo cuando el cobro es impugnado (valor, factura, entrega, calidad…): la parte disputada sale de la cobranza y el resto se sigue cobrando.')}</p>}
      {aberto && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <label>{L('Motivo', 'Reason', 'Motivo')}<select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} className="w-full rounded-lg px-1.5 py-1" style={campo}>{TIPOS_DISPUTA.map((t) => <option key={t} value={t}>{nomeTipo(t)}</option>)}</select></label>
          <label>{L('Situação', 'Status', 'Situación')}<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="w-full rounded-lg px-1.5 py-1" style={campo}>{STATUS_DISPUTA.map((t) => <option key={t} value={t}>{nomeStatus(t)}</option>)}</select></label>
          <label>{L(`Valor contestado (até ${fmt(i.saldo)})`, `Disputed amount (up to ${fmt(i.saldo)})`, `Valor disputado (hasta ${fmt(i.saldo)})`)}<input inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} className="w-full rounded-lg px-1.5 py-1" style={campo} /></label>
          <label>{L('Prazo para resolver', 'Deadline to resolve', 'Plazo para resolver')}<input type="date" value={f.prazo} onChange={(e) => setF({ ...f, prazo: e.target.value })} className="w-full rounded-lg px-1.5 py-1" style={campo} /></label>
          <label>{L('Responsável', 'Person in charge', 'Responsable')}<input value={f.responsavel} maxLength={120} onChange={(e) => setF({ ...f, responsavel: e.target.value })} className="w-full rounded-lg px-1.5 py-1" style={campo} /></label>
          <label>{resolvendo ? L('Como foi resolvida (obrigatório)', 'How it was resolved (required)', 'Cómo se resolvió (obligatorio)') : L('Observação', 'Note', 'Observación')}<input value={f.motivo} maxLength={500} onChange={(e) => setF({ ...f, motivo: e.target.value })} className="w-full rounded-lg px-1.5 py-1" style={campo} /></label>
          <div className="md:col-span-3 space-y-1">
            <p className="font-semibold">{L('Evidências', 'Evidence', 'Evidencias')}</p>
            {evid.length === 0 && <p style={{ color: P.CINZA }}>{L('Nenhuma evidência. Descreva e, se tiver, cole o link do arquivo (Drive, e-mail, foto).', 'No evidence yet. Describe it and, if you have one, paste the file link (Drive, email, photo).', 'Ninguna evidencia. Descríbala y, si tiene, pegue el enlace del archivo (Drive, correo, foto).')}</p>}
            {evid.map((e, k) => (
              <p key={k} className="flex items-center justify-between gap-2"><span className="min-w-0 truncate">{e.nome}{e.link ? <> — <a href={e.link} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: P.VERDE }}>{L('abrir', 'open', 'abrir')}</a></> : null}</span>
                <button type="button" aria-label={L('Tirar evidência', 'Remove evidence', 'Quitar evidencia')} onClick={() => setEvid(evid.filter((_, x) => x !== k))}><Trash2 size={13} style={{ color: P.VERMELHO }} /></button></p>
            ))}
            <div className="flex flex-wrap gap-1">
              <input placeholder={L('Descrição (ex.: foto da avaria)', 'Description (e.g. damage photo)', 'Descripción (ej.: foto del daño)')} value={nova.nome} maxLength={200} onChange={(e) => setNova({ ...nova, nome: e.target.value })} className="flex-1 min-w-[10rem] rounded-lg px-1.5 py-1" style={campo} />
              <input placeholder={L('Link (opcional)', 'Link (optional)', 'Enlace (opcional)')} value={nova.link} onChange={(e) => setNova({ ...nova, link: e.target.value })} className="flex-1 min-w-[10rem] rounded-lg px-1.5 py-1" style={campo} />
              <button type="button" onClick={() => { if (!nova.nome.trim()) return; setEvid([...evid, { nome: nova.nome.trim(), link: /^https?:\/\//.test(nova.link.trim()) ? nova.link.trim() : null }]); setNova({ nome: '', link: '' }) }} className="px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: BOTAO_SECUNDARIO }}>{L('Adicionar', 'Add', 'Agregar')}</button>
            </div>
          </div>
          <div className="md:col-span-3"><button type="button" disabled={salvando} onClick={() => void salvar()} className="px-3 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Salvar divergência', 'Save dispute', 'Guardar divergencia')}</button></div>
        </div>
      )}
    </div>
  )
}

// Central de divergências (etapa 8): todas as abertas dos dois lados, com valores, prazos e as paradas; "Abrir" leva à conta
export function CentralDisputas({ itens, lang, P, fmt, dataTxt }: { itens: ItemVencido[]; lang: Lang; P: Paleta; fmt: (v: number) => string; dataTxt: (d: string) => string }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const hoje = hojeISO()
  const abertas = itens.filter((i) => i.disputa.aberta).map((i) => ({ i, p: disputaParada({ status: i.caso?.disputa_status, prazo: i.caso?.disputa_prazo, atualizadoEm: i.caso?.atualizado_em }, hoje) }))
    .sort((a, b) => Number(b.p.parada) - Number(a.p.parada) || b.i.disputa.contestado - a.i.disputa.contestado)
  if (!abertas.length) return null
  const total = abertas.reduce((s2, x) => s2 + x.i.disputa.contestado, 0)
  const abrir = (i: ItemVencido) => window.dispatchEvent(new CustomEvent('axioma:abrir-conta', { detail: { id: i.titulo.id, dominio: i.titulo.dominio } }))
  return (
    <div className="rounded-2xl p-4 axi-card-premium3d axi-card-faixa" style={{ background: P.PAINEL_BG, border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
      <p className="text-sm font-bold mb-1">{L('Central de divergências', 'Dispute center', 'Central de divergencias')} ({abertas.length}) · {fmt(total)} {L('contestado', 'disputed', 'disputado')}</p>
      <p className="text-[11px] mb-2" style={{ color: P.CINZA }}>{L('O valor contestado fica fora da cobrança e da previsão até a solução; o restante segue normal. Paradas = prazo vencido ou 15 dias sem atualização.', 'The disputed amount stays out of collection and forecast until solved; the rest goes on normally. Stalled = deadline passed or 15 days without update.', 'El valor disputado queda fuera de la cobranza y la previsión hasta la solución; el resto sigue normal. Detenidas = plazo vencido o 15 días sin actualización.')}</p>
      <div className="space-y-1.5">
        {abertas.map(({ i, p }) => (
          <div key={i.titulo.id} className="rounded-xl p-2.5 text-xs flex flex-wrap items-center justify-between gap-2 axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${p.parada ? P.VERMELHO : P.BORDA}` }}>
            <span className="min-w-0">
              <b>{i.titulo.contraparteNome}</b> · {i.titulo.dominio === 'pagar' ? L('a pagar', 'payable', 'por pagar') : L('a receber', 'receivable', 'por cobrar')} · {i.titulo.descricao || '—'}
              <br /><span style={{ color: P.CINZA }}>{L('Responsável', 'In charge', 'Responsable')}: {i.caso?.disputa_responsavel || '—'} · {L('Prazo', 'Deadline', 'Plazo')}: {i.caso?.disputa_prazo ? dataTxt(i.caso.disputa_prazo) : '—'} · {L('Evidências', 'Evidence', 'Evidencias')}: {i.caso?.disputa_evidencias?.length ?? 0}</span>
              {p.parada && <><br /><b style={{ color: P.VERMELHO }}>{p.prazoVencido ? L('Pendência: prazo vencido', 'Pending: deadline passed', 'Pendiente: plazo vencido') : L(`Pendência: parada há ${p.diasSemAtualizar} dias`, `Pending: stalled for ${p.diasSemAtualizar} days`, `Pendiente: detenida hace ${p.diasSemAtualizar} días`)}</b></>}
            </span>
            <span className="flex items-center gap-2 shrink-0"><b>{fmt(i.disputa.contestado)}</b>
              <button type="button" onClick={() => abrir(i)} className="px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Abrir', 'Open', 'Abrir')}</button></span>
          </div>
        ))}
      </div>
    </div>
  )
}
