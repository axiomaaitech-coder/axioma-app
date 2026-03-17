'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const idiomas = {
  pt: {
    badge: 'INTELIGÊNCIA FINANCEIRA COM IA',
    titulo1: 'A verdade financeira do seu negócio.',
    sub1: 'Um axioma é uma verdade absoluta, a base de tudo. O Axioma AI.Tech transforma dados financeiros em verdades que impulsionam seu crescimento.',
    comecar: '🚀 Começar Agora',
    verPlanos: 'Ver Planos',
    modulos: 'Módulos',
    idiomas: 'Idiomas',
    ias: 'IAs Integradas',
    badge2: '∑ A MATEMÁTICA DO SEU SUCESSO',
    titulo2: 'Axioma: verdades que não precisam de prova.',
    sub2: 'Na matemática, um axioma é a base irrefutável de toda teoria. No seu negócio, são os dados financeiros reais que guiam cada decisão.',
    comecarGratis: '🚀 Começar Gratuitamente',
    login: 'Login',
    badgeEinstein: '⚡ EINSTEIN FINANCEIRO',
    tituloEinstein: 'Se Einstein gerenciasse suas finanças...',
    subEinstein: '...ele usaria o Axioma AI.Tech. Porque assim como E=mc², suas finanças têm uma equação perfeita — e nós a revelamos com inteligência artificial.',
    eq1: 'Receita - Custos = Lucro',
    eq2: 'Dados + IA = Decisões Certas',
    eq3: 'Axioma × Tempo = Crescimento∞',
    badgeEspaco: '🌌 O UNIVERSO FINANCEIRO',
    tituloEspaco: 'Seu negócio é um universo em expansão.',
    subEspaco: 'Assim como Stephen Hawking desvendou os mistérios do cosmos, o Axioma AI.Tech desvenda os mistérios das suas finanças — com IA que enxerga além do que os olhos podem ver.',
    badgePlanos: '🚀 ESCOLHA SEU PLANO',
    tituloPlanos: 'Comece hoje mesmo',
    cancelar: 'Cancele quando quiser. Sem fidelidade.',
    maisPopular: '⭐ MAIS POPULAR',
    iaPremium: '⭐ IA Premium inclusa',
    features: ['Gestão financeira completa com 13+ módulos', 'IA Financeira e IA Tributária integradas', 'Multi-idioma: Português, Inglês e Espanhol', 'Segurança com RLS e autenticação avançada'],
    footer: '© 2026 Axioma AI.Tech — Inteligência Financeira para PMEs',
    espaco1: 'Buracos negros nos dados? A IA encontra.',
    espaco2: 'Expansão do universo = crescimento do seu negócio.',
    espaco3: 'Singularidade financeira: tudo começa aqui.',
  },
  en: {
    badge: 'FINANCIAL INTELLIGENCE WITH AI',
    titulo1: 'The financial truth of your business.',
    sub1: 'An axiom is an absolute truth, the foundation of everything. Axioma AI.Tech transforms financial data into truths that drive your growth.',
    comecar: '🚀 Start Now',
    verPlanos: 'View Plans',
    modulos: 'Modules',
    idiomas: 'Languages',
    ias: 'Integrated AIs',
    badge2: '∑ THE MATHEMATICS OF YOUR SUCCESS',
    titulo2: 'Axiom: truths that need no proof.',
    sub2: 'In mathematics, an axiom is the irrefutable foundation of every theory. In your business, it\'s real financial data that guides every decision.',
    comecarGratis: '🚀 Start for Free',
    login: 'Login',
    badgeEinstein: '⚡ FINANCIAL EINSTEIN',
    tituloEinstein: 'If Einstein managed your finances...',
    subEinstein: '...he would use Axioma AI.Tech. Because just like E=mc², your finances have a perfect equation — and we reveal it with artificial intelligence.',
    eq1: 'Revenue - Costs = Profit',
    eq2: 'Data + AI = Right Decisions',
    eq3: 'Axioma × Time = Growth∞',
    badgeEspaco: '🌌 THE FINANCIAL UNIVERSE',
    tituloEspaco: 'Your business is an expanding universe.',
    subEspaco: 'Just as Stephen Hawking unveiled the mysteries of the cosmos, Axioma AI.Tech unveils the mysteries of your finances — with AI that sees beyond what eyes can see.',
    badgePlanos: '🚀 CHOOSE YOUR PLAN',
    tituloPlanos: 'Start today',
    cancelar: 'Cancel anytime. No commitment.',
    maisPopular: '⭐ MOST POPULAR',
    iaPremium: '⭐ Premium AI included',
    features: ['Complete financial management with 13+ modules', 'Financial AI and Tax AI integrated', 'Multi-language: Portuguese, English and Spanish', 'Security with RLS and advanced authentication'],
    footer: '© 2026 Axioma AI.Tech — Financial Intelligence for SMEs',
    espaco1: 'Black holes in your data? AI finds them.',
    espaco2: 'Universe expansion = your business growth.',
    espaco3: 'Financial singularity: everything starts here.',
  },
  es: {
    badge: 'INTELIGENCIA FINANCIERA CON IA',
    titulo1: 'La verdad financiera de tu negocio.',
    sub1: 'Un axioma es una verdad absoluta, la base de todo. Axioma AI.Tech transforma datos financieros en verdades que impulsan tu crecimiento.',
    comecar: '🚀 Empezar Ahora',
    verPlanos: 'Ver Planes',
    modulos: 'Módulos',
    idiomas: 'Idiomas',
    ias: 'IAs Integradas',
    badge2: '∑ LAS MATEMÁTICAS DE TU ÉXITO',
    titulo2: 'Axioma: verdades que no necesitan prueba.',
    sub2: 'En matemáticas, un axioma es la base irrefutable de toda teoría. En tu negocio, son los datos financieros reales los que guían cada decisión.',
    comecarGratis: '🚀 Empezar Gratis',
    login: 'Iniciar Sesión',
    badgeEinstein: '⚡ EINSTEIN FINANCIERO',
    tituloEinstein: 'Si Einstein gestionara tus finanzas...',
    subEinstein: '...usaría Axioma AI.Tech. Porque igual que E=mc², tus finanzas tienen una ecuación perfecta — y nosotros la revelamos con inteligencia artificial.',
    eq1: 'Ingresos - Costos = Ganancia',
    eq2: 'Datos + IA = Decisiones Correctas',
    eq3: 'Axioma × Tiempo = Crecimiento∞',
    badgeEspaco: '🌌 EL UNIVERSO FINANCIERO',
    tituloEspaco: 'Tu negocio es un universo en expansión.',
    subEspaco: 'Así como Stephen Hawking desveló los misterios del cosmos, Axioma AI.Tech desvela los misterios de tus finanzas — con IA que ve más allá de lo que los ojos pueden ver.',
    badgePlanos: '🚀 ELIGE TU PLAN',
    tituloPlanos: 'Empieza hoy mismo',
    cancelar: 'Cancela cuando quieras. Sin fidelidad.',
    maisPopular: '⭐ MÁS POPULAR',
    iaPremium: '⭐ IA Premium incluida',
    features: ['Gestión financiera completa con 13+ módulos', 'IA Financiera e IA Tributaria integradas', 'Multi-idioma: Portugués, Inglés y Español', 'Seguridad con RLS y autenticación avanzada'],
    footer: '© 2026 Axioma AI.Tech — Inteligencia Financiera para PYMEs',
    espaco1: '¿Agujeros negros en tus datos? La IA los encuentra.',
    espaco2: 'Expansión del universo = crecimiento de tu negocio.',
    espaco3: 'Singularidad financiera: todo empieza aquí.',
  }
}

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<HTMLCanvasElement>(null)
  const [slide, setSlide] = useState(0)
  const [fade, setFade] = useState(true)
  const [lang, setLang] = useState<'pt'|'en'|'es'>('pt')
  const t = idiomas[lang]
  const totalSlides = 5

  // Matrix rain
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const chars = 'AXIOMA∑∫∂∇√π∞≈≡±∗∈⊂⊃E=mc²F=maΔΨΩΦΛΘΞΠΣ数学真理01アイウエオ'
    const fontSize = 13
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(1)
    const colors = ['#3b6fd4', '#6ab0ff', '#34d399', '#a78bfa', '#ffffff', '#f59e0b']
    function draw() {
      ctx!.fillStyle = 'rgba(2,8,16,0.04)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx!.fillStyle = colors[Math.floor(Math.random() * colors.length)]
        ctx!.font = `${fontSize}px monospace`
        ctx!.globalAlpha = Math.random() * 0.5 + 0.1
        ctx!.fillText(char, i * fontSize, y * fontSize)
        ctx!.globalAlpha = 1
        if (y * fontSize > canvas!.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    const interval = setInterval(draw, 40)
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { clearInterval(interval); window.removeEventListener('resize', resize) }
  }, [])

  // Stars / shooting stars
  useEffect(() => {
    const canvas = starsRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5,
      alpha: Math.random(),
      speed: Math.random() * 0.5 + 0.1,
    }))

    const shootingStars: any[] = []

    function addShootingStar() {
      shootingStars.push({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height * 0.5,
        len: Math.random() * 150 + 80,
        speed: Math.random() * 8 + 6,
        alpha: 1,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      })
    }

    setInterval(addShootingStar, 2000)

    function drawStars() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      stars.forEach(s => {
        s.alpha += (Math.random() - 0.5) * 0.05
        s.alpha = Math.max(0.1, Math.min(1, s.alpha))
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255,255,255,${s.alpha * 0.6})`
        ctx!.fill()
      })

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i]
        const gradient = ctx!.createLinearGradient(s.x, s.y, s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len)
        gradient.addColorStop(0, `rgba(255,255,255,${s.alpha})`)
        gradient.addColorStop(0.3, `rgba(106,176,255,${s.alpha * 0.6})`)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        ctx!.beginPath()
        ctx!.strokeStyle = gradient
        ctx!.lineWidth = 2
        ctx!.moveTo(s.x, s.y)
        ctx!.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len)
        ctx!.stroke()
        s.x += Math.cos(s.angle) * s.speed
        s.y += Math.sin(s.angle) * s.speed
        s.alpha -= 0.015
        if (s.alpha <= 0) shootingStars.splice(i, 1)
      }
    }

    const interval = setInterval(drawStars, 30)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => { setSlide(prev => (prev + 1) % totalSlides); setFade(true) }, 800)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const goTo = (i: number) => { setFade(false); setTimeout(() => { setSlide(i); setFade(true) }, 300) }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#020810' }}>
      <canvas ref={starsRef} className="absolute inset-0 z-0" style={{ opacity: 0.8 }} />
      <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ opacity: 0.25 }} />

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '5%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,111,212,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '25%', width: 700, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)', filter: 'blur(70px)' }} />
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(59,111,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,111,212,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        transform: 'perspective(1000px) rotateX(25deg)',
        transformOrigin: 'center top',
      }} />

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <header className="flex justify-between items-center px-12 py-6">
          <div className="flex items-center gap-4">
            <div style={{ filter: 'drop-shadow(0 0 24px rgba(106,176,255,0.9))' }}>
              <img src="/logo-aitech.png" alt="Axioma" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            </div>
            <div>
              <h1 className="font-black tracking-[0.3em] text-xl" style={{ background: 'linear-gradient(135deg, #c8d8f0 0%, #6ab0ff 40%, #fff 60%, #3b6fd4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AXIOMA</h1>
              <p className="text-xs tracking-[0.4em]" style={{ color: '#3a5a8a' }}>AI.TECH</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(['pt','en','es'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} className="text-xs px-3 py-1 rounded-full font-bold transition-all"
                style={{ background: lang === l ? 'rgba(59,111,212,0.3)' : 'transparent', color: lang === l ? '#6ab0ff' : '#3a5a8a', border: '1px solid rgba(59,111,212,0.2)' }}>
                {l === 'pt' ? '🇧🇷 PT' : l === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
              </button>
            ))}
            <button onClick={() => router.push('/login')} className="px-5 py-2 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105 ml-2"
              style={{ background: 'transparent', color: '#6ab0ff', border: '1px solid rgba(106,176,255,0.3)' }}>
              {t.login}
            </button>
            <button onClick={() => router.push('/cadastro')} className="px-5 py-2 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', boxShadow: '0 4px 20px rgba(42,95,212,0.4)' }}>
              {t.comecar}
            </button>
          </div>
        </header>

        {/* Slides */}
        <div className="flex-1 flex items-center justify-center px-12" style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.8s ease' }}>

          {/* SLIDE 1 — Hero */}
          {slide === 0 && (
            <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(59,111,212,0.1)', border: '1px solid rgba(59,111,212,0.3)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34d399' }} />
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#6ab0ff' }}>{t.badge}</span>
                </div>
                <h2 className="text-6xl font-black leading-tight mb-6" style={{ background: 'linear-gradient(135deg, #fff 0%, #c8d8f0 40%, #6ab0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.titulo1}</h2>
                <p className="text-lg mb-8" style={{ color: '#3a6090', lineHeight: 1.8 }}>{t.sub1}</p>
                <div className="flex gap-4 mb-10">
                  <button onClick={() => router.push('/cadastro')} className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', boxShadow: '0 8px 40px rgba(42,95,212,0.5)' }}>{t.comecar}</button>
                  <button onClick={() => router.push('/planos')} className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105" style={{ background: 'transparent', color: '#6ab0ff', border: '1px solid rgba(106,176,255,0.3)' }}>{t.verPlanos}</button>
                </div>
                <div className="flex gap-10">
                  {[{ v: '13+', l: t.modulos }, { v: '3', l: t.idiomas }, { v: '2', l: t.ias }].map((s, i) => (
                    <div key={i}><p className="text-3xl font-black" style={{ color: '#6ab0ff' }}>{s.v}</p><p className="text-xs" style={{ color: '#3a6090' }}>{s.l}</p></div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(59,111,212,0.3)', borderRadius: 24, padding: 24, boxShadow: '0 0 80px rgba(59,111,212,0.2), 0 40px 80px rgba(0,0,0,0.5)', transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#f87171' }} /><div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} /><div className="w-3 h-3 rounded-full" style={{ background: '#34d399' }} />
                    <span className="text-xs ml-2" style={{ color: '#3a5a8a' }}>axioma-app.vercel.app</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[{ l: 'Faturamento', v: 'R$ 48.500', c: '#34d399' }, { l: 'Lucro Líquido', v: 'R$ 18.200', c: '#6ab0ff' }, { l: 'Custos Totais', v: 'R$ 30.300', c: '#f87171' }, { l: 'Score', v: '87/100', c: '#f59e0b' }].map((c, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(2,8,16,0.6)', border: '1px solid rgba(59,111,212,0.1)' }}>
                        <p className="text-xs mb-1" style={{ color: '#3a5a8a' }}>{c.l}</p>
                        <p className="text-lg font-black" style={{ color: c.c }}>{c.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(2,8,16,0.6)', border: '1px solid rgba(59,111,212,0.1)' }}>
                    <p className="text-xs mb-2" style={{ color: '#3a5a8a' }}>Receitas vs Custos</p>
                    <div className="flex items-end gap-1 h-14">
                      {[40,65,45,80,60,90,75].map((h,i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i%2===0 ? 'linear-gradient(180deg,#3b6fd4,rgba(59,111,212,0.3))' : 'linear-gradient(180deg,#34d399,rgba(52,211,153,0.3))' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 px-3 py-2 rounded-xl" style={{ background: 'linear-gradient(135deg,rgba(234,179,8,0.2),rgba(249,115,22,0.2))', border: '1px solid rgba(234,179,8,0.4)' }}>
                  <p className="text-xs font-black" style={{ color: '#fbbf24' }}>⭐ IA Tributária</p>
                  <p className="text-xs" style={{ color: '#f97316' }}>PREMIUM</p>
                </div>
                <div className="absolute -bottom-4 -left-4 px-3 py-2 rounded-xl" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <p className="text-xs font-black" style={{ color: '#34d399' }}>🧠 IA Financeira</p>
                  <p className="text-xs" style={{ color: '#3a6090' }}>Análise em tempo real</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2 — Einstein */}
          {slide === 1 && (
            <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
              <div className="flex justify-center items-center relative" style={{ height: 500 }}>
                <svg width="460" height="460" viewBox="0 0 460 460">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6ab0ff"/><stop offset="50%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#34d399"/>
                    </linearGradient>
                  </defs>
                  <circle cx="230" cy="230" r="180" fill="none" stroke="rgba(59,111,212,0.15)" strokeWidth="1" strokeDasharray="8 4">
                    <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="30s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="230" cy="230" r="140" fill="none" stroke="rgba(167,139,250,0.2)" strokeWidth="1" strokeDasharray="4 8">
                    <animateTransform attributeName="transform" type="rotate" from="360 230 230" to="0 230 230" dur="20s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="230" cy="230" r="100" fill="none" stroke="rgba(52,211,153,0.15)" strokeWidth="1">
                    <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="15s" repeatCount="indefinite"/>
                  </circle>
                  <text x="230" y="220" textAnchor="middle" fontSize="52" fontWeight="900" fill="url(#grad1)" opacity="0.9">E=mc²
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
                  </text>
                  <text x="230" y="255" textAnchor="middle" fontSize="16" fill="#3a5a8a" letterSpacing="4">AXIOMA</text>
                  {[{ formula: 'F=ma', angle: 0 }, { formula: 'PV=nRT', angle: 60 }, { formula: '∑F=0', angle: 120 }, { formula: 'Δx·Δp≥ℏ/2', angle: 180 }, { formula: 'S=k·ln(W)', angle: 240 }, { formula: '∫∂φ=0', angle: 300 }].map((item, i) => {
                    const rad = (item.angle * Math.PI) / 180
                    const x = 230 + 180 * Math.cos(rad)
                    const y = 230 + 180 * Math.sin(rad)
                    const colors = ['#6ab0ff','#34d399','#a78bfa','#f59e0b','#f87171','#6ab0ff']
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="28" fill={`${colors[i]}15`} stroke={`${colors[i]}50`} strokeWidth="1"/>
                        <text x={x} y={y+4} textAnchor="middle" fontSize="9" fontWeight="bold" fill={colors[i]}>{item.formula}</text>
                      </g>
                    )
                  })}
                  {[[80,80],[380,80],[80,380],[380,380]].map(([cx,cy],i) => (
                    <circle key={i} cx={cx} cy={cy} r="3" fill={['#3b6fd4','#34d399','#a78bfa','#f59e0b'][i]}>
                      <animate attributeName="r" values="2;5;2" dur={`${2+i*0.4}s`} repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2+i*0.4}s`} repeatCount="indefinite"/>
                    </circle>
                  ))}
                </svg>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#f59e0b' }}>{t.badgeEinstein}</span>
                </div>
                <h2 className="text-5xl font-black leading-tight mb-6" style={{ background: 'linear-gradient(135deg, #fff 0%, #f59e0b 50%, #f87171 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.tituloEinstein}</h2>
                <p className="text-base mb-8" style={{ color: '#3a6090', lineHeight: 1.8 }}>{t.subEinstein}</p>
                <div className="space-y-3 mb-8">
                  {[{ eq: t.eq1, cor: '#34d399' }, { eq: t.eq2, cor: '#6ab0ff' }, { eq: t.eq3, cor: '#a78bfa' }].map((item, i) => (
                    <div key={i} className="px-4 py-3 rounded-xl font-mono text-sm font-bold" style={{ background: `${item.cor}10`, border: `1px solid ${item.cor}30`, color: item.cor }}>{item.eq}</div>
                  ))}
                </div>
                <button onClick={() => router.push('/cadastro')} className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105 w-full" style={{ background: 'linear-gradient(135deg, #92400e, #b45309, #f59e0b)', color: '#fff', boxShadow: '0 8px 40px rgba(245,158,11,0.3)' }}>{t.comecar}</button>
              </div>
            </div>
          )}

          {/* SLIDE 3 — Geometria Sagrada */}
          {slide === 2 && (
            <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#a78bfa' }}>◈ GEOMETRIA DA PERFEIÇÃO</span>
                </div>
                <h2 className="text-5xl font-black leading-tight mb-6" style={{ background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #6ab0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.titulo2}</h2>
                <p className="text-base mb-8" style={{ color: '#3a6090', lineHeight: 1.8 }}>{t.sub2}</p>
                <div className="space-y-3 mb-8">
                  {t.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: ['rgba(59,111,212,0.08)','rgba(167,139,250,0.08)','rgba(52,211,153,0.08)','rgba(245,158,11,0.08)'][i], border: `1px solid ${['rgba(59,111,212,0.2)','rgba(167,139,250,0.2)','rgba(52,211,153,0.2)','rgba(245,158,11,0.2)'][i]}` }}>
                      <span className="text-lg">{['🧮','🤖','🌍','🔒'][i]}</span>
                      <span className="text-sm font-medium" style={{ color: '#8aaad4' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push('/cadastro')} className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105 w-full" style={{ background: 'linear-gradient(135deg, #4a1d96, #6d28d9, #3b6fd4)', color: '#fff', boxShadow: '0 8px 40px rgba(109,40,217,0.4)' }}>{t.comecarGratis}</button>
              </div>
              <div className="flex justify-center items-center">
                <svg width="460" height="460" viewBox="0 0 460 460">
                  <defs>
                    <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a78bfa"/><stop offset="50%" stopColor="#6ab0ff"/><stop offset="100%" stopColor="#34d399"/>
                    </linearGradient>
                  </defs>
                  {[0,60,120,180,240,300].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180
                    return <circle key={i} cx={230 + 60 * Math.cos(rad)} cy={230 + 60 * Math.sin(rad)} r="60" fill="none" stroke={`rgba(167,139,250,${0.12+i*0.02})`} strokeWidth="1"/>
                  })}
                  <circle cx="230" cy="230" r="60" fill="none" stroke="rgba(167,139,250,0.2)" strokeWidth="1"/>
                  <circle cx="230" cy="230" r="120" fill="none" stroke="rgba(106,176,255,0.15)" strokeWidth="1">
                    <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="40s" repeatCount="indefinite"/>
                  </circle>
                  <polygon points="230,140 310,185 310,275 230,320 150,275 150,185" fill="none" stroke="url(#g3)" strokeWidth="1.5" opacity="0.6">
                    <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="25s" repeatCount="indefinite"/>
                  </polygon>
                  <polygon points="230,110 330,280 130,280" fill="none" stroke="rgba(52,211,153,0.3)" strokeWidth="1">
                    <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="18s" repeatCount="indefinite"/>
                  </polygon>
                  <polygon points="230,350 130,180 330,180" fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth="1">
                    <animateTransform attributeName="transform" type="rotate" from="360 230 230" to="0 230 230" dur="18s" repeatCount="indefinite"/>
                  </polygon>
                  <text x="230" y="245" textAnchor="middle" fontSize="64" fontWeight="900" fill="url(#g3)" opacity="0.9">∑</text>
                  {[0,60,120,180,240,300].map((a,i) => {
                    const r2 = (a * Math.PI) / 180
                    return (
                      <circle key={i} cx={230+120*Math.cos(r2)} cy={230+120*Math.sin(r2)} r="5" fill={['#a78bfa','#6ab0ff','#34d399','#f59e0b','#f87171','#a78bfa'][i]} opacity="0.8">
                        <animate attributeName="r" values="3;6;3" dur={`${2+i*0.5}s`} repeatCount="indefinite"/>
                      </circle>
                    )
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* SLIDE 4 — Espaço / Hawking */}
          {slide === 3 && (
            <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#34d399' }}>{t.badgeEspaco}</span>
                </div>
                <h2 className="text-5xl font-black leading-tight mb-6" style={{ background: 'linear-gradient(135deg, #fff 0%, #34d399 50%, #6ab0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.tituloEspaco}</h2>
                <p className="text-base mb-8" style={{ color: '#3a6090', lineHeight: 1.8 }}>{t.subEspaco}</p>
                <div className="space-y-3 mb-8">
                  {[
                    { texto: t.espaco1, cor: '#f87171', icon: '🕳️' },
                    { texto: t.espaco2, cor: '#34d399', icon: '🌌' },
                    { texto: t.espaco3, cor: '#a78bfa', icon: '⚡' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}25` }}>
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm font-medium" style={{ color: '#8aaad4' }}>{item.texto}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push('/cadastro')} className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105 w-full" style={{ background: 'linear-gradient(135deg, #064e3b, #065f46, #34d399)', color: '#fff', boxShadow: '0 8px 40px rgba(52,211,153,0.3)' }}>{t.comecar}</button>
              </div>

              {/* Sistema solar SVG */}
              <div className="flex justify-center items-center">
                <svg width="460" height="460" viewBox="0 0 460 460">
                  <defs>
                    <radialGradient id="sun" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fbbf24"/>
                      <stop offset="40%" stopColor="#f59e0b"/>
                      <stop offset="100%" stopColor="#92400e" stopOpacity="0"/>
                    </radialGradient>
                    <radialGradient id="planet1" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#6ab0ff"/>
                      <stop offset="100%" stopColor="#1a3a8f"/>
                    </radialGradient>
                    <radialGradient id="planet2" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#34d399"/>
                      <stop offset="100%" stopColor="#064e3b"/>
                    </radialGradient>
                    <radialGradient id="planet3" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#a78bfa"/>
                      <stop offset="100%" stopColor="#4a1d96"/>
                    </radialGradient>
                    <radialGradient id="blackhole" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#000"/>
                      <stop offset="60%" stopColor="#1a0a2e"/>
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
                    </radialGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Buraco negro */}
                  <circle cx="230" cy="230" r="35" fill="url(#blackhole)"/>
                  <circle cx="230" cy="230" r="35" fill="none" stroke="rgba(167,139,250,0.6)" strokeWidth="2" filter="url(#glow)">
                    <animate attributeName="r" values="33;37;33" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="stroke-opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="230" cy="230" r="50" fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="8">
                    <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="4s" repeatCount="indefinite"/>
                  </circle>
                  <text x="230" y="235" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#a78bfa" opacity="0.8">∑</text>

                  {/* Órbitas */}
                  {[80,120,165,205].map((r,i) => (
                    <circle key={i} cx="230" cy="230" r={r} fill="none" stroke={`rgba(59,111,212,${0.12-i*0.02})`} strokeWidth="1" strokeDasharray={i%2===0?"none":"3 6"}/>
                  ))}

                  {/* Planeta 1 */}
                  <g>
                    <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="8s" repeatCount="indefinite"/>
                    <circle cx="310" cy="230" r="12" fill="url(#planet1)" filter="url(#glow)"/>
                    <text x="310" y="234" textAnchor="middle" fontSize="7" fill="#c8d8f0" fontWeight="bold">R$</text>
                  </g>

                  {/* Planeta 2 */}
                  <g>
                    <animateTransform attributeName="transform" type="rotate" from="120 230 230" to="480 230 230" dur="14s" repeatCount="indefinite"/>
                    <circle cx="395" cy="230" r="16" fill="url(#planet2)" filter="url(#glow)"/>
                    <text x="395" y="234" textAnchor="middle" fontSize="7" fill="#c8d8f0" fontWeight="bold">IA</text>
                  </g>

                  {/* Planeta 3 */}
                  <g>
                    <animateTransform attributeName="transform" type="rotate" from="240 230 230" to="600 230 230" dur="22s" repeatCount="indefinite"/>
                    <circle cx="350" cy="230" r="10" fill="url(#planet3)" filter="url(#glow)"/>
                    <text x="350" y="234" textAnchor="middle" fontSize="6" fill="#c8d8f0" fontWeight="bold">%</text>
                  </g>

                  {/* Anel de Saturno */}
                  <g>
                    <animateTransform attributeName="transform" type="rotate" from="60 230 230" to="420 230 230" dur="18s" repeatCount="indefinite"/>
                    <ellipse cx="145" cy="230" rx="18" ry="6" fill="none" stroke="rgba(245,158,11,0.5)" strokeWidth="3"/>
                    <circle cx="145" cy="230" r="9" fill="#f59e0b" opacity="0.8"/>
                    <text x="145" y="234" textAnchor="middle" fontSize="6" fill="#000" fontWeight="bold">∑</text>
                  </g>

                  {/* Estrelas cadentes no SVG */}
                  {[0,1,2].map(i => (
                    <line key={i} x1={50+i*120} y1={30+i*20} x2={80+i*120} y2={60+i*20} stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
                      <animate attributeName="opacity" values="0;0.8;0" dur={`${2+i*0.7}s`} repeatCount="indefinite" begin={`${i*0.8}s`}/>
                      <animateTransform attributeName="transform" type="translate" from="-30,-30" to="30,30" dur={`${2+i*0.7}s`} repeatCount="indefinite" begin={`${i*0.8}s`}/>
                    </line>
                  ))}

                  {/* Asteroides */}
                  {[45,135,225,315].map((a,i) => {
                    const rad = (a * Math.PI) / 180
                    return (
                      <circle key={i} cx={230+165*Math.cos(rad)} cy={230+165*Math.sin(rad)} r="3" fill={['#f59e0b','#34d399','#f87171','#6ab0ff'][i]} opacity="0.7">
                        <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${1.5+i*0.4}s`} repeatCount="indefinite"/>
                      </circle>
                    )
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* SLIDE 5 — Planos */}
          {slide === 4 && (
            <div className="max-w-6xl w-full">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#34d399' }}>{t.badgePlanos}</span>
                </div>
                <h2 className="text-5xl font-black mb-4" style={{ background: 'linear-gradient(135deg, #fff, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.tituloPlanos}</h2>
                <p className="text-base" style={{ color: '#3a6090' }}>{t.cancelar}</p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { nome: 'Starter', preco: 'R$ 49', cor: '#3b6fd4', usuarios: lang==='pt'?'1 usuário':lang==='en'?'1 user':'1 usuario', ia: false, desc: lang==='pt'?'Ideal para MEI e autônomos':lang==='en'?'Ideal for freelancers':'Ideal para autónomos' },
                  { nome: 'Pro', preco: 'R$ 97', cor: '#f59e0b', usuarios: lang==='pt'?'até 4 usuários':lang==='en'?'up to 4 users':'hasta 4 usuarios', ia: true, desc: lang==='pt'?'Para pequenas empresas':lang==='en'?'For small businesses':'Para pequeñas empresas', destaque: true },
                  { nome: 'Business', preco: 'R$ 197', cor: '#34d399', usuarios: lang==='pt'?'até 10 usuários':lang==='en'?'up to 10 users':'hasta 10 usuarios', ia: true, desc: lang==='pt'?'Empresas em crescimento':lang==='en'?'Growing companies':'Empresas en crecimiento' },
                ].map((p: any, i) => (
                  <div key={i} className="rounded-3xl p-6 text-center relative" style={{
                    background: p.destaque ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(10,22,40,0.95))' : 'rgba(10,22,40,0.8)',
                    border: p.destaque ? `2px solid ${p.cor}` : '1px solid rgba(59,111,212,0.15)',
                    boxShadow: p.destaque ? `0 0 40px ${p.cor}25` : 'none',
                    transform: p.destaque ? 'scale(1.05)' : 'scale(1)'
                  }}>
                    {p.destaque && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black" style={{ background: 'linear-gradient(135deg, #ca8a04, #ea580c)', color: '#fff' }}>{t.maisPopular}</div>
                    )}
                    <h3 className="text-xl font-black mb-1" style={{ color: p.cor }}>{p.nome}</h3>
                    <p className="text-xs mb-4" style={{ color: '#3a6090' }}>{p.desc}</p>
                    <div className="flex items-end justify-center gap-1 mb-4">
                      <span className="text-4xl font-black" style={{ color: '#c8d8f0' }}>{p.preco}</span>
                      <span className="text-sm mb-1" style={{ color: '#3a6090' }}>{lang==='pt'?'/mês':lang==='en'?'/mo':'/mes'}</span>
                    </div>
                    <p className="text-xs mb-4" style={{ color: '#3a5a8a' }}>{p.usuarios}</p>
                    {p.ia && <p className="text-xs mb-4 font-bold" style={{ color: '#fbbf24' }}>{t.iaPremium}</p>}
                    <button onClick={() => router.push('/cadastro')} className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105" style={{ background: p.destaque ? 'linear-gradient(135deg, #ca8a04, #ea580c)' : 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff' }}>{t.comecar}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Indicadores */}
        <div className="flex justify-center gap-3 pb-6">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: slide===i?32:8, height: 8, borderRadius: 4, background: slide===i?'#6ab0ff':'rgba(59,111,212,0.3)', border: 'none', transition: 'all 0.3s', cursor: 'pointer' }} />
          ))}
        </div>

        <footer className="text-center pb-4">
          <p className="text-xs" style={{ color: '#1a3a5a' }}>{t.footer}</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}