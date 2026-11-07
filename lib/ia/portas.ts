// ═══════════════════════════════════════════════════════════════
// PORTAS DA CENTRAL INTELLIGENCE (Etapa 2, docs/CENTRAL-INTELLIGENCE.md). Toda consulta da IA, de qualquer
// provedor, passa por aqui: a porta confere o papel lido no servidor, limita o tempo e deixa de insistir em
// consulta que falha seguido. Sem Next e sem banco: testado em scripts/check-portas.mts.
//
// Sem cache de propósito: a Vercel roda vários servidores e um não consegue avisar o outro que o dado mudou;
// quem baixa uma conta e pergunta em seguida receberia o número velho. Dentro de uma pergunta, o motor já não
// repete a mesma consulta.
// ═══════════════════════════════════════════════════════════════
import { PAPEIS_FINANCEIROS } from '../financeiro/semantica'

export type RegistroFerramenta = { nome: string; status: 'ok' | 'vazio' | 'parcial' | 'erro' | 'negado'; ms: number; motivo?: 'tempo' | 'suspensa' | 'fora_da_area' }
export type Porta = { modulo: string; papeis: readonly string[]; tempoMs: number }

const NORMAL = 20000, PESADA = 40000 // a consulta mais lenta medida (relatório completo) leva segundos; o teto evita prender a resposta
const porta = (modulo: string, tempoMs = NORMAL): Porta => ({ modulo, papeis: PAPEIS_FINANCEIROS, tempoMs })

export const PORTAS: Record<string, Porta> = {
  resumo_financeiro: porta('Dashboard'), titulos: porta('Contas a Receber e a Pagar'), movimentos_realizados: porta('Fluxo de Caixa'),
  faturamento: porta('DRE'), despesas: porta('DRE'), receitas_por_cliente: porta('Receitas'), custos_fixos_mes: porta('Custos Fixos'),
  reconciliacao: porta('Conferência', PESADA), relatorio: porta('Relatórios', PESADA), contas_vencidas: porta('Contas Vencidas', PESADA),
  contas_a_pagar: porta('Contas a Pagar'), contas_a_receber: porta('Contas a Receber'), custos: porta('Custos Fixos e Variáveis'),
  receitas_por_mes: porta('Receitas'), estoque_avisos: porta('Estoque'), dividas: porta('Endividamento'),
  maiores_fornecedores: porta('Fornecedores'), maiores_devedores: porta('Inadimplência'), dre: porta('DRE', PESADA),
  caixa_tesouraria: porta('Tesouraria', PESADA), obrigacoes_fiscais: porta('Fiscal'), cadastros: porta('Clientes e Fornecedores'), estoque_resumo: porta('Estoque'),
}

