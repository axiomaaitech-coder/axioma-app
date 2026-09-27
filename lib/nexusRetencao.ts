// ═══════════════════════════════════════════════════════════════
// Prazos de guarda do Nexus — fonte única pra limpeza automática (cron) e pros
// avisos da tela ("este plano será apagado em X dias — salve em PDF").
// Enquanto o Axioma não tem arquivo de longo prazo em nuvem, o banco guarda
// por um tempo e o usuário/contador é avisado pra salvar antes. Sem import.
// ═══════════════════════════════════════════════════════════════

export const DIAS_GUARDA_PLANO = 90       // plano do José pra empresa (nexus_plano_empresa)
export const DIAS_GUARDA_PAINEL = 180     // painel executivo do dia (nexus_briefing)
export const DIAS_GUARDA_AUDITORIA = 365  // registro de uso de IA (nexus_audit_log)
export const DIAS_AVISO_ANTES = 15        // a partir daqui a tela avisa pra salvar

// Quantos dias faltam pra um registro criado em `criadoEm` ser apagado.
export function diasParaApagar(criadoEm: string, diasGuarda: number, agora = new Date()): number {
  const limite = new Date(criadoEm).getTime() + diasGuarda * 86400000
  return Math.max(0, Math.ceil((limite - agora.getTime()) / 86400000))
}

export const dataLimite = (diasGuarda: number, agora = new Date()) => new Date(agora.getTime() - diasGuarda * 86400000).toISOString()
