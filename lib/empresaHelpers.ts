import { reportarFalhaLeitura } from "./erroUiHelpers";
// 🦅 AXIOMA AI.TECH - Helpers do Módulo Empresa
// Integrações: BrasilAPI (CNPJ), ViaCEP (endereço)
// CRUD profissional com auditoria automática, validações, scores e calendário fiscal.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { formatarCEP, consultarCEP, validarCPF, formatarCPF, type DadosCEP } from "./enderecoHelpers";
export { formatarCEP, consultarCEP, validarCPF, formatarCPF, type DadosCEP };

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// RLS pode bloquear update/delete e devolver 0 linhas SEM error do Postgres —
// .select("id") é o que permite enxergar essa falha silenciosa (mesmo padrão
// já usado em atualizarEmpresa(), mais abaixo).
function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// Campos que identificam uma PESSOA física de fora da empresa (o contador,
// não sócio/funcionário) — a auditoria nunca grava o valor real desses
// campos, só o fato de que mudaram (LGPD: dado pessoal de terceiro sem base
// legal pra reter no histórico). Usado em criarEmpresa/atualizarEmpresa.
const CAMPOS_TERCEIRO = new Set(["contador_nome", "contador_email", "contador_telefone", "contador_crc"]);
function redigirCamposTerceiro(payload: any): any {
  const limpo = { ...payload };
  for (const campo of CAMPOS_TERCEIRO) {
    if (campo in limpo) limpo[campo] = "[redigido]";
  }
  return limpo;
}

// ============================================================================
// VALIDAÇÃO E FORMATAÇÃO
// ============================================================================

export function limparCNPJ(cnpj: string): string {
  return (cnpj || "").replace(/\D/g, "");
}

export function formatarCNPJ(cnpj: string): string {
  const limpo = limparCNPJ(cnpj);
  if (limpo.length !== 14) return cnpj || "";
  return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function validarCNPJ(cnpj: string): boolean {
  const c = limparCNPJ(cnpj);
  if (c.length !== 14) return false;
  if (/^(\d)\1+$/.test(c)) return false;

  // 1º dígito verificador
  let soma = 0;
  let pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) soma += parseInt(c[i]) * pesos[i];
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (d1 !== parseInt(c[12])) return false;

  // 2º dígito verificador
  soma = 0;
  pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) soma += parseInt(c[i]) * pesos[i];
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  return d2 === parseInt(c[13]);
}

export function formatarTelefone(tel: string): string {
  const limpo = (tel || "").replace(/\D/g, "");
  if (limpo.length === 11) return limpo.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (limpo.length === 10) return limpo.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return tel || "";
}

// ============================================================================
// CONSULTA BrasilAPI - CNPJ (gratuita, sem auth)
// ============================================================================

export type DadosCNPJ = {
  razao_social?: string;
  nome_fantasia?: string | null;
  cnpj?: string;
  cnae_principal?: string | null;
  cnae_descricao?: string;
  cnaes_secundarios?: any[];
  natureza_juridica?: string;
  porte?: string;
  data_abertura?: string;
  capital_social?: number;
  situacao_cadastral?: string;
  opcao_simples?: boolean;
  opcao_mei?: boolean;
  regime_sugerido?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  telefone_principal?: string | null;
  email_principal?: string;
  socios?: any[];
};

// Consulta a BrasilAPI por dentro da nossa própria rota (app/api/empresa/
// consulta-cnpj) — nunca mais direto do navegador. A CSP bloqueia
// brasilapi.com.br em connect-src de propósito (mantida restritiva); mover a
// chamada pro servidor é a correção certa, não abrir a CSP. `codigo` no
// retorno de erro é estável (não muda por idioma) — a tela traduz.
export async function consultarCNPJ(cnpj: string): Promise<DadosCNPJ | { erro: string; codigo: string }> {
  const c = limparCNPJ(cnpj);
  if (!validarCNPJ(c)) return { erro: "CNPJ inválido (dígitos verificadores não conferem)", codigo: "invalido" };

  let data: any;
  try {
    const resp = await fetch(`/api/empresa/consulta-cnpj?cnpj=${c}`);
    data = await resp.json();
  } catch {
    return { erro: "Erro de conexão", codigo: "indisponivel" };
  }

  if (data.status === "invalido") return { erro: "CNPJ inválido (dígitos verificadores não conferem)", codigo: "invalido" };
  if (data.status === "nao_encontrado") return { erro: "CNPJ não encontrado na Receita Federal", codigo: "nao_encontrado" };
  if (data.status !== "ok") return { erro: "Serviço de consulta indisponível no momento. Tente novamente em instantes.", codigo: "indisponivel" };

  return {
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia || null,
    cnpj: formatarCNPJ(data.cnpj),
    cnae_principal: data.cnae_principal,
    cnae_descricao: data.cnae_descricao,
    cnaes_secundarios: data.cnaes_secundarios || [],
    natureza_juridica: data.natureza_juridica,
    porte: data.porte,
    data_abertura: data.data_abertura,
    capital_social: data.capital_social ? Number(data.capital_social) : 0,
    situacao_cadastral: data.situacao_cadastral || "",
    opcao_simples: data.opcao_simples || false,
    opcao_mei: data.opcao_mei || false,
    regime_sugerido: data.regime_sugerido || null,
    cep: data.cep ? formatarCEP(String(data.cep)) : null,
    logradouro: data.logradouro || null,
    numero: data.numero ? String(data.numero) : null,
    complemento: data.complemento,
    bairro: data.bairro,
    cidade: data.cidade,
    uf: data.uf,
    telefone_principal: data.telefone_principal ? formatarTelefone(String(data.telefone_principal)) : null,
    email_principal: data.email_principal,
    socios: data.socios || [],
  };
}

// ============================================================================
// BANCOS (BrasilAPI, server-side) — alimenta o seletor com busca do campo Banco
// ============================================================================
export type Banco = { codigo: string; nome: string };

export async function listarBancos(): Promise<Banco[]> {
  try {
    const resp = await fetch("/api/empresa/bancos");
    const data = await resp.json();
    return data.status === "ok" ? (data.bancos as Banco[]) : [];
  } catch {
    return [];
  }
}

// ============================================================================
// CHAVE PIX — detecta o tipo (CPF/CNPJ/e-mail/telefone/aleatória) e formata
// conforme. Chave aleatória (UUID do banco) e e-mail não têm máscara — só
// passam direto.
// ============================================================================
export type TipoChavePix = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria" | "";

