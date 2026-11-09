"use client";
// RH · Contratos a vencer (auditoria 09/11/2026: "Avaliar e decidir", "Efetivar ou desligar" e "Renovar ou encerrar" não
// tinham destino). Experiência (até 90 dias) e prazo determinado (até 2 anos) — CLT arts. 445 e 451: prorroga uma vez só,
// dentro do limite; passou do fim e a pessoa continua, vira prazo indeterminado. Efetivar e prorrogar gravam no contrato
// (se a admissão já foi ao eSocial, o banco marca a alteração S-2206). Desligar abre a rescisão na ficha.
import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { CalendarClock } from "lucide-react";
import { RotinaRh, supabaseRh as supabase, linkFicha, type CtxRotina } from "../../../../components/rh/RotinaRh";
import { CanvasBox } from "../../../../components/CanvasBox";
import { BotaoAcao } from "../../../../components/BotaoAcao";
import { hojeISO } from "../../../../lib/datas";
import { lerTodas } from "../../../../lib/lerTodas";
import { mensagemErroRh } from "../../../../lib/rhEstrutura";

type Linha = Record<string, any>;
const dataBR = (iso?: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");
const dias = (de: string, ate: string) => Math.round((Date.parse(ate + "T12:00:00Z") - Date.parse(de + "T12:00:00Z")) / 86400000);
const somaDias = (iso: string, n: number) => new Date(Date.parse(iso + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const somaAnos = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCFullYear(d.getUTCFullYear() + n); return d.toISOString().slice(0, 10); };

function Conteudo({ ctx }: { ctx: CtxRotina }) {
  const { empresaId, pode, lang, L, cor, campo, cartao, avisar } = ctx;
  const [lista, setLista] = useState<Linha[] | null>(null);
  const [prorr, setProrr] = useState<Record<string, string>>({});
  async function carregar() {
    const ler = (t: string, cols: string, lixeira: boolean) => lerTodas(() => { const q = supabase.from(t).select(cols).eq("empresa_id", empresaId); return (lixeira ? q.is("excluido_em", null) : q).order("id"); });
    const [cs, ks] = await Promise.all([ler("rh_colaboradores", "id, nome, nome_social, situacao", true),
      ler("rh_contratos", "id, colaborador_id, matricula, data_admissao, tp_contr, data_termino, experiencia, data_desligamento, situacao_esocial, cod_categ", false)]);
    if (cs.error || ks.error) { avisar(L("Não foi possível ler os contratos agora. Recarregue a página.", "Could not read the contracts now. Reload the page.", "No se pudieron leer los contratos ahora. Recargue la página.")); Sentry.captureException(new Error(`rh/contratos: ${(cs.error ?? ks.error)!.message}`)); setLista([]); return; }
    const pessoas = new Map((cs.data as Linha[]).map((c) => [c.id, c]));
    setLista((ks.data as Linha[]).filter((k) => k.data_termino && !k.data_desligamento && pessoas.has(k.colaborador_id) && pessoas.get(k.colaborador_id)!.situacao !== "desligado")
      .map((k): Linha => ({ ...k, pessoa: pessoas.get(k.colaborador_id) }))
      .sort((a, b) => String(a.data_termino).localeCompare(String(b.data_termino)) || String(a.pessoa.nome).localeCompare(String(b.pessoa.nome), "pt-BR")));
  }
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const limite = (k: Linha) => (k.experiencia ? somaDias(k.data_admissao, 89) : somaDias(somaAnos(k.data_admissao, 2), -1));
  async function efetivar(k: Linha): Promise<boolean> {
    const { data, error } = await supabase.from("rh_contratos").update({ tp_contr: 1, experiencia: false, data_termino: null, clau_assec: null }).eq("id", k.id).select("id");
    if (error || !data?.length) { avisar(mensagemErroRh(error, lang)); return false; }
    avisar(L(`${k.pessoa.nome_social || k.pessoa.nome} efetivado(a): contrato por prazo indeterminado.${["enviado", "aceito", "enviado_pelo_contador"].includes(k.situacao_esocial) ? " A alteração (S-2206) ficou pendente no cartão do eSocial." : ""}`, `Made permanent: open-ended contract.${["enviado", "aceito", "enviado_pelo_contador"].includes(k.situacao_esocial) ? " The change (S-2206) is pending in the eSocial card." : ""}`, `Efectivado(a): contrato por plazo indeterminado.${["enviado", "aceito", "enviado_pelo_contador"].includes(k.situacao_esocial) ? " La alteración (S-2206) quedó pendiente en la tarjeta del eSocial." : ""}`), "ok");
    await carregar(); return true;
  }
  async function prorrogar(k: Linha): Promise<boolean> {
    const nova = prorr[k.id];
    if (!nova || nova <= k.data_termino) { avisar(L("Informe uma nova data depois do término atual.", "Enter a new date after the current end.", "Informe una nueva fecha posterior al término actual.")); return false; }
    if (nova > limite(k)) { avisar(L(`Passa do limite legal (${dataBR(limite(k))}). CLT art. 445.`, `Beyond the legal limit (${dataBR(limite(k))}). CLT art. 445.`, `Supera el límite legal (${dataBR(limite(k))}). CLT art. 445.`)); return false; }
    const { data, error } = await supabase.from("rh_contratos").update({ data_termino: nova }).eq("id", k.id).select("id");
    if (error || !data?.length) { avisar(mensagemErroRh(error, lang)); return false; }
    avisar(L(`Prorrogado até ${dataBR(nova)}. Lembre: a CLT permite prorrogar uma única vez (art. 451).`, `Extended to ${dataBR(nova)}. Remember: the CLT allows a single extension (art. 451).`, `Prorrogado hasta ${dataBR(nova)}. Recuerde: la CLT permite prorrogar una sola vez (art. 451).`), "ok");
    await carregar(); return true;
  }
  if (!lista) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  const hoje = hojeISO();
  const grupos = [
    { t: L("Já venceram — decidir agora", "Already ended — decide now", "Ya vencieron — decidir ahora"), c: "#ef4444", l: lista.filter((k) => k.data_termino < hoje) },
    { t: L("Vencem em até 15 dias", "End within 15 days", "Vencen en hasta 15 días"), c: cor.laranja, l: lista.filter((k) => k.data_termino >= hoje && dias(hoje, k.data_termino) <= 15) },
    { t: L("Vencem em até 30 dias", "End within 30 days", "Vencen en hasta 30 días"), c: cor.titulo, l: lista.filter((k) => dias(hoje, k.data_termino) > 15 && dias(hoje, k.data_termino) <= 30) },
    { t: L("Depois de 30 dias", "After 30 days", "Después de 30 días"), c: cor.texto2, l: lista.filter((k) => dias(hoje, k.data_termino) > 30) },
  ];
  return (<>
    <p className="text-sm" style={{ color: cor.texto2 }}>{L("Experiência: até 90 dias; prazo determinado: até 2 anos; cada um pode ser prorrogado uma única vez dentro do limite (CLT arts. 445 e 451). Se a pessoa continua trabalhando depois do fim, o contrato vira prazo indeterminado — decida antes.", "Probation: up to 90 days; fixed term: up to 2 years; each can be extended only once within the limit (CLT arts. 445 and 451). If the person keeps working after the end, the contract becomes open-ended — decide before.", "Experiencia: hasta 90 días; plazo determinado: hasta 2 años; cada uno puede prorrogarse una sola vez dentro del límite (CLT arts. 445 y 451). Si la persona sigue trabajando después del fin, el contrato pasa a plazo indeterminado — decida antes.")}</p>
    {grupos.map((g) => (
      <CanvasBox key={g.t} cor={cor.verde} {...cartao}>
        <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: g.c }}><CalendarClock size={16} /> {g.t} <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(128,128,128,0.15)" }}>{g.l.length}</span></p>
        {g.l.length === 0 ? <p className="text-sm" style={{ color: cor.texto2 }}>{L("Nenhum contrato aqui.", "No contracts here.", "Ningún contrato aquí.")}</p> : (
          <ul className="space-y-2">{g.l.map((k) => (
            <li key={k.id} className="rounded-xl p-3 space-y-2" style={{ border: `1px solid ${g.c === cor.texto2 ? cor.borda : g.c}`, background: cor.aninhado }}>
              <div className="text-sm" style={{ color: "var(--axi-text-primary)" }}>
                <Link href={linkFicha(k.colaborador_id, "contrato")} className="font-bold underline">{k.pessoa.nome_social || k.pessoa.nome}</Link>
                <span style={{ color: cor.texto2 }}> · {k.matricula} · {k.experiencia ? L("experiência", "probation", "experiencia") : L("prazo determinado", "fixed term", "plazo determinado")} · {L("admissão", "hire", "admisión")} {dataBR(k.data_admissao)} · {L("término", "end", "término")} <b style={{ color: g.c }}>{dataBR(k.data_termino)}</b> ({k.data_termino < hoje ? L(`há ${dias(k.data_termino, hoje)} dias`, `${dias(k.data_termino, hoje)} days ago`, `hace ${dias(k.data_termino, hoje)} días`) : L(`em ${dias(hoje, k.data_termino)} dias`, `in ${dias(hoje, k.data_termino)} days`, `en ${dias(hoje, k.data_termino)} días`)})</span>
              </div>
              {pode.editar && <div className="flex flex-wrap items-center gap-2">
                <BotaoAcao executar={() => efetivar(k)} texto={L("Efetivar (prazo indeterminado)", "Make permanent (open-ended)", "Efectivar (plazo indeterminado)")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={{ background: cor.btnMenta, color: "#fff" }} />
                <span className="flex items-center gap-1">
                  <input type="date" aria-label={L("Nova data de término", "New end date", "Nueva fecha de término")} value={prorr[k.id] ?? ""} min={k.data_termino} max={limite(k)} onChange={(e) => setProrr((x) => ({ ...x, [k.id]: e.target.value }))} className="px-2 py-1.5 rounded-lg text-xs" style={campo} />
                  <BotaoAcao executar={() => prorrogar(k)} texto={L("Prorrogar", "Extend", "Prorrogar")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={{ background: cor.btnAzul, color: "#fff" }} />
                </span>
                <Link href={linkFicha(k.colaborador_id, "desligamento")} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnAzul, color: "#fff" }}>{L("Desligar ›", "Terminate ›", "Desvincular ›")}</Link>
                <span className="text-xs" style={{ color: cor.texto2 }}>{L(`limite legal: ${dataBR(limite(k))}`, `legal limit: ${dataBR(limite(k))}`, `límite legal: ${dataBR(limite(k))}`)}</span>
              </div>}
            </li>))}</ul>
        )}
      </CanvasBox>
    ))}
  </>);
}

export default function RhContratosPage() {
  return (
    <RotinaRh titulo={{ pt: "Contratos a vencer", en: "Expiring contracts", es: "Contratos por vencer" }}
      subtitulo={{ pt: "Experiência e prazo determinado: efetivar, prorrogar ou desligar antes do fim", en: "Probation and fixed term: make permanent, extend or terminate before the end", es: "Experiencia y plazo determinado: efectivar, prorrogar o desvincular antes del fin" }}
      letreiro={(c) => [c.L("Experiência até 90 dias (CLT art. 445)", "Probation up to 90 days (CLT art. 445)", "Experiencia hasta 90 días (CLT art. 445)"), c.L("Uma prorrogação só (art. 451)", "One extension only (art. 451)", "Una sola prórroga (art. 451)")]}>
      {(ctx) => <Conteudo ctx={ctx} />}
    </RotinaRh>
  );
}
