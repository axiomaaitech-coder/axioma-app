// Catálogo de indicadores (Central Intelligence, Etapa 1): nenhuma informação sem dono, tela, papel e fonte. Rodar: npx tsx scripts/check-catalogo.mts
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
const { INDICADORES, PAPEIS_FINANCEIROS, indicador } = await import('../lib/financeiro/semantica')
const { resultado, falhou } = await import('../lib/financeiro/contrato')

assert.equal(new Set(INDICADORES.map((i) => i.id)).size, INDICADORES.length, 'id repetido no catálogo')

// As ferramentas que a IA realmente tem (o nome que o catálogo cita precisa existir)
const ferramentas = ['lib/ia/ferramentas.ts', 'lib/financeiro/ferramentasFinanceiras.ts', 'lib/vencidos/ferramentaIA.ts'].map((a) => readFileSync(a, 'utf8')).join('\n')

for (const i of INDICADORES) {
  assert.ok(i.definicao.length > 10, `${i.id}: sem definição`)
  assert.ok(i.modulo, `${i.id}: sem módulo dono`)
  assert.ok(i.papeis.length > 0, `${i.id}: sem papel`)
  assert.ok(!i.papeis.includes('operador'), `${i.id}: operador de caixa não vê dado financeiro (RF-IA02)`)
  if (i.rota) assert.ok(existsSync(`app/(interno)${i.rota}/page.tsx`), `${i.id}: tela ${i.rota} não existe`)
  if (i.ferramenta) assert.ok(ferramentas.includes(`name: '${i.ferramenta}'`), `${i.id}: ferramenta ${i.ferramenta} não existe`)
  if (i.indisponivel) {
    assert.equal(i.ferramenta, undefined, `${i.id}: indisponível não pode ter ferramenta`)
    assert.equal(i.fonte.length, 0, `${i.id}: indisponível não tem fonte`)
    assert.ok(i.limitacoes.length > 0, `${i.id}: precisa dizer por que está indisponível`)
  } else {
    assert.ok(i.fonte.length > 0, `${i.id}: sem fonte`)
    assert.ok(i.rota, `${i.id}: sem tela`)
  }
}

// O que o Axioma não tem é dito como "não há", nunca estimado
for (const id of ['funcionarios', 'folha', 'fornecedor_deve']) assert.equal(indicador(id)?.indisponivel, true, `${id} deveria estar indisponível`)
assert.deepEqual([...PAPEIS_FINANCEIROS].sort(), ['admin', 'contabil', 'dono', 'financeiro', 'leitor'])

// Toda resposta do contrato diz de quando é
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
const ok = resultado({ indicador: 'caixa_realizado', definicao: 'x', estado: 'verificado', unidade: 'BRL', periodo: null, criterio_data: 'hoje', fontes: ['x'], registros: 1, limitacoes: [] })
assert.match(ok.consultado_em, iso)
assert.match(falhou('caixa_realizado', 'teste').consultado_em, iso)
console.log(`check-catalogo: ${INDICADORES.length} indicadores, tudo certo ✔`)
