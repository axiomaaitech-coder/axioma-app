'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { Check, Zap, Crown, Building2, Rocket, Loader2 } from 'lucide-react'
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
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2.5 + 0.5,
      color: ['#6ab0ff', '#34d399', '#a78bfa', '#f59e0b', '#f472b6', '#fbbf24'][Math.floor(Math.random() * 6)],
      opacity: Math.random() * 0.7 + 0.2,
    }))
    const chars = 'AXIOMA AI TECH R$ 47 97 197 297 % STARTER PRO BUSINESS ENTERPRISE 0 1 2 3 4 5 6 7 8 9'.split(' ').map(char => ({
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
  const [hover, setHover] = useState<string | null>(null)
  const [loadingPlano, setLoadingPlano] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const txt = {
    pt: {
      titulo: 'Escolha seu Plano', sub: 'Comece agora com 14 dias grátis em qualquer plano',
      usuarios: 'usuário(s)', ate: 'até', assinar: 'Começar agora',
      popular: '⭐ Mais Popular', mes: '/mês', trial: '14 dias grátis',
      cancelar: 'Cancele quando quiser. Sem fidelidade.',
      processando: 'Processando...',
      erroLogin: 'Faça login para assinar um plano.',
      erroGeral: 'Erro ao processar pagamento. Tente novamente.',
    },
    en: {
      titulo: 'Choose Your Plan', sub: 'Start now with a 14-day free trial on any plan',
      usuarios: 'user(s)', ate: 'up to', assinar: 'Start now',
      popular: '⭐ Most Popular', mes: '/mo', trial: '14-day free trial',
      cancelar: 'Cancel anytime. No commitment.',
      processando: 'Processing...',
      erroLogin: 'Please login to subscribe.',
      erroGeral: 'Payment error. Please try again.',
    },
    es: {
      titulo: 'Elige tu Plan', sub: 'Empieza ahora con 14 días gratis en cualquier plan',
      usuarios: 'usuario(s)', ate: 'hasta', assinar: 'Empezar ahora',
      popular: '⭐ Más Popular', mes: '/mes', trial: '14 días gratis',
      cancelar: 'Cancela cuando quieras. Sin fidelidad.',
      processando: 'Procesando...',
      erroLogin: 'Inicia sesión para suscribirte.',
      erroGeral: 'Error de pago. Inténtalo de nuevo.',
    },
  }[idioma]

  const feats = {
    pt: {
      starter: ['23 módulos completos', 'Módulo MEI exclusivo', 'Dashboard com KPIs', 'Exportar PDF', 'Suporte por email'],
      pro: ['Tudo do Starter', 'IA Financeira Premium', 'Multi-idioma PT/EN/ES', 'Relatórios avançados', 'Open Finance'],
      business: ['Tudo do Pro', 'IA Tributária Premium', 'IA MEI Advisor', 'Centros de Custo', 'Suporte prioritário'],
      enterprise: ['Tudo do Business', 'ClowdBot autônomo', 'Multi-empresas', 'API dedicada', 'Suporte VIP 24/7'],
    },
    en: {
      starter: ['23 complete modules', 'Exclusive MEI module', 'Dashboard with KPIs', 'PDF export', 'Email support'],
      pro: ['Everything in Starter', 'Financial AI Premium', 'Multi-language PT/EN/ES', 'Advanced reports', 'Open Finance'],
      business: ['Everything in Pro', 'Tax AI Premium', 'MEI AI Advisor', 'Cost Centers', 'Priority support'],
      enterprise: ['Everything in Business', 'Autonomous ClowdBot', 'Multi-company', 'Dedicated API', '24/7 VIP support'],
    },
    es: {
      starter: ['23 módulos completos', 'Módulo MEI exclusivo', 'Panel con KPIs', 'Exportar PDF', 'Soporte por email'],
      pro: ['Todo de Starter', 'IA Financiera Premium', 'Multi-idioma PT/EN/ES', 'Informes avanzados', 'Open Finance'],
      business: ['Todo de Pro', 'IA Tributaria Premium', 'IA MEI Advisor', 'Centros de Costo', 'Soporte prioritario'],
      enterprise: ['Todo de Business', 'ClowdBot autónomo', 'Multi-empresas', 'API dedicada', 'Soporte VIP 24/7'],
    },
  }[idioma]

  const planos = [
    {
      id: 'starter', nome: 'Starter', Icon: Zap,
      mensal: 47, usuarios: 1,
      cor: '#6ab0ff', corGrad: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)',
      destaque: false, badge: null, ia: false,
      desc: idioma === 'pt' ? 'Para MEI e autônomos' : idioma === 'en' ? 'For MEI and freelancers' : 'Para MEI y autónomos',
      recursos: feats.starter,
    },
    {
      id: 'pro', nome: 'Pro', Icon: Crown,
      mensal: 97, usuarios: 2,
      cor: '#f59e0b', corGrad: 'linear-gradient(135deg, #92400e, #f59e0b)',
      destaque: false, badge: null, ia: true,
      desc: idioma === 'pt' ? 'Para profissionais' : idioma === 'en' ? 'For professionals' : 'Para profesionales',
      recursos: feats.pro,
    },
    {
      id: 'business', nome: 'Business', Icon: Building2,
      mensal: 197, usuarios: 5,
      cor: '#34d399', corGrad: 'linear-gradient(135deg, #064e3b, #059669)',
      destaque: true, badge: txt.popular, ia: true,
      desc: idioma === 'pt' ? 'Para empresas em crescimento' : idioma === 'en' ? 'For growing businesses' : 'Para empresas en crecimiento',
      recursos: feats.business,
    },
    {
      id: 'enterprise', nome: 'Enterprise', Icon: Rocket,
      mensal: 297, usuarios: 10,
      cor: '#a78bfa', corGrad: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
      destaque: false, badge: null, ia: true,
      desc: idioma === 'pt' ? 'Solução sem limites' : idioma === 'en' ? 'Solution without limits' : 'Solución sin límites',
      recursos: feats.enterprise,
    },
  ]

  // ✅ Função de checkout com Stripe (trial 14 dias + cupom automático no backend)
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
            className="text-sm md:text-base text-center mb-4 max-w-md" style={{ color: '#6a8bbd' }}>
            {txt.sub}
          </motion.p>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto items-stretch">
          {planos.map((plano, idx) => {
            const isHover = hover === plano.id
            const carregando = loadingPlano === plano.id
            return (
              <motion.div key={plano.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12 }}
                onHoverStart={() => setHover(plano.id)} onHoverEnd={() => setHover(null)}
                className="relative rounded-3xl overflow-hidden flex flex-col"
                style={{
                  background: 'rgba(4,10,22,0.97)',
                  border: `1px solid ${plano.cor}${plano.destaque ? '70' : '30'}`,
                  boxShadow: isHover || plano.destaque ? `0 0 60px ${plano.cor}22, 0 0 30px ${plano.cor}10` : 'none',
                }}>
                <CanvasEpico />

                {[
                  { pos: 'top-0 left-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(90deg, ${plano.cor}, transparent)` },
                  { pos: 'top-0 left-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(180deg, ${plano.cor}, transparent)` },
                  { pos: 'top-0 right-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(270deg, ${plano.cor}, transparent)` },
                  { pos: 'top-0 right-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(180deg, ${plano.cor}, transparent)` },
                  { pos: 'bottom-0 left-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(90deg, ${plano.cor}, transparent)` },
                  { pos: 'bottom-0 left-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(0deg, ${plano.cor}, transparent)` },
                  { pos: 'bottom-0 right-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(270deg, ${plano.cor}, transparent)` },
                  { pos: 'bottom-0 right-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(0deg, ${plano.cor}, transparent)` },
                ].map((b, i) => (
                  <div key={i} className={`absolute ${b.pos} ${b.w} z-10`}
                    style={{ background: b.bg, boxShadow: `0 0 16px ${plano.cor}`, borderRadius: '999px' }} />
                ))}

                {plano.badge && (
                  <div className="relative z-10 flex justify-center pt-4">
                    <motion.span animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs font-black px-4 py-1.5 rounded-full"
                      style={{ background: `${plano.cor}20`, color: plano.cor, border: `1px solid ${plano.cor}50`, boxShadow: `0 0 15px ${plano.cor}30` }}>
                      {plano.badge}
                    </motion.span>
                  </div>
                )}

                <div className="relative z-10 p-5 md:p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: idx * 0.5 }}
                      className="p-2 rounded-xl" style={{ background: `${plano.cor}15` }}>
                      <plano.Icon size={22} style={{ color: plano.cor }} />
                    </motion.div>
                    <h2 className="text-2xl font-black" style={{ color: plano.cor, textShadow: `0 0 20px ${plano.cor}60` }}>{plano.nome}</h2>
                  </div>

                  <p className="text-xs mb-5" style={{ color: '#6a8bbd' }}>{plano.desc}</p>

                  <div className="mb-4">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl md:text-5xl font-black"
                        style={{ color: '#c8d8f0', textShadow: `0 0 30px ${plano.cor}40` }}>
                        R$ {plano.mensal}
                      </span>
                      <span className="text-sm mb-2" style={{ color: '#6a8bbd' }}>{txt.mes}</span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#6a8bbd' }}>
                      {txt.ate} {plano.usuarios} {txt.usuarios}
                    </p>
                  </div>

                  {/* Selo trial */}
                  <div className="flex justify-start mb-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                      ✨ {txt.trial}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2.5 mb-6">
                    {plano.recursos.map((label, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                          style={{ background: `${plano.cor}20` }}>
                          <Check size={12} style={{ color: plano.cor }} />
                        </div>
                        <span className="text-sm" style={{ color: '#c8d8f0' }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* ✅ Botão com Stripe integrado */}
                  <motion.button
                    whileHover={{ scale: carregando ? 1 : 1.03, boxShadow: carregando ? 'none' : `0 0 40px ${plano.cor}50` }}
                    whileTap={{ scale: carregando ? 1 : 0.97 }}
                    onClick={() => assinar(plano.id)}
                    disabled={carregando || !!loadingPlano}
                    className="w-full py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-70"
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
          className="text-center text-xs mt-12" style={{ color: '#6a8bbd' }}>
          {txt.cancelar}
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="flex justify-center gap-6 mt-6 flex-wrap">
          {['🔒 SSL Seguro', '💳 Pagamento Seguro via Stripe', '⚡ Ativação Imediata', '🔄 Cancele Quando Quiser'].map((item, i) => (
            <span key={i} className="text-xs" style={{ color: '#5a7aaa' }}>{item}</span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
