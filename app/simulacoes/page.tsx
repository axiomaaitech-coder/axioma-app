'use client'
import { useState } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function Simulacoes() {
  const { idioma } = useLanguage()
  const [tipo, setTipo] = useState('lucro')

  // Simulação de Lucro
  const [receita, setReceita] = useState('')
  const [custoFixo, setCustoFixo] = useState('')
  const [custoVariavel, setCustoVariavel] = useState('')

  // Simulação de Ponto de Equilíbrio
  const [precoVenda, setPrecoVenda] = useState('')
  const [custoProduto, setCustoProduto] = useState('')
  const [custoFixoTotal, setCustoFixoTotal] = useState('')

  // Simulação de Crescimento
  const [valorAtual, setValorAtual] = useState('')
  const [taxaCrescimento, setTaxaCrescimento] = useState('')
  const [meses, setMeses] = useState('')

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const calcularLucro = () => {
    const r = parseFloat(receita || '0')
    const cf = parseFloat(custoFixo || '0')
    const cv = parseFloat(custoVariavel || '0')
    return r - cf - cv
  }

  const calcularPontoEquilibrio = () => {
    const pv = parseFloat(precoVenda || '0')
    const cp = parseFloat(custoProduto || '0')
    const cf = parseFloat(custoFixoTotal || '0')
    if (pv - cp <= 0) return 0
    return cf / (pv - cp)
  }

  const calcularCrescimento = () => {
    const va = parseFloat(valorAtual || '0')
    const tc = parseFloat(taxaCrescimento || '0') / 100
    const m = parseInt(meses || '0')
    return va * Math.pow(1 + tc, m)
  }

  const lucro = calcularLucro()
  const pontoEq = calcularPontoEquilibrio()
  const valorFinal = calcularCrescimento()

  const tipos = [
    { id: 'lucro', label: idioma === 'pt' ? '💰 Lucro' : idioma === 'en' ? '💰 Profit' : '💰 Ganancia', icon: DollarSign },
    { id: 'equilibrio', label: idioma === 'pt' ? '⚖️ Ponto de Equilíbrio' : idioma === 'en' ? '⚖️ Break Even' : '⚖️ Punto de Equilibrio', icon: TrendingDown },
    { id: 'crescimento', label: idioma === 'pt' ? '📈 Crescimento' : idioma === 'en' ? '📈 Growth' : '📈 Crecimiento', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{ background: "#020810" }}>

      <div className="flex items-center gap-3 mb-2">
        <Calculator size={24} style={{ color: "#a78bfa" }} />
        <h1 className="text-2xl font-black" style={{ color: "#c8d8f0" }}>
          {idioma === 'pt' ? 'Simulações Financeiras' : idioma === 'en' ? 'Financial Simulations' : 'Simulaciones Financieras'}
        </h1>
      </div>
      <p className="text-sm mb-8" style={{ color: "#3a6090" }}>
        {idioma === 'pt' ? 'Simule cenários e tome decisões mais inteligentes' : idioma === 'en' ? 'Simulate scenarios and make smarter decisions' : 'Simula escenarios y toma decisiones más inteligentes'}
      </p>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        {tipos.map((t) => (
          <button
            key={t.id}
            onClick={() => setTipo(t.id)}
            className="px-5 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: tipo === t.id ? "linear-gradient(135deg, #1a3a8f, #2a5fd4)" : "rgba(10,22,40,0.8)",
              color: tipo === t.id ? "#fff" : "#3a6090",
              border: tipo === t.id ? "1px solid rgba(59,111,212,0.5)" : "1px solid rgba(59,111,212,0.15)",
              boxShadow: tipo === t.id ? "0 4px 20px rgba(42,95,212,0.3)" : "none"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Formulário */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <h3 className="text-sm font-bold mb-6" style={{ color: "#c8d8f0" }}>
            {idioma === 'pt' ? 'Dados da Simulação' : idioma === 'en' ? 'Simulation Data' : 'Datos de la Simulación'}
          </h3>

          {tipo === 'lucro' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Receita Total' : idioma === 'en' ? 'Total Revenue' : 'Ingresos Totales'}
                </label>
                <input value={receita} onChange={e => setReceita(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Custos Fixos' : idioma === 'en' ? 'Fixed Costs' : 'Costos Fijos'}
                </label>
                <input value={custoFixo} onChange={e => setCustoFixo(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Custos Variáveis' : idioma === 'en' ? 'Variable Costs' : 'Costos Variables'}
                </label>
                <input value={custoVariavel} onChange={e => setCustoVariavel(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0,00" />
              </div>
            </div>
          )}

          {tipo === 'equilibrio' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Preço de Venda (un.)' : idioma === 'en' ? 'Selling Price (unit)' : 'Precio de Venta (un.)'}
                </label>
                <input value={precoVenda} onChange={e => setPrecoVenda(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Custo por Produto (un.)' : idioma === 'en' ? 'Product Cost (unit)' : 'Costo por Producto (un.)'}
                </label>
                <input value={custoProduto} onChange={e => setCustoProduto(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Custos Fixos Totais' : idioma === 'en' ? 'Total Fixed Costs' : 'Costos Fijos Totales'}
                </label>
                <input value={custoFixoTotal} onChange={e => setCustoFixoTotal(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0,00" />
              </div>
            </div>
          )}

          {tipo === 'crescimento' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Valor Atual' : idioma === 'en' ? 'Current Value' : 'Valor Actual'}
                </label>
                <input value={valorAtual} onChange={e => setValorAtual(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Taxa de Crescimento Mensal (%)' : idioma === 'en' ? 'Monthly Growth Rate (%)' : 'Tasa de Crecimiento Mensual (%)'}
                </label>
                <input value={taxaCrescimento} onChange={e => setTaxaCrescimento(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Quantidade de Meses' : idioma === 'en' ? 'Number of Months' : 'Cantidad de Meses'}
                </label>
                <input value={meses} onChange={e => setMeses(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="12" />
              </div>
            </div>
          )}
        </div>

        {/* Resultado */}
        <div className="rounded-2xl p-6 flex flex-col justify-center items-center text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(167,139,250,0.2)" }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#3a5a8a" }}>
            {idioma === 'pt' ? 'Resultado da Simulação' : idioma === 'en' ? 'Simulation Result' : 'Resultado de la Simulación'}
          </p>

          {tipo === 'lucro' && (
            <>
              <p className="text-5xl font-black mb-3" style={{ color: lucro >= 0 ? "#34d399" : "#f87171" }}>
                {fmt(lucro)}
              </p>
              <p className="text-sm" style={{ color: lucro >= 0 ? "#34d399" : "#f87171" }}>
                {lucro >= 0
                  ? (idioma === 'pt' ? '✅ Operação lucrativa' : idioma === 'en' ? '✅ Profitable operation' : '✅ Operación rentable')
                  : (idioma === 'pt' ? '⚠️ Operação no prejuízo' : idioma === 'en' ? '⚠️ Loss-making operation' : '⚠️ Operación con pérdidas')}
              </p>
              <div className="mt-6 w-full space-y-3">
                <div className="flex justify-between px-4 py-2 rounded-xl" style={{ background: "rgba(59,111,212,0.1)" }}>
                  <span className="text-xs" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'Receita' : idioma === 'en' ? 'Revenue' : 'Ingresos'}</span>
                  <span className="text-xs font-bold" style={{ color: "#6ab0ff" }}>{fmt(parseFloat(receita || '0'))}</span>
                </div>
                <div className="flex justify-between px-4 py-2 rounded-xl" style={{ background: "rgba(248,113,113,0.1)" }}>
                  <span className="text-xs" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'Custos Totais' : idioma === 'en' ? 'Total Costs' : 'Costos Totales'}</span>
                  <span className="text-xs font-bold" style={{ color: "#f87171" }}>{fmt(parseFloat(custoFixo || '0') + parseFloat(custoVariavel || '0'))}</span>
                </div>
              </div>
            </>
          )}

          {tipo === 'equilibrio' && (
            <>
              <p className="text-5xl font-black mb-3" style={{ color: "#a78bfa" }}>
                {Math.ceil(pontoEq)} {idioma === 'pt' ? 'un.' : 'units'}
              </p>
              <p className="text-sm mb-2" style={{ color: "#3a6090" }}>
                {idioma === 'pt' ? 'Unidades para cobrir todos os custos' : idioma === 'en' ? 'Units to cover all costs' : 'Unidades para cubrir todos los costos'}
              </p>
              <p className="text-lg font-bold" style={{ color: "#34d399" }}>
                {fmt(pontoEq * parseFloat(precoVenda || '0'))}
              </p>
              <p className="text-xs mt-1" style={{ color: "#3a6090" }}>
                {idioma === 'pt' ? 'em faturamento' : idioma === 'en' ? 'in revenue' : 'en facturación'}
              </p>
            </>
          )}

          {tipo === 'crescimento' && (
            <>
              <p className="text-5xl font-black mb-3" style={{ color: "#34d399" }}>
                {fmt(valorFinal)}
              </p>
              <p className="text-sm mb-4" style={{ color: "#3a6090" }}>
                {idioma === 'pt' ? `Valor projetado em ${meses || 0} meses` : idioma === 'en' ? `Projected value in ${meses || 0} months` : `Valor proyectado en ${meses || 0} meses`}
              </p>
              <div className="flex justify-between w-full px-4 py-2 rounded-xl" style={{ background: "rgba(52,211,153,0.1)" }}>
                <span className="text-xs" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'Crescimento total' : idioma === 'en' ? 'Total growth' : 'Crecimiento total'}</span>
                <span className="text-xs font-bold" style={{ color: "#34d399" }}>
                  {fmt(valorFinal - parseFloat(valorAtual || '0'))}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}