"use client";
// Mostra no site um documento do Axioma (Termos, Privacidade, Manual) a partir
// do MESMO conteúdo que gera o Word (lib/documentos). Cores do tema Claro:
// branco + creme + azul-marinho + verde-menta escuro.
import { Fragment, type ReactNode } from "react";
import type { DocumentoAxioma, Bloco } from "../lib/documentos/tipos";

const NAVY = "#101b3d", MENTA = "#0f7d5c", CINZA = "#374151", CREME = "#f6f7c4";

// **negrito** e [[campo a preencher]]
function texto(t: string): ReactNode {
  return t.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g).filter(Boolean).map((p, i) =>
    p.startsWith("**") ? <strong key={i} style={{ color: NAVY }}>{p.slice(2, -2)}</strong>
      : p.startsWith("[[") ? <mark key={i} style={{ background: "#fff3b0", color: NAVY, padding: "0 4px", borderRadius: 4, fontWeight: 700 }}>[{p.slice(2, -2)}]</mark>
      : <Fragment key={i}>{p}</Fragment>);
}

function idDe(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function BlocoWeb({ b }: { b: Bloco }) {
  if ("h1" in b) return <h2 id={idDe(b.h1)} className="scroll-mt-32 text-xl md:text-2xl font-black mt-10 mb-3 pb-2" style={{ color: NAVY, borderBottom: `2px solid ${MENTA}` }}>{b.h1}</h2>;
  if ("h2" in b) return <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: NAVY }}>{b.h2}</h3>;
  if ("h3" in b) return <h4 className="text-base font-bold mt-4 mb-1.5" style={{ color: MENTA }}>{b.h3}</h4>;
  if ("p" in b) return <p className="leading-relaxed mb-3 text-[15px]" style={{ color: CINZA }}>{texto(b.p)}</p>;
  if ("lista" in b) return <ul className="list-disc pl-6 mb-3 space-y-1.5 text-[15px]" style={{ color: CINZA }}>{b.lista.map((it, i) => <li key={i} className="leading-relaxed">{texto(it)}</li>)}</ul>;
  if ("numerada" in b) return <ol className="list-decimal pl-6 mb-3 space-y-1.5 text-[15px]" style={{ color: CINZA }}>{b.numerada.map((it, i) => <li key={i} className="leading-relaxed">{texto(it)}</li>)}</ol>;
  if ("nota" in b || "alerta" in b) {
    const t = "nota" in b ? b.nota : b.alerta;
    return <div className="rounded-xl px-4 py-3 mb-4 text-[15px] leading-relaxed axi-card-premium3d axi-card-faixa" style={{ background: CREME, borderTop: `3px solid ${"nota" in b ? MENTA : NAVY}`, color: CINZA }}>{texto(t)}</div>;
  }
  if ("tabela" in b) return (
    <div className="overflow-x-auto mb-4 rounded-xl" style={{ border: "1px solid #d0d5dd" }}>
      <table className="w-full text-sm">
        <thead><tr>{b.tabela.colunas.map((c, i) => <th key={i} className="text-left px-3 py-2.5 font-bold" style={{ background: NAVY, color: "#fff" }}>{c}</th>)}</tr></thead>
        <tbody>{b.tabela.linhas.map((l, n) => <tr key={n} style={{ background: n % 2 ? CREME : "#fff" }}>{l.map((c, i) => <td key={i} className="px-3 py-2 align-top" style={{ color: CINZA, borderTop: "1px solid #e4e7ec" }}>{texto(c)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
  return null;
}

const SUMARIO = { pt: "Sumário", en: "Contents", es: "Índice" };

export default function DocumentoWeb({ doc, topo, lang = "pt" }: { doc: DocumentoAxioma; topo?: ReactNode; lang?: "pt" | "en" | "es" }) {
  const secoes = doc.blocos.filter((b): b is { h1: string } => "h1" in b);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4e7ec" }}>
      <div className="px-6 md:px-10 py-8" style={{ background: NAVY, borderBottom: "6px solid #2ecc9b" }}>
        <p className="text-xs font-black tracking-[0.3em] mb-2" style={{ color: "#2ecc9b" }}>AXIOMA AI.TECH</p>
        <h1 className="text-2xl md:text-4xl font-black text-white">{doc.titulo}</h1>
        {doc.subtitulo && <p className="mt-2 text-sm md:text-base" style={{ color: "#e6edf5" }}>{doc.subtitulo}</p>}
        {doc.info?.map((l, i) => <p key={i} className="mt-1 text-xs" style={{ color: "#a3b1c2" }}>{texto(l)}</p>)}
        {topo}
      </div>
      <div className="px-6 md:px-10 py-8">
        {secoes.length > 3 && (
          <nav className="rounded-xl p-4 mb-6" style={{ background: CREME }}>
            <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: NAVY }}>{SUMARIO[lang]}</p>
            <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {secoes.map((s, i) => <li key={i}><a href={`#${idDe(s.h1)}`} className="hover:underline" style={{ color: MENTA }}>{s.h1}</a></li>)}
            </ol>
          </nav>
        )}
        {doc.blocos.map((b, i) => <BlocoWeb key={i} b={b} />)}
      </div>
    </div>
  );
}
