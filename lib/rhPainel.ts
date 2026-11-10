// RH · Painel e Radar de Risco Trabalhista (2026-11-08). Uma função pura para a tela /rh E para a IA (porta rh_alertas):
// o número da tela e o da resposta são o mesmo. Só alerta o que o dado mostra; cada alerta cita a base legal.
// Nenhum valor de multa é estimado aqui: depende da fiscalização e da tabela vigente (NR-28) — não inventamos número.
import { contratoAtual, type Colab, type Contrato } from './rhIA'
import { periodosFerias, type ParteFerias } from './rhFerias'

export type Texto = { pt: string; en: string; es: string }
const T = (pt: string, en: string, es: string): Texto => ({ pt, en, es })
export type Nivel = 'critico' | 'atencao' | 'info'
/** pessoas e ids andam juntos (mesma ordem): cada nome abre a ficha da pessoa. acao.rota = tela da rotina que resolve o alerta. */
export type Alerta = { id: string; nivel: Nivel; titulo: Texto; base: string; pessoas: string[]; ids: string[]; total: number; acao: { rota: string; texto: Texto } }
export type ItemAdm = { colaborador_id: string; tipo: string; categoria: string; situacao: string }
export type ContratoPainel = Contrato & { situacao_esocial: string; cod_categ: string; estabelecimento_id?: string | null }
export type DadosPainel = {
  hoje: string; colabs: Colab[]; contratos: ContratoPainel[]; itens: ItemAdm[] | null; salarioPorContrato: Map<string, number> | null
  obrigatorios: { documento: string[]; exame: string[] }; podeDocs: boolean; podeSaude: boolean
  /** false = nenhum cadastro do empregador (S-1000) fora da lixeira; undefined = não conferido */
  temEmpregador?: boolean
  /** partes de férias fora da lixeira (rh_ferias); undefined = não conferido (o alerta de férias não aparece) */
  ferias?: (ParteFerias & { contrato_id: string })[]
}
const dias = (de: string, ate: string) => Math.round((Date.parse(ate + 'T12:00:00Z') - Date.parse(de + 'T12:00:00Z')) / 86400000)
const nome = (c: Colab) => c.nome_social || c.nome

// Cota de pessoas com deficiência (Lei 8.213/1991, art. 93): 100–200 = 2%; 201–500 = 3%; 501–1.000 = 4%; acima = 5%.
export function cotaPcd(empregados: number): number {
  if (empregados < 100) return 0
  const pct = empregados <= 200 ? 0.02 : empregados <= 500 ? 0.03 : empregados <= 1000 ? 0.04 : 0.05
  return Math.ceil(empregados * pct)
}

/** Tamanho que dispara obrigação: empregados CLT (categorias 1xx) ativos e afastados; maior estabelecimento (ponto, CLT art. 74). Mesma conta no Painel e em /rh/obrigacoes. */
export function porteRh(vivos: Colab[], atual: Map<string, ContratoPainel>) {
  const clt = vivos.filter((c) => c.situacao !== 'pre_admissao' && /^1/.test(atual.get(c.id)?.cod_categ ?? ''))
  const porEstab = new Map<string, number>()
  clt.forEach((c) => { const e = atual.get(c.id)!.estabelecimento_id ?? 'sem'; porEstab.set(e, (porEstab.get(e) ?? 0) + 1) })
  return { empregados: clt.length, maiorEstab: Math.max(0, ...porEstab.values()), porEstab, aprendizes: clt.filter((c) => atual.get(c.id)!.cod_categ === '103').length }
}

