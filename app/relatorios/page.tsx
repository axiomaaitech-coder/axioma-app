"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download, TrendingUp, TrendingDown, DollarSign, BarChart2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const dadosDRE = [
  { item: "Receita Bruta", valor: 62000, tipo: "receita" },
  { item: "Deduções", valor: -3100, tipo: "deducao" },
  { item: "Receita Líquida", valor: 58900, tipo: "subtotal" },
  { item: "Custos Fixos", valor: -16249, tipo: "custo" },
  { item: "Custos Variáveis", valor: -9350, tipo: "custo" },
  { item: "Lucro Operacional", valor: 33301, tipo: "subtotal" },
  { item: "Despesas Financeiras", valor: -2100, tipo: "custo" },
  { item: "Lucro Líquido", valor: 31201, tipo: "lucro" },
];

const dadosMensais = [
  { mes: "Jan", receita: 42000, custos: 31000, lucro: 11000 },
  { mes: "Fev", receita: 48000, custos: 33000, lucro: 15000 },
  { mes: "Mar", receita: 45000, custos: 29000, lucro: 16000 },
  { mes: "Abr", receita: 53000, custos: 35000, lucro: 18000 },
  { mes: "Mai", receita: 58000, custos: 38000, lucro: 20000 },
  { mes: "Jun", receita: 62000, custos: 40000, lucro: 22000 },
];

const distribuicaoCustos = [
  { name: "Custos Fixos", value: 16249, color: "#f87171" },
  { name: "Custos Variáveis", value: 9350, color: "#fbbf24" },
  { name: "Fornecedores", value: 7150, color: "#6ab0ff" },
  { name: "Despesas Financeiras", value: 2100, color: "#a78bfa" },
];

