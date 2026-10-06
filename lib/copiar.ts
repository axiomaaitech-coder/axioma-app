// Copiar texto com plano B: a API moderna falha em alguns navegadores/contextos
// (aba sem foco, http, permissão negada). Devolve se copiou de verdade — a tela
// nunca deve dizer "copiado" sem ter copiado.
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch { /* tenta o método antigo abaixo */ }
  try {
    const campo = document.createElement('textarea')
    campo.value = texto
    campo.setAttribute('readonly', '')
    campo.style.position = 'fixed'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(campo)
    return ok
  } catch {
    return false
  }
}
