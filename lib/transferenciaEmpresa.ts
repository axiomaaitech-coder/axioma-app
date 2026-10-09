// Transferir empresa (Elias, 2026-10-09) — regras e textos compartilhados pela tela
// (Config → Empresa → aba Transferir), pela página de aceite e pelo servidor.
// Base legal resumida (pode mudar — a tela sempre mostra data e aviso):
// - LTDA/SLU: cessão de quotas só vale perante terceiros depois da alteração do
//   contrato social arquivada na Junta Comercial (CC arts. 1.057 e 1.003; IN DREI 88/2022).
// - S.A.: transferência de ações nominativas pelo termo no Livro de Registro (Lei 6.404/76, art. 31).
// - Sucessão: Junta exige alvará judicial ou formal de partilha (DREI).
// - MEI e Empresário Individual: o CNPJ é da própria pessoa — não se transfere.

export type Tx = { pt: string; en: string; es: string }
export type TipoSocietario = 'mei' | 'ei' | 'ltda' | 'slu' | 'sa' | 'outra'
export type TipoOperacao = 'venda' | 'doacao' | 'sucessao' | 'reorganizacao'
export type ItemChecklist = { id: string; obrigatorio: boolean; texto: Tx; ajuda: Tx }

export const BASE_LEGAL_DATA = '2026-10-09'

export const TIPOS_SOCIETARIOS: { key: TipoSocietario; nome: Tx; bloqueado?: boolean }[] = [
  { key: 'ltda', nome: { pt: 'Sociedade Limitada (LTDA)', en: 'Limited company (LTDA)', es: 'Sociedad Limitada (LTDA)' } },
  { key: 'slu', nome: { pt: 'Sociedade Limitada Unipessoal (SLU)', en: 'Single-member limited company (SLU)', es: 'Sociedad Limitada Unipersonal (SLU)' } },
  { key: 'sa', nome: { pt: 'Sociedade Anônima (S.A.)', en: 'Corporation (S.A.)', es: 'Sociedad Anónima (S.A.)' } },
  { key: 'outra', nome: { pt: 'Outra (cooperativa, EIRELI antiga…)', en: 'Other (cooperative, former EIRELI…)', es: 'Otra (cooperativa, EIRELI antigua…)' } },
  { key: 'mei', nome: { pt: 'MEI', en: 'MEI (micro-entrepreneur)', es: 'MEI (microemprendedor)' }, bloqueado: true },
  { key: 'ei', nome: { pt: 'Empresário Individual (EI)', en: 'Sole proprietor (EI)', es: 'Empresario Individual (EI)' }, bloqueado: true },
]

export const TIPOS_OPERACAO: { key: TipoOperacao; nome: Tx }[] = [
  { key: 'venda', nome: { pt: 'Venda (cessão onerosa)', en: 'Sale', es: 'Venta (cesión onerosa)' } },
  { key: 'doacao', nome: { pt: 'Doação', en: 'Donation', es: 'Donación' } },
  { key: 'sucessao', nome: { pt: 'Sucessão (herança)', en: 'Succession (inheritance)', es: 'Sucesión (herencia)' } },
  { key: 'reorganizacao', nome: { pt: 'Reorganização entre sócios', en: 'Reorganization among partners', es: 'Reorganización entre socios' } },
]

// MEI / EI: explica o caminho certo em vez de transferir
export const AVISO_BLOQUEADO: Record<'mei' | 'ei', Tx> = {
  mei: {
    pt: 'MEI não pode ser vendido nem transferido: o CNPJ fica preso ao CPF do dono. O caminho é dar baixa no MEI e quem compra abrir o próprio (ou transformar em LTDA/SLU antes e então transferir as quotas). Bens, clientes e contratos podem ser passados por contrato separado.',
    en: 'A MEI cannot be sold or transferred: the CNPJ is tied to the owner\'s CPF. The path is to close the MEI and the buyer opens their own (or convert it into an LTDA/SLU first and then transfer the quotas). Assets, customers and contracts can be passed through a separate contract.',
    es: 'El MEI no se puede vender ni transferir: el CNPJ queda vinculado al CPF del dueño. El camino es dar de baja el MEI y quien compra abre el suyo (o transformarlo antes en LTDA/SLU y luego transferir las cuotas). Bienes, clientes y contratos pueden pasarse por contrato separado.',
  },
  ei: {
    pt: 'Empresário Individual não tem quotas para ceder: a empresa é a própria pessoa. Para passar adiante, primeiro transforme em Sociedade Limitada Unipessoal (SLU) na Junta Comercial; depois a transferência das quotas é feita aqui. A venda só do estabelecimento (trespasse, Código Civil art. 1.144) é outro contrato e não muda o dono do CNPJ.',
    en: 'A sole proprietor has no quotas to assign: the company is the person. To pass it on, first convert it into a single-member limited company (SLU) at the Commercial Registry; then the quota transfer is done here. Selling only the business establishment (Civil Code art. 1,144) is another contract and does not change the CNPJ owner.',
    es: 'El Empresario Individual no tiene cuotas para ceder: la empresa es la propia persona. Para transferirla, primero transfórmela en Sociedad Limitada Unipersonal (SLU) en la Junta Comercial; después la transferencia de cuotas se hace aquí. La venta solo del establecimiento (Código Civil art. 1.144) es otro contrato y no cambia el dueño del CNPJ.',
  },
}

