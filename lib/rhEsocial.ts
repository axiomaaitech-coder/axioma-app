// Admissão preparada para o eSocial (S-2200) — leiaute S-1.3 cons. NT 07/2026 rev. (gov.br/esocial), esquema XSD de 26/10/2026.
// Decisão do Elias (08/11/2026): o Axioma PREPARA o arquivo; quem assina (certificado digital) e envia ao governo é o contador.
// Sem IA: tudo determinístico e testado (scripts/check-rh-esocial.mts valida o arquivo contra o XSD oficial).
// ponytail: só admissão CLT comum (categorias 101/102/105, tpAdmissao 1, indAdmissao 1, cadIni N, sem PCD/dependentes) —
// os demais casos aparecem como pendência "ainda não suportado" em vez de gerar arquivo errado.

import type { Texto } from './rhEstrutura'

export const VERSAO_LEIAUTE = 'S-1.3 (NT 07/2026 rev.)'
const NS = 'http://www.esocial.gov.br/schema/evt/evtAdmissao/v_S_01_03_00'
const VER_PROC = 'AxiomaRH-1.0'

/** Categorias (Tabela 01) que esta versão prepara: 101 empregado geral · 102 rural por pequeno prazo · 105 contrato a termo (Lei 9.601/1998). */
export const CATEGORIAS_S2200 = ['101', '102', '105']

export type DadosS2200 = {
  empregador: { tp_insc: number; nr_insc: string } | null
  colab: { nome: string; nome_social?: string | null }
  pessoal: {
    cpf?: string | null; data_nascimento?: string | null; sexo?: string | null; raca_cor?: number | null; estado_civil?: number | null
    grau_instr?: string | null; pais_nascimento?: string | null; pais_nacionalidade?: string | null
    cep?: string | null; logradouro?: string | null; numero?: string | null; complemento?: string | null; bairro?: string | null
    uf?: string | null; cod_munic?: string | null; telefone?: string | null; email?: string | null
  } | null
  contrato: {
    matricula: string; cod_categ: string; tp_reg_trab: number; tp_reg_prev: number; data_admissao: string
    tp_contr: number; data_termino?: string | null; clau_assec?: boolean | null; obj_det?: string | null
    tp_reg_jor: number; nat_atividade: number; data_base?: number | null; cnpj_sindicato?: string | null
    qtd_hrs_sem?: number | null; tp_jornada?: number | null; tmp_parc: number; hor_noturno?: boolean | null; dsc_jorn?: string | null
    dsc_sal_var?: string | null; data_desligamento?: string | null
  }
  cargo: { nome: string; cbo: string } | null
  remuneracao: { und_sal_fixo: number; valor: number } | null
  estabelecimento: { tp_insc: number; nr_insc: string; cnpj_sindicato?: string | null } | null
}

export type Pendencia = { campo: Texto; onde: 'pessoal' | 'contrato' | 'salario' | 'cargo' | 'estrutura' | 'empregador'; motivo?: Texto }
const T = (pt: string, en: string, es: string): Texto => ({ pt, en, es })
const dig = (s: unknown) => String(s ?? '').replace(/\D/g, '')
const vazio = (s: unknown) => !String(s ?? '').trim()

