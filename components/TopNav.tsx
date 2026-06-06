"use client";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage, SeletorIdioma } from "../lib/LanguageContext";
import { useState, useRef, useEffect } from "react";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const grupos = [
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

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLanguage() as { locale: Idioma; t: (k: string) => string };
  const lang: Idioma = (["pt", "en", "es"].includes(locale) ? locale : "pt") as Idioma;
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [menuMobile, setMenuMobile] = useState(false);
  const [grupoMobile, setGrupoMobile] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
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
    itens.some(i => pathname === i.path);

  return (
    <>
      {/* ── DESKTOP TopNav ── */}
      <motion.nav
        ref={navRef}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center gap-1 px-4 h-16"
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
          onClick={() => navegar("/dashboard")}
          className="flex items-center gap-3 cursor-pointer mr-4 pr-4"
          style={{ borderRight: "1px solid rgba(59,111,212,0.2)" }}
        >
          <div style={{ filter: "drop-shadow(0 0 12px rgba(106,176,255,0.7))" }}>
            <Image src="/logo-aitech.png" alt="Axioma" width={34} height={34} className="object-contain" />
          </div>
          <div>
            <p className="font-black tracking-[0.25em] text-sm leading-none" style={{
              background: "linear-gradient(135deg, #c8d8f0 0%, #6ab0ff 40%, #ffffff 60%, #3b6fd4 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>AXIOMA</p>
            <p className="text-xs tracking-[0.3em] font-semibold" style={{ color: "#3a5a8a", fontSize: 9 }}>AI.TECH</p>
          </div>
        </motion.div>

        {/* Dashboard */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navegar("/dashboard")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: pathname === "/dashboard" ? "rgba(59,111,212,0.2)" : "transparent",
            color: pathname === "/dashboard" ? "#6ab0ff" : "#5a7a9a",
            border: pathname === "/dashboard" ? "1px solid rgba(106,176,255,0.3)" : "1px solid transparent",
          }}
        >
          <span>🏠</span>
          <span>{lang === "pt" ? "Dashboard" : lang === "en" ? "Dashboard" : "Panel"}</span>
        </motion.button>

        {/* Grupos dropdown */}
        {grupos.map((grupo) => {
          const ativo = grupoAtivo(grupo.itens);
          const aberto = dropdown === grupo.label.pt;
          return (
            <div key={grupo.label.pt} className="relative">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDropdown(aberto ? null : grupo.label.pt)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: ativo || aberto ? grupo.corBg : "transparent",
                  color: ativo || aberto ? grupo.cor : "#5a7a9a",
                  border: ativo || aberto ? `1px solid ${grupo.cor}40` : "1px solid transparent",
                }}
              >
                <span className="text-xs">{grupo.label[lang]}</span>
                <motion.div animate={{ rotate: aberto ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={13} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {aberto && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-2 min-w-[200px] rounded-2xl overflow-hidden z-50"
                    style={{
                      background: "linear-gradient(135deg, #0a1628 0%, #060f1e 100%)",
                      border: `1px solid ${grupo.cor}35`,
                      boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${grupo.cor}15`,
                    }}
                  >
                    <div className="p-2 space-y-0.5">
                      {grupo.itens.map((item, i) => {
                        const itemAtivo = pathname === item.path;
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
                              background: itemAtivo ? `linear-gradient(135deg, ${grupo.cor}25, ${grupo.cor}10)` : "transparent",
                              color: itemAtivo ? grupo.cor : "#7a9aba",
                              border: itemAtivo ? `1px solid ${grupo.cor}35` : "1px solid transparent",
                            }}
                          >
                            <span className="text-base">{item.emoji}</span>
                            <span className="text-sm font-medium">{item.label[lang]}</span>
                            {itemAtivo && (
                              <motion.div
                                layoutId="activeItem"
                                className="ml-auto w-2 h-2 rounded-full"
                                style={{ background: grupo.cor }}
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Lado direito */}
        <div className="ml-auto flex items-center gap-3">
          <SeletorIdioma />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              color: "#f87171",
            }}
          >
            <LogOut size={14} />
            <span>{lang === "pt" ? "Sair" : lang === "en" ? "Logout" : "Salir"}</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* ── MOBILE TopNav ── */}
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
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navegar("/dashboard")}
        >
          <div style={{ filter: "drop-shadow(0 0 10px rgba(106,176,255,0.6))" }}>
            <Image src="/logo-aitech.png" alt="Axioma" width={30} height={30} className="object-contain" />
          </div>
          <div>
            <p className="font-black tracking-[0.25em] text-xs leading-none" style={{
              background: "linear-gradient(135deg, #c8d8f0, #6ab0ff, #fff)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>AXIOMA</p>
            <p style={{ color: "#3a5a8a", fontSize: 8, letterSpacing: "0.3em" }}>AI.TECH</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          <SeletorIdioma />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuMobile(!menuMobile)}
            className="p-2 rounded-xl"
            style={{ background: "rgba(59,111,212,0.15)", border: "1px solid rgba(59,111,212,0.3)" }}
          >
            <AnimatePresence mode="wait">
              {menuMobile
                ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={18} style={{ color: "#6ab0ff" }} /></motion.div>
                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={18} style={{ color: "#6ab0ff" }} /></motion.div>
              }
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* ── MOBILE Drawer ── */}
      <AnimatePresence>
        {menuMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
              onClick={() => setMenuMobile(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="md:hidden fixed top-14 right-0 bottom-0 w-80 z-50 overflow-auto"
              style={{
                background: "linear-gradient(180deg, #0a1628 0%, #060f1e 100%)",
                borderLeft: "1px solid rgba(59,111,212,0.2)",
                boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
              }}
            >
              <div className="p-4 space-y-2">
                {/* Dashboard mobile */}
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navegar("/dashboard")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                  style={{
                    background: pathname === "/dashboard" ? "rgba(59,111,212,0.2)" : "rgba(59,111,212,0.06)",
                    border: pathname === "/dashboard" ? "1px solid rgba(106,176,255,0.3)" : "1px solid rgba(59,111,212,0.1)",
                    color: pathname === "/dashboard" ? "#6ab0ff" : "#5a7a9a",
                  }}
                >
                  <span>🏠</span>
                  <span className="font-semibold text-sm">{lang === "pt" ? "Dashboard" : lang === "en" ? "Dashboard" : "Panel"}</span>
                </motion.button>

                {/* Grupos mobile */}
                {grupos.map((grupo) => {
                  const ativo = grupoAtivo(grupo.itens);
                  const aberto = grupoMobile === grupo.label.pt;
                  return (
                    <div key={grupo.label.pt}>
                      <motion.button
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setGrupoMobile(aberto ? null : grupo.label.pt)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{
                          background: ativo || aberto ? grupo.corBg : "rgba(59,111,212,0.04)",
                          border: ativo || aberto ? `1px solid ${grupo.cor}35` : "1px solid rgba(59,111,212,0.08)",
                          color: ativo || aberto ? grupo.cor : "#5a7a9a",
                        }}
                      >
                        <span className="font-bold text-sm">{grupo.label[lang]}</span>
                        <motion.div animate={{ rotate: aberto ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={14} />
                        </motion.div>
                      </motion.button>

                      <AnimatePresence>
                        {aberto && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="ml-3 mt-1 space-y-1 border-l-2 pl-3 pb-1" style={{ borderColor: `${grupo.cor}40` }}>
                              {grupo.itens.map((item, i) => {
                                const itemAtivo = pathname === item.path;
                                return (
                                  <motion.button
                                    key={item.path}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navegar(item.path)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                                    style={{
                                      background: itemAtivo ? `linear-gradient(135deg, ${grupo.cor}20, ${grupo.cor}08)` : "transparent",
                                      color: itemAtivo ? grupo.cor : "#6a8aaa",
                                      border: itemAtivo ? `1px solid ${grupo.cor}30` : "1px solid transparent",
                                    }}
                                  >
                                    <span>{item.emoji}</span>
                                    <span className="text-sm font-medium">{item.label[lang]}</span>
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
                })}

                {/* Logout mobile */}
                <motion.button
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-4"
                  style={{
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    color: "#f87171",
                  }}
                >
                  <LogOut size={15} />
                  <span className="font-bold text-sm">{lang === "pt" ? "Sair da conta" : lang === "en" ? "Logout" : "Cerrar sesión"}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Espaço fixo para o conteúdo não ficar atrás do nav */}
      <div className="h-16 md:h-16" />
    </>
  );
}