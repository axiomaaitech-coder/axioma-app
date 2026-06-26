'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { TrendingUp, Trash2, Pencil, X } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const corTipo: Record<string, string> = {
  renda_fixa: '#34d399', renda_variavel: '#f59e0b',
  criptomoeda: '#a78bfa', imovel: '#6ab0ff', outro: '#f472b6'
}

export default function Investimentos() {
  const { idioma } = useLanguage()
  const [investimentos, setInvestimentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('renda_fixa')
  const [data, setData] = useState('')
  const [rentabilidade, setRentabilidade] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)

  const txt = {
    titulo: idioma === 'pt' ? 'Investimentos' : idioma === 'en' ? 'Investments' : 'Inversiones',
    subtitulo: idioma === 'pt' ? 'Acompanhe sua carteira de investimentos' : idioma === 'en' ? 'Track your investment portfolio' : 'Sigue tu cartera de inversiones',
    novo: idioma === 'pt' ? 'Novo Investimento' : idioma === 'en' ? 'New Investment' : 'Nueva Inversión',
    editar: idioma === 'pt' ? 'Editar Investimento' : idioma === 'en' ? 'Edit Investment' : 'Editar Inversión',
    salvar: idioma === 'pt' ? 'Salvar' : idioma === 'en' ? 'Save' : 'Guardar',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    totalInvestido: idioma === 'pt' ? 'Total Investido' : idioma === 'en' ? 'Total Invested' : 'Total Invertido',
    semInv: idioma === 'pt' ? 'Nenhum investimento cadastrado.' : idioma === 'en' ? 'No investments yet.' : 'Sin inversiones aún.',
    ativos: idioma === 'pt' ? 'Ativos' : idioma === 'en' ? 'Assets' : 'Activos',
    melhorRent: idioma === 'pt' ? 'Melhor Rent.' : idioma === 'en' ? 'Best Return' : 'Mejor Rent.',
  }

  const tipoOpcoes = [
    { value: 'renda_fixa', label: idioma === 'pt' ? 'Renda Fixa' : idioma === 'en' ? 'Fixed Income' : 'Renta Fija' },
    { value: 'renda_variavel', label: idioma === 'pt' ? 'Renda Variável' : idioma === 'en' ? 'Variable Income' : 'Renta Variable' },
    { value: 'criptomoeda', label: idioma === 'pt' ? 'Criptomoeda' : idioma === 'en' ? 'Cryptocurrency' : 'Criptomoneda' },
    { value: 'imovel', label: idioma === 'pt' ? 'Imóvel' : idioma === 'en' ? 'Real Estate' : 'Inmueble' },
    { value: 'outro', label: idioma === 'pt' ? 'Outro' : idioma === 'en' ? 'Other' : 'Otro' },
  ]

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('investimentos').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setInvestimentos(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setEditando(null); setNome(''); setValor(''); setTipo('renda_fixa'); setData(''); setRentabilidade('')
    setModalAberto(true)
  }

  function abrirEdicao(inv: any) {
    setEditando(inv); setNome(inv.nome); setValor(String(inv.valor))
    setTipo(inv.tipo); setData(inv.data); setRentabilidade(String(inv.rentabilidade || ''))
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null)
    setNome(''); setValor(''); setTipo('renda_fixa'); setData(''); setRentabilidade('')
  }

  async function salvar() {
    if (!nome || !valor || !data) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const payload = { nome, valor: parseFloat(valor), tipo, data, rentabilidade: parseFloat(rentabilidade || '0') }
    editando
      ? await supabase.from('investimentos').update(payload).eq('id', editando.id)
      : await supabase.from('investimentos').insert({ ...payload, user_id: user.id })
    fecharModal(); setSalvando(false); carregar()
  }

  async function excluir(id: string) {
    await supabase.from('investimentos').delete().eq('id', id); carregar()
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
          { header: 'Ativo', key: 'nome', width: 4 },
          { header: 'Tipo', key: 'tipo', width: 3 },
          { header: 'Data', key: 'data', width: 2 },
          { header: 'Rentab.', key: 'rent', width: 2, align: 'right' },
          { header: 'Valor (R$)', key: 'valor', width: 3, align: 'right' },
        ],
        linhas: investimentos.map((inv) => ({
          nome: inv.nome,
          tipo: tipoOpcoes.find(t => t.value === inv.tipo)?.label || inv.tipo,
          data: inv.data ? new Date(inv.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
          rent: `${inv.rentabilidade || 0}% a.a.`,
          valor: fmtN(inv.valor || 0),
        })),
        resumo: [
          { label: txt.totalInvestido, valor: `R$ ${fmtN(totalInvestido)}` },
          { label: txt.ativos, valor: `${investimentos.length}` },
          { label: txt.melhorRent, valor: `${melhorRent}% a.a.` },
        ],
        nomeArquivo: `axioma-investimentos-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalInvestido = investimentos.reduce((s, i) => s + (i.valor || 0), 0)
  const melhorRent = investimentos.length > 0 ? Math.max(...investimentos.map(i => i.rentabilidade || 0)) : 0

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={abrirNovo} labelBotao={txt.novo}>
      <div className="space-y-4">

        {/* Cards topo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: txt.totalInvestido, value: fmt(totalInvestido), cor: '#34d399' },
            { label: txt.ativos, value: `${investimentos.length}`, cor: '#6ab0ff' },
            { label: txt.melhorRent, value: `${melhorRent}% a.a.`, cor: '#f59e0b' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
                <p className="text-2xl font-black" style={{ color: card.cor }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : investimentos.length === 0 ? (
          <CanvasBox cor="#34d399">
            <div className="flex flex-col items-center justify-center py-16">
              <TrendingUp size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
              <p className="text-sm" style={{ color: '#3a6090' }}>{txt.semInv}</p>
            </div>
          </CanvasBox>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {investimentos.map((inv, i) => {
              const cor = corTipo[inv.tipo] || '#6ab0ff'
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CanvasBox cor={cor}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 mr-2">
                        <h3 className="font-bold text-sm mb-1 truncate" style={{ color: '#c8d8f0' }}>{inv.nome}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cor}20`, color: cor, border: `1px solid ${cor}40` }}>
                          {tipoOpcoes.find(t => t.value === inv.tipo)?.label || inv.tipo}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(inv)}>
                          <Pencil size={16} style={{ color: '#6ab0ff' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(inv.id)}>
                          <Trash2 size={16} style={{ color: '#f87171' }} />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-2xl font-black mb-2" style={{ color: cor }}>{fmt(inv.valor)}</p>
                    <div className="flex justify-between">
                      <p className="text-xs" style={{ color: '#3a6090' }}>{new Date(inv.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                      {inv.rentabilidade > 0 && (
                        <p className="text-xs font-black" style={{ color: '#34d399' }}>{inv.rentabilidade}% a.a.</p>
                      )}
                    </div>
                  </CanvasBox>
                </motion.div>
              )
            })}
          </div>
        )}
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
                  {[
                    { label: idioma === 'pt' ? 'Nome' : 'Name', key: 'nome', value: nome, set: setNome, type: 'text' },
                    { label: idioma === 'pt' ? 'Valor' : 'Value', key: 'valor', value: valor, set: setValor, type: 'number' },
                    { label: idioma === 'pt' ? 'Data' : 'Date', key: 'data', value: data, set: setData, type: 'date' },
                    { label: idioma === 'pt' ? 'Rentabilidade % a.a.' : 'Return % p.a.', key: 'rent', value: rentabilidade, set: setRentabilidade, type: 'number' },
                  ].map(({ label, key, value, set, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{label}</label>
                      <input type={type} value={value} onChange={e => set(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Tipo' : 'Type'}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {tipoOpcoes.map(op => (
                        <motion.button key={op.value} whileTap={{ scale: 0.97 }} onClick={() => setTipo(op.value)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{ background: tipo === op.value ? `${corTipo[op.value]}25` : 'rgba(59,111,212,0.05)', color: tipo === op.value ? corTipo[op.value] : '#5a7a9a', border: `1px solid ${tipo === op.value ? `${corTipo[op.value]}50` : 'rgba(59,111,212,0.1)'}` }}>
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