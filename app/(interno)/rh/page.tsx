"use client";
// RH · Painel (Fase 1). Números do quadro e o Radar de Risco Trabalhista — calculados por lib/rhPainel.painelRh, a MESMA
// função que a IA usa (porta rh_alertas). Cada alerta cita a lei; nenhum valor de multa é estimado. Cada parte respeita
// a liberação de quem vê (saúde, dados pessoais, salário).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Info, ShieldAlert, Share2, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import * as Sentry from "@sentry/nextjs";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "../../../lib/supabaseBrowser";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { CentroCompartilhamento } from "../../../components/CentroCompartilhamento";
import AvisoAxioma from "../../../components/AvisoAxioma";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { AnimatedNumber } from "../../../components/AnimatedNumber";
import { PerguntaIA } from "../../../components/PerguntaIA";
import { LetreiroAxioma } from "../../../components/LetreiroAxioma";
import { NavRh } from "../../../components/NavRh";
import Link from "next/link";
import { useThemeAxioma } from "../../../lib/ThemeContext";
import { obterEmpresaAtiva } from "../../../lib/empresaHelpers";
import { corTema, FONTE_EXEC, fBRL2, optBarrasV } from "../../../lib/cfoCore";
import { gerarPdfTabela, gerarExcelTabela } from "../../../lib/gerarPdfTabela";
import { tratarFalhaExportacao } from "../../../lib/erroUiHelpers";
import { hojeISO } from "../../../lib/datas";
import { lerTodas } from "../../../lib/lerTodas";
import { painelRh, type Alerta } from "../../../lib/rhPainel";
import { ITENS_ADMISSAO } from "../../../lib/rhDocumentos";
import type { Lang } from "../../../lib/rhEstrutura";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
type Linha = Record<string, any>;
type Painel = ReturnType<typeof painelRh>;

