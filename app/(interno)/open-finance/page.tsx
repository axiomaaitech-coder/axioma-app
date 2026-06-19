'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useLanguage } from '../../../lib/LanguageContext'
import ModuloLayout from '../../../components/ModuloLayout'
import { motion } from 'framer-motion'
import { Building2, RefreshCw, CheckCircle, AlertCircle, Zap, TrendingUp, TrendingDown } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const textos = {
  pt: {
    titulo: 'Open Finance',
    sub: 'Conecte sua conta bancária e importe extratos automaticamente',
    conectar: 'Conectar Banco',
    conectado: 'Banco Conectado',
    transacoes: 'Transações Importadas',
    importar: 'Importar Transações',
    status: 'Status da Conexão',
    ativo: 'Ativo',
    inativo: 'Inativo',
    banco: 'Banco',
    tipo: 'Tipo',
    entrada: 'Entrada',
    saida: 'Saída',
    data: 'Data',
    descricao: 'Descrição',
    valor: 'Valor',
    categoria: 'Categoria',
    semConexao: 'Nenhum banco conectado ainda',
    semTransacoes: 'Nenhuma transação importada ainda',
    conecteSeu: 'Conecte sua conta bancária para importar transações automaticamente',
    carregando: 'Carregando...',
    sucesso: 'Banco conectado com sucesso!',
    erro: 'Erro ao conectar banco',
    bancos: 'Bancos Suportados',
  },
  en: {
    titulo: 'Open Finance',
    sub: 'Connect your bank account and import statements automatically',
    conectar: 'Connect Bank',
    conectado: 'Bank Connected',
    transacoes: 'Imported Transactions',
    importar: 'Import Transactions',
    status: 'Connection Status',
    ativo: 'Active',
    inativo: 'Inactive',
    banco: 'Bank',
    tipo: 'Type',
    entrada: 'Income',
    saida: 'Expense',
    data: 'Date',
    descricao: 'Description',
    valor: 'Amount',
    categoria: 'Category',
    semConexao: 'No bank connected yet',
    semTransacoes: 'No transactions imported yet',
    conecteSeu: 'Connect your bank account to import transactions automatically',
    carregando: 'Loading...',
    sucesso: 'Bank connected successfully!',
    erro: 'Error connecting bank',
    bancos: 'Supported Banks',
  },
  es: {
    titulo: 'Open Finance',
    sub: 'Conecta tu cuenta bancaria e importa extractos automáticamente',
    conectar: 'Conectar Banco',
    conectado: 'Banco Conectado',
    transacoes: 'Transacciones Importadas',
    importar: 'Importar Transacciones',
    status: 'Estado de Conexión',
    ativo: 'Activo',
    inativo: 'Inactivo',
    banco: 'Banco',
    tipo: 'Tipo',
    entrada: 'Entrada',
    saida: 'Salida',
    data: 'Fecha',
    descricao: 'Descripción',
    valor: 'Valor',
    categoria: 'Categoría',
    semConexao: 'Ningún banco conectado aún',
    semTransacoes: 'Ninguna transacción importada aún',
    conecteSeu: 'Conecta tu cuenta bancaria para importar transacciones automáticamente',
    carregando: 'Cargando...',
    sucesso: '¡Banco conectado con éxito!',
    erro: 'Error al conectar banco',
    bancos: 'Bancos Soportados',
  }
}

