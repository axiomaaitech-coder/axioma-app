'use client'
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useLanguage } from '../../../lib/LanguageContext'
import ModuloLayout from '../../../components/ModuloLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, RefreshCw, CheckCircle, AlertCircle, Zap, TrendingUp, TrendingDown } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ⚠️ TESTE: deixe true para testar com o "banco sandbox" do Pluggy (sem banco real).
// Antes de ir para produção (clientes pagantes), troque para false.
const INCLUIR_SANDBOX = true

const textos = {
  pt: {
    titulo: 'Open Finance', sub: 'Conecte sua conta bancária e importe extratos automaticamente',
    conectar: 'Conectar Banco', conectado: 'Banco Conectado', transacoes: 'Transações Importadas',
    status: 'Status da Conexão', ativo: 'Ativo', inativo: 'Inativo',
    entrada: 'Entrada', saida: 'Saída', data: 'Data', descricao: 'Descrição', valor: 'Valor', categoria: 'Categoria',
    semConexao: 'Nenhum banco conectado ainda', semTransacoes: 'Nenhuma transação importada ainda',
    conecteSeu: 'Conecte sua conta bancária para importar transações automaticamente',
    carregando: 'Carregando...', sucesso: 'Banco conectado com sucesso!', erro: 'Erro ao conectar banco',
    bancos: 'Bancos Suportados', sincronizar: 'Sincronizar', sincronizando: 'Sincronizando...',
    importadas: 'transações importadas', tipo: 'Tipo',
  },
  en: {
    titulo: 'Open Finance', sub: 'Connect your bank account and import statements automatically',
    conectar: 'Connect Bank', conectado: 'Bank Connected', transacoes: 'Imported Transactions',
    status: 'Connection Status', ativo: 'Active', inativo: 'Inactive',
    entrada: 'Income', saida: 'Expense', data: 'Date', descricao: 'Description', valor: 'Amount', categoria: 'Category',
    semConexao: 'No bank connected yet', semTransacoes: 'No transactions imported yet',
    conecteSeu: 'Connect your bank account to import transactions automatically',
    carregando: 'Loading...', sucesso: 'Bank connected successfully!', erro: 'Error connecting bank',
    bancos: 'Supported Banks', sincronizar: 'Sync', sincronizando: 'Syncing...',
    importadas: 'transactions imported', tipo: 'Type',
  },
  es: {
    titulo: 'Open Finance', sub: 'Conecta tu cuenta bancaria e importa extractos automáticamente',
    conectar: 'Conectar Banco', conectado: 'Banco Conectado', transacoes: 'Transacciones Importadas',
    status: 'Estado de Conexión', ativo: 'Activo', inativo: 'Inactivo',
    entrada: 'Entrada', saida: 'Salida', data: 'Fecha', descricao: 'Descripción', valor: 'Valor', categoria: 'Categoría',
    semConexao: 'Ningún banco conectado aún', semTransacoes: 'Ninguna transacción importada aún',
    conecteSeu: 'Conecta tu cuenta bancaria para importar transacciones automáticamente',
    carregando: 'Cargando...', sucesso: '¡Banco conectado con éxito!', erro: 'Error al conectar banco',
    bancos: 'Bancos Soportados', sincronizar: 'Sincronizar', sincronizando: 'Sincronizando...',
    importadas: 'transacciones importadas', tipo: 'Tipo',
  }
}

const BANCOS_SUPORTADOS = [
  { nome: 'Nubank', cor: '#a855f7', emoji: '💜' },
  { nome: 'Itaú', cor: '#FF8C00', emoji: '🟠' },
  { nome: 'Bradesco', cor: '#f87171', emoji: '🔴' },
  { nome: 'Santander', cor: '#f87171', emoji: '🔴' },
  { nome: 'Banco do Brasil', cor: '#fbbf24', emoji: '🟡' },
  { nome: 'Caixa', cor: '#38bdf8', emoji: '🔵' },
  { nome: 'Inter', cor: '#FF8C00', emoji: '🟠' },
  { nome: 'C6 Bank', cor: '#94a3b8', emoji: '⚪' },
  { nome: 'Sicoob', cor: '#34d399', emoji: '🟢' },
  { nome: 'Sicredi', cor: '#34d399', emoji: '🟢' },
  { nome: 'XP', cor: '#cbd5e1', emoji: '⚪' },
  { nome: 'BTG', cor: '#60a5fa', emoji: '🔵' },
  { nome: 'Banrisul', cor: '#60a5fa', emoji: '🔵' },
  { nome: 'Safra', cor: '#cbd5e1', emoji: '⚪' },
]

