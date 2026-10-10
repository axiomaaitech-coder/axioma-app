'use client'
// 🦅 DOCUMENTOS PARA O CONTADOR (MEI) — 2026-10-10
// 3 relatórios do ano, cada um em PDF, Excel ou CSV:
//  • Relatório Mensal das Receitas Brutas (o MEI deve guardar todo mês — Resolução CGSN 140/2018, art. 106/Anexo X)
//  • DAS do ano (valor, pago, quando e situação)  • Receitas do ano (lista completa)
import { FileText, FileSpreadsheet, FileDown } from 'lucide-react'
import { CanvasBox } from '../CanvasBox'
import { gerarPdfTabela, type ColunaPDF } from '../../lib/gerarPdfTabela'
import { exportarPlanilha } from '../../lib/exportarPlanilha'
import { receitaDASNPorTipo } from '../../lib/meiHelpers'
import { dataLocal } from '../../lib/datas'
import type { MesDAS } from '../../lib/meiObrigacoesMotor'

type Lang = 'pt' | 'en' | 'es'
type Receita = { valor: number; data: string; descricao?: string | null; categoria?: string | null; status?: string | null; considera_teto_mei?: boolean | null }
const MENTA = '#0f7a5a', NAVY = '#101b3d'

export default function DocumentosContador({ ano, receitas, calendario, categoriaMei, empresa, lang, temaClaro, cartaoTema, onErro }: {
  ano: number; receitas: Receita[]; calendario: MesDAS[] | null; categoriaMei: string; empresa: { nome?: string | null; cnpj?: string | null }
  lang: Lang; temaClaro: boolean; cartaoTema: { fundo?: string; premium3d: boolean }; onErro: (m: string) => void
}) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const TEXTO = temaClaro ? '#101b3d' : '#e5edf7', SEC = temaClaro ? '#374151' : '#a3b1c2'
  const CAIXA = { background: temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(255,255,255,0.03)', border: `1px solid ${temaClaro ? 'rgba(16,27,61,0.12)' : 'rgba(46,204,155,0.22)'}` }
  const n2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const dt = (d: string | null | undefined) => (d ? new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR') : '')
  const sub = [empresa.nome, empresa.cnpj ? `CNPJ ${empresa.cnpj}` : null, `${L('Ano', 'Year', 'Año')} ${ano}`].filter(Boolean).join(' · ')
  const MESES = Array.from({ length: 12 }, (_, i) => new Date(ano, i, 1).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { month: 'long' }))

  type Rel = { titulo: string; arquivo: string; colunas: ColunaPDF[]; linhas: Record<string, string | number>[]; resumo?: { label: string; valor: string }[] }

  function relReceitasBrutas(): Rel {
    const linhas = MESES.map((mes, i) => {
      const r = receitaDASNPorTipo(receitas.filter((x) => dataLocal(x.data).getMonth() === i), ano, categoriaMei)
      return { mes, comercio: r.comercio, servicos: r.servicos, semTipo: r.semTipo, total: r.comercio + r.servicos + r.semTipo, fora: r.foraDoLimite }
    })
    const soma = (k: 'comercio' | 'servicos' | 'semTipo' | 'total' | 'fora') => linhas.reduce((s, l) => s + l[k], 0)
    return {
      titulo: L('Relatório Mensal das Receitas Brutas', 'Monthly Gross Revenue Report', 'Informe Mensual de Ingresos Brutos'), arquivo: `axioma-mei-receitas-brutas-${ano}`,
      colunas: [{ header: L('Mês', 'Month', 'Mes'), key: 'mes', width: 2 }, { header: L('Comércio/indústria/transporte', 'Trade/industry/transport', 'Comercio/industria/transporte'), key: 'comercio', width: 3, align: 'right' },
        { header: L('Serviços', 'Services', 'Servicios'), key: 'servicos', width: 2, align: 'right' }, { header: L('Sem tipo', 'No type', 'Sin tipo'), key: 'semTipo', width: 2, align: 'right' },
        { header: L('Total do mês', 'Month total', 'Total del mes'), key: 'total', width: 2, align: 'right' }, { header: L('Fora do limite MEI', 'Outside MEI limit', 'Fuera del límite MEI'), key: 'fora', width: 2, align: 'right' }],
      linhas,
      resumo: [{ label: L('Receita bruta do ano', 'Gross revenue for the year', 'Ingreso bruto del año'), valor: `R$ ${n2(soma('total'))}` },
        { label: L('Comércio/indústria/transporte', 'Trade/industry/transport', 'Comercio/industria/transporte'), valor: `R$ ${n2(soma('comercio'))}` },
        { label: L('Serviços', 'Services', 'Servicios'), valor: `R$ ${n2(soma('servicos'))}` },
        { label: L('Observação', 'Note', 'Observación'), valor: L('Anexe as notas fiscais de compra e de venda do mês. O Axioma não separa vendas com e sem nota.', 'Attach the month purchase and sales invoices. Axioma does not split sales with and without invoice.', 'Adjunte las facturas de compra y venta del mes. Axioma no separa ventas con y sin factura.') }],
    }
  }
  function relDas(): Rel {
    const linhas = (calendario ?? []).map((m) => ({
      competencia: `${m.competencia.slice(5, 7)}/${m.competencia.slice(0, 4)}`, vencimento: dt(m.data_vencimento), valor: m.valor_esperado ?? 0, pago: m.pago, encargos: m.encargos, falta: m.saldo,
      pagoEm: m.pagamentos.filter((p) => !p.estornado).map((p) => dt(p.data_pagamento)).join(', '),
      situacao: m.natureza === 'projecao' ? L('estimativa', 'estimate', 'estimación') : m.situacaoTela === 'vencido' ? L('vencido', 'overdue', 'vencido') : m.saldo <= 0.005 ? L('pago', 'paid', 'pagado') : L('a pagar', 'to pay', 'a pagar'),
    }))
    return {
      titulo: L('DAS do ano', 'DAS for the year', 'DAS del año'), arquivo: `axioma-mei-das-${ano}`,
      colunas: [{ header: L('Competência', 'Period', 'Competencia'), key: 'competencia', width: 2 }, { header: L('Vence', 'Due', 'Vence'), key: 'vencimento', width: 2 },
        { header: L('Valor', 'Amount', 'Valor'), key: 'valor', width: 2, align: 'right' }, { header: L('Pago', 'Paid', 'Pagado'), key: 'pago', width: 2, align: 'right' },
        { header: L('Multa/juros', 'Fine/interest', 'Multa/intereses'), key: 'encargos', width: 2, align: 'right' }, { header: L('Falta', 'Left', 'Falta'), key: 'falta', width: 2, align: 'right' },
        { header: L('Pago em', 'Paid on', 'Pagado el'), key: 'pagoEm', width: 2 }, { header: L('Situação', 'Status', 'Situación'), key: 'situacao', width: 2 }],
      linhas,
      resumo: [{ label: L('Pago no ano', 'Paid this year', 'Pagado en el año'), valor: `R$ ${n2(linhas.reduce((s, l) => s + l.pago, 0))}` }, { label: L('Falta pagar', 'Left to pay', 'Falta pagar'), valor: `R$ ${n2(linhas.reduce((s, l) => s + l.falta, 0))}` }],
    }
  }
  function relReceitas(): Rel {
    const linhas = receitas.filter((r) => dataLocal(r.data).getFullYear() === ano).sort((a, b) => a.data.localeCompare(b.data)).map((r) => ({
      data: dt(r.data), descricao: r.descricao || '', categoria: r.categoria || '', valor: r.valor || 0,
      limite: r.considera_teto_mei === false ? L('não conta', 'excluded', 'no cuenta') : L('conta', 'counts', 'cuenta'),
    }))
    return {
      titulo: L('Receitas do ano', 'Revenues for the year', 'Ingresos del año'), arquivo: `axioma-mei-receitas-${ano}`,
      colunas: [{ header: L('Data', 'Date', 'Fecha'), key: 'data', width: 2 }, { header: L('Descrição', 'Description', 'Descripción'), key: 'descricao', width: 4 },
        { header: L('Categoria', 'Category', 'Categoría'), key: 'categoria', width: 3 }, { header: L('Valor', 'Amount', 'Valor'), key: 'valor', width: 2, align: 'right' },
        { header: L('Limite MEI', 'MEI limit', 'Límite MEI'), key: 'limite', width: 2 }],
      linhas,
    }
  }

  function baixar(rel: Rel, formato: 'pdf' | 'xlsx' | 'csv') {
    if (!rel.linhas.length) { onErro(L('Ainda não há dados deste ano para este relatório.', 'No data for this year yet.', 'Aún no hay datos de este año.')); return }
    if (formato === 'pdf') {
      const linhas = rel.linhas.map((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, typeof v === 'number' ? n2(v) : v])))
      gerarPdfTabela({ titulo: rel.titulo, subtitulo: sub, colunas: rel.colunas, linhas, resumo: rel.resumo, nomeArquivo: `${rel.arquivo}.pdf` }, onErro, lang)
      return
    }
    // Planilha: cabeçalho em texto e número de verdade (o contador soma direto no Excel).
    exportarPlanilha(rel.linhas.map((l) => Object.fromEntries(rel.colunas.map((c) => [c.header, l[c.key] ?? '']))), rel.arquivo, rel.titulo, formato)
  }

  const RELS: [() => Rel, string, string][] = [
    [relReceitasBrutas, L('Relatório Mensal das Receitas Brutas', 'Monthly Gross Revenue Report', 'Informe Mensual de Ingresos Brutos'), L('Obrigatório guardar todo mês, com as notas fiscais. Separado por tipo, como pede a declaração anual.', 'Must be kept every month with the invoices. Split by type, as the annual declaration asks.', 'Obligatorio guardar cada mes, con las facturas. Separado por tipo, como pide la declaración anual.')],
    [relDas, L('DAS do ano', 'DAS for the year', 'DAS del año'), L('Cada mês: valor, quanto foi pago, multa/juros, quando pagou e o que falta.', 'Each month: amount, paid, fine/interest, when and what is left.', 'Cada mes: valor, pagado, multa/intereses, cuándo y lo que falta.')],
    [relReceitas, L('Receitas do ano', 'Revenues for the year', 'Ingresos del año'), L('Lista completa, com a marcação do que conta no limite do MEI.', 'Full list, marking what counts toward the MEI limit.', 'Lista completa, marcando lo que cuenta en el límite del MEI.')],
  ]
  return (
    <CanvasBox cor={MENTA} {...cartaoTema}>
      <p className="text-sm font-bold" style={{ color: TEXTO }}>{L('Documentos para o contador', 'Documents for the accountant', 'Documentos para el contador')} — {ano}</p>
      <p className="text-xs mt-1" style={{ color: SEC }}>{L('Baixe em PDF para guardar ou enviar, ou em Excel/CSV para o contador importar.', 'Download as PDF to keep or send, or Excel/CSV for the accountant to import.', 'Descargue en PDF para guardar o enviar, o en Excel/CSV para que el contador lo importe.')}</p>
      <div className="mt-3 space-y-2">
        {RELS.map(([fn, titulo, texto]) => (
          <div key={titulo} className="rounded-xl p-3" style={CAIXA}>
            <p className="text-xs font-bold" style={{ color: TEXTO }}>{titulo}</p>
            <p className="text-[11px] mt-1" style={{ color: SEC }}>{texto}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={() => baixar(fn(), 'pdf')} className="px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5" style={{ background: MENTA, color: '#ffffff' }}><FileText size={12} />PDF</button>
              <button onClick={() => baixar(fn(), 'xlsx')} className="px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5" style={{ background: NAVY, color: '#ffffff' }}><FileSpreadsheet size={12} />Excel</button>
              <button onClick={() => baixar(fn(), 'csv')} className="px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5" style={{ background: NAVY, color: '#ffffff' }}><FileDown size={12} />CSV</button>
            </div>
          </div>
        ))}
      </div>
    </CanvasBox>
  )
}
