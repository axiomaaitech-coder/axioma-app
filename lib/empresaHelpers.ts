// 🦅 AXIOMA AI.TECH - Helpers do Módulo Empresa
// Integrações: BrasilAPI (CNPJ), ViaCEP (endereço)
// CRUD profissional com auditoria automática, validações, scores e calendário fiscal.

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export function formatarCEP(cep: string): string {
  const limpo = (cep || "").replace(/\D/g, "");
  if (limpo.length !== 8) return cep || "";
  return limpo.replace(/^(\d{5})(\d{3})$/, "$1-$2");
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
  nome_fantasia?: string;
  cnpj?: string;
  cnae_principal?: string;
  cnae_descricao?: string;
  cnaes_secundarios?: any[];
  natureza_juridica?: string;
  porte?: string;
  data_abertura?: string;
  capital_social?: number;
  situacao_cadastral?: string;
  opcao_simples?: boolean;
  opcao_mei?: boolean;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  telefone_principal?: string;
  email_principal?: string;
  socios?: any[];
};

export async function consultarCNPJ(cnpj: string): Promise<DadosCNPJ | { erro: string }> {
  const c = limparCNPJ(cnpj);
  if (!validarCNPJ(c)) return { erro: "CNPJ inválido (dígitos verificadores não conferem)" };

  try {
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${c}`);
    if (!resp.ok) {
      if (resp.status === 404) return { erro: "CNPJ não encontrado na Receita Federal" };
      if (resp.status === 429) return { erro: "Limite de consultas atingido. Tente novamente em alguns minutos." };
      return { erro: `Erro da Receita: ${resp.status}` };
    }
    const data = await resp.json();

    // Determina regime tributário
    let regime = "";
    if (data.opcao_pelo_mei) regime = "mei";
    else if (data.opcao_pelo_simples) regime = "simples";

    return {
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia || null,
      cnpj: formatarCNPJ(data.cnpj),
      cnae_principal: data.cnae_fiscal ? String(data.cnae_fiscal) : null,
      cnae_descricao: data.cnae_fiscal_descricao,
      cnaes_secundarios: data.cnaes_secundarios || [],
      natureza_juridica: data.natureza_juridica,
      porte: data.porte,
      data_abertura: data.data_inicio_atividade,
      capital_social: data.capital_social ? Number(data.capital_social) : 0,
      situacao_cadastral: (data.descricao_situacao_cadastral || data.situacao_cadastral || "").toLowerCase(),
      opcao_simples: data.opcao_pelo_simples || false,
      opcao_mei: data.opcao_pelo_mei || false,
      cep: data.cep ? formatarCEP(String(data.cep)) : null,
      logradouro: data.logradouro || data.descricao_tipo_de_logradouro
        ? `${data.descricao_tipo_de_logradouro || ""} ${data.logradouro || ""}`.trim()
        : null,
      numero: data.numero ? String(data.numero) : null,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.municipio,
      uf: data.uf,
      telefone_principal: data.ddd_telefone_1 ? formatarTelefone(String(data.ddd_telefone_1)) : null,
      email_principal: data.email,
      socios: data.qsa || [],
    };
  } catch (err: any) {
    return { erro: `Erro de conexão: ${err.message}` };
  }
}

// ============================================================================
// CONSULTA ViaCEP
// ============================================================================

export type DadosCEP = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
};

export async function consultarCEP(cep: string): Promise<DadosCEP | { erro: string }> {
  const c = (cep || "").replace(/\D/g, "");
  if (c.length !== 8) return { erro: "CEP deve ter 8 dígitos" };

  try {
    const resp = await fetch(`https://viacep.com.br/ws/${c}/json/`);
    if (!resp.ok) return { erro: "Erro ao consultar CEP" };
    const data = await resp.json();
    if (data.erro) return { erro: "CEP não encontrado" };

    return {
      cep: formatarCEP(data.cep),
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
    };
  } catch (err: any) {
    return { erro: `Erro de conexão: ${err.message}` };
  }
}

// ============================================================================
// EMPRESA - CRUD COM AUDITORIA AUTOMÁTICA
// ============================================================================

