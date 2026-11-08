// ═══════════════════════════════════════════════════════════════
// PORTAS "PESSOAS" da Central Intelligence (RH, 2026-11-08). Leem com o cliente do USUÁRIO: a RLS do RH
// (rh_pode v2) decide o que a pessoa vê, e a porta confere antes para dizer "sem liberação" em vez de "zero".
// Nunca devolvem CPF, endereço, saúde nem salário de uma pessoa: só contagens, nomes (para quem pode ver o RH)
// e somas/médias de salário (só para quem tem liberação de salário). As contas são as funções puras abaixo,
// testadas em scripts/check-rh-ia.mts. Contrato padrão: lib/financeiro/contrato.
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { lerTodas } from './lerTodas'
import { hojeISO, somarDiasISO } from './datas'
import { falhou, resultado, reais, centavos, type ResultadoFinanceiro } from './financeiro/contrato'
import { definicao } from './financeiro/semantica'

type Esquema = { type: 'object'; additionalProperties: false; properties: Record<string, unknown>; required: string[] }
const obj = (properties: Record<string, unknown>): Esquema => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) })

export const FERRAMENTAS_RH: { name: string; description: string; input_schema: Esquema; strict: true }[] = [
  { name: 'rh_pessoas', strict: true, description: 'RH: quantas pessoas a empresa tem por situação (ativo, pré-admissão, afastado, desligado), ativos por departamento e por cargo, admissões e desligamentos nos últimos 30 dias, contratos de experiência que terminam em 30 dias ou já venceram (com nome e data) e ativos sem cargo ou sem departamento. Use para "quantos funcionários temos", "quem está em experiência", "quantos no comercial". Não traz CPF, endereço nem salário.', input_schema: obj({}) },
  { name: 'rh_estrutura', strict: true, description: 'RH: a estrutura cadastrada — se os dados do empregador do eSocial estão preenchidos, quantas filiais, lotações, departamentos e cargos — e o que falta arrumar (pendências). Use para "o RH está configurado?", "quantos departamentos/cargos temos".', input_schema: obj({}) },
  { name: 'rh_alertas', strict: true, description: 'RH: o Radar de Risco Trabalhista — o mesmo da tela Painel do RH. Experiência vencida ou terminando, prazo determinado acabando, admissão não enviada ao eSocial, quem trabalha sem exame admissional, documentos obrigatórios pendentes, ativos sem cargo ou salário, e obrigações pelo tamanho da empresa (ponto acima de 20, cota PCD e igualdade salarial a partir de 100), cada um com a base legal e os nomes. Use para "o que preciso resolver no RH", "tem algum risco trabalhista".', input_schema: obj({}) },
  { name: 'rh_salarios', strict: true, description: 'RH: soma dos salários-base mensais vigentes hoje dos contratos ativos, média, total por departamento e quantos não têm salário cadastrado. Só para quem tem liberação de salário no RH. NÃO é a folha: não inclui encargos (INSS patronal, FGTS), benefícios, horas extras nem provisões. Use para "quanto pago de salário", "custo de salários por departamento".', input_schema: obj({}) },
]
export const NOMES_FERRAMENTAS_RH = new Set(FERRAMENTAS_RH.map((f) => f.name))

// ─── contas puras (testadas) ───
export type Colab = { id: string; nome: string; nome_social?: string | null; situacao: string }
export type Contrato = { id: string; colaborador_id: string; cargo_id: string | null; departamento_id: string | null; data_admissao: string; data_termino: string | null; experiencia: boolean; data_desligamento: string | null }
export type Remun = { contrato_id: string; vigencia_inicio: string; und_sal_fixo: number; valor: number }
const diasEntre = (de: string, ate: string) => Math.round((Date.parse(ate + 'T12:00:00Z') - Date.parse(de + 'T12:00:00Z')) / 86400000)

