// Admissão preparada para o eSocial (S-2200) — leiaute S-1.3 cons. NT 07/2026 rev. (gov.br/esocial), esquema XSD de 26/10/2026.
// Decisão do Elias (08/11/2026): o Axioma PREPARA o arquivo; quem assina (certificado digital) e envia ao governo é o contador.
// Sem IA: tudo determinístico e testado (scripts/check-rh-esocial.mts valida o arquivo contra o XSD oficial).
// Cobre todas as categorias de empregado em vigor (101, 102, 103, 104, 105, 106, 111), PCD, dependentes e imigrante.
// ponytail: admissão comum (tpAdmissao 1, indAdmissao 1, cadIni N); transferência, sucessão, mudança de CPF, afastamento
// e cessão na admissão, e o regime estatutário (servidor público), aparecem como pendência em vez de gerar arquivo errado.

import type { Texto } from './rhEstrutura'

export const VERSAO_LEIAUTE = 'S-1.3 (NT 07/2026 rev.)'
const VER_PROC = 'AxiomaRH-1.1'

/** Categorias de empregado (Tabela 01) em vigor. 107/108 (Verde e Amarelo) foram encerradas pelo governo em 31/12/2022. */
export const CATEGORIAS_S2200 = ['101', '102', '103', '104', '105', '106', '111']
/** Tabela 07 — tipos de dependente encerrados em 25/04/2023 (não valem para admissão depois disso). */
const DEP_ENCERRADOS = ['04', '07']

export type Dependente = { tp_dep?: string | null; nome: string; data_nascimento: string; cpf?: string | null; dep_irrf: boolean; dep_sf: boolean; inc_trab: boolean; descr_dep?: string | null }
export type Pcd = { def_fisica: boolean; def_visual: boolean; def_auditiva: boolean; def_mental: boolean; def_intelectual: boolean; reab_readap: boolean; info_cota?: boolean | null; observacao?: string | null }

export type DadosS2200 = {
  empregador: { tp_insc: number; nr_insc: string } | null
  colab: { nome: string; nome_social?: string | null }
  pessoal: {
    cpf?: string | null; data_nascimento?: string | null; sexo?: string | null; raca_cor?: number | null; estado_civil?: number | null
    grau_instr?: string | null; pais_nascimento?: string | null; pais_nacionalidade?: string | null
    cep?: string | null; logradouro?: string | null; numero?: string | null; complemento?: string | null; bairro?: string | null
    uf?: string | null; cod_munic?: string | null; telefone?: string | null; email?: string | null
    imig_tmp_resid?: number | null; imig_cond_ing?: number | null
  } | null
  pcd?: Pcd | null
  dependentes?: Dependente[]
  contrato: {
    matricula: string; cod_categ: string; tp_reg_trab: number; tp_reg_prev: number; data_admissao: string
    tp_contr: number; data_termino?: string | null; clau_assec?: boolean | null; obj_det?: string | null
    tp_reg_jor: number; nat_atividade: number; data_base?: number | null; cnpj_sindicato?: string | null
    qtd_hrs_sem?: number | null; tp_jornada?: number | null; tmp_parc: number; hor_noturno?: boolean | null; dsc_jorn?: string | null
    dsc_sal_var?: string | null; data_desligamento?: string | null
    apr_ind?: number | null; apr_cnpj_ent_qual?: string | null; apr_tp_insc?: number | null; apr_nr_insc?: string | null; apr_cnpj_prat?: string | null
    temp_hip_leg?: number | null; temp_just_contr?: string | null; temp_tomador_tp_insc?: number | null; temp_tomador_nr_insc?: string | null; temp_cpf_substituidos?: string[] | null
    lt_cep?: string | null; lt_logradouro?: string | null; lt_numero?: string | null; lt_complemento?: string | null; lt_bairro?: string | null; lt_cod_munic?: string | null; lt_uf?: string | null
  }
  cargo: { nome: string; cbo: string } | null
  remuneracao: { und_sal_fixo: number; valor: number } | null
  estabelecimento: { tp_insc: number; nr_insc: string; cnpj_sindicato?: string | null } | null
}

export type Pendencia = { campo: Texto; onde: 'pessoal' | 'contrato' | 'salario' | 'cargo' | 'estrutura' | 'empregador' | 'pcd' | 'dependentes'; motivo?: Texto }
const T = (pt: string, en: string, es: string): Texto => ({ pt, en, es })
const dig = (s: unknown) => String(s ?? '').replace(/\D/g, '')
const alnum = (s: unknown) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const vazio = (s: unknown) => !String(s ?? '').trim()
const temDeficiencia = (x?: Pcd | null) => !!x && (x.def_fisica || x.def_visual || x.def_auditiva || x.def_mental || x.def_intelectual || x.reab_readap)