export async function carregarEmpresa(userId: string): Promise<any | null> {
  const { data } = await supabase
    .from("empresas")
    .select("*")
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
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

  await registrarAuditoria({
    empresaId: data.id,
    userId,
    tabela: "empresas",
    registroId: data.id,
    acao: "criar",
    valorDepois: payload,
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

  const payload = { ...dadosNovos, updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("empresas")
    .update(payload)
    .eq("id", empresaId)
    .eq("user_id", userId);
  if (error) return { erro: error.message };

  // Auditoria: 1 registro por campo alterado
  for (const campo of camposAlterados) {
    await registrarAuditoria({
      empresaId,
      userId,
      tabela: "empresas",
      registroId: empresaId,
      acao: "editar",
      campo,
      valorAntes: { [campo]: dadosAntes?.[campo] || null },
      valorDepois: { [campo]: dadosNovos[campo] || null },
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
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("participacao_pct", { ascending: false });
  return data || [];
}

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
    valorDepois: payload,
    descricao: `Sócio adicionado: ${dados.nome}`,
  });
  return { id: data.id };
}

export async function atualizarSocio(socioId: string, empresaId: string, userId: string, dados: any): Promise<{ erro?: string }> {
  const { error } = await supabase
    .from("empresa_socios")
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq("id", socioId)
    .eq("user_id", userId);
  if (error) return { erro: error.message };
  await registrarAuditoria({
    empresaId,
    userId,
    tabela: "empresa_socios",
    registroId: socioId,
    acao: "editar",
    valorDepois: dados,
    descricao: `Sócio atualizado: ${dados.nome}`,
  });
  return {};
}

export async function excluirSocio(socioId: string, empresaId: string, userId: string, nome: string): Promise<{ erro?: string }> {
  const { error } = await supabase
    .from("empresa_socios")
    .delete()
    .eq("id", socioId)
    .eq("user_id", userId);
  if (error) return { erro: error.message };
  await registrarAuditoria({
    empresaId,
    userId,
    tabela: "empresa_socios",
    registroId: socioId,
    acao: "excluir",
    descricao: `Sócio removido: ${nome}`,
  });
  return {};
}

// ============================================================================
// IMPORTAR SÓCIOS DO QSA (BrasilAPI)
// ============================================================================

export async function importarSociosDoQSA(empresaId: string, userId: string, qsa: any[]): Promise<number> {
  let importados = 0;
  for (const s of qsa) {
    const dados = {
      nome: s.nome_socio || s.nome,
      qualificacao: s.qualificacao_socio || s.qualificacao,
      cpf_cnpj: s.cnpj_cpf_do_socio || s.cpf_cnpj || null,
      tipo_pessoa: ((s.cnpj_cpf_do_socio || s.cpf_cnpj || "").replace(/\D/g, "").length > 11) ? "PJ" : "PF",
      data_entrada: s.data_entrada_sociedade || s.data_entrada || null,
    };
    if (!dados.nome) continue;

    const { data, error } = await supabase
      .from("empresa_socios")
      .insert({ ...dados, empresa_id: empresaId, user_id: userId, ativo: true })
      .select("id")
      .single();
    if (!error && data) {
      importados++;
      await registrarAuditoria({
        empresaId,
        userId,
        tabela: "empresa_socios",
        registroId: data.id,
        acao: "criar",
        descricao: `Sócio importado da Receita Federal: ${dados.nome}`,
      });
    }
  }
  return importados;
}

// ============================================================================
// DOCUMENTOS - CRUD + STORAGE
// ============================================================================

export async function carregarDocumentos(empresaId: string, userId: string): Promise<any[]> {
  const { data } = await supabase
    .from("empresa_documentos")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("user_id", userId)
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
    .eq("user_id", userId);
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
  await supabase.from("empresa_auditoria").insert({
    empresa_id: params.empresaId,
    user_id: params.userId,
    tabela: params.tabela,
    registro_id: params.registroId,
    acao: params.acao,
    campo: params.campo,
    valor_antes: params.valorAntes,
    valor_depois: params.valorDepois,
    descricao: params.descricao,
  });
}

export async function carregarAuditoria(empresaId: string, userId: string, limit: number = 100): Promise<any[]> {
  const { data } = await supabase
    .from("empresa_auditoria")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("user_id", userId)
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
    .eq("user_id", userId)
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
  const { error } = await supabase
    .from("empresa_obrigacoes")
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { erro: error.message };
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
  const { error } = await supabase.from("empresa_obrigacoes").delete().eq("id", id).eq("user_id", userId);
  if (error) return { erro: error.message };
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
// EQUIPE - CRUD
// ============================================================================

export async function carregarEquipe(empresaId: string, userId: string): Promise<any[]> {
  const { data } = await supabase
    .from("empresa_equipe")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function convidarMembro(empresaId: string, userId: string, dados: any): Promise<{ id?: string; erro?: string }> {
  const token = typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Date.now().toString();
  const payload = { ...dados, empresa_id: empresaId, user_id: userId, token_convite: token };
  const { data, error } = await supabase.from("empresa_equipe").insert(payload).select("id").single();
  if (error) return { erro: error.message };
  await registrarAuditoria({
    empresaId, userId,
    tabela: "empresa_equipe",
    registroId: data.id,
    acao: "criar",
    valorDepois: payload,
    descricao: `Membro convidado: ${dados.email_convidado}`,
  });
  return { id: data.id };
}

export async function excluirMembro(id: string, empresaId: string, userId: string, email: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("empresa_equipe").delete().eq("id", id).eq("user_id", userId);
  if (error) return { erro: error.message };
  await registrarAuditoria({
    empresaId, userId,
    tabela: "empresa_equipe",
    registroId: id,
    acao: "excluir",
    descricao: `Membro removido: ${email}`,
  });
  return {};
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