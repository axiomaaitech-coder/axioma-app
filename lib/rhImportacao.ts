// RH · Importação de colaboradores por planilha (Fase 1, subfase 8). Regras puras: lê as linhas, reconhece as colunas
// (mesmo com nomes diferentes), confere cada linha com as MESMAS regras do banco (RH-7) e monta o que vai para
// rh_importar_colaboradores. Nada é gravado aqui. Testado em scripts/check-rh-importacao.mts.
import { validarCPF } from './enderecoHelpers'
import { lerValorBR } from './valorBR'

export type Lang = 'pt' | 'en' | 'es'
type Texto = { pt: string; en: string; es: string }
const T = (pt: string, en: string, es: string): Texto => ({ pt, en, es })

export type Coluna = { chave: string; titulo: string; apelidos: string[]; obrigatoria?: boolean; exemplo: string; ajuda: Texto }
export const COLUNAS: Coluna[] = [
  { chave: 'nome', titulo: 'Nome completo', apelidos: ['nome', 'nome completo', 'colaborador', 'funcionario', 'empregado'], obrigatoria: true, exemplo: 'Maria da Silva (EXEMPLO)', ajuda: T('Mínimo 2 letras', 'At least 2 letters', 'Mínimo 2 letras') },
  { chave: 'nome_social', titulo: 'Nome social', apelidos: ['nome social'], exemplo: '', ajuda: T('Opcional', 'Optional', 'Opcional') },
  { chave: 'matricula', titulo: 'Matrícula', apelidos: ['matricula', 'registro', 'codigo', 'id'], obrigatoria: true, exemplo: 'M0001', ajuda: T('Única na Empresa', 'Unique in the company', 'Única en la empresa') },
  { chave: 'cpf', titulo: 'CPF', apelidos: ['cpf'], exemplo: '529.982.247-25', ajuda: T('Com ou sem pontos; dígito conferido', 'With or without dots; check digit verified', 'Con o sin puntos; dígito verificado') },
  { chave: 'data_nascimento', titulo: 'Data de nascimento', apelidos: ['data de nascimento', 'nascimento', 'data nascimento'], exemplo: '10/05/1990', ajuda: T('DD/MM/AAAA', 'DD/MM/YYYY', 'DD/MM/AAAA') },
  { chave: 'sexo', titulo: 'Sexo', apelidos: ['sexo'], exemplo: 'F', ajuda: T('F ou M (exigido pelo eSocial)', 'F or M (required by eSocial)', 'F o M (exigido por eSocial)') },
  { chave: 'categoria', titulo: 'Categoria eSocial', apelidos: ['categoria', 'categoria esocial', 'cod categoria'], exemplo: '101', ajuda: T('Código da Tabela 01 (101 = empregado; 103 = aprendiz; 901 = estagiário). Vazio = 101', 'Table 01 code (101 = employee; 103 = apprentice; 901 = intern). Empty = 101', 'Código Tabla 01 (101 = empleado; 103 = aprendiz; 901 = pasante). Vacío = 101') },
  { chave: 'data_admissao', titulo: 'Data de admissão', apelidos: ['data de admissao', 'admissao', 'data admissao', 'inicio'], obrigatoria: true, exemplo: '03/11/2026', ajuda: T('DD/MM/AAAA', 'DD/MM/YYYY', 'DD/MM/AAAA') },
  { chave: 'tipo_contrato', titulo: 'Tipo de contrato', apelidos: ['tipo de contrato', 'contrato', 'tipo contrato'], exemplo: 'experiência', ajuda: T('indeterminado, determinado ou experiência. Vazio = indeterminado', 'open-ended, fixed or probation. Empty = open-ended', 'indeterminado, determinado o experiencia. Vacío = indeterminado') },
  { chave: 'data_termino', titulo: 'Data de término', apelidos: ['data de termino', 'termino', 'fim do contrato'], exemplo: '31/01/2027', ajuda: T('Obrigatória em determinado/experiência (experiência: até 90 dias)', 'Required for fixed/probation (probation: up to 90 days)', 'Obligatoria en determinado/experiencia (experiencia: hasta 90 días)') },
  { chave: 'horas_semana', titulo: 'Horas por semana', apelidos: ['horas por semana', 'horas semanais', 'jornada', 'carga horaria'], exemplo: '44', ajuda: T('Obrigatório (exceto intermitente 111)', 'Required (except intermittent 111)', 'Obligatorio (excepto intermitente 111)') },
  { chave: 'cargo', titulo: 'Cargo', apelidos: ['cargo', 'funcao'], exemplo: 'Vendedor', ajuda: T('Nome igual ao cadastrado em RH · Estrutura', 'Name as registered in HR · Structure', 'Nombre igual al de RR. HH. · Estructura') },
  { chave: 'departamento', titulo: 'Departamento', apelidos: ['departamento', 'setor', 'area'], exemplo: 'Comercial', ajuda: T('Nome igual ao cadastrado em RH · Estrutura', 'Name as registered in HR · Structure', 'Nombre igual al de RR. HH. · Estructura') },
  { chave: 'salario', titulo: 'Salário mensal (R$)', apelidos: ['salario', 'salario mensal', 'salario base', 'remuneracao'], exemplo: '2.500,00', ajuda: T('Só entra para quem tem liberação de salário', 'Only imported if you have salary access', 'Solo entra si tiene acceso a salario') },
  { chave: 'situacao', titulo: 'Situação', apelidos: ['situacao', 'status'], exemplo: 'ativo', ajuda: T('ativo, pré-admissão, afastado ou desligado. Vazio = ativo', 'active, pre-hire, on leave or terminated. Empty = active', 'activo, pre-admisión, apartado o desvinculado. Vacío = activo') },
  { chave: 'data_desligamento', titulo: 'Data de desligamento', apelidos: ['data de desligamento', 'desligamento', 'demissao'], exemplo: '', ajuda: T('Só para desligados', 'Only for terminated', 'Solo para desvinculados') },
  { chave: 'telefone', titulo: 'Telefone', apelidos: ['telefone', 'celular', 'fone'], exemplo: '(11) 98765-4321', ajuda: T('Opcional', 'Optional', 'Opcional') },
  { chave: 'email', titulo: 'E-mail', apelidos: ['email', 'e-mail'], exemplo: 'maria@exemplo.com', ajuda: T('Opcional', 'Optional', 'Opcional') },
  { chave: 'cep', titulo: 'CEP', apelidos: ['cep'], exemplo: '01310-100', ajuda: T('Opcional', 'Optional', 'Opcional') },
  { chave: 'logradouro', titulo: 'Endereço', apelidos: ['endereco', 'logradouro', 'rua'], exemplo: 'Avenida Paulista', ajuda: T('Opcional', 'Optional', 'Opcional') },
  { chave: 'numero', titulo: 'Número', apelidos: ['numero', 'n'], exemplo: '1000', ajuda: T('Opcional', 'Optional', 'Opcional') },
  { chave: 'bairro', titulo: 'Bairro', apelidos: ['bairro'], exemplo: 'Bela Vista', ajuda: T('Opcional', 'Optional', 'Opcional') },
  { chave: 'cidade', titulo: 'Cidade', apelidos: ['cidade', 'municipio'], exemplo: 'São Paulo', ajuda: T('Opcional', 'Optional', 'Opcional') },
  { chave: 'uf', titulo: 'UF', apelidos: ['uf', 'estado'], exemplo: 'SP', ajuda: T('Sigla com 2 letras', '2-letter code', 'Sigla de 2 letras') },
  { chave: 'ja_enviado_esocial', titulo: 'Já enviado ao eSocial pelo contador', apelidos: ['ja enviado ao esocial', 'enviado esocial', 'esocial'], exemplo: 'sim', ajuda: T('sim = o contador já fez a admissão no eSocial (o Axioma não envia de novo)', 'yes = the accountant already filed the hiring in eSocial (Axioma will not resend)', 'sí = el contador ya hizo la admisión en eSocial (Axioma no reenvía)') },
]

