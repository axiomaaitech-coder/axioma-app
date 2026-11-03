// Overdue Intelligence (Fase 1) — cálculos do motor. Rodar: npx tsx scripts/check-vencidos.mts
// Cobre: pagamento integral/parcial, duplicidade, estorno, promessas, acordo/negociação, disputa, juros, multa,
// datas e faixas, empresas diferentes, previsões, simulações e determinismo (mesma entrada → mesmo resultado).
import assert from 'node:assert/strict'
const M = await import('../lib/vencidos/motor')
type T = Parameters<typeof M.saldoDoTitulo>[0]

const hoje = '2026-11-02'
const E = 'emp-1'
const t = (id: string, venc: string, valor: number, quitado = 0, extra: Partial<T> = {}): T =>
  ({ id, empresaId: E, dominio: 'receber', contraparteId: 'cli-1', contraparteNome: 'Cliente', valor, quitado, vencimento: venc, status: quitado >= valor ? 'recebido' : 'pendente', ...extra })

// ── saldo: integral, parcial, estorno, cancelado, desconto ──
assert.equal(M.estaVencido(t('a', '2026-10-01', 100, 100), hoje), false, 'pago integral não é vencido')
assert.equal(M.saldoDoTitulo(t('b', '2026-10-01', 1000, 400), hoje), 600, 'parcial reflete o saldo original')
assert.equal(M.estaVencido(t('c', '2026-10-01', 100, 0, { status: 'cancelado' }), hoje), false, 'cancelado fica fora')
assert.equal(M.estaVencido(t('d', hoje, 100), hoje), false, 'vence hoje ainda não venceu')
const estornado = t('e', '2026-10-01', 500, 200) // tinha 500 pagos, estorno de 300 → quitado 200
assert.equal(M.saldoDoTitulo(estornado, hoje), 300, 'estorno devolve o saldo')
assert.equal(M.saldoDoTitulo(t('f', '2026-10-01', 1000, 0, { desconto: 100 }), hoje), 900, 'desconto concedido sai do saldo')
const pagar: T = { ...t('p1', '2026-10-01', 800, 300), dominio: 'pagar', status: 'pendente' }
assert.equal(M.saldoDoTitulo(pagar, hoje), 500, 'a pagar usa a mesma regra de Contas a Pagar')

// ── duplicidade e empresas diferentes ──
assert.equal(M.conferirEntrada([t('x', '2026-10-01', 10), t('x', '2026-10-01', 10)]).length, 1, 'título repetido conta uma vez')
assert.equal(M.conferirEntrada([t('x', '2026-10-01', 10), { ...t('x', '2026-10-01', 10), dominio: 'pagar' }]).length, 2, 'mesmo id em domínios diferentes são títulos diferentes')
assert.throws(() => M.conferirEntrada([t('x', '2026-10-01', 10), { ...t('y', '2026-10-01', 10), empresaId: 'emp-2' }]), /mais de uma empresa/)

// ── datas e faixas de aging (limites exatos) ──
const f = M.rotulosFaixas(M.FAIXAS_PADRAO)
assert.equal(f.length, 10)
assert.deepEqual([f[0].rotulo, f[1].rotulo, f[9].rotulo], ['1–7', '8–15', '360+'])
assert.equal(M.faixaDe(7, M.FAIXAS_PADRAO), 0); assert.equal(M.faixaDe(8, M.FAIXAS_PADRAO), 1)
assert.equal(M.faixaDe(360, M.FAIXAS_PADRAO), 8); assert.equal(M.faixaDe(361, M.FAIXAS_PADRAO), 9)
assert.equal(M.faixaDe(10, [30, 60]), 0, 'faixas configuráveis por empresa')
const ag = M.aging([t('g1', '2026-10-26', 100), t('g2', '2026-08-04', 300, 0, { contraparteId: 'cli-2' }), t('g3', '2026-10-01', 50, 50)], hoje)
assert.equal(ag.total, 400); assert.equal(ag.faixas[0].saldo, 100); assert.equal(ag.faixas[5].saldo, 300, '90 dias cai em 61–90')
assert.equal(ag.maiorPct, 75); assert.ok(ag.hhi > 2500, 'carteira concentrada')
assert.equal(M.aging([t('bis', '2024-02-29', 10)], '2024-03-08').faixas[1].qtd, 1, '29/02 → 8 dias (ano bissexto)')
const mig = M.migracaoAging([t('m1', '2026-10-24', 100), t('m2', '2026-10-30', 50)], '2026-10-28', hoje)
assert.equal(mig.mudaramParaFaixaPior, 100, '3 → 8 dias muda de faixa'); assert.equal(mig.entraramNoVencido, 50)

