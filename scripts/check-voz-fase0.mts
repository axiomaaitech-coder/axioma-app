// Voice Intelligence — Fase 0: testes das correções de base (sem IA, sem rede, sem banco real).
// Rodar: npx tsx scripts/check-voz-fase0.mts
// O banco é um falso em memória que aplica os mesmos filtros que o código manda (eq, gte, lte, or).
import assert from 'node:assert/strict'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { podeUsarIAFinanceira, contarSemFonteServidor, conferirNumeros } = await import('../lib/ia/motor')
const { executarFerramenta, umAnoAntes, mesesAte } = await import('../lib/ia/ferramentas')
const { filtroVigente } = await import('../lib/custoFixoVigente')
const { montarRetrato } = await import('../lib/ia/retratoEmpresa')
const { hojeISO } = await import('../lib/datas')

// ─── Banco falso ───
type Linha = Record<string, unknown>
type Tabela = { rows: Linha[]; error?: { message: string } }
// Avalia o filtro "or" do PostgREST usado por filtroVigente: grupos and(col.op.valor, ...)
function avaliarOr(filtro: string, r: Linha): boolean {
  return [...filtro.matchAll(/and\(([^)]*)\)/g)].some(([, dentro]) => dentro.split(',').every((cond) => {
    const [col, op, ...resto] = cond.split('.'); const v = resto.join('.'); const x = r[col]
    if (op === 'is' && v === 'null') return x == null
    if (op === 'gte') return x != null && String(x) >= v
    if (op === 'lte') return x != null && String(x) <= v
    throw new Error(`operador não previsto no teste: ${op}`)
  }))
}
function bancoFalso(tabelas: Record<string, Tabela>) {
  const chamadas: string[] = []
  class Q {
    f: ((r: Linha) => boolean)[] = []; unico = false
    constructor(public t: string) {}
    select() { return this }
    eq(c: string, v: unknown) { this.f.push((r) => r[c] === undefined || r[c] === v); return this }
    gte(c: string, v: string) { this.f.push((r) => r[c] == null || String(r[c]) >= v); return this }
    lte(c: string, v: string) { this.f.push((r) => r[c] == null || String(r[c]) <= v); return this }
    or(s: string) { chamadas.push(`${this.t}.or`); this.f.push((r) => avaliarOr(s, r)); return this }
    in() { return this } order() { return this } limit() { return this } range() { return this }
    maybeSingle() { this.unico = true; return this }
    then<A, B>(ok: (v: { data: unknown; error: unknown }) => A, erro?: (e: unknown) => B) {
      const tb = tabelas[this.t] ?? { rows: [] }
      const res = tb.error ? { data: null, error: tb.error } : (() => { const d = tb.rows.filter((r) => this.f.every((f) => f(r))); return { data: this.unico ? d[0] ?? null : d, error: null } })()
      return Promise.resolve(res).then(ok, erro)
    }
  }
  return { db: { from: (t: string) => new Q(t), rpc: async () => ({ data: null, error: null }) } as never, chamadas }
}

// ─── B · Papel: mesma regra da RLS (todo membro menos operador) ───
for (const p of ['dono', 'admin', 'financeiro', 'contabil', 'leitor', null, undefined]) assert.equal(podeUsarIAFinanceira(p), true, `papel ${p}`)
assert.equal(podeUsarIAFinanceira('operador'), false)
console.log('OK — papel: operador barrado; dono/admin/financeiro/contabil/leitor e dono sem linha liberados')

// ─── C · Ferramenta custos: só vigentes hoje (vigente, encerrado, futuro, limites, ausente) ───
const HOJE = hojeISO(new Date(), 'America/Sao_Paulo')
const ontem = (() => { const d = new Date(`${HOJE}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10) })()
const amanha = (() => { const d = new Date(`${HOJE}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10) })()
const custos: Linha[] = [
  { descricao: 'Aluguel (sem datas)', valor_mensal: 3000, data_inicio: null, data_fim: null },
  { descricao: 'Contador (encerrado ontem)', valor_mensal: 800, data_inicio: '2025-01-01', data_fim: ontem },
  { descricao: 'Software (começa amanhã)', valor_mensal: 500, data_inicio: amanha, data_fim: null },
  { descricao: 'Internet (termina hoje)', valor_mensal: 200, data_inicio: null, data_fim: HOJE },
  { descricao: 'Seguro (começa hoje)', valor_mensal: 150, data_inicio: HOJE, data_fim: null },
]
const { db: dbCustos, chamadas } = bancoFalso({ custos_fixos: { rows: custos } })
const fixos = JSON.parse(await executarFerramenta(dbCustos, 'emp-1', 'custos', { tipo: 'fixos', limite: 30 }))
assert.deepEqual(fixos.itens.map((i: Linha) => i.descricao).sort(), ['Aluguel (sem datas)', 'Internet (termina hoje)', 'Seguro (começa hoje)'])
assert.ok(chamadas.includes('custos_fixos.or'), 'ferramenta precisa aplicar o filtro de vigência')
const { db: dbVazio } = bancoFalso({ custos_fixos: { rows: [] } })
assert.deepEqual(JSON.parse(await executarFerramenta(dbVazio, 'emp-1', 'custos', { tipo: 'fixos', limite: 5 })).itens, [])
// Leitura que falha não vira lista vazia calada: devolve erro explícito
const { db: dbErro } = bancoFalso({ custos_fixos: { rows: [], error: { message: 'timeout' } } })
const r = JSON.parse(await executarFerramenta(dbErro, 'emp-1', 'custos', { tipo: 'fixos', limite: 5 }))
assert.ok(typeof r.erro === 'string' && r.erro.includes('não foi possível consultar'), 'falha de leitura precisa virar erro, não lista vazia')
const { db: dbErroCp } = bancoFalso({ contas_pagar: { rows: [], error: { message: 'timeout' } } })
assert.ok(JSON.parse(await executarFerramenta(dbErroCp, 'emp-1', 'contas_a_pagar', { situacao: 'todas_abertas', limite: 5 })).erro)
// Regra de vigência pura, limites inclusivos
const viva = (c: Linha, dia: string) => avaliarOr(filtroVigente(dia), c)
assert.equal(viva({ data_inicio: null, data_fim: '2026-01-31' }, '2026-01-31'), true)
assert.equal(viva({ data_inicio: null, data_fim: '2026-01-31' }, '2026-02-01'), false)
assert.equal(viva({ data_inicio: '2026-02-01', data_fim: null }, '2026-01-31'), false)
assert.equal(viva({ data_inicio: '2026-02-01', data_fim: null }, '2026-02-01'), true)
console.log('OK — custos fixos: vigente, encerrado, futuro, fim/início no próprio dia, ausente e falha')

