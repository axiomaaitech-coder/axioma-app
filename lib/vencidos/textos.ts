// Textos da Overdue Intelligence nos 3 idiomas (regra trilíngue): o motor devolve CÓDIGOS (ação, fator, causa,
// situação) e a tela mostra por aqui — nada de texto só em português aparecendo em inglês/espanhol.
import type { Acao, Causa, SituacaoPromessa } from './motor'

export type Lang = 'pt' | 'en' | 'es'
type T3 = [string, string, string]
const em = (lang: Lang, t: T3) => (lang === 'en' ? t[1] : lang === 'es' ? t[2] : t[0])

const ACOES: Record<Acao, { nome: T3; porque: T3 }> = {
  solicitar_pagamento: { nome: ['Pedir o pagamento', 'Request payment', 'Solicitar el pago'], porque: ['Atraso recente ou esquecimento: lembrete cordial com o meio de pagamento.', 'Recent delay or oversight: a friendly reminder with the payment method.', 'Atraso reciente u olvido: recordatorio cordial con el medio de pago.'] },
  reenviar_meio_pagamento: { nome: ['Reenviar boleto/Pix', 'Resend payment slip/Pix', 'Reenviar boleto/Pix'], porque: ['Falha no meio de pagamento: mandar o boleto ou Pix atualizado.', 'Payment method failed: send an updated slip or Pix.', 'Falla en el medio de pago: enviar el boleto o Pix actualizado.'] },
  resolver_divergencia: { nome: ['Resolver a divergência', 'Resolve the dispute', 'Resolver la divergencia'], porque: ['Há divergência aberta: resolver primeiro; a parte não contestada continua sendo cobrada.', 'There is an open dispute: solve it first; the undisputed part is still collected.', 'Hay una divergencia abierta: resolverla primero; la parte no disputada se sigue cobrando.'] },
  solicitar_documentacao: { nome: ['Corrigir a documentação', 'Fix the documents', 'Corregir la documentación'], porque: ['Atraso por nota ou documento: corrigir ou reenviar costuma destravar o pagamento.', 'Delay caused by an invoice or document: fixing or resending it usually unlocks payment.', 'Atraso por nota o documento: corregir o reenviar suele destrabar el pago.'] },
  encaminhar_operacao: { nome: ['Passar para a operação', 'Hand over to operations', 'Pasar a operaciones'], porque: ['Problema de entrega ou qualidade: a solução está na operação, não na cobrança.', 'Delivery or quality problem: the fix is in operations, not in collection.', 'Problema de entrega o calidad: la solución está en operaciones, no en la cobranza.'] },
  criar_promessa: { nome: ['Fechar uma promessa', 'Get a payment promise', 'Cerrar una promesa'], porque: ['O cliente está pagando cada vez mais tarde: combinar data e valor.', 'The customer is paying later and later: agree on a date and amount.', 'El cliente paga cada vez más tarde: acordar fecha y valor.'] },
  propor_negociacao: { nome: ['Propor negociação', 'Propose a negotiation', 'Proponer negociación'], porque: ['Falta de caixa do cliente ou atraso longo: negociar aumenta o que se recupera (concessão exige aprovação).', 'Customer cash shortage or long delay: negotiating raises recovery (any concession needs approval).', 'Falta de caja del cliente o atraso largo: negociar aumenta lo recuperado (toda concesión requiere aprobación).'] },
  escalonar_cobranca: { nome: ['Subir o nível da cobrança', 'Escalate collection', 'Escalar la cobranza'], porque: ['Atraso longo ou promessa descumprida: passar para a etapa seguinte da régua.', 'Long delay or broken promise: move to the next collection step.', 'Atraso largo o promesa incumplida: pasar a la siguiente etapa de cobranza.'] },
  acompanhar: { nome: ['Acompanhar a promessa', 'Follow the promise', 'Seguir la promesa'], porque: ['Há promessa no prazo: acompanhar até a data (promessa não é dinheiro em caixa).', 'There is a promise within its date: follow it (a promise is not cash).', 'Hay una promesa en plazo: seguirla hasta la fecha (la promesa no es caja).'] },
  analise_especializada: { nome: ['Análise especializada', 'Specialist review', 'Análisis especializado'], porque: ['Risco muito alto, atraso longo ou insolvência: avaliar com especialista. Nada jurídico é automático.', 'Very high risk, long delay or insolvency: review with a specialist. Nothing legal is automatic.', 'Riesgo muy alto, atraso largo o insolvencia: evaluar con especialista. Nada jurídico es automático.'] },
  seguir_regua: { nome: ['Seguir a régua', 'Follow the schedule', 'Seguir la regla'], porque: ['Etapa da régua de cobrança de hoje.', 'Today’s collection schedule step.', 'Etapa de la regla de cobranza de hoy.'] },
  pagar_agora: { nome: ['Pagar agora', 'Pay now', 'Pagar ahora'], porque: ['O caixa cobre e o atraso gera custo e risco com o fornecedor.', 'Cash covers it and the delay creates cost and supplier risk.', 'La caja lo cubre y el atraso genera costo y riesgo con el proveedor.'] },
  pagar_incontroverso: { nome: ['Pagar a parte não contestada', 'Pay the undisputed part', 'Pagar la parte no disputada'], porque: ['Cobrança contestada: pagar o que não está em discussão; o resto espera a solução.', 'Disputed bill: pay what is not in question; the rest waits for the solution.', 'Cobro disputado: pagar lo que no está en discusión; el resto espera la solución.'] },
  negociar_prazo_fornecedor: { nome: ['Negociar prazo com o fornecedor', 'Negotiate terms with the supplier', 'Negociar plazo con el proveedor'], porque: ['O caixa não cobre hoje e o fornecedor é essencial.', 'Cash does not cover it today and the supplier is essential.', 'La caja no lo cubre hoy y el proveedor es esencial.'] },
  aguardar_caixa: { nome: ['Aguardar caixa', 'Wait for cash', 'Esperar caja'], porque: ['O caixa não cobre hoje: segue a ordem de prioridade.', 'Cash does not cover it today: follows the priority order.', 'La caja no lo cubre hoy: sigue el orden de prioridad.'] },
}
export const nomeAcao = (lang: Lang, a: Acao) => em(lang, ACOES[a].nome)
export const porqueAcao = (lang: Lang, a: Acao) => em(lang, ACOES[a].porque)

