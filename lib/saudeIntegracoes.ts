// ═══════════════════════════════════════════════════════════════
// Saúde das integrações (2026-11-12, item 3 da pesquisa "CFO no mundo": a maior reclamação do mercado é integração
// que para sem avisar — banco desconectado, importação falhando). Um painel com cada ligação do Axioma, a última vez
// que funcionou e o que fazer. Só lê; leitura que falha vira "sem_dado" com aviso, nunca "ok".
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'

type T3 = { pt: string; en: string; es: string }
export type StatusSaude = 'ok' | 'atencao' | 'falha' | 'sem_dado' | 'nao_usa'
export type ItemSaude = { id: string; status: StatusSaude; titulo: T3; detalhe: T3; ultimaVez: string | null; rota: string; acao: T3 }
const t = (pt: string, en: string, es: string): T3 => ({ pt, en, es })
const HORA = 3600000, DIA = 86400000

const PRINCIPAIS = new Set(['openai', 'anthropic'])
const ERRO_BANCO = new Set(['LOGIN_ERROR', 'OUTDATED', 'ERROR', 'WAITING_USER_INPUT', 'WAITING_USER_ACTION'])

/** Regra da IA: a última resposta diz quem respondeu; reserva gratuita = atenção; não respondeu = falha. */
export function statusIA(ultimas: { provedor?: string | null; respondeu?: boolean | null }[]): StatusSaude {
  if (!ultimas.length) return 'nao_usa'
  const u = ultimas[0]
  if (u.respondeu === false) return 'falha'
  return PRINCIPAIS.has(String(u.provedor ?? '').toLowerCase()) ? 'ok' : 'atencao'
}
/** Regra do banco: erro de conexão = falha; sem sincronizar há mais de 3 dias = atenção. */
export function statusBanco(conexoes: { status?: string | null; updated_at?: string | null }[], agora: number): StatusSaude {
  if (!conexoes.length) return 'nao_usa'
  if (conexoes.some((c) => ERRO_BANCO.has(String(c.status ?? '').toUpperCase()))) return 'falha'
  const ultima = Math.max(...conexoes.map((c) => Date.parse(String(c.updated_at ?? '')) || 0))
  return agora - ultima > 3 * DIA ? 'atencao' : 'ok'
}

