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
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
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
          if (dist < 110) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 110) * 0.12;
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
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} />;
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
      <div className="space-y-4">

        {/* Aba Empresa */}
        {aba === "empresa" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full md:max-w-2xl">
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full md:max-w-2xl">
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
                <motion.button whileHover={{ scale: 1.02, boxShadow: salvo ? "0 0 20px rgba(52,211,153,0.4)" : "0 0 20px rgba(167,139,250,0.4)" }} whileTap={{ scale: 0.98 }}
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full md:max-w-2xl">
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full md:max-w-3xl space-y-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { nome: "Starter", preco: "R$ 97", desc: `1 ${pl.usuarios} • ${pl.modulos}`, cor: "#3a5a8a", atual: false },
                { nome: "Professional", preco: "R$ 197", desc: `5 ${pl.usuarios} • ${pl.todos}`, cor: "#6ab0ff", atual: true },
                { nome: "Enterprise", preco: "R$ 497", desc: `${pl.ilimitado} • ${pl.ia}`, cor: "#a78bfa", atual: false },
              ].map((plano, i) => (
                <motion.div key={plano.nome} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <CanvasBox cor={plano.cor} corB="#34d399" corC="#fbbf24" corD="#f472b6">
                    <h4 className="font-bold mb-1" style={{ color: plano.cor }}>{plano.nome}</h4>
                    <p className="text-2xl font-black mb-2" style={{ color: "#c8d8f0", textShadow: `0 0 15px ${plano.cor}40` }}>
                      {plano.preco}<span className="text-sm font-normal" style={{ color: "#3a5a8a" }}>{pl.mes}</span>
                    </p>
                    <p className="text-xs mb-4" style={{ color: "#3a5a8a" }}>{plano.desc}</p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="w-full py-2 rounded-xl text-sm font-bold"
                      style={{ background: plano.atual ? `${plano.cor}20` : "transparent", color: plano.atual ? plano.cor : "#3a5a8a", border: `1px solid ${plano.cor}33`, boxShadow: plano.atual ? `0 0 12px ${plano.cor}30` : "none" }}>
                      {plano.atual ? pl.atual : pl.upgrade}
                    </motion.button>
                  </CanvasBox>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </ModuloLayout>
  );
}