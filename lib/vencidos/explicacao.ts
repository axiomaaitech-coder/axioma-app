// Explicação completa da próxima ação (Overdue Intelligence, Fase 2 etapa 10): por quê, dados usados, benefício,
// risco e próximo passo — nos 3 idiomas. Só texto a partir do que o motor já calculou; não decide nada novo.
import { diasAtraso, type Acao } from './motor'
import type { ItemVencido } from './dados'
import { porqueAcao, nomeCausa, nomePromessa, nomeTendencia, nomeCanal, type Lang } from './textos'

type T3 = [string, string, string]
const em = (lang: Lang, t: T3) => (lang === 'en' ? t[1] : lang === 'es' ? t[2] : t[0])

const EFEITO: Record<Acao, { beneficio: T3; risco: T3; passo: T3 }> = {
  solicitar_pagamento: {
    beneficio: ['Atraso recente é o que mais se recupera: um pedido cordial costuma resolver sem custo.', 'Recent delays are the easiest to recover: a polite request usually solves it at no cost.', 'El atraso reciente es el que más se recupera: un pedido cordial suele resolverlo sin costo.'],
    risco: ['Se não pedir agora, a conta muda de faixa e a chance de receber cai.', 'If you do not ask now, the bill moves to an older range and the chance of receiving drops.', 'Si no lo pide ahora, la cuenta cambia de rango y la probabilidad de cobrar baja.'],
    passo: ['Envie a mensagem "Lembrete" ou "Cobrança cordial" (Mensagem ao cliente) e registre o contato.', 'Send the "Reminder" or "Friendly collection" message (Message to customer) and record the contact.', 'Envíe el mensaje "Recordatorio" o "Cobranza cordial" (Mensaje al cliente) y registre el contacto.'],
  },
  reenviar_meio_pagamento: {
    beneficio: ['O cliente quer pagar: com o boleto ou Pix certo, o dinheiro entra rápido.', 'The customer wants to pay: with the right slip or Pix, the money comes in fast.', 'El cliente quiere pagar: con el boleto o Pix correcto, el dinero entra rápido.'],
    risco: ['Cobrar sem resolver o meio de pagamento desgasta o cliente e não recebe.', 'Collecting without fixing the payment method wears down the customer and collects nothing.', 'Cobrar sin resolver el medio de pago desgasta al cliente y no cobra.'],
    passo: ['Gere o boleto/Pix atualizado em Contas a Receber e envie ao cliente.', 'Issue the updated slip/Pix in Receivables and send it to the customer.', 'Genere el boleto/Pix actualizado en Cuentas por Cobrar y envíelo al cliente.'],
  },
  resolver_divergencia: {
    beneficio: ['Resolvida a divergência, o valor contestado volta a ser cobrável; a parte não contestada segue cobrada.', 'Once the dispute is solved, the disputed amount becomes collectable again; the undisputed part keeps being collected.', 'Resuelta la divergencia, el valor disputado vuelve a ser cobrable; la parte no disputada se sigue cobrando.'],
    risco: ['Cobrar o contestado antes de resolver desgasta a relação e não recebe.', 'Collecting the disputed amount before solving it damages the relationship and collects nothing.', 'Cobrar lo disputado antes de resolver desgasta la relación y no cobra.'],
    passo: ['Abra a divergência, junte as evidências e combine o prazo com o responsável.', 'Open the dispute, gather the evidence and agree on a deadline with the owner.', 'Abra la divergencia, reúna las evidencias y acuerde el plazo con el responsable.'],
  },
  solicitar_documentacao: {
    beneficio: ['Corrigir a nota ou o documento costuma destravar o pagamento em poucos dias.', 'Fixing the invoice or document usually unlocks payment within days.', 'Corregir la nota o el documento suele destrabar el pago en pocos días.'],
    risco: ['Enquanto o documento estiver errado, o cliente não consegue pagar, por mais que se cobre.', 'While the document is wrong, the customer cannot pay, however much you collect.', 'Mientras el documento esté mal, el cliente no puede pagar, por más que se cobre.'],
    passo: ['Confira a nota no Fiscal, corrija ou reenvie, e avise o cliente.', 'Check the invoice in Tax, fix or resend it, and let the customer know.', 'Revise la nota en Fiscal, corríjala o reenvíela y avise al cliente.'],
  },
  encaminhar_operacao: {
    beneficio: ['Resolver a entrega ou a qualidade remove o motivo do atraso e preserva o cliente.', 'Fixing delivery or quality removes the reason for the delay and keeps the customer.', 'Resolver la entrega o la calidad elimina el motivo del atraso y conserva al cliente.'],
    risco: ['Cobrar sem resolver a operação vira reclamação e pode virar cancelamento.', 'Collecting without fixing operations turns into a complaint and may become a cancellation.', 'Cobrar sin resolver la operación se vuelve reclamo y puede volverse cancelación.'],
    passo: ['Passe o caso para o responsável da operação com prazo e acompanhe aqui.', 'Hand the case to the operations owner with a deadline and follow it here.', 'Pase el caso al responsable de operaciones con plazo y sígalo aquí.'],
  },
  criar_promessa: {
    beneficio: ['Data e valor combinados viram previsão de caixa e permitem cobrar o combinado.', 'An agreed date and amount become a cash forecast and let you collect what was agreed.', 'Fecha y valor acordados se vuelven previsión de caja y permiten cobrar lo acordado.'],
    risco: ['Cliente piorando sem compromisso tende a atrasar ainda mais.', 'A worsening customer with no commitment tends to delay even more.', 'Un cliente que empeora sin compromiso tiende a atrasar aún más.'],
    passo: ['Ligue ou envie "Pedido de previsão" e registre a promessa com data e valor.', 'Call or send "Ask for a date" and record the promise with date and amount.', 'Llame o envíe "Pedido de previsión" y registre la promesa con fecha y valor.'],
  },
  propor_negociacao: {
    beneficio: ['Negociar aumenta o valor que se recupera de quem não consegue pagar tudo agora.', 'Negotiating increases what is recovered from customers who cannot pay everything now.', 'Negociar aumenta lo recuperado de quien no puede pagar todo ahora.'],
    risco: ['Desconto ou prazo sem simular reduz o caixa; toda concessão passa por aprovação.', 'A discount or term without simulating reduces cash; every concession goes through approval.', 'Descuento o plazo sin simular reduce la caja; toda concesión pasa por aprobación.'],
    passo: ['Use "Negociação" na conta: simule, proponha e peça a aprovação.', 'Use "Negotiation" on the bill: simulate, propose and request approval.', 'Use "Negociación" en la cuenta: simule, proponga y pida la aprobación.'],
  },
  escalonar_cobranca: {
    beneficio: ['Subir o nível mostra seriedade e costuma trazer resposta de quem estava parado.', 'Escalating shows seriousness and usually gets a reply from those who went silent.', 'Escalar muestra seriedad y suele obtener respuesta de quien estaba detenido.'],
    risco: ['Sempre com respeito: cobrança abusiva é proibida (CDC art. 42) e afasta o cliente.', 'Always respectful: abusive collection is forbidden (Consumer Code art. 42) and drives the customer away.', 'Siempre con respeto: la cobranza abusiva está prohibida (CDC art. 42) y aleja al cliente.'],
    passo: ['Passe para a etapa seguinte da régua em Inadimplência e registre o contato.', 'Move to the next step of the schedule in Delinquency and record the contact.', 'Pase a la siguiente etapa de la regla en Morosidad y registre el contacto.'],
  },
  acompanhar: {
    beneficio: ['Acompanhar sem pressionar mantém a promessa de pé até a data.', 'Following without pressure keeps the promise alive until its date.', 'Seguir sin presionar mantiene la promesa en pie hasta la fecha.'],
    risco: ['Promessa não é dinheiro em caixa: não conte com ela como recebida.', 'A promise is not cash: do not count it as received.', 'La promesa no es caja: no la cuente como cobrada.'],
    passo: ['Envie a "Confirmação da promessa" e volte a olhar na data combinada.', 'Send the "Promise confirmation" and check again on the agreed date.', 'Envíe la "Confirmación de la promesa" y vuelva a revisar en la fecha acordada.'],
  },
  analise_especializada: {
    beneficio: ['Um especialista avalia a melhor saída (acordo, habilitação de crédito) sem perder prazos.', 'A specialist assesses the best way out (agreement, credit claim) without missing deadlines.', 'Un especialista evalúa la mejor salida (acuerdo, habilitación de crédito) sin perder plazos.'],
    risco: ['Insistir na cobrança comum gasta tempo; nenhuma medida jurídica é automática no Axioma.', 'Insisting on ordinary collection wastes time; no legal step is automatic in Axioma.', 'Insistir en la cobranza común gasta tiempo; ninguna medida jurídica es automática en Axioma.'],
    passo: ['Monte o dossiê do cliente (clique no nome) e leve ao especialista.', 'Build the customer dossier (click the name) and take it to the specialist.', 'Arme el dossier del cliente (clic en el nombre) y llévelo al especialista.'],
  },
  seguir_regua: {
    beneficio: ['A régua mantém a cobrança constante e no tom certo para cada etapa.', 'The schedule keeps collection steady and in the right tone for each step.', 'La regla mantiene la cobranza constante y en el tono correcto para cada etapa.'],
    risco: ['Pular etapas confunde o cliente; atrasar etapas deixa a conta envelhecer.', 'Skipping steps confuses the customer; delaying them lets the bill age.', 'Saltar etapas confunde al cliente; atrasarlas deja envejecer la cuenta.'],
    passo: ['Faça a etapa de hoje em Inadimplência e registre o contato.', 'Do today’s step in Delinquency and record the contact.', 'Haga la etapa de hoy en Morosidad y registre el contacto.'],
  },
  pagar_agora: {
    beneficio: ['Pagar hoje interrompe juros e multa e preserva o fornecedor.', 'Paying today stops interest and fines and keeps the supplier.', 'Pagar hoy detiene intereses y multa y conserva al proveedor.'],
    risco: ['Adiar aumenta o custo a cada dia e pode cortar o fornecimento.', 'Postponing raises the cost every day and may stop supply.', 'Postergar aumenta el costo cada día y puede cortar el suministro.'],
    passo: ['Pague em Contas a Pagar; a baixa sai daqui sozinha.', 'Pay in Payables; it leaves this list on its own.', 'Pague en Cuentas por Pagar; sale de esta lista sola.'],
  },
  pagar_incontroverso: {
    beneficio: ['Pagar o que não está em discussão mostra boa-fé e reduz juros.', 'Paying what is not in question shows good faith and reduces interest.', 'Pagar lo que no está en discusión muestra buena fe y reduce intereses.'],
    risco: ['Pagar o contestado antes de resolver pode significar pagar o que não se deve.', 'Paying the disputed part before solving may mean paying what is not owed.', 'Pagar lo disputado antes de resolver puede significar pagar lo que no se debe.'],
    passo: ['Pague só a parte não contestada em Contas a Pagar e resolva a divergência.', 'Pay only the undisputed part in Payables and solve the dispute.', 'Pague solo la parte no disputada en Cuentas por Pagar y resuelva la divergencia.'],
  },
  negociar_prazo_fornecedor: {
    beneficio: ['Um prazo novo combinado evita corte de um fornecedor essencial.', 'A newly agreed term avoids losing an essential supplier.', 'Un nuevo plazo acordado evita perder un proveedor esencial.'],
    risco: ['Ficar em silêncio com fornecedor essencial pode parar a produção ou as vendas.', 'Staying silent with an essential supplier may stop production or sales.', 'Quedarse en silencio con un proveedor esencial puede detener la producción o las ventas.'],
    passo: ['Ligue ao fornecedor, combine nova data e atualize o vencimento em Contas a Pagar.', 'Call the supplier, agree on a new date and update the due date in Payables.', 'Llame al proveedor, acuerde nueva fecha y actualice el vencimiento en Cuentas por Pagar.'],
  },
  aguardar_caixa: {
    beneficio: ['Pagar na ordem de prioridade protege primeiro o que mais importa.', 'Paying in priority order protects what matters most first.', 'Pagar en orden de prioridad protege primero lo que más importa.'],
    risco: ['O atraso continua gerando juros: acompanhe o caixa na Tesouraria.', 'The delay keeps generating interest: watch cash in Treasury.', 'El atraso sigue generando intereses: siga la caja en Tesorería.'],
    passo: ['Veja a simulação de pagamentos e pague assim que o caixa permitir.', 'Check the payment simulation and pay as soon as cash allows.', 'Vea la simulación de pagos y pague en cuanto la caja lo permita.'],
  },
}

