"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Centro = {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  user_id: string;
  empresa_id: string;
  created_at: string;
};

type Lancamento = {
  id: string;
  descricao: string;
  valor: number;
  tipo: "custo" | "receita";
  data: string;
  centro_id: string;
  user_id: string;
  empresa_id: string;
  created_at: string;
};

export default function CentrosCustoPage() {
  const { t } = useLanguage();
  const cc = t.centrosCusto;

  const [aba, setAba] = useState<"visao" | "centros" | "lancamentos">("visao");
  const [centros, setCentros] = useState<Centro[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const [modalCentro, setModalCentro] = useState(false);
  const [editandoCentro, setEditandoCentro] = useState<Centro | null>(null);
  const [nomeCentro, setNomeCentro] = useState("");
  const [descricaoCentro, setDescricaoCentro] = useState("");
  const [corCentro, setCorCentro] = useState("#6ab0ff");
  const [salvandoCentro, setSalvandoCentro] = useState(false);

  const [modalLancamento, setModalLancamento] = useState(false);
  const [descricaoLanc, setDescricaoLanc] = useState("");
  const [valorLanc, setValorLanc] = useState("");
  const [tipoLanc, setTipoLanc] = useState<"custo" | "receita">("custo");
  const [dataLanc, setDataLanc] = useState(new Date().toISOString().split("T")[0]);
  const [centroLanc, setCentroLanc] = useState("");
  const [salvandoLanc, setSalvandoLanc] = useState(false);

  const [busca, setBusca] = useState("");

  const cores = ["#6ab0ff", "#34d399", "#f87171", "#fbbf24", "#a78bfa", "#fb923c", "#22d3ee"];

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const eid = empresa?.id || null;
    setEmpresaId(eid);

    const { data: centrosData } = await supabase
      .from("centros_custo")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const { data: lancamentosData } = await supabase
      .from("lancamentos_centro")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: false });

    setCentros(centrosData || []);
    setLancamentos(lancamentosData || []);
    setLoading(false);
  }

  async function salvarCentro() {
    if (!nomeCentro.trim()) return;
    setSalvandoCentro(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editandoCentro) {
      await supabase.from("centros_custo").update({
        nome: nomeCentro,
        descricao: descricaoCentro,
        cor: corCentro,
      }).eq("id", editandoCentro.id);
    } else {
      await supabase.from("centros_custo").insert({
        nome: nomeCentro,
        descricao: descricaoCentro,
        cor: corCentro,
        user_id: user.id,
        empresa_id: empresaId,
      });
    }

    setModalCentro(false);
    setNomeCentro("");
    setDescricaoCentro("");
    setCorCentro("#6ab0ff");
    setEditandoCentro(null);
    setSalvandoCentro(false);
    carregarDados();
  }

  async function excluirCentro(id: string) {
    await supabase.from("centros_custo").delete().eq("id", id);
    carregarDados();
  }

  async function salvarLancamento() {
    if (!descricaoLanc.trim() || !valorLanc || !centroLanc) return;
    setSalvandoLanc(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("lancamentos_centro").insert({
      descricao: descricaoLanc,
      valor: parseFloat(valorLanc),
      tipo: tipoLanc,
      data: dataLanc,
      centro_id: centroLanc,
      user_id: user.id,
      empresa_id: empresaId,
    });

    setModalLancamento(false);
    setDescricaoLanc("");
    setValorLanc("");
    setTipoLanc("custo");
    setDataLanc(new Date().toISOString().split("T")[0]);
    setCentroLanc("");
    setSalvandoLanc(false);
    carregarDados();
  }

  function abrirEditarCentro(centro: Centro) {
    setEditandoCentro(centro);
    setNomeCentro(centro.nome);
    setDescricaoCentro(centro.descricao || "");
    setCorCentro(centro.cor || "#6ab0ff");
    setModalCentro(true);
  }

  function fecharModalCentro() {
    setModalCentro(false);
    setEditandoCentro(null);
    setNomeCentro("");
    setDescricaoCentro("");
    setCorCentro("#6ab0ff");
  }

  const totalCustos = lancamentos.filter(l => l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  const totalReceitas = lancamentos.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const saldoGeral = totalReceitas - totalCustos;

  function getLancamentosPorCentro(centroId: string) {
    return lancamentos.filter(l => l.centro_id === centroId);
  }

  function getCustosPorCentro(centroId: string) {
    return getLancamentosPorCentro(centroId).filter(l => l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  }

  function getReceitasPorCentro(centroId: string) {
    return getLancamentosPorCentro(centroId).filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  }

  const lancamentosFiltrados = lancamentos.filter(l =>
    l.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#020810" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p style={{ color: "#3a5a8a" }}>Carregando...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#020810", minHeight: "100vh" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#c8d8f0" }}>🏢 {cc.titulo}</h1>
          <p className="text-sm mt-1" style={{ color: "#3a5a8a" }}>{cc.subtitulo}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setModalLancamento(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
            + {cc.novoLancamento}
          </button>
          <button onClick={() => setModalCentro(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
            + {cc.novoCentro}
          </button>
        </div>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: cc.totalCentros, valor: centros.length.toString(), cor: "#6ab0ff" },
          { label: cc.totalCustos, valor: fmt(totalCustos), cor: "#f87171" },
          { label: cc.totalReceitas, valor: fmt(totalReceitas), cor: "#34d399" },
          { label: cc.saldoGeral, valor: fmt(saldoGeral), cor: saldoGeral >= 0 ? "#34d399" : "#f87171" },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
            <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{card.label}</p>
            <p className="text-xl font-bold" style={{ color: card.cor }}>{card.valor}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "visao", label: cc.abaVisaoGeral },
          { key: "centros", label: cc.abaCentros },
          { key: "lancamentos", label: cc.abaLancamentos },
        ].map((a) => (
          <button key={a.key} onClick={() => setAba(a.key as typeof aba)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: aba === a.key ? "rgba(59,111,212,0.25)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(59,111,212,0.5)" : "rgba(59,111,212,0.1)"}` }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA: VISÃO GERAL */}
      {aba === "visao" && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#6ab0ff" }}>📊 {cc.comparativo}</h2>
          {centros.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p style={{ color: "#3a5a8a" }}>{cc.semCentros}</p>
            </div>
          ) : (
            centros.map((centro) => {
              const custos = getCustosPorCentro(centro.id);
              const receitas = getReceitasPorCentro(centro.id);
              const saldo = receitas - custos;
              const max = Math.max(custos, receitas, 1);
              return (
                <div key={centro.id} className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${centro.cor}30` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: centro.cor }}></div>
                      <span className="font-semibold" style={{ color: "#c8d8f0" }}>{centro.nome}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: saldo >= 0 ? "#34d399" : "#f87171" }}>{fmt(saldo)}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#3a5a8a" }}>
                        <span>{cc.receita}</span><span style={{ color: "#34d399" }}>{fmt(receitas)}</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "rgba(59,111,212,0.1)" }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${(receitas / max) * 100}%`, background: "#34d399" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#3a5a8a" }}>
                        <span>{cc.custo}</span><span style={{ color: "#f87171" }}>{fmt(custos)}</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "rgba(59,111,212,0.1)" }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${(custos / max) * 100}%`, background: "#f87171" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ABA: CENTROS */}
      {aba === "centros" && (
        <div className="space-y-3">
          {centros.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p style={{ color: "#3a5a8a" }}>{cc.semCentros}</p>
            </div>
          ) : (
            centros.map((centro) => (
              <div key={centro.id} className="rounded-2xl p-5 flex items-center justify-between" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${centro.cor}30` }}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: centro.cor }}></div>
                  <div>
                    <p className="font-semibold" style={{ color: "#c8d8f0" }}>{centro.nome}</p>
                    {centro.descricao && <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>{centro.descricao}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirEditarCentro(centro)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff", border: "1px solid rgba(106,176,255,0.2)" }}>
                    ✏️ {cc.editarCentro}
                  </button>
                  <button onClick={() => excluirCentro(centro.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                    🗑️ {cc.excluirCentro}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ABA: LANÇAMENTOS */}
      {aba === "lancamentos" && (
        <div>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={cc.buscar} className="w-full px-4 py-2.5 rounded-xl mb-4 text-sm outline-none" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)", color: "#c8d8f0" }} />
          <div className="space-y-3">
            {lancamentosFiltrados.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
                <p style={{ color: "#3a5a8a" }}>{cc.semLancamentos}</p>
              </div>
            ) : (
              lancamentosFiltrados.map((lanc) => {
                const centro = centros.find(c => c.id === lanc.centro_id);
                return (
                  <div key={lanc.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: centro?.cor || "#6ab0ff" }}></div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{lanc.descricao}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>{centro?.nome || "—"} · {new Date(lanc.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: lanc.tipo === "custo" ? "#f87171" : "#34d399" }}>
                      {lanc.tipo === "custo" ? "↓" : "↑"} {fmt(lanc.valor)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: NOVO/EDITAR CENTRO */}
      {modalCentro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: "#c8d8f0" }}>
              🏢 {editandoCentro ? cc.editarCentro : cc.novoCentro}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#3a5a8a" }}>{cc.nomeCentro}</label>
                <input value={nomeCentro} onChange={e => setNomeCentro(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "rgba(2,8,16,0.8)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#3a5a8a" }}>{cc.descricaoCentro}</label>
                <input value={descricaoCentro} onChange={e => setDescricaoCentro(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "rgba(2,8,16,0.8)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: "#3a5a8a" }}>{cc.corCentro}</label>
                <div className="flex gap-2 flex-wrap">
                  {cores.map(cor => (
                    <button key={cor} onClick={() => setCorCentro(cor)} className="w-8 h-8 rounded-full transition-all" style={{ background: cor, outline: corCentro === cor ? `3px solid white` : "none", outlineOffset: "2px" }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={fecharModalCentro} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a", border: "1px solid rgba(59,111,212,0.15)" }}>
                {t.geral.cancelar}
              </button>
              <button onClick={salvarCentro} disabled={salvandoCentro || !nomeCentro.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                {salvandoCentro ? "..." : cc.salvarCentro}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO LANÇAMENTO */}
      {modalLancamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: "#c8d8f0" }}>💰 {cc.novoLancamento}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#3a5a8a" }}>{t.geral.descricao}</label>
                <input value={descricaoLanc} onChange={e => setDescricaoLanc(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "rgba(2,8,16,0.8)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#3a5a8a" }}>{t.geral.valor} (R$)</label>
                  <input type="number" value={valorLanc} onChange={e => setValorLanc(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "rgba(2,8,16,0.8)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#3a5a8a" }}>{t.geral.data}</label>
                  <input type="date" value={dataLanc} onChange={e => setDataLanc(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "rgba(2,8,16,0.8)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#3a5a8a" }}>{cc.tipo}</label>
                <div className="flex gap-2">
                  <button onClick={() => setTipoLanc("custo")} className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: tipoLanc === "custo" ? "rgba(248,113,113,0.2)" : "rgba(2,8,16,0.8)", color: tipoLanc === "custo" ? "#f87171" : "#3a5a8a", border: `1px solid ${tipoLanc === "custo" ? "rgba(248,113,113,0.4)" : "rgba(59,111,212,0.15)"}` }}>
                    ↓ {cc.custo}
                  </button>
                  <button onClick={() => setTipoLanc("receita")} className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: tipoLanc === "receita" ? "rgba(52,211,153,0.2)" : "rgba(2,8,16,0.8)", color: tipoLanc === "receita" ? "#34d399" : "#3a5a8a", border: `1px solid ${tipoLanc === "receita" ? "rgba(52,211,153,0.4)" : "rgba(59,111,212,0.15)"}` }}>
                    ↑ {cc.receita}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#3a5a8a" }}>{cc.centroCusto}</label>
                <select value={centroLanc} onChange={e => setCentroLanc(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "rgba(2,8,16,0.8)", border: "1px solid rgba(59,111,212,0.2)", color: centroLanc ? "#c8d8f0" : "#3a5a8a" }}>
                  <option value="">Selecione um centro...</option>
                  {centros.map(c => <option key={c.id} value={c.id} style={{ background: "#020810" }}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalLancamento(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a", border: "1px solid rgba(59,111,212,0.15)" }}>
                {t.geral.cancelar}
              </button>
              <button onClick={salvarLancamento} disabled={salvandoLanc || !descricaoLanc.trim() || !valorLanc || !centroLanc} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                {salvandoLanc ? "..." : cc.salvarLancamento}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
