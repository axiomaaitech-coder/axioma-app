"use client";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage, SeletorIdioma } from "../lib/LanguageContext";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const itens = [
    { label: t.nav.dashboard, path: "/dashboard" },
    { label: t.nav.receitas, path: "/receitas" },
    { label: t.nav.custosFixos, path: "/custos-fixos" },
    { label: t.nav.custosVariaveis, path: "/custos-variaveis" },
    { label: t.nav.fornecedores, path: "/fornecedores" },
    { label: t.nav.endividamento, path: "/endividamento" },
    { label: t.nav.fluxoCaixa, path: "/fluxo-caixa" },
    { label: t.nav.centrosCusto, path: "/centros-custo" },
    { label: "📄 " + t.nav.importar, path: "/importar" },
    { label: t.nav.iaFinanceira, path: "/ia-financeira" },
    { label: t.nav.iaTributaria, path: "/ia-tributaria" },
    { label: t.nav.empresa, path: "/empresa" },
    { label: t.nav.relatorios, path: "/relatorios" },
  ];

  return (
    <div className="w-64 min-h-screen flex flex-col flex-shrink-0" style={{background: "rgba(10,22,40,0.95)", borderRight: "1px solid rgba(59,111,212,0.15)"}}>

      {/* Logo */}
      <div className="flex flex-col items-center py-6 px-4 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
        <div style={{filter: "drop-shadow(0 0 24px rgba(106,176,255,0.5))"}}>
          <Image src="/logo-aitech.png" alt="Axioma" width={80} height={80} className="object-contain"/>
        </div>
        <h1 className="text-base font-black tracking-widest mt-2" style={{background: "linear-gradient(135deg, #6ab0ff, #ffffff, #3b6fd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>AXIOMA</h1>
        <p className="text-xs tracking-widest" style={{color: "#3a5a8a"}}>AI.TECH</p>
      </div>

      {/* Seletor de idioma */}
      <div className="px-4 py-3 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
        <SeletorIdioma/>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {itens.map((item) => (
          <div key={item.path} onClick={() => router.push(item.path)} className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all" style={{background: pathname === item.path ? "rgba(59,111,212,0.15)" : "transparent", color: pathname === item.path ? "#6ab0ff" : "#3a5a8a"}}>
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Badge Premium */}
      <div className="p-4">
        <div className="rounded-xl p-3 text-center cursor-pointer" onClick={() => router.push("/ia-tributaria")} style={{background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(59,111,212,0.15))", border: "1px solid rgba(167,139,250,0.3)"}}>
          <p className="text-xs font-bold" style={{color: "#a78bfa"}}>{t.nav.iaTributariaPremium}</p>
          <p className="text-xs mt-1" style={{color: "#3a5a8a"}}>{t.nav.pagarMenos}</p>
        </div>
      </div>
    </div>
  );
}