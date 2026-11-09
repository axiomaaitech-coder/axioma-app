"use client";
// RH · Colaboradores (Fase 1, subfase 6). Pessoa + contrato + dados pessoais + salário.
// Cada parte só aparece para quem tem a liberação (rh_pode v2); a trava de verdade está no banco (RLS),
// esta tela só esconde o que a pessoa não pode ver. Lista paginada no servidor (feita para 10 mil pessoas).
import { createContext, useContext, useEffect, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Pencil, Trash2, X, Share2, RotateCcw, Search, ShieldCheck, UserPlus, AlertTriangle, Upload, Download, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/nextjs";
import { useLanguage } from "../../../../lib/LanguageContext";
import { createBrowserClient } from "../../../../lib/supabaseBrowser";
import ModuloLayout from "../../../../components/ModuloLayout";
import { CanvasBox } from "../../../../components/CanvasBox";
import { CentroCompartilhamento } from "../../../../components/CentroCompartilhamento";
import AvisoAxioma from "../../../../components/AvisoAxioma";
import { ThemeToggle } from "../../../../components/ThemeToggle";
import { AnimatedNumber } from "../../../../components/AnimatedNumber";
import { useConfirmarExclusao } from "../../../../components/ConfirmarExclusao";
import { PerguntaIA } from "../../../../components/PerguntaIA";
import { BotaoAcao } from "../../../../components/BotaoAcao";
import ImportarPlanilha from "./ImportarPlanilha";
import { LetreiroAxioma } from "../../../../components/LetreiroAxioma";
import { NavRh } from "../../../../components/NavRh";
import Link from "next/link";
import { lerTodas } from "../../../../lib/lerTodas";
import { exportarPlanilhaAbas } from "../../../../lib/exportarPlanilha";
import { COLUNAS, linhaPlanilha } from "../../../../lib/rhImportacao";
import { FileSpreadsheet } from "lucide-react";
import { useThemeAxioma } from "../../../../lib/ThemeContext";
import { obterEmpresaAtiva, listarEquipe, validarCNPJ } from "../../../../lib/empresaHelpers";
import { corTema, FONTE_EXEC, fBRL2 } from "../../../../lib/cfoCore";
import { gerarPdfTabela, gerarExcelTabela } from "../../../../lib/gerarPdfTabela";
import { tratarFalhaExportacao } from "../../../../lib/erroUiHelpers";
import { hojeISO } from "../../../../lib/datas";
import { DIAS_LIXEIRA_RH } from "../../../../lib/nexusRetencao";
import { lerValorBR } from "../../../../lib/valorBR";
import { consultarCEP, mascaraCPF, mascaraCEP, mascaraCNPJ, mascaraTelefone, validarCPF, UFS } from "../../../../lib/enderecoHelpers";
import { pendenciasS2200, gerarS2200, pendenciasS2205, gerarS2205, pendenciasS2206, gerarS2206, pendenciasS2299, gerarS2299, VERSAO_LEIAUTE, type DadosS2200, type DadosS2299, type Pendencia } from "../../../../lib/rhEsocial";
import { calcularRescisao, salarioMensalDe, REGRAS_MOTIVO, type Motivo, type RegrasFolha, type ResultadoRescisao } from "../../../../lib/rhRescisao";
import { ITENS_ADMISSAO, PROIBIDOS } from "../../../../lib/rhDocumentos";
import { mensagemErroRh, type Lang } from "../../../../lib/rhEstrutura";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
type Linha = Record<string, any>;
const POR_PAGINA = 50;
const SITUACOES = ["ativo", "pre_admissao", "afastado", "desligado"] as const;
const dias = (iso?: string | null) => (iso ? Math.round((new Date(iso + "T12:00:00").getTime() - new Date(hojeISO() + "T12:00:00").getTime()) / 86400000) : null);
const dataBR = (iso?: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");
const soDig = (v: unknown) => String(v ?? "").replace(/\D/g, "");


type CtxForm = { form: Linha; setForm: Dispatch<SetStateAction<Linha | null>>; campo: CSSProperties; ROTULO: string; TEXTO_SEC: string; NESTED_BG: string; BORDA: string; titulo: string };
const FormCtx = createContext<CtxForm | null>(null);
function F({ k, r, tipo = "text", opcoes, ajuda, largo, mascara, lista, erro, aoMudar, modo }: {
  k: string; r: string; tipo?: string; opcoes?: { v: string; l: string }[]; ajuda?: string; largo?: boolean
  mascara?: (v: string) => string; lista?: string; erro?: string | null; aoMudar?: (v: string) => void; modo?: "numeric" | "email" | "tel"
}) {
  const c = useContext(FormCtx)!;
  const mudar = (bruto: string) => { const v = mascara ? mascara(bruto) : bruto; c.setForm((f) => (f ? { ...f, [k]: v } : f)); aoMudar?.(v); };
  return (
    <div className={largo ? "md:col-span-2" : ""}>
      <label htmlFor={`col-${k}`} className="text-xs font-semibold mb-1.5 block" style={{ color: c.ROTULO }}>{r}</label>
      {opcoes ? (
        <select id={`col-${k}`} value={c.form[k] ?? ""} onChange={(e) => mudar(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={c.campo}>
          {opcoes.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input id={`col-${k}`} type={tipo} list={lista} inputMode={modo} autoComplete="off" value={c.form[k] ?? ""} onChange={(e) => mudar(e.target.value)}
          aria-invalid={!!erro} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={{ ...c.campo, ...(erro ? { borderColor: "#ef4444" } : {}) }} />
      )}
      {erro ? <p className="text-xs mt-1 font-semibold" style={{ color: "#ef4444" }}>{erro}</p> : ajuda && <p className="text-xs mt-1" style={{ color: c.TEXTO_SEC }}>{ajuda}</p>}
    </div>
  );
}
function Secao({ titulo, children, ancora }: { titulo: string; children: ReactNode; ancora?: string }) {
  const c = useContext(FormCtx)!;
  return (
    <div id={ancora ? `sec-${ancora}` : undefined} className="rounded-xl p-3 md:p-4 mt-3 scroll-mt-4 transition-shadow" style={{ background: c.NESTED_BG, border: `1px solid ${c.BORDA}` }}>
      <p className="text-sm font-black mb-3" style={{ color: c.titulo, ...FONTE_EXEC }}>{titulo}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export default function RhColaboradoresPage() {
  const { idioma } = useLanguage();
  const lang = ((idioma as Lang) || "pt") as Lang;
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const { tema } = useThemeAxioma();
  const temaClaro = tema === "xms";
  const ct = (hex: string) => corTema(hex, temaClaro);
  const { confirmar, janelaConfirmacao } = useConfirmarExclusao(temaClaro);
  const cartaoTema = temaClaro ? { fundo: "#f6f7c4", premium3d: true } : { premium3d: true };
  const TEXTO_SEC = temaClaro ? "#374151" : "var(--axi-text-secondary)";
  const NESTED_BG = temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)";
  const BORDA = temaClaro ? "rgba(16,27,61,0.12)" : "rgba(163,177,194,0.15)";
  const ROTULO = temaClaro ? "#101b3d" : ct("#5a8fd4");
  const BTN = temaClaro ? "linear-gradient(135deg, #0b5f46, #0f7a5a)" : "linear-gradient(135deg, #0a4f3b, #0f7d5c)";
  const VERDE = temaClaro ? "#0f7a5a" : "#2ecc9b";
  const NAVY = "#101b3d";
  const campo: CSSProperties = { background: temaClaro ? "#ffffff" : "rgba(10,22,40,0.9)", border: `1px solid ${BORDA}`, color: "var(--axi-text-primary)" };

  const nomeSit = (s: string) => ({ ativo: L("Ativo", "Active", "Activo"), pre_admissao: L("Pré-admissão", "Pre-hire", "Pre-admisión"), afastado: L("Afastado", "On leave", "Apartado"), desligado: L("Desligado", "Terminated", "Desvinculado") } as Record<string, string>)[s] ?? s;

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [pode, setPode] = useState({ ver: false, editar: false, pessoais: false, salario: false, saude: false, carregado: false });
  const [paises, setPaises] = useState<{ codigo: string; nome: string }[]>([]);
  const [cepMsg, setCepMsg] = useState<string | null>(null);
  const [ref, setRef] = useState<{ cargos: Linha[]; deps: Linha[]; filiais: Linha[]; lotacoes: Linha[]; centros: Linha[]; categorias: Linha[]; gestores: Linha[] }>({ cargos: [], deps: [], filiais: [], lotacoes: [], centros: [], categorias: [], gestores: [] });
  const [lista, setLista] = useState<Linha[]>([]);
  const [contratos, setContratos] = useState<Record<string, Linha>>({});
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [busca, setBusca] = useState("");
  const [filtroSit, setFiltroSit] = useState<string>("ativo");
  const [kpi, setKpi] = useState({ ativos: 0, experiencia: 0, pre: 0, desligados: 0 });
  const [carregando, setCarregando] = useState(true);
  const [verLixeira, setVerLixeira] = useState(false);
  // filtro especial vindo do Painel/Radar (admitidos no mês, sem cargo…): lista só essas pessoas
  const [filtroEsp, setFiltroEsp] = useState<string | null>(null);
  const [linkLido, setLinkLido] = useState(false);
  const [form, setForm] = useState<Linha | null>(null);
  const [historico, setHistorico] = useState<Linha[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [importAberto, setImportAberto] = useState(false);
  const [exportandoXls, setExportandoXls] = useState(false);
  const [aviso, setAviso] = useState<{ msg: string; tipo: "erro" | "ok" } | null>(null);
  const avisar = (msg: string, tipo: "erro" | "ok" = "erro") => { setAviso({ msg, tipo }); setTimeout(() => setAviso(null), 5000); };

  async function iniciar() {
    const eid = await obterEmpresaAtiva();
    if (!eid) { setCarregando(false); return; }
    setEmpresaId(eid);
    const acoes = ["ver", "editar", "pessoais", "salario", "saude"];
    const r = await Promise.all(acoes.map((a) => supabase.rpc("rh_pode", { p_empresa: eid, p_acao: a })));
    const p = { ver: !!r[0].data, editar: !!r[1].data, pessoais: !!r[2].data, salario: !!r[3].data, saude: !!r[4].data, carregado: true };
    if (p.pessoais) {
      const { data: ps, error: eP } = await supabase.from("esocial_tab06_pais").select("codigo, nome").is("extincao", null).order("nome");
      if (eP) avisar(L("Não foi possível carregar a lista de países.", "Could not load the country list.", "No se pudo cargar la lista de países.")); else setPaises(ps ?? []);
    }
    setPode(p);
    if (!p.ver) { setCarregando(false); return; }
    const sel = (t: string, campos: string, ordem: string) => supabase.from(t).select(campos).eq("empresa_id", eid).is("excluido_em", null).order(ordem).limit(2000);
    const [cg, dp, fl, lt, cc, cat] = await Promise.all([
      sel("rh_cargos", "id, nome, cbo, departamento_id", "nome"), sel("rh_departamentos", "id, nome", "nome"),
      sel("rh_estabelecimentos", "id, nome, nr_insc", "nome"), sel("rh_lotacoes", "id, nome, cod_lotacao", "cod_lotacao"),
      supabase.from("centros_custo").select("id, nome").eq("empresa_id", eid).order("nome"),
      supabase.from("esocial_tab01_categoria").select("codigo, grupo, descricao, termino").order("codigo"),
    ]);
    const erro = [cg, dp, fl, lt, cc, cat].find((x) => x.error);
    if (erro?.error) { avisar(L("Não foi possível carregar os cadastros do RH. Recarregue a página.", "Could not load HR records. Reload the page.", "No se pudieron cargar los registros de RR. HH. Recargue la página.")); Sentry.captureException(new Error(`rh/colaboradores ref: ${erro.error.message}`)); }
    setRef({ cargos: cg.data ?? [], deps: dp.data ?? [], filiais: fl.data ?? [], lotacoes: lt.data ?? [], centros: cc.data ?? [], categorias: (cat.data ?? []).filter((c: Linha) => !c.termino), gestores: [] });
  }
  useEffect(() => { void iniciar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function carregarKpis(eid: string) {
    const conta = (q: any) => q.then((r: any) => r.count ?? 0);
    const base = () => supabase.from("rh_colaboradores").select("id", { count: "exact", head: true }).eq("empresa_id", eid).is("excluido_em", null);
    const em30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const [a, p, d, e] = await Promise.all([
      conta(base().eq("situacao", "ativo")), conta(base().eq("situacao", "pre_admissao")), conta(base().eq("situacao", "desligado")),
      conta(supabase.from("rh_contratos").select("id", { count: "exact", head: true }).eq("empresa_id", eid).eq("experiencia", true).is("data_desligamento", null).gte("data_termino", hojeISO()).lte("data_termino", em30)),
    ]);
    setKpi({ ativos: a, pre: p, desligados: d, experiencia: e });
  }

  // quem entra em cada filtro do Painel (lido do banco, não da página aberta)
  async function idsDoFiltro(f: string): Promise<string[] | null> {
    const mes = hojeISO().slice(0, 7), ini = `${mes}-01`;
    const fim = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).toISOString().slice(0, 10);
    const base = () => supabase.from("rh_contratos").select("colaborador_id, id, cargo_id").eq("empresa_id", empresaId!);
    let r;
    if (f === "admitidos_mes") r = await base().gte("data_admissao", ini).lte("data_admissao", fim);
    else if (f === "desligados_mes") r = await base().gte("data_desligamento", ini).lte("data_desligamento", fim);
    else if (f === "sem_cargo") r = await base().is("cargo_id", null).is("data_desligamento", null);
    else if (f === "sem_salario") {
      const [k, rm] = await Promise.all([base().is("data_desligamento", null), supabase.from("rh_remuneracoes").select("contrato_id").eq("empresa_id", empresaId!)]);
      if (k.error || rm.error) { avisar(L("Não foi possível aplicar o filtro agora.", "Could not apply the filter now.", "No se pudo aplicar el filtro ahora.")); return null; }
      const com = new Set((rm.data ?? []).map((x: Linha) => x.contrato_id));
      return (k.data ?? []).filter((x: Linha) => !com.has(x.id)).map((x: Linha) => x.colaborador_id);
    } else return [];
    if (r.error) { avisar(L("Não foi possível aplicar o filtro agora.", "Could not apply the filter now.", "No se pudo aplicar el filtro ahora.")); return null; }
    return [...new Set((r.data ?? []).map((x: Linha) => x.colaborador_id))];
  }
  async function carregarLista() {
    if (!empresaId || !pode.ver) return;
    setCarregando(true);
    let q = supabase.from("rh_colaboradores").select("id, nome, nome_social, situacao, excluido_em", { count: "exact" }).eq("empresa_id", empresaId);
    if (verLixeira) q = q.gte("excluido_em", new Date(Date.now() - DIAS_LIXEIRA_RH * 86400000).toISOString()).order("excluido_em", { ascending: false });
    else { q = q.is("excluido_em", null).order("nome"); if (filtroSit) q = q.eq("situacao", filtroSit); }
    if (filtroEsp && !verLixeira) {
      const ids = await idsDoFiltro(filtroEsp);
      if (ids === null) { setCarregando(false); return; }
      q = q.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    }
    if (busca.trim()) q = q.ilike("nome", `%${busca.trim().replace(/[%_]/g, "")}%`);
    const { data, count, error } = await q.range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA - 1);
    if (error) { avisar(L("Não foi possível carregar os colaboradores agora.", "Could not load employees now.", "No se pudieron cargar los colaboradores ahora.")); Sentry.captureException(new Error(`rh/colaboradores lista: ${error.message}`)); setCarregando(false); return; }
    setLista(data ?? []); setTotal(count ?? 0);
    const ids = (data ?? []).map((x: Linha) => x.id);
    if (ids.length) {
      const { data: ks, error: eK } = await supabase.from("rh_contratos").select("*").in("colaborador_id", ids).order("data_admissao", { ascending: false });
      // Sem os contratos a lista mostraria cargo e admissão vazios como se não existissem: avisa.
      if (eK) { avisar(L("Não foi possível ler os dados agora. Tente de novo em instantes.", "Could not read the data now. Try again shortly.", "No se pudieron leer los datos ahora. Intente de nuevo en instantes.")); Sentry.captureException(new Error(`rh/colaboradores contratos: ${eK.message}`)); }
      const mapa: Record<string, Linha> = {};
      (ks ?? []).forEach((k: Linha) => { if (!mapa[k.colaborador_id]) mapa[k.colaborador_id] = k; });
      setContratos(mapa);
    } else setContratos({});
    void carregarKpis(empresaId);
    setCarregando(false);
  }
  useEffect(() => { void carregarLista(); }, [empresaId, pode.ver, pagina, filtroSit, verLixeira, filtroEsp]); // eslint-disable-line react-hooks/exhaustive-deps
  // links diretos: /rh/colaboradores?filtro=… (lista filtrada) e ?abrir=<pessoa>&secao=<parte> (abre a ficha na parte certa)
  useEffect(() => {
    if (linkLido || !empresaId || !pode.carregado) return;
    const sp = new URLSearchParams(window.location.search);
    const f = sp.get("filtro"), abrir = sp.get("abrir"), secao = sp.get("secao");
    void (async () => {
      setLinkLido(true);
      if (f === "ativo" || f === "pre_admissao" || f === "desligado") { setFiltroSit(f); setFiltroEsp(null); }
      else if (f) { setFiltroSit(f === "desligados_mes" ? "" : "ativo"); if (f === "admitidos_mes") setFiltroSit(""); setFiltroEsp(f); }
      if (abrir && pode.ver) await abrirPorId(abrir, secao);
    })();
  }, [empresaId, pode.carregado]); // eslint-disable-line react-hooks/exhaustive-deps
  async function abrirPorId(id: string, secao: string | null) {
    const [c, k] = await Promise.all([
      supabase.from("rh_colaboradores").select("id, nome, nome_social, situacao, excluido_em").eq("id", id).maybeSingle(),
      supabase.from("rh_contratos").select("*").eq("colaborador_id", id).order("data_admissao", { ascending: false }).limit(1),
    ]);
    if (c.error || k.error || !c.data) { avisar(L("Não foi possível abrir esta pessoa (ela pode ter ido para a lixeira).", "Could not open this person (they may be in the trash).", "No se pudo abrir esta persona (puede estar en la papelera).")); return; }
    const contrato = (k.data ?? [])[0];
    if (contrato) setContratos((m) => ({ ...m, [id]: contrato }));
    await abrirEdicao(c.data, contrato);
    if (secao) irParaSecao(secao === "exames" ? "documentos" : secao);
  }
  // rola até a parte da ficha e destaca por 2 segundos
  function irParaSecao(secao: string) {
    let tent = 0;
    const tenta = () => {
      const el = document.getElementById(`sec-${secao}`);
      if (!el) { if (tent++ < 20) setTimeout(tenta, 250); return; }
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.style.boxShadow = "0 0 0 3px #2ecc9b";
      setTimeout(() => { el.style.boxShadow = ""; }, 2200);
    };
    setTimeout(tenta, 300);
  }
  useEffect(() => { const t = setTimeout(() => { setPagina(0); void carregarLista(); }, 350); return () => clearTimeout(t); }, [busca]); // eslint-disable-line react-hooks/exhaustive-deps

  async function gestoresPossiveis() {
    if (!empresaId) return [];
    const { data, error } = await supabase.from("rh_colaboradores").select("id, nome").eq("empresa_id", empresaId).is("excluido_em", null).in("situacao", ["ativo", "afastado"]).order("nome").limit(500);
    if (error) { avisar(L("Não foi possível ler os dados agora. Tente de novo em instantes.", "Could not read the data now. Try again shortly.", "No se pudieron leer los datos ahora. Intente de nuevo en instantes.")); Sentry.captureException(new Error(`rh/colaboradores gestores: ${error.message}`)); }
    return data ?? [];
  }

  async function abrirNovo() {
    setHistorico([]); setCepMsg(null); const g = await gestoresPossiveis(); setRef((r) => ({ ...r, gestores: g }));
    setForm({ nome: "", nome_social: "", situacao: "ativo", matricula: "", cod_categ: "101", data_admissao: hojeISO(), tp_contr: "1", experiencia: false, data_termino: "", qtd_hrs_sem: "44", tp_jornada: "4", tp_reg_jor: "1", nat_atividade: "1", tmp_parc: "0", hor_noturno: "N",
      pais_nascimento_txt: "105 — Brasil", pais_nacionalidade_txt: "105 — Brasil", und_sal_fixo: "5", valor: "", reajuste_valor: "", reajuste_data: hojeISO(), reajuste_motivo: "reajuste_coletivo" });
  }
  async function abrirEdicao(c: Linha, kDireto?: Linha) {
    setCepMsg(null);
    const g = await gestoresPossiveis(); setRef((r) => ({ ...r, gestores: g.filter((x: Linha) => x.id !== c.id) }));
    const k = kDireto ?? contratos[c.id] ?? {};
    let pes: Linha = {};
    // Leitura que falha não abre o formulário vazio (pareceria que a pessoa não tem CPF ou salário): avisa e para.
    if (pode.pessoais) {
      const { data, error } = await supabase.from("rh_colaborador_pessoal").select("*").eq("colaborador_id", c.id).maybeSingle();
      if (error) { avisar(L("Não foi possível ler os dados agora. Tente de novo em instantes.", "Could not read the data now. Try again shortly.", "No se pudieron leer los datos ahora. Intente de nuevo en instantes.")); Sentry.captureException(new Error(`rh/colaboradores pessoal: ${error.message}`)); return; }
      pes = data ?? {};
    }
    let pcd: Linha = {};
    if (pode.saude) {
      const { data, error } = await supabase.from("rh_colaborador_pcd").select("*").eq("colaborador_id", c.id).maybeSingle();
      if (error) { avisar(L("Não foi possível ler os dados agora. Tente de novo em instantes.", "Could not read the data now. Try again shortly.", "No se pudieron leer los datos ahora. Intente de nuevo en instantes.")); Sentry.captureException(new Error(`rh/colaboradores pcd: ${error.message}`)); return; }
      pcd = data ?? {};
    }
    if (pode.salario && k.id) {
      const { data, error } = await supabase.from("rh_remuneracoes").select("*").eq("contrato_id", k.id).order("vigencia_inicio", { ascending: false });
      if (error) { avisar(L("Não foi possível ler os dados agora. Tente de novo em instantes.", "Could not read the data now. Try again shortly.", "No se pudieron leer los datos ahora. Intente de nuevo en instantes.")); Sentry.captureException(new Error(`rh/colaboradores salario: ${error.message}`)); return; }
      setHistorico(data ?? []);
    } else setHistorico([]);
    const s = (v: unknown) => (v == null ? "" : String(v));
    setForm({ id: c.id, contrato_id: k.id ?? null, nome: c.nome, nome_social: s(c.nome_social), situacao: c.situacao,
      matricula: s(k.matricula), cod_categ: s(k.cod_categ || "101"), data_admissao: s(k.data_admissao), tp_contr: s(k.tp_contr || 1), experiencia: !!k.experiencia, data_termino: s(k.data_termino),
      cargo_id: s(k.cargo_id), departamento_id: s(k.departamento_id), estabelecimento_id: s(k.estabelecimento_id), lotacao_id: s(k.lotacao_id), centro_custo_id: s(k.centro_custo_id), gestor_id: s(k.gestor_id),
      qtd_hrs_sem: s(k.qtd_hrs_sem), tp_jornada: s(k.tp_jornada), data_desligamento: s(k.data_desligamento), contrato_situacao: k.situacao_esocial ?? "rascunho",
      tp_reg_jor: s(k.tp_reg_jor ?? 1), nat_atividade: s(k.nat_atividade ?? 1), tmp_parc: s(k.tmp_parc ?? 0), hor_noturno: k.hor_noturno == null ? "" : k.hor_noturno ? "S" : "N", dsc_jorn: s(k.dsc_jorn),
      clau_assec: k.clau_assec == null ? "" : k.clau_assec ? "S" : "N", obj_det: s(k.obj_det), data_base: s(k.data_base), cnpj_sindicato: mascaraCNPJ(s(k.cnpj_sindicato)), dsc_sal_var: s(k.dsc_sal_var),
      apr_ind: s(k.apr_ind), apr_cnpj_ent_qual: mascaraCNPJ(s(k.apr_cnpj_ent_qual)), apr_tp_insc: s(k.apr_tp_insc || 1), apr_nr_insc: s(k.apr_nr_insc), apr_cnpj_prat: mascaraCNPJ(s(k.apr_cnpj_prat)),
      temp_hip_leg: s(k.temp_hip_leg), temp_just_contr: s(k.temp_just_contr), temp_tomador_tp_insc: s(k.temp_tomador_tp_insc || 1), temp_tomador_nr_insc: s(k.temp_tomador_nr_insc),
      temp_cpf_substituidos: ((k.temp_cpf_substituidos as string[] | null) ?? []).map((x) => mascaraCPF(x)).join(", "),
      lt_cep: mascaraCEP(s(k.lt_cep)), lt_logradouro: s(k.lt_logradouro), lt_numero: s(k.lt_numero), lt_complemento: s(k.lt_complemento), lt_bairro: s(k.lt_bairro), lt_cod_munic: s(k.lt_cod_munic), lt_uf: s(k.lt_uf),
      tem_pcd: !!pcd.colaborador_id, pcd_def_fisica: !!pcd.def_fisica, pcd_def_visual: !!pcd.def_visual, pcd_def_auditiva: !!pcd.def_auditiva, pcd_def_mental: !!pcd.def_mental,
      pcd_def_intelectual: !!pcd.def_intelectual, pcd_reab_readap: !!pcd.reab_readap, pcd_info_cota: pcd.info_cota == null ? "" : pcd.info_cota ? "S" : "N", pcd_observacao: s(pcd.observacao),
      tem_pessoal: !!pes.colaborador_id, cpf: mascaraCPF(s(pes.cpf)), data_nascimento: s(pes.data_nascimento), sexo: s(pes.sexo), raca_cor: s(pes.raca_cor), estado_civil: s(pes.estado_civil), grau_instr: s(pes.grau_instr),
      pais_nascimento_txt: rotuloPais(s(pes.pais_nascimento || "105")), pais_nacionalidade_txt: rotuloPais(s(pes.pais_nacionalidade || "105")), cep: mascaraCEP(s(pes.cep)), logradouro: s(pes.logradouro), numero: s(pes.numero), complemento: s(pes.complemento),
      bairro: s(pes.bairro), cidade: s(pes.cidade), uf: s(pes.uf), cod_munic: s(pes.cod_munic), imig_tmp_resid: s(pes.imig_tmp_resid), imig_cond_ing: s(pes.imig_cond_ing), telefone: s(pes.telefone), email: s(pes.email), emergencia_nome: s(pes.emergencia_nome), emergencia_telefone: s(pes.emergencia_telefone),
      und_sal_fixo: "5", valor: "", reajuste_valor: "", reajuste_data: hojeISO(), reajuste_motivo: "reajuste_coletivo" });
  }

  const nulo = (v: unknown) => (String(v ?? "").trim() === "" ? null : String(v).trim());
  const rotuloPais = (cod: string) => { const p = paises.find((x) => x.codigo === cod); return p ? `${p.codigo} — ${p.nome}` : cod; };
  const codigoPais = (txt: unknown) => { const t = String(txt ?? "").trim(); const p = paises.find((x) => `${x.codigo} — ${x.nome}` === t || x.codigo === t.slice(0, 3) || x.nome.toLowerCase() === t.toLowerCase()); return p?.codigo ?? null; };
  // CEP com 8 dígitos: busca na nossa rota (ViaCEP) e preenche endereço, bairro, cidade e UF. Número e complemento ficam com a pessoa.
  async function preencherPorCep(v: string) {
    if (soDig(v).length !== 8) { setCepMsg(null); return; }
    setCepMsg(L("Buscando o endereço…", "Looking up the address…", "Buscando la dirección…"));
    const r = await consultarCEP(v);
    if ("erro" in r) { setCepMsg(r.codigo === "nao_encontrado" ? L("CEP não encontrado. Preencha o endereço à mão.", "Postal code not found. Fill in the address manually.", "CEP no encontrado. Complete la dirección a mano.") : L("Busca de CEP indisponível agora. Preencha o endereço à mão.", "Postal code lookup unavailable now. Fill in the address manually.", "Búsqueda de CEP no disponible. Complete la dirección a mano.")); return; }
    setForm((f) => (f ? { ...f, logradouro: r.logradouro || f.logradouro, bairro: r.bairro || f.bairro, cidade: r.cidade || f.cidade, uf: r.uf || f.uf, cod_munic: r.ibge || f.cod_munic } : f));
    setCepMsg(L("Endereço preenchido pelo CEP. Confira e informe o número.", "Address filled from the postal code. Check it and add the number.", "Dirección completada por el CEP. Revise e informe el número."));
  }
  async function preencherLtPorCep(v: string) {
    if (soDig(v).length !== 8) return;
    const r = await consultarCEP(v);
    if ("erro" in r) { avisar(L("CEP do local de trabalho não encontrado: preencha à mão.", "Workplace postal code not found: fill it in manually.", "CEP del lugar de trabajo no encontrado: complételo a mano.")); return; }
    setForm((f) => (f ? { ...f, lt_logradouro: r.logradouro || f.lt_logradouro, lt_bairro: r.bairro || f.lt_bairro, lt_uf: r.uf || f.lt_uf, lt_cod_munic: r.ibge || f.lt_cod_munic } : f));
  }
  async function salvar(): Promise<boolean> {
    if (!form || !empresaId) return false;
    if (String(form.nome).trim().length < 2) { avisar(L("Informe o nome (mínimo 2 letras).", "Enter the name (at least 2 letters).", "Informe el nombre (mínimo 2 letras).")); return false; }
    if (!String(form.matricula).trim()) { avisar(L("Informe a matrícula.", "Enter the employee ID.", "Informe la matrícula.")); return false; }
    if (!form.data_admissao) { avisar(L("Informe a data de admissão.", "Enter the hire date.", "Informe la fecha de admisión.")); return false; }
    if (pode.pessoais && soDig(form.cpf) && !validarCPF(soDig(form.cpf))) { avisar(L("CPF inválido: confira os números.", "Invalid CPF: check the numbers.", "CPF inválido: revise los números.")); return false; }
    if (pode.pessoais && (soDig(form.cpf) || form.tem_pessoal) && (!codigoPais(form.pais_nascimento_txt) || !codigoPais(form.pais_nacionalidade_txt))) { avisar(L("Escolha o país na lista (comece a digitar o nome).", "Pick the country from the list (start typing the name).", "Elija el país en la lista (empiece a escribir el nombre).")); return false; }
    const salTxt = !form.id ? form.valor : form.reajuste_valor;
    if (pode.salario && nulo(salTxt) && Number(form.und_sal_fixo) !== 7 && !(lerValorBR(String(salTxt)) > 0)) { avisar(L("Salário inválido: use o formato 2.500,00.", "Invalid salary: use the format 2,500.00.", "Salario inválido: use el formato 2.500,00.")); return false; }
    if (nulo(form.qtd_hrs_sem) && !(lerValorBR(String(form.qtd_hrs_sem)) > 0)) { avisar(L("Horas por semana inválidas.", "Invalid weekly hours.", "Horas por semana inválidas.")); return false; }
    if (String(form.tp_contr) === "3" && !nulo(form.obj_det)) { avisar(L("Informe o objeto do contrato (obra, serviço, safra).", "Enter the contract purpose (project, service, harvest).", "Informe el objeto del contrato (obra, servicio, cosecha).")); return false; }
    const cat = String(form.cod_categ);
    const cpfsSubst = String(form.temp_cpf_substituidos ?? "").split(/[,;\s]+/).map(soDig).filter(Boolean);
    if (cat === "106" && cpfsSubst.some((x) => !validarCPF(x))) { avisar(L("Temporário: algum CPF de quem está sendo substituído é inválido.", "Temporary: a replaced worker's CPF is invalid.", "Temporal: algún CPF de quien es sustituido es inválido.")); return false; }
    if (cat === "106" && cpfsSubst.length > 9) { avisar(L("Temporário: no máximo 9 pessoas substituídas.", "Temporary: at most 9 replaced workers.", "Temporal: como máximo 9 personas sustituidas.")); return false; }
    for (const [campoCnpj, nome] of [["apr_cnpj_ent_qual", L("CNPJ da entidade qualificadora", "Training entity CNPJ", "CNPJ de la entidad calificadora")], ["apr_cnpj_prat", L("CNPJ do local das atividades práticas", "Practical activities CNPJ", "CNPJ del lugar de las actividades prácticas")]] as const) {
      if (cat === "103" && soDig(form[campoCnpj]) && !validarCNPJ(soDig(form[campoCnpj]))) { avisar(L(`${nome} inválido.`, `Invalid ${nome}.`, `${nome} inválido.`)); return false; }
    }
    if (soDig(form.cnpj_sindicato) && !validarCNPJ(soDig(form.cnpj_sindicato))) { avisar(L("CNPJ do sindicato inválido: confira os números.", "Invalid union CNPJ: check the numbers.", "CNPJ del sindicato inválido: revise los números.")); return false; }
    setSalvando(true);
    const novo = !form.id;
    const pessoa = { empresa_id: empresaId, nome: String(form.nome).trim(), nome_social: nulo(form.nome_social), situacao: form.situacao };
    const r1 = novo ? await supabase.from("rh_colaboradores").insert(pessoa).select("id").single() : await supabase.from("rh_colaboradores").update(pessoa).eq("id", form.id).select("id").single();
    if (r1.error || !r1.data) { setSalvando(false); avisar(mensagemErroRh(r1.error, lang)); return false; }
    const cid = r1.data.id as string;
    // desfaz a pessoa criada agora se o restante falhar (não deixa cadastro pela metade)
    const desfazer = async (erro: unknown) => { if (novo) await supabase.from("rh_colaboradores").delete().eq("id", cid); setSalvando(false); avisar(mensagemErroRh(erro as { code?: string; message?: string }, lang)); };
    const contrato = { empresa_id: empresaId, colaborador_id: cid, matricula: String(form.matricula).trim(), cod_categ: form.cod_categ, data_admissao: form.data_admissao,
      tp_contr: Number(form.tp_contr), data_termino: Number(form.tp_contr) === 2 ? nulo(form.data_termino) : null, experiencia: Number(form.tp_contr) === 2 && !!form.experiencia,
      cargo_id: nulo(form.cargo_id), departamento_id: nulo(form.departamento_id), estabelecimento_id: nulo(form.estabelecimento_id), lotacao_id: nulo(form.lotacao_id),
      centro_custo_id: nulo(form.centro_custo_id), gestor_id: nulo(form.gestor_id), qtd_hrs_sem: nulo(form.qtd_hrs_sem) ? lerValorBR(String(form.qtd_hrs_sem)) : null,
      tp_jornada: nulo(form.tp_jornada) ? Number(form.tp_jornada) : null, data_desligamento: nulo(form.data_desligamento),
      tp_reg_jor: Number(form.tp_reg_jor || 1), nat_atividade: Number(form.nat_atividade || 1), tmp_parc: Number(form.tmp_parc || 0),
      hor_noturno: form.hor_noturno === "S" ? true : form.hor_noturno === "N" ? false : null, dsc_jorn: nulo(form.dsc_jorn),
      clau_assec: Number(form.tp_contr) !== 1 && form.clau_assec ? form.clau_assec === "S" : null, obj_det: Number(form.tp_contr) === 3 ? nulo(form.obj_det) : null,
      data_base: nulo(form.data_base) ? Number(form.data_base) : null, cnpj_sindicato: soDig(form.cnpj_sindicato) || null, dsc_sal_var: nulo(form.dsc_sal_var),
      // aprendiz (só 103), temporário (só 106), local de trabalho (só doméstico 104 e temporário 106): fora disso, vazio
      apr_ind: cat === "103" && nulo(form.apr_ind) ? Number(form.apr_ind) : null,
      apr_cnpj_ent_qual: cat === "103" && String(form.apr_ind) === "1" ? soDig(form.apr_cnpj_ent_qual) || null : null,
      apr_tp_insc: cat === "103" && String(form.apr_ind) === "2" ? Number(form.apr_tp_insc || 1) : null,
      apr_nr_insc: cat === "103" && String(form.apr_ind) === "2" ? soDig(form.apr_nr_insc) || null : null,
      apr_cnpj_prat: cat === "103" ? soDig(form.apr_cnpj_prat) || null : null,
      temp_hip_leg: cat === "106" && nulo(form.temp_hip_leg) ? Number(form.temp_hip_leg) : null,
      temp_just_contr: cat === "106" ? nulo(form.temp_just_contr) : null,
      temp_tomador_tp_insc: cat === "106" && soDig(form.temp_tomador_nr_insc) ? Number(form.temp_tomador_tp_insc || 1) : null,
      temp_tomador_nr_insc: cat === "106" ? soDig(form.temp_tomador_nr_insc) || null : null,
      temp_cpf_substituidos: cat === "106" && String(form.temp_hip_leg) === "1" && cpfsSubst.length ? cpfsSubst : null,
      ...(["104", "106"].includes(cat)
        ? { lt_cep: soDig(form.lt_cep) || null, lt_logradouro: nulo(form.lt_logradouro), lt_numero: nulo(form.lt_numero), lt_complemento: nulo(form.lt_complemento), lt_bairro: nulo(form.lt_bairro), lt_cod_munic: /^\d{7}$/.test(String(form.lt_cod_munic ?? "")) ? String(form.lt_cod_munic) : null, lt_uf: nulo(form.lt_uf)?.toUpperCase() ?? null }
        : { lt_cep: null, lt_logradouro: null, lt_numero: null, lt_complemento: null, lt_bairro: null, lt_cod_munic: null, lt_uf: null }) };
    const r2 = form.contrato_id ? await supabase.from("rh_contratos").update(contrato).eq("id", form.contrato_id).select("id").single() : await supabase.from("rh_contratos").insert(contrato).select("id").single();
    if (r2.error || !r2.data) { await desfazer(r2.error); return false; }
    const kid = r2.data.id as string;
    if (pode.pessoais && (soDig(form.cpf) || form.tem_pessoal)) {
      const pes = { colaborador_id: cid, empresa_id: empresaId, cpf: soDig(form.cpf), data_nascimento: nulo(form.data_nascimento), sexo: nulo(form.sexo), raca_cor: nulo(form.raca_cor) ? Number(form.raca_cor) : null,
        estado_civil: nulo(form.estado_civil) ? Number(form.estado_civil) : null, grau_instr: nulo(form.grau_instr), pais_nascimento: codigoPais(form.pais_nascimento_txt) ?? "105", pais_nacionalidade: codigoPais(form.pais_nacionalidade_txt) ?? "105",
        cep: soDig(form.cep) || null, logradouro: nulo(form.logradouro), numero: nulo(form.numero), complemento: nulo(form.complemento), bairro: nulo(form.bairro), cidade: nulo(form.cidade),
        uf: nulo(form.uf)?.toUpperCase() ?? null, cod_munic: /^\d{7}$/.test(String(form.cod_munic ?? "")) ? String(form.cod_munic) : null,
        imig_tmp_resid: (codigoPais(form.pais_nacionalidade_txt) ?? "105") !== "105" && nulo(form.imig_tmp_resid) ? Number(form.imig_tmp_resid) : null,
        imig_cond_ing: (codigoPais(form.pais_nacionalidade_txt) ?? "105") !== "105" && nulo(form.imig_cond_ing) ? Number(form.imig_cond_ing) : null, telefone: nulo(form.telefone), email: nulo(form.email)?.toLowerCase() ?? null, emergencia_nome: nulo(form.emergencia_nome), emergencia_telefone: nulo(form.emergencia_telefone) };
      const r3 = await supabase.from("rh_colaborador_pessoal").upsert(pes, { onConflict: "colaborador_id" });
      if (r3.error) { await desfazer(r3.error); return false; }
    }
    const flagsPcd = ["def_fisica", "def_visual", "def_auditiva", "def_mental", "def_intelectual", "reab_readap"] as const;
    if (pode.saude && (form.tem_pcd || flagsPcd.some((f) => form[`pcd_${f}`]))) {
      const algum = flagsPcd.some((f) => form[`pcd_${f}`]);
      const linha: Linha = { colaborador_id: cid, empresa_id: empresaId, observacao: algum ? nulo(form.pcd_observacao) : null,
        info_cota: algum && form.pcd_info_cota ? form.pcd_info_cota === "S" : null, updated_at: new Date().toISOString() };
      flagsPcd.forEach((f) => { linha[f] = !!form[`pcd_${f}`]; });
      const rP = await supabase.from("rh_colaborador_pcd").upsert(linha, { onConflict: "colaborador_id" });
      if (rP.error) { await desfazer(rP.error); return false; }
    }
    if (pode.salario) {
      const valorNovo = novo ? nulo(form.valor) : nulo(form.reajuste_valor);
      if (valorNovo) {
        const und = Number(form.und_sal_fixo);
        const r4 = await supabase.from("rh_remuneracoes").insert({ empresa_id: empresaId, contrato_id: kid, vigencia_inicio: novo ? form.data_admissao : form.reajuste_data,
          und_sal_fixo: und, valor: und === 7 ? 0 : lerValorBR(String(valorNovo)), motivo: novo ? "admissao" : form.reajuste_motivo });
        if (r4.error) { await desfazer(r4.error); return false; }
      }
    }
    setSalvando(false); setForm(null); avisar(L("Salvo.", "Saved.", "Guardado."), "ok"); void carregarLista();
    return true;
  }

  async function paraLixeira(c: Linha) {
    const k = contratos[c.id];
    if (k && k.situacao_esocial !== "rascunho") { avisar(L("Já foi enviado ao eSocial: não vai para a lixeira. Registre o desligamento.", "Already sent to eSocial: it cannot go to the trash. Record the termination instead.", "Ya enviado al eSocial: no va a la papelera. Registre la desvinculación.")); return; }
    const ok = await confirmar({ oQue: `"${c.nome}"`, tabela: "rh_colaboradores", registroId: c.id,
      efeito: { pt: `O cadastro, o contrato, os dados pessoais e o histórico de salário vão para a lixeira do RH por ${DIAS_LIXEIRA_RH} dias e podem ser recuperados. Depois disso, somem de vez. Se a pessoa saiu da empresa, não apague: registre o desligamento.`, en: `The record, contract, personal data and salary history go to the HR trash for ${DIAS_LIXEIRA_RH} days and can be recovered. After that, they are deleted for good. If the person left the company, do not delete: record the termination.`, es: `El registro, el contrato, los datos personales y el historial de salario van a la papelera de RR. HH. por ${DIAS_LIXEIRA_RH} días y pueden recuperarse. Después se eliminan definitivamente. Si la persona salió de la empresa, no borre: registre la desvinculación.` } });
    if (!ok) return;
    const { data, error } = await supabase.from("rh_colaboradores").update({ excluido_em: new Date().toISOString() }).eq("id", c.id).select("id");
    if (error || !data?.length) { avisar(mensagemErroRh(error, lang)); return; }
    avisar(L(`Movido para a lixeira — dá para recuperar por ${DIAS_LIXEIRA_RH} dias.`, `Moved to trash — recoverable for ${DIAS_LIXEIRA_RH} days.`, `Movido a la papelera — se puede recuperar por ${DIAS_LIXEIRA_RH} días.`), "ok"); void carregarLista();
  }
  // Planilha completa (Excel), no mesmo formato do modelo de importação. Lê TODOS (não só a página), cada parte com a liberação.
  async function planilhaCompleta(): Promise<boolean> {
    if (!empresaId) return false;
    setExportandoXls(true);
    const ler = (t: string, cols: string, lixeira: boolean, ordem: string) => lerTodas(() => { const q = supabase.from(t).select(cols).eq("empresa_id", empresaId); return (lixeira ? q.is("excluido_em", null) : q).order(ordem); });
    const vazio = Promise.resolve({ data: [] as Linha[], error: null });
    const [cs, ks, ps, rs] = await Promise.all([
      ler("rh_colaboradores", "id, nome, nome_social, situacao", true, "nome"),
      ler("rh_contratos", "id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, experiencia, data_termino, qtd_hrs_sem, cargo_id, departamento_id, data_desligamento, situacao_esocial", false, "id"),
      pode.pessoais ? ler("rh_colaborador_pessoal", "colaborador_id, cpf, data_nascimento, sexo, telefone, email, cep, logradouro, numero, bairro, cidade, uf", false, "colaborador_id") : vazio,
      pode.salario ? ler("rh_remuneracoes", "contrato_id, vigencia_inicio, valor", false, "id") : vazio,
    ]);
    setExportandoXls(false);
    const falha = [cs, ks, ps, rs].find((r) => r.error);
    if (falha?.error) { avisar(L("Não foi possível montar a planilha agora. Tente de novo.", "Could not build the spreadsheet now. Try again.", "No se pudo armar la planilla ahora. Intente de nuevo.")); return false; }
    const atual = new Map<string, Linha>();
    [...(ks.data as Linha[])].sort((a, b) => String(b.data_admissao).localeCompare(String(a.data_admissao))).forEach((k) => { if (!atual.has(k.colaborador_id)) atual.set(k.colaborador_id, k); });
    const pes = new Map((ps.data as Linha[]).map((x) => [x.colaborador_id, x]));
    const hoje = hojeISO(), sal = new Map<string, number>();
    [...(rs.data as Linha[])].filter((r) => r.vigencia_inicio <= hoje).sort((a, b) => String(b.vigencia_inicio).localeCompare(String(a.vigencia_inicio))).forEach((r) => { if (!sal.has(r.contrato_id)) sal.set(r.contrato_id, Number(r.valor)); });
    const nomes = { cargos: new Map(ref.cargos.map((x) => [x.id, x.nome])), deps: new Map(ref.deps.map((x) => [x.id, x.nome])) };
    const linhas = (cs.data as Linha[]).map((c) => { const k = atual.get(c.id); return linhaPlanilha(c, k, pes.get(c.id), k ? sal.get(k.id) ?? null : null, nomes, { pessoais: pode.pessoais, salario: pode.salario }); });
    exportarPlanilhaAbas([
      { nome: L("Colaboradores", "Employees", "Colaboradores"), linhas },
      { nome: L("Instruções", "Instructions", "Instrucciones"), linhas: COLUNAS.map((c) => ({ [L("Coluna", "Column", "Columna")]: c.titulo, [L("Como preencher", "How to fill", "Cómo completar")]: c.ajuda[lang] })) },
    ], `axioma-rh-colaboradores-${hoje}`);
    avisar(L(`Planilha com ${linhas.length} pessoa(s) gerada.`, `Spreadsheet with ${linhas.length} person(s) generated.`, `Planilla con ${linhas.length} persona(s) generada.`), "ok");
    return true;
  }
  async function recuperar(c: Linha) {
    const { data, error } = await supabase.from("rh_colaboradores").update({ excluido_em: null }).eq("id", c.id).select("id");
    if (error || !data?.length) { avisar(mensagemErroRh(error, lang)); return; }
    avisar(L("Recuperado.", "Recovered.", "Recuperado."), "ok"); void carregarLista();
  }

  const nomeDe = (arr: Linha[], id?: string | null) => arr.find((x) => x.id === id)?.nome ?? "—";
  const colunasExport = [L("Nome", "Name", "Nombre"), L("Matrícula", "Employee ID", "Matrícula"), L("Cargo", "Job title", "Cargo"), L("Departamento", "Department", "Departamento"), L("Admissão", "Hire date", "Admisión"), L("Situação", "Status", "Situación")];
  // valor legível no histórico: id vira o nome (cargo, departamento…), data vira dd/mm/aaaa, sim/não
  const valorHistorico = (k: string, v: unknown): string => {
    if (v === null || v === undefined || v === "") return "—";
    const listas: Record<string, Linha[]> = { cargo_id: ref.cargos, departamento_id: ref.deps, estabelecimento_id: ref.filiais, lotacao_id: ref.lotacoes, centro_custo_id: ref.centros, gestor_id: ref.gestores };
    if (listas[k]) return nomeDe(listas[k], String(v));
    if (typeof v === "boolean") return v ? L("sim", "yes", "sí") : L("não", "no", "no");
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return dataBR(v);
    if (k === "situacao") return nomeSit(String(v));
    return String(v);
  };
  const linhasExport = lista.map((c) => { const k = contratos[c.id] ?? {}; return [c.nome, k.matricula ?? "—", nomeDe(ref.cargos, k.cargo_id), nomeDe(ref.deps, k.departamento_id), dataBR(k.data_admissao), nomeSit(c.situacao)]; });
  const exportar = (formato: "pdf" | "excel" = "pdf") => {
    try {
      (formato === "excel" ? gerarExcelTabela : gerarPdfTabela)({
        titulo: L("RH — Colaboradores", "HR — Employees", "RR. HH. — Colaboradores"), subtitulo: L("Sem CPF e sem salário (dados protegidos)", "Without CPF and salary (protected data)", "Sin CPF ni salario (datos protegidos)"),
        colunas: colunasExport.map((h, i) => ({ header: h, key: `c${i}`, width: 3 })),
        linhas: linhasExport.map((l) => Object.fromEntries(l.map((v, i) => [`c${i}`, String(v)]))),
        resumo: [{ label: L("Ativos", "Active", "Activos"), valor: String(kpi.ativos) }, { label: L("Experiência vencendo em 30 dias", "Probation ending in 30 days", "Experiencia venciendo en 30 días"), valor: String(kpi.experiencia) }],
        nomeArquivo: `axioma-rh-colaboradores-${hojeISO()}.pdf`,
      }, (m) => avisar(m), lang);
    } catch (err) { avisar(tratarFalhaExportacao("rh-colaboradores.exportar", err, lang)); }
  };
  const resumoShare = [`🚀 AXIOMA AI.TECH — ${L("RH · Colaboradores", "HR · Employees", "RR. HH. · Colaboradores")}`,
    `• ${L("Ativos", "Active", "Activos")}: ${kpi.ativos}`, `• ${L("Experiência vencendo em 30 dias", "Probation ending in 30 days", "Experiencia venciendo en 30 días")}: ${kpi.experiencia}`,
    `• ${L("Pré-admissão", "Pre-hire", "Pre-admisión")}: ${kpi.pre}`, `• ${L("Desligados", "Terminated", "Desvinculados")}: ${kpi.desligados}`, `_axiomaai.com.br_`].join("\n");
  const detalhadoShare = [`🚀 AXIOMA AI.TECH — ${L("RH · Colaboradores", "HR · Employees", "RR. HH. · Colaboradores")}`, ...linhasExport.map((l) => l.join(" | ")), `_axiomaai.com.br_`].join("\n");

  const vazio = { v: "", l: "—" };
  const travado = form?.contrato_situacao && form.contrato_situacao !== "rascunho";
  const salarioAtual = historico[0];

  return (
    <div data-theme={tema} style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <ModuloLayout titulo={L("RH", "HR", "RR. HH.")}
        subtitulo={L("Cadastro das pessoas, contrato, dados pessoais e salário — cada parte só para quem foi liberado", "People, contract, personal data and salary — each part only for those granted", "Personas, contrato, datos personales y salario — cada parte solo para quien fue habilitado")}
        onExportarPDF={() => exportar("pdf")} onExportarExcel={() => exportar("excel")}
        labelBotao={pode.editar ? L("Novo colaborador", "New employee", "Nuevo colaborador") : undefined} onNovo={pode.editar ? abrirNovo : undefined}
        headerFundo={temaClaro ? "linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)" : undefined}
        corExportar={temaClaro ? "linear-gradient(135deg, #16a97d, #2ecc9b)" : undefined} corNovo={temaClaro ? "linear-gradient(135deg, #16a97d, #2ecc9b)" : undefined}
        botaoExtra={<ThemeToggle />}>
        <div className="space-y-4">
          <NavRh lang={lang} temaClaro={temaClaro} />
          {pode.ver && <LetreiroAxioma id="rh-colaboradores" cor="#101b3d" itens={[
            `${L("Ativos", "Active", "Activos")} ${kpi.ativos}`,
            `${L("Experiência vence em 30 dias", "Probation ends in 30 days", "Experiencia vence en 30 días")} ${kpi.experiencia}`,
            `${L("Pré-admissão", "Pre-hire", "Pre-admisión")} ${kpi.pre}`,
            `${L("Desligados", "Terminated", "Desvinculados")} ${kpi.desligados}`,
          ]} />}
          {pode.carregado && !pode.ver ? (
            <CanvasBox cor={VERDE} {...cartaoTema}>
              <div className="flex items-start gap-3 py-2"><ShieldCheck size={20} style={{ color: VERDE, flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--axi-text-primary)" }}>{L("Você não tem acesso ao RH desta Empresa. Peça ao Proprietário, CEO, Sócio ou Admin para liberar em RH · Estrutura → Acessos do RH.", "You do not have access to HR for this company. Ask the Owner, CEO, Partner or Admin to grant it in HR · Structure → HR access.", "No tiene acceso a RR. HH. de esta empresa. Pida al Propietario, CEO, Socio o Admin que lo habilite en RR. HH. · Estructura → Accesos de RR. HH.")}</p>
              </div>
            </CanvasBox>
          ) : (
            <>
              {/* Indicadores (cada um filtra a lista) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l: L("Ativos", "Active", "Activos"), v: kpi.ativos, c: VERDE, f: "ativo" },
                  { l: L("Experiência vence em 30 dias", "Probation ends in 30 days", "Experiencia vence en 30 días"), v: kpi.experiencia, c: kpi.experiencia ? (temaClaro ? "#9a3412" : ct("#f59e0b")) : VERDE, f: "ativo" },
                  { l: L("Pré-admissão", "Pre-hire", "Pre-admisión"), v: kpi.pre, c: temaClaro ? NAVY : "#7dd3fc", f: "pre_admissao" },
                  { l: L("Desligados", "Terminated", "Desvinculados"), v: kpi.desligados, c: TEXTO_SEC, f: "desligado" },
                ].map((k) => (
                  <motion.div key={k.l} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="cursor-pointer" onClick={() => { setVerLixeira(false); setFiltroSit(k.f); setPagina(0); }}>
                    <CanvasBox cor={k.c} destaque {...cartaoTema}>
                      <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: TEXTO_SEC }}>{k.l}</p>
                      <p className="text-xl md:text-2xl font-black" style={{ color: k.c, ...FONTE_EXEC }}><AnimatedNumber value={String(k.v)} /></p>
                    </CanvasBox>
                  </motion.div>
                ))}
              </div>

              {/* Busca, filtros, compartilhar */}
              <CanvasBox cor={VERDE} {...cartaoTema}>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl" style={campo}>
                    <Search size={16} style={{ color: TEXTO_SEC }} />
                    <input aria-label={L("Buscar por nome", "Search by name", "Buscar por nombre")} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={L("Buscar por nome", "Search by name", "Buscar por nombre")} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "var(--axi-text-primary)" }} />
                  </div>
                  <select aria-label={L("Situação", "Status", "Situación")} value={verLixeira ? "" : filtroSit} disabled={verLixeira} onChange={(e) => { setFiltroSit(e.target.value); setPagina(0); }} className="px-3 py-2.5 rounded-xl text-sm" style={campo}>
                    <option value="">{L("Todas as situações", "All statuses", "Todas las situaciones")}</option>
                    {SITUACOES.map((s) => <option key={s} value={s}>{nomeSit(s)}</option>)}
                  </select>
                  {pode.editar && (
                    <button onClick={() => { setVerLixeira(!verLixeira); setPagina(0); }} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl" style={{ background: temaClaro ? NAVY : "rgba(255,255,255,0.06)", color: "#fff", border: `1px solid ${BORDA}` }}>
                      {verLixeira ? <><X size={13} /> {L("Fechar lixeira", "Close trash", "Cerrar papelera")}</> : <><Trash2 size={13} /> {L(`Lixeira (${DIAS_LIXEIRA_RH} dias)`, `Trash (${DIAS_LIXEIRA_RH} days)`, `Papelera (${DIAS_LIXEIRA_RH} días)`)}</>}
                    </button>
                  )}
                  <BotaoAcao executar={planilhaCompleta} icone={<FileSpreadsheet size={16} />} texto={L("Planilha completa (Excel)", "Full spreadsheet (Excel)", "Planilla completa (Excel)")}
                    textoTrabalhando={L("Gerando…", "Generating…", "Generando…")} textoFeito={L("Baixada", "Downloaded", "Descargada")} className="px-4 py-2.5 rounded-xl text-sm"
                    estilo={{ background: temaClaro ? NAVY : "rgba(255,255,255,0.08)", color: "#fff", border: `1px solid ${BORDA}` }} />
                  {pode.editar && (
                    <button onClick={() => setImportAberto(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: temaClaro ? NAVY : "rgba(255,255,255,0.08)", color: "#fff", border: `1px solid ${BORDA}` }}>
                      <UserPlus size={16} /> {L("Importar planilha", "Import spreadsheet", "Importar planilla")}
                    </button>
                  )}
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: BTN, color: "#fff" }}>
                    <Share2 size={16} /> {L("Compartilhar", "Share", "Compartir")}
                  </motion.button>
                </div>
              </CanvasBox>

              {filtroEsp && !verLixeira && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ background: temaClaro ? "rgba(16,27,61,0.06)" : "rgba(46,204,155,0.08)", border: `1px solid ${BORDA}`, color: "var(--axi-text-primary)" }}>
                  {L("Filtro do Painel", "Panel filter", "Filtro del Panel")}: <b>{({ admitidos_mes: L("admitidos neste mês", "hired this month", "admitidos este mes"), desligados_mes: L("desligados neste mês", "terminated this month", "desvinculados este mes"), sem_cargo: L("ativos sem cargo", "active without job title", "activos sin cargo"), sem_salario: L("ativos sem salário", "active without salary", "activos sin salario") } as Record<string, string>)[filtroEsp] ?? filtroEsp}</b>
                  <span style={{ color: TEXTO_SEC }}>{L("— toque no nome para abrir e resolver", "— tap the name to open and fix", "— toque el nombre para abrir y resolver")}</span>
                  <button type="button" onClick={() => { setFiltroEsp(null); setFiltroSit("ativo"); setPagina(0); window.history.replaceState(null, "", "/rh/colaboradores"); }} className="ml-auto flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: temaClaro ? NAVY : "rgba(255,255,255,0.08)", color: "#fff" }}><X size={13} /> {L("Limpar filtro", "Clear filter", "Limpiar filtro")}</button>
                </div>
              )}
              {/* Lista */}
              <CanvasBox cor={VERDE} {...cartaoTema}>
                <div className="overflow-x-auto">
                  {carregando ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (
                    <table className="w-full min-w-[720px]">
                      <thead><tr style={{ borderBottom: `1px solid ${BORDA}` }}>
                        {[...colunasExport, verLixeira ? L("Recuperar até", "Recover within", "Recuperar en") : L("Alertas", "Alerts", "Alertas"), L("Ações", "Actions", "Acciones")].map((h) => (
                          <th key={h} className="text-left px-3 py-3 text-xs font-semibold tracking-wider uppercase" style={{ color: TEXTO_SEC }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {lista.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-10 text-sm" style={{ color: TEXTO_SEC }}>
                            {verLixeira ? L("A lixeira está vazia.", "The trash is empty.", "La papelera está vacía.") : busca ? L("Ninguém encontrado com esse nome.", "No one found with that name.", "Nadie encontrado con ese nombre.") : L("Nenhum colaborador nesta situação. Clique no botão verde \"+ Novo colaborador\", no topo da tela.", "No employees in this status. Click the green \"+ New employee\" button at the top of the screen.", "Ningún colaborador en esta situación. Haga clic en el botón verde \"+ Nuevo colaborador\", en la parte superior de la pantalla.")}
                          </td></tr>
                        ) : lista.map((c) => {
                          const k = contratos[c.id] ?? {};
                          const dExp = k.experiencia && !k.data_desligamento ? dias(k.data_termino) : null;
                          return (
                            <tr key={c.id} style={{ borderBottom: `1px solid ${BORDA}` }}>
                              <td className="px-3 py-3 text-sm font-bold" style={{ color: "var(--axi-text-primary)" }}>{verLixeira ? (c.nome_social || c.nome) : <button type="button" onClick={() => void abrirEdicao(c)} className="text-left underline-offset-2 hover:underline" title={L("Abrir a ficha", "Open the record", "Abrir la ficha")}>{c.nome_social || c.nome}</button>}</td>
                              <td className="px-3 py-3 text-sm" style={{ color: TEXTO_SEC }}>{k.matricula ?? "—"}</td>
                              <td className="px-3 py-3 text-sm" style={{ color: TEXTO_SEC }}>{nomeDe(ref.cargos, k.cargo_id)}</td>
                              <td className="px-3 py-3 text-sm" style={{ color: TEXTO_SEC }}>{nomeDe(ref.deps, k.departamento_id)}</td>
                              <td className="px-3 py-3 text-sm whitespace-nowrap" style={{ color: TEXTO_SEC }}>{dataBR(k.data_admissao)}</td>
                              <td className="px-3 py-3"><span className="text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap" style={{ background: temaClaro ? "rgba(16,27,61,0.08)" : "rgba(255,255,255,0.08)", color: c.situacao === "ativo" ? VERDE : TEXTO_SEC }}>{nomeSit(c.situacao)}</span></td>
                              <td className="px-3 py-3 text-xs">
                                {verLixeira ? <span style={{ color: TEXTO_SEC }}>{L(`${Math.max(0, DIAS_LIXEIRA_RH - Math.floor((Date.now() - new Date(c.excluido_em).getTime()) / 86400000))} dias`, `${Math.max(0, DIAS_LIXEIRA_RH - Math.floor((Date.now() - new Date(c.excluido_em).getTime()) / 86400000))} days`, `${Math.max(0, DIAS_LIXEIRA_RH - Math.floor((Date.now() - new Date(c.excluido_em).getTime()) / 86400000))} días`)}</span>
                                  : dExp !== null && dExp >= 0 && dExp <= 30 ? <button type="button" onClick={() => void abrirPorId(c.id, "contrato")} className="flex items-center gap-1 font-bold underline text-left" style={{ color: (temaClaro ? "#9a3412" : ct("#f59e0b")) }} title={L("Abrir o contrato para decidir", "Open the contract to decide", "Abrir el contrato para decidir")}><AlertTriangle size={13} /> {L(`Experiência termina em ${dExp} dias`, `Probation ends in ${dExp} days`, `Experiencia termina en ${dExp} días`)} ›</button>
                                  : dExp !== null && dExp < 0 ? <button type="button" onClick={() => void abrirPorId(c.id, "contrato")} className="font-bold underline text-left" style={{ color: ct("#f87171") }} title={L("Abrir o contrato para decidir", "Open the contract to decide", "Abrir el contrato para decidir")}>{L("Experiência vencida: decida efetivar ou desligar", "Probation over: decide to hire or terminate", "Experiencia vencida: decida efectivar o desvincular")} ›</button> : "—"}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  {verLixeira ? <button title={L("Recuperar", "Recover", "Recuperar")} onClick={() => recuperar(c)} style={{ color: VERDE }}><RotateCcw size={16} /></button> : (
                                    <>
                                      <button title={pode.editar ? L("Editar", "Edit", "Editar") : L("Ver", "View", "Ver")} onClick={() => abrirEdicao(c)} style={{ color: VERDE }}><Pencil size={16} /></button>
                                      {pode.editar && <button title={L("Mandar para a lixeira", "Move to trash", "Enviar a la papelera")} onClick={() => paraLixeira(c)} style={{ color: ct("#f87171") }}><Trash2 size={16} /></button>}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                {total > POR_PAGINA && (
                  <div className="flex items-center justify-between mt-3 text-sm" style={{ color: TEXTO_SEC }}>
                    <span>{L(`${pagina * POR_PAGINA + 1}–${Math.min(total, (pagina + 1) * POR_PAGINA)} de ${total}`, `${pagina * POR_PAGINA + 1}–${Math.min(total, (pagina + 1) * POR_PAGINA)} of ${total}`, `${pagina * POR_PAGINA + 1}–${Math.min(total, (pagina + 1) * POR_PAGINA)} de ${total}`)}</span>
                    <div className="flex gap-2">
                      <button disabled={pagina === 0} onClick={() => setPagina(pagina - 1)} className="px-3 py-1.5 rounded-lg font-bold" style={{ background: pagina === 0 ? "#6b7280" : BTN, color: "#fff" }}>{L("Anterior", "Previous", "Anterior")}</button>
                      <button disabled={(pagina + 1) * POR_PAGINA >= total} onClick={() => setPagina(pagina + 1)} className="px-3 py-1.5 rounded-lg font-bold" style={{ background: (pagina + 1) * POR_PAGINA >= total ? "#6b7280" : BTN, color: "#fff" }}>{L("Próxima", "Next", "Siguiente")}</button>
                    </div>
                  </div>
                )}
              </CanvasBox>
              <PerguntaIA tela="rh" empresaId={empresaId} lang={lang} temaClaro={temaClaro} titulo={L("Inteligência Axioma — Especialista de RH", "Axioma Intelligence — HR Specialist", "Inteligencia Axioma — Especialista de RR. HH.")}
                sugestoes={[L("Quantos colaboradores ativos temos por departamento?", "How many active employees per department?", "¿Cuántos colaboradores activos por departamento?"), L("Quem está com a experiência terminando?", "Whose probation is ending?", "¿A quién se le termina la experiencia?"), L("Quanto somam os salários-base?", "What do base salaries add up to?", "¿Cuánto suman los salarios base?")]} />
              {ref.cargos.length === 0 && pode.editar && <p className="text-xs" style={{ color: TEXTO_SEC }}>{L("Dica: cadastre cargos, departamentos e filiais em RH · Estrutura para escolher no contrato.", "Tip: register job titles, departments and branches in HR · Structure to pick them in the contract.", "Consejo: registre cargos, departamentos y sucursales en RR. HH. · Estructura para elegirlos en el contrato.")} <Link href="/rh/estrutura" className="underline font-bold whitespace-nowrap" style={{ color: VERDE }}>{L("Abrir RH · Estrutura ›", "Open HR · Structure ›", "Abrir RR. HH. · Estructura ›")}</Link></p>}
            </>
          )}
        </div>

        {/* Formulário */}
        <AnimatePresence>
          {form && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 px-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.96, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 14 }} transition={{ duration: 0.2 }} className="w-full max-w-3xl">
                <FormCtx.Provider value={{ form, setForm, campo, ROTULO, TEXTO_SEC, NESTED_BG, BORDA, titulo: temaClaro ? NAVY : "var(--axi-text-primary)" }}>
                <CanvasBox cor={VERDE} {...cartaoTema}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: VERDE }}>AXIOMA · RH</p>
                      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--axi-text-primary)" }}><UserPlus size={18} /> {form.id ? form.nome : L("Novo colaborador", "New employee", "Nuevo colaborador")}</h3>
                    </div>
                    <button onClick={() => setForm(null)} style={{ color: TEXTO_SEC }} aria-label={L("Fechar", "Close", "Cerrar")}><X size={20} /></button>
                  </div>
                  {travado && <p className="text-xs mt-2 font-semibold" style={{ color: (temaClaro ? "#9a3412" : ct("#f59e0b")) }}>{form.contrato_situacao === "preparado" ? L("O arquivo do eSocial desta admissão já foi preparado. Se mudar um dado do contrato, ele volta a rascunho e é preciso preparar de novo.", "The eSocial file for this hire was already prepared. If you change a contract field, it goes back to draft and must be prepared again.", "El archivo del eSocial de esta admisión ya fue preparado. Si cambia un dato del contrato, vuelve a borrador y hay que prepararlo de nuevo.") : L("Esta admissão já foi enviada ao eSocial. Pode alterar e salvar: o Axioma marca o que precisa ir ao eSocial (alteração de contrato S-2206 ou de dados pessoais S-2205) no cartão do eSocial, no fim. Matrícula, admissão, CPF e nascimento não mudam aqui — o contador retifica a admissão.", "This hire was already sent to eSocial. You can change and save: Axioma flags what must go to eSocial (contract change S-2206 or personal data S-2205) in the eSocial card at the end. Employee ID, hire date, CPF and birth date cannot change here — the accountant corrects the hire.", "Esta admisión ya fue enviada al eSocial. Puede cambiar y guardar: Axioma marca lo que debe ir al eSocial (alteración de contrato S-2206 o de datos personales S-2205) en la tarjeta del eSocial, al final. Matrícula, admisión, CPF y nacimiento no cambian aquí — el contador rectifica la admisión.")}</p>}

                  <Secao titulo={L("Identificação", "Identification", "Identificación")}>
                    <F k="nome" r={L("Nome completo *", "Full name *", "Nombre completo *")} />
                    <F k="nome_social" r={L("Nome social (opcional)", "Social name (optional)", "Nombre social (opcional)")} />
                    <F k="situacao" r={L("Situação", "Status", "Situación")} opcoes={SITUACOES.map((s) => ({ v: s, l: nomeSit(s) }))} />
                  </Secao>

                  <Secao ancora="contrato" titulo={L("Contrato", "Contract", "Contrato")}>
                    <F k="matricula" r={L("Matrícula *", "Employee ID *", "Matrícula *")} />
                    <F k="cod_categ" r={L("Categoria (Tabela 01 do eSocial) *", "Category (eSocial Table 01) *", "Categoría (Tabla 01 del eSocial) *")} opcoes={ref.categorias.map((c) => ({ v: c.codigo, l: `${c.codigo} — ${String(c.descricao).slice(0, 80)}` }))} />
                    <F k="data_admissao" tipo="date" r={L("Data de admissão *", "Hire date *", "Fecha de admisión *")} />
                    <F k="tp_contr" r={L("Tipo de contrato", "Contract type", "Tipo de contrato")} opcoes={[{ v: "1", l: L("Prazo indeterminado", "Open-ended", "Plazo indeterminado") }, { v: "2", l: L("Prazo determinado (data de término)", "Fixed term (end date)", "Plazo determinado (fecha de término)") }, { v: "3", l: L("Prazo determinado (até um fato)", "Fixed term (until an event)", "Plazo determinado (hasta un hecho)") }]} />
                    {form.contrato_id && String(form.tp_contr) === "2" && form.data_termino && !form.data_desligamento && (
                      <div className="md:col-span-2 rounded-xl p-3 space-y-2" style={{ border: `2px solid ${(form.data_termino < hojeISO()) ? "#ef4444" : (temaClaro ? "#9a3412" : "#fbbf24")}` }}>
                        <p className="text-sm font-bold" style={{ color: "var(--axi-text-primary)" }}>{form.experiencia ? L("Decisão sobre o contrato de experiência", "Probation decision", "Decisión sobre el contrato de experiencia") : L("Decisão sobre o contrato por prazo determinado", "Fixed-term contract decision", "Decisión sobre el contrato a plazo determinado")} — {form.data_termino < hojeISO() ? L(`venceu em ${dataBR(form.data_termino)}`, `ended on ${dataBR(form.data_termino)}`, `venció el ${dataBR(form.data_termino)}`) : L(`termina em ${dataBR(form.data_termino)}`, `ends on ${dataBR(form.data_termino)}`, `termina el ${dataBR(form.data_termino)}`)}</p>
                        <p className="text-xs" style={{ color: TEXTO_SEC }}>{form.experiencia ? L("CLT art. 445 e 451: a experiência vai até 90 dias e pode ser prorrogada uma única vez dentro desse limite; se a pessoa continua trabalhando depois do fim, o contrato vira prazo indeterminado.", "CLT arts. 445 and 451: probation lasts up to 90 days and can be extended only once within that limit; if the person keeps working after the end, the contract becomes open-ended.", "CLT arts. 445 y 451: la experiencia dura hasta 90 días y puede prorrogarse una sola vez dentro de ese límite; si la persona sigue trabajando después del fin, el contrato pasa a plazo indeterminado.") : L("CLT art. 445 e 451: até 2 anos, prorrogável uma única vez dentro desse limite.", "CLT arts. 445 and 451: up to 2 years, extendable only once within that limit.", "CLT arts. 445 y 451: hasta 2 años, prorrogable una sola vez dentro de ese límite.")}</p>
                        {pode.editar && <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => { setForm({ ...form, tp_contr: "1", experiencia: false, data_termino: "", clau_assec: "" }); avisar(L("Efetivação marcada: confira e toque em Salvar.", "Made permanent: check and tap Save.", "Efectivación marcada: revise y toque Guardar."), "ok"); }} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "linear-gradient(135deg, #0b5f46, #0f7a5a)", color: "#fff" }}>{L("Efetivar (prazo indeterminado)", "Make permanent (open-ended)", "Efectivar (plazo indeterminado)")}</button>
                          <button type="button" onClick={() => { const lim = form.experiencia ? new Date(new Date(form.data_admissao + "T12:00:00Z").getTime() + 89 * 86400000).toISOString().slice(0, 10) : ""; setForm({ ...form, data_termino: lim || form.data_termino }); avisar(form.experiencia ? L(`Prorrogação até o limite de 90 dias (${dataBR(lim)}). Ajuste a data se quiser menos e toque em Salvar.`, `Extended to the 90-day limit (${dataBR(lim)}). Adjust the date if you want less and tap Save.`, `Prórroga hasta el límite de 90 días (${dataBR(lim)}). Ajuste la fecha si quiere menos y toque Guardar.`) : L("Informe a nova data de término (até 2 anos no total) e toque em Salvar.", "Enter the new end date (up to 2 years in total) and tap Save.", "Informe la nueva fecha de término (hasta 2 años en total) y toque Guardar."), "ok"); document.getElementById("col-data_termino")?.focus(); }} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "linear-gradient(135deg, #0a1628, #101b3d)", color: "#fff" }}>{L("Prorrogar", "Extend", "Prorrogar")}</button>
                          <button type="button" onClick={() => irParaSecao("desligamento")} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "linear-gradient(135deg, #0a1628, #101b3d)", color: "#fff" }}>{L("Desligar ›", "Terminate ›", "Desvincular ›")}</button>
                        </div>}
                      </div>
                    )}
                    {String(form.tp_contr) === "2" && (<>
                      <F k="data_termino" tipo="date" r={L("Data de término *", "End date *", "Fecha de término *")} ajuda={L("Experiência: até 90 dias (CLT art. 445). Prazo determinado comum: até 2 anos.", "Probation: up to 90 days (CLT art. 445). Regular fixed term: up to 2 years.", "Experiencia: hasta 90 días (CLT art. 445). Plazo determinado común: hasta 2 años.")} />
                      <label className="flex items-center gap-2 text-sm self-end pb-3" style={{ color: "var(--axi-text-primary)" }}><input type="checkbox" checked={!!form.experiencia} onChange={(e) => setForm({ ...form, experiencia: e.target.checked })} /> {L("É contrato de experiência", "This is a probation contract", "Es contrato de experiencia")}</label>
                    </>)}
                    <F k="cargo_id" r={L("Cargo", "Job title", "Cargo")} opcoes={[vazio, ...ref.cargos.map((x) => ({ v: x.id, l: `${x.nome} (CBO ${x.cbo})` }))]} />
                    <F k="departamento_id" r={L("Departamento", "Department", "Departamento")} opcoes={[vazio, ...ref.deps.map((x) => ({ v: x.id, l: x.nome }))]} />
                    <F k="estabelecimento_id" r={L("Filial", "Branch", "Sucursal")} opcoes={[vazio, ...ref.filiais.map((x) => ({ v: x.id, l: x.nome }))]} />
                    <F k="lotacao_id" r={L("Lotação", "Tax unit", "Lotación")} opcoes={[vazio, ...ref.lotacoes.map((x) => ({ v: x.id, l: `${x.cod_lotacao} — ${x.nome}` }))]} />
                    <F k="centro_custo_id" r={L("Centro de custo", "Cost center", "Centro de costo")} opcoes={[vazio, ...ref.centros.map((x) => ({ v: x.id, l: x.nome }))]} />
                    <F k="gestor_id" r={L("Gestor responsável", "Manager", "Gestor responsable")} opcoes={[vazio, ...ref.gestores.map((x) => ({ v: x.id, l: x.nome }))]} />
                    <F k="qtd_hrs_sem" r={L("Horas por semana", "Hours per week", "Horas por semana")} ajuda={L("Obrigatório, exceto intermitente.", "Required, except intermittent.", "Obligatorio, excepto intermitente.")} />
                    <F k="tp_jornada" r={L("Tipo de jornada", "Work schedule", "Tipo de jornada")} opcoes={[vazio, { v: "2", l: "12 x 36" }, { v: "3", l: L("Horário fixo, folga variável", "Fixed hours, variable day off", "Horario fijo, descanso variable") }, { v: "4", l: L("Horário fixo, folga no domingo", "Fixed hours, Sunday off", "Horario fijo, descanso el domingo") }, { v: "5", l: L("Horário fixo, folga fixa (não domingo)", "Fixed hours, fixed day off (not Sunday)", "Horario fijo, descanso fijo (no domingo)") }, { v: "6", l: L("Horário fixo, folga fixa + domingo periódico", "Fixed hours, fixed day off + periodic Sunday", "Horario fijo, descanso fijo + domingo periódico") }, { v: "7", l: L("Turno de revezamento", "Rotating shifts", "Turnos rotativos") }, { v: "9", l: L("Outros tipos", "Other types", "Otros tipos") }]} />
                    <F k="tp_reg_jor" r={L("Controle de horário", "Working-time control", "Control de horario")} opcoes={[{ v: "1", l: L("Tem horário controlado", "Hours are controlled", "Tiene horario controlado") }, { v: "2", l: L("Trabalho externo (CLT art. 62, I)", "External work (CLT art. 62, I)", "Trabajo externo (CLT art. 62, I)") }, { v: "3", l: L("Gerente/cargo de gestão (CLT art. 62, II)", "Manager (CLT art. 62, II)", "Gerente (CLT art. 62, II)") }, { v: "4", l: L("Teletrabalho (CLT art. 62, III)", "Telework (CLT art. 62, III)", "Teletrabajo (CLT art. 62, III)") }]} />
                    <F k="hor_noturno" r={L("Trabalha à noite (22h–5h)?", "Night work (10pm–5am)?", "¿Trabaja de noche (22h–5h)?")} opcoes={[vazio, { v: "N", l: L("Não", "No", "No") }, { v: "S", l: L("Sim, no todo ou em parte", "Yes, fully or partly", "Sí, total o parcialmente") }]} />
                    <div className="md:col-span-2"><F k="dsc_jorn" r={L("Horário (dias, entrada, saída e intervalo)", "Schedule (days, start, end and break)", "Horario (días, entrada, salida e intervalo)")} ajuda={L("Ex.: Seg a sex 08:00–12:00 e 13:00–17:48. O eSocial exige.", "E.g. Mon–Fri 08:00–12:00 and 13:00–17:48. eSocial requires it.", "Ej.: Lun a vie 08:00–12:00 y 13:00–17:48. eSocial lo exige.")} /></div>
                    <F k="tmp_parc" r={L("Tempo parcial", "Part-time", "Tiempo parcial")} opcoes={[{ v: "0", l: L("Não é tempo parcial", "Not part-time", "No es tiempo parcial") }, { v: "2", l: L("Até 30 horas por semana", "Up to 30 hours/week", "Hasta 30 horas/semana") }, { v: "3", l: L("Até 26 horas por semana", "Up to 26 hours/week", "Hasta 26 horas/semana") }, { v: "1", l: L("Até 25 horas (só doméstico)", "Up to 25 hours (domestic only)", "Hasta 25 horas (solo doméstico)") }]} />
                    <F k="nat_atividade" r={L("Natureza da atividade", "Nature of the work", "Naturaleza de la actividad")} opcoes={[{ v: "1", l: L("Urbana", "Urban", "Urbana") }, { v: "2", l: L("Rural", "Rural", "Rural") }]} />
                    {String(form.tp_contr) !== "1" && <F k="clau_assec" r={L("Cláusula de rescisão antecipada", "Early termination clause", "Cláusula de rescisión anticipada")} ajuda={L("CLT art. 481: o contrato permite que qualquer lado encerre antes do prazo?", "CLT art. 481: may either side end the contract early?", "CLT art. 481: ¿cualquier parte puede terminar antes del plazo?")} opcoes={[vazio, { v: "N", l: L("Não", "No", "No") }, { v: "S", l: L("Sim", "Yes", "Sí") }]} />}
                    {String(form.tp_contr) === "3" && <F k="obj_det" r={L("Objeto do contrato (obra, serviço, safra) *", "Contract purpose (project, service, harvest) *", "Objeto del contrato (obra, servicio, cosecha) *")} />}
                    <F k="cnpj_sindicato" r={L("CNPJ do sindicato (só se for diferente do da filial)", "Union CNPJ (only if different from the branch)", "CNPJ del sindicato (solo si difiere de la sucursal)")} mascara={mascaraCNPJ} modo="numeric" ajuda={L("Categoria diferenciada (ex.: motorista). Vazio = usa o sindicato cadastrado na filial.", "Differentiated category (e.g. driver). Empty = uses the union on the branch.", "Categoría diferenciada (ej.: conductor). Vacío = usa el sindicato de la sucursal.")} />
                    <F k="data_base" r={L("Mês da data-base da categoria", "Collective bargaining month", "Mes de la fecha base de la categoría")} opcoes={[vazio, ...Array.from({ length: 12 }, (_, i) => ({ v: String(i + 1), l: new Date(2026, i, 1).toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", { month: "long" }) }))]} />
                    <div className="md:col-span-2"><F k="dsc_sal_var" r={L("Salário variável: como é calculado (só tarefa/comissão)", "Variable pay: how it is calculated (task/commission only)", "Salario variable: cómo se calcula (solo tarea/comisión)")} ajuda={L("Ex.: comissão de 3% sobre as vendas do mês.", "E.g. 3% commission on monthly sales.", "Ej.: comisión del 3% sobre las ventas del mes.")} /></div>
                    {String(form.cod_categ) === "103" && (<>
                      <F k="apr_ind" r={L("Aprendiz: forma de contratação", "Apprentice: hiring method", "Aprendiz: forma de contratación")} opcoes={[vazio, { v: "1", l: L("Direta (a Empresa cumpre a cota)", "Direct (the company fulfils the quota)", "Directa (la empresa cumple la cuota)") }, { v: "2", l: L("Indireta (entidade sem fins lucrativos contrata)", "Indirect (non-profit entity hires)", "Indirecta (entidad sin fines de lucro contrata)") }]} />
                      {String(form.apr_ind) === "1" && <F k="apr_cnpj_ent_qual" r={L("CNPJ da entidade qualificadora (curso)", "Training entity CNPJ (course)", "CNPJ de la entidad calificadora (curso)")} mascara={mascaraCNPJ} modo="numeric" />}
                      {String(form.apr_ind) === "2" && (<>
                        <F k="apr_tp_insc" r={L("Estabelecimento que cumpre a cota: tipo", "Quota establishment: type", "Establecimiento de la cuota: tipo")} opcoes={[{ v: "1", l: "CNPJ" }, { v: "2", l: "CPF" }]} />
                        <F k="apr_nr_insc" r={L("CNPJ/CPF do estabelecimento que cumpre a cota", "CNPJ/CPF of the quota establishment", "CNPJ/CPF del establecimiento de la cuota")} mascara={String(form.apr_tp_insc) === "2" ? mascaraCPF : mascaraCNPJ} modo="numeric" />
                      </>)}
                      <F k="apr_cnpj_prat" r={L("CNPJ do local das atividades práticas (só se for outro)", "Practical activities CNPJ (only if elsewhere)", "CNPJ del lugar de las actividades prácticas (solo si es otro)")} mascara={mascaraCNPJ} modo="numeric" />
                    </>)}
                    {String(form.cod_categ) === "106" && (<>
                      <F k="temp_hip_leg" r={L("Temporário: motivo legal (Lei 6.019/1974)", "Temporary: legal reason (Law 6,019/1974)", "Temporal: motivo legal (Ley 6.019/1974)")} opcoes={[vazio, { v: "1", l: L("Substituição de pessoal permanente", "Replacing permanent staff", "Sustitución de personal permanente") }, { v: "2", l: L("Demanda complementar de serviços", "Extra demand for services", "Demanda complementaria de servicios") }]} />
                      <F k="temp_tomador_tp_insc" r={L("Cliente (tomador): tipo", "Client: type", "Cliente (tomador): tipo")} opcoes={[{ v: "1", l: "CNPJ" }, { v: "2", l: "CPF" }]} />
                      <F k="temp_tomador_nr_insc" r={L("CNPJ/CPF do cliente (tomador)", "Client CNPJ/CPF", "CNPJ/CPF del cliente (tomador)")} mascara={String(form.temp_tomador_tp_insc) === "2" ? mascaraCPF : mascaraCNPJ} modo="numeric" />
                      {String(form.temp_hip_leg) === "1" && <F k="temp_cpf_substituidos" r={L("CPF de quem está sendo substituído (até 9, separados por vírgula)", "CPF of who is being replaced (up to 9, comma-separated)", "CPF de quien es sustituido (hasta 9, separados por coma)")} />}
                      <F largo k="temp_just_contr" r={L("Justificativa (o fato que motiva a contratação)", "Justification (the fact behind the hiring)", "Justificación (el hecho que motiva la contratación)")} ajuda={L("Ex.: substituição de empregada em licença-maternidade até 30/04/2027.", "E.g. replacing an employee on maternity leave until 04/30/2027.", "Ej.: sustitución de empleada en licencia por maternidad hasta el 30/04/2027.")} />
                    </>)}
                    {["104", "106"].includes(String(form.cod_categ)) && (<>
                      <p className="md:col-span-2 text-xs font-bold" style={{ color: ROTULO }}>{String(form.cod_categ) === "104" ? L("Local de trabalho: a casa onde a pessoa trabalha", "Workplace: the home where the person works", "Lugar de trabajo: la casa donde trabaja la persona") : L("Local de trabalho: onde a pessoa vai trabalhar (cliente)", "Workplace: where the person will work (client)", "Lugar de trabajo: donde la persona va a trabajar (cliente)")}</p>
                      <F k="lt_cep" r={L("CEP do local de trabalho", "Workplace CEP", "CEP del lugar de trabajo")} mascara={mascaraCEP} modo="numeric" aoMudar={(v) => void preencherLtPorCep(v)} />
                      <F k="lt_logradouro" r={L("Endereço", "Street", "Dirección")} />
                      <F k="lt_numero" r={L("Número", "Number", "Número")} />
                      <F k="lt_complemento" r={L("Complemento", "Complement", "Complemento")} />
                      <F k="lt_bairro" r={L("Bairro", "District", "Barrio")} />
                      <F k="lt_uf" r="UF" opcoes={[vazio, ...UFS.map((u) => ({ v: u, l: u }))]} />
                      <F k="lt_cod_munic" r={L("Código do município (IBGE)", "City code (IBGE)", "Código del municipio (IBGE)")} modo="numeric" ajuda={L("Vem sozinho pelo CEP.", "Fills in from the CEP.", "Se completa con el CEP.")} />
                    </>)}
                    {String(form.cod_categ) === "104" && <p className="md:col-span-2 text-xs" style={{ color: TEXTO_SEC }}>{L("Doméstico: o empregador é a pessoa física (CPF) — cadastre-o em RH · Estrutura → Empregador com tipo CPF. O sindicato vai aqui no contrato.", "Domestic: the employer is the individual (CPF) — register them in HR · Structure → Employer with type CPF. The union goes here on the contract.", "Doméstico: el empleador es la persona física (CPF) — regístrelo en RR. HH. · Estructura → Empleador con tipo CPF. El sindicato va aquí en el contrato.")}</p>}
                    {String(form.cod_categ) === "111" && <p className="md:col-span-2 text-xs" style={{ color: TEXTO_SEC }}>{L("Intermitente (CLT art. 452-A): sem horas fixas por semana. No horário, descreva como é feita a convocação; o salário costuma ser por hora.", "Intermittent (CLT art. 452-A): no fixed weekly hours. In the schedule, describe how calls are made; pay is usually hourly.", "Intermitente (CLT art. 452-A): sin horas fijas por semana. En el horario, describa cómo es la convocatoria; el salario suele ser por hora.")}</p>}
                    {form.situacao === "desligado" && <F k="data_desligamento" tipo="date" r={L("Data do desligamento", "Termination date", "Fecha de desvinculación")} />}
                  </Secao>

                  {pode.pessoais ? (
                    <Secao ancora="pessoais" titulo={L("Dados pessoais (protegidos)", "Personal data (protected)", "Datos personales (protegidos)")}>
                      <F k="cpf" r="CPF" mascara={mascaraCPF} modo="numeric" erro={soDig(form.cpf).length === 11 && !validarCPF(soDig(form.cpf)) ? L("CPF inválido (dígito verificador não confere).", "Invalid CPF (check digit does not match).", "CPF inválido (dígito verificador no coincide).") : null} />
                      <F k="data_nascimento" tipo="date" r={L("Data de nascimento", "Date of birth", "Fecha de nacimiento")} />
                      <F k="sexo" r={L("Sexo (exigido pelo eSocial)", "Sex (required by eSocial)", "Sexo (exigido por eSocial)")} opcoes={[vazio, { v: "F", l: L("Feminino", "Female", "Femenino") }, { v: "M", l: L("Masculino", "Male", "Masculino") }]} />
                      <F k="raca_cor" r={L("Raça/cor (autodeclaração)", "Race/color (self-declared)", "Raza/color (autodeclaración)")} ajuda={L("Exigido pelo eSocial. Nunca é usado em nenhuma análise ou decisão do Axioma.", "Required by eSocial. Never used in any Axioma analysis or decision.", "Exigido por eSocial. Nunca se usa en ningún análisis o decisión de Axioma.")}
                        opcoes={[vazio, { v: "1", l: L("Branca", "White", "Blanca") }, { v: "2", l: L("Preta", "Black", "Negra") }, { v: "3", l: L("Parda", "Brown (parda)", "Parda") }, { v: "4", l: L("Amarela", "Asian (amarela)", "Amarilla") }, { v: "5", l: L("Indígena", "Indigenous", "Indígena") }, { v: "6", l: L("Não informado", "Not informed", "No informado") }]} />
                      <F k="estado_civil" r={L("Estado civil", "Marital status", "Estado civil")} opcoes={[vazio, { v: "1", l: L("Solteiro", "Single", "Soltero") }, { v: "2", l: L("Casado", "Married", "Casado") }, { v: "3", l: L("Divorciado", "Divorced", "Divorciado") }, { v: "4", l: L("Separado", "Separated", "Separado") }, { v: "5", l: L("Viúvo", "Widowed", "Viudo") }]} />
                      <F k="grau_instr" r={L("Grau de instrução", "Education level", "Nivel de instrucción")} opcoes={[vazio, ...["Analfabeto", "Até o 5º ano incompleto", "5º ano completo", "6º ao 9º ano incompleto", "Fundamental completo", "Médio incompleto", "Médio completo", "Superior incompleto", "Superior completo", "Pós-graduação", "Mestrado", "Doutorado"].map((t, i) => ({ v: String(i + 1).padStart(2, "0"), l: `${String(i + 1).padStart(2, "0")} — ${t}` }))]} />
                      <F k="telefone" r={L("Telefone", "Phone", "Teléfono")} mascara={mascaraTelefone} modo="tel" />
                      <F k="email" tipo="email" r="E-mail" modo="email" />
                      <F k="pais_nascimento_txt" r={L("País de nascimento", "Country of birth", "País de nacimiento")} lista="lista-paises" ajuda={L("Comece a digitar e escolha na lista.", "Start typing and pick from the list.", "Empiece a escribir y elija en la lista.")} />
                      <F k="pais_nacionalidade_txt" r={L("Nacionalidade", "Nationality", "Nacionalidad")} lista="lista-paises" />
                      {(codigoPais(form.pais_nacionalidade_txt) ?? "105") !== "105" && (<>
                        <F k="imig_cond_ing" r={L("Estrangeiro: condição de ingresso", "Foreigner: entry condition", "Extranjero: condición de ingreso")} opcoes={[vazio, { v: "1", l: L("Refugiado", "Refugee", "Refugiado") }, { v: "2", l: L("Solicitante de refúgio", "Asylum seeker", "Solicitante de refugio") }, { v: "3", l: L("Reunião familiar", "Family reunion", "Reunión familiar") }, { v: "4", l: L("Acordo do Mercosul", "Mercosur agreement", "Acuerdo del Mercosur") }, { v: "5", l: L("Dependente de agente diplomático", "Dependent of a diplomatic agent", "Dependiente de agente diplomático") }, { v: "6", l: L("Tratado Brasil–Portugal", "Brazil–Portugal treaty", "Tratado Brasil–Portugal") }, { v: "7", l: L("Outra condição", "Other condition", "Otra condición") }]} />
                        <F k="imig_tmp_resid" r={L("Estrangeiro: tempo de residência", "Foreigner: residence term", "Extranjero: tiempo de residencia")} opcoes={[vazio, { v: "1", l: L("Prazo indeterminado", "Indefinite", "Plazo indeterminado") }, { v: "2", l: L("Prazo determinado", "Fixed term", "Plazo determinado") }]} />
                      </>)}
                      <F k="cep" r="CEP" mascara={mascaraCEP} modo="numeric" aoMudar={(v) => void preencherPorCep(v)} ajuda={cepMsg ?? L("Digite o CEP: endereço, bairro, cidade e UF se preenchem sozinhos.", "Type the postal code: street, district, city and state fill in automatically.", "Escriba el CEP: dirección, barrio, ciudad y estado se completan solos.")} />
                      <F k="logradouro" r={L("Endereço", "Street", "Dirección")} />
                      <F k="numero" r={L("Número", "Number", "Número")} />
                      <F k="complemento" r={L("Complemento", "Complement", "Complemento")} />
                      <F k="bairro" r={L("Bairro", "District", "Barrio")} />
                      <F k="cidade" r={L("Cidade", "City", "Ciudad")} />
                      <F k="uf" r="UF" opcoes={[vazio, ...UFS.map((u) => ({ v: u, l: u }))]} />
                      <F k="cod_munic" r={L("Código do município (IBGE)", "City code (IBGE)", "Código del municipio (IBGE)")} modo="numeric" ajuda={L("Vem sozinho ao digitar o CEP. O eSocial exige.", "Fills in when you type the CEP. eSocial requires it.", "Se completa al escribir el CEP. eSocial lo exige.")} />
                      <F k="emergencia_nome" r={L("Contato de emergência", "Emergency contact", "Contacto de emergencia")} />
                      <F k="emergencia_telefone" r={L("Telefone de emergência", "Emergency phone", "Teléfono de emergencia")} mascara={mascaraTelefone} modo="tel" />
                      <datalist id="lista-paises">{paises.map((p) => <option key={p.codigo} value={`${p.codigo} — ${p.nome}`} />)}</datalist>
                    </Secao>
                  ) : (
                    <p className="text-xs mt-3" style={{ color: TEXTO_SEC }}>{L("Dados pessoais: você não tem liberação para ver.", "Personal data: you are not granted access.", "Datos personales: no tiene habilitación para ver.")}</p>
                  )}

                  {pode.saude ? (
                    <Secao ancora="pcd" titulo={L("Pessoa com deficiência (dado de saúde, protegido)", "Person with disability (health data, protected)", "Persona con discapacidad (dato de salud, protegido)")}>
                      <div className="md:col-span-2 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: "var(--axi-text-primary)" }}>
                        {([["def_fisica", L("Física", "Physical", "Física")], ["def_visual", L("Visual", "Visual", "Visual")], ["def_auditiva", L("Auditiva", "Hearing", "Auditiva")], ["def_mental", L("Mental", "Mental", "Mental")], ["def_intelectual", L("Intelectual", "Intellectual", "Intelectual")], ["reab_readap", L("Reabilitado pelo INSS", "Rehabilitated by INSS", "Rehabilitado por el INSS")]] as const).map(([k, rot]) => (
                          <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={!!form[`pcd_${k}`]} onChange={(e) => setForm({ ...form, [`pcd_${k}`]: e.target.checked })} /> {rot}</label>
                        ))}
                      </div>
                      {String(form.data_admissao) < "2026-10-26" && <F k="pcd_info_cota" r={L("Conta na cota de PCD/reabilitados?", "Counts toward the disability quota?", "¿Cuenta en la cuota de PcD/rehabilitados?")} ajuda={L("O eSocial pede só para admissão antes de 26/10/2026.", "eSocial asks only for hires before 10/26/2026.", "eSocial lo pide solo para admisiones antes del 26/10/2026.")} opcoes={[vazio, { v: "S", l: L("Sim", "Yes", "Sí") }, { v: "N", l: L("Não", "No", "No") }]} />}
                      <F largo k="pcd_observacao" r={L("Observação (opcional)", "Note (optional)", "Observación (opcional)")} ajuda={L("Só o necessário para o posto de trabalho. Lei 8.213/1991 art. 93 (cota) e LGPD art. 11 (dado sensível).", "Only what the workstation needs. Law 8,213/1991 art. 93 (quota) and LGPD art. 11 (sensitive data).", "Solo lo necesario para el puesto. Ley 8.213/1991 art. 93 (cuota) y LGPD art. 11 (dato sensible).")} />
                    </Secao>
                  ) : (
                    <p className="text-xs mt-2" style={{ color: TEXTO_SEC }}>{L("Pessoa com deficiência: dado de saúde, você não tem liberação para ver.", "Person with disability: health data, you are not granted access.", "Persona con discapacidad: dato de salud, no tiene habilitación para ver.")}</p>
                  )}

                  {pode.salario ? (
                    <Secao ancora="salario" titulo={L("Salário (protegido)", "Salary (protected)", "Salario (protegido)")}>
                      {!form.id ? (<>
                        <F k="valor" r={L("Salário na admissão (R$)", "Salary at hire (R$)", "Salario en la admisión (R$)")} />
                        <F k="und_sal_fixo" r={L("Por", "Per", "Por")} opcoes={[{ v: "5", l: L("Mês", "Month", "Mes") }, { v: "1", l: L("Hora", "Hour", "Hora") }, { v: "2", l: L("Dia", "Day", "Día") }, { v: "3", l: L("Semana", "Week", "Semana") }, { v: "4", l: L("Quinzena", "Fortnight", "Quincena") }, { v: "6", l: L("Tarefa", "Task", "Tarea") }, { v: "7", l: L("Só variável (comissão)", "Variable only (commission)", "Solo variable (comisión)") }]} />
                      </>) : (<>
                        <div className="md:col-span-2 text-sm" style={{ color: "var(--axi-text-primary)" }}>
                          {salarioAtual ? <>{L("Salário atual", "Current salary", "Salario actual")}: <b style={{ color: VERDE }}>R$ {fBRL2(Number(salarioAtual.valor))}</b> {L("desde", "since", "desde")} {dataBR(salarioAtual.vigencia_inicio)}</> : L("Sem salário registrado.", "No salary recorded.", "Sin salario registrado.")}
                          {historico.length > 1 && <ul className="mt-2 text-xs space-y-0.5" style={{ color: TEXTO_SEC }}>{historico.slice(1).map((h) => <li key={h.id}>{dataBR(h.vigencia_inicio)} — R$ {fBRL2(Number(h.valor))} ({h.motivo})</li>)}</ul>}
                        </div>
                        <F k="reajuste_valor" r={L("Novo salário (R$) — deixe vazio se não mudou", "New salary (R$) — leave empty if unchanged", "Nuevo salario (R$) — vacío si no cambió")} />
                        <F k="reajuste_data" tipo="date" r={L("Vale a partir de", "Effective from", "Vigente desde")} />
                        <F k="reajuste_motivo" r={L("Motivo", "Reason", "Motivo")} opcoes={[{ v: "reajuste_coletivo", l: L("Reajuste da convenção", "Collective raise", "Reajuste del convenio") }, { v: "merito", l: L("Mérito", "Merit", "Mérito") }, { v: "promocao", l: L("Promoção", "Promotion", "Promoción") }, { v: "enquadramento", l: L("Enquadramento", "Reclassification", "Encuadramiento") }, { v: "correcao", l: L("Correção de valor lançado errado", "Correction of a wrong entry", "Corrección de valor registrado mal") }, { v: "outro", l: L("Outro", "Other", "Otro") }]} />
                        <p className="md:col-span-2 text-xs" style={{ color: TEXTO_SEC }}>{L("O histórico de salário nunca é apagado nem alterado: valor errado se corrige com uma nova linha, motivo \"Correção\".", "Salary history is never deleted or changed: a wrong value is corrected with a new line, reason \"Correction\".", "El historial de salario nunca se borra ni se cambia: un valor erróneo se corrige con una nueva línea, motivo \"Corrección\".")}</p>
                      </>)}
                    </Secao>
                  ) : (
                    <p className="text-xs mt-2" style={{ color: TEXTO_SEC }}>{L("Salário: você não tem liberação para ver.", "Salary: you are not granted access.", "Salario: no tiene habilitación para ver.")}</p>
                  )}

                  {form.id && <HistoricoColab colaboradorId={form.id} empresaId={empresaId!} lang={lang} valorDe={valorHistorico} />}
                  {(pode.pessoais || pode.saude) && (form.id ? (
                    <ChecklistAdmissao colaboradorId={form.id} empresaId={empresaId!} podeDocs={pode.pessoais} podeSaude={pode.saude} podeEditar={pode.editar} lang={lang} avisar={avisar} />
                  ) : (
                    <p className="text-xs mt-3" style={{ color: TEXTO_SEC }}>{L("Documentos e exames da admissão: salve o cadastro primeiro e abra de novo pelo lápis.", "Hiring documents and exams: save the record first and reopen it with the pencil.", "Documentos y exámenes de admisión: guarde el registro primero y ábralo de nuevo con el lápiz.")}</p>
                  ))}

                  {form.id && pode.pessoais && <DependentesColab colaboradorId={form.id} empresaId={empresaId!} lang={lang} podeEditar={pode.editar} avisar={avisar} />}
                  {form.id && form.contrato_id && <CartaoEsocial contratoId={form.contrato_id} empresaId={empresaId!} lang={lang} pode={pode} avisar={avisar} aoMudar={(sit) => { setForm((f) => (f ? { ...f, contrato_situacao: sit } : f)); void carregarLista(); }} />}
                  {form.id && form.contrato_id && ["ativo", "afastado", "desligado"].includes(form.situacao) && <DesligamentoColab contratoId={form.contrato_id} empresaId={empresaId!} lang={lang} pode={pode} avisar={avisar} aoMudar={() => { setForm(null); void carregarLista(); }} />}
                  {pode.editar && (
                    <BotaoAcao executar={salvar} texto={L("Salvar", "Save", "Guardar")} textoTrabalhando={L("Salvando…", "Saving…", "Guardando…")} className="w-full mt-4 py-3.5 rounded-xl" estilo={{ background: BTN, color: "#fff" }} />
                  )}
                </CanvasBox>
                </FormCtx.Provider>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <CentroCompartilhamento aberto={shareAberto} onFechar={() => setShareAberto(false)} lang={lang} textoResumo={resumoShare} textoDetalhado={detalhadoShare}
          assunto={L("RH — Colaboradores — Axioma", "HR — Employees — Axioma", "RR. HH. — Colaboradores — Axioma")} onExportarPDF={() => exportar("pdf")} cor="#0f7a5a" />
        {importAberto && empresaId && <ImportarPlanilha empresaId={empresaId} lang={lang} temaClaro={temaClaro} podePessoais={pode.pessoais} podeSalario={pode.salario} aoFechar={() => setImportAberto(false)} aoImportar={() => void carregarLista()} />}
        {janelaConfirmacao}
        <AvisoAxioma aviso={aviso} onFechar={() => setAviso(null)} />
      </ModuloLayout>
    </div>
  );
}

// Documentos (dado pessoal) e exames (dado de saúde) da admissão. Cada mudança grava na hora; a trava está no banco
// (RLS de rh_admissao_itens: documento → 'pessoais', exame → 'saude'). O que a lei proíbe pedir aparece só como aviso.
// Histórico de alterações (rh_historico, gravado pelo banco; ninguém edita nem apaga). Cada parte aparece só para
// quem tem a liberação dela. Dados pessoais, saúde e salário: só o nome do campo, nunca o valor.
const CAMPO_NOME: Record<string, [string, string, string]> = {
  nome: ["Nome", "Name", "Nombre"], nome_social: ["Nome social", "Social name", "Nombre social"], situacao: ["Situação", "Status", "Situación"],
  matricula: ["Matrícula", "Employee ID", "Matrícula"], cod_categ: ["Categoria", "Category", "Categoría"], data_admissao: ["Admissão", "Hire date", "Admisión"],
  tp_contr: ["Tipo de contrato", "Contract type", "Tipo de contrato"], data_termino: ["Término", "End date", "Término"], experiencia: ["Experiência", "Probation", "Experiencia"],
  cargo_id: ["Cargo", "Job title", "Cargo"], departamento_id: ["Departamento", "Department", "Departamento"], estabelecimento_id: ["Filial", "Branch", "Sucursal"],
  lotacao_id: ["Lotação", "Tax unit", "Lotación"], centro_custo_id: ["Centro de custo", "Cost center", "Centro de costo"], gestor_id: ["Gestor", "Manager", "Gestor"],
  qtd_hrs_sem: ["Horas por semana", "Weekly hours", "Horas semanales"], tp_jornada: ["Jornada", "Schedule", "Jornada"], data_desligamento: ["Desligamento", "Termination", "Desvinculación"],
  situacao_esocial: ["Situação no eSocial", "eSocial status", "Situación en eSocial"], recibo_esocial: ["Recibo do eSocial", "eSocial receipt", "Recibo de eSocial"],
  tp_reg_jor: ["Controle de horário", "Working-time control", "Control de horario"], nat_atividade: ["Natureza da atividade", "Nature of work", "Naturaleza de la actividad"],
  tmp_parc: ["Tempo parcial", "Part-time", "Tiempo parcial"], hor_noturno: ["Trabalho noturno", "Night work", "Trabajo nocturno"], dsc_jorn: ["Horário", "Schedule", "Horario"],
  clau_assec: ["Cláusula de rescisão antecipada", "Early termination clause", "Cláusula de rescisión anticipada"], obj_det: ["Objeto do contrato", "Contract purpose", "Objeto del contrato"],
  data_base: ["Mês da data-base", "Bargaining month", "Mes de fecha base"], cnpj_sindicato: ["CNPJ do sindicato", "Union CNPJ", "CNPJ del sindicato"], dsc_sal_var: ["Salário variável", "Variable pay", "Salario variable"],
  cod_munic: ["Código do município", "City code", "Código del municipio"], imig_tmp_resid: ["Tempo de residência", "Residence term", "Tiempo de residencia"], imig_cond_ing: ["Condição de ingresso", "Entry condition", "Condición de ingreso"],
  apr_ind: ["Aprendiz: forma de contratação", "Apprentice: hiring", "Aprendiz: contratación"], apr_cnpj_ent_qual: ["Entidade qualificadora", "Training entity", "Entidad calificadora"], apr_tp_insc: ["Aprendiz: tipo", "Apprentice: type", "Aprendiz: tipo"], apr_nr_insc: ["Aprendiz: estabelecimento da cota", "Apprentice: quota establishment", "Aprendiz: establecimiento"], apr_cnpj_prat: ["Local das atividades práticas", "Practical activities place", "Lugar de las prácticas"],
  temp_hip_leg: ["Temporário: motivo", "Temporary: reason", "Temporal: motivo"], temp_just_contr: ["Temporário: justificativa", "Temporary: justification", "Temporal: justificación"], temp_tomador_tp_insc: ["Cliente: tipo", "Client: type", "Cliente: tipo"], temp_tomador_nr_insc: ["Cliente (tomador)", "Client", "Cliente (tomador)"], temp_cpf_substituidos: ["Substituídos", "Replaced workers", "Sustituidos"],
  lt_cep: ["Local de trabalho: CEP", "Workplace: CEP", "Lugar de trabajo: CEP"], lt_logradouro: ["Local de trabalho: endereço", "Workplace: street", "Lugar de trabajo: dirección"], lt_numero: ["Local de trabalho: número", "Workplace: number", "Lugar de trabajo: número"], lt_complemento: ["Local de trabalho: complemento", "Workplace: complement", "Lugar de trabajo: complemento"], lt_bairro: ["Local de trabalho: bairro", "Workplace: district", "Lugar de trabajo: barrio"], lt_cod_munic: ["Local de trabalho: município", "Workplace: city", "Lugar de trabajo: municipio"], lt_uf: ["Local de trabalho: UF", "Workplace: state", "Lugar de trabajo: estado"],
  def_fisica: ["Deficiência física", "Physical disability", "Discapacidad física"], def_visual: ["Deficiência visual", "Visual disability", "Discapacidad visual"], def_auditiva: ["Deficiência auditiva", "Hearing disability", "Discapacidad auditiva"], def_mental: ["Deficiência mental", "Mental disability", "Discapacidad mental"], def_intelectual: ["Deficiência intelectual", "Intellectual disability", "Discapacidad intelectual"], reab_readap: ["Reabilitado", "Rehabilitated", "Rehabilitado"], info_cota: ["Cota PCD", "Disability quota", "Cuota PcD"],
  tp_dep: ["Tipo de dependente", "Dependent type", "Tipo de dependiente"], dep_irrf: ["Deduz no IR", "Income tax deduction", "Deduce en IR"], dep_sf: ["Salário-família", "Family allowance", "Asignación familiar"], inc_trab: ["Incapaz para o trabalho", "Unable to work", "Incapaz para el trabajo"], descr_dep: ["Descrição do dependente", "Dependent description", "Descripción del dependiente"],
  tp_reg_trab: ["Regime trabalhista", "Labor regime", "Régimen laboral"], tp_reg_prev: ["Regime previdenciário", "Pension regime", "Régimen previsional"],
  cpf: ["CPF", "CPF", "CPF"], data_nascimento: ["Nascimento", "Birth date", "Nacimiento"], sexo: ["Sexo", "Sex", "Sexo"], raca_cor: ["Raça/cor", "Race/color", "Raza/color"],
  estado_civil: ["Estado civil", "Marital status", "Estado civil"], grau_instr: ["Escolaridade", "Education", "Escolaridad"], pais_nascimento: ["País de nascimento", "Country of birth", "País de nacimiento"],
  pais_nacionalidade: ["Nacionalidade", "Nationality", "Nacionalidad"], cep: ["CEP", "ZIP", "CEP"], logradouro: ["Endereço", "Address", "Dirección"], numero: ["Número", "Number", "Número"],
  complemento: ["Complemento", "Complement", "Complemento"], bairro: ["Bairro", "District", "Barrio"], cidade: ["Cidade", "City", "Ciudad"], uf: ["Estado", "State", "Estado"],
  telefone: ["Telefone", "Phone", "Teléfono"], email: ["E-mail", "E-mail", "E-mail"], emergencia_nome: ["Contato de emergência", "Emergency contact", "Contacto de emergencia"],
  emergencia_telefone: ["Telefone de emergência", "Emergency phone", "Teléfono de emergencia"], vigencia_inicio: ["Vigência", "Effective date", "Vigencia"],
  und_sal_fixo: ["Unidade do salário", "Salary unit", "Unidad del salario"], valor: ["Valor", "Amount", "Valor"], motivo: ["Motivo", "Reason", "Motivo"], observacao: ["Observação", "Note", "Observación"],
  categoria: ["Categoria", "Category", "Categoría"], tipo: ["Item", "Item", "Ítem"], data_item: ["Data", "Date", "Fecha"], validade: ["Validade", "Expiry", "Validez"],
  resultado: ["Resultado", "Result", "Resultado"], arquivo_nome: ["Arquivo", "File", "Archivo"], user_id: ["Login ligado", "Linked login", "Login vinculado"],
};
const PARTE_NOME: Record<string, [string, string, string]> = { cadastro: ["Cadastro", "Record", "Registro"], contrato: ["Contrato", "Contract", "Contrato"], pessoal: ["Dados pessoais", "Personal data", "Datos personales"], salario: ["Salário", "Salary", "Salario"], documento: ["Documento", "Document", "Documento"], exame: ["Exame", "Exam", "Examen"], saude: ["Saúde (PCD)", "Health (disability)", "Salud (PcD)"] };
const ACAO_NOME: Record<string, [string, string, string]> = { criou: ["criou", "created", "creó"], alterou: ["alterou", "changed", "cambió"], lixeira: ["mandou para a lixeira", "moved to trash", "envió a la papelera"], recuperou: ["recuperou da lixeira", "restored from trash", "recuperó de la papelera"] };
function HistoricoColab({ colaboradorId, empresaId, lang, valorDe }: { colaboradorId: string; empresaId: string; lang: Lang; valorDe: (campo: string, v: unknown) => string }) {
  const c = useContext(FormCtx)!;
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const i = lang === "en" ? 1 : lang === "es" ? 2 : 0;
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState(false);
  const [quem, setQuem] = useState<Map<string, string>>(new Map());
  useEffect(() => { void (async () => {
    const [h, eq] = await Promise.all([
      supabase.from("rh_historico").select("id, parte, acao, campos, antes, depois, por, em").eq("colaborador_id", colaboradorId).order("em", { ascending: false }).order("id", { ascending: false }).limit(100),
      listarEquipe(empresaId),
    ]);
    if (h.error) { setErro(true); setLinhas([]); Sentry.captureException(new Error(`rh_historico: ${h.error.message}`)); return; }
    setQuem(new Map(eq.dados.filter((m) => m.user_id).map((m) => [m.user_id as string, m.nome || m.email])));
    setLinhas(h.data ?? []);
  })(); }, [colaboradorId]); // eslint-disable-line react-hooks/exhaustive-deps
  const rot = (k: string) => CAMPO_NOME[k]?.[i] ?? k;
  return (
    <Secao titulo={L("Histórico de alterações", "Change history", "Historial de cambios")}>
      <div className="md:col-span-2 space-y-2">
        {linhas === null ? <p className="text-sm" style={{ color: c.TEXTO_SEC }}>{L("Carregando…", "Loading…", "Cargando…")}</p>
          : erro ? <p className="text-sm font-semibold" style={{ color: "#b45309" }}>{L("Não foi possível carregar o histórico agora. Feche e abra de novo.", "Could not load the history now. Close and open again.", "No se pudo cargar el historial ahora. Cierre y abra de nuevo.")}</p>
          : linhas.length === 0 ? <p className="text-sm" style={{ color: c.TEXTO_SEC }}>{L("Nenhuma alteração registrada ainda.", "No changes recorded yet.", "Ningún cambio registrado todavía.")}</p>
          : linhas.map((h) => {
            const quando = new Date(h.em).toLocaleString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", { dateStyle: "short", timeStyle: "short" });
            const autor = h.por ? quem.get(h.por) ?? L("pessoa que saiu da equipe", "former team member", "persona que dejó el equipo") : L("sistema", "system", "sistema");
            const item = h.depois?.item ? ` — ${ITENS_ADMISSAO.find((x) => x.tipo === h.depois.item)?.nome[lang] ?? h.depois.item}` : "";
            const mostraValor = h.acao === "alterou" && (h.parte === "cadastro" || h.parte === "contrato");
            return (
              <div key={h.id} className="rounded-lg px-3 py-2 text-sm" style={{ border: `1px solid ${c.BORDA}` }}>
                <p style={{ color: "var(--axi-text-primary)" }}><b>{quando}</b> · {autor} {ACAO_NOME[h.acao]?.[i] ?? h.acao} <b>{PARTE_NOME[h.parte]?.[i] ?? h.parte}{item}</b></p>
                {h.campos?.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: c.TEXTO_SEC }}>
                    {mostraValor ? (h.campos as string[]).map((k) => `${rot(k)}: ${valorDe(k, h.antes?.[k])} → ${valorDe(k, h.depois?.[k])}`).join(" · ") : (h.campos as string[]).map(rot).join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("Gravado pelo banco a cada mudança — ninguém edita nem apaga. Dados pessoais, saúde e salário aparecem só pelo nome do campo.", "Recorded by the database on every change — nobody edits or deletes it. Personal, health and salary data show only the field name.", "Grabado por la base en cada cambio — nadie lo edita ni lo borra. Datos personales, salud y salario aparecen solo con el nombre del campo.")}</p>
      </div>
    </Secao>
  );
}

const COFRE_RH = "rh-documentos";
const LIMITE_ARQUIVO = 10 * 1024 * 1024;
const EXT_ARQUIVO: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
function ChecklistAdmissao({ colaboradorId, empresaId, podeDocs, podeSaude, podeEditar, lang, avisar }: {
  colaboradorId: string; empresaId: string; podeDocs: boolean; podeSaude: boolean; podeEditar: boolean; lang: Lang; avisar: (m: string, t?: "erro" | "ok") => void;
}) {
  const c = useContext(FormCtx)!;
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [itens, setItens] = useState<Record<string, Linha> | null>(null);
  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from("rh_admissao_itens").select("*").eq("colaborador_id", colaboradorId);
      if (error) { avisar(mensagemErroRh(error, lang)); setItens({}); return; }
      setItens(Object.fromEntries((data ?? []).map((x: Linha) => [x.tipo, x])));
    })();
  }, [colaboradorId]); // eslint-disable-line react-hooks/exhaustive-deps
  async function gravar(tipo: string, categoria: string, mudanca: Linha) {
    const atual = { ...(itens?.[tipo] ?? { situacao: "pendente" }), ...mudanca };
    const arquivo = mudanca.arquivo_path ? { arquivo_path: mudanca.arquivo_path, arquivo_nome: mudanca.arquivo_nome, arquivo_mime: mudanca.arquivo_mime, arquivo_bytes: mudanca.arquivo_bytes } : {};
    const linha = { empresa_id: empresaId, colaborador_id: colaboradorId, categoria, tipo, situacao: atual.situacao, data_item: atual.data_item || null, validade: atual.validade || null, resultado: tipo === "aso_admissional" ? atual.resultado || null : null, ...arquivo };
    const { data, error } = await supabase.from("rh_admissao_itens").upsert(linha, { onConflict: "colaborador_id,tipo" }).select("*").single();
    if (error || !data) { avisar(mensagemErroRh(error, lang)); return false; }
    setItens((v) => ({ ...(v ?? {}), [tipo]: data }));
    return true;
  }
  // Enviar: sobe no cofre privado, liga ao item (marca entregue + data de hoje se vazia) e só então apaga o arquivo antigo.
  // Se a linha não gravar, o arquivo novo é removido — nada fica solto no cofre.
  const [enviando, setEnviando] = useState<string | null>(null);
  async function enviarArquivo(tipo: string, categoria: string, file: File | undefined) {
    if (!file) return;
    const ext = EXT_ARQUIVO[file.type];
    if (!ext) { avisar(L("Envie PDF, JPG, PNG ou WEBP.", "Upload a PDF, JPG, PNG or WEBP.", "Envíe PDF, JPG, PNG o WEBP.")); return; }
    if (file.size > LIMITE_ARQUIVO) { avisar(L("Arquivo acima de 10 MB. Diminua a foto ou o PDF e envie de novo.", "File over 10 MB. Shrink the photo or PDF and upload again.", "Archivo de más de 10 MB. Reduzca la foto o el PDF y envíe de nuevo.")); return; }
    setEnviando(tipo);
    const path = `${empresaId}/${colaboradorId}/${categoria}/${tipo}-${Date.now()}.${ext}`;
    const antigo = itens?.[tipo]?.arquivo_path as string | undefined;
    const up = await supabase.storage.from(COFRE_RH).upload(path, file, { upsert: false, contentType: file.type });
    if (up.error) { setEnviando(null); Sentry.captureException(new Error(`rh-documentos upload: ${up.error.message}`)); avisar(L("O arquivo não foi enviado. Confira a conexão e tente de novo.", "The file was not uploaded. Check the connection and try again.", "El archivo no se envió. Revise la conexión e intente de nuevo.")); return; }
    const ok = await gravar(tipo, categoria, { arquivo_path: path, arquivo_nome: file.name.slice(0, 200), arquivo_mime: file.type, arquivo_bytes: file.size, situacao: "entregue", data_item: itens?.[tipo]?.data_item || hojeISO() });
    const sobra = ok ? antigo : path;
    if (sobra) { const rm = await supabase.storage.from(COFRE_RH).remove([sobra]); if (rm.error) Sentry.captureException(new Error(`rh-documentos remove: ${rm.error.message}`)); }
    setEnviando(null);
    if (ok) avisar(L("Arquivo enviado.", "File uploaded.", "Archivo enviado."), "ok");
  }
  async function baixarArquivo(it: Linha) {
    const { data, error } = await supabase.storage.from(COFRE_RH).createSignedUrl(it.arquivo_path, 60, { download: it.arquivo_nome || true });
    if (error || !data?.signedUrl) { avisar(L("Não foi possível baixar agora. Tente de novo.", "Could not download now. Try again.", "No se pudo descargar ahora. Intente de nuevo.")); return false; }
    const a = document.createElement("a"); a.href = data.signedUrl; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
    return true;
  }
  const visiveis = ITENS_ADMISSAO.filter((i) => (i.categoria === "documento" ? podeDocs : podeSaude));
  // agendado ainda é pendente: sem o ASO a pessoa não começa (NR-7)
  const pendObrig = visiveis.filter((i) => i.obrigatorio && ["pendente", "agendado"].includes(itens?.[i.tipo]?.situacao ?? "pendente")).length;
  const cor = (sit: string) => (sit === "entregue" ? "#0f7a5a" : sit === "dispensado" ? c.TEXTO_SEC : sit === "agendado" ? "#101b3d" : "#b45309");
  const grupo = (cat: "documento" | "exame", titulo: string) => {
    const lista = visiveis.filter((i) => i.categoria === cat);
    if (!lista.length) return null;
    return (
      <div className="md:col-span-2">
        <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: c.ROTULO }}>{titulo}</p>
        <div className="space-y-2">
          {lista.map((i) => {
            const it = itens?.[i.tipo] ?? {}; const sit = it.situacao ?? "pendente";
            return (
              <div key={i.tipo} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center rounded-lg px-3 py-2" style={{ border: `1px solid ${c.BORDA}` }}>
                <div className="md:col-span-5 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--axi-text-primary)" }}>{i.nome[lang]}{i.obrigatorio && <span style={{ color: "#b45309" }}> *</span>}</p>
                  <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{i.quando[lang]}</p>
                </div>
                <select aria-label={`${i.nome[lang]} — ${L("situação", "status", "situación")}`} disabled={!podeEditar || itens === null} value={sit} onChange={(e) => void gravar(i.tipo, i.categoria, { situacao: e.target.value })}
                  className="md:col-span-3 px-2 py-2 rounded-lg text-sm font-bold" style={{ ...c.campo, color: cor(sit) }}>
                  <option value="pendente">{L("Pendente", "Pending", "Pendiente")}</option>
                  {sit === "agendado" && <option value="agendado">{L("Agendado", "Scheduled", "Agendado")}</option>}
                  <option value="entregue">{i.categoria === "exame" ? L("Realizado", "Done", "Realizado") : L("Entregue", "Received", "Entregado")}</option>
                  <option value="dispensado">{L("Não se aplica", "Not applicable", "No aplica")}</option>
                </select>
                <input type="date" aria-label={`${i.nome[lang]} — ${L("data", "date", "fecha")}`} disabled={!podeEditar || itens === null} value={it.data_item ?? ""} onChange={(e) => void gravar(i.tipo, i.categoria, { data_item: e.target.value })}
                  className="md:col-span-2 px-2 py-2 rounded-lg text-sm" style={c.campo} />
                {i.tipo === "aso_admissional" ? (
                  <select aria-label={L("Resultado do ASO", "ASO result", "Resultado del ASO")} disabled={!podeEditar || itens === null} value={it.resultado ?? ""} onChange={(e) => void gravar(i.tipo, i.categoria, { resultado: e.target.value })}
                    className="md:col-span-2 px-2 py-2 rounded-lg text-sm" style={c.campo}>
                    <option value="">{L("Resultado", "Result", "Resultado")}</option>
                    <option value="apto">{L("Apto", "Fit", "Apto")}</option>
                    <option value="apto_com_restricao">{L("Apto com restrição", "Fit with restriction", "Apto con restricción")}</option>
                    <option value="inapto">{L("Inapto", "Unfit", "No apto")}</option>
                  </select>
                ) : <span className="md:col-span-2" />}
                {i.categoria === "exame" && (
                  <p className="md:col-span-12 text-xs" style={{ color: c.TEXTO_SEC }}>
                    {sit === "agendado" && it.agendado_para ? L(`Agendado para ${new Date(it.agendado_para).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}${it.clinica ? ` · ${it.clinica}` : ""}. `, `Scheduled for ${new Date(it.agendado_para).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}${it.clinica ? ` · ${it.clinica}` : ""}. `, `Agendado para ${new Date(it.agendado_para).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}${it.clinica ? ` · ${it.clinica}` : ""}. `) : ""}
                    <Link href="/rh/exames" className="underline font-bold" style={{ color: "#0f7a5a" }}>{sit === "pendente" ? L("Agendar em Exames ›", "Schedule in Exams ›", "Agendar en Exámenes ›") : L("Ver em Exames ›", "See in Exams ›", "Ver en Exámenes ›")}</Link>
                  </p>
                )}
                <div className="md:col-span-12 flex flex-wrap items-center gap-2">
                  {it.arquivo_path ? (
                    <>
                      <span className="text-xs flex items-center gap-1 min-w-0 truncate" style={{ color: c.TEXTO_SEC }}><Paperclip size={12} /> {it.arquivo_nome} · {(Number(it.arquivo_bytes) / 1024 / 1024).toFixed(1).replace(".", ",")} MB</span>
                      <BotaoAcao executar={() => baixarArquivo(it)} icone={<Download size={13} />} texto={L("Baixar", "Download", "Descargar")} textoTrabalhando={L("Baixando…", "Downloading…", "Descargando…")} className="px-3 py-1.5 rounded-lg text-xs" estilo={{ background: "linear-gradient(135deg, #0b5f46, #0f7a5a)", color: "#fff" }} />
                    </>
                  ) : <span className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("Sem arquivo", "No file", "Sin archivo")}</span>}
                  {podeEditar && (
                    <label className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${enviando ? "opacity-60 pointer-events-none" : "cursor-pointer"}`} style={{ background: "#101b3d", color: "#fff" }}>
                      <Upload size={13} /> {enviando === i.tipo ? L("Enviando…", "Uploading…", "Enviando…") : it.arquivo_path ? L("Trocar arquivo", "Replace file", "Cambiar archivo") : L("Enviar arquivo", "Upload file", "Enviar archivo")}
                      <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" disabled={!!enviando || itens === null} aria-label={`${i.nome[lang]} — ${L("enviar arquivo", "upload file", "enviar archivo")}`}
                        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void enviarArquivo(i.tipo, i.categoria, f); }} />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <Secao ancora="documentos" titulo={L("Documentos e exames da admissão", "Hiring documents and exams", "Documentos y exámenes de admisión")}>
      <p className="md:col-span-2 text-sm" style={{ color: pendObrig ? "#b45309" : "#0f7a5a", fontWeight: 700 }}>
        {itens === null ? L("Carregando…", "Loading…", "Cargando…") : pendObrig ? L(`${pendObrig} item(ns) obrigatório(s) pendente(s)`, `${pendObrig} required item(s) pending`, `${pendObrig} ítem(s) obligatorio(s) pendiente(s)`) : L("Itens obrigatórios em dia", "Required items complete", "Ítems obligatorios al día")}
      </p>
      {grupo("documento", L("Documentos (dados pessoais)", "Documents (personal data)", "Documentos (datos personales)"))}
      {grupo("exame", L("Exames (dado de saúde — só quem tem liberação)", "Exams (health data — authorized only)", "Exámenes (dato de salud — solo habilitados)"))}
      <div className="md:col-span-2 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--axi-text-primary)" }}>
        <p className="font-bold mb-1" style={{ color: "#dc2626" }}>{L("Proibido pedir na admissão", "Forbidden to require at hiring", "Prohibido exigir en la admisión")}</p>
        <ul className="list-disc pl-4 space-y-0.5">{PROIBIDOS.map((p) => <li key={p.pt}>{p[lang]}</li>)}</ul>
      </div>
    </Secao>
  );
}

// Admissão no eSocial (S-2200): o Axioma PREPARA o arquivo; o contador assina com o certificado dele e envia (decisão do Elias, 08/11/2026).
// Pendências e arquivo vêm de lib/rhEsocial.ts (testado contra o XSD oficial). O arquivo gerado fica guardado em rh_esocial_eventos
// (ninguém altera nem apaga) e a situação fica no contrato; o banco volta "preparado" a rascunho se um dado da admissão mudar.
const SIT_ESOCIAL: Record<string, [string, string, string]> = {
  rascunho: ["Rascunho — ainda não preparado", "Draft — not prepared yet", "Borrador — aún no preparado"],
  preparado: ["Arquivo preparado — falta o contador enviar", "File prepared — waiting for the accountant to send it", "Archivo preparado — falta que el contador lo envíe"],
  enviado: ["Enviado ao governo", "Sent to the government", "Enviado al gobierno"],
  enviado_pelo_contador: ["Enviado pelo contador", "Sent by the accountant", "Enviado por el contador"],
  aceito: ["Aceito pelo eSocial (com recibo)", "Accepted by eSocial (with receipt)", "Aceptado por eSocial (con recibo)"],
  recusado: ["Recusado pelo eSocial — corrigir e preparar de novo", "Rejected by eSocial — fix and prepare again", "Rechazado por eSocial — corregir y preparar de nuevo"],
};
const ONDE_NOME: Record<Pendencia["onde"], [string, string, string]> = {
  pcd: ["Pessoa com deficiência, acima", "Person with disability, above", "Persona con discapacidad, arriba"], dependentes: ["Dependentes, acima", "Dependents, above", "Dependientes, arriba"],
  pessoal: ["Dados pessoais, acima", "Personal data, above", "Datos personales, arriba"], contrato: ["Contrato, acima", "Contract, above", "Contrato, arriba"],
  salario: ["Salário, acima", "Salary, above", "Salario, arriba"], cargo: ["RH · Estrutura → Cargos", "HR · Structure → Job titles", "RR. HH. · Estructura → Cargos"],
  estrutura: ["RH · Estrutura → Filiais", "HR · Structure → Branches", "RR. HH. · Estructura → Sucursales"], empregador: ["RH · Estrutura → Empregador", "HR · Structure → Employer", "RR. HH. · Estructura → Empleador"],
};
function baixarXml(nome: string, xml: string) {
  const url = URL.createObjectURL(new Blob([xml], { type: "application/xml;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function CartaoEsocial({ contratoId, empresaId, lang, pode, avisar, aoMudar }: {
  contratoId: string; empresaId: string; lang: Lang; pode: { editar: boolean; pessoais: boolean; salario: boolean; saude: boolean };
  avisar: (m: string, t?: "erro" | "ok") => void; aoMudar: (situacao: string) => void;
}) {
  const c = useContext(FormCtx)!;
  const claro = c.titulo !== "var(--axi-text-primary)";
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const i = lang === "en" ? 1 : lang === "es" ? 2 : 0;
  const [dados, setDados] = useState<DadosS2200 | null>(null);
  const [situacao, setSituacao] = useState("rascunho");
  const [recibo, setRecibo] = useState("");
  // alterações depois da admissão enviada (S-2205 dados pessoais · S-2206 contrato); o banco marca as pendências
  const [pend2205, setPend2205] = useState(false);
  const [pend2206, setPend2206] = useState(false);
  const [alt, setAlt] = useState({ dt2205: hojeISO(), dt2206: hojeISO(), dtEf: "", dscAlt: "", justProrr: "" });
  const [recibos, setRecibos] = useState<Record<string, string>>({});
  const [eventos, setEventos] = useState<Linha[]>([]);
  const [erro, setErro] = useState(false);
  const podePreparar = pode.pessoais && pode.salario && pode.saude;

  async function carregar() {
    const { data: k, error: eK } = await supabase.from("rh_contratos").select("*").eq("id", contratoId).single();
    setErro(false);
    if (eK || !k) { setErro(true); Sentry.captureException(new Error(`rh/esocial contrato: ${eK?.message}`)); return; }
    setSituacao(k.situacao_esocial); setRecibo(k.recibo_esocial ?? ""); setPend2205(!!k.alt_cadastral_pendente); setPend2206(!!k.alt_contratual_pendente);
    const hoje = hojeISO();
    const nada = Promise.resolve({ data: null, error: null });
    const [col, pes, rem, cg, est, emp, ev, pcd, dep] = await Promise.all([
      supabase.from("rh_colaboradores").select("nome, nome_social").eq("id", k.colaborador_id).single(),
      pode.pessoais ? supabase.from("rh_colaborador_pessoal").select("*").eq("colaborador_id", k.colaborador_id).maybeSingle() : nada,
      pode.salario ? supabase.from("rh_remuneracoes").select("und_sal_fixo, valor, vigencia_inicio").eq("contrato_id", contratoId).lte("vigencia_inicio", k.data_admissao > hoje ? k.data_admissao : hoje).order("vigencia_inicio", { ascending: false }).limit(1) : nada,
      k.cargo_id ? supabase.from("rh_cargos").select("nome, cbo").eq("id", k.cargo_id).maybeSingle() : nada,
      k.estabelecimento_id ? supabase.from("rh_estabelecimentos").select("tp_insc, nr_insc, cnpj_sindicato").eq("id", k.estabelecimento_id).maybeSingle() : nada,
      supabase.from("rh_empregador").select("tp_insc, nr_insc, ini_valid").eq("empresa_id", empresaId).is("excluido_em", null).lte("ini_valid", String(k.data_admissao).slice(0, 7)).order("ini_valid", { ascending: false }).limit(1),
      podePreparar ? supabase.from("rh_esocial_eventos").select("id, evento, id_evento, versao_leiaute, xml, criado_em, situacao, recibo, data_ref").eq("contrato_id", contratoId).order("criado_em", { ascending: false }).limit(20) : Promise.resolve({ data: [], error: null }),
      pode.saude ? supabase.from("rh_colaborador_pcd").select("*").eq("colaborador_id", k.colaborador_id).maybeSingle() : nada,
      pode.pessoais ? supabase.from("rh_dependentes").select("tp_dep, nome, data_nascimento, cpf, dep_irrf, dep_sf, inc_trab, descr_dep").eq("colaborador_id", k.colaborador_id).is("excluido_em", null).order("data_nascimento") : Promise.resolve({ data: [], error: null }),
    ]);
    const falha = [col, pes, rem, cg, est, emp, ev, pcd, dep].find((x) => x.error);
    if (falha?.error) { setErro(true); Sentry.captureException(new Error(`rh/esocial leitura: ${falha.error.message}`)); return; }
    setEventos((ev.data as Linha[] | null) ?? []);
    const r0 = (rem.data as Linha[] | null)?.[0];
    const cd = col.data as Linha;
    setDados({
      empregador: ((emp.data as Linha[] | null)?.[0] as DadosS2200["empregador"]) ?? null, colab: { nome: cd.nome, nome_social: cd.nome_social },
      pessoal: (pes.data as Linha | null) ?? null, contrato: { ...(k as Linha), qtd_hrs_sem: k.qtd_hrs_sem == null ? null : Number(k.qtd_hrs_sem) } as DadosS2200["contrato"],
      cargo: (cg.data as DadosS2200["cargo"]) ?? null, remuneracao: r0 ? { und_sal_fixo: Number(r0.und_sal_fixo), valor: Number(r0.valor) } : null,
      estabelecimento: (est.data as DadosS2200["estabelecimento"]) ?? null,
      pcd: (pcd.data as DadosS2200["pcd"]) ?? null, dependentes: (dep.data as DadosS2200["dependentes"]) ?? [],
    });
  }
  useEffect(() => { void carregar(); }, [contratoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pend = dados ? pendenciasS2200(dados) : [];
  const nomeArquivo = (id: string) => `S-2200-${String(dados?.contrato.matricula ?? "").replace(/[^A-Za-z0-9-]/g, "")}-${id}.xml`;

  async function preparar(): Promise<boolean> {
    if (!dados || pend.length) return false;
    try {
      const { id, xml } = gerarS2200(dados, { agora: new Date(), seq: eventos.length + 1, tpAmb: 1 });
      const r1 = await supabase.from("rh_esocial_eventos").insert({ empresa_id: empresaId, contrato_id: contratoId, evento: "S-2200", id_evento: id, versao_leiaute: VERSAO_LEIAUTE, xml }).select("id").single();
      if (r1.error) { avisar(mensagemErroRh(r1.error, lang)); return false; }
      const r2 = await supabase.from("rh_contratos").update({ situacao_esocial: "preparado" }).eq("id", contratoId).in("situacao_esocial", ["rascunho", "recusado", "preparado"]).select("id");
      if (r2.error || !r2.data?.length) { avisar(L("O arquivo foi gerado, mas a situação não mudou. Recarregue a página e confira.", "The file was generated, but the status did not change. Reload the page and check.", "El archivo se generó, pero la situación no cambió. Recargue la página y revise.")); return false; }
      baixarXml(nomeArquivo(id), xml);
      avisar(L("Arquivo preparado e baixado. Entregue ao contador para assinar e enviar.", "File prepared and downloaded. Give it to the accountant to sign and send.", "Archivo preparado y descargado. Entréguelo al contador para firmar y enviar."), "ok");
      await carregar(); aoMudar("preparado");
      return true;
    } catch (e) { Sentry.captureException(e); avisar(L("Não foi possível preparar o arquivo.", "Could not prepare the file.", "No se pudo preparar el archivo.")); return false; }
  }
  async function prepararAlteracao(tipo: "S-2205" | "S-2206"): Promise<boolean> {
    if (!dados) return false;
    const hoje = hojeISO();
    try {
      const opc = { agora: new Date(), seq: eventos.length + 1, tpAmb: 1 as const, hoje };
      const { id, xml } = tipo === "S-2205"
        ? gerarS2205(dados, { ...opc, dtAlteracao: alt.dt2205 })
        : gerarS2206(dados, { ...opc, dtAlteracao: alt.dt2206, dtEf: alt.dtEf || null, dscAlt: alt.dscAlt.trim() || null, justProrr: alt.justProrr.trim() || null });
      const r1 = await supabase.from("rh_esocial_eventos").insert({ empresa_id: empresaId, contrato_id: contratoId, evento: tipo, id_evento: id, versao_leiaute: VERSAO_LEIAUTE, xml, data_ref: tipo === "S-2205" ? alt.dt2205 : alt.dt2206 }).select("id").single();
      if (r1.error) { avisar(mensagemErroRh(r1.error, lang)); return false; }
      const r2 = await supabase.from("rh_contratos").update(tipo === "S-2205" ? { alt_cadastral_pendente: false } : { alt_contratual_pendente: false }).eq("id", contratoId).select("id");
      if (r2.error || !r2.data?.length) { avisar(L("O arquivo foi gerado, mas a marca de pendência não saiu. Recarregue a página e confira.", "The file was generated, but the pending flag was not cleared. Reload and check.", "El archivo se generó, pero la marca de pendiente no se quitó. Recargue y revise.")); return false; }
      baixarXml(nomeArquivo(id), xml);
      avisar(L(`Alteração preparada (${tipo}) e baixada. Entregue ao contador.`, `Change prepared (${tipo}) and downloaded. Give it to the accountant.`, `Alteración preparada (${tipo}) y descargada. Entréguela al contador.`), "ok");
      await carregar();
      return true;
    } catch (e) { Sentry.captureException(e); avisar(L("Não foi possível preparar a alteração.", "Could not prepare the change.", "No se pudo preparar la alteración.")); return false; }
  }
  async function marcarEvento(ev: Linha, nova: "enviado_pelo_contador" | "aceito" | "recusado"): Promise<boolean> {
    const rec = (recibos[ev.id] ?? "").trim();
    if (nova === "aceito" && !/^[0-9.]{10,40}$/.test(rec)) { avisar(L("Informe o número do recibo (só números e pontos).", "Enter the receipt number (digits and dots only).", "Informe el número de recibo (solo números y puntos).")); return false; }
    const r = await supabase.from("rh_esocial_eventos").update({ situacao: nova, ...(nova === "aceito" ? { recibo: rec } : {}) }).eq("id", ev.id).select("id");
    if (r.error || !r.data?.length) { avisar(mensagemErroRh(r.error, lang)); return false; }
    avisar(L("Situação atualizada.", "Status updated.", "Situación actualizada."), "ok"); await carregar();
    return true;
  }
  async function marcar(nova: "enviado_pelo_contador" | "aceito" | "recusado"): Promise<boolean> {
    const rec = recibo.trim();
    if (nova === "aceito" && !/^[0-9.]{10,40}$/.test(rec)) { avisar(L("Informe o número do recibo que o contador recebeu do eSocial (só números e pontos).", "Enter the receipt number the accountant got from eSocial (digits and dots only).", "Informe el número de recibo que el contador recibió de eSocial (solo números y puntos).")); return false; }
    const r = await supabase.from("rh_contratos").update({ situacao_esocial: nova, ...(nova === "aceito" ? { recibo_esocial: rec } : {}) }).eq("id", contratoId).select("id");
    if (r.error || !r.data?.length) { avisar(mensagemErroRh(r.error, lang)); return false; }
    avisar(L("Situação atualizada.", "Status updated.", "Situación actualizada."), "ok");
    await carregar(); aoMudar(nova);
    return true;
  }

  const btn = (fundo: string): CSSProperties => ({ background: fundo, color: "#fff" });
  const MENTA = "linear-gradient(135deg, #0b5f46, #0f7a5a)", AZUL = "linear-gradient(135deg, #0a1628, #101b3d)";
  const LARANJA = claro ? "#9a3412" : "#fbbf24";
  const corSit = situacao === "aceito" ? (claro ? "#0f7a5a" : "#2ecc9b") : situacao === "recusado" ? "#ef4444" : situacao === "rascunho" ? LARANJA : (claro ? "#101b3d" : "#7dd3fc");
  const abertos = ["rascunho", "recusado", "preparado"].includes(situacao);
  return (
    <Secao ancora="esocial" titulo={L("eSocial — admissão (S-2200)", "eSocial — hire (S-2200)", "eSocial — admisión (S-2200)")}>
      <div className="md:col-span-2 text-sm space-y-3" style={{ color: "var(--axi-text-primary)" }}>
        {erro ? <p style={{ color: "#ef4444" }}>{L("Não foi possível ler os dados do eSocial agora. Feche e abra de novo.", "Could not read eSocial data now. Close and open again.", "No se pudieron leer los datos del eSocial ahora. Cierre y abra de nuevo.")}</p> : !dados ? <p style={{ color: c.TEXTO_SEC }}>{L("Carregando…", "Loading…", "Cargando…")}</p> : (<>
          <p><b>{L("Situação", "Status", "Situación")}:</b> <span className="font-bold" style={{ color: corSit }}>{(SIT_ESOCIAL[situacao] ?? [situacao, situacao, situacao])[i]}</span>{recibo && <> · {L("recibo", "receipt", "recibo")} {recibo}</>}</p>
          <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("O Axioma prepara o arquivo no formato oficial (leiaute S-1.3, conferido contra o esquema do governo). O contador assina com o certificado digital dele e envia. A lista abaixo usa o que está SALVO: salve antes de preparar.", "Axioma prepares the file in the official format (layout S-1.3, checked against the government schema). The accountant signs it with their digital certificate and sends it. The list below uses what is SAVED: save before preparing.", "Axioma prepara el archivo en el formato oficial (leiaute S-1.3, verificado contra el esquema del gobierno). El contador lo firma con su certificado digital y lo envía. La lista de abajo usa lo GUARDADO: guarde antes de preparar.")}</p>
          {!podePreparar ? (
            <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("Para preparar o arquivo é preciso liberação de dados pessoais, salário e saúde — o arquivo tem CPF, salário e deficiência (peça em RH · Estrutura e acessos → Acessos do RH).", "Preparing the file requires personal-data, salary and health access — the file has CPF, salary and disability (ask in HR · Structure and access → HR access).", "Para preparar el archivo se necesita habilitación de datos personales, salario y salud — el archivo tiene CPF, salario y discapacidad (pídala en RR. HH. · Estructura y accesos → Accesos de RR. HH.).")}</p>
          ) : pend.length > 0 && abertos ? (
            <div className="rounded-xl p-3" style={{ background: c.NESTED_BG, border: `1px solid ${c.BORDA}` }}>
              <p className="font-bold mb-1" style={{ color: LARANJA }}>{L(`Falta(m) ${pend.length} item(ns) para preparar:`, `${pend.length} item(s) missing to prepare:`, `Falta(n) ${pend.length} ítem(s) para preparar:`)}</p>
              <ul className="text-xs space-y-1">
                {pend.map((x, n) => <li key={n}>• <b>{x.campo[lang]}</b>{x.motivo && <> — {x.motivo[lang]}</>} <span style={{ color: c.TEXTO_SEC }}>({["cargo", "estrutura", "empregador"].includes(x.onde) ? <Link href="/rh/estrutura" className="underline">{ONDE_NOME[x.onde][i]} ›</Link> : ONDE_NOME[x.onde][i]})</span></li>)}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {pode.editar && podePreparar && pend.length === 0 && abertos && (
              <BotaoAcao executar={preparar} texto={situacao === "preparado" ? L("Preparar de novo e baixar", "Prepare again and download", "Preparar de nuevo y descargar") : L("Preparar arquivo do eSocial", "Prepare eSocial file", "Preparar archivo del eSocial")} textoTrabalhando={L("Preparando…", "Preparing…", "Preparando…")} className="px-4 py-2.5 rounded-xl text-sm" estilo={btn(MENTA)} />
            )}
            {eventos[0] && <button type="button" onClick={() => baixarXml(nomeArquivo(eventos[0].id_evento), eventos[0].xml)} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={btn(AZUL)}>{L("Baixar o último arquivo", "Download the latest file", "Descargar el último archivo")}</button>}
          </div>
          {pode.editar && ["preparado", "enviado_pelo_contador", "enviado"].includes(situacao) && (
            <div className="rounded-xl p-3 space-y-2" style={{ background: c.NESTED_BG, border: `1px solid ${c.BORDA}` }}>
              <p className="text-xs font-bold">{L("Depois que o contador enviar:", "After the accountant sends it:", "Después de que el contador lo envíe:")}</p>
              <input value={recibo} onChange={(e) => setRecibo(e.target.value)} aria-label={L("Número do recibo do eSocial", "eSocial receipt number", "Número de recibo del eSocial")} placeholder={L("Número do recibo do eSocial (ex.: 1.2.0000000000123456789)", "eSocial receipt number (e.g. 1.2.0000000000123456789)", "Número de recibo del eSocial (ej.: 1.2.0000000000123456789)")} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={c.campo} inputMode="decimal" />
              <div className="flex flex-wrap gap-2">
                <BotaoAcao executar={() => marcar("aceito")} texto={L("Aceito — salvar recibo", "Accepted — save receipt", "Aceptado — guardar recibo")} textoTrabalhando="…" className="px-4 py-2.5 rounded-xl text-sm" estilo={btn(MENTA)} />
                {situacao === "preparado" && <BotaoAcao executar={() => marcar("enviado_pelo_contador")} texto={L("Enviado, recibo ainda não chegou", "Sent, receipt not received yet", "Enviado, recibo aún no llegó")} textoTrabalhando="…" className="px-4 py-2.5 rounded-xl text-sm" estilo={btn(AZUL)} />}
                <BotaoAcao executar={() => marcar("recusado")} texto={L("O eSocial recusou", "eSocial rejected it", "eSocial lo rechazó")} textoTrabalhando="…" className="px-4 py-2.5 rounded-xl text-sm" estilo={btn(AZUL)} />
              </div>
            </div>
          )}
          {["enviado", "aceito", "enviado_pelo_contador"].includes(situacao) && podePreparar && (
            <div className="rounded-xl p-3 space-y-3" style={{ background: c.NESTED_BG, border: `1px solid ${c.BORDA}` }}>
              <p className="text-xs font-bold">{L("Alterações depois da admissão", "Changes after the hire", "Alteraciones después de la admisión")}</p>
              {!pend2205 && !pend2206 && <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("Nenhuma alteração pendente. Ao mudar e salvar um dado do contrato, do salário ou pessoal, o Axioma avisa aqui o que precisa ir ao eSocial.", "No pending changes. When you change and save a contract, salary or personal field, Axioma shows here what must go to eSocial.", "Ninguna alteración pendiente. Al cambiar y guardar un dato del contrato, salario o personal, Axioma avisa aquí lo que debe ir al eSocial.")}</p>}
              {([["S-2206", pend2206, L("Alteração de contrato pendente (S-2206)", "Pending contract change (S-2206)", "Alteración de contrato pendiente (S-2206)")], ["S-2205", pend2205, L("Alteração de dados pessoais pendente (S-2205)", "Pending personal data change (S-2205)", "Alteración de datos personales pendiente (S-2205)")]] as const).filter(([, on]) => on).map(([tipo, , titulo]) => {
                const hoje = hojeISO();
                const pend = !dados ? [] : tipo === "S-2205" ? pendenciasS2205(dados, alt.dt2205, hoje) : pendenciasS2206(dados, { dtAlteracao: alt.dt2206, dtEf: alt.dtEf || null }, hoje);
                const campoCls = "w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none";
                return (
                  <div key={tipo} className="space-y-2">
                    <p className="text-sm font-bold" style={{ color: LARANJA }}>{titulo}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div><label htmlFor={`alt-dt-${tipo}`} className="text-xs font-semibold mb-1 block" style={{ color: c.ROTULO }}>{L("Data da alteração", "Change date", "Fecha del cambio")}</label>
                        <input id={`alt-dt-${tipo}`} type="date" value={tipo === "S-2205" ? alt.dt2205 : alt.dt2206} onChange={(e) => setAlt((a) => ({ ...a, [tipo === "S-2205" ? "dt2205" : "dt2206"]: e.target.value }))} className={campoCls} style={c.campo} /></div>
                      {tipo === "S-2206" && (<>
                        <div><label htmlFor="alt-dtef" className="text-xs font-semibold mb-1 block" style={{ color: c.ROTULO }}>{L("Efeito no salário a partir de (opcional)", "Pay effect from (optional)", "Efecto en el salario desde (opcional)")}</label>
                          <input id="alt-dtef" type="date" value={alt.dtEf} onChange={(e) => setAlt((a) => ({ ...a, dtEf: e.target.value }))} className={campoCls} style={c.campo} /></div>
                        <div className="md:col-span-2"><label htmlFor="alt-dsc" className="text-xs font-semibold mb-1 block" style={{ color: c.ROTULO }}>{L("O que mudou (opcional, até 150 letras)", "What changed (optional, up to 150 chars)", "Qué cambió (opcional, hasta 150 letras)")}</label>
                          <input id="alt-dsc" maxLength={150} value={alt.dscAlt} onChange={(e) => setAlt((a) => ({ ...a, dscAlt: e.target.value }))} className={campoCls} style={c.campo} placeholder={L("Ex.: promoção a vendedor sênior; reajuste da convenção 2026", "E.g. promotion; 2026 collective raise", "Ej.: promoción; reajuste del convenio 2026")} /></div>
                        {dados?.contrato.cod_categ === "106" && <div className="md:col-span-2"><label htmlFor="alt-prorr" className="text-xs font-semibold mb-1 block" style={{ color: c.ROTULO }}>{L("Temporário: justificativa da prorrogação (só se prorrogou)", "Temporary: extension justification (only if extended)", "Temporal: justificación de la prórroga (solo si se prorrogó)")}</label>
                          <input id="alt-prorr" value={alt.justProrr} onChange={(e) => setAlt((a) => ({ ...a, justProrr: e.target.value }))} className={campoCls} style={c.campo} /></div>}
                      </>)}
                    </div>
                    {pend.length > 0 ? (
                      <ul className="text-xs space-y-1">{pend.map((x, n) => <li key={n}>• <b>{x.campo[lang]}</b>{x.motivo && <> — {x.motivo[lang]}</>} <span style={{ color: c.TEXTO_SEC }}>({ONDE_NOME[x.onde][i]})</span></li>)}</ul>
                    ) : pode.editar && (
                      <BotaoAcao executar={() => prepararAlteracao(tipo)} texto={L(`Preparar ${tipo} e baixar`, `Prepare ${tipo} and download`, `Preparar ${tipo} y descargar`)} textoTrabalhando="…" className="px-4 py-2.5 rounded-xl text-sm" estilo={btn(MENTA)} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {eventos.length > 0 && (
            <ul className="text-xs space-y-0.5" style={{ color: c.TEXTO_SEC }}>
              {eventos.map((e) => (
                <li key={e.id} className="break-all space-y-1">
                  <span><b>{e.evento}</b> · {new Date(e.criado_em).toLocaleString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR")}{e.data_ref ? ` · ${L("data", "date", "fecha")} ${dataBR(e.data_ref)}` : ""} — {e.id_evento} <button type="button" className="underline" onClick={() => baixarXml(nomeArquivo(e.id_evento), e.xml)}>{L("baixar", "download", "descargar")}</button>
                    {e.evento !== "S-2200" && <> · <b>{(SIT_ESOCIAL[e.situacao] ?? [e.situacao, e.situacao, e.situacao])[i]}</b>{e.recibo ? ` · ${L("recibo", "receipt", "recibo")} ${e.recibo}` : ""}</>}</span>
                  {e.evento !== "S-2200" && pode.editar && ["preparado", "enviado_pelo_contador"].includes(e.situacao) && (
                    <span className="flex flex-wrap items-center gap-2">
                      <input value={recibos[e.id] ?? ""} onChange={(ev) => setRecibos((r) => ({ ...r, [e.id]: ev.target.value }))} aria-label={L("Número do recibo", "Receipt number", "Número de recibo")} placeholder={L("Recibo", "Receipt", "Recibo")} inputMode="decimal" className="px-2 py-1.5 rounded-lg text-xs focus:outline-none w-48" style={c.campo} />
                      <BotaoAcao executar={() => marcarEvento(e, "aceito")} texto={L("Aceito", "Accepted", "Aceptado")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={btn(MENTA)} />
                      {e.situacao === "preparado" && <BotaoAcao executar={() => marcarEvento(e, "enviado_pelo_contador")} texto={L("Enviado", "Sent", "Enviado")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={btn(AZUL)} />}
                      <BotaoAcao executar={() => marcarEvento(e, "recusado")} texto={L("Recusado", "Rejected", "Rechazado")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={btn(AZUL)} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>)}
      </div>
    </Secao>
  );
}

// Dependentes (Tabela 07 do eSocial): IR, salário-família e S-2200. Dado pessoal: só quem tem a liberação de dados pessoais.
// Tirar um dependente marca excluido_em (fica no histórico); apagar segue a regra do Axioma (aviso + motivo + senha).
function DependentesColab({ colaboradorId, empresaId, lang, podeEditar, avisar }: { colaboradorId: string; empresaId: string; lang: Lang; podeEditar: boolean; avisar: (m: string, t?: "erro" | "ok") => void }) {
  const c = useContext(FormCtx)!;
  const claro = c.titulo !== "var(--axi-text-primary)";
  const { confirmar, janelaConfirmacao } = useConfirmarExclusao(claro);
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [lista, setLista] = useState<Linha[] | null>(null);
  const [tipos, setTipos] = useState<Linha[]>([]);
  const [ed, setEd] = useState<Linha | null>(null);
  const [erro, setErro] = useState(false);
  async function carregar() {
    const [d, t] = await Promise.all([
      supabase.from("rh_dependentes").select("*").eq("colaborador_id", colaboradorId).is("excluido_em", null).order("data_nascimento"),
      supabase.from("esocial_tab07_dependente").select("codigo, descricao, termino").order("codigo"),
    ]);
    if (d.error || t.error) { setErro(true); setLista([]); Sentry.captureException(new Error(`rh_dependentes: ${(d.error ?? t.error)!.message}`)); return; }
    setErro(false); setLista(d.data ?? []); setTipos((t.data ?? []).filter((x: Linha) => !x.termino));
  }
  useEffect(() => { void carregar(); }, [colaboradorId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvar(): Promise<boolean> {
    if (!ed) return false;
    const cpf = soDig(ed.cpf);
    if (String(ed.nome ?? "").trim().length < 2) { avisar(L("Dependente: informe o nome.", "Dependent: enter the name.", "Dependiente: informe el nombre.")); return false; }
    if (!ed.data_nascimento) { avisar(L("Dependente: informe a data de nascimento.", "Dependent: enter the date of birth.", "Dependiente: informe la fecha de nacimiento.")); return false; }
    if (cpf && !validarCPF(cpf)) { avisar(L("Dependente: CPF inválido.", "Dependent: invalid CPF.", "Dependiente: CPF inválido.")); return false; }
    if (ed.dep_irrf && (!cpf || !ed.tp_dep)) { avisar(L("Para deduzir no IR, o eSocial exige o CPF e o tipo do dependente.", "To deduct from income tax, eSocial requires the dependent's CPF and type.", "Para deducir en el IR, eSocial exige el CPF y el tipo del dependiente.")); return false; }
    if (ed.tp_dep === "99" && !String(ed.descr_dep ?? "").trim()) { avisar(L("Tipo \"Outros\": descreva a dependência.", "\"Other\" type: describe the dependency.", "Tipo \"Otros\": describa la dependencia.")); return false; }
    const linha = { empresa_id: empresaId, colaborador_id: colaboradorId, tp_dep: ed.tp_dep || null, nome: String(ed.nome).trim(), data_nascimento: ed.data_nascimento, cpf: cpf || null,
      dep_irrf: !!ed.dep_irrf, dep_sf: !!ed.dep_sf, inc_trab: !!ed.inc_trab, descr_dep: ed.tp_dep === "99" ? String(ed.descr_dep).trim() : null };
    const r = ed.id ? await supabase.from("rh_dependentes").update(linha).eq("id", ed.id).select("id") : await supabase.from("rh_dependentes").insert(linha).select("id");
    if (r.error || !r.data?.length) { avisar(r.error?.code === "23505" ? L("Já existe um dependente com este CPF.", "There is already a dependent with this CPF.", "Ya existe un dependiente con este CPF.") : mensagemErroRh(r.error, lang)); return false; }
    setEd(null); avisar(L("Dependente salvo.", "Dependent saved.", "Dependiente guardado."), "ok"); await carregar();
    return true;
  }
  async function tirar(d: Linha) {
    const ok = await confirmar({ oQue: `"${d.nome}"`, tabela: "rh_dependentes", registroId: d.id,
      efeito: { pt: "O dependente sai da lista (IR, salário-família e eSocial) e fica registrado no histórico. Se já foi informado ao eSocial, avise o contador.", en: "The dependent leaves the list (income tax, family allowance and eSocial) and stays in the history. If already reported to eSocial, tell the accountant.", es: "El dependiente sale de la lista (IR, asignación familiar y eSocial) y queda en el historial. Si ya fue informado al eSocial, avise al contador." } });
    if (!ok) return;
    const r = await supabase.from("rh_dependentes").update({ excluido_em: new Date().toISOString() }).eq("id", d.id).select("id");
    if (r.error || !r.data?.length) { avisar(mensagemErroRh(r.error, lang)); return; }
    avisar(L("Dependente retirado.", "Dependent removed.", "Dependiente retirado."), "ok"); await carregar();
  }
  const nomeTipo = (cod?: string | null) => tipos.find((t) => t.codigo === cod)?.descricao ?? (cod ? cod : L("sem tipo", "no type", "sin tipo"));
  const campoEd = (k: string, v: unknown) => setEd((e) => (e ? { ...e, [k]: v } : e));
  return (
    <Secao ancora="dependentes" titulo={L("Dependentes (IR, salário-família e eSocial)", "Dependents (income tax, family allowance and eSocial)", "Dependientes (IR, asignación familiar y eSocial)")}>
      <div className="md:col-span-2 text-sm space-y-2" style={{ color: "var(--axi-text-primary)" }}>
        {erro && <p style={{ color: "#ef4444" }}>{L("Não foi possível ler os dependentes agora.", "Could not read dependents now.", "No se pudieron leer los dependientes ahora.")}</p>}
        {lista === null ? <p style={{ color: c.TEXTO_SEC }}>{L("Carregando…", "Loading…", "Cargando…")}</p> : lista.length === 0 && !ed ? <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("Nenhum dependente.", "No dependents.", "Ningún dependiente.")}</p> : (
          <ul className="space-y-1">
            {lista.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ background: c.NESTED_BG, border: `1px solid ${c.BORDA}` }}>
                <span><b>{d.nome}</b> · {dataBR(d.data_nascimento)} · <span style={{ color: c.TEXTO_SEC }}>{nomeTipo(d.tp_dep)}{d.dep_irrf ? ` · ${L("deduz IR", "tax deduction", "deduce IR")}` : ""}{d.dep_sf ? ` · ${L("salário-família", "family allowance", "asignación familiar")}` : ""}{d.inc_trab ? ` · ${L("incapaz para o trabalho", "unable to work", "incapaz para el trabajo")}` : ""}</span></span>
                {podeEditar && <span className="flex gap-2">
                  <button type="button" aria-label={L("Editar dependente", "Edit dependent", "Editar dependiente")} onClick={() => setEd({ ...d, cpf: mascaraCPF(d.cpf ?? "") })} style={{ color: c.titulo }}><Pencil size={15} /></button>
                  <button type="button" aria-label={L("Retirar dependente", "Remove dependent", "Retirar dependiente")} onClick={() => void tirar(d)} style={{ color: "#ef4444" }}><Trash2 size={15} /></button>
                </span>}
              </li>
            ))}
          </ul>
        )}
        {ed ? (
          <div className="rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ background: c.NESTED_BG, border: `1px solid ${c.BORDA}` }}>
            {([["nome", L("Nome do dependente *", "Dependent's name *", "Nombre del dependiente *"), "text"], ["data_nascimento", L("Data de nascimento *", "Date of birth *", "Fecha de nacimiento *"), "date"]] as const).map(([k, rot, tipo]) => (
              <div key={k}><label htmlFor={`dep-${k}`} className="text-xs font-semibold mb-1.5 block" style={{ color: c.ROTULO }}>{rot}</label>
                <input id={`dep-${k}`} type={tipo} value={ed[k] ?? ""} onChange={(e) => campoEd(k, e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={c.campo} /></div>
            ))}
            <div><label htmlFor="dep-tipo" className="text-xs font-semibold mb-1.5 block" style={{ color: c.ROTULO }}>{L("Tipo (Tabela 07 do eSocial)", "Type (eSocial Table 07)", "Tipo (Tabla 07 del eSocial)")}</label>
              <select id="dep-tipo" value={ed.tp_dep ?? ""} onChange={(e) => campoEd("tp_dep", e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={c.campo}>
                <option value="">—</option>{tipos.map((t) => <option key={t.codigo} value={t.codigo}>{t.codigo} — {String(t.descricao).slice(0, 90)}</option>)}
              </select></div>
            <div><label htmlFor="dep-cpf" className="text-xs font-semibold mb-1.5 block" style={{ color: c.ROTULO }}>{L("CPF (obrigatório se deduz no IR)", "CPF (required for tax deduction)", "CPF (obligatorio si deduce en IR)")}</label>
              <input id="dep-cpf" inputMode="numeric" value={ed.cpf ?? ""} onChange={(e) => campoEd("cpf", mascaraCPF(e.target.value))} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={c.campo} /></div>
            {ed.tp_dep === "99" && <div className="md:col-span-2"><label htmlFor="dep-descr" className="text-xs font-semibold mb-1.5 block" style={{ color: c.ROTULO }}>{L("Descrição da dependência *", "Description of the dependency *", "Descripción de la dependencia *")}</label>
              <input id="dep-descr" value={ed.descr_dep ?? ""} onChange={(e) => campoEd("descr_dep", e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={c.campo} /></div>}
            <div className="md:col-span-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {([["dep_irrf", L("Deduz no Imposto de Renda", "Income tax deduction", "Deduce en el Impuesto a la Renta")], ["dep_sf", L("Recebe salário-família", "Receives family allowance", "Recibe asignación familiar")], ["inc_trab", L("Incapaz para o trabalho", "Unable to work", "Incapaz para el trabajo")]] as const).map(([k, rot]) => (
                <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={!!ed[k]} onChange={(e) => campoEd(k, e.target.checked)} /> {rot}</label>
              ))}
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <BotaoAcao executar={salvar} texto={L("Salvar dependente", "Save dependent", "Guardar dependiente")} textoTrabalhando="…" className="px-4 py-2.5 rounded-xl text-sm" estilo={{ background: "linear-gradient(135deg, #0b5f46, #0f7a5a)", color: "#fff" }} />
              <button type="button" onClick={() => setEd(null)} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg, #0a1628, #101b3d)", color: "#fff" }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
            </div>
          </div>
        ) : podeEditar && (
          <button type="button" onClick={() => setEd({ nome: "", data_nascimento: "", tp_dep: "03", cpf: "", dep_irrf: false, dep_sf: false, inc_trab: false })} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg, #0b5f46, #0f7a5a)", color: "#fff" }}>{L("+ Adicionar dependente", "+ Add dependent", "+ Agregar dependiente")}</button>
        )}
      </div>
      {janelaConfirmacao}
    </Secao>
  );
}

// Desligamento: o Axioma calcula a rescisão (lib/rhRescisao.ts, regras da lei em rh_regras com fonte e vigência), guarda o cálculo
// (rh_desligamentos) e prepara o S-2299 com as verbas (lib/rhEsocial.ts, validado contra o XSD oficial). O contador assina e envia.
const NOME_MOTIVO = (m: string, lang: Lang): string => {
  const pt = REGRAS_MOTIVO[m as Motivo]?.nome ?? m;
  if (lang === "pt") return pt;
  const en: Record<string, string> = { "01": "Dismissal for cause", "02": "Dismissal without cause", "03": "Early end of fixed term by the company (CLT art. 479)", "04": "Early end of fixed term by the employee (CLT art. 480)", "05": "Mutual fault", "06": "End of fixed-term contract", "07": "Resignation", "08": "Employee initiative — CLT arts. 394/483 § 1", "09": "Employee option on death of individual employer", "10": "Death of the employee", "17": "Indirect termination (CLT art. 483)", "26": "Stoppage by act of authority (CLT art. 486)", "27": "Force majeure (CLT art. 502)", "33": "Mutual agreement (CLT art. 484-A)", "38": "Retirement (on request)", "41": "Apprentice: poor performance", "42": "Apprentice: unjustified school absence", "47": "Closing of the company or branch", "48": "Death of individual employer, no continuation", "49": "Death of domestic employer, no continuation" };
  const es: Record<string, string> = { "01": "Despido con justa causa", "02": "Despido sin justa causa", "03": "Rescisión anticipada del contrato a término por la empresa (CLT art. 479)", "04": "Rescisión anticipada del contrato a término por el empleado (CLT art. 480)", "05": "Culpa recíproca", "06": "Fin del contrato a término", "07": "Renuncia", "08": "Iniciativa del empleado — CLT arts. 394/483 § 1", "09": "Opción del empleado por fallecimiento del empleador individual", "10": "Fallecimiento del empleado", "17": "Rescisión indirecta (CLT art. 483)", "26": "Paralización por acto de autoridad (CLT art. 486)", "27": "Fuerza mayor (CLT art. 502)", "33": "Acuerdo entre las partes (CLT art. 484-A)", "38": "Jubilación (a pedido)", "41": "Aprendiz: desempeño insuficiente", "42": "Aprendiz: ausencia injustificada a la escuela", "47": "Cierre de la empresa o establecimiento", "48": "Fallecimiento del empleador individual sin continuidad", "49": "Fallecimiento del empleador doméstico sin continuidad" };
  return `${(lang === "en" ? en : es)[m] ?? m}`;
};
function motivosPara(cat: string, tpContr: number): string[] {
  return Object.keys(REGRAS_MOTIVO).filter((m) => {
    if (["41", "42"].includes(m)) return cat === "103";
    if (["03", "04", "06"].includes(m)) return tpContr !== 1;
    if (m === "49") return cat === "104";
    if (["47", "48", "26"].includes(m)) return cat !== "104";
    return true;
  });
}
const brl = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function DesligamentoColab({ contratoId, empresaId, lang, pode, avisar, aoMudar }: {
  contratoId: string; empresaId: string; lang: Lang; pode: { editar: boolean; pessoais: boolean; salario: boolean; saude: boolean };
  avisar: (m: string, t?: "erro" | "ok") => void; aoMudar: () => void;
}) {
  const c = useContext(FormCtx)!;
  const claro = c.titulo !== "var(--axi-text-primary)";
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [ctx, setCtx] = useState<Linha | null>(null);       // contrato, salário, empregador, filial, lotação, verbas, regras, desligamento salvo
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState<Linha>({ mtv: "", dt: hojeISO(), aviso: "indenizado", dtAviso: "", vencidas: "0", faltas: "0", media: "", adiant13: "", desc480: false, saldoFgts: "", dep: "0" });
  const [res, setRes] = useState<ResultadoRescisao | null>(null);
  const [erroCalc, setErroCalc] = useState<string | null>(null);
  async function carregar() {
    const { data: k, error: eK } = await supabase.from("rh_contratos").select("*").eq("id", contratoId).single();
    if (eK || !k) { setCtx({ erro: true }); return; }
    const nada = Promise.resolve({ data: null, error: null });
    const [pes, rem, emp, est, lot, rub, deps, dl] = await Promise.all([
      supabase.from("rh_colaborador_pessoal").select("cpf").eq("colaborador_id", k.colaborador_id).maybeSingle(),
      supabase.from("rh_remuneracoes").select("und_sal_fixo, valor, vigencia_inicio").eq("contrato_id", contratoId).order("vigencia_inicio", { ascending: false }).limit(12),
      supabase.from("rh_empregador").select("tp_insc, nr_insc, class_trib").eq("empresa_id", empresaId).is("excluido_em", null).order("ini_valid", { ascending: false }).limit(1),
      k.estabelecimento_id ? supabase.from("rh_estabelecimentos").select("tp_insc, nr_insc").eq("id", k.estabelecimento_id).maybeSingle() : nada,
      k.lotacao_id ? supabase.from("rh_lotacoes").select("cod_lotacao").eq("id", k.lotacao_id).maybeSingle() : nada,
      supabase.from("rh_rubricas").select("cod_rubr").eq("empresa_id", empresaId).eq("ide_tab_rubr", "AXIOMA").is("excluido_em", null),
      supabase.from("rh_dependentes").select("id").eq("colaborador_id", k.colaborador_id).eq("dep_irrf", true).is("excluido_em", null),
      supabase.from("rh_desligamentos").select("*").eq("contrato_id", contratoId).maybeSingle(),
    ]);
    const falha = [pes, rem, emp, est, lot, rub, deps, dl].find((x) => x.error);
    if (falha?.error) { setCtx({ erro: true }); Sentry.captureException(new Error(`rh/desligamento: ${falha.error.message}`)); return; }
    const salvo = dl.data as Linha | null;
    setCtx({ k, cpf: (pes.data as Linha | null)?.cpf, rem: rem.data ?? [], emp: (emp.data as Linha[] | null)?.[0] ?? null, est: est.data, codLot: (lot.data as Linha | null)?.cod_lotacao ?? null, rubricas: ((rub.data ?? []) as Linha[]).map((r) => r.cod_rubr), salvo });
    if (salvo) {
      setF({ mtv: salvo.mtv_deslig, dt: salvo.dt_deslig, aviso: salvo.aviso ?? "indenizado", dtAviso: salvo.dt_aviso ?? "", vencidas: String(salvo.ferias_vencidas), faltas: String(salvo.faltas), media: salvo.media_variaveis ? String(salvo.media_variaveis).replace(".", ",") : "", adiant13: salvo.adiantamento_13 ? String(salvo.adiantamento_13).replace(".", ",") : "", desc480: !!salvo.descontar_480, saldoFgts: salvo.saldo_fgts != null ? String(salvo.saldo_fgts).replace(".", ",") : "", dep: String(salvo.dependentes_ir) });
      setRes(salvo.resultado as ResultadoRescisao);
    } else setF((x) => ({ ...x, dep: String((deps.data ?? []).length) }));
  }
  useEffect(() => { void carregar(); }, [contratoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const preparado = ctx?.salvo && ctx.salvo.situacao !== "calculado";
  const regra = f.mtv ? REGRAS_MOTIVO[f.mtv as Motivo] : null;
  async function calcular(): Promise<boolean> {
    setErroCalc(null); setRes(null);
    if (!ctx?.k || !f.mtv || !f.dt) { setErroCalc(L("Escolha o motivo e a data do desligamento.", "Choose the reason and the termination date.", "Elija el motivo y la fecha de desvinculación.")); return false; }
    const k = ctx.k;
    if (k.cod_categ === "111") { setErroCalc(L("Intermitente: as verbas de férias e 13º são pagas a cada convocação; a rescisão do intermitente ainda não é calculada pelo Axioma — fale com o contador.", "Intermittent: vacation and 13th are paid at each call; Axioma does not calculate intermittent termination yet — talk to the accountant.", "Intermitente: vacaciones y 13º se pagan en cada convocatoria; Axioma aún no calcula la rescisión del intermitente — hable con el contador.")); return false; }
    if (f.dt < k.data_admissao) { setErroCalc(L("A data do desligamento não pode ser antes da admissão.", "The termination date cannot be before the hire date.", "La fecha de desvinculación no puede ser antes de la admisión.")); return false; }
    const { data: rg, error: eR } = await supabase.from("rh_regras").select("valor, fonte").eq("chave", "folha").lte("vigencia_inicio", f.dt).order("vigencia_inicio", { ascending: false }).limit(1);
    if (eR) { setErroCalc(L("Não foi possível ler as regras da lei agora. Tente de novo.", "Could not read the legal rules now. Try again.", "No se pudieron leer las reglas legales ahora. Intente de nuevo.")); return false; }
    if (!rg?.length) { setErroCalc(L("As regras da lei (INSS e IR) para essa data ainda não estão cadastradas no Axioma: a partir de 01/01/2026.", "The legal rules (INSS and income tax) for this date are not registered in Axioma yet: from 01/01/2026.", "Las reglas legales (INSS e IR) para esta fecha aún no están en Axioma: desde 01/01/2026.")); return false; }
    const r0 = (ctx.rem as Linha[]).find((x) => x.vigencia_inicio <= f.dt);
    const media = lerValorBR(String(f.media || "0"));
    const mensal = r0 ? salarioMensalDe(Number(r0.und_sal_fixo), Number(r0.valor), k.qtd_hrs_sem == null ? null : Number(k.qtd_hrs_sem)) : null;
    if (mensal == null && !(media > 0)) { setErroCalc(L("Salário por tarefa/variável ou sem salário: informe a média mensal das variáveis dos últimos 12 meses.", "Task/variable pay or no salary: enter the monthly average of variable pay for the last 12 months.", "Salario por tarea/variable o sin salario: informe el promedio mensual de las variables de los últimos 12 meses.")); return false; }
    try {
      const r = calcularRescisao({ motivo: f.mtv as Motivo, admissao: k.data_admissao, desligamento: f.dt, codCateg: k.cod_categ, tpContr: Number(k.tp_contr), dataTermino: k.data_termino, clauAssec: k.clau_assec,
        salarioMensal: mensal ?? 0, mediaVariaveis: media, aviso: f.aviso, feriasVencidas: Number(f.vencidas), faltasPeriodoAtual: Number(f.faltas || 0), dependentesIR: Number(f.dep || 0),
        adiantamento13: lerValorBR(String(f.adiant13 || "0")), descontar480: !!f.desc480, saldoFgts: String(f.saldoFgts).trim() ? lerValorBR(String(f.saldoFgts)) : null }, rg[0].valor as RegrasFolha);
      setRes(r); return true;
    } catch (e) { setErroCalc(String((e as Error).message)); return false; }
  }
  async function salvar(): Promise<boolean> {
    if (!res || !ctx?.k) return false;
    const linha = { empresa_id: empresaId, contrato_id: contratoId, mtv_deslig: f.mtv, dt_deslig: f.dt, aviso: regra?.aviso === "nenhum" ? null : f.aviso, dt_aviso: f.dtAviso || null,
      ferias_vencidas: Number(f.vencidas), faltas: Number(f.faltas || 0), media_variaveis: lerValorBR(String(f.media || "0")), adiantamento_13: lerValorBR(String(f.adiant13 || "0")),
      descontar_480: !!f.desc480, saldo_fgts: String(f.saldoFgts).trim() ? lerValorBR(String(f.saldoFgts)) : null, dependentes_ir: Number(f.dep || 0), resultado: res, situacao: "calculado", updated_at: new Date().toISOString() };
    const r = await supabase.from("rh_desligamentos").upsert(linha, { onConflict: "contrato_id" }).select("id");
    if (r.error || !r.data?.length) { avisar(mensagemErroRh(r.error, lang)); return false; }
    avisar(L("Cálculo salvo. Confira com o contador e depois prepare o S-2299.", "Calculation saved. Check with the accountant, then prepare the S-2299.", "Cálculo guardado. Revíselo con el contador y luego prepare el S-2299."), "ok");
    await carregar(); return true;
  }
  const dados2299 = (): DadosS2299 | null => !ctx?.k || !res ? null : ({ empregador: ctx.emp, cpf: ctx.cpf, matricula: ctx.k.matricula, tpRegPrev: Number(ctx.k.tp_reg_prev),
    mtvDeslig: f.mtv, dtDeslig: f.dt, dtAvPrv: f.dtAviso || null, avisoIndenizadoDias: res.avisoIndenizadoDias, projecao: res.projecao,
    estabelecimento: ctx.est, codLotacao: ctx.codLot, verbas: res.verbas, rubricasExistentes: ctx.rubricas });
  const pend2299 = (() => { const d = dados2299(); return d ? pendenciasS2299(d, hojeISO()) : []; })();
  async function preparar(): Promise<boolean> {
    const d = dados2299(); if (!d || !ctx?.k || !ctx.salvo) return false;
    try {
      const { id, xml } = gerarS2299(d, { agora: new Date(), seq: 1, tpAmb: 1, hoje: hojeISO() });
      const r1 = await supabase.from("rh_esocial_eventos").insert({ empresa_id: empresaId, contrato_id: contratoId, evento: "S-2299", id_evento: id, versao_leiaute: VERSAO_LEIAUTE, xml, data_ref: f.dt }).select("id").single();
      if (r1.error) { avisar(mensagemErroRh(r1.error, lang)); return false; }
      const r2 = await supabase.from("rh_desligamentos").update({ situacao: "preparado", updated_at: new Date().toISOString() }).eq("contrato_id", contratoId).select("id");
      const r3 = await supabase.from("rh_contratos").update({ data_desligamento: f.dt }).eq("id", contratoId).select("id");
      const r4 = await supabase.from("rh_colaboradores").update({ situacao: "desligado" }).eq("id", ctx.k.colaborador_id).select("id");
      if ([r2, r3, r4].some((x) => x.error || !x.data?.length)) { avisar(L("O arquivo foi gerado, mas algum registro não atualizou. Recarregue e confira.", "The file was generated, but a record did not update. Reload and check.", "El archivo se generó, pero algún registro no se actualizó. Recargue y revise.")); return false; }
      const url = URL.createObjectURL(new Blob([xml], { type: "application/xml;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = `S-2299-${ctx.k.matricula}-${id}.xml`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      avisar(L("Desligamento preparado (S-2299) e baixado. Entregue ao contador.", "Termination prepared (S-2299) and downloaded. Give it to the accountant.", "Desvinculación preparada (S-2299) y descargada. Entréguela al contador."), "ok");
      await carregar(); aoMudar(); return true;
    } catch (e) { Sentry.captureException(e); avisar(L("Não foi possível preparar o S-2299.", "Could not prepare the S-2299.", "No se pudo preparar el S-2299.")); return false; }
  }
  function pdf() {
    if (!res) return;
    try {
      gerarPdfTabela({ titulo: L("Cálculo da rescisão", "Termination calculation", "Cálculo de la rescisión"), subtitulo: `${NOME_MOTIVO(f.mtv, lang)} · ${dataBR(f.dt)} · ${L("prazo de pagamento", "payment deadline", "plazo de pago")} ${dataBR(res.prazoPagamento)}`,
        colunas: [{ header: L("Verba", "Item", "Rubrica"), key: "v", width: 6 }, { header: L("Ref.", "Ref.", "Ref."), key: "q", width: 1 }, { header: L("Provento", "Earning", "Haber"), key: "p", width: 2 }, { header: L("Desconto", "Deduction", "Descuento"), key: "d", width: 2 }],
        linhas: res.verbas.map((v) => ({ v: v.nome, q: v.qtd ? String(v.qtd) : "", p: v.tipo === "provento" ? brl(v.valor) : "", d: v.tipo === "desconto" ? brl(v.valor) : "" })),
        resumo: [{ label: L("Total bruto", "Gross", "Bruto"), valor: `R$ ${brl(res.bruto)}` }, { label: L("Descontos", "Deductions", "Descuentos"), valor: `R$ ${brl(res.descontos)}` }, { label: L("Líquido a pagar", "Net to pay", "Líquido a pagar"), valor: `R$ ${brl(res.liquido)}` },
          { label: L("FGTS do mês (depósito)", "FGTS of the month", "FGTS del mes"), valor: `R$ ${brl(res.fgts.deposito)}` }, ...(res.fgts.multa != null ? [{ label: L(`Multa FGTS ${res.fgts.multaPct}%`, `FGTS fine ${res.fgts.multaPct}%`, `Multa FGTS ${res.fgts.multaPct}%`), valor: `R$ ${brl(res.fgts.multa)}` }] : [])],
        nomeArquivo: `axioma-rescisao-${ctx?.k?.matricula ?? ""}-${f.dt}.pdf` }, (m) => avisar(m), lang);
    } catch (e) { avisar(tratarFalhaExportacao("rh-rescisao.pdf", e, lang)); }
  }

  if (!pode.pessoais || !pode.salario) return null;
  const campoCls = "w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none";
  const lbl = (t: string, id: string) => <label htmlFor={id} className="text-xs font-semibold mb-1 block" style={{ color: c.ROTULO }}>{t}</label>;
  const MENTA = "linear-gradient(135deg, #0b5f46, #0f7a5a)", AZUL = "linear-gradient(135deg, #0a1628, #101b3d)";
  const k = ctx?.k;
  return (
    <Secao ancora="desligamento" titulo={L("Desligamento e rescisão (S-2299)", "Termination and severance (S-2299)", "Desvinculación y rescisión (S-2299)")}>
      <div className="md:col-span-2 text-sm space-y-3" style={{ color: "var(--axi-text-primary)" }}>
        {ctx?.erro ? <p style={{ color: "#ef4444" }}>{L("Não foi possível ler os dados agora. Feche e abra de novo.", "Could not read the data now. Close and open again.", "No se pudieron leer los datos ahora. Cierre y abra de nuevo.")}</p> : !ctx ? <p style={{ color: c.TEXTO_SEC }}>{L("Carregando…", "Loading…", "Cargando…")}</p> : (<>
          {preparado ? (
            <p className="font-semibold" style={{ color: claro ? "#0f7a5a" : "#2ecc9b" }}>{L(`Desligamento preparado em ${dataBR(ctx.salvo.dt_deslig)} (${NOME_MOTIVO(ctx.salvo.mtv_deslig, "pt")}). A situação do envio fica no cartão do eSocial, acima.`, `Termination prepared on ${dataBR(ctx.salvo.dt_deslig)}. The sending status is in the eSocial card above.`, `Desvinculación preparada el ${dataBR(ctx.salvo.dt_deslig)}. La situación del envío está en la tarjeta del eSocial, arriba.`)}</p>
          ) : !aberto && !ctx.salvo ? (
            pode.editar && <button type="button" onClick={() => setAberto(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: AZUL, color: "#fff" }}>{L("Iniciar desligamento e calcular a rescisão", "Start termination and calculate severance", "Iniciar desvinculación y calcular la rescisión")}</button>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">{lbl(L("Motivo (Tabela 19 do eSocial)", "Reason (eSocial Table 19)", "Motivo (Tabla 19 del eSocial)"), "dl-mtv")}
                <select id="dl-mtv" value={f.mtv} onChange={(e) => setF({ ...f, mtv: e.target.value })} className={campoCls} style={c.campo}>
                  <option value="">—</option>{k && motivosPara(k.cod_categ, Number(k.tp_contr)).map((m) => <option key={m} value={m}>{m} — {NOME_MOTIVO(m, lang)}</option>)}
                </select></div>
              <div>{lbl(L("Último dia trabalhado", "Last day worked", "Último día trabajado"), "dl-dt")}<input id="dl-dt" type="date" value={f.dt} onChange={(e) => setF({ ...f, dt: e.target.value })} className={campoCls} style={c.campo} /></div>
              {regra && regra.aviso !== "nenhum" && regra.aviso !== "metade" && (
                <div>{lbl(L("Aviso prévio", "Prior notice", "Aviso previo"), "dl-aviso")}
                  <select id="dl-aviso" value={f.aviso} onChange={(e) => setF({ ...f, aviso: e.target.value })} className={campoCls} style={c.campo}>
                    {regra.aviso === "empregador" ? (<><option value="indenizado">{L("Indenizado (pago sem trabalhar)", "Paid in lieu (not worked)", "Indemnizado (pagado sin trabajar)")}</option><option value="trabalhado">{L("Trabalhado", "Worked", "Trabajado")}</option></>)
                      : (<><option value="trabalhado">{L("Trabalhado pelo empregado", "Worked by the employee", "Trabajado por el empleado")}</option><option value="descontado">{L("Não cumprido — descontar (CLT art. 487 § 2º)", "Not served — deduct (CLT art. 487 § 2)", "No cumplido — descontar (CLT art. 487 § 2)")}</option><option value="dispensado">{L("Empresa dispensou o cumprimento", "Company waived it", "La empresa lo dispensó")}</option></>)}
                  </select></div>
              )}
              {f.aviso === "trabalhado" && <div>{lbl(L("Data em que o aviso foi dado", "Date notice was given", "Fecha del aviso"), "dl-dtav")}<input id="dl-dtav" type="date" value={f.dtAviso} onChange={(e) => setF({ ...f, dtAviso: e.target.value })} className={campoCls} style={c.campo} /></div>}
              <div>{lbl(L("Férias vencidas não gozadas (períodos)", "Unused accrued vacation (periods)", "Vacaciones vencidas no gozadas (períodos)"), "dl-venc")}
                <select id="dl-venc" value={f.vencidas} onChange={(e) => setF({ ...f, vencidas: e.target.value })} className={campoCls} style={c.campo}><option value="0">0</option><option value="1">1</option><option value="2">2</option></select></div>
              <div>{lbl(L("Faltas injustificadas no período de férias atual", "Unjustified absences in the current vacation period", "Faltas injustificadas en el período de vacaciones actual"), "dl-faltas")}<input id="dl-faltas" inputMode="numeric" value={f.faltas} onChange={(e) => setF({ ...f, faltas: e.target.value.replace(/\D/g, "") })} className={campoCls} style={c.campo} /></div>
              <div>{lbl(L("Média mensal de variáveis (horas extras, comissões) — R$", "Monthly average of variables (overtime, commissions) — R$", "Promedio mensual de variables (horas extra, comisiones) — R$"), "dl-media")}<input id="dl-media" inputMode="decimal" value={f.media} onChange={(e) => setF({ ...f, media: e.target.value })} className={campoCls} style={c.campo} placeholder="0,00" /></div>
              <div>{lbl(L("1ª parcela do 13º já paga neste ano — R$", "13th first installment already paid this year — R$", "1ª cuota del 13º ya pagada este año — R$"), "dl-adi")}<input id="dl-adi" inputMode="decimal" value={f.adiant13} onChange={(e) => setF({ ...f, adiant13: e.target.value })} className={campoCls} style={c.campo} placeholder="0,00" /></div>
              <div>{lbl(L("Dependentes para o IR", "Dependents for income tax", "Dependientes para el IR"), "dl-dep")}<input id="dl-dep" inputMode="numeric" value={f.dep} onChange={(e) => setF({ ...f, dep: e.target.value.replace(/\D/g, "") })} className={campoCls} style={c.campo} /></div>
              {regra && regra.multa > 0 && <div>{lbl(L("Saldo do FGTS no extrato (para a multa) — R$", "FGTS balance on the statement (for the fine) — R$", "Saldo del FGTS en el extracto (para la multa) — R$"), "dl-fgts")}<input id="dl-fgts" inputMode="decimal" value={f.saldoFgts} onChange={(e) => setF({ ...f, saldoFgts: e.target.value })} className={campoCls} style={c.campo} placeholder={L("opcional", "optional", "opcional")} /></div>}
              {f.mtv === "04" && <label className="md:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.desc480} onChange={(e) => setF({ ...f, desc480: e.target.checked })} /> {L("Descontar a indenização do art. 480 (prejuízo comprovado)", "Deduct the art. 480 indemnity (proven loss)", "Descontar la indemnización del art. 480 (perjuicio comprobado)")}</label>}
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <BotaoAcao executar={calcular} texto={L("Calcular a rescisão", "Calculate severance", "Calcular la rescisión")} textoTrabalhando="…" className="px-4 py-2.5 rounded-xl text-sm" estilo={{ background: MENTA, color: "#fff" }} />
              </div>
              {erroCalc && <p className="md:col-span-2 text-sm font-semibold" style={{ color: "#ef4444" }}>{erroCalc}</p>}
            </div>
          )}
          {res && (
            <div className="rounded-xl p-3 space-y-2" style={{ background: c.NESTED_BG, border: `1px solid ${c.BORDA}` }}>
              <p className="font-bold" style={{ color: c.titulo }}>{res.motivo}</p>
              <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L(`Aviso: ${res.avisoDias} dias (${res.avisoIndenizadoDias} indenizados) · contrato projetado até ${dataBR(res.projecao)} · pagar até ${dataBR(res.prazoPagamento)} (CLT art. 477 § 6º)`, `Notice: ${res.avisoDias} days (${res.avisoIndenizadoDias} paid in lieu) · contract projected to ${dataBR(res.projecao)} · pay by ${dataBR(res.prazoPagamento)} (CLT art. 477 § 6)`, `Aviso: ${res.avisoDias} días (${res.avisoIndenizadoDias} indemnizados) · contrato proyectado hasta ${dataBR(res.projecao)} · pagar hasta ${dataBR(res.prazoPagamento)} (CLT art. 477 § 6)`)}</p>
              <div className="overflow-x-auto"><table className="w-full text-xs"><tbody>
                {res.verbas.map((v, n) => <tr key={n} style={{ borderBottom: `1px solid ${c.BORDA}` }}><td className="py-1 pr-2">{v.nome}</td><td className="py-1 text-right whitespace-nowrap" style={{ color: v.tipo === "desconto" ? "#ef4444" : undefined }}>{v.tipo === "desconto" ? "− " : ""}R$ {brl(v.valor)}</td></tr>)}
                <tr><td className="pt-2 font-bold">{L("Bruto", "Gross", "Bruto")}</td><td className="pt-2 text-right font-bold">R$ {brl(res.bruto)}</td></tr>
                <tr><td className="font-bold">{L("Descontos", "Deductions", "Descuentos")}</td><td className="text-right font-bold" style={{ color: "#ef4444" }}>− R$ {brl(res.descontos)}</td></tr>
                <tr><td className="font-black" style={{ color: c.titulo }}>{L("Líquido a pagar", "Net to pay", "Líquido a pagar")}</td><td className="text-right font-black" style={{ color: claro ? "#0f7a5a" : "#2ecc9b" }}>R$ {brl(res.liquido)}</td></tr>
              </tbody></table></div>
              <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L(`FGTS do mês: R$ ${brl(res.fgts.deposito)} (${res.fgts.aliquota * 100}%)`, `FGTS of the month: R$ ${brl(res.fgts.deposito)} (${res.fgts.aliquota * 100}%)`, `FGTS del mes: R$ ${brl(res.fgts.deposito)} (${res.fgts.aliquota * 100}%)`)}{res.fgts.multa != null ? ` · ${L("multa", "fine", "multa")} ${res.fgts.multaPct}%: R$ ${brl(res.fgts.multa)} ${L("(guia do FGTS Digital, fora do termo)", "(FGTS Digital slip, outside the term)", "(guía del FGTS Digital, fuera del término)")}` : ""}</p>
              {res.avisos.map((a, n) => <p key={n} className="text-xs" style={{ color: claro ? "#9a3412" : "#fbbf24" }}>⚠ {a}</p>)}
              <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("Cálculo pela lei (CLT, Lei 12.506, Lei 4.090) com INSS e IR de 2026 e a redução da Lei 15.270. Não inclui verbas de convenção coletiva, pensão alimentícia nem estabilidades — confira com o contador.", "Calculated by law (CLT, Laws 12,506 and 4,090) with 2026 INSS and income tax and the Law 15,270 reduction. Does not include collective-agreement items, alimony or job-security indemnities — check with the accountant.", "Cálculo por ley (CLT, Leyes 12.506 y 4.090) con INSS e IR de 2026 y la reducción de la Ley 15.270. No incluye rubricas de convenio colectivo, pensión alimenticia ni estabilidades — revise con el contador.")}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={pdf} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: AZUL, color: "#fff" }}>{L("PDF do cálculo", "Calculation PDF", "PDF del cálculo")}</button>
                {pode.editar && !preparado && <BotaoAcao executar={salvar} texto={L("Salvar o cálculo", "Save the calculation", "Guardar el cálculo")} textoTrabalhando="…" className="px-4 py-2.5 rounded-xl text-sm" estilo={{ background: MENTA, color: "#fff" }} />}
              </div>
              {pode.editar && !preparado && ctx.salvo && (pend2299.length ? (
                <ul className="text-xs space-y-1"><li className="font-bold" style={{ color: claro ? "#9a3412" : "#fbbf24" }}>{L("Para preparar o S-2299 falta:", "To prepare the S-2299 you still need:", "Para preparar el S-2299 falta:")}</li>{pend2299.map((x, n) => <li key={n}>• <b>{x.campo[lang]}</b>{x.motivo && <> — {x.motivo[lang]}</>}</li>)}</ul>
              ) : (
                <BotaoAcao executar={preparar} texto={L("Preparar o S-2299 e desligar", "Prepare the S-2299 and terminate", "Preparar el S-2299 y desvincular")} textoTrabalhando="…" className="px-4 py-2.5 rounded-xl text-sm" estilo={{ background: MENTA, color: "#fff" }} />
              ))}
              {pode.editar && !preparado && ctx.salvo && <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("Ao preparar, o contrato recebe a data de desligamento e a pessoa passa para \"Desligado\". As verbas (S-1010) precisam ter sido enviadas antes pelo contador.", "When prepared, the contract gets the termination date and the person becomes \"Terminated\". The pay items (S-1010) must have been sent by the accountant first.", "Al preparar, el contrato recibe la fecha de desvinculación y la persona pasa a \"Desvinculado\". Las rubricas (S-1010) deben haberse enviado antes por el contador.")}</p>}
            </div>
          )}
        </>)}
      </div>
    </Secao>
  );
}