// ── disputa: contestado separado do incontroverso ──
const d = M.separarDisputa(1000, { tituloId: 'z', disputaStatus: 'aberta', disputaValor: 300 })
assert.deepEqual([d.contestado, d.incontroverso], [300, 700])
assert.equal(M.separarDisputa(1000, { tituloId: 'z', disputaStatus: 'aberta', disputaValor: 5000 }).incontroverso, 0, 'contestado nunca passa do saldo')
assert.equal(M.separarDisputa(1000, { tituloId: 'z', disputaStatus: 'resolvida_contra', disputaValor: 300 }).contestado, 0, 'disputa encerrada volta a cobrar tudo')

// ── juros, multa e atualização (Lei 14.905/2024, CDC 52 §1º) ──
const b2c = M.encargos(t('j1', '2026-10-03', 1000, 0, { documento: '123.456.789-09', taxaMultaPct: 10, taxaJurosMesPct: 1 }), hoje)
assert.equal(b2c.relacao, 'b2c'); assert.equal(b2c.multa, 20, 'multa de consumidor limitada a 2%'); assert.equal(b2c.juros, 10, '1% a.m. por 30 dias')
assert.ok(b2c.avisos.some((a) => a.includes('2%')))
const b2b = M.encargos(t('j2', '2026-10-03', 1000, 0, { documento: '12.345.678/0001-90', taxaMultaPct: 10 }), hoje, { taxaLegalMesPct: 0.5, ipcaMesesPct: [0.5] })
assert.equal(b2b.multa, 100, 'B2B: multa do contrato'); assert.equal(b2b.juros, 5, 'sem juros no contrato → taxa legal'); assert.equal(b2b.atualizacao, 5, 'IPCA')
assert.equal(M.encargos(t('j3', '2026-10-03', 1000), hoje, { taxaLegalMesPct: -0.3 }).juros, 0, 'taxa legal negativa = zero')
assert.ok(M.encargos(t('j4', '2026-10-03', 1000), hoje).avisos.some((a) => a.includes('não calculados')), 'sem taxa: avisa em vez de inventar')

