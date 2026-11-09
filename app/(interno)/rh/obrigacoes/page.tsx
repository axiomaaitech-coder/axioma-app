"use client";
// RH · Obrigações da empresa (auditoria 09/11/2026: "Ver obrigação" voltava para o próprio Painel). O que a lei exige conforme o
// tamanho da Empresa, com a conta feita sobre os empregados cadastrados (mesma função do Painel: porteRh) e a base legal.
// Âncoras #ponto #cota_pcd #igualdade #aprendiz — o Painel abre direto na obrigação. Nenhuma multa é estimada (NR-28 varia).
import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { RotinaRh, supabaseRh as supabase, type CtxRotina } from "../../../../components/rh/RotinaRh";
import { CanvasBox } from "../../../../components/CanvasBox";
import { lerTodas } from "../../../../lib/lerTodas";
import { contratoAtual } from "../../../../lib/rhIA";
import { cotaPcd, porteRh, type ContratoPainel } from "../../../../lib/rhPainel";

type Linha = Record<string, any>;
type Ob = { id: string; titulo: string; vale: boolean; conta: string; oQueFazer: string; base: string; link?: { href: string; t: string } };

function Conteudo({ ctx }: { ctx: CtxRotina }) {
  const { empresaId, pode, L, cor, cartao, avisar } = ctx;
  const [obs, setObs] = useState<Ob[] | null>(null);
  useEffect(() => { void (async () => {
    const ler = (t: string, cols: string, lixeira: boolean) => lerTodas(() => { const q = supabase.from(t).select(cols).eq("empresa_id", empresaId); return (lixeira ? q.is("excluido_em", null) : q).order("id"); });
    const [cs, ks, es, emp, pcd] = await Promise.all([
      ler("rh_colaboradores", "id, nome, nome_social, situacao", true),
      ler("rh_contratos", "id, colaborador_id, data_admissao, data_desligamento, cod_categ, estabelecimento_id, experiencia, data_termino, cargo_id, departamento_id, situacao_esocial", false),
      ler("rh_estabelecimentos", "id, nome", true),
      supabase.from("rh_empregador").select("ind_porte").eq("empresa_id", empresaId).is("excluido_em", null).order("ini_valid", { ascending: false }).limit(1),
      pode.saude ? ler("rh_colaborador_pcd", "colaborador_id, info_cota", false) : Promise.resolve({ data: null, error: null }),
    ]);
    const erro = [cs, ks, es, emp, pcd].find((r) => r.error)?.error;
    if (erro) { avisar(L("Não foi possível ler os dados agora. Recarregue a página.", "Could not read the data now. Reload the page.", "No se pudieron leer los datos ahora. Recargue la página.")); Sentry.captureException(new Error(`rh/obrigacoes: ${erro.message}`)); setObs([]); return; }
    const vivos = (cs.data as Linha[]).filter((c) => c.situacao !== "desligado");
    const idsVivos = new Set(vivos.map((c) => c.id));
    const atual = contratoAtual((ks.data as unknown as ContratoPainel[]).filter((k) => idsVivos.has(k.colaborador_id) && !k.data_desligamento));
    const { empregados, maiorEstab, porEstab, aprendizes } = porteRh(vivos as never, atual);
    const nomeEstab = new Map((es.data as Linha[]).map((e) => [e.id, e.nome]));
    const estabs = [...porEstab.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => `${id === "sem" ? L("sem filial informada", "no branch set", "sin sucursal informada") : nomeEstab.get(id) ?? "—"}: ${n}`).join(" · ");
    const meEpp = (emp.data as Linha[] | null)?.[0]?.ind_porte === "S";
    const cota = cotaPcd(empregados);
    const pcdCota = pcd.data ? (pcd.data as Linha[]).filter((p) => idsVivos.has(p.colaborador_id) && p.info_cota !== false).length : null;
    const tetoAprendiz = Math.ceil(empregados * 0.05);
    setObs([
      { id: "ponto", titulo: L("Controle de ponto", "Time tracking", "Control de jornada"), vale: maiorEstab > 20, base: "CLT art. 74, § 2º; Portaria MTP 671/2021",
        conta: L(`Maior estabelecimento: ${maiorEstab} empregado(s). Por filial — ${estabs || "nenhum"}.`, `Largest site: ${maiorEstab} employee(s). By branch — ${estabs || "none"}.`, `Mayor establecimiento: ${maiorEstab} empleado(s). Por sucursal — ${estabs || "ninguno"}.`),
        oQueFazer: maiorEstab > 20 ? L("Obrigatório registrar entrada e saída (manual, mecânico ou eletrônico) em todo estabelecimento com mais de 20 empregados.", "Recording clock-in and clock-out (manual, mechanical or electronic) is mandatory at every site with more than 20 employees.", "Obligatorio registrar entrada y salida (manual, mecánico o electrónico) en todo establecimiento con más de 20 empleados.")
          : L(`Ainda não é obrigatório: passa a ser com mais de 20 empregados no mesmo estabelecimento (faltam ${21 - maiorEstab}).`, `Not mandatory yet: it becomes so above 20 employees in the same site (${21 - maiorEstab} to go).`, `Aún no es obligatorio: lo será con más de 20 empleados en el mismo establecimiento (faltan ${21 - maiorEstab}).`),
        link: { href: "/rh/estrutura?aba=filiais", t: L("Ver filiais ›", "See branches ›", "Ver sucursales ›") } },
      { id: "cota_pcd", titulo: L("Cota de pessoas com deficiência", "Disability quota", "Cuota de personas con discapacidad"), vale: empregados >= 100, base: "Lei 8.213/1991, art. 93",
        conta: L(`${empregados} empregado(s) na Empresa (soma de todas as filiais). Faixas: 100–200 = 2% · 201–500 = 3% · 501–1.000 = 4% · acima = 5%.`, `${empregados} employee(s) in the company (all branches). Bands: 100–200 = 2% · 201–500 = 3% · 501–1,000 = 4% · above = 5%.`, `${empregados} empleado(s) en la empresa (todas las sucursales). Tramos: 100–200 = 2% · 201–500 = 3% · 501–1.000 = 4% · más = 5%.`),
        oQueFazer: empregados >= 100 ? L(`Precisa ter ${cota} vaga(s) preenchida(s). ${pcdCota === null ? "Para ver quantas já estão preenchidas, peça a liberação de saúde." : `Cadastradas para a cota: ${pcdCota}${pcdCota < cota ? ` — faltam ${cota - pcdCota}` : " — cota cumprida"}.`}`, `Needs ${cota} position(s) filled. ${pcdCota === null ? "Health access is needed to see how many are filled." : `Registered for the quota: ${pcdCota}${pcdCota < cota ? ` — ${cota - pcdCota} missing` : " — quota met"}.`}`, `Necesita ${cota} puesto(s) ocupado(s). ${pcdCota === null ? "Para ver cuántos están ocupados, pida la habilitación de salud." : `Registrados para la cuota: ${pcdCota}${pcdCota < cota ? ` — faltan ${cota - pcdCota}` : " — cuota cumplida"}.`}`)
          : L(`Ainda não se aplica: começa com 100 empregados (faltam ${100 - empregados}).`, `Does not apply yet: starts at 100 employees (${100 - empregados} to go).`, `Aún no aplica: empieza con 100 empleados (faltan ${100 - empregados}).`),
        link: { href: "/rh/colaboradores", t: L("Ver colaboradores ›", "See employees ›", "Ver colaboradores ›") } },
      { id: "igualdade", titulo: L("Relatório de transparência e igualdade salarial", "Pay transparency and equality report", "Informe de transparencia e igualdad salarial"), vale: empregados >= 100, base: "Lei 14.611/2023; Decreto 11.795/2023",
        conta: L(`${empregados} empregado(s) na Empresa.`, `${empregados} employee(s) in the company.`, `${empregados} empleado(s) en la empresa.`),
        oQueFazer: empregados >= 100 ? L("Preencher o questionário no Portal Emprega Brasil e publicar o relatório 2 vezes por ano (março e setembro), em local visível e no site da Empresa.", "Fill in the questionnaire on the Emprega Brasil portal and publish the report twice a year (March and September), in a visible place and on the company website.", "Completar el cuestionario en el Portal Emprega Brasil y publicar el informe 2 veces al año (marzo y septiembre), en lugar visible y en el sitio de la empresa.")
          : L(`Ainda não se aplica: começa com 100 empregados (faltam ${100 - empregados}).`, `Does not apply yet: starts at 100 employees (${100 - empregados} to go).`, `Aún no aplica: empieza con 100 empleados (faltan ${100 - empregados}).`) },
      { id: "aprendiz", titulo: L("Cota de aprendizes", "Apprentice quota", "Cuota de aprendices"), vale: !meEpp && empregados >= 7, base: "CLT art. 429; Decreto 9.579/2018; ME/EPP dispensadas — LC 123/2006, art. 51, III",
        conta: meEpp ? L("Empregador cadastrado como ME/EPP: dispensado da cota.", "Employer registered as micro/small business: exempt from the quota.", "Empleador registrado como ME/EPP: dispensado de la cuota.")
          : L(`${empregados} empregado(s); aprendizes cadastrados (categoria 103): ${aprendizes}.`, `${empregados} employee(s); apprentices registered (category 103): ${aprendizes}.`, `${empregados} empleado(s); aprendices registrados (categoría 103): ${aprendizes}.`),
        oQueFazer: meEpp ? L("Pode contratar aprendiz se quiser, mas não é obrigado.", "May hire apprentices if desired, but is not required to.", "Puede contratar aprendices si quiere, pero no está obligado.")
          : L(`Entre 5% e 15% dos empregados em funções que exigem formação profissional (pela CBO), por estabelecimento; fração vira 1. Se todas as funções contarem, o mínimo seria ${tetoAprendiz} — confirme com o contador quais funções entram na base.`, `Between 5% and 15% of employees in roles that require professional training (per CBO), per site; a fraction counts as 1. If every role counts, the minimum would be ${tetoAprendiz} — confirm with the accountant which roles enter the base.`, `Entre 5% y 15% de los empleados en funciones que exigen formación profesional (según CBO), por establecimiento; la fracción cuenta como 1. Si todas las funciones cuentan, el mínimo sería ${tetoAprendiz} — confirme con el contador qué funciones entran en la base.`),
        link: { href: "/rh/estrutura?aba=empregador", t: L("Ver porte no Empregador ›", "See size in Employer ›", "Ver porte en Empleador ›") } },
    ]);
  })(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // rola até a obrigação pedida pelo Painel (#ponto…) depois de montar
  useEffect(() => { if (obs && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [obs]);

  if (!obs) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  return (<>
    <p className="text-sm" style={{ color: cor.texto2 }}>{L("O que a lei passa a exigir conforme o tamanho da Empresa, calculado sobre os empregados cadastrados (CLT ativos e afastados). Regras conferidas em fontes oficiais; podem mudar — a base legal está em cada item.", "What the law requires as the company grows, computed on registered employees (CLT active and on leave). Rules checked against official sources; they may change — the legal basis is on each item.", "Lo que la ley exige según el tamaño de la empresa, calculado sobre los empleados registrados (CLT activos y en licencia). Reglas conferidas en fuentes oficiales; pueden cambiar — la base legal está en cada ítem.")}</p>
    {obs.map((o) => (
      <div key={o.id} id={o.id} style={{ scrollMarginTop: 80 }}>
        <CanvasBox cor={cor.verde} {...cartao}>
          <p className="text-sm font-black mb-2 flex flex-wrap items-center gap-2" style={{ color: cor.titulo }}><Scale size={16} /> {o.titulo}
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: o.vale ? "rgba(239,68,68,0.15)" : "rgba(128,128,128,0.15)", color: o.vale ? cor.laranja : cor.texto2 }}>
              {o.vale ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />} {o.vale ? L("se aplica à Empresa", "applies to the company", "se aplica a la empresa") : L("ainda não se aplica", "does not apply yet", "aún no aplica")}</span></p>
          <div className="rounded-xl p-3 space-y-1 text-sm" style={{ border: `1px solid ${cor.borda}`, background: cor.aninhado, color: "var(--axi-text-primary)" }}>
            <p>{o.conta}</p><p><b>{o.oQueFazer}</b></p>
            <p className="text-xs" style={{ color: cor.texto2 }}>{L("Base legal", "Legal basis", "Base legal")}: {o.base}</p>
          </div>
          {o.link && <Link href={o.link.href} className="inline-block mt-3 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: cor.btnAzul, color: "#fff" }}>{o.link.t}</Link>}
        </CanvasBox>
      </div>
    ))}
  </>);
}

export default function RhObrigacoesPage() {
  return (
    <RotinaRh titulo={{ pt: "Obrigações da empresa", en: "Company obligations", es: "Obligaciones de la empresa" }}
      subtitulo={{ pt: "Ponto, cota PCD, igualdade salarial e aprendizes conforme o tamanho da Empresa", en: "Time tracking, disability quota, pay equality and apprentices by company size", es: "Jornada, cuota PCD, igualdad salarial y aprendices según el tamaño de la empresa" }}
      letreiro={(c) => [c.L("Ponto acima de 20 por estabelecimento", "Time tracking above 20 per site", "Jornada más de 20 por establecimiento"), c.L("Cota PCD e igualdade a partir de 100", "Disability quota and equality from 100", "Cuota PCD e igualdad desde 100")]}>
      {(ctx) => <Conteudo ctx={ctx} />}
    </RotinaRh>
  );
}