/** Lista o que falta para preparar o S-2200. Vazia = pode gerar o arquivo. */
export function pendenciasS2200(d: DadosS2200): Pendencia[] {
  const p: Pendencia[] = []
  const falta = (onde: Pendencia['onde'], campo: Texto, motivo?: Texto) => p.push({ onde, campo, motivo })
  const k = d.contrato, s = d.pessoal ?? {}
  const cat = k.cod_categ, adm = k.data_admissao
  const domestico = cat === '104', temporario = cat === '106', aprendiz = cat === '103', intermitente = cat === '111'
  // casos que o Axioma não prepara: melhor avisar do que gerar arquivo errado
  if (k.tp_reg_trab !== 1) falta('contrato', T('Regime trabalhista', 'Employment regime', 'Régimen laboral'), T('Servidor público (estatutário) não é preparado pelo Axioma', 'Public servants (statutory) are not prepared by Axioma', 'Servidor público (estatutario) no lo prepara Axioma'))
  if (!CATEGORIAS_S2200.includes(cat)) falta('contrato', T('Categoria', 'Category', 'Categoría'), T('Categoria encerrada pelo governo ou que não é de empregado (use o evento próprio)', 'Category closed by the government or not an employee category (use its own event)', 'Categoría cerrada por el gobierno o que no es de empleado (use el evento propio)'))
  if (k.data_desligamento) falta('contrato', T('Desligamento', 'Termination', 'Desvinculación'), T('Admissão com desligamento junto chega numa próxima etapa', 'Hire with termination comes in a later step', 'Admisión con desvinculación llega en una próxima etapa'))

  // empregador
  if (!d.empregador) falta('empregador', T('Cadastro do Empregador', 'Employer record', 'Registro del Empleador'))
  else if (domestico && d.empregador.tp_insc !== 2) falta('empregador', T('Empregador doméstico', 'Domestic employer', 'Empleador doméstico'), T('No doméstico o empregador é a pessoa física (CPF), não a empresa', 'For domestic work the employer is the individual (CPF), not the company', 'En el doméstico el empleador es la persona física (CPF), no la empresa'))
  if (domestico && k.nat_atividade !== 1) falta('contrato', T('Natureza da atividade', 'Nature of the work', 'Naturaleza de la actividad'), T('Doméstico (104) é sempre urbano', 'Domestic (104) is always urban', 'Doméstico (104) es siempre urbano'))
  if (cat === '102' && k.nat_atividade !== 2) falta('contrato', T('Natureza da atividade', 'Nature of the work', 'Naturaleza de la actividad'), T('Trabalhador rural (102) precisa de natureza rural', 'Rural worker (102) needs rural nature', 'Trabajador rural (102) necesita naturaleza rural'))
  if (domestico && k.tp_reg_prev !== 1) falta('contrato', T('Regime previdenciário', 'Pension regime', 'Régimen previsional'), T('Doméstico é sempre do INSS (RGPS)', 'Domestic is always INSS (RGPS)', 'Doméstico es siempre del INSS (RGPS)'))

  // pessoa
  if (vazio(d.colab.nome) || d.colab.nome.trim().length < 2) falta('pessoal', T('Nome', 'Name', 'Nombre'))
  if (dig(s.cpf).length !== 11) falta('pessoal', T('CPF', 'CPF', 'CPF'))
  if (!s.data_nascimento) falta('pessoal', T('Data de nascimento', 'Date of birth', 'Fecha de nacimiento'))
  if (s.sexo !== 'M' && s.sexo !== 'F') falta('pessoal', T('Sexo', 'Sex', 'Sexo'))
  if (!s.raca_cor) falta('pessoal', T('Raça/cor', 'Race/color', 'Raza/color'))
  else if (s.raca_cor === 6 && adm >= '2024-04-22') falta('pessoal', T('Raça/cor', 'Race/color', 'Raza/color'), T('"Não informado" não vale para admissão desde 22/04/2024', '"Not informed" is not accepted for hires since 04/22/2024', '"No informado" no vale para admisiones desde 22/04/2024'))
  if (!/^(0[1-9]|1[0-2])$/.test(String(s.grau_instr ?? ''))) falta('pessoal', T('Grau de instrução', 'Education level', 'Grado de instrucción'))
  if (!/^\d{3}$/.test(String(s.pais_nascimento ?? ''))) falta('pessoal', T('País de nascimento', 'Country of birth', 'País de nacimiento'))
  if (!/^\d{3}$/.test(String(s.pais_nacionalidade ?? ''))) falta('pessoal', T('Nacionalidade', 'Nationality', 'Nacionalidad'))
  if (s.pais_nacionalidade && s.pais_nacionalidade !== '105') {
    if (!s.imig_cond_ing) falta('pessoal', T('Estrangeiro: condição de ingresso', 'Foreigner: entry condition', 'Extranjero: condición de ingreso'))
    if (!s.imig_tmp_resid && adm >= '2021-07-19') falta('pessoal', T('Estrangeiro: tempo de residência', 'Foreigner: residence term', 'Extranjero: tiempo de residencia'))
  }
  if (vazio(s.logradouro)) falta('pessoal', T('Endereço (rua)', 'Address (street)', 'Dirección (calle)'))
  if (vazio(s.numero)) falta('pessoal', T('Número (use S/N se não houver)', 'Number (use S/N if none)', 'Número (use S/N si no hay)'))
  if (dig(s.cep).length !== 8) falta('pessoal', T('CEP', 'ZIP code (CEP)', 'Código postal (CEP)'))
  if (!/^\d{7}$/.test(String(s.cod_munic ?? ''))) falta('pessoal', T('Município (código IBGE — vem sozinho ao buscar o CEP)', 'City (IBGE code — filled in when you look up the CEP)', 'Municipio (código IBGE — se completa al buscar el CEP)'))
  if (!/^[A-Z]{2}$/.test(String(s.uf ?? ''))) falta('pessoal', T('UF', 'State (UF)', 'Estado (UF)'))

  // PCD
  if (d.pcd && temDeficiencia(d.pcd) && adm < '2026-10-26' && d.pcd.info_cota == null) falta('pcd', T('PCD: conta na cota de pessoas com deficiência? (sim/não)', 'PwD: counts toward the disability quota? (yes/no)', 'PcD: ¿cuenta en la cuota de personas con discapacidad? (sí/no)'), T('O eSocial pede para admissão antes de 26/10/2026', 'eSocial asks for hires before 10/26/2026', 'eSocial lo pide para admisiones antes del 26/10/2026'))

  // dependentes
  const deps = d.dependentes ?? []
  if (deps.length > 99) falta('dependentes', T('Dependentes', 'Dependents', 'Dependientes'), T('Máximo de 99', 'Maximum 99', 'Máximo 99'))
  const cpfs = new Set<string>()
  deps.forEach((x) => {
    const quem = x.nome || '?'
    if (vazio(x.nome) || x.nome.trim().length < 2) falta('dependentes', T('Dependente: nome', 'Dependent: name', 'Dependiente: nombre'))
    if (!x.data_nascimento) falta('dependentes', T(`Dependente ${quem}: data de nascimento`, `Dependent ${quem}: date of birth`, `Dependiente ${quem}: fecha de nacimiento`))
    if (x.dep_irrf && (dig(x.cpf).length !== 11 || !x.tp_dep)) falta('dependentes', T(`Dependente ${quem}: CPF e tipo (deduz no IR)`, `Dependent ${quem}: CPF and type (income tax)`, `Dependiente ${quem}: CPF y tipo (deduce en IR)`))
    if (x.tp_dep === '99' && vazio(x.descr_dep)) falta('dependentes', T(`Dependente ${quem}: descrição (tipo "Outros")`, `Dependent ${quem}: description ("Other" type)`, `Dependiente ${quem}: descripción (tipo "Otros")`))
    if (x.tp_dep && DEP_ENCERRADOS.includes(x.tp_dep) && adm > '2023-04-25') falta('dependentes', T(`Dependente ${quem}: tipo`, `Dependent ${quem}: type`, `Dependiente ${quem}: tipo`), T('Esse tipo foi encerrado pelo eSocial em 25/04/2023 — use "Filho(a) ou enteado(a)" ou o tipo atual', 'This type was closed by eSocial on 04/25/2023 — use the current type', 'Este tipo fue cerrado por eSocial el 25/04/2023 — use el tipo actual'))
    const c = dig(x.cpf)
    if (c) { if (cpfs.has(c)) falta('dependentes', T(`Dependente ${quem}: CPF repetido`, `Dependent ${quem}: repeated CPF`, `Dependiente ${quem}: CPF repetido`)); cpfs.add(c) }
  })

  // cargo, local, sindicato, salário
  if (!d.cargo) falta('contrato', T('Cargo', 'Job title', 'Cargo'))
  else if (!/^\d{6}$/.test(d.cargo.cbo)) falta('cargo', T('Ocupação na CBO do cargo', 'CBO occupation of the job title', 'Ocupación en la CBO del cargo'))
  if (!domestico) {
    if (!d.estabelecimento) falta('contrato', T('Filial / estabelecimento onde a pessoa trabalha', 'Branch where the person works', 'Sucursal donde trabaja la persona'))
    else if (!/^([A-Z0-9]{12}\d{2}|\d{12})$/.test(alnum(d.estabelecimento.nr_insc))) falta('estrutura', T('CNPJ completo (14 dígitos) da filial', 'Full branch CNPJ (14 digits)', 'CNPJ completo (14 dígitos) de la sucursal'))
  }
  if (domestico || temporario) {
    if (vazio(k.lt_logradouro) || vazio(k.lt_numero) || dig(k.lt_cep).length !== 8 || !/^\d{7}$/.test(String(k.lt_cod_munic ?? '')) || !/^[A-Z]{2}$/.test(String(k.lt_uf ?? '')))
      falta('contrato', T('Endereço do local de trabalho (rua, número, CEP, município e UF)', 'Workplace address (street, number, CEP, city and state)', 'Dirección del lugar de trabajo (calle, número, CEP, municipio y estado)'), domestico ? T('No doméstico: a casa onde a pessoa trabalha', 'Domestic: the home where the person works', 'Doméstico: la casa donde trabaja la persona') : T('No temporário: onde a pessoa vai trabalhar (cliente)', 'Temporary: where the person will work (client)', 'Temporal: donde la persona va a trabajar (cliente)'))
  }
  const sind = k.cnpj_sindicato || (!domestico ? d.estabelecimento?.cnpj_sindicato : null)
  if (dig(sind).length !== 14) falta(domestico ? 'contrato' : 'estrutura', T('CNPJ do sindicato da categoria', 'Union CNPJ', 'CNPJ del sindicato de la categoría'), domestico ? T('No doméstico, informe no contrato', 'For domestic work, enter it on the contract', 'En el doméstico, infórmelo en el contrato') : T('Na filial ou no contrato', 'On the branch or the contract', 'En la sucursal o en el contrato'))
  if (!d.remuneracao) falta('salario', T('Salário', 'Salary', 'Salario'))
  else if ([6, 7].includes(d.remuneracao.und_sal_fixo) && vazio(k.dsc_sal_var)) falta('contrato', T('Como o salário variável é calculado', 'How the variable pay is calculated', 'Cómo se calcula el salario variable'))

  // duração
  if (aprendiz && adm >= '2024-04-22' && k.tp_contr !== 2) falta('contrato', T('Tipo de contrato', 'Contract type', 'Tipo de contrato'), T('Aprendiz é sempre prazo determinado (com data de término)', 'Apprentices are always fixed term (with an end date)', 'Aprendiz es siempre plazo determinado (con fecha de término)'))
  if (k.tp_contr !== 1 && k.clau_assec == null) falta('contrato', T('Cláusula de rescisão antecipada (sim/não)', 'Early termination clause (yes/no)', 'Cláusula de rescisión anticipada (sí/no)'))
  if (k.tp_contr === 3 && vazio(k.obj_det)) falta('contrato', T('Objeto do contrato (obra, serviço, safra)', 'Contract purpose (project, service, harvest)', 'Objeto del contrato (obra, servicio, cosecha)'))

  // aprendiz
  if (aprendiz && adm >= '2024-01-22') {
    if (!k.apr_ind) falta('contrato', T('Aprendiz: contratação direta ou indireta', 'Apprentice: direct or indirect hiring', 'Aprendiz: contratación directa o indirecta'))
    else if (k.apr_ind === 1 && dig(k.apr_cnpj_ent_qual).length !== 14) falta('contrato', T('Aprendiz: CNPJ da entidade qualificadora (curso)', 'Apprentice: training entity CNPJ', 'Aprendiz: CNPJ de la entidad calificadora (curso)'))
    else if (k.apr_ind === 2 && (!k.apr_tp_insc || !dig(k.apr_nr_insc))) falta('contrato', T('Aprendiz: CNPJ/CPF do estabelecimento que cumpre a cota', 'Apprentice: CNPJ/CPF of the establishment fulfilling the quota', 'Aprendiz: CNPJ/CPF del establecimiento que cumple la cuota'))
    else if (k.apr_ind === 2 && k.apr_tp_insc === 1 && d.empregador?.tp_insc === 1 && dig(k.apr_nr_insc).slice(0, 8) === alnum(d.empregador.nr_insc).slice(0, 8)) falta('contrato', T('Aprendiz: estabelecimento da cota', 'Apprentice: quota establishment', 'Aprendiz: establecimiento de la cuota'), T('Na contratação indireta, a raiz do CNPJ tem de ser de outra empresa', 'In indirect hiring the CNPJ root must belong to another company', 'En la contratación indirecta, la raíz del CNPJ debe ser de otra empresa'))
  }

  // temporário
  if (temporario) {
    if (!k.temp_hip_leg) falta('contrato', T('Temporário: motivo legal (substituição ou demanda complementar)', 'Temporary: legal reason (replacement or extra demand)', 'Temporal: motivo legal (sustitución o demanda complementaria)'))
    if (vazio(k.temp_just_contr)) falta('contrato', T('Temporário: justificativa do fato que motiva a contratação', 'Temporary: justification of the hiring', 'Temporal: justificación de la contratación'))
    if (!k.temp_tomador_tp_insc || !dig(k.temp_tomador_nr_insc)) falta('contrato', T('Temporário: CNPJ/CPF do cliente (tomador)', 'Temporary: client CNPJ/CPF', 'Temporal: CNPJ/CPF del cliente (tomador)'))
    else if (k.temp_tomador_tp_insc === 1 && d.empregador?.tp_insc === 1 && dig(k.temp_tomador_nr_insc).slice(0, 8) === alnum(d.empregador.nr_insc).slice(0, 8)) falta('contrato', T('Temporário: CNPJ do cliente', 'Temporary: client CNPJ', 'Temporal: CNPJ del cliente'), T('O cliente tem de ser outra empresa (raiz do CNPJ diferente)', 'The client must be another company (different CNPJ root)', 'El cliente debe ser otra empresa (raíz de CNPJ distinta)'))
    if (k.temp_hip_leg === 1 && !(k.temp_cpf_substituidos ?? []).length) falta('contrato', T('Temporário: CPF de quem está sendo substituído', 'Temporary: CPF of the person being replaced', 'Temporal: CPF de quien está siendo sustituido'))
  }

  // jornada
  if (k.tp_reg_jor === 1 || k.qtd_hrs_sem != null || !vazio(k.dsc_jorn)) {
    if (!intermitente && !(Number(k.qtd_hrs_sem) > 0)) falta('contrato', T('Horas por semana', 'Hours per week', 'Horas por semana'))
    if (Number(k.qtd_hrs_sem) > 99.99) falta('contrato', T('Horas por semana', 'Hours per week', 'Horas por semana'), T('Máximo 99,99', 'Maximum 99.99', 'Máximo 99,99'))
    if (adm >= '2026-11-23' && k.qtd_hrs_sem != null) {
      const teto = ({ 1: 25, 2: 30, 3: 26 } as Record<number, number>)[k.tmp_parc]
      if (teto && Number(k.qtd_hrs_sem) > teto) falta('contrato', T('Horas por semana', 'Hours per week', 'Horas por semana'), T(`Tempo parcial: no máximo ${teto} horas`, `Part-time: at most ${teto} hours`, `Tiempo parcial: como máximo ${teto} horas`))
    }
    if (!k.tp_jornada) falta('contrato', T('Tipo de jornada', 'Work schedule type', 'Tipo de jornada'))
    if (!intermitente && k.hor_noturno == null) falta('contrato', T('Trabalha à noite? (sim/não)', 'Night work? (yes/no)', '¿Trabaja de noche? (sí/no)'))
    if (vazio(k.dsc_jorn)) falta('contrato', T('Horário (dias, entrada, saída e intervalo)', 'Schedule (days, start, end and break)', 'Horario (días, entrada, salida e intervalo)'), intermitente ? T('No intermitente, descreva como é feita a convocação', 'For intermittent work, describe how calls are made', 'En el intermitente, describa cómo es la convocatoria') : undefined)
    if (k.tp_jornada === 2 && k.tmp_parc !== 0 && adm >= '2026-11-23') falta('contrato', T('Tempo parcial', 'Part-time', 'Tiempo parcial'), T('Jornada 12x36 não pode ser tempo parcial', '12x36 schedule cannot be part-time', 'Jornada 12x36 no puede ser tiempo parcial'))
  }
  return p
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const tag = (n: string, v: unknown) => (v === null || v === undefined || v === '' ? '' : `<${n}>${esc(String(v))}</${n}>`)
const grupo = (n: string, ...filhos: string[]) => (filhos.join('') ? `<${n}>${filhos.join('')}</${n}>` : '')
const corta = (s: unknown, max: number) => String(s ?? '').trim().slice(0, max)
const num2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2)
const sn = (b: unknown) => (b ? 'S' : 'N')

