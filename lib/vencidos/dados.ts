// ═══════════════════════════════════════════════════════════════
// AXIOMA OVERDUE INTELLIGENCE — Fase 1: leitura e gravação (cliente do usuário, RLS por empresa).
// Lê os títulos ORIGINAIS (contas_receber / contas_pagar — o Financeiro continua sendo a origem) e o que
// a Fase 1 acrescentou (vencido_caso, vencido_evento, vencido_config, vencido_previsao); passa tudo pelo
// motor puro (./motor). Nunca liquida, apaga ou altera título: só grava caso, evento, promessa e previsão.
// Anti-falha: leitura com retentativa; se algo essencial falhar, `falhou` = true e a tela avisa
// (nunca mostra número incompleto como se fosse o total).
// ═══════════════════════════════════════════════════════════════
import { createClient } from '../supabase/client'
import { comRetentativa } from '../antiFalha'
import * as Sentry from '@sentry/nextjs'
import { reportarFalhaLeitura } from '../erroUiHelpers'
import { hojeISO, somarDiasISO } from '../datas'
import { criarCompromisso } from '../cobrancaHelpers'
import { obterConfigTesouraria, obterPosicaoCaixa, obterCapitalDeGiro } from '../tesourariaHelpers'
import * as M from './motor'

type Rel = { nome?: string | null; nome_fantasia?: string | null; razao_social?: string | null; documento?: string | null }
const um = (r: Rel | Rel[] | null | undefined) => (Array.isArray(r) ? r[0] ?? null : r ?? null)
const nomeDe = (r: Rel | null) => r?.nome_fantasia || r?.nome || r?.razao_social || '—'
const DUPLICADO = '23505'
const reportarFalhaEscrita = (tabela: string, operacao: string, motivo: string) =>
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } })

export type CasoBanco = {
  id: string; dominio: M.Dominio; conta_receber_id: string | null; conta_pagar_id: string | null
  causa: string; causa_origem: string; causa_confirmada: boolean; causa_nota: string | null
  disputa_tipo: string | null; disputa_status: string | null; disputa_valor: number; disputa_prazo: string | null; disputa_responsavel: string | null
  relacao: M.Relacao | null; estrategia: string | null; criticidade: M.Caso['criticidade']; risco_interrupcao: boolean
}
const casoMotor = (c: CasoBanco): M.Caso => ({
  tituloId: (c.conta_receber_id ?? c.conta_pagar_id)!, causa: c.causa, causaConfirmada: c.causa_confirmada, causaOrigem: c.causa_origem,
  disputaStatus: c.disputa_status, disputaValor: Number(c.disputa_valor) || 0, relacao: c.relacao, criticidade: c.criticidade, riscoInterrupcao: c.risco_interrupcao,
})

// Taxa legal (CC art. 406, Lei 14.905/2024) ≈ Selic meta Copom (série 432, ao mês) − IPCA do último mês (série 433).
// Aproximação declarada: a taxa oficial usa a Selic efetiva do mês; a tela mostra a fonte.
async function parametrosLegais(sb: ReturnType<typeof createClient>): Promise<M.ParametrosLegais & { fonte: string | null; ipcaSerie: { data: string; valor: number }[] }> {
  const r = await comRetentativa(() => sb.from('nexus_economic_series').select('serie_codigo, valor, data_referencia').in('serie_codigo', ['432', '433']).order('data_referencia', { ascending: false }).limit(40))
  if (r.error || !r.data?.length) return { taxaLegalMesPct: null, fonte: null, ipcaSerie: [] }
  const selic = r.data.find((x) => x.serie_codigo === '432'), ipca = r.data.filter((x) => x.serie_codigo === '433')
  if (!selic || !ipca.length) return { taxaLegalMesPct: null, fonte: null, ipcaSerie: [] }
  const selicMes = ((1 + Number(selic.valor) / 100) ** (1 / 12) - 1) * 100
  return {
    taxaLegalMesPct: Math.round((selicMes - Number(ipca[0].valor)) * 10000) / 10000,
    fonte: `Selic ${selic.valor}% a.a. (BCB, ${selic.data_referencia}) − IPCA ${ipca[0].valor}% (IBGE, ${ipca[0].data_referencia}) — aproximação da taxa legal`,
    ipcaSerie: ipca.map((x) => ({ data: x.data_referencia, valor: Number(x.valor) })),
  }
}
// IPCA dos meses inteiros depois do vencimento (o que já foi publicado)
const ipcaDesde = (serie: { data: string; valor: number }[], vencimento: string) => serie.filter((x) => x.data.slice(0, 7) > vencimento.slice(0, 7)).map((x) => x.valor)

