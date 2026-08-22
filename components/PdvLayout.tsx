"use client";
// 🦅 AXIOMA AI.TECH — PDV Fase 2.1: layout próprio do módulo, com 3 temas.
// NUNCA importa nem altera components/ModuloLayout.tsx — decisão explícita
// do Elias pra não arriscar nenhum outro módulo.
//
// Tema 1 (escuro, padrão) — APROVADO, não mudar: #020810, cards em glass
// azul-arroxeado, verde neon só no botão de ação (tokens.acaoBg).
//
// Temas 2 e 3 — hex FIXOS, sem interpretação (ver paleta abaixo). Zero
// verde, zero preto, zero cinza neutro em qualquer um dos dois. Texto
// escuro é sempre AZUL-NOITE (#0E0763); texto claro é sempre branco.
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Moon, Contrast, Waves } from "lucide-react";
import { motion } from "framer-motion";

export type TemaPdv = "escuro" | "intermediario" | "claro" | "azul";

export type TokensPdv = {
  fundo: string;
  // Barra superior (onde título/seta/seletor de tema vivem) — cor PRÓPRIA,
  // pode ser diferente do fundo da página (é o caso do tema claro: fundo
  // branco, barra azul-marca). No tema escuro/intermediário, barra === fundo.
  barraBg: string; barraTexto: string; barraAcentoBg: string; barraAcentoTexto: string;
  fundoContainer: string; bordaContainer: string; acentoTopo: string;
  texto: string; textoSecundario: string; textoMuted: string;
  // Texto DENTRO de um card (cardBg) pode precisar ser diferente do texto
  // solto no painel — cardBg é uma cor cheia própria, não necessariamente a
  // mesma leitura clara/escura do fundoContainer.
  cardBg: string; cardTexto: string; cardBorda: string;
  inputBg: string; inputTexto: string; inputBorda: string;
  acento: string; acentoSuaveBg: string; acentoSuaveBorda: string;
  // Fundo de MODAL/overlay (Finalizar Venda, Definir Preço, etc.) — SEMPRE
  // opaco (sem alpha), diferente de acentoSuaveBg (translúcido de propósito,
  // pensado pra tingir uma superfície que já é opaca por baixo, tipo linha
  // de tabela em destaque). Um modal fica por cima do conteúdo real da tela
  // (tabela/totais) — com acentoSuaveBg ali, esse conteúdo aparecia por
  // trás do modal.
  modalBg: string;
  // Botão de AÇÃO (Salvar/Confirmar/+Novo/Consultar) — verde só no tema
  // escuro; nos temas 2 e 3 é sempre AZUL-ELETRICO + texto branco.
  acaoBg: string; acaoTexto: string;
  // Chips de filtro (Todos/Alimentos/Não-Alimentos) — ativo e inativo têm
  // pares cor+texto PRÓPRIOS por tema (não são sempre a mesma combinação
  // "acento/acentoSuave" genérica).
  filtroAtivoBg: string; filtroAtivoTexto: string; filtroAtivoBorda: string;
  filtroInativoBg: string; filtroInativoTexto: string; filtroInativoBorda: string;
};

// ============================================================================
// PALETA OFICIAL (temas 2 e 3) — hex fixos, usar SOMENTE estes valores.
//   AZUL-ELETRICO #371AE5 — botões de ação, botão de filtro ativo
//   AZUL-PROFUNDO #2914BA — cards no tema intermediário, hover
//   AZUL-MARCA    #1B0D8E — barra superior, superfície principal do tema
//                           intermediário, barra superior do tema claro
//   AZUL-NOITE    #0E0763 — texto sobre fundos claros, títulos (NUNCA preto)
//   BRANCO-GELO   #FAFAEA — fundo em volta dos cards no tema intermediário
//   BRANCO-PURO   #FFFFFF — fundo geral do tema claro / texto sobre azul
//   MARFIM        #F8F8DF — cards no tema claro
// Regra de contraste: #FFFFFF só sobre AZUL-ELETRICO/PROFUNDO/MARCA/NOITE.
// #0E0763 só sobre BRANCO-PURO/BRANCO-GELO/MARFIM. Nunca claro-sobre-claro
// nem escuro-sobre-escuro.
// ============================================================================
const AZUL_ELETRICO = "#371AE5";
const AZUL_PROFUNDO = "#2914BA";
const AZUL_MARCA = "#1B0D8E";
const AZUL_NOITE = "#0E0763";
const BRANCO_GELO = "#FAFAEA";
const BRANCO_PURO = "#FFFFFF";
const MARFIM = "#F8F8DF";

