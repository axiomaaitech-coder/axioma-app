// RH · Estrutura da Empresa — regras puras da tela /rh/estrutura (sem banco, testadas em scripts/check-rh-estrutura.mts).
// As travas de verdade estão no banco (docs/sql/RH-1..4); aqui só pré-preenchimento e tradução das recusas.

export type Lang = 'pt' | 'en' | 'es'
export type Texto = { pt: string; en: string; es: string }

const soDigitos = (v: unknown) => String(v ?? '').replace(/\D/g, '')

// Raiz do CNPJ (8 primeiros dígitos) — é o "empregador" para o eSocial. CNPJ incompleto: null.
export function raizCnpj(cnpj: unknown): string | null {
  const d = soDigitos(cnpj)
  return d.length === 14 ? d.slice(0, 8) : null
}

// CNAE com 7 dígitos (aceita "4711-3/02"). Outro tamanho: null.
export function cnaeSete(cnae: unknown): string | null {
  const d = soDigitos(cnae)
  return d.length === 7 ? d : null
}

// Sugestão de classificação tributária (Tabela 08) pelo regime cadastrado na Empresa.
// É só sugestão — a tela mostra o aviso para o contador conferir (no Simples, Anexo IV é "02").
export function sugerirClassTrib(regime: unknown): string | null {
  const r = String(regime ?? '').toLowerCase()
  if (r === 'mei') return '04'
  if (r.startsWith('simples')) return '01'
  if (r.includes('presumido') || r.includes('real')) return '99'
  return null
}

// Mês corrente no formato do eSocial (AAAA-MM), no fuso de São Paulo.
export function mesAtual(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(agora).slice(0, 7)
}

