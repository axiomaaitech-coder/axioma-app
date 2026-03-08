"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowLeft, Trash2, X } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

const categorias = ["Matéria prima","Comissões","Marketing e vendas","Logística","Manutenção","Embalagens","Outros"];

const custosIniciais = [
  { id: 1, descricao: "Matéria prima lote A", valor: 4500, data: "2026-03-02", categoria: "Matéria prima" },
  { id: 2, descricao: "Comissão vendedores", valor: 2100, data: "2026-03-05", categoria: "Comissões" },
  { id: 3, descricao: "Google Ads", valor: 1800, data: "2026-03-08", categoria: "Marketing e vendas" },
  { id: 4, descricao: "Frete entregas", valor: 950, data: "2026-03-10", categoria: "Logística" },
];

export default function CustosVariaveis() {
  const router = useRouter();
  const { t } = useLanguage();
  const [custos, setCustos] = useState(custosIniciais);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ descricao: "", valor: "", data: "", categoria: categorias[0] });

  const custosFiltrados = custos.filter(c => c.descricao.toLowerCase().includes(busca.toLowerCase()));
  const totalMes = custos.reduce((acc, c) => acc + c.valor, 0);
  const maiorCusto = Math.max(...custos.map(c => c.valor));

  const adicionarCusto = () => {
    if (!novo.descricao || !novo.valor) return;
    setCustos([...custos, { ...novo, id: Date.now(), valor: parseFloat(novo.valor) }]);
    setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0] });
    setModalAberto(false);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{background: "#020810"}}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.custosVariaveis.titulo}</h2>
          </div>
          <p className="text-sm" style={{color: "#3a5a8a"}}>{t.custosVariaveis.subtitulo}</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
          <Plus size={18}/>{t.custosVariaveis.novoCusto}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t.custosVariaveis.totalMes, value: `R$ ${totalMes.toLocaleString("pt-BR")}`, color: "#f87171" },
          { label: t.custosVariaveis.lancamentos, value: `${custos.length}`, color: "#6ab0ff" },
          { label: t.custosVariaveis.maiorCusto, value: `R$ ${maiorCusto.toLocaleString("pt-BR")}`, color: "#fbbf24" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{color: "#3a5a8a"}}>{card.label}</p>
            <p className="text-2xl font-bold" style={{color: card.color}}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <Search size={16} style={{color: "#3a5a8a"}}/>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.custosVariaveis.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <table className="w-full">
          <thead>
            <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
              {[t.geral.descricao, t.geral.categoria, t.geral.data, t.custosVariaveis.percentual, t.geral.valor, t.geral.acoes].map((h, i) => (
                <th key={i} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {custosFiltrados.map((c, i) => (
              <tr key={c.id} style={{borderBottom: i < custosFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                <td className="px-6 py-4 text-sm" style={{color: "#c8d8f0"}}>{c.descricao}</td>
                <td className="px-6 py-4"><span className="text-xs px-3 py-1 rounded-full" style={{background: "rgba(59,111,212,0.1)", color: "#6ab0ff"}}>{c.categoria}</span></td>
                <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>{new Date(c.data).toLocaleDateString("pt-BR")}</td>
                <td className="px-6 py-4 text-sm font-bold" style={{color: "#6ab0ff"}}>{((c.valor/totalMes)*100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-sm font-bold" style={{color: "#f87171"}}>R$ {c.valor.toLocaleString("pt-BR")}</td>
                <td className="px-6 py-4"><button onClick={() => setCustos(custos.filter(x => x.id !== c.id))} style={{color: "#f87171"}}><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>{t.custosVariaveis.novoCusto}</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.descricao}</label>
                <input value={novo.descricao} onChange={(e) => setNovo({...novo, descricao: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
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
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.categoria}</label>
                <select value={novo.categoria} onChange={(e) => setNovo({...novo, categoria: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={adicionarCusto} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                {t.custosVariaveis.salvarCusto}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}