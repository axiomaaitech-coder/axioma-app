"use client";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage, SeletorIdioma } from "../lib/LanguageContext";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const grupos = [
  {
    label: "💰 Financeiro",
    cor: "#3b6fd4",
    corBg: "rgba(59,111,212,0.08)",
    itens: [
      { label: "Receitas", path: "/receitas", emoji: "💵" },
      { label: "Custos Fixos", path: "/custos-fixos", emoji: "📌" },
      { label: "Custos Variáveis", path: "/custos-variaveis", emoji: "📊" },
      { label: "Fluxo de Caixa", path: "/fluxo-caixa", emoji: "💧" },
      { label: "DRE", path: "/dre", emoji: "📈" },
      { label: "Endividamento", path: "/endividamento", emoji: "⚖️" },
    ]
  },
  {
    label: "📈 Crescimento",
    cor: "#34d399",
    corBg: "rgba(52,211,153,0.08)",
    itens: [
      { label: "Metas", path: "/metas", emoji: "🎯" },
      { label: "Investimentos", path: "/investimentos", emoji: "💎" },
      { label: "Simulações", path: "/simulacoes", emoji: "🔮" },
      { label: "Precificação", path: "/precificacao", emoji: "🏷️" },
    ]
  },
  {
    label: "👥 Comercial",
    cor: "#f59e0b",
    corBg: "rgba(245,158,11,0.08)",
    itens: [
      { label: "Clientes", path: "/clientes", emoji: "🤝" },
      { label: "Fornecedores", path: "/fornecedores", emoji: "🏭" },
      { label: "Contas a Receber", path: "/contas-receber", emoji: "📥" },
      { label: "Inadimplência", path: "/inadimplencia", emoji: "⚠️" },
    ]
  },
  {
    label: "🏢 Gestão",
    cor: "#a78bfa",
    corBg: "rgba(167,139,250,0.08)",
    itens: [
      { label: "Centros de Custo", path: "/centros-custo", emoji: "🗂️" },
      { label: "Importar Documentos", path: "/importar-documentos", emoji: "📂" },
      { label: "Relatórios", path: "/relatorios", emoji: "📋" },
    ]
  },
  {
    label: "🤖 IA Premium",
    cor: "#f472b6",
    corBg: "rgba(244,114,182,0.08)",
    itens: [
      { label: "IA Financeira", path: "/ia-financeira", emoji: "🧠" },
      { label: "IA Tributária", path: "/ia-tributaria", emoji: "⭐" },
    ]
  },
  {
    label: "⚙️ Configurações",
    cor: "#6ab0ff",
    corBg: "rgba(106,176,255,0.08)",
    itens: [
      { label: "Empresa", path: "/empresa", emoji: "🏛️" },
      { label: "Planos", path: "/planos", emoji: "🚀" },
    ]
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [abertos, setAbertos] = useState<string[]>(["💰 Financeiro"]);

  const toggleGrupo = (label: string) => {
    setAbertos(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const grupoAtivo = (itens: { path: string }[]) =>
    itens.some(i => pathname === i.path);

  return (
    <div className="w-64 min-h-screen flex flex-col flex-shrink-0" style={{
      background: "linear-gradient(180deg, #060f1e 0%, #020810 100%)",
      borderRight: "1px solid rgba(59,111,212,0.2)",
      boxShadow: "4px 0 24px rgba(0,0,0,0.4)"
    }}>

      {/* Logo */}
      <div className="flex flex-col items-center py-6 px-4 border-b" style={{ borderColor: "rgba(59,111,212,0.15)" }}>
        <div style={{ filter: "drop-shadow(0 0 30px rgba(106,176,255,0.6))" }}>
          <Image src="/logo-aitech.png" alt="Axioma" width={72} height={72} className="object-contain" />
        </div>
        <h1 className="text-base font-black tracking-[0.3em] mt-3" style={{
          background: "linear-gradient(135deg, #c8d8f0 0%, #6ab0ff 40%, #ffffff 60%, #3b6fd4 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>AXIOMA</h1>
        <p className="text-xs tracking-[0.4em] mt-0.5 font-semibold" style={{ color: "#3a5a8a" }}>AI.TECH</p>
        <div className="mt-2 px-3 py-0.5 rounded-full" style={{
          background: "rgba(59,111,212,0.1)",
          border: "1px solid rgba(59,111,212,0.2)"
        }}>
          <p className="text-xs" style={{ color: "#3b6fd4" }}>Inteligência Financeira</p>
        </div>
      </div>

      {/* Seletor de idioma */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(59,111,212,0.15)" }}>
        <SeletorIdioma />
      </div>

      {/* Dashboard fixo */}
      <div className="px-4 pt-4">
        <div
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
          style={{
            background: pathname === "/dashboard"
              ? "linear-gradient(135deg, rgba(59,111,212,0.3), rgba(42,95,212,0.15))"
              : "rgba(59,111,212,0.05)",
            border: pathname === "/dashboard"
              ? "1px solid rgba(106,176,255,0.4)"
              : "1px solid rgba(59,111,212,0.1)",
            boxShadow: pathname === "/dashboard" ? "0 0 20px rgba(59,111,212,0.2)" : "none",
            color: pathname === "/dashboard" ? "#6ab0ff" : "#3a5a8a",
          }}
        >
          <span className="text-base">🏠</span>
          <span className="text-sm font-bold tracking-wide">Dashboard</span>
          {pathname === "/dashboard" && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#6ab0ff" }} />
          )}
        </div>
      </div>

      {/* Grupos recolhíveis */}
      <nav className="flex-1 px-4 pt-3 pb-4 space-y-1.5 overflow-auto">
        {grupos.map((grupo) => {
          const aberto = abertos.includes(grupo.label);
          const ativo = grupoAtivo(grupo.itens);

          return (
            <div key={grupo.label}>
              {/* Cabeçalho do grupo */}
              <div
                onClick={() => toggleGrupo(grupo.label)}
                className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all"
                style={{
                  background: ativo ? grupo.corBg : "transparent",
                  border: ativo ? `1px solid ${grupo.cor}30` : "1px solid transparent",
                  color: ativo ? grupo.cor : "#4a6a8a",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full" style={{
                    background: aberto ? grupo.cor : "rgba(59,111,212,0.2)"
                  }} />
                  <span className="text-xs font-bold tracking-wider uppercase">{grupo.label}</span>
                </div>
                {aberto
                  ? <ChevronDown size={13} style={{ color: grupo.cor }} />
                  : <ChevronRight size={13} style={{ color: "#4a6a8a" }} />
                }
              </div>

              {/* Itens */}
              {aberto && (
                <div className="ml-4 mt-1 space-y-0.5 mb-1 border-l-2 pl-3" style={{ borderColor: `${grupo.cor}40` }}>
                  {grupo.itens.map((item) => {
                    const itemAtivo = pathname === item.path;
                    return (
                      <div
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all"
                        style={{
                          background: itemAtivo
                            ? `linear-gradient(135deg, ${grupo.cor}25, ${grupo.cor}10)`
                            : "transparent",
                          border: itemAtivo ? `1px solid ${grupo.cor}40` : "1px solid transparent",
                          color: itemAtivo ? grupo.cor : "#3a5a8a",
                          boxShadow: itemAtivo ? `0 0 12px ${grupo.cor}15` : "none",
                        }}
                      >
                        <span className="text-sm">{item.emoji}</span>
                        <span className="text-xs font-medium">{item.label}</span>
                        {itemAtivo && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: grupo.cor }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Badge Premium */}
      <div className="p-4 border-t" style={{ borderColor: "rgba(59,111,212,0.15)" }}>
        <div
          className="rounded-xl p-3 text-center cursor-pointer transition-all hover:scale-105"
          onClick={() => router.push("/ia-tributaria")}
          style={{
            background: "linear-gradient(135deg, rgba(234,179,8,0.12), rgba(249,115,22,0.12))",
            border: "1px solid rgba(234,179,8,0.35)",
            boxShadow: "0 0 20px rgba(234,179,8,0.1)",
          }}
        >
          <p className="text-xs font-black tracking-wider" style={{ color: "#fbbf24" }}>⭐ IA TRIBUTÁRIA</p>
          <p className="text-xs mt-1 font-medium" style={{ color: "#f97316" }}>Reduza seus impostos com IA</p>
          <div className="mt-2 px-2 py-0.5 rounded-full mx-auto inline-block" style={{
            background: "linear-gradient(135deg, #ca8a04, #ea580c)",
          }}>
            <p className="text-xs font-black text-white">PREMIUM</p>
          </div>
        </div>
      </div>

    </div>
  );
}