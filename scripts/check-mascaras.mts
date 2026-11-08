// Máscaras de digitação (CPF, CNPJ, CEP, telefone) e lista de documentos/exames da admissão.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const M = await import('../lib/enderecoHelpers')
const D = await import('../lib/rhDocumentos')

assert.equal(M.mascaraCPF('5299'), '529.9'); assert.equal(M.mascaraCPF('5299822'), '529.982.2')
assert.equal(M.mascaraCPF('52998224725'), '529.982.247-25'); assert.equal(M.mascaraCPF('529.982.247-25999'), '529.982.247-25', 'colado com sobra: corta em 11')
assert.equal(M.mascaraCNPJ('11222333000181'), '11.222.333/0001-81'); assert.equal(M.mascaraCNPJ('112223'), '11.222.3')
assert.equal(M.mascaraCEP('01310'), '01310'); assert.equal(M.mascaraCEP('01310100'), '01310-100')
assert.equal(M.mascaraTelefone('11'), '(11'); assert.equal(M.mascaraTelefone('1198765'), '(11) 9876-5')
assert.equal(M.mascaraTelefone('1132345678'), '(11) 3234-5678'); assert.equal(M.mascaraTelefone('11987654321'), '(11) 98765-4321')
assert.equal(M.UFS.length, 27)

// documentos e exames: tipos únicos, o banco aceita exatamente os mesmos, e nada proibido vira tipo
assert.equal(new Set(D.TIPOS_ADMISSAO).size, D.TIPOS_ADMISSAO.length)
const sql = readFileSync('docs/sql/RH-8-ADMISSAO-DOCS-PAISES-SQL.sql', 'utf8')
const lista = sql.match(/tipo text not null check \(tipo in \(([^)]+)\)\)/)![1].match(/'([a-z_0-9]+)'/g)!.map((x) => x.slice(1, -1))
assert.deepEqual([...lista].sort(), [...D.TIPOS_ADMISSAO].sort(), 'tela e banco com a mesma lista de documentos/exames')
for (const t of D.TIPOS_ADMISSAO) assert.ok(!/gravid|esteril|hiv/.test(t), `tipo proibido: ${t}`)
assert.ok(D.ITENS_ADMISSAO.some((i) => i.tipo === 'aso_admissional' && i.categoria === 'exame' && i.obrigatorio))
console.log('check-mascaras ok')
