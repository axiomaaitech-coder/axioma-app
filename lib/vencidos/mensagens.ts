// Modelos de mensagem de cobrança (Overdue Intelligence, Fase 2 etapa 6). Texto montado só com dado real da conta
// (nada inventado). O Axioma NÃO envia nada sozinho: a pessoa copia ou abre no WhatsApp/e-mail e envia; depois
// marca "enviada" e o contato fica no histórico. Envio automático (WhatsApp Business, e-mail, SMS) só com
// integração oficial configurada e autorizada — hoje não existe (status mostrado na tela).
export type TipoMensagem = 'lembrete' | 'aviso_vencimento' | 'cobranca_cordial' | 'pedido_previsao' | 'confirmacao_promessa' | 'negociacao' | 'regularizacao'
export const TIPOS_MENSAGEM: TipoMensagem[] = ['lembrete', 'aviso_vencimento', 'cobranca_cordial', 'pedido_previsao', 'confirmacao_promessa', 'negociacao', 'regularizacao']
export type Idioma = 'pt' | 'en' | 'es'
export type DadosMensagem = { cliente: string; empresa: string; descricao: string; valor: string; vencimento: string; dias: number; promessaData?: string | null; promessaValor?: string | null }

const NOMES: Record<TipoMensagem, [string, string, string]> = {
  lembrete: ['Lembrete preventivo', 'Friendly reminder', 'Recordatorio preventivo'],
  aviso_vencimento: ['Aviso de vencimento', 'Due notice', 'Aviso de vencimiento'],
  cobranca_cordial: ['Cobrança cordial', 'Friendly collection', 'Cobranza cordial'],
  pedido_previsao: ['Pedido de previsão de pagamento', 'Payment date request', 'Pedido de fecha de pago'],
  confirmacao_promessa: ['Confirmação de promessa', 'Promise confirmation', 'Confirmación de promesa'],
  negociacao: ['Convite para negociar', 'Negotiation invitation', 'Invitación a negociar'],
  regularizacao: ['Agradecimento pela regularização', 'Thanks for settling', 'Agradecimiento por la regularización'],
}
export const nomeMensagem = (lang: Idioma, t: TipoMensagem) => NOMES[t][lang === 'en' ? 1 : lang === 'es' ? 2 : 0]

// Sugestão do modelo pelo atraso e pela situação (a pessoa pode trocar)
export function modeloSugerido(dias: number, promessaPendente: boolean): TipoMensagem {
  if (promessaPendente) return 'confirmacao_promessa'
  if (dias <= 0) return 'lembrete'
  if (dias <= 3) return 'aviso_vencimento'
  if (dias <= 15) return 'cobranca_cordial'
  if (dias <= 30) return 'pedido_previsao'
  return 'negociacao'
}

