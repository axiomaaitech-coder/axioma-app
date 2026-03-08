"use client";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../lib/LanguageContext";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Bell, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Image from "next/image";

const dados = [
  { mes: "Jan", receita: 42000, custos: 28000 },
  { mes: "Fev", receita: 48000, custos: 31000 },
  { mes: "Mar", receita: 45000, custos: 29000 },
  { mes: "Abr", receita: 53000, custos: 33000 },
  { mes: "Mai", receita: 58000, custos: 35000 },
  { mes: "Jun", receita: 62000, custos: 38000 },
];

export default function Dashboard() {
  const router = useRouter();
  const { t, idioma } = useLanguage();

  const cards = [
    { label: t.dashboard.faturamento, value: "R$ 62.000", change: "+12%", up: true, icon: TrendingUp },
    { label: t.dashboard.custos, value: "R$ 38.000", change: "+5%", up: false, icon: TrendingDown },
    { label: t.dashboard.lucro, value: "R$ 24.000", change: "+18%", up: true, icon: DollarSign },
    { label: t.dashboard.score, value: "87/100", change: "+3pts", up: true, icon: BarChart2 },
  ];

  const insights = {
    pt: [
      { tipo: "alerta", texto: "Custos com fornecedores aumentaram 8% em relação ao mês anterior." },
      { tipo: "positivo", texto: "Faturamento cresceu 12% — melhor resultado do trimestre." },
      { tipo: "alerta", texto: "Margem líquida abaixo do ideal. Recomendado revisar custos variáveis." },
    ],
    en: [
      { tipo: "alerta", texto: "Supplier costs increased 8% compared to last month." },
      { tipo: "positivo", texto: "Revenue grew 12% — best result of the quarter." },
      { tipo: "alerta", texto: "Net margin below ideal. Recommended to review variable costs." },
    ],
    es: [
      { tipo: "alerta", texto: "Los costos con proveedores aumentaron 8% respecto al mes anterior." },
      { tipo: "positivo", texto: "La facturación creció 12% — mejor resultado del trimestre." },
      { tipo: "alerta", texto: "Margen neto por debajo del ideal. Se recomienda revisar costos variables." },
    ],
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{background: "#020810"}}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-5">
          <div style={{filter: "drop-shadow(0 0 20px rgba(106,176,255,0.5))"}}>
            <Image src="/logo-aitech.png" alt="Axioma" width={60} height={60} className="object-contain"/>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{color: "#3a5a8a"}}>{t.dashboard.inteligencia}</p>
            <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.dashboard.bemvindo}</h2>
          </div>
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

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
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

      <div className="rounded-2xl p-6 mb-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <h3 className="text-sm font-semibold mb-6" style={{color: "#c8d8f0"}}>{t.dashboard.grafico}</h3>
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
            <Area type="monotone" dataKey="receita" stroke="#3b6fd4" fill="url(#receita)" strokeWidth={2} name={t.dashboard.receitas}/>
            <Area type="monotone" dataKey="custos" stroke="#34d399" fill="url(#custos)" strokeWidth={2} name={t.dashboard.custos}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl p-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <h3 className="text-sm font-semibold mb-4" style={{color: "#c8d8f0"}}>{t.dashboard.insights}</h3>
        <div className="space-y-3">
          {insights[idioma].map((insight, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{background: insight.tipo === "alerta" ? "rgba(248,113,113,0.05)" : "rgba(52,211,153,0.05)", border: `1px solid ${insight.tipo === "alerta" ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)"}`}}>
              <AlertTriangle size={16} style={{color: insight.tipo === "alerta" ? "#f87171" : "#34d399", marginTop: 2}}/>
              <p className="text-sm" style={{color: "#8aaad4"}}>{insight.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}