// ─── D · Datas: mês/ano sem UTC ───
assert.equal(umAnoAntes('2026-03-15'), '2025-03-15')
assert.equal(umAnoAntes('2028-02-29'), '2027-02-28')
assert.equal(umAnoAntes('2026-01-01'), '2025-01-01')
assert.deepEqual(mesesAte('2026-01-31', 3), ['2025-11', '2025-12', '2026-01'])
assert.deepEqual(mesesAte('2026-12-01', 1), ['2026-12'])
assert.equal(mesesAte('2026-10-15', 24)[0], '2024-11')
// 31/01 às 23h30 em Brasília = 01/02 02h30 UTC: o "hoje" da empresa continua 31/01
const virada = new Date('2026-02-01T02:30:00Z')
assert.equal(hojeISO(virada, 'America/Sao_Paulo'), '2026-01-31')
assert.equal(virada.toISOString().slice(0, 10), '2026-02-01') // o jeito antigo errava o mês
console.log('OK — datas: ano anterior (29/02), meses na virada do ano e fuso na meia-noite')

// ─── E · Números verificados só pelo servidor ───
const servidor = 'Caixa realizado até hoje R$ 41.140 · A pagar R$ 12.300'
const resposta = 'Fato: o caixa é R$ 41.140. Fato: a tela mostra R$ 7.777. Fato: sobra R$ 99.999.'
const baseComTela = `${servidor}\nCONTEXTO DA TELA: R$ 7.777`
const inventados = conferirNumeros(resposta, baseComTela) // só o 99.999 não existe em lugar nenhum
assert.deepEqual(inventados, ['R$ 99.999'])
assert.equal(contarSemFonteServidor(resposta, servidor, inventados.length), 1) // o 7.777 só veio do navegador
assert.equal(contarSemFonteServidor('Fato: o caixa é R$ 41.140.', servidor, 0), 0)
console.log('OK — conferência: valor só da tela/histórico não conta como confirmado pelo servidor')

// ─── D · Retrato: leitura que falhou é dita (≠ zero), lucro é média e caixa não é "livre" ───
const { db: dbRetrato } = bancoFalso({
  empresas: { rows: [{ id: 'emp-1', nome_fantasia: 'Teste', regime_tributario: 'simples', uf: 'SP', cidade: 'São Paulo' }] },
  receitas: { rows: [], error: { message: 'canceling statement due to statement timeout' } },
})
const ret = await montarRetrato(dbRetrato, 'emp-1')
assert.deepEqual(ret.leiturasFalhas, ['receitas'])
assert.ok(ret.texto.includes('LEITURAS QUE FALHARAM AGORA') && ret.texto.includes('receitas'))
assert.ok(ret.texto.includes('Lucro médio') && ret.texto.includes('não desconta contas a pagar'))
const { db: dbOk } = bancoFalso({ empresas: { rows: [{ id: 'emp-1', nome_fantasia: 'Teste', uf: 'SP' }] } })
const ret2 = await montarRetrato(dbOk, 'emp-1')
assert.deepEqual(ret2.leiturasFalhas, [])
assert.ok(!ret2.texto.includes('LEITURAS QUE FALHARAM'))
// Empresa sem acesso (RLS não devolve a linha) → erro que a rota transforma em 404
const { db: dbSemAcesso } = bancoFalso({ empresas: { rows: [] } })
await assert.rejects(() => montarRetrato(dbSemAcesso, 'emp-1'), /empresa não encontrada/)
console.log('OK — retrato: falha de leitura avisada, sem dado ≠ falha, empresa sem vínculo recusada')

// ─── Datas do sistema todo (lib/datas): dia local, soma de dias e de meses ───
const { isoDia, somarDiasISO, somarMesesISO } = await import('../lib/datas')
assert.equal(isoDia(new Date(2026, 0, 1)), '2026-01-01') // dia 1º continua dia 1º em qualquer fuso
assert.equal(isoDia(new Date(2026, 1, 0)), '2026-01-31')
assert.equal(somarDiasISO('2026-12-31', 1), '2027-01-01')
assert.equal(somarDiasISO('2026-03-01', -1), '2026-02-28')
assert.equal(somarDiasISO('2028-02-28', 1), '2028-02-29')
assert.equal(somarMesesISO('2026-01-31', 1), '2026-02-28') // antes: 03/03
assert.equal(somarMesesISO('2028-01-31', 1), '2028-02-29')
assert.equal(somarMesesISO('2026-01-31', 2), '2026-03-31')
assert.equal(somarMesesISO('2026-11-15', 3), '2027-02-15')
assert.equal(somarMesesISO('2026-05-10', -12), '2025-05-10')
console.log('OK — datas do sistema: dia local, virada de ano, bissexto e parcela no fim do mês')
