"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../lib/LanguageContext";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Bell, AlertTriangle, Zap, Shield, Target, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function CanvasEpico() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.3,
      color: ["#6ab0ff", "#34d399", "#a78bfa", "#f472b6", "#fbbf24"][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.5 + 0.1,
    }));
    const chars = "AXIOMA AI TECH R$ % DRE ROI 0 1 2 3 4 5 6 7 8 9 PME SAAS".split(" ").map(c => ({
      char: c, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 24 + 12, opacity: Math.random() * 0.04 + 0.01,
      speed: Math.random() * 0.2 + 0.05,
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
            ctx.save(); ctx.globalAlpha = (1 - dist / 120) * 0.08;
            ctx.strokeStyle = p.color; ctx.lineWidth = 0.4;
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

function CanvasBox({ children, cor = "#6ab0ff", corB = "#34d399", corC = "#a78bfa", corD = "#f472b6", className = "" }: {
  children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string; className?: string;
}) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{
      background: "rgba(4,10,22,0.97)", border: `1px solid ${cor}30`, boxShadow: `0 0 40px ${cor}08`,
    }}>
      <CanvasEpico />
      {[
        { pos: "top-0 left-0", w: "w-16 h-[2px]", bg: `linear-gradient(90deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 left-0", w: "w-[2px] h-16", bg: `linear-gradient(180deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 right-0", w: "w-16 h-[2px]", bg: `linear-gradient(270deg, ${corB}, transparent)`, glow: corB },
        { pos: "top-0 right-0", w: "w-[2px] h-16", bg: `linear-gradient(180deg, ${corB}, transparent)`, glow: corB },
        { pos: "bottom-0 left-0", w: "w-16 h-[2px]", bg: `linear-gradient(90deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 left-0", w: "w-[2px] h-16", bg: `linear-gradient(0deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 right-0", w: "w-16 h-[2px]", bg: `linear-gradient(270deg, ${corD}, transparent)`, glow: corD },
        { pos: "bottom-0 right-0", w: "w-[2px] h-16", bg: `linear-gradient(0deg, ${corD}, transparent)`, glow: corD },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 12px ${b.glow}`, borderRadius: "999px" }} />
      ))}
      <motion.div animate={{ left: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-[2px] w-20 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, #fff, ${cor}, transparent)`, boxShadow: `0 0 16px #fff, 0 0 32px ${cor}`, borderRadius: "999px" }} />
      <motion.div animate={{ right: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute bottom-0 h-[2px] w-20 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${corB}, #fff, transparent)`, boxShadow: `0 0 16px ${corB}`, borderRadius: "999px", position: "absolute" }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Score circular épico
function ScoreCircular({ score }: { score: number }) {
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cor = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="rotate-[-90deg]">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(59,111,212,0.1)" strokeWidth="8" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke={cor} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${cor})` }} />
      </svg>
      <div className="absolute text-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-xl font-black" style={{ color: cor, textShadow: `0 0 20px ${cor}` }}>{score}</motion.p>
        <p className="text-xs" style={{ color: "#3a5a8a" }}>/100</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { t, idioma } = useLanguage();
  const d = t.dashboard;

  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [inicialUsuario, setInicialUsuario] = useState("U");
  const [receitas, setReceitas] = useState(0);
  const [custosFixos, setCustosFixos] = useState(0);
  const [custosVariaveis, setCustosVariaveis] = useState(0);
  const [dividas, setDividas] = useState(0);
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    carregarDados();
    const timer = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nomeCompleto = user.user_metadata?.nome || user.user_metadata?.full_name || "";
    const emailPrefix = user.email?.split("@")[0] || "";
    const nome = nomeCompleto || emailPrefix;
    const primeiroNome = nome.split(" ")[0] || nome;
    setNomeUsuario(primeiroNome);
    setInicialUsuario(primeiroNome.charAt(0).toUpperCase() || "U");

    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();
    const inicioMes = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-01`;
    const fimMes = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-31`;

    const { data: rec } = await supabase.from("receitas").select("valor").eq("user_id", user.id).gte("data", inicioMes).lte("data", fimMes);
    const totalReceitas = rec?.reduce((s, r) => s + (r.valor || 0), 0) || 0;
    setReceitas(totalReceitas);

    const { data: cf } = await supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id);
    const totalFixos = cf?.reduce((s, r) => s + (r.valor_mensal || 0), 0) || 0;
    setCustosFixos(totalFixos);

    const { data: cv } = await supabase.from("custos_variaveis").select("valor").eq("user_id", user.id).gte("data", inicioMes).lte("data", fimMes);
    const totalVariaveis = cv?.reduce((s, r) => s + (r.valor || 0), 0) || 0;
    setCustosVariaveis(totalVariaveis);

    const { data: div } = await supabase.from("dividas").select("valor_total").eq("user_id", user.id);
    const totalDividas = div?.reduce((s, r) => s + (r.valor_total || 0), 0) || 0;
    setDividas(totalDividas);

    const nomesMeses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(); dt.setMonth(dt.getMonth() - i);
      const m = dt.getMonth() + 1; const a = dt.getFullYear();
      const inicio = `${a}-${String(m).padStart(2, "0")}-01`;
      const fim = `${a}-${String(m).padStart(2, "0")}-31`;
      const { data: rMes } = await supabase.from("receitas").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);
      const { data: cMes } = await supabase.from("custos_variaveis").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);
      const rTotal = rMes?.reduce((s, r) => s + (r.valor || 0), 0) || 0;
      const cTotal = (cMes?.reduce((s, r) => s + (r.valor || 0), 0) || 0) + totalFixos;
      meses.push({ mes: nomesMeses[m - 1], receita: rTotal, custos: cTotal, lucro: rTotal - cTotal });
    }
    setDadosGrafico(meses);
    setLoading(false);
  }

  const lucro = receitas - custosFixos - custosVariaveis;
  const margemContribuicao = receitas - custosVariaveis;
  const margemPerc = receitas > 0 ? ((margemContribuicao / receitas) * 100).toFixed(1) : "0";
  const pontoEquilibrio = margemContribuicao > 0 ? (custosFixos / (margemContribuicao / (receitas || 1))) : 0;
  const capitalGiro = receitas - custosFixos - custosVariaveis;
  const indiceEndividamento = receitas > 0 ? ((dividas / receitas) * 100).toFixed(1) : "0";
  const score = Math.min(100, Math.max(0, Math.round(50 + (lucro / (receitas || 1)) * 100)));
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const saudacao = () => {
    const h = hora.getHours();
    if (h < 12) return idioma === "pt" ? "Bom dia" : idioma === "en" ? "Good morning" : "Buenos días";
    if (h < 18) return idioma === "pt" ? "Boa tarde" : idioma === "en" ? "Good afternoon" : "Buenas tardes";
    return idioma === "pt" ? "Boa noite" : idioma === "en" ? "Good evening" : "Buenas noches";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#020810" }}>
      <CanvasEpico />
      <div className="relative z-10 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-2 mx-auto mb-4"
          style={{ borderColor: "#6ab0ff", borderTopColor: "transparent", borderRightColor: "#34d399" }} />
        <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: "#6ab0ff" }}>
          AXIOMA AI.TECH
        </motion.p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-6 overflow-auto space-y-4" style={{ background: "#020810" }}>

      {/* Banner IA Tributária */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        onClick={() => router.push("/ia-tributaria")}
        whileHover={{ scale: 1.01 }}>
        <CanvasEpico />
        <div className="relative z-10 flex items-center gap-3 px-5 py-3"
          style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.1), rgba(251,146,60,0.1))", border: "1px solid rgba(234,179,8,0.3)" }}>
          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-xl">⭐</motion.span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: "#fbbf24", textShadow: "0 0 20px #fbbf24" }}>
              {idioma === "pt" ? "IA Tributária Premium" : idioma === "en" ? "Tax AI Premium" : "IA Tributaria Premium"}
            </p>
            <p className="text-xs hidden md:block truncate" style={{ color: "#f97316" }}>
              {idioma === "pt" ? "Reduza impostos com inteligência artificial — clique para ativar" : idioma === "en" ? "Reduce taxes with AI — click to activate" : "Reduzca impuestos con IA"}
            </p>
          </div>
          <motion.span whileHover={{ scale: 1.05 }}
            className="text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #ca8a04, #ea580c)", color: "#fff", boxShadow: "0 0 20px rgba(234,179,8,0.4)" }}>
            PREMIUM
          </motion.span>
        </div>
      </motion.div>

      {/* Header épico */}
      <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#fbbf24">
        <div className="flex justify-between items-center p-4 md:p-5">
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div whileHover={{ scale: 1.1 }} style={{ filter: "drop-shadow(0 0 20px rgba(106,176,255,0.6))" }}>
              <Image src="/logo-aitech.png" alt="Axioma" width={44} height={44} className="object-contain" />
            </motion.div>
            <div>
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase hidden md:block"
                style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
                AXIOMA AI.TECH
              </motion.p>
              <h2 className="text-lg md:text-2xl font-black" style={{ color: "#c8d8f0" }}>
                {saudacao()}, <span style={{ color: "#6ab0ff", textShadow: "0 0 20px rgba(106,176,255,0.6)" }}>{nomeUsuario}</span> 👋
              </h2>
              <p className="text-xs hidden md:block" style={{ color: "#3a5a8a" }}>
                {hora.toLocaleDateString(idioma === "en" ? "en-US" : "pt-BR", { weekday: "long", day: "numeric", month: "long" })} · {hora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} className="relative cursor-pointer p-2 rounded-xl" style={{ background: "rgba(106,176,255,0.1)", border: "1px solid rgba(106,176,255,0.2)" }}>
              <Bell size={18} style={{ color: "#6ab0ff" }} />
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#f87171", boxShadow: "0 0 8px #f87171" }} />
            </motion.div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(106,176,255,0.1)", border: "1px solid rgba(106,176,255,0.2)" }}>
              <motion.div whileHover={{ scale: 1.1 }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black"
                style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff", boxShadow: "0 0 12px rgba(106,176,255,0.4)" }}>
                {inicialUsuario}
              </motion.div>
              <span className="text-sm hidden md:block font-semibold" style={{ color: "#c8d8f0" }}>{nomeUsuario}</span>
            </div>
          </div>
        </div>
      </CanvasBox>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: d.faturamento, value: fmt(receitas), change: d.mesAtual, up: true, icon: TrendingUp, cor: "#6ab0ff" },
          { label: d.custos, value: fmt(custosFixos + custosVariaveis), change: d.fixosVariaveis, up: false, icon: TrendingDown, cor: "#f87171" },
          { label: d.lucro, value: fmt(lucro), change: lucro >= 0 ? d.positivo : d.negativo, up: lucro >= 0, icon: DollarSign, cor: lucro >= 0 ? "#34d399" : "#f87171" },
          { label: d.score, value: `${score}/100`, change: score >= 70 ? d.bomScore : d.atencao, up: score >= 70, icon: BarChart2, cor: score >= 70 ? "#34d399" : "#fbbf24" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <CanvasBox cor={card.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
              <div className="p-4 md:p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#3a5a8a" }}>{card.label}</p>
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    className="p-1.5 rounded-lg" style={{ background: `${card.cor}15` }}>
                    <card.icon size={14} style={{ color: card.cor }} />
                  </motion.div>
                </div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-lg md:text-xl font-black mb-2" style={{ color: "#c8d8f0", textShadow: `0 0 20px ${card.cor}30` }}>
                  {card.value}
                </motion.p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${card.cor}15`, color: card.cor, border: `1px solid ${card.cor}30` }}>
                  {card.change}
                </span>
              </div>
            </CanvasBox>
          </motion.div>
        ))}
      </div>

      {/* Score + KPIs avançados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Score épico */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <CanvasBox cor={score >= 70 ? "#34d399" : "#fbbf24"} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
            <div className="p-5 flex flex-col items-center text-center">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-3" style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
                AXIOMA AI.TECH
              </motion.p>
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#3a5a8a" }}>{d.score}</p>
              <ScoreCircular score={score} />
              <p className="text-xs mt-3 font-semibold" style={{ color: score >= 70 ? "#34d399" : "#fbbf24" }}>
                {score >= 70 ? (idioma === "pt" ? "🏆 Excelente saúde financeira" : "🏆 Excellent financial health") : (idioma === "pt" ? "⚡ Atenção necessária" : "⚡ Attention needed")}
              </p>
              {/* Mini barras animadas */}
              <div className="w-full mt-4 space-y-2">
                {[
                  { label: idioma === "pt" ? "Liquidez" : "Liquidity", val: Math.min(100, (receitas / (custosFixos + custosVariaveis + 1)) * 50), cor: "#6ab0ff" },
                  { label: idioma === "pt" ? "Lucratividade" : "Profitability", val: Math.max(0, Math.min(100, 50 + (lucro / (receitas || 1)) * 100)), cor: "#34d399" },
                  { label: idioma === "pt" ? "Eficiência" : "Efficiency", val: Math.max(0, Math.min(100, 100 - Number(indiceEndividamento))), cor: "#a78bfa" },
                ].map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: "#3a5a8a" }}>
                      <span>{bar.label}</span><span>{bar.val.toFixed(0)}%</span>
                    </div>
                    <div className="rounded-full h-1.5" style={{ background: "rgba(59,111,212,0.1)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${bar.val}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 + i * 0.2 }}
                        className="h-1.5 rounded-full" style={{ background: bar.cor, boxShadow: `0 0 6px ${bar.cor}` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CanvasBox>
        </motion.div>

        {/* KPIs avançados */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: d.margemContribuicao, value: fmt(margemContribuicao), sub: `${margemPerc}% ${d.daReceita}`, cor: margemContribuicao >= 0 ? "#34d399" : "#f87171", icon: Activity },
            { label: d.pontoEquilibrio, value: fmt(pontoEquilibrio), sub: receitas >= pontoEquilibrio ? d.acimaPonto : d.abaixoPonto, cor: receitas >= pontoEquilibrio ? "#34d399" : "#f87171", icon: Target },
            { label: d.capitalGiro, value: fmt(capitalGiro), sub: capitalGiro >= 0 ? d.situacaoSaudavel : d.atencaoNecessaria, cor: capitalGiro >= 0 ? "#34d399" : "#f87171", icon: Zap },
            { label: d.indiceEndividamento, value: `${indiceEndividamento}%`, sub: Number(indiceEndividamento) <= 30 ? d.nivelSaudavel : d.nivelElevado, cor: Number(indiceEndividamento) <= 30 ? "#34d399" : "#f87171", icon: Shield },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
              <CanvasBox cor={kpi.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                      className="p-1.5 rounded-lg" style={{ background: `${kpi.cor}15` }}>
                      <kpi.icon size={14} style={{ color: kpi.cor }} />
                    </motion.div>
                    <p className="text-xs font-semibold truncate" style={{ color: "#3a5a8a" }}>{kpi.label}</p>
                  </div>
                  <p className="text-base md:text-lg font-black mb-1" style={{ color: kpi.cor, textShadow: `0 0 15px ${kpi.cor}40` }}>{kpi.value}</p>
                  <p className="text-xs" style={{ color: "#3a5a8a" }}>{kpi.sub}</p>
                </div>
              </CanvasBox>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gráfico épico */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#fbbf24">
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <div>
                <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                  className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
                  AXIOMA AI.TECH
                </motion.p>
                <h3 className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{d.grafico}</h3>
              </div>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border opacity-40"
                style={{ borderColor: "#6ab0ff", borderTopColor: "transparent", borderRightColor: "#34d399" }} />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dadosGrafico}>
                <defs>
                  <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ab0ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6ab0ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(106,176,255,0.06)" />
                <XAxis dataKey="mes" stroke="#3a5a8a" tick={{ fontSize: 11, fill: "#3a5a8a" }} />
                <YAxis stroke="#3a5a8a" tick={{ fontSize: 11, fill: "#3a5a8a" }} width={50} />
                <Tooltip contentStyle={{ background: "#040a16", border: "1px solid rgba(106,176,255,0.3)", borderRadius: "12px", color: "#c8d8f0" }} />
                <Area type="monotone" dataKey="receita" stroke="#6ab0ff" fill="url(#gradR)" strokeWidth={2} name={d.receitas} />
                <Area type="monotone" dataKey="custos" stroke="#34d399" fill="url(#gradC)" strokeWidth={2} name={d.custos} />
                <Area type="monotone" dataKey="lucro" stroke="#a78bfa" fill="url(#gradL)" strokeWidth={2} name={d.lucro} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CanvasBox>
      </motion.div>

      {/* Previsão + Insights lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Previsão de Caixa */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
          <CanvasBox cor="#fbbf24" corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
            <div className="p-4 md:p-5">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#fbbf24", textShadow: "0 0 20px #fbbf24" }}>
                AXIOMA AI.TECH
              </motion.p>
              <p className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>📈 {d.previsaoCaixa}</p>
              <div className="space-y-3">
                {[
                  { label: d.trintaDias, valor: receitas, delay: 0 },
                  { label: d.sessentaDias, valor: receitas * 1.8, delay: 0.2 },
                  { label: d.noventaDias, valor: receitas * 2.7, delay: 0.4 },
                ].map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + p.delay }}
                    className="flex justify-between items-center p-3 rounded-xl"
                    style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    <span className="text-xs" style={{ color: "#3a5a8a" }}>{p.label}</span>
                    <span className="text-sm font-black" style={{ color: "#fbbf24", textShadow: "0 0 10px rgba(251,191,36,0.4)" }}>{fmt(p.valor)}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </CanvasBox>
        </motion.div>

        {/* Insights da IA */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
          <CanvasBox cor="#a78bfa" corB="#6ab0ff" corC="#34d399" corD="#f472b6">
            <div className="p-4 md:p-5">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#a78bfa", textShadow: "0 0 20px #a78bfa" }}>
                AXIOMA AI.TECH
              </motion.p>
              <p className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>🤖 {d.insights}</p>
              <div className="space-y-3">
                {[
                  { tipo: lucro >= 0 ? "pos" : "neg", texto: lucro >= 0 ? `${d.lucro}: ${fmt(lucro)}. ${d.bom}!` : `${d.lucro}: ${fmt(lucro)}. ${d.atencaoNecessaria}.` },
                  { tipo: Number(indiceEndividamento) <= 30 ? "pos" : "neg", texto: `${d.indiceEndividamento}: ${indiceEndividamento}%. ${Number(indiceEndividamento) <= 30 ? d.situacaoControlada : d.recomendadoReduzir}` },
                  { tipo: margemContribuicao >= custosFixos ? "pos" : "neg", texto: `${d.margemContribuicao}: ${fmt(margemContribuicao)}. ${margemContribuicao >= custosFixos ? d.cobrindoFixos : d.insuficienteFixos}` },
                ].map((insight, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.15 }}
                    className="flex items-start gap-2 p-3 rounded-xl"
                    style={{ background: insight.tipo === "neg" ? "rgba(248,113,113,0.05)" : "rgba(52,211,153,0.05)", border: `1px solid ${insight.tipo === "neg" ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)"}` }}>
                    <AlertTriangle size={12} style={{ color: insight.tipo === "neg" ? "#f87171" : "#34d399", marginTop: 2, flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "#8aaad4" }}>{insight.texto}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </CanvasBox>
        </motion.div>
      </div>

      {/* Acesso rápido aos módulos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
          <div className="p-4 md:p-5">
            <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#34d399", textShadow: "0 0 20px #34d399" }}>
              AXIOMA AI.TECH
            </motion.p>
            <p className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>
              ⚡ {idioma === "pt" ? "Acesso Rápido" : idioma === "en" ? "Quick Access" : "Acceso Rápido"}
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { label: idioma === "pt" ? "Receitas" : "Revenue", icon: "💰", path: "/receitas", cor: "#6ab0ff" },
                { label: "DRE", icon: "📈", path: "/dre", cor: "#34d399" },
                { label: idioma === "pt" ? "Fluxo" : "Cash Flow", icon: "💧", path: "/fluxo-caixa", cor: "#a78bfa" },
                { label: idioma === "pt" ? "Clientes" : "Clients", icon: "👥", path: "/clientes", cor: "#fbbf24" },
                { label: "IA Fin.", icon: "🤖", path: "/ia-financeira", cor: "#f472b6" },
                { label: "IA Trib.", icon: "🏛️", path: "/ia-tributaria", cor: "#fb923c" },
              ].map((item, i) => (
                <motion.button key={i}
                  whileHover={{ scale: 1.08, boxShadow: `0 0 20px ${item.cor}40` }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(item.path)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl"
                  style={{ background: `${item.cor}10`, border: `1px solid ${item.cor}25` }}>
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    className="text-xl">{item.icon}</motion.span>
                  <span className="text-xs font-semibold text-center" style={{ color: item.cor }}>{item.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </CanvasBox>
      </motion.div>

    </div>
  );
}