/** Inscrição do empregador como o eSocial quer em ideEmpregador: CNPJ = raiz (8); CPF = 11. */
export function inscricaoEmpregador(e: { tp_insc: number; nr_insc: string }): string {
  const n = alnum(e.nr_insc)
  return e.tp_insc === 1 ? n.slice(0, 8) : n
}

/** Id do evento: "ID" + tipo + inscrição com 14 posições (completa com zeros à direita) + AAAAMMDDHHMMSS + sequência de 5. */
export function idEvento(e: { tp_insc: number; nr_insc: string }, agora: Date, seq: number): string {
  const p = (n: number, t = 2) => String(n).padStart(t, '0')
  const quando = `${agora.getUTCFullYear()}${p(agora.getUTCMonth() + 1)}${p(agora.getUTCDate())}${p(agora.getUTCHours())}${p(agora.getUTCMinutes())}${p(agora.getUTCSeconds())}`
  return `ID${e.tp_insc}${inscricaoEmpregador(e).padEnd(14, '0')}${quando}${p(seq % 100000, 5)}`
}

const endereco = (x: { logradouro?: string | null; numero?: string | null; complemento?: string | null; bairro?: string | null; cep?: string | null; cod_munic?: string | null; uf?: string | null }) =>
  tag('dscLograd', corta(x.logradouro, 100)) + tag('nrLograd', corta(x.numero, 10)) + tag('complemento', corta(x.complemento, 30))
  + tag('bairro', corta(x.bairro, 90)) + tag('cep', dig(x.cep)) + tag('codMunic', x.cod_munic) + tag('uf', x.uf)