export async function carregarSaudeIntegracoes(sb: SupabaseClient, empresaId: string, agora = Date.now()): Promise<ItemSaude[]> {
  const desde30 = new Date(agora - 30 * DIA).toISOString(), ha1h = new Date(agora - HORA).toISOString()
  const [ia, of, imp, rastFalhou, rastParado, ass] = await Promise.all([
    sb.from('nexus_audit_log').select('created_at, parametros').eq('empresa_id', empresaId).eq('acao', 'ia.motor').order('created_at', { ascending: false }).limit(20),
    sb.from('open_finance').select('conector_nome, status, updated_at').eq('empresa_id', empresaId),
    sb.from('importacoes').select('nome_arquivo, status, linhas_erro, mensagem_erro, created_at').eq('empresa_id', empresaId).gte('created_at', desde30).order('created_at', { ascending: false }).limit(50),
    sb.from('rastreio_destino').select('destino, ultimo_erro, executado_em', { count: 'exact' }).eq('empresa_id', empresaId).eq('status', 'falhou').order('executado_em', { ascending: false }).limit(1),
    sb.from('rastreio_movimentacao').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('status', 'pendente').lt('criado_em', ha1h),
    sb.from('assinaturas').select('status, fim').eq('empresa_id', empresaId).order('fim', { ascending: false }).limit(1),
  ])
  const itens: ItemSaude[] = []
  const semDado = (id: string, titulo: T3, rota: string, acao: T3): ItemSaude => ({ id, status: 'sem_dado', titulo, detalhe: t('Não foi possível conferir agora. Recarregue a página.', 'Could not check now. Reload the page.', 'No se pudo verificar ahora. Recargue la página.'), ultimaVez: null, rota, acao })
  const quando = (iso: string | null | undefined) => (iso ? String(iso) : null)

  // 1. Inteligência Axioma
  {
    const titulo = t('Inteligência Axioma', 'Axioma Intelligence', 'Inteligencia Axioma'), rota = '/uso-ia', acao = t('Ver uso da IA ›', 'See AI usage ›', 'Ver uso de la IA ›')
    if (ia.error) itens.push(semDado('ia', titulo, rota, acao))
    else {
      const linhas = (ia.data ?? []).map((r) => ({ quando: r.created_at as string, ...((r.parametros ?? {}) as { provedor?: string; modelo?: string; respondeu?: boolean }) }))
      const st = statusIA(linhas), u = linhas[0]
      const prov = u?.provedor === 'gemini' ? 'Gemini (reserva gratuita)' : u?.provedor === 'openai' ? 'OpenAI' : u?.provedor === 'anthropic' ? 'Anthropic' : u?.provedor ?? '—'
      itens.push({ id: 'ia', titulo, rota, acao, status: st, ultimaVez: quando(u?.quando),
        detalhe: st === 'nao_usa' ? t('Ainda sem perguntas à IA nesta Empresa.', 'No AI questions in this company yet.', 'Aún sin preguntas a la IA en esta empresa.')
          : st === 'falha' ? t('A última pergunta ficou sem resposta.', 'The last question got no answer.', 'La última pregunta quedó sin respuesta.')
          : st === 'atencao' ? t(`Respondendo pela ${prov}: a IA principal (OpenAI/Anthropic) está sem crédito ou fora. As respostas continuam, com modelo mais simples.`, `Answering through ${prov}: the main AI (OpenAI/Anthropic) is out of credit or down. Answers continue with a simpler model.`, `Respondiendo por ${prov}: la IA principal (OpenAI/Anthropic) está sin crédito o caída. Las respuestas siguen, con un modelo más simple.`)
          : t(`Respondendo normalmente pela ${prov}${u?.modelo ? ` (${u.modelo})` : ''}.`, `Answering normally through ${prov}${u?.modelo ? ` (${u.modelo})` : ''}.`, `Respondiendo normalmente por ${prov}${u?.modelo ? ` (${u.modelo})` : ''}.`) })
    }
  }
  // 2. Banco (Open Finance)
  {
    const titulo = t('Banco (Open Finance)', 'Bank (Open Finance)', 'Banco (Open Finance)'), rota = '/open-finance', acao = t('Abrir Open Finance ›', 'Open Open Finance ›', 'Abrir Open Finance ›')
    if (of.error) itens.push(semDado('banco', titulo, rota, acao))
    else {
      const con = (of.data ?? []) as { conector_nome: string | null; status: string | null; updated_at: string | null }[]
      const st = statusBanco(con, agora)
      const ultima = con.map((c) => c.updated_at).filter(Boolean).sort().pop() ?? null
      const comErro = con.filter((c) => ERRO_BANCO.has(String(c.status ?? '').toUpperCase())).map((c) => c.conector_nome ?? '—')
      itens.push({ id: 'banco', titulo, rota, acao, status: st, ultimaVez: ultima,
        detalhe: st === 'nao_usa' ? t('Nenhum banco conectado. Os lançamentos são feitos à mão ou por importação de extrato.', 'No bank connected. Entries are made by hand or by statement import.', 'Ningún banco conectado. Los registros se hacen a mano o importando extractos.')
          : st === 'falha' ? t(`Conexão com problema: ${comErro.join(', ')}. Reconecte para voltar a receber o extrato.`, `Connection problem: ${comErro.join(', ')}. Reconnect to receive the statement again.`, `Conexión con problema: ${comErro.join(', ')}. Reconecte para volver a recibir el extracto.`)
          : st === 'atencao' ? t('Sem sincronizar há mais de 3 dias: o extrato pode estar desatualizado.', 'Not synced for over 3 days: the statement may be outdated.', 'Sin sincronizar hace más de 3 días: el extracto puede estar desactualizado.')
          : t(`${con.length} conexão(ões) sincronizando.`, `${con.length} connection(s) syncing.`, `${con.length} conexión(es) sincronizando.`) })
    }
  }
  // 3. Importação de documentos
  {
    const titulo = t('Importação de documentos', 'Document import', 'Importación de documentos'), rota = '/importar-documentos', acao = t('Abrir Importar ›', 'Open Import ›', 'Abrir Importar ›')
    if (imp.error) itens.push(semDado('importacao', titulo, rota, acao))
    else {
      const l = (imp.data ?? []) as { nome_arquivo: string; status: string; linhas_erro: number | null; created_at: string }[]
      const falhas = l.filter((x) => ['erro', 'falhou', 'falha'].includes(String(x.status).toLowerCase()))
      const comErro = l.filter((x) => Number(x.linhas_erro) > 0)
      const st: StatusSaude = !l.length ? 'nao_usa' : falhas.length ? 'falha' : comErro.length ? 'atencao' : 'ok'
      itens.push({ id: 'importacao', titulo, rota, acao, status: st, ultimaVez: l[0]?.created_at ?? null,
        detalhe: st === 'nao_usa' ? t('Nenhuma importação nos últimos 30 dias.', 'No imports in the last 30 days.', 'Ninguna importación en los últimos 30 días.')
          : st === 'falha' ? t(`${falhas.length} importação(ões) falharam nos últimos 30 dias (ex.: ${falhas[0].nome_arquivo}).`, `${falhas.length} import(s) failed in the last 30 days (e.g. ${falhas[0].nome_arquivo}).`, `${falhas.length} importación(es) fallaron en los últimos 30 días (ej.: ${falhas[0].nome_arquivo}).`)
          : st === 'atencao' ? t(`${comErro.length} importação(ões) com linhas que não entraram. Confira o detalhe de cada uma.`, `${comErro.length} import(s) with rows that did not go in. Check each one.`, `${comErro.length} importación(es) con filas que no entraron. Revise cada una.`)
          : t(`${l.length} importação(ões) nos últimos 30 dias, todas sem erro.`, `${l.length} import(s) in the last 30 days, all without errors.`, `${l.length} importación(es) en los últimos 30 días, todas sin error.`) })
    }
  }
  // 4. Motor de rastreabilidade (cada lançamento chegando à Contabilidade, Fluxo, DRE…)
  {
    const titulo = t('Motor de rastreabilidade', 'Traceability engine', 'Motor de trazabilidad'), rota = '/rastreabilidade', acao = t('Abrir Rastreabilidade ›', 'Open Traceability ›', 'Abrir Trazabilidad ›')
    if (rastFalhou.error || rastParado.error) itens.push(semDado('rastreio', titulo, rota, acao))
    else {
      const falhou = rastFalhou.count ?? 0, parado = rastParado.count ?? 0
      const u = (rastFalhou.data ?? [])[0] as { destino: string; ultimo_erro: string | null; executado_em: string | null } | undefined
      const st: StatusSaude = falhou ? 'falha' : parado ? 'atencao' : 'ok'
      itens.push({ id: 'rastreio', titulo, rota, acao, status: st, ultimaVez: u?.executado_em ?? null,
        detalhe: falhou ? t(`${falhou} lançamento(s) não chegaram ao destino (ex.: ${u?.destino ?? '—'}). O Guardião tenta de novo; se continuar, abra a Rastreabilidade.`, `${falhou} entry(ies) did not reach their destination (e.g. ${u?.destino ?? '—'}). The Guardian retries; if it persists, open Traceability.`, `${falhou} registro(s) no llegaron a su destino (ej.: ${u?.destino ?? '—'}). El Guardián reintenta; si sigue, abra Trazabilidad.`)
          : parado ? t(`${parado} lançamento(s) esperando há mais de 1 hora.`, `${parado} entry(ies) waiting for over 1 hour.`, `${parado} registro(s) esperando hace más de 1 hora.`)
          : t('Todo lançamento chegou à Contabilidade, ao Fluxo e à DRE.', 'Every entry reached Accounting, Cash Flow and the income statement.', 'Todo registro llegó a Contabilidad, Flujo y Estado de resultados.') })
    }
  }
  // 5. Assinatura
  {
    const titulo = t('Assinatura', 'Subscription', 'Suscripción'), rota = '/planos', acao = t('Ver planos ›', 'See plans ›', 'Ver planes ›')
    if (ass.error) itens.push(semDado('assinatura', titulo, rota, acao))
    else {
      const a = (ass.data ?? [])[0] as { status: string; fim: string | null } | undefined
      const fim = a?.fim ? Date.parse(a.fim) : null
      const st: StatusSaude = !a ? 'nao_usa' : !['ativo', 'ativa', 'active', 'trialing'].includes(String(a.status).toLowerCase()) ? 'falha' : fim != null && fim - agora < 7 * DIA ? 'atencao' : 'ok'
      const dataFim = a?.fim ? a.fim.slice(0, 10).split('-').reverse().join('/') : '—'
      itens.push({ id: 'assinatura', titulo, rota, acao, status: st, ultimaVez: null,
        detalhe: !a ? t('Nenhuma assinatura por cartão nesta Empresa (acesso liberado pela conta).', 'No card subscription for this company (access granted by the account).', 'Ninguna suscripción con tarjeta en esta empresa (acceso liberado por la cuenta).')
          : st === 'falha' ? t(`Assinatura ${a.status}: o acesso pode ser bloqueado.`, `Subscription ${a.status}: access may be blocked.`, `Suscripción ${a.status}: el acceso puede bloquearse.`)
          : st === 'atencao' ? t(`Vence em ${dataFim}.`, `Ends on ${dataFim}.`, `Vence el ${dataFim}.`)
          : t(`Ativa até ${dataFim}.`, `Active until ${dataFim}.`, `Activa hasta ${dataFim}.`) })
    }
  }
  return itens
}