export type ItemVencido = {
  titulo: M.Titulo; caso: CasoBanco | null; saldo: number; disputa: ReturnType<typeof M.separarDisputa>
  encargos: ReturnType<typeof M.encargos>; dna: M.DNA; risco: ReturnType<typeof M.riscoRecuperacao>
  prioridade: ReturnType<typeof M.prioridadeCobranca>; acao: ReturnType<typeof M.proximaAcao>
  promessa: M.SituacaoPromessa | null; causaSugerida: ReturnType<typeof M.sugerirCausa>
}
export type AnaliseVencidos = {
  hoje: string; limites: number[]; receber: ItemVencido[]; pagar: ItemVencido[]
  agingReceber: ReturnType<typeof M.aging>; agingPagar: ReturnType<typeof M.aging>
  migracao30: ReturnType<typeof M.migracaoAging>; previsao: ReturnType<typeof M.previsaoRecuperacao>
  tesouraria: M.BaseTesouraria; impacto: ReturnType<typeof M.impactoFinanceiro>
  fonteTaxaLegal: string | null; falhou: boolean; avisos: string[]
}

export async function carregarAnaliseVencidos(empresaId: string): Promise<AnaliseVencidos> {
  const sb = createClient()
  const hoje = hojeISO(), desde = somarDiasISO(hoje, -730) // 24 meses de histórico para o DNA
  const [cr, cp, casos, prom, cfg, legal] = await Promise.all([
    comRetentativa(() => sb.from('contas_receber').select('id, descricao, observacoes, status, valor, valor_recebido, valor_desconto, data_vencimento, data_emissao, data_recebimento, taxa_juros, taxa_multa, cliente_id, clientes(nome, nome_fantasia, razao_social, documento)').eq('empresa_id', empresaId).gte('data_vencimento', desde).order('data_vencimento').limit(5000)),
    comRetentativa(() => sb.from('contas_pagar').select('id, descricao, observacoes, status, valor_total, valor_pago, data_vencimento, data_emissao, data_pagamento, taxa_multa_mensal, fornecedor_id, fornecedores(nome, nome_fantasia, razao_social, documento)').eq('empresa_id', empresaId).gte('data_vencimento', desde).order('data_vencimento').limit(5000)),
    comRetentativa(() => sb.from('vencido_caso').select('*').eq('empresa_id', empresaId).limit(5000)),
    comRetentativa(() => sb.from('cobranca_compromissos').select('id, conta_id, valor_compromissado, data_compromissada, status, recebido_na_promessa, renegociada_de').eq('empresa_id', empresaId).limit(5000)),
    comRetentativa(() => sb.from('vencido_config').select('faixas, parametros').eq('empresa_id', empresaId).maybeSingle()),
    parametrosLegais(sb),
  ])
  const avisos: string[] = []
  for (const [nome, r] of [['contas a receber', cr], ['contas a pagar', cp]] as const) if (r.error) reportarFalhaLeitura(`vencidos:${nome}`, new Error(r.error.message))
  // Tabelas da Fase 1 ainda não criadas no banco não derrubam a análise: segue sem casos/config e avisa.
  if (casos.error) avisos.push('casos de cobrança indisponíveis (causa/disputa não carregadas)')
  if (prom.error) avisos.push('promessas indisponíveis')
  if (!legal.taxaLegalMesPct && legal.taxaLegalMesPct !== 0) avisos.push('taxa legal (Selic − IPCA) indisponível: juros só pelo contrato')
  const limites = (cfg.data?.faixas as number[] | undefined) ?? M.FAIXAS_PADRAO

  const receberT: M.Titulo[] = (cr.data ?? []).map((c) => {
    const cli = um(c.clientes as Rel | Rel[] | null)
    return { id: c.id, empresaId, dominio: 'receber', contraparteId: c.cliente_id, contraparteNome: nomeDe(cli), documento: cli?.documento ?? null, valor: Number(c.valor) || 0, quitado: Number(c.valor_recebido) || 0, desconto: Number(c.valor_desconto) || 0, vencimento: c.data_vencimento, emissao: c.data_emissao, quitacao: c.data_recebimento, status: c.status, taxaMultaPct: c.taxa_multa, taxaJurosMesPct: c.taxa_juros }
  })
  const pagarT: M.Titulo[] = (cp.data ?? []).map((c) => {
    const f = um(c.fornecedores as Rel | Rel[] | null)
    return { id: c.id, empresaId, dominio: 'pagar', contraparteId: c.fornecedor_id, contraparteNome: nomeDe(f), documento: f?.documento ?? null, valor: Number(c.valor_total) || 0, quitado: Number(c.valor_pago) || 0, vencimento: c.data_vencimento, emissao: c.data_emissao, quitacao: c.data_pagamento, status: c.status, taxaJurosMesPct: c.taxa_multa_mensal }
  })
  const textoDe = new Map([...(cr.data ?? []), ...(cp.data ?? [])].map((c) => [c.id, `${c.descricao ?? ''} ${c.observacoes ?? ''}`]))
  const casoDe = new Map(((casos.data ?? []) as CasoBanco[]).map((c) => [(c.conta_receber_id ?? c.conta_pagar_id)!, c]))
  const promessas: M.Promessa[] = (prom.data ?? []).map((p) => ({ id: p.id, tituloId: p.conta_id, valor: Number(p.valor_compromissado) || 0, data: p.data_compromissada, status: p.status, recebidoNaPromessa: p.recebido_na_promessa, renegociadaDe: p.renegociada_de }))
  const reneg = new Set(promessas.map((p) => p.renegociadaDe).filter(Boolean) as string[])

  // Tesouraria (origem única do caixa): posição, reserva mínima e capital de giro já calculados lá
  const cfgT = await obterConfigTesouraria(empresaId).catch(() => null)
  const reservaMinima = Number(cfgT?.reserva_minima ?? 0)
  const [posicao, giro] = await Promise.all([obterPosicaoCaixa(empresaId, hoje, reservaMinima), obterCapitalDeGiro(empresaId).catch(() => null)])
  if (posicao.falhou) avisos.push('posição de caixa indisponível: simulações usam caixa zero')

  const montar = (lista: M.Titulo[], totalVencidoPagar = 0): ItemVencido[] => {
    const porContraparte = new Map<string, M.Titulo[]>()
    for (const t of lista) { const k = t.contraparteId ?? `sem:${t.contraparteNome}`; porContraparte.set(k, [...(porContraparte.get(k) ?? []), t]) }
    const dnaCache = new Map<string, M.DNA>()
    const vencidos = lista.filter((t) => M.estaVencido(t, hoje))
    const maiorSaldo = Math.max(0, ...vencidos.map((t) => M.saldoDoTitulo(t, hoje)))
    return vencidos.map((t) => {
      const k = t.contraparteId ?? `sem:${t.contraparteNome}`
      const hist = porContraparte.get(k) ?? []
      if (!dnaCache.has(k)) { const ids = new Set(hist.map((h) => h.id)); dnaCache.set(k, M.dnaFinanceiro(hist, promessas.filter((p) => ids.has(p.tituloId)), hoje)) }
      const dna = dnaCache.get(k)!, banco = casoDe.get(t.id) ?? null, caso = banco ? casoMotor(banco) : null
      const saldo = M.saldoDoTitulo(t, hoje)
      const ultimaPromessa = promessas.filter((p) => p.tituloId === t.id).sort((a, b) => b.data.localeCompare(a.data))[0]
      const promessa = ultimaPromessa ? M.situacaoPromessa(ultimaPromessa, t, hoje, reneg).situacao : null
      const risco = M.riscoRecuperacao(t, dna, hoje, caso)
      const prioridade = t.dominio === 'receber'
        ? M.prioridadeCobranca(t, risco.score, hoje, { maiorSaldo, promessaVencida: promessa === 'vencida_sem_pagamento', caixaPressionado: posicao.totalDisponivel < reservaMinima, limites }, caso)
        : M.prioridadeFornecedor(t, hoje, { caixaDisponivel: posicao.totalDisponivel, totalVencidoPagar }, caso)
      return {
        titulo: t, caso: banco, saldo, disputa: M.separarDisputa(saldo, caso),
        encargos: M.encargos(t, hoje, { ...legal, ipcaMesesPct: ipcaDesde(legal.ipcaSerie, t.vencimento) }, caso),
        dna, risco, prioridade, promessa, causaSugerida: M.sugerirCausa(textoDe.get(t.id) ?? '', caso),
        acao: M.proximaAcao({ titulo: t, hoje, risco: risco.score, dna, caso, promessa, caixaDisponivel: posicao.totalDisponivel }),
      }
    }).sort((a, b) => b.prioridade.score - a.prioridade.score)
  }
  const totalVencidoPagar = pagarT.filter((t) => M.estaVencido(t, hoje)).reduce((s, t) => s + M.saldoDoTitulo(t, hoje), 0)
  const receber = montar(receberT), pagar = montar(pagarT, totalVencidoPagar)
  const previsao = M.previsaoRecuperacao(receber.map((i) => ({ titulo: i.titulo, risco: i.risco.score, caso: i.caso ? casoMotor(i.caso) : null })), hoje)
  const soma = (l: M.Titulo[], ate: string) => l.filter((t) => !M.FECHADOS.has(String(t.status ?? '').toLowerCase()) && t.vencimento >= hoje && t.vencimento <= ate).reduce((s, t) => s + M.saldoDoTitulo(t, hoje), 0)
  const em30 = somarDiasISO(hoje, 30)
  const tesouraria: M.BaseTesouraria = {
    caixaDisponivel: posicao.totalDisponivel, reservaMinima, vencidoReceber: previsao.saldoBase, vencidoPagar: totalVencidoPagar,
    pagarCritico: pagar.filter((i) => i.caso?.criticidade === 'critica' || i.caso?.risco_interrupcao).reduce((s, i) => s + i.saldo, 0),
    aPagarNoPrazo: soma(pagarT, em30), aReceberNoPrazo: soma(receberT, em30), capitalDeGiro: giro?.capitalDeGiro ?? null,
  }
  return {
    hoje, limites, receber, pagar, agingReceber: M.aging(receberT, hoje, limites), agingPagar: M.aging(pagarT, hoje, limites),
    migracao30: M.migracaoAging(receberT, somarDiasISO(hoje, -30), hoje, limites), previsao, tesouraria,
    impacto: M.impactoFinanceiro(tesouraria, previsao.horizontes.find((h) => h.horizonteDias === 30)?.valor ?? 0),
    fonteTaxaLegal: legal.fonte, falhou: !!(cr.error || cp.error), avisos,
  }
}