export function detectarTipoChavePix(valor: string): TipoChavePix {
  const v = (valor || "").trim();
  if (!v) return "";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return "aleatoria";
  if (/^\S+@\S+\.\S+$/.test(v)) return "email";
  const digitos = v.replace(/\D/g, "");
  if (digitos.length === 11 && validarCPF(digitos)) return "cpf";
  if (digitos.length === 14 && validarCNPJ(digitos)) return "cnpj";
  if (digitos.length >= 10 && digitos.length <= 13 && /^[\d\s()+-]+$/.test(v)) return "telefone";
  return "aleatoria";
}

export function formatarChavePix(valor: string): string {
  const tipo = detectarTipoChavePix(valor);
  const digitos = (valor || "").replace(/\D/g, "");
  if (tipo === "cpf") return formatarCPF(digitos);
  if (tipo === "cnpj") return formatarCNPJ(digitos);
  if (tipo === "telefone") return formatarTelefone(digitos);
  return valor;
}

// ============================================================================
// MOEDA BR — máscara de capital social enquanto digita (dígitos viram
// centavos, formata R$ 1.234,56). Armazenado sempre como number no form.
// ============================================================================
export function formatarMoedaBR(numero: number): string {
  return (numero || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function moedaBRParaNumero(digitado: string): number {
  const digitos = (digitado || "").replace(/\D/g, "");
  return digitos ? parseInt(digitos, 10) / 100 : 0;
}

// ============================================================================
// SUGESTÃO — regime tributário pelo PORTE (só quando não há dado real de
// opcao_simples/opcao_mei vindo da Receita). Sempre editável, nunca imposto.
// ============================================================================
export function sugerirRegimePorPorte(porte: string): string | null {
  if (porte === "MEI" || porte === "ME" || porte === "EPP") return "simples";
  return null;
}

// ============================================================================
// EMPRESA - CRUD COM AUDITORIA AUTOMÁTICA
// ============================================================================

// Carrega a empresa pelo id (funciona pro dono E pro convidado — RLS decide
// quem enxerga, não o filtro). Usar junto de obterEmpresaAtiva().
export async function carregarEmpresaPorId(empresaId: string): Promise<any | null> {
  const { data } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", empresaId)
    .maybeSingle();
  return data;
}

// ============================================================================
// EMPRESA ATIVA — multi-tenant (dono OU convidado, via RPC empresas_do_usuario())
// Fonte única pra todo módulo obter o empresa_id antes de gravar/ler.
// Cache em sessionStorage (por aba) pra não bater no banco a cada gravação.
// ============================================================================
let cacheEmpresaAtiva: { userId: string; empresaId: string | null } | null = null;

export async function obterEmpresaAtiva(): Promise<string | null> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return null;

  if (cacheEmpresaAtiva?.userId === userId) return cacheEmpresaAtiva.empresaId;

  const salvar = (empresaId: string | null) => {
    cacheEmpresaAtiva = { userId, empresaId };
    if (typeof window !== "undefined") {
      const chave = `axioma_empresa_ativa_${userId}`;
      if (empresaId) sessionStorage.setItem(chave, empresaId);
      else sessionStorage.removeItem(chave);
    }
    return empresaId;
  };

  if (typeof window !== "undefined") {
    const salvo = sessionStorage.getItem(`axioma_empresa_ativa_${userId}`);
    if (salvo) return salvar(salvo);
    // Empresa escolhida pela pessoa (ex.: convidado aprovado — senão o Axioma
    // abriria sempre a empresa vazia criada no cadastro dela). Só vale se a
    // regra de acesso do banco ainda liberar (prazo vencido/acesso cortado = some).
    const preferida = localStorage.getItem(`axioma_empresa_preferida_${userId}`);
    if (preferida) {
      const { data: ok } = await supabase.from("empresas").select("id").eq("id", preferida).maybeSingle();
      if (ok?.id) return salvar(ok.id);
      localStorage.removeItem(`axioma_empresa_preferida_${userId}`);
    }
  }

  // (a) empresa própria (dono)
  const { data: propria } = await supabase
    .from("empresas")
    .select("id, cadastro_completo")
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (propria?.id && propria.cadastro_completo) return salvar(propria.id);

  // (b) vínculo de convidado (em outra empresa). Vem ANTES da empresa própria
  // vazia: quem foi convidado e aprovado ganhou uma "Minha Empresa" vazia no
  // cadastro — sem isto, entraria sempre nela e nunca na empresa que o convidou.
  // empresas_do_usuario (RLS) já some com acesso vencido/cortado.
  const { data: vinculos } = await supabase
    .from("empresa_usuarios")
    .select("empresa_id")
    .eq("user_id", userId)
    .limit(20);
  const { data: acessiveis } = vinculos?.length
    ? await supabase.from("empresas").select("id").in("id", vinculos.map((v) => v.empresa_id))
    : { data: [] as { id: string }[] };
  const outra = (acessiveis || []).find((e) => e.id !== propria?.id);
  if (outra) return salvar(outra.id);
  if (propria?.id) return salvar(propria.id);

  // (c) rede de segurança: nem dono nem convidado — cria "Minha Empresa" vazia
  // (idempotente/atômica no banco, ver obter_ou_criar_empresa_padrao() em SQL-EMPRESA-PADRAO.sql).
  // O caminho principal de criação é o /auth/callback (login/cadastro), isto é só o fallback.
  const { data: empresaId, error } = await supabase.rpc("obter_ou_criar_empresa_padrao");
  if (error) reportarFalhaEscrita("empresas", "rpc obter_ou_criar_empresa_padrao", error.message);
  return salvar(typeof empresaId === "string" ? empresaId : null);
}

// Abre o Axioma nesta empresa agora e nas próximas entradas (convite aprovado).
export function definirEmpresaPreferida(userId: string, empresaId: string) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(`axioma_empresa_preferida_${userId}`, empresaId); } catch {}
  sessionStorage.setItem(`axioma_empresa_ativa_${userId}`, empresaId);
  cacheEmpresaAtiva = null;
}

// Chamar no logout, ou depois de trocar/criar empresa, pra forçar nova consulta.
export function limparCacheEmpresaAtiva() {
  cacheEmpresaAtiva = null;
}

