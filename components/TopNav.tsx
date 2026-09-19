"use client";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage, SeletorIdioma } from "../lib/LanguageContext";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, LogOut, ChevronDown, Landmark } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { obterEmpresaAtiva, carregarEmpresaPorId, obterMeuPapel } from "../lib/empresaHelpers";
import BadgeDestaque from "./BadgeDestaque";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const grupos = [
  {
    label: { pt: "🟡 MEI", en: "🟡 MEI", es: "🟡 MEI" },
    cor: "#d4af37",
    corBg: "rgba(212,175,55,0.12)",
    destaque: true,
    itens: [
      { label: { pt: "Painel MEI", en: "MEI Dashboard", es: "Panel MEI" }, path: "/mei", emoji: "🏪" },
      { label: { pt: "Cockpit", en: "Cockpit", es: "Cockpit" }, path: "/mei/cockpit", emoji: "🧭" },
      { label: { pt: "Faturamento", en: "Revenue", es: "Facturación" }, path: "/mei/faturamento", emoji: "📊" },
      { label: { pt: "DAS & Obrigações", en: "DAS & Obligations", es: "DAS & Obligaciones" }, path: "/mei/das", emoji: "🔔" },
      { label: { pt: "Reforma Tributária", en: "Tax Reform", es: "Reforma Tributaria" }, path: "/mei/reforma", emoji: "⚠️" },
      { label: { pt: "Precificação MEI", en: "MEI Pricing", es: "Precios MEI" }, path: "/mei/precificacao", emoji: "🧮" },
      { label: { pt: "IA MEI Advisor", en: "AI MEI Advisor", es: "IA Advisor MEI" }, path: "/mei/ia-advisor", emoji: "🤖" },
      { label: { pt: "Imposto de Renda", en: "Income Tax", es: "Impuesto a la Renta" }, path: "/mei/imposto-renda", emoji: "🧾" },
    ]
  },
  {
    label: { pt: "💰 Financeiro", en: "💰 Financial", es: "💰 Financiero" },
    cor: "#3b6fd4",
    corBg: "rgba(59,111,212,0.12)",
    itens: [
      { label: { pt: "Receitas", en: "Revenue", es: "Ingresos" }, path: "/receitas", emoji: "💵" },
      { label: { pt: "Custos Fixos", en: "Fixed Costs", es: "Costos Fijos" }, path: "/custos-fixos", emoji: "📌" },
      { label: { pt: "Custos Variáveis", en: "Variable Costs", es: "Costos Variables" }, path: "/custos-variaveis", emoji: "📊" },
      { label: { pt: "Fluxo de Caixa", en: "Cash Flow", es: "Flujo de Caja" }, path: "/fluxo-caixa", emoji: "💧" },
      { label: { pt: "DRE", en: "Income Statement", es: "Estado de Resultados" }, path: "/dre", emoji: "📈" },
      { label: { pt: "Endividamento", en: "Debt", es: "Endeudamiento" }, path: "/endividamento", emoji: "⚖️" },
      { label: { pt: "Tesouraria", en: "Treasury", es: "Tesorería" }, path: "/tesouraria", emoji: "🛡️" },
    ]
  },
  {
    label: { pt: "📒 Contabilidade", en: "📒 Accounting", es: "📒 Contabilidad" },
    cor: "#14b8a6",
    corBg: "rgba(20,184,166,0.12)",
    itens: [
      { label: { pt: "Contador", en: "Accountant", es: "Contador" }, path: "/contador", emoji: "🧠" },
      { label: { pt: "Fiscal", en: "Tax", es: "Fiscal" }, path: "/fiscal", emoji: "📜" },
      { label: { pt: "Livro Razão", en: "General Ledger", es: "Libro Mayor" }, path: "/contabilidade/razao", emoji: "📖" },
      { label: { pt: "Balancete", en: "Trial Balance", es: "Balance de Comprobación" }, path: "/contabilidade/balancete", emoji: "⚖️" },
      { label: { pt: "DRE Contábil", en: "Income Statement", es: "Estado de Resultados" }, path: "/contabilidade/dre", emoji: "📑" },
    ]
  },
  {
    label: { pt: "📈 Crescimento", en: "📈 Growth", es: "📈 Crecimiento" },
    cor: "#34d399",
    corBg: "rgba(52,211,153,0.12)",
    itens: [
      { label: { pt: "Metas", en: "Goals", es: "Metas" }, path: "/metas", emoji: "🎯" },
      { label: { pt: "Investimentos", en: "Investments", es: "Inversiones" }, path: "/investimentos", emoji: "💎" },
      { label: { pt: "Simulações", en: "Simulations", es: "Simulaciones" }, path: "/simulacoes", emoji: "🔮" },
      { label: { pt: "Precificação", en: "Pricing", es: "Precios" }, path: "/precificacao", emoji: "🏷️" },
    ]
  },
  {
    label: { pt: "👥 Comercial", en: "👥 Commercial", es: "👥 Comercial" },
    cor: "#f59e0b",
    corBg: "rgba(245,158,11,0.12)",
    itens: [
      { label: { pt: "Clientes", en: "Clients", es: "Clientes" }, path: "/clientes", emoji: "🤝" },
      { label: { pt: "Fornecedores", en: "Suppliers", es: "Proveedores" }, path: "/fornecedores", emoji: "🏭" },
      { label: { pt: "Contas a Pagar", en: "Accounts Payable", es: "Cuentas por Pagar" }, path: "/contas-pagar", emoji: "📤" },
      { label: { pt: "Estoque", en: "Inventory", es: "Inventario" }, path: "/estoque", emoji: "📦" },
      { label: { pt: "Contas a Receber", en: "Receivables", es: "Cuentas por Cobrar" }, path: "/contas-receber", emoji: "📥" },
      { label: { pt: "Inadimplência", en: "Default", es: "Morosidad" }, path: "/inadimplencia", emoji: "⚠️" },
    ]
  },
  {
    label: { pt: "🏢 Gestão", en: "🏢 Management", es: "🏢 Gestión" },
    cor: "#a78bfa",
    corBg: "rgba(167,139,250,0.12)",
    itens: [
      { label: { pt: "Centros de Custo", en: "Cost Centers", es: "Centros de Costo" }, path: "/centros-custo", emoji: "🗂️" },
      { label: { pt: "Importar Documentos", en: "Import Documents", es: "Importar Documentos" }, path: "/importar-documentos", emoji: "📂" },
      { label: { pt: "Relatórios", en: "Reports", es: "Informes" }, path: "/relatorios", emoji: "📋" },
      { label: { pt: "Open Finance", en: "Open Finance", es: "Open Finance" }, path: "/open-finance", emoji: "🏦" },
    ]
  },
  {
    label: { pt: "🤖 IA Premium", en: "🤖 AI Premium", es: "🤖 IA Premium" },
    cor: "#f472b6",
    corBg: "rgba(244,114,182,0.12)",
    itens: [
      { label: { pt: "IA Financeira", en: "Financial AI", es: "IA Financiera" }, path: "/ia-financeira", emoji: "🧠" },
      { label: { pt: "IA Tributária", en: "Tax AI", es: "IA Tributaria" }, path: "/ia-tributaria", emoji: "🏛️" },
    ]
  },
  {
    label: { pt: "⚙️ Config", en: "⚙️ Settings", es: "⚙️ Config" },
    cor: "#6ab0ff",
    corBg: "rgba(106,176,255,0.12)",
    itens: [
      { label: { pt: "Empresa", en: "Company", es: "Empresa" }, path: "/empresa", emoji: "🏛️" },
      { label: { pt: "Planos", en: "Plans", es: "Planes" }, path: "/planos", emoji: "🚀" },
    ]
  },
];

