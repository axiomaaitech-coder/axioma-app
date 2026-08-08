"use client";
// 🦅 AXIOMA AI.TECH — PDV Fase 2.1: layout próprio do módulo, com 3 temas.
// NUNCA importa nem altera components/ModuloLayout.tsx — decisão explícita
// do Elias pra não arriscar nenhum outro módulo.
//
// Paleta alinhada à identidade REAL do resto do Axioma (Dashboard/MEI/Open
// Finance — não inventada). Tema 1 (escuro, padrão) — APROVADO, não mudar:
// fundo #020810, cards em glass azul-arroxeado (mesmo gradiente do
// Dashboard), acento indigo/azul claro #6ab0ff (mesmo do CanvasBox/Open
// Finance), verde neon (#00ff88) só no botão de ação (tokens.acaoBg).
// Temas 2 e 3 (intermediário/claro) — REFEITOS: verde SAI por completo,
// vira azul forte + texto branco nos botões de ação também (ver paleta
// "AZUL AXIOMA" logo abaixo). O botão PDV da TopNav (outro arquivo) segue
// verde sempre — é a identidade do módulo no menu, fora do escopo daqui.
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
  // badge, chip selecionado.
  acento: string; acentoSuaveBg: string; acentoSuaveBorda: string;
  // Botão de AÇÃO (Salvar/Confirmar/+Novo/Consultar) — só aqui o verde
  // ainda existe, e só no tema escuro. Nos temas 2 e 3 vira azul forte +
  // texto branco (exigência do Elias: "verde sai dos temas 2 e 3 por
  // completo"). Toda tela do PDV usa ESTES 2 tokens pros botões de ação,
  // nunca cor fixa — é o que garante nunca mais verde-sobre-claro invisível.
  acaoBg: string; acaoTexto: string;
};

// ============================================================================
// PALETA "AZUL AXIOMA" — 7 tons, derivados das cores que o resto do sistema
// já usa (Dashboard/Open Finance/CanvasBox), nunca ad hoc por componente.
// Reaproveitada em TODOS os tokens de "intermediario" e "claro" abaixo.
//   AXIOMA_900 #0f2249 — azul-marinho mais escuro (texto forte, botão de
//     ação no tema intermediário — precisa ser mais escuro que o fundo azul)
//   AXIOMA_700 #1a3a8f — azul Axioma "oficial" (já é o início do gradiente
//     de botão do Open Finance) — fundo do tema intermediário, moldura e
//     acento do tema claro, botão de ação do tema claro
//   #2a5fd4 (rgb 42,95,212) — azul vibrante (já é o fim do gradiente do
//     Open Finance) — usado no acentoTopo do tema claro, mesma família
//   AXIOMA_400 #6ab0ff — azul claro (já é o accent do CanvasBox/sistema)
//   AXIOMA_200 #cfe4ff — azul bebê (tint claro derivado de #6ab0ff) — fundo
//     de card no tema claro, acento no tema intermediário
//   AXIOMA_050 #f6f9fc — quase-branco (mantido do ajuste anterior)
// ============================================================================
const AXIOMA_900 = "#0f2249";
const AXIOMA_700 = "#1a3a8f";
const AXIOMA_400 = "#6ab0ff";
const AXIOMA_200 = "#cfe4ff";
const AXIOMA_050 = "#f6f9fc";

const TOKENS: Record<TemaPdv, TokensPdv> = {
  // TEMA 1 (padrão) — APROVADO, NÃO TOCAR na aparência. Mesmo #020810 do
  // resto do Axioma, cards em glass azul-arroxeado (mesmo gradiente do
  // Dashboard), verde neon só no botão de ação.
  escuro: {
    fundo: "#020810", fundoContainer: "linear-gradient(160deg, rgba(20,15,55,0.5), rgba(10,8,32,0.6))", bordaContainer: "rgba(99,102,241,0.16)",
    acentoTopo: "linear-gradient(90deg, rgba(99,102,241,0.55), rgba(106,176,255,0.3) 50%, transparent)",
    texto: "#e2ecf7", textoSecundario: "#c8d8f0", textoMuted: "#5a7a9a",
    cardBg: "linear-gradient(160deg, rgba(22,20,50,0.75), rgba(14,14,34,0.8))", cardBorda: "rgba(106,176,255,0.16)",
    inputBg: "rgba(10,16,32,0.7)", inputBorda: "rgba(106,176,255,0.22)",
    acento: AXIOMA_400, acentoSuaveBg: "rgba(106,176,255,0.08)", acentoSuaveBorda: "rgba(106,176,255,0.22)",
    acaoBg: "linear-gradient(135deg, #00cc6a, #00ff88)", acaoTexto: "#022",
  },
  // TEMA 2 — REFEITO: azul + branco, zero verde. Fundo é um azul saturado
  // e sóbrio de verdade (não o azul-clarinho que sumia) — texto branco pra
  // ter contraste. Cards em vidro branco translúcido "no mesmo tom da
  // barra" (mesma base azul, só com uma camada de luz por cima). Botão de
  // ação no tom MAIS ESCURO da paleta — precisa destacar mesmo sobre o
  // fundo azul.
  intermediario: {
    fundo: AXIOMA_700, fundoContainer: "rgba(255,255,255,0.07)", bordaContainer: "rgba(255,255,255,0.18)",
    acentoTopo: "linear-gradient(90deg, rgba(255,255,255,0.55), rgba(207,228,255,0.3) 50%, transparent)",
    texto: "#ffffff", textoSecundario: "rgba(255,255,255,0.82)", textoMuted: "rgba(255,255,255,0.6)",
    cardBg: "rgba(255,255,255,0.1)", cardBorda: "rgba(255,255,255,0.24)",
    inputBg: "rgba(255,255,255,0.12)", inputBorda: "rgba(255,255,255,0.3)",
    acento: AXIOMA_200, acentoSuaveBg: "rgba(255,255,255,0.12)", acentoSuaveBorda: "rgba(255,255,255,0.28)",
    acaoBg: AXIOMA_900, acaoTexto: "#ffffff",
  },
  // TEMA 3 — REFEITO: hierarquia de 3 tons pedida pelo Elias — fundo BRANCO
  // (mantido) → card em azul bebê MÉDIO (visível de cara, não o quase-branco
  // de antes) → moldura/acento em azul Axioma mais escuro. Zero verde.
  claro: {
    fundo: AXIOMA_050, fundoContainer: "#ffffff", bordaContainer: "rgba(26,58,143,0.35)",
    acentoTopo: "linear-gradient(90deg, rgba(26,58,143,0.5), rgba(42,95,212,0.3) 50%, transparent)",
    texto: AXIOMA_900, textoSecundario: "#2c4066", textoMuted: "#5a6f92",
    cardBg: AXIOMA_200, cardBorda: "rgba(26,58,143,0.3)", inputBg: "#ffffff", inputBorda: "rgba(26,58,143,0.3)",
    acento: AXIOMA_700, acentoSuaveBg: AXIOMA_200, acentoSuaveBorda: "rgba(26,58,143,0.32)",
    acaoBg: AXIOMA_700, acaoTexto: "#ffffff",
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