const DOC_PRINCIPAL: Record<'ltda' | 'slu' | 'sa' | 'outra', Tx> = {
  ltda: { pt: 'Contrato de cessão de quotas ou alteração do contrato social assinado', en: 'Quota assignment agreement or amendment to the articles signed', es: 'Contrato de cesión de cuotas o modificación del contrato social firmado' },
  slu: { pt: 'Alteração do ato constitutivo (cessão das quotas) assinada', en: 'Amendment to the articles (quota assignment) signed', es: 'Modificación del acto constitutivo (cesión de cuotas) firmada' },
  sa: { pt: 'Termo de transferência lançado no Livro de Registro de Ações Nominativas', en: 'Transfer entry recorded in the Registered Shares Book', es: 'Término de transferencia registrado en el Libro de Registro de Acciones' },
  outra: { pt: 'Documento societário da transferência assinado', en: 'Corporate transfer document signed', es: 'Documento societario de la transferencia firmado' },
}

export function checklistDe(tipo: TipoSocietario, operacao: TipoOperacao): ItemChecklist[] {
  if (tipo === 'mei' || tipo === 'ei') return []
  const itens: ItemChecklist[] = [
    { id: 'documento', obrigatorio: true, texto: DOC_PRINCIPAL[tipo],
      ajuda: { pt: 'Anexe o PDF no passo 3 — ele também vai para o Cofre da empresa.', en: 'Attach the PDF in step 3 — it also goes to the company Vault.', es: 'Adjunte el PDF en el paso 3 — también va a la Bóveda de la empresa.' } },
    { id: 'junta', obrigatorio: true,
      texto: tipo === 'sa'
        ? { pt: 'Ata/registro na Junta Comercial, se a diretoria mudar', en: 'Minutes/registration at the Commercial Registry, if the board changes', es: 'Acta/registro en la Junta Comercial, si cambia la dirección' }
        : { pt: 'Alteração registrada (arquivada) na Junta Comercial', en: 'Amendment filed at the Commercial Registry (Junta Comercial)', es: 'Modificación registrada en la Junta Comercial' },
      ajuda: { pt: 'Sem o registro na Junta a cessão não vale perante terceiros. Informe o número do protocolo/registro e a data.', en: 'Without the Registry filing the assignment is not valid against third parties. Enter the protocol/registration number and date.', es: 'Sin el registro en la Junta la cesión no vale frente a terceros. Informe el número de protocolo/registro y la fecha.' } },
    { id: 'receita', obrigatorio: true,
      texto: { pt: 'Quadro de sócios (QSA) / responsável atualizado na Receita Federal', en: 'Partner list (QSA) / responsible person updated at the Federal Revenue', es: 'Cuadro de socios (QSA) / responsable actualizado en la Receita Federal' },
      ajuda: { pt: 'Feito pela Redesim/DBE, normalmente pelo contador, junto com a Junta.', en: 'Done through Redesim/DBE, usually by the accountant, together with the Registry.', es: 'Se hace por Redesim/DBE, normalmente por el contador, junto con la Junta.' } },
  ]
  if (operacao === 'sucessao') itens.push({ id: 'sucessao', obrigatorio: true,
    texto: { pt: 'Alvará judicial ou formal de partilha', en: 'Court authorization or formal partition deed', es: 'Autorización judicial o formal de partición' },
    ajuda: { pt: 'A Junta exige um dos dois quando o sócio faleceu.', en: 'The Registry requires one of them when the partner has died.', es: 'La Junta exige uno de los dos cuando el socio falleció.' } })
  itens.push(
    { id: 'certidoes', obrigatorio: false,
      texto: { pt: 'Certidões negativas (federal, estadual, municipal, FGTS, trabalhista)', en: 'Clearance certificates (federal, state, municipal, FGTS, labor)', es: 'Certificados negativos (federal, estatal, municipal, FGTS, laboral)' },
      ajuda: { pt: 'Podem ser exigidas quando o controle muda de mãos; protegem quem compra de dívidas escondidas.', en: 'May be required when control changes hands; they protect the buyer from hidden debts.', es: 'Pueden exigirse cuando cambia el control; protegen a quien compra de deudas ocultas.' } },
    { id: 'contador', obrigatorio: false,
      texto: { pt: 'Contador avisado', en: 'Accountant notified', es: 'Contador avisado' },
      ajuda: { pt: 'Ele ajusta folha, impostos e obrigações em nome do novo responsável.', en: 'They adjust payroll, taxes and filings for the new person in charge.', es: 'Ajusta nómina, impuestos y obligaciones a nombre del nuevo responsable.' } },
    { id: 'bancos', obrigatorio: false,
      texto: { pt: 'Bancos, certificado digital e procurações revistos', en: 'Banks, digital certificate and powers of attorney reviewed', es: 'Bancos, certificado digital y poderes revisados' },
      ajuda: { pt: 'Quem sai deixa de assinar pela empresa.', en: 'Whoever leaves stops signing for the company.', es: 'Quien sale deja de firmar por la empresa.' } },
  )
  return itens
}

