"use client";
// Abas do RH (um módulo só): Painel · Colaboradores · Estrutura. A aba aberta fica marcada; a conversa com a
// Inteligência Axioma (tela "rh") é a mesma nas três.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2 } from "lucide-react";

type Lang = "pt" | "en" | "es";
const ABAS = [
  { rota: "/rh", Icone: LayoutDashboard, nome: { pt: "Painel", en: "Panel", es: "Panel" } },
  { rota: "/rh/colaboradores", Icone: Users, nome: { pt: "Colaboradores", en: "Employees", es: "Colaboradores" } },
  { rota: "/rh/estrutura", Icone: Building2, nome: { pt: "Estrutura e acessos", en: "Structure and access", es: "Estructura y accesos" } },
];
export function NavRh({ lang, temaClaro }: { lang: Lang; temaClaro: boolean }) {
  const aqui = usePathname();
  const ativoCor = temaClaro ? "#0f7a5a" : "#2ecc9b";
  return (
    <nav aria-label="RH" className="flex flex-wrap gap-1" style={{ borderBottom: `1px solid ${temaClaro ? "rgba(16,27,61,0.15)" : "rgba(163,177,194,0.15)"}` }}>
      {ABAS.map(({ rota, Icone, nome }) => {
        const ativo = aqui === rota;
        return (
          <Link key={rota} href={rota} aria-current={ativo ? "page" : undefined}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors"
            style={{ color: ativo ? ativoCor : temaClaro ? "#101b3d" : "var(--axi-text-secondary)", borderBottom: `3px solid ${ativo ? ativoCor : "transparent"}` }}>
            <Icone size={16} aria-hidden /> {nome[lang]}
          </Link>
        );
      })}
    </nav>
  );
}
