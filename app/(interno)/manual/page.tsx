"use client";
// Manual de uso dentro do Axioma — mesmo conteúdo dos PDFs numerados (lib/documentos/manual), nos 3 idiomas.
import { useEffect, useState } from "react";
import ModuloLayout from "../../../components/ModuloLayout";
import DocumentoWeb from "../../../components/DocumentoWeb";
import { MANUAIS, nomeManual } from "../../../lib/documentos/manual";
import { useLanguage } from "../../../lib/LanguageContext";

export default function Manual() {
  const { idioma } = useLanguage();
  const lang = idioma === "en" ? "en" : idioma === "es" ? "es" : "pt";
  const [atual, setAtual] = useState(MANUAIS[0].numero);
  // Link direto para um manual (ex.: /manual?m=28, vindo do Assistente de Ajuda).
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("m");
    if (m && MANUAIS.some((x) => x.numero === m)) setAtual(m);
    // Já nesta página: o Assistente avisa por evento (o link não remonta a tela).
    const abrir = (e: Event) => { const n = (e as CustomEvent<string>).detail; if (MANUAIS.some((x) => x.numero === n)) { setAtual(n); window.scrollTo({ top: 0, behavior: "smooth" }); } };
    window.addEventListener("axioma:abrir-manual", abrir);
    return () => window.removeEventListener("axioma:abrir-manual", abrir);
  }, []);
  const sel = MANUAIS.find((m) => m.numero === atual) ?? MANUAIS[0];
  const titulo = lang === "en" ? "User Manual" : lang === "es" ? "Manual de Uso" : "Manual de Uso";
  const sub = lang === "en" ? "Every module explained, button by button" : lang === "es" ? "Cada módulo explicado, botón por botón" : "Cada módulo explicado, botão por botão";
  return (
    <ModuloLayout titulo={titulo} subtitulo={sub}>
      <div className="grid lg:grid-cols-[260px_1fr] gap-4 items-start">
        <nav className="rounded-2xl p-3 lg:sticky lg:top-32 axi-card-premium3d axi-card-faixa" style={{ background: "#101b3d" }}>
          <p className="text-[11px] font-black uppercase tracking-wider mb-2 px-2" style={{ color: "#2ecc9b" }}>{lang === "en" ? "Modules" : lang === "es" ? "Módulos" : "Módulos"}</p>
          <div className="flex lg:flex-col gap-1 overflow-x-auto">
            {MANUAIS.map((m) => (
              <button key={m.numero} onClick={() => { setAtual(m.numero); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="text-left px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap lg:whitespace-normal"
                style={m.numero === atual ? { background: "linear-gradient(135deg, #0a4f3b, #0f7d5c)", color: "#fff" } : { color: "#e6edf5" }}>
                {m.numero} — {nomeManual(m, lang)}
              </button>
            ))}
          </div>
        </nav>
        <DocumentoWeb doc={sel.doc[lang]} lang={lang} />
      </div>
    </ModuloLayout>
  );
}
