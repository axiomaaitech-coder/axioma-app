'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [interface_, setInterface_] = useState(0)
  const [fade, setFade] = useState(true)

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = 'AXIOMA∑∫∂∇√π∞≈≡±∓∗∝∈∉∩∪⊂⊃⊄⊅⊆⊇01アイウエオカキクケコサシスセソ数学真理'
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(1)

    const colors = ['#3b6fd4', '#6ab0ff', '#34d399', '#a78bfa', '#ffffff']

    function draw() {
      ctx!.fillStyle = 'rgba(2, 8, 16, 0.05)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const color = colors[Math.floor(Math.random() * colors.length)]
        ctx!.fillStyle = color
        ctx!.font = `${fontSize}px monospace`
        ctx!.globalAlpha = Math.random() * 0.8 + 0.2
        ctx!.fillText(char, i * fontSize, y * fontSize)
        ctx!.globalAlpha = 1

        if (y * fontSize > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      })
    }

    const interval = setInterval(draw, 35)

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Alternar interfaces a cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setInterface_(prev => (prev + 1) % 2)
        setFade(true)
      }, 600)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#020810" }}>

      {/* Canvas Matrix */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ opacity: 0.4 }} />

      {/* Glow orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,111,212,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '50%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: 600, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      {/* Grid 3D */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(59,111,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,111,212,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        transform: 'perspective(800px) rotateX(20deg)',
        transformOrigin: 'center top',
      }} />

      {/* Conteúdo principal */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <header className="flex justify-between items-center px-12 py-8">
          <div className="flex items-center gap-4">
            <div style={{ filter: 'drop-shadow(0 0 20px rgba(106,176,255,0.8))' }}>
              <img src="/logo-aitech.png" alt="Axioma" style={{ width: 50, height: 50, objectFit: 'contain' }} />
            </div>
            <div>
              <h1 className="font-black tracking-[0.3em] text-xl" style={{
                background: 'linear-gradient(135deg, #c8d8f0 0%, #6ab0ff 40%, #ffffff 60%, #3b6fd4 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>AXIOMA</h1>
              <p className="text-xs tracking-[0.4em]" style={{ color: '#3a5a8a' }}>AI.TECH</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2.5 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105"
              style={{ background: 'transparent', color: '#6ab0ff', border: '1px solid rgba(106,176,255,0.3)' }}
            >
              Login
            </button>
            <button
              onClick={() => router.push('/cadastro')}
              className="px-6 py-2.5 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', boxShadow: '0 4px 20px rgba(42,95,212,0.4)' }}
            >
              Começar Grátis
            </button>
          </div>
        </header>

        {/* Interface alternante */}
        <div className="flex-1 flex items-center justify-center px-12" style={{
          opacity: fade ? 1 : 0,
          transition: 'opacity 0.6s ease'
        }}>

          {/* Interface 1 — Hero principal */}
          {interface_ === 0 && (
            <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{
                  background: 'rgba(59,111,212,0.1)',
                  border: '1px solid rgba(59,111,212,0.3)'
                }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34d399' }} />
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#6ab0ff' }}>INTELIGÊNCIA FINANCEIRA COM IA</span>
                </div>

                <h2 className="text-6xl font-black leading-tight mb-6" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #c8d8f0 40%, #6ab0ff 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  A verdade<br />financeira do<br />seu negócio.
                </h2>

                <p className="text-lg mb-4" style={{ color: '#3a6090', lineHeight: 1.8 }}>
                  Um axioma é uma verdade absoluta, a base de tudo.<br />
                  O <span style={{ color: '#6ab0ff', fontWeight: 'bold' }}>Axioma AI.Tech</span> transforma dados financeiros<br />
                  em verdades que impulsionam seu crescimento.
                </p>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => router.push('/cadastro')}
                    className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', boxShadow: '0 8px 40px rgba(42,95,212,0.5)' }}
                  >
                    🚀 Começar Agora
                  </button>
                  <button
                    onClick={() => router.push('/planos')}
                    className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105"
                    style={{ background: 'transparent', color: '#6ab0ff', border: '1px solid rgba(106,176,255,0.3)' }}
                  >
                    Ver Planos
                  </button>
                </div>

                {/* Stats */}
                <div className="flex gap-8 mt-12">
                  {[
                    { valor: '13+', label: 'Módulos' },
                    { valor: '3', label: 'Idiomas' },
                    { valor: '2', label: 'IAs Integradas' },
                  ].map((s, i) => (
                    <div key={i}>
                      <p className="text-3xl font-black" style={{ color: '#6ab0ff' }}>{s.valor}</p>
                      <p className="text-xs" style={{ color: '#3a6090' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard preview */}
              <div className="relative">
                <div style={{
                  background: 'rgba(10,22,40,0.9)',
                  border: '1px solid rgba(59,111,212,0.3)',
                  borderRadius: 24,
                  padding: 24,
                  boxShadow: '0 0 80px rgba(59,111,212,0.2), 0 40px 80px rgba(0,0,0,0.5)',
                  transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)',
                }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#f87171' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#34d399' }} />
                    <span className="text-xs ml-2" style={{ color: '#3a5a8a' }}>axioma-app.vercel.app/dashboard</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { label: 'Faturamento', valor: 'R$ 48.500', cor: '#34d399' },
                      { label: 'Lucro Líquido', valor: 'R$ 18.200', cor: '#6ab0ff' },
                      { label: 'Custos Totais', valor: 'R$ 30.300', cor: '#f87171' },
                      { label: 'Score', valor: '87/100', cor: '#f59e0b' },
                    ].map((card, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(2,8,16,0.6)', border: '1px solid rgba(59,111,212,0.1)' }}>
                        <p className="text-xs mb-1" style={{ color: '#3a5a8a' }}>{card.label}</p>
                        <p className="text-lg font-black" style={{ color: card.cor }}>{card.valor}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(2,8,16,0.6)', border: '1px solid rgba(59,111,212,0.1)' }}>
                    <p className="text-xs mb-2" style={{ color: '#3a5a8a' }}>Receitas vs Custos — 2026</p>
                    <div className="flex items-end gap-1 h-16">
                      {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{
                          height: `${h}%`,
                          background: i % 2 === 0
                            ? 'linear-gradient(180deg, #3b6fd4, rgba(59,111,212,0.3))'
                            : 'linear-gradient(180deg, #34d399, rgba(52,211,153,0.3))'
                        }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 px-3 py-2 rounded-xl" style={{
                  background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(249,115,22,0.2))',
                  border: '1px solid rgba(234,179,8,0.4)',
                  boxShadow: '0 0 20px rgba(234,179,8,0.2)'
                }}>
                  <p className="text-xs font-black" style={{ color: '#fbbf24' }}>⭐ IA Tributária</p>
                  <p className="text-xs" style={{ color: '#f97316' }}>PREMIUM</p>
                </div>
                <div className="absolute -bottom-4 -left-4 px-3 py-2 rounded-xl" style={{
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.3)',
                }}>
                  <p className="text-xs font-black" style={{ color: '#34d399' }}>🧠 IA Financeira</p>
                  <p className="text-xs" style={{ color: '#3a6090' }}>Análise em tempo real</p>
                </div>
              </div>
            </div>
          )}

          {/* Interface 2 — Axioma matemático */}
          {interface_ === 1 && (
            <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">

              {/* Símbolo matemático 3D */}
              <div className="flex justify-center items-center relative">
                <div style={{ position: 'relative', width: 400, height: 400 }}>

                  {/* Círculos orbitais */}
                  {[300, 340, 380].map((size, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      width: size, height: size,
                      marginTop: -size / 2, marginLeft: -size / 2,
                      borderRadius: '50%',
                      border: `1px solid rgba(${i === 0 ? '59,111,212' : i === 1 ? '167,139,250' : '52,211,153'},${0.3 - i * 0.08})`,
                      animation: `spin ${8 + i * 4}s linear infinite`,
                    }} />
                  ))}

                  {/* Símbolo central */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: 120,
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #3b6fd4, #6ab0ff, #a78bfa, #34d399)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 30px rgba(106,176,255,0.5))',
                      lineHeight: 1,
                    }}>∑</div>
                    <p style={{ color: '#3a5a8a', fontSize: 11, letterSpacing: '0.3em', marginTop: 8 }}>AXIOMA</p>
                  </div>

                  {/* Pontos orbitais */}
                  {[
                    { angle: 0, color: '#3b6fd4', label: 'Receitas' },
                    { angle: 60, color: '#34d399', label: 'Lucro' },
                    { angle: 120, color: '#a78bfa', label: 'IA' },
                    { angle: 180, color: '#f59e0b', label: 'Metas' },
                    { angle: 240, color: '#f87171', label: 'Custos' },
                    { angle: 300, color: '#6ab0ff', label: 'Fluxo' },
                  ].map((p, i) => {
                    const rad = (p.angle * Math.PI) / 180
                    const r = 170
                    const x = 200 + r * Math.cos(rad)
                    const y = 200 + r * Math.sin(rad)
                    return (
                      <div key={i} style={{ position: 'absolute', left: x - 20, top: y - 20, textAlign: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${p.color}20`, border: `1px solid ${p.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, boxShadow: `0 0 10px ${p.color}` }} />
                        </div>
                        <p style={{ fontSize: 9, color: p.color, marginTop: 4, fontWeight: 'bold', letterSpacing: '0.1em' }}>{p.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{
                  background: 'rgba(167,139,250,0.1)',
                  border: '1px solid rgba(167,139,250,0.3)'
                }}>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#a78bfa' }}>∑ A MATEMÁTICA DO SEU SUCESSO</span>
                </div>

                <h2 className="text-5xl font-black leading-tight mb-6" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #6ab0ff 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  Axioma:<br />verdades que<br />não precisam<br />de prova.
                </h2>

                <p className="text-base mb-8" style={{ color: '#3a6090', lineHeight: 1.8 }}>
                  Na matemática, um axioma é a base irrefutável de toda teoria.<br />
                  No seu negócio, são os <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>dados financeiros reais</span><br />
                  que guiam cada decisão com precisão absoluta.
                </p>

                <div className="space-y-3">
                  {[
                    { icon: '🧮', texto: 'Gestão financeira completa com 13+ módulos', cor: '#3b6fd4' },
                    { icon: '🤖', texto: 'IA Financeira e IA Tributária integradas', cor: '#a78bfa' },
                    { icon: '🌍', texto: 'Multi-idioma: Português, Inglês e Espanhol', cor: '#34d399' },
                    { icon: '🔒', texto: 'Segurança com RLS e autenticação avançada', cor: '#f59e0b' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{
                      background: `${item.cor}08`,
                      border: `1px solid ${item.cor}20`
                    }}>
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm font-medium" style={{ color: '#8aaad4' }}>{item.texto}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push('/cadastro')}
                  className="mt-8 px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105 w-full"
                  style={{ background: 'linear-gradient(135deg, #4a1d96, #6d28d9, #3b6fd4)', color: '#fff', boxShadow: '0 8px 40px rgba(109,40,217,0.4)' }}
                >
                  🚀 Começar Gratuitamente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Indicadores de interface */}
        <div className="flex justify-center gap-3 pb-8">
          {[0, 1].map(i => (
            <button key={i} onClick={() => { setFade(false); setTimeout(() => { setInterface_(i); setFade(true) }, 300) }}
              style={{
                width: interface_ === i ? 32 : 8,
                height: 8,
                borderRadius: 4,
                background: interface_ === i ? '#6ab0ff' : 'rgba(59,111,212,0.3)',
                border: 'none',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center pb-6">
          <p className="text-xs" style={{ color: '#1a3a5a' }}>
            © 2026 Axioma AI.Tech — Inteligência Financeira para PMEs
          </p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}