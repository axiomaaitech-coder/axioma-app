"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowLeft, Trash2, X } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

const categorias = ["Vendas de produtos","Prestação de serviços","Recorrentes","Eventuais","Outras"];

const receitasIniciais = [
  { id: 1, descricao: "Venda produto A", valor: 5500, data: "2026-03-01", categoria: "Vendas de produtos", status: "recebido" },
  { id: 2, descricao: "Consultoria mensal", valor: 3200, data: "2026-03-05", categoria: "Prestação de serviços", status: "recebido" },
  { id: 3, descricao: "Assinatura recorrente", valor: 1800, data: "2026-03-10", categoria: "Recorrentes", status: "recebido" },
  { id: 4, descricao: "Projeto especial", valor: 7200, data: "2026-03-15", categoria: "Eventuais", status: "recebido" },
  { id: 5, descricao: "Venda produto B", valor: 1500, data: "2026-03-20", categoria: "Vendas de produtos", status: "pendente" },
];

export default function Receitas() {
  const router = useRouter();
  const { t } = useLanguage();
  const [receitas, setReceitas] = useState(receitasIniciais);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido" });

  const receitasFiltradas = receitas.filter(r =>
    r.descricao.toLowerCase().includes(busca.toLowerCase()) &&
    (filtroCategoria === "todas" || r.categoria === filtroCategoria)
  );

  const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);
  const totalRecebido = receitas.filter(r => r.status === "recebido").reduce((acc, r) => acc + r.valor, 0);
  const totalPendente = receitas.filter(r => r.status === "pendente").reduce((acc, r) => acc + r.valor, 0);

  const adicionarReceita = () => {
    if (!novo.descricao || !novo.valor) return;
    setReceitas([...receitas, { ...novo, id: Date.now(), valor: parseFloat(novo.valor) }]);
    setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido" });
    setModalAberto(false);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{background: "#020810"}}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.receitas.titulo}</h2>
          </div>
          <p className="text-sm" style={{color: "#3a5a8a"}}>{t.receitas.subtitulo}</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
          <Plus size={18}/>{t.receitas.novaReceita}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t.receitas.totalReceitas, value: `R$ ${totalReceitas.toLocaleString("pt-BR")}`, color: "#6ab0ff" },
          { label: t.receitas.recebido, value: `R$ ${totalRecebido.toLocaleString("pt-BR")}`, color: "#34d399" },
          { label: t.receitas.pendente, value: `R$ ${totalPendente.toLocaleString("pt-BR")}`, color: "#fbbf24" },
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
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.receitas.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
        </div>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)", color: "#c8d8f0"}}>
          <option value="todas">{t.geral.todas}</option>
          {categorias.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <table className="w-full">
          <thead>
            <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
              {[t.geral.descricao, t.geral.categoria, t.geral.data, t.geral.status, t.geral.valor, t.geral.acoes].map((h, i) => (
                <th key={i} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receitasFiltradas.map((r, i) => (
              <tr key={r.id} style={{borderBottom: i < receitasFiltradas.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                <td className="px-6 py-4 text-sm" style={{color: "#c8d8f0"}}>{r.descricao}</td>
                <td className="px-6 py-4"><span className="text-xs px-3 py-1 rounded-full" style={{background: "rgba(59,111,212,0.1)", color: "#6ab0ff"}}>{r.categoria}</span></td>
                <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                <td className="px-6 py-4"><span className="text-xs px-3 py-1 rounded-full" style={{background: r.status === "recebido" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: r.status === "recebido" ? "#34d399" : "#fbbf24"}}>{r.status === "recebido" ? t.receitas.recebido : t.receitas.pendente}</span></td>
                <td className="px-6 py-4 text-sm font-bold" style={{color: "#34d399"}}>R$ {r.valor.toLocaleString("pt-BR")}</td>
                <td className="px-6 py-4"><button onClick={() => setReceitas(receitas.filter(x => x.id !== r.id))} style={{color: "#f87171"}}><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>{t.receitas.novaReceita}</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.descricao}</label>
                <input value={novo.descricao} onChange={(e) => setNovo({...novo, descricao: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.valor}</label>
                <input type="number" value={novo.valor} onChange={(e) => setNovo({...novo, valor: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.data}</label>
                <input type="date" value={novo.data} onChange={(e) => setNovo({...novo, data: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.categoria}</label>
                <select value={novo.categoria} onChange={(e) => setNovo({...novo, categoria: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.status}</label>
                <select value={novo.status} onChange={(e) => setNovo({...novo, status: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  <option value="recebido">{t.receitas.recebido}</option>
                  <option value="pendente">{t.receitas.pendente}</option>
                </select>
              </div>
              <button onClick={adicionarReceita} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                {t.receitas.salvarReceita}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}