export async function criarEmpresa(userId: string, dados: any): Promise<{ id?: string; erro?: string }> {
  const payload = {
    ...dados,
    user_id: userId,
    nome: dados.nome || dados.razao_social || dados.nome_fantasia || "Minha Empresa",
    ativo: true,
  };
  const { data, error } = await supabase
    .from("empresas")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { erro: error.message };

  // Garante o vínculo real do dono em empresa_usuarios — sem essa linha o
  // proprietário fica invisível pra listar_equipe() (e pra qualquer tela
  // futura que use essa tabela como fonte). obter_ou_criar_empresa_padrao()
  // já grava isso pro caminho automático de cadastro; este é o caminho
  // manual, que ficou de fora até agora.
  const { data: vinculoDono, error: erroVinculo } = await supabase
    .from("empresa_usuarios")
    // ignoreDuplicates = só cria (ON CONFLICT DO NOTHING): alteração direta em
    // empresa_usuarios está fechada desde a hierarquia da Equipe (HIERARQUIA-EQUIPE-SQL.sql).
    .upsert({ empresa_id: data.id, user_id: userId, papel: "dono" }, { onConflict: "empresa_id,user_id", ignoreDuplicates: true })
    .select("id");
  if (erroVinculo) {
    reportarFalhaEscrita("empresa_usuarios", "upsert (vínculo dono)", erroVinculo?.message || "0 linhas afetadas (RLS?)");
  }

  await registrarAuditoria({
    empresaId: data.id,
    userId,
    tabela: "empresas",
    registroId: data.id,
    acao: "criar",
    valorDepois: redigirCamposTerceiro(payload),
    descricao: "Empresa cadastrada no sistema",
  });

  return { id: data.id };
}

export async function atualizarEmpresa(
  empresaId: string,
  userId: string,
  dadosAntes: any,
  dadosNovos: any
): Promise<{ erro?: string }> {
  // Detecta campos alterados (ignora updated_at e created_at)
  const camposAlterados: string[] = [];
  for (const k of Object.keys(dadosNovos)) {
    if (k === "updated_at" || k === "created_at" || k === "id") continue;
    const v1 = dadosAntes?.[k];
    const v2 = dadosNovos[k];
    const norm = (x: any) => (x === null || x === undefined || x === "" ? null : x);
    if (norm(v1) !== norm(v2)) camposAlterados.push(k);
  }

  if (camposAlterados.length === 0) return {};

  // Qualquer edição do cadastro conta como "usuário preencheu" — some o aviso.
  const payload = { ...dadosNovos, cadastro_completo: true, updated_at: new Date().toISOString() };
  // .select() força o retorno das linhas afetadas — sem isso, um UPDATE que a
  // RLS bloqueia silenciosamente (0 linhas, sem erro do Postgres) parecia
  // sucesso. Ver STATUS-AXIOMA: bug da política de "empresas" só olhar
  // user_id, não empresa_usuarios.
  const { data, error } = await supabase
    .from("empresas")
    .update(payload)
    .eq("id", empresaId)
    .select("id");
  if (error) return { erro: error.message };
  if (!data || data.length === 0) return { erro: "SEM_PERMISSAO_ESCRITA" };

  // Auditoria: 1 registro por campo alterado. Campo de terceiro (contador)
  // não grava o valor real — só o fato de que mudou (ver redigirCamposTerceiro).
  for (const campo of camposAlterados) {
    const redigir = CAMPOS_TERCEIRO.has(campo);
    await registrarAuditoria({
      empresaId,
      userId,
      tabela: "empresas",
      registroId: empresaId,
      acao: "editar",
      campo,
      valorAntes: redigir ? { redigido: true } : { [campo]: dadosAntes?.[campo] || null },
      valorDepois: redigir ? { redigido: true } : { [campo]: dadosNovos[campo] || null },
    });
  }

  return {};
}

// ============================================================================
// SÓCIOS - CRUD
// ============================================================================

export async function carregarSocios(empresaId: string, userId: string): Promise<any[]> {
  const { data } = await supabase
    .from("empresa_socios")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .order("participacao_pct", { ascending: false });
  return data || [];
}

// Sócio é dado pessoal de alguém que não é o usuário logado — a auditoria
// registra a AÇÃO e o id interno do registro, nunca nome/CPF (LGPD). O nome
// completo fica só na tabela empresa_socios em si (onde precisa existir pra
// o cadastro funcionar), não no histórico de auditoria.
export async function criarSocio(empresaId: string, userId: string, dados: any): Promise<{ id?: string; erro?: string }> {
  const payload = { ...dados, empresa_id: empresaId, user_id: userId };
  const { data, error } = await supabase.from("empresa_socios").insert(payload).select("id").single();
  if (error) return { erro: error.message };
  await registrarAuditoria({
    empresaId,
    userId,
    tabela: "empresa_socios",
    registroId: data.id,
    acao: "criar",
    descricao: "Sócio adicionado",
  });
  return { id: data.id };
}

export async function atualizarSocio(socioId: string, empresaId: string, userId: string, dados: any): Promise<{ erro?: string }> {
  const { data, error } = await supabase
    .from("empresa_socios")
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq("id", socioId)
    .eq("empresa_id", empresaId)
    .select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("empresa_socios", "update", motivo);
    return { erro: error ? motivo : "SEM_PERMISSAO_ESCRITA" };
  }
  await registrarAuditoria({
    empresaId,
    userId,
    tabela: "empresa_socios",
    registroId: socioId,
    acao: "editar",
    descricao: "Sócio atualizado",
  });
  return {};
}

export async function excluirSocio(socioId: string, empresaId: string, userId: string): Promise<{ erro?: string }> {
  const { data, error } = await supabase
    .from("empresa_socios")
    .delete()
    .eq("id", socioId)
    .eq("empresa_id", empresaId)
    .select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("empresa_socios", "delete", motivo);
    return { erro: error ? motivo : "SEM_PERMISSAO_ESCRITA" };
  }
  await registrarAuditoria({
    empresaId,
    userId,
    tabela: "empresa_socios",
    registroId: socioId,
    acao: "excluir",
    descricao: "Sócio removido",
  });
  return {};
}

// ============================================================================
// IMPORTAR SÓCIOS DO QSA (BrasilAPI)
// ============================================================================