const sem = (t: unknown) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const dig = (v: unknown) => String(v ?? '').replace(/\D/g, '')
// Nome comparável (sem acento, maiúscula ou pontuação): liga "Logística" da planilha a "logistica" do cadastro.
export const chaveNome = sem

// Cabeçalho da planilha → chave. Nome desconhecido fica de fora (e aparece no aviso).
export function mapearCabecalho(cab: unknown[]): { mapa: (string | null)[]; desconhecidas: string[]; faltando: string[] } {
  const mapa = cab.map((h) => { const n = sem(h); return COLUNAS.find((c) => sem(c.titulo) === n || c.apelidos.some((a) => sem(a) === n))?.chave ?? null })
  const achadas = new Set(mapa.filter(Boolean))
  return { mapa, desconhecidas: cab.filter((h, i) => !mapa[i] && String(h ?? '').trim()).map(String), faltando: COLUNAS.filter((c) => c.obrigatoria && !achadas.has(c.chave)).map((c) => c.titulo) }
}

// Data: DD/MM/AAAA, AAAA-MM-DD ou número de série do Excel. Inválida = null.
export function lerData(v: unknown): string | null {
  if (v == null || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) { const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000); return d.toISOString().slice(0, 10) }
  const s = String(v).trim()
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  const iso = m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : (m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)) ? `${m[1]}-${m[2]}-${m[3]}` : null
  if (!iso) return null
  const d = new Date(iso + 'T12:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : null
}
const somaDias = (iso: string, n: number) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10)