// ── promessas: nunca caixa; cumprimento = o que entrou depois ──
const tp = t('pr', '2026-10-01', 1000, 600)
assert.equal(M.situacaoPromessa({ id: 'p', tituloId: 'pr', valor: 400, data: '2026-11-10', recebidoNaPromessa: 200 }, tp, hoje).situacao, 'cumprida')
assert.equal(M.situacaoPromessa({ id: 'p', tituloId: 'pr', valor: 400, data: '2026-11-10', recebidoNaPromessa: 600 }, tp, hoje).situacao, 'pendente', 'pagamento antigo não cumpre promessa nova')
assert.equal(M.situacaoPromessa({ id: 'p', tituloId: 'pr', valor: 400, data: '2026-10-20', recebidoNaPromessa: 600 }, tp, hoje).situacao, 'descumprida')
assert.equal(M.situacaoPromessa({ id: 'p', tituloId: 'pr', valor: 400, data: '2026-10-20', recebidoNaPromessa: 500 }, tp, hoje).situacao, 'parcialmente_cumprida')
assert.equal(M.situacaoPromessa({ id: 'p', tituloId: 'pr', valor: 400, data: '2026-10-20', recebidoNaPromessa: 500 }, tp, hoje).falta, 300)
assert.equal(M.situacaoPromessa({ id: 'p', tituloId: 'pr', valor: 400, data: '2026-11-20', recebidoNaPromessa: 600, status: 'confirmado' }, tp, hoje).situacao, 'confirmada')
assert.equal(M.situacaoPromessa({ id: 'p', tituloId: 'pr', valor: 400, data: '2026-10-20', recebidoNaPromessa: 600, status: 'cancelado' }, tp, hoje).situacao, 'cancelada', 'cancelada não vira descumprida')
assert.equal(M.situacaoPromessa({ id: 'p', tituloId: 'pr', valor: 1050, data: '2026-10-20', recebidoNaPromessa: 0 }, t('pr', '2026-10-01', 1000, 1000), hoje).situacao, 'cumprida', 'acordo com juros: conta quitada cumpre a promessa')
assert.equal(M.situacaoPromessa({ id: 'p', tituloId: 'pr', valor: 400, data: '2026-10-20', recebidoNaPromessa: 0 }, t('pr', '2026-10-01', 1000, 0, { status: 'cancelado' }), hoje).situacao, 'descumprida', 'conta cancelada não cumpre promessa')
const pl = M.placarPromessas([{ id: 'a', tituloId: 'pr', valor: 400, data: '2026-10-20', recebidoNaPromessa: 600 }, { id: 'b', tituloId: 'pr', valor: 400, data: '2026-11-20', recebidoNaPromessa: 600, renegociadaDe: 'a' }], [tp], hoje)
assert.equal(pl.descumpridas, 0, 'promessa renegociada não conta como descumprida'); assert.equal(pl.pendentes, 1); assert.equal(pl.renegociadas, 1)

// ── DNA: cliente que pagava em 30 dias e passou a pagar em 48 ──
const { somarDiasISO } = await import('../lib/datas')
const hist: T[] = []
// antes: emite, vence em 30 e paga em 30 dias; últimos 6 meses: vence em 30 e paga em 48
for (let i = 0; i < 6; i++) { const em = somarDiasISO('2025-01-05', i * 30); hist.push(t(`h${i}`, somarDiasISO(em, 30), 100, 100, { emissao: em, quitacao: somarDiasISO(em, 30) })) }
for (let i = 0; i < 4; i++) { const em = somarDiasISO('2026-06-01', i * 30); hist.push(t(`r${i}`, somarDiasISO(em, 30), 100, 100, { emissao: em, quitacao: somarDiasISO(em, 48) })) }
const dna = M.dnaFinanceiro(hist, [], hoje)
assert.equal(dna.suficiente, true); assert.equal(dna.tendencia, 'piora', 'prazo 30 → 48 dias detectado')
assert.ok(dna.conclusoes.some((c) => c.tipo === 'inferencia'), 'tendência é inferência, não fato')
assert.equal(dna.amostraAnterior, 6); assert.equal(dna.amostraRecente, 4, 'quantos pagamentos sustentam cada janela')
const lt = M.linhaDoTempo(hist)
assert.equal(lt.length, 10); assert.deepEqual([lt[0].dias, lt[9].dias], [0, 18], 'linha do tempo: em dia antes, 18 dias de atraso depois')
assert.ok(lt.every((x, k) => k === 0 || x.data >= lt[k - 1].data), 'ordem da quitação')
assert.equal(M.linhaDoTempo(hist, 3).length, 3, 'só os últimos N')
const curto = M.dnaFinanceiro(hist.slice(0, 2), [], hoje)
assert.equal(curto.suficiente, false); assert.equal(curto.tendencia, 'indefinida', 'sem base, sem conclusão categórica')
const semHist = M.riscoRecuperacao(t('sh', '2026-10-01', 100), curto, hoje)
assert.equal(semHist.score, null, 'histórico insuficiente: sem score inventado'); assert.ok(semHist.aviso?.includes('insuficiente')); assert.equal(semHist.versao, M.VERSAO_METODOLOGIA)
assert.equal(M.dnaFinanceiro([t('pp', '2026-10-01', 1000, 300)], [], hoje).pagamentosParciais, 1, 'pagamento parcial entra no DNA')