// ---------- partes do XML usadas pelos três eventos (S-2200, S-2205, S-2206) ----------
const ns = (ev: string) => `http://www.esocial.gov.br/schema/evt/${ev}/v_S_01_03_00`
const ideEvento = (tpAmb: 1 | 2) => grupo('ideEvento', tag('indRetif', 1), tag('tpAmb', tpAmb), tag('procEmi', 1), tag('verProc', VER_PROC))
const ideEmpregador = (e: { tp_insc: number; nr_insc: string }) => grupo('ideEmpregador', tag('tpInsc', e.tp_insc), tag('nrInsc', inscricaoEmpregador(e)))

/** Dados pessoais: no S-2200 vão CPF e nascimento; no S-2205 só o que pode mudar (paisNac solto, sem CPF/nascimento). */
function xmlDadosTrab(d: DadosS2200, dtRef: string, modo: '2200' | '2205'): string {
  const s = d.pessoal!
  // S-2200: só quem tem deficiência; S-2205: se há registro de PCD (mesmo tudo "N", para tirar a marcação anterior)
  const pcd = modo === '2200' ? (temDeficiencia(d.pcd) ? d.pcd! : null) : d.pcd ?? null
  const cota = pcd && dtRef < '2026-10-26' ? sn(pcd.info_cota && temDeficiencia(pcd)) : ''
  return (modo === '2200' ? tag('cpfTrab', dig(s.cpf)) : '')
    + tag('nmTrab', corta(d.colab.nome, 70)) + tag('sexo', s.sexo) + tag('racaCor', s.raca_cor)
    + tag('estCiv', s.estado_civil ?? '') + tag('grauInstr', s.grau_instr) + tag('nmSoc', d.colab.nome_social ? corta(d.colab.nome_social, 70) : '')
    + (modo === '2200' ? grupo('nascimento', tag('dtNascto', s.data_nascimento), tag('paisNascto', s.pais_nascimento), tag('paisNac', s.pais_nacionalidade)) : tag('paisNac', s.pais_nacionalidade))
    + grupo('endereco', grupo('brasil', endereco(s)))
    + (s.pais_nacionalidade !== '105' ? grupo('trabImig', tag('tmpResid', s.imig_tmp_resid ?? ''), tag('condIng', s.imig_cond_ing)) : '')
    + (pcd ? grupo('infoDeficiencia', tag('defFisica', sn(pcd.def_fisica)), tag('defVisual', sn(pcd.def_visual)), tag('defAuditiva', sn(pcd.def_auditiva)),
        tag('defMental', sn(pcd.def_mental)), tag('defIntelectual', sn(pcd.def_intelectual)), tag('reabReadap', sn(pcd.reab_readap)),
        tag('infoCota', cota), tag('observacao', pcd.observacao && temDeficiencia(pcd) ? corta(pcd.observacao, 255) : '')) : '')
    + (d.dependentes ?? []).map((x) => grupo('dependente', tag('tpDep', x.tp_dep ?? ''), tag('nmDep', corta(x.nome, 70)), tag('dtNascto', x.data_nascimento),
        tag('cpfDep', dig(x.cpf)), tag('depIRRF', sn(x.dep_irrf)), tag('depSF', sn(x.dep_sf)), tag('incTrab', sn(x.inc_trab)),
        tag('descrDep', x.tp_dep === '99' ? corta(x.descr_dep, 100) : ''))).join('')
    + grupo('contato', tag('fonePrinc', dig(s.telefone).length >= 10 ? dig(s.telefone).slice(0, 13) : ''), tag('emailPrinc', s.email && s.email.length <= 60 ? s.email : ''))
}