export type Contexto = {
  hoje: string; cargos: Map<string, string>; deps: Map<string, string>; categorias: Set<string>
  matriculas: Set<string>; cpfs: Set<string>; podePessoais: boolean; podeSalario: boolean
}
export type LinhaPronta = { colaborador: Record<string, unknown>; contrato: Record<string, unknown>; pessoal: Record<string, unknown> | null; remuneracao: Record<string, unknown> | null }
export type Resultado = { linha: number; nome: string; erros: Texto[]; avisos: Texto[]; pronta: LinhaPronta | null }

const SITUACAO: Record<string, string> = { ativo: 'ativo', active: 'ativo', activo: 'ativo', 'pre admissao': 'pre_admissao', 'pre hire': 'pre_admissao', afastado: 'afastado', 'on leave': 'afastado', desligado: 'desligado', terminated: 'desligado', demitido: 'desligado', desvinculado: 'desligado' }
const CONTRATO: Record<string, 'indeterminado' | 'determinado' | 'experiencia'> = { indeterminado: 'indeterminado', 'prazo indeterminado': 'indeterminado', 'open ended': 'indeterminado', determinado: 'determinado', 'prazo determinado': 'determinado', fixed: 'determinado', experiencia: 'experiencia', 'contrato de experiencia': 'experiencia', probation: 'experiencia' }