// sociosExistentes: lista já carregada na tela (carregarSocios) — evita
// reimportar o mesmo sócio a cada nova consulta de CNPJ. Compara por
// cpf_cnpj (limpo) quando existe dos dois lados; sem CPF/CNPJ em algum dos
// dois, compara por nome (case/acento-insensível, aproximado).
export async function importarSociosDoQSA(
  empresaId: string, userId: string, qsa: any[], sociosExistentes: any[] = []
): Promise<{ importados: number; ignorados: number; falhas: number }> {
  const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  const cpfCnpjExistentes = new Set(sociosExistentes.map((s) => (s.cpf_cnpj || "").replace(/\D/g, "")).filter(Boolean));
  const nomesExistentes = new Set(sociosExistentes.map((s) => norm(s.nome)).filter(Boolean));

  let importados = 0;
  let ignorados = 0;
  let falhas = 0;
  for (const s of qsa) {
    const dados = {
      nome: s.nome_socio || s.nome,
      qualificacao: s.qualificacao_socio || s.qualificacao,
      cpf_cnpj: s.cnpj_cpf_do_socio || s.cpf_cnpj || null,
      tipo_pessoa: ((s.cnpj_cpf_do_socio || s.cpf_cnpj || "").replace(/\D/g, "").length > 11) ? "PJ" : "PF",
      data_entrada: s.data_entrada_sociedade || s.data_entrada || null,
    };
    if (!dados.nome) continue;

    const cpfCnpjLimpo = (dados.cpf_cnpj || "").replace(/\D/g, "");
    const jaExiste = cpfCnpjLimpo ? cpfCnpjExistentes.has(cpfCnpjLimpo) : nomesExistentes.has(norm(dados.nome));
    if (jaExiste) { ignorados++; continue; }

    const { data, error } = await supabase
      .from("empresa_socios")
      .insert({ ...dados, empresa_id: empresaId, user_id: userId, ativo: true })
      .select("id")
      .single();
    if (!error && data) {
      importados++;
      if (cpfCnpjLimpo) cpfCnpjExistentes.add(cpfCnpjLimpo); else nomesExistentes.add(norm(dados.nome));
    } else {
      falhas++;
      reportarFalhaEscrita("empresa_socios", "insert (importação QSA)", error?.message || "0 linhas afetadas (RLS?)");
    }
  }
  // 1 registro de auditoria pro lote inteiro (não 1 por sócio) — a ação e a
  // quantidade, nunca nomes/CPF de gente sem relação com o usuário logado
  // (LGPD, ver nota em criarSocio). Só registra se algo de fato entrou.
  if (importados > 0) {
    await registrarAuditoria({
      empresaId,
      userId,
      tabela: "empresa_socios",
      registroId: empresaId,
      acao: "criar",
      descricao: `Importados ${importados} sócio(s) do quadro societário da Receita Federal${ignorados > 0 ? ` (${ignorados} já cadastrado(s), ignorado(s))` : ""}`,
    });
  }
  return { importados, ignorados, falhas };
}

// ============================================================================
// DOCUMENTOS - CRUD + STORAGE
// ============================================================================

