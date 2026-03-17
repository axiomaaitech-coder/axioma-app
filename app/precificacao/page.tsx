'use client'
import { useState } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import { Tag, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function Precificacao() {
  const { idioma } = useLanguage()
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [custo, setCusto] = useState('')
  const [margem, setMargem] = useState('')
  const [impostos, setImpostos] = useState('')
  const [despesas, setDespesas] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('precificacao').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setProdutos(data || [])
    setLoading(false)
  }

  async function adicionar() {
    if (!nome || !custo || !margem) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const custoNum = parseFloat(custo)
    const margemNum = parseFloat(margem) / 100
    const impostosNum = parseFloat(impostos || '0') / 100
    const despesasNum = parseFloat(despesas || '0') / 100
    const precoSugerido = custoNum / (1 - margemNum - impostosNum - despesasNum)
    await supabase.from('precificacao').insert({
      user_id: user.id, nome, custo: custoNum, margem: parseFloat(margem),
      impostos: parseFloat(impostos || '0'), despesas: parseFloat(despesas || '0'),
      preco_sugerido: precoSugerido
    })
    setNome(''); setCusto(''); setMargem(''); setImpostos(''); setDespesas('')
    setMostrarForm(false)
    carregar()
  }

  async function excluir(id: string) {
    const supabase = createClient()
    await supabase.from('precificacao').delete().eq('id', id)
    carregar()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const calcularPreco = () => {
    const custoNum = parseFloat(custo || '0')
    const margemNum = parseFloat(margem || '0') / 100
    const impostosNum = parseFloat(impostos || '0') / 100
    const despesasNum = parseFloat(despesas || '0') / 100
    const divisor = 1 - margemNum - impostosNum - despesasNum
    if (divisor <= 0) return 0
    return custoNum / divisor
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#020810" }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{ background: "#020810" }}>

      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Tag size={24} style={{ color: "#f59e0b" }} />
            <h1 className="text-2xl font-black" style={{ color: "#c8d8f0" }}>
              {idioma === 'pt' ? 'Precificação' : idioma === 'en' ? 'Pricing' : 'Precios'}
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#3a6090" }}>
            {idioma === 'pt' ? 'Calcule o preço ideal dos seus produtos e serviços' : idioma === 'en' ? 'Calculate the ideal price for your products and services' : 'Calcula el precio ideal de tus productos y servicios'}
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff", boxShadow: "0 4px 20px rgba(42,95,212,0.3)" }}
        >
          <Plus size={16} />
          {idioma === 'pt' ? 'Novo Produto' : idioma === 'en' ? 'New Product' : 'Nuevo Producto'}
        </button>
      </div>

      {mostrarForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.3)" }}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold" style={{ color: "#c8d8f0" }}>
                {idioma === 'pt' ? 'Dados do Produto' : idioma === 'en' ? 'Product Data' : 'Datos del Producto'}
              </h3>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Nome do Produto/Serviço' : idioma === 'en' ? 'Product/Service Name' : 'Nombre del Producto/Servicio'}
                </label>
                <input value={nome} onChange={e => setNome(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder={idioma === 'pt' ? 'Ex: Consultoria Financeira' : 'Ex: Financial Consulting'}
                />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Custo Direto (R$)' : idioma === 'en' ? 'Direct Cost ($)' : 'Costo Directo ($)'}
                </label>
                <input value={custo} onChange={e => setCusto(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Margem de Lucro Desejada (%)' : idioma === 'en' ? 'Desired Profit Margin (%)' : 'Margen de Ganancia Deseado (%)'}
                </label>
                <input value={margem} onChange={e => setMargem(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="30" />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Impostos (%)' : idioma === 'en' ? 'Taxes (%)' : 'Impuestos (%)'}
                </label>
                <input value={impostos} onChange={e => setImpostos(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                  {idioma === 'pt' ? 'Despesas Operacionais (%)' : idioma === 'en' ? 'Operating Expenses (%)' : 'Gastos Operativos (%)'}
                </label>
                <input value={despesas} onChange={e => setDespesas(e.target.value)} type="number"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                  placeholder="0" />
              </div>
            </div>

            {/* Preview do preço */}
            <div className="rounded-2xl p-6 flex flex-col justify-center items-center text-center" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#3a5a8a" }}>
                {idioma === 'pt' ? 'Preço Sugerido' : idioma === 'en' ? 'Suggested Price' : 'Precio Sugerido'}
              </p>
              <p className="text-5xl font-black mb-4" style={{ color: "#f59e0b" }}>
                {fmt(calcularPreco())}
              </p>
              <div className="w-full space-y-2 text-left">
                <div className="flex justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.1)" }}>
                  <span className="text-xs" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'Custo' : 'Cost'}</span>
                  <span className="text-xs font-bold" style={{ color: "#f87171" }}>{fmt(parseFloat(custo || '0'))}</span>
                </div>
                <div className="flex justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(52,211,153,0.1)" }}>
                  <span className="text-xs" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'Lucro' : 'Profit'}</span>
                  <span className="text-xs font-bold" style={{ color: "#34d399" }}>{fmt(calcularPreco() * (parseFloat(margem || '0') / 100))}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6 w-full">
                <button onClick={adicionar}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                  {idioma === 'pt' ? 'Salvar' : idioma === 'en' ? 'Save' : 'Guardar'}
                </button>
                <button onClick={() => setMostrarForm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#3a6090" }}>
                  {idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Tag size={48} style={{ color: "#1a3a5a" }} className="mb-4" />
          <p className="text-sm" style={{ color: "#3a6090" }}>
            {idioma === 'pt' ? 'Nenhum produto cadastrado.' : idioma === 'en' ? 'No products yet.' : 'Sin productos aún.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {produtos.map((p) => (
            <div key={p.id} className="rounded-2xl p-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-sm" style={{ color: "#c8d8f0" }}>{p.nome}</h3>
                <button onClick={() => excluir(p.id)}>
                  <Trash2 size={16} style={{ color: "#f87171" }} />
                </button>
              </div>
              <p className="text-2xl font-black mb-3" style={{ color: "#f59e0b" }}>{fmt(p.preco_sugerido)}</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'Custo' : 'Cost'}</span>
                  <span className="text-xs font-bold" style={{ color: "#f87171" }}>{fmt(p.custo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'Margem' : 'Margin'}</span>
                  <span className="text-xs font-bold" style={{ color: "#34d399" }}>{p.margem}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}