// ─── Etapa 5: cada tela consulta só o que é da sua finalidade. Quem protege o dado é o papel lido no servidor; a tela vem
// do navegador e serve para manter a IA no assunto. O modelo continua vendo todas as ferramentas: sem a ferramenta,
// ele concluía que o dado não existia ("não há cadastro de clientes"); a recusa vem da porta, com o motivo certo. Tela fora desta lista (IA Financeira, Relatórios, Nexus) vê todas as portas. ───
const BASE = ['resumo_financeiro', 'relatorio']
const TRIBUTARIO = [...BASE, 'faturamento', 'despesas', 'dre', 'custos', 'custos_fixos_mes', 'receitas_por_mes', 'obrigacoes_fiscais']
const A_PAGAR = ['titulos', 'contas_a_pagar', 'maiores_fornecedores', 'despesas', 'custos', 'obrigacoes_fiscais']
const A_RECEBER = ['titulos', 'contas_a_receber', 'maiores_devedores', 'receitas_por_cliente', 'faturamento', 'cadastros']
const COBRANCA = ['contas_vencidas', 'caixa_tesouraria', 'movimentos_realizados', 'reconciliacao']
const PORTAS_POR_TELA: Record<string, readonly string[]> = {
  'ia-tributaria': TRIBUTARIO,
  'contas-pagar': [...BASE, ...A_PAGAR, ...COBRANCA],
  'contas-receber': [...BASE, ...A_RECEBER, ...COBRANCA],
  'contas-vencidas': [...BASE, ...A_PAGAR, ...A_RECEBER, ...COBRANCA],
  clientes: [...BASE, 'cadastros', 'receitas_por_cliente', 'maiores_devedores', 'contas_a_receber', 'titulos', 'contas_vencidas'],
  'centros-custo': [...BASE, 'custos', 'custos_fixos_mes', 'despesas', 'dre', 'maiores_fornecedores'],
  tesouraria: [...BASE, 'caixa_tesouraria', 'movimentos_realizados', 'titulos', 'contas_a_pagar', 'contas_a_receber', 'dividas', 'obrigacoes_fiscais', 'contas_vencidas'],
  pdv: [...BASE, 'estoque_avisos', 'estoque_resumo', 'faturamento', 'cadastros'],
  'importar-documentos': [...BASE, 'contas_a_pagar', 'titulos', 'custos', 'despesas', 'maiores_fornecedores', 'cadastros', 'reconciliacao'],
}
const PORTAS_MEI = [...TRIBUTARIO, 'titulos', 'contas_a_pagar', 'contas_a_receber', 'movimentos_realizados', 'dividas', 'caixa_tesouraria']
// A porta de relatórios abre vários assuntos: sem isto, a IA Tributária montaria o relatório de clientes.
const RELATORIOS_POR_TELA: Record<string, readonly string[]> = {
  'ia-tributaria': ['tributario', 'dre', 'executivo'], 'contas-pagar': ['contas_pagar', 'contas_vencidas', 'despesas', 'fluxo_caixa', 'executivo'],
  'contas-receber': ['contas_receber', 'contas_vencidas', 'receitas', 'fluxo_caixa', 'executivo'], 'contas-vencidas': ['contas_vencidas', 'contas_receber', 'contas_pagar', 'fluxo_caixa', 'executivo'],
  clientes: ['contas_receber', 'contas_vencidas', 'receitas', 'executivo'], 'centros-custo': ['despesas', 'dre', 'executivo'],
  tesouraria: ['fluxo_caixa', 'contas_receber', 'contas_pagar', 'contas_vencidas', 'endividamento', 'executivo'], pdv: ['pdv', 'receitas', 'executivo'],
  'importar-documentos': ['contas_pagar', 'despesas', 'conciliacao', 'executivo'],
}
const RELATORIOS_MEI = ['tributario', 'dre', 'fluxo_caixa', 'contas_receber', 'contas_pagar', 'receitas', 'despesas', 'executivo']

// Pura: as portas da tela, ou null quando ela vê todas.
export function portasDaTela(tela?: string | null): readonly string[] | null {
  if (!tela) return null
  if (tela.startsWith('mei-')) return PORTAS_MEI
  return Object.hasOwn(PORTAS_POR_TELA, tela) ? PORTAS_POR_TELA[tela] : null
}
export const telaPodeUsarPorta = (tela: string | null | undefined, nome: string) => portasDaTela(tela)?.includes(nome) ?? true
export function telaPodePedirRelatorio(tela: string | null | undefined, tipo: unknown): boolean {
  if (!tela) return true
  const tipos = tela.startsWith('mei-') ? RELATORIOS_MEI : Object.hasOwn(RELATORIOS_POR_TELA, tela) ? RELATORIOS_POR_TELA[tela] : null
  return tipos ? tipos.includes(String(tipo)) : true
}
const foraDaArea = (assunto: string) => JSON.stringify({ negado: true, erro: `${assunto} existe no Axioma, mas não é consultado nesta tela. Responda à pessoa que esse assunto é visto na IA Financeira (menu IA Premium), não diga que o dado não existe e não estime nenhum valor.` })

// papel null = dono sem linha em empresa_usuarios (o acesso à empresa já foi conferido pela RLS na rota)
export const papelPodeUsarPorta = (p: Porta, papel: string | null) => p.papeis.includes(papel ?? 'dono')

// Só falha técnica abre o disjuntor. Pedido inválido do modelo (ex.: período errado) ou "sem dados" não.
function falhaTecnica(saida: string): boolean {
  if (saida.includes('não foi possível consultar')) return true
  try { return (JSON.parse(saida) as { estado?: string }).estado === 'erro' } catch { return true }
}

export function statusDaSaida(saida: string): RegistroFerramenta['status'] {
  if (saida.startsWith('{"erro"')) return 'erro'
  try {
    const j = JSON.parse(saida) as { negado?: boolean; itens?: unknown[]; meses?: { total: number }[]; sem_movimento?: boolean; estado?: string; registros?: number }
    if (j.negado === true) return 'negado'
    // Contrato padrão do motor financeiro (lib/financeiro/contrato): estado explícito
    if (j.estado === 'erro' || j.estado === 'indisponivel') return 'erro'
    if (j.sem_movimento === true) return 'vazio'
    if (j.estado && typeof j.registros === 'number' && j.registros === 0) return 'vazio'
    if (j.estado === 'parcial') return 'parcial'
    if (Array.isArray(j.itens) && j.itens.length === 0) return 'vazio'
    if (Array.isArray(j.meses) && j.meses.every((m) => !m.total)) return 'vazio'
  } catch { return 'erro' }
  return 'ok'
}

