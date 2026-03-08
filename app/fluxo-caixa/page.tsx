"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Plus, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const dadosMensais = [
  { mes: "Jan", entradas: 42000, saidas: 31000, saldo: 11000 },
  { mes: "Fev", entradas: 48000, saidas: 33000, saldo: 15000 },
  { mes: "Mar", entradas: 45000, saidas: 29000, saldo: 16000 },
  { mes: "Abr", entradas: 53000, saidas: 35000, saldo: 18000 },
  { mes: "Mai", entradas: 58000, saidas: 38000, saldo: 20000 },
  { mes: "Jun", entradas: 62000, saidas: 40000, saldo: 22000 },
];

const previsao = [
  { mes: "Jul", previsto: 65000, pessimista: 52000, otimista: 78000 },
  { mes: "Ago", previsto: 68000, pessimista: 54000, otimista: 82000 },
  { mes: "Set", previsto: 71000, pessimista: 56000, otimista: 86000 },
];

const lancamentosIniciais = [
  { id: 1, descricao: "Recebimento cliente A", tipo: "entrada", valor: 15000, data: "2026-03-05", status: "realizado" },
  { id: 2, descricao: "Pagamento fornecedor", tipo: "saida", valor: 4500, data: "2026-03-08", status: "realizado" },
  { id: 3, descricao: "Folha de pagamento", tipo: "saida", valor: 12000, data: "2026-03-10", status: "previsto" },
  { id: 4, descricao: "Recebimento cliente B", tipo: "entrada", valor: 8000, data: "2026-03-15", status: "previsto" },
];

export default function FluxoCaixa() {
  const router = useRouter();
  const [lancamentos, setLancamentos] = useState(lancamentosIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" });

  const totalEntradas = lancamentos.filter(l => l.tipo === "entrada").reduce((acc, l) => acc + l.valor, 0);
  const totalSaidas = lancamentos.filter(l => l.tipo === "saida").reduce((acc, l) => acc + l.valor, 0);
  const saldoAtual = totalEntradas - totalSaidas;

  const adicionarLancamento = () => {
    if (!novo.descricao || !novo.valor || !novo.data) return;
    setLancamentos([...lancamentos, { ...novo, id: Date.now(), valor: parseFloat(novo.valor) }]);
    setNovo({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" });
    setModalAberto(false);
  };

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
            { label: "Fluxo de Caixa", path: "/fluxo-caixa", active: true },
            { label: "Empresa", path: "/empresa" },
            { label: "Relatórios", path: "/relatorios" },
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
              <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>Fluxo de Caixa</h2>
            </div>
            <p className="text-sm" style={{color: "#3a5a8a"}}>Entradas, saídas e previsão 30/60/90 dias</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
            <Plus size={18}/>
            Novo Lançamento
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Entradas", value: `R$ ${totalEntradas.toLocaleString("pt-BR")}`, color: "#34d399", icon: TrendingUp },
            { label: "Total Saídas", value: `R$ ${totalSaidas.toLocaleString("pt-BR")}`, color: "#f87171", icon: TrendingDown },
            { label: "Saldo Atual", value: `R$ ${saldoAtual.toLocaleString("pt-BR")}`, color: saldoAtual >= 0 ? "#34d399" : "#f87171", icon: saldoAtual >= 0 ? TrendingUp : AlertTriangle },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{card.label}</p>
                <card.icon size={16} style={{color: card.color}}/>
              </div>
              <p className="text-2xl font-bold" style={{color: card.color}}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Gráfico histórico */}
        <div className="rounded-2xl p-6 mb-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <h3 className="text-sm font-semibold mb-6" style={{color: "#c8d8f0"}}>📊 Histórico — Entradas vs Saídas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosMensais}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)"/>
              <XAxis dataKey="mes" stroke="#3a5a8a" tick={{fontSize: 12}}/>
              <YAxis stroke="#3a5a8a" tick={{fontSize: 12}}/>
              <Tooltip contentStyle={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0"}}/>
              <Legend/>
              <Bar dataKey="entradas" fill="#3b6fd4" radius={[4,4,0,0]} name="Entradas"/>
              <Bar dataKey="saidas" fill="#f87171" radius={[4,4,0,0]} name="Saídas"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Previsão */}
        <div className="rounded-2xl p-6 mb-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <h3 className="text-sm font-semibold mb-2" style={{color: "#c8d8f0"}}>🔮 Previsão 30/60/90 dias</h3>
          <p className="text-xs mb-6" style={{color: "#3a5a8a"}}>Cenários: otimista, previsto e pessimista</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={previsao}>
              <defs>
                <linearGradient id="otimista" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="pessimista" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)"/>
              <XAxis dataKey="mes" stroke="#3a5a8a" tick={{fontSize: 12}}/>
              <YAxis stroke="#3a5a8a" tick={{fontSize: 12}}/>
              <Tooltip contentStyle={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0"}}/>
              <Legend/>
              <Area type="monotone" dataKey="otimista" stroke="#34d399" fill="url(#otimista)" strokeWidth={2} name="Otimista"/>
              <Area type="monotone" dataKey="previsto" stroke="#3b6fd4" strokeWidth={2} fill="none" name="Previsto"/>
              <Area type="monotone" dataKey="pessimista" stroke="#f87171" fill="url(#pessimista)" strokeWidth={2} name="Pessimista"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lançamentos */}
        <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <div className="px-6 py-4 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
            <h3 className="text-sm font-semibold" style={{color: "#c8d8f0"}}>Lançamentos do Mês</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
                {["Descrição", "Tipo", "Data", "Status", "Valor"].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l, i) => (
                <tr key={l.id} style={{borderBottom: i < lancamentos.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                  <td className="px-6 py-4 text-sm" style={{color: "#c8d8f0"}}>{l.descricao}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-3 py-1 rounded-full" style={{background: l.tipo === "entrada" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: l.tipo === "entrada" ? "#34d399" : "#f87171"}}>
                      {l.tipo === "entrada" ? "↑ Entrada" : "↓ Saída"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>{new Date(l.data).toLocaleDateString("pt-BR")}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-3 py-1 rounded-full" style={{background: l.status === "realizado" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: l.status === "realizado" ? "#34d399" : "#fbbf24"}}>
                      {l.status === "realizado" ? "✓ Realizado" : "⏳ Previsto"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold" style={{color: l.tipo === "entrada" ? "#34d399" : "#f87171"}}>
                    {l.tipo === "entrada" ? "+" : "-"} R$ {l.valor.toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>Novo Lançamento</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Descrição</label>
                <input value={novo.descricao} onChange={(e) => setNovo({...novo, descricao: e.target.value})} placeholder="Ex: Recebimento cliente" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Tipo</label>
                <select value={novo.tipo} onChange={(e) => setNovo({...novo, tipo: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Valor (R$)</label>
                <input type="number" value={novo.valor} onChange={(e) => setNovo({...novo, valor: e.target.value})} placeholder="0,00" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Data</label>
                <input type="date" value={novo.data} onChange={(e) => setNovo({...novo, data: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Status</label>
                <select value={novo.status} onChange={(e) => setNovo({...novo, status: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  <option value="previsto">Previsto</option>
                  <option value="realizado">Realizado</option>
                </select>
              </div>
              <button onClick={adicionarLancamento} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                Salvar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}