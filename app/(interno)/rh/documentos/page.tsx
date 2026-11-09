"use client";
// RH · Documentos da admissão (auditoria 09/11/2026: "Cobrar os documentos" não tinha destino). Quem está com documento
// obrigatório pendente, o que falta, marcar como recebido/dispensado e a mensagem de cobrança pronta para copiar.
// Dado pessoal: só com a liberação de dados pessoais. Os mesmos itens da ficha (rh_admissao_itens). Ordem alfabética.
import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { FileCheck2, Copy, Search } from "lucide-react";
import { RotinaRh, supabaseRh as supabase, linkFicha, type CtxRotina } from "../../../../components/rh/RotinaRh";
import { CanvasBox } from "../../../../components/CanvasBox";
import { BotaoAcao } from "../../../../components/BotaoAcao";
import { hojeISO } from "../../../../lib/datas";
import { lerTodas } from "../../../../lib/lerTodas";
import { ITENS_ADMISSAO } from "../../../../lib/rhDocumentos";
import { mensagemErroRh } from "../../../../lib/rhEstrutura";

type Linha = Record<string, any>;
const DOCS = ITENS_ADMISSAO.filter((i) => i.categoria === "documento");
const OBRIG = DOCS.filter((d) => d.obrigatorio);

function Conteudo({ ctx }: { ctx: CtxRotina }) {
  const { empresaId, pode, lang, L, cor, campo, cartao, avisar } = ctx;
  const [gente, setGente] = useState<Linha[] | null>(null);
  const [busca, setBusca] = useState("");
  const [verTodos, setVerTodos] = useState(false);
  async function carregar() {
    const ler = (t: string, cols: string, lixeira: boolean) => lerTodas(() => { const q = supabase.from(t).select(cols).eq("empresa_id", empresaId); return (lixeira ? q.is("excluido_em", null) : q).order("id"); });
    const [cs, its] = await Promise.all([ler("rh_colaboradores", "id, nome, nome_social, situacao", true), ler("rh_admissao_itens", "colaborador_id, tipo, categoria, situacao", false)]);
    if (cs.error || its.error) { avisar(L("Não foi possível ler os documentos agora. Recarregue a página.", "Could not read the documents now. Reload the page.", "No se pudieron leer los documentos ahora. Recargue la página.")); Sentry.captureException(new Error(`rh/documentos: ${(cs.error ?? its.error)!.message}`)); setGente([]); return; }
    const sit = new Map<string, Map<string, string>>();
    (its.data as Linha[]).filter((x) => x.categoria === "documento").forEach((x) => { const m = sit.get(x.colaborador_id) ?? new Map(); m.set(x.tipo, x.situacao); sit.set(x.colaborador_id, m); });
    setGente((cs.data as Linha[]).filter((c) => c.situacao !== "desligado").map((c): Linha => {
      const m = sit.get(c.id) ?? new Map<string, string>();
      return { ...c, faltam: OBRIG.filter((d) => !["entregue", "dispensado"].includes(m.get(d.tipo) ?? "pendente")) };
    }).sort((a, b) => String(a.nome_social || a.nome).localeCompare(String(b.nome_social || b.nome), "pt-BR")));
  }
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function marcar(p: Linha, tipo: string, situacao: "entregue" | "dispensado"): Promise<boolean> {
    const { error } = await supabase.from("rh_admissao_itens").upsert({ empresa_id: empresaId, colaborador_id: p.id, categoria: "documento", tipo, situacao, data_item: situacao === "entregue" ? hojeISO() : null }, { onConflict: "colaborador_id,tipo" });
    if (error) { avisar(mensagemErroRh(error, lang)); return false; }
    await carregar(); return true;
  }
  function cobranca(p: Linha) {
    const lista = (p.faltam as typeof OBRIG).map((d) => `• ${d.nome[lang]}`).join("\n");
    const txt = L(`Olá, ${p.nome_social || p.nome}! Para concluir sua admissão, ainda precisamos de:\n${lista}\nPode enviar uma foto ou PDF de cada um? Obrigado!`,
      `Hello, ${p.nome_social || p.nome}! To complete your hiring we still need:\n${lista}\nCould you send a photo or PDF of each? Thank you!`,
      `¡Hola, ${p.nome_social || p.nome}! Para concluir su admisión aún necesitamos:\n${lista}\n¿Puede enviar una foto o PDF de cada uno? ¡Gracias!`);
    void navigator.clipboard.writeText(txt).then(() => avisar(L("Mensagem de cobrança copiada. Cole no WhatsApp ou no e-mail da pessoa.", "Request message copied. Paste it in the person's WhatsApp or e-mail.", "Mensaje de cobro copiado. Péguelo en el WhatsApp o e-mail de la persona."), "ok"), () => avisar(txt, "ok"));
  }
  if (!gente) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  const q = busca.trim().toLowerCase();
  const lista = gente.filter((p) => (verTodos || p.faltam.length) && (!q || String(p.nome_social || p.nome).toLowerCase().includes(q)));
  return (<>
    <p className="text-sm" style={{ color: cor.texto2 }}>{L("Documentos obrigatórios da admissão (CLT arts. 29 e 41; LGPD). Marque o que chegou, dispense o que não se aplica e copie a mensagem de cobrança. Os arquivos ficam anexados na ficha.", "Required hiring documents (CLT arts. 29 and 41; LGPD). Mark what arrived, waive what does not apply and copy the request message. Files are attached on the record.", "Documentos obligatorios de admisión (CLT arts. 29 y 41; LGPD). Marque lo recibido, dispense lo que no aplica y copie el mensaje de cobro. Los archivos quedan adjuntos en la ficha.")}</p>
    <CanvasBox cor={cor.verde} {...cartao}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl" style={campo}><Search size={16} style={{ color: cor.texto2 }} />
          <input aria-label={L("Buscar por nome", "Search by name", "Buscar por nombre")} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={L("Buscar por nome", "Search by name", "Buscar por nombre")} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "var(--axi-text-primary)" }} /></div>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--axi-text-primary)" }}><input type="checkbox" checked={verTodos} onChange={(e) => setVerTodos(e.target.checked)} /> {L("Mostrar também quem está completo", "Also show who is complete", "Mostrar también a quien está completo")}</label>
      </div>
      <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: cor.titulo }}><FileCheck2 size={16} /> {L("Pessoas", "People", "Personas")} <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(128,128,128,0.15)" }}>{lista.length}</span></p>
      {lista.length === 0 ? <p className="text-sm" style={{ color: cor.texto2 }}>{L("Ninguém com documento obrigatório pendente. 👏", "No one with a required document pending. 👏", "Nadie con documento obligatorio pendiente. 👏")}</p> : (
        <ul className="space-y-2">{lista.map((p) => (
          <li key={p.id} className="rounded-xl p-3 space-y-2" style={{ border: `1px solid ${p.faltam.length ? cor.laranja : cor.borda}`, background: cor.aninhado }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm" style={{ color: "var(--axi-text-primary)" }}><Link href={linkFicha(p.id, "documentos")} className="font-bold underline">{p.nome_social || p.nome}</Link>
                <span style={{ color: p.faltam.length ? cor.laranja : cor.verde }}> · {p.faltam.length ? L(`falta(m) ${p.faltam.length}`, `${p.faltam.length} missing`, `falta(n) ${p.faltam.length}`) : L("completo", "complete", "completo")}</span></span>
              <div className="flex flex-wrap gap-2">
                {p.faltam.length > 0 && <button type="button" onClick={() => cobranca(p)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnMenta, color: "#fff" }}><Copy size={13} /> {L("Copiar cobrança", "Copy request", "Copiar cobro")}</button>}
                <Link href={linkFicha(p.id, "documentos")} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnAzul, color: "#fff" }}>{L("Anexar na ficha ›", "Attach on the record ›", "Adjuntar en la ficha ›")}</Link>
              </div>
            </div>
            {p.faltam.length > 0 && <ul className="text-xs space-y-1">{(p.faltam as typeof OBRIG).map((d) => (
              <li key={d.tipo} className="flex flex-wrap items-center gap-2" style={{ color: "var(--axi-text-primary)" }}>• {d.nome[lang]}
                {pode.editar && <><BotaoAcao executar={() => marcar(p, d.tipo, "entregue")} texto={L("Recebido", "Received", "Recibido")} textoTrabalhando="…" className="px-2 py-1 rounded-md text-xs" estilo={{ background: cor.btnMenta, color: "#fff" }} />
                  <BotaoAcao executar={() => marcar(p, d.tipo, "dispensado")} texto={L("Não se aplica", "Not applicable", "No aplica")} textoTrabalhando="…" className="px-2 py-1 rounded-md text-xs" estilo={{ background: cor.btnAzul, color: "#fff" }} /></>}
              </li>))}</ul>}
          </li>))}</ul>
      )}
    </CanvasBox>
  </>);
}

export default function RhDocumentosPage() {
  return (
    <RotinaRh exigir={["pessoais"]} titulo={{ pt: "Documentos da admissão", en: "Hiring documents", es: "Documentos de admisión" }}
      subtitulo={{ pt: "Quem está com documento pendente, o que falta e a cobrança pronta", en: "Who has pending documents, what is missing and the request ready", es: "Quién tiene documentos pendientes, qué falta y el cobro listo" }}
      letreiro={(c) => [c.L(`${OBRIG.length} documentos obrigatórios por pessoa`, `${OBRIG.length} required documents per person`, `${OBRIG.length} documentos obligatorios por persona`), c.L("Ordem alfabética", "Alphabetical order", "Orden alfabético")]}>
      {(ctx) => <Conteudo ctx={ctx} />}
    </RotinaRh>
  );
}