// ── scores 0–1000 com fatores; risco ≠ prioridade ──
const venc = t('v1', '2026-07-01', 5000)
const r1 = M.riscoRecuperacao(venc, dna, hoje)
assert.ok(r1.score! >= 0 && r1.score! <= 1000 && r1.fatores.length >= 3)
const rDisp = M.riscoRecuperacao(venc, dna, hoje, { tituloId: 'v1', disputaStatus: 'aberta', disputaValor: 100 })
assert.ok(rDisp.score! > r1.score!, 'disputa aumenta risco')
assert.ok(M.riscoRecuperacao(venc, dna, hoje, { tituloId: 'v1', causa: 'insolvencia' }).score! > r1.score!, 'insolvência informada aumenta risco')
const pA = M.prioridadeCobranca(venc, 450, hoje, { maiorSaldo: 5000 }).score!, pB = M.prioridadeCobranca(venc, 950, hoje, { maiorSaldo: 5000 }).score!
assert.ok(pA > pB, 'risco extremo não é a maior prioridade de cobrança')
assert.ok(M.prioridadeCobranca(venc, 450, hoje, { maiorSaldo: 5000, promessaDescumprida: true }).score! > pA, 'promessa descumprida sobe a prioridade')
const fornCrit = M.prioridadeFornecedor({ ...pagar, valor: 100, quitado: 0 }, hoje, { caixaDisponivel: 1e6, totalVencidoPagar: 1 }, { tituloId: 'p1', criticidade: 'critica', riscoInterrupcao: true })
const fornGrande = M.prioridadeFornecedor({ ...pagar, valor: 90000, quitado: 0, vencimento: '2026-06-01' }, hoje, { caixaDisponivel: 1e6, totalVencidoPagar: 1 }, { tituloId: 'p1', criticidade: 'baixa' })
assert.ok(fornCrit.score! > fornGrande.score!, 'fornecedor crítico vem antes do maior/mais antigo')
const fornProd = M.prioridadeFornecedor({ ...pagar, valor: 100, quitado: 0 }, hoje, { caixaDisponivel: 1e6, totalVencidoPagar: 1 }, { tituloId: 'p1', impactoProducao: true, impactoVendas: true, dependencia: 'alto' })
const fornComum = M.prioridadeFornecedor({ ...pagar, valor: 100, quitado: 0 }, hoje, { caixaDisponivel: 1e6, totalVencidoPagar: 1 }, { tituloId: 'p1' })
assert.ok(fornProd.score! > fornComum.score!, 'impacto em produção/vendas e dependência pesam')

// ── negociação: concessão exige aprovação; números fecham ──
const n1 = M.simularNegociacao(1000, { tipo: 'entrada_parcelas', entradaPct: 20, parcelas: 3, intervaloDias: 30 }, { custoCapitalMesPct: 2, probabilidadeBase: 0.5 })
assert.equal(n1.parcelas.reduce((s, p) => s + p.valor, 0), 1000, 'parcelas somam o total sem perder centavo')
assert.equal(n1.precisaAprovacao, true); assert.ok(n1.valorPresente < 1000); assert.equal(n1.simulacao, true)
const n2 = M.simularNegociacao(1000, { tipo: 'integral' }, { custoCapitalMesPct: 2, probabilidadeBase: 0.5 })
assert.equal(n2.precisaAprovacao, false); assert.equal(n2.totalNegociado, 1000)
assert.equal(M.simularNegociacao(1000, { tipo: 'desconto', descontoPct: 10 }, { custoCapitalMesPct: 0, probabilidadeBase: 0.5 }).desconto, 100)
const nEnc = M.simularNegociacao(1000, { tipo: 'integral' }, { custoCapitalMesPct: 0, probabilidadeBase: 1, encargos: 50 })
assert.equal(nEnc.devido, 1050, 'encargos entram no devido'); assert.equal(nEnc.precisaAprovacao, false)
const nDisp = M.simularNegociacao(1000, { tipo: 'integral', dispensarEncargos: true }, { custoCapitalMesPct: 0, probabilidadeBase: 1, encargos: 50 })
assert.equal(nDisp.devido, 1000); assert.equal(nDisp.precisaAprovacao, true, 'dispensar encargos é concessão: exige aprovação')
const nParc = M.simularNegociacao(1000, { tipo: 'parcial', valorParcial: 400 }, { custoCapitalMesPct: 0, probabilidadeBase: 1 })
assert.equal(nParc.totalNegociado, 400); assert.equal(nParc.restanteEmAberto, 600, 'parcial deixa o resto em aberto')
assert.ok(n1.custoOportunidade > 0 && n1.valorLiquidoRecuperavel < n1.valorPresente)
assert.equal(M.simularNegociacao(1000, { tipo: 'entrada_parcelas', parcelas: 3 }, { custoCapitalMesPct: 0, probabilidadeBase: 0 }).parcelas.reduce((s, p) => s + p.valor, 0), 1000, '1000/3 sem sobra de centavo')

