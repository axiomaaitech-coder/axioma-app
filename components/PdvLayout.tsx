"use client";
// 🦅 AXIOMA AI.TECH — PDV Fase 2.1: layout próprio do módulo, com 3 temas.
// NUNCA importa nem altera components/ModuloLayout.tsx — decisão explícita
// do Elias pra não arriscar nenhum outro módulo. No tema "escuro" reproduz
// exatamente a mesma estrutura visual/animações do ModuloLayout (mesmas
// cores fixas de hoje), pra ninguém sentir que entrou noutro produto.
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Moon, Contrast } from "lucide-react";
import { motion } from "framer-motion";

export type TemaPdv = "escuro" | "intermediario" | "claro";

export type TokensPdv = {
  fundo: string; fundoContainer: string; bordaContainer: string; acentoTopo: string;
  texto: string; textoSecundario: string; textoMuted: string;
  cardBg: string; cardBorda: string; inputBg: string; inputBorda: string;
};

// "escuro" replica os valores literais que ModuloLayout.tsx já usa hoje —
// mesma identidade, sem importar o componente.
const TOKENS: Record<TemaPdv, TokensPdv> = {
  escuro: {
    fundo: "#020810", fundoContainer: "rgba(6,15,30,0.75)", bordaContainer: "rgba(106,176,255,0.14)",
    acentoTopo: "linear-gradient(90deg, rgba(106,176,255,0.5), rgba(0,255,136,0.3) 50%, transparent)",
    texto: "#e2ecf7", textoSecundario: "#8fa8c0", textoMuted: "#5a7a9a",
    cardBg: "rgba(6,15,30,0.6)", cardBorda: "rgba(0,255,136,0.15)", inputBg: "rgba(6,15,30,0.7)", inputBorda: "rgba(0,255,136,0.2)",
  },
  intermediario: {
    fundo: "#0f1826", fundoContainer: "rgba(20,30,46,0.85)", bordaContainer: "rgba(106,176,255,0.18)",
    acentoTopo: "linear-gradient(90deg, rgba(106,176,255,0.55), rgba(0,255,136,0.35) 50%, transparent)",
    texto: "#dce6f2", textoSecundario: "#93a8bd", textoMuted: "#72879c",
    cardBg: "rgba(24,35,52,0.7)", cardBorda: "rgba(0,255,136,0.2)", inputBg: "rgba(24,35,52,0.85)", inputBorda: "rgba(0,255,136,0.25)",
  },
  claro: {
    fundo: "#f2f6fb", fundoContainer: "rgba(255,255,255,0.92)", bordaContainer: "rgba(15,60,120,0.12)",
    acentoTopo: "linear-gradient(90deg, rgba(15,90,180,0.35), rgba(0,180,110,0.4) 50%, transparent)",
    texto: "#0e1e33", textoSecundario: "#3f5670", textoMuted: "#5d7590",
    cardBg: "rgba(255,255,255,0.96)", cardBorda: "rgba(0,180,110,0.3)", inputBg: "#ffffff", inputBorda: "rgba(0,180,110,0.35)",
  },
};

const CHAVE_TEMA = "axioma_pdv_tema";
const VERDE_PDV = "#00ff88";

const TemaContext = createContext<{ tema: TemaPdv; tokens: TokensPdv; setTema: (t: TemaPdv) => void }>({
  tema: "escuro", tokens: TOKENS.escuro, setTema: () => {},
});

// Qualquer tela do PDV chama isso pra pintar seus próprios cards/inputs de
// acordo com o tema ativo — não precisa reimplementar persistência nem
// estado, só consumir os tokens já resolvidos.
export function useTemaPdv() {
  return useContext(TemaContext);
}

function useProviderTema() {
  const [tema, setTemaState] = useState<TemaPdv>("escuro");
  useEffect(() => {
    const salvo = typeof window !== "undefined" ? (window.localStorage.getItem(CHAVE_TEMA) as TemaPdv | null) : null;
    if (salvo && TOKENS[salvo]) setTemaState(salvo);
  }, []);
  function setTema(t: TemaPdv) {
    setTemaState(t);
    if (typeof window !== "undefined") window.localStorage.setItem(CHAVE_TEMA, t);
  }
  return { tema, tokens: TOKENS[tema], setTema };
}

function SeletorTema({ tema, setTema }: { tema: TemaPdv; setTema: (t: TemaPdv) => void }) {
  const opcoes: { valor: TemaPdv; Icone: typeof Sun }[] = [
    { valor: "escuro", Icone: Moon }, { valor: "intermediario", Icone: Contrast }, { valor: "claro", Icone: Sun },
  ];
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)" }}>
      {opcoes.map(({ valor, Icone }) => (
        <button key={valor} onClick={() => setTema(valor)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ background: tema === valor ? "rgba(0,255,136,0.25)" : "transparent", color: tema === valor ? VERDE_PDV : "#8fa8c0" }}>
          <Icone size={14} />
        </button>
      ))}
    </div>
  );
}

interface PdvLayoutProps {
  titulo: string;
  subtitulo: string;
  // href estático — pra telas SEM navegação interna própria (Cadastro,
  // Importar NF-e: "voltar" sempre significa "voltar pro Catálogo").
  voltarPara?: string;
  // handler customizado — pra telas COM navegação interna em níveis (o
  // Catálogo: sub-nicho→categoria→nicho). Quando informado, tem PRIORIDADE
  // sobre voltarPara — a própria tela decide o que "voltar" significa a
  // partir do nível atual, reaproveitando o mesmo estado que já move o
  // breadcrumb (nunca um controle de navegação paralelo).
  aoVoltar?: () => void;
  botaoExtra?: ReactNode;
  children: ReactNode;
}

export default function PdvLayout({ titulo, subtitulo, voltarPara, aoVoltar, botaoExtra, children }: PdvLayoutProps) {
  const { tema, tokens, setTema } = useProviderTema();

  const estiloSeta: React.CSSProperties = { background: "rgba(0,255,136,0.1)", color: VERDE_PDV, border: "1px solid rgba(0,255,136,0.25)" };

  return (
    <TemaContext.Provider value={{ tema, tokens, setTema }}>
      <div className="min-h-screen p-4 md:p-8" style={{ background: tokens.fundo }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="mb-6 md:mb-8">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              {aoVoltar ? (
                <button onClick={aoVoltar} className="mt-1 p-2 rounded-xl shrink-0" style={estiloSeta} aria-label="Voltar">
                  <ArrowLeft size={18} />
                </button>
              ) : voltarPara ? (
                <Link href={voltarPara} className="mt-1 p-2 rounded-xl shrink-0" style={estiloSeta} aria-label="Voltar">
                  <ArrowLeft size={18} />
                </Link>
              ) : null}
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold mb-1 truncate" style={{ color: tokens.texto }}>{titulo}</h2>
                <p className="text-sm" style={{ color: tokens.textoMuted }}>{subtitulo}</p>
              </div>
            </div>
            <SeletorTema tema={tema} setTema={setTema} />
          </div>
          {botaoExtra && <div className="flex gap-2 mt-4 flex-wrap">{botaoExtra}</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
          className="relative rounded-2xl overflow-hidden" style={{ background: tokens.fundoContainer, border: `1px solid ${tokens.bordaContainer}`, boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: tokens.acentoTopo }} />
          <div className="relative z-10 p-4 md:p-6">{children}</div>
        </motion.div>
      </div>
    </TemaContext.Provider>
  );
}
