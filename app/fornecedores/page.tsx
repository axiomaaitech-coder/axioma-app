"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowLeft, Trash2, X } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

const categorias = ["Produtos", "Marketing", "Logística", "Tecnologia", "Serviços", "Outros"];

const fornecedoresIniciais = [
  { id: 1, nome: "Distribuidora ABC", categoria: "Produtos", produto: "Matéria prima", contato: "(11) 99999-1111", valor: 4500 },
  { id: 2, nome: "Agência Digital XYZ", categoria: "Marketing", produto: "Marketing digital", contato: "(11) 99999-2222", valor: 1200 },
  { id: 3, nome: "Transportadora Rápida", categoria: "Logística", produto: "Frete e logística", contato: "(11) 99999-3333", valor: 850 },
  { id: 4, nome: "Tech Solutions", categoria: "Tecnologia", produto: "Suporte TI", contato: "(11) 99999-4444", valor: 600 },
];

export default function Fornecedores() {
  const router = useRouter();
  const { t } = useLanguage();
  const [fornecedores, setFornecedores] = useState(fornecedoresIniciais);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ nome: "", categoria: categorias[0], produto: "", contato: "", valor: "" });

  const fornecedoresFiltrados = fornecedores.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()));
  const totalMensal = fornecedores.reduce((acc, f) => acc + f.valor, 0);

  const adicionarFornecedor = () => {
    if (!novo.nome || !novo.valor) return;
    setFornecedores([...fornecedores, { ...novo, id: Date.now(), valor: parseFloat(novo.valor) }]);
    setNovo({ nome: "", categoria: categorias[0], produto: "", contato: "", valor: "" });
    setModalAberto(false);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{background: "#020810"}}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.fornecedores.titulo}</h2>
          </div>
          <p className="text-sm" style={{color: "#3a5a8a"}}>{t.fornecedores.subtitulo}</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
          <Plus size={18}/>{t.fornecedores.novoFornecedor}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t.fornecedores.gastoMensal, value: `R$ ${totalMensal.toLocaleString("pt-BR")}`, color: "#f87171" },
          { label: t.fornecedores.gastoAnual, value: `R$ ${(totalMensal * 12).toLocaleString("pt-BR")}`, color: "#fbbf24" },
          { label: t.fornecedores.totalFornecedores, value: `${fornecedores.length} ${t.fornecedores.ativos}`, color: "#6ab0ff" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{color: "#3a5a8a"}}>{card.label}</p>
            <p className="text-2xl font-bold" style={{color: card.color}}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <Search size={16} style={{color: "#3a5a8a"}}/>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.fornecedores.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <table className="w-full">
          <thead>
            <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
              {[t.fornecedores.nome, t.geral.categoria, t.fornecedores.produto, t.fornecedores.contato, t.geral.mensal, t.geral.anual, t.geral.acoes].map(h => (
                <th key={h} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fornecedoresFiltrados.map((f, i) => (
              <tr key={f.id} style={{borderBottom: i < fornecedoresFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{background: "rgba(59,111,212,0.2)", color: "#6ab0ff"}}>{f.nome.charAt(0)}</div>
                    <span className="text-sm" style={{color: "#c8d8f0"}}>{f.nome}</span>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="text-xs px-3 py-1 rounded-full" style={{background: "rgba(59,111,212,0.1)", color: "#6ab0ff"}}>{f.categoria}</span></td>
                <td className="px-6 py-4 text-sm" style={{color: "#c8d8f0"}}>{f.produto}</td>
                <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>{f.contato}</td>
                <td className="px-6 py-4 text-sm font-bold" style={{color: "#f87171"}}>R$ {f.valor.toLocaleString("pt-BR")}</td>
                <td className="px-6 py-4 text-sm font-bold" style={{color: "#fbbf24"}}>R$ {(f.valor * 12).toLocaleString("pt-BR")}</td>
                <td className="px-6 py-4"><button onClick={() => setFornecedores(fornecedores.filter(x => x.id !== f.id))} style={{color: "#f87171"}}><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>{t.fornecedores.novoFornecedor}</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.fornecedores.nome}</label>
                <input value={novo.nome} onChange={(e) => setNovo({...novo, nome: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.fornecedores.produto}</label>
                <input value={novo.produto} onChange={(e) => setNovo({...novo, produto: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.fornecedores.contato}</label>
                <input value={novo.contato} onChange={(e) => setNovo({...novo, contato: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.fornecedores.valorMensal}</label>
                <input type="number" value={novo.valor} onChange={(e) => setNovo({...novo, valor: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.categoria}</label>
                <select value={novo.categoria} onChange={(e) => setNovo({...novo, categoria: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={adicionarFornecedor} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                {t.fornecedores.salvarFornecedor}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}