export default function Relatorios() {
  const router = useRouter();
  const [relatorioAtivo, setRelatorioAtivo] = useState("dre");

  return (
    <div className="min-h-screen flex" style={{background: "#020810"}}>
      <div className="w-64 min-h-screen flex flex-col" style={{background: "rgba(10,22,40,0.95)", borderRight: "1px solid rgba(59,111,212,0.15)"}}>
        <div className="p-6 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
          <Image src="/logo.png" alt="Axioma" width={140} height={50} className="object-contain"/>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { label: "Dashboard", path: "/dashboard" },
            { label: "Receitas", path: "/receitas" },
            { label: "Custos Fixos", path: "/custos-fixos" },
            { label: "Custos Variáveis", path: "/custos-variaveis" },
            { label: "Fornecedores", path: "/fornecedores" },
            { label: "Endividamento", path: "/endividamento" },
            { label: "Fluxo de Caixa", path: "/fluxo-caixa" },
            { label: "IA Financeira", path: "/ia-financeira" },
            { label: "Empresa", path: "/empresa" },
            { label: "Relatórios", path: "/relatorios", active: true },
          ].map((item) => (
            <div key={item.label} onClick={() => router.push(item.path)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all" style={{background: item.active ? "rgba(59,111,212,0.15)" : "transparent", color: item.active ? "#6ab0ff" : "#3a5a8a"}}>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
              <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>Relatórios</h2>
            </div>
            <p className="text-sm" style={{color: "#3a5a8a"}}>Análises completas do seu negócio</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
            <Download size={18}/>
            Exportar PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: "dre", label: "DRE" },
            { id: "evolucao", label: "Evolução" },
            { id: "custos", label: "Distribuição de Custos" },
            { id: "indicadores", label: "Indicadores" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setRelatorioAtivo(tab.id)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{background: relatorioAtivo === tab.id ? "rgba(59,111,212,0.2)" : "rgba(10,22,40,0.8)", color: relatorioAtivo === tab.id ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${relatorioAtivo === tab.id ? "rgba(59,111,212,0.4)" : "rgba(59,111,212,0.15)"}`}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* DRE */}
        {relatorioAtivo === "dre" && (
          <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <div className="px-6 py-4 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
              <h3 className="font-bold" style={{color: "#c8d8f0"}}>DRE — Demonstrativo de Resultado — Março 2026</h3>
            </div>
            <div className="p-6">
              {dadosDRE.map((item, i) => (
                <div key={i} className={`flex justify-between items-center py-3 ${item.tipo === "subtotal" || item.tipo === "lucro" ? "border-t mt-2" : ""}`} style={{borderColor: "rgba(59,111,212,0.15)"}}>
                  <span className={`text-sm ${item.tipo === "subtotal" || item.tipo === "lucro" ? "font-bold" : ""}`} style={{color: item.tipo === "subtotal" ? "#6ab0ff" : item.tipo === "lucro" ? "#34d399" : item.tipo === "receita" ? "#c8d8f0" : "#8aaad4"}}>
                    {item.tipo === "subtotal" || item.tipo === "lucro" ? "▶ " : "  "}{item.item}
                  </span>
                  <span className={`text-sm font-bold`} style={{color: item.valor > 0 ? "#34d399" : "#f87171"}}>
                    {item.valor > 0 ? "+" : ""} R$ {Math.abs(item.valor).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evolução */}
        {relatorioAtivo === "evolucao" && (
          <div className="rounded-2xl p-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <h3 className="font-bold mb-6" style={{color: "#c8d8f0"}}>Evolução Mensal — Receita, Custos e Lucro</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={dadosMensais}>
                <defs>
                  <linearGradient id="receita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b6fd4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b6fd4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="lucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)"/>
                <XAxis dataKey="mes" stroke="#3a5a8a" tick={{fontSize: 12}}/>
                <YAxis stroke="#3a5a8a" tick={{fontSize: 12}}/>
                <Tooltip contentStyle={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0"}}/>
                <Area type="monotone" dataKey="receita" stroke="#3b6fd4" fill="url(#receita)" strokeWidth={2} name="Receita"/>
                <Area type="monotone" dataKey="custos" stroke="#f87171" fill="none" strokeWidth={2} name="Custos"/>
                <Area type="monotone" dataKey="lucro" stroke="#34d399" fill="url(#lucro)" strokeWidth={2} name="Lucro"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Distribuição de Custos */}
        {relatorioAtivo === "custos" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-2xl p-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <h3 className="font-bold mb-6" style={{color: "#c8d8f0"}}>Distribuição de Custos</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={distribuicaoCustos} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {distribuicaoCustos.map((entry, index) => (
                      <Cell key={index} fill={entry.color}/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0"}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl p-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <h3 className="font-bold mb-6" style={{color: "#c8d8f0"}}>Detalhamento</h3>
              <div className="space-y-4">
                {distribuicaoCustos.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm" style={{color: "#c8d8f0"}}>{item.name}</span>
                      <span className="text-sm font-bold" style={{color: item.color}}>R$ {item.value.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{background: "rgba(59,111,212,0.1)"}}>
                      <div className="h-2 rounded-full" style={{width: `${(item.value / 34849) * 100}%`, background: item.color}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Indicadores */}
        {relatorioAtivo === "indicadores" && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Margem Bruta", valor: "38%", meta: "45%", status: "abaixo", icone: TrendingUp },
              { label: "Margem Líquida", valor: "18%", meta: "25%", status: "abaixo", icone: TrendingDown },
              { label: "ROI do Mês", valor: "22%", meta: "20%", status: "acima", icone: TrendingUp },
              { label: "Ponto de Equilíbrio", valor: "R$ 28.500", meta: "R$ 30.000", status: "acima", icone: DollarSign },
              { label: "Ticket Médio", valor: "R$ 4.133", meta: "R$ 5.000", status: "abaixo", icone: BarChart2 },
              { label: "Score Financeiro", valor: "87/100", meta: "90/100", status: "abaixo", icone: BarChart2 },
            ].map((ind, i) => (
              <div key={i} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{ind.label}</p>
                  <ind.icone size={16} style={{color: ind.status === "acima" ? "#34d399" : "#f87171"}}/>
                </div>
                <p className="text-2xl font-bold mb-2" style={{color: "#c8d8f0"}}>{ind.valor}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full" style={{background: ind.status === "acima" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: ind.status === "acima" ? "#34d399" : "#f87171"}}>
                    {ind.status === "acima" ? "✓ Acima da meta" : "↓ Abaixo da meta"}
                  </span>
                  <span className="text-xs" style={{color: "#3a5a8a"}}>Meta: {ind.meta}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}