"use client";
// RH · Controle de férias (2026-11-09, item 6 do plano CFO/RH). Períodos aquisitivo/concessivo de cada pessoa (lib/rhFerias),
// programar as partes com as regras da CLT conferidas na hora, aviso de férias pronto, valor e data de pagamento (só com
// liberação de salário) e o risco em R$ das férias que vencem em dobro (art. 137). Lápis e lixeira de 90 dias (sem senha).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Palmtree, Pencil, Trash2, RotateCcw, Copy, Search, AlertTriangle } from "lucide-react";
import { RotinaRh, supabaseRh as supabase, linkFicha, type CtxRotina } from "../../../../components/rh/RotinaRh";
import { CanvasBox } from "../../../../components/CanvasBox";
import { BotaoAcao } from "../../../../components/BotaoAcao";
import { hojeISO } from "../../../../lib/datas";
import { lerTodas } from "../../../../lib/lerTodas";
import { contratoAtual } from "../../../../lib/rhContrato";
import { DIAS_LIXEIRA_RH } from "../../../../lib/nexusRetencao";
import { mensagemErroRh } from "../../../../lib/rhEstrutura";
import { periodosFerias, conferirParte, valorDobra, valorFerias, type Periodo, type ParteFerias } from "../../../../lib/rhFerias";

