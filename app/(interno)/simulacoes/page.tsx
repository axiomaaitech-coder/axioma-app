'use client'
import { useState } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { motion } from 'framer-motion'

export default function Simulacoes() {
  const { idioma } = useLanguage()
  const [tipo, setTipo] = useState('lucro')
  const [exportando, setExportando] = useState(false)
  const [receita, setReceita] = useState('')
  const [custoFixo, setCustoFixo] = useState('')
  const [custoVariavel, setCustoVariavel] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [custoProduto, setCustoProduto] = useState('')
  const [custoFixoTotal, setCustoFixoTotal] = useState('')
  const [valorAtual, setValorAtual] = useState('')
  const [taxaCrescimento, setTaxaCrescimento] = useState('')
  const [meses, setMeses] = useState('')

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtN = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const lucro = parseFloat(receita || '0') - parseFloat(custoFixo || '0') - parseFloat(custoVariavel || '0')
  const pontoEq = (() => { const pv = parseFloat(precoVenda || '0'); const cp = parseFloat(custoProduto || '0'); const cf = parseFloat(custoFixoTotal || '0'); return pv - cp <= 0 ? 0 : cf / (pv - cp) })()
  const valorFinal = parseFloat(valorAtual || '0') * Math.pow(1 + parseFloat(taxaCrescimento || '0') / 100, parseInt(meses || '0'))

  const titulo = idioma === 'pt' ? 'Simulações Financeiras' : idioma === 'en' ? 'Financial Simulations' : 'Simulaciones Financieras'
  const subtitulo = idioma === 'pt' ? 'Simule cenários e tome decisões mais inteligentes' : idioma === 'en' ? 'Simulate scenarios and make smarter decisions' : 'Simula escenarios'

  const tipos = [
    { id: 'lucro', label: '💰 ' + (idioma === 'pt' ? 'Lucro' : 'Profit'), cor: "#34d399" },
    { id: 'equilibrio', label: '⚖️ ' + (idioma === 'pt' ? 'Equilíbrio' : 'Break Even'), cor: "#a78bfa" },
    { id: 'crescimento', label: '📈 ' + (idioma === 'pt' ? 'Crescimento' : 'Growth'), cor: "#6ab0ff" },
  ]
  const corAtual = tipos.find(t => t.id === tipo)?.cor || "#6ab0ff"

  // PDF preto e branco (relatório/auditoria)
  const exportarPDF = async () => {
    setExportando(true)
    try {
      let linhas: Record<string, string>[] = []
      let resumo: { label: string; valor: string }[] = []

      if (tipo === 'lucro') {
        linhas = [
          { item: 'Receita Total', valor: fmtN(parseFloat(receita || '0')) },
          { item: 'Custos Fixos', valor: fmtN(parseFloat(custoFixo || '0')) },
          { item: 'Custos Variáveis', valor: fmtN(parseFloat(custoVariavel || '0')) },
        ]
        resumo = [
          { label: 'Tipo de Simulação', valor: 'Lucro' },
          { label: 'Resultado (Lucro)', valor: `R$ ${fmtN(lucro)}` },
          { label: 'Situação', valor: lucro >= 0 ? 'Operação lucrativa' : 'Operação no prejuízo' },
        ]
      } else if (tipo === 'equilibrio') {
        linhas = [
          { item: 'Preço de Venda (un.)', valor: fmtN(parseFloat(precoVenda || '0')) },
          { item: 'Custo por Produto (un.)', valor: fmtN(parseFloat(custoProduto || '0')) },
          { item: 'Custos Fixos Totais', valor: fmtN(parseFloat(custoFixoTotal || '0')) },
        ]
        resumo = [
          { label: 'Tipo de Simulação', valor: 'Ponto de Equilíbrio' },
          { label: 'Unidades necessárias', valor: `${Math.ceil(pontoEq)}` },
          { label: 'Faturamento no equilíbrio', valor: `R$ ${fmtN(pontoEq * parseFloat(precoVenda || '0'))}` },
        ]
      } else {
        linhas = [
          { item: 'Valor Atual', valor: fmtN(parseFloat(valorAtual || '0')) },
          { item: 'Taxa de Crescimento Mensal', valor: `${taxaCrescimento || 0}%` },
          { item: 'Quantidade de Meses', valor: `${meses || 0}` },
        ]
        resumo = [
          { label: 'Tipo de Simulação', valor: 'Crescimento' },
          { label: 'Valor projetado', valor: `R$ ${fmtN(valorFinal)}` },
          { label: 'Crescimento total', valor: `R$ ${fmtN(valorFinal - parseFloat(valorAtual || '0'))}` },
        ]
      }

      gerarPdfTabela({
        titulo,
        subtitulo,
        colunas: [
          { header: 'Item', key: 'item', width: 5 },
          { header: 'Valor', key: 'valor', width: 3, align: 'right' },
        ],
        linhas,
        resumo,
        nomeArquivo: `axioma-simulacoes-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const botaoTipos = (
    <div className="flex gap-2 flex-wrap">
      {tipos.map((t) => (
        <motion.button key={t.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => setTipo(t.id)}
          className="px-4 py-2 rounded-xl font-bold text-sm"
          style={{ background: tipo === t.id ? `${t.cor}25` : "rgba(10,20,36,0.7)", color: tipo === t.id ? t.cor : "#5a7a9a", border: `1px solid ${tipo === t.id ? `${t.cor}50` : "rgba(59,111,212,0.15)"}` }}>
          {t.label}
        </motion.button>
      ))}
    </div>
  )

  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }

  return (
    <ModuloLayout titulo={titulo} subtitulo={subtitulo} onExportarPDF={exportarPDF} exportando={exportando} botaoExtra={botaoTipos}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Formulário */}
        <CanvasBox cor="#6ab0ff">
          <h3 className="text-sm font-bold mb-6" style={{ color: "#c8d8f0" }}>
            {idioma === 'pt' ? 'Dados da Simulação' : 'Simulation Data'}
          </h3>

          {tipo === 'lucro' && (
            <div className="space-y-4">
              {[
                { label: idioma === 'pt' ? 'Receita Total' : 'Total Revenue', value: receita, set: setReceita },
                { label: idioma === 'pt' ? 'Custos Fixos' : 'Fixed Costs', value: custoFixo, set: setCustoFixo },
                { label: idioma === 'pt' ? 'Custos Variáveis' : 'Variable Costs', value: custoVariavel, set: setCustoVariavel },
              ].map((c) => (
                <div key={c.label}>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{c.label}</label>
                  <input value={c.value} onChange={e => c.set(e.target.value)} type="number" placeholder="0,00"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
              ))}
            </div>
          )}

          {tipo === 'equilibrio' && (
            <div className="space-y-4">
              {[
                { label: idioma === 'pt' ? 'Preço de Venda (un.)' : 'Selling Price (unit)', value: precoVenda, set: setPrecoVenda },
                { label: idioma === 'pt' ? 'Custo por Produto (un.)' : 'Product Cost (unit)', value: custoProduto, set: setCustoProduto },
                { label: idioma === 'pt' ? 'Custos Fixos Totais' : 'Total Fixed Costs', value: custoFixoTotal, set: setCustoFixoTotal },
              ].map((c) => (
                <div key={c.label}>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{c.label}</label>
                  <input value={c.value} onChange={e => c.set(e.target.value)} type="number" placeholder="0,00"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
              ))}
            </div>
          )}

          {tipo === 'crescimento' && (
            <div className="space-y-4">
              {[
                { label: idioma === 'pt' ? 'Valor Atual' : 'Current Value', value: valorAtual, set: setValorAtual },
                { label: idioma === 'pt' ? 'Taxa de Crescimento Mensal (%)' : 'Monthly Growth Rate (%)', value: taxaCrescimento, set: setTaxaCrescimento },
                { label: idioma === 'pt' ? 'Quantidade de Meses' : 'Number of Months', value: meses, set: setMeses },
              ].map((c) => (
                <div key={c.label}>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{c.label}</label>
                  <input value={c.value} onChange={e => c.set(e.target.value)} type="number" placeholder="0"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
              ))}
            </div>
          )}
        </CanvasBox>

        {/* Resultado */}
        <CanvasBox cor={corAtual}>
          <div className="flex flex-col justify-center items-center text-center min-h-[280px]">
            <p className="text-xs mb-8" style={{ color: "#5a7a9a" }}>
              {idioma === 'pt' ? 'Resultado da Simulação' : 'Simulation Result'}
            </p>

            {tipo === 'lucro' && (
              <>
                <motion.p key={lucro} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-black mb-3"
                  style={{ color: lucro >= 0 ? "#34d399" : "#f87171" }}>
                  {fmt(lucro)}
                </motion.p>
                <p className="text-sm mb-6" style={{ color: lucro >= 0 ? "#34d399" : "#f87171" }}>
                  {lucro >= 0 ? '✅ Operação lucrativa' : '⚠️ Operação no prejuízo'}
                </p>
                <div className="w-full space-y-3">
                  {[
                    { label: 'Receita', value: fmt(parseFloat(receita || '0')), cor: "#6ab0ff" },
                    { label: 'Custos Totais', value: fmt(parseFloat(custoFixo || '0') + parseFloat(custoVariavel || '0')), cor: "#f87171" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between px-4 py-2 rounded-xl" style={{ background: `${item.cor}10` }}>
                      <span className="text-xs" style={{ color: "#3a6090" }}>{item.label}</span>
                      <span className="text-xs font-bold" style={{ color: item.cor }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tipo === 'equilibrio' && (
              <>
                <motion.p key={pontoEq} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-black mb-3"
                  style={{ color: "#a78bfa" }}>
                  {Math.ceil(pontoEq)} {idioma === 'pt' ? 'un.' : 'units'}
                </motion.p>
                <p className="text-sm mb-4" style={{ color: "#3a6090" }}>
                  {idioma === 'pt' ? 'Unidades para cobrir todos os custos' : 'Units to cover all costs'}
                </p>
                <p className="text-lg font-bold" style={{ color: "#34d399" }}>{fmt(pontoEq * parseFloat(precoVenda || '0'))}</p>
                <p className="text-xs mt-1" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'em faturamento' : 'in revenue'}</p>
              </>
            )}

            {tipo === 'crescimento' && (
              <>
                <motion.p key={valorFinal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-black mb-3"
                  style={{ color: "#34d399" }}>
                  {fmt(valorFinal)}
                </motion.p>
                <p className="text-sm mb-4" style={{ color: "#3a6090" }}>
                  {idioma === 'pt' ? `Valor projetado em ${meses || 0} meses` : `Projected in ${meses || 0} months`}
                </p>
                <div className="flex justify-between w-full px-4 py-2 rounded-xl" style={{ background: "rgba(52,211,153,0.1)" }}>
                  <span className="text-xs" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'Crescimento total' : 'Total growth'}</span>
                  <span className="text-xs font-bold" style={{ color: "#34d399" }}>{fmt(valorFinal - parseFloat(valorAtual || '0'))}</span>
                </div>
              </>
            )}
          </div>
        </CanvasBox>
      </div>
    </ModuloLayout>
  )
}