/** infoContrato: no S-2206 a duração não leva cláusula assecuratória. */
function xmlInfoContrato(d: DadosS2200, modo: '2200' | '2206'): string {
  const k = d.contrato, est = d.estabelecimento, cat = k.cod_categ
  const domestico = cat === '104', temporario = cat === '106', intermitente = cat === '111'
  const temHorario = k.tp_reg_jor === 1 || k.qtd_hrs_sem != null || !vazio(k.dsc_jorn)
  const lt = { logradouro: k.lt_logradouro, numero: k.lt_numero, complemento: k.lt_complemento, bairro: k.lt_bairro, cep: k.lt_cep, cod_munic: k.lt_cod_munic, uf: k.lt_uf }
  return grupo('infoContrato',
    tag('nmCargo', corta(d.cargo!.nome, 100)), tag('CBOCargo', d.cargo!.cbo), tag('codCateg', cat),
    grupo('remuneracao', tag('vrSalFx', num2(d.remuneracao!.und_sal_fixo === 7 ? 0 : d.remuneracao!.valor)), tag('undSalFixo', d.remuneracao!.und_sal_fixo),
      tag('dscSalVar', [6, 7].includes(d.remuneracao!.und_sal_fixo) ? corta(k.dsc_sal_var, 999) : '')),
    grupo('duracao', tag('tpContr', k.tp_contr), tag('dtTerm', k.tp_contr === 2 ? k.data_termino : ''),
      modo === '2200' ? tag('clauAssec', k.tp_contr !== 1 ? sn(k.clau_assec) : '') : '', tag('objDet', k.tp_contr === 3 ? corta(k.obj_det, 255) : '')),
    grupo('localTrabalho',
      !domestico && est ? grupo('localTrabGeral', tag('tpInsc', est.tp_insc), tag('nrInsc', alnum(est.nr_insc))) : '',
      domestico || temporario ? grupo('localTempDom', endereco(lt)) : ''),
    temHorario ? grupo('horContratual', tag('qtdHrsSem', k.qtd_hrs_sem != null && !intermitente ? num2(Number(k.qtd_hrs_sem)) : ''), tag('tpJornada', k.tp_jornada),
      tag('tmpParc', k.tmp_parc), tag('horNoturno', !intermitente ? sn(k.hor_noturno) : ''), tag('dscJorn', corta(k.dsc_jorn, 999))) : '')
}

