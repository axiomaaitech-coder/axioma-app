'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'

export default function Investimentos() {
  const { idioma } = useLanguage()
  const [investimentos, setInvestimentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('renda_fixa')
  const [data, setData] = useState('')
  const [rentabilidade, setRentabilidade] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('investimentos').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setInvestimentos(data || [])
    setLoading(false)
  }

  async function adicionar() {
    if (!nome || !valor || !data) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('investimentos').insert({
      user_id: user.id, nome, valor: parseFloat(valor), tipo, data, rentabilidade: parseFloat(rentabilidade || '0')
    })
    setNome(''); setValor(''); setData(''); setRentabilidade(''); setMostrarForm(false)
    carregar()
  }

  async function excluir(id: string) {
    const supabase = createClient()
    await supabase.from('investimentos').delete().eq('id', id)
    carregar()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalInvestido = investimentos.reduce((s, i) => s + (i.valor || 0), 0)

  const corTipo: any = {
    renda_fixa: '#34d399',
    renda_variavel: '#f59e0b',
    criptomoeda: '#a78bfa',
    imovel: '#3b6fd4',
    outro: '#6ab0ff'
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
            <TrendingUp size={24} style={{ color: "#34d399" }} />
            <h1 className="text-2xl font-black" style={{ color: "#c8d8f0" }}>
              {idioma === 'pt' ? 'Investimentos' : idioma === 'en' ? 'Investments' : 'Inversiones'}
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#3a6090" }}>
            {idioma === 'pt' ? 'Acompanhe sua carteira de investimentos' : idioma === 'en' ? 'Track your investment portfolio' : 'Sigue tu cartera de inversiones'}
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff", boxShadow: "0 4px 20px rgba(42,95,212,0.3)" }}
        >
          <Plus size={16} />
          {idioma === 'pt' ? 'Novo Investimento' : idioma === 'en' ? 'New Investment' : 'Nueva Inversión'}
        </button>
      </div>

      {/* Card total */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(52,211,153,0.2)" }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#3a5a8a" }}>
          {idioma === 'pt' ? 'Total Investido' : idioma === 'en' ? 'Total Invested' : 'Total Invertido'}
        </p>
        <p className="text-4xl font-black" style={{ color: "#34d399" }}>{fmt(totalInvestido)}</p>
      </div>

      {mostrarForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.3)" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>
            {idioma === 'pt' ? 'Novo Investimento' : idioma === 'en' ? 'New Investment' : 'Nueva Inversión'}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                {idioma === 'pt' ? 'Nome' : idioma === 'en' ? 'Name' : 'Nombre'}
              </label>
              <input value={nome} onChange={e => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                placeholder={idioma === 'pt' ? 'Ex: Tesouro Direto' : 'Ex: Treasury Bond'}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                {idioma === 'pt' ? 'Valor' : idioma === 'en' ? 'Value' : 'Valor'}
              </label>
              <input value={valor} onChange={e => setValor(e.target.value)} type="number"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                {idioma === 'pt' ? 'Tipo' : idioma === 'en' ? 'Type' : 'Tipo'}
              </label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
              >
                <option value="renda_fixa">{idioma === 'pt' ? 'Renda Fixa' : idioma === 'en' ? 'Fixed Income' : 'Renta Fija'}</option>
                <option value="renda_variavel">{idioma === 'pt' ? 'Renda Variável' : idioma === 'en' ? 'Variable Income' : 'Renta Variable'}</option>
                <option value="criptomoeda">{idioma === 'pt' ? 'Criptomoeda' : idioma === 'en' ? 'Cryptocurrency' : 'Criptomoneda'}</option>
                <option value="imovel">{idioma === 'pt' ? 'Imóvel' : idioma === 'en' ? 'Real Estate' : 'Inmueble'}</option>
                <option value="outro">{idioma === 'pt' ? 'Outro' : idioma === 'en' ? 'Other' : 'Otro'}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                {idioma === 'pt' ? 'Data' : idioma === 'en' ? 'Date' : 'Fecha'}
              </label>
              <input value={data} onChange={e => setData(e.target.value)} type="date"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                {idioma === 'pt' ? 'Rentabilidade % a.a.' : idioma === 'en' ? 'Return % p.a.' : 'Rentabilidad % a.a.'}
              </label>
              <input value={rentabilidade} onChange={e => setRentabilidade(e.target.value)} type="number"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={adicionar}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
              {idioma === 'pt' ? 'Salvar' : idioma === 'en' ? 'Save' : 'Guardar'}
            </button>
            <button onClick={() => setMostrarForm(false)}
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: "rgba(255,255,255,0.05)", color: "#3a6090" }}>
              {idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}

      {investimentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <TrendingUp size={48} style={{ color: "#1a3a5a" }} className="mb-4" />
          <p className="text-sm" style={{ color: "#3a6090" }}>
            {idioma === 'pt' ? 'Nenhum investimento cadastrado.' : idioma === 'en' ? 'No investments yet.' : 'Sin inversiones aún.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {investimentos.map((inv) => (
            <div key={inv.id} className="rounded-2xl p-6" style={{
              background: "rgba(10,22,40,0.8)",
              border: `1px solid ${corTipo[inv.tipo] || '#3b6fd4'}25`
            }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#c8d8f0" }}>{inv.nome}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: `${corTipo[inv.tipo] || '#3b6fd4'}20`,
                    color: corTipo[inv.tipo] || '#3b6fd4',
                    border: `1px solid ${corTipo[inv.tipo] || '#3b6fd4'}40`
                  }}>{inv.tipo?.replace('_', ' ')}</span>
                </div>
                <button onClick={() => excluir(inv.id)}>
                  <Trash2 size={18} style={{ color: "#f87171" }} />
                </button>
              </div>
              <p className="text-2xl font-black mb-2" style={{ color: corTipo[inv.tipo] || '#34d399' }}>{fmt(inv.valor)}</p>
              <div className="flex justify-between">
                <p className="text-xs" style={{ color: "#3a6090" }}>{new Date(inv.data).toLocaleDateString('pt-BR')}</p>
                {inv.rentabilidade > 0 && (
                  <p className="text-xs font-bold" style={{ color: "#34d399" }}>{inv.rentabilidade}% a.a.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}