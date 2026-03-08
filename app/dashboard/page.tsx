"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Bell, Settings, LogOut, BarChart2, Users, FileText, ShoppingCart, Truck } from "lucide-react";

const dados = [
  { mes: "Jan", receita: 42000, custos: 28000 },
  { mes: "Fev", receita: 48000, custos: 31000 },
  { mes: "Mar", receita: 45000, custos: 29000 },
  { mes: "Abr", receita: 53000, custos: 33000 },
  { mes: "Mai", receita: 58000, custos: 35000 },
  { mes: "Jun", receita: 62000, custos: 38000 },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen flex" style={{background: "#020810"}}>

      {/* Sidebar */}
      <div className="w-64 min-h-screen flex flex-col" style={{background: "rgba(10,22,40,0.95)", borderRight: "1px solid rgba(59,111,212,0.15)"}}>
        
        {/* Logo */}
        <div className="p-6 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
          <h1 className="text-xl font-black tracking-widest" style={{background: "linear-gradient(180deg, #ffffff 0%, #8aaad4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>
            AXIOMA
          </h1>
          <p className="text-xs mt-1" style={{color: "#3a5a8a"}}>Copiloto Financeiro</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: BarChart2, label: "Dashboard", active: true },
            { icon: DollarSign, label: "Receitas" },
            { icon: TrendingDown, label: "Custos Fixos" },
            { icon: ShoppingCart, label: "Custos Variáveis" },
            { icon: Truck, label: "Fornecedores" },
            { icon: Users, label: "Empresa" },
            { icon: FileText, label: "Relatórios" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all" style={{background: item.active ? "rgba(59,111,212,0.15)" : "transparent", color: item.active ? "#6ab0ff" : "#3a5a8a"}}>
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t space-y-1" style={{borderColor: "rgba(59,111,212,0.15)"}}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer" style={{color: "#3a5a8a"}}>
            <Settings size={18} />
            <span className="text-sm">Configurações</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer" style={{color: "#3a5a8a"}}>
            <LogOut size={18} />
            <span className="text-sm">Sair</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>Dashboard</h2>
            <p className="text-sm mt-1" style={{color: "#3a5a8a"}}>Visão geral financeira — Março 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer p-2 rounded-xl" style={{background: "rgba(59,111,212,0.1)"}}>
              <Bell size={20} style={{color: "#6ab0ff"}}/>
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"/>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{background: "rgba(59,111,212,0.1)"}}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>E</div>
              <span className="text-sm" style={{color: "#c8d8f0"}}>Elias</span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Faturamento", value: "R$ 62.000", change: "+12%", up: true, icon: TrendingUp },
            { label: "Custos Totais", value: "R$ 38.000", change: "+5%", up: false, icon: TrendingDown },
            { label: "Lucro Líquido", value: "R$ 24.000", change: "+18%", up: true, icon: DollarSign },
            { label: "Score Financeiro", value: "87/100", change: "+3pts", up: true, icon: BarChart2 },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{card.label}</p>
                <card.icon size={16} style={{color: card.up ? "#34d399" : "#f87171"}}/>
              </div>
              <p className="text-2xl font-bold mb-2" style={{color: "#c8d8f0"}}>{card.value}</p>
              <span className="text-xs px-2 py-1 rounded-full" style={{background: card.up ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: card.up ? "#34d399" : "#f87171"}}>
                {card.change}
              </span>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        <div className="rounded-2xl p-6 mb-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <h3 className="text-sm font-semibold mb-6" style={{color: "#c8d8f0"}}>Receitas vs Custos — 2026</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dados}>
              <defs>
                <linearGradient id="receita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b6fd4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b6fd4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="custos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)"/>
              <XAxis dataKey="mes" stroke="#3a5a8a" tick={{fontSize: 12}}/>
              <YAxis stroke="#3a5a8a" tick={{fontSize: 12}}/>
              <Tooltip contentStyle={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0"}}/>
              <Area type="monotone" dataKey="receita" stroke="#3b6fd4" fill="url(#receita)" strokeWidth={2} name="Receita"/>
              <Area type="monotone" dataKey="custos" stroke="#34d399" fill="url(#custos)" strokeWidth={2} name="Custos"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alertas IA */}
        <div className="rounded-2xl p-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <h3 className="text-sm font-semibold mb-4" style={{color: "#c8d8f0"}}>🤖 Insights da IA</h3>
          <div className="space-y-3">
            {[
              { tipo: "alerta", texto: "Custos com fornecedores aumentaram 8% em relação ao mês anterior." },
              { tipo: "positivo", texto: "Faturamento cresceu 12% — melhor resultado do trimestre." },
              { tipo: "alerta", texto: "Margem líquida abaixo do ideal. Recomendado revisar custos variáveis." },
            ].map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{background: insight.tipo === "alerta" ? "rgba(248,113,113,0.05)" : "rgba(52,211,153,0.05)", border: `1px solid ${insight.tipo === "alerta" ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)"}`}}>
                <AlertTriangle size={16} style={{color: insight.tipo === "alerta" ? "#f87171" : "#34d399", marginTop: 2}}/>
                <p className="text-sm" style={{color: "#8aaad4"}}>{insight.texto}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}