export type Explicacao = { porque: string; dados: string[]; beneficio: string; risco: string; passo: string }

export function explicarAcao(lang: Lang, i: ItemVencido, hoje: string, fmt: (v: number) => string): Explicacao {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const dias = diasAtraso(i.titulo.vencimento, hoje)
  const d: string[] = [
    L(`${dias} dia(s) de atraso, saldo ${fmt(i.saldo)}`, `${dias} day(s) overdue, balance ${fmt(i.saldo)}`, `${dias} día(s) de atraso, saldo ${fmt(i.saldo)}`),
  ]
  if (i.titulo.dominio === 'receber') {
    d.push(i.risco.score == null ? L('Nota de risco: histórico insuficiente (menos de 4 pagamentos)', 'Risk score: not enough history (fewer than 4 payments)', 'Nota de riesgo: historial insuficiente (menos de 4 pagos)') : L(`Nota de risco ${i.risco.score}/1000`, `Risk score ${i.risco.score}/1000`, `Nota de riesgo ${i.risco.score}/1000`))
    d.push(L(`Causa provável: ${nomeCausa(lang, i.causaSugerida.causa)}`, `Likely cause: ${nomeCausa(lang, i.causaSugerida.causa)}`, `Causa probable: ${nomeCausa(lang, i.causaSugerida.causa)}`))
    d.push(L(`Comportamento: ${nomeTendencia(lang, i.dna.tendencia)}`, `Behaviour: ${nomeTendencia(lang, i.dna.tendencia)}`, `Comportamiento: ${nomeTendencia(lang, i.dna.tendencia)}`))
    if (i.promessa) d.push(nomePromessa(lang, i.promessa))
    if (i.emNegociacao) d.push(L('Negociação em andamento', 'Negotiation in progress', 'Negociación en curso'))
    d.push(i.ultimoContato ? L(`Último contato: ${i.ultimoContato.data.slice(0, 10)}${i.ultimoContato.canal ? ` (${nomeCanal(lang, i.ultimoContato.canal)})` : ''}`, `Last contact: ${i.ultimoContato.data.slice(0, 10)}${i.ultimoContato.canal ? ` (${nomeCanal(lang, i.ultimoContato.canal)})` : ''}`, `Último contacto: ${i.ultimoContato.data.slice(0, 10)}${i.ultimoContato.canal ? ` (${nomeCanal(lang, i.ultimoContato.canal)})` : ''}`) : L('Nenhum contato registrado', 'No contact recorded', 'Ningún contacto registrado'))
  } else {
    d.push(L(`Prioridade de pagamento ${i.prioridade.score}`, `Payment priority ${i.prioridade.score}`, `Prioridad de pago ${i.prioridade.score}`))
  }
  if (i.disputa.aberta) d.push(L(`Contestado: ${fmt(i.disputa.contestado)}`, `Disputed: ${fmt(i.disputa.contestado)}`, `Disputado: ${fmt(i.disputa.contestado)}`))
  if (i.encargos.total > i.saldo) d.push(L(`Total atualizado com encargos: ${fmt(i.encargos.total)}`, `Updated total with charges: ${fmt(i.encargos.total)}`, `Total actualizado con cargos: ${fmt(i.encargos.total)}`))
  const e = EFEITO[i.acao.acao]
  return { porque: porqueAcao(lang, i.acao.acao), dados: d, beneficio: em(lang, e.beneficio), risco: em(lang, e.risco), passo: em(lang, e.passo) }
}