export function montarMensagem(tipo: TipoMensagem, lang: Idioma, d: DadosMensagem): { assunto: string; texto: string } {
  const pt = lang === 'pt', en = lang === 'en'
  const ref = `${d.descricao} — ${d.valor} (${pt ? 'vencimento' : en ? 'due' : 'vencimiento'} ${d.vencimento})`
  const ola = pt ? `Olá, ${d.cliente}!` : en ? `Hello, ${d.cliente}!` : `¡Hola, ${d.cliente}!`
  const ass = `\n\n${pt ? 'Atenciosamente' : en ? 'Best regards' : 'Atentamente'},\n${d.empresa}`
  // Persuasivas e respeitosas: contexto, valor, empatia, pedido claro e o ganho de regularizar.
  // Sem ameaça, exposição ou constrangimento (CDC art. 42) — cobrança firme, nunca abusiva.
  const T: Record<TipoMensagem, [string, string, string]> = {
    lembrete: [
      `${ola}\n\nTudo bem? Passando para lembrar, com antecedência, do pagamento de ${ref}.\n\nDeixar programado agora evita correria e mantém tudo em dia entre nós. Se precisar do boleto, do Pix ou de qualquer informação, é só responder esta mensagem que enviamos na hora.\n\nSe o pagamento já foi feito, por favor desconsidere — e obrigado pela parceria!`,
      `${ola}\n\nHope you are well. This is an early, friendly reminder about the payment of ${ref}.\n\nScheduling it now saves time and keeps everything up to date between us. If you need the payment slip, Pix or any detail, just reply and we will send it right away.\n\nIf you have already paid, please disregard this — and thank you for the partnership!`,
      `${ola}\n\n¿Cómo está? Le escribimos con anticipación para recordarle el pago de ${ref}.\n\nProgramarlo ahora evita apuros y mantiene todo al día entre nosotros. Si necesita el boleto, el Pix o cualquier dato, responda este mensaje y se lo enviamos enseguida.\n\nSi ya realizó el pago, por favor ignore este mensaje — ¡y gracias por la confianza!`],
    aviso_vencimento: [
      `${ola}\n\nNotamos que ${ref} venceu há ${d.dias} dia(s) e ainda não identificamos o pagamento. Sabemos que imprevistos acontecem e pode ter sido apenas um descuido.\n\nPara facilitar, podemos reenviar agora o boleto ou o Pix atualizado — basta responder esta mensagem. Regularizar nos próximos dias evita que juros e multa continuem correndo.\n\nContamos com você!`,
      `${ola}\n\nWe noticed that ${ref} became due ${d.dias} day(s) ago and the payment has not been identified yet. We know things happen and it may simply have been an oversight.\n\nTo make it easy, we can resend the updated payment slip or Pix right now — just reply to this message. Settling it in the next few days keeps interest and fines from adding up.\n\nWe count on you!`,
      `${ola}\n\nNotamos que ${ref} venció hace ${d.dias} día(s) y aún no identificamos el pago. Sabemos que los imprevistos ocurren y puede haber sido solo un descuido.\n\nPara facilitarlo, podemos reenviar ahora el boleto o el Pix actualizado — solo responda este mensaje. Regularizar en los próximos días evita que sigan corriendo intereses y multas.\n\n¡Contamos con usted!`],
    cobranca_cordial: [
      `${ola}\n\nConsta em aberto ${ref}, hoje com ${d.dias} dias de atraso. Valorizamos muito a nossa parceria e queremos resolver isso da forma mais simples para você.\n\nVocê consegue regularizar até o fim desta semana? Se houver qualquer divergência na cobrança — valor, entrega ou nota fiscal — nos avise que verificamos imediatamente.\n\nFicamos no aguardo do seu retorno.`,
      `${ola}\n\n${ref} is still open, now ${d.dias} days overdue. We truly value our partnership and want to solve this in the simplest way for you.\n\nCould you settle it by the end of this week? If anything about the bill is not right — amount, delivery or invoice — let us know and we will check it right away.\n\nWe look forward to hearing from you.`,
      `${ola}\n\nFigura pendiente ${ref}, hoy con ${d.dias} días de atraso. Valoramos mucho nuestra relación y queremos resolverlo de la forma más simple para usted.\n\n¿Puede regularizarlo antes del fin de esta semana? Si hay alguna diferencia en el cobro — valor, entrega o factura — avísenos y lo verificamos de inmediato.\n\nQuedamos atentos a su respuesta.`],
    pedido_previsao: [
      `${ola}\n\n${ref} segue em aberto há ${d.dias} dias. Entendemos que o momento pode estar mais apertado e queremos encontrar um caminho junto com você.\n\nPoderia nos informar uma data prevista para o pagamento? Com essa previsão, organizamos nosso fluxo, evitamos novas cobranças e podemos até avaliar uma condição especial, se necessário.\n\nUma resposta rápida já ajuda bastante. Obrigado!`,
      `${ola}\n\n${ref} has been open for ${d.dias} days. We understand things may be tighter right now and we want to find a way forward together.\n\nCould you give us an expected payment date? With it we can plan, avoid further reminders and even consider a special arrangement if needed.\n\nA quick reply already helps a lot. Thank you!`,
      `${ola}\n\n${ref} sigue pendiente hace ${d.dias} días. Entendemos que el momento puede ser más ajustado y queremos encontrar un camino junto con usted.\n\n¿Podría indicarnos una fecha prevista de pago? Con esa previsión organizamos nuestro flujo, evitamos nuevos avisos y hasta podemos evaluar una condición especial si hace falta.\n\nUna respuesta rápida ya ayuda mucho. ¡Gracias!`],
    confirmacao_promessa: [
      `${ola}\n\nObrigado pelo retorno! Confirmando o que combinamos: o pagamento${d.promessaValor ? ` de ${d.promessaValor}` : ''} referente a ${ref}${d.promessaData ? `, até ${d.promessaData}` : ''}.\n\nSe precisar do boleto ou do Pix, é só pedir que enviamos na hora. Cumprindo o combinado, mantemos tudo em ordem e as boas condições para os próximos pedidos.\n\nConte conosco!`,
      `${ola}\n\nThank you for getting back to us! Confirming what we agreed: the payment${d.promessaValor ? ` of ${d.promessaValor}` : ''} for ${ref}${d.promessaData ? `, by ${d.promessaData}` : ''}.\n\nIf you need the payment slip or Pix, just ask and we will send it right away. Keeping to the agreement keeps everything in order and the good terms for your next orders.\n\nCount on us!`,
      `${ola}\n\n¡Gracias por responder! Confirmamos lo acordado: el pago${d.promessaValor ? ` de ${d.promessaValor}` : ''} referente a ${ref}${d.promessaData ? `, hasta ${d.promessaData}` : ''}.\n\nSi necesita el boleto o el Pix, solo pídalo y se lo enviamos enseguida. Cumpliendo lo acordado, mantenemos todo en orden y las buenas condiciones para sus próximos pedidos.\n\n¡Cuente con nosotros!`],
    negociacao: [
      `${ola}\n\n${ref} está em aberto há ${d.dias} dias. Sabemos que cada empresa passa por momentos diferentes, e preferimos sempre conversar a deixar a situação se arrastar.\n\nPor isso, gostaríamos de propor uma forma de regularização que caiba no seu caixa — por exemplo, uma entrada e o restante em parcelas. Podemos conversar ainda esta semana? Regularizando, você evita que os encargos aumentem e mantém o seu cadastro em dia conosco.\n\nAguardamos seu contato.`,
      `${ola}\n\n${ref} has been open for ${d.dias} days. We know every business goes through different moments, and we always prefer talking over letting things drag on.\n\nSo we would like to propose a way to settle it that fits your cash flow — for example, a down payment and the rest in installments. Can we talk this week? Settling it keeps charges from growing and keeps your account in good standing with us.\n\nWe look forward to hearing from you.`,
      `${ola}\n\n${ref} está pendiente hace ${d.dias} días. Sabemos que cada empresa vive momentos distintos y siempre preferimos conversar a dejar que la situación se prolongue.\n\nPor eso queremos proponerle una forma de regularización que se ajuste a su caja — por ejemplo, una entrada y el resto en cuotas. ¿Podemos conversar esta semana? Regularizando, evita que los cargos aumenten y mantiene su registro al día con nosotros.\n\nQuedamos atentos a su contacto.`],
    regularizacao: [
      `${ola}\n\nConfirmamos o recebimento referente a ${d.descricao}. Muito obrigado pela regularização!\n\nFicamos felizes em seguir com a nossa parceria. Qualquer necessidade, estamos à disposição.`,
      `${ola}\n\nWe confirm the payment for ${d.descricao}. Thank you very much for settling it!\n\nWe are glad to continue our partnership. Anything you need, we are here to help.`,
      `${ola}\n\nConfirmamos el pago referente a ${d.descricao}. ¡Muchas gracias por la regularización!\n\nNos alegra seguir con nuestra relación. Ante cualquier necesidad, estamos a su disposición.`],
  }
  const i = pt ? 0 : en ? 1 : 2
  return { assunto: `${NOMES[tipo][i]} — ${d.descricao}`, texto: T[tipo][i] + ass }
}

// Links para a PESSOA enviar pelo próprio WhatsApp/e-mail (nada sai do Axioma sozinho)
export function linkWhatsapp(telefone: string | null | undefined, texto: string): string | null {
  const d = String(telefone ?? '').replace(/\D/g, '')
  if (d.length < 10) return null
  const num = d.length <= 11 ? `55${d}` : d // número brasileiro sem DDI ganha o 55
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
}
export const linkEmail = (email: string | null | undefined, assunto: string, texto: string) =>
  email && /.+@.+\..+/.test(email) ? `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}` : null
