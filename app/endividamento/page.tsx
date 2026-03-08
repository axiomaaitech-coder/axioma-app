"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowLeft, Trash2, X, AlertTriangle } from "lucide-react";

const tipos = [
  "Empréstimo bancário",
  "Cartão de crédito",
  "Cheque especial",
  "Financiamento",
  "Carta de crédito",
  "Outros",
];

const dividasIniciais = [
  { id: 1, descricao: "Empréstimo Banco X", tipo: "Empréstimo bancário", valor_total: 50000, valor_pago: 15000, parcelas: 24, vencimento: "2026-04-01", taxa_juros: 1.8, status: "ativo" },
  { id: 2, descricao: "Cartão Corporativo", tipo: "Cartão de crédito", valor_total: 8500, valor_pago: 0, parcelas: 1, vencimento: "2026-03-20", taxa_juros: 3.5, status: "ativo" },
  { id: 3, descricao: "Financiamento equipamento", tipo: "Financiamento", valor_total: 30000, valor_pago: 12000, parcelas: 36, vencimento: "2026-04-10", taxa_juros: 1.2, status: "ativo" },
];

export default function Endividamento() {
  const router = useRouter();
  const [dividas, setDividas] = useState(dividasIniciais);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "", status: "ativo" });

  const dividasFiltradas = dividas.filter(d => d.descricao.toLowerCase().includes(busca.toLowerCase()));

  const totalDivida = dividas.reduce((acc, d) => acc + d.valor_total, 0);
  const totalPago = dividas.reduce((acc, d) => acc + d.valor_pago, 0);
  const totalRestante = totalDivida - totalPago;

  const adicionarDivida = () => {
    if (!novo.descricao || !novo.valor_total) return;
    setDividas([...dividas, { ...novo, id: Date.now(), valor_total: parseFloat(novo.valor_total), valor_pago: parseFloat(novo.valor_pago || "0"), parcelas: parseInt(novo.parcelas || "1"), taxa_juros: parseFloat(novo.taxa_juros || "0") }]);
    setNovo({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "", status: "ativo" });
    setModalAberto(false);
  };

  const excluirDivida = (id: number) => setDividas(dividas.filter(d => d.id !== id));

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
            { label: "Endividamento", path: "/endividamento", active: true },
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
              <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>Endividamento</h2>
            </div>
            <p className="text-sm" style={{color: "#3a5a8a"}}>Gerencie empréstimos, financiamentos e dívidas</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
            <Plus size={18}/>
            Nova Dívida
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total em Dívidas", value: `R$ ${totalDivida.toLocaleString("pt-BR")}`, color: "#f87171" },
            { label: "Total Pago", value: `R$ ${totalPago.toLocaleString("pt-BR")}`, color: "#34d399" },
            { label: "Saldo Restante", value: `R$ ${totalRestante.toLocaleString("pt-BR")}`, color: "#fbbf24" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{color: "#3a5a8a"}}>{card.label}</p>
              <p className="text-2xl font-bold" style={{color: card.color}}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <Search size={16} style={{color: "#3a5a8a"}}/>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar dívida..." className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
          </div>
        </div>

        <div className="space-y-4">
          {dividasFiltradas.map((d) => {
            const progresso = (d.valor_pago / d.valor_total) * 100;
            const restante = d.valor_total - d.valor_pago;
            return (
              <div key={d.id} className="rounded-2xl p-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold mb-1" style={{color: "#c8d8f0"}}>{d.descricao}</h3>
                    <span className="text-xs px-3 py-1 rounded-full" style={{background: "rgba(248,113,113,0.1)", color: "#f87171"}}>{d.tipo}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{color: "#3a5a8a"}}>Taxa de juros</p>
                      <p className="font-bold" style={{color: "#fbbf24"}}>{d.taxa_juros}% a.m.</p>
                    </div>
                    <button onClick={() => excluirDivida(d.id)} className="p-2 rounded-lg" style={{color: "#f87171"}}><Trash2 size={16}/></button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs mb-1" style={{color: "#3a5a8a"}}>Valor Total</p>
                    <p className="font-bold" style={{color: "#f87171"}}>R$ {d.valor_total.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{color: "#3a5a8a"}}>Já Pago</p>
                    <p className="font-bold" style={{color: "#34d399"}}>R$ {d.valor_pago.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{color: "#3a5a8a"}}>Restante</p>
                    <p className="font-bold" style={{color: "#fbbf24"}}>R$ {restante.toLocaleString("pt-BR")}</p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{color: "#3a5a8a"}}>Progresso de pagamento</span>
                    <span className="text-xs font-bold" style={{color: "#6ab0ff"}}>{progresso.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{background: "rgba(59,111,212,0.1)"}}>
                    <div className="h-2 rounded-full transition-all" style={{width: `${progresso}%`, background: "linear-gradient(90deg, #1a3a8f, #2a5fd4)"}}/>
                  </div>
                </div>

                <div className="flex justify-between mt-3">
                  <span className="text-xs" style={{color: "#3a5a8a"}}>Vencimento: {new Date(d.vencimento).toLocaleDateString("pt-BR")}</span>
                  <span className="text-xs" style={{color: "#3a5a8a"}}>{d.parcelas}x parcelas</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>Nova Dívida</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Descrição</label>
                <input value={novo.descricao} onChange={(e) => setNovo({...novo, descricao: e.target.value})} placeholder="Ex: Empréstimo Banco X" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Tipo</label>
                <select value={novo.tipo} onChange={(e) => setNovo({...novo, tipo: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {tipos.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Valor Total (R$)</label>
                  <input type="number" value={novo.valor_total} onChange={(e) => setNovo({...novo, valor_total: e.target.value})} placeholder="0,00" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Valor Pago (R$)</label>
                  <input type="number" value={novo.valor_pago} onChange={(e) => setNovo({...novo, valor_pago: e.target.value})} placeholder="0,00" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Parcelas</label>
                  <input type="number" value={novo.parcelas} onChange={(e) => setNovo({...novo, parcelas: e.target.value})} placeholder="Ex: 24" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Taxa Juros % a.m.</label>
                  <input type="number" value={novo.taxa_juros} onChange={(e) => setNovo({...novo, taxa_juros: e.target.value})} placeholder="Ex: 1.8" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Vencimento</label>
                <input type="date" value={novo.vencimento} onChange={(e) => setNovo({...novo, vencimento: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <button onClick={adicionarDivida} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                Salvar Dívida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}