// ─── Gravações (idempotentes; nenhuma mexe no título) ───
type Resultado<T = undefined> = { ok: true; valor?: T } | { ok: false; erro: string }

export async function registrarEvento(empresaId: string, casoId: string, tipo: string, dados: Record<string, unknown>, origem: 'usuario' | 'ia' | 'sistema' = 'usuario', chave?: string): Promise<Resultado> {
  const { error } = await createClient().from('vencido_evento').insert({ empresa_id: empresaId, caso_id: casoId, tipo, dados, origem, chave_idempotencia: chave ?? null })
  if (error?.code === DUPLICADO) return { ok: true } // mesmo pedido repetido (clique duplo, reenvio): já registrado
  if (error) { reportarFalhaEscrita('vencido_evento', 'insert', error.message); return { ok: false, erro: error.message } }
  return { ok: true }
}

// Um caso por título: cria na primeira vez, atualiza depois. Corrida de dois cliques cai no índice único e vira update.
export async function salvarCaso(empresaId: string, dominio: M.Dominio, tituloId: string, campos: Partial<Omit<CasoBanco, 'id' | 'dominio' | 'conta_receber_id' | 'conta_pagar_id'>>, motivo?: string): Promise<Resultado<string>> {
  const sb = createClient(), col = dominio === 'receber' ? 'conta_receber_id' : 'conta_pagar_id'
  if (campos.disputa_valor != null && (!(Number(campos.disputa_valor) >= 0))) return { ok: false, erro: 'valor contestado inválido' }
  const achar = () => sb.from('vencido_caso').select('id').eq('empresa_id', empresaId).eq(col, tituloId).maybeSingle()
  let { data: atual, error } = await comRetentativa(achar)
  if (error) return { ok: false, erro: error.message }
  let id = atual?.id as string | undefined
  if (!id) {
    const ins = await sb.from('vencido_caso').insert({ empresa_id: empresaId, dominio, [col]: tituloId, ...campos }).select('id').single()
    if (!ins.error) {
      await registrarEvento(empresaId, ins.data.id, 'nota', { criado: true, campos, motivo: motivo ?? null })
      return { ok: true, valor: ins.data.id }
    }
    if (ins.error.code !== DUPLICADO) { reportarFalhaEscrita('vencido_caso', 'insert', ins.error.message); return { ok: false, erro: ins.error.message } }
    // outra aba criou o mesmo caso ao mesmo tempo: segue como atualização
    atual = (await achar()).data
    id = atual?.id
    if (!id) return { ok: false, erro: 'caso não encontrado após criação concorrente' }
  }
  const up = await sb.from('vencido_caso').update(campos).eq('id', id!).eq('empresa_id', empresaId).select('id')
  if (up.error || !up.data?.length) { const m = up.error?.message ?? '0 linhas (RLS?)'; reportarFalhaEscrita('vencido_caso', 'update', m); return { ok: false, erro: m } }
  const tipo = 'causa' in campos ? 'causa' : 'disputa_status' in campos || 'disputa_valor' in campos ? 'disputa' : 'criticidade' in campos ? 'estrategia' : 'nota'
  await registrarEvento(empresaId, id!, tipo, { campos, motivo: motivo ?? null })
  return { ok: true, valor: id! }
}