const aprendXml = (k: DadosS2200['contrato']) => k.cod_categ === '103' && k.apr_ind ? grupo('aprend', tag('indAprend', k.apr_ind),
  tag('cnpjEntQual', k.apr_ind === 1 ? dig(k.apr_cnpj_ent_qual) : ''), tag('tpInsc', k.apr_ind === 2 ? k.apr_tp_insc : ''),
  tag('nrInsc', k.apr_ind === 2 ? dig(k.apr_nr_insc) : ''), tag('cnpjPrat', dig(k.apr_cnpj_prat))) : ''
const sindicato = (d: DadosS2200) => dig(d.contrato.cnpj_sindicato || (d.contrato.cod_categ !== '104' ? d.estabelecimento?.cnpj_sindicato : ''))

/** Monta o XML do S-2200 (sem assinatura — o contador assina com o certificado dele). Lança erro se houver pendência. */
export function gerarS2200(d: DadosS2200, opc: { agora: Date; seq: number; tpAmb: 1 | 2 }): { id: string; xml: string } {
  const pend = pendenciasS2200(d)
  if (pend.length) throw new Error(`S-2200 com ${pend.length} pendência(s): ${pend.map((x) => x.campo.pt).join(', ')}`)
  const e = d.empregador!, k = d.contrato
  const id = idEvento(e, opc.agora, opc.seq)
  const temp = k.cod_categ === '106' ? grupo('trabTemporario', tag('hipLeg', k.temp_hip_leg), tag('justContr', corta(k.temp_just_contr, 999)),
    grupo('ideEstabVinc', tag('tpInsc', k.temp_tomador_tp_insc), tag('nrInsc', dig(k.temp_tomador_nr_insc))),
    k.temp_hip_leg === 1 ? (k.temp_cpf_substituidos ?? []).slice(0, 9).map((c) => grupo('ideTrabSubstituido', tag('cpfTrabSubst', dig(c)))).join('') : '') : ''
  const xml = `<?xml version="1.0" encoding="UTF-8"?><eSocial xmlns="${ns('evtAdmissao')}"><evtAdmissao Id="${id}">`
    + ideEvento(opc.tpAmb) + ideEmpregador(e)
    + `<trabalhador>${xmlDadosTrab(d, k.data_admissao, '2200')}</trabalhador>`
    + grupo('vinculo',
        tag('matricula', corta(k.matricula, 30)), tag('tpRegTrab', k.tp_reg_trab), tag('tpRegPrev', k.tp_reg_prev), tag('cadIni', 'N'),
        grupo('infoRegimeTrab', grupo('infoCeletista',
          tag('dtAdm', k.data_admissao), tag('tpAdmissao', 1), tag('indAdmissao', 1), tag('tpRegJor', k.tp_reg_jor), tag('natAtividade', k.nat_atividade),
          tag('dtBase', k.data_base ?? ''), tag('cnpjSindCategProf', sindicato(d)), temp, aprendXml(k))),
        xmlInfoContrato(d, '2200'))
    + `</evtAdmissao></eSocial>`
  return { id, xml }
}

// ---------- S-2205 (alteração de dados pessoais) e S-2206 (alteração de contrato) ----------
const DIA = 86400000
/** Data da alteração: não antes da admissão e no máximo 180 dias à frente de hoje (regra do leiaute). */
function pendenciasData(d: DadosS2200, dt: string, hoje: string): Pendencia[] {
  const p: Pendencia[] = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dt)) p.push({ onde: 'contrato', campo: T('Data da alteração', 'Change date', 'Fecha del cambio') })
  else if (dt < d.contrato.data_admissao) p.push({ onde: 'contrato', campo: T('Data da alteração', 'Change date', 'Fecha del cambio'), motivo: T('Não pode ser antes da admissão', 'Cannot be before the hire date', 'No puede ser antes de la admisión') })
  else if (new Date(dt + 'T12:00:00Z').getTime() - new Date(hoje + 'T12:00:00Z').getTime() > 180 * DIA) p.push({ onde: 'contrato', campo: T('Data da alteração', 'Change date', 'Fecha del cambio'), motivo: T('No máximo 180 dias à frente de hoje', 'At most 180 days from today', 'Como máximo 180 días desde hoy') })
  if (d.contrato.data_desligamento) p.push({ onde: 'contrato', campo: T('Desligamento', 'Termination', 'Desvinculación'), motivo: T('Pessoa desligada: não cabe alteração', 'Person terminated: no change applies', 'Persona desvinculada: no cabe alteración') })
  return p
}
const PESSOAIS: Pendencia['onde'][] = ['pessoal', 'pcd', 'dependentes']

