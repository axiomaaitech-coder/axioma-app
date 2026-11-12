"use client";
// RH · Admissões e Desligamentos (pedido do Elias 09/11/2026): lista em ordem alfabética, busca por nome/matrícula/CPF,
// filtros por período, situação no eSocial e motivo, paginada NO BANCO (visão rh_movimentos_v, docs/sql/RH-21) para empresa
// grande. A visão respeita as travas das tabelas: sem liberação de dados pessoais o CPF não aparece nem entra na busca.
// Cada linha abre a ficha da pessoa na parte que resolve.
import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Search, UserPlus, UserMinus } from "lucide-react";
import { RotinaRh, supabaseRh as supabase, linkFicha, type CtxRotina } from "./RotinaRh";
import { CanvasBox } from "../CanvasBox";
import { REGRAS_MOTIVO, type Motivo } from "../../lib/rhRescisao";

type Tipo = "admissoes" | "desligamentos";
type Linha = Record<string, any>;
const POR_PAGINA = 50;
const dataBR = (iso?: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");
const mascaraCpf = (c?: string | null) => { const d = String(c ?? "").replace(/\D/g, ""); return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : c || ""; };
/** Mesma normalização da coluna busca da visão: minúsculas, sem acento; CPF digitado com pontos vira só números. */
export function termoBusca(t: string): string {
  const s = t.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[%_\\]/g, "");
  return /^[\d.\-\s/]+$/.test(s) ? s.replace(/\D/g, "") : s;
}
const SIT_ESOCIAL: Record<string, { pt: string; en: string; es: string }> = {
  rascunho: { pt: "Rascunho", en: "Draft", es: "Borrador" },
  calculado: { pt: "Calculado", en: "Calculated", es: "Calculado" },
  preparado: { pt: "Preparado p/ o contador", en: "Ready for the accountant", es: "Preparado p/ el contador" },
  enviado: { pt: "Enviado", en: "Sent", es: "Enviado" },
  enviado_pelo_contador: { pt: "Enviado pelo contador", en: "Sent by the accountant", es: "Enviado por el contador" },
  aceito: { pt: "Aceito no eSocial", en: "Accepted by eSocial", es: "Aceptado en el eSocial" },
};

