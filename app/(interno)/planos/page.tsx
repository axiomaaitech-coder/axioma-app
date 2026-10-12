'use client'
import { useState } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '../../../lib/supabaseBrowser'
import { Check, Zap, Crown, Building2, Rocket, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLANOS, TESTE, INAUGURACAO, PLANO_RECURSOS, PLANO_DESCRICAO, reais } from '../../../lib/planos'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Página de assinatura — fora do dashboard interno (não usa o toggle de
// tema Claro/Escuro dos módulos de trabalho). Só Escuro, sempre.
const PAG_BG = '#020810'
const CARD_BG = 'rgba(4,10,22,0.97)'
const TEXTO_PRINC = '#c8d8f0'
const TEXTO_MUTED = '#6a8bbd'
const TEXTO_MUTED2 = '#5a7aaa'

export default function Planos() {
  const { idioma } = useLanguage()
  const [hover, setHover] = useState<string | null>(null)
  const [loadingPlano, setLoadingPlano] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal')
  const lang = (idioma === 'en' || idioma === 'es' ? idioma : 'pt') as 'pt' | 'en' | 'es'
  const txt = {
    pt: {
      titulo: 'Escolha seu Plano', sub: `Teste grátis por ${TESTE.dias} dias com cartão (IA liberada nos ${TESTE.diasIA} primeiros dias). Cancele antes e não paga nada.`,
      usuarios: 'pessoa(s)', ate: 'até', assinar: 'Começar agora',
      popular: 'Mais escolhido', mes: '/mês', trial: `${TESTE.dias} dias grátis`,
      mensal: 'Mensal', anual: 'Anual (2 meses grátis)', anualCobrado: (v: string) => `cobrado ${v} por ano`,
      inauguracao: `Inauguração: ${INAUGURACAO.porcento}% off nos ${INAUGURACAO.meses} primeiros meses — só para as ${INAUGURACAO.vagas} primeiras empresas`,
      iaMes: 'IA por mês', iaComum: 'perguntas IA comum', iaAvancada: 'perguntas IA avançada', notas: 'notas lidas pela IA',
      recarga: 'Acabou a IA do mês? Recarregue com o cartão em Config → Uso da IA, em qualquer plano.',
      cancelar: 'Cancele quando quiser. Sem fidelidade.',
      selos: ['Conexão protegida', 'Pagamento seguro via Stripe', 'Ativação imediata', 'Cancele quando quiser'],
      processando: 'Processando...',
      erroLogin: 'Faça login para assinar um plano.',
      erroGeral: 'Erro ao processar pagamento. Tente novamente.',
    },
    en: {
      titulo: 'Choose Your Plan', sub: `${TESTE.dias}-day free trial with a card (AI available in the first ${TESTE.diasIA} days). Cancel before and pay nothing.`,
      usuarios: 'person(s)', ate: 'up to', assinar: 'Start now',
      popular: 'Most chosen', mes: '/mo', trial: `${TESTE.dias}-day free trial`,
      mensal: 'Monthly', anual: 'Yearly (2 months free)', anualCobrado: (v: string) => `billed ${v} per year`,
      inauguracao: `Launch offer: ${INAUGURACAO.porcento}% off for the first ${INAUGURACAO.meses} months — first ${INAUGURACAO.vagas} companies only`,
      iaMes: 'AI per month', iaComum: 'standard AI questions', iaAvancada: 'advanced AI questions', notas: 'invoices read by AI',
      recarga: 'Ran out of AI this month? Top up with your card in Settings → AI usage, on any plan.',
      cancelar: 'Cancel anytime. No commitment.',
      selos: ['Secure connection', 'Secure payment via Stripe', 'Instant activation', 'Cancel anytime'],
      processando: 'Processing...',
      erroLogin: 'Please login to subscribe.',
      erroGeral: 'Payment error. Please try again.',
    },
    es: {
      titulo: 'Elige tu Plan', sub: `Prueba gratis por ${TESTE.dias} días con tarjeta (IA disponible los primeros ${TESTE.diasIA} días). Cancela antes y no pagas nada.`,
      usuarios: 'persona(s)', ate: 'hasta', assinar: 'Empezar ahora',
      popular: 'Más elegido', mes: '/mes', trial: `${TESTE.dias} días gratis`,
      mensal: 'Mensual', anual: 'Anual (2 meses gratis)', anualCobrado: (v: string) => `cobrado ${v} por año`,
      inauguracao: `Inauguración: ${INAUGURACAO.porcento}% de descuento los primeros ${INAUGURACAO.meses} meses — solo para las ${INAUGURACAO.vagas} primeras empresas`,
      iaMes: 'IA por mes', iaComum: 'preguntas IA común', iaAvancada: 'preguntas IA avanzada', notas: 'facturas leídas por IA',
      recarga: '¿Se acabó la IA del mes? Recarga con tarjeta en Config → Uso de la IA, en cualquier plan.',
      cancelar: 'Cancela cuando quieras. Sin permanencia.',
      selos: ['Conexión protegida', 'Pago seguro vía Stripe', 'Activación inmediata', 'Cancela cuando quieras'],
      processando: 'Procesando...',
      erroLogin: 'Inicia sesión para suscribirte.',
      erroGeral: 'Error de pago. Inténtalo de nuevo.',
    },
  }[lang]

  // Cores do Axioma: cartão azul-marinho, destaque verde-menta, botão verde-menta escuro — iguais nos 4 (hierarquia pela ordem e pelo preço).
  const planos = ([
    { id: 'starter', Icon: Zap, cor: '#2ecc9b', corGrad: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', destaque: false },
    { id: 'pro', Icon: Crown, cor: '#2ecc9b', corGrad: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', destaque: false },
    { id: 'business', Icon: Building2, cor: '#2ecc9b', corGrad: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', destaque: true },
    { id: 'enterprise', Icon: Rocket, cor: '#2ecc9b', corGrad: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', destaque: false },
  ] as const).map((p) => ({ ...p, ...PLANOS[p.id], recursos: PLANO_RECURSOS[p.id][lang], desc: PLANO_DESCRICAO[p.id][lang], badge: p.destaque ? txt.popular : null }))

  // Checkout com Stripe (teste de 7 dias + cupom de inauguração no servidor)
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
        body: JSON.stringify({ plano: planoId, periodo }), // quem assina sai da sessão no servidor, nunca daqui
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
    <div className="relative min-h-screen overflow-auto" style={{ background: PAG_BG }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 20%, rgba(106,176,255,0.08) 0%, transparent 60%)',
      }} />

      <div className="relative z-10 px-4 py-12 md:py-16">

        {/* Header */}
        <div className="flex flex-col items-center mb-12 md:mb-16">
          <div className="text-xs font-black tracking-[0.4em] uppercase mb-3" style={{ color: '#6ab0ff' }}>
            AXIOMA AI.TECH
          </div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-black text-center mb-4"
            style={{ color: TEXTO_PRINC, lineHeight: 1.1 }}>
            {txt.titulo}
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-sm md:text-base text-center mb-4 max-w-md" style={{ color: TEXTO_MUTED }}>
            {txt.sub}
          </motion.p>

          <p className="text-xs md:text-sm text-center mb-4 px-4 py-2 rounded-xl font-bold max-w-xl"
            style={{ background: 'rgba(46,204,155,0.12)', color: '#2ecc9b', border: '1px solid rgba(46,204,155,0.35)' }}>
            {txt.inauguracao}
          </p>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(16,27,61,0.8)', border: '1px solid rgba(46,204,155,0.2)' }}>
            {(['mensal', 'anual'] as const).map((p) => (
              <button key={p} onClick={() => setPeriodo(p)} className="px-4 py-2 rounded-lg text-xs font-bold"
                style={{ background: periodo === p ? 'linear-gradient(135deg,#0a4f3b,#0f7d5c)' : 'transparent', color: '#ffffff' }}>
                {p === 'mensal' ? txt.mensal : txt.anual}
              </button>
            ))}
          </div>

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
                transition={{ delay: idx * 0.08, duration: 0.4, ease: 'easeOut' }}
                onHoverStart={() => setHover(plano.id)} onHoverEnd={() => setHover(null)}
                className="relative rounded-3xl overflow-hidden flex flex-col axi-card-premium3d"
                style={{
                  background: CARD_BG,
                  border: `1px solid ${isHover || plano.destaque ? 'rgba(46,204,155,0.6)' : 'rgba(46,204,155,0.2)'}`,
                  boxShadow: isHover ? '0 0 50px rgba(46,204,155,0.18), 0 18px 40px -20px rgba(0,0,0,0.6)' : plano.destaque ? '0 0 30px rgba(46,204,155,0.10)' : 'none',
                  transform: isHover ? 'translateY(-4px)' : 'none',
                  transition: 'box-shadow 200ms ease, border-color 200ms ease, transform 200ms ease',
                }}>
                <div className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b', opacity: isHover || plano.destaque ? 1 : 0, transition: 'opacity 200ms ease' }} />

                {/* Faixa do selo em todos os cartões (vazia nos outros) — os 4 ficam alinhados. */}
                <div className="relative z-10 flex justify-center pt-4 h-10">
                  {plano.badge && (
                    <span className="text-xs font-black px-4 py-1 rounded-full h-fit"
                      style={{ background: '#101b3d', color: '#ffffff', border: '1px solid rgba(46,204,155,0.6)' }}>
                      {plano.badge}
                    </span>
                  )}
                </div>

                <div className="relative z-10 px-5 pb-5 md:px-6 md:pb-6 pt-1 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl" style={{ background: `${plano.cor}15` }}>
                      <plano.Icon size={22} style={{ color: plano.cor }} />
                    </div>
                    <h2 className="text-2xl font-black" style={{ color: plano.cor }}>{plano.nome[lang]}</h2>
                  </div>

                  <p className="text-xs mb-5" style={{ color: TEXTO_MUTED }}>{plano.desc}</p>

                  <div className="mb-4">
                    <div className="flex flex-wrap items-end gap-x-1.5">
                      <span className="text-3xl xl:text-4xl font-black whitespace-nowrap" style={{ color: TEXTO_PRINC }}>
                        {reais(periodo === 'anual' ? plano.anualPorMesCentavos : plano.mensalCentavos, lang)}
                      </span>
                      <span className="text-sm mb-2" style={{ color: TEXTO_MUTED }}>{txt.mes}</span>
                    </div>
                    {periodo === 'anual' && <p className="text-xs mt-1" style={{ color: TEXTO_MUTED }}>{txt.anualCobrado(reais(plano.anualPorMesCentavos * 12, lang))}</p>}
                    <p className="text-xs mt-2" style={{ color: TEXTO_MUTED }}>
                      {txt.ate} {plano.pessoas} {txt.usuarios}
                    </p>
                  </div>

                  {/* Selo trial */}
                  <div className="flex justify-start mb-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{ background: 'rgba(46,204,155,0.15)', color: '#2ecc9b', border: '1px solid rgba(46,204,155,0.3)' }}>
                      {txt.trial}
                    </span>
                  </div>

                  <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: 'rgba(46,204,155,0.06)', border: '1px solid rgba(46,204,155,0.18)', color: TEXTO_PRINC }}>
                    <p className="font-bold mb-1" style={{ color: '#2ecc9b' }}>{txt.iaMes}</p>
                    <p>{plano.ia.openai.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR')} {txt.iaComum}</p>
                    <p>{plano.ia.anthropic} {txt.iaAvancada}</p>
                    <p>{plano.ia.nota} {txt.notas}</p>
                  </div>

                  <div className="flex-1 space-y-2.5 mb-6">
                    {plano.recursos.map((label, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                          style={{ background: `${plano.cor}20` }}>
                          <Check size={12} style={{ color: plano.cor }} />
                        </div>
                        <span className="text-sm" style={{ color: TEXTO_PRINC }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* ✅ Botão com Stripe integrado */}
                  <motion.button
                    whileHover={{ scale: carregando ? 1 : 1.02 }}
                    whileTap={{ scale: carregando ? 1 : 0.98 }}
                    onClick={() => assinar(plano.id)}
                    disabled={carregando || !!loadingPlano}
                    className="w-full py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: plano.corGrad, color: '#fff' }}>
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
        <p className="text-center text-xs mt-12" style={{ color: TEXTO_MUTED }}>{txt.recarga}</p>
        <p className="text-center text-xs mt-2" style={{ color: TEXTO_MUTED }}>
          {txt.cancelar}
        </p>

        <div className="flex justify-center gap-6 mt-6 flex-wrap">
          {txt.selos.map((item, i) => (
            <span key={i} className="text-xs" style={{ color: TEXTO_MUTED2 }}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
