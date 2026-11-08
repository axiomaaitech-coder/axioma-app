"use client";
// Caminhos entre as 3 telas do RH (Painel · Colaboradores · Estrutura). A tela aberta fica marcada.
import Link from "next/link";
import { usePathname } from "next/navigation";

type Lang = "pt" | "en" | "es";
const TELAS = [
  { rota: "/rh", nome: { pt: "Painel", en: "Panel", es: "Panel" } },
  { rota: "/rh/colaboradores", nome: { pt: "Colaboradores", en: "Employees", es: "Colaboradores" } },
  { rota: "/rh/estrutura", nome: { pt: "Estrutura", en: "Structure", es: "Estructura" } },
];
export function NavRh({ lang, temaClaro }: { lang: Lang; temaClaro: boolean }) {
  const aqui = usePathname();
  return (
    <nav aria-label="RH" className="flex flex-wrap gap-2">
      {TELAS.map((t) => {
        const ativo = aqui === t.rota;
        return (
          <Link key={t.rota} href={t.rota} aria-current={ativo ? "page" : undefined} className="px-3 py-1.5 rounded-full text-xs font-bold transition-transform hover:-translate-y-0.5"
            style={ativo ? { background: temaClaro ? "#101b3d" : "rgba(46,204,155,0.18)", color: temaClaro ? "#fff" : "#2ecc9b", border: `1px solid ${temaClaro ? "#101b3d" : "rgba(46,204,155,0.4)"}` }
              : { background: "transparent", color: temaClaro ? "#101b3d" : "var(--axi-text-secondary)", border: `1px solid ${temaClaro ? "rgba(16,27,61,0.2)" : "rgba(163,177,194,0.2)"}` }}>
            {t.nome[lang]}{ativo ? "" : " ›"}
          </Link>
        );
      })}
    </nav>
  );
}
