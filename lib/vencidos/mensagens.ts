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
  const T: Record<TipoMensagem, [string, string, string]> = {
    lembrete: [
      `${ola}\n\nPassando para lembrar do pagamento de ${ref}. Se já pagou, por favor desconsidere esta mensagem.`,
      `${ola}\n\nJust a reminder about the payment of ${ref}. If you have already paid, please disregard this message.`,
      `${ola}\n\nLe recordamos el pago de ${ref}. Si ya pagó, por favor ignore este mensaje.`],
    aviso_vencimento: [
      `${ola}\n\nNão identificamos ainda o pagamento de ${ref}, que venceu há ${d.dias} dia(s). Pode ter sido só um descuido — se precisar do boleto ou do Pix novamente, é só responder esta mensagem.`,
      `${ola}\n\nWe have not yet received the payment of ${ref}, due ${d.dias} day(s) ago. It may just be an oversight — if you need the payment slip or Pix again, just reply to this message.`,
      `${ola}\n\nAún no identificamos el pago de ${ref}, vencido hace ${d.dias} día(s). Puede haber sido un descuido — si necesita el boleto o el Pix de nuevo, responda este mensaje.`],
    cobranca_cordial: [
      `${ola}\n\nConsta em aberto ${ref}, com ${d.dias} dias de atraso. Podemos contar com a regularização? Se houver qualquer problema com a cobrança, nos avise para resolvermos juntos.`,
      `${ola}\n\n${ref} is still open, ${d.dias} days overdue. Can we count on it being settled? If there is any issue with the bill, let us know so we can solve it together.`,
      `${ola}\n\nFigura pendiente ${ref}, con ${d.dias} días de atraso. ¿Podemos contar con la regularización? Si hay algún problema con el cobro, avísenos para resolverlo juntos.`],
    pedido_previsao: [
      `${ola}\n\n${ref} segue em aberto há ${d.dias} dias. Poderia nos informar uma data prevista para o pagamento? Assim organizamos nosso fluxo e evitamos novas cobranças.`,
      `${ola}\n\n${ref} has been open for ${d.dias} days. Could you let us know an expected payment date? That helps us plan and avoid further reminders.`,
      `${ola}\n\n${ref} sigue pendiente hace ${d.dias} días. ¿Podría informarnos una fecha prevista de pago? Así organizamos nuestro flujo y evitamos nuevos avisos.`],
    confirmacao_promessa: [
      `${ola}\n\nConforme combinado, aguardamos o pagamento${d.promessaValor ? ` de ${d.promessaValor}` : ''} referente a ${ref}${d.promessaData ? ` até ${d.promessaData}` : ''}. Obrigado!`,
      `${ola}\n\nAs agreed, we look forward to the payment${d.promessaValor ? ` of ${d.promessaValor}` : ''} for ${ref}${d.promessaData ? ` by ${d.promessaData}` : ''}. Thank you!`,
      `${ola}\n\nComo acordamos, esperamos el pago${d.promessaValor ? ` de ${d.promessaValor}` : ''} referente a ${ref}${d.promessaData ? ` hasta ${d.promessaData}` : ''}. ¡Gracias!`],
    negociacao: [
      `${ola}\n\n${ref} está em aberto há ${d.dias} dias. Queremos encontrar uma forma de regularizar que caiba no seu momento. Podemos conversar sobre uma proposta de pagamento?`,
      `${ola}\n\n${ref} has been open for ${d.dias} days. We would like to find a way to settle it that fits your situation. Can we talk about a payment proposal?`,
      `${ola}\n\n${ref} está pendiente hace ${d.dias} días. Queremos encontrar una forma de regularizar que se ajuste a su momento. ¿Podemos conversar sobre una propuesta de pago?`],
    regularizacao: [
      `${ola}\n\nConfirmamos o recebimento referente a ${d.descricao}. Obrigado pela regularização!`,
      `${ola}\n\nWe confirm the payment for ${d.descricao}. Thank you for settling it!`,
      `${ola}\n\nConfirmamos el pago referente a ${d.descricao}. ¡Gracias por la regularización!`],
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