/** Lista o que falta para preparar o S-2200. Vazia = pode gerar o arquivo. */
export function pendenciasS2200(d: DadosS2200): Pendencia[] {
  const p: Pendencia[] = []
  const falta = (onde: Pendencia['onde'], campo: Texto, motivo?: Texto) => p.push({ onde, campo, motivo })
  const k = d.contrato, s = d.pessoal ?? {}
  // casos que o Axioma ainda não prepara: melhor avisar do que gerar arquivo errado
  if (k.tp_reg_trab !== 1) falta('contrato', T('Regime trabalhista', 'Employment regime', 'Régimen laboral'), T('Só CLT nesta versão', 'Only CLT in this version', 'Solo CLT en esta versión'))
  if (!CATEGORIAS_S2200.includes(k.cod_categ)) falta('contrato', T('Categoria', 'Category', 'Categoría'), T('Aprendiz, doméstico, temporário, intermitente e as demais categorias chegam numa próxima etapa', 'Apprentice, domestic, temporary, intermittent and other categories come in a later step', 'Aprendiz, doméstico, temporal, intermitente y las demás categorías llegan en una próxima etapa'))
  if (k.data_desligamento) falta('contrato', T('Desligamento', 'Termination', 'Desvinculación'), T('Admissão com desligamento junto chega numa próxima etapa', 'Hire with termination comes in a later step', 'Admisión con desvinculación llega en una próxima etapa'))

  if (k.cod_categ === '102' && k.nat_atividade !== 2) falta('contrato', T('Natureza da atividade', 'Nature of the work', 'Naturaleza de la actividad'), T('Trabalhador rural (102) precisa de natureza rural', 'Rural worker (102) needs rural nature', 'Trabajador rural (102) necesita naturaleza rural'))
  if (!d.empregador) falta('empregador', T('Cadastro do Empregador', 'Employer record', 'Registro del Empleador'))
  if (vazio(d.colab.nome) || d.colab.nome.trim().length < 2) falta('pessoal', T('Nome', 'Name', 'Nombre'))
  if (dig(s.cpf).length !== 11) falta('pessoal', T('CPF', 'CPF', 'CPF'))
  if (!s.data_nascimento) falta('pessoal', T('Data de nascimento', 'Date of birth', 'Fecha de nacimiento'))
  if (s.sexo !== 'M' && s.sexo !== 'F') falta('pessoal', T('Sexo', 'Sex', 'Sexo'))
  if (!s.raca_cor) falta('pessoal', T('Raça/cor', 'Race/color', 'Raza/color'))
  else if (s.raca_cor === 6 && k.data_admissao >= '2024-04-22') falta('pessoal', T('Raça/cor', 'Race/color', 'Raza/color'), T('"Não informado" não vale para admissão desde 22/04/2024', '"Not informed" is not accepted for hires since 04/22/2024', '"No informado" no vale para admisiones desde 22/04/2024'))
  if (!/^(0[1-9]|1[0-2])$/.test(String(s.grau_instr ?? ''))) falta('pessoal', T('Grau de instrução', 'Education level', 'Grado de instrucción'))
  if (!/^\d{3}$/.test(String(s.pais_nascimento ?? ''))) falta('pessoal', T('País de nascimento', 'Country of birth', 'País de nacimiento'))
  if (!/^\d{3}$/.test(String(s.pais_nacionalidade ?? ''))) falta('pessoal', T('Nacionalidade', 'Nationality', 'Nacionalidad'))
  if (vazio(s.logradouro)) falta('pessoal', T('Endereço (rua)', 'Address (street)', 'Dirección (calle)'))
  if (vazio(s.numero)) falta('pessoal', T('Número (use S/N se não houver)', 'Number (use S/N if none)', 'Número (use S/N si no hay)'))
  if (dig(s.cep).length !== 8) falta('pessoal', T('CEP', 'ZIP code (CEP)', 'Código postal (CEP)'))
  if (!/^\d{7}$/.test(String(s.cod_munic ?? ''))) falta('pessoal', T('Município (código IBGE — vem sozinho ao buscar o CEP)', 'City (IBGE code — filled in when you look up the CEP)', 'Municipio (código IBGE — se completa al buscar el CEP)'))
  if (!/^[A-Z]{2}$/.test(String(s.uf ?? ''))) falta('pessoal', T('UF', 'State (UF)', 'Estado (UF)'))

  if (!d.cargo) falta('contrato', T('Cargo', 'Job title', 'Cargo'))
  else if (!/^\d{6}$/.test(d.cargo.cbo)) falta('cargo', T('Ocupação na CBO do cargo', 'CBO occupation of the job title', 'Ocupación en la CBO del cargo'))
  if (!d.estabelecimento) falta('contrato', T('Filial / estabelecimento onde a pessoa trabalha', 'Branch where the person works', 'Sucursal donde trabaja la persona'))
  else if (!/^([A-Z0-9]{12}\d{2}|\d{12})$/.test(String(d.estabelecimento.nr_insc).toUpperCase())) falta('estrutura', T('CNPJ completo (14 dígitos) da filial', 'Full branch CNPJ (14 digits)', 'CNPJ completo (14 dígitos) de la sucursal'))
  const sind = k.cnpj_sindicato || d.estabelecimento?.cnpj_sindicato
  if (dig(sind).length !== 14) falta('estrutura', T('CNPJ do sindicato da categoria (na filial ou no contrato)', 'Union CNPJ (on the branch or the contract)', 'CNPJ del sindicato de la categoría (en la sucursal o en el contrato)'))
  if (!d.remuneracao) falta('salario', T('Salário', 'Salary', 'Salario'))
  else if ([6, 7].includes(d.remuneracao.und_sal_fixo) && vazio(k.dsc_sal_var)) falta('contrato', T('Como o salário variável é calculado', 'How the variable pay is calculated', 'Cómo se calcula el salario variable'))
  if (k.tp_contr !== 1 && k.clau_assec == null) falta('contrato', T('Cláusula de rescisão antecipada (sim/não)', 'Early termination clause (yes/no)', 'Cláusula de rescisión anticipada (sí/no)'))
  if (k.tp_contr === 3 && vazio(k.obj_det)) falta('contrato', T('Objeto do contrato (obra, serviço, safra)', 'Contract purpose (project, service, harvest)', 'Objeto del contrato (obra, servicio, cosecha)'))
  if (k.tp_reg_jor === 1 || k.qtd_hrs_sem != null || !vazio(k.dsc_jorn)) {
    if (!(Number(k.qtd_hrs_sem) > 0)) falta('contrato', T('Horas por semana', 'Hours per week', 'Horas por semana'))
    if (Number(k.qtd_hrs_sem) > 99.99) falta('contrato', T('Horas por semana', 'Hours per week', 'Horas por semana'), T('Máximo 99,99', 'Maximum 99.99', 'Máximo 99,99'))
    if (!k.tp_jornada) falta('contrato', T('Tipo de jornada', 'Work schedule type', 'Tipo de jornada'))
    if (k.hor_noturno == null) falta('contrato', T('Trabalha à noite? (sim/não)', 'Night work? (yes/no)', '¿Trabaja de noche? (sí/no)'))
    if (vazio(k.dsc_jorn)) falta('contrato', T('Horário (dias, entrada, saída e intervalo)', 'Schedule (days, start, end and break)', 'Horario (días, entrada, salida e intervalo)'))
    if (k.tp_jornada === 2 && k.tmp_parc !== 0 && k.data_admissao >= '2026-11-23') falta('contrato', T('Tempo parcial', 'Part-time', 'Tiempo parcial'), T('Jornada 12x36 não pode ser tempo parcial', '12x36 schedule cannot be part-time', 'Jornada 12x36 no puede ser tiempo parcial'))
  }
  return p
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const tag = (n: string, v: unknown) => (v === null || v === undefined || v === '' ? '' : `<${n}>${esc(String(v))}</${n}>`)
const grupo = (n: string, ...filhos: string[]) => (filhos.join('') ? `<${n}>${filhos.join('')}</${n}>` : '')
const corta = (s: unknown, max: number) => String(s ?? '').trim().slice(0, max)
const num2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2)