/** O que falta para o S-2205: os dados pessoais e de dependentes/PCD, com as regras de data valendo na data da alteração. */
export function pendenciasS2205(d: DadosS2200, dtAlteracao: string, hoje: string): Pendencia[] {
  const naData = { ...d, contrato: { ...d.contrato, data_admissao: dtAlteracao } }
  const pessoais = pendenciasS2200(naData).filter((x) => PESSOAIS.includes(x.onde) && !/^(CPF|Data de nascimento|País de nascimento)/.test(x.campo.pt))
  return [...pendenciasData(d, dtAlteracao, hoje), ...(d.empregador ? [] : [{ onde: 'empregador' as const, campo: T('Cadastro do Empregador', 'Employer record', 'Registro del Empleador') }]), ...pessoais]
}
export function gerarS2205(d: DadosS2200, opc: { agora: Date; seq: number; tpAmb: 1 | 2; dtAlteracao: string; hoje: string }): { id: string; xml: string } {
  const pend = pendenciasS2205(d, opc.dtAlteracao, opc.hoje)
  if (pend.length) throw new Error(`S-2205 com ${pend.length} pendência(s): ${pend.map((x) => x.campo.pt).join(', ')}`)
  const e = d.empregador!, id = idEvento(e, opc.agora, opc.seq)
  const xml = `<?xml version="1.0" encoding="UTF-8"?><eSocial xmlns="${ns('evtAltCadastral')}"><evtAltCadastral Id="${id}">`
    + ideEvento(opc.tpAmb) + ideEmpregador(e) + grupo('ideTrabalhador', tag('cpfTrab', dig(d.pessoal!.cpf)))
    + grupo('alteracao', tag('dtAlteracao', opc.dtAlteracao), `<dadosTrabalhador>${xmlDadosTrab(d, opc.dtAlteracao, '2205')}</dadosTrabalhador>`)
    + `</evtAltCadastral></eSocial>`
  return { id, xml }
}

export type OpcS2206 = { dtAlteracao: string; dtEf?: string | null; dscAlt?: string | null; justProrr?: string | null }
/** O que falta para o S-2206: contrato, cargo, salário, local, sindicato e jornada — e a data da alteração. */
export function pendenciasS2206(d: DadosS2200, o: OpcS2206, hoje: string): Pendencia[] {
  const contrato = pendenciasS2200(d).filter((x) => !PESSOAIS.includes(x.onde) || /^(CPF)/.test(x.campo.pt))
  const p = [...pendenciasData(d, o.dtAlteracao, hoje), ...contrato.filter((x) => !/^Desligamento/.test(x.campo.pt))]
  if (o.dtEf && o.dtEf < d.contrato.data_admissao) p.push({ onde: 'contrato', campo: T('Data dos efeitos no salário', 'Pay effective date', 'Fecha de efectos en el salario'), motivo: T('Não pode ser antes da admissão', 'Cannot be before the hire date', 'No puede ser antes de la admisión') })
  return p
}
export function gerarS2206(d: DadosS2200, opc: { agora: Date; seq: number; tpAmb: 1 | 2; hoje: string } & OpcS2206): { id: string; xml: string } {
  const pend = pendenciasS2206(d, opc, opc.hoje)
  if (pend.length) throw new Error(`S-2206 com ${pend.length} pendência(s): ${pend.map((x) => x.campo.pt).join(', ')}`)
  const e = d.empregador!, k = d.contrato, id = idEvento(e, opc.agora, opc.seq)
  const temp = k.cod_categ === '106' && !vazio(opc.justProrr) ? grupo('trabTemporario', tag('justProrr', corta(opc.justProrr, 999))) : ''
  const xml = `<?xml version="1.0" encoding="UTF-8"?><eSocial xmlns="${ns('evtAltContratual')}"><evtAltContratual Id="${id}">`
    + ideEvento(opc.tpAmb) + ideEmpregador(e) + grupo('ideVinculo', tag('cpfTrab', dig(d.pessoal!.cpf)), tag('matricula', corta(k.matricula, 30)))
    + grupo('altContratual', tag('dtAlteracao', opc.dtAlteracao), tag('dtEf', opc.dtEf ?? ''), tag('dscAlt', opc.dscAlt ? corta(opc.dscAlt, 150) : ''),
        grupo('vinculo', tag('tpRegPrev', k.tp_reg_prev),
          grupo('infoRegimeTrab', grupo('infoCeletista', tag('tpRegJor', k.tp_reg_jor), tag('natAtividade', k.nat_atividade), tag('dtBase', k.data_base ?? ''),
            tag('cnpjSindCategProf', sindicato(d)), temp, aprendXml(k))),
          xmlInfoContrato(d, '2206')))
    + `</evtAltContratual></eSocial>`
  return { id, xml }
}

// ---------- S-1010 (verbas da empresa) e S-2299 (desligamento) ----------
export type Rubrica = { cod_rubr: string; ide_tab_rubr: string; ini_valid: string; dsc_rubr: string; nat_rubr: string; tp_rubr: number; cod_inc_cp: string; cod_inc_irrf: string; cod_inc_fgts: string; observacao?: string | null }

/** S-1010: inclusão de uma verba na tabela de rubricas do eSocial (precisa ir antes do S-2299 que a usa). */
export function gerarS1010(e: { tp_insc: number; nr_insc: string }, r: Rubrica, opc: { agora: Date; seq: number; tpAmb: 1 | 2 }): { id: string; xml: string } {
  const id = idEvento(e, opc.agora, opc.seq)
  const xml = `<?xml version="1.0" encoding="UTF-8"?><eSocial xmlns="${ns('evtTabRubrica')}"><evtTabRubrica Id="${id}">`
    + grupo('ideEvento', tag('tpAmb', opc.tpAmb), tag('procEmi', 1), tag('verProc', VER_PROC)) + ideEmpregador(e)
    + grupo('infoRubrica', grupo('inclusao',
        grupo('ideRubrica', tag('codRubr', r.cod_rubr), tag('ideTabRubr', r.ide_tab_rubr), tag('iniValid', r.ini_valid)),
        grupo('dadosRubrica', tag('dscRubr', corta(r.dsc_rubr, 100)), tag('natRubr', r.nat_rubr), tag('tpRubr', r.tp_rubr),
          tag('codIncCP', r.cod_inc_cp), tag('codIncIRRF', r.cod_inc_irrf), tag('codIncFGTS', r.cod_inc_fgts), tag('observacao', r.observacao ? corta(r.observacao, 255) : ''))))
    + `</evtTabRubrica></eSocial>`
  return { id, xml }
}

