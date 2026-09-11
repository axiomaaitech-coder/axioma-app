"use client";
import { Moon, Sparkles, Gem } from "lucide-react";
import { useThemeAxioma, type TemaAxioma } from "../lib/ThemeContext";

// Seletor de tema — só aparece nas telas que o importam explicitamente
// (rodada atual: MEI Painel e Cockpit, telas de referência). Persiste
// via ThemeContext (localStorage). Não afeta nenhuma outra tela: o
// atributo data-theme só existe onde a própria tela o aplica.
export function ThemeToggle() {
  const { tema, setTema } = useThemeAxioma();

  const opcoes: { valor: TemaAxioma; label: string; Icone: typeof Moon }[] = [
    { valor: "dark", label: "Escuro", Icone: Moon },
    { valor: "xms", label: "Tema Claro", Icone: Sparkles },
    { valor: "esmeralda", label: "Esmeralda", Icone: Gem },
  ];

  return (
    <div
      className="flex gap-1 rounded-xl p-1"
      style={{ background: "var(--axi-surface)", border: "1px solid var(--axi-border)" }}
    >
      {opcoes.map(({ valor, label, Icone }) => {
        const ativo = tema === valor;
        return (
          <button
            key={valor}
            onClick={() => setTema(valor)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: ativo ? "var(--axi-accent)" : "transparent",
              color: ativo ? "#020810" : "var(--axi-text-secondary)",
            }}
          >
            <Icone size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