const ctxN = { custoCapitalMesPct: 1, probabilidadeBase: 0.4, encargos: 50 }
const alts = [M.simularNegociacao(1000, { tipo: 'integral' }, ctxN), M.simularNegociacao(1000, { tipo: 'entrada_parcelas', entradaPct: 30, parcelas: 3 }, ctxN), M.simularNegociacao(1000, { tipo: 'desconto', descontoPct: 10 }, ctxN)]
const rec = M.recomendarNegociacao(alts)!
assert.equal(rec.indice, alts.reduce((b, x, k) => (x.valorLiquidoRecuperavel > alts[b].valorLiquidoRecuperavel ? k : b), 0), 'recomenda a maior recuperação esperada')
assert.equal(M.recomendarNegociacao([M.simularNegociacao(1000, { tipo: 'desconto', descontoPct: 0.001 }, { custoCapitalMesPct: 0, probabilidadeBase: 1 }), M.simularNegociacao(1000, { tipo: 'integral' }, { custoCapitalMesPct: 0, probabilidadeBase: 1 })])!.indice, 1, 'empate: prefere a que não exige concessão')
assert.equal(M.recomendarNegociacao([]), null)

// ── previsão e precisão ──
const prev = M.previsaoRecuperacao([{ titulo: t('q1', '2026-10-01', 1000), risco: 200 }, { titulo: t('q2', '2026-10-01', 1000), risco: 200, caso: { tituloId: 'q2', disputaStatus: 'aberta', disputaValor: 1000 } }], hoje)
const vs = prev.horizontes.map((h) => h.valor)
assert.ok(vs.every((v, i) => i === 0 || v >= vs[i - 1]), 'previsão cresce com o horizonte')
assert.ok(vs[4] <= 800, 'contestado fica fora e nada passa da probabilidade')
assert.equal(prev.ehCaixa, false); assert.equal(prev.saldoBase, 2000)
const prev2 = M.previsaoRecuperacao([{ titulo: t('s1', '2026-10-01', 500), risco: null }, { titulo: t('s2', '2026-10-01', 300), risco: 100, prometido: 200, emNegociacao: true }], hoje)
assert.equal(prev2.composicao.semPrevisaoConfiavel, 500, 'sem histórico fica fora da previsão'); assert.equal(prev2.composicao.prometido, 200)
assert.equal(prev2.composicao.emNegociacao, 300); assert.ok(prev2.horizontes[4].valor <= 300)
assert.equal(M.previsaoRecuperacao([{ titulo: t('s3', '2026-10-01', 500), risco: null }], hoje).confianca, 'sem_dados')
const pr = M.precisaoPrevisao(500, { q1: 1000, q2: 1000, sumiu: 300 }, new Map([['q1', 600], ['q2', 1000]]))
assert.equal(pr.realizado, 400, 'realizado = queda do saldo; título que sumiu não conta'); assert.equal(pr.acertoPct, 80)