// Promessa: reusa cobranca_compromissos; guarda quanto já estava pago (cumprimento = o que entrar depois).
export async function registrarPromessa(userId: string, empresaId: string, titulo: M.Titulo, p: { valor: number; data: string; canal?: string; responsavel?: string; renegociaDe?: string }): Promise<Resultado> {
  if (titulo.dominio !== 'receber') return { ok: false, erro: 'promessa é de cliente (a receber)' }
  if (!(p.valor > 0) || p.valor > M.saldoDoTitulo(titulo, hojeISO()) + 0.004) return { ok: false, erro: 'valor prometido deve ser maior que zero e até o saldo' }
  const r = await criarCompromisso(userId, empresaId, { conta_id: titulo.id, cliente_id: titulo.contraparteId, tipo: 'promessa', valor_original: M.saldoDoTitulo(titulo, hojeISO()), valor_compromissado: p.valor, data_compromissada: p.data, responsavel: p.responsavel ?? null, ...({ canal: p.canal ?? null, recebido_na_promessa: titulo.quitado, renegociada_de: p.renegociaDe ?? null } as object) })
  return r.erro ? { ok: false, erro: r.erro } : { ok: true }
}

// Negociação: proposta (qualquer pessoa ou a IA, como SUGESTÃO) → decisão só de dono/sócio/admin (o banco confere).
export async function proporNegociacao(empresaId: string, casoId: string, simulacao: ReturnType<typeof M.simularNegociacao>, origem: 'usuario' | 'ia' = 'usuario') {
  return registrarEvento(empresaId, casoId, 'negociacao_proposta', { ...simulacao }, origem)
}
export async function decidirNegociacao(empresaId: string, casoId: string, propostaId: string, aprovar: boolean, motivo: string) {
  if (!motivo.trim()) return { ok: false as const, erro: 'informe o motivo da decisão' }
  return registrarEvento(empresaId, casoId, aprovar ? 'negociacao_aprovada' : 'negociacao_recusada', { proposta_id: propostaId, motivo: motivo.trim() }, 'usuario', `decisao:${propostaId}`)
}

