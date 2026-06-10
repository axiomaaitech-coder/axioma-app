'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { Check, X, Zap, Crown, Building2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function CanvasEpico() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2.5 + 0.5,
      color: ['#6ab0ff', '#34d399', '#a78bfa', '#f59e0b', '#f472b6', '#fbbf24'][Math.floor(Math.random() * 6)],
      opacity: Math.random() * 0.7 + 0.2,
    }))
    const chars = 'AXIOMA AI TECH R$ 29 97 197 % STARTER PRO BUSINESS 0 1 2 3 4 5 6 7 8 9'.split(' ').map(char => ({
      char, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 32 + 16, opacity: Math.random() * 0.05 + 0.015,
      speed: Math.random() * 0.2 + 0.06,
      color: ['#6ab0ff', '#34d399', '#f59e0b', '#a78bfa', '#f472b6'][Math.floor(Math.random() * 5)],
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
          if (dist < 130) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 130) * 0.1
            ctx.strokeStyle = p.color; ctx.lineWidth = 0.5
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore()
          }
        })
        ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color
        ctx.shadowColor = p.color; ctx.shadowBlur = 8
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
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.9 }} />
}

export default function Planos() {
  const router = useRouter()
  const { idioma } = useLanguage()
  const [anual, setAnual] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [loadingPlano, setLoadingPlano] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const txt = {
    pt: {
      titulo: 'Escolha seu Plano', sub: 'Comece agora e escale conforme seu negócio cresce',
      mensal: 'Mensal', anual: 'Anual', gratis: '🎉 2 meses grátis',
      usuarios: 'usuário(s)', ate: 'até', assinar: 'Assinar agora',
      popular: '⭐ Mais Popular', recomendado: '👑 Mais Completo',
      cancelar: 'Cancele quando quiser. Sem fidelidade.',
      economia: 'Economia de', processando: 'Processando...',
      erroLogin: 'Faça login para assinar um plano.',
      erroGeral: 'Erro ao processar pagamento. Tente novamente.',
    },
    en: {
      titulo: 'Choose Your Plan', sub: 'Start now and scale as your business grows',
      mensal: 'Monthly', anual: 'Annual', gratis: '🎉 2 months free',
      usuarios: 'user(s)', ate: 'up to', assinar: 'Subscribe now',
      popular: '⭐ Most Popular', recomendado: '👑 Most Complete',
      cancelar: 'Cancel anytime. No commitment.',
      economia: 'Save', processando: 'Processing...',
      erroLogin: 'Please login to subscribe.',
      erroGeral: 'Payment error. Please try again.',
    },
    es: {
      titulo: 'Elige tu Plan', sub: 'Empieza ahora y escala según crece tu negocio',
      mensal: 'Mensual', anual: 'Anual', gratis: '🎉 2 meses gratis',
      usuarios: 'usuario(s)', ate: 'hasta', assinar: 'Suscribirse',
      popular: '⭐ Más Popular', recomendado: '👑 Más Completo',
      cancelar: 'Cancela cuando quieras. Sin fidelidad.',
      economia: 'Ahorro de', processando: 'Procesando...',
      erroLogin: 'Inicia sesión para suscribirte.',
      erroGeral: 'Error de pago. Inténtalo de nuevo.',
    },
  }[idioma]

  const rec = {
    pt: {
      receitas: 'Receitas', custoFixo: 'Custos Fixos', custoVar: 'Custos Variáveis',
      fornecedores: 'Fornecedores', endividamento: 'Endividamento', fluxo: 'Fluxo de Caixa',
      dre: 'DRE', clientes: 'Clientes', centros: 'Centros de Custo',
      importar: 'Importar Documentos', empresa: 'Empresa', relatorios: 'Relatórios',
      iaFin: 'IA Financeira', iaTrib: 'IA Tributária', mei: 'Módulo MEI Completo',
    },
    en: {
      receitas: 'Revenue', custoFixo: 'Fixed Costs', custoVar: 'Variable Costs',
      fornecedores: 'Suppliers', endividamento: 'Debt Control', fluxo: 'Cash Flow',
      dre: 'Income Statement', clientes: 'Clients', centros: 'Cost Centers',
      importar: 'Import Documents', empresa: 'Company', relatorios: 'Reports',
      iaFin: 'Financial AI', iaTrib: 'Tax AI', mei: 'Complete MEI Module',
    },
    es: {
      receitas: 'Ingresos', custoFixo: 'Costos Fijos', custoVar: 'Costos Variables',
      fornecedores: 'Proveedores', endividamento: 'Endeudamiento', fluxo: 'Flujo de Caja',
      dre: 'Estado de Resultados', clientes: 'Clientes', centros: 'Centros de Costo',
      importar: 'Importar Documentos', empresa: 'Empresa', relatorios: 'Informes',
      iaFin: 'IA Financiera', iaTrib: 'IA Tributaria', mei: 'Módulo MEI Completo',
    },
  }[idioma]

  const planos = [
    {
      id: 'starter', nome: 'Starter', Icon: Zap,
      mensal: 29, anual: 290, usuarios: 1,
      cor: '#6ab0ff', corGrad: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)',
      destaque: false, badge: null,
      desc: idioma === 'pt' ? 'Perfeito para MEI começar' : idioma === 'en' ? 'Perfect for MEI to start' : 'Perfecto para MEI empezar',
      recursos: [
        { label: rec.mei, ok: true }, { label: rec.receitas, ok: true },
        { label: rec.custoFixo, ok: true }, { label: rec.custoVar, ok: true },
        { label: rec.fornecedores, ok: true }, { label: rec.endividamento, ok: true },
        { label: rec.fluxo, ok: true }, { label: rec.dre, ok: true },
        { label: rec.clientes, ok: true }, { label: rec.centros, ok: true },
        { label: rec.importar, ok: true }, { label: rec.empresa, ok: true },
        { label: rec.relatorios, ok: true }, { label: rec.iaFin, ok: false },
        { label: rec.iaTrib, ok: false },
      ]
    },
    {
      id: 'pro', nome: 'Pró', Icon: Crown,
      mensal: 97, anual: 970, usuarios: 4,
      cor: '#f59e0b', corGrad: 'linear-gradient(135deg, #92400e, #f59e0b)',
      destaque: true, badge: txt.popular,
      desc: idioma === 'pt' ? 'Para empresas em crescimento' : idioma === 'en' ? 'For growing businesses' : 'Para empresas en crecimiento',
      recursos: [
        { label: rec.mei, ok: true }, { label: rec.receitas, ok: true },
        { label: rec.custoFixo, ok: true }, { label: rec.custoVar, ok: true },
        { label: rec.fornecedores, ok: true }, { label: rec.endividamento, ok: true },
        { label: rec.fluxo, ok: true }, { label: rec.dre, ok: true },
        { label: rec.clientes, ok: true }, { label: rec.centros, ok: true },
        { label: rec.importar, ok: true }, { label: rec.empresa, ok: true },
        { label: rec.relatorios, ok: true }, { label: rec.iaFin, ok: true },
        { label: rec.iaTrib, ok: false },
      ]
    },
    {
      id: 'business', nome: 'Business', Icon: Building2,
      mensal: 197, anual: 1970, usuarios: 10,
      cor: '#34d399', corGrad: 'linear-gradient(135deg, #064e3b, #059669)',
      destaque: false, badge: txt.recomendado,
      desc: idioma === 'pt' ? 'Tudo incluso, sem limites' : idioma === 'en' ? 'Everything included, no limits' : 'Todo incluido, sin límites',
      recursos: [
        { label: rec.mei, ok: true }, { label: rec.receitas, ok: true },
        { label: rec.custoFixo, ok: true }, { label: rec.custoVar, ok: true },
        { label: rec.fornecedores, ok: true }, { label: rec.endividamento, ok: true },
        { label: rec.fluxo, ok: true }, { label: rec.dre, ok: true },
        { label: rec.clientes, ok: true }, { label: rec.centros, ok: true },
        { label: rec.importar, ok: true }, { label: rec.empresa, ok: true },
        { label: rec.relatorios, ok: true }, { label: rec.iaFin, ok: true },
        { label: rec.iaTrib, ok: true },
      ]
    },
  ]

  // ✅ Função de checkout com Stripe
  async function assinar(planoId: string) {
    setLoadingPlano(planoId)
    setErro(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErro(txt.erroLogin)
        setLoadingPlano(null)
        return
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoId,
          email: user.email,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setErro(txt.erroGeral)
      }
    } catch {
      setErro(txt.erroGeral)
    }
    setLoadingPlano(null)
  }

  return (
    <div className="relative min-h-screen overflow-auto" style={{ background: "#020810" }}>
      <CanvasEpico />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 20%, rgba(106,176,255,0.08) 0%, transparent 60%)',
      }} />

      <div className="relative z-10 px-4 py-12 md:py-16">

        {/* Header */}
        <div className="flex flex-col items-center mb-12 md:mb-16">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-2 mb-6 opacity-60"
            style={{ borderColor: '#6ab0ff', borderTopColor: '#34d399', borderRightColor: '#f59e0b' }} />

          <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-black tracking-[0.4em] uppercase mb-3"
            style={{ color: '#6ab0ff', textShadow: '0 0 30px #6ab0ff' }}>
            AXIOMA AI.TECH
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-black text-center mb-4"
            style={{ color: '#c8d8f0', textShadow: '0 0 40px rgba(106,176,255,0.3)', lineHeight: 1.1 }}>
            {txt.titulo}
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-sm md:text-base text-center mb-8 max-w-md" style={{ color: '#3a6090' }}>
            {txt.sub}
          </motion.p>

          {/* Toggle */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-4 p-2 rounded-2xl"
            style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(59,111,212,0.2)' }}>
            <span className="text-sm font-semibold px-3" style={{ color: anual ? '#3a6090' : '#c8d8f0' }}>{txt.mensal}</span>
            <motion.div className="w-14 h-7 rounded-full cursor-pointer relative"
              style={{ background: anual ? 'rgba(52,211,153,0.3)' : 'rgba(59,111,212,0.2)', border: `1px solid ${anual ? 'rgba(52,211,153,0.5)' : 'rgba(59,111,212,0.3)'}`, boxShadow: anual ? '0 0 15px rgba(52,211,153,0.3)' : 'none' }}
              onClick={() => setAnual(!anual)}>
              <motion.div animate={{ left: anual ? '26px' : '2px' }} transition={{ duration: 0.25 }}
                className="absolute top-1 w-5 h-5 rounded-full"
                style={{ background: anual ? '#34d399' : '#6ab0ff', boxShadow: `0 0 10px ${anual ? '#34d399' : '#6ab0ff'}` }} />
            </motion.div>
            <span className="text-sm font-semibold px-3" style={{ color: anual ? '#c8d8f0' : '#3a6090' }}>{txt.anual}</span>
            <AnimatePresence>
              {anual && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs px-3 py-1 rounded-full font-bold"
                  style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                  {txt.gratis}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Erro */}
          <AnimatePresence>
            {erro && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                {erro}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {planos.map((plano, idx) => {
            const isHover = hover === plano.id
            const preco = anual ? Math.round(plano.anual / 12) : plano.mensal
            const economia = anual ? plano.mensal * 2 : 0
            const carregando = loadingPlano === plano.id
            return (
              <motion.div key={plano.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                onHoverStart={() => setHover(plano.id)} onHoverEnd={() => setHover(null)}
                className="relative rounded-3xl overflow-hidden flex flex-col"
                style={{
                  background: 'rgba(4,10,22,0.97)',
                  border: `1px solid ${plano.cor}${plano.destaque ? '60' : '30'}`,
                  boxShadow: isHover || plano.destaque ? `0 0 80px ${plano.cor}25, 0 0 40px ${plano.cor}10` : 'none',
                  transform: plano.destaque ? 'scale(1.03)' : 'scale(1)',
                }}>
                <CanvasEpico />

                {[
                  { pos: 'top-0 left-0', w: 'w-24 h-[2.5px]', bg: `linear-gradient(90deg, ${plano.cor}, transparent)` },
                  { pos: 'top-0 left-0', w: 'w-[2.5px] h-24', bg: `linear-gradient(180deg, ${plano.cor}, transparent)` },
                  { pos: 'top-0 right-0', w: 'w-24 h-[2.5px]', bg: `linear-gradient(270deg, ${plano.cor}, transparent)` },
                  { pos: 'top-0 right-0', w: 'w-[2.5px] h-24', bg: `linear-gradient(180deg, ${plano.cor}, transparent)` },
                  { pos: 'bottom-0 left-0', w: 'w-24 h-[2.5px]', bg: `linear-gradient(90deg, ${plano.cor}, transparent)` },
                  { pos: 'bottom-0 left-0', w: 'w-[2.5px] h-24', bg: `linear-gradient(0deg, ${plano.cor}, transparent)` },
                  { pos: 'bottom-0 right-0', w: 'w-24 h-[2.5px]', bg: `linear-gradient(270deg, ${plano.cor}, transparent)` },
                  { pos: 'bottom-0 right-0', w: 'w-[2.5px] h-24', bg: `linear-gradient(0deg, ${plano.cor}, transparent)` },
                ].map((b, i) => (
                  <div key={i} className={`absolute ${b.pos} ${b.w} z-10`}
                    style={{ background: b.bg, boxShadow: `0 0 16px ${plano.cor}`, borderRadius: '999px' }} />
                ))}

                <motion.div animate={{ left: ['-5%', '105%', '-5%'] }}
                  transition={{ duration: 4 + idx, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.8 }}
                  className="absolute top-0 h-[2.5px] w-24 z-20 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, #fff, ${plano.cor}, transparent)`, boxShadow: `0 0 20px #fff, 0 0 40px ${plano.cor}`, borderRadius: '999px' }} />

                {plano.badge && (
                  <div className="relative z-10 flex justify-center pt-4">
                    <motion.span animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs font-black px-4 py-1.5 rounded-full"
                      style={{ background: `${plano.cor}20`, color: plano.cor, border: `1px solid ${plano.cor}50`, boxShadow: `0 0 15px ${plano.cor}30` }}>
                      {plano.badge}
                    </motion.span>
                  </div>
                )}

                <div className="relative z-10 p-6 md:p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: idx * 0.5 }}
                      className="p-2 rounded-xl" style={{ background: `${plano.cor}15` }}>
                      <plano.Icon size={22} style={{ color: plano.cor }} />
                    </motion.div>
                    <h2 className="text-2xl font-black" style={{ color: plano.cor, textShadow: `0 0 20px ${plano.cor}60` }}>{plano.nome}</h2>
                  </div>

                  <p className="text-xs mb-6" style={{ color: '#3a6090' }}>{plano.desc}</p>

                  <div className="mb-6">
                    <div className="flex items-end gap-2">
                      <motion.span key={preco} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl md:text-6xl font-black"
                        style={{ color: '#c8d8f0', textShadow: `0 0 30px ${plano.cor}40` }}>
                        R$ {preco}
                      </motion.span>
                      <span className="text-sm mb-2" style={{ color: '#3a6090' }}>
                        {idioma === 'pt' ? '/mês' : idioma === 'en' ? '/mo' : '/mes'}
                      </span>
                    </div>
                    <AnimatePresence>
                      {anual && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <p className="text-xs mt-1" style={{ color: '#34d399' }}>
                            R$ {plano.anual}{idioma === 'pt' ? '/ano' : '/year'} • {txt.economia} R$ {economia}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <p className="text-xs mt-2" style={{ color: '#3a6090' }}>
                      {txt.ate} {plano.usuarios} {txt.usuarios}
                    </p>
                  </div>

                  <div className="flex-1 space-y-2.5 mb-8">
                    {plano.recursos.map((r, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 + i * 0.03 }}
                        className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: r.ok ? `${plano.cor}20` : 'rgba(248,113,113,0.1)' }}>
                          {r.ok ? <Check size={12} style={{ color: plano.cor }} /> : <X size={12} style={{ color: '#f87171' }} />}
                        </div>
                        <span className="text-sm" style={{ color: r.ok ? '#c8d8f0' : '#3a6090' }}>{r.label}</span>
                        {!r.ok && (r.label.includes('IA') || r.label.includes('AI')) && (
                          <span className="text-xs ml-auto" style={{ color: '#f87171' }}>🔒</span>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* ✅ Botão com Stripe integrado */}
                  <motion.button
                    whileHover={{ scale: carregando ? 1 : 1.03, boxShadow: carregando ? 'none' : `0 0 40px ${plano.cor}50` }}
                    whileTap={{ scale: carregando ? 1 : 0.97 }}
                    onClick={() => assinar(plano.id)}
                    disabled={carregando || !!loadingPlano}
                    className="w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: plano.corGrad, color: '#fff', boxShadow: `0 4px 30px ${plano.cor}30` }}>
                    {carregando ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {txt.processando}
                      </>
                    ) : txt.assinar}
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Rodapé */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-center text-xs mt-12" style={{ color: '#3a6090' }}>
          {txt.cancelar}
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="flex justify-center gap-6 mt-6 flex-wrap">
          {['🔒 SSL Seguro', '💳 Pagamento Seguro via Stripe', '⚡ Ativação Imediata', '🔄 Cancele Quando Quiser'].map((item, i) => (
            <span key={i} className="text-xs" style={{ color: '#3a5a8a' }}>{item}</span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}