/** Inscrição do empregador como o eSocial quer em ideEmpregador: CNPJ = raiz (8); CPF = 11. */
export function inscricaoEmpregador(e: { tp_insc: number; nr_insc: string }): string {
  const n = String(e.nr_insc).toUpperCase().replace(/[^A-Z0-9]/g, '')
  return e.tp_insc === 1 ? n.slice(0, 8) : n
}

/** Id do evento: "ID" + tipo + inscrição com 14 posições (completa com zeros à direita) + AAAAMMDDHHMMSS + sequência de 5. */
export function idEvento(e: { tp_insc: number; nr_insc: string }, agora: Date, seq: number): string {
  const p = (n: number, t = 2) => String(n).padStart(t, '0')
  const quando = `${agora.getUTCFullYear()}${p(agora.getUTCMonth() + 1)}${p(agora.getUTCDate())}${p(agora.getUTCHours())}${p(agora.getUTCMinutes())}${p(agora.getUTCSeconds())}`
  return `ID${e.tp_insc}${inscricaoEmpregador(e).padEnd(14, '0')}${quando}${p(seq % 100000, 5)}`
}

/** Monta o XML do S-2200 (sem assinatura — o contador assina com o certificado dele). Lança erro se houver pendência. */
export function gerarS2200(d: DadosS2200, opc: { agora: Date; seq: number; tpAmb: 1 | 2 }): { id: string; xml: string } {
  const pend = pendenciasS2200(d)
  if (pend.length) throw new Error(`S-2200 com ${pend.length} pendência(s): ${pend.map((x) => x.campo.pt).join(', ')}`)
  const e = d.empregador!, s = d.pessoal!, k = d.contrato, est = d.estabelecimento!
  const id = idEvento(e, opc.agora, opc.seq)
  const sind = dig(k.cnpj_sindicato || est.cnpj_sindicato)
  const temHorario = k.tp_reg_jor === 1 || k.qtd_hrs_sem != null || !vazio(k.dsc_jorn)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>`
    + `<eSocial xmlns="${NS}"><evtAdmissao Id="${id}">`
    + grupo('ideEvento', tag('indRetif', 1), tag('tpAmb', opc.tpAmb), tag('procEmi', 1), tag('verProc', VER_PROC))
    + grupo('ideEmpregador', tag('tpInsc', e.tp_insc), tag('nrInsc', inscricaoEmpregador(e)))
    + grupo('trabalhador',
        tag('cpfTrab', dig(s.cpf)), tag('nmTrab', corta(d.colab.nome, 70)), tag('sexo', s.sexo), tag('racaCor', s.raca_cor),
        tag('estCiv', s.estado_civil ?? ''), tag('grauInstr', s.grau_instr), tag('nmSoc', d.colab.nome_social ? corta(d.colab.nome_social, 70) : ''),
        grupo('nascimento', tag('dtNascto', s.data_nascimento), tag('paisNascto', s.pais_nascimento), tag('paisNac', s.pais_nacionalidade)),
        grupo('endereco', grupo('brasil', tag('dscLograd', corta(s.logradouro, 100)), tag('nrLograd', corta(s.numero, 10)),
          tag('complemento', corta(s.complemento, 30)), tag('bairro', corta(s.bairro, 90)), tag('cep', dig(s.cep)), tag('codMunic', s.cod_munic), tag('uf', s.uf))),
        grupo('contato', tag('fonePrinc', dig(s.telefone).length >= 10 ? dig(s.telefone).slice(0, 13) : ''), tag('emailPrinc', s.email && s.email.length <= 60 ? s.email : '')))
    + grupo('vinculo',
        tag('matricula', corta(k.matricula, 30)), tag('tpRegTrab', k.tp_reg_trab), tag('tpRegPrev', k.tp_reg_prev), tag('cadIni', 'N'),
        grupo('infoRegimeTrab', grupo('infoCeletista',
          tag('dtAdm', k.data_admissao), tag('tpAdmissao', 1), tag('indAdmissao', 1), tag('tpRegJor', k.tp_reg_jor), tag('natAtividade', k.nat_atividade),
          tag('dtBase', k.data_base ?? ''), tag('cnpjSindCategProf', sind))),
        grupo('infoContrato',
          tag('nmCargo', corta(d.cargo!.nome, 100)), tag('CBOCargo', d.cargo!.cbo), tag('codCateg', k.cod_categ),
          grupo('remuneracao', tag('vrSalFx', num2(d.remuneracao!.und_sal_fixo === 7 ? 0 : d.remuneracao!.valor)), tag('undSalFixo', d.remuneracao!.und_sal_fixo),
            tag('dscSalVar', [6, 7].includes(d.remuneracao!.und_sal_fixo) ? corta(k.dsc_sal_var, 999) : '')),
          grupo('duracao', tag('tpContr', k.tp_contr), tag('dtTerm', k.tp_contr === 2 ? k.data_termino : ''),
            tag('clauAssec', k.tp_contr !== 1 ? (k.clau_assec ? 'S' : 'N') : ''), tag('objDet', k.tp_contr === 3 ? corta(k.obj_det, 255) : '')),
          grupo('localTrabalho', grupo('localTrabGeral', tag('tpInsc', est.tp_insc), tag('nrInsc', String(est.nr_insc).toUpperCase())))
          + (temHorario ? grupo('horContratual', tag('qtdHrsSem', k.qtd_hrs_sem != null ? num2(Number(k.qtd_hrs_sem)) : ''), tag('tpJornada', k.tp_jornada),
              tag('tmpParc', k.tmp_parc), tag('horNoturno', k.hor_noturno ? 'S' : 'N'), tag('dscJorn', corta(k.dsc_jorn, 999))) : '')))
    + `</evtAdmissao></eSocial>`
  return { id, xml }
}