const FATORES: Record<string, T3> = {
  dias_atraso: ['Dias de atraso', 'Days overdue', 'Días de atraso'], historico_atraso: ['Histórico de atrasos', 'Delay history', 'Historial de atrasos'],
  frequencia_atraso: ['Frequência de atraso', 'How often late', 'Frecuencia de atraso'], deterioracao: ['Pagamentos piorando', 'Payments getting worse', 'Pagos empeorando'],
  melhora: ['Pagamentos melhorando', 'Payments improving', 'Pagos mejorando'], promessas_descumpridas: ['Promessas descumpridas', 'Broken promises', 'Promesas incumplidas'],
  recuperacao_anterior: ['Atrasos anteriores pagos', 'Past delays paid', 'Atrasos anteriores pagados'], exposicao: ['Saldo acima do normal', 'Balance above usual', 'Saldo por encima de lo normal'],
  disputa: ['Divergência aberta', 'Open dispute', 'Divergencia abierta'], insolvencia: ['Insolvência informada', 'Reported insolvency', 'Insolvencia informada'],
  causa_operacional: ['Causa operacional', 'Operational cause', 'Causa operativa'], valor: ['Peso do valor', 'Weight of the amount', 'Peso del valor'],
  exposicao_total: ['Exposição total do cliente', 'Customer total exposure', 'Exposición total del cliente'], recuperavel: ['Chance de a ação mudar o resultado', 'Chance the action changes the outcome', 'Probabilidad de que la acción cambie el resultado'],
  sem_historico: ['Sem histórico: acompanhar de perto', 'No history: follow closely', 'Sin historial: seguir de cerca'], vai_mudar_faixa: ['Vai mudar de faixa', 'About to change range', 'Va a cambiar de rango'],
  promessa_descumprida: ['Promessa descumprida', 'Broken promise', 'Promesa incumplida'], caixa: ['Situação do caixa', 'Cash position', 'Situación de la caja'],
  essencialidade: ['Importância do fornecedor', 'Supplier importance', 'Importancia del proveedor'], risco_operacional: ['Risco de parar o fornecimento', 'Risk of supply stopping', 'Riesgo de cortar el suministro'],
  producao: ['Afeta a produção', 'Affects production', 'Afecta la producción'], vendas: ['Afeta as vendas', 'Affects sales', 'Afecta las ventas'],
  relacao_comercial: ['Dependência do fornecedor', 'Supplier dependency', 'Dependencia del proveedor'], juros: ['Juros', 'Interest', 'Intereses'], multa: ['Multa', 'Fine', 'Multa'],
  atraso: ['Dias de atraso', 'Days overdue', 'Días de atraso'], contestado: ['Cobrança contestada', 'Disputed bill', 'Cobro disputado'],
}
export const nomeFator = (lang: Lang, chave: string) => (FATORES[chave] ? em(lang, FATORES[chave]) : chave)