// Foto diária da previsão (uma por empresa/dia/horizonte — repetir não duplica)
export async function registrarPrevisaoDoDia(empresaId: string, a: Pick<AnaliseVencidos, 'hoje' | 'previsao'>): Promise<void> {
  if (!Object.keys(a.previsao.titulos).length) return
  const linhas = a.previsao.horizontes.map((h) => ({ empresa_id: empresaId, data_base: a.hoje, horizonte_dias: h.horizonteDias, valor_previsto: h.valor, saldo_base: a.previsao.saldoBase, titulos: a.previsao.titulos, metodo: a.previsao.metodo.slice(0, 60) }))
  const { error } = await createClient().from('vencido_previsao').upsert(linhas, { onConflict: 'empresa_id,data_base,horizonte_dias', ignoreDuplicates: true })
  if (error) reportarFalhaEscrita('vencido_previsao', 'insert', error.message)
}
export async function historicoPrecisao(empresaId: string, a: Pick<AnaliseVencidos, 'hoje' | 'receber'>) {
  const r = await comRetentativa(() => createClient().from('vencido_previsao').select('data_base, horizonte_dias, valor_previsto, titulos').eq('empresa_id', empresaId).order('data_base', { ascending: false }).limit(300))
  if (r.error) return { falhou: true, itens: [] }
  // saldo de hoje de cada título (os que saíram do vencido por pagamento têm saldo 0 aqui)
  const ids = new Set((r.data ?? []).flatMap((x) => Object.keys(x.titulos as object)))
  const sb = createClient(), idsLista = [...ids]
  const saldos = new Map<string, number>()
  for (let i = 0; i < idsLista.length; i += 200) {
    const q = await comRetentativa(() => sb.from('contas_receber').select('id, valor, valor_recebido, valor_desconto, status').in('id', idsLista.slice(i, i + 200)))
    if (q.error) return { falhou: true, itens: [] }
    for (const c of q.data ?? []) if (!/cancel/i.test(String(c.status ?? ''))) saldos.set(c.id, Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_desconto) || 0) - (Number(c.valor_recebido) || 0)))
  }
  const itens = (r.data ?? []).filter((x) => somarDiasISO(x.data_base, x.horizonte_dias) <= a.hoje)
    .map((x) => ({ dataBase: x.data_base as string, horizonte: x.horizonte_dias as number, ...M.precisaoPrevisao(Number(x.valor_previsto), x.titulos as Record<string, number>, saldos) }))
  return { falhou: false, itens }
}

export async function salvarConfigVencidos(empresaId: string, faixas: number[], parametros: Record<string, unknown> = {}): Promise<Resultado> {
  try { M.rotulosFaixas(faixas) } catch (e) { return { ok: false, erro: (e as Error).message } }
  const { error } = await createClient().from('vencido_config').upsert({ empresa_id: empresaId, faixas: [...new Set(faixas)].sort((a, b) => a - b), parametros, atualizado_em: new Date().toISOString() })
  if (error) { reportarFalhaEscrita('vencido_config', 'upsert', error.message); return { ok: false, erro: error.message } }
  return { ok: true }
}
