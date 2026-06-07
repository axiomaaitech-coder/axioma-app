"use client";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import ModuloLayout from "../../../components/ModuloLayout";
import { motion } from "framer-motion";

function CanvasNeural() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2.5 + 0.5,
      color: ["#6ab0ff", "#34d399", "#a78bfa", "#f472b6", "#fbbf24"][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }));
    const chars = "AXIOMA EMPRESA CNPJ TECH AI CEO CFO 0 1 2 3 4 5 6 7 8 9 R$ %".split(" ").map((char) => ({
      char, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ["#6ab0ff", "#34d399", "#fbbf24", "#a78bfa"][Math.floor(Math.random() * 4)],
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      chars.forEach(f => {
        ctx.save(); ctx.font = `900 ${f.size}px Arial`;
        ctx.fillStyle = f.color; ctx.globalAlpha = f.opacity;
        ctx.fillText(f.char, (f.x / 100) * canvas.width, (f.y / 100) * canvas.height);
        ctx.restore(); f.y -= f.speed; if (f.y < -5) f.y = 105;
      });
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 120) * 0.12;
            ctx.strokeStyle = p.color; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
          }
        });
        ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.8 }} />;
}

function CanvasBox({ children, cor = "#6ab0ff", corB = "#34d399", corC = "#a78bfa", corD = "#f472b6" }: {
  children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: "rgba(4,10,22,0.97)", border: `1px solid ${cor}30`, boxShadow: `0 0 60px ${cor}10`,
    }}>
      <CanvasNeural />
      {[
        { pos: "top-0 left-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(90deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 left-0", w: "w-[2.5px] h-20", bg: `linear-gradient(180deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 right-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(270deg, ${corB}, transparent)`, glow: corB },
        { pos: "top-0 right-0", w: "w-[2.5px] h-20", bg: `linear-gradient(180deg, ${corB}, transparent)`, glow: corB },
        { pos: "bottom-0 left-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(90deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 left-0", w: "w-[2.5px] h-20", bg: `linear-gradient(0deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 right-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(270deg, ${corD}, transparent)`, glow: corD },
        { pos: "bottom-0 right-0", w: "w-[2.5px] h-20", bg: `linear-gradient(0deg, ${corD}, transparent)`, glow: corD },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 14px ${b.glow}`, borderRadius: "999px" }} />
      ))}
      <motion.div animate={{ left: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, #fff, ${cor}, transparent)`, boxShadow: `0 0 20px #fff, 0 0 40px ${cor}`, borderRadius: "999px" }} />
      <motion.div animate={{ right: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute bottom-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${corB}, #fff, transparent)`, boxShadow: `0 0 20px ${corB}`, borderRadius: "999px", position: "absolute" }} />
      <div className="relative z-10 p-4 md:p-6">{children}</div>
    </div>
  );
}

