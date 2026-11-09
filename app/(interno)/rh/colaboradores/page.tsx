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
import { pendenciasS2200, gerarS2200, VERSAO_LEIAUTE, type DadosS2200, type Pendencia } from "../../../../lib/rhEsocial";
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
function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  const c = useContext(FormCtx)!;
  return (
    <div className="rounded-xl p-3 md:p-4 mt-3" style={{ background: c.NESTED_BG, border: `1px solid ${c.BORDA}` }}>
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

  async function carregarLista() {
    if (!empresaId || !pode.ver) return;
    setCarregando(true);
    let q = supabase.from("rh_colaboradores").select("id, nome, nome_social, situacao, excluido_em", { count: "exact" }).eq("empresa_id", empresaId);
    if (verLixeira) q = q.gte("excluido_em", new Date(Date.now() - DIAS_LIXEIRA_RH * 86400000).toISOString()).order("excluido_em", { ascending: false });
    else { q = q.is("excluido_em", null).order("nome"); if (filtroSit) q = q.eq("situacao", filtroSit); }
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
  useEffect(() => { void carregarLista(); }, [empresaId, pode.ver, pagina, filtroSit, verLixeira]); // eslint-disable-line react-hooks/exhaustive-deps
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
  async function abrirEdicao(c: Linha) {
    setCepMsg(null);
    const g = await gestoresPossiveis(); setRef((r) => ({ ...r, gestores: g.filter((x: Linha) => x.id !== c.id) }));
    const k = contratos[c.id] ?? {};
    let pes: Linha = {};
    // Leitura que falha não abre o formulário vazio (pareceria que a pessoa não tem CPF ou salário): avisa e para.
    if (pode.pessoais) {
      const { data, error } = await supabase.from("rh_colaborador_pessoal").select("*").eq("colaborador_id", c.id).maybeSingle();
      if (error) { avisar(L("Não foi possível ler os dados agora. Tente de novo em instantes.", "Could not read the data now. Try again shortly.", "No se pudieron leer los datos ahora. Intente de nuevo en instantes.")); Sentry.captureException(new Error(`rh/colaboradores pessoal: ${error.message}`)); return; }
      pes = data ?? {};
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
      tem_pessoal: !!pes.colaborador_id, cpf: mascaraCPF(s(pes.cpf)), data_nascimento: s(pes.data_nascimento), sexo: s(pes.sexo), raca_cor: s(pes.raca_cor), estado_civil: s(pes.estado_civil), grau_instr: s(pes.grau_instr),
      pais_nascimento_txt: rotuloPais(s(pes.pais_nascimento || "105")), pais_nacionalidade_txt: rotuloPais(s(pes.pais_nacionalidade || "105")), cep: mascaraCEP(s(pes.cep)), logradouro: s(pes.logradouro), numero: s(pes.numero), complemento: s(pes.complemento),
      bairro: s(pes.bairro), cidade: s(pes.cidade), uf: s(pes.uf), cod_munic: s(pes.cod_munic), telefone: s(pes.telefone), email: s(pes.email), emergencia_nome: s(pes.emergencia_nome), emergencia_telefone: s(pes.emergencia_telefone),
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
      data_base: nulo(form.data_base) ? Number(form.data_base) : null, cnpj_sindicato: soDig(form.cnpj_sindicato) || null, dsc_sal_var: nulo(form.dsc_sal_var) };
    const r2 = form.contrato_id ? await supabase.from("rh_contratos").update(contrato).eq("id", form.contrato_id).select("id").single() : await supabase.from("rh_contratos").insert(contrato).select("id").single();
    if (r2.error || !r2.data) { await desfazer(r2.error); return false; }
    const kid = r2.data.id as string;
    if (pode.pessoais && (soDig(form.cpf) || form.tem_pessoal)) {
      const pes = { colaborador_id: cid, empresa_id: empresaId, cpf: soDig(form.cpf), data_nascimento: nulo(form.data_nascimento), sexo: nulo(form.sexo), raca_cor: nulo(form.raca_cor) ? Number(form.raca_cor) : null,
        estado_civil: nulo(form.estado_civil) ? Number(form.estado_civil) : null, grau_instr: nulo(form.grau_instr), pais_nascimento: codigoPais(form.pais_nascimento_txt) ?? "105", pais_nacionalidade: codigoPais(form.pais_nacionalidade_txt) ?? "105",
        cep: soDig(form.cep) || null, logradouro: nulo(form.logradouro), numero: nulo(form.numero), complemento: nulo(form.complemento), bairro: nulo(form.bairro), cidade: nulo(form.cidade),
        uf: nulo(form.uf)?.toUpperCase() ?? null, cod_munic: /^\d{7}$/.test(String(form.cod_munic ?? "")) ? String(form.cod_munic) : null, telefone: nulo(form.telefone), email: nulo(form.email)?.toLowerCase() ?? null, emergencia_nome: nulo(form.emergencia_nome), emergencia_telefone: nulo(form.emergencia_telefone) };
      const r3 = await supabase.from("rh_colaborador_pessoal").upsert(pes, { onConflict: "colaborador_id" });
      if (r3.error) { await desfazer(r3.error); return false; }
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
                              <td className="px-3 py-3 text-sm font-bold" style={{ color: "var(--axi-text-primary)" }}>{c.nome_social || c.nome}</td>
                              <td className="px-3 py-3 text-sm" style={{ color: TEXTO_SEC }}>{k.matricula ?? "—"}</td>
                              <td className="px-3 py-3 text-sm" style={{ color: TEXTO_SEC }}>{nomeDe(ref.cargos, k.cargo_id)}</td>
                              <td className="px-3 py-3 text-sm" style={{ color: TEXTO_SEC }}>{nomeDe(ref.deps, k.departamento_id)}</td>
                              <td className="px-3 py-3 text-sm whitespace-nowrap" style={{ color: TEXTO_SEC }}>{dataBR(k.data_admissao)}</td>
                              <td className="px-3 py-3"><span className="text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap" style={{ background: temaClaro ? "rgba(16,27,61,0.08)" : "rgba(255,255,255,0.08)", color: c.situacao === "ativo" ? VERDE : TEXTO_SEC }}>{nomeSit(c.situacao)}</span></td>
                              <td className="px-3 py-3 text-xs">
                                {verLixeira ? <span style={{ color: TEXTO_SEC }}>{L(`${Math.max(0, DIAS_LIXEIRA_RH - Math.floor((Date.now() - new Date(c.excluido_em).getTime()) / 86400000))} dias`, `${Math.max(0, DIAS_LIXEIRA_RH - Math.floor((Date.now() - new Date(c.excluido_em).getTime()) / 86400000))} days`, `${Math.max(0, DIAS_LIXEIRA_RH - Math.floor((Date.now() - new Date(c.excluido_em).getTime()) / 86400000))} días`)}</span>
                                  : dExp !== null && dExp >= 0 && dExp <= 30 ? <span className="flex items-center gap-1 font-bold" style={{ color: (temaClaro ? "#9a3412" : ct("#f59e0b")) }}><AlertTriangle size={13} /> {L(`Experiência termina em ${dExp} dias`, `Probation ends in ${dExp} days`, `Experiencia termina en ${dExp} días`)}</span>
                                  : dExp !== null && dExp < 0 ? <span className="font-bold" style={{ color: ct("#f87171") }}>{L("Experiência vencida: decida efetivar ou desligar", "Probation over: decide to hire or terminate", "Experiencia vencida: decida efectivar o desvincular")}</span> : "—"}
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
                  {travado && <p className="text-xs mt-2 font-semibold" style={{ color: (temaClaro ? "#9a3412" : ct("#f59e0b")) }}>{form.contrato_situacao === "preparado" ? L("O arquivo do eSocial desta admissão já foi preparado. Se mudar um dado do contrato, ele volta a rascunho e é preciso preparar de novo.", "The eSocial file for this hire was already prepared. If you change a contract field, it goes back to draft and must be prepared again.", "El archivo del eSocial de esta admisión ya fue preparado. Si cambia un dato del contrato, vuelve a borrador y hay que prepararlo de nuevo.") : L("Esta admissão já foi enviada ao eSocial: os dados do contrato não mudam aqui (alteração de contrato é outro envio, S-2206, numa próxima etapa).", "This hire was already sent to eSocial: contract data cannot change here (contract changes are another submission, S-2206, in a later step).", "Esta admisión ya fue enviada al eSocial: los datos del contrato no cambian aquí (la alteración es otro envío, S-2206, en una próxima etapa).")}</p>}

                  <Secao titulo={L("Identificação", "Identification", "Identificación")}>
                    <F k="nome" r={L("Nome completo *", "Full name *", "Nombre completo *")} />
                    <F k="nome_social" r={L("Nome social (opcional)", "Social name (optional)", "Nombre social (opcional)")} />
                    <F k="situacao" r={L("Situação", "Status", "Situación")} opcoes={SITUACOES.map((s) => ({ v: s, l: nomeSit(s) }))} />
                  </Secao>

                  <Secao titulo={L("Contrato", "Contract", "Contrato")}>
                    <F k="matricula" r={L("Matrícula *", "Employee ID *", "Matrícula *")} />
                    <F k="cod_categ" r={L("Categoria (Tabela 01 do eSocial) *", "Category (eSocial Table 01) *", "Categoría (Tabla 01 del eSocial) *")} opcoes={ref.categorias.map((c) => ({ v: c.codigo, l: `${c.codigo} — ${String(c.descricao).slice(0, 80)}` }))} />
                    <F k="data_admissao" tipo="date" r={L("Data de admissão *", "Hire date *", "Fecha de admisión *")} />
                    <F k="tp_contr" r={L("Tipo de contrato", "Contract type", "Tipo de contrato")} opcoes={[{ v: "1", l: L("Prazo indeterminado", "Open-ended", "Plazo indeterminado") }, { v: "2", l: L("Prazo determinado (data de término)", "Fixed term (end date)", "Plazo determinado (fecha de término)") }, { v: "3", l: L("Prazo determinado (até um fato)", "Fixed term (until an event)", "Plazo determinado (hasta un hecho)") }]} />
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
                    {form.situacao === "desligado" && <F k="data_desligamento" tipo="date" r={L("Data do desligamento", "Termination date", "Fecha de desvinculación")} />}
                  </Secao>

                  {pode.pessoais ? (
                    <Secao titulo={L("Dados pessoais (protegidos)", "Personal data (protected)", "Datos personales (protegidos)")}>
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

                  {pode.salario ? (
                    <Secao titulo={L("Salário (protegido)", "Salary (protected)", "Salario (protegido)")}>
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

                  {form.id && form.contrato_id && <CartaoEsocial contratoId={form.contrato_id} empresaId={empresaId!} lang={lang} pode={pode} avisar={avisar} aoMudar={(sit) => { setForm((f) => (f ? { ...f, contrato_situacao: sit } : f)); void carregarLista(); }} />}
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
  cod_munic: ["Código do município", "City code", "Código del municipio"],
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
const PARTE_NOME: Record<string, [string, string, string]> = { cadastro: ["Cadastro", "Record", "Registro"], contrato: ["Contrato", "Contract", "Contrato"], pessoal: ["Dados pessoais", "Personal data", "Datos personales"], salario: ["Salário", "Salary", "Salario"], documento: ["Documento", "Document", "Documento"], exame: ["Exame", "Exam", "Examen"] };
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
  const pendObrig = visiveis.filter((i) => i.obrigatorio && (itens?.[i.tipo]?.situacao ?? "pendente") === "pendente").length;
  const cor = (sit: string) => (sit === "entregue" ? "#0f7a5a" : sit === "dispensado" ? c.TEXTO_SEC : "#b45309");
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
    <Secao titulo={L("Documentos e exames da admissão", "Hiring documents and exams", "Documentos y exámenes de admisión")}>
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
  contratoId: string; empresaId: string; lang: Lang; pode: { editar: boolean; pessoais: boolean; salario: boolean };
  avisar: (m: string, t?: "erro" | "ok") => void; aoMudar: (situacao: string) => void;
}) {
  const c = useContext(FormCtx)!;
  const claro = c.titulo !== "var(--axi-text-primary)";
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const i = lang === "en" ? 1 : lang === "es" ? 2 : 0;
  const [dados, setDados] = useState<DadosS2200 | null>(null);
  const [situacao, setSituacao] = useState("rascunho");
  const [recibo, setRecibo] = useState("");
  const [eventos, setEventos] = useState<Linha[]>([]);
  const [erro, setErro] = useState(false);
  const podePreparar = pode.pessoais && pode.salario;

  async function carregar() {
    const { data: k, error: eK } = await supabase.from("rh_contratos").select("*").eq("id", contratoId).single();
    setErro(false);
    if (eK || !k) { setErro(true); Sentry.captureException(new Error(`rh/esocial contrato: ${eK?.message}`)); return; }
    setSituacao(k.situacao_esocial); setRecibo(k.recibo_esocial ?? "");
    const hoje = hojeISO();
    const nada = Promise.resolve({ data: null, error: null });
    const [col, pes, rem, cg, est, emp, ev] = await Promise.all([
      supabase.from("rh_colaboradores").select("nome, nome_social").eq("id", k.colaborador_id).single(),
      pode.pessoais ? supabase.from("rh_colaborador_pessoal").select("*").eq("colaborador_id", k.colaborador_id).maybeSingle() : nada,
      pode.salario ? supabase.from("rh_remuneracoes").select("und_sal_fixo, valor, vigencia_inicio").eq("contrato_id", contratoId).lte("vigencia_inicio", k.data_admissao > hoje ? k.data_admissao : hoje).order("vigencia_inicio", { ascending: false }).limit(1) : nada,
      k.cargo_id ? supabase.from("rh_cargos").select("nome, cbo").eq("id", k.cargo_id).maybeSingle() : nada,
      k.estabelecimento_id ? supabase.from("rh_estabelecimentos").select("tp_insc, nr_insc, cnpj_sindicato").eq("id", k.estabelecimento_id).maybeSingle() : nada,
      supabase.from("rh_empregador").select("tp_insc, nr_insc, ini_valid").eq("empresa_id", empresaId).is("excluido_em", null).lte("ini_valid", String(k.data_admissao).slice(0, 7)).order("ini_valid", { ascending: false }).limit(1),
      supabase.from("rh_esocial_eventos").select("id, id_evento, versao_leiaute, xml, criado_em").eq("contrato_id", contratoId).order("criado_em", { ascending: false }).limit(20),
    ]);
    const falha = [col, pes, rem, cg, est, emp, ev].find((x) => x.error);
    if (falha?.error) { setErro(true); Sentry.captureException(new Error(`rh/esocial leitura: ${falha.error.message}`)); return; }
    setEventos((ev.data as Linha[] | null) ?? []);
    const r0 = (rem.data as Linha[] | null)?.[0];
    const cd = col.data as Linha;
    setDados({
      empregador: ((emp.data as Linha[] | null)?.[0] as DadosS2200["empregador"]) ?? null, colab: { nome: cd.nome, nome_social: cd.nome_social },
      pessoal: (pes.data as Linha | null) ?? null, contrato: { ...(k as Linha), qtd_hrs_sem: k.qtd_hrs_sem == null ? null : Number(k.qtd_hrs_sem) } as DadosS2200["contrato"],
      cargo: (cg.data as DadosS2200["cargo"]) ?? null, remuneracao: r0 ? { und_sal_fixo: Number(r0.und_sal_fixo), valor: Number(r0.valor) } : null,
      estabelecimento: (est.data as DadosS2200["estabelecimento"]) ?? null,
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
    <Secao titulo={L("eSocial — admissão (S-2200)", "eSocial — hire (S-2200)", "eSocial — admisión (S-2200)")}>
      <div className="md:col-span-2 text-sm space-y-3" style={{ color: "var(--axi-text-primary)" }}>
        {erro ? <p style={{ color: "#ef4444" }}>{L("Não foi possível ler os dados do eSocial agora. Feche e abra de novo.", "Could not read eSocial data now. Close and open again.", "No se pudieron leer los datos del eSocial ahora. Cierre y abra de nuevo.")}</p> : !dados ? <p style={{ color: c.TEXTO_SEC }}>{L("Carregando…", "Loading…", "Cargando…")}</p> : (<>
          <p><b>{L("Situação", "Status", "Situación")}:</b> <span className="font-bold" style={{ color: corSit }}>{(SIT_ESOCIAL[situacao] ?? [situacao, situacao, situacao])[i]}</span>{recibo && <> · {L("recibo", "receipt", "recibo")} {recibo}</>}</p>
          <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("O Axioma prepara o arquivo no formato oficial (leiaute S-1.3, conferido contra o esquema do governo). O contador assina com o certificado digital dele e envia. A lista abaixo usa o que está SALVO: salve antes de preparar.", "Axioma prepares the file in the official format (layout S-1.3, checked against the government schema). The accountant signs it with their digital certificate and sends it. The list below uses what is SAVED: save before preparing.", "Axioma prepara el archivo en el formato oficial (leiaute S-1.3, verificado contra el esquema del gobierno). El contador lo firma con su certificado digital y lo envía. La lista de abajo usa lo GUARDADO: guarde antes de preparar.")}</p>
          {!podePreparar ? (
            <p className="text-xs" style={{ color: c.TEXTO_SEC }}>{L("Para preparar o arquivo é preciso liberação de dados pessoais e de salário (peça em RH · Estrutura e acessos → Acessos do RH).", "Preparing the file requires personal-data and salary access (ask in HR · Structure and access → HR access).", "Para preparar el archivo se necesita habilitación de datos personales y salario (pídala en RR. HH. · Estructura y accesos → Accesos de RR. HH.).")}</p>
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
          {eventos.length > 0 && (
            <ul className="text-xs space-y-0.5" style={{ color: c.TEXTO_SEC }}>
              {eventos.map((e) => <li key={e.id} className="break-all">{new Date(e.criado_em).toLocaleString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR")} — {e.id_evento} <button type="button" className="underline" onClick={() => baixarXml(nomeArquivo(e.id_evento), e.xml)}>{L("baixar", "download", "descargar")}</button></li>)}
            </ul>
          )}
        </>)}
      </div>
    </Secao>
  );
}