// Recusa do banco → frase que a pessoa entende. Nome da trava (constraint) primeiro; depois as mensagens
// dos gatilhos (já escritas em português no banco); por último, texto genérico com o motivo técnico.
const TRAVAS: Record<string, Texto> = {
  rh_empregador_periodo: { pt: 'Já existe um cadastro do empregador começando neste mês.', en: 'There is already an employer record starting this month.', es: 'Ya existe un registro del empleador que comienza este mes.' },
  rh_empregador_nr_tamanho: { pt: 'CNPJ: informe a raiz (8 dígitos) ou o número completo (14). CPF: 11 dígitos.', en: 'CNPJ: enter the root (8 digits) or the full number (14). CPF: 11 digits.', es: 'CNPJ: informe la raíz (8 dígitos) o el número completo (14). CPF: 11 dígitos.' },
  rh_empregador_digitos: { pt: 'CNPJ ou CPF com dígito verificador errado.', en: 'CNPJ or CPF with an invalid check digit.', es: 'CNPJ o CPF con dígito verificador incorrecto.' },
  rh_empregador_pf_class: { pt: 'Classificação 21 e 22 são só para empregador pessoa física (CPF); as demais, só para CNPJ.', en: 'Classifications 21 and 22 are only for individual employers (CPF); the others only for CNPJ.', es: 'Las clasificaciones 21 y 22 son solo para empleador persona física (CPF); las demás, solo para CNPJ.' },
  rh_empregador_pj_coop_constr: { pt: 'Empresa (CNPJ) precisa dizer se é cooperativa e se é construtora.', en: 'A company (CNPJ) must state whether it is a cooperative and a construction company.', es: 'Una empresa (CNPJ) debe indicar si es cooperativa y si es constructora.' },
  rh_empregador_desfolha: { pt: 'Desoneração da folha só vale para as classificações 02, 03 e 99.', en: 'Payroll tax relief only applies to classifications 02, 03 and 99.', es: 'La desoneración de la nómina solo vale para las clasificaciones 02, 03 y 99.' },
  rh_empregador_reg_eletron: { pt: 'A opção pelo registro eletrônico não é mais informada a partir de 2026-02.', en: 'The electronic registration option is no longer reported from 2026-02.', es: 'La opción de registro electrónico ya no se informa a partir de 2026-02.' },
  rh_empregador_fim_depois: { pt: 'O fim da validade não pode ser antes do início.', en: 'The end of validity cannot be before the start.', es: 'El fin de la vigencia no puede ser antes del inicio.' },
  rh_estab_periodo: { pt: 'Este estabelecimento já tem um cadastro começando neste mês.', en: 'This establishment already has a record starting this month.', es: 'Este establecimiento ya tiene un registro que comienza este mes.' },
  rh_estab_tamanho: { pt: 'Número inválido: CNPJ com 14 dígitos válidos, CAEPF com 14 ou CNO com 12.', en: 'Invalid number: valid 14-digit CNPJ, 14-digit CAEPF or 12-digit CNO.', es: 'Número inválido: CNPJ válido de 14 dígitos, CAEPF de 14 o CNO de 12.' },
  rh_estab_pcd_matriz: { pt: 'Processo de cota PCD só pode ser informado na matriz (CNPJ final 0001).', en: 'The disability-quota lawsuit can only be reported at the head office (CNPJ ending 0001).', es: 'El proceso de cuota PCD solo se informa en la matriz (CNPJ terminado en 0001).' },
  rh_lot_periodo: { pt: 'Esta lotação já tem um cadastro começando neste mês.', en: 'This tax unit already has a record starting this month.', es: 'Esta lotación ya tiene un registro que comienza este mes.' },
  rh_lot_insc: { pt: 'O tipo de lotação escolhido exige (ou proíbe) uma inscrição específica — veja a dica do campo.', en: 'The chosen tax unit type requires (or forbids) a specific registration — see the field hint.', es: 'El tipo de lotación elegido exige (o prohíbe) una inscripción específica — vea la ayuda del campo.' },
  rh_dep_nome: { pt: 'Já existe um departamento com este nome.', en: 'There is already a department with this name.', es: 'Ya existe un departamento con este nombre.' },
  rh_cargo_nome: { pt: 'Já existe um cargo com este nome.', en: 'There is already a job title with this name.', es: 'Ya existe un cargo con este nombre.' },
  rh_contrato_matricula: { pt: 'Matrícula já usada por outra pessoa desta Empresa.', en: 'Employee ID already used by someone else in this company.', es: 'Matrícula ya usada por otra persona de esta empresa.' },
  rh_pessoal_cpf_unico: { pt: 'CPF já cadastrado em outra pessoa desta Empresa.', en: 'CPF already registered for someone else in this company.', es: 'CPF ya registrado en otra persona de esta empresa.' },
  rh_contrato_experiencia: { pt: 'Contrato de experiência passa de 90 dias (CLT art. 445).', en: 'Probation contract exceeds 90 days (CLT art. 445).', es: 'Contrato de experiencia supera 90 días (CLT art. 445).' },
  rh_contrato_termino: { pt: 'Data de término: obrigatória no prazo determinado e nunca antes da admissão.', en: 'End date: required for fixed term and never before the hire date.', es: 'Fecha de término: obligatoria en plazo determinado y nunca antes de la admisión.' },
}

export function mensagemErroRh(erro: { code?: string; message?: string } | null | undefined, lang: Lang): string {
  const msg = String(erro?.message ?? '')
  const trava = Object.keys(TRAVAS).find((k) => msg.includes(k))
  if (trava) return TRAVAS[trava][lang]
  if (erro?.code === '42501' || /row-level security/i.test(msg)) {
    return { pt: 'Você não tem permissão para alterar o RH desta Empresa. Peça ao dono ou a um admin.', en: 'You do not have permission to change HR for this company. Ask the owner or an admin.', es: 'No tiene permiso para cambiar RR. HH. de esta empresa. Pida al dueño o a un admin.' }[lang]
  }
  // Mensagens dos gatilhos do banco já vêm em português claro.
  if (erro?.code === '23514' && msg && !/violates check constraint/i.test(msg)) return msg
  return { pt: 'Não foi possível salvar. Confira os campos e tente de novo.', en: 'Could not save. Check the fields and try again.', es: 'No se pudo guardar. Revise los campos e intente de nuevo.' }[lang]
}
