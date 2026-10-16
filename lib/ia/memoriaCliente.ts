// Memória de aprendizagem — lado da TELA. Grava com o acesso da própria pessoa (RLS: só empresas dela,
// operador não). A IA nunca grava: só sugere; aqui é o "sim" da pessoa. Nada é apagado: errado é arquivado.
// Falha de gravação nunca vira "salvo" calado: volta { erro } e vai para o Sentry (padrão reportarFalhaEscrita).
import * as Sentry from '@sentry/nextjs'
import { supabase } from '../supabase'
import type { AreaMemoria, Memoria, SugestaoMemoria } from './memoria'

function falha(operacao: string, motivo: string) {
  Sentry.captureMessage(`[memoria-ia] ${operacao} falhou`, { level: 'warning', extra: { operacao, motivo } })
  return { erro: motivo }
}

// Insere como pendente (única forma que a RLS aceita) e confirma em seguida, registrando quem confirmou
async function gravarConfirmada(empresaId: string, item: { area: AreaMemoria; tipo: string; titulo: string; conteudo: string; valor?: number | null; origem: 'conversa' | 'correcao' | 'manual' }): Promise<{ id?: string; erro?: string }> {
  const { data: u } = await supabase.auth.getUser()
  if (!u?.user) return falha('sessao', 'sem sessão')
  const ins = await supabase.from('ia_memoria_empresa').insert({ empresa_id: empresaId, ...item, status: 'pendente' }).select('id').single()
  if (ins.error || !ins.data) return falha('insert', ins.error?.message ?? 'sem retorno')
  const up = await supabase.from('ia_memoria_empresa').update({ status: 'confirmada', confirmado_por: u.user.id, confirmado_em: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', ins.data.id).eq('empresa_id', empresaId).select('id').single()
  if (up.error || !up.data) return falha('confirmar', up.error?.message ?? 'sem retorno')
  return { id: String(ins.data.id) }
}

const numero = (t: string): number | null => {
  const m = t.match(/R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/)
  return m ? Number(m[1].replace(/\./g, '').replace(',', '.')) : null
}

export const lembrarSugestao = (empresaId: string, s: SugestaoMemoria) =>
  gravarConfirmada(empresaId, { area: s.area, tipo: s.tipo, titulo: s.titulo, conteudo: s.conteudo, valor: numero(s.conteudo), origem: 'conversa' })

export function registrarCorrecao(empresaId: string, area: AreaMemoria, resposta: string, correcao: string) {
  const assunto = resposta.replace(/\s+/g, ' ').trim().slice(0, 80)
  return gravarConfirmada(empresaId, { area, tipo: 'correcao', titulo: `Correção: ${assunto}`.slice(0, 120), conteudo: correcao.trim().slice(0, 1000), valor: numero(correcao), origem: 'correcao' })
}

export const adicionarManual = (empresaId: string, area: AreaMemoria, titulo: string, conteudo: string) =>
  gravarConfirmada(empresaId, { area, tipo: 'fato', titulo: titulo.trim(), conteudo: conteudo.trim(), valor: numero(conteudo), origem: 'manual' })

export async function listarMemorias(empresaId: string, areas: AreaMemoria[]): Promise<{ itens: Memoria[]; erro?: string }> {
  const { data, error } = await supabase.from('ia_memoria_empresa')
    .select('id, area, tipo, titulo, conteudo, valor, status, vale_ate, confirmado_em, created_at')
    .eq('empresa_id', empresaId).eq('status', 'confirmada').in('area', areas)
    .order('confirmado_em', { ascending: false }).limit(200)
  if (error) { Sentry.captureMessage('[memoria-ia] listar falhou', { level: 'warning', extra: { motivo: error.message } }); return { itens: [], erro: error.message } }
  return { itens: (data ?? []) as Memoria[] }
}

export async function editarMemoria(empresaId: string, id: string, conteudo: string): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from('ia_memoria_empresa').update({ conteudo: conteudo.trim().slice(0, 1000), valor: numero(conteudo), updated_at: new Date().toISOString() }).eq('id', id).eq('empresa_id', empresaId).select('id').single()
  return error || !data ? falha('editar', error?.message ?? 'sem retorno') : {}
}

// "Esquecer" = arquivar (a IA para de usar; o registro fica para auditoria)
export async function arquivarMemoria(empresaId: string, id: string): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from('ia_memoria_empresa').update({ status: 'arquivada', updated_at: new Date().toISOString() }).eq('id', id).eq('empresa_id', empresaId).select('id').single()
  return error || !data ? falha('arquivar', error?.message ?? 'sem retorno') : {}
}
