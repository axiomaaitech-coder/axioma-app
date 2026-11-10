// ═══════════════════════════════════════════════════════════════
// PLANO DE CONSULTA da Central Intelligence: antes de chamar a IA, o servidor registra o que a pergunta pede, quais
// portas respondem e se dá para consultar em paralelo. Regra pura, sem banco e sem IA. O plano vai para a auditoria e é
// comparado com o que foi consultado de verdade. Quem escolhe a consulta continua sendo o modelo, só entre as portas
// que existem; quem autoriza continua sendo a porta (lib/ia/portas.ts).
// ═══════════════════════════════════════════════════════════════
import { PORTAS, telaPodeUsarPorta } from './portas'
import type { Idioma } from './motor'

// Sem acento e em minúsculas: a mesma regra vale para "situação" e "situacao"
const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const INTENCOES: { intencao: string; re: RegExp; portas: string[] }[] = [
  { intencao: 'visao_geral', re: /situacao (financeira|geral)|visao geral|como esta (a empresa|o negocio)|financial (situation|overview)|situacion financiera/, portas: ['resumo_financeiro'] },
  { intencao: 'a_receber', re: /a receber|recebiveis|quem (me )?deve|receivable|por cobrar/, portas: ['titulos'] },
  { intencao: 'a_pagar', re: /a pagar|pagaveis|quanto (eu )?devo|quanto devemos|payable|por pagar/, portas: ['titulos'] },
  { intencao: 'vencidos', re: /vencid|inadimpl|overdue|promessa/, portas: ['contas_vencidas'] },
  { intencao: 'caixa', re: /\bcaixa\b|tesouraria|reserva|\bcash\b|liquidez|tesoreria|\bcaja\b/, portas: ['caixa_tesouraria'] },
  { intencao: 'faturamento', re: /fatur|revenue|facturacion/, portas: ['faturamento'] },
  { intencao: 'despesas', re: /despesa|gasto|expense/, portas: ['despesas'] },
  { intencao: 'resultado', re: /lucro|margem|\bdre\b|profit|margin|utilidad/, portas: ['dre'] },
  { intencao: 'fiscal', re: /imposto|tribut|obrigac|\bdas\b|\btax\b|taxes|impuesto/, portas: ['obrigacoes_fiscais'] },
  { intencao: 'cadastros', re: /quantos (clientes|fornecedores)|how many (customers|clients|suppliers)|cuantos (clientes|proveedores)/, portas: ['cadastros'] },
  { intencao: 'estoque', re: /estoque|inventory|inventario/, portas: ['estoque_resumo'] },
  { intencao: 'pessoas', re: /funcionario|colaborador|employee|empleado|headcount|quadro de pessoal|experiencia|admiss|deslig/, portas: ['rh_pessoas'] },
  { intencao: 'salarios', re: /salario|folha( de pagamento)?\b|payroll|nomina|custo com (funcionarios|pessoal)/, portas: ['rh_salarios'] },
  { intencao: 'custo_pessoal', re: /custo (com |de |do |da )?(pessoal|funcionari|colaborador|folha|empregad|mao de obra)|encargo|\bfgts\b|inss patronal|quanto (custa|sai|gasto com) (a |o |um |uma |os |as )?(minha |meu |cada |nossa |nosso |meus |minhas )?(funcionari|colaborador|empregad|folha|pessoal|equipe)|folha (esta|foi) lancad|labor cost|costo (de )?personal/, portas: ['rh_custo_pessoal'] },
  { intencao: 'simular_contratacao', re: /contratar|contratacao|contratando|admitir|nova vaga|aumentar (o )?quadro|\bhire\b|hiring/, portas: ['rh_simular_contratacao'] },
  { intencao: 'indicadores_pessoas', re: /(receita|faturamento|lucro) (por|de cada) (funcionari|colaborador|pessoa|empregad)|quanto da (receita|minha receita|faturamento) vai para (pessoal|folha|salario)|produtividade (da equipe|dos funcionarios|por pessoa)|peso da folha|headcount|pessoal sobre (o )?faturamento|revenue per employee/, portas: ['rh_indicadores_pessoas'] },
  { intencao: 'ferias', re: /ferias|vacation|vacaciones|periodo (aquisitivo|concessivo)|abono pecuniario|em dobro/, portas: ['rh_ferias'] },
  { intencao: 'colaborador', re: /quanto (ganha|recebe)|salario d[oae]s? [a-z]|dados d[oae]s? (funcionari|colaborador)|(experiencia|contrato|admissao|departamento|cargo) d[oae]s? [a-z]{2,}|(em que|qual( e)? o|qual) (departamento|cargo|setor|area|filial) (esta|fica|trabalha|d[oae]s? )|how much does .* earn|cuanto gana/, portas: ['rh_colaborador'] },
  { intencao: 'alertas_rh', re: /risco trabalhista|alerta(s)? do rh|resolver no rh|pendencia(s)? do rh|radar|labor risk/, portas: ['rh_alertas'] },
  { intencao: 'estrutura_rh', re: /departamento|\bcargos?\b|estrutura do rh|\brh\b|lotac|filia(l|is)\b/, portas: ['rh_estrutura'] },
  { intencao: 'compras', re: /pedidos? de compra|purchase order/, portas: ['compras_pedidos'] },
  { intencao: 'pdv', re: /\bpdv\b|\bpos sales\b|vendi no caixa/, portas: ['pdv_resumo'] },
  { intencao: 'dividas', re: /divida|emprestimo|\bdebt\b|deuda/, portas: ['dividas'] },
  { intencao: 'relatorio', re: /relatorio|\bpdf\b|\breport\b|informe/, portas: ['relatorio'] },
]
// O Axioma ainda não tem esse dado: o plano diz "indisponível" e nenhuma porta é aberta por causa disso
const SEM_FONTE: { indicador: string; re: RegExp }[] = [
  { indicador: 'folha', re: /folha( de pagamento)?\b|payroll|nomina/ },   // folha completa: Fase 4 do RH (salário-base existe: rh_salarios)
  { indicador: 'fornecedor_deve', re: /fornecedor(es)? (me )?deve|supplier owes|proveedor(es)? (me )?debe/ },
]