// ── simulador e impacto na tesouraria ──
const base = { caixaDisponivel: 10000, reservaMinima: 5000, vencidoReceber: 20000, vencidoPagar: 8000, pagarCritico: 3000, aPagarNoPrazo: 12000, aReceberNoPrazo: 4000, capitalDeGiro: 30000 }
const s70 = M.simularRecuperacao(base, 70, 30)
assert.equal(s70.recuperado, 14000); assert.equal(s70.aindaVencido, 6000); assert.equal(s70.caixaProjetado, 8000); assert.equal(s70.abaixoDaReserva, false)
assert.equal(s70.simulacao, true); assert.equal(s70.capitalDeGiro, 30000)
assert.throws(() => M.simularRecuperacao(base, 120, 30))
assert.equal(M.simularRecuperacao(base, 0, 30).caixaProjetado, -6000)
assert.equal(M.impactoFinanceiro(base, 0).riscoRuptura, 'alto')

// ── orquestrador ──
const acao = (caso?: Parameters<typeof M.proximaAcao>[0]['caso'], extra: Partial<Parameters<typeof M.proximaAcao>[0]> = {}) => M.proximaAcao({ titulo: venc, hoje, risco: 500, dna, caso, ...extra }).acao
assert.equal(acao({ tituloId: 'v1', disputaStatus: 'aberta', disputaValor: 10 }), 'resolver_divergencia')
assert.equal(acao({ tituloId: 'v1', causa: 'nota_fiscal' }), 'solicitar_documentacao')
assert.equal(acao(undefined, { promessa: 'pendente' }), 'acompanhar')
assert.equal(acao(undefined, { risco: 900 }), 'analise_especializada')
assert.equal(acao({ tituloId: 'v1', causa: 'entrega' }), 'encaminhar_operacao', 'problema de entrega → operação')
assert.equal(acao({ tituloId: 'v1', causa: 'liquidez' }), 'propor_negociacao', 'falta de caixa → negociação')
assert.equal(acao({ tituloId: 'v1', causa: 'documental' }), 'solicitar_documentacao')
assert.equal(acao({ tituloId: 'v1', causa: 'insolvencia' }), 'analise_especializada')
assert.equal(acao(undefined, { promessa: 'descumprida', risco: 800 }), 'escalonar_cobranca')
assert.equal(acao(undefined, { risco: null }), 'criar_promessa', 'sem score segue pelas demais regras (pagador piorando)')
assert.equal(M.proximaAcao({ titulo: { ...pagar }, hoje, risco: 0, dna, caixaDisponivel: 10, caso: { tituloId: 'p1', criticidade: 'critica' } }).acao, 'negociar_prazo_fornecedor')

// ── a vencer, cancelamento, liquidação, jurisdição ──
const agv = M.aging([t('av', '2026-12-01', 700), t('lq', '2026-10-01', 100, 100), t('cc', '2026-10-01', 100, 0, { status: 'cancelado' }), t('ve', '2026-10-01', 250, 0, { taxaMultaPct: 2 })], hoje)
assert.equal(agv.aVencer.saldo, 700, 'faixa a vencer'); assert.equal(agv.total, 250, 'liquidado e cancelado nunca aparecem como vencidos')
assert.equal(agv.qtdVencidos, 1); assert.equal(agv.faixas[3].encargos, 5, 'encargos por faixa')
assert.throws(() => M.encargos(t('jj', '2026-10-01', 10), hoje, { jurisdicao: 'US' as 'BR' }), /jurisdição/)
assert.equal(M.sugerirCausa('cliente esqueceu de pagar').causa, 'esquecimento')
assert.equal(M.sugerirCausa('empresa entrou em recuperação judicial').causa, 'insolvencia')