function Conteudo({ ctx, tipo }: { ctx: CtxRotina; tipo: Tipo }) {
  const { empresaId, pode, lang, L, cor, campo, cartao, avisar } = ctx;
  const adm = tipo === "admissoes";
  const colData = adm ? "data_admissao" : "data_desligamento";
  const colSit = adm ? "situacao_esocial" : "deslig_situacao";
  const [busca, setBusca] = useState("");
  const [buscaFeita, setBuscaFeita] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [sit, setSit] = useState("");
  const [motivo, setMotivo] = useState("");
  const [pagina, setPagina] = useState(0);
  const [res, setRes] = useState<{ linhas: Linha[]; total: number } | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setBuscaFeita(termoBusca(busca)); setPagina(0); }, 350); return () => clearTimeout(t); }, [busca]);
  useEffect(() => { void (async () => {
    setRes(null); setFalhou(false);
    let q = supabase.from("rh_movimentos_v").select("contrato_id, colaborador_id, nome, situacao, matricula, cpf, cod_categ, data_admissao, experiencia, data_termino, situacao_esocial, admissao_cancelada, data_desligamento, mtv_deslig, deslig_situacao, aviso, dt_aviso", { count: "exact" })
      .eq("empresa_id", empresaId);
    q = adm ? q : q.not("data_desligamento", "is", null);
    if (buscaFeita) q = q.ilike("busca", `%${buscaFeita}%`);
    if (de) q = q.gte(colData, de);
    if (ate) q = q.lte(colData, ate);
    if (sit === "cancelada") q = q.eq("admissao_cancelada", true);
    else if (sit === "sem") q = q.is(colSit, null);
    else if (sit) q = q.eq(colSit, sit);
    if (!adm && motivo) q = q.eq("mtv_deslig", motivo);
    // Tenta de novo antes de avisar (anti-falha): uma conexão que pisca não vira lista vazia calada.
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const { data, error, count } = await q.order("nome").order("contrato_id").range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA - 1);
      if (!error) { setRes({ linhas: (data ?? []) as Linha[], total: count ?? 0 }); return; }
      if (tentativa === 2) { Sentry.captureException(new Error(`rh/${tipo}: ${error.message}`)); setFalhou(true); setRes({ linhas: [], total: 0 }); return; }
      await new Promise((r) => setTimeout(r, 800 * (tentativa + 1)));
    }
  })(); }, [empresaId, adm, buscaFeita, de, ate, sit, motivo, pagina]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrando = !!(buscaFeita || de || ate || sit || motivo);
  const limpar = () => { setBusca(""); setBuscaFeita(""); setDe(""); setAte(""); setSit(""); setMotivo(""); setPagina(0); };
  const paginas = res ? Math.max(1, Math.ceil(res.total / POR_PAGINA)) : 1;
  const nomeSit = (s?: string | null) => (s && SIT_ESOCIAL[s] ? SIT_ESOCIAL[s][lang] : L("Não preparado", "Not prepared", "No preparado"));
  const btnPag = (rotulo: string, alvo: number, ativo: boolean) => (
    <button type="button" disabled={!ativo} onClick={() => { setPagina(alvo); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: ativo ? cor.btnAzul : "#6b7280", color: "#fff", cursor: ativo ? "pointer" : "not-allowed" }}>{rotulo}</button>
  );

  return (<>
    <p className="text-sm" style={{ color: cor.texto2 }}>{adm
      ? L("Todas as admissões da Empresa em ordem alfabética. Toque no nome para abrir a ficha no contrato; o eSocial da admissão (S-2200) é preparado na ficha e enviado pelo contador.", "All company hires in alphabetical order. Tap the name to open the record at the contract; the hire eSocial (S-2200) is prepared in the record and sent by the accountant.", "Todas las admisiones de la empresa en orden alfabético. Toque el nombre para abrir la ficha en el contrato; el eSocial de la admisión (S-2200) se prepara en la ficha y lo envía el contador.")
      : L("Todos os desligamentos em ordem alfabética, com motivo e situação do eSocial (S-2299). Toque no nome para abrir a rescisão na ficha. Motivo e rescisão só aparecem para quem tem liberação de dados pessoais e salário.", "All terminations in alphabetical order, with reason and eSocial status (S-2299). Tap the name to open the severance in the record. Reason and severance only show for users with personal data and salary access.", "Todas las desvinculaciones en orden alfabético, con motivo y situación del eSocial (S-2299). Toque el nombre para abrir la rescisión en la ficha. Motivo y rescisión solo aparecen para quien tiene habilitación de datos personales y salario.")}</p>

    <CanvasBox cor={cor.verde} {...cartao}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <label className="lg:col-span-2 text-xs font-bold" style={{ color: cor.titulo }}>{L("Buscar", "Search", "Buscar")}
          <span className="mt-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={campo}><Search size={14} aria-hidden />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={pode.pessoais ? L("Nome, matrícula ou CPF", "Name, ID or CPF", "Nombre, matrícula o CPF") : L("Nome ou matrícula", "Name or ID", "Nombre o matrícula")} className="flex-1 bg-transparent outline-none text-sm font-normal" /></span></label>
        <label className="text-xs font-bold" style={{ color: cor.titulo }}>{adm ? L("Admitidos de", "Hired from", "Admitidos desde") : L("Desligados de", "Terminated from", "Desvinculados desde")}
          <input type="date" value={de} onChange={(e) => { setDe(e.target.value); setPagina(0); }} className="mt-1 w-full px-3 py-2 rounded-xl text-sm font-normal" style={campo} /></label>
        <label className="text-xs font-bold" style={{ color: cor.titulo }}>{L("até", "to", "hasta")}
          <input type="date" value={ate} min={de || undefined} onChange={(e) => { setAte(e.target.value); setPagina(0); }} className="mt-1 w-full px-3 py-2 rounded-xl text-sm font-normal" style={campo} /></label>
        <label className="text-xs font-bold" style={{ color: cor.titulo }}>{L("Situação no eSocial", "eSocial status", "Situación en el eSocial")}
          <select value={sit} onChange={(e) => { setSit(e.target.value); setPagina(0); }} className="mt-1 w-full px-3 py-2 rounded-xl text-sm font-normal" style={campo}>
            <option value="">{L("Todas", "All", "Todas")}</option>
            <option value="sem">{L("Não preparado", "Not prepared", "No preparado")}</option>
            {Object.entries(SIT_ESOCIAL).filter(([k]) => adm ? k !== "calculado" : k !== "rascunho").map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
            {adm && <option value="cancelada">{L("Admissão cancelada", "Hire cancelled", "Admisión cancelada")}</option>}
          </select></label>
        {!adm && <label className="sm:col-span-2 lg:col-span-5 text-xs font-bold" style={{ color: cor.titulo }}>{L("Motivo", "Reason", "Motivo")}
          <select value={motivo} onChange={(e) => { setMotivo(e.target.value); setPagina(0); }} className="mt-1 w-full px-3 py-2 rounded-xl text-sm font-normal" style={campo}>
            <option value="">{L("Todos", "All", "Todos")}</option>
            {(Object.keys(REGRAS_MOTIVO) as Motivo[]).map((m) => <option key={m} value={m}>{m} · {REGRAS_MOTIVO[m].nome}</option>)}
          </select></label>}
      </div>
      {filtrando && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: cor.texto2 }}>
        {L("Filtro ligado.", "Filter on.", "Filtro activo.")}
        <button type="button" onClick={limpar} className="px-3 py-1.5 rounded-lg font-bold" style={{ background: cor.btnMenta, color: "#fff" }}>{L("Limpar filtro", "Clear filter", "Limpiar filtro")}</button>
      </div>}
    </CanvasBox>

    <CanvasBox cor={cor.verde} {...cartao}>
      <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: cor.titulo }}>
        {adm ? <UserPlus size={16} /> : <UserMinus size={16} />} {adm ? L("Admissões", "Hires", "Admisiones") : L("Desligamentos", "Terminations", "Desvinculaciones")}
        {res && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(128,128,128,0.15)" }}>{res.total}</span>}
      </p>
      {!res ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        : falhou ? <p className="text-sm" style={{ color: cor.laranja }}>{L("Não foi possível ler a lista agora (tentamos 3 vezes). Recarregue a página.", "Could not read the list now (tried 3 times). Reload the page.", "No se pudo leer la lista ahora (intentamos 3 veces). Recargue la página.")}</p>
        : res.linhas.length === 0 ? <p className="text-sm" style={{ color: cor.texto2 }}>{filtrando
          ? L("Nada encontrado com este filtro.", "Nothing found with this filter.", "Nada encontrado con este filtro.")
          : adm ? <>{L("Nenhuma admissão ainda.", "No hires yet.", "Ninguna admisión todavía.")} <Link href="/rh/colaboradores" className="underline font-bold">{L("Cadastrar colaborador ›", "Add employee ›", "Registrar colaborador ›")}</Link></>
          : L("Nenhum desligamento registrado.", "No terminations recorded.", "Ninguna desvinculación registrada.")}</p>
        : (
          <ul className="space-y-2">{res.linhas.map((k) => (
            <li key={k.contrato_id} className="rounded-xl p-3 axi-card-faixa" style={{ border: `1px solid ${cor.borda}`, background: cor.aninhado }}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm" style={{ color: "var(--axi-text-primary)" }}>
                <Link href={linkFicha(k.colaborador_id, adm ? "contrato" : "desligamento")} className="font-bold underline">{k.nome} ›</Link>
                <span style={{ color: cor.texto2 }}>· {k.matricula || L("sem matrícula", "no ID", "sin matrícula")}{k.cpf ? ` · CPF ${mascaraCpf(k.cpf)}` : ""}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: cor.texto2 }}>
                <span>{L("admissão", "hire", "admisión")} <b style={{ color: cor.titulo }}>{dataBR(k.data_admissao)}</b></span>
                {adm && k.experiencia && <span>{L("experiência até", "probation until", "experiencia hasta")} {dataBR(k.data_termino)}</span>}
                {!adm && <span>{L("desligamento", "termination", "desvinculación")} <b style={{ color: cor.titulo }}>{dataBR(k.data_desligamento)}</b></span>}
                {!adm && k.mtv_deslig && <span>{L("motivo", "reason", "motivo")} {k.mtv_deslig} · {REGRAS_MOTIVO[k.mtv_deslig as Motivo]?.nome ?? ""}</span>}
                {k.admissao_cancelada
                  ? <b style={{ color: cor.laranja }}>{L("Admissão cancelada (S-3000 na Central do eSocial)", "Hire cancelled (S-3000 in the eSocial center)", "Admisión cancelada (S-3000 en la Central del eSocial)")}</b>
                  : <span>eSocial: <b style={{ color: ["aceito", "enviado_pelo_contador", "enviado"].includes(k[colSit]) ? cor.verde : cor.laranja }}>{nomeSit(k[colSit])}</b></span>}
              </div>
            </li>))}</ul>
        )}
      {res && res.total > POR_PAGINA && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: cor.texto2 }}>
        {btnPag(L("‹ Anterior", "‹ Previous", "‹ Anterior"), pagina - 1, pagina > 0)}
        <span>{L(`Página ${pagina + 1} de ${paginas}`, `Page ${pagina + 1} of ${paginas}`, `Página ${pagina + 1} de ${paginas}`)}</span>
        {btnPag(L("Próxima ›", "Next ›", "Siguiente ›"), pagina + 1, pagina + 1 < paginas)}
      </div>}
    </CanvasBox>
  </>);
}

