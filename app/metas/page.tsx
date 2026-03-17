'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { Target, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react'

export default function Metas() {
  const { idioma } = useLanguage()
  const [metas, setMetas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [prazo, setPrazo] = useState('')
  const [tipo, setTipo] = useState('receita')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('metas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setMetas(data || [])
    setLoading(false)
  }

  async function adicionar() {
    if (!nome || !valor || !prazo) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('metas').insert({ user_id: user.id, nome, valor: parseFloat(valor), prazo, tipo, concluida: false })
    setNome(''); setValor(''); setPrazo(''); setMostrarForm(false)
    carregar()
  }

  async function excluir(id: string) {
    const supabase = createClient()
    await supabase.from('metas').delete().eq('id', id)
    carregar()
  }

  async function concluir(id: string, status: boolean) {
    const supabase = createClient()
    await supabase.from('metas').update({ concluida: !status }).eq('id', id)
    carregar()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
            <Target size={24} style={{ color: "#34d399" }} />
            <h1 className="text-2xl font-black" style={{ color: "#c8d8f0" }}>
              {idioma === 'pt' ? 'Metas Financeiras' : idioma === 'en' ? 'Financial Goals' : 'Metas Financieras'}
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#3a6090" }}>
            {idioma === 'pt' ? 'Defina e acompanhe suas metas' : idioma === 'en' ? 'Set and track your goals' : 'Define y sigue tus metas'}
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff", boxShadow: "0 4px 20px rgba(42,95,212,0.3)" }}
        >
          <Plus size={16} />
          {idioma === 'pt' ? 'Nova Meta' : idioma === 'en' ? 'New Goal' : 'Nueva Meta'}
        </button>
      </div>

      {mostrarForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.3)" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>
            {idioma === 'pt' ? 'Nova Meta' : idioma === 'en' ? 'New Goal' : 'Nueva Meta'}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                {idioma === 'pt' ? 'Nome da Meta' : idioma === 'en' ? 'Goal Name' : 'Nombre de la Meta'}
              </label>
              <input value={nome} onChange={e => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                placeholder={idioma === 'pt' ? 'Ex: Reserva de emergência' : idioma === 'en' ? 'Ex: Emergency fund' : 'Ej: Fondo de emergencia'}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                {idioma === 'pt' ? 'Valor Alvo' : idioma === 'en' ? 'Target Value' : 'Valor Objetivo'}
              </label>
              <input value={valor} onChange={e => setValor(e.target.value)} type="number"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>
                {idioma === 'pt' ? 'Prazo' : idioma === 'en' ? 'Deadline' : 'Plazo'}
              </label>
              <input value={prazo} onChange={e => setPrazo(e.target.value)} type="date"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
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
                <option value="receita">{idioma === 'pt' ? 'Aumentar Receita' : idioma === 'en' ? 'Increase Revenue' : 'Aumentar Ingresos'}</option>
                <option value="economia">{idioma === 'pt' ? 'Economizar' : idioma === 'en' ? 'Save Money' : 'Ahorrar'}</option>
                <option value="investimento">{idioma === 'pt' ? 'Investimento' : idioma === 'en' ? 'Investment' : 'Inversión'}</option>
                <option value="reducao">{idioma === 'pt' ? 'Reduzir Custos' : idioma === 'en' ? 'Reduce Costs' : 'Reducir Costos'}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={adicionar}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
              {idioma === 'pt' ? 'Salvar Meta' : idioma === 'en' ? 'Save Goal' : 'Guardar Meta'}
            </button>
            <button onClick={() => setMostrarForm(false)}
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: "rgba(255,255,255,0.05)", color: "#3a6090" }}>
              {idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}

      {metas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Target size={48} style={{ color: "#1a3a5a" }} className="mb-4" />
          <p className="text-sm" style={{ color: "#3a6090" }}>
            {idioma === 'pt' ? 'Nenhuma meta cadastrada.' : idioma === 'en' ? 'No goals yet.' : 'Sin metas aún.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {metas.map((meta) => (
            <div key={meta.id} className="rounded-2xl p-6" style={{
              background: "rgba(10,22,40,0.8)",
              border: meta.concluida ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(59,111,212,0.15)",
              opacity: meta.concluida ? 0.7 : 1
            }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#c8d8f0" }}>{meta.nome}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: "rgba(52,211,153,0.1)",
                    color: "#34d399",
                    border: "1px solid rgba(52,211,153,0.2)"
                  }}>{meta.tipo}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => concluir(meta.id, meta.concluida)}>
                    <CheckCircle2 size={18} style={{ color: meta.concluida ? "#34d399" : "#1a3a5a" }} />
                  </button>
                  <button onClick={() => excluir(meta.id)}>
                    <Trash2 size={18} style={{ color: "#f87171" }} />
                  </button>
                </div>
              </div>
              <p className="text-2xl font-black mb-2" style={{ color: "#34d399" }}>{fmt(meta.valor)}</p>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: "#3a6090" }} />
                <p className="text-xs" style={{ color: "#3a6090" }}>{new Date(meta.prazo).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}