export type PlanoConsulta = {
  intencoes: string[]; portas: string[]; fora_da_tela: string[]; indisponiveis: string[]
  execucao: 'nenhuma' | 'isolada' | 'paralela'
}

export function planejarConsulta(pergunta: string, tela?: string | null): PlanoConsulta {
  const p = normalizar(pergunta)
  const achadas = INTENCOES.filter((i) => i.re.test(p))
  const todas = [...new Set(achadas.flatMap((i) => i.portas))].filter((n) => Object.hasOwn(PORTAS, n))
  const portas = todas.filter((n) => telaPodeUsarPorta(tela, n))
  return {
    intencoes: achadas.map((i) => i.intencao), portas, fora_da_tela: todas.filter((n) => !portas.includes(n)),
    indisponiveis: SEM_FONTE.filter((s) => s.re.test(p)).map((s) => s.indicador),
    // As portas desta lista só leem e não dependem uma da outra: podem ir juntas
    execucao: portas.length === 0 ? 'nenhuma' : portas.length === 1 ? 'isolada' : 'paralela',
  }
}

// Mesma informação por outra porta: não é consulta que faltou
const EQUIVALENTES: Record<string, string[]> = {
  titulos: ['contas_a_receber', 'contas_a_pagar', 'contas_vencidas', 'relatorio'], faturamento: ['dre', 'relatorio'], despesas: ['dre', 'custos', 'relatorio'],
  dre: ['relatorio'], resumo_financeiro: ['relatorio'], caixa_tesouraria: ['relatorio'], estoque_resumo: ['estoque_avisos'],
}
// O que estava no plano e não foi consultado. Só para auditoria: a resposta pode ter vindo do retrato da empresa.
export const portasNaoConsultadas = (plano: PlanoConsulta, consultadas: string[]) =>
  plano.portas.filter((n) => !consultadas.includes(n) && !(EQUIVALENTES[n] ?? []).some((e) => consultadas.includes(e)))

// ─── Pergunta sem sujeito: qualquer número seria um chute. Só quando vem sozinha, sem conversa antes. ───
const AMBIGUAS = /^(quanto (eu )?(tenho|temos)|qual (e |eh )?(o )?(meu |nosso )?(saldo|valor|total)|(meu |nosso |o )?saldo|quanto (e|da)|how much (do )?(i|we) have|what is (the|my|our) (balance|total)|cuanto (tengo|tenemos)|cual es (el|mi|nuestro) saldo)[\s?.!]*$/
export const perguntaAmbigua = (pergunta: string, temHistorico: boolean) => !temHistorico && AMBIGUAS.test(normalizar(pergunta.trim()))

export const PEDIDO_ESCLARECIMENTO: Record<Idioma, string> = {
  pt: 'Para não te dar um número errado, me diga qual destes você quer: saldo em caixa, quanto a receber, quanto a pagar ou o faturamento do mês?',
  en: 'So I do not give you a wrong number, which of these do you want: cash balance, amount receivable, amount payable or revenue for the month?',
  es: '¿Para no darle un número equivocado, cuál de estos desea: saldo en caja, cuánto por cobrar, cuánto por pagar o la facturación del mes?',
}
