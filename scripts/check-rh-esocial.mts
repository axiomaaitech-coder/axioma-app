// Teste do S-2200: pendências e arquivo validado contra o XSD oficial (docs/esocial/xsd). Rodar: npx tsx scripts/check-rh-esocial.mts
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pendenciasS2200, gerarS2200, idEvento, inscricaoEmpregador, type DadosS2200 } from '../lib/rhEsocial'

const base: DadosS2200 = {
  empregador: { tp_insc: 1, nr_insc: '11222333' },
  colab: { nome: 'Ana Souza & Filhos <teste>', nome_social: null },
  pessoal: { cpf: '529.982.247-25', data_nascimento: '1995-03-10', sexo: 'F', raca_cor: 3, estado_civil: 1, grau_instr: '07',
    pais_nascimento: '105', pais_nacionalidade: '105', cep: '01310-100', logradouro: 'Avenida Paulista', numero: '1000', complemento: 'Sala 5',
    bairro: 'Bela Vista', uf: 'SP', cod_munic: '3550308', telefone: '(11) 99999-0000', email: 'ana@exemplo.com.br' },
  contrato: { matricula: 'HZ-001', cod_categ: '101', tp_reg_trab: 1, tp_reg_prev: 1, data_admissao: '2026-11-10', tp_contr: 2, data_termino: '2026-12-24',
    clau_assec: false, obj_det: null, tp_reg_jor: 1, nat_atividade: 1, data_base: 5, cnpj_sindicato: null, qtd_hrs_sem: 44, tp_jornada: 4, tmp_parc: 0,
    hor_noturno: false, dsc_jorn: 'Seg a sex 08:00-12:00 e 13:00-17:48', dsc_sal_var: null, data_desligamento: null },
  cargo: { nome: 'Vendedor de comércio varejista', cbo: '521110' },
  remuneracao: { und_sal_fixo: 5, valor: 2500.5 },
  estabelecimento: { tp_insc: 1, nr_insc: '11222333000181', cnpj_sindicato: '11.444.777/0001-61' },
}
const agora = new Date(Date.UTC(2026, 10, 8, 14, 30, 5))

assert.equal(inscricaoEmpregador({ tp_insc: 1, nr_insc: '11222333000181' }), '11222333', 'CNPJ vai só a raiz')
assert.equal(idEvento(base.empregador!, agora, 7), 'ID1112223330000002026110814300500007')
assert.equal(idEvento(base.empregador!, agora, 7).length, 36)
assert.deepEqual(pendenciasS2200(base), [], 'exemplo completo sem pendência')

// pendências: cada falta aponta o campo certo
const sem = (mexe: (d: DadosS2200) => void) => { const d = structuredClone(base); mexe(d); return pendenciasS2200(d).map((p) => p.campo.pt) }
assert.ok(sem((d) => { d.estabelecimento!.cnpj_sindicato = null }).some((c) => /sindicato/.test(c)))
assert.deepEqual(sem((d) => { d.estabelecimento!.cnpj_sindicato = null; d.contrato.cnpj_sindicato = '11444777000161' }), [], 'sindicato do contrato vale')
assert.ok(sem((d) => { d.pessoal!.cod_munic = null }).some((c) => /Município/.test(c)))
assert.ok(sem((d) => { d.pessoal!.raca_cor = 6 }).some((c) => /Raça/.test(c)), '"não informado" proibido desde 22/04/2024')
assert.ok(sem((d) => { d.contrato.cod_categ = '103' }).some((c) => /Categoria/.test(c)), 'aprendiz ainda não')
assert.ok(sem((d) => { d.contrato.clau_assec = null }).some((c) => /Cláusula/.test(c)))
assert.ok(sem((d) => { d.contrato.dsc_jorn = null }).some((c) => /Horário/.test(c)))
assert.ok(sem((d) => { d.contrato.hor_noturno = null }).some((c) => /noite/.test(c)))
assert.ok(sem((d) => { d.empregador = null }).some((c) => /Empregador/.test(c)))
assert.ok(sem((d) => { d.cargo = null }).some((c) => /Cargo/.test(c)))
assert.ok(sem((d) => { d.estabelecimento!.nr_insc = '11222333' }).some((c) => /CNPJ completo/.test(c)))
assert.ok(sem((d) => { d.remuneracao = { und_sal_fixo: 7, valor: 0 } }).some((c) => /variável/.test(c)))
assert.throws(() => gerarS2200({ ...base, cargo: null }, { agora, seq: 1, tpAmb: 1 }), /pendência/)

// arquivo: válido no esquema oficial, em três variações
const dir = mkdtempSync(join(tmpdir(), 's2200-'))
const valida = (d: DadosS2200, nome: string) => {
  const { xml } = gerarS2200(d, { agora, seq: 1, tpAmb: 1 })
  const f = join(dir, `${nome}.xml`); writeFileSync(f, xml, 'utf8')
  try { execFileSync('python', ['-I', 'scripts/valida-xsd.py', 'evtAdmissao.xsd', f], { encoding: 'utf8' }) }
  catch (e) { throw new Error(`${nome}: XSD recusou\n${(e as { stdout?: string }).stdout ?? e}`) }
  return xml
}
const x1 = valida(base, 'experiencia')
assert.ok(x1.includes('<nrInsc>11222333</nrInsc>') && x1.includes('<cnpjSindCategProf>11444777000161</cnpjSindCategProf>'))
assert.ok(x1.includes('Ana Souza &amp; Filhos &lt;teste&gt;'), 'caracteres especiais escapados')
assert.ok(x1.includes('<vrSalFx>2500.50</vrSalFx>') && x1.includes('<qtdHrsSem>44.00</qtdHrsSem>') && x1.includes('<clauAssec>N</clauAssec>'))
const x2 = valida({ ...base, contrato: { ...base.contrato, tp_contr: 1, data_termino: null, clau_assec: null } }, 'indeterminado')
assert.ok(!x2.includes('<dtTerm>') && !x2.includes('<clauAssec>'), 'prazo indeterminado sem término nem cláusula')
valida({ ...base, contrato: { ...base.contrato, cod_categ: '102', nat_atividade: 2 }, pessoal: { ...base.pessoal!, estado_civil: null, complemento: null, telefone: null, email: null } }, 'rural-sem-opcionais')
console.log('check-rh-esocial ok')