// ============================================================
// CARREGADOR ROBUSTO DO SDK PLUGGY
// Garante que o widget esteja pronto ANTES de abrir (corrige o "não conecta")
// ============================================================
function carregarPluggySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Sem janela'))
    if (typeof (window as any).PluggyConnect !== 'undefined') return resolve()

    const existente = document.querySelector('script[data-pluggy="1"]') as HTMLScriptElement | null
    if (existente) {
      existente.addEventListener('load', () => resolve())
      existente.addEventListener('error', () => reject(new Error('Falha ao carregar o Pluggy')))
      // Caso já tenha carregado mas o listener não pegue:
      if (typeof (window as any).PluggyConnect !== 'undefined') resolve()
      return
    }

    const s = document.createElement('script')
    s.src = 'https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js'
    s.async = true
    s.setAttribute('data-pluggy', '1')
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Falha ao carregar o Pluggy'))
    document.body.appendChild(s)
  })
}

// ============================================================
// CANVAS NEURAL — igual ao padrão dos outros módulos
// ============================================================
function CanvasNeural() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ['#6ab0ff', '#34d399', '#a78bfa', '#f472b6', '#fbbf24'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }))
    const chars = 'AXIOMA OPEN FINANCE BANCO R$ PIX SICOOB NUBANK ITAU 0 1 2 3 % EXTRATO'.split(' ').map(c => ({
      char: c, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ['#6ab0ff', '#34d399', '#fbbf24', '#a78bfa'][Math.floor(Math.random() * 4)],
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      chars.forEach(f => {
        ctx.save(); ctx.font = `900 ${f.size}px Arial`
        ctx.fillStyle = f.color; ctx.globalAlpha = f.opacity
        ctx.fillText(f.char, (f.x / 100) * canvas.width, (f.y / 100) * canvas.height)
        ctx.restore(); f.y -= f.speed; if (f.y < -5) f.y = 105
      })
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 110) * 0.12
            ctx.strokeStyle = p.color; ctx.lineWidth = 0.5
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore()
          }
        })
        ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color
        ctx.shadowColor = p.color; ctx.shadowBlur = 6
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} />
}