/** Verba do cálculo → código da verba padrão do Axioma (INSS e IR têm uma para o mês e outra para o 13º). */
export function codRubrica(v: { nat: string; cp: string | null; ir: string | null }): string {
  if (v.nat === '9201') return v.cp === '13' ? 'AX9201D' : 'AX9201M'
  if (v.nat === '9203') return v.ir === '13' ? 'AX9203D' : 'AX9203M'
  return `AX${v.nat}`
}

export type DadosS2299 = {
  empregador: { tp_insc: number; nr_insc: string; class_trib?: string | null } | null
  cpf?: string | null; matricula: string; tpRegPrev: number
  mtvDeslig: string; dtDeslig: string; dtAvPrv?: string | null
  avisoIndenizadoDias: number; projecao: string
  estabelecimento: { tp_insc: number; nr_insc: string } | null
  codLotacao?: string | null
  verbas: { nat: string; nome: string; qtd?: number; valor: number; cp: string | null; ir: string | null }[]
  rubricasExistentes: string[]   // códigos AX… já cadastrados na empresa (S-1010)
}
/** O que falta para o S-2299 (desligamento com as verbas da rescisão). */
export function pendenciasS2299(d: DadosS2299, hoje: string): Pendencia[] {
  const p: Pendencia[] = []
  const falta = (onde: Pendencia['onde'], campo: Texto, motivo?: Texto) => p.push({ onde, campo, motivo })
  if (!d.empregador) falta('empregador', T('Cadastro do Empregador', 'Employer record', 'Registro del Empleador'))
  else if (d.empregador.class_trib === '03') falta('empregador', T('Simples com contribuição não substituída (classificação 03)', 'Simples with non-substituted contribution (class 03)', 'Simples con contribución no sustituida (clase 03)'), T('Informe ao contador: o indicador do Simples no desligamento é dele', 'Tell the accountant: the Simples indicator is theirs', 'Avise al contador: el indicador del Simples es suyo'))
  if (dig(d.cpf).length !== 11) falta('pessoal', T('CPF', 'CPF', 'CPF'))
  if (!d.estabelecimento || !/^([A-Z0-9]{12}\d{2}|\d{12})$/.test(alnum(d.estabelecimento.nr_insc))) falta('contrato', T('Filial com CNPJ completo', 'Branch with full CNPJ', 'Sucursal con CNPJ completo'))
  if (vazio(d.codLotacao)) falta('contrato', T('Lotação tributária (RH · Estrutura → Lotações)', 'Tax unit (HR · Structure → Tax units)', 'Lotación tributaria (RR. HH. · Estructura → Lotaciones)'))
  if (new Date(d.dtDeslig + 'T12:00:00Z').getTime() - new Date(hoje + 'T12:00:00Z').getTime() > 10 * DIA) falta('contrato', T('Data do desligamento', 'Termination date', 'Fecha de desvinculación'), T('No máximo 10 dias à frente de hoje', 'At most 10 days from today', 'Como máximo 10 días desde hoy'))
  const faltam = [...new Set(d.verbas.filter((v) => v.valor > 0).map((v) => codRubrica(v)))].filter((c) => !d.rubricasExistentes.includes(c))
  if (faltam.length) falta('estrutura', T(`Verbas da empresa (S-1010): ${faltam.join(', ')}`, `Company pay items (S-1010): ${faltam.join(', ')}`, `Rubricas de la empresa (S-1010): ${faltam.join(', ')}`), T('Cadastre as verbas padrão do Axioma', 'Register the Axioma default pay items', 'Registre las rubricas estándar de Axioma'))
  if (!d.verbas.some((v) => v.valor > 0)) falta('salario', T('Verbas da rescisão', 'Termination pay items', 'Rubricas de la rescisión'), T('O eSocial exige pelo menos uma verba', 'eSocial requires at least one item', 'eSocial exige al menos una rubrica'))
  return p
}
export function gerarS2299(d: DadosS2299, opc: { agora: Date; seq: number; tpAmb: 1 | 2; hoje: string }): { id: string; xml: string } {
  const pend = pendenciasS2299(d, opc.hoje)
  if (pend.length) throw new Error(`S-2299 com ${pend.length} pendência(s): ${pend.map((x) => x.campo.pt).join(', ')}`)
  const e = d.empregador!, est = d.estabelecimento!, id = idEvento(e, opc.agora, opc.seq)
  const api = d.avisoIndenizadoDias > 0
  const det = d.verbas.filter((v) => v.valor > 0).map((v) => grupo('detVerbas', tag('codRubr', codRubrica(v)), tag('ideTabRubr', 'AXIOMA'),
    tag('qtdRubr', v.qtd && v.qtd > 0 ? v.qtd : ''), tag('vrRubr', num2(v.valor)), tag('indApurIR', 0))).join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><eSocial xmlns="${ns('evtDeslig')}"><evtDeslig Id="${id}">`
    + ideEvento(opc.tpAmb) + ideEmpregador(e) + grupo('ideVinculo', tag('cpfTrab', dig(d.cpf)), tag('matricula', corta(d.matricula, 30)))
    + grupo('infoDeslig', tag('mtvDeslig', d.mtvDeslig), tag('dtDeslig', d.dtDeslig), tag('dtAvPrv', d.dtAvPrv ?? ''),
        tag('indPagtoAPI', api ? 'S' : 'N'), tag('dtProjFimAPI', api ? d.projecao : ''), tag('pensAlim', 0),
        grupo('verbasResc', grupo('dmDev', tag('ideDmDev', `RESC${d.dtDeslig.replace(/-/g, '')}`),
          grupo('infoPerApur', grupo('ideEstabLot', tag('tpInsc', est.tp_insc), tag('nrInsc', alnum(est.nr_insc)), tag('codLotacao', corta(d.codLotacao, 30)),
            det, d.tpRegPrev === 1 ? grupo('infoAgNocivo', tag('grauExp', 1)) : '')))))
    + `</evtDeslig></eSocial>`
  return { id, xml }
}
