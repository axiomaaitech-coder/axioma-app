// RH · Estrutura: pré-preenchimento e tradução das recusas do banco.
import assert from 'node:assert/strict'
const { raizCnpj, cnaeSete, sugerirClassTrib, mesAtual, mensagemErroRh } = await import('../lib/rhEstrutura')

assert.equal(raizCnpj('11.222.333/0001-81'), '11222333')
assert.equal(raizCnpj('112223330001'), null)
assert.equal(cnaeSete('4711-3/02'), '4711302')
assert.equal(cnaeSete('47113'), null)
assert.equal(sugerirClassTrib('mei'), '04')
assert.equal(sugerirClassTrib('simples'), '01')
assert.equal(sugerirClassTrib('Lucro Presumido'), '99')
assert.equal(sugerirClassTrib(null), null)
assert.equal(mesAtual(new Date('2026-11-01T01:00:00Z')), '2026-10')   // ainda 31/10 em São Paulo
assert.equal(mesAtual(new Date('2026-11-08T15:00:00Z')), '2026-11')

const trava = { code: '23514', message: 'new row for relation "rh_empregador" violates check constraint "rh_empregador_digitos"' }
assert.match(mensagemErroRh(trava, 'pt'), /dígito verificador/)
assert.match(mensagemErroRh(trava, 'en'), /check digit/)
assert.match(mensagemErroRh({ code: '23505', message: 'duplicate key value violates unique constraint "rh_cargo_nome"' }, 'es'), /cargo con este nombre/)
assert.match(mensagemErroRh({ code: '42501', message: 'new row violates row-level security policy for table "rh_cargos"' }, 'pt'), /permissão/)
const gatilho = { code: '23514', message: 'CNPJ 11444777000161 tem outra raiz: é outra Empresa. Cadastre-a no Axioma e ligue as duas pelo grupo.' }
assert.equal(mensagemErroRh(gatilho, 'pt'), gatilho.message)
assert.match(mensagemErroRh({ code: '23514', message: 'violates check constraint "outra"' }, 'pt'), /Confira os campos/)
console.log('check-rh-estrutura ok')
