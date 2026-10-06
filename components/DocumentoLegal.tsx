"use client";
// Página pública de Termos/Privacidade com troca de idioma (PT/EN/ES).
import Link from "next/link";
import DocumentoWeb from "./DocumentoWeb";
import { useLanguage } from "../lib/LanguageContext";
import { TERMOS, PRIVACIDADE } from "../lib/documentos/legais";

const TXT = {
  pt: { voltar: "← Voltar ao Axioma", termos: "Termos de Uso", privacidade: "Política de Privacidade" },
  en: { voltar: "← Back to Axioma", termos: "Terms of Use", privacidade: "Privacy Policy" },
  es: { voltar: "← Volver a Axioma", termos: "Términos de Uso", privacidade: "Política de Privacidad" },
};

export default function DocumentoLegal({ qual }: { qual: "termos" | "privacidade" }) {
  const { idioma, setIdioma } = useLanguage();
  const lang = idioma === "en" ? "en" : idioma === "es" ? "es" : "pt";
  const t = TXT[lang];
  const doc = (qual === "termos" ? TERMOS : PRIVACIDADE)[lang];
  return (
    <div style={{ background: "#f7f8fa", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center gap-3 mb-6 text-sm font-semibold">
          <Link href="/dashboard" style={{ color: "#0f7d5c" }}>{t.voltar}</Link>
          <Link href={qual === "termos" ? "/privacidade" : "/termos"} style={{ color: "#101b3d" }}>{qual === "termos" ? t.privacidade : t.termos}</Link>
          <div className="ml-auto flex gap-1">
            {(["pt", "en", "es"] as const).map((l) => (
              <button key={l} onClick={() => setIdioma(l)} className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={l === lang ? { background: "#101b3d", color: "#fff" } : { background: "#fff", color: "#101b3d", border: "1px solid #d0d5dd" }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <DocumentoWeb doc={doc} lang={lang} />
      </div>
    </div>
  );
}
