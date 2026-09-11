"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Tema visual da tela (não confundir com idioma). Hoje só usado pelas
// telas que optam explicitamente (data-theme local, nunca em <html>) —
// ver app/globals.css. "dark" é o padrão atual do Axioma, inalterado.
export type TemaAxioma = "dark" | "xms" | "esmeralda";

const CHAVE_STORAGE = "axioma_tema";

type ThemeContextType = {
  tema: TemaAxioma;
  setTema: (tema: TemaAxioma) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  tema: "dark",
  setTema: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<TemaAxioma>("dark");

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_STORAGE);
      if (salvo === "dark" || salvo === "xms" || salvo === "esmeralda") setTemaState(salvo);
    } catch {
      // localStorage indisponível (modo privado etc.) — segue no padrão "dark".
    }
  }, []);

  const setTema = (novo: TemaAxioma) => {
    setTemaState(novo);
    try {
      window.localStorage.setItem(CHAVE_STORAGE, novo);
    } catch {
      // idem — falha silenciosa não é crítica, é só uma preferência de UI.
    }
  };

  return (
    <ThemeContext.Provider value={{ tema, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeAxioma() {
  return useContext(ThemeContext);
}