// ============================================================
// CANVAS BOX — igual ao padrão dos outros módulos
// ============================================================
function CanvasBox({ children, cor = '#6ab0ff', corB = '#34d399', corC = '#a78bfa', corD = '#f472b6' }: {
  children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: 'rgba(4,10,22,0.97)', border: `1px solid ${cor}30`, boxShadow: `0 0 60px ${cor}10`,
    }}>
      <CanvasNeural />
      {[
        { pos: 'top-0 left-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(90deg, ${cor}, transparent)`, glow: cor },
        { pos: 'top-0 left-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(180deg, ${cor}, transparent)`, glow: cor },
        { pos: 'top-0 right-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(270deg, ${corB}, transparent)`, glow: corB },
        { pos: 'top-0 right-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(180deg, ${corB}, transparent)`, glow: corB },
        { pos: 'bottom-0 left-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(90deg, ${corC}, transparent)`, glow: corC },
        { pos: 'bottom-0 left-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(0deg, ${corC}, transparent)`, glow: corC },
        { pos: 'bottom-0 right-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(270deg, ${corD}, transparent)`, glow: corD },
        { pos: 'bottom-0 right-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(0deg, ${corD}, transparent)`, glow: corD },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 14px ${b.glow}`, borderRadius: '999px' }} />
      ))}
      <motion.div animate={{ left: ['-5%', '105%', '-5%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, #fff, ${cor}, transparent)`, boxShadow: `0 0 20px #fff, 0 0 40px ${cor}`, borderRadius: '999px' }} />
      <motion.div animate={{ right: ['-5%', '105%', '-5%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        className="absolute bottom-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${corB}, #fff, transparent)`, boxShadow: `0 0 20px ${corB}`, borderRadius: '999px', position: 'absolute' }} />
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </div>
  )
}

export default function OpenFinancePage() {
  const { idioma } = useLanguage()
  const t = textos[idioma as keyof typeof textos] || textos.pt

  const [conexoes, setConexoes] = useState<any[]>([])
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [conectando, setConectando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [tipoMsg, setTipoMsg] = useState<'sucesso' | 'erro' | ''>('')

  useEffect(() => {
    carregarDados()
    // Pré-carrega o SDK do Pluggy assim que a tela abre (não trava se falhar)
    carregarPluggySDK().catch(() => {})
  }, [])

  function avisar(tipo: 'sucesso' | 'erro', msg: string, ms = 5000) {
    setTipoMsg(tipo); setMensagem(msg)
    setTimeout(() => setMensagem(''), ms)
  }

  async function carregarDados() {
    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCarregando(false); return }
    const { data: conex } = await supabase.from('open_finance').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    const { data: tx } = await supabase.from('of_transacoes').select('*').eq('user_id', user.id).order('data', { ascending: false }).limit(50)
    setConexoes(conex || [])
    setTransacoes(tx || [])
    setCarregando(false)
  }

  // Puxa contas + transações do item recém-conectado (não depende do webhook)
  async function sincronizar(itemId?: string) {
    setSincronizando(true)
    try {
      const res = await fetch('/api/pluggy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemId ? { itemId } : {}),
      })
      const dados = await res.json()
      if (!res.ok || dados.error) throw new Error(dados.error || 'Erro ao sincronizar')
      await carregarDados()
      avisar('sucesso', `${dados.total ?? 0} ${t.importadas}`)
    } catch (err: any) {
      avisar('erro', err.message || t.erro)
    } finally {
      setSincronizando(false)
    }
  }

  async function abrirWidget() {
    setConectando(true)
    try {
      // 1) Garante que o SDK do Pluggy está carregado
      await carregarPluggySDK()

      // 2) Pega o connect token do backend
      const res = await fetch('/api/pluggy/connect-token', { method: 'POST' })
      const { accessToken, error } = await res.json()
      if (error) throw new Error(error)
      if (!accessToken) throw new Error('Token não recebido')

      const { data: { user } } = await supabase.auth.getUser()
      const PluggyConnect = (window as any).PluggyConnect
      if (!PluggyConnect) throw new Error('Widget Pluggy não carregou')

      // 3) Abre o widget
      const pluggyConnect = new PluggyConnect({
        connectToken: accessToken,
        includeSandbox: INCLUIR_SANDBOX,
        onSuccess: async (itemData: any) => {
          const itemId = itemData?.item?.id
          if (user && itemId) {
            await supabase.from('open_finance').upsert({
              user_id: user.id, item_id: itemId,
              conector_nome: itemData.item.connector?.name || '',
              conector_tipo: itemData.item.connector?.type || '',
              status: itemData.item.status || 'UPDATED',
            }, { onConflict: 'item_id' })
          }
          avisar('sucesso', t.sucesso)
          await carregarDados()
          // Puxa as transações desse banco logo em seguida
          if (itemId) sincronizar(itemId)
        },
        onError: (err: any) => {
          avisar('erro', (err && (err.message || err.code)) ? `${t.erro}: ${err.message || err.code}` : t.erro)
        },
        onClose: () => setConectando(false),
      })
      pluggyConnect.init()
    } catch (err: any) {
      avisar('erro', err.message || t.erro)
      setConectando(false)
    }
  }

  const totalEntradas = transacoes.filter(tx => tx.tipo === 'entrada').reduce((s, tx) => s + (tx.valor || 0), 0)
  const totalSaidas = transacoes.filter(tx => tx.tipo === 'saida').reduce((s, tx) => s + (tx.valor || 0), 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <ModuloLayout titulo={t.titulo} subtitulo={t.sub}>
      <div className="space-y-4">

        {/* Mensagem */}
        <AnimatePresence>
          {mensagem && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.15)', border: `1px solid ${tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.4)' : 'rgba(220,38,38,0.4)'}` }}>
              {tipoMsg === 'sucesso' ? <CheckCircle size={18} color="#34d399" /> : <AlertCircle size={18} color="#f87171" />}
              <p className="text-sm font-semibold" style={{ color: tipoMsg === 'sucesso' ? '#34d399' : '#f87171' }}>{mensagem}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { label: t.status, value: conexoes.length > 0 ? t.ativo : t.inativo, cor: conexoes.length > 0 ? '#34d399' : '#f87171' },
            { label: t.entrada, value: fmt(totalEntradas), cor: '#34d399' },
            { label: t.saida, value: fmt(totalSaidas), cor: '#f87171' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={kpi.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{kpi.label}</p>
                <p className="text-base md:text-2xl font-black" style={{ color: kpi.cor, textShadow: `0 0 20px ${kpi.cor}60` }}>{kpi.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Botão conectar */}
        <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#f472b6">
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
            <div className="flex items-center gap-2">
              {conexoes.length > 0 && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => sincronizar()} disabled={sincronizando}
                  className="px-4 py-3 rounded-xl font-black text-sm tracking-widest uppercase flex items-center gap-2"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', opacity: sincronizando ? 0.7 : 1 }}>
                  <RefreshCw size={16} className={sincronizando ? 'animate-spin' : ''} />
                  {sincronizando ? t.sincronizando : t.sincronizar}
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={abrirWidget} disabled={conectando}
                className="px-6 py-3 rounded-xl font-black text-sm tracking-widest uppercase flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', opacity: conectando ? 0.7 : 1 }}>
                {conectando ? <RefreshCw size={16} className="animate-spin" /> : <Building2 size={16} />}
                {conectando ? t.carregando : t.conectar}
              </motion.button>
            </div>
          </div>
        </CanvasBox>

        {/* Bancos suportados */}
        <CanvasBox cor="#a78bfa" corB="#6ab0ff" corC="#34d399" corD="#fbbf24">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#3a5a8a' }}>{t.bancos}</p>
          <div className="flex flex-wrap gap-2">
            {BANCOS_SUPORTADOS.map((banco, i) => (
              <motion.span key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: `${banco.cor}20`, color: banco.cor, border: `1px solid ${banco.cor}40` }}>
                {banco.emoji} {banco.nome}
              </motion.span>
            ))}
          </div>
        </CanvasBox>

        {/* Conexões ativas */}
        {conexoes.length > 0 && (
          <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#34d399' }}>
              {t.conectado} ({conexoes.length})
            </p>
            <div className="space-y-3">
              {conexoes.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl"
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
                </motion.div>
              ))}
            </div>
          </CanvasBox>
        )}

        {/* Transações */}
        <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#f472b6">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#6ab0ff' }}>
            {t.transacoes} ({transacoes.length})
          </p>
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transacoes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🏦</p>
              <p className="text-sm font-semibold" style={{ color: '#3a5a8a' }}>{t.semTransacoes}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(59,111,212,0.15)' }}>
                    {[t.data, t.descricao, t.categoria, t.tipo, t.valor].map((h, i) => (
                      <th key={i} className="text-left px-4 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: '#3a5a8a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transacoes.map((tx, i) => (
                    <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      whileHover={{ backgroundColor: 'rgba(106,176,255,0.03)' }}
                      style={{ borderBottom: i < transacoes.length - 1 ? '1px solid rgba(59,111,212,0.08)' : 'none' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: '#8aaad4' }}>
                        {tx.data ? new Date(tx.data).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: '#c8d8f0' }}>{tx.descricao || '-'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#8aaad4' }}>{tx.categoria || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: tx.tipo === 'entrada' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                            color: tx.tipo === 'entrada' ? '#34d399' : '#f87171',
                            border: `1px solid ${tx.tipo === 'entrada' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                          }}>
                          {tx.tipo === 'entrada' ? t.entrada : t.saida}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-black" style={{ color: tx.tipo === 'entrada' ? '#34d399' : '#f87171' }}>
                        {tx.tipo === 'saida' ? '- ' : '+ '}{fmt(tx.valor || 0)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}