// ============================================================================
// TEMA 4 "azul" (novo, PDV Fase 3 — Frente de Caixa) — navy profundo estilo
// terminal de PDV de supermercado real, texto branco-gelo, acento ciano de
// alto contraste. Paleta PRÓPRIA, não reaproveita os hex do tema 2/3 (que
// são AZUL-ELETRICO/marca, mais roxo-azulado) — este é mais "navy/oceano",
// pensado pra tela cheia usada o dia todo (menos saturado, cansa menos).
// ============================================================================
const NAVY_FUNDO = "#0A1B33";
const NAVY_BARRA = "#0F2444";
const NAVY_CARD = "#12294B";
const CERULEO = "#4DA8FF";
const CERULEO_FORTE = "#2E7BDB";
// AZUL_BOTAO — só pro fundo de botão de ação (acaoBg) com texto branco em
// cima. CERULEO sozinho (#4DA8FF) é claro DEMAIS pra texto branco: contraste
// calculado ~2.5:1, abaixo até do mínimo de "texto grande" do WCAG (3:1).
// AZUL_BOTAO garante >=4.2:1 na extremidade mais clara do gradiente e
// ~6.7:1 na mais escura — CERULEO continua só como cor de TEXTO/ícone sobre
// fundo escuro (acento), onde claro-sobre-escuro é o contraste certo.
const AZUL_BOTAO = "#1D4ED8";
const BRANCO_GELO_AZUL = "#EAF2FF";