// Painel direito épico
function PainelDireito({ idioma }: { idioma: string }) {
  const stats = [
    { label: idioma === "pt" ? "Módulos Ativos" : idioma === "en" ? "Active Modules" : "Módulos Activos", valor: "22", cor: "#6ab0ff" },
    { label: idioma === "pt" ? "Score Financeiro" : idioma === "en" ? "Financial Score" : "Score Financiero", valor: "87/100", cor: "#34d399" },
    { label: idioma === "pt" ? "Economia Anual" : idioma === "en" ? "Annual Savings" : "Ahorro Anual", valor: "R$ 8.4K", cor: "#fbbf24" },
    { label: idioma === "pt" ? "IAs Disponíveis" : idioma === "en" ? "Available AIs" : "IAs Disponibles", valor: "2", cor: "#a78bfa" },
  ];

  const letrasAxioma = "AXIOMA".split("");

  return (
    <div className="relative rounded-2xl overflow-hidden flex flex-col gap-4 h-full" style={{ minHeight: "500px" }}>
      <CanvasNeural />

      {/* Bordas épicas */}
      {[
        { pos: "top-0 left-0", w: "w-32 h-[3px]", bg: "linear-gradient(90deg, #6ab0ff, transparent)", glow: "#6ab0ff" },
        { pos: "top-0 left-0", w: "w-[3px] h-32", bg: "linear-gradient(180deg, #6ab0ff, transparent)", glow: "#6ab0ff" },
        { pos: "top-0 right-0", w: "w-32 h-[3px]", bg: "linear-gradient(270deg, #34d399, transparent)", glow: "#34d399" },
        { pos: "top-0 right-0", w: "w-[3px] h-32", bg: "linear-gradient(180deg, #34d399, transparent)", glow: "#34d399" },
        { pos: "bottom-0 left-0", w: "w-32 h-[3px]", bg: "linear-gradient(90deg, #a78bfa, transparent)", glow: "#a78bfa" },
        { pos: "bottom-0 left-0", w: "w-[3px] h-32", bg: "linear-gradient(0deg, #a78bfa, transparent)", glow: "#a78bfa" },
        { pos: "bottom-0 right-0", w: "w-32 h-[3px]", bg: "linear-gradient(270deg, #f472b6, transparent)", glow: "#f472b6" },
        { pos: "bottom-0 right-0", w: "w-[3px] h-32", bg: "linear-gradient(0deg, #f472b6, transparent)", glow: "#f472b6" },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 20px ${b.glow}`, borderRadius: "999px" }} />
      ))}

      {/* Partículas correndo nas bordas */}
      <motion.div animate={{ left: ["-5%", "105%", "-5%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-[3px] w-32 z-20 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, #fff, #6ab0ff, transparent)", boxShadow: "0 0 24px #fff, 0 0 48px #6ab0ff", borderRadius: "999px" }} />
      <motion.div animate={{ right: ["-5%", "105%", "-5%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 h-[3px] w-32 z-20 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, #34d399, #fff, transparent)", boxShadow: "0 0 24px #34d399", borderRadius: "999px", position: "absolute" }} />
      <motion.div animate={{ top: ["-5%", "105%", "-5%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute left-0 w-[3px] h-20 z-20 pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent, #a78bfa, #fff, transparent)", boxShadow: "0 0 24px #a78bfa", borderRadius: "999px" }} />
      <motion.div animate={{ bottom: ["-5%", "105%", "-5%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute right-0 w-[3px] h-20 z-20 pointer-events-none"
        style={{ background: "linear-gradient(0deg, transparent, #f472b6, #fff, transparent)", boxShadow: "0 0 24px #f472b6", borderRadius: "999px", position: "absolute" }} />

      {/* Conteúdo */}
      <div className="relative z-10 p-6 md:p-8 flex flex-col items-center justify-center h-full gap-8">

        {/* Nome AXIOMA letra por letra */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {letrasAxioma.map((letra, i) => (
              <motion.span
                key={i}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  y: [0, -4, 0],
                  textShadow: [
                    `0 0 10px #6ab0ff`,
                    `0 0 30px #6ab0ff, 0 0 60px #6ab0ff`,
                    `0 0 10px #6ab0ff`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                className="text-4xl md:text-5xl font-black"
                style={{ color: "#6ab0ff" }}
              >
                {letra}
              </motion.span>
            ))}
          </div>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-black tracking-[0.4em] uppercase"
            style={{ color: "#34d399", textShadow: "0 0 20px #34d399" }}
          >
            AI.TECH
          </motion.p>
        </div>

        {/* Spinner épico */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-2"
            style={{ borderColor: "#6ab0ff", borderTopColor: "transparent", borderRightColor: "#34d399" }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute w-16 h-16 rounded-full border-2"
            style={{ borderColor: "#a78bfa", borderTopColor: "transparent", borderLeftColor: "#f472b6" }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-8 h-8 rounded-full"
            style={{ background: "radial-gradient(circle, #6ab0ff, transparent)", boxShadow: "0 0 20px #6ab0ff" }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="rounded-xl p-3 text-center"
              style={{ background: `${stat.cor}10`, border: `1px solid ${stat.cor}30` }}
            >
              <motion.p
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
                className="text-xl font-black mb-1"
                style={{ color: stat.cor, textShadow: `0 0 15px ${stat.cor}60` }}
              >
                {stat.valor}
              </motion.p>
              <p className="text-xs" style={{ color: "#3a5a8a" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-xs text-center font-semibold tracking-wider"
          style={{ color: "#3a5a8a" }}
        >
          {idioma === "pt" ? "Inteligência financeira para PMEs brasileiras"
            : idioma === "en" ? "Financial intelligence for Brazilian SMEs"
            : "Inteligencia financiera para PyMEs brasileñas"}
        </motion.p>
      </div>
    </div>
  );
}

const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" };

export default function Empresa() {
  const { t, idioma } = useLanguage();
  const [aba, setAba] = useState("empresa");
  const [salvo, setSalvo] = useState(false);
  const [notificacoes, setNotificacoes] = useState({ email: true, sms: false, alertas: true, relatorio: true });

  const salvar = () => { setSalvo(true); setTimeout(() => setSalvo(false), 2000); };

  const camposEmpresa = {
    pt: [
      { label: "Razão Social", value: "Axioma AI Tech Ltda" },
      { label: "CNPJ", value: "12.345.678/0001-90" },
      { label: "Regime Tributário", value: "Simples Nacional" },
      { label: "Setor", value: "Tecnologia / SaaS" },
      { label: "Cidade", value: "São Paulo - SP" },
    ],
    en: [
      { label: "Company Name", value: "Axioma AI Tech Ltda" },
      { label: "Tax ID", value: "12.345.678/0001-90" },
      { label: "Tax Regime", value: "Simples Nacional" },
      { label: "Sector", value: "Technology / SaaS" },
      { label: "City", value: "São Paulo - SP" },
    ],
    es: [
      { label: "Razón Social", value: "Axioma AI Tech Ltda" },
      { label: "RUT / NIF", value: "12.345.678/0001-90" },
      { label: "Régimen Tributario", value: "Simples Nacional" },
      { label: "Sector", value: "Tecnología / SaaS" },
      { label: "Ciudad", value: "São Paulo - SP" },
    ],
  };

  const camposPerfil = {
    pt: [
      { label: "Nome completo", value: "Elias Tavares" },
      { label: "E-mail", value: "elias@axiomaaitech.com.br" },
      { label: "Cargo", value: "CEO / Fundador" },
      { label: "Telefone", value: "(11) 99999-0000" },
    ],
    en: [
      { label: "Full name", value: "Elias Tavares" },
      { label: "E-mail", value: "elias@axiomaaitech.com.br" },
      { label: "Role", value: "CEO / Founder" },
      { label: "Phone", value: "(11) 99999-0000" },
    ],
    es: [
      { label: "Nombre completo", value: "Elias Tavares" },
      { label: "Correo electrónico", value: "elias@axiomaaitech.com.br" },
      { label: "Cargo", value: "CEO / Fundador" },
      { label: "Teléfono", value: "(11) 99999-0000" },
    ],
  };

  const notificacoesLabels = {
    pt: [
      { key: "email", label: "Notificações por e-mail" },
      { key: "sms", label: "Notificações por SMS" },
      { key: "alertas", label: "Alertas financeiros da IA" },
      { key: "relatorio", label: "Relatório semanal automático" },
    ],
    en: [
      { key: "email", label: "Email notifications" },
      { key: "sms", label: "SMS notifications" },
      { key: "alertas", label: "AI financial alerts" },
      { key: "relatorio", label: "Automatic weekly report" },
    ],
    es: [
      { key: "email", label: "Notificaciones por correo" },
      { key: "sms", label: "Notificaciones por SMS" },
      { key: "alertas", label: "Alertas financieros de IA" },
      { key: "relatorio", label: "Informe semanal automático" },
    ],
  };

  const pl = {
    pt: { atual: "Plano atual", upgrade: "Fazer upgrade", mes: "/mês", usuarios: "usuários", modulos: "Módulos básicos", todos: "Todos os módulos", ia: "IA Tributária inclusa", ilimitado: "Ilimitado" },
    en: { atual: "Current plan", upgrade: "Upgrade", mes: "/month", usuarios: "users", modulos: "Basic modules", todos: "All modules", ia: "Tax AI included", ilimitado: "Unlimited" },
    es: { atual: "Plan actual", upgrade: "Actualizar", mes: "/mes", usuarios: "usuarios", modulos: "Módulos básicos", todos: "Todos los módulos", ia: "IA Tributaria incluida", ilimitado: "Ilimitado" },
  }[idioma];

  const abas = [
    { key: "empresa", label: t.empresa.abaEmpresa },
    { key: "perfil", label: t.empresa.abaPerfil },
    { key: "notificacoes", label: t.empresa.abaNotificacoes },
    { key: "plano", label: t.empresa.abaPlano },
  ];

  const botaoAbas = (
    <div className="flex gap-2 flex-wrap">
      {abas.map((a) => (
        <motion.button key={a.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          onClick={() => setAba(a.key)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: aba === a.key ? "rgba(106,176,255,0.2)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.15)"}`, boxShadow: aba === a.key ? "0 0 12px rgba(106,176,255,0.2)" : "none" }}>
          {a.label}
        </motion.button>
      ))}
    </div>
  );

  return (
    <ModuloLayout titulo={t.empresa.titulo} subtitulo={t.empresa.subtitulo} botaoExtra={botaoAbas}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Coluna esquerda — formulários */}
        <div>
          {/* Aba Empresa */}
          {aba === "empresa" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#fbbf24">
                <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                  className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
                  AXIOMA AI.TECH
                </motion.p>
                <h3 className="text-lg font-bold mb-6" style={{ color: "#c8d8f0" }}>{t.empresa.dadosEmpresa}</h3>
                <div className="space-y-4">
                  {camposEmpresa[idioma].map((campo, i) => (
                    <motion.div key={campo.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
                      <input defaultValue={campo.value} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
                    </motion.div>
                  ))}
                  <motion.button whileHover={{ scale: 1.02, boxShadow: salvo ? "0 0 20px rgba(52,211,153,0.4)" : "0 0 20px rgba(106,176,255,0.4)" }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} className="w-full py-4 rounded-xl font-bold mt-4"
                    style={{ background: salvo ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: salvo ? "#34d399" : "#fff", border: salvo ? "1px solid rgba(52,211,153,0.3)" : "none" }}>
                    {salvo ? "✅ " + t.geral.salvo : t.geral.salvar}
                  </motion.button>
                </div>
              </CanvasBox>
            </motion.div>
          )}

          {/* Aba Perfil */}
          {aba === "perfil" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <CanvasBox cor="#a78bfa" corB="#6ab0ff" corC="#34d399" corD="#f472b6">
                <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                  className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#a78bfa", textShadow: "0 0 20px #a78bfa" }}>
                  AXIOMA AI.TECH
                </motion.p>
                <div className="flex items-center gap-4 mb-8">
                  <motion.div whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff", boxShadow: "0 0 20px rgba(106,176,255,0.4)" }}>
                    E
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>Elias Tavares</h3>
                    <p className="text-sm" style={{ color: "#3a5a8a" }}>CEO / {idioma === "pt" ? "Fundador" : idioma === "en" ? "Founder" : "Fundador"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {camposPerfil[idioma].map((campo, i) => (
                    <motion.div key={campo.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
                      <input defaultValue={campo.value} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
                    </motion.div>
                  ))}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} className="w-full py-4 rounded-xl font-bold mt-4"
                    style={{ background: salvo ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg, #4c1d95, #7c3aed)", color: salvo ? "#34d399" : "#fff", border: salvo ? "1px solid rgba(52,211,153,0.3)" : "none" }}>
                    {salvo ? "✅ " + t.geral.salvo : t.geral.salvar}
                  </motion.button>
                </div>
              </CanvasBox>
            </motion.div>
          )}

          {/* Aba Notificações */}
          {aba === "notificacoes" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
                <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                  className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#34d399", textShadow: "0 0 20px #34d399" }}>
                  AXIOMA AI.TECH
                </motion.p>
                <h3 className="text-lg font-bold mb-6" style={{ color: "#c8d8f0" }}>{t.empresa.abaNotificacoes}</h3>
                <div className="space-y-3">
                  {notificacoesLabels[idioma].map((n, i) => (
                    <motion.div key={n.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,111,212,0.1)" }}>
                      <span className="text-sm" style={{ color: "#c8d8f0" }}>{n.label}</span>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => setNotificacoes({ ...notificacoes, [n.key]: !notificacoes[n.key as keyof typeof notificacoes] })}
                        className="w-12 h-6 rounded-full relative flex-shrink-0"
                        style={{ background: notificacoes[n.key as keyof typeof notificacoes] ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.1)", boxShadow: notificacoes[n.key as keyof typeof notificacoes] ? "0 0 12px rgba(52,211,153,0.4)" : "none" }}>
                        <motion.div animate={{ left: notificacoes[n.key as keyof typeof notificacoes] ? "26px" : "2px" }}
                          transition={{ duration: 0.2 }}
                          className="w-5 h-5 rounded-full absolute top-0.5"
                          style={{ background: notificacoes[n.key as keyof typeof notificacoes] ? "#34d399" : "#3a5a8a" }} />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </CanvasBox>
            </motion.div>
          )}

          {/* Aba Plano */}
          {aba === "plano" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <CanvasBox cor="#6ab0ff" corB="#a78bfa" corC="#34d399" corD="#fbbf24">
                <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                  className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
                  AXIOMA AI.TECH
                </motion.p>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#6ab0ff" }}>{t.empresa.planoAtual}</span>
                    <h3 className="text-2xl font-black mt-1" style={{ color: "#c8d8f0" }}>Professional</h3>
                    <p className="text-sm mt-1" style={{ color: "#3a5a8a" }}>5 {pl.usuarios} • {pl.todos} • IA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black" style={{ color: "#6ab0ff", textShadow: "0 0 20px rgba(106,176,255,0.6)" }}>R$ 197</p>
                    <p className="text-sm" style={{ color: "#3a5a8a" }}>{pl.mes}</p>
                  </div>
                </div>
              </CanvasBox>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { nome: "Starter", preco: "R$ 97", desc: `1 ${pl.usuarios}`, cor: "#6ab0ff", atual: false },
                  { nome: "Professional", preco: "R$ 197", desc: `5 ${pl.usuarios}`, cor: "#fbbf24", atual: true },
                  { nome: "Enterprise", preco: "R$ 497", desc: `${pl.ilimitado}`, cor: "#a78bfa", atual: false },
                ].map((plano, i) => (
                  <motion.div key={plano.nome} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <CanvasBox cor={plano.cor} corB="#34d399" corC="#6ab0ff" corD="#f472b6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm" style={{ color: plano.cor }}>{plano.nome}</p>
                          <p className="text-xs" style={{ color: "#3a5a8a" }}>{plano.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-black" style={{ color: "#c8d8f0" }}>{plano.preco}<span className="text-xs font-normal" style={{ color: "#3a5a8a" }}>{pl.mes}</span></p>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold"
                            style={{ background: plano.atual ? `${plano.cor}20` : "transparent", color: plano.atual ? plano.cor : "#3a5a8a", border: `1px solid ${plano.cor}33` }}>
                            {plano.atual ? pl.atual : pl.upgrade}
                          </motion.button>
                        </div>
                      </div>
                    </CanvasBox>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Coluna direita — painel épico fixo */}
        <div className="hidden lg:block">
          <PainelDireito idioma={idioma} />
        </div>
      </div>
    </ModuloLayout>
  );
}