export function painelRh(d: DadosPainel) {
  const { hoje } = d
  const atual = contratoAtual(d.contratos)
  const vivos = d.colabs.filter((c) => c.situacao !== 'desligado')
  const ativos = d.colabs.filter((c) => c.situacao === 'ativo')
  const mes = hoje.slice(0, 7)
  const admMes = d.contratos.filter((k) => k.data_admissao.slice(0, 7) === mes).length
  const desMes = d.contratos.filter((k) => k.data_desligamento?.slice(0, 7) === mes).length
  // Rotatividade do mês = ((admissões + desligamentos) ÷ 2) ÷ ativos de hoje × 100 (sem média do mês: o histórico diário de quadro ainda não existe)
  const rotatividade = ativos.length ? Math.round((((admMes + desMes) / 2) / ativos.length) * 10000) / 100 : null
  const porDep: Record<string, number> = {}
  ativos.forEach((c) => { const k = atual.get(c.id); const dep = k?.departamento_id ?? 'sem'; porDep[dep] = (porDep[dep] ?? 0) + 1 })
  let salarios: number | null = null
  if (d.salarioPorContrato) salarios = Math.round(ativos.reduce((s, c) => s + Math.round((d.salarioPorContrato!.get(atual.get(c.id)?.id ?? '') ?? 0) * 100), 0)) / 100

  const alertas: Alerta[] = []
  type Quem = { c: Colab; rotulo?: string }
  const add = (a: Omit<Alerta, 'total' | 'pessoas' | 'ids'> & { quem: Quem[] }) => {
    const { quem, ...resto } = a
    if (quem.length) alertas.push({ ...resto, total: quem.length, pessoas: quem.slice(0, 8).map((q) => q.rotulo ?? nome(q.c)), ids: quem.slice(0, 8).map((q) => q.c.id) })
  }
  const COLAB = '/rh/colaboradores'
  // 0) sem empregador (S-1000) não há como enviar nenhuma admissão (S-2200) ao eSocial
  if (d.temEmpregador === false) add({ id: 'sem_empregador', nivel: 'critico', titulo: T('Empregador não cadastrado no RH', 'Employer not registered in HR', 'Empleador no registrado en RR. HH.'), base: 'eSocial S-1000 (deve existir antes de qualquer admissão)',
    quem: vivos.map((c) => ({ c })), acao: { rota: '/rh/estrutura?aba=empregador', texto: T('Cadastrar o empregador', 'Register the employer', 'Registrar el empleador') } })
  // 1) experiência: vencida (decidir já) e terminando em até 15 dias
  const exp = vivos.map((c) => ({ c, k: atual.get(c.id) })).filter(({ k }) => k?.experiencia && k.data_termino && !k.data_desligamento)
  add({ id: 'experiencia_vencida', nivel: 'critico', titulo: T('Experiência vencida sem decisão', 'Probation over without a decision', 'Experiencia vencida sin decisión'), base: 'CLT art. 445 e 451',
    quem: exp.filter(({ k }) => k!.data_termino! < hoje).map(({ c, k }) => ({ c, rotulo: `${nome(c)} (${k!.data_termino!.split('-').reverse().join('/')})` })), acao: { rota: '/rh/contratos', texto: T('Efetivar ou desligar', 'Hire or terminate', 'Efectivar o desvincular') } })
  add({ id: 'experiencia_terminando', nivel: 'atencao', titulo: T('Experiência termina em até 15 dias', 'Probation ends within 15 days', 'Experiencia termina en hasta 15 días'), base: 'CLT art. 445',
    quem: exp.filter(({ k }) => k!.data_termino! >= hoje && dias(hoje, k!.data_termino!) <= 15).map(({ c, k }) => ({ c, rotulo: `${nome(c)} (${dias(hoje, k!.data_termino!)} d)` })), acao: { rota: '/rh/contratos', texto: T('Avaliar e decidir', 'Evaluate and decide', 'Evaluar y decidir') } })
  // 2) prazo determinado terminando (não experiência)
  add({ id: 'determinado_terminando', nivel: 'atencao', titulo: T('Contrato por prazo determinado termina em até 30 dias', 'Fixed-term contract ends within 30 days', 'Contrato a plazo determinado termina en hasta 30 días'), base: 'CLT art. 443 e 445',
    quem: vivos.map((c) => ({ c, k: atual.get(c.id) })).filter(({ k }) => k && !k.experiencia && k.data_termino && !k.data_desligamento && k.data_termino >= hoje && dias(hoje, k.data_termino) <= 30).map(({ c }) => ({ c })), acao: { rota: '/rh/contratos', texto: T('Renovar ou encerrar', 'Renew or end', 'Renovar o terminar') } })
  // 3) admissão não enviada ao eSocial e já começando (o S-2200 vai até o dia anterior ao início)
  add({ id: 'esocial_admissao', nivel: 'critico', titulo: T('Admissão não marcada como enviada ao eSocial', 'Hire not marked as sent to eSocial', 'Admisión no marcada como enviada al eSocial'), base: 'eSocial S-2200 (MOS: até o dia anterior ao início)',
    quem: vivos.map((c) => ({ c, k: atual.get(c.id) })).filter(({ k }) => k && ['rascunho', 'preparado', 'recusado'].includes(k.situacao_esocial) && dias(hoje, k.data_admissao) <= 1).map(({ c }) => ({ c })), acao: { rota: '/rh/esocial', texto: T('Preparar o arquivo e entregar ao contador', 'Prepare the file and give it to the accountant', 'Preparar el archivo y entregarlo al contador') } })
  // 4) exame admissional e documentos obrigatórios (só para quem pode ver)
  const itensDe = new Map<string, ItemAdm[]>()
  ;(d.itens ?? []).forEach((i) => { const l = itensDe.get(i.colaborador_id) ?? []; l.push(i); itensDe.set(i.colaborador_id, l) })
  // feito = realizado/entregue ou dispensado; "agendado" ainda não vale (a pessoa não pode trabalhar sem o ASO — NR-7)
  const feito = (cid: string, tipo: string) => (itensDe.get(cid) ?? []).some((i) => i.tipo === tipo && (i.situacao === 'entregue' || i.situacao === 'dispensado'))
  if (d.podeSaude && d.itens) add({ id: 'sem_aso', nivel: 'critico', titulo: T('Trabalhando sem exame admissional (ASO)', 'Working without pre-employment exam (ASO)', 'Trabajando sin examen de admisión (ASO)'), base: 'NR-7 (exame antes de assumir as atividades)',
    quem: ativos.filter((c) => { const k = atual.get(c.id); return k && k.data_admissao <= hoje && !d.obrigatorios.exame.every((t) => feito(c.id, t)) }).map((c) => ({ c })), acao: { rota: '/rh/exames', texto: T('Marcar o exame', 'Schedule the exam', 'Agendar el examen') } })
  if (d.podeDocs && d.itens) add({ id: 'docs_pendentes', nivel: 'atencao', titulo: T('Documentos obrigatórios pendentes', 'Required documents pending', 'Documentos obligatorios pendientes'), base: 'CLT art. 29 e 41; LGPD',
    quem: vivos.filter((c) => !d.obrigatorios.documento.every((t) => feito(c.id, t))).map((c) => ({ c })), acao: { rota: '/rh/documentos', texto: T('Cobrar os documentos', 'Collect the documents', 'Pedir los documentos') } })
  // 4b) férias: vencidas (pagas em dobro — CLT art. 137) e prazo acabando em até 60 dias (art. 134)
  if (d.ferias) {
    const fer = vivos.filter((c) => c.situacao !== 'pre_admissao').map((c) => { const k = atual.get(c.id); return k ? { c, per: periodosFerias({ dataAdmissao: k.data_admissao, hoje, dataDesligamento: k.data_desligamento, partes: d.ferias!.filter((f) => f.contrato_id === k.id) }) } : null }).filter(Boolean) as { c: Colab; per: ReturnType<typeof periodosFerias> }[]
    add({ id: 'ferias_vencidas', nivel: 'critico', titulo: T('Férias vencidas (pagas em dobro)', 'Expired vacations (paid double)', 'Vacaciones vencidas (pagadas en doble)'), base: 'CLT art. 137',
      quem: fer.filter((x) => x.per.some((p) => p.status === 'vencida')).map(({ c, per }) => ({ c, rotulo: `${nome(c)} (${per.filter((p) => p.status === 'vencida').reduce((s, p) => s + p.saldo, 0)} d)` })), acao: { rota: '/rh/ferias', texto: T('Conceder as férias', 'Grant the vacations', 'Conceder las vacaciones') } })
    add({ id: 'ferias_vencendo', nivel: 'atencao', titulo: T('Prazo das férias acaba em até 60 dias', 'Vacation deadline within 60 days', 'Plazo de vacaciones termina en hasta 60 días'), base: 'CLT art. 134 e 135 (aviso com 30 dias)',
      quem: fer.map(({ c, per }) => ({ c, p: per.find((p) => p.status === 'a_conceder' && (p.dias_para_vencer ?? 999) <= 60) })).filter((x) => x.p).map(({ c, p }) => ({ c, rotulo: `${nome(c)} (${p!.dias_para_vencer} d)` })), acao: { rota: '/rh/ferias', texto: T('Programar as férias', 'Schedule the vacations', 'Programar las vacaciones') } })
  }
  // 5) cadastro incompleto que o eSocial e a folha vão exigir
  add({ id: 'sem_cargo', nivel: 'atencao', titulo: T('Ativos sem cargo (o eSocial exige o CBO)', 'Active without job title (eSocial requires the CBO)', 'Activos sin cargo (eSocial exige el CBO)'), base: 'eSocial S-2200',
    quem: ativos.filter((c) => !atual.get(c.id)?.cargo_id).map((c) => ({ c })), acao: { rota: `${COLAB}?filtro=sem_cargo`, texto: T('Definir o cargo', 'Set the job title', 'Definir el cargo') } })
  if (d.salarioPorContrato) add({ id: 'sem_salario', nivel: 'atencao', titulo: T('Ativos sem salário cadastrado', 'Active without salary recorded', 'Activos sin salario registrado'), base: 'eSocial S-2200 (remuneração)',
    quem: ativos.filter((c) => !d.salarioPorContrato!.has(atual.get(c.id)?.id ?? '')).map((c) => ({ c })), acao: { rota: `${COLAB}?filtro=sem_salario`, texto: T('Cadastrar o salário', 'Record the salary', 'Registrar el salario') } })
  // 6) obrigações que aparecem com o tamanho da empresa (empregados = CLT ativos e afastados)
  const { empregados, maiorEstab } = porteRh(vivos, atual)
  const lei: { id: string; ok: boolean; titulo: Texto; base: string }[] = [
    { id: 'ponto', ok: maiorEstab > 20, titulo: T(`Controle de ponto obrigatório (${maiorEstab} empregados num estabelecimento)`, `Time tracking mandatory (${maiorEstab} employees in one site)`, `Control de jornada obligatorio (${maiorEstab} empleados en un establecimiento)`), base: 'CLT art. 74, § 2º (mais de 20 por estabelecimento)' },
    { id: 'cota_pcd', ok: empregados >= 100, titulo: T(`Cota de pessoas com deficiência: ${cotaPcd(empregados)} vaga(s)`, `Disability quota: ${cotaPcd(empregados)} position(s)`, `Cuota de personas con discapacidad: ${cotaPcd(empregados)} puesto(s)`), base: 'Lei 8.213/1991, art. 93' },
    { id: 'igualdade', ok: empregados >= 100, titulo: T('Relatório de igualdade salarial 2 vezes por ano', 'Pay-equality report twice a year', 'Informe de igualdad salarial 2 veces al año'), base: 'Lei 14.611/2023 (100 ou mais empregados)' },
  ]
  lei.filter((x) => x.ok).forEach((x) => alertas.push({ id: x.id, nivel: 'info', titulo: x.titulo, base: x.base, pessoas: [], ids: [], total: 0, acao: { rota: `/rh/obrigacoes#${x.id}`, texto: T('Ver obrigação', 'See obligation', 'Ver obligación') } }))
  const ordem: Record<Nivel, number> = { critico: 0, atencao: 1, info: 2 }
  alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel] || b.total - a.total)
  // Perto do limite: avisa antes (faltam até 3 pessoas para a regra valer)
  const proximos = [
    maiorEstab >= 18 && maiorEstab <= 20 ? T(`Faltam ${21 - maiorEstab} empregado(s) para o controle de ponto ser obrigatório (CLT art. 74)`, `${21 - maiorEstab} more employee(s) make time tracking mandatory (CLT art. 74)`, `Faltan ${21 - maiorEstab} empleado(s) para que el control de jornada sea obligatorio (CLT art. 74)`) : null,
    empregados >= 97 && empregados < 100 ? T(`Faltam ${100 - empregados} empregado(s) para a cota PCD e o relatório de igualdade salarial`, `${100 - empregados} more employee(s) trigger the disability quota and pay-equality report`, `Faltan ${100 - empregados} empleado(s) para la cuota PCD y el informe de igualdad salarial`) : null,
  ].filter(Boolean) as Texto[]
  return {
    kpis: { ativos: ativos.length, pre_admissao: d.colabs.filter((c) => c.situacao === 'pre_admissao').length, afastados: d.colabs.filter((c) => c.situacao === 'afastado').length,
      admissoes_mes: admMes, desligamentos_mes: desMes, rotatividade_mes_pct: rotatividade, salarios_base_mensais: salarios, empregados_clt: empregados },
    ativos_por_departamento: porDep, alertas, proximos, porte: { empregados, maiorEstab },
  }
}