// Contrato que vale para a pessoa: o mais recente pela admissão.
export function contratoAtual<K extends Contrato>(contratos: K[]): Map<string, K> {
  const m = new Map<string, K>()
  for (const k of [...contratos].sort((a, b) => b.data_admissao.localeCompare(a.data_admissao))) if (!m.has(k.colaborador_id)) m.set(k.colaborador_id, k)
  return m
}

export function resumirPessoas(colabs: Colab[], contratos: Contrato[], nomes: { cargos: Map<string, string>; deps: Map<string, string> }, hoje: string) {
  const atual = contratoAtual(contratos)
  const porSituacao: Record<string, number> = {}
  colabs.forEach((c) => { porSituacao[c.situacao] = (porSituacao[c.situacao] ?? 0) + 1 })
  const ativos = colabs.filter((c) => c.situacao === 'ativo')
  const conta = (f: (k: Contrato | undefined) => string) => ativos.reduce<Record<string, number>>((m, c) => { const k = f(atual.get(c.id)); m[k] = (m[k] ?? 0) + 1; return m }, {})
  const em30 = somarDiasISO(hoje, 30), ha30 = somarDiasISO(hoje, -30)
  const exp = colabs.filter((c) => c.situacao !== 'desligado').map((c) => ({ c, k: atual.get(c.id) })).filter(({ k }) => k?.experiencia && !k.data_desligamento && k.data_termino)
  const nome = (c: Colab) => c.nome_social || c.nome
  return {
    total: colabs.length, ativos: ativos.length, por_situacao: porSituacao,
    ativos_por_departamento: conta((k) => (k?.departamento_id && nomes.deps.get(k.departamento_id)) || 'sem departamento'),
    ativos_por_cargo: conta((k) => (k?.cargo_id && nomes.cargos.get(k.cargo_id)) || 'sem cargo'),
    admissoes_ultimos_30_dias: contratos.filter((k) => k.data_admissao >= ha30 && k.data_admissao <= hoje).length,
    desligamentos_ultimos_30_dias: contratos.filter((k) => k.data_desligamento && k.data_desligamento >= ha30 && k.data_desligamento <= hoje).length,
    experiencia_termina_em_30_dias: exp.filter(({ k }) => k!.data_termino! >= hoje && k!.data_termino! <= em30).map(({ c, k }) => ({ nome: nome(c), termina_em: k!.data_termino, dias: diasEntre(hoje, k!.data_termino!) })).sort((a, b) => a.dias - b.dias),
    experiencia_vencida: exp.filter(({ k }) => k!.data_termino! < hoje).map(({ c, k }) => ({ nome: nome(c), terminou_em: k!.data_termino })),
    ativos_sem_cargo: ativos.filter((c) => !atual.get(c.id)?.cargo_id).length,
    ativos_sem_departamento: ativos.filter((c) => !atual.get(c.id)?.departamento_id).length,
  }
}

// Salário vigente hoje de cada contrato = a linha mais recente com vigência até hoje. Soma só os MENSAIS (und 5);
// por hora/dia/semana/tarefa/variável não viram mês sem jornada e produção: ficam contados à parte (sem estimar).
export function somarSalarios(ativos: Contrato[], remun: Remun[], deps: Map<string, string>, hoje: string) {
  const vigente = new Map<string, Remun>()
  for (const r of [...remun].filter((r) => r.vigencia_inicio <= hoje).sort((a, b) => b.vigencia_inicio.localeCompare(a.vigencia_inicio))) if (!vigente.has(r.contrato_id)) vigente.set(r.contrato_id, r)
  let somaC = 0, mensais = 0, naoMensais = 0, semSalario = 0
  const porDep: Record<string, number> = {}
  for (const k of ativos) {
    const r = vigente.get(k.id)
    if (!r) { semSalario++; continue }
    if (Number(r.und_sal_fixo) !== 5) { naoMensais++; continue }
    const c = centavos(r.valor); somaC += c; mensais++
    const d = (k.departamento_id && deps.get(k.departamento_id)) || 'sem departamento'
    porDep[d] = reais(centavos(porDep[d] ?? 0) + c)
  }
  return { soma_mensal: reais(somaC), contratos_mensais: mensais, media_mensal: mensais ? reais(Math.round(somaC / mensais)) : 0, nao_mensais: naoMensais, sem_salario_cadastrado: semSalario, por_departamento: porDep }
}

