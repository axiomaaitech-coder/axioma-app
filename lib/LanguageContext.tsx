"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { traducoes, Idioma } from "./translations";

type LanguageContextType = {
  idioma: Idioma;
  setIdioma: (idioma: Idioma) => void;
  t: typeof traducoes.pt;
};

const LanguageContext = createContext<LanguageContextType>({
  idioma: "pt",
  setIdioma: () => {},
  t: traducoes.pt,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>("pt");
  const t = traducoes[idioma];

  return (
    <LanguageContext.Provider value={{ idioma, setIdioma, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function SeletorIdioma() {
  const { idioma, setIdioma } = useLanguage();

  return (
    <div className="flex gap-1 rounded-xl p-1" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
      {[
        { code: "pt" as Idioma, bandeira: "🇧🇷", nome: "PT" },
        { code: "en" as Idioma, bandeira: "🇺🇸", nome: "EN" },
        { code: "es" as Idioma, bandeira: "🇪🇸", nome: "ES" },
      ].map((i) => (
        <button key={i.code} onClick={() => setIdioma(i.code)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{background: idioma === i.code ? "rgba(59,111,212,0.3)" : "transparent", color: idioma === i.code ? "#6ab0ff" : "#3a5a8a"}}>
          {i.bandeira} {i.nome}
        </button>
      ))}
    </div>
  );
}