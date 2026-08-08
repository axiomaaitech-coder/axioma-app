"use client";
// 🦅 AXIOMA AI.TECH — PDV Fase 2.1: layout próprio do módulo, com 3 temas.
// NUNCA importa nem altera components/ModuloLayout.tsx — decisão explícita
// do Elias pra não arriscar nenhum outro módulo.
//
// Paleta alinhada à identidade REAL do resto do Axioma (Dashboard/MEI/Open
// Finance — não inventada): fundo #020810, cards em glass azul-arroxeado
// (linear-gradient 160deg rgba(20,15,55,.94)→rgba(10,8,32,.97), mesmo tom
// usado no Dashboard), acento indigo rgba(99,102,241,*) e azul claro
// #6ab0ff (o mesmo do CanvasBox/Open Finance) — nunca verde. O verde neon
// (#00ff88, ver lib/pdvCatalogoTaxonomia visual em cada tela) fica reservado
// só pro botão PDV na TopNav (intocado) e pra ação/destaque pontual dentro
// do próprio módulo (botão principal de salvar/confirmar) — nunca em
// card, borda ou superfície inteira.
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Moon, Contrast } from "lucide-react";
import { motion } from "framer-motion";

export type TemaPdv = "escuro" | "intermediario" | "claro";

export type TokensPdv = {
  fundo: string; fundoContainer: string; bordaContainer: string; acentoTopo: string;
  texto: string; textoSecundario: string; textoMuted: string;
  cardBg: string; cardBorda: string; inputBg: string; inputBorda: string;
  // Acento azul/roxo do sistema — usado em label de seção, breadcrumb ativo,
  // badge, chip selecionado. NUNCA verde (esse fica só pro botão de ação
  // principal, ver VERDE_PDV nas telas).
  acento: string; acentoSuaveBg: string; acentoSuaveBorda: string;
};

const TOKENS: Record<TemaPdv, TokensPdv> = {
  // Mesmo #020810 do resto do Axioma. Cards em glass azul-arroxeado (mesmo
  // gradiente do Dashboard), um tom acima do fundo pra separar visualmente.
  escuro: {
    fundo: "#020810", fundoContainer: "linear-gradient(160deg, rgba(20,15,55,0.5), rgba(10,8,32,0.6))", bordaContainer: "rgba(99,102,241,0.16)",
    acentoTopo: "linear-gradient(90deg, rgba(99,102,241,0.55), rgba(106,176,255,0.3) 50%, transparent)",
    texto: "#e2ecf7", textoSecundario: "#c8d8f0", textoMuted: "#5a7a9a",
    cardBg: "linear-gradient(160deg, rgba(22,20,50,0.75), rgba(14,14,34,0.8))", cardBorda: "rgba(106,176,255,0.16)",
    inputBg: "rgba(10,16,32,0.7)", inputBorda: "rgba(106,176,255,0.22)",
    acento: "#6ab0ff", acentoSuaveBg: "rgba(106,176,255,0.08)", acentoSuaveBorda: "rgba(106,176,255,0.22)",
  },
  // Azul claro + branco + azul escuro, sem verde em superfície nenhuma.
  intermediario: {
    fundo: "#dde9f9", fundoContainer: "rgba(255,255,255,0.85)", bordaContainer: "rgba(26,58,143,0.16)",
    acentoTopo: "linear-gradient(90deg, rgba(26,58,143,0.5), rgba(42,95,212,0.3) 50%, transparent)",
    texto: "#0f2249", textoSecundario: "#2c4066", textoMuted: "#5a6f92",
    cardBg: "#ffffff", cardBorda: "rgba(26,58,143,0.18)", inputBg: "#ffffff", inputBorda: "rgba(26,58,143,0.22)",
    acento: "#1a3a8f", acentoSuaveBg: "rgba(26,58,143,0.08)", acentoSuaveBorda: "rgba(26,58,143,0.22)",
  },
  // Fundo quase branco, cards brancos com borda cinza-azulada suave. Zero
  // verde-menta — era o problema relatado (contraste fraco, aparência frágil).
  claro: {
    fundo: "#f6f9fc", fundoContainer: "rgba(255,255,255,0.9)", bordaContainer: "rgba(90,111,146,0.16)",
    acentoTopo: "linear-gradient(90deg, rgba(26,58,143,0.4), rgba(90,111,146,0.25) 50%, transparent)",
    texto: "#0f2249", textoSecundario: "#3b4f70", textoMuted: "#64789a",
    cardBg: "#ffffff", cardBorda: "rgba(90,111,146,0.2)", inputBg: "#ffffff", inputBorda: "rgba(90,111,146,0.25)",
    acento: "#1a3a8f", acentoSuaveBg: "rgba(26,58,143,0.06)", acentoSuaveBorda: "rgba(26,58,143,0.18)",
  },
};

const CHAVE_TEMA = "axioma_pdv_tema";

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

function SeletorTema({ tema, setTema, tokens }: { tema: TemaPdv; setTema: (t: TemaPdv) => void; tokens: TokensPdv }) {
  const opcoes: { valor: TemaPdv; Icone: typeof Sun }[] = [
    { valor: "escuro", Icone: Moon }, { valor: "intermediario", Icone: Contrast }, { valor: "claro", Icone: Sun },
  ];
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
      {opcoes.map(({ valor, Icone }) => (
        <button key={valor} onClick={() => setTema(valor)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ background: tema === valor ? tokens.acentoSuaveBorda : "transparent", color: tema === valor ? tokens.acento : tokens.textoMuted }}>
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

  const estiloSeta: React.CSSProperties = { background: tokens.acentoSuaveBg, color: tokens.acento, border: `1px solid ${tokens.acentoSuaveBorda}` };

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
            <SeletorTema tema={tema} setTema={setTema} tokens={tokens} />
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
