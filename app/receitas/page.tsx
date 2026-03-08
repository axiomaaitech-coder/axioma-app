"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DollarSign, Plus, Search, Filter, TrendingUp, ArrowLeft, Trash2, Edit, X, Check } from "lucide-react";

const categorias = [
  "Vendas de produtos",
  "Prestação de serviços",
  "Recorrentes",
  "Eventuais",
  "Outras",
];

const receitasIniciais = [
  { id: 1, descricao: "Venda de produto A", valor: 5000, data: "2026-03-01", categoria: "Vendas de produtos", status: "recebido" },
  { id: 2, descricao: "Consultoria mensal", valor: 8000, data: "2026-03-05", categoria: "Prestação de serviços", status: "recebido" },
  { id: 3, descricao: "Mensalidade cliente X", valor: 1500, data: "2026-03-10", categoria: "Recorrentes", status: "pendente" },
  { id: 4, descricao: "Venda eventual", valor: 3200, data: "2026-03-15", categoria: "Eventuais", status: "recebido" },
];

export default function Receitas() {
  const router = useRouter();
  const [receitas, setReceitas] = useState(receitasIniciais);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [nova, setNova] = useState({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido" });

  const receitasFiltradas = receitas.filter(r => {
    const buscaOk = r.descricao.toLowerCase().includes(busca.toLowerCase());
    const categoriaOk = filtroCategoria === "Todas" || r.categoria === filtroCategoria;
    return buscaOk && categoriaOk;
  });

  const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);
  const totalRecebido = receitas.filter(r => r.status === "recebido").reduce((acc, r) => acc + r.valor, 0);
  const totalPendente = receitas.filter(r => r.status === "pendente").reduce((acc, r) => acc + r.valor, 0);

  const adicionarReceita = () => {
    if (!nova.descricao || !nova.valor || !nova.data) return;
    setReceitas([...receitas, { ...nova, id: Date.now(), valor: parseFloat(nova.valor) }]);
    setNova({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido" });
    setModalAberto(false);
  };

  const excluirReceita = (id: number) => {
    setReceitas(receitas.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen flex" style={{background: "#020810"}}>

      {/* Sidebar */}
      <div className="w-64 min-h-screen flex flex-col" style={{background: "rgba(10,22,40,0.95)", borderRight: "1px solid rgba(59,111,212,0.15)"}}>
        <div className="p-6 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
          <Image src="/logo.png" alt="Axioma" width={140} height={50} className="object-contain"/>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { label: "Dashboard", path: "/dashboard" },
            { label: "Receitas", path: "/receitas", active: true },
            { label: "Custos Fixos", path: "/custos-fixos" },
            { label: "Custos Variáveis", path: "/custos-variaveis" },
            { label: "Fornecedores", path: "/fornecedores" },
            { label: "Empresa", path: "/empresa" },
            { label: "Relatórios", path: "/relatorios" },
          ].map((item) => (
            <div key={item.label} onClick={() => router.push(item.path)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all" style={{background: item.active ? "rgba(59,111,212,0.15)" : "transparent", color: item.active ? "#6ab0ff" : "#3a5a8a"}}>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}>
                <ArrowLeft size={20}/>
              </button>
              <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>Receitas</h2>
            </div>
            <p className="text-sm" style={{color: "#3a5a8a"}}>Gerencie todas as entradas financeiras</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
            <Plus size={18}/>
            Nova Receita
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total de Receitas", value: `R$ ${totalReceitas.toLocaleString("pt-BR")}`, color: "#6ab0ff" },
            { label: "Recebido", value: `R$ ${totalRecebido.toLocaleString("pt-BR")}`, color: "#34d399" },
            { label: "Pendente", value: `R$ ${totalPendente.toLocaleString("pt-BR")}`, color: "#f87171" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{color: "#3a5a8a"}}>{card.label}</p>
              <p className="text-2xl font-bold" style={{color: card.color}}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <Search size={16} style={{color: "#3a5a8a"}}/>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar receita..." className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
          </div>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-4 py-3 rounded-xl text-sm focus:outline-none" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)", color: "#c8d8f0"}}>
            <option>Todas</option>
            {categorias.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Tabela */}
        <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <table className="w-full">
            <thead>
              <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
                {["Descrição", "Categoria", "Data", "Status", "Valor", "Ações"].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receitasFiltradas.map((r, i) => (
                <tr key={r.id} style={{borderBottom: i < receitasFiltradas.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                  <td className="px-6 py-4 text-sm" style={{color: "#c8d8f0"}}>{r.descricao}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-3 py-1 rounded-full" style={{background: "rgba(59,111,212,0.1)", color: "#6ab0ff"}}>{r.categoria}</span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-3 py-1 rounded-full" style={{background: r.status === "recebido" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: r.status === "recebido" ? "#34d399" : "#f87171"}}>
                      {r.status === "recebido" ? "✓ Recebido" : "⏳ Pendente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold" style={{color: "#34d399"}}>R$ {r.valor.toLocaleString("pt-BR")}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => excluirReceita(r.id)} className="p-2 rounded-lg transition-all hover:scale-110" style={{color: "#f87171"}}>
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Receita */}
      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>Nova Receita</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Descrição</label>
                <input value={nova.descricao} onChange={(e) => setNova({...nova, descricao: e.target.value})} placeholder="Ex: Venda de produto" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Valor (R$)</label>
                <input type="number" value={nova.valor} onChange={(e) => setNova({...nova, valor: e.target.value})} placeholder="0,00" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Data</label>
                <input type="date" value={nova.data} onChange={(e) => setNova({...nova, data: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Categoria</label>
                <select value={nova.categoria} onChange={(e) => setNova({...nova, categoria: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Status</label>
                <select value={nova.status} onChange={(e) => setNova({...nova, status: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  <option value="recebido">Recebido</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
              <button onClick={adicionarReceita} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                Salvar Receita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}