const BANCOS_SUPORTADOS = [
  { nome: 'Nubank', cor: '#820AD1', emoji: '💜' },
  { nome: 'Itaú', cor: '#FF6B00', emoji: '🟠' },
  { nome: 'Bradesco', cor: '#CC0000', emoji: '🔴' },
  { nome: 'Santander', cor: '#EC0000', emoji: '🔴' },
  { nome: 'Banco do Brasil', cor: '#FFCC00', emoji: '🟡' },
  { nome: 'Caixa', cor: '#0070AF', emoji: '🔵' },
  { nome: 'Inter', cor: '#FF7A00', emoji: '🟠' },
  { nome: 'C6 Bank', cor: '#242424', emoji: '⚫' },
  { nome: 'Sicoob', cor: '#009A44', emoji: '🟢' },
  { nome: 'Sicredi', cor: '#009A44', emoji: '🟢' },
  { nome: 'XP', cor: '#000000', emoji: '⚫' },
  { nome: 'BTG', cor: '#1B3A6B', emoji: '🔵' },
  { nome: 'Banrisul', cor: '#003DA5', emoji: '🔵' },
  { nome: 'Safra', cor: '#1A1A1A', emoji: '⚫' },
]

export default function OpenFinancePage() {
  const { idioma } = useLanguage()
  const t = textos[idioma] || textos.pt

  const [conexoes, setConexoes] = useState<any[]>([])
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [conectando, setConectando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [tipoMsg, setTipoMsg] = useState<'sucesso' | 'erro' | ''>('')

  useEffect(() => {
    carregarDados()
    // Carrega script do Pluggy Widget
    const script = document.createElement('script')
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2/pluggy-connect.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  async function carregarDados() {
    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: conex } = await supabase
      .from('open_finance')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: tx } = await supabase
      .from('of_transacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })
      .limit(50)

    setConexoes(conex || [])
    setTransacoes(tx || [])
    setCarregando(false)
  }

  async function abrirWidget() {
    setConectando(true)
    try {
      // Busca connect token
      const res = await fetch('/api/pluggy/connect-token', { method: 'POST' })
      const { accessToken, error } = await res.json()
      if (error) throw new Error(error)

      // Salva item_id no Supabase quando conectar
      const { data: { user } } = await supabase.auth.getUser()

      // @ts-ignore — Pluggy Widget global
      const pluggyConnect = new PluggyConnect({
        connectToken: accessToken,
        onSuccess: async (itemData: any) => {
          if (user) {
            await supabase.from('open_finance').upsert({
              user_id: user.id,
              item_id: itemData.item.id,
              conector_nome: itemData.item.connector?.name || '',
              conector_tipo: itemData.item.connector?.type || '',
              status: 'UPDATED',
            }, { onConflict: 'item_id' })
          }
          setTipoMsg('sucesso')
          setMensagem(t.sucesso)
          setTimeout(() => setMensagem(''), 4000)
          carregarDados()
        },
        onError: (error: any) => {
          console.error('Pluggy error:', error)
          setTipoMsg('erro')
          setMensagem(t.erro)
          setTimeout(() => setMensagem(''), 4000)
        },
        onClose: () => {
          setConectando(false)
        },
      })
      pluggyConnect.init()
    } catch (err: any) {
      setTipoMsg('erro')
      setMensagem(err.message || t.erro)
      setTimeout(() => setMensagem(''), 4000)
      setConectando(false)
    }
  }

  const totalEntradas = transacoes.filter(t => t.tipo === 'entrada').reduce((s, t) => s + (t.valor || 0), 0)
  const totalSaidas = transacoes.filter(t => t.tipo === 'saida').reduce((s, t) => s + (t.valor || 0), 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <ModuloLayout titulo={t.titulo} subtitulo={t.sub}>
      <div className="space-y-6">

        {/* Mensagem */}
        {mensagem && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.15)', border: `1px solid ${tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.4)' : 'rgba(220,38,38,0.4)'}` }}>
            {tipoMsg === 'sucesso' ? <CheckCircle size={18} color="#34d399" /> : <AlertCircle size={18} color="#f87171" />}
            <p className="text-sm font-semibold" style={{ color: tipoMsg === 'sucesso' ? '#34d399' : '#f87171' }}>{mensagem}</p>
          </motion.div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: t.status, value: conexoes.length > 0 ? t.ativo : t.inativo, icon: Zap, cor: conexoes.length > 0 ? '#34d399' : '#f87171' },
            { label: t.entrada, value: fmt(totalEntradas), icon: TrendingUp, cor: '#34d399' },
            { label: t.saida, value: fmt(totalSaidas), icon: TrendingDown, cor: '#f87171' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-5" style={{ background: 'rgba(10,22,40,0.8)', border: `1px solid ${kpi.cor}25` }}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#3a5a8a' }}>{kpi.label}</p>
                <kpi.icon size={16} style={{ color: kpi.cor }} />
              </div>
              <p className="text-xl font-black" style={{ color: kpi.cor }}>{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Botão conectar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6" style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(106,176,255,0.2)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(106,176,255,0.1)' }}>
                <Building2 size={28} style={{ color: '#6ab0ff' }} />
              </div>
              <div>
                <h3 className="font-black text-lg" style={{ color: '#c8d8f0' }}>
                  {conexoes.length > 0 ? t.conectado : t.semConexao}
                </h3>
                <p className="text-sm" style={{ color: '#3a6090' }}>{t.conecteSeu}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={abrirWidget}
              disabled={conectando}
              className="px-6 py-3 rounded-xl font-black text-sm tracking-widest uppercase flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', opacity: conectando ? 0.7 : 1 }}>
              {conectando ? <RefreshCw size={16} className="animate-spin" /> : <Building2 size={16} />}
              {conectando ? t.carregando : t.conectar}
            </motion.button>
          </div>
        </motion.div>

        {/* Bancos suportados */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5" style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(106,176,255,0.1)' }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#3a5a8a' }}>{t.bancos}</p>
          <div className="flex flex-wrap gap-2">
            {BANCOS_SUPORTADOS.map((banco, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: `${banco.cor}20`, color: banco.cor, border: `1px solid ${banco.cor}40` }}>
                {banco.emoji} {banco.nome}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Conexões ativas */}
        {conexoes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5" style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#34d399' }}>
              {t.conectado} ({conexoes.length})
            </p>
            <div className="space-y-3">
              {conexoes.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                  <div className="flex items-center gap-3">
                    <Building2 size={20} style={{ color: '#34d399' }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#c8d8f0' }}>{c.conector_nome || 'Banco'}</p>
                      <p className="text-xs" style={{ color: '#3a6090' }}>{c.conector_tipo}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transações */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5" style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(106,176,255,0.1)' }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#6ab0ff' }}>
            {t.transacoes} ({transacoes.length})
          </p>

          {transacoes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🏦</p>
              <p className="text-sm font-semibold" style={{ color: '#3a5a8a' }}>{t.semTransacoes}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(59,111,212,0.15)' }}>
                    {[t.data, t.descricao, t.categoria, t.tipo, t.valor].map((h, i) => (
                      <th key={i} className="pb-3 font-bold tracking-wider uppercase text-left px-2"
                        style={{ color: '#3a5a8a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transacoes.map((tx, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(59,111,212,0.08)' }}>
                      <td className="py-3 px-2" style={{ color: '#8aaad4' }}>
                        {tx.data ? new Date(tx.data).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-2 max-w-[200px] truncate" style={{ color: '#c8d8f0' }}>
                        {tx.descricao || '-'}
                      </td>
                      <td className="py-3 px-2" style={{ color: '#8aaad4' }}>{tx.categoria || '-'}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: tx.tipo === 'entrada' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                            color: tx.tipo === 'entrada' ? '#34d399' : '#f87171',
                            border: `1px solid ${tx.tipo === 'entrada' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                          }}>
                          {tx.tipo === 'entrada' ? t.entrada : t.saida}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-black"
                        style={{ color: tx.tipo === 'entrada' ? '#34d399' : '#f87171' }}>
                        {tx.tipo === 'saida' ? '- ' : '+ '}{fmt(tx.valor || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </div>
    </ModuloLayout>
  )
}