// ── alertas ──
const al = M.alertasVencidos({ hoje, migracao: { entraramNoVencido: 0, mudaramParaFaixaPior: 0, qtdMudaramParaFaixaPior: 0, indiceDeterioracaoPct: 40 }, impacto: M.impactoFinanceiro(base, 0),
  itens: [{ titulo: venc, dna, promessa: 'descumprida' }, { titulo: { ...pagar }, dna: curto, promessa: null, caso: { tituloId: 'p1', criticidade: 'critica' } }, { titulo: t('dp', '2026-10-01', 10), dna: curto, promessa: null, caso: { tituloId: 'dp', disputaStatus: 'aberta' }, disputaPrazo: '2026-10-15' }] })
for (const tipo of ['promessa_descumprida', 'deterioracao', 'fornecedor_essencial', 'disputa_prazo', 'migracao_faixa', 'ruptura_caixa']) assert.ok(al.some((x) => x.tipo === tipo), `alerta ${tipo}`)

// ── determinismo (concorrência: duas leituras iguais dão o mesmo resultado) ──
assert.deepEqual(M.aging([venc, ...hist], hoje), M.aging([...hist, venc], hoje))
assert.equal(M.sugerirCausa('cliente diz que a NF-e veio errada').causa, 'nota_fiscal')
assert.equal(M.sugerirCausa('x', { tituloId: 'a', causa: 'entrega', causaConfirmada: true }).tipo, 'fato')

// ── unificação: telas antigas usam o motor (sem regra duplicada) ──
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { agingCarteiraRecebiveis } = await import('../lib/clienteIntelHelpers')
const { detectarMudancaComportamento } = await import('../lib/cobrancaHelpers')
const { hojeISO } = await import('../lib/datas')
const h = hojeISO()
const cr = (id: string, dias: number, valor: number, status = 'pendente', recebido = 0) => ({ id, descricao: id, valor, valor_recebido: recebido, data_vencimento: somarDiasISO(h, -dias), status, user_id: 'u', created_at: h, empresa_id: E })
const ag2 = agingCarteiraRecebiveis([cr('a', 10, 100), cr('b', 45, 200), cr('cancelada', 20, 999, 'cancelado'), cr('c', 120, 50, 'pendente', 20)])
assert.deepEqual(ag2.map((f) => f.valor), [100, 200, 0, 30], 'cancelada fora; parcial pelo saldo')
// atraso de 2 → 40 dias: a regra antiga não avisava (só piora abaixo de 25 dias)
const contasSnap = [
  ...[400, 370, 340, 300].map((d, i) => ({ ...cr(`ant${i}`, d, 100, 'recebido', 100), data_recebimento: somarDiasISO(h, -d + 2) })),
  ...[150, 120, 90].map((d, i) => ({ ...cr(`rec${i}`, d, 100, 'recebido', 100), data_recebimento: somarDiasISO(h, -d + 40) })),
]
const sinal = detectarMudancaComportamento({ contas: contasSnap } as never)
assert.equal(sinal?.tipo, 'piora', 'piora grave agora é detectada')

assert.equal(M.estaVencido(t('sd', '', 100), hoje), false, 'conta sem data de vencimento não é vencida')
assert.equal(M.recuperadoNoPeriodo([t('rp1', '2026-10-01', 100, 100, { quitacao: '2026-10-10' }), t('rp2', '2026-10-20', 50, 50, { quitacao: '2026-10-15' }), t('rp3', '2026-09-01', 70, 70, { quitacao: '2026-09-20' })], '2026-10-01', '2026-10-31'), 100, 'só o pago depois do vencimento, dentro do período')

