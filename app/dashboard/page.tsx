"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, DollarSign, Star, Bell, Search, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const traducoes = {
  pt: {
    bemvindo: "Bem-vindo, Elias Tavares 👋",
    inteligencia: "INTELIGÊNCIA FINANCEIRA COM IA",
    faturamento: "Faturamento Mensal",
    custos: "Custos Totais",
    lucro: "Lucro Líquido",
    score: "Score Financeiro",
    grafico: "📊 Receitas vs Custos — 2026",
    insights: "🤖 Insights da IA",
    receitas: "Receitas",
    margem: "Margem 18%",
    bom: "Bom desempenho",
    fixos: "Fixos + Variáveis",
    mes: "+12% este mês",
    buscar: "Buscar...",
    dashboard: "Dashboard",
    iaTributaria: "⚡ IA Tributária Premium",
    pagarMenos: "Pague menos impostos",
    alerta: "Seu caixa pode ficar negativo em 47 dias no cenário pessimista.",
    positivo: "Faturamento cresceu 12% este mês — melhor resultado do trimestre.",
    sugestao: "Reduzindo custos variáveis em 8% você aumentaria a margem em R$ 4.200/mês.",
  },
  en: {
    bemvindo: "Welcome, Elias Tavares 👋",
    inteligencia: "AI-POWERED FINANCIAL INTELLIGENCE",
    faturamento: "Monthly Revenue",
    custos: "Total Costs",
    lucro: "Net Profit",
    score: "Financial Score",
    grafico: "📊 Revenue vs Costs — 2026",
    insights: "🤖 AI Insights",
    receitas: "Revenue",
    margem: "18% Margin",
    bom: "Good performance",
    fixos: "Fixed + Variable",
    mes: "+12% this month",
    buscar: "Search...",
    dashboard: "Dashboard",
    iaTributaria: "⚡ Tax AI Premium",
    pagarMenos: "Pay less taxes",
    alerta: "Your cash flow may go negative in 47 days in the pessimistic scenario.",
    positivo: "Revenue grew 12% this month — best result of the quarter.",
    sugestao: "Reducing variable costs by 8% would increase your margin by R$ 4,200/month.",
  },
  es: {
    bemvindo: "Bienvenido, Elias Tavares 👋",
    inteligencia: "INTELIGENCIA FINANCIERA CON IA",
    faturamento: "Facturación Mensual",
    custos: "Costos Totales",
    lucro: "Beneficio Neto",
    score: "Score Financiero",
    grafico: "📊 Ingresos vs Costos — 2026",
    insights: "🤖 Insights de IA",
    receitas: "Ingresos",
    margem: "Margen 18%",
    bom: "Buen rendimiento",
    fixos: "Fijos + Variables",
    mes: "+12% este mes",
    buscar: "Buscar...",
    dashboard: "Dashboard",
    iaTributaria: "⚡ IA Tributaria Premium",
    pagarMenos: "Paga menos impuestos",
    alerta: "Su flujo de caja puede volverse negativo en 47 días en el escenario pesimista.",
    positivo: "La facturación creció un 12% este mes — mejor resultado del trimestre.",
    sugestao: "Reduciendo los costos variables en un 8% aumentaría el margen en R$ 4.200/mes.",
  },
};

const dadosGrafico = [
  { mes: "Jan", receitas: 42000, custos: 31000 },
  { mes: "Fev", receitas: 48000, custos: 33000 },
  { mes: "Mar", receitas: 45000, custos: 29000 },
  { mes: "Abr", receitas: 53000, custos: 35000 },
  { mes: "Mai", receitas: 58000, custos: 38000 },
  { mes: "Jun", receitas: 62000, custos: 40000 },
];

const idiomas = [
  { code: "pt", bandeira: "🇧🇷", nome: "PT" },
  { code: "en", bandeira: "🇺🇸", nome: "EN" },
  { code: "es", bandeira: "🇪🇸", nome: "ES" },
];