export async function carregarDocumentos(empresaId: string, userId: string): Promise<any[]> {
  const { data } = await supabase
    .from("empresa_documentos")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function uploadDocumento(
  file: File,
  empresaId: string,
  userId: string,
  tipo: string
): Promise<{ path?: string; erro?: string }> {
  const timestamp = Date.now();
  const nomeArquivo = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${userId}/${empresaId}/${tipo}/${timestamp}-${nomeArquivo}`;

  const { error } = await supabase.storage
    .from("empresa-documentos")
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (error) return { erro: error.message };
  return { path };
}

export async function criarDocumento(empresaId: string, userId: string, dados: any): Promise<{ id?: string; erro?: string }> {
  const payload = { ...dados, empresa_id: empresaId, user_id: userId };
  const { data, error } = await supabase.from("empresa_documentos").insert(payload).select("id").single();
  if (error) return { erro: error.message };
  await registrarAuditoria({
    empresaId,
    userId,
    tabela: "empresa_documentos",
    registroId: data.id,
    acao: "criar",
    valorDepois: payload,
    descricao: `Documento adicionado: ${dados.nome}`,
  });
  return { id: data.id };
}

export async function gerarUrlDocumento(path: string, segundos: number = 3600): Promise<string | null> {
  const { data } = await supabase.storage.from("empresa-documentos").createSignedUrl(path, segundos);
  return data?.signedUrl || null;
}

export async function excluirDocumento(
  docId: string,
  empresaId: string,
  userId: string,
  storagePath: string | null,
  nome: string
): Promise<{ erro?: string }> {
  if (storagePath) {
    await supabase.storage.from("empresa-documentos").remove([storagePath]);
  }
  const { error } = await supabase
    .from("empresa_documentos")
    .delete()
    .eq("id", docId)
    .eq("empresa_id", empresaId);
  if (error) return { erro: error.message };
  await registrarAuditoria({
    empresaId,
    userId,
    tabela: "empresa_documentos",
    registroId: docId,
    acao: "excluir",
    descricao: `Documento removido: ${nome}`,
  });
  return {};
}

// ============================================================================
// LOGO DA EMPRESA (bucket público)
// ============================================================================

export async function uploadLogo(file: File, userId: string): Promise<{ url?: string; erro?: string }> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${userId}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("empresa-logos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { erro: error.message };
  const { data } = supabase.storage.from("empresa-logos").getPublicUrl(path);
  return { url: data.publicUrl };
}

// ============================================================================
// AUDITORIA
// ============================================================================

// Rastreabilidade real: além do que mudou, registra QUAL empresa e QUEM fez
// (nome/e-mail de quem estava logado, não só o user_id). Busca os dois na
// hora — nunca confia num valor que o chamador poderia ter desatualizado em
// memória. Mesmo fallback de nome já usado no Dashboard
// (user_metadata.nome → user_metadata.full_name → prefixo do e-mail).
export async function registrarAuditoria(params: {
  empresaId: string;
  userId: string;
  tabela: string;
  registroId?: string;
  acao: "criar" | "editar" | "excluir";
  campo?: string;
  valorAntes?: any;
  valorDepois?: any;
  descricao?: string;
}): Promise<void> {
  const [{ data: authData }, { data: emp }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("empresas").select("nome, razao_social").eq("id", params.empresaId).maybeSingle(),
  ]);
  const autorEmail = authData?.user?.email || null;
  const autorNome =
    authData?.user?.user_metadata?.nome ||
    authData?.user?.user_metadata?.full_name ||
    autorEmail?.split("@")[0] ||
    null;

  const { error } = await supabase.from("empresa_auditoria").insert({
    empresa_id: params.empresaId,
    empresa_nome: emp?.razao_social || emp?.nome || null,
    user_id: params.userId,
    autor_nome: autorNome,
    autor_email: autorEmail,
    tabela: params.tabela,
    registro_id: params.registroId,
    acao: params.acao,
    campo: params.campo,
    valor_antes: params.valorAntes,
    valor_depois: params.valorDepois,
    descricao: params.descricao,
  });

  // Uma auditoria que falha em silêncio é pior que não ter auditoria — dá
  // falsa sensação de rastreabilidade. Nunca propaga o erro pra quem chamou
  // (a operação principal do usuário — salvar cadastro, adicionar sócio etc.
  // — já aconteceu e tem que continuar funcionando mesmo se o LOG falhar),
  // mas também nunca engole: console.error + Sentry, mesmo padrão já usado
  // em app/global-error.tsx.
  if (error) {
    console.error("[AXIOMA] Falha ao gravar auditoria", {
      tabela: params.tabela, acao: params.acao, empresaId: params.empresaId, registroId: params.registroId, erro: error.message,
    });
    Sentry.captureException(new Error(`Falha ao gravar empresa_auditoria: ${error.message}`), {
      extra: { tabela: params.tabela, acao: params.acao, campo: params.campo, empresaId: params.empresaId, registroId: params.registroId },
    });
  }
}

export async function carregarAuditoria(empresaId: string, userId: string, limit: number = 100): Promise<any[]> {
  const { data } = await supabase
    .from("empresa_auditoria")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

// ============================================================================
// OBRIGAÇÕES FISCAIS
// ============================================================================

export async function carregarObrigacoes(empresaId: string, userId: string): Promise<any[]> {
  const { data } = await supabase
    .from("empresa_obrigacoes")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("data_vencimento", { ascending: true });
  return data || [];
}

export async function criarObrigacao(empresaId: string, userId: string, dados: any): Promise<{ id?: string; erro?: string }> {
  const payload = { ...dados, empresa_id: empresaId, user_id: userId };
  const { data, error } = await supabase.from("empresa_obrigacoes").insert(payload).select("id").single();
  if (error) return { erro: error.message };
  await registrarAuditoria({
    empresaId, userId,
    tabela: "empresa_obrigacoes",
    registroId: data.id,
    acao: "criar",
    valorDepois: payload,
    descricao: `Obrigação criada: ${dados.nome}`,
  });
  return { id: data.id };
}

export async function atualizarObrigacao(id: string, empresaId: string, userId: string, dados: any): Promise<{ erro?: string }> {
  const { data, error } = await supabase
    .from("empresa_obrigacoes")
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("empresa_obrigacoes", "update", motivo);
    return { erro: error ? motivo : "SEM_PERMISSAO_ESCRITA" };
  }
  await registrarAuditoria({
    empresaId, userId,
    tabela: "empresa_obrigacoes",
    registroId: id,
    acao: "editar",
    valorDepois: dados,
    descricao: `Obrigação atualizada: ${dados.nome || ""}`,
  });
  return {};
}

export async function excluirObrigacao(id: string, empresaId: string, userId: string, nome: string): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("empresa_obrigacoes").delete().eq("id", id).eq("empresa_id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("empresa_obrigacoes", "delete", motivo);
    return { erro: error ? motivo : "SEM_PERMISSAO_ESCRITA" };
  }
  await registrarAuditoria({
    empresaId, userId,
    tabela: "empresa_obrigacoes",
    registroId: id,
    acao: "excluir",
    descricao: `Obrigação removida: ${nome}`,
  });
  return {};
}

// Gera calendário fiscal baseado no regime
const NOMES_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function gerarObrigacoesPadrao(regimeTributario: string, ano: number): any[] {
  const obrigacoes: any[] = [];
  const regime = (regimeTributario || "").toLowerCase();

  if (regime === "mei") {
    // DAS MEI mensal (vencimento dia 20 do mês seguinte)
    for (let mes = 0; mes < 12; mes++) {
      const venc = new Date(ano, mes + 1, 20);
      obrigacoes.push({
        tipo: "DAS-MEI",
        nome: `DAS MEI ${NOMES_MESES[mes]}/${ano}`,
        descricao: "Documento de Arrecadação do MEI",
        data_vencimento: venc.toISOString().slice(0, 10),
        recorrencia: "mensal",
        notificar_dias_antes: 7,
        valor_estimado: 0,
      });
    }
    // DASN-SIMEI anual (até 31/05)
    obrigacoes.push({
      tipo: "DASN-SIMEI",
      nome: `DASN-SIMEI ${ano}`,
      descricao: "Declaração Anual do MEI",
      data_vencimento: `${ano}-05-31`,
      recorrencia: "anual",
      notificar_dias_antes: 30,
    });
  } else if (regime.includes("simples")) {
    // DAS mensal (vencimento dia 20 do mês seguinte)
    for (let mes = 0; mes < 12; mes++) {
      const venc = new Date(ano, mes + 1, 20);
      obrigacoes.push({
        tipo: "DAS",
        nome: `DAS ${NOMES_MESES[mes]}/${ano}`,
        descricao: "Documento de Arrecadação do Simples Nacional",
        data_vencimento: venc.toISOString().slice(0, 10),
        recorrencia: "mensal",
        notificar_dias_antes: 7,
      });
    }
    // DEFIS (até 31/03)
    obrigacoes.push({
      tipo: "DEFIS",
      nome: `DEFIS ${ano}`,
      descricao: "Declaração de Informações Socioeconômicas e Fiscais",
      data_vencimento: `${ano}-03-31`,
      recorrencia: "anual",
      notificar_dias_antes: 30,
    });
  } else if (regime.includes("presumido") || regime.includes("real")) {
    // DCTF mensal (até 15º dia útil do 2º mês subsequente)
    for (let mes = 0; mes < 12; mes++) {
      const venc = new Date(ano, mes + 2, 15);
      obrigacoes.push({
        tipo: "DCTF",
        nome: `DCTF ${NOMES_MESES[mes]}/${ano}`,
        descricao: "Declaração de Débitos e Créditos Tributários Federais",
        data_vencimento: venc.toISOString().slice(0, 10),
        recorrencia: "mensal",
        notificar_dias_antes: 7,
      });
    }
    // EFD-Contribuições mensal
    for (let mes = 0; mes < 12; mes++) {
      const venc = new Date(ano, mes + 1, 10);
      obrigacoes.push({
        tipo: "EFD-Contribuicoes",
        nome: `EFD-Contribuições ${NOMES_MESES[mes]}/${ano}`,
        descricao: "Escrituração Fiscal Digital - PIS/COFINS",
        data_vencimento: venc.toISOString().slice(0, 10),
        recorrencia: "mensal",
        notificar_dias_antes: 7,
      });
    }
    // ECF anual (julho)
    obrigacoes.push({
      tipo: "ECF",
      nome: `ECF ${ano}`,
      descricao: "Escrituração Contábil Fiscal",
      data_vencimento: `${ano}-07-31`,
      recorrencia: "anual",
      notificar_dias_antes: 60,
    });
    // ECD anual (maio)
    obrigacoes.push({
      tipo: "ECD",
      nome: `ECD ${ano}`,
      descricao: "Escrituração Contábil Digital",
      data_vencimento: `${ano}-05-31`,
      recorrencia: "anual",
      notificar_dias_antes: 60,
    });
  }

  return obrigacoes;
}

// ============================================================================
// EQUIPE / PAPÉIS — PDV Fase 0
// ============================================================================

// Papel do usuário logado NAQUELA empresa (nunca global — a mesma pessoa
// pode ser dono numa empresa e operador em outra). null = sem vínculo.
export async function obterMeuPapel(empresaId: string): Promise<string | null> {
  const { data } = await supabase.rpc("meu_papel", { p_empresa_id: empresaId });
  return (data as string) || null;
}

export type MembroEquipe = {
  id: string;
  origem: "ativo" | "convite";
  user_id: string | null;
  email: string;
  nome: string;
  cargo: string;
  papel: string;
  token_convite: string | null;
  expira_em: string | null;
  criado_em: string;
  situacao?: string | null; // enviado | aguardando_aprovacao | aprovado | suspenso
  relacao?: string | null;
  // Hierarquia (HIERARQUIA-EQUIPE-SQL.sql): 1 Proprietário · 2 CEO · 3 Sócio · 4 Admin · 5 demais
  nivel?: number | null;
  suspenso_em?: string | null;
  suspenso_motivo?: string | null;
};

// Meu nível na empresa (null = sem acesso). Ver MembroEquipe.nivel.
export async function obterMeuNivel(empresaId: string, userId: string): Promise<number | null> {
  const { data } = await supabase.rpc("equipe_nivel", { p_empresa: empresaId, p_user: userId });
  return typeof data === "number" ? data : null;
}

export type PedidoEquipe = {
  id: string; alvo_user_id: string; pedido_por: string; motivo: string; nivel_aval: number;
  situacao: string; criado_em: string; expira_em: string;
};

// Pedidos de remoção que precisam de aval (só Admin ou acima enxerga — RLS)
export async function listarPedidosEquipe(empresaId: string): Promise<PedidoEquipe[]> {
  const { data, error } = await supabase.from("equipe_pedidos")
    .select("id, alvo_user_id, pedido_por, motivo, nivel_aval, situacao, criado_em, expira_em")
    .eq("empresa_id", empresaId).eq("situacao", "aberto").order("criado_em", { ascending: false }).limit(50);
  if (error) { console.error("[equipe] pedidos", error.code, error.message); return []; }
  return (data as PedidoEquipe[]) || [];
}

export async function decidirPedidoEquipe(pedidoId: string, aprovar: boolean, motivo?: string): Promise<{ erro?: string; codigo?: string }> {
  const { error } = await supabase.rpc("equipe_decidir_pedido", { p_pedido: pedidoId, p_aprovar: aprovar, p_motivo: motivo ?? null });
  if (error) { reportarFalhaEscrita("equipe_pedidos", "rpc equipe_decidir_pedido", error.message); return { erro: error.message, codigo: error.code }; }
  return {};
}

export async function concluirPedidoEquipe(pedidoId: string, motivo: string): Promise<{ erro?: string; codigo?: string }> {
  const { error } = await supabase.rpc("equipe_concluir_pedido", { p_pedido: pedidoId, p_motivo: motivo });
  if (error) { reportarFalhaEscrita("equipe_pedidos", "rpc equipe_concluir_pedido", error.message); return { erro: error.message, codigo: error.code }; }
  return {};
}

export async function restaurarMembro(empresaId: string, alvoUserId: string): Promise<{ erro?: string; codigo?: string }> {
  const { error } = await supabase.rpc("equipe_restaurar", { p_empresa: empresaId, p_alvo: alvoUserId });
  if (error) { reportarFalhaEscrita("empresa_usuarios", "rpc equipe_restaurar", error.message); return { erro: error.message, codigo: error.code }; }
  return {};
}

// Lista unificada (ativos + convites pendentes) — RPC recusa quem não é dono
// daquela empresa (checagem dentro da própria função, não só na RLS).
export async function listarEquipe(empresaId: string): Promise<{ dados: MembroEquipe[]; erro?: string; codigo?: string }> {
  const { data, error } = await supabase.rpc("listar_equipe", { p_empresa_id: empresaId });
  if (error) {
    console.error("[equipe] listar_equipe falhou", error.code, error.message, error.details);
    return { dados: [], erro: error.message, codigo: error.code };
  }
  return { dados: (data as MembroEquipe[]) || [] };
}

// Consulta pública do convite (funciona sem login — RPC SECURITY DEFINER,
// nunca expõe a linha inteira de empresa_equipe, só o necessário pra tela).
export async function obterConvitePorToken(token: string): Promise<{
  empresa_nome: string; email_convidado: string; papel: string; cargo: string | null; convite_aceito: boolean;
  // termo/prazo (EQUIPE-ACESSO-TEMPORARIO-SQL.sql) — ausentes antes do SQL rodar
  remetente_nome?: string | null; convidado_em?: string | null; acesso_dias?: number | null; motivo_convite?: string | null; expira_em?: string | null; relacao?: string | null; situacao?: string | null;
} | null> {
  const { data } = await supabase.rpc("obter_convite_por_token", { p_token: token });
  return data?.[0] || null;
}

// Aceita o convite (exige login) — cria o vínculo real em empresa_usuarios,
// que é o que faltava (ver seção 11 do STATUS-AXIOMA: "convidar membro" só
// gravava o convite, nunca dava acesso de fato a ninguém).
// Termo de quem recebe: nome completo, CPF e e-mail ficam em
// empresa_convite_termo (só dono/admin leem — EQUIPE-ACESSO-TEMPORARIO-SQL.sql).
// Não dá acesso ainda: deixa o convite "aguardando aprovação" do dono/admin (decidirConvite).
export type TermoConvite = {
  id: string; convite_id: string | null; user_id: string | null; nome: string | null; cpf: string | null; email: string | null;
  remetente_nome: string | null; relacao: string | null; papel: string | null; acesso_dias: number | null; motivo_convite: string | null;
  convidado_em: string | null; aceito_em: string; apagado_em: string | null; apagado_por: string | null; motivo_apagado: string | null;
  saiu_em?: string | null;
};
export async function listarTermosConvite(empresaId: string): Promise<TermoConvite[]> {
  // Painel da Equipe mostra só quem está na empresa: termo apagado ou de quem saiu (lixeira 30 dias) fica fora
  const { data, error } = await supabase.from("empresa_convite_termo").select("*").eq("empresa_id", empresaId).is("apagado_em", null).is("saiu_em", null).order("aceito_em", { ascending: false }).limit(200);
  if (error) reportarFalhaLeitura("equipe.termos", error);
  return (data as TermoConvite[]) || [];
}
// Lixeira: termos de quem saiu da empresa (60 dias, depois a limpeza diária apaga)
export async function listarLixeiraTermos(empresaId: string): Promise<TermoConvite[]> {
  const { data, error } = await supabase.from("empresa_convite_termo").select("*").eq("empresa_id", empresaId).not("saiu_em", "is", null).is("apagado_em", null).order("saiu_em", { ascending: false }).limit(200);
  if (error) reportarFalhaLeitura("equipe.lixeiraTermos", error);
  return (data as TermoConvite[]) || [];
}
export async function recuperarTermoConvite(id: string): Promise<{ erro?: string; codigo?: string }> {
  const { error } = await supabase.rpc("recuperar_termo_convite", { p_id: id });
  if (error) { reportarFalhaEscrita("empresa_convite_termo", "rpc recuperar_termo_convite", error.message); return { erro: error.message, codigo: error.code }; }
  return {};
}
// Aprovação final do dono/admin: aprovar libera o acesso (com o prazo do convite); recusar encerra.
export async function decidirConvite(conviteId: string, aprovar: boolean, motivo?: string): Promise<{ erro?: string; codigo?: string }> {
  const { error } = await supabase.rpc("decidir_convite", { p_convite_id: conviteId, p_aprovar: aprovar, p_motivo: motivo || null });
  if (error) { reportarFalhaEscrita("empresa_equipe", "rpc decidir_convite", error.message); return { erro: error.message, codigo: error.code }; }
  return {};
}

// Apaga os dados pessoais (nome/CPF/e-mail) do termo — só dono/admin, com motivo; fica o registro de quem apagou.
export async function apagarTermoConvite(id: string, motivo: string): Promise<{ erro?: string; codigo?: string }> {
  const { error } = await supabase.rpc("apagar_termo_convite", { p_id: id, p_motivo: motivo });
  if (error) { reportarFalhaEscrita("empresa_convite_termo", "rpc apagar_termo_convite", error.message); return { erro: error.message, codigo: error.code }; }
  return {};
}

// Troca o papel de um membro. origem "ativo" = empresa_usuarios (já aceitou);
// "convite" = empresa_equipe (ainda pendente, muda o papel oferecido).
export async function alterarPapelMembro(
  membro: MembroEquipe, empresaId: string, userId: string, novoPapel: string
): Promise<{ erro?: string; codigo?: string }> {
  const tabela = membro.origem === "ativo" ? "empresa_usuarios" : "empresa_equipe";
  if (membro.origem === "ativo") {
    // Hierarquia: só quem está acima troca o papel (regra no banco)
    const { error } = await supabase.rpc("equipe_trocar_papel", { p_empresa: empresaId, p_alvo: membro.user_id, p_papel: novoPapel });
    if (error) { reportarFalhaEscrita(tabela, "rpc equipe_trocar_papel", error.message); return { erro: error.message, codigo: error.code }; }
  } else {
    const { data, error } = await supabase.from(tabela).update({ papel: novoPapel }).eq("id", membro.id).eq("empresa_id", empresaId).select("id");
    if (error || !data || data.length === 0) {
      const motivo = error?.message || "0 linhas afetadas (RLS?)";
      reportarFalhaEscrita(tabela, "update (papel)", motivo);
      return error ? { erro: motivo, codigo: error.code } : { erro: "SEM_PERMISSAO_ESCRITA" };
    }
  }
  await registrarAuditoria({
    empresaId, userId, tabela, registroId: membro.id, acao: "editar",
    campo: "papel", valorAntes: membro.papel, valorDepois: novoPapel,
    descricao: `Papel alterado (${membro.email}): ${membro.papel} → ${novoPapel}`,
  });
  return {};
}

// Remove o ACESSO de verdade — antes só apagava o registro de convite
// (empresa_equipe) e, pra quem já tinha aceitado, o acesso real continuava
// valendo (empresa_usuarios nunca era tocado). Agora remove o vínculo real
// quando a origem é "ativo"; pra convite pendente, cancela o convite.
// Ativo: passa pela hierarquia no banco (equipe_remover) — suspende por 7 dias
// (restaurável) ou abre um pedido de aval. Convite pendente: só cancela.
export async function removerAcessoMembro(
  membro: MembroEquipe, empresaId: string, userId: string, motivo?: string
): Promise<{ erro?: string; codigo?: string; resultado?: "suspenso" | "pedido" | "saiu" | "removido" | "cancelado" }> {
  if (membro.origem === "ativo") {
    const { data, error } = await supabase.rpc("equipe_remover", { p_empresa: empresaId, p_alvo: membro.user_id, p_motivo: motivo ?? null });
    if (error) { reportarFalhaEscrita("empresa_usuarios", "rpc equipe_remover", error.message); return { erro: error.message, codigo: error.code }; }
    const resultado = data as "suspenso" | "pedido" | "saiu" | "removido";
    await registrarAuditoria({
      empresaId, userId, tabela: "empresa_usuarios", registroId: membro.id, acao: "excluir",
      descricao: `${resultado === "pedido" ? "Pedido de remoção (aguarda aval)" : resultado === "saiu" ? "Saiu da empresa" : resultado === "removido" ? "Acesso vencido removido de vez" : "Acesso cortado (até 30 dias: de vez; acima: suspenso 7 dias)"}: ${membro.email}${motivo ? ` — motivo: ${motivo}` : ""}`,
    });
    return { resultado };
  }
  const { data, error } = await supabase.from("empresa_equipe").delete().eq("id", membro.id).eq("empresa_id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    const m = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("empresa_equipe", "delete (convite)", m);
    return error ? { erro: m, codigo: error.code } : { erro: "SEM_PERMISSAO_ESCRITA" };
  }
  await registrarAuditoria({
    empresaId, userId, tabela: "empresa_equipe", registroId: membro.id, acao: "excluir",
    descricao: `Convite cancelado: ${membro.email}${motivo ? ` — motivo: ${motivo}` : ""}`,
  });
  return { resultado: "cancelado" };
}

// ============================================================================
// HEALTH SCORE (0-100): completude dos dados cadastrais
// ============================================================================

export type ScoreResultado = {
  score: number;
  nivel: string;
  cor: string;
  itens: { label: string; ok: boolean; pontos: number }[];
};

export function calcularHealthScore(empresa: any, socios: any[], documentos: any[]): ScoreResultado {
  if (!empresa) return { score: 0, nivel: "Sem dados", cor: "#f87171", itens: [] };

  const itens = [
    { label: "Razão Social", ok: !!empresa.razao_social, pontos: 8 },
    { label: "Nome Fantasia", ok: !!empresa.nome_fantasia, pontos: 4 },
    { label: "CNPJ válido", ok: !!empresa.cnpj && validarCNPJ(empresa.cnpj), pontos: 10 },
    { label: "Inscrição Estadual", ok: !!empresa.inscricao_estadual || empresa.opcao_mei, pontos: 6 },
    { label: "Regime Tributário", ok: !!empresa.regime_tributario, pontos: 8 },
    { label: "CNAE Principal", ok: !!empresa.cnae_principal, pontos: 5 },
    { label: "Endereço completo", ok: !!(empresa.cep && empresa.logradouro && empresa.cidade && empresa.uf), pontos: 10 },
    { label: "Telefone principal", ok: !!empresa.telefone_principal, pontos: 4 },
    { label: "E-mail principal", ok: !!empresa.email_principal, pontos: 5 },
    { label: "Dados bancários", ok: !!(empresa.banco_principal && empresa.agencia && empresa.conta), pontos: 5 },
    { label: "Contador cadastrado", ok: !!empresa.contador_nome, pontos: 5 },
    { label: "Logo da empresa", ok: !!empresa.logo_url, pontos: 5 },
    { label: "Pelo menos 1 sócio", ok: socios.length > 0, pontos: 10 },
    { label: "Pelo menos 3 documentos", ok: documentos.length >= 3, pontos: 15 },
  ];

  const score = itens.reduce((s, i) => s + (i.ok ? i.pontos : 0), 0);

  let nivel = "Crítico", cor = "#f87171";
  if (score >= 90) { nivel = "Excelente"; cor = "#34d399"; }
  else if (score >= 70) { nivel = "Bom"; cor = "#6ab0ff"; }
  else if (score >= 50) { nivel = "Regular"; cor = "#fbbf24"; }
  else if (score >= 30) { nivel = "Atenção"; cor = "#fb923c"; }

  return { score, nivel, cor, itens };
}

// ============================================================================
// COMPLIANCE SCORE (0-100): adequação fiscal e legal
// ============================================================================

export function calcularComplianceScore(empresa: any, obrigacoes: any[], documentos: any[]): ScoreResultado {
  if (!empresa) return { score: 0, nivel: "Sem dados", cor: "#f87171", itens: [] };

  const hoje = new Date().toISOString().slice(0, 10);
  const docsValidos = documentos.filter((d: any) => !d.data_validade || d.data_validade >= hoje);
  const obrigVencidasNaoPagas = obrigacoes.filter((o: any) => o.status === "pendente" && o.data_vencimento < hoje);

  const itens = [
    { label: "Regime tributário definido", ok: !!empresa.regime_tributario, pontos: 15 },
    { label: "CNAE principal cadastrado", ok: !!empresa.cnae_principal, pontos: 10 },
    { label: "Situação cadastral ativa", ok: empresa.situacao_cadastral === "ativa" || !empresa.situacao_cadastral, pontos: 15 },
    { label: "IE preenchida (se aplicável)", ok: !!empresa.inscricao_estadual || empresa.opcao_mei, pontos: 10 },
    { label: "Contador cadastrado com CRC", ok: !!(empresa.contador_nome && empresa.contador_crc), pontos: 15 },
    { label: "Calendário de obrigações ativo", ok: obrigacoes.length > 0, pontos: 10 },
    { label: "Sem obrigações vencidas", ok: obrigVencidasNaoPagas.length === 0, pontos: 15 },
    { label: "Documentos válidos no cofre (5+)", ok: docsValidos.length >= 5, pontos: 10 },
  ];

  const score = itens.reduce((s, i) => s + (i.ok ? i.pontos : 0), 0);

  let nivel = "Crítico", cor = "#f87171";
  if (score >= 90) { nivel = "Excelente"; cor = "#34d399"; }
  else if (score >= 70) { nivel = "Bom"; cor = "#6ab0ff"; }
  else if (score >= 50) { nivel = "Regular"; cor = "#fbbf24"; }
  else if (score >= 30) { nivel = "Atenção"; cor = "#fb923c"; }

  return { score, nivel, cor, itens };
}

// ============================================================================
// TIPOS DE DOCUMENTOS RECOMENDADOS
// ============================================================================

export const TIPOS_DOCUMENTOS = [
  { key: "contrato_social", label: "Contrato Social", icon: "📜" },
  { key: "cnpj_card", label: "Cartão CNPJ", icon: "🪪" },
  { key: "alvara_funcionamento", label: "Alvará de Funcionamento", icon: "🏢" },
  { key: "alvara_sanitario", label: "Alvará Sanitário", icon: "🏥" },
  { key: "alvara_bombeiros", label: "Alvará Bombeiros", icon: "🚒" },
  { key: "certidao_negativa_federal", label: "CND Federal", icon: "📋" },
  { key: "certidao_negativa_estadual", label: "CND Estadual", icon: "📋" },
  { key: "certidao_negativa_municipal", label: "CND Municipal", icon: "📋" },
  { key: "certidao_fgts", label: "CRF FGTS", icon: "💼" },
  { key: "certidao_trabalhista", label: "CNDT Trabalhista", icon: "⚖️" },
  { key: "inscricao_estadual", label: "Inscrição Estadual", icon: "🗂️" },
  { key: "inscricao_municipal", label: "Inscrição Municipal", icon: "🗂️" },
  { key: "registro_junta_comercial", label: "Registro Junta Comercial", icon: "📑" },
  { key: "alteracao_contratual", label: "Alteração Contratual", icon: "✏️" },
  { key: "ata_assembleia", label: "Ata de Assembleia", icon: "📝" },
  { key: "procuracao", label: "Procuração", icon: "✒️" },
  { key: "outros", label: "Outros", icon: "📎" },
];

export const REGIMES_TRIBUTARIOS = [
  { key: "mei", label: "MEI - Microempreendedor Individual" },
  { key: "simples", label: "Simples Nacional" },
  { key: "presumido", label: "Lucro Presumido" },
  { key: "real", label: "Lucro Real" },
  { key: "arbitrado", label: "Lucro Arbitrado" },
  { key: "imune", label: "Imune / Isento" },
];