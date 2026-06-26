'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { Target, Trash2, CheckCircle2, Clock, Pencil, X } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Metas() {
  const { idioma } = useLanguage()
  const [metas, setMetas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [titulo, setTitulo] = useState('')
  const [valorMeta, setValorMeta] = useState('')
  const [prazo, setPrazo] = useState('')
  const [tipo, setTipo] = useState('receita')
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)

  const txt = {
    titulo: idioma === 'pt' ? 'Metas Financeiras' : idioma === 'en' ? 'Financial Goals' : 'Metas Financieras',
    subtitulo: idioma === 'pt' ? 'Defina e acompanhe suas metas' : idioma === 'en' ? 'Set and track your goals' : 'Define y sigue tus metas',
    novo: idioma === 'pt' ? 'Nova Meta' : idioma === 'en' ? 'New Goal' : 'Nueva Meta',
    editar: idioma === 'pt' ? 'Editar Meta' : idioma === 'en' ? 'Edit Goal' : 'Editar Meta',
    salvar: idioma === 'pt' ? 'Salvar Meta' : idioma === 'en' ? 'Save Goal' : 'Guardar Meta',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    semMetas: idioma === 'pt' ? 'Nenhuma meta cadastrada.' : idioma === 'en' ? 'No goals yet.' : 'Sin metas aún.',
    nomeMeta: idioma === 'pt' ? 'Nome da Meta' : idioma === 'en' ? 'Goal Name' : 'Nombre',
    valorAlvo: idioma === 'pt' ? 'Valor Alvo' : idioma === 'en' ? 'Target Value' : 'Valor Objetivo',
    prazoLabel: idioma === 'pt' ? 'Prazo' : idioma === 'en' ? 'Deadline' : 'Plazo',
    tipoLabel: idioma === 'pt' ? 'Tipo' : idioma === 'en' ? 'Type' : 'Tipo',
    concluida: idioma === 'pt' ? 'Concluída' : idioma === 'en' ? 'Completed' : 'Completada',
    emAndamento: idioma === 'pt' ? 'Em andamento' : idioma === 'en' ? 'In progress' : 'En progreso',
    totalMetas: idioma === 'pt' ? 'Total Metas' : idioma === 'en' ? 'Total Goals' : 'Total Metas',
    concluidas: idioma === 'pt' ? 'Concluídas' : idioma === 'en' ? 'Completed' : 'Completadas',
    emProgresso: idioma === 'pt' ? 'Em Progresso' : idioma === 'en' ? 'In Progress' : 'En Progreso',
    valorTotal: idioma === 'pt' ? 'Valor Total' : idioma === 'en' ? 'Total Value' : 'Valor Total',
    resumo: idioma === 'pt' ? 'Resumo' : idioma === 'en' ? 'Summary' : 'Resumen',
  }

  const tipoOpcoes = [
    { value: 'receita', label: idioma === 'pt' ? 'Aumentar Receita' : idioma === 'en' ? 'Increase Revenue' : 'Aumentar Ingresos' },
    { value: 'economia', label: idioma === 'pt' ? 'Economizar' : idioma === 'en' ? 'Save Money' : 'Ahorrar' },
    { value: 'investimento', label: idioma === 'pt' ? 'Investimento' : idioma === 'en' ? 'Investment' : 'Inversión' },
    { value: 'reducao', label: idioma === 'pt' ? 'Reduzir Custos' : idioma === 'en' ? 'Reduce Costs' : 'Reducir Costos' },
  ]

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('metas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setMetas(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setEditando(null); setTitulo(''); setValorMeta(''); setPrazo(''); setTipo('receita')
    setModalAberto(true)
  }

  function abrirEdicao(meta: any) {
    setEditando(meta); setTitulo(meta.titulo || ''); setValorMeta(String(meta.valor_meta || ''))
    setPrazo(meta.prazo || ''); setTipo(meta.tipo || 'receita'); setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null)
    setTitulo(''); setValorMeta(''); setPrazo(''); setTipo('receita')
  }

  async function salvar() {
    if (!titulo || !valorMeta) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const payload = { titulo, valor_meta: parseFloat(valorMeta), valor_atual: 0, prazo: prazo || null, tipo, status: 'em_andamento' }
    if (editando) {
      await supabase.from('metas').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('metas').insert({ ...payload, user_id: user.id })
    }
    fecharModal(); setSalvando(false); carregar()
  }

  async function excluir(id: string) {
    await supabase.from('metas').delete().eq('id', id); carregar()
  }

  async function toggleStatus(meta: any) {
    const novoStatus = meta.status === 'concluida' ? 'em_andamento' : 'concluida'
    await supabase.from('metas').update({ status: novoStatus }).eq('id', meta.id); carregar()
  }

  // PDF preto e branco (relatório/auditoria)
  const exportarPDF = async () => {
    setExportando(true)
    try {
      const fmtN = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      gerarPdfTabela({
        titulo: txt.titulo,
        subtitulo: txt.subtitulo,
        colunas: [
          { header: 'Meta', key: 'meta', width: 4 },
          { header: 'Tipo', key: 'tipo', width: 3 },
          { header: 'Prazo', key: 'prazo', width: 2 },
          { header: 'Status', key: 'status', width: 2 },
          { header: 'Valor Alvo (R$)', key: 'valor', width: 3, align: 'right' },
        ],
        linhas: metas.map((m) => ({
          meta: m.titulo || '-',
          tipo: tipoOpcoes.find(t => t.value === m.tipo)?.label || m.tipo || '-',
          prazo: m.prazo ? new Date(m.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
          status: m.status === 'concluida' ? txt.concluida : txt.emAndamento,
          valor: fmtN(m.valor_meta || 0),
        })),
        resumo: [
          { label: txt.totalMetas, valor: `${metas.length}` },
          { label: txt.concluidas, valor: `${metas.filter(m => m.status === 'concluida').length}` },
          { label: txt.emProgresso, valor: `${metas.filter(m => m.status !== 'concluida').length}` },
          { label: txt.valorTotal, valor: `R$ ${fmtN(metas.reduce((a, m) => a + (m.valor_meta || 0), 0))}` },
        ],
        nomeArquivo: `axioma-metas-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={abrirNovo} labelBotao={txt.novo}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna esquerda — metas */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : metas.length === 0 ? (
            <CanvasBox cor="#6ab0ff">
              <div className="flex flex-col items-center justify-center py-16">
                <Target size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
                <p className="text-sm" style={{ color: '#3a6090' }}>{txt.semMetas}</p>
              </div>
            </CanvasBox>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metas.map((meta, i) => {
                const concluida = meta.status === 'concluida'
                const progresso = meta.valor_meta > 0 ? Math.min(100, ((meta.valor_atual || 0) / meta.valor_meta) * 100) : 0
                return (
                  <motion.div key={meta.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <CanvasBox cor={concluida ? '#34d399' : '#6ab0ff'}>
                      <div style={{ opacity: concluida ? 0.85 : 1 }}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 mr-2">
                            <h3 className="font-bold text-sm mb-1 truncate" style={{ color: '#c8d8f0' }}>{meta.titulo}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                              {tipoOpcoes.find(t => t.value === meta.tipo)?.label || meta.tipo}
                            </span>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => toggleStatus(meta)}>
                              <CheckCircle2 size={18} style={{ color: concluida ? '#34d399' : '#1a3a5a' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(meta)}>
                              <Pencil size={16} style={{ color: '#6ab0ff' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(meta.id)}>
                              <Trash2 size={16} style={{ color: '#f87171' }} />
                            </motion.button>
                          </div>
                        </div>
                        <p className="text-2xl font-black mb-1" style={{ color: '#34d399' }}>
                          {fmt(meta.valor_meta)}
                        </p>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1" style={{ color: '#5a7a9a' }}>
                            <span>{fmt(meta.valor_atual || 0)}</span>
                            <span>{progresso.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(59,111,212,0.1)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progresso}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.08 }}
                              className="h-2 rounded-full"
                              style={{ background: concluida ? 'linear-gradient(90deg, #059669, #34d399)' : 'linear-gradient(90deg, #1a3a8f, #6ab0ff)' }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock size={12} style={{ color: '#3a6090' }} />
                            <p className="text-xs" style={{ color: '#3a6090' }}>
                              {meta.prazo ? new Date(meta.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: concluida ? 'rgba(52,211,153,0.15)' : 'rgba(106,176,255,0.1)',
                            color: concluida ? '#34d399' : '#6ab0ff'
                          }}>
                            {concluida ? txt.concluida : txt.emAndamento}
                          </span>
                        </div>
                      </div>
                    </CanvasBox>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Coluna direita — resumo calmo */}
        <div className="hidden lg:block">
          <CanvasBox cor="#34d399">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: '#34d399' }}>{txt.resumo}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: txt.totalMetas, valor: metas.length, cor: '#6ab0ff' },
                { label: txt.concluidas, valor: metas.filter(m => m.status === 'concluida').length, cor: '#34d399' },
                { label: txt.emProgresso, valor: metas.filter(m => m.status !== 'concluida').length, cor: '#fbbf24' },
                { label: txt.valorTotal, valor: `R$ ${metas.reduce((a, m) => a + (m.valor_meta || 0), 0).toLocaleString('pt-BR')}`, cor: '#a78bfa' },
              ].map((stat, i) => (
                <div key={i}
                  className="rounded-xl p-3 text-center"
                  style={{ background: `${stat.cor}10`, border: `1px solid ${stat.cor}30` }}>
                  <p className="text-xl font-black mb-1" style={{ color: stat.cor }}>{stat.valor}</p>
                  <p className="text-xs" style={{ color: '#5a7a9a' }}>{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center mt-4" style={{ color: '#5a7a9a' }}>
              {idioma === 'pt' ? 'Defina metas e conquiste resultados' : idioma === 'en' ? 'Set goals and achieve results' : 'Define metas y logra resultados'}
            </p>
          </CanvasBox>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#34d399">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: '#34d399' }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: '#5a7a9a' }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{txt.nomeMeta}</label>
                    <input value={titulo} onChange={e => setTitulo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{txt.valorAlvo}</label>
                    <input type="number" value={valorMeta} onChange={e => setValorMeta(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{txt.prazoLabel}</label>
                    <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{txt.tipoLabel}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {tipoOpcoes.map(op => (
                        <motion.button key={op.value} whileTap={{ scale: 0.97 }} onClick={() => setTipo(op.value)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{ background: tipo === op.value ? 'rgba(52,211,153,0.2)' : 'rgba(59,111,212,0.05)', color: tipo === op.value ? '#34d399' : '#5a7a9a', border: `1px solid ${tipo === op.value ? 'rgba(52,211,153,0.4)' : 'rgba(59,111,212,0.1)'}` }}>
                          {op.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#5a7a9a' }}>{txt.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={salvar} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #064e3b, #059669)', color: '#fff' }}>
                      {salvando ? '...' : txt.salvar}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  )
}