// RH · Painel e Radar de Risco Trabalhista (2026-11-08). Uma função pura para a tela /rh E para a IA (porta rh_alertas):
// o número da tela e o da resposta são o mesmo. Só alerta o que o dado mostra; cada alerta cita a base legal.
// Nenhum valor de multa é estimado aqui: depende da fiscalização e da tabela vigente (NR-28) — não inventamos número.
import { contratoAtual, type Colab, type Contrato } from './rhIA'

export type Texto = { pt: string; en: string; es: string }
const T = (pt: string, en: string, es: string): Texto => ({ pt, en, es })
export type Nivel = 'critico' | 'atencao' | 'info'
export type Alerta = { id: string; nivel: Nivel; titulo: Texto; base: string; pessoas: string[]; total: number; acao: { rota: string; texto: Texto } }
export type ItemAdm = { colaborador_id: string; tipo: string; categoria: string; situacao: string }
export type ContratoPainel = Contrato & { situacao_esocial: string; cod_categ: string; estabelecimento_id?: string | null }
export type DadosPainel = {
  hoje: string; colabs: Colab[]; contratos: ContratoPainel[]; itens: ItemAdm[] | null; salarioPorContrato: Map<string, number> | null
  obrigatorios: { documento: string[]; exame: string[] }; podeDocs: boolean; podeSaude: boolean
}
const dias = (de: string, ate: string) => Math.round((Date.parse(ate + 'T12:00:00Z') - Date.parse(de + 'T12:00:00Z')) / 86400000)
const nome = (c: Colab) => c.nome_social || c.nome