const TOKENS: Record<TemaPdv, TokensPdv> = {
  // TEMA 1 (padrão) — APROVADO, NÃO TOCAR na aparência.
  escuro: {
    fundo: "#020810",
    barraBg: "#020810", barraTexto: "#e2ecf7", barraAcentoBg: "rgba(106,176,255,0.1)", barraAcentoTexto: "#6ab0ff",
    fundoContainer: "linear-gradient(160deg, rgba(20,15,55,0.5), rgba(10,8,32,0.6))", bordaContainer: "rgba(99,102,241,0.16)",
    acentoTopo: "linear-gradient(90deg, rgba(99,102,241,0.55), rgba(106,176,255,0.3) 50%, transparent)",
    texto: "#e2ecf7", textoSecundario: "#c8d8f0", textoMuted: "#5a7a9a",
    cardBg: "linear-gradient(160deg, rgba(22,20,50,0.75), rgba(14,14,34,0.8))", cardTexto: "#e2ecf7", cardBorda: "rgba(106,176,255,0.16)",
    inputBg: "rgba(10,16,32,0.7)", inputTexto: "#e2ecf7", inputBorda: "rgba(106,176,255,0.22)",
    acento: "#6ab0ff", acentoSuaveBg: "rgba(106,176,255,0.08)", acentoSuaveBorda: "rgba(106,176,255,0.22)",
    // Mesmos tons/direção do cardBg acima, só que sem alpha — 100% opaco.
    modalBg: "linear-gradient(160deg, #18153c, #0d0c22)",
    acaoBg: "linear-gradient(135deg, #00cc6a, #00ff88)", acaoTexto: "#022",
    filtroAtivoBg: "rgba(106,176,255,0.22)", filtroAtivoTexto: "#6ab0ff", filtroAtivoBorda: "#6ab0ff",
    filtroInativoBg: "rgba(106,176,255,0.08)", filtroInativoTexto: "#5a7a9a", filtroInativoBorda: "rgba(106,176,255,0.22)",
  },
  // TEMA 2 — azul-marca de fundo/barra, painel branco-gelo, cards azul-profundo.
  intermediario: {
    fundo: AZUL_MARCA,
    barraBg: AZUL_MARCA, barraTexto: BRANCO_PURO, barraAcentoBg: "rgba(255,255,255,0.14)", barraAcentoTexto: BRANCO_PURO,
    fundoContainer: BRANCO_GELO, bordaContainer: "rgba(55,26,229,0.25)",
    acentoTopo: `linear-gradient(90deg, rgba(55,26,229,0.55), rgba(41,20,186,0.3) 50%, transparent)`,
    texto: AZUL_NOITE, textoSecundario: AZUL_NOITE, textoMuted: "rgba(14,7,99,0.68)",
    cardBg: AZUL_PROFUNDO, cardTexto: BRANCO_PURO, cardBorda: "rgba(55,26,229,0.4)",
    inputBg: BRANCO_GELO, inputTexto: AZUL_NOITE, inputBorda: "rgba(55,26,229,0.35)",
    acento: AZUL_ELETRICO, acentoSuaveBg: BRANCO_GELO, acentoSuaveBorda: "rgba(55,26,229,0.3)",
    modalBg: BRANCO_GELO, // já era opaco — mantém a mesma cor
    acaoBg: AZUL_ELETRICO, acaoTexto: BRANCO_PURO,
    filtroAtivoBg: AZUL_ELETRICO, filtroAtivoTexto: BRANCO_PURO, filtroAtivoBorda: AZUL_ELETRICO,
    filtroInativoBg: AZUL_MARCA, filtroInativoTexto: BRANCO_PURO, filtroInativoBorda: AZUL_MARCA,
  },
  // TEMA 3 — fundo branco-puro, barra azul-marca (casa com tema 2), cards marfim.
  claro: {
    fundo: BRANCO_PURO,
    barraBg: AZUL_MARCA, barraTexto: BRANCO_PURO, barraAcentoBg: "rgba(255,255,255,0.14)", barraAcentoTexto: BRANCO_PURO,
    fundoContainer: BRANCO_PURO, bordaContainer: "rgba(55,26,229,0.25)",
    acentoTopo: `linear-gradient(90deg, rgba(55,26,229,0.5), rgba(41,20,186,0.3) 50%, transparent)`,
    texto: AZUL_NOITE, textoSecundario: AZUL_NOITE, textoMuted: "rgba(14,7,99,0.68)",
    cardBg: MARFIM, cardTexto: AZUL_NOITE, cardBorda: AZUL_ELETRICO,
    inputBg: MARFIM, inputTexto: AZUL_NOITE, inputBorda: AZUL_ELETRICO,
    acento: AZUL_ELETRICO, acentoSuaveBg: MARFIM, acentoSuaveBorda: AZUL_ELETRICO,
    modalBg: MARFIM, // já era opaco — mantém a mesma cor
    acaoBg: AZUL_ELETRICO, acaoTexto: BRANCO_PURO,
    filtroAtivoBg: AZUL_ELETRICO, filtroAtivoTexto: BRANCO_PURO, filtroAtivoBorda: AZUL_ELETRICO,
    filtroInativoBg: MARFIM, filtroInativoTexto: AZUL_NOITE, filtroInativoBorda: AZUL_ELETRICO,
  },
  // TEMA 4 — navy profundo, cards em azul-navy, acento ciano. Ver nota acima.
  azul: {
    fundo: NAVY_FUNDO,
    barraBg: NAVY_BARRA, barraTexto: BRANCO_GELO_AZUL, barraAcentoBg: "rgba(77,168,255,0.16)", barraAcentoTexto: CERULEO,
    fundoContainer: `linear-gradient(160deg, ${NAVY_BARRA}, ${NAVY_FUNDO})`, bordaContainer: "rgba(77,168,255,0.22)",
    acentoTopo: `linear-gradient(90deg, rgba(77,168,255,0.55), rgba(46,123,219,0.3) 50%, transparent)`,
    texto: BRANCO_GELO_AZUL, textoSecundario: "#C7D9F2", textoMuted: "#7C93B8",
    cardBg: NAVY_CARD, cardTexto: BRANCO_GELO_AZUL, cardBorda: "rgba(77,168,255,0.24)",
    inputBg: NAVY_CARD, inputTexto: BRANCO_GELO_AZUL, inputBorda: "rgba(77,168,255,0.32)",
    acento: CERULEO, acentoSuaveBg: "rgba(77,168,255,0.1)", acentoSuaveBorda: "rgba(77,168,255,0.28)",
    modalBg: NAVY_CARD, // mesmo tom do cardBg, já opaco
    acaoBg: `linear-gradient(135deg, ${AZUL_BOTAO}, ${CERULEO_FORTE})`, acaoTexto: "#FFFFFF",
    filtroAtivoBg: "rgba(77,168,255,0.24)", filtroAtivoTexto: CERULEO, filtroAtivoBorda: CERULEO,
    filtroInativoBg: "rgba(77,168,255,0.08)", filtroInativoTexto: "#7C93B8", filtroInativoBorda: "rgba(77,168,255,0.22)",
  },
};

