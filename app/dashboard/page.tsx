"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../lib/LanguageContext";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Bell, AlertTriangle, LogOut } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  useEffect(() => { carregarDados(); }, []);

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
      const dt = new Date();
      dt.setMonth(dt.getMonth() - i);
      const m = dt.getMonth() + 1;
      const a = dt.getFullYear();
      const inicio = `${a}-${String(m).padStart(2, "0")}-01`;
      const fim = `${a}-${String(m).padStart(2, "0")}-31`;
      const { data: rMes } = await supabase.from("receitas").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);
      const { data: cMes } = await supabase.from("custos_variaveis").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);
      const rTotal = rMes?.reduce((s, r) => s + (r.valor || 0), 0) || 0;
      const cTotal = (cMes?.reduce((s, r) => s + (r.valor || 0), 0) || 0) + totalFixos;
      meses.push({ mes: nomesMeses[m - 1], receita: rTotal, custos: cTotal });
    }
    setDadosGrafico(meses);
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const lucro = receitas - custosFixos - custosVariaveis;
  const margemContribuicao = receitas - custosVariaveis;
  const margemPerc = receitas > 0 ? ((margemContribuicao / receitas) * 100).toFixed(1) : "0";
  const pontoEquilibrio = margemContribuicao > 0 ? (custosFixos / (margemContribuicao / (receitas || 1))) : 0;
  const capitalGiro = receitas - custosFixos - custosVariaveis;
  const indiceEndividamento = receitas > 0 ? ((dividas / receitas) * 100).toFixed(1) : "0";
  const score = Math.min(100, Math.max(0, Math.round(50 + (lucro / (receitas || 1)) * 100)));
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cards = [
    { label: d.faturamento, value: fmt(receitas), change: d.mesAtual, up: true, icon: TrendingUp },
    { label: d.custos, value: fmt(custosFixos + custosVariaveis), change: d.fixosVariaveis, up: false, icon: TrendingDown },
    { label: d.lucro, value: fmt(lucro), change: lucro >= 0 ? d.positivo : d.negativo, up: lucro >= 0, icon: DollarSign },
    { label: d.score, value: `${score}/100`, change: score >= 70 ? d.bomScore : d.atencao, up: score >= 70, icon: BarChart2 },
  ];

  const kpisAvancados = [
    { label: d.margemContribuicao, value: fmt(margemContribuicao), sub: `${margemPerc}% ${d.daReceita}`, cor: margemContribuicao >= 0 ? "#34d399" : "#f87171", icon: "📊" },
    { label: d.pontoEquilibrio, value: fmt(pontoEquilibrio), sub: receitas >= pontoEquilibrio ? d.acimaPonto : d.abaixoPonto, cor: receitas >= pontoEquilibrio ? "#34d399" : "#f87171", icon: "⚖️" },
    { label: d.capitalGiro, value: fmt(capitalGiro), sub: capitalGiro >= 0 ? d.situacaoSaudavel : d.atencaoNecessaria, cor: capitalGiro >= 0 ? "#34d399" : "#f87171", icon: "💧" },
    { label: d.indiceEndividamento, value: `${indiceEndividamento}%`, sub: Number(indiceEndividamento) <= 30 ? d.nivelSaudavel : d.nivelElevado, cor: Number(indiceEndividamento) <= 30 ? "#34d399" : "#f87171", icon: "📉" },
  ];

  const insights = [
    { tipo: lucro >= 0 ? "positivo" : "alerta", texto: lucro >= 0 ? `${d.lucro}: ${fmt(lucro)}. ${d.bom}!` : `${d.lucro}: ${fmt(lucro)}. ${d.atencaoNecessaria}.` },
    { tipo: Number(indiceEndividamento) <= 30 ? "positivo" : "alerta", texto: `${d.indiceEndividamento}: ${indiceEndividamento}%. ${Number(indiceEndividamento) <= 30 ? d.situacaoControlada : d.recomendadoReduzir}` },
    { tipo: margemContribuicao >= custosFixos ? "positivo" : "alerta", texto: `${d.margemContribuicao}: ${fmt(margemContribuicao)}. ${margemContribuicao >= custosFixos ? d.cobrindoFixos : d.insuficienteFixos}` },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#020810" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p style={{ color: "#3a5a8a" }}>{t.geral.carregando}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 overflow-auto" style={{ background: "#020810" }}>

      <div className="flex justify-center mb-4 md:mb-6">
        <div
          className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-2xl cursor-pointer hover:scale-105 transition-all w-full md:w-auto"
          style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(251,146,60,0.15) 100%)", border: "1px solid rgba(234,179,8,0.4)", boxShadow: "0 0 30px rgba(234,179,8,0.15)" }}
          onClick={() => router.push("/ia-tributaria")}
        >
          <span className="text-lg md:text-xl">⭐</span>
          <div className="flex-1">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: "#fbbf24" }}>
              {idioma === "pt" ? "IA Tributária" : idioma === "en" ? "Tax AI" : "IA Tributaria"}
            </p>
            <p className="text-xs hidden md:block" style={{ color: "#f97316" }}>
              {idioma === "pt" ? "Reduza impostos com inteligência artificial" : idioma === "en" ? "Reduce taxes with artificial intelligence" : "Reduzca impuestos con inteligencia artificial"}
            </p>
          </div>
          <span className="text-xs font-black px-2 md:px-3 py-1 rounded-full" style={{ background: "linear-gradient(135deg, #ca8a04, #ea580c)", color: "#fff" }}>
            PREMIUM
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-5">
          <div style={{ filter: "drop-shadow(0 0 20px rgba(106,176,255,0.5))" }}>
            <Image src="/logo-aitech.png" alt="Axioma" width={40} height={40} className="object-contain md:w-[60px] md:h-[60px]" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-0.5 hidden md:block" style={{ color: "#3a5a8a" }}>{d.inteligencia}</p>
            <h2 className="text-lg md:text-2xl font-bold" style={{ color: "#c8d8f0" }}>
              {d.bemvindo}, {nomeUsuario} 👋
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative cursor-pointer p-2 rounded-xl" style={{ background: "rgba(59,111,212,0.1)" }}>
            <Bell size={18} style={{ color: "#6ab0ff" }} />
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(59,111,212,0.1)" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
              {inicialUsuario}
            </div>
            <span className="text-sm hidden md:block" style={{ color: "#c8d8f0" }}>{nomeUsuario}</span>
          </div>
          {/* Botão logout visível no mobile */}
          <button
            onClick={handleLogout}
            className="md:hidden p-2 rounded-xl transition-all"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <LogOut size={18} style={{ color: "#f87171" }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl p-4 md:p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
            <div className="flex justify-between items-start mb-2 md:mb-3">
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#3a5a8a" }}>{card.label}</p>
              <card.icon size={14} style={{ color: card.up ? "#34d399" : "#f87171" }} />
            </div>
            <p className="text-lg md:text-2xl font-bold mb-2" style={{ color: "#c8d8f0" }}>{card.value}</p>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: card.up ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: card.up ? "#34d399" : "#f87171" }}>
              {card.change}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {kpisAvancados.map((kpi, i) => (
          <div key={i} className="rounded-2xl p-4 md:p-5" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${kpi.cor}25` }}>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <span className="text-base md:text-lg">{kpi.icon}</span>
              <p className="text-xs font-semibold" style={{ color: "#3a5a8a" }}>{kpi.label}</p>
            </div>
            <p className="text-base md:text-xl font-bold mb-1" style={{ color: kpi.cor }}>{kpi.value}</p>
            <p className="text-xs" style={{ color: "#3a5a8a" }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4 md:p-5 mb-4 md:mb-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
        <p className="text-sm font-semibold mb-3 md:mb-4" style={{ color: "#c8d8f0" }}>{d.previsaoCaixa}</p>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {[
            { label: d.trintaDias, valor: receitas },
            { label: d.sessentaDias, valor: receitas * 2 },
            { label: d.noventaDias, valor: receitas * 3 },
          ].map((p, i) => (
            <div key={i} className="rounded-xl p-3 md:p-4 text-center" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(59,111,212,0.1)" }}>
              <p className="text-xs mb-1 md:mb-2" style={{ color: "#3a5a8a" }}>{p.label}</p>
              <p className="text-sm md:text-lg font-bold" style={{ color: "#6ab0ff" }}>{fmt(p.valor)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4 md:p-6 mb-4 md:mb-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
        <h3 className="text-sm font-semibold mb-4 md:mb-6" style={{ color: "#c8d8f0" }}>{d.grafico}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dadosGrafico}>
            <defs>
              <linearGradient id="receita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b6fd4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b6fd4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="custos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)" />
            <XAxis dataKey="mes" stroke="#3a5a8a" tick={{ fontSize: 10 }} />
            <YAxis stroke="#3a5a8a" tick={{ fontSize: 10 }} width={40} />
            <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0", fontSize: 12 }} />
            <Area type="monotone" dataKey="receita" stroke="#3b6fd4" fill="url(#receita)" strokeWidth={2} name={d.receitas} />
            <Area type="monotone" dataKey="custos" stroke="#34d399" fill="url(#custos)" strokeWidth={2} name={d.custos} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl p-4 md:p-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
        <h3 className="text-sm font-semibold mb-3 md:mb-4" style={{ color: "#c8d8f0" }}>{d.insights}</h3>
        <div className="space-y-2 md:space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 md:gap-3 p-3 rounded-xl" style={{ background: insight.tipo === "alerta" ? "rgba(248,113,113,0.05)" : "rgba(52,211,153,0.05)", border: `1px solid ${insight.tipo === "alerta" ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)"}` }}>
              <AlertTriangle size={14} style={{ color: insight.tipo === "alerta" ? "#f87171" : "#34d399", marginTop: 2, flexShrink: 0 }} />
              <p className="text-xs md:text-sm" style={{ color: "#8aaad4" }}>{insight.texto}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}