// Cota de pessoas com deficiência (Lei 8.213/1991, art. 93): 100–200 = 2%; 201–500 = 3%; 501–1.000 = 4%; acima = 5%.
export function cotaPcd(empregados: number): number {
  if (empregados < 100) return 0
  const pct = empregados <= 200 ? 0.02 : empregados <= 500 ? 0.03 : empregados <= 1000 ? 0.04 : 0.05
  return Math.ceil(empregados * pct)
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
  const add = (a: Omit<Alerta, 'total'>) => { if (a.pessoas.length) alertas.push({ ...a, total: a.pessoas.length, pessoas: a.pessoas.slice(0, 8) }) }
  const COLAB = '/rh/colaboradores'
  // 1) experiência: vencida (decidir já) e terminando em até 15 dias
  const exp = vivos.map((c) => ({ c, k: atual.get(c.id) })).filter(({ k }) => k?.experiencia && k.data_termino && !k.data_desligamento)
  add({ id: 'experiencia_vencida', nivel: 'critico', titulo: T('Experiência vencida sem decisão', 'Probation over without a decision', 'Experiencia vencida sin decisión'), base: 'CLT art. 445 e 451',
    pessoas: exp.filter(({ k }) => k!.data_termino! < hoje).map(({ c, k }) => `${nome(c)} (${k!.data_termino!.split('-').reverse().join('/')})`), acao: { rota: COLAB, texto: T('Efetivar ou desligar', 'Hire or terminate', 'Efectivar o desvincular') } })
  add({ id: 'experiencia_terminando', nivel: 'atencao', titulo: T('Experiência termina em até 15 dias', 'Probation ends within 15 days', 'Experiencia termina en hasta 15 días'), base: 'CLT art. 445',
    pessoas: exp.filter(({ k }) => k!.data_termino! >= hoje && dias(hoje, k!.data_termino!) <= 15).map(({ c, k }) => `${nome(c)} (${dias(hoje, k!.data_termino!)} d)`), acao: { rota: COLAB, texto: T('Avaliar e decidir', 'Evaluate and decide', 'Evaluar y decidir') } })
  // 2) prazo determinado terminando (não experiência)
  add({ id: 'determinado_terminando', nivel: 'atencao', titulo: T('Contrato por prazo determinado termina em até 30 dias', 'Fixed-term contract ends within 30 days', 'Contrato a plazo determinado termina en hasta 30 días'), base: 'CLT art. 443 e 445',
    pessoas: vivos.map((c) => ({ c, k: atual.get(c.id) })).filter(({ k }) => k && !k.experiencia && k.data_termino && !k.data_desligamento && k.data_termino >= hoje && dias(hoje, k.data_termino) <= 30).map(({ c }) => nome(c)), acao: { rota: COLAB, texto: T('Renovar ou encerrar', 'Renew or end', 'Renovar o terminar') } })
  // 3) admissão não enviada ao eSocial e já começando (o S-2200 vai até o dia anterior ao início)
  add({ id: 'esocial_admissao', nivel: 'critico', titulo: T('Admissão não marcada como enviada ao eSocial', 'Hire not marked as sent to eSocial', 'Admisión no marcada como enviada al eSocial'), base: 'eSocial S-2200 (MOS: até o dia anterior ao início)',
    pessoas: vivos.map((c) => ({ c, k: atual.get(c.id) })).filter(({ k }) => k && k.situacao_esocial === 'rascunho' && dias(hoje, k.data_admissao) <= 1).map(({ c }) => nome(c)), acao: { rota: COLAB, texto: T('Enviar ao contador e marcar', 'Send to the accountant and mark', 'Enviar al contador y marcar') } })
  // 4) exame admissional e documentos obrigatórios (só para quem pode ver)
  const itensDe = new Map<string, ItemAdm[]>()
  ;(d.itens ?? []).forEach((i) => { const l = itensDe.get(i.colaborador_id) ?? []; l.push(i); itensDe.set(i.colaborador_id, l) })
  const feito = (cid: string, tipo: string) => (itensDe.get(cid) ?? []).some((i) => i.tipo === tipo && i.situacao !== 'pendente')
  if (d.podeSaude && d.itens) add({ id: 'sem_aso', nivel: 'critico', titulo: T('Trabalhando sem exame admissional (ASO)', 'Working without pre-employment exam (ASO)', 'Trabajando sin examen de admisión (ASO)'), base: 'NR-7 (exame antes de assumir as atividades)',
    pessoas: ativos.filter((c) => { const k = atual.get(c.id); return k && k.data_admissao <= hoje && !d.obrigatorios.exame.every((t) => feito(c.id, t)) }).map(nome), acao: { rota: COLAB, texto: T('Marcar o exame', 'Schedule the exam', 'Agendar el examen') } })
  if (d.podeDocs && d.itens) add({ id: 'docs_pendentes', nivel: 'atencao', titulo: T('Documentos obrigatórios pendentes', 'Required documents pending', 'Documentos obligatorios pendientes'), base: 'CLT art. 29 e 41; LGPD',
    pessoas: vivos.filter((c) => !d.obrigatorios.documento.every((t) => feito(c.id, t))).map(nome), acao: { rota: COLAB, texto: T('Cobrar os documentos', 'Collect the documents', 'Pedir los documentos') } })
  // 5) cadastro incompleto que o eSocial e a folha vão exigir
  add({ id: 'sem_cargo', nivel: 'atencao', titulo: T('Ativos sem cargo (o eSocial exige o CBO)', 'Active without job title (eSocial requires the CBO)', 'Activos sin cargo (eSocial exige el CBO)'), base: 'eSocial S-2200',
    pessoas: ativos.filter((c) => !atual.get(c.id)?.cargo_id).map(nome), acao: { rota: COLAB, texto: T('Definir o cargo', 'Set the job title', 'Definir el cargo') } })
  if (d.salarioPorContrato) add({ id: 'sem_salario', nivel: 'atencao', titulo: T('Ativos sem salário cadastrado', 'Active without salary recorded', 'Activos sin salario registrado'), base: 'eSocial S-2200 (remuneração)',
    pessoas: ativos.filter((c) => !d.salarioPorContrato!.has(atual.get(c.id)?.id ?? '')).map(nome), acao: { rota: COLAB, texto: T('Cadastrar o salário', 'Record the salary', 'Registrar el salario') } })
  // 6) obrigações que aparecem com o tamanho da empresa (empregados = CLT ativos e afastados)
  const empregados = vivos.filter((c) => c.situacao !== 'pre_admissao' && /^1/.test(atual.get(c.id)?.cod_categ ?? '')).length
  const porEstab = new Map<string, number>()
  vivos.forEach((c) => { const k = atual.get(c.id); if (k && /^1/.test(k.cod_categ)) porEstab.set(k.estabelecimento_id ?? 'sem', (porEstab.get(k.estabelecimento_id ?? 'sem') ?? 0) + 1) })
  const maiorEstab = Math.max(0, ...porEstab.values())
  const lei: { id: string; ok: boolean; titulo: Texto; base: string }[] = [
    { id: 'ponto', ok: maiorEstab > 20, titulo: T(`Controle de ponto obrigatório (${maiorEstab} empregados num estabelecimento)`, `Time tracking mandatory (${maiorEstab} employees in one site)`, `Control de jornada obligatorio (${maiorEstab} empleados en un establecimiento)`), base: 'CLT art. 74, § 2º (mais de 20 por estabelecimento)' },
    { id: 'cota_pcd', ok: empregados >= 100, titulo: T(`Cota de pessoas com deficiência: ${cotaPcd(empregados)} vaga(s)`, `Disability quota: ${cotaPcd(empregados)} position(s)`, `Cuota de personas con discapacidad: ${cotaPcd(empregados)} puesto(s)`), base: 'Lei 8.213/1991, art. 93' },
    { id: 'igualdade', ok: empregados >= 100, titulo: T('Relatório de igualdade salarial 2 vezes por ano', 'Pay-equality report twice a year', 'Informe de igualdad salarial 2 veces al año'), base: 'Lei 14.611/2023 (100 ou mais empregados)' },
  ]
  lei.filter((x) => x.ok).forEach((x) => alertas.push({ id: x.id, nivel: 'info', titulo: x.titulo, base: x.base, pessoas: [], total: 0, acao: { rota: '/rh', texto: T('Ver obrigação', 'See obligation', 'Ver obligación') } }))
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
    ativos_por_departamento: porDep, alertas, proximos,
  }
}
