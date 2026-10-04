"use client";
// Manual de uso dentro do Axioma — mesmo conteúdo dos Word numerados (lib/documentos/manual).
import { useState } from "react";
import ModuloLayout from "../../../components/ModuloLayout";
import DocumentoWeb from "../../../components/DocumentoWeb";
import { MANUAIS } from "../../../lib/documentos/manual";
import { useLanguage } from "../../../lib/LanguageContext";

export default function Manual() {
  const { idioma } = useLanguage();
  const lang = idioma === "en" ? "en" : idioma === "es" ? "es" : "pt";
  const [atual, setAtual] = useState(MANUAIS[0].numero);
  const sel = MANUAIS.find((m) => m.numero === atual) ?? MANUAIS[0];
  const titulo = lang === "en" ? "User Manual" : "Manual de Uso";
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
                {m.numero} — {m.nome}
              </button>
            ))}
          </div>
        </nav>
        <DocumentoWeb doc={sel.doc} />
      </div>
    </ModuloLayout>
  );
}
