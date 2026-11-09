"use client";
// Abas do RH (um módulo só): Painel · Colaboradores · Estrutura, e embaixo as rotinas do dia a dia (cada alerta do Painel
// leva a uma delas). A aba aberta fica marcada; a conversa com a Inteligência Axioma (tela "rh") é a mesma em todas.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, Stethoscope, FileCheck2, CalendarClock, Send, Scale } from "lucide-react";

type Lang = "pt" | "en" | "es";
const ABAS = [
  { rota: "/rh", Icone: LayoutDashboard, nome: { pt: "Painel", en: "Panel", es: "Panel" } },
  { rota: "/rh/colaboradores", Icone: Users, nome: { pt: "Colaboradores", en: "Employees", es: "Colaboradores" } },
  { rota: "/rh/estrutura", Icone: Building2, nome: { pt: "Estrutura e acessos", en: "Structure and access", es: "Estructura y accesos" } },
];
const ROTINAS = [
  { rota: "/rh/exames", Icone: Stethoscope, nome: { pt: "Exames", en: "Exams", es: "Exámenes" } },
  { rota: "/rh/documentos", Icone: FileCheck2, nome: { pt: "Documentos", en: "Documents", es: "Documentos" } },
  { rota: "/rh/contratos", Icone: CalendarClock, nome: { pt: "Contratos a vencer", en: "Expiring contracts", es: "Contratos por vencer" } },
  { rota: "/rh/esocial", Icone: Send, nome: { pt: "Central do eSocial", en: "eSocial center", es: "Central del eSocial" } },
  { rota: "/rh/obrigacoes", Icone: Scale, nome: { pt: "Obrigações da empresa", en: "Company obligations", es: "Obligaciones de la empresa" } },
];
// Tocar na aba em que já está: com filtro ou ficha aberta pelo endereço, volta à tela limpa; sem nada, sobe ao topo (nunca "não acontece nada").
const voltarAoTopo = (rota: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  if (window.location.search || window.location.hash) window.location.assign(rota);
  else window.scrollTo({ top: 0, behavior: "smooth" });
};
export function NavRh({ lang, temaClaro }: { lang: Lang; temaClaro: boolean }) {
  const aqui = usePathname();
  const ativoCor = temaClaro ? "#0f7a5a" : "#2ecc9b";
  const linha = temaClaro ? "rgba(16,27,61,0.15)" : "rgba(163,177,194,0.15)";
  return (
    <div className="space-y-2">
      <nav aria-label="RH" className="flex flex-wrap gap-1" style={{ borderBottom: `1px solid ${linha}` }}>
        {ABAS.map(({ rota, Icone, nome }) => {
          const ativo = aqui === rota;
          return (
            <Link key={rota} href={rota} aria-current={ativo ? "page" : undefined} onClick={ativo ? voltarAoTopo(rota) : undefined}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors"
              style={{ color: ativo ? ativoCor : temaClaro ? "#101b3d" : "var(--axi-text-secondary)", borderBottom: `3px solid ${ativo ? ativoCor : "transparent"}` }}>
              <Icone size={16} aria-hidden /> {nome[lang]}
            </Link>
          );
        })}
      </nav>
      <nav aria-label={lang === "en" ? "HR routines" : lang === "es" ? "Rutinas de RR. HH." : "Rotinas do RH"} className="flex flex-wrap gap-1.5">
        {ROTINAS.map(({ rota, Icone, nome }) => {
          const ativo = aqui === rota;
          return (
            <Link key={rota} href={rota} aria-current={ativo ? "page" : undefined} onClick={ativo ? voltarAoTopo(rota) : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap axi-card-faixa"
              style={ativo ? { background: temaClaro ? "#101b3d" : "linear-gradient(135deg, #0a4f3b, #0f7d5c)", color: "#fff" }
                : { background: temaClaro ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.05)", color: temaClaro ? "#101b3d" : "var(--axi-text-primary)", border: `1px solid ${linha}` }}>
              <Icone size={14} aria-hidden /> {nome[lang]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