// Confere todas as linhas (mesmas regras do banco) e marca repetidos dentro da própria planilha.
export function validarLinhas(linhas: Record<string, unknown>[], ctx: Contexto, primeiraLinha = 2): Resultado[] {
  const vistasMat = new Set<string>(), vistosCpf = new Set<string>()
  return linhas.map((r, idx) => {
    const erros: Texto[] = [], avisos: Texto[] = []
    const txt = (k: string) => String(r[k] ?? '').trim()
    const nome = txt('nome')
    if (nome.length < 2 || nome.length > 70) erros.push(T('Nome com 2 a 70 letras', 'Name with 2 to 70 letters', 'Nombre de 2 a 70 letras'))
    const matricula = txt('matricula')
    if (!matricula || matricula.length > 30 || /^esocial/i.test(matricula)) erros.push(T('Matrícula ausente ou inválida', 'Missing or invalid employee ID', 'Matrícula ausente o inválida'))
    else if (ctx.matriculas.has(matricula.toLowerCase()) || vistasMat.has(matricula.toLowerCase())) erros.push(T(`Matrícula ${matricula} repetida`, `Employee ID ${matricula} repeated`, `Matrícula ${matricula} repetida`))
    vistasMat.add(matricula.toLowerCase())
    const categoria = txt('categoria') || '101'
    if (!ctx.categorias.has(categoria)) erros.push(T(`Categoria ${categoria} não existe na Tabela 01`, `Category ${categoria} is not in Table 01`, `Categoría ${categoria} no existe en la Tabla 01`))
    const admissao = lerData(r.data_admissao)
    if (!admissao) erros.push(T('Data de admissão inválida (use DD/MM/AAAA)', 'Invalid hire date (use DD/MM/YYYY)', 'Fecha de admisión inválida (use DD/MM/AAAA)'))
    const tipo = txt('tipo_contrato') ? CONTRATO[sem(r.tipo_contrato)] : 'indeterminado'
    if (!tipo) erros.push(T('Tipo de contrato: indeterminado, determinado ou experiência', 'Contract type: open-ended, fixed or probation', 'Tipo de contrato: indeterminado, determinado o experiencia'))
    const termino = lerData(r.data_termino)
    if (tipo && tipo !== 'indeterminado' && !termino) erros.push(T('Data de término obrigatória neste tipo de contrato', 'End date required for this contract type', 'Fecha de término obligatoria en este tipo de contrato'))
    if (tipo === 'experiencia' && admissao && termino && termino > somaDias(admissao, 89)) erros.push(T('Experiência passa de 90 dias (CLT art. 445)', 'Probation exceeds 90 days (CLT art. 445)', 'Experiencia supera 90 días (CLT art. 445)'))
    if (admissao && termino && termino < admissao) erros.push(T('Término antes da admissão', 'End before hire date', 'Término antes de la admisión'))
    if (categoria === '103' && admissao && admissao >= '2024-04-22' && tipo === 'indeterminado') erros.push(T('Aprendiz é sempre prazo determinado', 'Apprentice is always fixed term', 'Aprendiz siempre es plazo determinado'))
    const horas = txt('horas_semana') ? lerValorBR(txt('horas_semana')) : NaN
    if (categoria !== '111' && !(horas > 0)) erros.push(T('Horas por semana obrigatórias', 'Weekly hours required', 'Horas por semana obligatorias'))
    const situacao = txt('situacao') ? SITUACAO[sem(r.situacao)] : 'ativo'
    if (!situacao) erros.push(T('Situação: ativo, pré-admissão, afastado ou desligado', 'Status: active, pre-hire, on leave or terminated', 'Situación: activo, pre-admisión, apartado o desvinculado'))
    const deslig = lerData(r.data_desligamento)
    if (situacao === 'desligado' && !deslig) erros.push(T('Desligado precisa da data de desligamento', 'Terminated needs the termination date', 'Desvinculado necesita la fecha'))
    const cargo = txt('cargo'), dep = txt('departamento')
    const cargoId = cargo ? ctx.cargos.get(sem(cargo)) ?? null : null
    const depId = dep ? ctx.deps.get(sem(dep)) ?? null : null
    if (cargo && !cargoId) avisos.push(T(`Cargo "${cargo}" não cadastrado: entra sem cargo`, `Job title "${cargo}" not registered: imported without it`, `Cargo "${cargo}" no registrado: entra sin cargo`))
    if (dep && !depId) avisos.push(T(`Departamento "${dep}" não cadastrado: entra sem departamento`, `Department "${dep}" not registered: imported without it`, `Departamento "${dep}" no registrado: entra sin departamento`))
    // dados pessoais
    // Excel guarda CPF/CEP digitado como número e some o zero da frente (012… vira 12…): volta o zero pelo tamanho certo
    const cpf = typeof r.cpf === 'number' ? String(Math.round(r.cpf)).padStart(11, '0') : dig(r.cpf)
    let pessoal: Record<string, unknown> | null = null
    if (cpf || txt('data_nascimento')) {
      if (!ctx.podePessoais) avisos.push(T('Sem liberação de dados pessoais: CPF e endereço ficam de fora', 'No personal-data access: CPF and address left out', 'Sin acceso a datos personales: CPF y dirección quedan fuera'))
      else {
        const nasc = lerData(r.data_nascimento)
        if (!validarCPF(cpf)) erros.push(T('CPF inválido', 'Invalid CPF', 'CPF inválido'))
        else if (ctx.cpfs.has(cpf) || vistosCpf.has(cpf)) erros.push(T('CPF repetido', 'Repeated CPF', 'CPF repetido'))
        if (!nasc || nasc > ctx.hoje) erros.push(T('Data de nascimento inválida', 'Invalid birth date', 'Fecha de nacimiento inválida'))
        const sexo = txt('sexo').toUpperCase()
        if (sexo && !['F', 'M'].includes(sexo)) erros.push(T('Sexo: F ou M', 'Sex: F or M', 'Sexo: F o M'))
        const uf = txt('uf').toUpperCase()
        if (uf && !/^[A-Z]{2}$/.test(uf)) erros.push(T('UF com 2 letras', 'State with 2 letters', 'Estado con 2 letras'))
        const email = txt('email').toLowerCase()
        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erros.push(T('E-mail inválido', 'Invalid e-mail', 'Correo inválido'))
        const cep = typeof r.cep === 'number' ? String(Math.round(r.cep)).padStart(8, '0') : dig(r.cep)
        if (cep && cep.length !== 8) erros.push(T('CEP com 8 números', 'Postal code with 8 digits', 'CEP con 8 números'))
        pessoal = { cpf, data_nascimento: nasc, sexo: sexo || null, uf: uf || null, email: email || null, cep: cep || null, telefone: txt('telefone') || null,
          logradouro: txt('logradouro') || null, numero: txt('numero') || null, bairro: txt('bairro') || null, cidade: txt('cidade') || null }
      }
    }
    vistosCpf.add(cpf)
    // salário
    let remuneracao: Record<string, unknown> | null = null
    if (txt('salario')) {
      if (!ctx.podeSalario) avisos.push(T('Sem liberação de salário: o salário fica de fora', 'No salary access: salary left out', 'Sin acceso a salario: el salario queda fuera'))
      else { const v = lerValorBR(txt('salario')); if (!(v > 0)) erros.push(T('Salário inválido (use 2.500,00)', 'Invalid salary (use 2,500.00)', 'Salario inválido (use 2.500,00)')); else remuneracao = { valor: Math.round(v * 100) / 100 } }
    }
    const enviado = ['sim', 's', 'yes', 'si', 'x', '1'].includes(sem(r.ja_enviado_esocial))
    const pronta: LinhaPronta | null = erros.length ? null : {
      colaborador: { nome, nome_social: txt('nome_social') || null, situacao },
      contrato: { matricula, cod_categ: categoria, data_admissao: admissao, tp_contr: tipo === 'indeterminado' ? 1 : 2, data_termino: tipo === 'indeterminado' ? null : termino,
        experiencia: tipo === 'experiencia', qtd_hrs_sem: categoria === '111' && !(horas > 0) ? null : horas, cargo_id: cargoId, departamento_id: depId,
        data_desligamento: situacao === 'desligado' ? deslig : null, situacao_esocial: enviado ? 'enviado_pelo_contador' : 'rascunho' },
      pessoal, remuneracao,
    }
    return { linha: primeiraLinha + idx, nome: nome || '—', erros, avisos, pronta }
  })
}