// ── painel geral (filtros e números) ──
const P = await import('../lib/vencidos/painel')
const item = (tt: T, extra: Record<string, unknown> = {}) => ({ titulo: tt, saldo: M.saldoDoTitulo(tt, hoje), disputa: M.separarDisputa(M.saldoDoTitulo(tt, hoje), null), encargos: M.encargos(tt, hoje), dna: curto, risco: { score: 500, fatores: [], dadosSuficientes: true, aviso: null, versao: 'x' }, prioridade: { score: 1, fatores: [], dadosSuficientes: true, aviso: null, versao: 'x' }, acao: { acao: 'acompanhar', justificativa: '', consideracoes: [] }, promessa: null, promessaFalta: 0, emNegociacao: false, causaSugerida: { causa: 'desconhecido', tipo: 'inferencia', motivo: '' }, caso: null, ...extra }) as never
const ta = t('pa', '2026-10-20', 1000, 0, { contraparteNome: 'Mercado Alfa', descricao: 'NF 10' }), tb = t('pb', '2026-07-01', 400, 0, { contraparteNome: 'Loja Beta' })
const analise = { hoje, limites: M.FAIXAS_PADRAO, receber: [item(ta, { promessa: 'pendente', promessaFalta: 300 }), item(tb, { risco: { score: null } })], pagar: [], titulosReceber: [ta, tb, t('pc', '2026-09-01', 200, 200, { quitacao: '2026-11-01', contraparteNome: 'Mercado Alfa' })], titulosPagar: [], legais: {} } as never
const todos = P.resumoPainel(analise, P.filtrosIniciais('2026-11-01', '2026-11-30'))
assert.equal(todos.totalReceber, 1400); assert.equal(todos.recuperado, 200); assert.equal(todos.taxaRecuperacao, 12.5)
assert.equal(todos.valorEmRisco, 500, 'risco 500/1000 sobre 1000'); assert.equal(todos.semScore, 400); assert.equal(todos.promessasPendentes, 1)
const alfa = P.resumoPainel(analise, { ...P.filtrosIniciais('2026-11-01', '2026-11-30'), busca: 'mercado alfa' })
assert.equal(alfa.totalReceber, 1000, 'busca por cliente, sem acento/maiúscula'); assert.equal(alfa.recuperado, 200)
assert.equal(P.resumoPainel(analise, { ...P.filtrosIniciais('2026-11-01', '2026-11-30'), situacao: 'promessa' }).receber.length, 1)
assert.equal(P.resumoPainel(analise, { ...P.filtrosIniciais('2026-11-01', '2026-11-30'), faixa: M.faixaDe(124, M.FAIXAS_PADRAO) }).totalReceber, 400, 'filtro de faixa')

// ── mensagens de cobrança (dado real, nada inventado; envio sempre pela pessoa) ──
const MSG = await import('../lib/vencidos/mensagens')
const dm = { cliente: 'Loja Beta', empresa: 'Distribuidora Horizonte', descricao: 'NF 10', valor: 'R$ 400,00', vencimento: '01/07/2026', dias: 124 }
for (const tipo of MSG.TIPOS_MENSAGEM) for (const lg of ['pt', 'en', 'es'] as const) {
  const m = MSG.montarMensagem(tipo, lg, dm)
  assert.ok(m.texto.includes('Loja Beta') && m.texto.includes('Distribuidora Horizonte'), `${tipo}/${lg} usa nomes reais`)
  assert.ok(!/undefined|null|NaN/.test(m.texto + m.assunto), `${tipo}/${lg} sem buraco`)
}
assert.ok(MSG.montarMensagem('cobranca_cordial', 'pt', dm).texto.includes('124 dias'))
assert.ok(!MSG.montarMensagem('confirmacao_promessa', 'pt', dm).texto.includes(' até '), 'sem data de promessa, não inventa')
assert.equal(MSG.modeloSugerido(0, false), 'lembrete'); assert.equal(MSG.modeloSugerido(45, false), 'negociacao'); assert.equal(MSG.modeloSugerido(45, true), 'confirmacao_promessa')
assert.equal(MSG.linkWhatsapp('(15) 99876-5432', 'oi'), 'https://wa.me/5515998765432?text=oi')
assert.equal(MSG.linkWhatsapp('123', 'oi'), null, 'telefone incompleto não gera link')
assert.equal(MSG.linkEmail('sem-arroba', 'a', 'b'), null)

console.log('check-vencidos: tudo certo ✔')
