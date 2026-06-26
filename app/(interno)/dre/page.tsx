"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DREPage() {
  const { t, idioma } = useLanguage();
  const d = t.dre;
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [receitas, setReceitas] = useState(0);
  const [custosFixos, setCustosFixos] = useState(0);
  const [custosVariaveis, setCustosVariaveis] = useState(0);
  const [exportando, setExportando] = useState(false);

  useEffect(() => { carregarDados(); }, [periodo]);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const hoje = new Date();
    let inicio = "", fim = "";
    if (periodo === "mes") {
      inicio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
      fim = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-31`;
    } else if (periodo === "trimestre") {
      const trimInicio = Math.floor(hoje.getMonth() / 3) * 3;
      inicio = `${hoje.getFullYear()}-${String(trimInicio + 1).padStart(2, "0")}-01`;
      fim = `${hoje.getFullYear()}-${String(trimInicio + 3).padStart(2, "0")}-31`;
    } else {
      inicio = `${hoje.getFullYear()}-01-01`;
      fim = `${hoje.getFullYear()}-12-31`;
    }
    const meses = periodo === "mes" ? 1 : periodo === "trimestre" ? 3 : 12;
    const { data: rec } = await supabase.from("receitas").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);
    const { data: cf } = await supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id);
    const { data: cv } = await supabase.from("custos_variaveis").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);
    setReceitas(rec?.reduce((s, r) => s + (r.valor || 0), 0) || 0);
    setCustosFixos((cf?.reduce((s, r) => s + (r.valor_mensal || 0), 0) || 0) * meses);
    setCustosVariaveis(cv?.reduce((s, r) => s + (r.valor || 0), 0) || 0);
    setLoading(false);
  }

  const impostos = receitas * 0.06;
  const receitaLiquida = receitas - impostos;
  const lucroBruto = receitaLiquida - custosVariaveis;
  const ebitda = lucroBruto - custosFixos;
  const lucroLiquido = ebitda;
  const margemBruta = receitas > 0 ? ((lucroBruto / receitas) * 100).toFixed(1) : "0";
  const margemLiquida = receitas > 0 ? ((lucroLiquido / receitas) * 100).toFixed(1) : "0";
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtNum = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const linhas = [
    { label: d.receitaBruta, valor: receitas, nivel: 0, destaque: true, cor: "#6ab0ff" },
    { label: d.deducoes, valor: -impostos, nivel: 1, destaque: false, cor: "#f87171" },
    { label: d.receitaLiquida, valor: receitaLiquida, nivel: 0, destaque: true, cor: "#c8d8f0", sep: true },
    { label: d.custosVariaveis, valor: -custosVariaveis, nivel: 1, destaque: false, cor: "#f87171" },
    { label: d.lucroBruto, valor: lucroBruto, nivel: 0, destaque: true, cor: lucroBruto >= 0 ? "#34d399" : "#f87171", sep: true },
    { label: d.custosFixos, valor: -custosFixos, nivel: 1, destaque: false, cor: "#f87171" },
    { label: d.ebitda, valor: ebitda, nivel: 0, destaque: true, cor: ebitda >= 0 ? "#34d399" : "#f87171", sep: true },
    { label: d.lucroLiquido, valor: lucroLiquido, nivel: 0, destaque: true, cor: lucroLiquido >= 0 ? "#34d399" : "#f87171", sep: true },
  ];

  // PDF preto e branco — formato demonstrativo
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const periodoLabel = periodo === "mes" ? d.mesAtual : periodo === "trimestre" ? d.trimestre : d.anoAtual;
      gerarPdfTabela({
        titulo: d.titulo,
        subtitulo: `${d.periodo}: ${periodoLabel}`,
        colunas: [
          { header: "Conta", key: "conta", width: 6 },
          { header: "Valor (R$)", key: "valor", width: 3, align: "right" },
        ],
        linhas: linhas.map((l) => ({
          conta: (l.nivel === 1 ? "   " : "") + l.label,
          valor: fmtNum(l.valor),
        })),
        resumo: [
          { label: "Margem Bruta", valor: `${margemBruta}%` },
          { label: "Margem Líquida", valor: `${margemLiquida}%` },
          { label: "EBITDA", valor: `R$ ${fmtNum(ebitda)}` },
          { label: "Lucro Líquido", valor: `R$ ${fmtNum(lucroLiquido)}` },
        ],
        nomeArquivo: `axioma-dre-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const botaoPeriodo = (
    <div className="flex gap-2 flex-wrap">
      {[
        { key: "mes", label: d.mesAtual },
        { key: "trimestre", label: d.trimestre },
        { key: "ano", label: d.anoAtual },
      ].map((p) => (
        <motion.button
          key={p.key}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPeriodo(p.key)}
          className="px-3 py-2 rounded-xl text-sm font-semibold"
          style={{
            background: periodo === p.key ? "rgba(59,111,212,0.3)" : "rgba(10,20,36,0.7)",
            color: periodo === p.key ? "#6ab0ff" : "#5a7a9a",
            border: `1px solid ${periodo === p.key ? "rgba(59,111,212,0.5)" : "rgba(59,111,212,0.15)"}`,
          }}
        >
          {p.label}
        </motion.button>
      ))}
    </div>
  );

  return (
    <ModuloLayout
      titulo={`📈 ${d.titulo}`}
      subtitulo={d.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      botaoExtra={botaoPeriodo}
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* TABELA DRE — limpa */}
          <CanvasBox cor="#6ab0ff">
            {/* Header */}
            <div className="pb-4 mb-2" style={{ borderBottom: "1px solid rgba(106,176,255,0.1)" }}>
              <p className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: "#6ab0ff" }}>
                AXIOMA AI.TECH
              </p>
              <p className="text-xs mt-1" style={{ color: "#5a7a9a" }}>
                {d.periodo}: {periodo === "mes" ? d.mesAtual : periodo === "trimestre" ? d.trimestre : d.anoAtual}
              </p>
            </div>

            {/* Linhas DRE */}
            <div className="space-y-1">
              {linhas.map((linha, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {linha.sep && <div className="my-3" style={{ borderTop: "1px solid rgba(106,176,255,0.08)" }} />}
                  <div
                    className="flex justify-between items-center py-3 rounded-xl px-3"
                    style={{ paddingLeft: linha.nivel === 1 ? "2rem" : "0.75rem" }}
                  >
                    <span className={`text-sm ${linha.destaque ? "font-bold" : "font-normal"}`} style={{ color: linha.destaque ? "#c8d8f0" : "#5a7a9a" }}>
                      {linha.label}
                    </span>
                    <span className={`text-sm ${linha.destaque ? "font-bold" : "font-normal"}`} style={{ color: linha.cor }}>
                      {fmt(linha.valor)}
                    </span>
                  </div>
                  {linha.destaque && receitas > 0 && (
                    <div className="mx-3 h-1 rounded-full mb-1" style={{ background: "rgba(59,111,212,0.08)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, (Math.abs(linha.valor) / receitas) * 100))}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.04 + 0.2 }}
                        className="h-1 rounded-full"
                        style={{ background: linha.cor }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CanvasBox>

          {/* Cards de margem */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: d.margemBruta, value: `${margemBruta}%`, cor: Number(margemBruta) >= 0 ? "#34d399" : "#f87171", pct: Number(margemBruta) },
              { label: d.margemLiquida, value: `${margemLiquida}%`, cor: Number(margemLiquida) >= 0 ? "#34d399" : "#f87171", pct: Number(margemLiquida) },
              { label: d.lucroLiquido, value: fmt(lucroLiquido), cor: lucroLiquido >= 0 ? "#34d399" : "#f87171", pct: null },
              { label: d.ebitda, value: fmt(ebitda), cor: ebitda >= 0 ? "#6ab0ff" : "#f87171", pct: null },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                <CanvasBox cor={card.cor}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#5a7a9a" }}>{card.label}</p>
                  <p className="text-xl font-black" style={{ color: card.cor }}>{card.value}</p>
                  {card.pct !== null && (
                    <div className="mt-3 rounded-full h-1.5" style={{ background: "rgba(59,111,212,0.1)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, card.pct))}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                        className="h-1.5 rounded-full"
                        style={{ background: card.cor }}
                      />
                    </div>
                  )}
                </CanvasBox>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </ModuloLayout>
  );
}