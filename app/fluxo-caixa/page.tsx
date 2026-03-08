"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Plus, X } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
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
  const { t } = useLanguage();
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
    <div className="min-h-screen p-8 overflow-auto" style={{background: "#020810"}}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.fluxoCaixa.titulo}</h2>
          </div>
          <p className="text-sm" style={{color: "#3a5a8a"}}>{t.fluxoCaixa.subtitulo}</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
          <Plus size={18}/>{t.fluxoCaixa.novoLancamento}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t.fluxoCaixa.totalEntradas, value: `R$ ${totalEntradas.toLocaleString("pt-BR")}`, color: "#34d399", icon: TrendingUp },
          { label: t.fluxoCaixa.totalSaidas, value: `R$ ${totalSaidas.toLocaleString("pt-BR")}`, color: "#f87171", icon: TrendingDown },
          { label: t.fluxoCaixa.saldoAtual, value: `R$ ${saldoAtual.toLocaleString("pt-BR")}`, color: saldoAtual >= 0 ? "#34d399" : "#f87171", icon: saldoAtual >= 0 ? TrendingUp : AlertTriangle },
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

      <div className="rounded-2xl p-6 mb-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <h3 className="text-sm font-semibold mb-6" style={{color: "#c8d8f0"}}>{t.fluxoCaixa.historico}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dadosMensais}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)"/>
            <XAxis dataKey="mes" stroke="#3a5a8a" tick={{fontSize: 12}}/>
            <YAxis stroke="#3a5a8a" tick={{fontSize: 12}}/>
            <Tooltip contentStyle={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0"}}/>
            <Legend/>
            <Bar dataKey="entradas" fill="#3b6fd4" radius={[4,4,0,0]} name={t.fluxoCaixa.totalEntradas}/>
            <Bar dataKey="saidas" fill="#f87171" radius={[4,4,0,0]} name={t.fluxoCaixa.totalSaidas}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <h3 className="text-sm font-semibold mb-2" style={{color: "#c8d8f0"}}>{t.fluxoCaixa.previsao}</h3>
        <p className="text-xs mb-6" style={{color: "#3a5a8a"}}>{t.fluxoCaixa.cenarios}</p>
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

      <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <div className="px-6 py-4 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
          <h3 className="text-sm font-semibold" style={{color: "#c8d8f0"}}>{t.fluxoCaixa.lancamentos}</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
              {[t.geral.descricao, t.geral.status, t.geral.data, t.geral.status, t.geral.valor].map((h, i) => (
                <th key={i} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l, i) => (
              <tr key={l.id} style={{borderBottom: i < lancamentos.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                <td className="px-6 py-4 text-sm" style={{color: "#c8d8f0"}}>{l.descricao}</td>
                <td className="px-6 py-4">
                  <span className="text-xs px-3 py-1 rounded-full" style={{background: l.tipo === "entrada" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: l.tipo === "entrada" ? "#34d399" : "#f87171"}}>
                    {l.tipo === "entrada" ? t.fluxoCaixa.entrada : t.fluxoCaixa.saida}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>{new Date(l.data).toLocaleDateString("pt-BR")}</td>
                <td className="px-6 py-4">
                  <span className="text-xs px-3 py-1 rounded-full" style={{background: l.status === "realizado" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: l.status === "realizado" ? "#34d399" : "#fbbf24"}}>
                    {l.status === "realizado" ? t.fluxoCaixa.realizado : t.fluxoCaixa.previsto}
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

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>{t.fluxoCaixa.novoLancamento}</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.descricao}</label>
                <input value={novo.descricao} onChange={(e) => setNovo({...novo, descricao: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.status}</label>
                <select value={novo.tipo} onChange={(e) => setNovo({...novo, tipo: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  <option value="entrada">{t.fluxoCaixa.entrada}</option>
                  <option value="saida">{t.fluxoCaixa.saida}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.valor}</label>
                <input type="number" value={novo.valor} onChange={(e) => setNovo({...novo, valor: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.data}</label>
                <input type="date" value={novo.data} onChange={(e) => setNovo({...novo, data: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.status}</label>
                <select value={novo.status} onChange={(e) => setNovo({...novo, status: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  <option value="previsto">{t.fluxoCaixa.previsto}</option>
                  <option value="realizado">{t.fluxoCaixa.realizado}</option>
                </select>
              </div>
              <button onClick={adicionarLancamento} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                {t.fluxoCaixa.salvarLancamento}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}