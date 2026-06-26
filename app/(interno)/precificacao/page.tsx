'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { Tag, Trash2, Pencil, X } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Precificacao() {
  const { idioma } = useLanguage()
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [produtoServico, setProdutoServico] = useState('')
  const [custoTotal, setCustoTotal] = useState('')
  const [margemDesejada, setMargemDesejada] = useState('')
  const [impostos, setImpostos] = useState('')
  const [despesas, setDespesas] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)

  const txt = {
    titulo: idioma === 'pt' ? 'Precificação' : idioma === 'en' ? 'Pricing' : 'Precios',
    subtitulo: idioma === 'pt' ? 'Calcule o preço ideal dos seus produtos e serviços' : idioma === 'en' ? 'Calculate the ideal price for your products and services' : 'Calcula el precio ideal',
    novo: idioma === 'pt' ? 'Novo Produto' : idioma === 'en' ? 'New Product' : 'Nuevo Producto',
    editar: idioma === 'pt' ? 'Editar Produto' : idioma === 'en' ? 'Edit Product' : 'Editar Producto',
    salvar: idioma === 'pt' ? 'Salvar' : idioma === 'en' ? 'Save' : 'Guardar',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    semProdutos: idioma === 'pt' ? 'Nenhum produto cadastrado.' : idioma === 'en' ? 'No products yet.' : 'Sin productos aún.',
    precoSugerido: idioma === 'pt' ? 'Preço Sugerido' : idioma === 'en' ? 'Suggested Price' : 'Precio Sugerido',
    custo: idioma === 'pt' ? 'Custo' : idioma === 'en' ? 'Cost' : 'Costo',
    lucro: idioma === 'pt' ? 'Lucro' : idioma === 'en' ? 'Profit' : 'Ganancia',
    margem: idioma === 'pt' ? 'Margem' : idioma === 'en' ? 'Margin' : 'Margen',
    dadosProduto: idioma === 'pt' ? 'Dados do Produto' : idioma === 'en' ? 'Product Data' : 'Datos del Producto',
    produtos: idioma === 'pt' ? 'Produtos' : idioma === 'en' ? 'Products' : 'Productos',
    margemMedia: idioma === 'pt' ? 'Margem Média' : idioma === 'en' ? 'Avg Margin' : 'Margen Prom.',
    menorPreco: idioma === 'pt' ? 'Menor Preço' : idioma === 'en' ? 'Min Price' : 'Precio Mín.',
    maiorPreco: idioma === 'pt' ? 'Maior Preço' : idioma === 'en' ? 'Max Price' : 'Precio Máx.',
    inteligencia: idioma === 'pt' ? 'Precifique com inteligência' : idioma === 'en' ? 'Price with intelligence' : 'Precifica con inteligencia',
    resumo: idioma === 'pt' ? 'Resumo' : idioma === 'en' ? 'Summary' : 'Resumen',
  }

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('precificacao').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setProdutos(data || [])
    setLoading(false)
  }

  function calcularPreco(c: string, m: string, imp: string, desp: string) {
    const custoNum = parseFloat(c || '0')
    const margemNum = parseFloat(m || '0') / 100
    const impostosNum = parseFloat(imp || '0') / 100
    const despesasNum = parseFloat(desp || '0') / 100
    const divisor = 1 - margemNum - impostosNum - despesasNum
    if (divisor <= 0) return 0
    return custoNum / divisor
  }

  const precoPreview = calcularPreco(custoTotal, margemDesejada, impostos, despesas)

  function abrirNovo() {
    setEditando(null)
    setProdutoServico(''); setCustoTotal(''); setMargemDesejada(''); setImpostos(''); setDespesas('')
    setModalAberto(true)
  }

  function abrirEdicao(p: any) {
    setEditando(p)
    setProdutoServico(p.produto_servico || '')
    setCustoTotal(String(p.custo_total || ''))
    setMargemDesejada(String(p.margem_desejada || ''))
    setImpostos(String(p.impostos || ''))
    setDespesas(String(p.despesas || ''))
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null)
    setProdutoServico(''); setCustoTotal(''); setMargemDesejada(''); setImpostos(''); setDespesas('')
  }

  async function salvar() {
    if (!produtoServico || !custoTotal || !margemDesejada) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const precoSugerido = calcularPreco(custoTotal, margemDesejada, impostos, despesas)
    const payload = {
      produto_servico: produtoServico,
      custo_total: parseFloat(custoTotal),
      margem_desejada: parseFloat(margemDesejada),
      preco_sugerido: precoSugerido,
    }
    if (editando) {
      await supabase.from('precificacao').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('precificacao').insert({ ...payload, user_id: user.id })
    }
    fecharModal(); setSalvando(false); carregar()
  }

  async function excluir(id: string) {
    await supabase.from('precificacao').delete().eq('id', id); carregar()
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
          { header: 'Produto/Serviço', key: 'produto', width: 5 },
          { header: 'Custo (R$)', key: 'custo', width: 2, align: 'right' },
          { header: 'Margem', key: 'margem', width: 2, align: 'right' },
          { header: 'Lucro (R$)', key: 'lucro', width: 2, align: 'right' },
          { header: 'Preço (R$)', key: 'preco', width: 2, align: 'right' },
        ],
        linhas: produtos.map((p) => ({
          produto: p.produto_servico,
          custo: fmtN(p.custo_total || 0),
          margem: `${p.margem_desejada || 0}%`,
          lucro: fmtN((p.preco_sugerido || 0) * ((p.margem_desejada || 0) / 100)),
          preco: fmtN(p.preco_sugerido || 0),
        })),
        resumo: [
          { label: txt.produtos, valor: `${produtos.length}` },
          { label: txt.margemMedia, valor: `${margemMedia}%` },
          { label: txt.menorPreco, valor: `R$ ${fmtN(menorPreco)}` },
          { label: txt.maiorPreco, valor: `R$ ${fmtN(maiorPreco)}` },
        ],
        nomeArquivo: `axioma-precificacao-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const margemMedia = produtos.length > 0 ? (produtos.reduce((a, p) => a + (p.margem_desejada || 0), 0) / produtos.length).toFixed(0) : '0'
  const menorPreco = produtos.length > 0 ? Math.min(...produtos.map(p => p.preco_sugerido || 0)) : 0
  const maiorPreco = produtos.length > 0 ? Math.max(...produtos.map(p => p.preco_sugerido || 0)) : 0

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={abrirNovo} labelBotao={txt.novo}>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna esquerda */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : produtos.length === 0 ? (
            <CanvasBox cor="#f59e0b">
              <div className="flex flex-col items-center justify-center py-16">
                <Tag size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
                <p className="text-sm" style={{ color: '#3a6090' }}>{txt.semProdutos}</p>
              </div>
            </CanvasBox>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {produtos.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CanvasBox cor="#f59e0b">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-sm truncate mr-2" style={{ color: '#c8d8f0' }}>{p.produto_servico}</h3>
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(p)}>
                          <Pencil size={15} style={{ color: '#6ab0ff' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(p.id)}>
                          <Trash2 size={15} style={{ color: '#f87171' }} />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-2xl font-black mb-3" style={{ color: '#f59e0b' }}>{fmt(p.preco_sugerido || 0)}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: '#3a6090' }}>{txt.custo}</span>
                        <span className="text-xs font-black" style={{ color: '#f87171' }}>{fmt(p.custo_total || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: '#3a6090' }}>{txt.margem}</span>
                        <span className="text-xs font-black" style={{ color: '#34d399' }}>{p.margem_desejada}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: '#3a6090' }}>{txt.lucro}</span>
                        <span className="text-xs font-black" style={{ color: '#6ab0ff' }}>{fmt((p.preco_sugerido || 0) * ((p.margem_desejada || 0) / 100))}</span>
                      </div>
                    </div>
                  </CanvasBox>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Painel direito — resumo calmo */}
        <div className="hidden lg:block">
          <CanvasBox cor="#f59e0b">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: '#f59e0b' }}>{txt.resumo}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: txt.produtos, valor: produtos.length, cor: '#f59e0b' },
                { label: txt.margemMedia, valor: `${margemMedia}%`, cor: '#34d399' },
                { label: txt.menorPreco, valor: fmt(menorPreco), cor: '#6ab0ff' },
                { label: txt.maiorPreco, valor: fmt(maiorPreco), cor: '#a78bfa' },
              ].map((stat, i) => (
                <div key={i}
                  className="rounded-xl p-3 text-center"
                  style={{ background: `${stat.cor}10`, border: `1px solid ${stat.cor}30` }}>
                  <p className="text-lg font-black mb-1" style={{ color: stat.cor }}>{stat.valor}</p>
                  <p className="text-xs" style={{ color: '#5a7a9a' }}>{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center mt-4" style={{ color: '#5a7a9a' }}>{txt.inteligencia}</p>
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
              className="w-full max-w-2xl max-h-screen overflow-y-auto">
              <CanvasBox cor="#f59e0b">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: '#f59e0b' }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: '#5a7a9a' }}><X size={20} /></motion.button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold" style={{ color: '#c8d8f0' }}>{txt.dadosProduto}</h4>
                    {[
                      { label: idioma === 'pt' ? 'Nome do Produto/Serviço' : 'Product/Service Name', value: produtoServico, set: setProdutoServico, type: 'text' },
                      { label: idioma === 'pt' ? 'Custo Total (R$)' : 'Total Cost ($)', value: custoTotal, set: setCustoTotal, type: 'number' },
                      { label: idioma === 'pt' ? 'Margem Desejada (%)' : 'Desired Margin (%)', value: margemDesejada, set: setMargemDesejada, type: 'number' },
                      { label: idioma === 'pt' ? 'Impostos (%)' : 'Taxes (%)', value: impostos, set: setImpostos, type: 'number' },
                      { label: idioma === 'pt' ? 'Despesas Operacionais (%)' : 'Operating Expenses (%)', value: despesas, set: setDespesas, type: 'number' },
                    ].map((c, idx) => (
                      <div key={idx}>
                        <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{c.label}</label>
                        <input type={c.type} value={c.value} onChange={e => c.set(e.target.value)} placeholder="0"
                          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col justify-center items-center text-center gap-4">
                    <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#5a7a9a' }}>{txt.precoSugerido}</p>
                    <motion.p key={precoPreview} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-black"
                      style={{ color: '#f59e0b' }}>
                      {fmt(precoPreview)}
                    </motion.p>
                    <div className="w-full space-y-2">
                      {[
                        { label: txt.custo, value: fmt(parseFloat(custoTotal || '0')), cor: '#f87171' },
                        { label: txt.lucro, value: fmt(precoPreview * (parseFloat(margemDesejada || '0') / 100)), cor: '#34d399' },
                        { label: txt.margem, value: `${margemDesejada || 0}%`, cor: '#6ab0ff' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between px-3 py-2 rounded-xl" style={{ background: `${item.cor}10` }}>
                          <span className="text-xs" style={{ color: '#3a6090' }}>{item.label}</span>
                          <span className="text-xs font-black" style={{ color: item.cor }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 w-full">
                      <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#5a7a9a' }}>{txt.cancelar}</button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={salvar} disabled={salvando}
                        className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #92400e, #f59e0b)', color: '#fff' }}>
                        {salvando ? '...' : txt.salvar}
                      </motion.button>
                    </div>
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