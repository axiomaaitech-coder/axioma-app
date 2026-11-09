"use client";
// RH · Central do eSocial (auditoria 09/11/2026: "Enviar ao eSocial" e "Preparar o envio" levavam à lista geral). Tudo que
// ainda falta ir ao governo, por evento: admissão (S-2200), alteração cadastral (S-2205), alteração de contrato (S-2206),
// desligamento (S-2299) e verbas da empresa (S-1010). Cada linha abre a ficha da pessoa no cartão do eSocial (ou a aba Verbas).
import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Send } from "lucide-react";
import { RotinaRh, supabaseRh as supabase, linkFicha, type CtxRotina } from "../../../../components/rh/RotinaRh";
import { CanvasBox } from "../../../../components/CanvasBox";
import { lerTodas } from "../../../../lib/lerTodas";

type Linha = Record<string, any>;
type Item = { id: string; nome: string; detalhe: string; href: string };
const dataBR = (iso?: string | null) => (iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "—");
const ENVIADO = ["enviado", "aceito", "enviado_pelo_contador"];

function Conteudo({ ctx }: { ctx: CtxRotina }) {
  const { empresaId, pode, L, cor, cartao, avisar } = ctx;
  const [g, setG] = useState<{ ev: string; t: string; itens: Item[]; vazio: string }[] | null>(null);
  useEffect(() => { void (async () => {
    const ler = (t: string, cols: string, lixeira: boolean, extra?: (q: any) => any) => lerTodas(() => { let q = supabase.from(t).select(cols).eq("empresa_id", empresaId); if (lixeira) q = q.is("excluido_em", null); return (extra ? extra(q) : q).order("id"); });
    const vazio = Promise.resolve({ data: [] as Linha[], error: null });
    const [cs, ks, ds, evs, rs, canc] = await Promise.all([
      ler("rh_colaboradores", "id, nome, nome_social", true),
      ler("rh_contratos", "id, colaborador_id, matricula, data_admissao, data_desligamento, situacao_esocial, alt_contratual_pendente, alt_cadastral_pendente", false),
      pode.pessoais && pode.salario ? ler("rh_desligamentos", "id, contrato_id, dt_deslig, situacao", false, (q) => q.neq("situacao", "aceito").neq("situacao", "enviado_pelo_contador")) : vazio,
      ler("rh_esocial_eventos", "id, contrato_id, evento, situacao, data_ref", false, (q) => q.in("evento", ["S-2205", "S-2206"]).in("situacao", ["preparado", "recusado"])),
      ler("rh_rubricas", "id, cod_rubr, dsc_rubr, situacao_esocial", true, (q) => q.not("situacao_esocial", "in", "(aceito,enviado_pelo_contador)")),
      // admissão cancelada (não chegou a trabalhar) que já tinha ido ao eSocial: o contador exclui com o S-3000
      ler("rh_contratos", "id, colaborador_id, matricula, data_admissao, rh_colaboradores!inner(nome, nome_social, excluido_em)", false, (q) => q.eq("admissao_cancelada", true).in("situacao_esocial", ENVIADO)),
    ]);
    const erro = [cs, ks, ds, evs, rs, canc].find((r) => r.error)?.error;
    if (erro) { avisar(L("Não foi possível ler o eSocial agora. Recarregue a página.", "Could not read eSocial now. Reload the page.", "No se pudo leer el eSocial ahora. Recargue la página.")); Sentry.captureException(new Error(`rh/esocial: ${erro.message}`)); }
    const pessoa = new Map((cs.data as Linha[] ?? []).map((c) => [c.id, c.nome_social || c.nome]));
    const contrato = new Map((ks.data as Linha[] ?? []).filter((k) => pessoa.has(k.colaborador_id)).map((k) => [k.id, k]));
    const it = (k: Linha, detalhe: string, secao = "esocial"): Item => ({ id: `${k.id}-${detalhe}`, nome: pessoa.get(k.colaborador_id)!, detalhe: `${k.matricula} · ${detalhe}`, href: linkFicha(k.colaborador_id, secao) });
    const ord = (a: Item[]) => a.sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"));
    const ks2 = [...contrato.values()];
    const sit = (s: string) => ({ rascunho: L("ainda não preparada", "not prepared yet", "aún no preparada"), preparado: L("arquivo pronto — falta marcar como enviado", "file ready — mark as sent", "archivo listo — falta marcar como enviado"), recusado: L("recusada pelo eSocial — corrigir e preparar de novo", "rejected by eSocial — fix and prepare again", "rechazada por el eSocial — corregir y preparar de nuevo") } as Record<string, string>)[s] ?? s;
    const evPend = (evs.data as Linha[] ?? []).filter((e) => contrato.has(e.contrato_id));
    const evDe = (ev: string) => evPend.filter((e) => e.evento === ev).map((e) => it(contrato.get(e.contrato_id)!, `${L("alteração de", "change of", "alteración del")} ${dataBR(e.data_ref)} · ${sit(e.situacao)}`));
    setG([
      { ev: "S-2200", t: L("Admissões", "Hirings", "Admisiones"), vazio: L("Todas as admissões foram ao eSocial.", "All hirings went to eSocial.", "Todas las admisiones fueron al eSocial."),
        itens: ord(ks2.filter((k) => !ENVIADO.includes(k.situacao_esocial)).map((k) => it(k, `${L("admissão", "hire", "admisión")} ${dataBR(k.data_admissao)} · ${sit(k.situacao_esocial)}`))) },
      { ev: "S-2205", t: L("Alterações cadastrais (dados pessoais, deficiência, dependentes)", "Personal data changes (personal data, disability, dependants)", "Alteraciones de registro (datos personales, discapacidad, dependientes)"), vazio: L("Nenhuma alteração cadastral pendente.", "No pending personal data change.", "Ninguna alteración de registro pendiente."),
        itens: ord([...ks2.filter((k) => k.alt_cadastral_pendente).map((k) => it(k, L("dado pessoal mudou depois do envio — preparar S-2205", "personal data changed after sending — prepare S-2205", "dato personal cambió después del envío — preparar S-2205"))), ...evDe("S-2205")]) },
      { ev: "S-2206", t: L("Alterações de contrato (cargo, salário, jornada, prazo)", "Contract changes (job, salary, hours, term)", "Alteraciones de contrato (cargo, salario, jornada, plazo)"), vazio: L("Nenhuma alteração de contrato pendente.", "No pending contract change.", "Ninguna alteración de contrato pendiente."),
        itens: ord([...ks2.filter((k) => k.alt_contratual_pendente).map((k) => it(k, L("contrato ou salário mudou depois do envio — preparar S-2206", "contract or salary changed after sending — prepare S-2206", "contrato o salario cambió después del envío — preparar S-2206"))), ...evDe("S-2206")]) },
      { ev: "S-2299", t: L("Desligamentos", "Terminations", "Desvinculaciones"), vazio: pode.pessoais && pode.salario ? L("Nenhum desligamento por enviar.", "No termination to send.", "Ninguna desvinculación por enviar.") : L("Precisa da liberação de dados pessoais e salário para ver.", "Needs personal data and salary access to see.", "Necesita habilitación de datos personales y salario para ver."),
        itens: ord((ds.data as Linha[] ?? []).filter((d) => contrato.has(d.contrato_id)).map((d) => it(contrato.get(d.contrato_id)!, `${L("desligamento", "termination", "desvinculación")} ${dataBR(d.dt_deslig)} · ${d.situacao === "calculado" ? L("rescisão calculada — preparar S-2299", "severance calculated — prepare S-2299", "rescisión calculada — preparar S-2299") : sit(d.situacao)}`, "desligamento"))) },
      { ev: "S-3000", t: L("Admissões canceladas — excluir no eSocial", "Cancelled hires — delete in eSocial", "Admisiones canceladas — excluir en el eSocial"), vazio: L("Nenhuma admissão cancelada para excluir.", "No cancelled hire to delete.", "Ninguna admisión cancelada para excluir."),
        itens: ((canc.data as Linha[]) ?? []).map((k) => ({ id: k.id, nome: k.rh_colaboradores.nome_social || k.rh_colaboradores.nome, detalhe: `${k.matricula} · ${L("admissão", "hire", "admisión")} ${dataBR(k.data_admissao)} · ${L("não chegou a trabalhar — o contador exclui o S-2200 com o S-3000", "did not start work — the accountant deletes the S-2200 with the S-3000", "no llegó a trabajar — el contador excluye el S-2200 con el S-3000")}`, href: "/rh/colaboradores" })) },
      { ev: "S-1010", t: L("Verbas da empresa (rubricas)", "Company pay items (rubrics)", "Rubros de la empresa"), vazio: L("Todas as verbas foram ao eSocial.", "All pay items went to eSocial.", "Todos los rubros fueron al eSocial."),
        itens: (rs.data as Linha[] ?? []).map((r) => ({ id: r.id, nome: `${r.cod_rubr} · ${r.dsc_rubr}`, detalhe: sit(r.situacao_esocial), href: "/rh/estrutura?aba=verbas" })) },
    ]);
  })(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!g) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  return (<>
    <p className="text-sm" style={{ color: cor.texto2 }}>{L("O Axioma prepara o arquivo de cada evento conferido com o leiaute oficial; você (ou o contador) envia pelo portal do eSocial e marca aqui como enviado, com o recibo. Toque no nome para abrir a ficha já no cartão do eSocial.", "Axioma prepares each event file checked against the official layout; you (or the accountant) send it on the eSocial portal and mark it as sent here, with the receipt. Tap the name to open the record at the eSocial card.", "Axioma prepara el archivo de cada evento conferido con el diseño oficial; usted (o el contador) lo envía por el portal del eSocial y lo marca aquí como enviado, con el recibo. Toque el nombre para abrir la ficha en la tarjeta del eSocial.")}</p>
    {g.map((x) => (
      <CanvasBox key={x.ev} cor={cor.verde} {...cartao}>
        <p className="text-sm font-black mb-3 flex flex-wrap items-center gap-2" style={{ color: cor.titulo }}><Send size={16} /> {x.ev} · {x.t}
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: x.itens.length ? "rgba(239,68,68,0.15)" : "rgba(128,128,128,0.15)", color: x.itens.length ? cor.laranja : undefined }}>{x.itens.length}</span></p>
        {x.itens.length === 0 ? <p className="text-sm" style={{ color: cor.texto2 }}>{x.vazio}</p> : (
          <ul className="space-y-2">{x.itens.map((i) => (
            <li key={i.id}><Link href={i.href} className="block rounded-xl p-3 text-sm axi-card-faixa" style={{ border: `1px solid ${cor.borda}`, background: cor.aninhado, color: "var(--axi-text-primary)" }}>
              <b className="underline">{i.nome}</b> <span style={{ color: cor.texto2 }}>· {i.detalhe}</span> <span style={{ color: cor.verde }}>›</span></Link></li>))}</ul>
        )}
      </CanvasBox>
    ))}
  </>);
}

export default function RhEsocialPage() {
  return (
    <RotinaRh titulo={{ pt: "Central do eSocial", en: "eSocial center", es: "Central del eSocial" }}
      subtitulo={{ pt: "O que ainda falta enviar ao governo, evento por evento", en: "What is still to be sent to the government, event by event", es: "Lo que aún falta enviar al gobierno, evento por evento" }}
      letreiro={(c) => [c.L("Leiaute S-1.3 (NT 07/2026)", "Layout S-1.3 (NT 07/2026)", "Diseño S-1.3 (NT 07/2026)"), c.L("Ordem alfabética", "Alphabetical order", "Orden alfabético")]}>
      {(ctx) => <Conteudo ctx={ctx} />}
    </RotinaRh>
  );
}