// ─── Disjuntor por empresa e porta (na memória do servidor): 3 falhas seguidas = 1 minuto sem tentar ───
const FALHAS_PARA_ABRIR = 3, ABERTO_MS = 60000
const disjuntores = new Map<string, { falhas: number; ate: number }>()

const estourouTempo = Symbol('tempo')
function comTempo(executar: () => Promise<string>, ms: number): Promise<string | typeof estourouTempo> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const limite = new Promise<typeof estourouTempo>((ok) => { timer = setTimeout(() => ok(estourouTempo), ms) })
  return Promise.race([executar(), limite]).finally(() => clearTimeout(timer))
}

export async function passarPelaPorta(p: { empresaId: string; papel: string | null; nome: string; tela?: string | null; entrada?: Record<string, unknown>; executar: () => Promise<string>; agora?: () => number; tempoMs?: number }): Promise<{ saida: string; motivo?: RegistroFerramenta['motivo'] }> {
  const agora = p.agora ?? Date.now
  const def = Object.hasOwn(PORTAS, p.nome) ? PORTAS[p.nome] : undefined
  if (!def) return { saida: JSON.stringify({ erro: `ferramenta desconhecida: ${p.nome}` }) }
  if (!papelPodeUsarPorta(def, p.papel)) return { saida: JSON.stringify({ negado: true, erro: `O papel desta pessoa não dá acesso a ${def.modulo}. Diga isso e não estime nenhum valor desse assunto.` }) }
  if (!telaPodeUsarPorta(p.tela, p.nome)) return { saida: foraDaArea(def.modulo), motivo: 'fora_da_area' }
  if (p.nome === 'relatorio' && !telaPodePedirRelatorio(p.tela, p.entrada?.tipo)) return { saida: foraDaArea('Este relatório'), motivo: 'fora_da_area' }

  const chave = `${p.empresaId}:${p.nome}`
  const d = disjuntores.get(chave)
  if (d && d.ate > agora()) return { saida: JSON.stringify({ erro: `não foi possível consultar agora: ${def.modulo} falhou seguidas vezes e será tentado de novo em instantes. Isso não significa que o valor seja zero.` }), motivo: 'suspensa' }

  const registrarFalha = () => {
    const falhas = (d?.ate ? 0 : d?.falhas ?? 0) + 1
    disjuntores.set(chave, { falhas, ate: falhas >= FALHAS_PARA_ABRIR ? agora() + ABERTO_MS : 0 })
  }
  let saida: string | typeof estourouTempo
  try { saida = await comTempo(p.executar, p.tempoMs ?? def.tempoMs) }
  catch (err) { registrarFalha(); return { saida: JSON.stringify({ erro: `não foi possível consultar agora: ${err instanceof Error ? err.message : String(err)}` }) } }
  if (saida === estourouTempo) {
    registrarFalha()
    return { saida: JSON.stringify({ erro: `não foi possível consultar agora: ${def.modulo} demorou demais. Isso não significa que o valor seja zero.` }), motivo: 'tempo' }
  }
  if (falhaTecnica(saida)) registrarFalha()
  else disjuntores.delete(chave)
  return { saida }
}

// ─── Quanto dá para confiar na resposta. Vai no retorno e na auditoria; decidido por código, nunca pelo modelo ───
export type Confiabilidade = 'completo' | 'parcial' | 'inconsistente' | 'indisponivel'
export const consultaTrouxeDado = (r: RegistroFerramenta) => r.status === 'ok' || r.status === 'vazio' || r.status === 'parcial'
export function confiabilidadeDaResposta(p: { respondeu: boolean; exige: boolean; registro: RegistroFerramenta[]; naoConferidos: number }): Confiabilidade {
  if (!p.respondeu) return 'indisponivel'
  if (p.exige && !p.registro.some(consultaTrouxeDado)) return 'indisponivel' // pedia dado detalhado e nenhuma consulta trouxe
  if (p.naoConferidos > 0) return 'inconsistente' // citou R$ que não está em nada que o servidor leu
  if (p.registro.some((r) => !consultaTrouxeDado(r) || r.status === 'parcial')) return 'parcial'
  return 'completo'
}