export default function RhPainelPage() {
  const router = useRouter();
  const { idioma } = useLanguage();
  const lang = ((idioma as Lang) || "pt") as Lang;
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const { tema } = useThemeAxioma();
  const temaClaro = tema === "xms";
  const ct = (hex: string) => corTema(hex, temaClaro);
  const cartaoTema = temaClaro ? { fundo: "#f6f7c4", premium3d: true } : { premium3d: true };
  const TEXTO_SEC = temaClaro ? "#374151" : "var(--axi-text-secondary)";
  const BORDA = temaClaro ? "rgba(16,27,61,0.12)" : "rgba(163,177,194,0.15)";
  const VERDE = temaClaro ? "#0f7a5a" : "#2ecc9b";
  const NAVY = "#101b3d";
  const BTN = temaClaro ? "linear-gradient(135deg, #0b5f46, #0f7a5a)" : "linear-gradient(135deg, #0a4f3b, #0f7d5c)";
  const NIVEL = { critico: { cor: ct("#ef4444"), Icone: ShieldAlert, nome: L("Crítico", "Critical", "Crítico") }, atencao: { cor: (temaClaro ? "#9a3412" : ct("#f59e0b")), Icone: AlertTriangle, nome: L("Atenção", "Attention", "Atención") }, info: { cor: temaClaro ? NAVY : "#7dd3fc", Icone: Info, nome: L("Obrigação", "Obligation", "Obligación") } };

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [pode, setPode] = useState({ ver: false, pessoais: false, salario: false, saude: false, carregado: false });
  const [painel, setPainel] = useState<Painel | null>(null);
  const [deps, setDeps] = useState<Map<string, string>>(new Map());
  const [shareAberto, setShareAberto] = useState(false);
  const [aviso, setAviso] = useState<{ msg: string; tipo: "erro" | "ok" } | null>(null);
  const avisar = (msg: string, tipo: "erro" | "ok" = "erro") => { setAviso({ msg, tipo }); setTimeout(() => setAviso(null), 5000); };

  useEffect(() => { void (async () => {
    const eid = await obterEmpresaAtiva();
    if (!eid) return;
    setEmpresaId(eid);
    const r = await Promise.all(["ver", "pessoais", "salario", "saude"].map((a) => supabase.rpc("rh_pode", { p_empresa: eid, p_acao: a })));
    const p = { ver: !!r[0].data, pessoais: !!r[1].data, salario: !!r[2].data, saude: !!r[3].data, carregado: true };
    setPode(p);
    if (!p.ver) return;
    const ler = (t: string, cols: string, lixeira: boolean) => lerTodas(() => { const q = supabase.from(t).select(cols).eq("empresa_id", eid); return (lixeira ? q.is("excluido_em", null) : q).order("id"); });
    const nada = Promise.resolve({ data: null as Linha[] | null, error: null });
    const [cs, ks, its, rs, dp, em] = await Promise.all([
      ler("rh_colaboradores", "id, nome, nome_social, situacao", true),
      ler("rh_contratos", "id, colaborador_id, cargo_id, departamento_id, estabelecimento_id, cod_categ, data_admissao, data_termino, experiencia, data_desligamento, situacao_esocial", false),
      p.pessoais || p.saude ? ler("rh_admissao_itens", "id, colaborador_id, tipo, categoria, situacao", false) : nada,
      p.salario ? ler("rh_remuneracoes", "id, contrato_id, vigencia_inicio, valor", false) : nada,
      ler("rh_departamentos", "id, nome", true),
      ler("rh_empregador", "id", true),
    ]);
    const falha = [cs, ks, its, rs, dp, em].find((x) => x.error);
    if (falha?.error) { avisar(L("Não foi possível montar o painel agora. Recarregue a página.", "Could not build the panel now. Reload the page.", "No se pudo armar el panel ahora. Recargue la página.")); Sentry.captureException(new Error(`rh/painel: ${falha.error.message}`)); return; }
    const hoje = hojeISO();
    let sal: Map<string, number> | null = null;
    if (rs.data) { sal = new Map(); for (const x of [...(rs.data as Linha[])].filter((x) => x.vigencia_inicio <= hoje).sort((a, b) => String(b.vigencia_inicio).localeCompare(String(a.vigencia_inicio)))) if (!sal.has(x.contrato_id)) sal.set(x.contrato_id, Number(x.valor)); }
    const vivos = new Set((cs.data as Linha[]).map((c) => c.id));
    setDeps(new Map((dp.data as Linha[]).map((d) => [d.id, d.nome])));
    setPainel(painelRh({ hoje, colabs: cs.data as never, contratos: (ks.data as Linha[]).filter((k) => vivos.has(k.colaborador_id)) as never, itens: its.data as never, salarioPorContrato: sal,
      obrigatorios: { documento: ITENS_ADMISSAO.filter((i) => i.obrigatorio && i.categoria === "documento").map((i) => i.tipo), exame: ITENS_ADMISSAO.filter((i) => i.obrigatorio && i.categoria === "exame").map((i) => i.tipo) },
      podeDocs: p.pessoais, podeSaude: p.saude, temEmpregador: ((em.data as Linha[]) ?? []).length > 0 }));
  })(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const k = painel?.kpis;
  const cards = k ? [
    { l: L("Ativos", "Active", "Activos"), v: String(k.ativos), c: VERDE, ir: "/rh/colaboradores?filtro=ativo" },
    { l: L("Admissões no mês", "Hires this month", "Admisiones del mes"), v: String(k.admissoes_mes), c: temaClaro ? NAVY : "#7dd3fc", ir: "/rh/colaboradores?filtro=admitidos_mes" },
    { l: L("Desligamentos no mês", "Terminations this month", "Desvinculaciones del mes"), v: String(k.desligamentos_mes), c: TEXTO_SEC, ir: "/rh/colaboradores?filtro=desligados_mes" },
    { l: L("Rotatividade do mês", "Monthly turnover", "Rotación del mes"), v: k.rotatividade_mes_pct == null ? "—" : `${String(k.rotatividade_mes_pct).replace(".", ",")}%`, c: temaClaro ? NAVY : "#f59e0b", ir: "#formula" },
    ...(k.salarios_base_mensais != null ? [{ l: L("Salários-base mensais", "Monthly base salaries", "Salarios base mensuales"), v: `R$ ${fBRL2(k.salarios_base_mensais)}`, c: VERDE, ir: "/rh/colaboradores" }] : []),
  ] : [];
  const criticos = painel?.alertas.filter((a) => a.nivel === "critico").length ?? 0;
  const atencao = painel?.alertas.filter((a) => a.nivel === "atencao").length ?? 0;
  const depEntradas = Object.entries(painel?.ativos_por_departamento ?? {}).sort((a, b) => b[1] - a[1]);
  const optDepBase = optBarrasV(depEntradas.map(([, n]) => n), depEntradas.map(([id]) => (id === "sem" ? L("Sem depto.", "No dept.", "Sin depto.") : deps.get(id) ?? "—")), ct(VERDE), temaClaro ? "#34d399" : "#6ee7b7", undefined, temaClaro);
  // o gráfico conta PESSOAS: tira o R$ do eixo, da dica e do rótulo (optBarrasV é feito para dinheiro)
  const pessoas = (n: number) => `${n} ${n === 1 ? L("pessoa", "person", "persona") : L("pessoas", "people", "personas")}`;
  const optDep = { ...optDepBase,
    tooltip: { ...optDepBase.tooltip, formatter: (p: { name: string; value: number }) => `<b>${p.name}</b><br/>${pessoas(p.value)}` },
    yAxis: { ...optDepBase.yAxis, minInterval: 1, axisLabel: { ...optDepBase.yAxis.axisLabel, formatter: (v: number) => String(v) } },
    series: optDepBase.series.map((x: Record<string, any>) => ({ ...x, label: { ...x.label, formatter: (p: { value: number }) => (p.value > 0 ? String(p.value) : "") } })) };

  const linhasExport = (painel?.alertas ?? []).map((a) => ({ nivel: NIVEL[a.nivel].nome, alerta: a.titulo[lang], base: a.base, qtd: a.total ? String(a.total) : "—", pessoas: a.pessoas.join(", ") }));
  const exportar = (formato: "pdf" | "excel" = "pdf") => {
    try {
      (formato === "excel" ? gerarExcelTabela : gerarPdfTabela)({
        titulo: L("RH — Radar de Risco Trabalhista", "HR — Labor Risk Radar", "RR. HH. — Radar de Riesgo Laboral"), subtitulo: L("Cada alerta com a base legal", "Each alert with its legal basis", "Cada alerta con su base legal"),
        colunas: [{ header: L("Nível", "Level", "Nivel"), key: "nivel", width: 2 }, { header: L("Alerta", "Alert", "Alerta"), key: "alerta", width: 5 }, { header: L("Base legal", "Legal basis", "Base legal"), key: "base", width: 4 }, { header: L("Qtd.", "Qty.", "Cant."), key: "qtd", width: 1 }, { header: L("Pessoas", "People", "Personas"), key: "pessoas", width: 5 }],
        linhas: linhasExport, resumo: [{ label: L("Ativos", "Active", "Activos"), valor: String(k?.ativos ?? 0) }, { label: L("Críticos", "Critical", "Críticos"), valor: String(criticos) }],
        nomeArquivo: `axioma-rh-radar-${hojeISO()}.pdf`,
      }, (m) => avisar(m), lang);
    } catch (err) { avisar(tratarFalhaExportacao("rh-painel.exportar", err, lang)); }
  };
  const resumoShare = [`🚀 AXIOMA AI.TECH — ${L("RH · Painel", "HR · Panel", "RR. HH. · Panel")}`, `• ${L("Ativos", "Active", "Activos")}: ${k?.ativos ?? 0}`,
    `• ${L("Alertas críticos", "Critical alerts", "Alertas críticas")}: ${criticos} · ${L("atenção", "attention", "atención")}: ${atencao}`, ...(painel?.alertas ?? []).filter((a) => a.nivel !== "info").map((a) => `– ${a.titulo[lang]} (${a.total})`), `_axiomaai.com.br_`].join("\n");

  // parte da ficha que cada alerta abre quando se toca no nome da pessoa
  const SECAO_ALERTA: Record<string, string> = { sem_aso: "exames", docs_pendentes: "documentos", sem_salario: "salario", esocial_admissao: "esocial", sem_empregador: "esocial" };
  const CartaoAlerta = ({ a, i }: { a: Alerta; i: number }) => {
    const n = NIVEL[a.nivel];
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -2 }}
        className="rounded-xl p-3 md:p-4 axi-card-premium3d axi-card-faixa" style={{ background: temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)", border: `1px solid ${n.cor}40`, borderLeft: `4px solid ${n.cor}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--axi-text-primary)" }}><n.Icone size={16} style={{ color: n.cor, flexShrink: 0 }} /> {a.titulo[lang]}{a.total > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-black" style={{ background: `${n.cor}22`, color: n.cor }}>{a.total}</span>}</p>
            {a.pessoas.length > 0 && <p className="text-xs mt-1" style={{ color: TEXTO_SEC }}>{a.pessoas.map((p, j) => <span key={j}>{j > 0 && " · "}<Link href={`/rh/colaboradores?abrir=${a.ids[j]}&secao=${SECAO_ALERTA[a.id] ?? "contrato"}`} className="underline hover:opacity-80" title={L("Abrir a ficha", "Open the record", "Abrir la ficha")}>{p}</Link></span>)}{a.total > a.pessoas.length ? ` ${L(`e mais ${a.total - a.pessoas.length}`, `and ${a.total - a.pessoas.length} more`, `y ${a.total - a.pessoas.length} más`)}` : ""}</p>}
            <p className="text-xs mt-1 font-semibold" style={{ color: TEXTO_SEC }}>{L("Base", "Basis", "Base")}: {a.base}</p>
          </div>
          <Link href={a.total === 1 && a.ids[0] ? `/rh/colaboradores?abrir=${a.ids[0]}&secao=${SECAO_ALERTA[a.id] ?? "contrato"}` : a.acao.rota} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-transform hover:translate-x-0.5 active:scale-95" style={{ background: BTN, color: "#fff" }}>
            {a.acao.texto[lang]} <ArrowRight size={13} />
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <div data-theme={tema} style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <ModuloLayout titulo={L("RH", "HR", "RR. HH.")} subtitulo={L("O quadro de pessoas e o Radar de Risco Trabalhista, com a lei de cada alerta", "Headcount and the Labor Risk Radar, with the law behind each alert", "El cuadro de personas y el Radar de Riesgo Laboral, con la ley de cada alerta")}
        onExportarPDF={() => exportar("pdf")} onExportarExcel={() => exportar("excel")}
        headerFundo={temaClaro ? "linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)" : undefined} corExportar={temaClaro ? "linear-gradient(135deg, #16a97d, #2ecc9b)" : undefined} botaoExtra={<ThemeToggle />}>
        <div className="space-y-4">
          <NavRh lang={lang} temaClaro={temaClaro} />
          {pode.ver && k && <LetreiroAxioma id="rh-painel" cor="#101b3d" itens={[
            `${L("Ativos", "Active", "Activos")} ${k.ativos}`,
            ...(k.salarios_base_mensais != null ? [`${L("Salários-base", "Base salaries", "Salarios base")} R$ ${fBRL2(k.salarios_base_mensais)}`] : []),
            criticos + atencao > 0 ? `${L("Alertas no Radar", "Radar alerts", "Alertas en el Radar")} ${criticos + atencao}` : `${L("Radar sem alertas", "No radar alerts", "Radar sin alertas")} ✅`,
          ]} />}
          {pode.carregado && !pode.ver ? (
            <CanvasBox cor={VERDE} {...cartaoTema}>
              <div className="flex items-start gap-3 py-2"><ShieldCheck size={20} style={{ color: VERDE, flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--axi-text-primary)" }}>{L("Você não tem acesso ao RH desta Empresa. Peça ao Proprietário, CEO, Sócio ou Admin para liberar em RH · Estrutura → Acessos do RH.", "You do not have access to HR for this company. Ask the Owner, CEO, Partner or Admin to grant it in HR · Structure → HR access.", "No tiene acceso a RR. HH. de esta empresa. Pida al Propietario, CEO, Socio o Admin que lo habilite en RR. HH. · Estructura → Accesos de RR. HH.")}</p>
              </div>
            </CanvasBox>
          ) : !painel ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className={`grid grid-cols-2 md:grid-cols-3 ${cards.length > 4 ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-3`}>
                {cards.map((c, i) => (
                  <motion.div key={c.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="cursor-pointer" onClick={() => (c.ir.startsWith("#") ? document.querySelector(c.ir)?.scrollIntoView({ behavior: "smooth" }) : router.push(c.ir))}>
                    <CanvasBox cor={c.c} destaque {...cartaoTema}>
                      <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: TEXTO_SEC }}>{c.l}</p>
                      <p className="text-lg md:text-2xl font-black" style={{ color: c.c, ...FONTE_EXEC }}><AnimatedNumber value={c.v} /></p>
                    </CanvasBox>
                  </motion.div>
                ))}
              </div>

              <CanvasBox cor={criticos ? ct("#ef4444") : VERDE} {...cartaoTema}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                  <p className="text-sm font-black flex items-center gap-2" style={{ color: temaClaro ? NAVY : "var(--axi-text-primary)", ...FONTE_EXEC }}><ShieldAlert size={16} style={{ color: criticos ? ct("#ef4444") : VERDE }} /> {L("Radar de Risco Trabalhista", "Labor Risk Radar", "Radar de Riesgo Laboral")}</p>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: BTN, color: "#fff" }}><Share2 size={14} /> {L("Compartilhar", "Share", "Compartir")}</motion.button>
                </div>
                {painel.alertas.length === 0 ? (
                  <p className="text-sm font-semibold py-4" style={{ color: VERDE }}>{L("Nenhum risco encontrado nos dados de hoje.", "No risk found in today's data.", "Ningún riesgo encontrado en los datos de hoy.")}</p>
                ) : <div className="space-y-2">{painel.alertas.map((a, i) => <CartaoAlerta key={a.id} a={a} i={i} />)}</div>}
                {painel.proximos.map((p) => <Link key={p.pt} href="/rh/obrigacoes" className="block text-xs mt-2 font-semibold underline" style={{ color: (temaClaro ? "#9a3412" : ct("#f59e0b")) }}>⚠ {p[lang]} ›</Link>)}
                {(!pode.saude || !pode.pessoais) && <p className="text-xs mt-3" style={{ color: TEXTO_SEC }}>{L("Alguns alertas (exame admissional, documentos) só aparecem para quem tem liberação de saúde ou de dados pessoais.", "Some alerts (pre-employment exam, documents) only show for those with health or personal-data access.", "Algunas alertas (examen de admisión, documentos) solo aparecen para quien tiene salud o datos personales habilitados.")}</p>}
                <p className="text-xs mt-1" style={{ color: TEXTO_SEC }}>{L("Valores de multa não são estimados: dependem da fiscalização e da tabela vigente.", "Fine amounts are not estimated: they depend on inspection and the current table.", "Los montos de multa no se estiman: dependen de la fiscalización y la tabla vigente.")}</p>
              </CanvasBox>

              {depEntradas.length > 0 && (
                <CanvasBox cor={VERDE} {...cartaoTema}>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <p className="text-sm font-black" style={{ color: temaClaro ? NAVY : "var(--axi-text-primary)", ...FONTE_EXEC }}>{L("Ativos por departamento", "Active by department", "Activos por departamento")}</p>
                    <Link href="/rh/colaboradores" className="underline font-bold whitespace-nowrap" style={{ color: VERDE, fontSize: 12 }}>{L("Ver colaboradores ›", "See employees ›", "Ver colaboradores ›")}</Link>
                  </div>
                  <ReactECharts option={{ ...optDep, series: optDep.series.map((x: Record<string, any>) => ({ ...x, cursor: "pointer" })) }} style={{ height: 260, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }}
                    onEvents={{ click: (p: { dataIndex: number }) => { const id = depEntradas[p.dataIndex]?.[0]; if (id) router.push(`/rh/colaboradores?filtro=depto:${id}`); } }} />
                  <p className="text-xs mt-1" style={{ color: TEXTO_SEC }}>{L("Toque numa barra para ver as pessoas do departamento.", "Tap a bar to see the people in that department.", "Toque una barra para ver las personas del departamento.")}</p>
                </CanvasBox>
              )}
              <p id="formula" className="text-xs scroll-mt-28" style={{ color: TEXTO_SEC }}>{L("Rotatividade do mês = ((admissões + desligamentos) ÷ 2) ÷ ativos de hoje × 100.", "Monthly turnover = ((hires + terminations) ÷ 2) ÷ today's active × 100.", "Rotación del mes = ((admisiones + desvinculaciones) ÷ 2) ÷ activos de hoy × 100.")}</p>
              <PerguntaIA tela="rh" empresaId={empresaId} lang={lang} temaClaro={temaClaro} titulo={L("Inteligência Axioma — Especialista de RH", "Axioma Intelligence — HR Specialist", "Inteligencia Axioma — Especialista de RR. HH.")}
                sugestoes={[L("O que preciso resolver no RH hoje?", "What do I need to solve in HR today?", "¿Qué debo resolver en RR. HH. hoy?"), L("Tem algum risco trabalhista?", "Is there any labor risk?", "¿Hay algún riesgo laboral?"), L("Quantos ativos por departamento?", "How many active per department?", "¿Cuántos activos por departamento?")]} />
            </>
          )}
        </div>
        <CentroCompartilhamento aberto={shareAberto} onFechar={() => setShareAberto(false)} lang={lang} textoResumo={resumoShare} assunto={L("RH — Radar de Risco — Axioma", "HR — Risk Radar — Axioma", "RR. HH. — Radar de Riesgo — Axioma")} onExportarPDF={() => exportar("pdf")} cor="#0f7a5a" />
        <AvisoAxioma aviso={aviso} onFechar={() => setAviso(null)} />
      </ModuloLayout>
    </div>
  );
}
