"use client";
// RH · Exames ocupacionais (auditoria 09/11/2026: o botão "Marcar o exame" do Radar não tinha destino).
// Quem precisa de exame admissional (NR-7: antes de assumir as atividades), agenda com data/hora/clínica, convocação pronta
// para copiar e registro do resultado. Dado de saúde: só com a liberação de saúde. Os mesmos itens da ficha (rh_admissao_itens).
import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Stethoscope, CalendarPlus, ClipboardCheck, Copy } from "lucide-react";
import { RotinaRh, supabaseRh as supabase, linkFicha, type CtxRotina } from "../../../../components/rh/RotinaRh";
import { CanvasBox } from "../../../../components/CanvasBox";
import { BotaoAcao } from "../../../../components/BotaoAcao";
import { hojeISO } from "../../../../lib/datas";
import { lerTodas } from "../../../../lib/lerTodas";
import { ITENS_ADMISSAO } from "../../../../lib/rhDocumentos";
import { mensagemErroRh } from "../../../../lib/rhEstrutura";

type Linha = Record<string, any>;
const dataBR = (iso?: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const horaBR = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const EXAMES = ITENS_ADMISSAO.filter((i) => i.categoria === "exame");

function Conteudo({ ctx }: { ctx: CtxRotina }) {
  const { empresaId, pode, lang, L, cor, campo, cartao, avisar } = ctx;
  const [gente, setGente] = useState<Linha[] | null>(null);
  const [form, setForm] = useState<Record<string, Linha>>({});   // por pessoa: { modo: 'agendar'|'resultado', tipo, quando, clinica, data, resultado, validade }
  async function carregar() {
    const ler = (t: string, cols: string, lixeira: boolean) => lerTodas(() => { const q = supabase.from(t).select(cols).eq("empresa_id", empresaId); return (lixeira ? q.is("excluido_em", null) : q).order("id"); });
    const [cs, ks, its] = await Promise.all([
      ler("rh_colaboradores", "id, nome, nome_social, situacao", true),
      ler("rh_contratos", "id, colaborador_id, data_admissao, data_desligamento", false),
      ler("rh_admissao_itens", "id, colaborador_id, tipo, categoria, situacao, data_item, validade, resultado, agendado_para, clinica", false),
    ]);
    const falha = [cs, ks, its].find((x) => x.error);
    if (falha?.error) { avisar(L("Não foi possível ler os exames agora. Recarregue a página.", "Could not read the exams now. Reload the page.", "No se pudieron leer los exámenes ahora. Recargue la página.")); Sentry.captureException(new Error(`rh/exames: ${falha.error.message}`)); setGente([]); return; }
    const k = new Map<string, Linha>(); [...(ks.data as Linha[])].sort((a, b) => String(b.data_admissao).localeCompare(String(a.data_admissao))).forEach((x) => { if (!k.has(x.colaborador_id)) k.set(x.colaborador_id, x); });
    const it = new Map<string, Linha[]>(); (its.data as Linha[]).filter((x) => x.categoria === "exame").forEach((x) => { const l = it.get(x.colaborador_id) ?? []; l.push(x); it.set(x.colaborador_id, l); });
    setGente((cs.data as Linha[]).filter((c) => c.situacao !== "desligado").map((c): Linha => ({ ...c, contrato: k.get(c.id) ?? null, exames: it.get(c.id) ?? [] }))
      .sort((a, b) => String(a.nome_social || a.nome).localeCompare(String(b.nome_social || b.nome), "pt-BR")));
  }
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const aso = (p: Linha) => (p.exames as Linha[]).find((x) => x.tipo === "aso_admissional");
  const hoje = hojeISO();
  const grupos = !gente ? null : {
    atrasados: gente.filter((p) => p.situacao !== "pre_admissao" && p.contrato && p.contrato.data_admissao <= hoje && !["entregue", "dispensado"].includes(aso(p)?.situacao ?? "pendente") && aso(p)?.situacao !== "agendado"),
    agendar: gente.filter((p) => (p.situacao === "pre_admissao" || (p.contrato && p.contrato.data_admissao > hoje)) && (aso(p)?.situacao ?? "pendente") === "pendente"),
    agendados: gente.filter((p) => (p.exames as Linha[]).some((x) => x.situacao === "agendado")),
    feitos: gente.filter((p) => ["entregue", "dispensado"].includes(aso(p)?.situacao ?? "")),
  };

  async function gravar(p: Linha, f: Linha): Promise<boolean> {
    const tipo = f.tipo || "aso_admissional";
    let linha: Linha;
    if (f.modo === "agendar") {
      if (!f.quando) { avisar(L("Informe a data e a hora do exame.", "Enter the exam date and time.", "Informe la fecha y hora del examen.")); return false; }
      linha = { situacao: "agendado", agendado_para: new Date(f.quando).toISOString(), clinica: String(f.clinica ?? "").trim() || null };
    } else {
      if (!f.data) { avisar(L("Informe a data em que o exame foi feito.", "Enter the date the exam was done.", "Informe la fecha en que se hizo el examen.")); return false; }
      if (tipo === "aso_admissional" && !f.resultado) { avisar(L("Informe o resultado do ASO (apto, inapto ou apto com restrição).", "Enter the ASO result (fit, unfit or fit with restriction).", "Informe el resultado del ASO (apto, no apto o apto con restricción).")); return false; }
      linha = { situacao: "entregue", data_item: f.data, validade: f.validade || null, resultado: tipo === "aso_admissional" ? f.resultado : null };
    }
    const { error } = await supabase.from("rh_admissao_itens").upsert({ empresa_id: empresaId, colaborador_id: p.id, categoria: "exame", tipo, ...linha }, { onConflict: "colaborador_id,tipo" });
    if (error) { avisar(mensagemErroRh(error, lang)); return false; }
    avisar(f.modo === "agendar" ? L("Exame agendado. Copie a convocação e envie à pessoa.", "Exam scheduled. Copy the notice and send it to the person.", "Examen agendado. Copie la convocatoria y envíela a la persona.") : L("Resultado registrado. Anexe o ASO na ficha da pessoa.", "Result recorded. Attach the ASO on the person's record.", "Resultado registrado. Adjunte el ASO en la ficha de la persona."), "ok");
    setForm((x) => { const n = { ...x }; delete n[p.id]; return n; });
    await carregar(); return true;
  }
  function convocacao(p: Linha, x: Linha) {
    const nomeExame = EXAMES.find((e) => e.tipo === x.tipo)?.nome[lang] ?? x.tipo;
    const txt = L(`Olá, ${p.nome_social || p.nome}! Seu ${nomeExame} está agendado para ${horaBR(x.agendado_para)}${x.clinica ? ` na ${x.clinica}` : ""}. Leve um documento com foto. O exame é custeado pela empresa (NR-7).`,
      `Hello, ${p.nome_social || p.nome}! Your ${nomeExame} is scheduled for ${horaBR(x.agendado_para)}${x.clinica ? ` at ${x.clinica}` : ""}. Bring a photo ID. The exam is paid by the company (NR-7).`,
      `¡Hola, ${p.nome_social || p.nome}! Su ${nomeExame} está agendado para ${horaBR(x.agendado_para)}${x.clinica ? ` en ${x.clinica}` : ""}. Lleve un documento con foto. El examen lo paga la empresa (NR-7).`);
    void navigator.clipboard.writeText(txt).then(() => avisar(L("Convocação copiada. Cole no WhatsApp ou no e-mail da pessoa.", "Notice copied. Paste it in the person's WhatsApp or e-mail.", "Convocatoria copiada. Péguela en el WhatsApp o e-mail de la persona."), "ok"), () => avisar(txt, "ok"));
  }

  // funções (não componentes): componente criado no render remonta a cada letra e o campo perde o foco
  const pessoa = (p: Linha, destaque?: string) => {
    const f = form[p.id];
    const ag = (p.exames as Linha[]).filter((x) => x.situacao === "agendado");
    const a = aso(p);
    return (
      <li key={p.id} className="rounded-xl p-3 space-y-2" style={{ border: `1px solid ${destaque ?? cor.borda}`, background: cor.aninhado }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm" style={{ color: "var(--axi-text-primary)" }}>
            <Link href={linkFicha(p.id, "documentos")} className="font-bold underline">{p.nome_social || p.nome}</Link>
            <span style={{ color: cor.texto2 }}> · {L("admissão", "hire", "admisión")} {dataBR(p.contrato?.data_admissao)} · ASO: {a?.situacao === "entregue" ? `${L("feito em", "done on", "hecho el")} ${dataBR(a.data_item)} (${a.resultado ?? "—"})` : a?.situacao === "agendado" ? `${L("agendado", "scheduled", "agendado")} ${horaBR(a.agendado_para)}` : a?.situacao === "dispensado" ? L("dispensado", "waived", "dispensado") : L("pendente", "pending", "pendiente")}</span>
          </div>
          {pode.editar && <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setForm((x) => ({ ...x, [p.id]: { modo: "agendar", tipo: "aso_admissional" } }))} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnMenta, color: "#fff" }}><CalendarPlus size={13} /> {L("Agendar", "Schedule", "Agendar")}</button>
            <button type="button" onClick={() => setForm((x) => ({ ...x, [p.id]: { modo: "resultado", tipo: "aso_admissional", data: hoje } }))} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnAzul, color: "#fff" }}><ClipboardCheck size={13} /> {L("Registrar resultado", "Record result", "Registrar resultado")}</button>
            <Link href={linkFicha(p.id, "documentos")} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnAzul, color: "#fff" }}>{L("Ficha e anexos ›", "Record and files ›", "Ficha y archivos ›")}</Link>
          </div>}
        </div>
        {ag.length > 0 && <ul className="text-xs space-y-1">{ag.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center gap-2" style={{ color: "var(--axi-text-primary)" }}>
            📅 <b>{EXAMES.find((e) => e.tipo === x.tipo)?.nome[lang] ?? x.tipo}</b> — {horaBR(x.agendado_para)}{x.clinica ? ` · ${x.clinica}` : ""}
            <button type="button" onClick={() => convocacao(p, x)} className="flex items-center gap-1 underline font-semibold"><Copy size={12} /> {L("Copiar convocação", "Copy notice", "Copiar convocatoria")}</button>
          </li>))}</ul>}
        {f && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
            <div><label htmlFor={`ex-tipo-${p.id}`} className="text-xs font-semibold block mb-1" style={{ color: cor.titulo }}>{L("Exame", "Exam", "Examen")}</label>
              <select id={`ex-tipo-${p.id}`} value={f.tipo} onChange={(e) => setForm((x) => ({ ...x, [p.id]: { ...f, tipo: e.target.value } }))} className="w-full px-3 py-2 rounded-lg text-sm" style={campo}>
                {EXAMES.map((e) => <option key={e.tipo} value={e.tipo}>{e.nome[lang]}</option>)}
              </select></div>
            {f.modo === "agendar" ? (<>
              <div><label htmlFor={`ex-q-${p.id}`} className="text-xs font-semibold block mb-1" style={{ color: cor.titulo }}>{L("Data e hora", "Date and time", "Fecha y hora")}</label>
                <input id={`ex-q-${p.id}`} type="datetime-local" value={f.quando ?? ""} onChange={(e) => setForm((x) => ({ ...x, [p.id]: { ...f, quando: e.target.value } }))} className="w-full px-3 py-2 rounded-lg text-sm" style={campo} /></div>
              <div><label htmlFor={`ex-c-${p.id}`} className="text-xs font-semibold block mb-1" style={{ color: cor.titulo }}>{L("Clínica / médico do trabalho", "Clinic / occupational doctor", "Clínica / médico del trabajo")}</label>
                <input id={`ex-c-${p.id}`} maxLength={120} value={f.clinica ?? ""} onChange={(e) => setForm((x) => ({ ...x, [p.id]: { ...f, clinica: e.target.value } }))} className="w-full px-3 py-2 rounded-lg text-sm" style={campo} /></div>
            </>) : (<>
              <div><label htmlFor={`ex-d-${p.id}`} className="text-xs font-semibold block mb-1" style={{ color: cor.titulo }}>{L("Feito em", "Done on", "Hecho el")}</label>
                <input id={`ex-d-${p.id}`} type="date" value={f.data ?? ""} onChange={(e) => setForm((x) => ({ ...x, [p.id]: { ...f, data: e.target.value } }))} className="w-full px-3 py-2 rounded-lg text-sm" style={campo} /></div>
              {f.tipo === "aso_admissional" ? <div><label htmlFor={`ex-r-${p.id}`} className="text-xs font-semibold block mb-1" style={{ color: cor.titulo }}>{L("Resultado do ASO", "ASO result", "Resultado del ASO")}</label>
                <select id={`ex-r-${p.id}`} value={f.resultado ?? ""} onChange={(e) => setForm((x) => ({ ...x, [p.id]: { ...f, resultado: e.target.value } }))} className="w-full px-3 py-2 rounded-lg text-sm" style={campo}>
                  <option value="">—</option><option value="apto">{L("Apto", "Fit", "Apto")}</option><option value="apto_com_restricao">{L("Apto com restrição", "Fit with restriction", "Apto con restricción")}</option><option value="inapto">{L("Inapto", "Unfit", "No apto")}</option>
                </select></div> : <div><label htmlFor={`ex-v-${p.id}`} className="text-xs font-semibold block mb-1" style={{ color: cor.titulo }}>{L("Validade (opcional)", "Valid until (optional)", "Validez (opcional)")}</label>
                <input id={`ex-v-${p.id}`} type="date" value={f.validade ?? ""} onChange={(e) => setForm((x) => ({ ...x, [p.id]: { ...f, validade: e.target.value } }))} className="w-full px-3 py-2 rounded-lg text-sm" style={campo} /></div>}
            </>)}
            <div className="flex gap-2">
              <BotaoAcao executar={() => gravar(p, f)} texto={L("Salvar", "Save", "Guardar")} textoTrabalhando="…" className="px-3 py-2 rounded-lg text-xs" estilo={{ background: cor.btnMenta, color: "#fff" }} />
              <button type="button" onClick={() => setForm((x) => { const n = { ...x }; delete n[p.id]; return n; })} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: cor.btnAzul, color: "#fff" }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
            </div>
          </div>
        )}
        {f?.tipo === "aso_admissional" && f.modo === "resultado" && f.resultado === "inapto" && <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>{L("Inapto: a pessoa não pode assumir a função. Converse com o médico do trabalho e o contador antes de qualquer decisão.", "Unfit: the person cannot take the role. Talk to the occupational doctor and the accountant before any decision.", "No apto: la persona no puede asumir la función. Hable con el médico del trabajo y el contador antes de decidir.")}</p>}
      </li>
    );
  };
  const bloco = ({ titulo, lista, cor: c, vazio }: { titulo: string; lista: Linha[]; cor?: string; vazio: string }) => (
    <CanvasBox key={titulo} cor={cor.verde} {...cartao}>
      <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: c ?? cor.titulo }}><Stethoscope size={16} /> {titulo} <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(128,128,128,0.15)" }}>{lista.length}</span></p>
      {lista.length === 0 ? <p className="text-sm" style={{ color: cor.texto2 }}>{vazio}</p> : <ul className="space-y-2">{lista.map((p) => pessoa(p, c))}</ul>}
    </CanvasBox>
  );
  if (!grupos) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  return (<>
    <p className="text-sm" style={{ color: cor.texto2 }}>{L("NR-7: o exame admissional (ASO) é feito antes de a pessoa assumir as atividades, por conta da empresa. Agende, envie a convocação e registre o resultado; o ASO assinado fica anexado na ficha.", "NR-7: the pre-employment exam (ASO) is done before the person starts, paid by the company. Schedule, send the notice and record the result; the signed ASO is attached on the record.", "NR-7: el examen de admisión (ASO) se hace antes de que la persona asuma sus actividades, pagado por la empresa. Agende, envíe la convocatoria y registre el resultado; el ASO firmado queda adjunto en la ficha.")}</p>
    {bloco({ titulo: L("Trabalhando sem exame admissional", "Working without pre-employment exam", "Trabajando sin examen de admisión"), lista: grupos.atrasados, cor: "#ef4444", vazio: L("Ninguém trabalhando sem o ASO. 👏", "No one working without the ASO. 👏", "Nadie trabajando sin el ASO. 👏") })}
    {bloco({ titulo: L("Vão começar: agendar antes do primeiro dia", "Starting soon: schedule before day one", "Van a empezar: agendar antes del primer día"), lista: grupos.agendar, cor: cor.laranja, vazio: L("Nenhuma admissão futura sem exame agendado.", "No upcoming hire without a scheduled exam.", "Ninguna admisión futura sin examen agendado.") })}
    {bloco({ titulo: L("Agendados", "Scheduled", "Agendados"), lista: grupos.agendados, vazio: L("Nenhum exame agendado.", "No exams scheduled.", "Ningún examen agendado.") })}
    {bloco({ titulo: L("ASO feito ou dispensado", "ASO done or waived", "ASO hecho o dispensado"), lista: grupos.feitos, vazio: L("Nenhum ASO registrado ainda.", "No ASO recorded yet.", "Ningún ASO registrado aún.") })}
  </>);
}

export default function RhExamesPage() {
  return (
    <RotinaRh exigir={["saude"]} titulo={{ pt: "Exames ocupacionais", en: "Occupational exams", es: "Exámenes ocupacionales" }}
      subtitulo={{ pt: "Agendar o exame admissional, enviar a convocação e registrar o ASO (NR-7)", en: "Schedule the pre-employment exam, send the notice and record the ASO (NR-7)", es: "Agendar el examen de admisión, enviar la convocatoria y registrar el ASO (NR-7)" }}
      letreiro={(c) => [c.L("Exame admissional antes do primeiro dia (NR-7)", "Pre-employment exam before day one (NR-7)", "Examen de admisión antes del primer día (NR-7)"), c.L("Custeado pela empresa", "Paid by the company", "Pagado por la empresa")]}>
      {(ctx) => <Conteudo ctx={ctx} />}
    </RotinaRh>
  );
}