const CHAVE_TEMA = "axioma_pdv_tema";

const TemaContext = createContext<{ tema: TemaPdv; tokens: TokensPdv; setTema: (t: TemaPdv) => void }>({
  tema: "escuro", tokens: TOKENS.escuro, setTema: () => {},
});

// Qualquer tela do PDV chama isso pra pintar seus próprios cards/inputs de
// acordo com o tema ativo — não precisa reimplementar persistência nem
// estado, só consumir os tokens já resolvidos. NENHUM componente define cor
// própria fora daqui — é o que impede o retrabalho de cor se repetir.
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
    { valor: "escuro", Icone: Moon }, { valor: "intermediario", Icone: Contrast }, { valor: "claro", Icone: Sun }, { valor: "azul", Icone: Waves },
  ];
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: tokens.barraAcentoBg }}>
      {opcoes.map(({ valor, Icone }) => (
        <button key={valor} onClick={() => setTema(valor)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ background: tema === valor ? "rgba(255,255,255,0.25)" : "transparent", color: tokens.barraTexto, opacity: tema === valor ? 1 : 0.6 }}>
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
  // Opt-in — só a Frente de Caixa usa isso hoje. Troca min-h-screen (a
  // página cresce pra caber o conteúdo, rola se precisar) por uma altura
  // TRAVADA em "viewport menos a TopNav fixa" (64px, ver components/
  // TopNav.tsx — barra fixed + spacer h-16), com paddings mais enxutos e o
  // container de conteúdo virando flex-column pro filho decidir sozinho o
  // que rola por dentro (normalmente só a lista de itens) em vez da página
  // inteira rolar. Default (false/undefined) preserva EXATAMENTE o
  // comportamento de sempre — Catálogo/Cadastro/Importar NF-e/Equipe etc.
  // continuam com scroll de página natural, nada muda pra eles.
  telaCheia?: boolean;
}

export default function PdvLayout({ titulo, subtitulo, voltarPara, aoVoltar, botaoExtra, children, telaCheia }: PdvLayoutProps) {
  const { tema, tokens, setTema } = useProviderTema();

  const estiloSeta: React.CSSProperties = { background: tokens.barraAcentoBg, color: tokens.barraAcentoTexto };

  return (
    <TemaContext.Provider value={{ tema, tokens, setTema }}>
      <div
        className={telaCheia ? "flex flex-col p-3 md:p-4 overflow-hidden" : "min-h-screen p-4 md:p-8"}
        style={{ background: tokens.fundo, ...(telaCheia ? { height: "calc(100vh - 64px)" } : {}) }}
      >
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}
          className={telaCheia ? "shrink-0 mb-3 rounded-2xl p-3 md:p-4" : "mb-6 md:mb-8 rounded-2xl p-4 md:p-6"} style={{ background: tokens.barraBg }}>
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
                <h2 className={telaCheia ? "text-lg md:text-xl font-extrabold mb-0.5 truncate" : "text-2xl md:text-3xl font-extrabold mb-1 truncate"} style={{ color: tokens.barraTexto }}>{titulo}</h2>
                {!telaCheia && <p className="text-sm" style={{ color: tokens.barraTexto, opacity: 0.8 }}>{subtitulo}</p>}
              </div>
            </div>
            <SeletorTema tema={tema} setTema={setTema} tokens={tokens} />
          </div>
          {botaoExtra && <div className="flex gap-2 mt-4 flex-wrap">{botaoExtra}</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
          className={telaCheia ? "relative rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col" : "relative rounded-2xl overflow-hidden"}
          style={{ background: tokens.fundoContainer, border: `1px solid ${tokens.bordaContainer}`, boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: tokens.acentoTopo }} />
          <div className={telaCheia ? "relative z-10 p-3 md:p-4 flex-1 min-h-0 flex flex-col" : "relative z-10 p-4 md:p-6"}>{children}</div>
        </motion.div>
      </div>
    </TemaContext.Provider>
  );
}