// ─── execução (lê o banco com a sessão do usuário) ───
type Ctx = { supabase: SupabaseClient; empresaId: string; fuso: string }
const exigir = async <T>(nome: string, p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> => { const r = await p; if (r.error) throw new Error(`${nome}: ${r.error.message}`); return r.data }
const SEM_ACESSO = 'sem liberação no RH desta Empresa: peça ao Proprietário, CEO, Sócio ou Admin (RH · Estrutura → Acessos do RH)'

export async function executarFerramentaRh(ctx: Ctx, nome: string): Promise<ResultadoFinanceiro> {
  const { supabase, empresaId, fuso } = ctx
  const hoje = hojeISO(new Date(), fuso)
  const pode = async (acao: string) => !!(await supabase.rpc('rh_pode', { p_empresa: empresaId, p_acao: acao })).data
  const semAcesso = (indicador: string, unidade: 'QTD' | 'BRL') => resultado({ indicador, definicao: definicao(indicador), estado: 'indisponivel', valor: null, unidade, periodo: null, criterio_data: '—', fontes: [], registros: 0, limitacoes: [SEM_ACESSO] })
  try {
    if (!(await pode('ver'))) return semAcesso(nome === 'rh_salarios' ? 'salarios_base' : nome === 'rh_estrutura' ? 'rh_estrutura' : 'funcionarios', nome === 'rh_salarios' ? 'BRL' : 'QTD')
    const ler = async <T>(t: string, cols: string, lixeira = true) => (await exigir(t, lerTodas(() => { const q = supabase.from(t).select(cols).eq('empresa_id', empresaId); return (lixeira ? q.is('excluido_em', null) : q).order('id') }))) as unknown as T[]
    const nomes = async () => {
      const [cg, dp] = await Promise.all([ler<{ id: string; nome: string }>('rh_cargos', 'id, nome'), ler<{ id: string; nome: string }>('rh_departamentos', 'id, nome')])
      return { cargos: new Map(cg.map((x) => [x.id, x.nome])), deps: new Map(dp.map((x) => [x.id, x.nome])) }
    }
    switch (nome) {
      case 'rh_alertas': {
        const { painelRh } = await import('./rhPainel')
        const { ITENS_ADMISSAO } = await import('./rhDocumentos')
        const [podeDocs, podeSaude, podeSal] = await Promise.all([pode('pessoais'), pode('saude'), pode('salario')])
        const [colabs, contratos, itens, remun, empregador] = await Promise.all([
          ler<Colab>('rh_colaboradores', 'id, nome, nome_social, situacao'),
          ler<Contrato & { situacao_esocial: string; cod_categ: string; estabelecimento_id: string | null }>('rh_contratos', 'id, colaborador_id, cargo_id, departamento_id, estabelecimento_id, cod_categ, data_admissao, data_termino, experiencia, data_desligamento, situacao_esocial', false),
          podeDocs || podeSaude ? ler<{ colaborador_id: string; tipo: string; categoria: string; situacao: string }>('rh_admissao_itens', 'id, colaborador_id, tipo, categoria, situacao', false) : Promise.resolve(null),
          podeSal ? ler<Remun>('rh_remuneracoes', 'id, contrato_id, vigencia_inicio, und_sal_fixo, valor', false) : Promise.resolve(null),
          ler<{ id: string }>('rh_empregador', 'id'),
        ])
        let sal: Map<string, number> | null = null
        if (remun) { sal = new Map(); for (const r of [...remun].filter((r) => r.vigencia_inicio <= hoje).sort((a, b) => b.vigencia_inicio.localeCompare(a.vigencia_inicio))) if (!sal.has(r.contrato_id)) sal.set(r.contrato_id, Number(r.valor)) }
        const vivos = new Set(colabs.map((c) => c.id))
        const p = painelRh({ hoje, colabs, contratos: contratos.filter((k) => vivos.has(k.colaborador_id)), itens, salarioPorContrato: sal,
          obrigatorios: { documento: ITENS_ADMISSAO.filter((i) => i.obrigatorio && i.categoria === 'documento').map((i) => i.tipo), exame: ITENS_ADMISSAO.filter((i) => i.obrigatorio && i.categoria === 'exame').map((i) => i.tipo) }, podeDocs, podeSaude, temEmpregador: empregador.length > 0 })
        const limitacoes = ['nenhum valor de multa é estimado: depende da fiscalização e da tabela vigente']
        if (!podeSaude) limitacoes.push('sem liberação de saúde: o alerta de exame admissional não foi conferido')
        if (!podeDocs) limitacoes.push('sem liberação de dados pessoais: documentos pendentes não foram conferidos')
        return resultado({ indicador: 'rh_alertas', definicao: definicao('rh_alertas'), estado: podeDocs && podeSaude ? 'verificado' : 'parcial', valor: p.alertas.filter((a) => a.nivel !== 'info').length, unidade: 'QTD', periodo: null,
          criterio_data: 'posição de hoje', fontes: ['rh_colaboradores', 'rh_contratos', 'rh_admissao_itens', 'rh_remuneracoes'], registros: colabs.length, limitacoes,
          detalhes: { hoje, alertas: p.alertas.map((a) => ({ nivel: a.nivel, alerta: a.titulo.pt, base_legal: a.base, quantidade: a.total, pessoas: a.pessoas })), perto_do_limite: p.proximos.map((x) => x.pt), kpis: p.kpis } })
      }
      case 'rh_pessoas': {
        const [colabs, contratos, n] = await Promise.all([ler<Colab>('rh_colaboradores', 'id, nome, nome_social, situacao'), ler<Contrato>('rh_contratos', 'id, colaborador_id, cargo_id, departamento_id, data_admissao, data_termino, experiencia, data_desligamento', false), nomes()])
        const vivos = new Set(colabs.map((c) => c.id))
        const r = resumirPessoas(colabs, contratos.filter((k) => vivos.has(k.colaborador_id)), n, hoje)
        return resultado({ indicador: 'funcionarios', definicao: definicao('funcionarios'), estado: 'verificado', valor: r.ativos, unidade: 'QTD', periodo: null, criterio_data: 'posição de hoje; admissões e desligamentos pelos últimos 30 dias',
          fontes: ['rh_colaboradores', 'rh_contratos', 'rh_cargos', 'rh_departamentos'], registros: colabs.length, limitacoes: colabs.length === 0 ? ['nenhum colaborador cadastrado em RH · Colaboradores'] : [], detalhes: { hoje, ...r } })
      }
      case 'rh_estrutura': {
        const [emp, fil, lot, dep, car, colabs, contratos] = await Promise.all([
          ler<{ ini_valid: string; fim_valid: string | null; situacao_esocial: string }>('rh_empregador', 'id, ini_valid, fim_valid, situacao_esocial'),
          ler<{ id: string }>('rh_estabelecimentos', 'id'), ler<{ id: string }>('rh_lotacoes', 'id'),
          ler<{ id: string; centro_custo_id: string | null }>('rh_departamentos', 'id, centro_custo_id'), ler<{ id: string }>('rh_cargos', 'id'),
          ler<Colab>('rh_colaboradores', 'id, nome, situacao'), ler<Contrato>('rh_contratos', 'id, colaborador_id, cargo_id, departamento_id, data_admissao, data_termino, experiencia, data_desligamento', false),
        ])
        const mes = hoje.slice(0, 7)
        const vigente = emp.some((e) => e.ini_valid <= mes && (!e.fim_valid || e.fim_valid >= mes))
        const atual = contratoAtual(contratos)
        const ativos = colabs.filter((c) => c.situacao === 'ativo')
        const pendencias: string[] = []
        if (!vigente) pendencias.push('dados do empregador (S-1000) não cadastrados para o mês atual')
        if (!fil.length) pendencias.push('nenhuma filial (estabelecimento) cadastrada')
        if (!lot.length) pendencias.push('nenhuma lotação tributária cadastrada')
        if (!car.length) pendencias.push('nenhum cargo cadastrado')
        const semCc = dep.filter((d) => !d.centro_custo_id).length
        if (semCc) pendencias.push(`${semCc} departamento(s) sem centro de custo`)
        const semCargo = ativos.filter((c) => !atual.get(c.id)?.cargo_id).length
        if (semCargo) pendencias.push(`${semCargo} colaborador(es) ativo(s) sem cargo`)
        return resultado({ indicador: 'rh_estrutura', definicao: definicao('rh_estrutura'), estado: 'verificado', valor: pendencias.length, unidade: 'QTD', periodo: null, criterio_data: 'posição de hoje',
          fontes: ['rh_empregador', 'rh_estabelecimentos', 'rh_lotacoes', 'rh_departamentos', 'rh_cargos', 'rh_colaboradores', 'rh_contratos'], registros: emp.length + fil.length + lot.length + dep.length + car.length, limitacoes: [],
          detalhes: { empregador_vigente: vigente, enviado_ao_esocial: emp.some((e) => e.situacao_esocial !== 'rascunho'), filiais: fil.length, lotacoes: lot.length, departamentos: dep.length, cargos: car.length, pendencias } })
      }
      case 'rh_salarios': {
        if (!(await pode('salario'))) return semAcesso('salarios_base', 'BRL')
        const [colabs, contratos, remun, n] = await Promise.all([
          ler<Colab>('rh_colaboradores', 'id, nome, situacao'), ler<Contrato>('rh_contratos', 'id, colaborador_id, cargo_id, departamento_id, data_admissao, data_termino, experiencia, data_desligamento', false),
          ler<Remun>('rh_remuneracoes', 'id, contrato_id, vigencia_inicio, und_sal_fixo, valor', false), nomes(),
        ])
        const ativosIds = new Set(colabs.filter((c) => c.situacao === 'ativo' || c.situacao === 'afastado').map((c) => c.id))
        const atual = contratoAtual(contratos)
        const contratosAtivos = [...atual.values()].filter((k) => ativosIds.has(k.colaborador_id) && !k.data_desligamento)
        const s = somarSalarios(contratosAtivos, remun, n.deps, hoje)
        const limitacoes = ['salário-base, não é a folha: sem encargos (INSS patronal, FGTS), benefícios, horas extras, adicionais nem provisões de férias e 13º (Fase 4 do RH)']
        if (s.nao_mensais) limitacoes.push(`${s.nao_mensais} contrato(s) pago(s) por hora, dia, semana, tarefa ou só variável ficaram fora da soma (não viram mês sem jornada e produção)`)
        if (s.sem_salario_cadastrado) limitacoes.push(`${s.sem_salario_cadastrado} contrato(s) ativo(s) sem salário cadastrado`)
        return resultado({ indicador: 'salarios_base', definicao: definicao('salarios_base'), estado: s.nao_mensais || s.sem_salario_cadastrado ? 'parcial' : 'verificado', valor: s.soma_mensal, unidade: 'BRL', periodo: null,
          criterio_data: 'salário vigente hoje (última vigência até hoje)', fontes: ['rh_remuneracoes', 'rh_contratos', 'rh_colaboradores'], registros: contratosAtivos.length, limitacoes, detalhes: { hoje, ...s } })
      }
    }
    return falhou(nome, 'ferramenta de RH desconhecida')
  } catch (e) {
    return falhou(nome, e instanceof Error ? e.message : 'erro ao ler o RH')
  }
}