// ─── Planilha completa (Excel): o caminho de volta. Mesmas colunas do modelo de importação, para o RH trabalhar no
// Excel e reaproveitar o arquivo. CPF/endereço só com liberação de dados pessoais; salário só com liberação de salário. ───
const dataBR = (iso: unknown) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '')
const TIPO_TXT = (k: Record<string, unknown>) => (Number(k.tp_contr) === 1 ? 'indeterminado' : k.experiencia ? 'experiência' : 'determinado')
const SIT_TXT: Record<string, string> = { ativo: 'ativo', pre_admissao: 'pré-admissão', afastado: 'afastado', desligado: 'desligado' }
export function linhaPlanilha(
  c: Record<string, unknown>, k: Record<string, unknown> | undefined, p: Record<string, unknown> | undefined, salario: number | null,
  nomes: { cargos: Map<string, string>; deps: Map<string, string> }, pode: { pessoais: boolean; salario: boolean },
): Record<string, string | number> {
  const v: Record<string, string | number> = {
    nome: String(c.nome ?? ''), nome_social: String(c.nome_social ?? ''), matricula: String(k?.matricula ?? ''),
    categoria: String(k?.cod_categ ?? ''), data_admissao: dataBR(k?.data_admissao), tipo_contrato: k ? TIPO_TXT(k) : '', data_termino: dataBR(k?.data_termino),
    horas_semana: k?.qtd_hrs_sem == null ? '' : Number(k.qtd_hrs_sem), cargo: k?.cargo_id ? nomes.cargos.get(String(k.cargo_id)) ?? '' : '',
    departamento: k?.departamento_id ? nomes.deps.get(String(k.departamento_id)) ?? '' : '', situacao: SIT_TXT[String(c.situacao)] ?? String(c.situacao ?? ''),
    data_desligamento: dataBR(k?.data_desligamento), ja_enviado_esocial: k && k.situacao_esocial !== 'rascunho' ? 'sim' : 'não',
  }
  if (pode.pessoais && p) Object.assign(v, { cpf: String(p.cpf ?? ''), data_nascimento: dataBR(p.data_nascimento), sexo: String(p.sexo ?? ''), telefone: String(p.telefone ?? ''), email: String(p.email ?? ''),
    cep: String(p.cep ?? ''), logradouro: String(p.logradouro ?? ''), numero: String(p.numero ?? ''), bairro: String(p.bairro ?? ''), cidade: String(p.cidade ?? ''), uf: String(p.uf ?? '') })
  if (pode.salario && salario != null) v.salario = salario
  // mesma ordem e mesmos títulos do modelo; coluna sem liberação sai vazia
  return Object.fromEntries(COLUNAS.map((col) => [col.titulo, v[col.chave] ?? '']))
}
