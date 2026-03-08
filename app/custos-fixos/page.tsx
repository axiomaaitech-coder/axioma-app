"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowLeft, Trash2, X } from "lucide-react";

const categorias = [
  "Aluguel/Imóvel",
  "Folha de pagamento",
  "Serviços essenciais",
  "Sistemas e assinaturas",
  "Seguros",
  "Contabilidade",
  "Outros",
];

const custosIniciais = [
  { id: 1, descricao: "Aluguel do escritório", valor: 3500, vencimento: 5, categoria: "Aluguel/Imóvel" },
  { id: 2, descricao: "Folha de pagamento", valor: 12000, vencimento: 1, categoria: "Folha de pagamento" },
  { id: 3, descricao: "Internet e telefone", valor: 450, vencimento: 10, categoria: "Serviços essenciais" },
  { id: 4, descricao: "Sistema de gestão", valor: 299, vencimento: 15, categoria: "Sistemas e assinaturas" },
];

export default function CustosFixos() {
  const router = useRouter();
  const [custos, setCustos] = useState(custosIniciais);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ descricao: "", valor: "", vencimento: "", categoria: categorias[0] });

  const custosFiltrados = custos.filter(c => {
    const buscaOk = c.descricao.toLowerCase().includes(busca.toLowerCase());
    const categoriaOk = filtroCategoria === "Todas" || c.categoria === filtroCategoria;
    return buscaOk && categoriaOk;
  });

  const totalMensal = custos.reduce((acc, c) => acc + c.valor, 0);
  const totalAnual = totalMensal * 12;

  const adicionarCusto = () => {
    if (!novo.descricao || !novo.valor || !novo.vencimento) return;
    setCustos([...custos, { ...novo, id: Date.now(), valor: parseFloat(novo.valor), vencimento: parseInt(novo.vencimento) }]);
    setNovo({ descricao: "", valor: "", vencimento: "", categoria: categorias[0] });
    setModalAberto(false);
  };

  const excluirCusto = (id: number) => {
    setCustos(custos.filter(c => c.id !== id));
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
            { label: "Receitas", path: "/receitas" },
            { label: "Custos Fixos", path: "/custos-fixos", active: true },
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
              <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>Custos Fixos</h2>
            </div>
            <p className="text-sm" style={{color: "#3a5a8a"}}>Gerencie seus custos mensais fixos</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
            <Plus size={18}/>
            Novo Custo Fixo
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Mensal", value: `R$ ${totalMensal.toLocaleString("pt-BR")}`, color: "#f87171" },
            { label: "Total Anual", value: `R$ ${totalAnual.toLocaleString("pt-BR")}`, color: "#fbbf24" },
            { label: "Qtd de Custos", value: `${custos.length} itens`, color: "#6ab0ff" },
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
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar custo fixo..." className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
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
                {["Descrição", "Categoria", "Vencimento", "Valor Mensal", "Valor Anual", "Ações"].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custosFiltrados.map((c, i) => (
                <tr key={c.id} style={{borderBottom: i < custosFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                  <td className="px-6 py-4 text-sm" style={{color: "#c8d8f0"}}>{c.descricao}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-3 py-1 rounded-full" style={{background: "rgba(248,113,113,0.1)", color: "#f87171"}}>{c.categoria}</span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>Dia {c.vencimento}</td>
                  <td className="px-6 py-4 text-sm font-bold" style={{color: "#f87171"}}>R$ {c.valor.toLocaleString("pt-BR")}</td>
                  <td className="px-6 py-4 text-sm" style={{color: "#fbbf24"}}>R$ {(c.valor * 12).toLocaleString("pt-BR")}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => excluirCusto(c.id)} className="p-2 rounded-lg transition-all hover:scale-110" style={{color: "#f87171"}}>
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>Novo Custo Fixo</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Descrição</label>
                <input value={novo.descricao} onChange={(e) => setNovo({...novo, descricao: e.target.value})} placeholder="Ex: Aluguel do escritório" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Valor Mensal (R$)</label>
                <input type="number" value={novo.valor} onChange={(e) => setNovo({...novo, valor: e.target.value})} placeholder="0,00" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Dia do Vencimento</label>
                <input type="number" min="1" max="31" value={novo.vencimento} onChange={(e) => setNovo({...novo, vencimento: e.target.value})} placeholder="Ex: 5" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>Categoria</label>
                <select value={novo.categoria} onChange={(e) => setNovo({...novo, categoria: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={adicionarCusto} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                Salvar Custo Fixo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}