type Idioma = "pt" | "en" | "es";

// PDV — botão único por enquanto (ainda não tem subtelas). Quando ganhar
// catálogo/cadastro/frente de caixa/fechamento nas próximas fases, vira mais
// um item do array `grupos` (com `itens: [...]`) e passa a usar o mesmo
// dropdown que os outros módulos já usam — não precisa refazer, só migrar
// este objeto pra lá.
const pdvModulo = {
  label: { pt: "🛒 PDV", en: "🛒 PDV", es: "🛒 PDV" },
  path: "/pdv",
  cor: "#00ff88",
};

// Nexus — inteligência transversal (atravessa a empresa toda), por isso é
// item próprio e visível, não enterrado dentro de um grupo. Mesmo tratamento
// de destaque do PDV acima, mas some pro operador igual aos demais módulos
// financeiros (é CFO/dono, não frente de caixa).
const nexusModulo = {
  label: { pt: "🌐 Nexus", en: "🌐 Nexus", es: "🌐 Nexus" },
  path: "/nexus",
  cor: "#22d3ee",
};

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { idioma } = useLanguage();
  const lang: Idioma = (["pt", "en", "es"].includes(idioma) ? idioma : "pt") as Idioma;
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [menuMobile, setMenuMobile] = useState(false);
  const [grupoMobile, setGrupoMobile] = useState<string | null>(null);
  const [cadastroIncompleto, setCadastroIncompleto] = useState(false);
  // Papel do usuário NA EMPRESA ATIVA (nunca global — recalculado sempre que a
  // rota muda, o que também cobre troca de empresa numa nova sessão/aba).
  const [papel, setPapel] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const dropdownPortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const empresaId = await obterEmpresaAtiva();
      if (!empresaId) { setCadastroIncompleto(false); setPapel(null); return; }
      const [emp, meuPapel] = await Promise.all([
        carregarEmpresaPorId(empresaId),
        obterMeuPapel(empresaId),
      ]);
      setCadastroIncompleto(emp?.cadastro_completo === false);
      setPapel(meuPapel);
    })();
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const alvo = e.target as Node;
      const dentroDaNav = navRef.current?.contains(alvo);
      const dentroDoDropdown = dropdownPortalRef.current?.contains(alvo);
      if (!dentroDaNav && !dentroDoDropdown) {
        setDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navegar = (path: string) => {
    router.push(path);
    setDropdown(null);
    setMenuMobile(false);
    setGrupoMobile(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const grupoAtivo = (itens: { path: string }[]) =>
    itens.some(i => pathname === i.path || pathname.startsWith(i.path + "/"));

  const conectarLabel = lang === "pt" ? "Conectar Banco" : lang === "en" ? "Connect Bank" : "Conectar Banco";
  const conectarLabelCurto = lang === "pt" ? "BANCO" : lang === "en" ? "BANK" : "BANCO";
  const ofAtivo = pathname === "/open-finance" || pathname.startsWith("/open-finance/");

  const pdvTooltip = lang === "pt" ? "Ponto de Venda" : lang === "en" ? "Point of Sale" : "Punto de Venta";
  const pdvAtivo = pathname === pdvModulo.path || pathname.startsWith(pdvModulo.path + "/");

  // Operador (balconista) só vê o PDV — o resto do menu (financeiro/CFO) fica
  // fora, tanto aqui (camada de UI) quanto no banco (RLS, camada real). Papel
  // ainda não carregado (null) não é tratado como operador — evita esconder o
  // menu inteiro por um instante a cada navegação enquanto o papel carrega.
  const isOperador = papel === "operador";
  const ehDono = papel === "dono";
  const destinoLogo = isOperador ? pdvModulo.path : "/dashboard";

  const equipeItem = { label: { pt: "Equipe", en: "Team", es: "Equipo" }, path: "/equipe", emoji: "🧑‍🤝‍🧑" };
  const gruposVisiveis = ehDono
    ? grupos.map((g) => g.label.pt === "⚙️ Config" ? { ...g, itens: [...g.itens, equipeItem] } : g)
    : grupos;

  const pdvBotaoDesktop = (
    <motion.button
      key="pdv-desktop"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navegar(pdvModulo.path)}
      title={pdvTooltip}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
      style={{
        background: pdvAtivo ? "rgba(0,255,136,0.28)" : "rgba(0,255,136,0.12)",
        color: pdvModulo.cor,
        border: pdvAtivo ? "1px solid rgba(0,255,136,0.85)" : "1px solid rgba(0,255,136,0.45)",
        boxShadow: "0 0 18px rgba(0,255,136,0.4)",
        textShadow: "0 0 8px rgba(0,255,136,0.5)",
      }}
    >
      <span className="text-xs">{pdvModulo.label[lang]}</span>
      <BadgeDestaque lang={lang} />
    </motion.button>
  );

  const pdvBotaoMobile = (
    <motion.button key="pdv-mobile" whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} onClick={() => navegar(pdvModulo.path)}
      title={pdvTooltip}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
      style={{
        background: pdvAtivo ? "rgba(0,255,136,0.26)" : "rgba(0,255,136,0.10)",
        border: pdvAtivo ? "1px solid rgba(0,255,136,0.8)" : "1px solid rgba(0,255,136,0.4)",
        color: pdvModulo.cor,
        boxShadow: "0 0 14px rgba(0,255,136,0.3)",
      }}>
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm">{pdvModulo.label[lang]}</span>
        <BadgeDestaque lang={lang} />
      </div>
    </motion.button>
  );

  const nexusAtivo = pathname === nexusModulo.path || pathname.startsWith(nexusModulo.path + "/");

  const nexusBotaoDesktop = (
    <motion.button
      key="nexus-desktop"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navegar(nexusModulo.path)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
      style={{
        background: nexusAtivo ? "rgba(34,211,238,0.28)" : "rgba(34,211,238,0.12)",
        color: nexusModulo.cor,
        border: nexusAtivo ? "1px solid rgba(34,211,238,0.85)" : "1px solid rgba(34,211,238,0.45)",
        boxShadow: "0 0 18px rgba(34,211,238,0.35)",
        textShadow: "0 0 8px rgba(34,211,238,0.45)",
      }}
    >
      <span className="text-xs">{nexusModulo.label[lang]}</span>
    </motion.button>
  );

  const nexusBotaoMobile = (
    <motion.button key="nexus-mobile" whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} onClick={() => navegar(nexusModulo.path)}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
      style={{
        background: nexusAtivo ? "rgba(34,211,238,0.26)" : "rgba(34,211,238,0.10)",
        border: nexusAtivo ? "1px solid rgba(34,211,238,0.8)" : "1px solid rgba(34,211,238,0.4)",
        color: nexusModulo.cor,
        boxShadow: "0 0 14px rgba(34,211,238,0.3)",
      }}>
      <span className="font-bold text-sm">{nexusModulo.label[lang]}</span>
    </motion.button>
  );

  // Tabuleiro de xadrez — 2 cores padrão (verde-menta/azul, as mesmas de
  // sempre no tema Escuro) alternando por posição na grade 7x2, em vez do
  // arco-íris de 1 cor por grupo que existia antes. (linha+coluna) par =
  // verde-menta, ímpar = azul — alternância real tipo tabuleiro (cada
  // vizinho, inclusive vertical, sempre cai na cor oposta).
  const CHESS_VERDE = "#34d399";
  const CHESS_AZUL = "#6ab0ff";
  function corCasa(indice: number) {
    const linha = Math.floor(indice / 7);
    const coluna = indice % 7;
    return (linha + coluna) % 2 === 0 ? CHESS_VERDE : CHESS_AZUL;
  }

  // Card uniforme — mesmo tamanho/formato pra qualquer um dos 14 (módulo,
  // utilidade ou logout), só a cor alterna pelo tabuleiro.
  function CardNav({ indice, ativo, onClick, title, children }: {
    indice: number; ativo: boolean; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; title?: string; children: React.ReactNode;
  }) {
    const cor = corCasa(indice);
    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        title={title}
        className="relative flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold h-12 w-full px-2 transition-all"
        style={{
          background: ativo ? `${cor}38` : `${cor}30`,
          border: `1px solid ${cor}${ativo ? "c0" : "a0"}`,
          boxShadow: ativo ? `0 0 20px ${cor}70, inset 0 0 12px ${cor}25` : `0 0 16px ${cor}55, inset 0 0 8px ${cor}18`,
          color: cor,
          textShadow: `0 0 8px ${cor}50`,
        }}
      >
        {children}
      </motion.button>
    );
  }

  // Extraído do map original — cada grupo do menu superior (dropdown com
  // seta), agora como 1 card entre os 14 do tabuleiro. `indice` chega já
  // calculado pela posição real no array de 14 (ver `cartasDesktop` abaixo)
  // — nunca mais um número hardcoded que pode destoar da posição de verdade.
  function renderGrupoDesktop(grupo: (typeof grupos)[number], indice: number) {
    const ativo = grupoAtivo(grupo.itens);
    const aberto = dropdown === grupo.label.pt;
    const ehMei = (grupo as any).destaque === true;
    return (
      <CardNav key={grupo.label.pt} indice={indice} ativo={ativo || aberto} onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setDropdownPos({ top: r.bottom, left: r.left });
        setDropdown(aberto ? null : grupo.label.pt);
      }}>
        <span className="truncate">{grupo.label[lang]}</span>
        {ehMei && <BadgeDestaque lang={lang} />}
        <motion.div animate={{ rotate: aberto ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} />
        </motion.div>
      </CardNav>
    );
  }

  // Lista única, na ORDEM VISUAL exata do tabuleiro (7 colunas x 2 linhas).
  // Cada função recebe a posição real (0..13) e devolve o card - garante
  // que a cor (corCasa) sempre bate com a casa onde o card realmente cai,
  // mesmo quando um item (PDV) precisa entrar no meio da lista de grupos.
  const construtoresCartas: ((indice: number) => React.ReactNode)[] = [];
  if (!isOperador) {
    construtoresCartas.push((i) => (
      <CardNav key="dashboard" indice={i} ativo={pathname === "/dashboard"} onClick={() => navegar("/dashboard")}>
        <span>🏠</span>
        <span className="truncate">{lang === "pt" ? "Dashboard" : lang === "en" ? "Dashboard" : "Panel"}</span>
      </CardNav>
    ));
    construtoresCartas.push((i) => (
      <CardNav key="nexus" indice={i} ativo={nexusAtivo} onClick={() => navegar(nexusModulo.path)}>
        <span className="truncate">{nexusModulo.label[lang]}</span>
      </CardNav>
    ));
    gruposVisiveis.forEach((grupo) => {
      const ehMei = (grupo as any).destaque === true;
      construtoresCartas.push((i) => renderGrupoDesktop(grupo, i));
      if (ehMei) {
        construtoresCartas.push((i) => (
          <CardNav key="pdv" indice={i} ativo={pdvAtivo} onClick={() => navegar(pdvModulo.path)} title={pdvTooltip}>
            <span className="truncate">{pdvModulo.label[lang]}</span>
            <BadgeDestaque lang={lang} />
          </CardNav>
        ));
      }
    });
    construtoresCartas.push((i) => (
      <CardNav key="banco" indice={i} ativo={ofAtivo} onClick={() => navegar("/open-finance")} title={conectarLabel}>
        <Landmark size={13} />
        <span className="truncate">{conectarLabelCurto}</span>
      </CardNav>
    ));
    construtoresCartas.push((i) => (
      <div key="idioma" className="h-12 rounded-xl flex items-center justify-center" style={{ background: `${corCasa(i)}30`, border: `1px solid ${corCasa(i)}a0`, boxShadow: `0 0 16px ${corCasa(i)}55` }}>
        <SeletorIdioma />
      </div>
    ));
    construtoresCartas.push((i) => (
      <CardNav key="sair" indice={i} ativo={false} onClick={handleLogout} title={lang === "pt" ? "Sair" : lang === "en" ? "Logout" : "Salir"}>
        <LogOut size={13} />
        <span className="truncate">{lang === "pt" ? "Sair" : lang === "en" ? "Logout" : "Salir"}</span>
      </CardNav>
    ));
  }

  return (
    <>
      {/* DESKTOP */}
      <motion.nav
        ref={navRef}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center gap-1 px-4 py-2.5 h-[108px]"
        style={{
          background: "linear-gradient(90deg, #060f1e 0%, #0a1628 60%, #060f1e 100%)",
          borderBottom: "1px solid rgba(59,111,212,0.25)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(106,176,255,0.08)",
        }}
      >
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navegar(destinoLogo)}
          className="flex items-center gap-2.5 cursor-pointer mr-3 pr-3 shrink-0"
          style={{ borderRight: "1px solid rgba(59,111,212,0.2)" }}
        >
          <div style={{ filter: "drop-shadow(0 0 12px rgba(106,176,255,0.7))" }}>
            <Image src="/logo-aitech.png" alt="Axioma" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <p className="font-black tracking-[0.22em] text-xs leading-none" style={{
              background: "linear-gradient(135deg, #c8d8f0 0%, #6ab0ff 40%, #ffffff 60%, #3b6fd4 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>AXIOMA</p>
            <p className="tracking-[0.3em] font-semibold" style={{ color: "#3a5a8a", fontSize: 8 }}>AI.TECH</p>
          </div>
        </motion.div>

        {/* Tabuleiro de xadrez — 14 cards (7 em cima, 7 embaixo), todos do
            mesmo tamanho, alternando verde-menta/azul por posição. Substitui
            o scroll horizontal escondido de antes (ninguém sabia que dava
            pra rolar) e o arco-íris de 1 cor por módulo. */}
        <div className="grid grid-cols-7 gap-1.5 min-w-0 flex-1">

        {construtoresCartas.map((construir, i) => construir(i))}

        {/* Operador: PDV é a única coisa que sobra no menu */}
        {isOperador && pdvBotaoDesktop}

        </div>

        {/* Painel do dropdown de grupo — em portal pro body (mesmo motivo de
            sempre: escapar do corte vertical do grid acima). */}
        {typeof document !== "undefined" && dropdown && dropdownPos && createPortal(
          (() => {
            const grupoAberto = gruposVisiveis.find((g) => g.label.pt === dropdown);
            if (!grupoAberto) return null;
            const giAberto = gruposVisiveis.indexOf(grupoAberto);
            const corAberto = corCasa(giAberto === 0 ? 2 : giAberto + 3);
            return (
              <div ref={dropdownPortalRef} style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 60 }}>
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="mt-2 min-w-[220px] rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #0a1628 0%, #060f1e 100%)",
                      border: `1px solid ${corAberto}35`,
                      boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${corAberto}15`,
                    }}
                  >
                    <div className="p-2 space-y-0.5">
                      {grupoAberto.itens.map((item, i) => {
                        const itemAtivo = pathname === item.path || pathname.startsWith(item.path + "/");
                        return (
                          <motion.button
                            key={item.path}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ x: 4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navegar(item.path)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all"
                            style={{
                              background: itemAtivo ? `linear-gradient(135deg, ${corAberto}25, ${corAberto}10)` : "transparent",
                              color: itemAtivo ? corAberto : "#7a9aba",
                              border: itemAtivo ? `1px solid ${corAberto}35` : "1px solid transparent",
                            }}
                          >
                            <span className="text-base">{item.emoji}</span>
                            <span className="text-sm font-medium">{item.label[lang]}</span>
                            {item.path === "/open-finance" && !itemAtivo && (
                              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-black"
                                style={{ background: "rgba(106,176,255,0.2)", color: "#6ab0ff", fontSize: 8, border: "1px solid rgba(106,176,255,0.3)" }}>
                                NOVO
                              </span>
                            )}
                            {itemAtivo && (
                              <motion.div className="ml-auto w-2 h-2 rounded-full" style={{ background: corAberto }} />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })(),
          document.body
        )}

      </motion.nav>

      {/* MOBILE */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
        style={{
          background: "rgba(6,15,30,0.97)",
          borderBottom: "1px solid rgba(59,111,212,0.2)",
          backdropFilter: "blur(16px)",
        }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2.5 cursor-pointer" onClick={() => navegar(destinoLogo)}>
          <div style={{ filter: "drop-shadow(0 0 10px rgba(106,176,255,0.6))" }}>
            <Image src="/logo-aitech.png" alt="Axioma" width={30} height={30} className="object-contain" />
          </div>
          <div>
            <p className="font-black tracking-[0.25em] text-xs leading-none" style={{ background: "linear-gradient(135deg, #c8d8f0, #6ab0ff, #fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AXIOMA</p>
            <p style={{ color: "#3a5a8a", fontSize: 8, letterSpacing: "0.3em" }}>AI.TECH</p>
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          {/* Botão Conectar Banco compacto no mobile (fora do alcance do operador) */}
          {!isOperador && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navegar("/open-finance")}
              className="p-2 rounded-xl"
              style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.5)", boxShadow: "0 0 12px rgba(52,211,153,0.4)" }}
              aria-label={conectarLabel}
            >
              <Landmark size={17} style={{ color: "#7CFFC4" }} />
            </motion.button>
          )}
          <SeletorIdioma />
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setMenuMobile(!menuMobile)} className="p-2 rounded-xl" style={{ background: "rgba(59,111,212,0.15)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <AnimatePresence mode="wait">
              {menuMobile
                ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={18} style={{ color: "#6ab0ff" }} /></motion.div>
                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={18} style={{ color: "#6ab0ff" }} /></motion.div>
              }
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* MOBILE Drawer */}
      <AnimatePresence>
        {menuMobile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
              onClick={() => setMenuMobile(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease: "easeOut" }}
              className="md:hidden fixed top-14 right-0 bottom-0 w-80 z-50 overflow-auto"
              style={{ background: "linear-gradient(180deg, #0a1628 0%, #060f1e 100%)", borderLeft: "1px solid rgba(59,111,212,0.2)", boxShadow: "-20px 0 60px rgba(0,0,0,0.6)" }}>
              <div className="p-4 space-y-2">
                {/* Conectar Banco em destaque no topo do drawer (fora do alcance do operador) */}
                {!isOperador && (
                  <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} onClick={() => navegar("/open-finance")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                    style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.3))", border: "1px solid rgba(52,211,153,0.6)", color: "#7CFFC4", boxShadow: "0 0 16px rgba(52,211,153,0.4)" }}>
                    <Landmark size={17} />
                    <span className="font-black text-sm uppercase tracking-wide">{conectarLabelCurto}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-black" style={{ background: "rgba(52,211,153,0.35)", color: "#7CFFC4", fontSize: 8, border: "1px solid rgba(52,211,153,0.6)" }}>NOVO</span>
                  </motion.button>
                )}

                {!isOperador && (
                  <motion.button whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => navegar("/dashboard")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                    style={{ background: pathname === "/dashboard" ? "rgba(59,111,212,0.2)" : "rgba(59,111,212,0.06)", border: pathname === "/dashboard" ? "1px solid rgba(106,176,255,0.3)" : "1px solid rgba(59,111,212,0.1)", color: pathname === "/dashboard" ? "#6ab0ff" : "#5a7a9a" }}>
                    <span>🏠</span>
                    <span className="font-semibold text-sm">{lang === "pt" ? "Dashboard" : lang === "en" ? "Dashboard" : "Panel"}</span>
                  </motion.button>
                )}

                {isOperador && pdvBotaoMobile}

                {!isOperador && nexusBotaoMobile}

                {!isOperador && gruposVisiveis.map((grupo) => {
                  const ativo = grupoAtivo(grupo.itens);
                  const aberto = grupoMobile === grupo.label.pt;
                  const ehMei = (grupo as any).destaque === true;
                  const grupoEl = (
                    <div key={grupo.label.pt}>
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setGrupoMobile(aberto ? null : grupo.label.pt)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{
                          background: ativo || aberto ? grupo.corBg : ehMei ? "rgba(212,175,55,0.06)" : "rgba(59,111,212,0.04)",
                          border: ativo || aberto ? `1px solid ${grupo.cor}35` : ehMei ? "1px solid rgba(212,175,55,0.25)" : "1px solid rgba(59,111,212,0.08)",
                          color: ativo || aberto ? grupo.cor : ehMei ? "#d4af37" : "#5a7a9a",
                        }}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{grupo.label[lang]}</span>
                          {ehMei && <BadgeDestaque lang={lang} />}
                        </div>
                        <motion.div animate={{ rotate: aberto ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} /></motion.div>
                      </motion.button>

                      <AnimatePresence>
                        {aberto && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden">
                            <div className="ml-3 mt-1 space-y-1 border-l-2 pl-3 pb-1" style={{ borderColor: `${grupo.cor}40` }}>
                              {grupo.itens.map((item, i) => {
                                const itemAtivo = pathname === item.path || pathname.startsWith(item.path + "/");
                                return (
                                  <motion.button key={item.path} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    whileTap={{ scale: 0.98 }} onClick={() => navegar(item.path)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                                    style={{ background: itemAtivo ? `linear-gradient(135deg, ${grupo.cor}20, ${grupo.cor}08)` : "transparent", color: itemAtivo ? grupo.cor : "#6a8aaa", border: itemAtivo ? `1px solid ${grupo.cor}30` : "1px solid transparent" }}>
                                    <span>{item.emoji}</span>
                                    <span className="text-sm font-medium">{item.label[lang]}</span>
                                    {item.path === "/open-finance" && !itemAtivo && (
                                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-black"
                                        style={{ background: "rgba(106,176,255,0.2)", color: "#6ab0ff", fontSize: 8, border: "1px solid rgba(106,176,255,0.3)" }}>
                                        NOVO
                                      </span>
                                    )}
                                    {itemAtivo && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: grupo.cor }} />}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                  if (!ehMei) return grupoEl;
                  return [grupoEl, pdvBotaoMobile];
                })}

                <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-4"
                  style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
                  <LogOut size={15} />
                  <span className="font-bold text-sm">{lang === "pt" ? "Sair da conta" : lang === "en" ? "Logout" : "Cerrar sesión"}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="h-16 md:h-[108px]" />

      {cadastroIncompleto && (
        <div
          onClick={() => navegar("/empresa")}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold cursor-pointer text-center"
          style={{ background: "rgba(251,191,36,0.08)", borderBottom: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}
        >
          <span>🏢</span>
          <span>
            {lang === "pt" ? "Complete o cadastro da sua empresa para liberar todos os cálculos do Axioma." :
             lang === "en" ? "Complete your company profile to unlock all of Axioma's calculations." :
             "Completa el registro de tu empresa para habilitar todos los cálculos de Axioma."}
          </span>
          <span style={{ textDecoration: "underline" }}>
            {lang === "pt" ? "Completar agora →" : lang === "en" ? "Complete now →" : "Completar ahora →"}
          </span>
        </div>
      )}
    </>
  );
}