type Linha = Record<string, any>;
const dataBR = (iso?: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const somaDias = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

function Conteudo({ ctx }: { ctx: CtxRotina }) {
  const { empresaId, pode, lang, L, cor, campo, cartao, avisar } = ctx;
  const hoje = hojeISO();
  const [dados, setDados] = useState<{ pessoas: Linha[]; ferias: Linha[]; lixeira: Linha[] } | null>(null);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<Linha | null>(null);
  const [verLixeira, setVerLixeira] = useState(false);
  async function carregar() {
    const ler = (t: string, cols: string, lixeira: boolean) => lerTodas(() => { const q = supabase.from(t).select(cols).eq("empresa_id", empresaId); return (lixeira ? q.is("excluido_em", null) : q).order("id"); });
    const [cs, ks, fs, rs] = await Promise.all([
      ler("rh_colaboradores", "id, nome, nome_social, situacao", true),
      ler("rh_contratos", "id, colaborador_id, data_admissao, data_desligamento, cod_categ", false),
      ler("rh_ferias", "id, colaborador_id, contrato_id, aquisitivo_inicio, gozo_inicio, dias, abono_dias, faltas_periodo, observacao, excluido_em", false),
      pode.salario ? ler("rh_remuneracoes", "contrato_id, vigencia_inicio, und_sal_fixo, valor", false) : Promise.resolve({ data: [], error: null }),
    ]);
    const erro = [cs, ks, fs, rs].find((r) => r.error)?.error;
    if (erro) { avisar(L("Não foi possível ler as férias agora. Recarregue a página.", "Could not read vacations now. Reload the page.", "No se pudieron leer las vacaciones ahora. Recargue la página.")); Sentry.captureException(new Error(`rh/ferias: ${erro.message}`)); setDados({ pessoas: [], ferias: [], lixeira: [] }); return; }
    const atual = contratoAtual(ks.data as unknown as { id: string; colaborador_id: string; data_admissao: string; data_desligamento: string | null }[]);
    const sal = new Map<string, number>();
    for (const r of [...(rs.data as Linha[])].filter((x) => x.vigencia_inicio <= hoje && Number(x.und_sal_fixo) === 5).sort((a, b) => String(b.vigencia_inicio).localeCompare(String(a.vigencia_inicio)))) if (!sal.has(r.contrato_id)) sal.set(r.contrato_id, Number(r.valor));
    const todas = fs.data as Linha[];
    const ativas = todas.filter((f) => !f.excluido_em);
    const pessoas = (cs.data as Linha[]).filter((c) => c.situacao === "ativo" || c.situacao === "afastado").map((c) => {
      const k = atual.get(c.id);
      if (!k) return null;
      const partes = ativas.filter((f) => f.contrato_id === k.id) as ParteFerias[];
      const per = periodosFerias({ dataAdmissao: k.data_admissao, hoje, dataDesligamento: k.data_desligamento, partes });
      const salario = sal.get(k.id) ?? null;
      const vencidas = per.filter((x) => x.status === "vencida");
      const proxima = per.find((x) => x.status === "a_conceder");
      const dobra = per.reduce((s, x) => s + x.dias_em_dobro, 0);
      const grupo = vencidas.length ? "vencidas" : proxima && (proxima.dias_para_vencer ?? 999) <= 60 ? "vencendo" : proxima ? "a_conceder" : "em_dia";
      return { ...c, contrato: k, periodos: per, salario, grupo, proxima, dobra, risco: salario != null && dobra ? valorDobra(salario, dobra) : null };
    }).filter(Boolean) as Linha[];
    pessoas.sort((a, b) => String(a.nome_social || a.nome).localeCompare(String(b.nome_social || b.nome), "pt-BR"));
    setDados({ pessoas, ferias: ativas, lixeira: todas.filter((f) => f.excluido_em && Date.now() - new Date(f.excluido_em).getTime() < DIAS_LIXEIRA_RH * 86400000) });
  }
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const periodoDoForm: Periodo | null = useMemo(() => {
    if (!form || !dados) return null;
    return dados.pessoas.find((p) => p.id === form.colaborador_id)?.periodos.find((x: Periodo) => x.aquisitivo_inicio === form.aquisitivo_inicio) ?? null;
  }, [form, dados]);
  const conferencia = form && periodoDoForm && form.gozo_inicio && Number(form.dias) ? conferirParte(periodoDoForm, { id: form.id, aquisitivo_inicio: form.aquisitivo_inicio, gozo_inicio: form.gozo_inicio, dias: Number(form.dias), abono_dias: Number(form.abono_dias) || 0, faltas_periodo: form.faltas_periodo === "" ? null : Number(form.faltas_periodo) }, hoje) : null;

  async function salvar(): Promise<boolean> {
    if (!form || !conferencia || conferencia.erros.length) { avisar(L("Confira os pontos em vermelho antes de salvar.", "Check the items in red before saving.", "Revise los puntos en rojo antes de guardar.")); return false; }
    const linha = { empresa_id: empresaId, colaborador_id: form.colaborador_id, contrato_id: form.contrato_id, aquisitivo_inicio: form.aquisitivo_inicio, gozo_inicio: form.gozo_inicio,
      dias: Number(form.dias), abono_dias: Number(form.abono_dias) || 0, faltas_periodo: form.faltas_periodo === "" ? null : Number(form.faltas_periodo), observacao: form.observacao?.trim() || null };
    const r = form.id ? await supabase.from("rh_ferias").update(linha).eq("id", form.id).select("id") : await supabase.from("rh_ferias").insert(linha).select("id");
    if (r.error || !r.data?.length) { avisar(mensagemErroRh(r.error, lang)); return false; }
    setForm(null); avisar(L("Férias salvas.", "Vacation saved.", "Vacaciones guardadas."), "ok"); await carregar(); return true;
  }
  async function lixeira(id: string, recuperar: boolean): Promise<boolean> {
    const r = await supabase.from("rh_ferias").update({ excluido_em: recuperar ? null : new Date().toISOString() }).eq("id", id).select("id");
    if (r.error || !r.data?.length) { avisar(mensagemErroRh(r.error, lang)); return false; }
    avisar(recuperar ? L("Férias recuperadas.", "Vacation recovered.", "Vacaciones recuperadas.") : L(`Na lixeira — dá para recuperar por ${DIAS_LIXEIRA_RH} dias.`, `In the trash — recoverable for ${DIAS_LIXEIRA_RH} days.`, `En la papelera — se puede recuperar por ${DIAS_LIXEIRA_RH} días.`), "ok");
    await carregar(); return true;
  }
  function copiarAviso(p: Linha, x: Linha) {
    const nome = p.nome_social || p.nome;
    const txt = L(`AVISO DE FÉRIAS (CLT art. 135)\n\nPrezado(a) ${nome},\ncomunicamos que suas férias referentes ao período aquisitivo de ${dataBR(x.aquisitivo_inicio)} a ${dataBR(somaDias(x.aquisitivo_inicio, 364))} serão de ${dataBR(x.gozo_inicio)} a ${dataBR(x.fim)} (${x.dias} dias)${x.abono_dias ? `, com ${x.abono_dias} dias de abono pecuniário` : ""}. O retorno ao trabalho será em ${dataBR(somaDias(x.fim, 1))}. O pagamento será feito até ${dataBR(x.pagamento_ate)}.\n\nCiente: ____________________  Data: ___/___/_____`,
      `VACATION NOTICE (CLT art. 135)\n\nDear ${nome},\nyour vacation for the accrual period ${x.aquisitivo_inicio} to ${somaDias(x.aquisitivo_inicio, 364)} will be from ${x.gozo_inicio} to ${x.fim} (${x.dias} days)${x.abono_dias ? `, with ${x.abono_dias} days sold` : ""}. Return to work on ${somaDias(x.fim, 1)}. Payment by ${x.pagamento_ate}.\n\nAcknowledged: ____________________  Date: ___/___/_____`,
      `AVISO DE VACACIONES (CLT art. 135)\n\nEstimado(a) ${nome},\nle comunicamos que sus vacaciones del período adquisitivo de ${dataBR(x.aquisitivo_inicio)} a ${dataBR(somaDias(x.aquisitivo_inicio, 364))} serán del ${dataBR(x.gozo_inicio)} al ${dataBR(x.fim)} (${x.dias} días)${x.abono_dias ? `, con ${x.abono_dias} días vendidos` : ""}. El regreso será el ${dataBR(somaDias(x.fim, 1))}. El pago se hará hasta el ${dataBR(x.pagamento_ate)}.\n\nEnterado: ____________________  Fecha: ___/___/_____`);
    void navigator.clipboard.writeText(txt).then(() => avisar(L("Aviso de férias copiado: imprima ou envie e colete a assinatura.", "Vacation notice copied: print or send it and collect the signature.", "Aviso de vacaciones copiado: imprímalo o envíelo y recoja la firma."), "ok"), () => avisar(txt, "ok"));
  }

  if (!dados) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  const q = busca.trim().toLowerCase();
  const lista = dados.pessoas.filter((p) => !q || String(p.nome_social || p.nome).toLowerCase().includes(q));
  const nested = { background: cor.aninhado, border: `1px solid ${cor.borda}` };
  const riscoTotal = dados.pessoas.reduce((s, p) => s + (p.risco ?? 0), 0);
  const GRUPOS = [
    { id: "vencidas", t: L("Férias vencidas — pagas em dobro (CLT art. 137)", "Expired vacations — paid double (CLT art. 137)", "Vacaciones vencidas — pagadas en doble (CLT art. 137)"), c: "#ef4444" },
    { id: "vencendo", t: L("Prazo acaba em até 60 dias", "Deadline within 60 days", "Plazo termina en hasta 60 días"), c: cor.laranja },
    { id: "a_conceder", t: L("A conceder (dentro do prazo)", "To grant (within deadline)", "Por conceder (dentro del plazo)"), c: cor.titulo },
    { id: "em_dia", t: L("Em dia ou ainda em aquisição", "Up to date or still accruing", "Al día o aún en adquisición"), c: cor.texto2 },
  ];
  const rotStatus = (s: string) => ({ em_aquisicao: L("em aquisição", "accruing", "en adquisición"), a_conceder: L("a conceder", "to grant", "por conceder"), quitado: L("quitado", "settled", "saldado"), vencida: L("VENCIDA", "EXPIRED", "VENCIDA") } as Record<string, string>)[s] ?? s;

  return (<>
    <p className="text-sm" style={{ color: cor.texto2 }}>{L("Cada 12 meses de trabalho dão direito a férias (período aquisitivo), que a Empresa precisa conceder nos 12 meses seguintes (prazo). Passou do prazo, os dias são pagos em dobro. Programe aqui: o Axioma confere as regras da CLT na hora.", "Every 12 months of work earns vacation (accrual period), which the company must grant within the following 12 months (deadline). After the deadline, days are paid double. Schedule here: Axioma checks the CLT rules on the spot.", "Cada 12 meses de trabajo dan derecho a vacaciones (período adquisitivo), que la empresa debe conceder en los 12 meses siguientes (plazo). Pasado el plazo, los días se pagan en doble. Programe aquí: Axioma revisa las reglas de la CLT al instante.")}</p>
    {riscoTotal > 0 && <CanvasBox cor="#ef4444" {...cartao}><p className="text-sm font-black flex items-center gap-2" style={{ color: "#ef4444" }}><AlertTriangle size={16} /> {L(`Custo extra da dobra hoje: ${brl(riscoTotal)}`, `Extra cost of the double payment today: ${brl(riscoTotal)}`, `Costo extra de la doble paga hoy: ${brl(riscoTotal)}`)}</p>
      <p className="text-xs" style={{ color: cor.texto2 }}>{L("Salário ÷ 30 × dias em dobro × 4/3 (sem médias de variáveis). Conceda as férias o quanto antes.", "Salary ÷ 30 × double days × 4/3 (without variable averages). Grant the vacations as soon as possible.", "Salario ÷ 30 × días en doble × 4/3 (sin promedios de variables). Conceda las vacaciones cuanto antes.")}</p></CanvasBox>}
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl" style={campo}><Search size={16} style={{ color: cor.texto2 }} />
        <input aria-label={L("Buscar por nome", "Search by name", "Buscar por nombre")} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={L("Buscar por nome", "Search by name", "Buscar por nombre")} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "var(--axi-text-primary)" }} /></div>
      <button type="button" onClick={() => setVerLixeira((v) => !v)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: cor.btnAzul, color: "#fff" }}><Trash2 size={13} /> {verLixeira ? L("Fechar lixeira", "Close trash", "Cerrar papelera") : L(`Lixeira (${DIAS_LIXEIRA_RH} dias)`, `Trash (${DIAS_LIXEIRA_RH} days)`, `Papelera (${DIAS_LIXEIRA_RH} días)`)}</button>
    </div>
    {verLixeira && <CanvasBox cor={cor.verde} {...cartao}>
      {dados.lixeira.length === 0 ? <p className="text-sm" style={{ color: cor.texto2 }}>{L("A lixeira está vazia.", "The trash is empty.", "La papelera está vacía.")}</p> : <ul className="space-y-1 text-sm">{dados.lixeira.map((f) => {
        const p = dados.pessoas.find((x) => x.id === f.colaborador_id);
        return <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2" style={nested}><span style={{ color: cor.titulo }}>{p ? p.nome_social || p.nome : "—"} · {dataBR(f.gozo_inicio)} · {f.dias} {L("dias", "days", "días")}</span>
          {pode.editar && <BotaoAcao executar={() => lixeira(f.id, true)} icone={<RotateCcw size={13} />} texto={L("Recuperar", "Recover", "Recuperar")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={{ background: cor.btnAzul, color: "#fff" }} />}</li>; })}</ul>}
    </CanvasBox>}
    {GRUPOS.map((g) => { const doGrupo = lista.filter((p) => p.grupo === g.id); return (
      <CanvasBox key={g.id} cor={cor.verde} {...cartao}>
        <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: g.c }}><Palmtree size={16} /> {g.t} <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(128,128,128,0.15)" }}>{doGrupo.length}</span></p>
        {doGrupo.length === 0 ? <p className="text-sm" style={{ color: cor.texto2 }}>{L("Ninguém aqui.", "No one here.", "Nadie aquí.")}</p> : <ul className="space-y-2">{doGrupo.map((p) => (
          <li key={p.id}><details className="rounded-xl px-3 py-2" style={{ ...nested, borderColor: g.c === cor.texto2 ? cor.borda : g.c }}>
            <summary className="cursor-pointer text-sm" style={{ color: cor.titulo }}>
              <b>{p.nome_social || p.nome}</b> <span style={{ color: cor.texto2 }}>· {L("admissão", "hire", "admisión")} {dataBR(p.contrato.data_admissao)}
                {p.proxima && <> · {L(`saldo ${p.proxima.saldo} dias, prazo até ${dataBR(p.proxima.concessivo_fim)} (${p.proxima.dias_para_vencer} dias)`, `${p.proxima.saldo} days left, deadline ${p.proxima.concessivo_fim} (${p.proxima.dias_para_vencer} days)`, `saldo ${p.proxima.saldo} días, plazo hasta ${dataBR(p.proxima.concessivo_fim)} (${p.proxima.dias_para_vencer} días)`)}</>}
                {p.dobra > 0 && <b style={{ color: "#ef4444" }}> · {L(`${p.dobra} dias em dobro`, `${p.dobra} double days`, `${p.dobra} días en doble`)}{p.risco != null && ` (${brl(p.risco)})`}</b>}</span>
            </summary>
            <div className="mt-2 space-y-2">
              {[...p.periodos].reverse().map((per: Periodo) => (
                <div key={per.aquisitivo_inicio} className="rounded-lg p-2 text-xs" style={{ border: `1px solid ${per.status === "vencida" ? "#ef4444" : cor.borda}` }}>
                  <p style={{ color: cor.titulo }}><b>{dataBR(per.aquisitivo_inicio)} – {dataBR(per.aquisitivo_fim)}</b> · {rotStatus(per.status)} · {L(`direito ${per.direito}, usados ${per.usados}, saldo ${per.saldo}`, `right ${per.direito}, used ${per.usados}, left ${per.saldo}`, `derecho ${per.direito}, usados ${per.usados}, saldo ${per.saldo}`)} · {L("prazo até", "deadline", "plazo hasta")} {dataBR(per.concessivo_fim)}</p>
                  {per.partes.length > 0 && <ul className="mt-1 space-y-1">{per.partes.map((x) => (
                    <li key={x.id} className="flex flex-wrap items-center justify-between gap-2" style={{ color: cor.texto2 }}>
                      <span>{dataBR(x.gozo_inicio)} → {dataBR(x.fim)} · {x.dias} {L("dias", "days", "días")}{x.abono_dias ? ` + ${x.abono_dias} ${L("vendidos", "sold", "vendidos")}` : ""} · {L("pagar até", "pay by", "pagar hasta")} {dataBR(x.pagamento_ate)}{p.salario != null && ` · ${brl(valorFerias(p.salario, x.dias, x.abono_dias))}`}{x.em_dobro ? <b style={{ color: "#ef4444" }}> · {x.em_dobro} {L("em dobro", "double", "en doble")}</b> : null}</span>
                      <span className="flex gap-1">
                        <button type="button" title={L("Copiar aviso de férias", "Copy vacation notice", "Copiar aviso de vacaciones")} aria-label={L("Copiar aviso de férias", "Copy vacation notice", "Copiar aviso de vacaciones")} onClick={() => copiarAviso(p, x)} className="p-1.5 rounded-lg" style={{ color: cor.verde }}><Copy size={14} /></button>
                        {pode.editar && <><button type="button" title={L("Corrigir", "Fix", "Corregir")} aria-label={L("Corrigir férias", "Fix vacation", "Corregir vacaciones")} onClick={() => setForm({ id: x.id, colaborador_id: p.id, contrato_id: p.contrato.id, aquisitivo_inicio: per.aquisitivo_inicio, gozo_inicio: x.gozo_inicio, dias: String(x.dias), abono_dias: String(x.abono_dias), faltas_periodo: x.faltas_periodo == null ? "" : String(x.faltas_periodo), observacao: "" })} className="p-1.5 rounded-lg" style={{ color: cor.titulo }}><Pencil size={14} /></button>
                          <button type="button" title={L("Lixeira", "Trash", "Papelera")} aria-label={L("Mandar para a lixeira", "Move to trash", "Enviar a la papelera")} onClick={() => void lixeira(x.id!, false)} className="p-1.5 rounded-lg" style={{ color: "#ef4444" }}><Trash2 size={14} /></button></>}
                      </span>
                    </li>))}</ul>}
                  {pode.editar && per.saldo > 0 && per.status !== "em_aquisicao" && (form?.colaborador_id !== p.id || form?.aquisitivo_inicio !== per.aquisitivo_inicio) &&
                    <button type="button" onClick={() => setForm({ colaborador_id: p.id, contrato_id: p.contrato.id, aquisitivo_inicio: per.aquisitivo_inicio, gozo_inicio: "", dias: String(Math.min(per.saldo, 30)), abono_dias: "0", faltas_periodo: "", observacao: "" })} className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnMenta, color: "#fff" }}>{L("Programar férias", "Schedule vacation", "Programar vacaciones")}</button>}
                  {form && form.colaborador_id === p.id && form.aquisitivo_inicio === per.aquisitivo_inicio && (
                    <div className="mt-2 rounded-lg p-2 space-y-2" style={nested}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <label className="text-xs" style={{ color: cor.titulo }}>{L("Início", "Start", "Inicio")}<input type="date" value={form.gozo_inicio} onChange={(e) => setForm({ ...form, gozo_inicio: e.target.value })} className="block w-full px-2 py-1.5 rounded-lg text-sm" style={campo} /></label>
                        <label className="text-xs" style={{ color: cor.titulo }}>{L("Dias de descanso", "Rest days", "Días de descanso")}<input type="number" min={5} max={30} value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} className="block w-full px-2 py-1.5 rounded-lg text-sm" style={campo} /></label>
                        <label className="text-xs" style={{ color: cor.titulo }}>{L("Dias vendidos (abono)", "Days sold", "Días vendidos")}<input type="number" min={0} max={10} value={form.abono_dias} onChange={(e) => setForm({ ...form, abono_dias: e.target.value })} className="block w-full px-2 py-1.5 rounded-lg text-sm" style={campo} /></label>
                        <label className="text-xs" style={{ color: cor.titulo }}>{L("Faltas no período (opcional)", "Absences in period (optional)", "Faltas en el período (opcional)")}<input type="number" min={0} value={form.faltas_periodo} onChange={(e) => setForm({ ...form, faltas_periodo: e.target.value })} className="block w-full px-2 py-1.5 rounded-lg text-sm" style={campo} /></label>
                      </div>
                      {conferencia && <ul className="text-xs space-y-0.5">
                        {conferencia.erros.map((e) => <li key={e} style={{ color: "#ef4444" }}>✗ {e}</li>)}
                        {conferencia.avisos.map((a) => <li key={a} style={{ color: cor.laranja }}>⚠ {a}</li>)}
                        {!conferencia.erros.length && <li style={{ color: cor.verde }}>✓ {L(`dentro das regras da CLT · pagar até ${dataBR(somaDias(form.gozo_inicio, -2))}`, `within CLT rules · pay by ${somaDias(form.gozo_inicio, -2)}`, `dentro de las reglas de la CLT · pagar hasta ${dataBR(somaDias(form.gozo_inicio, -2))}`)}{p.salario != null && ` · ${brl(valorFerias(p.salario, Number(form.dias) || 0, Number(form.abono_dias) || 0))}`}</li>}
                      </ul>}
                      <div className="flex gap-2">
                        <BotaoAcao executar={salvar} texto={L("Salvar", "Save", "Guardar")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={{ background: cor.btnMenta, color: "#fff" }} />
                        <button type="button" onClick={() => setForm(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnAzul, color: "#fff" }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                      </div>
                    </div>)}
                </div>))}
              <Link href={linkFicha(p.id, "contrato")} className="inline-block text-xs underline font-bold" style={{ color: cor.verde }}>{L("Abrir a ficha ›", "Open the record ›", "Abrir la ficha ›")}</Link>
            </div>
          </details></li>))}</ul>}
      </CanvasBox>); })}
    <p className="text-xs" style={{ color: cor.texto2 }}>{L("Valores sem médias de horas extras e comissões. Direito pelo nº de faltas injustificadas do período (CLT art. 130), quando informado; sem informação, 30 dias.", "Amounts without overtime and commission averages. Entitlement by unexcused absences in the period (CLT art. 130), when entered; otherwise 30 days.", "Valores sin promedios de horas extras ni comisiones. Derecho por faltas injustificadas del período (CLT art. 130), cuando se informa; si no, 30 días.")}</p>
  </>);
}

export default function RhFeriasPage() {
  return (
    <RotinaRh titulo={{ pt: "Férias", en: "Vacations", es: "Vacaciones" }}
      subtitulo={{ pt: "Quem tem férias a tirar, prazos e o que vence em dobro", en: "Who has vacation to take, deadlines and what becomes double", es: "Quién tiene vacaciones pendientes, plazos y lo que vence en doble" }}
      letreiro={(c) => [c.L("Fora do prazo = paga em dobro (CLT art. 137)", "Past the deadline = paid double (CLT art. 137)", "Fuera de plazo = pagada en doble (CLT art. 137)"), c.L("Aviso com 30 dias (art. 135)", "30-day notice (art. 135)", "Aviso con 30 días (art. 135)")]}>
      {(ctx) => <Conteudo ctx={ctx} />}
    </RotinaRh>
  );
}
