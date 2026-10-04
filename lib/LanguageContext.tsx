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

// ============================================================
// BANDEIRAS SVG — aparecem em qualquer sistema (Windows/Mac/Mobile)
// ============================================================
function BandeiraBR({ size = 22 }: { size?: number }) {
  const h = Math.round((size * 20) / 28);
  return (
    <svg viewBox="0 0 28 20" width={size} height={h} style={{ display: "block", borderRadius: 3 }}>
      <rect width="28" height="20" fill="#009C3B" />
      <polygon points="14,2 26,10 14,18 2,10" fill="#FFDF00" />
      <circle cx="14" cy="10" r="4" fill="#002776" />
      <path d="M10.4 9.2 A4 4 0 0 0 17.6 11" stroke="#fff" strokeWidth="0.9" fill="none" />
    </svg>
  );
}

function BandeiraUS({ size = 22 }: { size?: number }) {
  const h = Math.round((size * 20) / 28);
  return (
    <svg viewBox="0 0 28 20" width={size} height={h} style={{ display: "block", borderRadius: 3 }}>
      <rect width="28" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8].map((y) => (
        <rect key={y} y={y * 2.05} width="28" height="1.54" fill="#B22234" />
      ))}
      <rect y="16.4" width="28" height="1.54" fill="#B22234" />
      <rect width="12" height="11" fill="#3C3B6E" />
      {[2, 5, 8].map((cx) =>
        [2, 5, 8].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.7" fill="#fff" />)
      )}
    </svg>
  );
}

function BandeiraES({ size = 22 }: { size?: number }) {
  const h = Math.round((size * 20) / 28);
  return (
    <svg viewBox="0 0 28 20" width={size} height={h} style={{ display: "block", borderRadius: 3 }}>
      <rect width="28" height="20" fill="#AA151B" />
      <rect y="5" width="28" height="10" fill="#F1BF00" />
    </svg>
  );
}

const BANDEIRAS: Record<Idioma, ({ size }: { size?: number }) => ReactNode> = {
  pt: BandeiraBR,
  en: BandeiraUS,
  es: BandeiraES,
};

export function SeletorIdioma({ compacto = false }: { compacto?: boolean } = {}) {
  const { idioma, setIdioma } = useLanguage();

  return (
    <div
      className={compacto ? "flex gap-0.5 items-center" : "flex gap-1 rounded-xl p-1"}
      style={compacto ? undefined : { background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}
    >
      {(["pt", "en", "es"] as Idioma[]).map((code) => {
        const Flag = BANDEIRAS[code];
        const ativo = idioma === code;
        return (
          <button
            key={code}
            onClick={() => setIdioma(code)}
            aria-label={code}
            className={compacto ? "px-1 py-0.5 rounded-md transition-all flex items-center justify-center" : "px-2 py-1.5 rounded-lg transition-all flex items-center justify-center"}
            style={{
              background: ativo ? "rgba(46,204,155,0.25)" : "transparent",
              border: ativo ? "1px solid #2ecc9b" : "1px solid transparent",
              boxShadow: ativo ? "0 0 10px rgba(46,204,155,0.45)" : "none",
              opacity: ativo ? 1 : 0.55,
              transform: ativo ? "scale(1.05)" : "scale(1)",
            }}
          >
            <Flag size={compacto ? 17 : 22} />
          </button>
        );
      })}
    </div>
  );
}