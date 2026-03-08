"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowLeft, Trash2, X } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

const categorias = ["Aluguel/Imóvel", "Folha de pagamento", "Serviços essenciais", "Sistemas e assinaturas", "Seguros", "Contabilidade", "Outros"];

const custosIniciais = [
  { id: 1, descricao: "Aluguel escritório", valor: 3500, vencimento: 5, categoria: "Aluguel/Imóvel" },
  { id: 2, descricao: "Folha de pagamento", valor: 8500, vencimento: 1, categoria: "Folha de pagamento" },
  { id: 3, descricao: "Internet e telefone", valor: 349, vencimento: 10, categoria: "Serviços essenciais" },
  { id: 4, descricao: "Software ERP", valor: 299, vencimento: 15, categoria: "Sistemas e assinaturas" },
  { id: 5, descricao: "Contabilidade", valor: 800, vencimento: 20, categoria: "Contabilidade" },
  { id: 6, descricao: "Seguro empresarial", valor: 450, vencimento: 25, categoria: "Seguros" },
  { id: 7, descricao: "Energia elétrica", valor: 620, vencimento: 8, categoria: "Serviços essenciais" },
  { id: 8, descricao: "Axioma Professional", valor: 197, vencimento: 1, categoria: "Sistemas e assinaturas" },
  { id: 9, descricao: "Limpeza", valor: 534, vencimento: 1, categoria: "Outros" },
];

export default function CustosFixos() {
  const router = useRouter();
  const { t } = useLanguage();
  const [custos, setCustos] = useState(custosIniciais);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ descricao: "", valor: "", vencimento: "", categoria: categorias[0] });

  const custosFiltrados = custos.filter(c => c.descricao.toLowerCase().includes(busca.toLowerCase()));
  const totalMensal = custos.reduce((acc, c) => acc + c.valor, 0);

  const adicionarCusto = () => {
    if (!novo.descricao || !novo.valor) return;
    setCustos([...custos, { ...novo, id: Date.now(), valor: parseFloat(novo.valor), vencimento: parseInt(novo.vencimento || "1") }]);
    setNovo({ descricao: "", valor: "", vencimento: "", categoria: categorias[0] });
    setModalAberto(false);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{background: "#020810"}}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.custosFixos.titulo}</h2>
          </div>
          <p className="text-sm" style={{color: "#3a5a8a"}}>{t.custosFixos.subtitulo}</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
          <Plus size={18}/>{t.custosFixos.novoCusto}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t.custosFixos.totalMensal, value: `R$ ${totalMensal.toLocaleString("pt-BR")}`, color: "#f87171" },
          { label: t.custosFixos.totalAnual, value: `R$ ${(totalMensal * 12).toLocaleString("pt-BR")}`, color: "#fbbf24" },
          { label: t.custosFixos.itens, value: `${custos.length}`, color: "#6ab0ff" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{color: "#3a5a8a"}}>{card.label}</p>
            <p className="text-2xl font-bold" style={{color: card.color}}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <Search size={16} style={{color: "#3a5a8a"}}/>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.custosFixos.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <table className="w-full">
          <thead>
            <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
              {[t.geral.descricao, t.geral.categoria, t.custosFixos.vencimento, t.custosFixos.valorMensal, t.custosFixos.valorAnual, t.geral.acoes].map(h => (
                <th key={h} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {custosFiltrados.map((c, i) => (
              <tr key={c.id} style={{borderBottom: i < custosFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                <td className="px-6 py-4 text-sm" style={{color: "#c8d8f0"}}>{c.descricao}</td>
                <td className="px-6 py-4"><span className="text-xs px-3 py-1 rounded-full" style={{background: "rgba(59,111,212,0.1)", color: "#6ab0ff"}}>{c.categoria}</span></td>
                <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>Dia {c.vencimento}</td>
                <td className="px-6 py-4 text-sm font-bold" style={{color: "#f87171"}}>R$ {c.valor.toLocaleString("pt-BR")}</td>
                <td className="px-6 py-4 text-sm font-bold" style={{color: "#fbbf24"}}>R$ {(c.valor * 12).toLocaleString("pt-BR")}</td>
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
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>{t.custosFixos.novoCusto}</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.descricao}</label>
                <input value={novo.descricao} onChange={(e) => setNovo({...novo, descricao: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.custosFixos.valorMensal}</label>
                <input type="number" value={novo.valor} onChange={(e) => setNovo({...novo, valor: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.custosFixos.vencimento}</label>
                <input type="number" value={novo.vencimento} onChange={(e) => setNovo({...novo, vencimento: e.target.value})} placeholder="1-31" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.categoria}</label>
                <select value={novo.categoria} onChange={(e) => setNovo({...novo, categoria: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={adicionarCusto} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                {t.custosFixos.salvarCusto}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}