// Tipo sugerido a partir do cadastro (porte MEI ou natureza jurídica da Receita)
export function tipoSugerido(porte?: string | null, natureza?: string | null): TipoSocietario | '' {
  const n = (natureza || '').toLowerCase()
  if (porte === 'MEI') return 'mei'
  if (n.includes('unipessoal')) return 'slu'
  if (n.includes('limitada')) return 'ltda'
  if (n.includes('anônima') || n.includes('anonima')) return 'sa'
  if (n.includes('empresário') || n.includes('empresario')) return 'ei'
  return ''
}

export function docValido(doc: string): boolean {
  const d = doc.replace(/\D/g, '')
  if (d.length === 11) {
    if (/^(\d)\1{10}$/.test(d)) return false
    const dv = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r }
    return dv(9) === Number(d[9]) && dv(10) === Number(d[10])
  }
  if (d.length === 14) {
    if (/^(\d)\1{13}$/.test(d)) return false
    const calc = (len: number) => { const p = len === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2]; const s = p.reduce((a, w, i) => a + Number(d[i]) * w, 0); const r = s % 11; return r < 2 ? 0 : 11 - r }
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
  }
  return false
}

export type Transferencia = {
  id: string; situacao: 'aguardando' | 'concluida' | 'cancelada' | 'expirada'
  cedente_nome: string; cessionario_nome: string; cessionario_email: string; cessionario_doc: string
  tipo_operacao: TipoOperacao; tipo_societario: TipoSocietario; junta_protocolo: string; junta_data: string
  motivo: string; cedente_fica_admin: boolean; expira_em: string; aceite_em: string | null
  cancelado_em: string | null; cancelado_motivo: string | null; created_at: string; documento_id: string | null; token?: string
}

async function chamar(corpo: Record<string, unknown>): Promise<any> {
  const r = await fetch('/api/transferir-empresa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
  return r.json().catch(() => ({ erro: 'generico' }))
}
export const listarTransferencias = (empresaId: string) => chamar({ acao: 'listar', empresaId }) as Promise<{ itens?: Transferencia[]; souProprietario?: boolean; erro?: string }>
export const pedirTransferencia = (dados: Record<string, unknown>) => chamar({ acao: 'criar', ...dados }) as Promise<{ token?: string; erro?: string }>
export const cancelarTransferencia = (empresaId: string, id: string, motivo: string) => chamar({ acao: 'cancelar', empresaId, id, motivo }) as Promise<{ ok?: boolean; empresaId?: string; erro?: string }>
export const verTransferencia = (token: string) => chamar({ acao: 'ver', token })
export const aceitarTransferencia = (token: string, cpf: string, declaracao: boolean, lgpd: boolean) => chamar({ acao: 'aceitar', token, cpf, declaracao, lgpd }) as Promise<{ ok?: boolean; empresaId?: string; erro?: string }>