const CAUSAS: Record<Causa, T3> = {
  financeiro: ['Dificuldade financeira', 'Financial difficulty', 'Dificultad financiera'], liquidez: ['Falta de caixa', 'Cash shortage', 'Falta de caja'],
  entrega: ['Problema de entrega', 'Delivery problem', 'Problema de entrega'], qualidade: ['Problema de qualidade', 'Quality problem', 'Problema de calidad'],
  divergencia_comercial: ['Divergência comercial', 'Commercial disagreement', 'Divergencia comercial'], nota_fiscal: ['Nota fiscal incorreta', 'Incorrect invoice', 'Factura incorrecta'],
  documental: ['Problema documental', 'Document problem', 'Problema documental'], erro_administrativo: ['Falha administrativa', 'Administrative error', 'Falla administrativa'],
  contestacao_contratual: ['Contestação contratual', 'Contract dispute', 'Impugnación contractual'], pagamento: ['Falha de pagamento', 'Payment failure', 'Falla de pago'],
  esquecimento: ['Esquecimento', 'Forgot to pay', 'Olvido'], insolvencia: ['Insolvência informada', 'Reported insolvency', 'Insolvencia informada'], desconhecido: ['Desconhecida', 'Unknown', 'Desconocida'],
}
export const nomeCausa = (lang: Lang, c: Causa) => em(lang, CAUSAS[c])

const PROMESSAS: Record<SituacaoPromessa, T3> = {
  pendente: ['Promessa pendente', 'Pending promise', 'Promesa pendiente'], confirmada: ['Promessa confirmada', 'Confirmed promise', 'Promesa confirmada'],
  parcialmente_cumprida: ['Promessa paga em parte', 'Promise partly paid', 'Promesa pagada en parte'], cumprida: ['Promessa cumprida', 'Promise kept', 'Promesa cumplida'],
  descumprida: ['Promessa descumprida', 'Broken promise', 'Promesa incumplida'], renegociada: ['Promessa renegociada', 'Renegotiated promise', 'Promesa renegociada'], cancelada: ['Promessa cancelada', 'Cancelled promise', 'Promesa cancelada'],
}
export const nomePromessa = (lang: Lang, s: SituacaoPromessa) => em(lang, PROMESSAS[s])

const CANAIS: Record<string, T3> = {
  telefone: ['Telefone', 'Phone', 'Teléfono'], whatsapp: ['WhatsApp', 'WhatsApp', 'WhatsApp'], email: ['E-mail', 'Email', 'Correo'],
  sms: ['SMS', 'SMS', 'SMS'], presencial: ['Pessoalmente', 'In person', 'En persona'],
}
export const CANAIS_CONTATO = Object.keys(CANAIS)
export const nomeCanal = (lang: Lang, c: string | null | undefined) => (c && CANAIS[c] ? em(lang, CANAIS[c]) : c || '—')

export const nomeTendencia = (lang: Lang, t: 'piora' | 'melhora' | 'estavel' | 'indefinida') =>
  em(lang, { piora: ['Piorando', 'Getting worse', 'Empeorando'], melhora: ['Melhorando', 'Improving', 'Mejorando'], estavel: ['Estável', 'Stable', 'Estable'], indefinida: ['Histórico insuficiente', 'Not enough history', 'Historial insuficiente'] }[t] as T3)