export default function Dashboard() {
  const router = useRouter();
  const [idioma, setIdioma] = useState<"pt" | "en" | "es">("pt");
  const t = traducoes[idioma];

  return (
    <div className="min-h-screen flex" style={{background: "#020810"}}>

      {/* Sidebar */}
      <div className="w-64 min-h-screen flex flex-col" style={{background: "rgba(10,22,40,0.95)", borderRight: "1px solid rgba(59,111,212,0.15)"}}>
        <div className="flex flex-col items-center py-8 px-4 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
          <div style={{filter: "drop-shadow(0 0 24px rgba(106,176,255,0.5))"}}>
            <Image src="/logo-aitech.png" alt="Axioma" width={110} height={110} className="object-contain"/>
          </div>
          <h1 className="text-lg font-black tracking-widest mt-3" style={{background: "linear-gradient(135deg, #6ab0ff, #ffffff, #3b6fd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>AXIOMA</h1>
          <p className="text-xs tracking-widest" style={{color: "#3a5a8a"}}>AI.TECH</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { label: t.dashboard, path: "/dashboard", active: true },
            { label: idioma === "pt" ? "Receitas" : idioma === "en" ? "Revenue" : "Ingresos", path: "/receitas" },
            { label: idioma === "pt" ? "Custos Fixos" : idioma === "en" ? "Fixed Costs" : "Costos Fijos", path: "/custos-fixos" },
            { label: idioma === "pt" ? "Custos Variáveis" : idioma === "en" ? "Variable Costs" : "Costos Variables", path: "/custos-variaveis" },
            { label: idioma === "pt" ? "Fornecedores" : idioma === "en" ? "Suppliers" : "Proveedores", path: "/fornecedores" },
            { label: idioma === "pt" ? "Endividamento" : idioma === "en" ? "Debt" : "Endeudamiento", path: "/endividamento" },
            { label: idioma === "pt" ? "Fluxo de Caixa" : idioma === "en" ? "Cash Flow" : "Flujo de Caja", path: "/fluxo-caixa" },
            { label: idioma === "pt" ? "IA Financeira" : idioma === "en" ? "Financial AI" : "IA Financiera", path: "/ia-financeira" },
            { label: idioma === "pt" ? "IA Tributária" : idioma === "en" ? "Tax AI" : "IA Tributaria", path: "/ia-tributaria" },
            { label: idioma === "pt" ? "Empresa" : idioma === "en" ? "Company" : "Empresa", path: "/empresa" },
            { label: idioma === "pt" ? "Relatórios" : idioma === "en" ? "Reports" : "Informes", path: "/relatorios" },
          ].map((item) => (
            <div key={item.path} onClick={() => router.push(item.path)} className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all" style={{background: item.active ? "rgba(59,111,212,0.15)" : "transparent", color: item.active ? "#6ab0ff" : "#3a5a8a"}}>
              <span className="text-sm font-medium">{item.label}</span>
              {item.active && <ChevronRight size={14}/>}
            </div>
          ))}
        </nav>

        <div className="p-4">
          <div className="rounded-xl p-3 text-center cursor-pointer" onClick={() => router.push("/ia-tributaria")} style={{background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(59,111,212,0.15))", border: "1px solid rgba(167,139,250,0.3)"}}>
            <p className="text-xs font-bold" style={{color: "#a78bfa"}}>{t.iaTributaria}</p>
            <p className="text-xs mt-1" style={{color: "#3a5a8a"}}>{t.pagarMenos}</p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col overflow-auto">

        {/* Hero */}
        <div className="relative flex items-center justify-between px-10 py-8" style={{background: "linear-gradient(135deg, rgba(10,22,40,0.95) 0%, rgba(26,58,143,0.15) 50%, rgba(10,22,40,0.95) 100%)", borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
          <div className="flex items-center gap-6">
            <div style={{filter: "drop-shadow(0 0 50px rgba(106,176,255,0.6))"}}>
              <Image src="/logo-aitech.png" alt="Axioma" width={120} height={120} className="object-contain"/>
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-wider" style={{background: "linear-gradient(135deg, #ffffff, #6ab0ff, #3b6fd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1}}>AXIOMA</h1>
              <p className="text-sm font-medium tracking-widest mt-1" style={{color: "#3a5a8a"}}>{t.inteligencia}</p>
              <p className="text-xs mt-1" style={{color: "#1a3a5a"}}>{t.bemvindo}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Seletor de idioma */}
            <div className="flex gap-1 rounded-xl p-1" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
              {idiomas.map((i) => (
                <button key={i.code} onClick={() => setIdioma(i.code as "pt" | "en" | "es")} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{background: idioma === i.code ? "rgba(59,111,212,0.3)" : "transparent", color: idioma === i.code ? "#6ab0ff" : "#3a5a8a"}}>
                  {i.bandeira} {i.nome}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <Search size={14} style={{color: "#3a5a8a"}}/>
              <input placeholder={t.buscar} className="bg-transparent text-sm focus:outline-none w-32" style={{color: "#c8d8f0"}}/>
            </div>
            <button className="relative p-2 rounded-xl" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <Bell size={18} style={{color: "#6ab0ff"}}/>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{background: "#f87171"}}/>
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>E</div>
          </div>
        </div>

        {/* Cards */}
        <div className="p-8">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: t.faturamento, value: "R$ 62.000", icon: TrendingUp, color: "#34d399", sub: t.mes },
              { label: t.custos, value: "R$ 38.000", icon: TrendingDown, color: "#f87171", sub: t.fixos },
              { label: t.lucro, value: "R$ 24.000", icon: DollarSign, color: "#6ab0ff", sub: t.margem },
              { label: t.score, value: "87/100", icon: Star, color: "#fbbf24", sub: t.bom },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{card.label}</p>
                  <card.icon size={16} style={{color: card.color}}/>
                </div>
                <p className="text-2xl font-bold mb-1" style={{color: card.color}}>{card.value}</p>
                <p className="text-xs" style={{color: "#3a5a8a"}}>{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          <div className="rounded-2xl p-6 mb-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <h3 className="text-sm font-semibold mb-6" style={{color: "#c8d8f0"}}>{t.grafico}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dadosGrafico}>
                <defs>
                  <linearGradient id="receitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b6fd4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b6fd4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="custos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)"/>
                <XAxis dataKey="mes" stroke="#3a5a8a" tick={{fontSize: 12}}/>
                <YAxis stroke="#3a5a8a" tick={{fontSize: 12}}/>
                <Tooltip contentStyle={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0"}}/>
                <Area type="monotone" dataKey="receitas" stroke="#3b6fd4" fill="url(#receitas)" strokeWidth={2} name={t.receitas}/>
                <Area type="monotone" dataKey="custos" stroke="#f87171" fill="url(#custos)" strokeWidth={2} name={t.custos}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="rounded-2xl p-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <h3 className="text-sm font-semibold mb-4" style={{color: "#c8d8f0"}}>{t.insights}</h3>
            <div className="space-y-3">
              {[
                { tipo: "alerta", texto: t.alerta },
                { tipo: "positivo", texto: t.positivo },
                { tipo: "sugestao", texto: t.sugestao },
              ].map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{background: insight.tipo === "alerta" ? "rgba(248,113,113,0.05)" : insight.tipo === "positivo" ? "rgba(52,211,153,0.05)" : "rgba(59,111,212,0.05)", border: `1px solid ${insight.tipo === "alerta" ? "rgba(248,113,113,0.15)" : insight.tipo === "positivo" ? "rgba(52,211,153,0.15)" : "rgba(59,111,212,0.15)"}`}}>
                  <span>{insight.tipo === "alerta" ? "⚠️" : insight.tipo === "positivo" ? "📈" : "💡"}</span>
                  <p className="text-sm" style={{color: "#c8d8f0"}}>{insight.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}