export function MovimentosRh({ tipo }: { tipo: Tipo }) {
  const adm = tipo === "admissoes";
  return (
    <RotinaRh titulo={adm ? { pt: "Admissões", en: "Hires", es: "Admisiones" } : { pt: "Desligamentos", en: "Terminations", es: "Desvinculaciones" }}
      subtitulo={adm ? { pt: "Todas as admissões: busca, filtros e situação no eSocial", en: "All hires: search, filters and eSocial status", es: "Todas las admisiones: búsqueda, filtros y situación en el eSocial" }
        : { pt: "Todos os desligamentos: motivo, rescisão e situação no eSocial", en: "All terminations: reason, severance and eSocial status", es: "Todas las desvinculaciones: motivo, rescisión y situación en el eSocial" }}
      letreiro={(c) => adm
        ? [c.L("Admissão no eSocial até o dia anterior ao início (S-2200)", "Hire in eSocial by the day before start (S-2200)", "Admisión en el eSocial hasta el día anterior al inicio (S-2200)"), c.L("Busca por nome, matrícula ou CPF", "Search by name, ID or CPF", "Búsqueda por nombre, matrícula o CPF")]
        : [c.L("Desligamento no eSocial até 10 dias (S-2299)", "Termination in eSocial within 10 days (S-2299)", "Desvinculación en el eSocial hasta 10 días (S-2299)"), c.L("Pagamento da rescisão em até 10 dias (CLT art. 477 § 6º)", "Severance paid within 10 days (CLT art. 477 § 6)", "Pago de la rescisión en hasta 10 días (CLT art. 477 § 6)")]}>
      {(ctx) => <Conteudo ctx={ctx} tipo={tipo} />}
    </RotinaRh>
  );
}
