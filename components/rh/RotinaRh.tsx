"use client";
// Moldura comum das rotinas do RH (Exames, Documentos, Contratos a vencer, eSocial, Obrigações): mesmo cabeçalho, menu,
// tema Claro/Escuro, idioma, letreiro e checagem de acesso (rh_pode). Cada tela só escreve o conteúdo dela.
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import ModuloLayout from "../ModuloLayout";
import { CanvasBox } from "../CanvasBox";
import AvisoAxioma from "../AvisoAxioma";
import { ThemeToggle } from "../ThemeToggle";
import { LetreiroAxioma } from "../LetreiroAxioma";
import { NavRh } from "../NavRh";
import { useLanguage } from "../../lib/LanguageContext";
import { useThemeAxioma } from "../../lib/ThemeContext";
import { createBrowserClient } from "../../lib/supabaseBrowser";
import { obterEmpresaAtiva } from "../../lib/empresaHelpers";
import type { Lang } from "../../lib/rhEstrutura";

export const supabaseRh = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export type PodeRh = { ver: boolean; editar: boolean; pessoais: boolean; salario: boolean; saude: boolean; carregado: boolean };
export type CtxRotina = {
  empresaId: string; pode: PodeRh; lang: Lang; L: (pt: string, en: string, es: string) => string; temaClaro: boolean
  avisar: (m: string, t?: "erro" | "ok") => void
  cor: { verde: string; navy: string; texto2: string; borda: string; aninhado: string; laranja: string; btnMenta: string; btnAzul: string; titulo: string }
  campo: CSSProperties; cartao: { fundo?: string; premium3d: boolean }
}
/** Link para a ficha da pessoa já na parte que resolve (contrato, exames → documentos, salario, esocial, desligamento…). */
export const linkFicha = (colaboradorId: string, secao = "contrato") => `/rh/colaboradores?abrir=${colaboradorId}&secao=${secao}`

export function RotinaRh({ titulo, subtitulo, letreiro, exigir = [], children }: {
  titulo: { pt: string; en: string; es: string }; subtitulo: { pt: string; en: string; es: string }
  letreiro?: (ctx: CtxRotina) => string[]; exigir?: ("pessoais" | "salario" | "saude")[]
  children: (ctx: CtxRotina) => ReactNode
}) {
  const { idioma } = useLanguage();
  const lang = ((idioma as Lang) || "pt") as Lang;
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const { tema } = useThemeAxioma();
  const temaClaro = tema === "xms";
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [pode, setPode] = useState<PodeRh>({ ver: false, editar: false, pessoais: false, salario: false, saude: false, carregado: false });
  const [aviso, setAviso] = useState<{ msg: string; tipo: "erro" | "ok" } | null>(null);
  const avisar = (msg: string, tipo: "erro" | "ok" = "erro") => { setAviso({ msg, tipo }); setTimeout(() => setAviso(null), 5000); };
  useEffect(() => { void (async () => {
    const eid = await obterEmpresaAtiva();
    if (!eid) { setPode((p) => ({ ...p, carregado: true })); return; }
    const acoes = ["ver", "editar", "pessoais", "salario", "saude"];
    const r = await Promise.all(acoes.map((a) => supabaseRh.rpc("rh_pode", { p_empresa: eid, p_acao: a })));
    setEmpresaId(eid);
    setPode({ ver: !!r[0].data, editar: !!r[1].data, pessoais: !!r[2].data, salario: !!r[3].data, saude: !!r[4].data, carregado: true });
  })(); }, []);
  const cor = {
    verde: temaClaro ? "#0f7a5a" : "#2ecc9b", navy: "#101b3d", texto2: temaClaro ? "#374151" : "var(--axi-text-secondary)",
    borda: temaClaro ? "rgba(16,27,61,0.12)" : "rgba(163,177,194,0.15)", aninhado: temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)",
    laranja: temaClaro ? "#9a3412" : "#fbbf24", btnMenta: "linear-gradient(135deg, #0b5f46, #0f7a5a)", btnAzul: "linear-gradient(135deg, #0a1628, #101b3d)",
    titulo: temaClaro ? "#101b3d" : "var(--axi-text-primary)",
  };
  const campo: CSSProperties = { background: temaClaro ? "#ffffff" : "rgba(10,22,40,0.9)", border: `1px solid ${cor.borda}`, color: "var(--axi-text-primary)" };
  const cartao = temaClaro ? { fundo: "#f6f7c4", premium3d: true } : { premium3d: true };
  const ctx: CtxRotina | null = empresaId ? { empresaId, pode, lang, L, temaClaro, avisar, cor, campo, cartao } : null;
  const falta = exigir.filter((e) => !pode[e]);
  return (
    <div data-theme={tema} style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <ModuloLayout titulo={L("RH", "HR", "RR. HH.")} subtitulo={L(subtitulo.pt, subtitulo.en, subtitulo.es)}
        headerFundo={temaClaro ? "linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)" : undefined} botaoExtra={<ThemeToggle />}>
        <div className="space-y-4">
          <NavRh lang={lang} temaClaro={temaClaro} />
          <h2 className="text-lg font-black" style={{ color: cor.titulo }}>{L(titulo.pt, titulo.en, titulo.es)}</h2>
          {!pode.carregado || !ctx ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : !pode.ver || falta.length ? (
            <CanvasBox cor={cor.verde} {...cartao}>
              <div className="flex items-start gap-3 py-2"><ShieldCheck size={20} style={{ color: cor.verde, flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--axi-text-primary)" }}>{!pode.ver
                  ? L("Você não tem acesso ao RH desta Empresa. Peça ao Proprietário, CEO, Sócio ou Admin para liberar em RH · Estrutura e acessos → Acessos do RH.", "You do not have access to HR for this company. Ask the Owner, CEO, Partner or Admin to grant it in HR · Structure and access → HR access.", "No tiene acceso a RR. HH. de esta empresa. Pida al Propietario, CEO, Socio o Admin que lo habilite en RR. HH. · Estructura y accesos → Accesos de RR. HH.")
                  : L(`Esta tela precisa da liberação de ${falta.map((f) => ({ pessoais: "dados pessoais", salario: "salário", saude: "saúde" })[f]).join(" e ")}. Peça em RH · Estrutura e acessos → Acessos do RH.`, `This screen needs ${falta.map((f) => ({ pessoais: "personal data", salario: "salary", saude: "health" })[f]).join(" and ")} access. Ask in HR · Structure and access → HR access.`, `Esta pantalla necesita habilitación de ${falta.map((f) => ({ pessoais: "datos personales", salario: "salario", saude: "salud" })[f]).join(" y ")}. Pídala en RR. HH. · Estructura y accesos → Accesos de RR. HH.`)}</p>
              </div>
            </CanvasBox>
          ) : (<>
            {letreiro && <LetreiroAxioma id={`rh-rotina-${titulo.pt}`} cor="#101b3d" itens={letreiro(ctx)} />}
            {children(ctx)}
          </>)}
        </div>
        <AvisoAxioma aviso={aviso} onFechar={() => setAviso(null)} />
      </ModuloLayout>
    </div>
  );
}
