"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowLeft, Trash2, X, Truck } from "lucide-react";

const categorias = [
  "Produtos",
  "Serviços",
  "Tecnologia",
  "Logística",
  "Marketing",
  "Outros",
];

const fornecedoresIniciais = [
  { id: 1, nome: "Distribuidora ABC", contato: "(11) 99999-1111", produto_servico: "Matéria prima", valor_mensal: 4500, categoria: "Produtos" },
  { id: 2, nome: "Agência Digital XYZ", contato: "(11) 99999-2222", produto_servico: "Marketing digital", valor_mensal: 1200, categoria: "Marketing" },
  { id: 3, nome: "Transportadora Rápida", contato: "(11) 99999-3333", produto_servico: "Frete e logística", valor_mensal: 850, categoria: "Logística" },
  { id: 4, nome: "Tech Solutions", contato: "(11) 99999-4444", produto_servico: "Suporte TI", valor_mensal: 600, categoria: "Tecnologia" },
];

export default function Fornecedores() {
  const router = useRouter();
  const [fornecedores, setFornecedores] = useState(fornecedoresIniciais);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ nome: "", contato: "", produto_servico: "", valor_mensal: "", categoria: categorias[0] });

  const fornecedoresFiltrados = fornecedores.filter(f => {
    const buscaOk = f.nome.toLowerCase().includes(busca.toLowerCase()) || f.produto_servico.toLowerCase().includes(busca.toLowerCase());
    const categoriaOk = filtroCategoria === "Todas" || f.categoria === filtroCategoria;
    return buscaOk && categoriaOk;
  });

  const totalMensal = fornecedores.reduce((acc, f) => acc + f.valor_mensal, 0);
  const totalAnual = totalMensal * 12;

  const adicionarFornecedor = () => {
    if (!novo.nome || !novo.valor_mensal) return;
    setFornecedores([...fornecedores, { ...novo, id: Date.now(), valor_mensal: parseFloat(novo.valor_mensal) }]);
    setNovo({ nome: "", contato: "", produto_servico: "", valor_mensal: "", categoria: categorias[0] });
    setModalAberto(false);
  };

  const excluirFornecedor = (id: number) => {
    setFornecedores(fornecedores.filter(f => f.id !== id));
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
            { label: "Fornecedores", path: "/fornecedores", active: true },
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
              <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}>
                <ArrowLeft size={20}/>
              </button>
              <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>Fornecedores</h2>
            </div>
            <p className="text-sm" style={{color: "#3a5a8a"}}>Gerencie seus fornecedores e gastos</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
            <Plus size={18}/>
            Novo Fornecedor
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Gasto Mensal", value: `R$ ${totalMensal.toLocaleString("pt-BR")}`, color: "#f87171" },
            { label: "Gasto Anual", value: `R$ ${totalAnual.toLocaleString("pt-BR")}`, color: "#fbbf24" },
            { label: "Total Fornecedores", value: `${fornecedores.length} ativos`, color: "#6ab0ff" },
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
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar fornecedor..." className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
          </div>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-4 py-3 rounded-xl text-sm focus:outline-none" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)", color: "#c8d8f0"}}>
            <option>Todas</option>
            {categorias.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <table className="w-full">
            <thead>
              <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
                {["Fornecedor", "Categoria", "Produto/Serviço", "Contato", "Valor Mensal", "Valor Anual", "Ações"].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fornecedoresFiltrados.map((f, i) => (
                <tr key={f.id} style={{borderBottom: i < fornecedoresFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{background: "rgba(59,111,212,0.2)", color: "#6ab0ff"}}>
                        {f.nome.charAt(0)}
                      </div>
                      <span className="text-sm font-medium" style={{color: "#c8d8f0"}}>{f.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-3 py-1 rounded-full" style={{background: "rgba(59,111,212,0.1)", color: "#6ab0ff"}}>{f.categoria}</span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{color: "#8aaad4"}}>{f.produto_servico}</td>
                  <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>{f.contato}</td>
                  <td className="px-6 py-4 text-sm font-bold" style={{color: "#f87171"}}>R$ {f.valor_mensal.toLocaleString("pt-BR")}</td>
                  <td className="px-6 py-4 text-sm" style={{color: "#fbbf24"}}>R$ {(f.valor_mensal * 12).toLocaleString("pt-BR")}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => excluirFornecedor(f.id)} className="p-2 rounded-lg transition-all hover:scale-110" style={{color: "#f87171"}}>
                      <Trash2 size={16}/>
                    </button>
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
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>Novo Fornecedor</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Nome do Fornecedor</label>
                <input value={novo.nome} onChange={(e) => setNovo({...novo, nome: e.target.value})} placeholder="Ex: Distribuidora ABC" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Produto/Serviço</label>
                <input value={novo.produto_servico} onChange={(e) => setNovo({...novo, produto_servico: e.target.value})} placeholder="Ex: Matéria prima" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Contato</label>
                <input value={novo.contato} onChange={(e) => setNovo({...novo, contato: e.target.value})} placeholder="Ex: (11) 99999-0000" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Valor Mensal (R$)</label>
                <input type="number" value={novo.valor_mensal} onChange={(e) => setNovo({...novo, valor_mensal: e.target.value})} placeholder="0,00" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Categoria</label>
                <select value={novo.categoria} onChange={(e) => setNovo({...novo, categoria: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={adicionarFornecedor} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                Salvar Fornecedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}